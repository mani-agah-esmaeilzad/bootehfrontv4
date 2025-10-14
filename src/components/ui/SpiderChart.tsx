// src/components/ui/SpiderChart.tsx

import "@/lib/chartSetup";
import * as React from "react";
import { Radar } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import { ensureRtlText } from "@/lib/reportCharts";

interface RadarDatum {
  subject: string;
  score: number;
  fullMark: number;
}

interface SpiderChartProps {
  data: RadarDatum[];
  className?: string;
}

export function SpiderChart({ data, className }: SpiderChartProps) {
  const maxScore = React.useMemo(
    () => Math.max(...data.map((item) => item.fullMark), 5),
    [data],
  );

  const chartData: ChartData<"radar"> = React.useMemo(
    () => ({
      labels: data.map((item) => ensureRtlText(item.subject)),
      datasets: [
        {
          label: ensureRtlText("امتیاز"),
          data: data.map((item) => item.score),
          backgroundColor: "rgba(59, 130, 246, 0.3)",
          borderColor: "rgba(59, 130, 246, 0.8)",
          borderWidth: 2,
          pointBackgroundColor: "rgba(59, 130, 246, 0.9)",
          pointBorderColor: "#ffffff",
          pointHoverRadius: 5,
          fill: true,
        },
      ],
    }),
    [data],
  );

  const chartOptions: ChartOptions<"radar"> = React.useMemo(
    () => ({
      maintainAspectRatio: false,
      scales: {
        r: {
          suggestedMin: 0,
          suggestedMax: maxScore,
          ticks: {
            backdropColor: "transparent",
            stepSize: Math.max(1, Math.ceil(maxScore / 5)),
            showLabelBackdrop: false,
            font: { family: "Vazir, Tahoma, sans-serif" },
          },
          angleLines: { color: "#cbd5f5" },
          grid: { color: "#cbd5f5" },
          pointLabels: {
            font: { family: "Vazir, Tahoma, sans-serif", size: 12 },
          },
        },
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: { family: "Vazir, Tahoma, sans-serif" },
            rtl: true,
            usePointStyle: true,
          },
        },
        tooltip: {
          rtl: true,
          bodyFont: { family: "Vazir, Tahoma, sans-serif" },
          titleFont: { family: "Vazir, Tahoma, sans-serif" },
          callbacks: {
            title: (items) => ensureRtlText(items?.[0]?.label ?? ""),
            label: (item) =>
              ensureRtlText(
                `امتیاز: ${item.formattedValue} از ${data[item.dataIndex]?.fullMark ?? ""}`,
              ),
          },
        },
      },
    }),
    [data, maxScore],
  );

  return (
    <div
      className={
        className ??
        "relative mx-auto h-full w-full max-h-[420px] rounded-2xl bg-[#0b0f19] p-4 shadow-lg"
      }
    >
      <Radar data={chartData} options={chartOptions} />
    </div>
  );
}
