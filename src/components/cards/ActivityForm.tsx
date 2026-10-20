"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ActivityType } from "@prisma/client";
import { ACTIVITY_TYPE_LABELS } from "@/lib/permissions";
import { addActivity } from "@/lib/actions/cards";
import { MAX_CARD_FILE_BYTES } from "@/lib/fileLimits";
import { MentionTextarea, type MentionUser } from "@/components/cards/MentionTextarea";

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ActivityForm({
  cardId,
  allowedTypes,
  users,
}: {
  cardId: string;
  allowedTypes: ActivityType[];
  users: MentionUser[];
}) {
  const [type, setType] = useState<ActivityType>(allowedTypes[0]);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const file = formData.get("file");
    if (file instanceof File && file.size > MAX_CARD_FILE_BYTES) {
      setError(
        `File is too large (${formatSize(file.size)}). Max size is ${formatSize(MAX_CARD_FILE_BYTES)}.`
      );
      return;
    }

    setError(undefined);
    startTransition(async () => {
      const result = await addActivity(cardId, undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError(undefined);
      formRef.current?.reset();
      setType(allowedTypes[0]);
      router.refresh();
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4"
    >
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Report Type</label>
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as ActivityType)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          {allowedTypes.map((t) => (
            <option key={t} value={t}>
              {ACTIVITY_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Report Content</label>
        <MentionTextarea
          users={users}
          name="content"
          required
          rows={4}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          placeholder="Write an update, progress, or offer... Type @ to mention someone"
        />
      </div>

      {type === "MARKETING_OFFER" && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">
            Offer Amount (Rp, optional)
          </label>
          <input
            name="offerAmount"
            type="number"
            min={0}
            step="1000"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            placeholder="15000000"
          />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">
          Attachment (optional)
        </label>
        <input
          type="file"
          name="file"
          className="text-xs text-zinc-500 file:mr-2 file:rounded-md file:border-0 file:bg-zinc-100 file:px-2 file:py-1 file:text-xs file:font-medium file:text-zinc-600 hover:file:bg-zinc-200"
        />
        <p className="text-[11px] text-zinc-400">Max 15MB.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Submitting..." : "Submit Report"}
      </button>
    </form>
  );
}
