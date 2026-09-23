"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutGrid,
  FileText,
  Settings,
  Users,
  KanbanSquare,
  History,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Role } from "@prisma/client";

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

const NAV_ITEMS = [
  { href: "/board", label: "Board", icon: LayoutGrid },
  { href: "/activity", label: "Aktivitas", icon: History },
];

const ADMIN_NAV_ITEMS = [
  { href: "/admin/users", label: "Kelola User", icon: Users },
  { href: "/admin/cards", label: "Kelola Card", icon: KanbanSquare },
];

const SOON_ITEMS = [
  { label: "Laporan", icon: FileText },
  { label: "Pengaturan", icon: Settings },
];

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  collapsed,
}: {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  isActive: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`flex items-center overflow-hidden rounded-lg py-2 text-sm font-medium transition-colors ${
        collapsed ? "justify-center px-2" : "px-3"
      } ${
        isActive
          ? "bg-brand-dark/10 text-brand-dark"
          : "text-zinc-600 hover:bg-zinc-100"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span
        className={`truncate whitespace-nowrap transition-[max-width,opacity,margin-left] duration-300 ease-in-out ${
          collapsed ? "ml-0 max-w-0 opacity-0" : "ml-3 max-w-[160px] opacity-100"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  };

  return (
    <aside
      className={`relative hidden shrink-0 flex-col border-r border-zinc-200 bg-white py-6 transition-[width,padding] duration-300 ease-in-out md:flex ${
        collapsed ? "w-24 px-2" : "w-64 px-4"
      }`}
    >
      <button
        type="button"
        onClick={toggleCollapsed}
        aria-label={collapsed ? "Perluas sidebar" : "Perkecil sidebar"}
        className="absolute -right-3 top-8 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-700"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>

      <Link
        href="/board"
        className={`flex items-center ${collapsed ? "justify-center" : "px-2"}`}
      >
        <Image
          src="/logo-toss.png"
          alt="TOSS"
          width={90}
          height={72}
          className={`h-11 w-auto shrink-0 transition-transform duration-300 ease-in-out ${
            collapsed ? "scale-150" : "scale-100"
          }`}
          priority
        />
        <span
          className={`truncate whitespace-nowrap text-sm font-semibold text-zinc-900 transition-[max-width,opacity,margin-left] duration-300 ease-in-out ${
            collapsed ? "ml-0 max-w-0 opacity-0" : "ml-3 max-w-[160px] opacity-100"
          }`}
        >
          Ticketing OSS
        </span>
      </Link>

      <nav className="mt-8 flex flex-col gap-1">
        <p
          className={`overflow-hidden whitespace-nowrap px-2 text-xs font-medium uppercase tracking-wide text-zinc-400 transition-[max-height,opacity,margin] duration-300 ease-in-out ${
            collapsed ? "max-h-0 opacity-0" : "max-h-5 opacity-100"
          }`}
        >
          Menu
        </p>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            isActive={pathname.startsWith(item.href)}
            collapsed={collapsed}
          />
        ))}

        {SOON_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              title={collapsed ? item.label : undefined}
              className={`flex cursor-not-allowed items-center overflow-hidden rounded-lg py-2 text-sm text-zinc-400 ${
                collapsed ? "justify-center px-2" : "px-3"
              }`}
              aria-disabled
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span
                className={`flex-1 truncate whitespace-nowrap transition-[max-width,opacity,margin-left] duration-300 ease-in-out ${
                  collapsed
                    ? "ml-0 max-w-0 opacity-0"
                    : "ml-3 max-w-[100px] opacity-100"
                }`}
              >
                {item.label}
              </span>
              <span
                className={`shrink-0 whitespace-nowrap rounded-full bg-zinc-100 py-0.5 text-[10px] font-medium text-zinc-400 transition-[max-width,opacity,padding] duration-300 ease-in-out ${
                  collapsed ? "max-w-0 px-0 opacity-0" : "max-w-[60px] px-2 opacity-100"
                }`}
              >
                Segera
              </span>
            </div>
          );
        })}

        {role === "ADMIN" && (
          <>
            <p
              className={`overflow-hidden whitespace-nowrap px-2 text-xs font-medium uppercase tracking-wide text-zinc-400 transition-[max-height,opacity,margin] duration-300 ease-in-out ${
                collapsed ? "mt-0 max-h-0 opacity-0" : "mt-6 max-h-5 opacity-100"
              }`}
            >
              Admin
            </p>
            <div
              className={`border-t border-zinc-100 transition-[max-height,opacity,margin] duration-300 ease-in-out ${
                collapsed ? "my-3 max-h-5 opacity-100" : "my-0 max-h-0 opacity-0"
              }`}
            />
            {ADMIN_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                {...item}
                isActive={pathname.startsWith(item.href)}
                collapsed={collapsed}
              />
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
