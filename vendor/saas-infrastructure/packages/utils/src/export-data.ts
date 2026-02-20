/**
 * Utility for exporting table data to CSV or JSON
 */

export type ExportFormat = "csv" | "json";

interface ExportOptions {
  filename: string;
  format?: ExportFormat;
}

/**
 * Convert an array of objects to CSV string
 */
function toCSV<T extends Record<string, unknown>>(data: T[], columns?: (keyof T)[]): string {
  if (data.length === 0) return "";

  const headers = columns || (Object.keys(data[0]) as (keyof T)[]);

  const headerRow = headers.map(h => `"${String(h)}"`).join(",");

  const rows = data.map(row =>
    headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '""';
      if (typeof value === "object") return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(",")
  );

  return [headerRow, ...rows].join("\n");
}

/**
 * Trigger a file download in the browser
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data to CSV or JSON file
 */
export function exportData<T extends Record<string, unknown>>(
  data: T[],
  options: ExportOptions
): void {
  const { filename, format = "csv" } = options;
  const timestamp = new Date().toISOString().split("T")[0];
  const fullFilename = `${filename}_${timestamp}.${format}`;

  if (format === "json") {
    const content = JSON.stringify(data, null, 2);
    downloadFile(content, fullFilename, "application/json");
  } else {
    const content = toCSV(data);
    downloadFile(content, fullFilename, "text/csv");
  }
}

/**
 * Flatten nested objects for CSV export
 */
export function flattenForExport<T extends Record<string, unknown>>(
  data: T[],
  nestedKeys?: Record<string, string[]>
): Record<string, unknown>[] {
  return data.map(item => {
    const flat: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(item)) {
      if (nestedKeys && nestedKeys[key] && typeof value === "object" && value !== null) {
        // Extract specific nested keys
        for (const nestedKey of nestedKeys[key]) {
          flat[`${key}_${nestedKey}`] = (value as Record<string, unknown>)[nestedKey];
        }
      } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        // Flatten all nested keys
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          flat[`${key}_${nestedKey}`] = nestedValue;
        }
      } else {
        flat[key] = value;
      }
    }

    return flat;
  });
}
