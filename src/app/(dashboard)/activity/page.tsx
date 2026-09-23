import type { ActivityType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ActivityFilters } from "@/components/activity/ActivityFilters";
import { ActivityTimelineFeed } from "@/components/activity/ActivityTimelineFeed";

const ACTIVITY_TYPES: ActivityType[] = [
  "SALES_UPDATE",
  "DEV_PROGRESS",
  "MARKETING_OFFER",
  "STATUS_CHANGE",
  "NOTE",
];

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string; type?: string }>;
}) {
  const params = await searchParams;
  const userFilter = params.user;
  const typeFilter = ACTIVITY_TYPES.includes(params.type as ActivityType)
    ? (params.type as ActivityType)
    : undefined;

  const [entries, users] = await Promise.all([
    prisma.activity.findMany({
      where: {
        ...(userFilter ? { authorId: userFilter } : {}),
        ...(typeFilter ? { type: typeFilter } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 150,
      include: {
        author: { select: { id: true, name: true, role: true, avatarUrl: true } },
        card: { select: { id: true, title: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">Aktivitas</h1>
        <p className="text-sm text-zinc-500">
          Timeline seluruh laporan dan perkembangan dari semua user.
        </p>
      </div>

      <ActivityFilters users={users} />

      <ActivityTimelineFeed entries={entries} />
    </div>
  );
}
