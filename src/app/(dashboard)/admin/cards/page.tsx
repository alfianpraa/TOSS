import { prisma } from "@/lib/prisma";
import { EditCardDialog } from "@/components/admin/EditCardDialog";

const STATUS_LABELS: Record<string, string> = {
  NEW_LEAD: "Lead Baru",
  IN_PROGRESS: "Dikerjakan",
  DONE: "Selesai",
  CANCELLED: "Batal",
};

const STATUS_BADGE: Record<string, string> = {
  NEW_LEAD: "bg-sky-100 text-sky-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  DONE: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-zinc-200 text-zinc-600",
};

export default async function AdminCardsPage() {
  const [cards, developers] = await Promise.all([
    prisma.card.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, name: true } },
        assignedDeveloper: { select: { id: true, name: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "DEVELOPER" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Card</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Dibuat oleh</th>
            <th className="px-4 py-3 font-medium">Developer</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {cards.map((card) => (
            <tr key={card.id}>
              <td className="px-4 py-3">
                <p className="font-medium text-zinc-900">{card.title}</p>
                <p className="text-xs text-zinc-500">{card.clientName}</p>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[card.status]}`}
                >
                  {STATUS_LABELS[card.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-zinc-600">{card.createdBy.name}</td>
              <td className="px-4 py-3 text-zinc-600">
                {card.assignedDeveloper?.name ?? "-"}
              </td>
              <td className="px-4 py-3 text-right">
                <EditCardDialog card={card} developers={developers} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
