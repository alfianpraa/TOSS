"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { CardStatus, Role } from "@prisma/client";
import type { CardWithRelations } from "@/lib/types";
import { Column } from "./Column";
import { NewCardDialog } from "./NewCardDialog";
import { updateCardStatus } from "@/lib/actions/cards";
import { canChangeStatus } from "@/lib/permissions";

const COLUMNS: { status: CardStatus; title: string }[] = [
  { status: "NEW_LEAD", title: "Lead Baru" },
  { status: "IN_PROGRESS", title: "Dikerjakan" },
  { status: "DONE", title: "Selesai" },
  { status: "CANCELLED", title: "Batal" },
];

export function Board({
  cards,
  currentUserId,
  role,
  canCreate,
}: {
  cards: CardWithRelations[];
  currentUserId: string;
  role: Role;
  canCreate: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const [optimisticCards, setOptimisticStatus] = useOptimistic(
    cards,
    (state, update: { cardId: string; status: CardStatus }) =>
      state.map((c) =>
        c.id === update.cardId ? { ...c, status: update.status } : c
      )
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const cardId = String(active.id);
    const newStatus = over.id as CardStatus;
    const card = optimisticCards.find((c) => c.id === cardId);
    if (!card || card.status === newStatus) return;

    if (!canChangeStatus(role, currentUserId, card)) {
      setError("Anda tidak punya izin memindahkan card ini.");
      return;
    }

    setError(null);
    startTransition(async () => {
      setOptimisticStatus({ cardId, status: newStatus });
      try {
        await updateCardStatus(cardId, newStatus);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memindahkan card.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <span />
        )}
        {canCreate && <NewCardDialog />}
      </div>

      <DndContext id="board-dnd" sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <Column
              key={col.status}
              status={col.status}
              title={col.title}
              cards={optimisticCards.filter((c) => c.status === col.status)}
              role={role}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
