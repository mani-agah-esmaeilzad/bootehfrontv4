// src/pages/admin/AdminFinalReports.tsx

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  Search,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ComparisonSpiderChart } from "@/components/ui/ComparisonSpiderChart";
import { SpiderChart } from "@/components/ui/SpiderChart";
import { PowerWheelChart } from "@/components/ui/PowerWheelChart";
import apiFetch, { getFinalReportSummaries, getFinalReportDetail } from "@/services/apiService";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  ReferenceLine,
} from "recharts";

interface CategoryScore {
  label: string;
  normalizedScore: number;
  completedCount: number;
  totalAssignments: number;
}

interface FinalReportSummary {
  userId: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  assignedCount: number;
  completedCount: number;
  completionPercent: number;
  isReady: boolean;
  lastCompletedAt: string | null;
  overallScore: number;
  categoryScores: CategoryScore[];
}

interface CategorySummary extends CategoryScore {
  key: string;
  contributions: {
    assessmentId: number;
    questionnaireId: number;
    questionnaireTitle: string;
    normalizedScore: number;
    rawScore: number;
    maxScore: number;
    completedAt: string | null;
  }[];
}

interface RadarPoint {
  subject: string;
  userScore: number;
  targetScore: number;
}

interface PowerWheelSegment {
  label: string;
  value: number;
  status: "pending" | "partial" | "completed";
  completedCount: number;
  totalAssignments: number;
}

interface ParsedCompletion {
  assessmentId: number;
  questionnaireId: number;
  questionnaireTitle: string;
  category: string;
  completedAt: string | null;
  normalizedScore: number;
  rawScore: number;
  maxScore: number;
  summary: string | null;
  strengths: string[];
  recommendations: string[];
  developmentPlan: string[];
  risks: string[];
  factorScores: { name: string; score: number; maxScore: number }[];
}

interface AssignmentInfo {
  questionnaire_id: number;
  questionnaire_title: string;
  display_order: number | null;
  category: string | null;
}

interface FinalReportDetail {
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    is_active: boolean;
  };
  progress: {
    assignedCount: number;
    completedCount: number;
    completionPercent: number;
    remainingCount: number;
    isReady: boolean;
    lastCompletedAt: string | null;
  };
  overview: {
    overallScore: number;
    averageScore: number;
  };
  categories: CategorySummary[];
  radar: RadarPoint[];
  powerWheel: PowerWheelSegment[];
  assessments: ParsedCompletion[];
  pendingAssignments: AssignmentInfo[];
  strengths: string[];
  recommendations: string[];
  developmentPlan: string[];
  risks: string[];
}

const CATEGORY_COLORS: Record<string, string> = {
  "شایستگی های رفتاری (بین فردی)": "#7C3AED",
  "شایستگی های شناختی": "#0EA5E9",
  "شایستگی های فردی": "#EC4899",
  "شایستگی های رهبری و مدیریت": "#F97316",
  "شایستگی‌های روانشناختی": "#10B981",
  "سایر دسته‌بندی‌ها": "#6366F1",
};

const DEFAULT_CATEGORY_COLOR = "#6366F1";

const CATEGORY_SEQUENCE = [
  "شایستگی های رفتاری (بین فردی)",
  "شایستگی های شناختی",
  "شایستگی های فردی",
  "شایستگی های رهبری و مدیریت",
  "شایستگی‌های روانشناختی",
  "سایر دسته‌بندی‌ها",
] as const;

const LEGACY_CATEGORY_MAP: Record<string, string> = {
  "نیمرخ روانشناختی": "شایستگی‌های روانشناختی",
};

const normalizeCategoryName = (category?: string | null) => {
  if (!category) return "سایر دسته‌بندی‌ها";
  const trimmed = category.trim();
  return LEGACY_CATEGORY_MAP[trimmed] ?? trimmed;
};

const getCategoryColor = (category?: string | null) =>
  CATEGORY_COLORS[normalizeCategoryName(category)] ?? DEFAULT_CATEGORY_COLOR;

const getCategoryOrder = (category?: string | null) => {
  const normalized = normalizeCategoryName(category);
  const index = CATEGORY_SEQUENCE.indexOf(normalized as (typeof CATEGORY_SEQUENCE)[number]);
  return index === -1 ? CATEGORY_SEQUENCE.length : index;
};

const rtlFontStack = "'Vazirmatn', 'IRANSans', 'Tahoma', sans-serif";

const SENTIMENT_META = [
  { key: "positive", label: "مثبت", color: "#22c55e" },
  { key: "neutral", label: "خنثی", color: "#94a3b8" },
  { key: "negative", label: "منفی", color: "#ef4444" },
  { key: "other", label: "سایر", color: "#a855f7" },
] as const;
type SentimentKey = (typeof SENTIMENT_META)[number]["key"];

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

const toNum = (val: unknown): number => {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (val === null || val === undefined) return 0;
  const normalized = String(val)
    .trim()
    .replace(/[۰-۹]/g, (digit) => persianDigitMap[digit] ?? digit)
    .replace(/,/g, "")
    .replace(/%/g, "")
    .replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeKey = (key: string) => key.toLowerCase().replace(/[\s_-]+/g, "");

const parseArrayLike = (input: unknown): unknown[] => {
  if (Array.isArray(input)) return input;
  if (typeof input === "string") {
    const trimmed = input.trim();
    if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === "object") {
          return Object.entries(parsed as Record<string, unknown>).map(([key, value]) =>
            value && typeof value === "object" && !Array.isArray(value)
              ? { name: key, ...(value as Record<string, unknown>) }
              : { name: key, value },
          );
        }
      } catch {
        return [];
      }
    }
  }
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return Object.entries(input as Record<string, unknown>).map(([key, value]) =>
      value && typeof value === "object" && !Array.isArray(value)
        ? { name: key, ...(value as Record<string, unknown>) }
        : { name: key, value },
    );
  }
  return [];
};

const normalizeFactorEntries = (input: unknown) => {
  const candidateArray = parseArrayLike(input);
  if (!Array.isArray(candidateArray)) return [];

  return candidateArray
    .map((entry, index) => {
      if (entry && typeof entry === "object" && !Array.isArray(entry)) {
        const record = entry as Record<string, unknown>;
        const name =
          (record.subject as string) ||
          (record.factor as string) ||
          (record.name as string) ||
          (record.label as string) ||
          `فاکتور ${index + 1}`;
        const score = toNum(
          record.score ?? record.value ?? record.actual ?? record.current ?? record.raw ?? record.scoreValue ?? record.percentage,
        );
        const fullMark =
          toNum(record.maxScore ?? (record as Record<string, unknown>).max_score ?? record.fullMark ?? record.target ?? record.max ?? 5) || 5;

        return {
          subject: name,
          score,
          fullMark,
        };
      }

      const scoreValue = toNum(entry);
      return {
        subject: `فاکتور ${index + 1}`,
        score: scoreValue,
        fullMark: 5,
      };
    })
    .filter((item) => Number.isFinite(item.score));
};

