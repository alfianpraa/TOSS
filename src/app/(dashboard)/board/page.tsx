import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Board } from "@/components/board/Board";
import { WelcomeHeader } from "@/components/board/WelcomeHeader";
import { StatsRow } from "@/components/board/StatsRow";
import { canCreateCard } from "@/lib/permissions";
import { getInitials } from "@/lib/initials";
import type { Role } from "@prisma/client";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
    notation: value >= 1_000_000 ? "compact" : "standard",
  }).format(value);
}

export default async function BoardPage() {
  const session = await auth();
  const user = session!.user;
  const role = user.role as Role;

  const [cards, leadBaruCount, dikerjakanCount, selesaiCount, offerAgg, currentUser] =
    await Promise.all([
      prisma.card.findMany({
        include: {
          createdBy: { select: { id: true, name: true } },
          assignedDeveloper: { select: { id: true, name: true } },
          _count: { select: { activities: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.card.count({ where: { status: "NEW_LEAD" } }),
      prisma.card.count({ where: { status: "IN_PROGRESS" } }),
      prisma.card.count({ where: { status: "DONE" } }),
      prisma.activity.aggregate({
        where: { type: "MARKETING_OFFER" },
        _sum: { offerAmount: true },
        _count: true,
      }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { avatarUrl: true },
      }),
    ]);

  const totalOfferValue = offerAgg._sum.offerAmount
    ? Number(offerAgg._sum.offerAmount)
    : 0;

  const initials = user.name ? getInitials(user.name) : "";

  return (
    <div className="flex flex-col gap-6">
      <WelcomeHeader
        name={user.name ?? ""}
        initials={initials}
        avatarUrl={currentUser?.avatarUrl ?? null}
        subtitle={`Ada ${leadBaruCount} lead baru dan ${dikerjakanCount} project sedang berjalan.`}
      />

      <StatsRow
        stats={[
          { label: "Lead Baru", value: String(leadBaruCount), hint: "Menunggu diambil" },
          { label: "Dikerjakan", value: String(dikerjakanCount), hint: "Sedang berjalan" },
          { label: "Selesai", value: String(selesaiCount), hint: "Project rampung" },
          {
            label: "Total Penawaran",
            value: formatCurrency(totalOfferValue),
            hint: `${offerAgg._count} penawaran terkirim`,
          },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Board Lead & Project</h2>
          <p className="text-sm text-zinc-500">
            Pantau perjalanan lead dari masuk sampai selesai.
          </p>
        </div>
      </div>

      <Board
        cards={cards}
        currentUserId={session!.user.id}
        role={role}
        canCreate={canCreateCard(role)}
      />
    </div>
  );
}
