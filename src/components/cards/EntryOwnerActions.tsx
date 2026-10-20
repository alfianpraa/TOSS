"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { deleteActivity, updateActivity } from "@/lib/actions/cards";
import { MentionTextarea, type MentionUser } from "@/components/cards/MentionTextarea";

export function EntryOwnerActions({
  activityId,
  content,
  offerAmount,
  isOffer,
  canEdit,
  canDelete,
  replyCount,
  users,
}: {
  activityId: string;
  content: string;
  offerAmount: number | null;
  isOffer: boolean;
  canEdit: boolean;
  canDelete: boolean;
  replyCount: number;
  users: MentionUser[];
}) {
  const [mode, setMode] = useState<"edit" | "delete" | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function close() {
    setMode(null);
    setError(undefined);
  }

  function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateActivity(activityId, undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      close();
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteActivity(activityId);
        close();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  if (!canEdit && !canDelete) return null;

  return (
    <>
      <span className="inline-flex items-center gap-1">
        {canEdit && (
          <button
            type="button"
            onClick={() => setMode("edit")}
            aria-label="Edit"
            title="Edit"
            className="cursor-pointer rounded p-1 text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            onClick={() => setMode("delete")}
            aria-label="Delete"
            title="Delete"
            className="cursor-pointer rounded p-1 text-zinc-300 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </span>

      {mode === "edit" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 text-left shadow-lg">
            <h2 className="text-base font-semibold text-zinc-900">Edit report</h2>
            <form onSubmit={handleEdit} className="mt-4 flex flex-col gap-3">
              <MentionTextarea
                users={users}
                name="content"
                required
                rows={5}
                defaultValue={content}
                autoFocus
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              {isOffer && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-500">
                    Offer Amount (Rp, optional)
                  </label>
                  <input
                    name="offerAmount"
                    type="number"
                    min={0}
                    step="1000"
                    defaultValue={offerAmount ?? ""}
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="mt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={close}
                  disabled={pending}
                  className="cursor-pointer rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="cursor-pointer rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                >
                  {pending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mode === "delete" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 text-left shadow-lg">
            <h2 className="text-base font-semibold text-zinc-900">Delete this report?</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {replyCount > 0
                ? `Its ${replyCount} repl${replyCount === 1 ? "y" : "ies"} and any attachments will be deleted too. `
                : "Any attachments will be deleted too. "}
              This can&apos;t be undone.
            </p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                disabled={pending}
                className="cursor-pointer rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                className="cursor-pointer rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
              >
                {pending ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
