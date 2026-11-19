import Link from "next/link";
import { PageTitle } from "@/components/app/app-shell";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireStaff } from "@/lib/auth/session";
import { getTopics } from "@/lib/data/study";
import { createClient } from "@/lib/supabase/server";
import { ImportForm } from "./import-form";

export const metadata = { title: "Import and export" };

export default async function ImportPage() {
  await requireStaff();
  const supabase = await createClient();
  const [topics, { data: history }] = await Promise.all([
    getTopics(),
    supabase.from("content_imports").select("id, file_name, status, total_rows, inserted, updated, skipped, created_at").order("created_at", { ascending: false }).limit(10),
  ]);

  return (
    <>
      <PageTitle eyebrow="Admin" title="Import and export vocabulary">
        Upload a spreadsheet or a content-generator JSON file. The file is checked first; nothing is saved until you import.
      </PageTitle>

      <ImportForm topics={topics} />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-semibold">Spreadsheet columns</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Required: <code>word</code>, <code>translation</code>, and either <code>article</code> (nouns) or <code>category</code>.
            Optional: <code>plural</code>, <code>level</code>, <code>topic</code>, <code>ipa</code>, <code>pronunciation_guide</code>,{" "}
            <code>example_de</code>, <code>example_en</code>, <code>difficulty</code> (1–5), <code>related</code>, <code>partizip_ii</code>,{" "}
            <code>auxiliary</code>, <code>present</code> (six forms separated by “;”), <code>id</code>, <code>notes</code>. Separate several
            translations with “;”. Write “no plural” for nouns without one.
          </p>
          <p className="mt-3 text-sm">
            <a href="/templates/vocabulary-template.csv" download className="text-accent hover:underline">
              Download the CSV template
            </a>{" "}
            · Full format in <code>docs/content-format.md</code>
          </p>
        </Card>
        <Card className="p-6">
          <h2 className="font-semibold">Export</h2>
          <p className="mt-2 text-sm text-ink-soft">Download every vocabulary entry with translations and examples.</p>
          <form action="/admin/export/vocabulary" method="get" className="mt-4 flex flex-wrap gap-2">
            <button name="format" value="csv" className={buttonClasses("secondary", "sm")}>
              Export CSV
            </button>
            <button name="format" value="json" className={buttonClasses("secondary", "sm")}>
              Export JSON
            </button>
          </form>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <h2 className="border-b border-line px-6 py-4 font-semibold">Recent imports</h2>
        {(history ?? []).length === 0 ? (
          <p className="px-6 py-6 text-sm text-muted">No imports yet.</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {history!.map((h) => (
              <li key={h.id} className="flex flex-wrap justify-between gap-2 px-6 py-3">
                <span className="font-medium">{h.file_name}</span>
                <span className="text-muted">
                  {h.status} · {h.total_rows} rows · {h.inserted} new · {h.updated} updated · {h.skipped} skipped ·{" "}
                  {new Date(h.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <p className="mt-6 text-sm">
        <Link href="/admin/vocabulary" className="text-accent hover:underline">
          Review and verify imported words →
        </Link>
      </p>
    </>
  );
}
