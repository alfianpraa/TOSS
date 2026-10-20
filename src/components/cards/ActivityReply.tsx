"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addReply } from "@/lib/actions/cards";
import { MentionTextarea, type MentionUser } from "@/components/cards/MentionTextarea";

export function ActivityReply({
  cardId,
  activityId,
  users,
}: {
  cardId: string;
  activityId: string;
  users: MentionUser[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await addReply(cardId, activityId, undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError(undefined);
      formRef.current?.reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer text-xs font-medium text-zinc-500 hover:text-brand"
      >
        {open ? "Cancel" : "Reply"}
      </button>

      {open && (
        <form ref={formRef} onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2">
          <MentionTextarea
            users={users}
            name="content"
            required
            rows={2}
            autoFocus
            placeholder="Write a reply..."
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="self-start cursor-pointer rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Sending..." : "Send Reply"}
          </button>
        </form>
      )}
    </div>
  );
}
