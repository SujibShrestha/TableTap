"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Sheet = ({ className, children, ...props }: React.ComponentProps<"div">) => {
  return <div className={cn("relative z-50", className)} {...props}>{children}</div>;
};

const SheetTrigger = ({ children, ...props }: React.ComponentProps<"button">) => {
  return <button {...props}>{children}</button>;
};

const SheetClose = ({ children, ...props }: React.ComponentProps<"button">) => {
  return <button {...props}>{children}</button>;
};

interface SheetContentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}

function SheetContent({
  open,
  onOpenChange,
  className,
  children,
  side = "bottom",
  ...props
}: SheetContentProps) {
  React.useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const sideStyles = {
    bottom: "fixed bottom-0 left-0 right-0 max-h-[90vh] animate-slide-up",
    top: "fixed top-0 left-0 right-0 max-h-[90vh] animate-slide-down",
    right: "fixed right-0 top-0 bottom-0 max-w-[90vw] animate-slide-left",
    left: "fixed left-0 top-0 bottom-0 max-w-[90vw] animate-slide-right",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-on-surface-variant/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 w-full flex flex-col bg-surface rounded-t-2xl shadow-[0px_20px_50px_rgba(45,36,30,0.15)]",
          sideStyles[side],
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

interface SheetHeaderProps {
  className?: string;
  children: React.ReactNode;
}

function SheetHeader({ className, children }: SheetHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-b border-outline-variant/40 p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

interface SheetTitleProps {
  className?: string;
  children: React.ReactNode;
}

function SheetTitle({ className, children }: SheetTitleProps) {
  return (
    <h2 className={cn("text-headline-lg-mobile font-bold italic text-primary", className)}>
      {children}
    </h2>
  );
}

interface SheetDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

function SheetDescription({ className, children }: SheetDescriptionProps) {
  return (
    <p className={cn("text-body-secondary text-on-surface-variant", className)}>
      {children}
    </p>
  );
}

interface SheetFooterProps {
  className?: string;
  children: React.ReactNode;
}

function SheetFooter({ className, children }: SheetFooterProps) {
  return (
    <div className={cn("flex items-center gap-2 p-6 border-t border-outline-variant/40", className)}>
      {children}
    </div>
  );
}

Sheet.displayName = "Sheet";
SheetTrigger.displayName = "SheetTrigger";
SheetClose.displayName = "SheetClose";
SheetContent.displayName = "SheetContent";
SheetHeader.displayName = "SheetHeader";
SheetTitle.displayName = "SheetTitle";
SheetDescription.displayName = "SheetDescription";
SheetFooter.displayName = "SheetFooter";

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter };