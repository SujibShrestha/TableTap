import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, UtensilsCrossed } from "lucide-react";

import { getErrorMessage, getTableById } from "@/api/api";
import type { RestaurantTable } from "@/types";
import { Alert } from "@/components/ui/alert";

export function TableLandingPage() {
  const { id } = useParams<{ id: string }>();
  const [table, setTable] = useState<RestaurantTable | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    getTableById(id)
      .then((result) => {
        if (!cancelled) setTable(result);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, "Unable to find this table"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-surface-container-high/30 to-transparent" />
      <div className="pointer-events-none absolute -top-[20%] -right-[10%] size-[50%] rounded-full bg-primary-fixed-dim/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-[20%] -left-[10%] size-[50%] rounded-full bg-secondary-fixed-dim/30 blur-3xl" />

      <div className="relative z-10 w-full max-w-md rounded-xl border border-surface-container-highest bg-card p-8 shadow-card md:p-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <img
            src="/logo-sm.png"
            alt="TableTap logo"
            className="size-20 rounded-2xl object-cover shadow-card"
          />
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-primary">TableTap</h1>
            <p className="mt-1 text-sm text-on-surface-variant">Scan to order</p>
          </div>
        </div>

        <div className="my-8 h-px bg-outline-variant/60" />

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="size-7 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Finding your table…</p>
          </div>
        ) : error ? (
          <Alert>{error}</Alert>
        ) : table ? (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-surface-container text-3xl font-bold text-primary">
              {table.tableNumber}
            </div>

            <div>
              <p className="text-xs font-bold tracking-[0.12em] text-on-surface-variant uppercase">
                You are at
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">Table {table.tableNumber}</p>
            </div>

            <div className="flex w-full flex-col items-center gap-3 rounded-xl border border-dashed border-outline-variant bg-surface-container-low px-6 py-8">
              <UtensilsCrossed className="size-8 text-primary" />
              <p className="text-sm font-semibold">Menu coming soon</p>
              <p className="text-xs text-muted-foreground">
                Our digital menu is being prepared. Please ask our staff for assistance.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}