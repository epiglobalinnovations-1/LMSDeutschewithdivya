import { PageTitle } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";
import { requireStaff } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  await requireStaff();
  const supabase = await createClient();

  const [students, courses, vocabulary, messages] = await Promise.all([
    supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role_id", 1),
    supabase.from("courses").select("id", { count: "exact", head: true }),
    supabase.from("vocabulary").select("id", { count: "exact", head: true }),
    supabase.from("contact_messages").select("id, name, email, topic, message, created_at, handled_at").order("created_at", { ascending: false }).limit(10),
  ]);

  const stats = [
    { label: "Students", value: students.count ?? 0 },
    { label: "Courses", value: courses.count ?? 0 },
    { label: "Vocabulary entries", value: vocabulary.count ?? 0 },
    { label: "Open messages", value: (messages.data ?? []).filter((m) => !m.handled_at).length },
  ];

  return (
    <>
      <PageTitle eyebrow="Admin" title="Overview" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">{s.label}</p>
            <p className="mt-2 font-display text-3xl">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-line px-6 py-4">
          <h2 className="font-semibold">Latest contact messages</h2>
        </div>
        {(messages.data ?? []).length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted">No messages yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {messages.data!.map((m) => (
              <li key={m.id} className="px-6 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">
                    {m.name} <span className="font-normal text-muted">· {m.email}</span>
                  </p>
                  <time className="text-xs text-muted" dateTime={m.created_at}>
                    {new Date(m.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}
                  </time>
                </div>
                <p className="mt-1 text-xs uppercase tracking-wider text-accent">{m.topic}</p>
                <p className="mt-1 whitespace-pre-line text-sm text-ink-soft">{m.message}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
