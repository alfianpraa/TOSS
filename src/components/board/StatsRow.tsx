type Stat = {
  label: string;
  value: string;
  hint: string;
};

export function StatsRow({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-zinc-200 bg-white p-4"
        >
          <p className="text-xs font-medium text-zinc-500">{stat.label}</p>
          <p className="mt-2 text-2xl font-bold text-zinc-900">{stat.value}</p>
          <p className="mt-1 text-xs text-zinc-400">{stat.hint}</p>
        </div>
      ))}
    </div>
  );
}
