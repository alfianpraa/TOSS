"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/security", label: "Security" },
];

export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 border-b border-zinc-200">
      {TABS.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "border-brand text-brand"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
