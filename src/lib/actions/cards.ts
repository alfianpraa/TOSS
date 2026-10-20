"use server";

import { revalidatePath } from "next/cache";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { ActivityType, CardStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  allowedActivityTypes,
  canChangeStatus,
  canClaimAsSales,
  canCreateCard,
  canEditCardMeta,
  canHandOffCard,
  canTakeCard,
} from "@/lib/permissions";
import { saveCardFile } from "@/lib/storage";
import { createNotification, notifyMentions } from "@/lib/notify";
import { parseDueDateInput } from "@/lib/cardMeta";

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("You must be logged in.");
  return session;
}

const createCardSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  clientName: z.string().min(2, "Client name is required"),
  clientContact: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});

// Who gets told about a lead's progress: its Sales owner, or the creator as a fallback.
function salesContactId(card: { salesOwnerId: string | null; createdById: string }) {
  return card.salesOwnerId ?? card.createdById;
}

export async function createCard(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await requireSession();
  const role = session.user.role as import("@prisma/client").Role;

  if (!canCreateCard(role)) {
    return { error: "You can't create a new card." };
  }

  const parsed = createCardSchema.safeParse({
    title: formData.get("title"),
    clientName: formData.get("clientName"),
    clientContact: formData.get("clientContact") || undefined,
    description: formData.get("description") || undefined,
    priority: formData.get("priority") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid data." };
  }

  // Sales own their own leads. Marketing/Admin may ask a Sales to take the lead,
  // who then has to accept it (same as developer assignments).
  let ownerId: string | null = null;
  let pendingSales: { id: string; name: string } | null = null;
  if (role === "SALES") {
    ownerId = session.user.id;
  } else {
    const salesId = formData.get("salesOwnerId");
    if (typeof salesId === "string" && salesId) {
      const sales = await prisma.user.findUnique({
        where: { id: salesId },
        select: { id: true, name: true, role: true },
      });
      if (!sales || sales.role !== "SALES") return { error: "Invalid Sales selected." };
      pendingSales = sales;
    } else if (role === "ADMIN") {
      ownerId = session.user.id;
    }
  }

  const card = await prisma.card.create({
    data: {
      ...parsed.data,
      dueDate: parseDueDateInput(formData.get("dueDate")),
      createdById: session.user.id,
      salesOwnerId: ownerId,
      pendingSalesId: pendingSales?.id ?? null,
      status: "NEW_LEAD",
    },
  });

  await prisma.activity.create({
    data: {
      cardId: card.id,
      authorId: session.user.id,
      type: role === "SALES" ? "SALES_UPDATE" : "NOTE",
      content:
        role === "SALES"
          ? "New lead card created."
          : `New lead captured by ${session.user.name}.${
              pendingSales
                ? ` Requested ${pendingSales.name} to take it. Awaiting acceptance.`
                : ownerId
                  ? ""
                  : " Waiting for a Sales to pick it up."
            }`,
    },
  });

  if (pendingSales) {
    await createNotification({
      userId: pendingSales.id,
      type: "LEAD_HANDOFF",
      message: `${session.user.name} wants to hand over lead "${card.title}" to you. Please accept or decline.`,
      cardId: card.id,
    });
  }

  revalidatePath("/board");
  return {};
}

export async function requestSalesHandoff(cardId: string, salesId: string) {
  const session = await requireSession();
  const role = session.user.role as import("@prisma/client").Role;

  const card = await prisma.card.findUniqueOrThrow({ where: { id: cardId } });
  if (!canHandOffCard(role, session.user.id, card)) {
    throw new Error("You can't hand over this lead.");
  }

  const sales = await prisma.user.findUnique({ where: { id: salesId } });
  if (!sales || sales.role !== "SALES") throw new Error("Invalid Sales selected.");
  if (card.salesOwnerId === sales.id) throw new Error(`${sales.name} already owns this lead.`);

  await prisma.$transaction([
    prisma.card.update({ where: { id: cardId }, data: { pendingSalesId: sales.id } }),
    prisma.activity.create({
      data: {
        cardId,
        authorId: session.user.id,
        type: "STATUS_CHANGE",
        content: `${session.user.name} requested ${sales.name} to take this lead. Awaiting acceptance.`,
      },
    }),
  ]);

  await createNotification({
    userId: sales.id,
    type: "LEAD_HANDOFF",
    message: `${session.user.name} wants to hand over lead "${card.title}" to you. Please accept or decline.`,
    cardId,
  });

  revalidatePath("/board");
  revalidatePath("/my-leads");
  revalidatePath(`/cards/${cardId}`);
}

export async function acceptSalesHandoff(cardId: string) {
  const session = await requireSession();

  const card = await prisma.card.findUniqueOrThrow({ where: { id: cardId } });
  if (card.pendingSalesId !== session.user.id) {
    throw new Error("You don't have a pending hand-over for this lead.");
  }

  await prisma.$transaction([
    prisma.card.update({
      where: { id: cardId },
      data: { salesOwnerId: session.user.id, pendingSalesId: null },
    }),
    prisma.activity.create({
      data: {
        cardId,
        authorId: session.user.id,
        type: "STATUS_CHANGE",
        content: `${session.user.name} accepted this lead as Sales.`,
      },
    }),
  ]);

  if (card.createdById !== session.user.id) {
    await createNotification({
      userId: card.createdById,
      type: "ASSIGNMENT_ACCEPTED",
      message: `${session.user.name} accepted your lead "${card.title}" as Sales.`,
      cardId,
    });
  }

  revalidatePath("/board");
  revalidatePath("/my-leads");
  revalidatePath(`/cards/${cardId}`);
}

export async function declineSalesHandoff(cardId: string) {
  const session = await requireSession();

  const card = await prisma.card.findUniqueOrThrow({ where: { id: cardId } });
  if (card.pendingSalesId !== session.user.id) {
    throw new Error("You don't have a pending hand-over for this lead.");
  }

  await prisma.$transaction([
    prisma.card.update({ where: { id: cardId }, data: { pendingSalesId: null } }),
    prisma.activity.create({
      data: {
        cardId,
        authorId: session.user.id,
        type: "STATUS_CHANGE",
        content: `${session.user.name} declined this lead as Sales.`,
      },
    }),
  ]);

  if (card.createdById !== session.user.id) {
    await createNotification({
      userId: card.createdById,
      type: "ASSIGNMENT_DECLINED",
      message: `${session.user.name} declined your lead "${card.title}" as Sales.`,
      cardId,
    });
  }

  revalidatePath("/board");
  revalidatePath("/my-leads");
  revalidatePath(`/cards/${cardId}`);
}

export async function claimSalesLead(cardId: string) {
  const session = await requireSession();
  const role = session.user.role as import("@prisma/client").Role;

  const card = await prisma.card.findUniqueOrThrow({ where: { id: cardId } });
  if (!canClaimAsSales(role, card)) {
    throw new Error("This lead can't be claimed.");
  }

  // updateMany guards against two Sales claiming at the same moment.
  const { count } = await prisma.card.updateMany({
    where: { id: cardId, salesOwnerId: null, pendingSalesId: null },
    data: { salesOwnerId: session.user.id },
  });
  if (count === 0) throw new Error("This lead was just picked up by another Sales.");

  await prisma.activity.create({
    data: {
      cardId,
      authorId: session.user.id,
      type: "STATUS_CHANGE",
      content: `${session.user.name} picked up this lead as Sales.`,
    },
  });

  if (salesContactId(card) !== session.user.id) {
    await createNotification({
      userId: salesContactId(card),
      type: "LEAD_CLAIMED",
      message: `${session.user.name} picked up your lead "${card.title}".`,
      cardId,
    });
  }

  revalidatePath("/board");
  revalidatePath("/my-leads");
  revalidatePath(`/cards/${cardId}`);
}

export async function takeCard(cardId: string) {
  const session = await requireSession();
  const role = session.user.role as import("@prisma/client").Role;

  if (!canTakeCard(role)) {
    throw new Error("Only Developer/Admin can claim a lead.");
  }

  const card = await prisma.card.findUniqueOrThrow({ where: { id: cardId } });
  if (card.assignedDeveloperId) {
    throw new Error("This lead has already been claimed by another developer.");
  }
  if (!card.salesOwnerId) {
    throw new Error("A Sales must pick up this lead before a developer can claim it.");
  }

  await prisma.$transaction([
    prisma.card.update({
      where: { id: cardId },
      data: {
        assignedDeveloperId: session.user.id,
        status: "IN_PROGRESS",
      },
    }),
    prisma.activity.create({
      data: {
        cardId,
        authorId: session.user.id,
        type: "STATUS_CHANGE",
        content: `${session.user.name} claimed this lead and started working on it.`,
      },
    }),
  ]);

  if (salesContactId(card) !== session.user.id) {
    await createNotification({
      userId: salesContactId(card),
      type: "LEAD_CLAIMED",
      message: `${session.user.name} claimed your lead "${card.title}".`,
      cardId,
    });
  }

  revalidatePath("/board");
  revalidatePath(`/cards/${cardId}`);
}

const STATUS_TEXT: Record<CardStatus, string> = {
  NEW_LEAD: "New Lead",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

function canReviewStatus(
  role: import("@prisma/client").Role,
  userId: string,
  card: { salesOwnerId: string | null }
) {
  return role === "ADMIN" || (role === "SALES" && card.salesOwnerId === userId);
}

export async function updateCardStatus(
  cardId: string,
  status: CardStatus
): Promise<{ pendingApproval: boolean }> {
  const session = await requireSession();
  const role = session.user.role as import("@prisma/client").Role;

  const card = await prisma.card.findUniqueOrThrow({ where: { id: cardId } });

  if (!canChangeStatus(role, session.user.id, card)) {
    throw new Error("You don't have permission to change this card's status.");
  }

  if (status === "IN_PROGRESS" && !card.assignedDeveloperId) {
    throw new Error("Pick a developer before moving this to In Progress.");
  }

  // Developers may only close a lead (with approval); reopening or starting is Sales/Admin.
  if (role === "DEVELOPER" && status !== "DONE" && status !== "CANCELLED") {
    throw new Error("Only Admin or the Sales who owns this lead can move it to " + STATUS_TEXT[status] + ".");
  }

  // A developer closing a lead (Done/Cancelled) needs the creating Sales to approve.
  if (role === "DEVELOPER" && (status === "DONE" || status === "CANCELLED")) {
    if (card.pendingStatus) {
      throw new Error("This lead already has a pending approval request.");
    }

    await prisma.$transaction([
      prisma.card.update({ where: { id: cardId }, data: { pendingStatus: status } }),
      prisma.activity.create({
        data: {
          cardId,
          authorId: session.user.id,
          type: "STATUS_CHANGE",
          content: `${session.user.name} requested to set this lead to ${STATUS_TEXT[status]}. Awaiting approval from Sales.`,
        },
      }),
    ]);

    await createNotification({
      userId: salesContactId(card),
      type: "STATUS_APPROVAL_REQUESTED",
      message: `${session.user.name} requested to set lead "${card.title}" to ${STATUS_TEXT[status]}. Please approve or reject.`,
      cardId,
    });

    revalidatePath("/board");
    revalidatePath(`/cards/${cardId}`);
    return { pendingApproval: true };
  }

  // Sending a lead back to New Lead resets the developer; a new one must be picked.
  const resetDeveloper =
    status === "NEW_LEAD" && (!!card.assignedDeveloperId || !!card.pendingDeveloperId);

  await prisma.$transaction([
    prisma.card.update({
      where: { id: cardId },
      data: {
        status,
        pendingStatus: null,
        ...(status === "NEW_LEAD" ? { assignedDeveloperId: null, pendingDeveloperId: null } : {}),
      },
    }),
    prisma.activity.create({
      data: {
        cardId,
        authorId: session.user.id,
        type: "STATUS_CHANGE",
        content: `Status changed to "${status}" by ${session.user.name}.${
          resetDeveloper ? " Developer was reset; please pick a developer again." : ""
        }`,
      },
    }),
  ]);

  revalidatePath("/board");
  revalidatePath(`/cards/${cardId}`);
  return { pendingApproval: false };
}

async function decideStatusRequest(cardId: string, approve: boolean) {
  const session = await requireSession();
  const role = session.user.role as import("@prisma/client").Role;

  const card = await prisma.card.findUniqueOrThrow({ where: { id: cardId } });

  if (!card.pendingStatus) {
    throw new Error("There is no pending status request for this lead.");
  }
  if (!canReviewStatus(role, session.user.id, card)) {
    throw new Error("Only Admin or the Sales who owns this lead can approve or reject.");
  }

  const requested = card.pendingStatus;

  await prisma.$transaction([
    prisma.card.update({
      where: { id: cardId },
      data: approve ? { status: requested, pendingStatus: null } : { pendingStatus: null },
    }),
    prisma.activity.create({
      data: {
        cardId,
        authorId: session.user.id,
        type: "STATUS_CHANGE",
        content: approve
          ? `${session.user.name} approved setting this lead to ${STATUS_TEXT[requested]}.`
          : `${session.user.name} rejected the request to set this lead to ${STATUS_TEXT[requested]}. The lead stays ${STATUS_TEXT[card.status]}.`,
      },
    }),
  ]);

  if (card.assignedDeveloperId && card.assignedDeveloperId !== session.user.id) {
    await createNotification({
      userId: card.assignedDeveloperId,
      type: approve ? "STATUS_APPROVED" : "STATUS_REJECTED",
      message: approve
        ? `${session.user.name} approved setting "${card.title}" to ${STATUS_TEXT[requested]}.`
        : `${session.user.name} rejected setting "${card.title}" to ${STATUS_TEXT[requested]}.`,
      cardId,
    });
  }

  revalidatePath("/board");
  revalidatePath(`/cards/${cardId}`);
}

export async function withdrawStatusRequest(cardId: string) {
  const session = await requireSession();

  const card = await prisma.card.findUniqueOrThrow({ where: { id: cardId } });

  if (!card.pendingStatus) {
    throw new Error("There is no pending status request for this lead.");
  }
  if (card.assignedDeveloperId !== session.user.id) {
    throw new Error("Only the assigned developer can cancel this request.");
  }

  await prisma.$transaction([
    prisma.card.update({ where: { id: cardId }, data: { pendingStatus: null } }),
    prisma.activity.create({
      data: {
        cardId,
        authorId: session.user.id,
        type: "STATUS_CHANGE",
        content: `${session.user.name} withdrew the request to set this lead to ${STATUS_TEXT[card.pendingStatus]}. The lead stays ${STATUS_TEXT[card.status]}.`,
      },
    }),
  ]);

  revalidatePath("/board");
  revalidatePath(`/cards/${cardId}`);
}

export async function approveStatusChange(cardId: string) {
  await decideStatusRequest(cardId, true);
}

export async function rejectStatusChange(cardId: string) {
  await decideStatusRequest(cardId, false);
}

export async function requestDeveloperAssignment(cardId: string, developerId: string) {
  const session = await requireSession();
  const role = session.user.role as import("@prisma/client").Role;

  const card = await prisma.card.findUniqueOrThrow({ where: { id: cardId } });

  if (!canChangeStatus(role, session.user.id, card)) {
    throw new Error("You don't have permission to assign this card.");
  }

  if (card.assignedDeveloperId) {
    throw new Error("This lead already has a developer assigned.");
  }

  if (card.pendingDeveloperId) {
    throw new Error("This lead already has a pending assignment request.");
  }

  const developer = await prisma.user.findUnique({ where: { id: developerId } });
  if (!developer || developer.role !== "DEVELOPER") {
    throw new Error("Invalid developer.");
  }

  await prisma.$transaction([
    prisma.card.update({
      where: { id: cardId },
      data: { pendingDeveloperId: developerId },
    }),
    prisma.activity.create({
      data: {
        cardId,
        authorId: session.user.id,
        type: "STATUS_CHANGE",
        content: `${session.user.name} requested ${developer.name} to take this lead. Awaiting acceptance.`,
      },
    }),
  ]);

  if (developerId !== session.user.id) {
    await createNotification({
      userId: developerId,
      type: "LEAD_ASSIGNED",
      message: `${session.user.name} wants to assign you to lead "${card.title}". Please accept or decline.`,
      cardId,
    });
  }

  revalidatePath("/board");
  revalidatePath(`/cards/${cardId}`);
}

export async function acceptDeveloperAssignment(cardId: string) {
  const session = await requireSession();

  const card = await prisma.card.findUniqueOrThrow({ where: { id: cardId } });

  if (card.pendingDeveloperId !== session.user.id) {
    throw new Error("You don't have a pending assignment for this lead.");
  }

  await prisma.$transaction([
    prisma.card.update({
      where: { id: cardId },
      data: {
        assignedDeveloperId: session.user.id,
        pendingDeveloperId: null,
        status: "IN_PROGRESS",
      },
    }),
    prisma.activity.create({
      data: {
        cardId,
        authorId: session.user.id,
        type: "STATUS_CHANGE",
        content: `${session.user.name} accepted the assignment and started working on this lead.`,
      },
    }),
  ]);

  if (salesContactId(card) !== session.user.id) {
    await createNotification({
      userId: salesContactId(card),
      type: "ASSIGNMENT_ACCEPTED",
      message: `${session.user.name} accepted the assignment for lead "${card.title}".`,
      cardId,
    });
  }

  revalidatePath("/board");
  revalidatePath(`/cards/${cardId}`);
}

export async function declineDeveloperAssignment(cardId: string) {
  const session = await requireSession();

  const card = await prisma.card.findUniqueOrThrow({ where: { id: cardId } });

  if (card.pendingDeveloperId !== session.user.id) {
    throw new Error("You don't have a pending assignment for this lead.");
  }

  await prisma.$transaction([
    prisma.card.update({
      where: { id: cardId },
      data: { pendingDeveloperId: null },
    }),
    prisma.activity.create({
      data: {
        cardId,
        authorId: session.user.id,
        type: "STATUS_CHANGE",
        content: `${session.user.name} declined the assignment for this lead.`,
      },
    }),
  ]);

  if (salesContactId(card) !== session.user.id) {
    await createNotification({
      userId: salesContactId(card),
      type: "ASSIGNMENT_DECLINED",
      message: `${session.user.name} declined the assignment for lead "${card.title}".`,
      cardId,
    });
  }

  revalidatePath("/board");
  revalidatePath(`/cards/${cardId}`);
}

const addActivitySchema = z.object({
  content: z.string().min(2, "Report content cannot be empty"),
  type: z.custom<ActivityType>(),
  offerAmount: z.string().optional(),
});

export async function addActivity(
  cardId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await requireSession();
  const role = session.user.role as import("@prisma/client").Role;

  const card = await prisma.card.findUniqueOrThrow({ where: { id: cardId } });
  const allowedTypes = allowedActivityTypes(role, session.user.id, card);

  const parsed = addActivitySchema.safeParse({
    content: formData.get("content"),
    type: formData.get("type"),
    offerAmount: formData.get("offerAmount") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid data." };
  }

  if (!allowedTypes.includes(parsed.data.type)) {
    return { error: "You don't have permission to add this report type." };
  }

  const file = formData.get("file");
  const hasFile = file instanceof File && file.size > 0;

  const offerAmount =
    parsed.data.type === "MARKETING_OFFER" && parsed.data.offerAmount
      ? Number(parsed.data.offerAmount)
      : undefined;

  const activity = await prisma.activity.create({
    data: {
      cardId,
      authorId: session.user.id,
      type: parsed.data.type,
      content: parsed.data.content,
      offerAmount: offerAmount !== undefined && !Number.isNaN(offerAmount) ? offerAmount : undefined,
    },
  });

  await notifyMentions({
    content: parsed.data.content,
    authorId: session.user.id,
    authorName: session.user.name ?? "Someone",
    cardId,
    cardTitle: card.title,
  });

  if (hasFile) {
    try {
      await saveCardFile({
        cardId,
        activityId: activity.id,
        uploadedById: session.user.id,
        file: file as File,
      });
    } catch (err) {
      return {
        error: `Report was saved, but the attachment failed: ${
          err instanceof Error ? err.message : "unknown error"
        }`,
      };
    }
  }

  revalidatePath(`/cards/${cardId}`);
  revalidatePath("/board");
  return {};
}

const addReplySchema = z.object({
  content: z.string().min(1, "Reply cannot be empty"),
});

export async function addReply(
  cardId: string,
  parentId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await requireSession();

  const parsed = addReplySchema.safeParse({
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid data." };
  }

  const [parent, card] = await Promise.all([
    prisma.activity.findUniqueOrThrow({ where: { id: parentId } }),
    prisma.card.findUniqueOrThrow({ where: { id: cardId } }),
  ]);

  await prisma.activity.create({
    data: {
      cardId,
      authorId: session.user.id,
      type: "REPLY",
      content: parsed.data.content,
      parentId,
    },
  });

  await notifyMentions({
    content: parsed.data.content,
    authorId: session.user.id,
    authorName: session.user.name ?? "Someone",
    cardId,
    cardTitle: card.title,
    excludeUserIds: [parent.authorId],
  });

  if (parent.authorId !== session.user.id) {
    await createNotification({
      userId: parent.authorId,
      type: "COMMENT_REPLY",
      message: `${session.user.name} replied to your comment on "${card.title}".`,
      cardId,
    });
  }

  revalidatePath(`/cards/${cardId}`);
  return {};
}

export async function updateCardMeta(
  cardId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const session = await requireSession();
  const role = session.user.role as import("@prisma/client").Role;

  const card = await prisma.card.findUniqueOrThrow({ where: { id: cardId } });
  if (!canEditCardMeta(role, session.user.id, card)) {
    return { error: "Only Admin or the Sales who owns this lead can edit priority and deadline." };
  }

  const priority = z.enum(["LOW", "MEDIUM", "HIGH"]).safeParse(formData.get("priority"));
  if (!priority.success) return { error: "Invalid priority." };
  const dueDate = parseDueDateInput(formData.get("dueDate"));

  await prisma.$transaction([
    prisma.card.update({
      where: { id: cardId },
      data: { priority: priority.data, dueDate },
    }),
    prisma.activity.create({
      data: {
        cardId,
        authorId: session.user.id,
        type: "STATUS_CHANGE",
        content: `${session.user.name} set priority to ${priority.data}${dueDate ? ` and deadline to ${dueDate.toLocaleDateString("en-US", { dateStyle: "medium" })}` : " and cleared the deadline"}.`,
      },
    }),
  ]);

  revalidatePath("/board");
  revalidatePath(`/cards/${cardId}`);
  return { success: true };
}

// System-generated status logs can't be edited or deleted by users.
const USER_WRITTEN_TYPES: ActivityType[] = [
  "SALES_UPDATE",
  "DEV_PROGRESS",
  "MARKETING_OFFER",
  "NOTE",
  "REPLY",
];

export async function updateActivity(
  activityId: string,
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const session = await requireSession();

  const activity = await prisma.activity.findUniqueOrThrow({
    where: { id: activityId },
    include: { card: { select: { id: true, title: true } } },
  });

  if (activity.authorId !== session.user.id) {
    return { error: "You can only edit your own reports." };
  }
  if (!USER_WRITTEN_TYPES.includes(activity.type)) {
    return { error: "This entry can't be edited." };
  }

  const content = String(formData.get("content") ?? "").trim();
  if (content.length < 2) return { error: "Report content cannot be empty" };

  let offerAmount = activity.offerAmount;
  if (activity.type === "MARKETING_OFFER") {
    const raw = String(formData.get("offerAmount") ?? "").trim();
    const num = raw ? Number(raw) : null;
    if (num !== null && (Number.isNaN(num) || num < 0)) {
      return { error: "Invalid offer amount." };
    }
    offerAmount = num === null ? null : (num as unknown as typeof activity.offerAmount);
  }

  const amountChanged =
    activity.type === "MARKETING_OFFER" &&
    Number(offerAmount ?? -1) !== Number(activity.offerAmount ?? -1);
  if (content === activity.content && !amountChanged) {
    return { success: true };
  }

  await prisma.activity.update({
    where: { id: activityId },
    data: { content, offerAmount, editedAt: new Date() },
  });

  await notifyMentions({
    content,
    previousContent: activity.content,
    authorId: session.user.id,
    authorName: session.user.name ?? "Someone",
    cardId: activity.card.id,
    cardTitle: activity.card.title,
  });

  revalidatePath(`/cards/${activity.card.id}`);
  revalidatePath("/activity");
  return { success: true };
}

export async function deleteActivity(activityId: string) {
  const session = await requireSession();
  const role = session.user.role as import("@prisma/client").Role;

  const activity = await prisma.activity.findUniqueOrThrow({
    where: { id: activityId },
    include: {
      files: { select: { storedName: true } },
      replies: { include: { files: { select: { storedName: true } } } },
    },
  });

  if (activity.authorId !== session.user.id && role !== "ADMIN") {
    throw new Error("You can only delete your own reports.");
  }
  if (!USER_WRITTEN_TYPES.includes(activity.type)) {
    throw new Error("This entry can't be deleted.");
  }

  const storedNames = [
    ...activity.files,
    ...activity.replies.flatMap((r) => r.files),
  ].map((f) => f.storedName);

  // Replies and file rows are removed by the database cascade.
  await prisma.activity.delete({ where: { id: activityId } });

  for (const name of storedNames) {
    await unlink(
      path.join(process.cwd(), "public", "uploads", "cards", activity.cardId, name)
    ).catch(() => {});
  }

  revalidatePath(`/cards/${activity.cardId}`);
  revalidatePath("/activity");
  revalidatePath("/board");
}
