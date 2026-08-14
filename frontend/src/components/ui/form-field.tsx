import * as React from "react";

import { cn } from "@/lib/utils";
import { Label } from "./label";

interface FormFieldProps extends React.ComponentProps<"div"> {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
}

function FormField({
  className,
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  ...props
}: FormFieldProps) {
  return (
    <div data-slot="form-field" className={cn("flex flex-col gap-2", className)} {...props}>
      {label ? (
        <Label htmlFor={htmlFor}>
          {label}
          {required ? <span className="ml-0.5 text-destructive">*</span> : null}
        </Label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export { FormField };