-- Leads created by an Admin are owned by that Admin (they run the Sales side themselves).
UPDATE "Card" SET "salesOwnerId" = "createdById"
WHERE "salesOwnerId" IS NULL
  AND "createdById" IN (SELECT "id" FROM "User" WHERE "role" = 'ADMIN');
