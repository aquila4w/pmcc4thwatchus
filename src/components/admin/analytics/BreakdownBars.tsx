"use client";

interface BreakdownItem {
  scans: number;
  conversionRate: number;
  [key: string]: unknown;
}

interface BreakdownBarsProps {
  items: BreakdownItem[];
  labelKey: string;
}

export function BreakdownBars({ items, labelKey }: BreakdownBarsProps) {
  if (items.length === 0) {
    return <p className="text-slate-500 text-center py-4">No data available</p>;
  }
  const maxScans = Math.max(...items.map((i) => i.scans), 1);
  return (
    <div className="space-y-3">
      {items
        .sort((a, b) => b.scans - a.scans)
        .map((item) => {
          const pct = Math.round((item.scans / maxScans) * 100);
          return (
            <div key={String(item[labelKey])}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="capitalize truncate">{String(item[labelKey])}</span>
                <span className="text-slate-500">
                  {item.scans} scan{item.scans !== 1 ? "s" : ""} &middot; {item.conversionRate}% conv.
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
    </div>
  );
}
