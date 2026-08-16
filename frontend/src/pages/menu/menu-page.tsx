import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ImagePlus, Loader2, Plus, Trash2, UtensilsCrossed } from "lucide-react";

import { getAuth } from "@/lib/auth-store";
import {
  createCategory,
  createMenuItem,
  deleteMenuItem,
  getCategories,
  getErrorMessage,
  getMenuItems,
  updateMenuItemAvailability,
  uploadImage,
} from "@/api/api";
import { formatMoney } from "@/lib/format";
import type { CreateMenuItemPayload, MenuCategory, MenuItem } from "@/types";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const ALL_ITEMS = "all";

function AvailabilityToggle({
  item,
  onChange,
}: {
  item: MenuItem;
  onChange: (id: string, isAvailable: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setBusy(true);
    setError(null);
    try {
      await updateMenuItemAvailability(getAuth()?.accessToken ?? "", item.id, !item.isAvailable);
      onChange(item.id, !item.isAvailable);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update availability"));
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
    <button
      type="button"
      role="switch"
      aria-checked={item.isAvailable}
      aria-label={`${item.isAvailable ? "Mark unavailable" : "Mark available"}: ${item.name}`}
      disabled={busy}
      onClick={() => void handleToggle()}
      className={cn(
        "relative h-5 w-9 rounded-full border transition-colors duration-200 disabled:opacity-50",
        item.isAvailable ? "border-primary bg-primary" : "border-outline-variant bg-surface-container-highest"
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 size-4 -translate-y-1/2 rounded-full bg-white shadow transition-all duration-200",
          item.isAvailable ? "left-[calc(100%-1.125rem)]" : "left-0.5"
        )}
      />
    </button>
  );
}

function DeleteMenuItemButton({ item, onDone }: { item: MenuItem; onDone: () => void }) {
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
      await deleteMenuItem(getAuth()?.accessToken ?? "", item.id);
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
    <button
      type="button"
      aria-label={`Delete ${item.name}`}
      disabled={busy}
      onClick={() => void handleClick()}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-outline-variant/40 bg-surface/90 p-2 text-secondary backdrop-blur-sm transition-colors hover:bg-error-container hover:text-on-error-container",
        confirming && "border-error-container bg-error-container text-on-error-container"
      )}
    >
      <Trash2 className="size-4" />
      {confirming ? "Confirm" : null}
    </button>
  );
}

