// src/components/ui/ComparisonSpiderChart.tsx

import * as React from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { normalizeBidi } from "@/lib/bidi";

interface SeriesConfig {
  key: string;
  label: string;
  color: string;
}

interface ComparisonSpiderChartProps {
  data: Array<{ subject: string; fullMark?: number; [key: string]: string | number | undefined }>;
  series: SeriesConfig[];
  maxDomain?: number;
}

const ComparisonTooltip = ({ active, payload }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-md border border-slate-700 bg-slate-900/95 px-3 py-2 text-sm text-white shadow-lg">
      <p className="font-semibold rtl">{normalizeBidi(payload[0]?.payload?.subject)}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }} className="text-xs">
          {normalizeBidi(entry.name)}: {entry.value?.toFixed ? entry.value.toFixed(1) : entry.value}
        </p>
      ))}
    </div>
  );
};

export const ComparisonSpiderChart = ({ data, series, maxDomain }: ComparisonSpiderChartProps) => {
  const computedMax = React.useMemo(() => {
    if (typeof maxDomain === "number") return maxDomain;
    const maxValue = data.reduce((acc, entry) => {
      const candidate = Math.max(
        entry.fullMark ?? 0,
        ...series.map((item) => (typeof entry[item.key] === "number" ? Number(entry[item.key]) : 0))
      );
      return Math.max(acc, candidate);
    }, 0);
    return Math.max(5, maxValue);
  }, [data, series, maxDomain]);

  const fontFamily = "Vazirmatn, Tahoma, sans-serif";

  return (
    <ChartContainer
      config={{}}
      className="mx-auto h-full w-full max-h-[480px] rounded-2xl bg-white p-2 text-slate-900"
    >
      <ResponsiveContainer className="chart-ltr">
        <RadarChart data={data}>
          <PolarGrid gridType="polygon" stroke="#94a3b8" strokeDasharray="4 4" radialLines />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#0f172a", fontSize: 13, fontWeight: 600, fontFamily }}
            tickFormatter={(value: string) => normalizeBidi(value)}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, computedMax]}
            tick={{ fill: "#334155", fontSize: 12, fontFamily }}
            stroke="#cbd5f5"
            axisLine={false}
          />
          {series.map((serie) => (
            <Radar
              key={serie.key}
              name={serie.label}
              dataKey={serie.key}
              stroke={serie.color}
              fill={serie.color}
              fillOpacity={0.18}
              strokeWidth={2.4}
              dot={{ r: 3, fill: "#fff", stroke: serie.color, strokeWidth: 1 }}
              activeDot={{ r: 5 }}
            />
          ))}
          <Tooltip content={<ComparisonTooltip />} />
          <Legend
            verticalAlign="bottom"
            wrapperStyle={{
              color: "#0f172a",
              fontSize: 13,
              fontFamily,
              paddingTop: 16,
              direction: "rtl",
            }}
            formatter={(value) => normalizeBidi(value)}
          />
        </RadarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
