import type { Prisma, Priority } from "@prisma/client";

export type CardFilterParams = {
  q?: string;
  developer?: string;
  priority?: string;
  due?: string;
};

const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH"];

export function buildCardWhere(params: CardFilterParams): Prisma.CardWhereInput {
  const and: Prisma.CardWhereInput[] = [];

  const q = params.q?.trim();
  if (q) {
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { clientName: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (params.developer === "none") {
    and.push({ assignedDeveloperId: null });
  } else if (params.developer) {
    and.push({ assignedDeveloperId: params.developer });
  }

  if (PRIORITIES.includes(params.priority as Priority)) {
    and.push({ priority: params.priority as Priority });
  }

  if (params.due === "overdue") {
    and.push({
      dueDate: { lt: new Date() },
      status: { in: ["NEW_LEAD", "IN_PROGRESS"] },
    });
  } else if (params.due === "week") {
    const now = new Date();
    and.push({
      dueDate: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
    });
  } else if (params.due === "none") {
    and.push({ dueDate: null });
  }

  return and.length ? { AND: and } : {};
}
