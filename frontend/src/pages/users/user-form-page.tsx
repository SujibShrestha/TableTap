import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Save } from "lucide-react";

import { getAuth } from "@/lib/auth-store";
import { createUser, getErrorMessage, getUser, resetUserPassword, updateUser } from "@/api/api";
import { createUserSchema, resetPasswordSchema, updateUserSchema } from "@/lib/schemas";
import { ROLES, type Role } from "@/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { PageLoader } from "@/components/layout/page-loader";
import { cn } from "@/lib/utils";

type FieldErrors = Record<string, string>;

interface UserFormValues {
  name: string;
  email: string;
  phone: string;
  role: Role;
  password: string;
  isActive: boolean;
}

const EMPTY_FORM: UserFormValues = {
  name: "",
  email: "",
  phone: "",
  role: "WAITER",
  password: "",
  isActive: true,
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 rounded-full border transition-colors duration-200",
        checked ? "border-primary bg-primary" : "border-outline-variant bg-surface-container-high"
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 size-5 -translate-y-1/2 rounded-full bg-white shadow transition-all duration-200",
          checked ? "left-[calc(100%-1.5rem)]" : "left-0.5"
        )}
      />
    </button>
  );
}

export function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const navigate = useNavigate();
  const currentUser = getAuth()?.user;

  const [form, setForm] = useState<UserFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [passwordValue, setPasswordValue] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    getUser(getAuth()?.accessToken ?? "", id)
      .then((user) => {
        if (cancelled) return;
        setForm({
          name: user.name,
          email: user.email,
          phone: user.phone ?? "",
          role: user.role,
          password: "",
          isActive: user.isActive,
        });
      })
      .catch((err) => setFormError(getErrorMessage(err, "Failed to load user")))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  function setField<K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSaving(true);

    try {
      if (isEdit) {
        const parsed = updateUserSchema.safeParse({
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          role: form.role,
          isActive: form.isActive,
        });

        if (!parsed.success) {
          setErrors(issuesToErrors(parsed.error.issues));
          return;
        }

        await updateUser(getAuth()?.accessToken ?? "", id!, {
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone,
          role: parsed.data.role,
          isActive: parsed.data.isActive,
        });
      } else {
        const parsed = createUserSchema.safeParse({
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          password: form.password,
          role: form.role,
        });

        if (!parsed.success) {
          setErrors(issuesToErrors(parsed.error.issues));
          return;
        }

        await createUser(getAuth()?.accessToken ?? "", parsed.data);
      }

      navigate("/users");
    } catch (err) {
      setFormError(getErrorMessage(err, "Failed to save user"));
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordReset(event: FormEvent) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    setPasswordBusy(true);

    try {
      const parsed = resetPasswordSchema.safeParse({ newPassword: passwordValue });
      if (!parsed.success) {
        setPasswordError(parsed.error.issues[0]?.message ?? "Invalid password");
        return;
      }
      await resetUserPassword(getAuth()?.accessToken ?? "", id!, parsed.data);
      setPasswordValue("");
      setPasswordSuccess(true);
    } catch (err) {
      setPasswordError(getErrorMessage(err, "Failed to reset password"));
    } finally {
      setPasswordBusy(false);
    }
  }

  if (loading) {
    return <PageLoader label="Loading staff member…" />;
  }

  const canResetOwnPassword = currentUser?.id === id;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <Link to="/users" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft />
          Back to staff
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isEdit ? "Edit Staff Member" : "Add Staff Member"}
        </h1>
      </header>

      {formError ? <Alert>{formError}</Alert> : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className="flex flex-col gap-6 rounded-xl bg-card p-8 shadow-card">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="Full name" htmlFor="name" required error={errors.name}>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Jane Doe"
              />
            </FormField>

            <FormField label="Email" htmlFor="email" required error={errors.email}>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="jane@restaurant.com"
              />
            </FormField>

            <FormField label="Phone" htmlFor="phone" error={errors.phone}>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="+1 555 000 0000"
              />
            </FormField>

            <FormField label="Role" htmlFor="role" required error={errors.role}>
              <Select
                id="role"
                value={form.role}
                onChange={(e) => setField("role", e.target.value as Role)}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0) + role.slice(1).toLowerCase()}
                  </option>
                ))}
              </Select>
            </FormField>

            {!isEdit ? (
              <FormField
                label="Temporary password"
                htmlFor="password"
                required
                error={errors.password}
                hint="Staff can change this after first sign-in."
              >
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  placeholder="Minimum 6 characters"
                />
              </FormField>
            ) : null}

            {isEdit ? (
              <FormField label="Account status">
                <div className="flex h-11 items-center gap-3">
                  <Toggle checked={form.isActive} onChange={(value) => setField("isActive", value)} />
                  <span className="text-sm text-muted-foreground">
                    {form.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </FormField>
            ) : null}
          </div>

          <div className="flex flex-col-reverse items-stretch gap-3 border-t border-outline-variant/60 pt-6 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/users")}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" variant="container" disabled={saving} className="w-full sm:w-auto">
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              {isEdit ? "Save changes" : "Create staff member"}
            </Button>
          </div>
        </div>
      </form>

      {isEdit && !canResetOwnPassword ? (
        <form onSubmit={handlePasswordReset} className="flex flex-col gap-6 rounded-xl bg-card p-8 shadow-card">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Reset password</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Set a new temporary password for this staff member.
            </p>
          </div>

          {passwordError ? <Alert>{passwordError}</Alert> : null}
          {passwordSuccess ? (
            <Alert variant="success">Password has been reset successfully.</Alert>
          ) : null}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="New password" htmlFor="new-password" required>
              <Input
                id="new-password"
                type="password"
                value={passwordValue}
                onChange={(e) => setPasswordValue(e.target.value)}
                placeholder="Minimum 6 characters"
              />
            </FormField>
          </div>

          <div className="flex justify-end border-t border-outline-variant/60 pt-6">
            <Button type="submit" variant="outline" disabled={passwordBusy} className="w-full sm:w-auto">
              {passwordBusy ? <Loader2 className="animate-spin" /> : <Check />}
              Reset password
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function issuesToErrors(issues: { path: PropertyKey[]; message: string }[]): FieldErrors {
  const fieldErrors: FieldErrors = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}
