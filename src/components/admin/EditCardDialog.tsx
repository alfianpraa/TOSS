"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CardStatus } from "@prisma/client";
import { adminDeleteCard, adminUpdateCard } from "@/lib/actions/admin";

const STATUS_OPTIONS: { value: CardStatus; label: string }[] = [
  { value: "NEW_LEAD", label: "New Lead" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
  { value: "CANCELLED", label: "Cancelled" },
];

const fieldClass =
  "rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/20";
const labelClass = "text-xs font-medium text-zinc-500";

export type AdminCardRow = {
  id: string;
  title: string;
  clientName: string;
  clientContact: string | null;
  description: string | null;
  status: CardStatus;
  assignedDeveloperId: string | null;
};

export function EditCardDialog({
  card,
  developers,
}: {
  card: AdminCardRow;
  developers: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await adminUpdateCard(card.id, undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError(undefined);
      setOpen(false);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await adminDeleteCard(card.id);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
      >
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">Edit Card</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="cursor-pointer text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Project Title</label>
                <input
                  name="title"
                  defaultValue={card.title}
                  required
                  className={fieldClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Client Name</label>
                  <input
                    name="clientName"
                    defaultValue={card.clientName}
                    required
                    className={fieldClass}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Client Contact</label>
                  <input
                    name="clientContact"
                    defaultValue={card.clientContact ?? ""}
                    className={fieldClass}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>Description</label>
                <textarea
                  name="description"
                  defaultValue={card.description ?? ""}
                  rows={3}
                  className={fieldClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Status</label>
                  <select name="status" defaultValue={card.status} className={fieldClass}>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Developer</label>
                  <select
                    name="assignedDeveloperId"
                    defaultValue={card.assignedDeveloperId ?? ""}
                    className={fieldClass}
                  >
                    <option value="">Not claimed yet</option>
                    {developers.map((dev) => (
                      <option key={dev.id} value={dev.id}>
                        {dev.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="cursor-pointer text-xs font-medium text-red-600 hover:underline"
                >
                  Delete Card
                </button>
                <div className="flex gap-2">
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
                    className="cursor-pointer rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pending ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-base font-semibold text-zinc-900">
              Delete this card?
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              All report &amp; activity history on card &quot;{card.title}&quot;
              will be permanently deleted. This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={pending}
                className="cursor-pointer rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                className="cursor-pointer rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
