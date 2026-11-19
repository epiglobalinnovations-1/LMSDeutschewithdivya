import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const control =
  "w-full rounded-xl border border-line-strong bg-surface px-4 text-ink placeholder:text-muted/70 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 aria-[invalid=true]:border-danger";

export function Field({
  label,
  name,
  error,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string[];
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error?.length ? (
        <p id={`${name}-error`} className="text-sm text-danger" role="alert">
          {error[0]}
        </p>
      ) : hint ? (
        <p className="text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, error, ...props }: ComponentProps<"input"> & { error?: string[] }) {
  return (
    <input
      id={props.name}
      aria-invalid={error?.length ? true : undefined}
      aria-describedby={error?.length ? `${props.name}-error` : undefined}
      className={cn(control, "h-12", className)}
      {...props}
    />
  );
}

export function Textarea({ className, error, ...props }: ComponentProps<"textarea"> & { error?: string[] }) {
  return (
    <textarea
      id={props.name}
      aria-invalid={error?.length ? true : undefined}
      aria-describedby={error?.length ? `${props.name}-error` : undefined}
      className={cn(control, "min-h-36 py-3 leading-relaxed", className)}
      {...props}
    />
  );
}

export function Select({ className, error, ...props }: ComponentProps<"select"> & { error?: string[] }) {
  return (
    <select
      id={props.name}
      aria-invalid={error?.length ? true : undefined}
      className={cn(control, "h-12 appearance-none bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%236b655e' stroke-width='1.5'/%3E%3C/svg%3E\")",
      }}
      {...props}
    />
  );
}

export function FormMessage({ tone = "danger", children }: { tone?: "danger" | "success" | "info"; children: ReactNode }) {
  const tones = {
    danger: "border-danger/20 bg-danger-soft text-danger",
    success: "border-success/20 bg-success-soft text-success",
    info: "border-line bg-paper-deep text-ink-soft",
  };
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("rounded-xl border px-4 py-3 text-sm", tones[tone])}>
      {children}
    </div>
  );
}
