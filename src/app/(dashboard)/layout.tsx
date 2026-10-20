import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { ROLE_LABELS } from "@/lib/permissions";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ProfileMenu } from "@/components/profile/ProfileMenu";
import { SessionProviderWrapper } from "@/components/providers/SessionProviderWrapper";
import { prisma } from "@/lib/prisma";
import { syncDeadlineNotifications } from "@/lib/notify";
import type { Role } from "@prisma/client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;

  if (user) await syncDeadlineNotifications(user.id);

  const [profile, notifications, unreadCount] = await Promise.all([
    user
      ? prisma.user.findUnique({
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
      : Promise.resolve(null),
    user
      ? prisma.notification.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      : Promise.resolve([]),
    user
      ? prisma.notification.count({ where: { userId: user.id, read: false } })
      : Promise.resolve(0),
  ]);

  return (
    <SessionProviderWrapper>
      <div className="flex min-h-screen bg-zinc-50">
        <Sidebar role={(user?.role as Role) ?? "SALES"} />

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white">
            <div className="flex items-center justify-between px-4 py-3 sm:px-6">
              <div className="flex items-center gap-2 md:hidden">
                {user && <MobileNav role={(user.role as Role) ?? "SALES"} />}
                <Link href="/board" className="flex items-center">
                  <Image
                    src="/logo-toss-v2.png"
                    alt="TOSS"
                    width={45}
                    height={36}
                    className="h-9 w-auto"
                    priority
                  />
                </Link>
              </div>
              <span className="hidden md:block" />

              <div className="flex items-center gap-3">
                {user && (
                  <NotificationBell notifications={notifications} unreadCount={unreadCount} />
                )}
                {user && (
                  <div className="hidden text-right text-sm sm:block">
                    <p className="font-medium text-zinc-900">{user.name}</p>
                    <p className="text-xs text-zinc-500">
                      {ROLE_LABELS[user.role as Role]}
                    </p>
                  </div>
                )}
                {profile && <ProfileMenu profile={profile} />}
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
