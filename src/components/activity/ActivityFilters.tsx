"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ActivityType } from "@prisma/client";
import { ACTIVITY_TYPE_LABELS } from "@/lib/permissions";

const fieldClass =
  "rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/20";

export function ActivityFilters({
  users,
}: {
  users: { id: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/activity?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={searchParams.get("user") ?? ""}
        onChange={(e) => updateParam("user", e.target.value)}
        className={fieldClass}
      >
        <option value="">All Users</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get("type") ?? ""}
        onChange={(e) => updateParam("type", e.target.value)}
        className={fieldClass}
      >
        <option value="">All Types</option>
        {(Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[]).map((type) => (
          <option key={type} value={type}>
            {ACTIVITY_TYPE_LABELS[type]}
          </option>
        ))}
      </select>

      {(searchParams.get("user") || searchParams.get("type")) && (
        <button
          type="button"
          onClick={() => router.push("/activity")}
          className="cursor-pointer text-xs font-medium text-zinc-500 underline hover:text-zinc-800"
        >
          Reset filter
        </button>
      )}
    </div>
  );
}
