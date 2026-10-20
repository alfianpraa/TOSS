"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Pencil } from "lucide-react";
import type { CardStatus, Priority } from "@prisma/client";
import { updateCardMeta } from "@/lib/actions/cards";
import {
  DUE_CHIP,
  PRIORITY_BADGE,
  PRIORITY_LABELS,
  formatDueDate,
  getDueState,
  toDateInputValue,
} from "@/lib/cardMeta";

const fieldClass =
  "rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export function CardMeta({
  cardId,
  priority,
  dueDate,
  status,
  canEdit,
}: {
  cardId: string;
  priority: Priority;
  dueDate: Date | null;
  status: CardStatus;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const dueState = getDueState(dueDate, status);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateCardMeta(cardId, undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError(undefined);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${PRIORITY_BADGE[priority]}`}
        >
          {PRIORITY_LABELS[priority]} priority
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
            dueDate ? DUE_CHIP[dueState] : "bg-zinc-100 text-zinc-500"
          }`}
        >
          <CalendarClock className="h-3.5 w-3.5" />
          {dueDate
            ? `${dueState === "overdue" ? "Overdue · " : "Due "}${formatDueDate(dueDate)}`
            : "No deadline"}
        </span>
        {canEdit && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-zinc-500 hover:text-brand"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-base font-semibold text-zinc-900">
              Priority &amp; Deadline
            </h2>
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-500">Priority</label>
                <select name="priority" defaultValue={priority} className={fieldClass}>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-500">
                  Deadline (leave empty for none)
                </label>
                <input
                  type="date"
                  name="dueDate"
                  defaultValue={toDateInputValue(dueDate)}
                  className={fieldClass}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="mt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="cursor-pointer rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="cursor-pointer rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                >
                  {pending ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
