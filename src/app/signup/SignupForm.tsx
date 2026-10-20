"use client";

import { useActionState } from "react";
import { signupAction } from "./actions";
import { ROLE_LABELS, SELF_REGISTER_ROLES } from "@/lib/permissions";

const fieldClass =
  "rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/20";
const labelClass =
  "flex items-baseline gap-2 text-xs font-medium text-zinc-500";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className={labelClass}>
            Name
            <span className="h-px flex-1 bg-zinc-200" />
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className={fieldClass}
            placeholder="Full name"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="role" className={labelClass}>
            Role
            <span className="h-px flex-1 bg-zinc-200" />
          </label>
          <select id="role" name="role" required defaultValue="SALES" className={fieldClass}>
            {SELF_REGISTER_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className={labelClass}>
          Email
          <span className="h-px flex-1 bg-zinc-200" />
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={fieldClass}
          placeholder="name@company.com"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className={labelClass}>
            Password
            <span className="h-px flex-1 bg-zinc-200" />
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={fieldClass}
            placeholder="Min. 8 characters"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className={labelClass}>
            Confirm
            <span className="h-px flex-1 bg-zinc-200" />
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={fieldClass}
            placeholder="Repeat password"
          />
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 cursor-pointer rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Signing up..." : "Sign Up"}
      </button>
    </form>
  );
}
