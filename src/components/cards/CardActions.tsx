"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CardStatus } from "@prisma/client";
import {
  acceptDeveloperAssignment,
  approveStatusChange,
  declineDeveloperAssignment,
  rejectStatusChange,
  withdrawStatusRequest,
  requestDeveloperAssignment,
  takeCard,
  updateCardStatus,
} from "@/lib/actions/cards";

const STATUS_LABELS: Record<CardStatus, string> = {
  NEW_LEAD: "New Lead",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

const NEXT_STATUSES: Record<CardStatus, CardStatus[]> = {
  NEW_LEAD: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["DONE", "CANCELLED"],
  DONE: [],
  CANCELLED: ["NEW_LEAD"],
};

type ConfirmAction = {
  title: string;
  description: string;
  confirmLabel: string;
  variant: "brand" | "danger" | "success";
  run: () => Promise<unknown>;
};

const CONFIRM_VARIANT_CLASS: Record<ConfirmAction["variant"], string> = {
  brand: "bg-brand hover:opacity-90",
  danger: "bg-red-600 hover:opacity-90",
  success: "bg-emerald-600 hover:opacity-90",
};

export function CardActions({
  cardId,
  status,
  canTake,
  canManageStatus,
  hasDeveloper,
  pendingDeveloper,
  pendingStatus,
  canReviewStatus,
  needsApproval,
  currentUserId,
  developers,
}: {
  cardId: string;
  status: CardStatus;
  canTake: boolean;
  canManageStatus: boolean;
  hasDeveloper: boolean;
  pendingDeveloper: { id: string; name: string } | null;
  pendingStatus: CardStatus | null;
  canReviewStatus: boolean;
  needsApproval: boolean;
  currentUserId: string;
  developers: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedDeveloper, setSelectedDeveloper] = useState(
    developers[0]?.id ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const router = useRouter();

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  function runConfirmed() {
    if (!confirmAction) return;
    const action = confirmAction;
    startTransition(async () => {
      try {
        await action.run();
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setConfirmAction(null);
      }
    });
  }

  function handleAssignSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDeveloper) {
      setError("Please select a developer first.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await requestDeveloperAssignment(cardId, selectedDeveloper);
        setAssignOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  const isPendingForMe = pendingDeveloper?.id === currentUserId;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
        {STATUS_LABELS[status]}
      </span>

      {pendingDeveloper && !isPendingForMe && (
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
          Awaiting {pendingDeveloper.name}&apos;s acceptance
        </span>
      )}

      {pendingStatus && (
        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
          Awaiting Sales approval: {STATUS_LABELS[pendingStatus]}
        </span>
      )}

      {pendingStatus && needsApproval && !canReviewStatus && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            setConfirmAction({
              title: "Cancel your request?",
              description: "The lead stays In Progress and you can send a new request later.",
              confirmLabel: "Yes, Cancel Request",
              variant: "danger",
              run: () => withdrawStatusRequest(cardId),
            })
          }
          className="cursor-pointer rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel request
        </button>
      )}

      {pendingStatus && canReviewStatus && (
        <>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              setConfirmAction({
                title: `Approve setting to ${STATUS_LABELS[pendingStatus]}?`,
                description: "The lead status will change and the developer will be notified.",
                confirmLabel: "Yes, Approve",
                variant: "success",
                run: () => approveStatusChange(cardId),
              })
            }
            className="cursor-pointer rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              setConfirmAction({
                title: "Reject this request?",
                description: "The lead stays as it is and the developer will be notified.",
                confirmLabel: "Yes, Reject",
                variant: "danger",
                run: () => rejectStatusChange(cardId),
              })
            }
            className="cursor-pointer rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reject
          </button>
        </>
      )}

      {isPendingForMe && (
        <>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              setConfirmAction({
                title: "Accept this lead?",
                description:
                  "You'll be assigned as the developer and the status will move to In Progress.",
                confirmLabel: "Yes, Accept",
                variant: "success",
                run: () => acceptDeveloperAssignment(cardId),
              })
            }
            className="cursor-pointer rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Accept Assignment
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              setConfirmAction({
                title: "Decline this lead?",
                description:
                  "The lead will go back to unclaimed and anyone else can take it.",
                confirmLabel: "Yes, Decline",
                variant: "danger",
                run: () => declineDeveloperAssignment(cardId),
              })
            }
            className="cursor-pointer rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Decline
          </button>
        </>
      )}

      {canTake && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => takeCard(cardId))}
          className="cursor-pointer rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Claim Lead
        </button>
      )}

      {canManageStatus &&
        !pendingDeveloper &&
        !pendingStatus &&
        NEXT_STATUSES[status]
          .filter((next) => !needsApproval || next === "DONE" || next === "CANCELLED")
          .map((next) => {
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

          if (next === "DONE" || next === "CANCELLED") {
            return (
              <button
                key={next}
                type="button"
                disabled={pending}
                onClick={() =>
                  setConfirmAction({
                    title: needsApproval
                      ? `Request to set ${STATUS_LABELS[next]}?`
                      : `Set status to ${STATUS_LABELS[next]}?`,
                    description: needsApproval
                      ? "The Sales who owns this lead must approve before the status changes."
                      : next === "DONE"
                        ? "This marks the project as completed."
                        : "This marks the lead/project as cancelled.",
                    confirmLabel: needsApproval
                      ? "Send Request"
                      : `Yes, Set ${STATUS_LABELS[next]}`,
                    variant: next === "DONE" ? "success" : "danger",
                    run: () => updateCardStatus(cardId, next),
                  })
                }
                className={`cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
                  next === "DONE"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                }`}
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
                Select Developer
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
              Choose the developer to request for this lead. They&apos;ll need
              to accept before the status moves to In Progress.
            </p>

            <form onSubmit={handleAssignSubmit} className="mt-4 flex flex-col gap-3">
              {developers.length === 0 ? (
                <p className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-500">
                  No Developer accounts registered yet.
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending || developers.length === 0}
                  className="cursor-pointer rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? "Sending..." : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-base font-semibold text-zinc-900">
              {confirmAction.title}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">{confirmAction.description}</p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                disabled={pending}
                className="cursor-pointer rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={runConfirmed}
                disabled={pending}
                className={`cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60 ${CONFIRM_VARIANT_CLASS[confirmAction.variant]}`}
              >
                {pending ? "Processing..." : confirmAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
