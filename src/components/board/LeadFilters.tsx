"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

const fieldClass =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/20";

export function LeadFilters({
  basePath,
  developers,
}: {
  basePath: string;
  developers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const first = useRef(true);

  function push(next: URLSearchParams) {
    const qs = next.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    push(params);
  }

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (q.trim()) params.set("q", q.trim());
      else params.delete("q");
      push(params);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const hasFilters = ["q", "developer", "priority", "due"].some((k) => searchParams.get(k));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title, client, description..."
          className={`${fieldClass} w-full pl-9`}
        />
      </div>

      <select
        value={searchParams.get("developer") ?? ""}
        onChange={(e) => setParam("developer", e.target.value)}
        className={fieldClass}
      >
        <option value="">All developers</option>
        <option value="none">Unassigned</option>
        {developers.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get("priority") ?? ""}
        onChange={(e) => setParam("priority", e.target.value)}
        className={fieldClass}
      >
        <option value="">All priorities</option>
        <option value="HIGH">High</option>
        <option value="MEDIUM">Medium</option>
        <option value="LOW">Low</option>
      </select>

      <select
        value={searchParams.get("due") ?? ""}
        onChange={(e) => setParam("due", e.target.value)}
        className={fieldClass}
      >
        <option value="">Any deadline</option>
        <option value="overdue">Overdue</option>
        <option value="week">Due in 7 days</option>
        <option value="none">No deadline</option>
      </select>

      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            router.push(basePath);
          }}
          className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-zinc-500 underline hover:text-zinc-800"
        >
          <X className="h-3 w-3" />
          Reset
        </button>
      )}
    </div>
  );
}
