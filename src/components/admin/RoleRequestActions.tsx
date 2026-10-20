"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@prisma/client";
import { approveRoleChange, rejectRoleChange } from "@/lib/actions/admin";
import { ROLE_LABELS } from "@/lib/permissions";

export function RoleRequestActions({
  userId,
  userName,
  pendingRole,
}: {
  userId: string;
  userName: string;
  pendingRole: Role;
}) {
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<"approve" | "reject" | null>(null);
  const router = useRouter();

  function run() {
    const action = confirm;
    if (!action) return;
    startTransition(async () => {
      try {
        if (action === "approve") await approveRoleChange(userId);
        else await rejectRoleChange(userId);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setConfirm(null);
      }
    });
  }

  return (
    <>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
          Requests: {ROLE_LABELS[pendingRole]}
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirm("approve")}
          className="cursor-pointer rounded-md bg-emerald-600 px-2 py-0.5 text-[11px] font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirm("reject")}
          className="cursor-pointer rounded-md border border-red-300 px-2 py-0.5 text-[11px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
        >
          Reject
        </button>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 text-left shadow-lg">
            <h2 className="text-base font-semibold text-zinc-900">
              {confirm === "approve" ? "Approve role change?" : "Reject role change?"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {confirm === "approve"
                ? `${userName} will become ${ROLE_LABELS[pendingRole]}.`
                : `${userName} will stay in their current role.`}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                disabled={pending}
                className="cursor-pointer rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={run}
                disabled={pending}
                className={`cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60 ${
                  confirm === "approve" ? "bg-emerald-600" : "bg-red-600"
                }`}
              >
                {pending ? "Processing..." : confirm === "approve" ? "Yes, Approve" : "Yes, Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
