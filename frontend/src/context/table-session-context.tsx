import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { resolveTable, getErrorMessage } from "@/api/api";
import type { RestaurantTable } from "@/types";
import { Alert } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface TableSessionContextValue {
  table: RestaurantTable | null;
  sessionId: string | null;
  loading: boolean;
  error: string | null;
}

const TableSessionContext = createContext<TableSessionContextValue | null>(null);

interface TableSessionProviderProps {
  children: ReactNode;
  tableId: string;
}

export function TableSessionProvider({ children, tableId }: TableSessionProviderProps) {
  const [table, setTable] = useState<RestaurantTable | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchSession() {
      try {
        const result = await resolveTable(tableId);
        if (!cancelled) {
          setTable(result.table);
          setSessionId(result.session.id);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Invalid or inactive table"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchSession();

    return () => {
      cancelled = true;
    };
  }, [tableId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" strokeWidth={2} aria-hidden="true" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <Alert className="w-full max-w-md">{error}</Alert>
      </div>
    );
  }

  return (
    <TableSessionContext.Provider value={{ table, sessionId, loading, error }}>
      {children}
    </TableSessionContext.Provider>
  );
}

export function useTableSession() {
  const context = useContext(TableSessionContext);
  if (!context) {
    throw new Error("useTableSession must be used within a TableSessionProvider");
  }
  return context;
}