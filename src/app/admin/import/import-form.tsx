"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { previewImport, runImport, type ImportPreview } from "./actions";

const select = "h-12 w-full rounded-xl border border-line-strong bg-surface px-3";

export function ImportForm({ topics }: { topics: { slug: string; name: string }[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [imported, setImported] = useState<ImportPreview | null>(null);
  const [pending, start] = useTransition();
  const [step, setStep] = useState<"check" | "import" | null>(null);

  function submit(kind: "check" | "import") {
    const form = formRef.current;
    if (!form) return;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    setStep(kind);
    start(async () => {
      if (kind === "check") {
        setImported(null);
        setPreview(await previewImport(null, data));
      } else {
        const r = await runImport(null, data);
        setImported(r);
        if (r.ok) setPreview(null);
      }
    });
  }

  const shown = imported ?? preview;

  return (
    <div className="space-y-6">
      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          submit("check");
        }}
        className="grid gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-6 sm:grid-cols-2"
      >
        <div className="sm:col-span-2">
          <Field label="File (.csv, .xlsx or .json, up to 4 MB)" name="file">
            <input
              id="file"
              name="file"
              type="file"
              required
              accept=".csv,.tsv,.txt,.xlsx,.json,text/csv,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={() => {
                setPreview(null);
                setImported(null);
              }}
              className="block w-full rounded-xl border border-dashed border-line-strong bg-paper px-4 py-6 text-sm"
            />
          </Field>
        </div>
        <Field label="Default level" name="level" hint="Used when a row has no level">
          <select id="level" name="level" className={select} defaultValue="A1">
            <option value="">From file</option>
            {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="Default topic" name="topic" hint="Used when a row has no topic">
          <select id="topic" name="topic" className={select} defaultValue="">
            <option value="">From file / none</option>
            {topics.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Source label" name="source" hint="Shown to staff, e.g. “Divya A1 list, Nov 2026”">
          <Input name="source" maxLength={200} placeholder="Where these words come from" />
        </Field>
        <Field label="Words that already exist" name="mode">
          <select id="mode" name="mode" className={select} defaultValue="upsert">
            <option value="upsert">Update them with the file’s data</option>
            <option value="skip">Leave them unchanged</option>
          </select>
        </Field>
        <Field label="Add to deck (optional)" name="deckSlug" hint="Lowercase slug; the deck is created if it does not exist">
          <Input name="deckSlug" pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="a1-food" />
        </Field>
        <Field label="Deck title" name="deckTitle">
          <Input name="deckTitle" maxLength={120} placeholder="A1 food and drink" />
        </Field>
        <label className="flex items-start gap-3 text-sm sm:col-span-2">
          <input type="checkbox" name="markVerified" className="mt-1 h-4 w-4 accent-[var(--accent)]" />
          <span>
            Mark imported words as <strong>verified</strong>. Only tick this if a teacher has checked every row. Otherwise words
            are imported as drafts and can be verified later.
          </span>
        </label>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending && step === "check" ? "Checking…" : "1. Check file"}
          </Button>
          <Button type="button" onClick={() => submit("import")} disabled={pending || !preview?.ok}>
            {pending && step === "import" ? "Importing…" : `2. Import ${preview?.ok ? preview.valid : ""} words`}
          </Button>
        </div>
      </form>

      {shown && (
        <section aria-live="polite" className="space-y-4 rounded-[var(--radius-card)] border border-line bg-surface p-6" data-testid="import-report">
          {shown.message && (
            <p role="status" className={shown.ok ? "rounded-xl bg-success-soft px-3 py-2 text-success" : "rounded-xl bg-danger-soft px-3 py-2 text-danger"}>
              {shown.message}
            </p>
          )}
          {shown.fileName && (
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
              <Stat label="Rows" value={shown.totalRows} />
              <Stat label="Valid" value={shown.valid} />
              <Stat label="New words" value={shown.newWords} />
              <Stat label="Already exist" value={shown.existingWords} />
              <Stat label="Errors" value={shown.errors.length} />
            </dl>
          )}
          {shown.warnings.length > 0 && (
            <ul className="list-disc pl-5 text-sm text-[#7a5f17]">
              {shown.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
          <Issues title="Errors (fix these, then check again)" items={shown.errors} />
          <Issues title="Duplicates inside the file (skipped)" items={shown.duplicates} />
          {shown.sample.length > 0 && !imported && (
            <div>
              <h3 className="text-sm font-semibold">Preview</h3>
              <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                {shown.sample.map((s, i) => (
                  <li key={i}>
                    {s.article && <span className="text-muted">{s.article} </span>}
                    <strong>{s.lemma}</strong> · {s.translations.join(", ")}{" "}
                    <span className="text-muted">
                      ({s.part_of_speech}, {s.cefr_level}
                      {s.topic ? `, ${s.topic}` : ""})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-paper px-3 py-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-display text-xl">{value}</dd>
    </div>
  );
}

function Issues({ title, items }: { title: string; items: { row: number; field: string; message: string }[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-2 max-h-64 overflow-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-paper text-left text-muted">
            <tr>
              <th className="px-3 py-1.5 font-medium">Row</th>
              <th className="px-3 py-1.5 font-medium">Field</th>
              <th className="px-3 py-1.5 font-medium">Problem</th>
            </tr>
          </thead>
          <tbody>
            {items.map((e, i) => (
              <tr key={i} className="border-t border-line">
                <td className="px-3 py-1.5 tabular-nums">{e.row}</td>
                <td className="px-3 py-1.5">{e.field}</td>
                <td className="px-3 py-1.5">{e.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
