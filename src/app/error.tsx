"use client";

import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="mx-auto max-w-lg px-5 py-24 text-center">
      <p lang="de" className="font-display text-lg italic text-muted">
        Hoppla!
      </p>
      <h1 className="mt-3 font-display text-3xl">Something went wrong.</h1>
      <p className="mt-3 text-ink-soft">Please try again. If it keeps happening, let us know through the contact page.</p>
      {error.digest && <p className="mt-2 text-xs text-muted">Reference: {error.digest}</p>}
      <div className="mt-8 flex justify-center">
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
