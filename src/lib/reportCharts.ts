// src/lib/reportCharts.ts
import "@/lib/chartSetup";
import type { ChartData, ChartOptions } from "chart.js";

const PALETTE = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A020F0", "#FF69B4", "#38BDF8", "#F472B6"];
const RTL_CHAR_PATTERN = /[\u0600-\u06FF]/;

export const ensureRtlText = (value: unknown): string => {
  if (typeof value !== "string") return String(value ?? "");
  if (!RTL_CHAR_PATTERN.test(value)) return value;
  if (value.includes("\u200F")) return value;
  return `\u200F${value}\u200F`;
};

const mapLabels = (items: string[]) => items.map((item) => ensureRtlText(item ?? ""));

const commonLegend = {
  position: "top" as const,
  labels: {
    font: { family: "Vazir, Tahoma, sans-serif" },
    rtl: true,
    usePointStyle: true,
  },
};

const commonTooltip = {
  rtl: true,
  bodyFont: { family: "Vazir, Tahoma, sans-serif" },
  titleFont: { family: "Vazir, Tahoma, sans-serif" },
};

export type ReportChartConfigs = ReturnType<typeof createReportChartConfigs>;

export const createReportChartConfigs = (analysis: any) => {
  const factorScores = Array.isArray(analysis?.factor_scores) ? analysis.factor_scores : [];
  const sentimentEntries = analysis?.sentiment_analysis
    ? Object.entries(analysis.sentiment_analysis)
    : [];
  const keywordEntries = Array.isArray(analysis?.keyword_analysis) ? analysis.keyword_analysis : [];
  const verbosityEntries = Array.isArray(analysis?.verbosity_trend) ? analysis.verbosity_trend : [];
  const actionOrientation = analysis?.action_orientation ?? null;
  const problemSolvingEntries = analysis?.problem_solving_approach
    ? Object.entries(analysis.problem_solving_approach)
    : [];
  const communicationEntries = analysis?.communication_style
    ? Object.entries(analysis.communication_style)
    : [];
  const semanticAnalysis = analysis?.linguistic_semantic_analysis ?? {};
  const pronounUsage = semanticAnalysis?.pronoun_usage ?? {};
  const semanticFields = Array.isArray(semanticAnalysis?.semantic_fields)
    ? semanticAnalysis.semantic_fields
    : [];

  const radarLabels = factorScores.map((item: any) => ensureRtlText(item.factor));
  const radarMax =
    factorScores.reduce((acc: number, item: any) => Math.max(acc, Number(item.maxScore) || 0), 0) || 5;

  const radarData: ChartData<"radar"> = {
    labels: radarLabels,
    datasets: [
      {
        label: ensureRtlText("امتیاز"),
        data: factorScores.map((item: any) => Number(item.score) || 0),
        backgroundColor: "rgba(59, 130, 246, 0.3)",
        borderColor: "rgba(59, 130, 246, 0.8)",
        borderWidth: 2,
        pointBackgroundColor: "rgba(59, 130, 246, 0.9)",
        pointBorderColor: "#ffffff",
        pointHoverRadius: 5,
        fill: true,
      },
    ],
  };

  const radarOptions: ChartOptions<"radar"> = {
    maintainAspectRatio: false,
    scales: {
      r: {
        suggestedMin: 0,
        suggestedMax: radarMax,
        ticks: {
          backdropColor: "transparent",
          stepSize: Math.max(1, Math.ceil(radarMax / 5)),
          showLabelBackdrop: false,
          font: { family: "Vazir, Tahoma, sans-serif" },
        },
        angleLines: { color: "#e2e8f0" },
        grid: { color: "#e2e8f0" },
        pointLabels: {
          font: { family: "Vazir, Tahoma, sans-serif", size: 12 },
        },
      },
    },
    plugins: {
      legend: commonLegend,
      tooltip: commonTooltip,
    },
  };

  const sentimentData: ChartData<"pie"> | null = sentimentEntries.length
    ? {
        labels: mapLabels(sentimentEntries.map(([key]) => key)),
        datasets: [
          {
            data: sentimentEntries.map(([, value]) => Number(value) || 0),
            backgroundColor: sentimentEntries.map((_, idx) => PALETTE[idx % PALETTE.length]),
          },
        ],
      }
    : null;

  const sentimentOptions: ChartOptions<"pie"> = {
    maintainAspectRatio: false,
    plugins: {
      legend: commonLegend,
      tooltip: commonTooltip,
    },
  };

  const keywordData: ChartData<"bar"> | null = keywordEntries.length
    ? {
        labels: mapLabels(keywordEntries.map((item: any) => item.keyword)),
        datasets: [
          {
            label: ensureRtlText("تعداد تکرار"),
            data: keywordEntries.map((item: any) => Number(item.mentions) || 0),
            backgroundColor: "#22c55e",
          },
        ],
      }
    : null;

  const horizontalBarOptions: ChartOptions<"bar"> = {
    maintainAspectRatio: false,
    indexAxis: "y",
    plugins: {
      legend: { display: false },
      tooltip: commonTooltip,
    },
    scales: {
      x: {
        ticks: { font: { family: "Vazir, Tahoma, sans-serif" } },
        grid: { color: "#e2e8f0" },
      },
      y: {
        ticks: {
          font: { family: "Vazir, Tahoma, sans-serif" },
          callback: (value: any) => ensureRtlText(String(value)),
        },
        grid: { display: false },
      },
    },
  };

  const verbosityData: ChartData<"line"> | null = verbosityEntries.length
    ? {
        labels: mapLabels(verbosityEntries.map((item: any) => `نوبت ${item.turn}`)),
        datasets: [
          {
            label: ensureRtlText("تعداد کلمات"),
            data: verbosityEntries.map((item: any) => Number(item.word_count) || 0),
            borderColor: "#f97316",
            backgroundColor: "rgba(249, 115, 22, 0.3)",
            tension: 0.3,
            fill: true,
          },
        ],
      }
    : null;

  const lineOptions: ChartOptions<"line"> = {
    maintainAspectRatio: false,
    plugins: {
      legend: commonLegend,
      tooltip: commonTooltip,
    },
    scales: {
      x: {
        ticks: { font: { family: "Vazir, Tahoma, sans-serif" } },
        grid: { color: "#e2e8f0" },
      },
      y: {
        ticks: { font: { family: "Vazir, Tahoma, sans-serif" } },
        grid: { color: "#e2e8f0" },
      },
    },
  };

  const actionData: ChartData<"bar"> | null = actionOrientation
    ? {
        labels: [ensureRtlText("مقایسه")],
        datasets: [
          {
            label: ensureRtlText("کلمات کنش‌محور"),
            data: [Number(actionOrientation.action_words) || 0],
            backgroundColor: "#6366f1",
          },
          {
            label: ensureRtlText("کلمات منفعل"),
            data: [Number(actionOrientation.passive_words) || 0],
            backgroundColor: "#22c55e",
          },
        ],
      }
    : null;

  const actionOptions: ChartOptions<"bar"> = {
    maintainAspectRatio: false,
    plugins: {
      legend: commonLegend,
      tooltip: commonTooltip,
    },
    scales: {
      x: {
        ticks: { font: { family: "Vazir, Tahoma, sans-serif" } },
        grid: { display: false },
      },
      y: {
        ticks: { font: { family: "Vazir, Tahoma, sans-serif" } },
        grid: { color: "#e2e8f0" },
      },
    },
  };

  const problemSolvingData: ChartData<"pie"> | null = problemSolvingEntries.length
    ? {
        labels: mapLabels(problemSolvingEntries.map(([key]) => key)),
        datasets: [
          {
            data: problemSolvingEntries.map(([, value]) => Number(value) || 0),
            backgroundColor: problemSolvingEntries.map(
              (_, idx) => PALETTE[(idx + 2) % PALETTE.length],
            ),
          },
        ],
      }
    : null;

  const communicationData: ChartData<"bar"> | null = communicationEntries.length
    ? {
        labels: mapLabels(communicationEntries.map(([key]) => key)),
        datasets: [
          {
            label: ensureRtlText("درصد"),
            data: communicationEntries.map(([, value]) => Number(value) || 0),
            backgroundColor: "#a855f7",
          },
        ],
      }
    : null;

  const scatterData: ChartData<"scatter"> | null = factorScores.length
    ? {
        datasets: [
          {
            label: ensureRtlText("امتیازها"),
            data: factorScores.map((item: any) => ({
              x: Number(item.score) || 0,
              y: Number(item.fullMark) || 0,
              label: ensureRtlText(item.factor),
            })),
            backgroundColor: "#f97316",
          },
        ],
      }
    : null;

  const scatterOptions: ChartOptions<"scatter"> = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...commonTooltip,
        callbacks: {
          title: (items) => ensureRtlText(items?.[0]?.raw?.label ?? ""),
          label: (item) =>
            ensureRtlText(`امتیاز: ${item.raw?.x ?? 0} از ${item.raw?.y ?? 0}`),
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: ensureRtlText("امتیاز کسب‌شده"), font: { family: "Vazir" } },
        ticks: { font: { family: "Vazir, Tahoma, sans-serif" } },
        grid: { color: "#e2e8f0" },
      },
      y: {
        title: { display: true, text: ensureRtlText("حداکثر امتیاز"), font: { family: "Vazir" } },
        ticks: { font: { family: "Vazir, Tahoma, sans-serif" } },
        grid: { color: "#e2e8f0" },
      },
    },
  };

  const pronounDataEntries = [
    ["اول شخص", pronounUsage.first_person],
    ["دوم شخص", pronounUsage.second_person],
    ["سوم شخص", pronounUsage.third_person],
  ].filter(([, value]) => value !== undefined);

  const pronounData: ChartData<"doughnut"> | null = pronounDataEntries.length
    ? {
        labels: mapLabels(pronounDataEntries.map(([key]) => key)),
        datasets: [
          {
            data: pronounDataEntries.map(([, value]) => Number(value) || 0),
            backgroundColor: pronounDataEntries.map((_, idx) => PALETTE[idx % PALETTE.length]),
          },
        ],
      }
    : null;

  const semanticFieldData: ChartData<"bar"> | null = semanticFields.length
    ? {
        labels: mapLabels(semanticFields.map((item: any) => item.field)),
        datasets: [
          {
            label: ensureRtlText("تعداد"),
            data: semanticFields.map((item: any) => Number(item.mentions) || 0),
            backgroundColor: "#14b8a6",
          },
        ],
      }
    : null;

  const distributionData: ChartData<"line"> | null = factorScores.length
    ? {
        labels: mapLabels(factorScores.map((item: any) => item.factor)),
        datasets: [
          {
            label: ensureRtlText("امتیاز"),
            data: factorScores.map((item: any) => Number(item.score) || 0),
            borderColor: "#0ea5e9",
            backgroundColor: "rgba(14, 165, 233, 0.25)",
            fill: true,
            tension: 0.35,
          },
        ],
      }
    : null;

  const distributionOptions: ChartOptions<"line"> = {
    maintainAspectRatio: false,
    plugins: {
      legend: commonLegend,
      tooltip: commonTooltip,
    },
    scales: {
      x: {
        ticks: { font: { family: "Vazir, Tahoma, sans-serif" } },
        grid: { color: "#e2e8f0" },
      },
      y: {
        ticks: { font: { family: "Vazir, Tahoma, sans-serif" } },
        grid: { color: "#e2e8f0" },
      },
    },
  };

  return {
    radar: { data: radarData, options: radarOptions },
    sentiment: sentimentData ? { data: sentimentData, options: sentimentOptions } : null,
    keywords: keywordData ? { data: keywordData, options: horizontalBarOptions } : null,
    verbosity: verbosityData ? { data: verbosityData, options: lineOptions } : null,
    action: actionData ? { data: actionData, options: actionOptions } : null,
    problemSolving: problemSolvingData ? { data: problemSolvingData, options: sentimentOptions } : null,
    communication: communicationData ? { data: communicationData, options: actionOptions } : null,
    scatter: scatterData ? { data: scatterData, options: scatterOptions } : null,
    pronouns: pronounData ? { data: pronounData, options: sentimentOptions } : null,
    semanticFields: semanticFieldData ? { data: semanticFieldData, options: horizontalBarOptions } : null,
    distribution: distributionData ? { data: distributionData, options: distributionOptions } : null,
    palette: PALETTE,
  };
};
