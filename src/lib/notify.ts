import { findMentionedNames } from "@/lib/mentions";
import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

export async function createNotification({
  userId,
  type,
  message,
  cardId,
}: {
  userId: string;
  type: NotificationType;
  message: string;
  cardId?: string;
}) {
  if (!userId) return;
  await prisma.notification.create({
    data: { userId, type, message, cardId },
  });
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Runs when a user opens the app (no cron): notifies about their open cards
// that are overdue or due within 24h, at most once per card per day.
export async function syncDeadlineNotifications(userId: string) {
  const now = new Date();
  const cards = await prisma.card.findMany({
    where: {
      status: { in: ["NEW_LEAD", "IN_PROGRESS"] },
      dueDate: { not: null, lte: new Date(now.getTime() + DAY_MS) },
      OR: [
        { assignedDeveloperId: userId },
        { assignedDeveloperId: null, salesOwnerId: userId },
        { assignedDeveloperId: null, salesOwnerId: null, createdById: userId },
      ],
    },
    select: { id: true, title: true, dueDate: true },
  });
  if (cards.length === 0) return;

  const recent = await prisma.notification.findMany({
    where: {
      userId,
      type: "DEADLINE_APPROACHING",
      cardId: { in: cards.map((c) => c.id) },
      createdAt: { gte: new Date(now.getTime() - DAY_MS) },
    },
    select: { cardId: true },
  });
  const already = new Set(recent.map((n) => n.cardId));

  for (const card of cards) {
    if (already.has(card.id) || !card.dueDate) continue;
    const overdue = card.dueDate.getTime() < now.getTime();
    await createNotification({
      userId,
      type: "DEADLINE_APPROACHING",
      message: overdue
        ? `Lead "${card.title}" is overdue.`
        : `Lead "${card.title}" is due within 24 hours.`,
      cardId: card.id,
    });
  }
}

export async function notifyMentions({
  content,
  authorId,
  authorName,
  cardId,
  cardTitle,
  excludeUserIds = [],
  previousContent,
}: {
  content: string;
  authorId: string;
  authorName: string;
  cardId: string;
  cardTitle: string;
  excludeUserIds?: string[];
  previousContent?: string;
}) {
  if (!content.includes("@")) return;

  const users = await prisma.user.findMany({ select: { id: true, name: true } });
  const names = users.map((u) => u.name);
  const mentioned = findMentionedNames(content, names);
  // When editing, only people newly mentioned get notified.
  if (previousContent) {
    for (const name of findMentionedNames(previousContent, names)) mentioned.delete(name);
  }
  if (mentioned.size === 0) return;

  const skip = new Set([authorId, ...excludeUserIds]);
  for (const user of users) {
    if (!mentioned.has(user.name) || skip.has(user.id)) continue;
    await createNotification({
      userId: user.id,
      type: "MENTION",
      message: `${authorName} mentioned you in "${cardTitle}".`,
      cardId,
    });
  }
}
