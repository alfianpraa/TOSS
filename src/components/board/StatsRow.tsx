import type { LucideIcon } from "lucide-react";

type StatColor = "sky" | "amber" | "emerald" | "violet";

const COLOR_STYLES: Record<StatColor, { bg: string; text: string }> = {
  sky: { bg: "bg-sky-100", text: "text-sky-600" },
  amber: { bg: "bg-amber-100", text: "text-amber-600" },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-600" },
  violet: { bg: "bg-violet-100", text: "text-violet-600" },
};

export type Stat = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  color: StatColor;
};

export function StatsRow({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const colors = COLOR_STYLES[stat.color];
        return (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3"
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colors.bg} ${colors.text}`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-zinc-500">{stat.label}</p>
              <p className="truncate text-[11px] text-zinc-400">{stat.hint}</p>
            </div>
            <p className="shrink-0 text-lg font-bold text-zinc-900">{stat.value}</p>
          </div>
        );
      })}
    </div>
  );
}
