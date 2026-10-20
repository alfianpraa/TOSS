import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileSettingsForm } from "@/components/settings/ProfileSettingsForm";

export default async function ProfileSettingsPage() {
  const session = await auth();
  const profile = await prisma.user.findUniqueOrThrow({
    where: { id: session!.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      pendingRole: true,
      employeeId: true,
      phone: true,
      avatarUrl: true,
    },
  });

  return <ProfileSettingsForm profile={profile} />;
}
