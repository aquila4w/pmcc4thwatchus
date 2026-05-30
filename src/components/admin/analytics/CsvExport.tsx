"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CsvExportProps {
  data: Record<string, unknown>[];
  filename: string;
  label?: string;
}

function toCsvRow(values: unknown[]): string {
  return values.map((v) => {
    const s = String(v ?? "");
    // Escape quotes and wrap if contains comma, quote, or newline
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }).join(",");
}

export function CsvExport({ data, filename, label = "Export CSV" }: CsvExportProps) {
  const handleExport = () => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const rows = data.map((row) => headers.map((h) => row[h]));
    const csv = [toCsvRow(headers), ...rows.map(toCsvRow)].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={data.length === 0}>
      <Download className="w-4 h-4 mr-2" />
      {label}
    </Button>
  );
}
