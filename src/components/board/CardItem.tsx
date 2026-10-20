"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CardWithRelations } from "@/lib/types";
import { canTakeCard } from "@/lib/permissions";
import { takeCard } from "@/lib/actions/cards";
import type { Role } from "@prisma/client";
import {
  DUE_CHIP,
  PRIORITY_CARD,
  PRIORITY_LABELS,
  formatDueDate,
  getDueState,
} from "@/lib/cardMeta";

export function CardItem({
  card,
  role,
}: {
  card: CardWithRelations;
  role: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: card.id });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const dueState = getDueState(card.dueDate, card.status);
  const isClosed = card.status === "DONE" || card.status === "CANCELLED";

  const canTake =
    card.status === "NEW_LEAD" &&
    !card.assignedDeveloperId &&
    !card.pendingDeveloperId &&
    !!card.salesOwnerId &&
    canTakeCard(role as Role);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <Link href={`/cards/${card.id}`} className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-zinc-900">{card.title}</p>
          <p className="text-xs text-zinc-500">{card.clientName}</p>
        </div>

      {(!isClosed || card.dueDate) && (
      <div className="flex flex-wrap items-center gap-1.5">
        {!isClosed && (
          <span
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${PRIORITY_CARD[card.priority].badge}`}
          >
            Priority: {PRIORITY_LABELS[card.priority]}
          </span>
        )}
        {card.dueDate && (
          <span
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${DUE_CHIP[dueState]}`}
          >
            {dueState === "overdue" ? "Overdue · " : "Due "}
            {formatDueDate(card.dueDate)}
          </span>
        )}
      </div>
      )}

      {card.status === "NEW_LEAD" && !card.salesOwner && !card.pendingSales && (
        <span className="w-fit rounded-md bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700">
          Waiting for Sales
        </span>
      )}

      {card.pendingSales && (
        <span className="w-fit rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
          Awaiting Sales {card.pendingSales.name}&apos;s acceptance
        </span>
      )}

      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>{card._count.activities} report(s)</span>
        <span>
          {card.assignedDeveloper
            ? `Dev: ${card.assignedDeveloper.name}`
            : "Not claimed yet"}
        </span>
      </div>

      {card.pendingStatus && (
        <span className="w-fit rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700">
          Awaiting approval: {card.pendingStatus === "DONE" ? "Done" : "Cancelled"}
        </span>
      )}

      {card.pendingDeveloper && (
        <span className="w-fit rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
          Awaiting {card.pendingDeveloper.name}&apos;s acceptance
        </span>
      )}

      </Link>

      {canTake && (
        <button
          type="button"
          disabled={pending}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() =>
            startTransition(async () => {
              await takeCard(card.id);
              router.refresh();
            })
          }
          className="mt-1 cursor-pointer rounded-md bg-brand px-2 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Claiming..." : "Claim Lead"}
        </button>
      )}
    </div>
  );
}
