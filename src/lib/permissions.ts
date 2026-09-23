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
  SALES_UPDATE: "Update Sales",
  DEV_PROGRESS: "Progress Developer",
  MARKETING_OFFER: "Penawaran Marketing",
  STATUS_CHANGE: "Perubahan Status",
  NOTE: "Catatan",
};

export function canCreateCard(role: Role) {
  return role === "SALES" || role === "ADMIN";
}

export function canTakeCard(role: Role) {
  return role === "DEVELOPER" || role === "ADMIN";
}

export function canChangeStatus(
  role: Role,
  userId: string,
  card: Pick<Card, "createdById" | "assignedDeveloperId">
) {
  if (role === "ADMIN") return true;
  if (role === "SALES" && card.createdById === userId) return true;
  if (role === "DEVELOPER" && card.assignedDeveloperId === userId) return true;
  return false;
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
