import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  getOrderSummary,
  getBestSellers,
  getDailyTrend,
  getErrorMessage,
} from "@/api/api";
import type { BestSellerItem, DailyTrendItem, OrderSummary } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type DatePreset = "today" | "week" | "month" | "all";

const DATE_PRESETS: { label: string; value: DatePreset }[] = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "All Time", value: "all" },
];

function getPresetRange(preset: DatePreset): { from?: string; to?: string } {
  if (preset === "all") return {};
  const now = new Date();
  const to = now.toISOString();
  // Use UTC methods so the range is consistent with the DB (UTC) regardless of timezone
  let from: Date;
  if (preset === "today") {
    from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  } else if (preset === "week") {
    from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 7));
  } else {
    from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }
  return { from: from.toISOString(), to };
}

// ── Formatting helpers ──────────────────────────────────────────────

function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000) return `Rs ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `Rs ${(value / 1_000).toFixed(1)}k`;
  return `Rs ${value.toFixed(0)}`;
}

function formatDayLabel(dateStr: string): string {
  // Parse as UTC to avoid timezone day-shift (date-fns format uses local time)
  const d = new Date(dateStr + (dateStr.includes("T") ? "" : "T00:00:00Z"));
  return format(d, "MMM d");
}

// ── Metric Card ─────────────────────────────────────────────────────

function MetricCardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl bg-card p-6 border border-border/40 shadow-card">
      <Skeleton className="h-3 w-24 mb-4" />
      <Skeleton className="h-9 w-32 mb-4" />
      <Skeleton className="h-4 w-28" />
    </div>
  );
}

function MetricCard({
  label,
  value,
  trend,
  trendUp,
  loading,
}: {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  loading: boolean;
}) {
  if (loading) return <MetricCardSkeleton />;

  return (
    <div className="flex flex-col rounded-xl bg-card p-6 border border-border/40 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
        {label}
      </h3>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold italic text-primary leading-tight sm:text-[2.5rem]">
          {value}
        </span>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1 text-sm text-secondary">
          {trendUp !== false ? (
            <TrendingUp className="size-4 text-primary" />
          ) : (
            <ArrowRight className="size-4 text-secondary" />
          )}
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}

// ── Bar Chart ───────────────────────────────────────────────────────

const MAX_BARS = 14;
const CHART_HEIGHT = 320; // px

function BarChartSkeleton() {
  return (
    <div className="rounded-xl bg-card p-8 border border-border/40 shadow-card">
      <Skeleton className="h-7 w-56 mb-2" />
      <Skeleton className="h-4 w-64 mb-8" />
      <Skeleton className="w-full" style={{ height: CHART_HEIGHT }} />
    </div>
  );
}

function BarChart({
  data,
  loading,
  preset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomDateChange,
  onApply,
  hasChanges,
}: {
  data: DailyTrendItem[];
  loading: boolean;
  preset: DatePreset;
  onPresetChange: (p: DatePreset) => void;
  customFrom: string;
  customTo: string;
  onCustomDateChange: (field: "from" | "to", value: string) => void;
  onApply: () => void;
  hasChanges: boolean;
}) {
  if (loading) return <BarChartSkeleton />;

  const hasData = data.length > 0;
  const maxValue = hasData
    ? Math.max(...data.map((d) => Math.max(d.revenue, d.profit)))
    : 0;

  // Y-axis scale: pick a nice round ceiling
  const yMax = maxValue > 0 ? Math.ceil(maxValue / 1000) * 1000 : 1000;
  const ySteps = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

  return (
    <section className="rounded-xl bg-card p-8 border border-border/40 shadow-card">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Sales &amp; Profit Trends
          </h2>
        </div>
        <div className="flex items-center gap-4">
          {/* Date presets */}
          <div className="flex items-center gap-1.5">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => onPresetChange(p.value)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  preset === p.value
                    ? "bg-surface-container-low border border-border text-foreground"
                    : "text-secondary hover:bg-surface-container-low"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {/* Custom date range */}
          <div className="flex items-center gap-2 border-l border-border/30 pl-4">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => onCustomDateChange("from", e.target.value)}
              className="rounded-lg border border-border/50 bg-surface-container-low px-2.5 py-1 text-[11px] font-medium text-foreground outline-none focus:border-primary transition-colors"
            />
            <span className="text-[10px] font-bold text-muted-foreground">to</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => onCustomDateChange("to", e.target.value)}
              className="rounded-lg border border-border/50 bg-surface-container-low px-2.5 py-1 text-[11px] font-medium text-foreground outline-none focus:border-primary transition-colors"
            />
            {hasChanges && (
              <button
                onClick={onApply}
                className="rounded-lg bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Apply
              </button>
            )}
          </div>
          {/* Legend */}
          <div className="flex gap-4 border-l border-border/30 pl-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Sales
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-outline" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Profit
              </span>
            </div>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div
          className="flex items-center justify-center text-sm text-muted-foreground"
          style={{ height: CHART_HEIGHT }}
        >
          No daily data for this period.
        </div>
      ) : (
        <div className="relative w-full" style={{ height: CHART_HEIGHT + 40 }}>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 flex flex-col justify-between h-[320px] text-[10px] font-bold text-muted-foreground w-14 text-right pr-3">
            {ySteps
              .slice()
              .reverse()
              .map((v, i) => (
                <span key={i}>{formatCurrencyShort(v)}</span>
              ))}
          </div>

          {/* Chart area */}
          <div className="ml-16 border-l border-b border-border/30 relative px-2" style={{ height: CHART_HEIGHT }}>
            {/* Horizontal grid lines */}
            {ySteps.slice(0, -1).map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-2 border-t border-border/15"
                style={{ bottom: `${((i + 1) / (ySteps.length - 1)) * 100}%` }}
              />
            ))}

            {/* Bars */}
            <div className="absolute inset-0 flex items-end justify-between px-2">
              {data.map((day, i) => {
                const salesH = yMax > 0 ? (day.revenue / yMax) * 100 : 0;
                const profitH = yMax > 0 ? (day.profit / yMax) * 100 : 0;
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center w-full max-w-[40px] group/bar relative"
                    style={{ height: "100%" }}
                  >
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-3 py-2 text-[11px] text-background shadow-lg opacity-0 transition-opacity duration-150 group-hover/bar:opacity-100">
                      <p className="font-bold">{formatDayLabel(day.date)}</p>
                      <p className="mt-1">
                        <span className="inline-block size-1.5 rounded-full bg-primary mr-1.5 align-middle" />
                        Sales: Rs {day.revenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p>
                        <span className="inline-block size-1.5 rounded-full bg-outline mr-1.5 align-middle" />
                        Profit: Rs {day.profit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      {/* Arrow */}
                      <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-foreground" />
                    </div>

                    <div className="w-full flex items-end gap-1" style={{ height: "100%" }}>
                      <div
                        className="w-1/2 bg-primary rounded-t-sm transition-all duration-300 group-hover/bar:opacity-80"
                        style={{ height: `${Math.max(salesH, 1)}%` }}
                      />
                      <div
                        className="w-1/2 bg-outline rounded-t-sm transition-all duration-300 group-hover/bar:opacity-80"
                        style={{ height: `${Math.max(profitH, 1)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* X-axis labels */}
          <div className="ml-16 flex justify-between px-2 mt-2">
            {data.map((day, i) => (
              <span
                key={i}
                className="text-[10px] font-bold text-muted-foreground w-full max-w-[40px] text-center"
              >
                {formatDayLabel(day.date)}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ── Dashboard Page ──────────────────────────────────────────────────

export function DashboardPage() {
  const { accessToken } = useAuth();
  const [preset, setPreset] = useState<DatePreset>("all");
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [bestSellers, setBestSellers] = useState<BestSellerItem[]>([]);
  const [dailyData, setDailyData] = useState<DailyTrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function handlePresetChange(value: DatePreset) {
    setPreset(value);
    setDraftFrom("");
    setDraftTo("");
    setAppliedFrom("");
    setAppliedTo("");
  }

  function handleCustomDateChange(field: "from" | "to", value: string) {
    if (field === "from") setDraftFrom(value);
    else setDraftTo(value);
  }

  function applyCustomDates() {
    setAppliedFrom(draftFrom);
    setAppliedTo(draftTo);
    setPreset(null as unknown as DatePreset);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!accessToken) return;
      setLoading(true);
      setError(null);

      try {
        const { from, to } = appliedFrom || appliedTo
          ? {
              from: appliedFrom ? new Date(appliedFrom + "T00:00:00Z").toISOString() : undefined,
              to: appliedTo ? new Date(appliedTo + "T23:59:59Z").toISOString() : undefined,
            }
          : getPresetRange(preset);
        const [summaryData, sellersData, dailyResult] = await Promise.allSettled([
          getOrderSummary(accessToken, from, to),
          getBestSellers(accessToken, from, to),
          getDailyTrend(accessToken, from, to),
        ]);

        if (cancelled) return;

        if (summaryData.status === "fulfilled") setSummary(summaryData.value);
        else setSummary(null);

        if (sellersData.status === "fulfilled") setBestSellers(sellersData.value);
        else setBestSellers([]);

        if (dailyResult.status === "fulfilled") {
          setDailyData(dailyResult.value.slice(-MAX_BARS));
        } else {
          setDailyData([]);
        }

        const firstRejected = [summaryData, sellersData, dailyResult].find(
          (r) => r.status === "rejected"
        );
        if (firstRejected && firstRejected.status === "rejected") {
          setError(getErrorMessage(firstRejected.reason));
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
          toast.error("Failed to load dashboard data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [accessToken, preset, appliedFrom, appliedTo]);

  const totalOrders = summary?.totalOrders ?? 0;
  const avgOrderValue = totalOrders > 0 ? (summary?.totalRevenue ?? 0) / totalOrders : 0;

  return (
    <div className="flex flex-col gap-12">
      {/* Header */}
      <header>
        <h1 className="text-[2rem] font-bold text-foreground leading-tight sm:text-5xl">
          Performance Analytics
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Sales and Profit overview for the current period.
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Sales"
          value={`Rs ${(summary?.totalRevenue ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend={preset === "all" ? undefined : "vs selected period"}
          loading={loading}
        />
        <MetricCard
          label="Net Profit"
          value={`Rs ${(summary?.totalProfit ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend={preset === "all" ? undefined : "vs selected period"}
          loading={loading}
        />
        <MetricCard
          label="Average Order Value"
          value={`Rs ${avgOrderValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend={preset === "all" ? undefined : "vs selected period"}
          trendUp={false}
          loading={loading}
        />
        <MetricCard
          label="Total Orders"
          value={String(totalOrders)}
          trend={preset === "all" ? undefined : "vs selected period"}
          loading={loading}
        />
      </section>

      {/* Sales & Profit Trends Bar Chart */}
      <BarChart
        data={dailyData}
        loading={loading}
        preset={preset}
        onPresetChange={handlePresetChange}
        customFrom={draftFrom}
        customTo={draftTo}
        onCustomDateChange={handleCustomDateChange}
        onApply={applyCustomDates}
        hasChanges={draftFrom !== appliedFrom || draftTo !== appliedTo}
      />

      {/* Top Performing Items */}
      <section className="rounded-xl bg-card p-8 border border-border/40 shadow-card">
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Top Performing Items
        </h2>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-4">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : bestSellers.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            No sales data for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/30 text-muted-foreground">
                  <th className="py-4 px-2 text-xs font-bold uppercase tracking-wider">
                    Item
                  </th>
                  <th className="py-4 px-2 text-xs font-bold uppercase tracking-wider text-right">
                    Sessions
                  </th>
                  <th className="py-4 px-2 text-xs font-bold uppercase tracking-wider text-right">
                    Qty Sold
                  </th>
                  <th className="py-4 px-2 text-xs font-bold uppercase tracking-wider text-right">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {bestSellers.map((item, i) => (
                  <tr key={i} className="hover:bg-surface-container-low transition-colors group">
                    <td className="py-4 px-2">
                      <span className="font-semibold italic text-foreground group-hover:text-primary transition-colors">
                        {item.name}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-right text-secondary">
                      {item.sessionCount}
                    </td>
                    <td className="py-4 px-2 text-right text-secondary">
                      {item.quantitySold}
                    </td>
                    <td className="py-4 px-2 text-right text-base font-medium text-foreground">
                      Rs {item.revenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
