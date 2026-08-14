import * as React from "react";

import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "text-xs font-bold tracking-[0.05em] text-on-surface-variant uppercase",
        className
      )}
      {...props}
    />
  );
}

export { Label };
