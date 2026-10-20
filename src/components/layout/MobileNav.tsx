"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import type { Role } from "@prisma/client";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { NavSection } from "@/components/layout/NavLinks";

export function MobileNav({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever navigation actually happens.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="cursor-pointer rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            aria-hidden
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <aside
            aria-label="Mobile navigation"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-brand-dark px-4 py-6"
          >
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border border-brand/20" />
              <div className="absolute -bottom-28 -left-16 h-56 w-56 rounded-full border border-white/10" />
            </div>

            <div className="relative flex items-center justify-between">
              <Link href="/board" className="flex items-center">
                <Image
                  src="/logo-toss-v2.png"
                  alt="TOSS"
                  width={90}
                  height={72}
                  className="h-11 w-auto shrink-0 object-contain"
                  priority
                />
                <span className="ml-3 truncate whitespace-nowrap text-sm font-semibold text-white">
                  Ticketing OSS
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="cursor-pointer rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative flex-1">
              <NavSection role={role} collapsed={false} />
            </div>

            <div className="relative mt-4 border-t border-white/10 pt-3">
              <SignOutButton collapsed={false} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
