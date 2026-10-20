import type { CardStatus } from "@prisma/client";

export const LEAD_STATUS_SEGMENTS: {
  segment: string;
  status: CardStatus;
  label: string;
}[] = [
  { segment: "new", status: "NEW_LEAD", label: "New Leads" },
  { segment: "in-progress", status: "IN_PROGRESS", label: "In Progress" },
  { segment: "done", status: "DONE", label: "Done" },
  { segment: "cancelled", status: "CANCELLED", label: "Cancelled" },
];

export function findLeadStatusBySegment(segment: string) {
  return LEAD_STATUS_SEGMENTS.find((s) => s.segment === segment);
}