const collectKeywordEntries = (raw: unknown): { keyword: string; mentions: number }[] => {
  const entries = parseArrayLike(raw);
  if (!Array.isArray(entries)) return [];
  const frequency = new Map<string, number>();

  entries.forEach((entry) => {
    if (!entry) return;
    let keyword = "";
    let mentions = 1;
    if (typeof entry === "string") {
      keyword = entry;
    } else if (typeof entry === "object") {
      const record = entry as Record<string, unknown>;
      const rawKeyword = record.keyword ?? record.term ?? record.word ?? record.label ?? record.text ?? record.name;
      if (typeof rawKeyword === "string") {
        keyword = rawKeyword;
      }
      mentions = toNum(record.mentions ?? record.count ?? record.value ?? 1);
    }
    const normalized = keyword.trim();
    if (!normalized) return;
    frequency.set(normalized, (frequency.get(normalized) ?? 0) + (mentions > 0 ? mentions : 1));
  });

  return Array.from(frequency.entries())
    .map(([keyword, mentions]) => ({ keyword, mentions }))
    .filter((item) => item.keyword.length > 0 && item.mentions > 0)
    .sort((a, b) => b.mentions - a.mentions);
};

const classifySentimentLabel = (label: string): SentimentKey => {
  const normalized = label
    ?.toString()
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, "")
    .trim();
  if (!normalized) return "other";
  if (normalized.includes("positive") || normalized.includes("مثبت") || normalized.includes("امید")) return "positive";
  if (normalized.includes("negative") || normalized.includes("منفی") || normalized.includes("نگرانی")) return "negative";
  if (normalized.includes("neutral") || normalized.includes("خنثی") || normalized.includes("متعادل")) return "neutral";
  return "other";
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const normalizeAnalysisObject = (raw: unknown): Record<string, any> => {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  if (typeof raw === "object") {
    return { ...(raw as Record<string, unknown>) };
  }
  return {};
};

const COLORS = ["#0ea5e9", "#22c55e", "#f97316", "#6366f1", "#facc15", "#ec4899"];
const chartGridColor = "rgba(255,255,255,0.2)";
const tooltipStyle = {
  backgroundColor: "rgba(15,23,42,0.95)",
  borderRadius: "12px",
  border: "none",
  color: "#f8fafc",
  boxShadow: "0 12px 30px -12px rgba(15,23,42,0.65)",
  direction: "rtl" as const,
  textAlign: "right" as const,
  fontFamily: rtlFontStack,
};

const noData = (message = "داده‌ای وجود ندارد.") => (
  <div className="flex h-full items-center justify-center rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
    {message}
  </div>
);

const KeywordWordCloud = ({
  data,
  emptyMessage = "کلیدواژه‌ای برای نمایش وجود ندارد.",
}: {
  data: { keyword: string; mentions: number }[];
  emptyMessage?: string;
}) => {
  if (data.length === 0) return noData(emptyMessage);

  const minMentions = Math.min(...data.map((item) => item.mentions));
  const maxMentions = Math.max(...data.map((item) => item.mentions));
  const spread = Math.max(maxMentions - minMentions, 1);

  const getHash = (value: string) => {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(index);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  return (
    <div
      dir="rtl"
      className="flex min-h-[220px] w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 overflow-hidden px-4 py-6"
      style={{ fontFamily: rtlFontStack, lineHeight: 1.2 }}
    >
      {data.slice(0, 80).map(({ keyword, mentions }) => {
        const intensity = (mentions - minMentions) / spread;
        const fontSize = Math.min(2.1, Math.max(0.85, 0.85 + intensity * 1.1));
        const paletteIndex = getHash(keyword) % COLORS.length;
        return (
          <span
            key={`${keyword}-${mentions}-${paletteIndex}`}
            className="font-semibold"
            style={{
              fontSize: `${fontSize}rem`,
              color: COLORS[paletteIndex],
            }}
          >
            {keyword}
          </span>
        );
      })}
    </div>
  );
};

const buildSentimentChartData = (totals: Record<SentimentKey, number>) => {
  const total = Object.values(totals).reduce((sum, value) => sum + value, 0);
  if (!total) return [];
  return SENTIMENT_META.map((meta) => {
    const raw = totals[meta.key] ?? 0;
    return {
      name: meta.label,
      raw,
      value: Math.round(((raw / total) * 100) * 10) / 10,
      color: meta.color,
    };
  }).filter((entry) => entry.raw > 0);
};

const buildFactorHeatmapData = (entries: Array<{ subject: string; score: number }>) => {
  if (!entries || entries.length === 0) return [];
  const total = entries.reduce((sum, entry) => sum + entry.score, 0);
  if (!total) return [];
  return entries.map((entry) => ({
    name: entry.subject,
    value: entry.score,
    percent: Math.round(((entry.score / total) * 100) * 10) / 10,
  }));
};

const buildTimelineSeries = (entries: Array<{ iteration: number; performance: number }>) => {
  if (!entries || entries.length === 0) return { data: [], average: 0 };
  const sanitized = entries
    .filter((entry) => Number.isFinite(entry.performance))
    .map((entry, index) => ({
      iteration: entry.iteration || index + 1,
      performance: Math.round(entry.performance * 10) / 10,
    }));
  const data = sanitized.map((entry, index) => {
    const cumulative = sanitized.slice(0, index + 1).reduce((sum, item) => sum + item.performance, 0);
    const trend = cumulative / (index + 1 || 1);
    return {
      ...entry,
      trend: Math.round(trend * 10) / 10,
    };
  });
  const average = sanitized.reduce((sum, entry) => sum + entry.performance, 0) / (sanitized.length || 1);
  return { data, average: Math.round(average * 10) / 10 };
};

const collectTextItems = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectTextItems(item));
  }
  if (typeof value === "string") {
    return value
      .split(/\r?\n|[•▪●◦]| - /g)
      .map((item) => item.replace(/^[-–—•▪●◦]+/, "").trim())
      .filter(Boolean);
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap((entry) => collectTextItems(entry));
  }
  return [];
};

const dedupeList = (items: string[], maxItems = 12): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const rawItem of items) {
    const item = rawItem.trim();
    if (!item) continue;
    const key = item.replace(/\s+/g, " ").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
    if (result.length >= maxItems) break;
  }
  return result;
};

const extractSummaryText = (analysis: Record<string, any>): string | null => {
  if (!analysis) return null;
  if (typeof analysis.summary === "string" && analysis.summary.trim()) return analysis.summary.trim();
  if (Array.isArray(analysis.summary)) {
    const joined = analysis.summary.map((item) => String(item).trim()).filter(Boolean).join(" ");
    if (joined) return joined;
  }
  if (typeof analysis.report === "string" && analysis.report.trim()) return analysis.report.trim();
  return null;
};

