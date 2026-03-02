"use client";

import { Render, Data } from "@measured/puck";
import { puckConfig } from "@/lib/puck/config";

interface PuckRendererProps {
  data: Data | null | undefined;
  fallback?: React.ReactNode;
}

export function PuckRenderer({ data, fallback }: PuckRendererProps) {
  // Return fallback if no data or empty content
  if (!data || !data.content || data.content.length === 0) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <div className="puck-content">
      <Render config={puckConfig} data={data} />
    </div>
  );
}

export default PuckRenderer;
