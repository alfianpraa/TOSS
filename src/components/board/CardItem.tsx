"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CardWithRelations } from "@/lib/types";
import { canTakeCard } from "@/lib/permissions";
import { takeCard } from "@/lib/actions/cards";
import type { Role } from "@prisma/client";

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

  const canTake =
    card.status === "NEW_LEAD" &&
    !card.assignedDeveloperId &&
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
      <Link href={`/cards/${card.id}`} className="flex flex-col gap-1">
        <p className="text-sm font-medium text-zinc-900">{card.title}</p>
        <p className="text-xs text-zinc-500">{card.clientName}</p>
      </Link>

      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>{card._count.activities} laporan</span>
        <span>
          {card.assignedDeveloper
            ? `Dev: ${card.assignedDeveloper.name}`
            : "Belum diambil"}
        </span>
      </div>

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
          {pending ? "Mengambil..." : "Ambil Lead"}
        </button>
      )}
    </div>
  );
}
