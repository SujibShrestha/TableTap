import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Lock, LogIn, Mail } from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { getErrorMessage } from "@/api/api";
import { getHomePath } from "@/components/layout/route-guards";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      navigate(from ?? getHomePath(loggedInUser.role), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Invalid email or password"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-surface-container-high/30 to-transparent" />
      <div className="pointer-events-none absolute -top-[20%] -right-[10%] size-[50%] rounded-full bg-primary-fixed-dim/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-[20%] -left-[10%] size-[50%] rounded-full bg-secondary-fixed-dim/30 blur-3xl" />

      <div className="relative z-10 w-full max-w-md rounded-xl border border-surface-container-highest bg-card p-8 shadow-card md:p-10">
        <header className="mb-8 text-center">
          <img
            src="/logo-sm.png"
            alt="TableTap logo"
            className="mx-auto mb-4 size-20 rounded-2xl object-cover shadow-card"
          />
          <h1 className="mb-2 text-4xl font-semibold tracking-tight text-primary">
            TableTap
          </h1>
          <p className="text-sm text-on-surface-variant">Staff Authentication</p>
        </header>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4">
            <FormField label="Email" htmlFor="email" required>
              <div className="relative">
                <Mail className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@restaurant.com"
                  className="h-12 w-full rounded-lg border border-outline-variant bg-surface-container-low pr-4 pl-11 text-sm text-foreground transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none"
                />
              </div>
            </FormField>

            <FormField label="Password" htmlFor="password" required>
              <div className="relative">
                <Lock className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-12 w-full rounded-lg border border-outline-variant bg-surface-container-low pr-4 pl-11 text-sm text-foreground transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none"
                />
              </div>
            </FormField>
          </div>

          {error ? <Alert>{error}</Alert> : null}

          <div className="flex flex-col gap-4 pt-2">
            <Button
              type="submit"
              variant="container"
              size="lg"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="animate-spin" /> : <LogIn />}
              Sign In
            </Button>
            <p className="text-center text-sm text-on-surface-variant">
              Forgot password? <span className="underline-offset-4">Contact Admin</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
