"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton({ collapsed = false }: { collapsed?: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await signOut({ callbackUrl: "/login" });
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={collapsed ? "Log out" : undefined}
        className={`flex w-full cursor-pointer items-center overflow-hidden rounded-lg border border-red-500/30 bg-red-500/15 py-2 text-sm font-medium text-red-300 transition-colors hover:border-red-500/50 hover:bg-red-500/25 hover:text-red-200 ${
          collapsed ? "justify-center px-2" : "px-3"
        }`}
      >
        <LogOut className="h-4 w-4 shrink-0" />
        <span
          className={`truncate whitespace-nowrap transition-[max-width,opacity,margin-left] duration-300 ease-in-out ${
            collapsed ? "ml-0 max-w-0 opacity-0" : "ml-3 max-w-[160px] opacity-100"
          }`}
        >
          Log out
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-base font-semibold text-zinc-900">
              Log out of your account?
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              You&apos;ll need to log in again to access the board and reports.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="cursor-pointer rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={pending}
                className="cursor-pointer rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? "Logging out..." : "Yes, Log Out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
