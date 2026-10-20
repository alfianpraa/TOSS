import { AlarmClock, BellRing, Briefcase, Inbox, PenLine } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LeadRow } from "@/components/leads/LeadRow";
import type { Priority } from "@prisma/client";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const PRIORITY_ORDER: Record<Priority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

function Section({
  title,
  hint,
  icon: Icon,
  tone,
  cards,
}: {
  title: string;
  hint: string;
  icon: typeof BellRing;
  tone: string;
  cards: React.ComponentProps<typeof LeadRow>["card"][];
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3">
        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
          <p className="text-xs text-zinc-400">{hint}</p>
        </div>
        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
          {cards.length}
        </span>
      </div>
      {cards.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-zinc-400">Nothing here.</p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {cards.map((card) => (
            <LeadRow key={card.id} card={card} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function MyLeadsPage() {
  const session = await auth();
  const userId = session!.user.id;
  const role = session!.user.role;
  const isDeveloper = role === "DEVELOPER";
  const canPickUp = role === "SALES" || role === "ADMIN";

  const cards = await prisma.card.findMany({
    where: {
      OR: [
        { pendingDeveloperId: userId },
        { assignedDeveloperId: userId },
        { createdById: userId },
        { salesOwnerId: userId },
        { pendingSalesId: userId },
        ...(canPickUp ? [{ salesOwnerId: null, status: "NEW_LEAD" as const }] : []),
      ],
    },
    include: {
      createdBy: { select: { name: true } },
      assignedDeveloper: { select: { name: true } },
    },
  });

  const isOpen = (s: string) => s === "NEW_LEAD" || s === "IN_PROGRESS";
  const byPriorityThenDue = (a: (typeof cards)[number], b: (typeof cards)[number]) =>
    PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
    (a.dueDate?.getTime() ?? Infinity) - (b.dueDate?.getTime() ?? Infinity);

  const awaiting = cards.filter(
    (c) => c.pendingDeveloperId === userId || c.pendingSalesId === userId
  );
  const isMine = (c: (typeof cards)[number]) =>
    c.salesOwnerId === userId || (c.createdById === userId && !c.salesOwnerId);
  const unassigned = canPickUp
    ? cards.filter((c) => !c.salesOwnerId && !c.pendingSalesId && c.status === "NEW_LEAD")
    : [];
  const needsApproval = cards.filter((c) => c.pendingStatus && c.salesOwnerId === userId);
  const attentionLimit = Date.now() + WEEK_MS;
  const dueSoon = cards
    .filter(
      (c) =>
        isOpen(c.status) &&
        c.pendingDeveloperId !== userId &&
        c.dueDate &&
        c.dueDate.getTime() <= attentionLimit &&
        (c.assignedDeveloperId === userId || isMine(c) || c.createdById === userId)
    )
    .sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime());
  const assigned = cards
    .filter((c) => c.assignedDeveloperId === userId && isOpen(c.status))
    .sort(byPriorityThenDue);
  const created = cards
    .filter((c) => (isMine(c) || c.createdById === userId) && isOpen(c.status))
    .sort(byPriorityThenDue);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">My Leads</h1>
        <p className="text-sm text-zinc-500">
          Everything that needs your attention, in one place.
        </p>
      </div>

      {awaiting.length > 0 && (
        <Section
          title="Awaiting your response"
          hint="Open a lead to accept or decline the hand-over."
          icon={BellRing}
          tone="bg-amber-100 text-amber-600"
          cards={awaiting}
        />
      )}

      {unassigned.length > 0 && (
        <Section
          title="Waiting for a Sales"
          hint="Leads from Marketing nobody has picked up yet. Open one and tap Pick Up Lead."
          icon={Inbox}
          tone="bg-orange-100 text-orange-600"
          cards={unassigned}
        />
      )}

      {needsApproval.length > 0 && (
        <Section
          title="Needs your approval"
          hint="A developer asked to set these leads to Done or Cancelled."
          icon={BellRing}
          tone="bg-violet-100 text-violet-600"
          cards={needsApproval}
        />
      )}

      <Section
        title="Due soon & overdue"
        hint="Open leads with a deadline within 7 days or already past."
        icon={AlarmClock}
        tone="bg-red-100 text-red-600"
        cards={dueSoon}
      />

      <Section
        title="Assigned to me"
        hint="Open leads you are working on."
        icon={Briefcase}
        tone="bg-emerald-100 text-emerald-600"
        cards={assigned}
      />

      {!isDeveloper && (
        <Section
          title="Created or handled by me"
          hint="Open leads you opened or that were handed over to you."
          icon={PenLine}
          tone="bg-sky-100 text-sky-600"
          cards={created}
        />
      )}
    </div>
  );
}
