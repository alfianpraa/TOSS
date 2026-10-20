import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ACTIVITY_TYPE_LABELS } from "@/lib/permissions";
import type { ActivityType, CardStatus } from "@prisma/client";

const RANGES = [
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "365d", label: "Last 12 months", days: 365 },
  { key: "all", label: "All time", days: null },
] as const;

const STATUS_META: Record<CardStatus, { label: string; bar: string }> = {
  NEW_LEAD: { label: "New Lead", bar: "bg-sky-500" },
  IN_PROGRESS: { label: "In Progress", bar: "bg-amber-500" },
  DONE: { label: "Done", bar: "bg-emerald-500" },
  CANCELLED: { label: "Cancelled", bar: "bg-zinc-400" },
};

const DAY_MS = 24 * 60 * 60 * 1000;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
    notation: value >= 1_000_000 ? "compact" : "standard",
  }).format(value);
}

function avgDays(cards: { createdAt: Date; updatedAt: Date }[]) {
  if (cards.length === 0) return null;
  const total = cards.reduce(
    (sum, c) => sum + (c.updatedAt.getTime() - c.createdAt.getTime()) / DAY_MS,
    0
  );
  return total / cards.length;
}

function formatDays(value: number | null) {
  return value === null ? "-" : `${value.toFixed(1)} d`;
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-zinc-900">{value}</p>
      <p className="mt-1 text-xs text-zinc-400">{hint}</p>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      {subtitle && <p className="text-xs text-zinc-400">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = RANGES.find((r) => r.key === params.range) ?? RANGES[1];
  const since = range.days ? new Date(Date.now() - range.days * DAY_MS) : null;

  const now = new Date();
  const monthStarts = Array.from({ length: 6 }, (_, i) => {
    return new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
  });

  const [cards, trendCards, offerAgg, activityGroups] = await Promise.all([
    prisma.card.findMany({
      where: since ? { createdAt: { gte: since } } : {},
      select: {
        status: true,
        createdAt: true,
        updatedAt: true,
        createdBy: { select: { id: true, name: true } },
        salesOwner: { select: { id: true, name: true } },
        assignedDeveloper: { select: { id: true, name: true } },
      },
    }),
    prisma.card.findMany({
      where: { createdAt: { gte: monthStarts[0] } },
      select: { createdAt: true },
    }),
    prisma.activity.aggregate({
      where: { type: "MARKETING_OFFER", ...(since ? { createdAt: { gte: since } } : {}) },
      _sum: { offerAmount: true },
      _count: true,
    }),
    prisma.activity.groupBy({
      by: ["type"],
      where: since ? { createdAt: { gte: since } } : {},
      _count: true,
    }),
  ]);

  const total = cards.length;
  const byStatus = (Object.keys(STATUS_META) as CardStatus[]).map((status) => ({
    status,
    count: cards.filter((c) => c.status === status).length,
  }));
  const doneCards = cards.filter((c) => c.status === "DONE");
  const completionRate = total > 0 ? (doneCards.length / total) * 100 : 0;
  const offerTotal = offerAgg._sum.offerAmount ? Number(offerAgg._sum.offerAmount) : 0;

  const trend = monthStarts.map((start) => {
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    return {
      label: new Intl.DateTimeFormat("en-US", { month: "short" }).format(start),
      count: trendCards.filter((c) => c.createdAt >= start && c.createdAt < end).length,
    };
  });
  const trendMax = Math.max(1, ...trend.map((t) => t.count));

  const developerRows = new Map<string, { name: string; cards: typeof cards }>();
  const salesRows = new Map<string, { name: string; cards: typeof cards }>();
  for (const card of cards) {
    if (card.assignedDeveloper) {
      const row = developerRows.get(card.assignedDeveloper.id) ?? {
        name: card.assignedDeveloper.name,
        cards: [],
      };
      row.cards.push(card);
      developerRows.set(card.assignedDeveloper.id, row);
    }
    const owner = card.salesOwner;
    if (owner) {
      const sales = salesRows.get(owner.id) ?? { name: owner.name, cards: [] };
      sales.cards.push(card);
      salesRows.set(owner.id, sales);
    }
  }
  const developers = [...developerRows.values()].sort((a, b) => b.cards.length - a.cards.length);
  const salesPeople = [...salesRows.values()].sort((a, b) => b.cards.length - a.cards.length);

  const activityRows = activityGroups
    .map((g) => ({ type: g.type as ActivityType, count: g._count }))
    .sort((a, b) => b.count - a.count);
  const activityTotal = activityRows.reduce((s, r) => s + r.count, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Reports</h1>
          <p className="text-sm text-zinc-500">
            Lead pipeline, team performance, and activity summary.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-zinc-200 bg-white p-1">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={`/reports?range=${r.key}`}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                r.key === range.key
                  ? "bg-brand-dark text-white"
                  : "text-zinc-500 hover:bg-zinc-100"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total Leads" value={String(total)} hint={range.label} />
        <Kpi
          label="Completion Rate"
          value={`${completionRate.toFixed(0)}%`}
          hint={`${doneCards.length} of ${total} leads done`}
        />
        <Kpi
          label="Avg. Time to Complete"
          value={formatDays(avgDays(doneCards))}
          hint="From created to done"
        />
        <Kpi
          label="Total Offers"
          value={formatCurrency(offerTotal)}
          hint={`${offerAgg._count} offer(s) sent`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Leads by Status" subtitle={range.label}>
          {total === 0 ? (
            <p className="text-sm text-zinc-400">No leads in this period.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {byStatus.map(({ status, count }) => {
                const pct = (count / total) * 100;
                return (
                  <li key={status}>
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-zinc-700">{STATUS_META[status].label}</span>
                      <span className="text-zinc-500">
                        {count} · {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-zinc-100">
                      <div
                        className={`h-2 rounded-full ${STATUS_META[status].bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Leads Created per Month" subtitle="Last 6 months">
          <div className="flex items-end gap-3">
            {trend.map((t) => (
              <div key={t.label} className="flex flex-1 flex-col items-center justify-end gap-1">
                <span className="text-xs text-zinc-500">{t.count}</span>
                <div
                  className="w-full rounded-t bg-brand-dark"
                  style={{ height: t.count > 0 ? Math.max(Math.round((t.count / trendMax) * 120), 4) : 0 }}
                />
                <span className="border-t border-zinc-200 pt-1 text-xs text-zinc-400 w-full text-center">
                  {t.label}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Developer Performance" subtitle="Leads assigned in this period">
          {developers.length === 0 ? (
            <p className="text-sm text-zinc-400">No assigned leads in this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-zinc-400">
                  <tr>
                    <th className="pb-2 font-medium">Developer</th>
                    <th className="pb-2 font-medium">Assigned</th>
                    <th className="pb-2 font-medium">Active</th>
                    <th className="pb-2 font-medium">Done</th>
                    <th className="pb-2 font-medium">Avg. time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {developers.map((d) => {
                    const done = d.cards.filter((c) => c.status === "DONE");
                    return (
                      <tr key={d.name}>
                        <td className="py-2 font-medium text-zinc-900">{d.name}</td>
                        <td className="py-2 text-zinc-600">{d.cards.length}</td>
                        <td className="py-2 text-zinc-600">
                          {d.cards.filter((c) => c.status === "IN_PROGRESS").length}
                        </td>
                        <td className="py-2 text-zinc-600">{done.length}</td>
                        <td className="py-2 text-zinc-600">{formatDays(avgDays(done))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Sales Performance" subtitle="Leads created in this period">
          {salesPeople.length === 0 ? (
            <p className="text-sm text-zinc-400">No leads in this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-zinc-400">
                  <tr>
                    <th className="pb-2 font-medium">Created by</th>
                    <th className="pb-2 font-medium">Leads</th>
                    <th className="pb-2 font-medium">Done</th>
                    <th className="pb-2 font-medium">Cancelled</th>
                    <th className="pb-2 font-medium">Win rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {salesPeople.map((s) => {
                    const done = s.cards.filter((c) => c.status === "DONE").length;
                    const cancelled = s.cards.filter((c) => c.status === "CANCELLED").length;
                    const closed = done + cancelled;
                    return (
                      <tr key={s.name}>
                        <td className="py-2 font-medium text-zinc-900">{s.name}</td>
                        <td className="py-2 text-zinc-600">{s.cards.length}</td>
                        <td className="py-2 text-zinc-600">{done}</td>
                        <td className="py-2 text-zinc-600">{cancelled}</td>
                        <td className="py-2 text-zinc-600">
                          {closed > 0 ? `${((done / closed) * 100).toFixed(0)}%` : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Activity Breakdown" subtitle={`${activityTotal} report(s) and updates · ${range.label}`}>
        {activityRows.length === 0 ? (
          <p className="text-sm text-zinc-400">No activity in this period.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activityRows.map((r) => (
              <li
                key={r.type}
                className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm"
              >
                <span className="text-zinc-600">{ACTIVITY_TYPE_LABELS[r.type]}</span>
                <span className="font-semibold text-zinc-900">{r.count}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
