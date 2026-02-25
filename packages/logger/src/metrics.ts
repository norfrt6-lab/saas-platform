/**
 * Lightweight in-memory metrics collection for Prometheus-compatible export.
 * Designed for single-instance deployments. For multi-instance, export to
 * a real Prometheus server or use a push gateway.
 */

interface CounterEntry {
  value: number;
  labels: Record<string, string>;
}

interface HistogramEntry {
  count: number;
  sum: number;
  buckets: Map<number, number>;
  labels: Record<string, string>;
}

const counters = new Map<string, CounterEntry[]>();
const histograms = new Map<string, { entries: HistogramEntry[]; bucketBounds: number[] }>();

const DEFAULT_HISTOGRAM_BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

function labelKey(labels: Record<string, string>): string {
  return Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}="${v}"`)
    .join(",");
}

function findOrCreateCounter(name: string, labels: Record<string, string>): CounterEntry {
  if (!counters.has(name)) counters.set(name, []);
  const entries = counters.get(name)!;
  const key = labelKey(labels);
  let entry = entries.find((e) => labelKey(e.labels) === key);
  if (!entry) {
    entry = { value: 0, labels };
    entries.push(entry);
  }
  return entry;
}

function findOrCreateHistogram(name: string, labels: Record<string, string>, bucketBounds: number[]): HistogramEntry {
  if (!histograms.has(name)) histograms.set(name, { entries: [], bucketBounds });
  const { entries } = histograms.get(name)!;
  const key = labelKey(labels);
  let entry = entries.find((e) => labelKey(e.labels) === key);
  if (!entry) {
    entry = { count: 0, sum: 0, buckets: new Map(), labels };
    for (const b of bucketBounds) entry.buckets.set(b, 0);
    entries.push(entry);
  }
  return entry;
}

export function incrementCounter(name: string, labels: Record<string, string> = {}, value = 1): void {
  findOrCreateCounter(name, labels).value += value;
}

export function observeHistogram(
  name: string,
  value: number,
  labels: Record<string, string> = {},
  bucketBounds = DEFAULT_HISTOGRAM_BUCKETS,
): void {
  const entry = findOrCreateHistogram(name, labels, bucketBounds);
  entry.count++;
  entry.sum += value;
  for (const bound of bucketBounds) {
    if (value <= bound) {
      entry.buckets.set(bound, (entry.buckets.get(bound) ?? 0) + 1);
    }
  }
}

function formatLabels(labels: Record<string, string>): string {
  const pairs = Object.entries(labels).map(([k, v]) => `${k}="${v}"`);
  return pairs.length > 0 ? `{${pairs.join(",")}}` : "";
}

/**
 * Export all metrics in Prometheus text exposition format.
 */
export function exportMetrics(): string {
  const lines: string[] = [];

  for (const [name, entries] of counters) {
    lines.push(`# TYPE ${name} counter`);
    for (const entry of entries) {
      lines.push(`${name}${formatLabels(entry.labels)} ${entry.value}`);
    }
  }

  for (const [name, { entries, bucketBounds }] of histograms) {
    lines.push(`# TYPE ${name} histogram`);
    for (const entry of entries) {
      const lblStr = formatLabels(entry.labels);
      let cumulative = 0;
      for (const bound of bucketBounds) {
        cumulative += entry.buckets.get(bound) ?? 0;
        const bucketLabels = { ...entry.labels, le: String(bound) };
        lines.push(`${name}_bucket${formatLabels(bucketLabels)} ${cumulative}`);
      }
      const infLabels = { ...entry.labels, le: "+Inf" };
      lines.push(`${name}_bucket${formatLabels(infLabels)} ${entry.count}`);
      lines.push(`${name}_sum${lblStr} ${entry.sum}`);
      lines.push(`${name}_count${lblStr} ${entry.count}`);
    }
  }

  return lines.join("\n") + "\n";
}

/**
 * Reset all metrics. Useful for testing.
 */
export function resetMetrics(): void {
  counters.clear();
  histograms.clear();
}
