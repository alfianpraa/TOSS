import Link from "next/link";
import type { Role } from "@prisma/client";
import { Avatar } from "./Avatar";
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

export function ProfileMenu({ profile }: { profile: ProfileData }) {
  const initials = getInitials(profile.name);

  return (
    <Link
      href="/settings/profile"
      title="Profile settings"
      className="rounded-full transition-opacity hover:opacity-80"
    >
      <Avatar avatarUrl={profile.avatarUrl} initials={initials} size={36} />
    </Link>
  );
}
