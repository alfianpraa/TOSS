import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { ROLE_LABELS } from "@/lib/permissions";
import { Sidebar } from "@/components/layout/Sidebar";
import { ProfileMenu } from "@/components/profile/ProfileMenu";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { SessionProviderWrapper } from "@/components/providers/SessionProviderWrapper";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;

  const profile = user
    ? await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          employeeId: true,
          phone: true,
          avatarUrl: true,
        },
      })
    : null;

  return (
    <SessionProviderWrapper>
      <div className="flex min-h-screen bg-zinc-50">
        <Sidebar role={(user?.role as Role) ?? "SALES"} />

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="border-b border-zinc-200 bg-white">
            <div className="flex items-center justify-between px-4 py-3 sm:px-6">
              <Link href="/board" className="flex items-center md:hidden">
                <Image
                  src="/logo-toss.png"
                  alt="TOSS"
                  width={45}
                  height={36}
                  className="h-9 w-auto"
                  priority
                />
              </Link>
              <span className="hidden md:block" />

              <div className="flex items-center gap-3">
                {user && (
                  <div className="hidden text-right text-sm sm:block">
                    <p className="font-medium text-zinc-900">{user.name}</p>
                    <p className="text-xs text-zinc-500">
                      {ROLE_LABELS[user.role as Role]}
                    </p>
                  </div>
                )}
                {profile && <ProfileMenu profile={profile} />}
                <SignOutButton />
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
            {children}
          </main>
        </div>
      </div>
    </SessionProviderWrapper>
  );
}
