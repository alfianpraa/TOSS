"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { Role } from "@prisma/client";
import { Avatar } from "@/components/profile/Avatar";
import { updateProfile } from "@/lib/actions/profile";
import { ROLE_LABELS, allowedRolesFor } from "@/lib/permissions";
import { getInitials } from "@/lib/initials";

export type ProfileData = {
  id: string;
  name: string;
  email: string;
  role: Role;
  pendingRole: Role | null;
  employeeId: string | null;
  phone: string | null;
  avatarUrl: string | null;
};

const fieldClass =
  "rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/20";
const labelClass = "text-xs font-medium text-zinc-500";

export function ProfileSettingsForm({ profile }: { profile: ProfileData }) {
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState(false);
  const [roleChangeRequested, setRoleChangeRequested] = useState(false);
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

    setSuccess(false);
    setRoleChangeRequested(false);
    startTransition(async () => {
      const result = await updateProfile(undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError(undefined);
      setSuccess(true);
      setRoleChangeRequested(!!result.roleChangeRequested);
      if (!result.roleChangeRequested) {
        await update({ name: newName, role: newRole });
      } else {
        await update({ name: newName });
      }
      router.refresh();
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6"
    >
      <div className="flex items-center gap-4">
        <Avatar avatarUrl={previewUrl} initials={initials} size={64} />
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Profile Photo</label>
          <input
            type="file"
            name="avatar"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileChange}
            className="text-xs text-zinc-500 file:mr-2 file:rounded-md file:border-0 file:bg-zinc-100 file:px-2 file:py-1 file:text-xs file:font-medium file:text-zinc-600 hover:file:bg-zinc-200"
          />
          <p className="text-[11px] text-zinc-400">JPG/PNG/WEBP/GIF, max 3MB</p>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className={labelClass}>Name</label>
        <input
          id="name"
          name="name"
          defaultValue={profile.name}
          required
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="employeeId" className={labelClass}>Employee ID</label>
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
          Email <span className="text-zinc-400">(locked)</span>
        </label>
        <input
          id="email"
          defaultValue={profile.email}
          disabled
          className={`${fieldClass} cursor-not-allowed bg-zinc-100 text-zinc-400`}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className={labelClass}>Phone</label>
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
        {profile.pendingRole && (
          <input type="hidden" name="role" value={profile.role} />
        )}
        <select
          id="role"
          name={profile.pendingRole ? undefined : "role"}
          defaultValue={profile.pendingRole ?? profile.role}
          disabled={!!profile.pendingRole}
          className={`${fieldClass} ${profile.pendingRole ? "cursor-not-allowed bg-zinc-100 text-zinc-400" : ""}`}
        >
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
        {profile.pendingRole && (
          <p className="mt-1 text-xs text-amber-600">
            Change to {ROLE_LABELS[profile.pendingRole]} is pending Admin approval.
          </p>
        )}
        {profile.role !== "ADMIN" && !profile.pendingRole && (
          <p className="mt-1 text-[11px] text-zinc-400">
            Changing your role requires Admin approval before it takes effect.
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && !error && (
        <p className="text-sm text-emerald-600">
          {roleChangeRequested
            ? "Profile updated. Your role change request has been sent to Admin for approval."
            : "Profile updated successfully."}
        </p>
      )}

      <div className="mt-2 flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
