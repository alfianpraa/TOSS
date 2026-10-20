import type { Activity, Card, CardFile, User } from "@prisma/client";

export type CardWithRelations = Card & {
  createdBy: Pick<User, "id" | "name">;
  salesOwner: Pick<User, "id" | "name"> | null;
  pendingSales: Pick<User, "id" | "name"> | null;
  assignedDeveloper: Pick<User, "id" | "name"> | null;
  pendingDeveloper: Pick<User, "id" | "name"> | null;
  _count: { activities: number };
};

export type ActivityFile = Pick<
  CardFile,
  "id" | "filename" | "storedName" | "mimeType" | "size"
>;

export type ActivityReply = Activity & {
  author: Pick<User, "id" | "name" | "role" | "avatarUrl">;
  files: ActivityFile[];
};

export type ActivityWithAuthor = Activity & {
  author: Pick<User, "id" | "name" | "role" | "avatarUrl">;
  files: ActivityFile[];
  replies: ActivityReply[];
};

export type CardWithActivities = Card & {
  createdBy: Pick<User, "id" | "name">;
  assignedDeveloper: Pick<User, "id" | "name"> | null;
  activities: ActivityWithAuthor[];
};
