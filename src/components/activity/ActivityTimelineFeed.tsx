import Link from "next/link";
import type { ActivityType, Role } from "@prisma/client";
import { Avatar } from "@/components/profile/Avatar";
import { getInitials } from "@/lib/initials";
import { ACTIVITY_TYPE_LABELS, ROLE_LABELS } from "@/lib/permissions";

const TYPE_DOT: Record<ActivityType, string> = {
  SALES_UPDATE: "bg-sky-500",
  DEV_PROGRESS: "bg-amber-500",
  MARKETING_OFFER: "bg-violet-500",
  STATUS_CHANGE: "bg-zinc-400",
  NOTE: "bg-zinc-400",
};

const TYPE_BADGE: Record<ActivityType, string> = {
  SALES_UPDATE: "bg-sky-100 text-sky-700",
  DEV_PROGRESS: "bg-amber-100 text-amber-700",
  MARKETING_OFFER: "bg-violet-100 text-violet-700",
  STATUS_CHANGE: "bg-zinc-200 text-zinc-600",
  NOTE: "bg-zinc-100 text-zinc-600",
};

export type FeedEntry = {
  id: string;
  type: ActivityType;
  content: string;
  offerAmount: unknown;
  createdAt: Date;
  author: { id: string; name: string; role: Role; avatarUrl: string | null };
  card: { id: string; title: string };
};

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { timeStyle: "short" }).format(date);
}

function formatCurrency(value: unknown) {
  if (value == null) return null;
  const num = Number(String(value));
  if (Number.isNaN(num)) return null;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

function dateGroupLabel(date: Date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return "Hari ini";
  if (isSameDay(date, yesterday)) return "Kemarin";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function ActivityTimelineFeed({ entries }: { entries: FeedEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-400">
        Tidak ada aktivitas untuk filter ini.
      </p>
    );
  }

  const groups: { label: string; items: FeedEntry[] }[] = [];
  for (const entry of entries) {
    const label = dateGroupLabel(entry.createdAt);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.label === label) {
      lastGroup.items.push(entry);
    } else {
      groups.push({ label, items: [entry] });
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            {group.label}
          </p>

          <div className="relative flex flex-col gap-6 border-l border-zinc-200 pl-6">
            {group.items.map((entry) => (
              <div key={entry.id} className="relative">
                <span
                  className={`absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white ${TYPE_DOT[entry.type]}`}
                />

                <div className="flex items-start gap-3">
                  <Avatar
                    avatarUrl={entry.author.avatarUrl}
                    initials={getInitials(entry.author.name)}
                    size={32}
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-zinc-900">
                        {entry.author.name}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {ROLE_LABELS[entry.author.role]}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[entry.type]}`}
                      >
                        {ACTIVITY_TYPE_LABELS[entry.type]}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {formatTime(entry.createdAt)}
                      </span>
                    </div>

                    <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">
                      {entry.content}
                    </p>

                    {entry.offerAmount != null && (
                      <p className="mt-1 text-sm font-medium text-violet-700">
                        Nilai penawaran: {formatCurrency(entry.offerAmount)}
                      </p>
                    )}

                    <Link
                      href={`/cards/${entry.card.id}`}
                      className="mt-1 inline-block text-xs font-medium text-brand hover:underline"
                    >
                      {entry.card.title} →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
