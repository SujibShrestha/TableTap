import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, Printer, Trash2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { getAuth } from "@/lib/auth-store";
import { createTable, deleteTable, getErrorMessage, getTables, updateTable } from "@/api/api";
import { formatDate } from "@/lib/format";
import { printQrCode } from "@/lib/print-qr";
import type { RestaurantTable } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function StatusBadge({ isActive }: { isActive: boolean }) {
  return <Badge variant={isActive ? "success" : "destructive"}>{isActive ? "Active" : "Inactive"}</Badge>;
}

function DeleteTableButton({ table, onDone }: { table: RestaurantTable; onDone: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3500);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await deleteTable(getAuth()?.accessToken ?? "", table.id);
      setConfirming(false);
      onDone();
    } catch (err) {
      setError(getErrorMessage(err));
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <span className="flex items-center gap-2 text-xs text-destructive">
        {error}
        <button className="underline-offset-4 hover:underline" onClick={() => setError(null)}>
          dismiss
        </button>
      </span>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("text-destructive hover:bg-error-container", confirming && "bg-error-container")}
      disabled={busy}
      onClick={() => void handleClick()}
    >
      <Trash2 />
      {confirming ? "Confirm" : "Delete"}
    </Button>
  );
}

interface TableFormValues {
  tableNumber: string;
  isActive: boolean;
}

const EMPTY_FORM: TableFormValues = { tableNumber: "", isActive: true };

function TableFormModal({
  open,
  table,
  onClose,
  onDone,
}: {
  open: boolean;
  table: RestaurantTable | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const isEdit = Boolean(table);
  const [form, setForm] = useState<TableFormValues>(() =>
    table ? { tableNumber: table.tableNumber, isActive: table.isActive } : EMPTY_FORM
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const token = getAuth()?.accessToken ?? "";
      const tableNumber = form.tableNumber.trim();

      if (!tableNumber) {
        setError("Table number is required");
        return;
      }

      if (isEdit) {
        await updateTable(token, table!.id, {
          tableNumber,
          isActive: form.isActive,
        });
      } else {
        await createTable(token, { tableNumber });
      }

      onClose();
      onDone();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save table"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Table" : "Add Table"}
      description={isEdit ? `Update table ${table?.tableNumber ?? ""}` : "Create a new table for the floor plan."}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <FormField label="Table number" htmlFor="table-number" required>
          <Input
            id="table-number"
            value={form.tableNumber}
            onChange={(e) => setForm((current) => ({ ...current, tableNumber: e.target.value }))}
            placeholder="e.g. T1 or 12"
            autoFocus
          />
        </FormField>

        {isEdit ? (
          <FormField label="Status">
            <button
              type="button"
              role="switch"
              aria-checked={form.isActive}
              onClick={() => setForm((current) => ({ ...current, isActive: !current.isActive }))}
              className={cn(
                "relative h-7 w-12 rounded-full border transition-colors duration-200",
                form.isActive
                  ? "border-primary bg-primary"
                  : "border-outline-variant bg-surface-container-high"
              )}
            >
              <span
                className={cn(
                  "absolute top-1/2 size-5 -translate-y-1/2 rounded-full bg-white shadow transition-all duration-200",
                  form.isActive ? "left-[calc(100%-1.5rem)]" : "left-0.5"
                )}
              />
            </button>
          </FormField>
        ) : null}

        {error ? <Alert>{error}</Alert> : null}

        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="container" disabled={saving}>
            {isEdit ? "Save changes" : "Create table"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function TablesPage() {
  const [tables, setTables] = useState<RestaurantTable[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);

  async function loadTables() {
    setLoading(true);
    setError(null);
    try {
      const result = await getTables(getAuth()?.accessToken ?? "");
      setTables(result);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load tables"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    getTables(getAuth()?.accessToken ?? "")
      .then((result) => {
        if (!cancelled) setTables(result);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, "Failed to load tables"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function openCreate() {
    setEditingTable(null);
    setModalOpen(true);
  }

  function openEdit(table: RestaurantTable) {
    setEditingTable(table);
    setModalOpen(true);
  }

  const tableOrigin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Table Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the tables on your floor plan.
          </p>
        </div>
        <Button variant="container" onClick={openCreate}>
          <Plus />
          Add Table
        </Button>
      </header>

      {error ? <Alert>{error}</Alert> : null}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : !tables || tables.length === 0 ? (
        <div className="flex h-60 items-center justify-center rounded-xl bg-card shadow-card">
          <p className="text-sm text-muted-foreground">
            No tables yet. Click "Add Table" to create your first one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className="flex flex-col gap-4 rounded-xl bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
            >
              <div className="flex items-start justify-between">
                <div className="flex size-12 items-center justify-center rounded-full bg-surface-container text-lg font-bold text-primary">
                  {table.tableNumber}
                </div>
                <StatusBadge isActive={table.isActive} />
              </div>

              <div>
                <p className="text-lg font-semibold tracking-tight">{table.tableNumber}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Created {formatDate(table.createdAt)}
                </p>
              </div>

              <a
                href={`${tableOrigin}/t/${table.id}`}
                target="_blank"
                rel="noreferrer"
                className="mx-auto block rounded-xl bg-white p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover"
                aria-label={`Open QR menu for table ${table.tableNumber}`}
              >
                <QRCodeSVG
                  value={`${tableOrigin}/t/${table.id}`}
                  size={132}
                  fgColor="#1d1c18"
                  bgColor="transparent"
                  level="M"
                />
              </a>

              <p className="break-all text-center text-xs text-muted-foreground">
                Scan to open menu for table {table.tableNumber}
              </p>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() =>
                  printQrCode({
                    tableNumber: table.tableNumber,
                    url: `${tableOrigin}/t/${table.id}`,
                  })
                }
              >
                <Printer />
                Print QR
              </Button>

              <div className="mt-auto flex items-center justify-end gap-1 border-t border-outline-variant/60 pt-4">
                <Button variant="ghost" size="sm" onClick={() => openEdit(table)}>
                  <Pencil />
                  Edit
                </Button>
                <DeleteTableButton table={table} onDone={() => void loadTables()} />
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen ? (
        <TableFormModal
          key={editingTable?.id ?? "new"}
          open
          table={editingTable}
          onClose={() => setModalOpen(false)}
          onDone={() => void loadTables()}
        />
      ) : null}
    </div>
  );
}