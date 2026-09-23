import { ACTIVITY_TYPE_LABELS, ROLE_LABELS } from "@/lib/permissions";
import type { ActivityWithAuthor } from "@/lib/types";
import type { Role } from "@prisma/client";

const TYPE_BADGE: Record<string, string> = {
  SALES_UPDATE: "bg-sky-100 text-sky-700",
  DEV_PROGRESS: "bg-amber-100 text-amber-700",
  MARKETING_OFFER: "bg-violet-100 text-violet-700",
  STATUS_CHANGE: "bg-zinc-200 text-zinc-600",
  NOTE: "bg-zinc-100 text-zinc-600",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
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

export function ActivityTimeline({
  activities,
}: {
  activities: ActivityWithAuthor[];
}) {
  if (activities.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-400">
        Belum ada laporan.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {activities
        .slice()
        .reverse()
        .map((activity) => (
          <li
            key={activity.id}
            className="rounded-lg border border-zinc-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    TYPE_BADGE[activity.type] ?? "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {ACTIVITY_TYPE_LABELS[activity.type]}
                </span>
                <span className="text-xs text-zinc-400">
                  {activity.author.name} · {ROLE_LABELS[activity.author.role as Role]}
                </span>
              </div>
              <span className="text-xs text-zinc-400">
                {formatDate(activity.createdAt)}
              </span>
            </div>

            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">
              {activity.content}
            </p>

            {activity.offerAmount != null && (
              <p className="mt-1 text-sm font-medium text-violet-700">
                Nilai penawaran: {formatCurrency(activity.offerAmount)}
              </p>
            )}
          </li>
        ))}
    </ul>
  );
}
