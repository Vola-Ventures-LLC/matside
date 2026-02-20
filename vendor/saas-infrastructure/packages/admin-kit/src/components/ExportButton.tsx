import { useState } from "react";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import { Button } from "@saas-infra/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@saas-infra/ui/dropdown-menu";
import { exportData } from "@saas-infra/utils";

type ExportFormat = "csv" | "json";

interface ExportButtonProps<T extends Record<string, unknown>> {
  data: T[];
  filename: string;
  disabled?: boolean;
  onError?: (title: string, description: string) => void;
  onSuccess?: (title: string, description: string) => void;
}

export function ExportButton<T extends Record<string, unknown>>({
  data,
  filename,
  disabled = false,
  onError,
  onSuccess,
}: ExportButtonProps<T>) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = (format: ExportFormat) => {
    if (data.length === 0) {
      onError?.("Nothing to export", "The table is empty.");
      return;
    }

    setIsExporting(true);
    try {
      exportData(data, { filename, format });
      onSuccess?.("Export complete", `Downloaded ${data.length} rows as ${format.toUpperCase()}.`);
    } catch (error) {
      onError?.("Export failed", "Could not export the data.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isExporting || data.length === 0}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("json")}>
          <FileJson className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
