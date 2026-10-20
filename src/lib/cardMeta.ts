import type { CardStatus, Priority } from "@prisma/client";

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const PRIORITY_BADGE: Record<Priority, string> = {
  LOW: "bg-zinc-100 text-zinc-600",
  MEDIUM: "bg-sky-100 text-sky-700",
  HIGH: "bg-red-100 text-red-700",
};

// Bolder styling for board cards, so priority reads at a glance.
export const PRIORITY_CARD: Record<Priority, { badge: string; border: string }> = {
  HIGH: { badge: "bg-red-600 text-white", border: "border-l-red-500" },
  MEDIUM: { badge: "bg-sky-500 text-white", border: "border-l-sky-400" },
  LOW: { badge: "bg-zinc-200 text-zinc-700", border: "border-l-zinc-300" },
};

const DAY_MS = 24 * 60 * 60 * 1000;

export type DueState = "none" | "overdue" | "soon" | "ok" | "closed";

export function getDueState(dueDate: Date | null, status: CardStatus): DueState {
  if (!dueDate) return "none";
  if (status === "DONE" || status === "CANCELLED") return "closed";
  const diff = dueDate.getTime() - Date.now();
  if (diff < 0) return "overdue";
  if (diff <= DAY_MS) return "soon";
  return "ok";
}

export const DUE_CHIP: Record<DueState, string> = {
  none: "",
  closed: "bg-zinc-100 text-zinc-500",
  ok: "bg-zinc-100 text-zinc-600",
  soon: "bg-amber-100 text-amber-700",
  overdue: "bg-red-100 text-red-700",
};

export function formatDueDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

export function toDateInputValue(date: Date | null) {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Date-only input -> end of that local day, so a card is "overdue" only after the day passes.
export function parseDueDateInput(value: FormDataEntryValue | null): Date | null {
  if (typeof value !== "string" || !value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 23, 59, 59);
}
