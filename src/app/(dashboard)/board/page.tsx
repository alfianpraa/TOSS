import { Inbox, Clock, CheckCircle2 } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Board } from "@/components/board/Board";
import { WelcomeHeader } from "@/components/board/WelcomeHeader";
import { StatsRow } from "@/components/board/StatsRow";
import { LeadFilters } from "@/components/board/LeadFilters";
import { buildCardWhere, type CardFilterParams } from "@/lib/cardFilters";
import { canCreateCard } from "@/lib/permissions";
import { getInitials } from "@/lib/initials";
import type { Role } from "@prisma/client";

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<CardFilterParams>;
}) {
  const filters = await searchParams;
  const session = await auth();
  const user = session!.user;
  const role = user.role as Role;

  const [cards, salesUsers, developers, leadBaruCount, dikerjakanCount, selesaiCount, currentUser] =
    await Promise.all([
      prisma.card.findMany({
        where: buildCardWhere(filters),
        include: {
          createdBy: { select: { id: true, name: true } },
          salesOwner: { select: { id: true, name: true } },
          pendingSales: { select: { id: true, name: true } },
          assignedDeveloper: { select: { id: true, name: true } },
          pendingDeveloper: { select: { id: true, name: true } },
          _count: { select: { activities: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findMany({
        where: { role: "SALES" },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.user.findMany({
        where: { role: "DEVELOPER" },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.card.count({ where: { status: "NEW_LEAD" } }),
      prisma.card.count({ where: { status: "IN_PROGRESS" } }),
      prisma.card.count({ where: { status: "DONE" } }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { avatarUrl: true },
      }),
    ]);

  const initials = user.name ? getInitials(user.name) : "";

  return (
    <div className="flex flex-col gap-6">
      <WelcomeHeader
        name={user.name ?? ""}
        initials={initials}
        avatarUrl={currentUser?.avatarUrl ?? null}
        subtitle={`You have ${leadBaruCount} new lead(s) and ${dikerjakanCount} project(s) in progress.`}
      />

      <StatsRow
        stats={[
          {
            label: "New Leads",
            value: String(leadBaruCount),
            hint: "Awaiting claim",
            icon: Inbox,
            color: "sky",
          },
          {
            label: "In Progress",
            value: String(dikerjakanCount),
            hint: "Currently ongoing",
            icon: Clock,
            color: "amber",
          },
          {
            label: "Completed",
            value: String(selesaiCount),
            hint: "Projects completed",
            icon: CheckCircle2,
            color: "emerald",
          },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Lead & Project Board</h2>
          <p className="text-sm text-zinc-500">
            Track the lead journey from intake to completion.
          </p>
        </div>
      </div>

      <LeadFilters basePath="/board" developers={developers} />

      <Board
        cards={cards}
        currentUserId={session!.user.id}
        role={role}
        canCreate={canCreateCard(role)}
        salesUsers={salesUsers}
      />
    </div>
  );
}
