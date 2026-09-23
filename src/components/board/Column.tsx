"use client";

import { useDroppable } from "@dnd-kit/core";
import type { CardStatus } from "@prisma/client";
import type { CardWithRelations } from "@/lib/types";
import { CardItem } from "./CardItem";

const STATUS_STYLES: Record<CardStatus, string> = {
  NEW_LEAD: "border-t-sky-400",
  IN_PROGRESS: "border-t-amber-400",
  DONE: "border-t-emerald-400",
  CANCELLED: "border-t-zinc-300",
};

export function Column({
  status,
  title,
  cards,
  role,
}: {
  status: CardStatus;
  title: string;
  cards: CardWithRelations[];
  role: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-full min-w-[260px] flex-1 flex-col gap-3 rounded-lg border-t-4 bg-zinc-100/70 p-3 ${STATUS_STYLES[status]} ${
        isOver ? "ring-2 ring-zinc-400" : ""
      }`}
    >
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-zinc-700">{title}</h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-zinc-500">
          {cards.length}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {cards.map((card) => (
          <CardItem key={card.id} card={card} role={role} />
        ))}
        {cards.length === 0 && (
          <p className="rounded-md border border-dashed border-zinc-300 p-4 text-center text-xs text-zinc-400">
            Tidak ada card
          </p>
        )}
      </div>
    </div>
  );
}