interface AssessmentAnalysisResult {
  assessmentId: number;
  category: string;
  analysis: Record<string, any>;
  questionnaireTitle: string;
  fallbackFactors: { subject: string; score: number; fullMark: number }[];
}

interface PreparedCategoryAnalytics {
  key: string;
  label: string;
  color: string;
  sentimentTotals: Record<SentimentKey, number>;
  keywords: { keyword: string; mentions: number }[];
  conversationKeywords: { keyword: string; mentions: number }[];
  factorEntries: { subject: string; score: number; fullMark: number }[];
  assessmentSpiders: Array<{ id: number; label: string; data: { subject: string; score: number; fullMark: number }[] }>;
  progress: Array<{ iteration: number; performance: number }>;
  summaryText: string | null;
  strengths: string[];
  recommendations: string[];
  developmentPlan: string[];
  risks: string[];
  averageWordCount: number | null;
  totalAssessments: number;
}

const buildCategoryAnalytics = (entries: AssessmentAnalysisResult[]): Record<string, PreparedCategoryAnalytics> => {
  const map = new Map<
    string,
    {
      label: string;
      color: string;
      sentimentTotals: Record<SentimentKey, number>;
      keywordMap: Map<string, number>;
      conversationMap: Map<string, number>;
      factorMap: Map<string, { total: number; count: number; fullMark: number }>;
      assessmentSpiders: Array<{ id: number; label: string; data: { subject: string; score: number; fullMark: number }[] }>;
      progress: Array<{ iteration: number; performance: number }>;
      wordCounts: number[];
      summaries: string[];
      strengths: string[];
      recommendations: string[];
      developmentPlan: string[];
      risks: string[];
      totalAssessments: number;
    }
  >();

  entries.forEach((entry) => {
    const normalized = normalizeCategoryName(entry.category);
    if (!normalized) return;
    const bucket =
      map.get(normalized) ??
      (() => {
        const initialTotals: Record<SentimentKey, number> = {
          positive: 0,
          neutral: 0,
          negative: 0,
          other: 0,
        };
        const next = {
          label: normalized,
          color: getCategoryColor(normalized),
          sentimentTotals: initialTotals,
          keywordMap: new Map<string, number>(),
          conversationMap: new Map<string, number>(),
          factorMap: new Map<string, { total: number; count: number; fullMark: number }>(),
          assessmentSpiders: [],
          progress: [] as Array<{ iteration: number; performance: number }>,
          wordCounts: [] as number[],
          summaries: [] as string[],
          strengths: [] as string[],
          recommendations: [] as string[],
          developmentPlan: [] as string[],
          risks: [] as string[],
          totalAssessments: 0,
        };
        map.set(normalized, next);
        return next;
      })();

    bucket.totalAssessments += 1;
    const analysis = entry.analysis;

    const sentimentSource = analysis?.sentiment_analysis ?? analysis?.sentimentAnalysis ?? null;
    if (sentimentSource && typeof sentimentSource === "object") {
      Object.entries(sentimentSource as Record<string, unknown>).forEach(([name, value]) => {
        const key = classifySentimentLabel(name);
        bucket.sentimentTotals[key] = (bucket.sentimentTotals[key] ?? 0) + toNum(value);
      });
    }

    collectKeywordEntries(analysis?.keyword_analysis).forEach(({ keyword, mentions }) => {
      bucket.keywordMap.set(keyword, (bucket.keywordMap.get(keyword) ?? 0) + mentions);
    });

    collectKeywordEntries(analysis?.word_cloud_full ?? analysis?.conversation_word_cloud ?? analysis?.keyword_analysis_full).forEach(
      ({ keyword, mentions }) => {
        bucket.conversationMap.set(keyword, (bucket.conversationMap.get(keyword) ?? 0) + mentions);
      },
    );

    const factorCandidates = [
      analysis?.factor_scores,
      analysis?.factor_scatter,
      analysis?.factor_contribution,
      analysis?.factorScore,
      analysis?.factorScatter,
      analysis?.factorContribution,
    ];
    let firstFactorSet: { subject: string; score: number; fullMark: number }[] | null = null;
    let hasFactorData = false;
    factorCandidates.forEach((candidate) => {
      const normalized = normalizeFactorEntries(candidate);
      if (normalized.length === 0) return;
      hasFactorData = true;
      if (!firstFactorSet) {
        firstFactorSet = normalized;
      }
      normalized.forEach((factor) => {
        const factorBucket =
          bucket.factorMap.get(factor.subject) ?? { total: 0, count: 0, fullMark: factor.fullMark ?? 5 };
        factorBucket.total += factor.score;
        factorBucket.count += 1;
        factorBucket.fullMark = Math.max(factorBucket.fullMark, factor.fullMark ?? factorBucket.fullMark);
        bucket.factorMap.set(factor.subject, factorBucket);
      });
    });
    if (!hasFactorData && entry.fallbackFactors.length > 0) {
      firstFactorSet = entry.fallbackFactors;
      entry.fallbackFactors.forEach((factor) => {
        const factorBucket =
          bucket.factorMap.get(factor.subject) ?? { total: 0, count: 0, fullMark: factor.fullMark ?? 5 };
        factorBucket.total += factor.score;
        factorBucket.count += 1;
        factorBucket.fullMark = Math.max(factorBucket.fullMark, factor.fullMark ?? factorBucket.fullMark);
        bucket.factorMap.set(factor.subject, factorBucket);
      });
    }

    let perAssessmentFactors = firstFactorSet ?? [];
    if (perAssessmentFactors.length === 0 && entry.fallbackFactors.length > 0) {
      perAssessmentFactors = entry.fallbackFactors;
    }
    if (perAssessmentFactors.length > 0) {
      bucket.assessmentSpiders.push({
        id: entry.assessmentId,
        label: entry.questionnaireTitle || `پرسشنامه ${bucket.assessmentSpiders.length + 1}`,
        data: perAssessmentFactors,
      });
    }

    const timelineSource = Array.isArray(analysis?.progress_timeline)
      ? analysis?.progress_timeline
      : Array.isArray(analysis?.verbosity_trend)
        ? analysis?.verbosity_trend
        : [];
    timelineSource.forEach((item: any, index: number) => {
      const iteration = toNum(item?.iteration ?? item?.turn ?? index + 1);
      const performance = toNum(item?.performance ?? item?.score ?? item?.word_count ?? 0);
      if (Number.isFinite(performance)) {
        bucket.progress.push({
          iteration: iteration || bucket.progress.length + 1,
          performance,
        });
      }
    });

    if (Array.isArray(analysis?.verbosity_trend)) {
      analysis.verbosity_trend.forEach((item: any) => {
        const wordCount = toNum(item?.word_count ?? item?.performance);
        if (wordCount > 0) {
          bucket.wordCounts.push(wordCount);
        }
      });
    }

    const summaryText = extractSummaryText(analysis);
    if (summaryText) bucket.summaries.push(summaryText);

    bucket.strengths.push(...collectTextItems(analysis?.strengths));
    bucket.recommendations.push(...collectTextItems(analysis?.recommendations));
    bucket.developmentPlan.push(...collectTextItems(analysis?.development_plan));
    bucket.risks.push(...collectTextItems(analysis?.risk_flags ?? analysis?.risk_indicators));
  });

  const result: Record<string, PreparedCategoryAnalytics> = {};
  map.forEach((bucket, key) => {
    const factorEntries = Array.from(bucket.factorMap.entries()).map(([subject, data]) => ({
      subject,
      score: Math.round((data.total / (data.count || 1)) * 10) / 10,
      fullMark: data.fullMark || 5,
    }));
    result[key] = {
      key,
      label: bucket.label,
      color: bucket.color,
      sentimentTotals: bucket.sentimentTotals,
      keywords: Array.from(bucket.keywordMap.entries())
        .map(([keyword, mentions]) => ({ keyword, mentions }))
        .sort((a, b) => b.mentions - a.mentions),
      conversationKeywords: Array.from(bucket.conversationMap.entries())
        .map(([keyword, mentions]) => ({ keyword, mentions }))
        .sort((a, b) => b.mentions - a.mentions),
      factorEntries,
      assessmentSpiders: bucket.assessmentSpiders,
      progress: bucket.progress,
      summaryText: bucket.summaries.join("\n\n").trim() || null,
      strengths: dedupeList(bucket.strengths),
      recommendations: dedupeList(bucket.recommendations),
      developmentPlan: dedupeList(bucket.developmentPlan),
      risks: dedupeList(bucket.risks),
      averageWordCount:
        bucket.wordCounts.length > 0
          ? Math.round((bucket.wordCounts.reduce((sum, value) => sum + value, 0) / bucket.wordCounts.length) * 10) / 10
          : null,
      totalAssessments: bucket.totalAssessments,
    };
  });

  return result;
};

