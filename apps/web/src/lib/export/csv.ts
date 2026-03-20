import { z } from "zod";

export const csvExportSchema = z.object({
  filename: z.string().min(1).default("export"),
  columns: z.array(
    z.object({
      key: z.string(),
      header: z.string(),
      format: z.enum(["string", "date", "number", "boolean"]).default("string"),
    })
  ),
  rows: z.array(z.record(z.unknown())),
});

export type CsvExportConfig = z.infer<typeof csvExportSchema>;

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatValue(value: unknown, format: string): string {
  if (value === null || value === undefined) return "";
  switch (format) {
    case "date":
      return value instanceof Date
        ? value.toISOString()
        : new Date(String(value)).toISOString();
    case "boolean":
      return value ? "true" : "false";
    case "number":
      return String(Number(value));
    default:
      return String(value);
  }
}

export function generateCsvString(config: CsvExportConfig): string {
  const parsed = csvExportSchema.parse(config);
  const lines: string[] = [];

  const headerRow = parsed.columns.map((c) => escapeCell(c.header)).join(",");
  lines.push(headerRow);

  for (const row of parsed.rows) {
    const cells = parsed.columns.map((col) => {
      const raw = row[col.key];
      return escapeCell(formatValue(raw, col.format));
    });
    lines.push(cells.join(","));
  }

  return lines.join("\r\n");
}

export function downloadCsv(config: CsvExportConfig): void {
  const parsed = csvExportSchema.parse(config);
  const content = generateCsvString(parsed);
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${parsed.filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function projectsToCsvConfig(
  projects: Array<{ id: string; name: string; status: string; createdAt: Date; memberCount: number }>
): CsvExportConfig {
  return {
    filename: "projects-export",
    columns: [
      { key: "id", header: "ID", format: "string" },
      { key: "name", header: "Name", format: "string" },
      { key: "status", header: "Status", format: "string" },
      { key: "createdAt", header: "Created At", format: "date" },
      { key: "memberCount", header: "Members", format: "number" },
    ],
    rows: projects,
  };
}

export function auditLogsToCsvConfig(
  logs: Array<{ id: string; action: string; actorEmail: string; createdAt: Date; metadata: unknown }>
): CsvExportConfig {
  return {
    filename: "audit-log-export",
    columns: [
      { key: "id", header: "ID", format: "string" },
      { key: "action", header: "Action", format: "string" },
      { key: "actorEmail", header: "Actor", format: "string" },
      { key: "createdAt", header: "Timestamp", format: "date" },
      { key: "metadata", header: "Metadata", format: "string" },
    ],
    rows: logs.map((l) => ({ ...l, metadata: JSON.stringify(l.metadata) })),
  };
}
