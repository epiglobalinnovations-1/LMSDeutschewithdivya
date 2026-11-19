import type { Metadata } from "next";
import { PageTitle } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { PasswordForm, ProfileForm } from "./settings-forms";

export const metadata: Metadata = { title: "Profile and settings" };

export default async function SettingsPage() {
  const user = await requireUser("/app/settings");
  const p = user.profile;
  return (
    <>
      <PageTitle eyebrow="Account" title="Profile and settings">
        Signed in as {user.email}
      </PageTitle>
      <div className="space-y-6">
        <Card className="p-6 sm:p-8">
          <h2 className="mb-5 text-lg font-semibold">Learning preferences</h2>
          <ProfileForm
            defaults={{
              fullName: p?.full_name ?? "",
              displayName: p?.display_name ?? "",
              currentLevel: p?.current_level ?? "A1",
              dailyNewWords: p?.daily_new_words ?? 10,
              studyDirection: p?.study_direction ?? "de_en",
            }}
          />
        </Card>
        <Card className="p-6 sm:p-8">
          <h2 className="mb-5 text-lg font-semibold">Password</h2>
          <PasswordForm />
        </Card>
      </div>
    </>
  );
}
