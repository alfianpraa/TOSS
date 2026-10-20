"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Role } from "@prisma/client";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { NavSection } from "@/components/layout/NavLinks";

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

export function Sidebar({ role }: { role: Role }) {
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
      className={`sticky top-0 z-30 hidden h-screen shrink-0 flex-col bg-brand-dark py-6 transition-[width,padding] duration-300 ease-in-out md:flex ${
        collapsed ? "w-24 px-2" : "w-64 px-4"
      }`}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border border-brand/20" />
        <div className="absolute -bottom-28 -left-16 h-56 w-56 rounded-full border border-white/10" />
        <div className="absolute inset-x-0 top-0 h-40 opacity-[0.15] [background-image:radial-gradient(circle,white_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>

      <button
        type="button"
        onClick={toggleCollapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-8 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-brand text-white shadow-sm shadow-black/20 transition-colors hover:bg-orange-600"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>

      <Link
        href="/board"
        className={`relative flex items-center ${collapsed ? "justify-center" : "px-2"}`}
      >
        <Image
          src="/logo-toss-v2.png"
          alt="TOSS"
          width={90}
          height={72}
          className={`w-auto shrink-0 object-contain transition-[height] duration-300 ease-in-out ${
            collapsed ? "h-16" : "h-11"
          }`}
          priority
        />
        <span
          className={`truncate whitespace-nowrap text-sm font-semibold text-white transition-[max-width,opacity,margin-left] duration-300 ease-in-out ${
            collapsed ? "ml-0 max-w-0 opacity-0" : "ml-3 max-w-[160px] opacity-100"
          }`}
        >
          Ticketing OSS
        </span>
      </Link>

      <NavSection role={role} collapsed={collapsed} />

      <div className="relative mt-auto border-t border-white/10 pt-3">
        <SignOutButton collapsed={collapsed} />
      </div>
    </aside>
  );
}
