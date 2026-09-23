import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminTabs } from "@/components/admin/AdminTabs";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    redirect("/board");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">Panel Admin</h1>
        <p className="text-sm text-zinc-500">
          Kelola seluruh data user dan card di sistem.
        </p>
      </div>

      <AdminTabs />

      {children}
    </div>
  );
}
