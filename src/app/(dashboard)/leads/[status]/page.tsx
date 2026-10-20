import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { findLeadStatusBySegment } from "@/lib/leadStatus";
import { LeadFilters } from "@/components/board/LeadFilters";
import { buildCardWhere, type CardFilterParams } from "@/lib/cardFilters";
import {
  DUE_CHIP,
  PRIORITY_BADGE,
  PRIORITY_LABELS,
  formatDueDate,
  getDueState,
} from "@/lib/cardMeta";

const STATUS_BADGE: Record<string, string> = {
  NEW_LEAD: "bg-sky-100 text-sky-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  DONE: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-zinc-200 text-zinc-600",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(date);
}

export default async function LeadsByStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ status: string }>;
  searchParams: Promise<CardFilterParams>;
}) {
  const { status: segment } = await params;
  const filters = await searchParams;
  const statusInfo = findLeadStatusBySegment(segment);
  if (!statusInfo) notFound();

  const [cards, developers] = await Promise.all([
    prisma.card.findMany({
    where: { AND: [{ status: statusInfo.status }, buildCardWhere(filters)] },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true } },
      assignedDeveloper: { select: { id: true, name: true } },
      pendingDeveloper: { select: { id: true, name: true } },
      _count: { select: { activities: true } },
    },
  }),
    prisma.user.findMany({
      where: { role: "DEVELOPER" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">
          {statusInfo.label}
        </h1>
        <p className="text-sm text-zinc-500">
          {cards.length} lead{cards.length === 1 ? "" : "s"} with this status.
        </p>
      </div>

      <LeadFilters basePath={`/leads/${segment}`} developers={developers} />

      {cards.length === 0 ? (
        <p className="rounded-md border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-400">
          No leads here yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Lead</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Deadline</th>
                <th className="px-4 py-3 font-medium">Created by</th>
                <th className="px-4 py-3 font-medium">Developer</th>
                <th className="px-4 py-3 font-medium">Reports</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {cards.map((card) => (
                <tr key={card.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/cards/${card.id}`}
                      className="font-medium text-zinc-900 hover:text-brand"
                    >
                      {card.title}
                    </Link>
                    <p className="text-xs text-zinc-500">{card.clientName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[card.status]}`}
                    >
                      {statusInfo.label}
                    </span>
                    {card.pendingDeveloper && (
                      <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        Awaiting {card.pendingDeveloper.name}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE[card.priority]}`}
                    >
                      {PRIORITY_LABELS[card.priority]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {card.dueDate ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${DUE_CHIP[getDueState(card.dueDate, card.status)]}`}
                      >
                        {formatDueDate(card.dueDate)}
                      </span>
                    ) : (
                      <span className="text-zinc-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {card.createdBy.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {card.assignedDeveloper?.name ?? "Not claimed yet"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {card._count.activities}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {formatDate(card.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
