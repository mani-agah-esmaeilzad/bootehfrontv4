// src/components/pdf/ReportPDFLayout.tsx
import React from "react";
import ReactMarkdown from "react-markdown";
import { Logo } from "@/components/ui/logo";
import { withRtlFields } from "@/lib/reports";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

interface ReportDetail {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  questionnaire_title: string;
  completed_at: string | null;
  max_score?: number;
  analysis: any;
}

interface PDFLayoutProps {
  report: ReportDetail;
}

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;
const pageStyle: React.CSSProperties = {
  width: `${A4_WIDTH}px`,
  minHeight: `${A4_HEIGHT}px`,
  padding: "40px",
  backgroundColor: "white",
  color: "#111827",
  boxSizing: "border-box",
  minWidth: 0,
  overflow: "hidden",
  direction: "rtl",
  fontFamily: "Vazirmatn, Tahoma, sans-serif",
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};
const COLORS = ["#0ea5e9", "#22c55e", "#f97316", "#6366f1", "#facc15", "#ec4899"];
const chartFontFamily = "Vazirmatn, Tahoma, sans-serif";
const baseAxisTick = { fill: "#374151", fontFamily: chartFontFamily, fontSize: 11 };
const legendStyle: React.CSSProperties = {
  fontFamily: chartFontFamily,
  fontSize: "12px",
  direction: "rtl",
  color: "#111827",
};
const CHART_SIZES = {
  HALF: { width: 320, height: 220 },
  HALF_TALL: { width: 320, height: 260 },
  HALF_MEDIUM: { width: 320, height: 240 },
  FULL: { width: 680, height: 220 },
  FULL_TALL: { width: 680, height: 260 },
  FULL_WIDE: { width: 680, height: 280 },
} as const;
const defaultChartMargin = { top: 12, right: 16, bottom: 16, left: 16 };
const semanticChartMargin = { top: 12, right: 16, bottom: 12, left: 140 };
const PlainTable = ({
  columns,
  rows,
}: {
  columns: Array<{ key: string; label: string; width?: string | number }>;
  rows: Array<Record<string, string | number>>;
}) => (
  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
    <thead>
      <tr>
        {columns.map((col) => (
          <th
            key={col.key}
            style={{
              textAlign: "right",
              padding: "6px 8px",
              fontSize: "12px",
              color: "#6b7280",
              borderBottom: "1px solid #e5e7eb",
              width: col.width,
            }}
          >
            {col.label}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row, rowIndex) => (
        <tr key={rowIndex}>
          {columns.map((col, colIndex) => (
            <td
              key={`${rowIndex}-${col.key}`}
              style={{
                padding: "6px 8px",
                fontSize: "12px",
                color: "#111827",
                borderBottom: "1px solid #f3f4f6",
                backgroundColor: rowIndex % 2 === 0 ? "#fff" : "#f9fafb",
                borderTopLeftRadius: rowIndex === 0 && colIndex === 0 ? "8px" : undefined,
                borderTopRightRadius:
                  rowIndex === 0 && colIndex === columns.length - 1 ? "8px" : undefined,
              }}
            >
              {row[col.key] ?? "—"}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);
const ChartBox = ({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: React.ReactNode;
}) => (
  <div
    style={{
      width: `${width}px`,
      height: `${height}px`,
      minWidth: `${width}px`,
      minHeight: `${height}px`,
      overflow: "hidden",
      position: "relative",
      borderRadius: "12px",
      boxSizing: "border-box",
      margin: "0 auto",
    }}
  >
    <div style={{ width: "100%", height: "100%", direction: "ltr", overflow: "hidden" }}>{children}</div>
  </div>
);

const PdfRadarChart = ({
  data,
  width,
  height,
  stroke = "#2563eb",
}: {
  data: Array<{ subject: string; score: number; fullMark: number }>;
  width: number;
  height: number;
  stroke?: string;
}) => {
  if (!data?.length) return null;
  const maxScore = Math.max(5, ...data.map((item) => Math.max(toNum(item.fullMark), toNum(item.score))));
  const outerRadius = Math.min(width, height) / 2 - 24;
  return (
    <RadarChart
      width={width}
      height={height}
      data={data}
      cx={width / 2}
      cy={height / 2}
      outerRadius={outerRadius}
      margin={{ top: 12, right: 12, bottom: 12, left: 12 }}
    >
      <PolarGrid stroke="#cbd5f5" radialLines />
      <PolarAngleAxis
        dataKey="subject"
        tick={{ fill: "#111827", fontSize: 11, fontFamily: chartFontFamily }}
        tickLine={false}
      />
      <PolarRadiusAxis
        angle={90}
        domain={[0, maxScore]}
        tick={{ fill: "#374151", fontSize: 10, fontFamily: chartFontFamily }}
        tickLine={false}
        axisLine={false}
        stroke="#e2e8f0"
      />
      <Radar
        dataKey="score"
        stroke={stroke}
        strokeWidth={2}
        fill={stroke}
        fillOpacity={0.2}
        dot={{ r: 3, fill: stroke, strokeWidth: 1, stroke: "#fff" }}
      />
    </RadarChart>
  );
};

const SectionCard = ({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) => (
  <div
    style={{
      border: "1px solid #e5e7eb",
      borderRadius: "20px",
      padding: "20px",
      boxShadow: "0 8px 20px rgba(15,23,42,0.08)",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      overflow: "hidden",          // ✅ قبلاً visible بود
      background: "white",
      minWidth: 0,
      boxSizing: "border-box",
      ...style,
    }}
  >
    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>{title}</h3>
    {children}
  </div>
);

const ProgressItem = ({ label, value }: { label: string; value: number }) => {
  const percent = Math.max(0, Math.min(100, value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#374151" }}>
        <span>{label}</span>
        <span>{percent.toFixed(0)}%</span>
      </div>
      <div style={{ width: "100%", height: "8px", borderRadius: "999px", background: "#e5e7eb" }}>
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            borderRadius: "999px",
            background: "linear-gradient(90deg, #6366f1, #a855f7)",
          }}
        />
      </div>
    </div>
  );
};
const SimpleList = ({ items }: { items: Array<{ label: string; value: string | number }> }) => (
  <div style={{ display: "grid", gap: "8px" }}>
    {items.map((item, index) => (
      <div
        key={`${item.label}-${index}`}
        style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#374151" }}
      >
        <span style={{ color: "#6b7280" }}>{item.label}</span>
        <span style={{ fontWeight: 600, color: "#111827" }}>{item.value}</span>
      </div>
    ))}
  </div>
);

const persianDigitMap: Record<string, string> = {
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
};

const toNum = (val: any): number => {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (val === null || val === undefined) return 0;
  let str = String(val).trim();
  if (!str) return 0;
  str = str.replace(/[۰-۹]/g, (digit) => persianDigitMap[digit] ?? digit);
  str = str.replace(/,/g, "").replace(/%/g, "");
  str = str.replace(/[^\d.-]/g, "");
  const parsed = Number(str);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeKey = (key: string) => key.toLowerCase().replace(/[\s_-]+/g, "");
const resolveAnalysisField = (source: Record<string, any>, candidates: string[]) => {
  if (!source || typeof source !== "object") return undefined;
  const normalizedMap = new Map<string, string>();
  Object.keys(source).forEach((key) => normalizedMap.set(normalizeKey(key), key));
  for (const candidate of candidates) {
    const normalized = normalizeKey(candidate);
    if (normalizedMap.has(normalized)) return source[normalizedMap.get(normalized)!];
  }
  return undefined;
};

const parseArrayLike = (input: unknown): unknown[] => {
  if (Array.isArray(input)) return input;
  if (typeof input === "string") {
    const trimmed = input.trim();
    if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return [];
      }
    }
  }
  return [];
};

const extractLooseJsonBlock = (source: string, label: string) => {
  const idx = source.toLowerCase().indexOf(label.toLowerCase());
  if (idx === -1) return undefined;
  const afterLabel = source.slice(idx + label.length);
  const bracketIndex = afterLabel.indexOf("[");
  const braceIndex = afterLabel.indexOf("{");
  const hasBracket = bracketIndex !== -1;
  const hasBrace = braceIndex !== -1;
  let startOffset = -1;
  let openChar: "[" | "{" | null = null;
  if (hasBracket && (!hasBrace || bracketIndex < braceIndex)) {
    startOffset = bracketIndex;
    openChar = "[";
  } else if (hasBrace) {
    startOffset = braceIndex;
    openChar = "{";
  }
  if (startOffset === -1 || !openChar) return undefined;
  const closeChar = openChar === "[" ? "]" : "}";
  let depth = 0;
  for (let i = idx + label.length + startOffset; i < source.length; i += 1) {
    const char = source[i];
    if (char === openChar) depth += 1;
    else if (char === closeChar) depth -= 1;
    if (depth === 0) {
      const block = source.slice(idx + label.length + startOffset, i + 1);
      try {
        return JSON.parse(block);
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
};

const parseLooseAnalysisString = (raw: string) => {
  const blocks: Record<string, string> = {
    keyword_analysis: "Keyword Analysis",
    verbosity_trend: "Verbosity Trend",
    action_orientation: "Action Orientation",
    problem_solving_approach: "Problem Solving Approach",
    communication_style: "Communication Style",
    linguistic_semantic_analysis: "Linguistic Semantic Analysis",
    factor_scatter: "Factor Scatter",
    factor_contribution: "Factor Contribution",
    factor_scores: "Factor Scores",
    sentiment_analysis: "Sentiment Analysis",
  };
  const result: Record<string, unknown> = {};
  for (const [key, label] of Object.entries(blocks)) {
    const parsed = extractLooseJsonBlock(raw, label);
    if (parsed !== undefined) {
      result[key] = parsed;
    }
  }
  return result;
};

const hydrateAnalysis = (raw: any) => {
  let base: Record<string, any> =
    typeof raw === "string"
      ? parseLooseAnalysisString(raw)
      : raw && typeof raw === "object"
        ? { ...raw }
        : {};

  const additional = base?.additional_details;
  if (typeof additional === "string") {
    const parsed = parseLooseAnalysisString(additional);
    Object.entries(parsed).forEach(([key, value]) => {
      if (base[key] === undefined) {
        base[key] = value;
      }
    });
  }
  return base;
};

const normalizeFactorEntries = (input: unknown): Array<{ subject: string; score: number; fullMark: number }> => {
  const candidateArray = parseArrayLike(input);
  if (!Array.isArray(candidateArray)) return [];
  return candidateArray
    .map((entry, index) => {
      if (entry && typeof entry === "object") {
        const record = entry as Record<string, unknown>;
        const subject =
          (record.factor as string) ||
          (record.subject as string) ||
          (record.name as string) ||
          (record.label as string) ||
          `شاخص ${index + 1}`;
        const score = toNum(
          record.score ?? record.value ?? record.actual ?? record.current ?? record.raw ?? record.scoreValue
        );
        const fullMark =
          toNum(record.maxScore ?? (record as Record<string, unknown>).max_score ?? record.fullMark ?? record.target ?? record.max ?? 5) ||
          5;
        return { subject, score, fullMark };
      }

      const scoreValue = toNum(entry);
      return {
        subject: `شاخص ${index + 1}`,
        score: scoreValue,
        fullMark: 5,
      };
    })
    .filter((item) => Number.isFinite(item.score));
};

const buildSentimentChartData = (entries: { name: string; value: number }[]) => {
  const sanitized = entries
    .map((entry) => ({
      name: entry.name,
      value: Math.max(0, toNum(entry.value)),
    }))
    .filter((entry) => entry.name && Number.isFinite(entry.value));
  const total = sanitized.reduce((sum, entry) => sum + entry.value, 0);
  if (!total) return [];
  let remainder = 100;
  const rounded = sanitized.map((entry, index) => {
    const normalized = (entry.value / total) * 100;
    const isLast = index === sanitized.length - 1;
    const percent = isLast ? remainder : Math.round(normalized * 10) / 10;
    remainder = Math.max(0, remainder - percent);
    return {
      name: entry.name,
      raw: entry.value,
      value: percent,
    };
  });
  if (rounded.length > 0) {
    const adjustment = 100 - rounded.reduce((sum, entry) => sum + entry.value, 0);
    if (Math.abs(adjustment) >= 0.1) {
      rounded[rounded.length - 1].value = Math.round((rounded[rounded.length - 1].value + adjustment) * 10) / 10;
    }
  }
  return rounded;
};

const WORD_CLOUD_STOP_WORDS = new Set(
  [
    "را",
    "از",
    "با",
    "به",
    "در",
    "برای",
    "که",
    "و",
    "یا",
    "اما",
    "ولی",
    "اگر",
    "تا",
    "هر",
    "یک",
    "دو",
    "سه",
    "این",
    "اون",
    "آن",
    "هم",
    "همه",
    "نیز",
    "من",
    "تو",
    "او",
    "ما",
    "شما",
    "آنها",
    "اینجا",
    "آنجا",
    "چرا",
    "چه",
    "چطور",
    "چگونه",
    "می",
    "است",
    "بود",
    "هست",
    "شد",
    "شود",
    "خواهد",
    "کرد",
    "کردن",
    "کن",
    "میکند",
    "میکنم",
    "کنم",
    "کردم",
    "کردند",
    "پس",
    "بلکه",
    "اگرچه",
    "چنانکه",
    "باید",
    "نباید",
  ].map((word) => word.trim().toLowerCase()),
);

const sanitizeWordCloudPhrase = (phrase: string) => {
  if (!phrase) return "";
  const tokens = phrase
    .split(/\s+/)
    .map((token) =>
      token
        .replace(/[0-9۰-۹]+/g, "")
        .replace(/[^\u0600-\u06FFA-Za-z]/g, "")
        .trim()
        .toLowerCase(),
    )
    .filter((token) => token.length > 1 && !WORD_CLOUD_STOP_WORDS.has(token));
  return tokens.join(" ");
};

const prepareWordCloudData = (raw: unknown): { keyword: string; mentions: number }[] => {
  const entries = parseArrayLike(raw);
  if (!Array.isArray(entries)) return [];
  const frequency = new Map<string, number>();

  entries.forEach((entry) => {
    if (!entry) return;
    let phrase = "";
    let mentions = 1;
    if (typeof entry === "string") {
      phrase = entry;
    } else if (typeof entry === "object") {
      const record = entry as Record<string, unknown>;
      const rawKeyword =
        record.keyword ?? record.term ?? record.word ?? record.label ?? record.text ?? record.name;
      if (typeof rawKeyword === "string") {
        phrase = rawKeyword;
      }
      mentions = toNum(record.mentions ?? record.count ?? record.value ?? 1);
    }

    const sanitized = sanitizeWordCloudPhrase(String(phrase));
    if (!sanitized) return;
    const current = frequency.get(sanitized) ?? 0;
    frequency.set(sanitized, current + (Number.isFinite(mentions) && mentions > 0 ? mentions : 1));
  });

  return Array.from(frequency.entries())
    .map(([keyword, mentions]) => ({ keyword, mentions }))
    .filter((item) => item.keyword.length > 1 && item.mentions > 0)
    .sort((a, b) => b.mentions - a.mentions);
};

const getHeatmapColor = (percent: number) => {
  if (percent >= 75) return "#312e81";
  if (percent >= 55) return "#4338ca";
  if (percent >= 35) return "#6366f1";
  if (percent >= 20) return "#818cf8";
  return "#c7d2fe";
};

export const ReportPDFLayout = React.forwardRef<HTMLDivElement, PDFLayoutProps>(
  ({ report }, ref) => {
    const analysis = hydrateAnalysis(report.analysis);

    const factorScoreRaw = resolveAnalysisField(analysis, ["factor_scores", "factor score", "factor-score"]);
    const normalizedFactors = normalizeFactorEntries(factorScoreRaw);
    const chartData = normalizedFactors;
    const scatterRaw = resolveAnalysisField(analysis, [
      "factor_scatter",
      "scatter_data",
      "factor_correlation",
      "scatter",
      "factor scatter",
    ]);
    const scatterSeries = normalizeFactorEntries(scatterRaw);
    const treemapRaw = resolveAnalysisField(analysis, [
      "factor_contribution",
      "factor_share",
      "factor_treemap",
      "factor contribution",
    ]);
    const treemapSeries = normalizeFactorEntries(treemapRaw);
    const scatterChartData = scatterSeries.length > 0 ? scatterSeries : chartData;
    const treemapChartData = treemapSeries.length > 0 ? treemapSeries : chartData;
    const factorHeatmapData = (() => {
      if (treemapChartData.length === 0) return [];
      const total = treemapChartData.reduce((sum, entry) => sum + toNum(entry.score ?? entry.value), 0);
      if (!total) return [];
      return treemapChartData.map((entry) => {
        const score = toNum(entry.score ?? entry.value);
        const percent = Math.round(((score / total) * 100) * 10) / 10;
        return {
          name: entry.subject,
          value: score,
          percent,
        };
      });
    })();

    const sentimentRawData =
      analysis.sentiment_analysis
        ? Object.entries(analysis.sentiment_analysis).map(([name, value]) => ({
          name,
          value: toNum(value),
        }))
        : [];
    const sentimentData = buildSentimentChartData(sentimentRawData);

    const keywordData = prepareWordCloudData(analysis.keyword_analysis);
    const conversationWordCloudData = prepareWordCloudData(
      analysis.word_cloud_full ?? (analysis as Record<string, unknown>).conversation_word_cloud ?? analysis.keyword_analysis,
    );

    const verbosityData =
      analysis.verbosity_trend?.map((item: any, index: number) => ({
        turn: item.turn ?? item.iteration ?? index + 1,
        word_count: toNum(item.word_count ?? item.value),
      })) || [];

    const progressTimelineRaw = Array.isArray((analysis as any).progress_timeline)
      ? ((analysis as any).progress_timeline as any[]).map((entry: any, index: number) => ({
        iteration: toNum(entry?.iteration ?? entry?.turn ?? index + 1),
        performance: toNum(entry?.score ?? entry?.value ?? entry?.performance ?? 0),
      }))
      : verbosityData.map((entry, index) => ({
        iteration: toNum(entry.turn ?? index + 1),
        performance: toNum(entry.word_count),
      }));

    const scatterLineData = progressTimelineRaw
      .filter((item) => Number.isFinite(item.performance))
      .map((item, index, array) => {
        const cumulative = array.slice(0, index + 1).reduce((sum, entry) => sum + entry.performance, 0);
        const trend = cumulative / (index + 1 || 1);
        return {
          iteration: item.iteration || index + 1,
          performance: Math.round(item.performance * 100) / 100,
          trend: Math.round(trend * 100) / 100,
        };
      });
    const scatterAverage =
      scatterLineData.length > 0
        ? scatterLineData.reduce((total, item) => total + toNum(item.performance), 0) / scatterLineData.length
        : 0;

    const actionData = analysis.action_orientation
      ? [
        {
          name: "مقایسه",
          action_words: toNum(analysis.action_orientation.action_words),
          passive_words: toNum(analysis.action_orientation.passive_words),
        },
      ]
      : [];

    const problemSolvingData =
      analysis.problem_solving_approach
        ? Object.entries(analysis.problem_solving_approach).map(([name, value]) => ({
          name,
          value: toNum(value),
        }))
        : [];

    const commStyle =
      analysis.communication_style
        ? Object.entries(analysis.communication_style).map(([name, value]) => ({
          name,
          value: toNum(value),
        }))
        : [];

    const semanticRadar = [
      { name: "تنوع واژگانی", value: toNum(analysis.linguistic_semantic_analysis?.lexical_diversity) },
      { name: "انسجام معنایی", value: toNum(analysis.linguistic_semantic_analysis?.semantic_coherence) },
      { name: "عینیت", value: toNum(analysis.linguistic_semantic_analysis?.concreteness_level) },
      { name: "انتزاع", value: toNum(analysis.linguistic_semantic_analysis?.abstractness_level) },
    ];

    const pronouns = [
      { name: "اول شخص", value: toNum(analysis.linguistic_semantic_analysis?.pronoun_usage?.first_person) },
      { name: "دوم شخص", value: toNum(analysis.linguistic_semantic_analysis?.pronoun_usage?.second_person) },
      { name: "سوم شخص", value: toNum(analysis.linguistic_semantic_analysis?.pronoun_usage?.third_person) },
    ];
    const semanticFields = withRtlFields(analysis.linguistic_semantic_analysis?.semantic_fields) || [];
    const pronounChartData = pronouns.filter((item) => Number.isFinite(item.value));
    const phaseBreakdownSource =
      analysis.phase_breakdown ||
      analysis.final_analysis?.phase_breakdown ||
      report.analysis?.phase_breakdown ||
      report.analysis?.final_analysis?.phase_breakdown;
    const phaseBreakdown = Array.isArray(phaseBreakdownSource) ? phaseBreakdownSource : [];
    const phaseInsights = phaseBreakdown.map((phase: any, index: number) => {
      const phaseNumber = phase?.phase ?? index + 1;
      const persona = phase?.personaName ? ` - ${phase.personaName}` : "";
      const summary =
        phase?.analysis?.summary ||
        phase?.analysis?.report ||
        phase?.analysis?.description ||
        "تحلیل این مرحله در دسترس نیست.";
      return {
        title: `مرحله ${phaseNumber}${persona}`,
        summary,
      };
    });
    const phaseSpiderCharts = phaseBreakdown
      .map((phase: any, index: number) => {
        const phaseNumber = phase?.phase ?? index + 1;
        const persona = phase?.personaName?.trim();
        const label = persona ? `پرسشنامه ${phaseNumber} · ${persona}` : `پرسشنامه ${phaseNumber}`;
        const phaseAnalysis = hydrateAnalysis(phase?.analysis ?? {});
        const phaseFactorRaw = resolveAnalysisField(phaseAnalysis, ["factor_scores", "factor score", "factor-score"]);
        const phaseScatterRaw = resolveAnalysisField(phaseAnalysis, [
          "factor_scatter",
          "scatter_data",
          "factor_correlation",
          "scatter",
          "factor scatter",
        ]);
        const phaseTreemapRaw = resolveAnalysisField(phaseAnalysis, [
          "factor_contribution",
          "factor_share",
          "factor_treemap",
          "factor contribution",
        ]);
        const baseData = normalizeFactorEntries(phaseFactorRaw);
        const fallbackScatter = normalizeFactorEntries(phaseScatterRaw);
        const fallbackTreemap = normalizeFactorEntries(phaseTreemapRaw);
        const finalData =
          baseData.length > 0
            ? baseData
            : fallbackScatter.length > 0
              ? fallbackScatter
              : fallbackTreemap.length > 0
                ? fallbackTreemap
                : [];
        if (finalData.length === 0) return null;
        return {
          id: `phase-spider-${phaseNumber}-${index}`,
          label,
          data: finalData,
        };
      })
      .filter(Boolean) as Array<{ id: string; label: string; data: Array<{ subject: string; score: number; fullMark: number }> }>;

    const rawReportedScore =
      analysis.score ??
      (analysis as Record<string, unknown>).total_score ??
      (analysis as Record<string, unknown>).overall_score;
    const numericReportedScore = Number.isFinite(toNum(rawReportedScore)) ? toNum(rawReportedScore) : null;
    const phaseScoreValues = phaseBreakdown
      .map((phase: any) =>
        phase?.analysis && typeof phase.analysis.score !== "undefined" && phase.analysis.score !== null
          ? toNum(phase.analysis.score)
          : null,
      )
      .filter((value): value is number => value !== null && Number.isFinite(value));
    const averagedPhaseScore =
      phaseScoreValues.length > 0
        ? phaseScoreValues.reduce((sum, value) => sum + value, 0) / phaseScoreValues.length
        : null;
    const overallScore = averagedPhaseScore ?? numericReportedScore ?? null;
    const overallScoreDisplay =
      typeof overallScore === "number" && Number.isFinite(overallScore)
        ? Math.round(overallScore * 10) / 10
        : null;
    const maxAvailableScore = toNum(report.max_score ?? (analysis as Record<string, unknown>).max_score ?? 100) || 100;

    const infoItems = [
      { label: "نام کامل", value: `${report.firstName} ${report.lastName}`.trim() || "—" },
      { label: "نام کاربری", value: report.username },
      { label: "پرسشنامه", value: report.questionnaire_title },
      {
        label: "تاریخ تکمیل",
        value: report.completed_at ? new Date(report.completed_at).toLocaleString("fa-IR") : "نامشخص",
      },
    ];

    const factorProgress = chartData.map((item) => ({
      label: item.subject,
      value: item.fullMark ? (toNum(item.score) / toNum(item.fullMark)) * 100 : toNum(item.score),
    }));
    const sentimentList = sentimentData.map((item) => ({
      label: item.name,
      value: `${toNum(item.value).toFixed(1)}%`,
    }));
    const keywordList = keywordData.slice(0, 8).map((item: any, index: number) => ({
      label: item.keyword ?? `کلیدواژه ${index + 1}`,
      value: item.mentions ?? 0,
    }));
    const conversationKeywordList = conversationWordCloudData.slice(0, 8).map((item: any, index: number) => ({
      label: item.keyword ?? `عبارت ${index + 1}`,
      value: item.mentions ?? 0,
    }));
    const factorHeatmapRows = factorHeatmapData.map((entry) => ({
      label: entry.name,
      value: `${entry.percent}%`,
    }));
    const verbosityRows = verbosityData.slice(0, 8).map((entry: any, index: number) => ({
      turn: entry.turn ?? index + 1,
      word_count: entry.word_count ?? entry.performance ?? 0,
    }));
    const scatterRows = scatterLineData.slice(0, 8).map((entry) => ({
      iteration: entry.iteration,
      performance: entry.performance,
      trend: entry.trend,
    }));
    const actionRows = actionData.length
      ? [
        { label: "واژگان کنشی", value: actionData[0].action_words ?? 0 },
        { label: "واژگان خنثی/غیرکنشی", value: actionData[0].passive_words ?? 0 },
      ]
      : [];
    const problemRows = problemSolvingData.map((entry: any) => ({
      label: entry.name,
      value: entry.value,
    }));
    const commRows = commStyle.map((entry: any) => ({
      label: entry.name,
      value: entry.value,
    }));
    const radarRows = semanticRadar.map((entry: any) => ({
      label: entry.name,
      value: entry.value,
    }));
    const pronounRows = pronounChartData.map((entry: any) => ({
      label: entry.name,
      value: entry.value,
    }));
    const semanticRows = semanticFields.map((entry: any) => ({
      label: entry.field ?? entry.name,
      value: entry.mentions ?? entry.value ?? 0,
    }));
    const semanticRowsLimited = semanticRows.slice(0, 6);

    return (
      <div
        ref={ref}
        className="pdf-font"
        style={{
          backgroundColor: "#e5e7eb",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          alignItems: "center",
        }}
      >
        <style>
          {`
            .pdf-font *,
            .pdf-font text,
            .pdf-font tspan {
              font-family: 'Vazirmatn', Tahoma, sans-serif !important;
            }
            .chart-ltr {
              direction: ltr;
            }
            .pdf-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 16px;
              align-items: start;
              grid-auto-rows: min-content;
            }
            .pdf-break {
              break-before: page;
              page-break-before: always;
              width: 100%;
              height: 0;
            }
          `}
        </style>

        <section className="pdf-page" style={pageStyle}>
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <Logo variant="large" />
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#111827", marginTop: "12px" }}>
              گزارش نهایی ارزیابی شایستگی
            </h1>
            <h2 style={{ fontSize: "20px", color: "#2563eb", marginTop: "6px" }}>
              {report.firstName} {report.lastName} ({report.username})
            </h2>
            <p style={{ marginTop: "4px", color: "#6b7280" }}>{report.questionnaire_title}</p>
            <p style={{ marginTop: "2px", fontSize: "12px", color: "#9ca3af" }}>
              تاریخ تکمیل: {report.completed_at ? new Date(report.completed_at).toLocaleDateString("fa-IR") : "نامشخص"}
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">خلاصه مدیریتی</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              این گزارش تصویری یکپارچه از عملکرد {report.firstName} {report.lastName} ارائه می‌دهد و با تکیه بر
              سنجه‌های کیفی و کمی، نقاط قوت، ریسک‌ها و اولویت‌های توسعه‌ای او را مشخص می‌کند.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 0.8fr)",
              gap: "16px",
              gridAutoRows: "min-content",
            }}
          >
            <SectionCard title="اطلاعات و نمودار شایستگی‌ها" style={{ gap: "16px" }}>
              <SimpleList items={infoItems} />
              <div
                style={{
                  border: "1px dashed #e5e7eb",
                  borderRadius: "14px",
                  padding: "12px",
                  textAlign: "center",
                  background: "#f8fafc",
                }}
              >
                <p style={{ fontSize: "36px", fontWeight: 800, color: "#2563eb" }}>
                  {overallScoreDisplay !== null ? overallScoreDisplay : "—"}
                </p>
                <p style={{ fontSize: "13px", color: "#6b7280" }}>از {maxAvailableScore}</p>
              </div>
              {chartData.length > 0 ? (
                <ChartBox width={CHART_SIZES.HALF.width} height={CHART_SIZES.HALF.height}>
                  <PdfRadarChart data={chartData} width={CHART_SIZES.HALF.width} height={CHART_SIZES.HALF.height} />
                </ChartBox>
              ) : (
                <p style={{ fontSize: "12px", color: "#6b7280" }}>داده‌ای برای نمایش نمودار وجود ندارد.</p>
              )}
            </SectionCard>

            <SectionCard title="تحلیل کلی">
              <div style={{ fontSize: "13px", lineHeight: 1.8, color: "#374151" }}>
                <ReactMarkdown>
                  {analysis.summary ||
                    analysis.overall_summary ||
                    analysis.report ||
                    "تحلیل کلی برای این گزارش ثبت نشده است."}
                </ReactMarkdown>
              </div>
            </SectionCard>
          </div>

          <SectionCard title="نمای کلی شایستگی‌ها">
            {factorProgress.length > 0 ? (
              <div style={{ display: "grid", gap: "10px" }}>
                {factorProgress.map((item) => (
                  <ProgressItem key={item.label} label={item.label} value={item.value} />
                ))}
              </div>
            ) : (
              <p style={{ fontSize: "12px", color: "#6b7280" }}>داده‌ای برای شایستگی‌ها موجود نیست.</p>
            )}
          </SectionCard>

          <SectionCard title="تحلیل‌های کلیدی گفتگو">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>ابر واژگان کامل گفتگو</h4>
                {conversationWordCloudData.length ? (
                  <>
                    <ChartBox width={CHART_SIZES.HALF.width} height={CHART_SIZES.HALF.height}>
                      <BarChart
                        data={conversationWordCloudData.slice(0, 10)}
                        layout="vertical"
                        width={CHART_SIZES.HALF.width}
                        height={CHART_SIZES.HALF.height}
                        margin={defaultChartMargin}
                      >
                        <XAxis type="number" tick={baseAxisTick} />
                        <YAxis dataKey="keyword" type="category" width={120} tick={baseAxisTick} />
                        <Tooltip />
                        <Bar dataKey="mentions" fill="#0ea5e9" />
                      </BarChart>
                    </ChartBox>
                    <PlainTable
                      columns={[
                        { key: "keyword", label: "عبارت" },
                        { key: "mentions", label: "دفعات" },
                      ]}
                      rows={conversationKeywordList.map((item) => ({ keyword: item.label, mentions: item.value }))}
                    />
                  </>
                ) : (
                  <p style={{ fontSize: "12px", color: "#6b7280" }}>داده‌ای برای ابر واژگان ثبت نشده است.</p>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>نقشه حرارتی سهم فاکتورها</h4>
                {factorHeatmapData.length ? (
                  <>
                    <ChartBox width={CHART_SIZES.HALF.width} height={CHART_SIZES.HALF.height}>
                      <BarChart
                        data={factorHeatmapData}
                        layout="vertical"
                        width={CHART_SIZES.HALF.width}
                        height={CHART_SIZES.HALF.height}
                        margin={defaultChartMargin}
                      >
                        <XAxis type="number" domain={[0, 100]} tick={baseAxisTick} />
                        <YAxis dataKey="name" type="category" width={140} tick={baseAxisTick} />
                        <Tooltip />
                        <Bar dataKey="percent">
                          {factorHeatmapData.map((entry, index) => (
                            <Cell key={`heatmap-inline-${entry.name}-${index}`} fill={getHeatmapColor(entry.percent)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartBox>
                    <SimpleList items={factorHeatmapRows} />
                  </>
                ) : (
                  <p style={{ fontSize: "12px", color: "#6b7280" }}>داده‌ای برای سهم فاکتورها وجود ندارد.</p>
                )}
              </div>

              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "12px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>پراکندگی پیشرفت با خط روند</h4>
                {scatterLineData.length ? (
                  <>
                    <ChartBox width={CHART_SIZES.FULL.width} height={CHART_SIZES.FULL.height}>
                      <LineChart
                        data={scatterLineData}
                        width={CHART_SIZES.FULL.width}
                        height={CHART_SIZES.FULL.height}
                        margin={defaultChartMargin}
                      >
                        <CartesianGrid strokeDasharray="6 6" />
                        <XAxis dataKey="iteration" tick={baseAxisTick} />
                        <YAxis tick={baseAxisTick} />
                        <Tooltip />
                        <Legend wrapperStyle={legendStyle} />
                        <ReferenceLine
                          y={scatterAverage}
                          stroke="#c084fc"
                          strokeDasharray="4 4"
                          label={{ value: "میانگین عملکرد", position: "right", fill: "#7c3aed", fontSize: 11 }}
                        />
                        <Line dataKey="trend" name="خط روند" stroke="#2563eb" strokeWidth={3} dot={false} />
                        <Line
                          dataKey="performance"
                          name="نتیجه مشاهده‌شده"
                          stroke="transparent"
                          activeDot={{ r: 5, fill: "#f97316" }}
                          dot={{ r: 5, fill: "#f97316" }}
                        />
                      </LineChart>
                    </ChartBox>
                    <PlainTable
                      columns={[
                        { key: "iteration", label: "مرحله" },
                        { key: "performance", label: "نتیجه" },
                        { key: "trend", label: "میانگین متحرک" },
                      ]}
                      rows={scatterRows}
                    />
                  </>
                ) : (
                  <p style={{ fontSize: "12px", color: "#6b7280" }}>داده‌ای برای روند پیشرفت ثبت نشده است.</p>
                )}
              </div>
            </div>
          </SectionCard>


          {phaseInsights.length > 0 && (
            <SectionCard title="تحلیل تفکیکی مراحل">
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {phaseInsights.map((item, index) => (
                  <div
                    key={`${item.title}-${index}`}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "14px",
                      padding: "12px 16px",
                      background: "#f8fafc",
                      minWidth: 0,
                      overflow: "hidden",
                      boxSizing: "border-box",
                    }}
                  >
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{item.title}</p>
                    <p style={{ fontSize: "12px", color: "#4b5563", lineHeight: 1.7 }}>{item.summary}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
          {phaseSpiderCharts.length > 0 && (
            <SectionCard title="نمودار عنکبوتی هر مرحله">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",

                  gap: "16px",
                }}
              >
                {phaseSpiderCharts.map((phase) => (
                  <div
                    key={phase.id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "16px",
                      padding: "12px",
                      backgroundColor: "#f8fafc",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      minWidth: 0,
                      overflow: "hidden",
                      boxSizing: "border-box",
                    }}
                  >
                    <div>
                      <p style={{ fontSize: "12px", color: "#475569" }}>{phase.label}</p>
                      <p style={{ fontSize: "11px", color: "#94a3b8" }}>
                        نمایش مستقل ابعاد این مرحله برای مقایسه دقیق‌تر
                      </p>
                    </div>
                    <ChartBox width={CHART_SIZES.HALF.width} height={CHART_SIZES.HALF.height}>
                      <PdfRadarChart
                        data={phase.data}
                        width={CHART_SIZES.HALF.width}
                        height={CHART_SIZES.HALF.height}
                      />
                    </ChartBox>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </section>

        <section className="pdf-page" style={pageStyle}>
          <h2 className="text-2xl font-bold text-gray-900">تحلیل‌های تکمیلی - بخش اول</h2>
          <div className="pdf-grid">
            <SectionCard title="تحلیل احساسات">
              {sentimentData.length ? (
                <>
                  <ChartBox width={CHART_SIZES.HALF.width} height={CHART_SIZES.HALF.height}>
                    <PieChart
                      width={CHART_SIZES.HALF.width}
                      height={CHART_SIZES.HALF.height}
                      margin={defaultChartMargin}
                    >
                      <Pie data={sentimentData} dataKey="value" nameKey="name" outerRadius={70}>
                        {sentimentData.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={legendStyle} />
                    </PieChart>
                  </ChartBox>
                  <SimpleList items={sentimentList} />
                </>
              ) : (
                <p style={{ fontSize: "12px", color: "#6b7280" }}>داده‌ای موجود نیست.</p>
              )}
            </SectionCard>

            <SectionCard title="کلمات کلیدی پرتکرار">
              {keywordData.length ? (
                <>
                  <ChartBox width={CHART_SIZES.HALF.width} height={CHART_SIZES.HALF.height}>
                    <BarChart
                      data={keywordData}
                      layout="vertical"
                      width={CHART_SIZES.HALF.width}
                      height={CHART_SIZES.HALF.height}
                      margin={defaultChartMargin}
                    >
                      <XAxis type="number" tick={baseAxisTick} />
                      <YAxis dataKey="keyword" type="category" width={120} tick={baseAxisTick} />
                      <Tooltip />
                      <Bar dataKey="mentions" fill="#22c55e" />
                    </BarChart>
                  </ChartBox>
                  <PlainTable
                    columns={[
                      { key: "keyword", label: "کلمه" },
                      { key: "mentions", label: "دفعات" },
                    ]}
                    rows={keywordList.map((item) => ({ keyword: item.label, mentions: item.value }))}
                  />
                </>
              ) : (
                <p style={{ fontSize: "12px", color: "#6b7280" }}>داده‌ای موجود نیست.</p>
              )}
            </SectionCard>

            <SectionCard title="روند کلمات">
              {verbosityData.length ? (
                <>
                  <ChartBox width={CHART_SIZES.HALF.width} height={CHART_SIZES.HALF.height}>
                    <LineChart
                      data={verbosityData}
                      width={CHART_SIZES.HALF.width}
                      height={CHART_SIZES.HALF.height}
                      margin={defaultChartMargin}
                    >
                      <XAxis dataKey="turn" tick={baseAxisTick} />
                      <YAxis tick={baseAxisTick} />
                      <Tooltip />
                      <Line dataKey="word_count" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ChartBox>
                  <PlainTable
                    columns={[
                      { key: "turn", label: "نوبت" },
                      { key: "word_count", label: "تعداد واژه" },
                    ]}
                    rows={verbosityRows}
                  />
                </>
              ) : (
                <p style={{ fontSize: "12px", color: "#6b7280" }}>داده‌ای موجود نیست.</p>
              )}
            </SectionCard>

            <SectionCard title="کنش‌محوری">
              {actionData.length ? (
                <>
                  <ChartBox width={CHART_SIZES.HALF.width} height={CHART_SIZES.HALF.height}>
                    <BarChart
                      data={actionData}
                      width={CHART_SIZES.HALF.width}
                      height={CHART_SIZES.HALF.height}
                      margin={defaultChartMargin}
                    >
                      <XAxis dataKey="name" tick={baseAxisTick} />
                      <YAxis tick={baseAxisTick} />
                      <Tooltip />
                      <Legend wrapperStyle={legendStyle} />
                      <Bar dataKey="action_words" fill="#6366f1" />
                      <Bar dataKey="passive_words" fill="#94a3b8" />
                    </BarChart>
                  </ChartBox>
                  <SimpleList items={actionRows} />
                </>
              ) : (
                <p style={{ fontSize: "12px", color: "#6b7280" }}>اطلاعاتی درباره واژگان کنشی ثبت نشده است.</p>
              )}
            </SectionCard>

            <SectionCard title="رویکرد حل مسئله">
              {problemSolvingData.length ? (
                <>
                  <ChartBox width={CHART_SIZES.HALF.width} height={CHART_SIZES.HALF.height}>
                    <PieChart
                      width={CHART_SIZES.HALF.width}
                      height={CHART_SIZES.HALF.height}
                      margin={defaultChartMargin}
                    >
                      <Pie data={problemSolvingData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                        {problemSolvingData.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ChartBox>
                  <SimpleList items={problemRows} />
                </>
              ) : (
                <p style={{ fontSize: "12px", color: "#6b7280" }}>داده‌ای موجود نیست.</p>
              )}
            </SectionCard>

            <SectionCard title="سطح اطمینان">
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <p style={{ fontSize: "46px", fontWeight: 800, color: "#0ea5e9" }}>
                  {toNum(analysis.confidence_level?.score)}
                </p>
                <p style={{ fontSize: "13px", color: "#6b7280" }}>از ۱۰</p>
              </div>
            </SectionCard>
          </div>
        </section>

        <section className="pdf-page" style={pageStyle}>
          <h2 className="text-2xl font-bold text-gray-900">تحلیل‌های تکمیلی - بخش دوم</h2>
          <div className="pdf-grid">
            <SectionCard title="سبک ارتباطی">
              {commStyle.length ? (
                <>
                  <ChartBox width={CHART_SIZES.HALF_TALL.width} height={CHART_SIZES.HALF_TALL.height}>
                    <BarChart
                      data={commStyle}
                      width={CHART_SIZES.HALF_TALL.width}
                      height={CHART_SIZES.HALF_TALL.height}
                      margin={defaultChartMargin}
                    >
                      <XAxis dataKey="name" tick={baseAxisTick} />
                      <YAxis tick={baseAxisTick} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#a855f7" />
                    </BarChart>
                  </ChartBox>
                  <SimpleList items={commRows} />
                </>
              ) : (
                <p style={{ fontSize: "12px", color: "#6b7280" }}>اطلاعاتی ثبت نشده است.</p>
              )}
            </SectionCard>

            <SectionCard title="توزیع نمرات">
              {chartData.length ? (
                <>
                  <ChartBox width={CHART_SIZES.HALF_TALL.width} height={CHART_SIZES.HALF_TALL.height}>
                    <BarChart
                      data={chartData}
                      width={CHART_SIZES.HALF_TALL.width}
                      height={CHART_SIZES.HALF_TALL.height}
                      margin={defaultChartMargin}
                    >
                      <XAxis dataKey="subject" tick={baseAxisTick} />
                      <YAxis tick={baseAxisTick} />
                      <Tooltip />
                      <Bar dataKey="score" fill="#3b82f6" />
                    </BarChart>
                  </ChartBox>
                  <SimpleList
                    items={factorProgress.map((item) => ({
                      label: item.label,
                      value: `${Math.round(item.value)}%`,
                    }))}
                  />
                </>
              ) : (
                <p style={{ fontSize: "12px", color: "#6b7280" }}>اطلاعاتی ثبت نشده است.</p>
              )}
            </SectionCard>

            <SectionCard title="شاخص‌های زبانی">
              {radarRows.length ? (
                <>
                  <ChartBox width={CHART_SIZES.HALF_MEDIUM.width} height={CHART_SIZES.HALF_MEDIUM.height}>
                    <BarChart
                      data={radarRows}
                      width={CHART_SIZES.HALF_MEDIUM.width}
                      height={CHART_SIZES.HALF_MEDIUM.height}
                      margin={defaultChartMargin}
                    >
                      <XAxis dataKey="label" tick={baseAxisTick} />
                      <YAxis tick={baseAxisTick} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#14b8a6" />
                    </BarChart>
                  </ChartBox>
                  <SimpleList items={radarRows.map((item) => ({ label: item.label, value: item.value }))} />
                </>
              ) : (
                <p style={{ fontSize: "12px", color: "#6b7280" }}>اطلاعاتی ثبت نشده است.</p>
              )}
            </SectionCard>

            <SectionCard title="استفاده از ضمایر">
              {pronounRows.length ? (
                <>
                  <ChartBox width={CHART_SIZES.HALF_TALL.width} height={CHART_SIZES.HALF_TALL.height}>
                    <PieChart
                      width={CHART_SIZES.HALF_TALL.width}
                      height={CHART_SIZES.HALF_TALL.height}
                      margin={defaultChartMargin}
                    >
                      <Pie data={pronounRows} dataKey="value" nameKey="label" outerRadius={70}>
                        {pronounRows.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={legendStyle} />
                    </PieChart>
                  </ChartBox>
                  <SimpleList items={pronounRows.map((item) => ({ label: item.label, value: item.value }))} />
                </>
              ) : (
                <p style={{ fontSize: "12px", color: "#6b7280" }}>اطلاعاتی موجود نیست.</p>
              )}
            </SectionCard>

            <div className="pdf-break" style={{ gridColumn: "1 / -1" }} />
            <SectionCard title="حوزه‌های معنایی پرتکرار" style={{ gridColumn: "span 2" }}>
              {semanticRowsLimited.length ? (
                <>
                  <ChartBox width={CHART_SIZES.FULL_WIDE.width} height={CHART_SIZES.FULL_WIDE.height}>
                    <BarChart
                      data={semanticRowsLimited}
                      layout="vertical"
                      width={CHART_SIZES.FULL_WIDE.width}
                      height={CHART_SIZES.FULL_WIDE.height}
                      margin={semanticChartMargin}
                    >
                      <XAxis type="number" tick={baseAxisTick} />
                      <YAxis
                        dataKey="label"
                        type="category"
                        width={160}
                        tick={{ ...baseAxisTick, fontSize: 10 }}
                      />
                      <Tooltip />
                      <Bar dataKey="value" fill="#34d399" />
                    </BarChart>
                  </ChartBox>
                  <PlainTable
                    columns={[
                      { key: "label", label: "حوزه" },
                      { key: "value", label: "تکرار" },
                    ]}
                    rows={semanticRowsLimited}
                  />
                </>
              ) : (
                <p style={{ fontSize: "12px", color: "#6b7280" }}>اطلاعاتی ثبت نشده است.</p>
              )}
            </SectionCard>
          </div>
        </section>
      </div>
    );
  }
);

ReportPDFLayout.displayName = "ReportPDFLayout";
