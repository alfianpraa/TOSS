"use client";

import { useRef, useState, useTransition } from "react";
import { changePassword } from "@/lib/actions/profile";

const fieldClass =
  "rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/20";
const labelClass = "text-xs font-medium text-zinc-500";

export function PasswordSettingsForm() {
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setSuccess(false);
    startTransition(async () => {
      const result = await changePassword(undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError(undefined);
      setSuccess(true);
      formRef.current?.reset();
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6"
    >
      <div>
        <h2 className="text-sm font-semibold text-zinc-900">Change Password</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Use a strong password you don&apos;t use elsewhere.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="currentPassword" className={labelClass}>
          Current Password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="newPassword" className={labelClass}>
          New Password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="confirmPassword" className={labelClass}>
          Confirm New Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Repeat new password"
          className={fieldClass}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && !error && (
        <p className="text-sm text-emerald-600">Password changed successfully.</p>
      )}

      <div className="mt-2 flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving..." : "Update Password"}
        </button>
      </div>
    </form>
  );
}
