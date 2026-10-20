import { SettingsTabs } from "@/components/settings/SettingsTabs";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">Settings</h1>
        <p className="text-sm text-zinc-500">
          Manage your profile and account security.
        </p>
      </div>

      <SettingsTabs />

      <div className="max-w-xl">{children}</div>
    </div>
  );
}