const formatDate = (value: string | null) => {
  if (!value) return "نامشخص";
  try {
    return new Date(value).toLocaleString("fa-IR", {
      dateStyle: "long",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
};

const AdminFinalReports = () => {
  const navigate = useNavigate();
  const [summaries, setSummaries] = useState<FinalReportSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [detail, setDetail] = useState<FinalReportDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [categoryAnalytics, setCategoryAnalytics] = useState<Record<string, PreparedCategoryAnalytics>>({});
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  const loadSummaries = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getFinalReportSummaries();
      if (!response.success) {
        throw new Error(response.message || "خطا در دریافت فهرست کاربران");
      }
      setSummaries(response.data || []);
    } catch (error: any) {
      toast.error(error.message || "خطا در دریافت گزارش‌های نهایی");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadDetail = useCallback(
    async (userId: number) => {
      setSelectedUserId(userId);
      setDetail(null);
      setDetailError(null);
      setDetailLoading(true);
      try {
        const response = await getFinalReportDetail(userId);
        if (!response.success) {
          throw new Error(response.message || "جزئیات گزارش یافت نشد");
        }
        setDetail(response.data);
      } catch (error: any) {
        const message = error.message || "خطا در دریافت جزئیات گزارش";
        toast.error(message);
        setDetailError(message);
      } finally {
        setDetailLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadSummaries();
  }, [loadSummaries]);

  useEffect(() => {
    if (!selectedUserId && summaries.length > 0 && !isLoading) {
      loadDetail(summaries[0].userId);
    }
  }, [summaries, selectedUserId, isLoading, loadDetail]);

  useEffect(() => {
    if (!detail || !detail.assessments || detail.assessments.length === 0) {
      setCategoryAnalytics({});
      return;
    }
    let isActive = true;
    const loadAnalytics = async () => {
      setIsAnalyticsLoading(true);
      setAnalyticsError(null);
      try {
        const responses = await Promise.all(
          detail.assessments.map(async (assessment) => {
            const fallbackFactors = Array.isArray(assessment.factorScores)
              ? assessment.factorScores.map((item) => ({
                subject: item.name || item.factor || `فاکتور ${item}`,
                score: toNum(item.score),
                fullMark: toNum(item.maxScore) || 5,
              }))
              : [];
            try {
              const response = await apiFetch(`admin/reports/${assessment.assessmentId}`);
              if (response?.success && response.data?.analysis) {
                return {
                  assessmentId: assessment.assessmentId,
                  category: assessment.category,
                  analysis: normalizeAnalysisObject(response.data.analysis),
                  questionnaireTitle: assessment.questionnaireTitle,
                  fallbackFactors,
                };
              }
            } catch (error) {
              console.error(`Failed to load analysis for assessment ${assessment.assessmentId}`, error);
            }
            return {
              assessmentId: assessment.assessmentId,
              category: assessment.category,
              analysis: {},
              questionnaireTitle: assessment.questionnaireTitle,
              fallbackFactors,
            };
          }),
        );
        if (!isActive) return;
        const aggregated = buildCategoryAnalytics(
          responses.filter((item): item is AssessmentAnalysisResult => Boolean(item && item.category)),
        );
        setCategoryAnalytics(aggregated);
      } catch (error: any) {
        if (!isActive) return;
        setAnalyticsError(error?.message || "خطا در بارگذاری تحلیل دسته‌بندی‌ها");
      } finally {
        if (isActive) {
          setIsAnalyticsLoading(false);
        }
      }
    };
    loadAnalytics();
    return () => {
      isActive = false;
    };
  }, [detail]);

  const filteredSummaries = useMemo(() => {
    if (!searchTerm.trim()) return summaries;
    const term = searchTerm.trim().toLowerCase();
    return summaries.filter((summary) => {
      const displayName = `${summary.first_name ?? ""} ${summary.last_name ?? ""}`.trim();
      return (
        summary.username.toLowerCase().includes(term) ||
        displayName.toLowerCase().includes(term) ||
        summary.email.toLowerCase().includes(term)
      );
    });
  }, [summaries, searchTerm]);

  const spiderData = useMemo(() => {
    if (!detail?.radar) return [];
    return detail.radar.map((entry) => ({
      subject: entry.subject,
      user: entry.userScore,
      target: entry.targetScore,
    }));
  }, [detail]);

  const spiderSeries = [
    { key: "user", label: "امتیاز کاربر", color: "#6366f1" },
    { key: "target", label: "هدف (۱۰۰)", color: "#94a3b8" },
  ];

  const categoryOverview = useMemo(() => {
    if (!detail?.categories) return [];
    return detail.categories
      .map((category) => {
        const normalizedLabel = normalizeCategoryName(category.label);
        const displayLabel = category.label?.trim() ? category.label : normalizedLabel;
        const totalAssignments = category.totalAssignments ?? 0;
        const pendingCount = Math.max(totalAssignments - category.completedCount, 0);
        return {
          key: category.key,
          label: displayLabel,
          normalizedKey: normalizedLabel,
          normalizedScore: Number(category.normalizedScore.toFixed(2)),
          completedCount: category.completedCount,
          totalAssignments,
          pendingCount,
          color: getCategoryColor(normalizedLabel),
        };
      })
      .sort((a, b) => getCategoryOrder(a.normalizedKey) - getCategoryOrder(b.normalizedKey));
  }, [detail]);

  const categoryChartData = useMemo(
    () =>
      categoryOverview.map((entry) => ({
        name: entry.label,
        score: entry.normalizedScore,
        completed: entry.completedCount,
        total: entry.totalAssignments,
        pending: entry.pendingCount,
        color: entry.color,
      })),
    [categoryOverview],
  );

  const pendingCategorySummary = useMemo(() => {
    if (categoryOverview.length === 0) return [];
    return categoryOverview
      .filter((entry) => entry.pendingCount > 0)
      .map((entry) => ({
        label: entry.label,
        remaining: entry.pendingCount,
        total: entry.totalAssignments,
        normalizedKey: entry.normalizedKey,
      }))
      .sort((a, b) => getCategoryOrder(a.normalizedKey) - getCategoryOrder(b.normalizedKey));
  }, [categoryOverview]);

  const categoryAnalyticsList = useMemo(() => {
    const used = new Set<string>();
    const ordered: Array<{ key: string; label: string; score: number; analytics: PreparedCategoryAnalytics }> = [];
    categoryOverview.forEach((entry) => {
      const analytics = categoryAnalytics[entry.normalizedKey];
      if (analytics) {
        ordered.push({
          key: entry.normalizedKey,
          label: entry.label,
          score: entry.normalizedScore,
          analytics,
        });
        used.add(entry.normalizedKey);
      }
    });
    Object.values(categoryAnalytics).forEach((analytics) => {
      if (used.has(analytics.key)) return;
      ordered.push({
        key: analytics.key,
        label: analytics.label,
        score: 0,
        analytics,
      });
    });
    return ordered;
  }, [categoryOverview, categoryAnalytics]);

  return (
    <div className="admin-page space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white">گزارش‌های نهایی مسیر</h1>
          <p className="text-sm text-white/70">
            وضعیت کلی کاربران را مشاهده کنید و کارنامه نهایی هر مسیر را در قالب پاورویل و نمودار عنکبوتی بررسی نمایید.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="rounded-2xl border-white/30 bg-white/10 text-white hover:bg-white/20"
            onClick={() => navigate("/admin/dashboard")}
          >
            <ArrowLeft className="ml-2 h-4 w-4" />
            بازگشت
          </Button>
          <Button
            variant="secondary"
            className="rounded-2xl bg-white/80 text-slate-900 shadow-md shadow-indigo-500/10"
            onClick={loadSummaries}
            disabled={isLoading}
          >
            {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="ml-2 h-4 w-4" />}
            بروزرسانی
          </Button>
        </div>
      </div>

      <section className="admin-surface space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
            <Search className="h-4 w-4 text-white/60" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجوی نام یا نام‌کاربری..."
              className="border-0 bg-transparent text-white placeholder:text-white/40 focus-visible:ring-0"
            />
          </div>
          <p className="text-xs text-white/60">
            {filteredSummaries.length} مسیر تعریف شده - {summaries.filter((s) => s.isReady).length} کاربر آماده تحویل
          </p>
        </div>
        <div className="rounded-3xl border border-white/5">
          {isLoading ? (
            <div className="py-16 text-center text-white/70">
              <LoaderCircle className="mx-auto mb-3 h-10 w-10 animate-spin" />
              در حال آماده‌سازی گزارش‌ها...
            </div>
          ) : (
            <div className="max-h-[460px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-white/5 text-white/70">
                    <TableHead>کاربر</TableHead>
                    <TableHead className="text-center">پیشرفت</TableHead>
                    <TableHead className="text-center">میانگین امتیاز</TableHead>
                    <TableHead className="text-center">آخرین بروزرسانی</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSummaries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-white/60">
                        موردی برای نمایش وجود ندارد.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSummaries.map((summary) => {
                      const isActive = summary.userId === selectedUserId;
                      return (
                        <TableRow
                          key={summary.userId}
                          onClick={() => loadDetail(summary.userId)}
                          className={cn(
                            "cursor-pointer transition hover:bg-indigo-500/10",
                            isActive && "bg-indigo-500/20",
                          )}
                        >
                          <TableCell className="space-y-1 text-white">
                            <div className="font-semibold">
                              {summary.first_name} {summary.last_name}
                            </div>
                            <div className="text-xs text-white/60">@{summary.username}</div>
                            <Badge variant={summary.isReady ? "default" : "secondary"} className="mt-1">
                              {summary.isReady ? "آماده تحویل" : "در حال تکمیل"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-white">
                            <div className="mb-1 text-xs text-white/70">
                              {summary.completedCount}/{summary.assignedCount} مرحله
                            </div>
                            <Progress value={summary.completionPercent} className="bg-white/20" />
                          </TableCell>
                          <TableCell className="text-center text-2xl font-black text-white">
                            {summary.overallScore?.toFixed(0) ?? "—"}
                          </TableCell>
                          <TableCell className="text-center text-white/70">
                            {summary.lastCompletedAt ? formatDate(summary.lastCompletedAt) : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </section>
      <section className="admin-surface space-y-6">
        {detailLoading ? (
          <div className="py-16 text-center text-white/70">
            <LoaderCircle className="mx-auto mb-3 h-10 w-10 animate-spin" />
            در حال دریافت گزارش نهایی کاربر...
          </div>
        ) : detailError ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-center text-white">
            <AlertTriangle className="h-10 w-10 text-red-300" />
            <p className="text-sm text-red-200">{detailError}</p>
          </div>
        ) : detail ? (
          <>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {detail.user.first_name} {detail.user.last_name}{" "}
                  <span className="text-sm text-white/50">(@{detail.user.username})</span>
                </h2>
                <p className="text-xs text-white/50">
                  آخرین بروزرسانی: {detail.progress.lastCompletedAt ? formatDate(detail.progress.lastCompletedAt) : "نامشخص"}
                </p>
              </div>
              <Badge variant={detail.progress.isReady ? "default" : "secondary"} className="rounded-full bg-white/80 text-slate-900">
                {detail.progress.isReady ? "کاربر آماده تحویل نهایی" : "هنوز برخی مراحل باقی مانده است"}
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-white/5 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white/70">پیشرفت مسیر</CardTitle>
                  <CardDescription className="text-xs text-white/50">مراحل تکمیل‌شده</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-black">
                    {detail.progress.completedCount}/{detail.progress.assignedCount}
                  </p>
                  <Progress className="mt-3 bg-white/20" value={detail.progress.completionPercent} />
                </CardContent>
              </Card>
              <Card className="bg-white/5 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white/70">میانگین امتیاز</CardTitle>
                  <CardDescription className="text-xs text-white/50">بر اساس تحلیل نهایی</CardDescription>
                </CardHeader>
                <CardContent className="flex items-end gap-2">
                  <p className="text-4xl font-black">{detail.overview.overallScore.toFixed(0)}</p>
                  <span className="text-sm text-white/60">/ 100</span>
                </CardContent>
              </Card>
              <Card className="bg-white/5 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white/70">میانگین امتیاز خام</CardTitle>
                  <CardDescription className="text-xs text-white/50">نمره میانگین گفت‌وگوها</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-3">
                  <ShieldCheck className="h-10 w-10 text-emerald-300" />
                  <div>
                    <p className="text-2xl font-bold">{detail.overview.averageScore.toFixed(1)}</p>
                    <p className="text-xs text-white/60">میانگین خام</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-indigo-900/40 to-slate-950/40 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  پاورویل شایستگی‌ها
                </div>
                <div className="mt-4">
                  <PowerWheelChart data={detail.powerWheel} />
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-indigo-900/40 to-slate-950/40 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <ShieldCheck className="h-4 w-4 text-sky-300" />
                  نمودار عنکبوتی مقایسه دسته‌بندی‌ها
                </div>
                <div className="mt-4 h-[360px]">
                  {spiderData.length > 0 ? (
                    <ComparisonSpiderChart data={spiderData} series={spiderSeries} />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-white/60">
                      داده‌ای برای نمودار در دسترس نیست.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {detail.categories.map((category) => (
                <Card key={category.key} className="bg-white/5 text-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{category.label}</CardTitle>
                    <CardDescription className="text-xs text-white/50">
                      {category.completedCount}/{category.totalAssignments || 0} مرحله
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-black">{category.normalizedScore.toFixed(1)}</p>
                    <Progress className="mt-3 bg-white/20" value={category.normalizedScore} />
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-white/5 text-white">
                <CardHeader>
                  <CardTitle>نقاط قوت</CardTitle>
                  <CardDescription>ترسیم‌شده از تمام گفت‌وگوها</CardDescription>
                </CardHeader>
                <CardContent>
                  {detail.strengths.length === 0 ? (
                    <p className="text-sm text-white/60">هنوز تحلیلی ثبت نشده است.</p>
                  ) : (
                    <ul className="space-y-2 text-sm text-white/90">
                      {detail.strengths.map((item, index) => (
                        <li key={`strength-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-2">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-white/5 text-white">
                <CardHeader>
                  <CardTitle>پیشنهادهای توسعه</CardTitle>
                  <CardDescription>ترکیب توصیه‌های تحلیل نهایی</CardDescription>
                </CardHeader>
                <CardContent>
                  {detail.developmentPlan.length === 0 && detail.recommendations.length === 0 ? (
                    <p className="text-sm text-white/60">پیشنهاد مشخصی ثبت نشده است.</p>
                  ) : (
                    <ul className="space-y-2 text-sm text-white/90">
                      {[...detail.developmentPlan, ...detail.recommendations].map((item, index) => (
                        <li key={`plan-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-2">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-white/5 text-white">
                <CardHeader>
                  <CardTitle>نمودار پیشرفت دسته‌بندی‌ها</CardTitle>
                  <CardDescription>میانگین امتیاز هر شایستگی در گزارش نهایی</CardDescription>
                </CardHeader>
                <CardContent>
                  {categoryChartData.length === 0 ? (
                    <p className="text-sm text-white/60">هنوز دسته‌بندی معتبری برای نمایش وجود ندارد.</p>
                  ) : (
                    <div className="h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={categoryChartData}
                          layout="vertical"
                          margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                        >
                          <CartesianGrid stroke="rgba(255,255,255,0.1)" />
                          <XAxis
                            type="number"
                            domain={[0, 100]}
                            tick={{ fill: "#cbd5f5", fontSize: 12 }}
                            tickFormatter={(value: number) => value.toFixed(0)}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={150}
                            tick={{ fill: "#f8fafc", fontSize: 12 }}
                          />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: "rgba(15,23,42,0.95)",
                              border: "none",
                              borderRadius: "12px",
                              color: "#f8fafc",
                              direction: "rtl",
                            }}
                            formatter={(value: number) => [`${value.toFixed(1)} از ۱۰۰`, "امتیاز"]}
                          />
                          <Bar dataKey="score" radius={[10, 10, 10, 10]}>
                            {categoryChartData.map((entry) => (
                              <Cell key={`category-bar-${entry.name}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-white/5 text-white">
                <CardHeader>
                  <CardTitle>گزارش دسته‌بندی‌های شایستگی</CardTitle>
                  <CardDescription>تمام اطلاعات به‌جای پرسشنامه، بر اساس شایستگی خلاصه شده‌اند</CardDescription>
                </CardHeader>
                <CardContent>
                  {categoryOverview.length === 0 ? (
                    <p className="text-sm text-white/60">دسته‌بندی ثبت‌شده‌ای برای گزارش وجود ندارد.</p>
                  ) : (
                    <div className="space-y-3">
                      {categoryOverview.map((category) => (
                        <div
                          key={category.key}
                          className="rounded-2xl border border-white/10 bg-white/5 p-4"
                        >
                          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="text-xs text-white/60">شایستگی</p>
                              <h4 className="text-base font-semibold text-white">{category.label}</h4>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-white/60">
                                {category.completedCount}/{category.totalAssignments || 0} مرحله
                              </p>
                              <p className="text-2xl font-black text-white">
                                {category.normalizedScore.toFixed(1)}
                              </p>
                            </div>
                          </div>
                          <Progress className="mt-3 bg-white/10" value={category.normalizedScore} />
                          <p className="mt-2 text-xs text-white/70">
                            {category.pendingCount > 0
                              ? `${category.pendingCount.toLocaleString("fa-IR")} مرحله تا تکمیل این شایستگی باقی مانده است.`
                              : "این شایستگی به صورت کامل ارزیابی شده است."}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/5 text-white">
              <CardHeader>
                <CardTitle>مراحل باقیمانده بر اساس شایستگی</CardTitle>
                <CardDescription>برای کامل شدن مسیر باید وضعیت هر شایستگی به اتمام برسد</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingCategorySummary.length === 0 ? (
                  <p className="text-sm text-emerald-200">تمام دسته‌بندی‌ها تکمیل شده است.</p>
                ) : (
                  <ul className="space-y-2 text-sm text-white/90">
                    {pendingCategorySummary.map((item) => (
                      <li key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{item.label}</span>
                          <Badge variant="secondary" className="bg-white/10 text-white">
                            {item.remaining.toLocaleString("fa-IR")} مرحله
                          </Badge>
                        </div>
                        <p className="mt-2 text-xs text-white/60">
                          {item.total > 0
                            ? `از ${item.total.toLocaleString("fa-IR")} مرحله تعریف‌شده، هنوز ${item.remaining.toLocaleString("fa-IR")} مرحله تکمیل نشده است.`
                            : "برای این شایستگی هنوز مسیری تعریف نشده است."}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <section className="space-y-4 rounded-3xl border border-white/10 bg-gradient-to-b from-indigo-900/40 to-slate-950/40 p-5 text-white">
              <div className="space-y-2 text-right">
                <h3 className="text-xl font-semibold">تحلیل کامل شایستگی‌ها</h3>
                <p className="text-sm text-white/70">
                  تمام نمودارها و تحلیل‌ها به صورت تجمیع‌شده برای هر دسته‌بندی شایستگی نمایش داده می‌شود تا بتوانید همان تجربه‌ی
                  گزارش تفصیلی را در قالب نهایی مسیر داشته باشید.
                </p>
              </div>
              {isAnalyticsLoading ? (
                <div className="flex h-40 items-center justify-center text-white/70">
                  <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                  در حال ساخت نمودارهای دسته‌بندی...
                </div>
              ) : analyticsError ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
                  {analyticsError}
                </div>
              ) : categoryAnalyticsList.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                  هنوز داده‌ای برای تحلیل نمودارها ثبت نشده است.
                </div>
              ) : (
                <Tabs defaultValue={categoryAnalyticsList[0]?.key} className="space-y-4" dir="rtl">
                  <TabsList className="flex w-full flex-wrap items-center gap-2 rounded-2xl bg-white/10 p-2">
                    {categoryAnalyticsList.map((category) => (
                      <TabsTrigger
                        key={category.key}
                        value={category.key}
                        className="flex-1 rounded-xl border border-transparent px-3 py-2 text-sm text-white data-[state=active]:border-white/30 data-[state=active]:bg-white/20"
                        style={{ fontFamily: rtlFontStack }}
                      >
                        {category.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {categoryAnalyticsList.map((category) => (
                    <TabsContent key={category.key} value={category.key} className="space-y-6">
                      <CategoryAnalyticsTab analytics={category.analytics} score={category.score} />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </section>
          </>
        ) : (
          <div className="py-16 text-center text-white/70">
            برای مشاهده جزئیات، یکی از کاربران را از جدول بالا انتخاب کنید.
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminFinalReports;

const CategoryAnalyticsTab = ({ analytics, score }: { analytics: PreparedCategoryAnalytics; score: number }) => {
  const sentimentChartData = useMemo(() => buildSentimentChartData(analytics.sentimentTotals), [analytics.sentimentTotals]);
  const factorHeatmapData = useMemo(() => buildFactorHeatmapData(analytics.factorEntries), [analytics.factorEntries]);
  const spiderData = useMemo(
    () => analytics.factorEntries.map((entry) => ({ subject: entry.subject, score: entry.score, fullMark: entry.fullMark })),
    [analytics.factorEntries],
  );
  const { data: timelineData, average: timelineAverage } = useMemo(
    () => buildTimelineSeries(analytics.progress),
    [analytics.progress],
  );
  const comparisonSpider = useMemo(() => {
    if (!analytics.assessmentSpiders || analytics.assessmentSpiders.length < 2) return null;
    const series = analytics.assessmentSpiders.map((assessment, index) => ({
      key: `assessment_${assessment.id}_${index}`,
      label: assessment.label,
      color: COLORS[index % COLORS.length],
    }));
    const dataMap = new Map<string, Record<string, number | string | undefined>>();
    analytics.assessmentSpiders.forEach((assessment, index) => {
      const key = series[index].key;
      assessment.data.forEach((entry) => {
        const existing = dataMap.get(entry.subject) ?? { subject: entry.subject, fullMark: entry.fullMark };
        const currentFullMark = typeof existing.fullMark === "number" ? existing.fullMark : entry.fullMark;
        existing.fullMark = Math.max(currentFullMark || 0, entry.fullMark || 0);
        existing[key] = entry.score;
        dataMap.set(entry.subject, existing);
      });
    });
    const data = Array.from(dataMap.values()).map((entry) => {
      series.forEach((serie) => {
        if (typeof entry[serie.key] !== "number") {
          entry[serie.key] = 0;
        }
      });
      return entry;
    });
    return { series, data };
  }, [analytics.assessmentSpiders]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="bg-white/5 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">میانگین امتیاز دسته</CardTitle>
            <CardDescription className="text-xs text-white/50">بر اساس تمامی پرسشنامه‌های این شایستگی</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black">{Number.isFinite(score) ? score.toFixed(1) : "—"}</p>
            <p className="text-xs text-white/60">نمره نرمال‌شده</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">تعداد گفتگوهای تحلیل‌شده</CardTitle>
            <CardDescription className="text-xs text-white/50">پرسشنامه‌های مرتبط با این شایستگی</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black">{analytics.totalAssessments}</p>
            <p className="text-xs text-white/60">مرحله تکمیل‌شده</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">میانگین حجم پاسخ‌ها</CardTitle>
            <CardDescription className="text-xs text-white/50">مبنای نمودار روند گفت‌وگوها</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black">
              {analytics.averageWordCount !== null ? `${analytics.averageWordCount.toFixed(0)} کلمه` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="bg-white/5 text-white">
          <CardHeader>
            <CardTitle>تحلیل احساسات</CardTitle>
            <CardDescription className="text-xs text-white/60">سهم هر احساس از مجموع گفتگوها</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            {sentimentChartData.length === 0 ? (
              noData("هنوز تحلیلی برای احساسات ثبت نشده است.")
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value.toFixed(1)}٪`}
                  >
                    {sentimentChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number, name: string) => [`${value}٪`, name]} contentStyle={tooltipStyle} />
                  <Legend
                    wrapperStyle={{ direction: "rtl" as const }}
                    formatter={(value) => <span style={{ fontFamily: rtlFontStack }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="bg-white/5 text-white">
          <CardHeader>
            <CardTitle>ابر واژگان کلیدی</CardTitle>
            <CardDescription className="text-xs text-white/60">ترکیب مهم‌ترین کلیدواژه‌های این شایستگی</CardDescription>
          </CardHeader>
          <CardContent>
            <KeywordWordCloud data={analytics.keywords} />
          </CardContent>
        </Card>
        <Card className="bg-white/5 text-white">
          <CardHeader>
            <CardTitle>ابر واژگان گفتگو</CardTitle>
            <CardDescription className="text-xs text-white/60">کلمات پرتکرار در کل گفت‌وگوها</CardDescription>
          </CardHeader>
          <CardContent>
            <KeywordWordCloud data={analytics.conversationKeywords} emptyMessage="داده‌ای برای نمایش وجود ندارد." />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="bg-white/5 text-white">
          <CardHeader>
            <CardTitle>نقشه حرارتی سهم فاکتورها</CardTitle>
            <CardDescription className="text-xs text-white/60">ارزش نسبی هر مولفه در این شایستگی</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {factorHeatmapData.length === 0 ? (
              noData("فاکتوری برای این دسته ثبت نشده است.")
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={factorHeatmapData} layout="vertical" margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid stroke={chartGridColor} horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={160}
                    tick={{ fill: "#f8fafc", fontSize: 12, fontFamily: rtlFontStack }}
                  />
                  <RechartsTooltip
                    formatter={(value: number, name: string, item: any) => [`${item.payload.percent}%`, name]}
                    contentStyle={tooltipStyle}
                  />
                  <Bar dataKey="percent" radius={[10, 10, 10, 10]}>
                    {factorHeatmapData.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="bg-white/5 text-white">
          <CardHeader>
            <CardTitle>روند عملکرد گفت‌وگوها</CardTitle>
            <CardDescription className="text-xs text-white/60">مقایسه امتیاز هر بخش و میانگین متحرک</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {timelineData.length === 0 ? (
              noData("داده‌ای برای روند زمانی وجود ندارد.")
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid stroke={chartGridColor} strokeDasharray="6 6" />
                  <XAxis
                    dataKey="iteration"
                    tick={{ fill: "#e2e8f0", fontSize: 12, fontFamily: rtlFontStack }}
                    tickFormatter={(value: number) => `مرحله ${value}`}
                  />
                  <YAxis tick={{ fill: "#e2e8f0", fontSize: 12, fontFamily: rtlFontStack }} />
                  <RechartsTooltip
                    formatter={(value: number) => [`${value.toFixed(1)} امتیاز`, "عملکرد"]}
                    labelFormatter={(value: number) => `مرحله ${value}`}
                    contentStyle={tooltipStyle}
                  />
                  <Legend wrapperStyle={{ direction: "rtl" as const }} />
                  {timelineAverage ? (
                    <ReferenceLine
                      y={timelineAverage}
                      stroke="#f97316"
                      strokeDasharray="4 4"
                      label={{
                        value: "میانگین",
                        position: "right",
                        fill: "#f97316",
                        fontSize: 11,
                        fontFamily: rtlFontStack,
                      }}
                    />
                  ) : null}
                  <Line
                    type="monotone"
                    dataKey="performance"
                    stroke="#38bdf8"
                    strokeWidth={3}
                    dot={{ r: 4, stroke: "#fff", strokeWidth: 1.5 }}
                    name="عملکرد"
                  />
                  <Line type="monotone" dataKey="trend" stroke="#c084fc" strokeWidth={2} dot={false} name="میانگین متحرک" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        {analytics.assessmentSpiders.length > 0 && (
          <Card className="bg-white/5 text-white">
            <CardHeader>
              <CardTitle>نمودار هر پرسشنامه (تعویضی)</CardTitle>
              <CardDescription className="text-xs text-white/60">
                با انتخاب نام پرسشنامه، نمودار فاکتورهای همان گفتگو نمایش داده می‌شود.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={`assessment-${analytics.assessmentSpiders[0].id}`} className="space-y-3" dir="rtl">
                <TabsList className="flex flex-wrap gap-2 rounded-2xl bg-white/10 p-2">
                  {analytics.assessmentSpiders.map((assessment) => (
                    <TabsTrigger
                      key={assessment.id}
                      value={`assessment-${assessment.id}`}
                      className="flex-1 rounded-xl border border-transparent px-3 py-2 text-xs text-white data-[state=active]:border-white/20 data-[state=active]:bg-white/20"
                      style={{ fontFamily: rtlFontStack }}
                    >
                      {assessment.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {analytics.assessmentSpiders.map((assessment) => (
                  <TabsContent key={assessment.id} value={`assessment-${assessment.id}`}>
                    <div className="h-[360px]">
                      <SpiderChart data={assessment.data} />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>

      {analytics.assessmentSpiders.length > 0 && (
        <Card className="bg-white/5 text-white">
          <CardHeader>
            <CardTitle>نمودار هر پرسشنامه</CardTitle>
            <CardDescription className="text-xs text-white/60">
              برای جزئیات بیشتر، مولفه‌های هر گفت‌وگو به صورت جداگانه نمایش داده شده است.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {analytics.assessmentSpiders.map((assessment, index) => (
                <div key={`${assessment.id}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="mb-3 text-sm font-semibold text-white/80">{assessment.label}</p>
                  <div className="h-[320px]">
                    <SpiderChart data={assessment.data} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="bg-white/5 text-white">
          <CardHeader>
            <CardTitle>نمودار راداری فاکتورها</CardTitle>
            <CardDescription className="text-xs text-white/60">
              {comparisonSpider ? "مقایسه تمام پرسشنامه‌های این شایستگی" : "میانگین امتیاز مولفه‌های این شایستگی"}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[420px]">
            {comparisonSpider ? (
              <ComparisonSpiderChart data={comparisonSpider.data} series={comparisonSpider.series} />
            ) : spiderData.length === 0 ? (
              noData("داده‌ای برای نمایش در نمودار راداری وجود ندارد.")
            ) : (
              <SpiderChart data={spiderData} />
            )}
          </CardContent>
        </Card>
        <Card className="bg-white/5 text-white">
          <CardHeader>
            <CardTitle>چکیده تحلیلی</CardTitle>
            <CardDescription className="text-xs text-white/60">خلاصه‌ای از مهم‌ترین نکات استخراج‌شده</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.summaryText ? (
              <p className="whitespace-pre-line text-sm text-white/80">{analytics.summaryText}</p>
            ) : (
              <p className="text-sm text-white/60">خلاصه‌ای برای این شایستگی ثبت نشده است.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="bg-white/5 text-white">
          <CardHeader>
            <CardTitle>نقاط قوت</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.strengths.length === 0 ? (
              <p className="text-sm text-white/60">موردی ثبت نشده است.</p>
            ) : (
              <ul className="list-disc space-y-2 pr-5 text-sm text-white/90">
                {analytics.strengths.map((item, index) => (
                  <li key={`strength-${index}`}>{item}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card className="bg-white/5 text-white">
          <CardHeader>
            <CardTitle>پیشنهادهای توسعه</CardTitle>
            <CardDescription className="text-xs text-white/60">شامل برنامه رشد و توصیه‌های کلیدی</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.recommendations.length === 0 && analytics.developmentPlan.length === 0 ? (
              <p className="text-sm text-white/60">پیشنهادی ثبت نشده است.</p>
            ) : (
              <ul className="list-disc space-y-2 pr-5 text-sm text-white/90">
                {[...analytics.recommendations, ...analytics.developmentPlan].map((item, index) => (
                  <li key={`plan-${index}`}>{item}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card className="bg-white/5 text-white">
          <CardHeader>
            <CardTitle>پرچم‌های ریسک</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.risks.length === 0 ? (
              <p className="text-sm text-emerald-200">ریسکی گزارش نشده است.</p>
            ) : (
              <ul className="list-disc space-y-2 pr-5 text-sm text-white/90">
                {analytics.risks.map((item, index) => (
                  <li key={`risk-${index}`}>{item}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
