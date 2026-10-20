import type { ActivityType, Card, Role } from "@prisma/client";

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  SALES: "Sales",
  DEVELOPER: "Developer",
  MARKETING: "Marketing",
};

export const SELF_REGISTER_ROLES: Role[] = ["SALES", "DEVELOPER", "MARKETING"];

export function allowedRolesFor(currentRole: Role): Role[] {
  return currentRole === "ADMIN" ? ["ADMIN", ...SELF_REGISTER_ROLES] : SELF_REGISTER_ROLES;
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  SALES_UPDATE: "Sales Update",
  DEV_PROGRESS: "Developer Progress",
  MARKETING_OFFER: "Marketing Offer",
  STATUS_CHANGE: "Status Change",
  NOTE: "Note",
  REPLY: "Reply",
};

export function canCreateCard(role: Role) {
  return role === "SALES" || role === "MARKETING" || role === "ADMIN";
}

// Marketing (creator) or Admin may hand an untouched lead over to a Sales.
export function canHandOffCard(
  role: Role,
  userId: string,
  card: Pick<
    Card,
    "createdById" | "status" | "assignedDeveloperId" | "pendingDeveloperId" | "pendingSalesId"
  >
) {
  if (
    card.status !== "NEW_LEAD" ||
    card.assignedDeveloperId ||
    card.pendingDeveloperId ||
    card.pendingSalesId
  ) {
    return false;
  }
  return role === "ADMIN" || (role === "MARKETING" && card.createdById === userId);
}

// A lead without a Sales owner can be claimed by any Sales (or Admin).
export function canClaimAsSales(
  role: Role,
  card: Pick<Card, "salesOwnerId" | "pendingSalesId" | "status">
) {
  return (
    (role === "SALES" || role === "ADMIN") &&
    !card.salesOwnerId &&
    !card.pendingSalesId &&
    card.status === "NEW_LEAD"
  );
}

export function canTakeCard(role: Role) {
  return role === "DEVELOPER" || role === "ADMIN";
}

export function canChangeStatus(
  role: Role,
  userId: string,
  card: Pick<Card, "salesOwnerId" | "assignedDeveloperId">
) {
  if (role === "ADMIN") return true;
  if (role === "SALES" && card.salesOwnerId === userId) return true;
  if (role === "DEVELOPER" && card.assignedDeveloperId === userId) return true;
  return false;
}

export function canEditCardMeta(
  role: Role,
  userId: string,
  card: Pick<Card, "salesOwnerId">
) {
  if (role === "ADMIN") return true;
  return role === "SALES" && card.salesOwnerId === userId;
}

export function allowedActivityTypes(
  role: Role,
  userId: string,
  card: Pick<Card, "assignedDeveloperId">
): ActivityType[] {
  const types: ActivityType[] = ["NOTE"];
  if (role === "ADMIN") {
    types.push("SALES_UPDATE", "DEV_PROGRESS", "MARKETING_OFFER");
    return types;
  }
  if (role === "SALES") types.push("SALES_UPDATE");
  if (role === "DEVELOPER" && card.assignedDeveloperId === userId)
    types.push("DEV_PROGRESS");
  if (role === "MARKETING") types.push("MARKETING_OFFER");
  return types;
}
