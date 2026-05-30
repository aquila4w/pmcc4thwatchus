"use client";

import { type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MetricCardProps {
  icon: LucideIcon;
  value: number | string;
  label: string;
  iconBg?: string;
  iconColor?: string;
}

export function MetricCard({
  icon: Icon,
  value,
  label,
  iconBg = "bg-blue-100",
  iconColor = "text-blue-600",
}: MetricCardProps) {
  return (
    <Card className="bg-white p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div>
          <p className="text-3xl font-bold">{value}</p>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </div>
    </Card>
  );
}
