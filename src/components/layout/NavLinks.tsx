"use client";

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
  ChevronDown,
  ListTodo,
  ClipboardCheck,
  CalendarDays,
} from "lucide-react";
import type { Role } from "@prisma/client";
import { LEAD_STATUS_SEGMENTS } from "@/lib/leadStatus";

export const ADMIN_NAV_ITEMS = [
  { href: "/admin/users", label: "Manage Users", icon: Users },
  { href: "/admin/cards", label: "Manage Cards", icon: KanbanSquare },
];

export function NavLink({
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
      className={`group relative flex items-center overflow-hidden rounded-lg py-2 text-sm font-medium transition-colors ${
        collapsed ? "justify-center px-2" : "px-3"
      } ${
        isActive
          ? "bg-white/10 text-white"
          : "text-white/60 hover:bg-white/5 hover:text-white"
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand" />
      )}
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

export function LeadsDropdown({
  collapsed,
  isActive,
}: {
  collapsed: boolean;
  isActive: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(isActive);

  useEffect(() => {
    if (isActive) setOpen(true);
  }, [isActive]);

  if (collapsed) {
    return (
      <Link
        href="/leads/new"
        title="Leads"
        className={`group relative flex items-center justify-center overflow-hidden rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
          isActive
            ? "bg-white/10 text-white"
            : "text-white/60 hover:bg-white/5 hover:text-white"
        }`}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand" />
        )}
        <ListTodo className="h-4 w-4 shrink-0" />
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? "bg-white/10 text-white"
            : "text-white/60 hover:bg-white/5 hover:text-white"
        }`}
      >
        <ListTodo className="h-4 w-4 shrink-0" />
        <span className="ml-3 flex-1 text-left">Leads</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-1 flex flex-col gap-1 border-l border-white/10 pl-4">
          {LEAD_STATUS_SEGMENTS.map((item) => {
            const href = `/leads/${item.segment}`;
            const active = pathname === href;
            return (
              <Link
                key={item.segment}
                href={href}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// The actual menu links, shared between the desktop sidebar and the mobile drawer.
export function NavSection({ role, collapsed }: { role: Role; collapsed: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="relative mt-8 flex flex-col gap-1">
      <p
        className={`overflow-hidden whitespace-nowrap px-2 text-xs font-medium uppercase tracking-wide text-white/40 transition-[max-height,opacity,margin] duration-300 ease-in-out ${
          collapsed ? "max-h-0 opacity-0" : "max-h-5 opacity-100"
        }`}
      >
        Menu
      </p>
      <NavLink
        href="/board"
        label="Board"
        icon={LayoutGrid}
        isActive={pathname.startsWith("/board")}
        collapsed={collapsed}
      />

      <NavLink
        href="/my-leads"
        label="My Leads"
        icon={ClipboardCheck}
        isActive={pathname.startsWith("/my-leads")}
        collapsed={collapsed}
      />

      <LeadsDropdown collapsed={collapsed} isActive={pathname.startsWith("/leads")} />

      <NavLink
        href="/calendar"
        label="Calendar"
        icon={CalendarDays}
        isActive={pathname.startsWith("/calendar")}
        collapsed={collapsed}
      />

      <NavLink
        href="/activity"
        label="Activity"
        icon={History}
        isActive={pathname.startsWith("/activity")}
        collapsed={collapsed}
      />

      <NavLink
        href="/reports"
        label="Reports"
        icon={FileText}
        isActive={pathname.startsWith("/reports")}
        collapsed={collapsed}
      />

      <NavLink
        href="/settings"
        label="Settings"
        icon={Settings}
        isActive={pathname.startsWith("/settings")}
        collapsed={collapsed}
      />

      {role === "ADMIN" && (
        <>
          <p
            className={`overflow-hidden whitespace-nowrap px-2 text-xs font-medium uppercase tracking-wide text-white/40 transition-[max-height,opacity,margin] duration-300 ease-in-out ${
              collapsed ? "mt-0 max-h-0 opacity-0" : "mt-6 max-h-5 opacity-100"
            }`}
          >
            Admin
          </p>
          <div
            className={`border-t border-white/10 transition-[max-height,opacity,margin] duration-300 ease-in-out ${
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
  );
}
