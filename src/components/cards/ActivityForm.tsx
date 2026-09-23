"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ActivityType } from "@prisma/client";
import { ACTIVITY_TYPE_LABELS } from "@/lib/permissions";
import { addActivity } from "@/lib/actions/cards";

export function ActivityForm({
  cardId,
  allowedTypes,
}: {
  cardId: string;
  allowedTypes: ActivityType[];
}) {
  const [type, setType] = useState<ActivityType>(allowedTypes[0]);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
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
        <label className="text-sm font-medium text-zinc-700">Jenis Laporan</label>
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
        <label className="text-sm font-medium text-zinc-700">Isi Laporan</label>
        <textarea
          name="content"
          required
          rows={4}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          placeholder="Tulis update, progress, atau penawaran..."
        />
      </div>

      {type === "MARKETING_OFFER" && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">
            Nilai Penawaran (Rp, opsional)
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

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Mengirim..." : "Kirim Laporan"}
      </button>
    </form>
  );
}
