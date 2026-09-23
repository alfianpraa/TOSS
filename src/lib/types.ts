import type { Activity, Card, User } from "@prisma/client";

export type CardWithRelations = Card & {
  createdBy: Pick<User, "id" | "name">;
  assignedDeveloper: Pick<User, "id" | "name"> | null;
  _count: { activities: number };
};

export type ActivityWithAuthor = Activity & {
  author: Pick<User, "id" | "name" | "role">;
};

export type CardWithActivities = Card & {
  createdBy: Pick<User, "id" | "name">;
  assignedDeveloper: Pick<User, "id" | "name"> | null;
  activities: ActivityWithAuthor[];
};
