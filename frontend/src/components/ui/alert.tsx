import * as React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

function Alert({
  className,
  variant = "error",
  children,
}: {
  className?: string;
  variant?: "error" | "success";
  children: React.ReactNode;
}) {
  const Icon = variant === "error" ? AlertCircle : CheckCircle2;
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm",
        variant === "error"
          ? "border-error-container bg-error-container text-on-error-container"
          : "border-secondary-fixed bg-secondary-fixed text-on-secondary-fixed",
        className
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span className="leading-snug">{children}</span>
    </div>
  );
}

export { Alert };