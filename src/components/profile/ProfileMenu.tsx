"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { Role } from "@prisma/client";
import { Avatar } from "./Avatar";
import { updateProfile } from "@/lib/actions/profile";
import { ROLE_LABELS, allowedRolesFor } from "@/lib/permissions";
import { getInitials } from "@/lib/initials";

export type ProfileData = {
  id: string;
  name: string;
  email: string;
  role: Role;
  employeeId: string | null;
  phone: string | null;
  avatarUrl: string | null;
};

const fieldClass =
  "rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/20";
const labelClass = "text-xs font-medium text-zinc-500";

export function ProfileMenu({ profile }: { profile: ProfileData }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile.avatarUrl);
  const formRef = useRef<HTMLFormElement>(null);
  const { update } = useSession();
  const router = useRouter();

  const initials = getInitials(profile.name);
  const roleOptions = allowedRolesFor(profile.role);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPreviewUrl(URL.createObjectURL(file));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newName = String(formData.get("name") ?? profile.name);
    const newRole = String(formData.get("role") ?? profile.role);

    startTransition(async () => {
      const result = await updateProfile(undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError(undefined);
      await update({ name: newName, role: newRole });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-full transition-opacity hover:opacity-80"
        aria-label="Edit profil"
      >
        <Avatar avatarUrl={profile.avatarUrl} initials={initials} size={36} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">Edit Profil</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="cursor-pointer text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>

            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="mt-4 flex flex-col gap-4"
            >
              <div className="flex items-center gap-4">
                <Avatar avatarUrl={previewUrl} initials={initials} size={64} />
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Foto Profil</label>
                  <input
                    type="file"
                    name="avatar"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleFileChange}
                    className="text-xs text-zinc-500 file:mr-2 file:rounded-md file:border-0 file:bg-zinc-100 file:px-2 file:py-1 file:text-xs file:font-medium file:text-zinc-600 hover:file:bg-zinc-200"
                  />
                  <p className="text-[11px] text-zinc-400">JPG/PNG/WEBP/GIF, maks 3MB</p>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="name" className={labelClass}>Nama</label>
                <input
                  id="name"
                  name="name"
                  defaultValue={profile.name}
                  required
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="employeeId" className={labelClass}>ID Karyawan</label>
                <input
                  id="employeeId"
                  name="employeeId"
                  defaultValue={profile.employeeId ?? ""}
                  placeholder="EMP-0001"
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="email" className={labelClass}>
                  Email <span className="text-zinc-400">(terkunci)</span>
                </label>
                <input
                  id="email"
                  defaultValue={profile.email}
                  disabled
                  className={`${fieldClass} cursor-not-allowed bg-zinc-100 text-zinc-400`}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="phone" className={labelClass}>No. HP</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={profile.phone ?? ""}
                  placeholder="0812-3456-7890"
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="role" className={labelClass}>Role</label>
                <select
                  id="role"
                  name="role"
                  defaultValue={profile.role}
                  className={fieldClass}
                >
                  {roleOptions.map((role) => (
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