function CategoryFormModal({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Category name is required");
      return;
    }

    setSaving(true);
    try {
      await createCategory(getAuth()?.accessToken ?? "", trimmed);
      onClose();
      onDone();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create category"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Add Category"
      description="Create a new category to organize your menu."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <FormField label="Category name" htmlFor="category-name" required>
          <Input
            id="category-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Starters"
            autoFocus
          />
        </FormField>

        {error ? <Alert>{error}</Alert> : null}

        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="container" disabled={saving}>
            Create category
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface ItemFormValues {
  name: string;
  description: string;
  imageUrl: string;
  price: string;
  costPrice: string;
  categoryId: string;
  isAvailable: boolean;
}

const EMPTY_ITEM_FORM: ItemFormValues = {
  name: "",
  description: "",
  imageUrl: "",
  price: "",
  costPrice: "",
  categoryId: "",
  isAvailable: true,
};

function MenuItemFormModal({
  categories,
  onClose,
  onDone,
}: {
  categories: MenuCategory[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState<ItemFormValues>(EMPTY_ITEM_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImageSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file");
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const imageUrl = await uploadImage(getAuth()?.accessToken ?? "", file);
      setForm((current) => ({ ...current, imageUrl }));
    } catch (err) {
      setUploadError(getErrorMessage(err, "Image upload failed"));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const name = form.name.trim();
    const price = Number(form.price);
    const costPrice = Number(form.costPrice);

    if (!name) {
      setError("Item name is required");
      return;
    }
    if (!form.categoryId) {
      setError("Please select a category");
      return;
    }
    if (!form.price || !(price > 0)) {
      setError("Price must be a positive number");
      return;
    }
    if (!form.costPrice || !(costPrice > 0)) {
      setError("Cost price must be a positive number");
      return;
    }

    const payload: CreateMenuItemPayload = {
      name,
      price,
      costPrice,
      categoryId: form.categoryId,
      isAvailable: form.isAvailable,
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
      ...(form.imageUrl ? { imageUrl: form.imageUrl } : {}),
    };

    setSaving(true);
    try {
      await createMenuItem(getAuth()?.accessToken ?? "", payload);
      onClose();
      onDone();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create menu item"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Add New Item"
      description="Add a new dish to the menu."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <FormField label="Item name" htmlFor="item-name" required>
          <Input
            id="item-name"
            value={form.name}
            onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
            placeholder="e.g. Beef Tartare"
            autoFocus
          />
        </FormField>

        <FormField label="Item image">
          <div>
            {form.imageUrl ? (
              <div>
                <div className="aspect-[4/3] overflow-hidden rounded-lg">
                  <img src={form.imageUrl} alt="Item preview" className="h-full w-full object-cover" />
                </div>
                <div className="mt-2 flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    Change
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setForm((current) => ({ ...current, imageUrl: "" }))}
                    disabled={uploading}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-outline-variant/50 bg-surface-container-low text-on-surface-variant transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : (
                  <ImagePlus className="size-6" />
                )}
                <span className="text-sm font-medium">{uploading ? "Uploading…" : "Upload an image"}</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void handleImageSelect(e)}
            />
          </div>
          {uploadError ? <p className="text-xs font-medium text-destructive">{uploadError}</p> : null}
        </FormField>

        <FormField label="Category" htmlFor="item-category" required>
          <Select
            id="item-category"
            value={form.categoryId}
            onChange={(e) => setForm((current) => ({ ...current, categoryId: e.target.value }))}
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField label="Price (Rs)" htmlFor="item-price" required>
            <Input
              id="item-price"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={form.price}
              onChange={(e) => setForm((current) => ({ ...current, price: e.target.value }))}
              placeholder="0.00"
            />
          </FormField>

          <FormField label="Cost price (Rs)" htmlFor="item-cost-price" required>
            <Input
              id="item-cost-price"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={form.costPrice}
              onChange={(e) => setForm((current) => ({ ...current, costPrice: e.target.value }))}
              placeholder="0.00"
            />
          </FormField>
        </div>

        <FormField label="Description" htmlFor="item-description">
          <Input
            id="item-description"
            value={form.description}
            onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
            placeholder="A short description of the dish"
          />
        </FormField>

        <FormField label="Available">
          <button
            type="button"
            role="switch"
            aria-checked={form.isAvailable}
            onClick={() => setForm((current) => ({ ...current, isAvailable: !current.isAvailable }))}
            className={cn(
              "relative h-7 w-12 rounded-full border transition-colors duration-200",
              form.isAvailable
                ? "border-primary bg-primary"
                : "border-outline-variant bg-surface-container-high"
            )}
          >
            <span
              className={cn(
                "absolute top-1/2 size-5 -translate-y-1/2 rounded-full bg-white shadow transition-all duration-200",
                form.isAvailable ? "left-[calc(100%-1.5rem)]" : "left-0.5"
              )}
            />
          </button>
        </FormField>

        {error ? <Alert>{error}</Alert> : null}

        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="container" disabled={saving}>
            Create item
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function MenuPage() {
  const [categories, setCategories] = useState<MenuCategory[] | null>(null);
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);

  async function loadMenu() {
    setLoading(true);
    setError(null);
    try {
      const [nextCategories, nextItems] = await Promise.all([getCategories(), getMenuItems()]);
      setCategories(nextCategories);
      setItems(nextItems);
      setActiveCategoryId((current) =>
        current && nextCategories.some((category) => category.id === current)
          ? current
          : (nextCategories[0]?.id ?? null)
      );
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load menu"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    Promise.all([getCategories(), getMenuItems()])
      .then(([nextCategories, nextItems]) => {
        if (cancelled) return;
        setCategories(nextCategories);
        setItems(nextItems);
        setActiveCategoryId((current) =>
          current && nextCategories.some((category) => category.id === current)
            ? current
            : (nextCategories[0]?.id ?? null)
        );
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, "Failed to load menu"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function updateAvailability(id: string, isAvailable: boolean) {
    setItems((current) =>
      current ? current.map((item) => (item.id === id ? { ...item, isAvailable } : item)) : current
    );
  }

  const hasCategories = Boolean(categories && categories.length > 0);
  const visibleItems = items
    ? activeCategoryId === ALL_ITEMS
      ? items
      : activeCategoryId
        ? items.filter((item) => item.categoryId === activeCategoryId)
        : []
    : [];
  const categoryNameById = new Map((categories ?? []).map((category) => [category.id, category.name]));

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Menu Management</h1>
          <p className="mt-1 text-sm italic text-muted-foreground">Refine your culinary offerings</p>
        </div>
        <Button variant="container" onClick={() => setItemModalOpen(true)} disabled={!hasCategories}>
          <Plus />
          Add New Item
        </Button>
      </header>

      {error ? <Alert>{error}</Alert> : null}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4 overflow-x-auto border-b border-outline-variant/40 pb-1">
            <div className="flex min-w-max gap-6">
              <button
                type="button"
                onClick={() => setActiveCategoryId(ALL_ITEMS)}
                className={cn(
                  "px-1 pb-3 text-sm font-bold tracking-widest uppercase transition-colors",
                  activeCategoryId === ALL_ITEMS
                    ? "border-b-2 border-primary text-primary"
                    : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                All Items
              </button>
              {categories?.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategoryId(category.id)}
                  className={cn(
                    "px-1 pb-3 text-sm font-bold tracking-widest uppercase transition-colors",
                    activeCategoryId === category.id
                      ? "border-b-2 border-primary text-primary"
                      : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {category.name}
                </button>
              ))}
              {!hasCategories ? (
                <span className="px-1 pb-3 text-sm text-muted-foreground">
                  No categories yet
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setCategoryModalOpen(true)}
              className="inline-flex shrink-0 items-center gap-1 pb-3 text-xs font-bold tracking-widest text-secondary uppercase hover:text-primary transition-colors"
            >
              <Plus className="size-4" />
              Add Category
            </button>
          </div>

          {!hasCategories ? (
            <div className="flex h-60 items-center justify-center rounded-xl bg-card shadow-card">
              <p className="text-sm text-muted-foreground">
                Add a category first to start building your menu.
              </p>
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="flex h-60 items-center justify-center rounded-xl bg-card shadow-card">
              <p className="text-sm text-muted-foreground">
                {activeCategoryId === ALL_ITEMS
                  ? 'No items yet. Click "Add New Item" to create one.'
                  : 'No items in this category yet. Click "Add New Item" to create one.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleItems.map((item) => (
                <article
                  key={item.id}
                  className={cn(
                    "group relative flex flex-col overflow-hidden rounded-xl bg-card p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover",
                    item.isAvailable ? "shadow-card" : "shadow-card opacity-80 hover:opacity-100"
                  )}
                >
                  <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-lg">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className={cn(
                          "h-full w-full object-cover transition-transform duration-700 group-hover:scale-105",
                          !item.isAvailable && "grayscale-[30%]"
                        )}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-surface-container">
                        <UtensilsCrossed
                          className={cn("size-8", item.isAvailable ? "text-muted-foreground/50" : "text-muted-foreground/30")}
                        />
                      </div>
                    )}
                    {activeCategoryId === ALL_ITEMS && categoryNameById.get(item.categoryId) ? (
                      <div className="absolute top-2 left-2 z-10 rounded-full bg-surface/90 px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase backdrop-blur-sm">
                        {categoryNameById.get(item.categoryId)}
                      </div>
                    ) : null}
                    <div className="absolute top-2 right-2 z-10">
                      <DeleteMenuItemButton item={item} onDone={() => void loadMenu()} />
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col px-2 pb-2">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <h3
                        className={cn(
                          "text-lg leading-tight font-semibold italic",
                          item.isAvailable ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        {item.name}
                      </h3>
                      <span
                        className={cn(
                          "text-lg leading-tight font-medium italic whitespace-nowrap",
                          item.isAvailable ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {formatMoney(item.price)}
                      </span>
                    </div>
                    {item.description ? (
                      <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    ) : null}

                    <div className="mt-auto flex items-center justify-between border-t border-outline-variant/20 pt-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "size-2 rounded-full",
                            item.isAvailable ? "bg-emerald-600" : "bg-outline"
                          )}
                        />
                        <span
                          className={cn(
                            "text-[11px] font-bold tracking-wider uppercase",
                            item.isAvailable ? "text-emerald-700" : "text-secondary"
                          )}
                        >
                          {item.isAvailable ? "Available" : "86'd (Inactive)"}
                        </span>
                      </div>
                      <AvailabilityToggle item={item} onChange={updateAvailability} />
                    </div>
                  </div>
                </article>
              ))}

              <button
                type="button"
                onClick={() => setItemModalOpen(true)}
                className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant/50 bg-surface-container-low p-6 text-on-surface-variant transition-all duration-300 hover:border-primary/50 hover:bg-surface hover:text-primary"
              >
                <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-surface-container transition-transform duration-300 group-hover:scale-110">
                  <Plus className="size-8" />
                </div>
                <span className="text-lg font-semibold">Quick Add Item</span>
                <span className="mt-2 text-[13px] opacity-70">Draft a new dish</span>
              </button>
            </div>
          )}
        </>
      )}

      {categoryModalOpen ? (
        <CategoryFormModal
          key="category"
          onClose={() => setCategoryModalOpen(false)}
          onDone={() => void loadMenu()}
        />
      ) : null}

      {itemModalOpen ? (
        <MenuItemFormModal
          key="item"
          categories={categories ?? []}
          onClose={() => setItemModalOpen(false)}
          onDone={() => void loadMenu()}
        />
      ) : null}
    </div>
  );
}