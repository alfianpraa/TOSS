"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  acceptSalesHandoff,
  claimSalesLead,
  declineSalesHandoff,
  requestSalesHandoff,
} from "@/lib/actions/cards";

type Confirm = {
  title: string;
  description: string;
  confirmLabel: string;
  variant: "success" | "danger";
  run: () => Promise<unknown>;
};

const VARIANT_CLASS: Record<Confirm["variant"], string> = {
  success: "bg-emerald-600 hover:opacity-90",
  danger: "bg-red-600 hover:opacity-90",
};

export function SalesActions({
  cardId,
  salesOwner,
  pendingSales,
  salesUsers,
  currentUserId,
  canHandOff,
  canClaim,
}: {
  cardId: string;
  salesOwner: { id: string; name: string } | null;
  pendingSales: { id: string; name: string } | null;
  salesUsers: { id: string; name: string }[];
  currentUserId: string;
  canHandOff: boolean;
  canClaim: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [pickOpen, setPickOpen] = useState(false);
  const options = salesUsers.filter((s) => s.id !== salesOwner?.id);
  const [selected, setSelected] = useState(options[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const router = useRouter();

  const isPendingForMe = pendingSales?.id === currentUserId;

  function runConfirmed() {
    if (!confirm) return;
    const action = confirm;
    startTransition(async () => {
      try {
        await action.run();
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setConfirm(null);
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) {
      setError("Please select a Sales first.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await requestSalesHandoff(cardId, selected);
        setPickOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  function pickUp() {
    startTransition(async () => {
      try {
        await claimSalesLead(cardId);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <>
      {pendingSales && !isPendingForMe && (
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
          Awaiting Sales {pendingSales.name}&apos;s acceptance
        </span>
      )}

      {isPendingForMe && (
        <>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              setConfirm({
                title: "Accept this lead?",
                description:
                  "You'll become the Sales owner and can assign a developer and manage the status.",
                confirmLabel: "Yes, Accept",
                variant: "success",
                run: () => acceptSalesHandoff(cardId),
              })
            }
            className="cursor-pointer rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Accept Lead
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              setConfirm({
                title: "Decline this lead?",
                description: "The lead goes back to Marketing and the sender will be notified.",
                confirmLabel: "Yes, Decline",
                variant: "danger",
                run: () => declineSalesHandoff(cardId),
              })
            }
            className="cursor-pointer rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Decline
          </button>
        </>
      )}

      {canClaim && (
        <button
          type="button"
          disabled={pending}
          onClick={pickUp}
          className="cursor-pointer rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Picking up..." : "Pick Up Lead"}
        </button>
      )}

      {canHandOff && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setSelected(options[0]?.id ?? "");
            setError(null);
            setPickOpen(true);
          }}
          className="cursor-pointer rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {salesOwner ? "Reassign Sales" : "Assign Sales"}
        </button>
      )}

      {pickOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">Select Sales</h2>
              <button
                type="button"
                onClick={() => setPickOpen(false)}
                className="cursor-pointer text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Choose the Sales to hand this lead to. They&apos;ll need to accept before
              becoming the owner.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              {options.length === 0 ? (
                <p className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-500">
                  No other Sales accounts available.
                </p>
              ) : (
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                >
                  {options.map((sales) => (
                    <option key={sales.id} value={sales.id}>
                      {sales.name}
                    </option>
                  ))}
                </select>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="mt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPickOpen(false)}
                  className="cursor-pointer rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending || options.length === 0}
                  className="cursor-pointer rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? "Sending..." : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-base font-semibold text-zinc-900">{confirm.title}</h2>
            <p className="mt-1 text-sm text-zinc-500">{confirm.description}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                disabled={pending}
                className="cursor-pointer rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={runConfirmed}
                disabled={pending}
                className={`cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASS[confirm.variant]}`}
              >
                {pending ? "Processing..." : confirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
