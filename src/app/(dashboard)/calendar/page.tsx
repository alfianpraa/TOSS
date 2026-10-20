import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { Priority } from "@prisma/client";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_CHIPS = 3;

const CHIP: Record<Priority, string> = {
  HIGH: "bg-red-100 text-red-700 hover:bg-red-200",
  MEDIUM: "bg-sky-100 text-sky-700 hover:bg-sky-200",
  LOW: "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
};

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const now = new Date();
  const match = month?.match(/^(\d{4})-(\d{2})$/);
  const year = match ? Number(match[1]) : now.getFullYear();
  const monthIndex = match ? Math.min(Math.max(Number(match[2]) - 1, 0), 11) : now.getMonth();

  const first = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const weeks = Math.ceil((offset + daysInMonth) / 7);
  const gridStart = new Date(year, monthIndex, 1 - offset);
  const gridEnd = new Date(year, monthIndex, 1 - offset + weeks * 7);

  const cards = await prisma.card.findMany({
    where: { dueDate: { gte: gridStart, lt: gridEnd } },
    select: {
      id: true,
      title: true,
      priority: true,
      status: true,
      dueDate: true,
      assignedDeveloper: { select: { name: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  const byDay = new Map<string, typeof cards>();
  for (const card of cards) {
    const key = ymd(card.dueDate!);
    byDay.set(key, [...(byDay.get(key) ?? []), card]);
  }

  const days = Array.from({ length: weeks * 7 }, (_, i) => {
    return new Date(year, monthIndex, 1 - offset + i);
  });

  const prev = monthKey(new Date(year, monthIndex - 1, 1));
  const next = monthKey(new Date(year, monthIndex + 1, 1));
  const todayKey = ymd(now);
  const inMonthCount = cards.filter((c) => c.dueDate!.getMonth() === monthIndex).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Calendar</h1>
          <p className="text-sm text-zinc-500">
            Lead deadlines by date · {inMonthCount} due this month
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/calendar?month=${prev}`}
            aria-label="Previous month"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <p className="min-w-36 text-center text-sm font-semibold text-zinc-900">
            {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(first)}
          </p>
          <Link
            href={`/calendar?month=${next}`}
            aria-label="Next month"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            href="/calendar"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            Today
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase text-zinc-500">
            {DAY_NAMES.map((d) => (
              <div key={d} className="px-3 py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = ymd(day);
              const inMonth = day.getMonth() === monthIndex;
              const items = byDay.get(key) ?? [];
              return (
                <div
                  key={key}
                  className={`min-h-28 border-b border-r border-zinc-100 p-1.5 ${
                    inMonth ? "bg-white" : "bg-zinc-50/60"
                  }`}
                >
                  <span
                    className={`mb-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-medium ${
                      key === todayKey
                        ? "bg-brand-dark text-white"
                        : inMonth
                          ? "text-zinc-700"
                          : "text-zinc-300"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  <div className="flex flex-col gap-1">
                    {items.slice(0, MAX_CHIPS).map((card) => {
                      const closed = card.status === "DONE" || card.status === "CANCELLED";
                      return (
                        <Link
                          key={card.id}
                          href={`/cards/${card.id}`}
                          title={`${card.title}${card.assignedDeveloper ? ` · ${card.assignedDeveloper.name}` : ""}`}
                          className={`truncate rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors ${CHIP[card.priority]} ${
                            closed ? "line-through opacity-50" : ""
                          }`}
                        >
                          {card.title}
                        </Link>
                      );
                    })}
                    {items.length > MAX_CHIPS && (
                      <span className="px-1.5 text-[11px] text-zinc-400">
                        +{items.length - MAX_CHIPS} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-red-300" /> High
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-sky-300" /> Medium
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-zinc-300" /> Low
        </span>
        <span>Struck-through = Done or Cancelled</span>
      </div>
    </div>
  );
}
