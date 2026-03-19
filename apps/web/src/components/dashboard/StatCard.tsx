import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    label: string;
  };
  icon?: ReactNode;
  isLoading?: boolean;
}

function TrendBadge({ value, label }: { value: number; label: string }) {
  const isPositive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        isPositive ? "text-emerald-600" : "text-red-600"
      }`}
    >
      <span>{isPositive ? "+" : ""}{value}%</span>
      <span className="font-normal text-muted-foreground">{label}</span>
    </span>
  );
}

export function StatCard({
  title,
  value,
  description,
  trend,
  icon,
  isLoading = false,
}: StatCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-3 w-40 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon && (
          <div className="rounded-md bg-muted p-2 text-muted-foreground">{icon}</div>
        )}
      </div>

      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>

      {(description || trend) && (
        <div className="mt-1 flex items-center gap-2">
          {trend && <TrendBadge value={trend.value} label={trend.label} />}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}
    </div>
  );
}
