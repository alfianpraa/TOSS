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
  { status: "NEW_LEAD", title: "New Lead" },
  { status: "IN_PROGRESS", title: "In Progress" },
  { status: "DONE", title: "Done" },
  { status: "CANCELLED", title: "Cancelled" },
];

export function Board({
  cards,
  currentUserId,
  role,
  canCreate,
  salesUsers,
}: {
  cards: CardWithRelations[];
  currentUserId: string;
  role: Role;
  canCreate: boolean;
  salesUsers: { id: string; name: string }[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
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
      setError("You don't have permission to move this card.");
      return;
    }

    setError(null);
    setInfo(null);
    startTransition(async () => {
      setOptimisticStatus({ cardId, status: newStatus });
      try {
        const result = await updateCardStatus(cardId, newStatus);
        if (result.pendingApproval) {
          setInfo("Request sent. The Sales who owns this lead must approve before it moves.");
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to move card.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : info ? (
          <p className="text-sm text-violet-700">{info}</p>
        ) : (
          <span />
        )}
        {canCreate && <NewCardDialog role={role} salesUsers={salesUsers} />}
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
