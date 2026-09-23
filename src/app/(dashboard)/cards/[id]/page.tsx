import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import { allowedActivityTypes, canChangeStatus, canTakeCard } from "@/lib/permissions";
import { ActivityTimeline } from "@/components/cards/ActivityTimeline";
import { ActivityForm } from "@/components/cards/ActivityForm";
import { CardActions } from "@/components/cards/CardActions";

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const role = session!.user.role as Role;
  const userId = session!.user.id;

  const [card, developers] = await Promise.all([
    prisma.card.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true } },
        assignedDeveloper: { select: { id: true, name: true } },
        activities: {
          include: { author: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: "DEVELOPER" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!card) notFound();

  const allowedTypes = allowedActivityTypes(role, userId, card);
  const canTake =
    card.status === "NEW_LEAD" && !card.assignedDeveloperId && canTakeCard(role);
  const canManageStatus = canChangeStatus(role, userId, card);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/board" className="text-sm text-zinc-500 hover:text-zinc-800">
        ← Kembali ke board
      </Link>

      <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">{card.title}</h1>
            <p className="text-sm text-zinc-500">{card.clientName}</p>
            {card.clientContact && (
              <p className="text-xs text-zinc-400">{card.clientContact}</p>
            )}
          </div>
          <CardActions
            cardId={card.id}
            status={card.status}
            canTake={canTake}
            canManageStatus={canManageStatus}
            hasDeveloper={!!card.assignedDeveloperId}
            developers={developers}
          />
        </div>

        {card.description && (
          <p className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-600">
            {card.description}
          </p>
        )}

        <div className="flex flex-wrap gap-6 text-xs text-zinc-500">
          <span>Dibuat oleh: {card.createdBy.name}</span>
          <span>
            Developer: {card.assignedDeveloper ? card.assignedDeveloper.name : "Belum diambil"}
          </span>
          <span>Status: {card.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">
            Riwayat Laporan & Aktivitas
          </h2>
          <ActivityTimeline activities={card.activities} />
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">
            Tambah Laporan
          </h2>
          {allowedTypes.length > 0 ? (
            <ActivityForm cardId={card.id} allowedTypes={allowedTypes} />
          ) : (
            <p className="text-sm text-zinc-400">
              Anda tidak punya izin menambahkan laporan di card ini.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
