"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DateRange {
  from?: string;
  to?: string;
  label: string;
}

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESETS: { label: string; days?: number }[] = [
  { label: "All Time" },
  { label: "Last 7 Days", days: 7 },
  { label: "Last 30 Days", days: 30 },
  { label: "Last 90 Days", days: 90 },
];

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const handlePreset = (preset: (typeof PRESETS)[number]) => {
    setShowCustom(false);
    if (!preset.days) {
      onChange({ label: "All Time" });
    } else {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - preset.days);
      onChange({
        from: from.toISOString().split("T")[0],
        to: to.toISOString().split("T")[0],
        label: preset.label,
      });
    }
  };

  const handleCustomApply = () => {
    if (customFrom || customTo) {
      onChange({
        from: customFrom || undefined,
        to: customTo || undefined,
        label: "Custom",
      });
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Calendar className="w-4 h-4 text-slate-400" />
      {PRESETS.map((preset) => (
        <Button
          key={preset.label}
          variant={value.label === preset.label && !showCustom ? "default" : "outline"}
          size="sm"
          onClick={() => handlePreset(preset)}
          className="text-xs"
        >
          {preset.label}
        </Button>
      ))}
      <Button
        variant={showCustom ? "default" : "outline"}
        size="sm"
        onClick={() => setShowCustom(!showCustom)}
        className="text-xs"
      >
        Custom
      </Button>
      {showCustom && (
        <div className="flex items-center gap-2 ml-2">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="text-xs border rounded px-2 py-1"
            placeholder="From"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="text-xs border rounded px-2 py-1"
            placeholder="To"
          />
          <Button size="sm" onClick={handleCustomApply} className="text-xs">
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}
