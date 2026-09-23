import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/profile/Avatar";
import { ROLE_LABELS } from "@/lib/permissions";
import { getInitials } from "@/lib/initials";
import { EditUserDialog } from "@/components/admin/EditUserDialog";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      employeeId: true,
      phone: true,
      avatarUrl: true,
    },
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">User</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">ID Karyawan</th>
            <th className="px-4 py-3 font-medium">No. HP</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="flex items-center gap-3 px-4 py-3">
                <Avatar
                  avatarUrl={user.avatarUrl}
                  initials={getInitials(user.name)}
                  size={32}
                />
                <div>
                  <p className="font-medium text-zinc-900">{user.name}</p>
                  <p className="text-xs text-zinc-500">{user.email}</p>
                </div>
              </td>
              <td className="px-4 py-3 text-zinc-600">
                {ROLE_LABELS[user.role]}
              </td>
              <td className="px-4 py-3 text-zinc-600">
                {user.employeeId || "-"}
              </td>
              <td className="px-4 py-3 text-zinc-600">{user.phone || "-"}</td>
              <td className="px-4 py-3 text-right">
                <EditUserDialog user={user} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
