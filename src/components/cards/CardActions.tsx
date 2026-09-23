"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CardStatus } from "@prisma/client";
import { assignDeveloperAndStart, takeCard, updateCardStatus } from "@/lib/actions/cards";

const STATUS_LABELS: Record<CardStatus, string> = {
  NEW_LEAD: "Lead Baru",
  IN_PROGRESS: "Dikerjakan",
  DONE: "Selesai",
  CANCELLED: "Batal",
};

const NEXT_STATUSES: Record<CardStatus, CardStatus[]> = {
  NEW_LEAD: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["DONE", "CANCELLED"],
  DONE: [],
  CANCELLED: ["NEW_LEAD"],
};

export function CardActions({
  cardId,
  status,
  canTake,
  canManageStatus,
  hasDeveloper,
  developers,
}: {
  cardId: string;
  status: CardStatus;
  canTake: boolean;
  canManageStatus: boolean;
  hasDeveloper: boolean;
  developers: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedDeveloper, setSelectedDeveloper] = useState(
    developers[0]?.id ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Terjadi kesalahan.");
      }
    });
  }

  function handleAssignSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDeveloper) {
      setError("Pilih developer terlebih dahulu.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await assignDeveloperAndStart(cardId, selectedDeveloper);
        setAssignOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
        {STATUS_LABELS[status]}
      </span>

      {canTake && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => takeCard(cardId))}
          className="cursor-pointer rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Ambil Lead
        </button>
      )}

      {canManageStatus &&
        NEXT_STATUSES[status].map((next) => {
          if (next === "IN_PROGRESS" && !hasDeveloper) {
            return (
              <button
                key={next}
                type="button"
                disabled={pending}
                onClick={() => setAssignOpen(true)}
                className="cursor-pointer rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Set {STATUS_LABELS[next]}
              </button>
            );
          }
          return (
            <button
              key={next}
              type="button"
              disabled={pending}
              onClick={() => run(() => updateCardStatus(cardId, next))}
              className="cursor-pointer rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Set {STATUS_LABELS[next]}
            </button>
          );
        })}

      {assignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">
                Pilih Developer
              </h2>
              <button
                type="button"
                onClick={() => setAssignOpen(false)}
                className="cursor-pointer text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Tentukan developer yang akan mengerjakan lead ini sebelum status
              dipindah ke Dikerjakan.
            </p>

            <form onSubmit={handleAssignSubmit} className="mt-4 flex flex-col gap-3">
              {developers.length === 0 ? (
                <p className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-500">
                  Belum ada akun Developer terdaftar.
                </p>
              ) : (
                <select
                  value={selectedDeveloper}
                  onChange={(e) => setSelectedDeveloper(e.target.value)}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                >
                  {developers.map((dev) => (
                    <option key={dev.id} value={dev.id}>
                      {dev.name}
                    </option>
                  ))}
                </select>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="mt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssignOpen(false)}
                  className="cursor-pointer rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={pending || developers.length === 0}
                  className="cursor-pointer rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? "Menyimpan..." : "Tugaskan & Set Dikerjakan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
