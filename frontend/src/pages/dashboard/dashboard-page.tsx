import { useAuth } from "@/context/auth-context";

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back, {user?.name}. The workspace is ready.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {[
          { label: "Total Sales", value: "Rs 0" },
          { label: "Active Orders", value: "0" },
          { label: "Avg. Prep Time", value: "—" },
          { label: "Table Occupancy", value: "0%" },
        ].map((metric) => (
          <div
            key={metric.label}
            className="flex flex-col items-start rounded-xl bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
          >
            <p className="mb-2 text-sm text-muted-foreground">{metric.label}</p>
            <p className="text-2xl font-semibold italic text-primary-container sm:text-3xl">
              {metric.value}
            </p>
          </div>
        ))}
      </section>

      <div className="flex h-80 items-center justify-center rounded-xl bg-card shadow-card">
        <p className="text-sm text-muted-foreground">
          Analytics and order tracking are coming soon.
        </p>
      </div>
    </div>
  );
}
