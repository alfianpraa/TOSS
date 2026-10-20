import { Briefcase, Code2, Megaphone, ShieldCheck } from "lucide-react";

const ROLES = [
  { icon: Briefcase, label: "Sales" },
  { icon: Code2, label: "Developer" },
  { icon: Megaphone, label: "Marketing" },
  { icon: ShieldCheck, label: "Admin" },
];

export function LoginHero() {
  return (
    <div className="relative hidden overflow-hidden bg-brand-dark lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:px-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full border border-brand/30"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full border border-white/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full border border-white/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-10 top-10 h-40 w-40 opacity-20 [background-image:radial-gradient(circle,white_1px,transparent_1px)] [background-size:14px_14px]"
      />

      <div className="relative flex flex-col gap-6">
        <h1 className="max-w-md text-4xl font-semibold leading-tight text-white">
          One place for leads through project completion
        </h1>
        <p className="max-w-sm text-sm leading-6 text-white/70">
          Sales opens new leads, Developers claim &amp; report progress,
          Marketing tracks and adds offers — all recorded neatly on one
          board.
        </p>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex -space-x-2">
            {ROLES.map(({ icon: Icon }, i) => (
              <span
                key={i}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-brand-dark bg-white/10 text-white"
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
          <p className="text-xs text-white/70">
            Used across teams: Sales, Developer, Marketing, Admin
          </p>
        </div>
      </div>
    </div>
  );
}
