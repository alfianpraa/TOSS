import { Avatar } from "@/components/profile/Avatar";

export function WelcomeHeader({
  name,
  initials,
  avatarUrl,
  subtitle,
}: {
  name: string;
  initials: string;
  avatarUrl?: string | null;
  subtitle: string;
}) {
  const firstName = name.split(" ")[0];

  return (
    <div className="flex items-center gap-4">
      <Avatar avatarUrl={avatarUrl} initials={initials} size={48} />
      <div>
        <h1 className="text-xl font-bold text-zinc-900">
          Welcome, {firstName}!
        </h1>
        <p className="text-sm text-zinc-500">{subtitle}</p>
      </div>
    </div>
  );
}
