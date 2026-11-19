"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { enrol, type EnrolState } from "./actions";

export function EnrolButton({ courseId, label = "Enrol" }: { courseId: string; label?: string }) {
  const [state, action, pending] = useActionState<EnrolState, FormData>(enrol, null);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="courseId" value={courseId} />
      <Button size="sm" disabled={pending}>
        {pending ? "Enrolling…" : label}
      </Button>
      {state && (
        <p role="status" className={state.ok ? "text-sm text-success" : "text-sm text-danger"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
