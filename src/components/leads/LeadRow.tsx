import Link from "next/link";
import type { CardStatus, Priority } from "@prisma/client";
import {
  DUE_CHIP,
  PRIORITY_BADGE,
  PRIORITY_LABELS,
  formatDueDate,
  getDueState,
} from "@/lib/cardMeta";

const STATUS_LABELS: Record<CardStatus, string> = {
  NEW_LEAD: "New Lead",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

const STATUS_BADGE: Record<CardStatus, string> = {
  NEW_LEAD: "bg-sky-100 text-sky-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  DONE: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-zinc-200 text-zinc-600",
};

export type LeadRowData = {
  id: string;
  title: string;
  clientName: string;
  status: CardStatus;
  priority: Priority;
  dueDate: Date | null;
  createdBy: { name: string };
  assignedDeveloper: { name: string } | null;
};

export function LeadRow({ card }: { card: LeadRowData }) {
  const dueState = getDueState(card.dueDate, card.status);
  return (
    <li>
      <Link
        href={`/cards/${card.id}`}
        className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-zinc-50 sm:flex-row sm:items-center sm:gap-4"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-900">{card.title}</p>
          <p className="truncate text-xs text-zinc-500">
            {card.clientName} · by {card.createdBy.name} ·{" "}
            {card.assignedDeveloper ? `Dev: ${card.assignedDeveloper.name}` : "Not claimed yet"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[card.status]}`}
          >
            {STATUS_LABELS[card.status]}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE[card.priority]}`}
          >
            {PRIORITY_LABELS[card.priority]}
          </span>
          {card.dueDate && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${DUE_CHIP[dueState]}`}
            >
              {dueState === "overdue" ? "Overdue · " : "Due "}
              {formatDueDate(card.dueDate)}
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}
