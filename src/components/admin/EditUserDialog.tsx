"use client";

import { useRef, useState, useTransition } from "react";
import type { Role } from "@prisma/client";
import { adminUpdateUser } from "@/lib/actions/admin";
import { ROLE_LABELS } from "@/lib/permissions";

const ALL_ROLES: Role[] = ["ADMIN", "SALES", "DEVELOPER", "MARKETING"];

const fieldClass =
  "rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/20";
const labelClass = "text-xs font-medium text-zinc-500";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  employeeId: string | null;
  phone: string | null;
  avatarUrl: string | null;
};

export function EditUserDialog({ user }: { user: AdminUserRow }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await adminUpdateUser(user.id, undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError(undefined);
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
      >
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">Edit User</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="cursor-pointer text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor={`name-${user.id}`} className={labelClass}>Nama</label>
                <input
                  id={`name-${user.id}`}
                  name="name"
                  defaultValue={user.name}
                  required
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor={`email-${user.id}`} className={labelClass}>Email</label>
                <input
                  id={`email-${user.id}`}
                  name="email"
                  type="email"
                  defaultValue={user.email}
                  required
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor={`employeeId-${user.id}`} className={labelClass}>ID Karyawan</label>
                <input
                  id={`employeeId-${user.id}`}
                  name="employeeId"
                  defaultValue={user.employeeId ?? ""}
                  placeholder="EMP-0001"
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor={`phone-${user.id}`} className={labelClass}>No. HP</label>
                <input
                  id={`phone-${user.id}`}
                  name="phone"
                  type="tel"
                  defaultValue={user.phone ?? ""}
                  placeholder="0812-3456-7890"
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor={`role-${user.id}`} className={labelClass}>Role</label>
                <select
                  id={`role-${user.id}`}
                  name="role"
                  defaultValue={user.role}
                  className={fieldClass}
                >
                  {ALL_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="cursor-pointer rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="cursor-pointer rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
