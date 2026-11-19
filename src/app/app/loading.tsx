export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-4">
      <span className="sr-only">Loading…</span>
      <div className="h-10 w-64 animate-pulse rounded-xl bg-paper-deep" />
      <div className="h-36 animate-pulse rounded-[var(--radius-card)] bg-paper-deep" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-[var(--radius-card)] bg-paper-deep" />
        ))}
      </div>
    </div>
  );
}
