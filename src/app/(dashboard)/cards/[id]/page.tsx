import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import {
  allowedActivityTypes,
  canChangeStatus,
  canClaimAsSales,
  canEditCardMeta,
  canHandOffCard,
  canTakeCard,
} from "@/lib/permissions";
import { ActivityTimeline } from "@/components/cards/ActivityTimeline";
import { ActivityForm } from "@/components/cards/ActivityForm";
import { CardActions } from "@/components/cards/CardActions";
import { CardFiles } from "@/components/cards/CardFiles";
import { CardMeta } from "@/components/cards/CardMeta";
import { SalesActions } from "@/components/cards/SalesActions";

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const role = session!.user.role as Role;
  const userId = session!.user.id;

  const [card, developers, salesUsers, mentionUsers] = await Promise.all([
    prisma.card.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true } },
        salesOwner: { select: { id: true, name: true } },
        pendingSales: { select: { id: true, name: true } },
        assignedDeveloper: { select: { id: true, name: true } },
        pendingDeveloper: { select: { id: true, name: true } },
        activities: {
          where: { parentId: null },
          include: {
            author: { select: { id: true, name: true, role: true, avatarUrl: true } },
            files: {
              select: { id: true, filename: true, storedName: true, mimeType: true, size: true },
              orderBy: { createdAt: "asc" },
            },
            replies: {
              include: {
                author: { select: { id: true, name: true, role: true, avatarUrl: true } },
                files: {
                  select: { id: true, filename: true, storedName: true, mimeType: true, size: true },
                  orderBy: { createdAt: "asc" },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        files: {
          where: { activityId: null },
          include: { uploadedBy: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: "DEVELOPER" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "SALES" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!card) notFound();

  const allowedTypes = allowedActivityTypes(role, userId, card);
  const canTake =
    card.status === "NEW_LEAD" &&
    !card.assignedDeveloperId &&
    !card.pendingDeveloperId &&
    !!card.salesOwnerId &&
    canTakeCard(role);
  const canManageStatus = canChangeStatus(role, userId, card);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/board"
        className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 transition-colors hover:border-emerald-400 hover:bg-emerald-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to board
      </Link>

      <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">{card.title}</h1>
            <p className="text-sm text-zinc-500">{card.clientName}</p>
            {card.clientContact && (
              <p className="text-xs text-zinc-400">{card.clientContact}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
          <SalesActions
            cardId={card.id}
            salesOwner={card.salesOwner}
            pendingSales={card.pendingSales}
            salesUsers={salesUsers}
            currentUserId={userId}
            canHandOff={canHandOffCard(role, userId, card)}
            canClaim={canClaimAsSales(role, card)}
          />
          <CardActions
            cardId={card.id}
            status={card.status}
            canTake={canTake}
            canManageStatus={canManageStatus}
            hasDeveloper={!!card.assignedDeveloperId}
            pendingDeveloper={card.pendingDeveloper}
            pendingStatus={card.pendingStatus}
            canReviewStatus={role === "ADMIN" || (role === "SALES" && card.salesOwnerId === userId)}
            needsApproval={role === "DEVELOPER"}
            currentUserId={userId}
            developers={developers}
          />
          </div>
        </div>

        {card.description && (
          <p className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-600">
            {card.description}
          </p>
        )}

        <CardMeta
          cardId={card.id}
          priority={card.priority}
          dueDate={card.dueDate}
          status={card.status}
          canEdit={canEditCardMeta(role, userId, card)}
        />

        <div className="flex flex-wrap gap-6 text-xs text-zinc-500">
          <span>Created by: {card.createdBy.name}</span>
          <span className={card.salesOwner || card.pendingSales ? "" : "text-orange-600"}>
            Sales:{" "}
            {card.salesOwner
              ? card.salesOwner.name
              : card.pendingSales
                ? `Pending ${card.pendingSales.name}`
                : "Waiting for a Sales"}
          </span>
          <span>
            Developer: {card.assignedDeveloper ? card.assignedDeveloper.name : "Not claimed yet"}
          </span>
          {card.pendingDeveloper && (
            <span className="text-amber-600">
              Pending acceptance from {card.pendingDeveloper.name}
            </span>
          )}
          <span>Status: {card.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">
            Report & Activity History
          </h2>
          <ActivityTimeline
            activities={card.activities}
            cardId={card.id}
            users={mentionUsers}
            viewer={{ id: userId, role }}
          />
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">
            Add Report
          </h2>
          {allowedTypes.length > 0 ? (
            <ActivityForm cardId={card.id} allowedTypes={allowedTypes} users={mentionUsers} />
          ) : (
            <p className="text-sm text-zinc-400">
              You don&apos;t have permission to add reports on this card.
            </p>
          )}

          <div className="mt-6">
            <CardFiles
              cardId={card.id}
              files={card.files}
              currentUserId={userId}
              isAdmin={role === "ADMIN"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
