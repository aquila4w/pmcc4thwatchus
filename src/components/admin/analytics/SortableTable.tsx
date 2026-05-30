"use client";

import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: "left" | "right" | "center";
  render?: (row: T) => React.ReactNode;
  compare?: (a: T, b: T) => number;
}

interface SortableTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKeys?: string[];
  onRowClick?: (row: T) => void;
  expandedRow?: (row: T) => React.ReactNode;
  expandedId?: string | null;
  emptyMessage?: string;
}

export function SortableTable<T extends { id?: string }>({
  data,
  columns,
  searchPlaceholder = "Search...",
  searchKeys = [],
  onRowClick,
  expandedRow,
  expandedId,
  emptyMessage = "No data available",
}: SortableTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim() || searchKeys.length === 0) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((k) => {
        const val = (row as Record<string, unknown>)[k];
        return String(val ?? "").toLowerCase().includes(q);
      })
    );
  }, [data, search, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    return [...filtered].sort((a, b) => {
      if (col?.compare) {
        return sortDir === "asc" ? col.compare(a, b) : col.compare(b, a);
      }
      const av = (a as Record<string, unknown>)[sortKey];
      const bv = (b as Record<string, unknown>)[sortKey];
      const cmp = (av ?? 0) < (bv ?? 0) ? -1 : (av ?? 0) > (bv ?? 0) ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir, columns]);

  const getAlignClass = (align?: "left" | "right" | "center") => {
    const a = align || "left";
    return a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";
  };

  return (
    <div>
      {searchKeys.length > 0 && (
        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
          <colgroup>
            {columns.map((col, i) => (
              <col
                key={col.key}
                style={{
                  width: i === 0 ? "auto" : "120px",
                }}
              />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b bg-slate-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`relative py-3 px-4 pr-9 font-medium text-slate-500 ${getAlignClass(col.align)} ${
                    col.sortable !== false ? "cursor-pointer select-none hover:text-slate-700" : ""
                  }`}
                  onClick={col.sortable !== false ? () => handleSort(col.key) : undefined}
                >
                  {col.label}
                  {col.sortable !== false && (
                    <span className="absolute top-1/2 -translate-y-1/2 right-3">
                      {sortKey === col.key ? (
                        sortDir === "asc" ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 opacity-30" />
                      )}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const rowId = row.id ?? `row-${i}`;
              const isExpanded = expandedId === rowId;
              return (
                <tbody key={rowId}>
                  <tr
                    className={`border-b hover:bg-slate-50 transition-colors ${
                      onRowClick ? "cursor-pointer" : ""
                    } ${isExpanded ? "bg-slate-50" : ""}`}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={`py-3 px-4 pr-9 ${getAlignClass(col.align)}`}>
                        {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                  {isExpanded && expandedRow && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={columns.length} className="p-0">
                        {expandedRow(row)}
                      </td>
                    </tr>
                  )}
                </tbody>
              );
            })}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="text-center py-8 text-slate-500">{emptyMessage}</div>
        )}
      </div>
    </div>
  );
}
