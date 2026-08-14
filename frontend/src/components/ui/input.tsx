import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 text-sm text-foreground transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
