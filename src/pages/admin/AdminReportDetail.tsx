// src/pages/admin/AdminReportDetail.tsx

"use client";
import { useEffect, useState, useRef, ReactNode, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiFetch, { downloadReportChartsLog } from "@/services/apiService";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowRight, LoaderCircle, AlertTriangle, Download, HelpCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Line,
  Legend,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  Area,
  Scatter,
  ComposedChart,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

import { SpiderChart } from "@/components/ui/SpiderChart";
import { ComparisonSpiderChart } from "@/components/ui/ComparisonSpiderChart";
import { ReportPDFLayout } from "@/components/pdf/ReportPDFLayout";
import { withRtlFields } from "@/lib/reports";
import { cn } from "@/lib/utils";
import { normalizeBidi } from "@/lib/bidi";

interface PhaseBreakdownEntry {
  phase?: number;
  personaName?: string | null;
  prompt?: string | null;
  analysis?: Record<string, any> | null;
  supplementary_answers?: Record<string, any> | null;
}

interface PhaseFullReportView {
  id: string;
  label: string;
  phaseNumber: number;
  personaName?: string | null;
  report: ReportDetail;
}

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

type SentimentCategory = "positive" | "negative" | "neutral" | "other";

interface SentimentNarrative {
  headline: string;
  bullets: string[];
}

const COLORS = ["#0ea5e9", "#22c55e", "#f97316", "#6366f1", "#facc15", "#ec4899"];

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

const parseObjectLike = (input: unknown): Record<string, unknown> | null => {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }
  if (typeof input === "string") {
    const trimmed = input.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
      } catch {
        return null;
      }
    }
  }
  return null;
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
    cognitive_flexibility_dimensions: "Cognitive Flexibility Dimensions",
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

const classifySentimentLabel = (label: string): SentimentCategory => {
  const normalized = label
    ?.toString()
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, "")
    .trim();
  if (!normalized) return "other";
  if (
    normalized.includes("positive") ||
    normalized.includes("مثبت") ||
    normalized.includes("خوش") ||
    normalized.includes("امید")
  ) {
    return "positive";
  }
  if (
    normalized.includes("negative") ||
    normalized.includes("منفی") ||
    normalized.includes("نگرانی") ||
    normalized.includes("اعتراض") ||
    normalized.includes("stress")
  ) {
    return "negative";
  }
  if (
    normalized.includes("neutral") ||
    normalized.includes("خنثی") ||
    normalized.includes("متعادل") ||
    normalized.includes("بیطرف")
  ) {
    return "neutral";
  }
  return "other";
};

const describeSentimentMood = (category: SentimentCategory) => {
  switch (category) {
    case "positive":
      return "نشان می‌دهد فضای گفتگو عمدتاً امیدوارانه و انگیزشی بوده است";
    case "negative":
      return "حاکی از تمرکز مکالمه روی نگرانی‌ها و نقاط فشار است";
    case "neutral":
      return "بیان می‌کند پاسخ‌دهنده بیشتر توصیفی و بدون بار هیجانی صحبت کرده است";
    default:
      return "حضور گرایش هیجانی مشخصی در پاسخ‌ها را تأیید می‌کند";
  }
};

const formatPercentValue = (value: number) => {
  if (!Number.isFinite(value)) return "0";
  const normalized = Math.round(value * 10) / 10;
  return Number.isInteger(normalized) ? normalized.toFixed(0) : normalized.toFixed(1);
};

const buildSentimentNarrative = (data: { name: string; value: number }[]): SentimentNarrative => {
  const fallback: SentimentNarrative = {
    headline: "برای این گزارش داده‌ای جهت تحلیل کیفی احساسات ثبت نشده است.",
    bullets: [
      "برای فعال‌سازی این بخش باید حداقل یک برچسب مثبت، منفی یا خنثی در خروجی تحلیل خودکار وجود داشته باشد.",
      "پیشنهاد: در سناریوهای بعدی سوالاتی اضافه کنید که پاسخ‌دهنده را به بیان احساسات شفاف‌تر هدایت کند.",
    ],
  };

  if (!Array.isArray(data) || data.length === 0) return fallback;

  const sanitized = data
    .map((item) => ({
      name: item.name,
      value: Math.max(0, toNum(item.value)),
    }))
    .filter((item) => Number.isFinite(item.value) && item.value >= 0 && item.name);

  if (sanitized.length === 0) {
    return {
      headline: "برچسب احساسات دریافت شد اما مقدار معناداری برای تحلیل کیفی در دسترس نبود.",
      bullets: [
        "بهتر است خروجی مدل احساسات بازبینی شود یا مجدداً تحلیل روی داده خام انجام شود تا سهم هر احساس مشخص گردد.",
        "پیشنهاد: برای جلوگیری از این حالت، محدوده مقیاس امتیازدهی احساسات را در سمت سرور بررسی کنید.",
      ],
    };
  }
  const total = sanitized.reduce((sum, item) => sum + item.value, 0);
  if (!total) {
    return {
      headline: "امتیاز احساسات صفر گزارش شده است.",
      bullets: [
        "این حالت معمولاً زمانی رخ می‌دهد که مدل احساسات به داده‌ای با لحن بسیار کوتاه یا خنثی برخورد کرده باشد.",
        "پیشنهاد: نمونه‌های بیشتری از گفتگو جمع‌آوری کنید تا مدل بتواند سهم هر احساس را تفکیک کند.",
      ],
    };
  }

  const enriched = sanitized
    .map((item) => ({
      ...item,
      percentage: (item.value / total) * 100,
      category: classifySentimentLabel(item.name),
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const dominant = enriched[0];
  const positive = enriched.find((item) => item.category === "positive");
  const negative = enriched.find((item) => item.category === "negative");
  const neutral = enriched.find((item) => item.category === "neutral");
  const secondarySentiments = enriched.slice(1);

  const headline = `غلبه احساس «${dominant.name}» با حدود ${formatPercentValue(dominant.percentage)}٪ ${describeSentimentMood(
    dominant.category,
  )}.`;

  const bullets: string[] = [];

  if (positive && negative) {
    const leadingPositive = positive.percentage >= negative.percentage;
    const gap = Math.abs(positive.percentage - negative.percentage);
    bullets.push(
      `احساسات ${leadingPositive ? "مثبت" : "منفی"} با ${formatPercentValue(
        Math.max(positive.percentage, negative.percentage),
      )}٪ سهم، ${formatPercentValue(gap)}٪ از سویه مقابل جلوتر است؛ ${
        leadingPositive
          ? "این انرژی را می‌توان برای تقویت انگیزش فرد حفظ کرد."
          : "بهتر است ریشه دغدغه‌ها را سریع‌تر پیگیری کنید."
      }`,
    );
  } else if (positive || negative) {
    const single = positive || negative;
    bullets.push(
      `تنها احساس برجسته ${single?.category === "positive" ? "مثبت" : "منفی"} بوده و ${formatPercentValue(
        single?.percentage ?? 0,
      )}٪ پاسخ‌ها را شکل داده است.`,
    );
  }

  if (neutral) {
    if (neutral.percentage >= 30) {
      bullets.push(
        `حدود ${formatPercentValue(neutral.percentage)}٪ پاسخ‌ها خنثی هستند و فضای تحلیل را متعادل نگه داشته‌اند.`,
      );
    } else if (neutral.percentage <= 15) {
      bullets.push(
        `لحن خنثی تنها ${formatPercentValue(neutral.percentage)}٪ است؛ بنابراین احساسات آشکار مکالمه را هدایت کرده‌اند.`,
      );
    }
  }

  if (secondarySentiments.length > 0) {
    const detail = secondarySentiments
      .map((item) => `«${item.name}» ${formatPercentValue(item.percentage)}٪`)
      .join("، ");
    if (detail) {
      bullets.push(`سایر گرایش‌ها شامل ${detail} هستند که در برنامه‌ریزی مداخلات تکمیلی قابل توجه‌اند.`);
    }
  }

  const actionHint = (() => {
    switch (dominant.category) {
      case "positive":
        return "پیشنهاد: با بازخورد دقیق، همین رویکرد مثبت را در مراحل بعدی تثبیت کنید.";
      case "negative":
        return "پیشنهاد: برای کاهش احساس منفی، یک گفت‌وگوی پیگیری با تمرکز بر پاسخ به نگرانی‌ها داشته باشید.";
      case "neutral":
        return "پیشنهاد: با پرسش‌های سناریومحور، پاسخ‌دهنده را به بیان احساسات دقیق‌تر دعوت کنید.";
      default:
        return "پیشنهاد: داده‌های بیشتری از تعاملات بعدی برای شفاف‌تر شدن لحن احساسی جمع‌آوری کنید.";
    }
  })();
  bullets.push(actionHint);

  return { headline, bullets };
};

const normalizeSentimentInsight = (value: unknown): SentimentNarrative | null => {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const headline = typeof raw.headline === "string" ? raw.headline.trim() : "";
  const bullets = Array.isArray(raw.bullets)
    ? raw.bullets
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter((item) => item.length > 0)
    : [];
  if (!headline && bullets.length === 0) return null;
  return {
    headline: headline || "تحلیل کیفی احساسات",
    bullets: bullets.length > 0 ? bullets : ["—"],
  };
};

const hydrateAnalysis = (raw: any) => {
  let base: Record<string, any> =
    typeof raw === "string"
      ? parseLooseAnalysisString(raw)
      : raw && typeof raw === "object"
        ? { ...raw }
        : {};

  // ۱) اگر additional_details به صورت رشته‌ی شل اومده، پارسش کن و merge کن
  const additional = base?.additional_details;
  if (typeof additional === "string") {
    const parsed = parseLooseAnalysisString(additional);
    Object.entries(parsed).forEach(([key, value]) => {
      if (base[key] === undefined) {
        base[key] = value;
      }
    });
  }

  // ۲) کلیدهای عجیب را قبل از تبدیل آرایه/آبجکت به کلیدهای استاندارد نگاشت می‌کنیم
  const aliasEntries = Object.entries(base);
  aliasEntries.forEach(([key, value]) => {
    const normalized = normalizeKey(key);

    if (!base.factor_scatter && normalized.includes("factorscatter")) {
      base.factor_scatter = value;
    }

    if (!base.factor_contribution && normalized.includes("factorcontribution")) {
      base.factor_contribution = value;
    }

    if (!base.factor_scores && normalized.includes("factorscores")) {
      base.factor_scores = value;
    }

    if (!base.keyword_analysis && normalized.includes("keywordanalysis")) {
      base.keyword_analysis = value;
    }

    if (!base.verbosity_trend && normalized.includes("verbositytrend")) {
      base.verbosity_trend = value;
    }

    if (!base.action_orientation && normalized.includes("actionorientation")) {
      base.action_orientation = value;
    }

    if (!base.problem_solving_approach && normalized.includes("problemsolving")) {
      base.problem_solving_approach = value;
    }

    if (!base.communication_style && normalized.includes("communicationstyle")) {
      base.communication_style = value;
    }

    if (!base.linguistic_semantic_analysis && normalized.includes("linguisticsemanticanalysis")) {
      base.linguistic_semantic_analysis = value;
    }
  });

  // ❗❗ ۳ خط مهم — اینجا، بعد از نگاشت اولیه
  if (!base.factor_scatter) {
    base.factor_scatter =
      base.factorScores ||
      base.factor_scores ||
      base["factor scatter"] ||
      base["scatter"] ||
      base.scatterData ||
      base.factorCorrelation;
  }

  if (!base.factor_contribution) {
    base.factor_contribution =
      base.factorContribution ||
      base["factor contribution"] ||
      base.factor_share ||
      base["factor share"] ||
      base.share ||
      base.contribution;
  }

  if (!base.factor_scores) {
    base.factor_scores =
      base.factorScore ||
      base["factor scores"] ||
      base.scores ||
      base.factors ||
      base.factorData;
  }

  const coerceArrayField = (fieldName: string) => {
    const current = base[fieldName];
    if (Array.isArray(current)) return;
    const parsed = parseArrayLike(current);
    if (parsed.length > 0) {
      base[fieldName] = parsed;
    }
  };

  const coerceObjectField = (fieldName: string) => {
    const current = base[fieldName];
    if (current && typeof current === "object" && !Array.isArray(current)) return;
    const parsed = parseObjectLike(current);
    if (parsed) {
      base[fieldName] = parsed;
    }
  };

  [
    "keyword_analysis",
    "verbosity_trend",
    "factor_scores",
    "factor_scatter",
    "factor_contribution",
    "phase_breakdown",
    "progress_timeline",
    "cognitive_flexibility_dimensions",
  ].forEach(coerceArrayField);

  [
    "sentiment_analysis",
    "action_orientation",
    "problem_solving_approach",
    "communication_style",
    "linguistic_semantic_analysis",
    "confidence_level",
    "power_wheel",
    "factor_scores",
    "factor_scatter",
    "factor_contribution",
    "cognitive_flexibility_dimensions",
  ].forEach(coerceObjectField);

  // 🔥 تبدیل ساختار شیء → آرایه برای charts
  // 🔥 تبدیل ساختار شیء → آرایه برای charts
  const fixToArray = (fieldName: string) => {
    const val = base[fieldName];
    if (val && !Array.isArray(val) && typeof val === "object") {
      base[fieldName] = Object.entries(val).map(([key, value]) => {
        const score = toNum(value);
        const maxScore = 5;
        return {
          factor: key,
          name: key,
          subject: key,
          score,
          maxScore,
          fullMark: maxScore,  // 🔥 درست شد
          size: score,
          value: score,
        };
      });
    }
  };


  fixToArray("factor_scatter");
  fixToArray("factor_contribution");
  fixToArray("factor_scores");


  return base;
};


const normalizeFactorEntries = (input: unknown): any[] => {
  const candidateArray = parseArrayLike(input);
  if (!Array.isArray(candidateArray)) return [];

  return candidateArray
    .map((entry, index) => {
      if (entry && typeof entry === "object") {
        const record = entry as Record<string, unknown>;

        const name =
          (record.subject as string) ||
          (record.factor as string) ||
          (record.name as string) ||
          (record.label as string) ||
          `فاکتور ${index + 1}`;

        const score = toNum(
          record.score ??
            record.value ??
            record.actual ??
            record.current ??
            record.raw ??
            record.scoreValue
        );

        const fullMark =
          toNum(
            record.maxScore ??
              (record as Record<string, unknown>).max_score ??
              record.fullMark ??
              record.target ??
              record.max ??
              5,
          ) || 5;

        return {
          name,
          subject: name,
          score,
          fullMark,
          size: score,
          value: score,
        };
      }

      const scoreValue = toNum(entry);
      return {
        name: `فاکتور ${index + 1}`,
        subject: `فاکتور ${index + 1}`,
        score: scoreValue,
        fullMark: 5,
        size: scoreValue,
        value: scoreValue,
      };
    })
    .filter((item) => Number.isFinite(item.score));
};

const phaseComparisonColors = ["#6366f1", "#f97316", "#0ea5e9", "#14b8a6"];

const extractPhaseFactorEntries = (phaseAnalysis?: Record<string, unknown> | null) => {
  if (!phaseAnalysis || typeof phaseAnalysis !== "object") return [];
  const candidates = [
    resolveAnalysisField(phaseAnalysis as Record<string, any>, ["factor_scores", "factor score", "factor-score"]),
    resolveAnalysisField(phaseAnalysis as Record<string, any>, ["factor_scatter", "scatter_data", "factor scatter"]),
    resolveAnalysisField(phaseAnalysis as Record<string, any>, [
      "factor_contribution",
      "factor_share",
      "factor contribution",
    ]),
  ];
  for (const candidate of candidates) {
    const normalized = normalizeFactorEntries(candidate);
    if (normalized.length > 0) return normalized;
  }
  return [];
};

const buildPhaseSpiderComparison = (phases: PhaseBreakdownEntry[]) => {
  const series: Array<{ key: string; label: string; color: string }> = [];
  const dataMap = new Map<string, Record<string, number | string | undefined>>();

  phases.forEach((phase, index) => {
    const factorEntries = extractPhaseFactorEntries(phase.analysis);
    if (factorEntries.length === 0) return;
    const phaseNumber = phase.phase ?? index + 1;
    const key = `phase_${phaseNumber}`;
    const label = phase.personaName
      ? `پرسشنامه ${phaseNumber} – ${phase.personaName}`
      : `پرسشنامه ${phaseNumber}`;
    series.push({
      key,
      label,
      color: phaseComparisonColors[index % phaseComparisonColors.length],
    });

    factorEntries.forEach((entry) => {
      const subjectKey = entry.subject || entry.name || `مولفه ${phaseNumber}`;
      const existing = dataMap.get(subjectKey) ?? { subject: subjectKey, fullMark: entry.fullMark };
      const currentFullMark = typeof existing.fullMark === "number" ? existing.fullMark : toNum(existing.fullMark);
      existing.fullMark = Math.max(currentFullMark || 0, entry.fullMark || 0);
      existing[key] = entry.score;
      dataMap.set(subjectKey, existing);
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

  return { data, series };
};

const rtlFontStack = "'Vazirmatn', 'IRANSans', 'Tahoma', sans-serif";

const tooltipStyle = {
  backgroundColor: "rgba(15,23,42,0.92)",
  borderRadius: "12px",
  border: "none",
  color: "#f8fafc",
  boxShadow: "0 12px 30px -12px rgba(15,23,42,0.65)",
  direction: "rtl" as const,
  textAlign: "right" as const,
  fontFamily: rtlFontStack,
};

const axisProps = {
  tickLine: false,
  axisLine: { stroke: "#cbd5f5" },
  tick: { fill: "#475569", fontSize: 12, fontFamily: rtlFontStack },
  tickMargin: 12,
};

const verticalAxisProps = {
  ...axisProps,
  tick: { fill: "#475569", fontSize: 11, fontFamily: rtlFontStack, textAnchor: "end" as const },
  tickFormatter: (value: string | number) =>
    typeof value === "string" ? normalizeBidi(value) : normalizeBidi(value),
};

const chartGridColor = "rgba(148, 163, 184, 0.25)";

const noData = (message = "داده‌ای وجود ندارد.") => (
  <div
    dir="rtl"
    className="flex h-full items-center justify-center rounded-lg bg-slate-50 text-center text-sm text-muted-foreground"
    style={{ fontFamily: rtlFontStack }}
  >
    {message}
  </div>
);

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(normalized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${clamp(Math.round(r), 0, 255).toString(16).padStart(2, "0")}${clamp(Math.round(g), 0, 255)
    .toString(16)
    .padStart(2, "0")}${clamp(Math.round(b), 0, 255).toString(16).padStart(2, "0")}`;

const interpolateColor = (start: string, end: string, ratio: number) => {
  const boundedRatio = clamp(ratio, 0, 1);
  const startRgb = hexToRgb(start);
  const endRgb = hexToRgb(end);
  const r = startRgb.r + (endRgb.r - startRgb.r) * boundedRatio;
  const g = startRgb.g + (endRgb.g - startRgb.g) * boundedRatio;
  const b = startRgb.b + (endRgb.b - startRgb.b) * boundedRatio;
  return rgbToHex(r, g, b);
};

const buildSentimentChartData = (entries: { name: string; value: number }[]) => {
  const sanitized = entries
    .map((entry) => ({
      name: entry.name,
      value: Math.max(0, toNum(entry.value)),
    }))
    .filter((entry) => entry.name && Number.isFinite(entry.value));
  const total = sanitized.reduce((sum, entry) => sum + entry.value, 0);
  if (!total) {
    return [];
  }
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
      const lastIndex = rounded.length - 1;
      rounded[lastIndex].value = Math.round((rounded[lastIndex].value + adjustment) * 10) / 10;
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
    "شدن",
    "خواهد",
    "کرد",
    "کردن",
    "کن",
    "میکند",
    "میکنم",
    "کنم",
    "کردم",
    "کردند",
    "که",
    "تا",
    "پس",
    "اما",
    "بلکه",
    "یا",
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
        record.keyword ??
        record.term ??
        record.word ??
        record.label ??
        record.text ??
        record.name;
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

const getHeatmapColor = (percent: number) => interpolateColor("#c7d2fe", "#4338ca", clamp(percent / 100, 0, 1));

const KeywordWordCloud = ({
  data,
  emptyMessage = "کلمه کلیدی ثبت نشده است.",
}: {
  data: { keyword: string; mentions: number }[];
  emptyMessage?: string;
}) => {
  if (data.length === 0) {
    return noData(emptyMessage);
  }

  const minMentions = Math.min(...data.map((item) => item.mentions));
  const maxMentions = Math.max(...data.map((item) => item.mentions));
  const spread = Math.max(maxMentions - minMentions, 1);
  const palette = ["#0ea5e9", "#22c55e", "#6366f1", "#f97316", "#14b8a6", "#facc15", "#ec4899", "#8b5cf6"];

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
      className="flex h-full w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 overflow-hidden px-4 py-6"
      style={{ fontFamily: rtlFontStack, lineHeight: 1.2 }}
    >
      {data
        .slice()
        .sort((a, b) => b.mentions - a.mentions)
        .map(({ keyword, mentions }, index) => {
          const intensity = (mentions - minMentions) / spread;
          const fontSize = 0.85 + intensity * 1.1;
          const clampedFontSize = Math.min(2.1, Math.max(0.85, fontSize));
          const color = palette[getHash(keyword) % palette.length];
          const rotationSeed = (getHash(`${keyword}-rotation`) % 5) - 2;
          const rotation = Math.abs(rotationSeed) <= 1 ? rotationSeed * 2 : 0;

          return (
            <span
              key={`${keyword}-${index}`}
              className="select-none whitespace-nowrap font-bold tracking-tight text-slate-700 transition-transform"
              style={{
                fontSize: `${clampedFontSize}rem`,
                color,
                opacity: 0.65 + intensity * 0.35,
                transform: `rotate(${rotation}deg)`,
                lineHeight: 1.1,
              }}
            >
              {keyword}
            </span>
          );
        })}
    </div>
  );
};

interface ChartFlipCardProps {
  title: string;
  front: ReactNode;
  back: ReactNode;
  className?: string;
  corner?: "left" | "right";
}

const ChartFlipCard = ({ title, front, back, className, corner = "left" }: ChartFlipCardProps) => {
  const [flipped, setFlipped] = useState(false);
  const cornerPosition = corner === "right" ? "right-2" : "left-2";

  return (
    <Card
      dir="rtl"
      className={cn(
        "relative w-full min-h-[520px] overflow-hidden border border-slate-200 bg-white text-slate-900 shadow-md [perspective:2000px] md:min-h-[600px] lg:min-h-[660px] 2xl:col-span-2",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setFlipped((prev) => !prev)}
        aria-pressed={flipped}
        className={cn(
          "absolute top-2 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-700 transition",
          "hover:bg-slate-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          cornerPosition,
        )}
      >
        <span className="sr-only">{flipped ? `بازگشت به نمودار ${title}` : `نمایش توضیحات نمودار ${title}`}</span>
        <HelpCircle className="h-5 w-5" />
      </button>
      <div
        className={cn(
          "relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d]",
          flipped ? "[transform:rotateY(180deg)]" : "",
        )}
      >
        <div className="absolute inset-0 flex h-full flex-col [backface-visibility:hidden]" style={{ direction: "rtl" }}>
          <CardHeader className="space-y-1 pb-2 pt-6 text-right">
            <CardTitle className="text-right" style={{ fontFamily: rtlFontStack }}>
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1" style={{ direction: "rtl" }}>
            <div
              className="relative h-full min-h-[520px] overflow-visible rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-4 shadow-inner"
              dir="rtl"
              style={{ direction: "rtl", unicodeBidi: "plaintext" as const }}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.28),transparent_65%)]" />
              <div className="relative flex h-full w-full items-center justify-center">{front}</div>
            </div>
          </CardContent>
        </div>
        <div
          className="absolute inset-0 flex h-full flex-col [backface-visibility:hidden] [transform:rotateY(180deg)]"
          style={{ direction: "rtl" }}
        >
          <CardHeader className="space-y-1 pb-2 pt-6 text-right">
            <CardTitle className="text-right" style={{ fontFamily: rtlFontStack }}>
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto" style={{ direction: "rtl" }}>
            <div
              className="relative h-full min-h-[420px] space-y-3 rounded-3xl border border-slate-200 bg-white p-5 text-right text-sm leading-7 text-slate-700 shadow-inner"
              dir="rtl"
              style={{ fontFamily: rtlFontStack, direction: "rtl", unicodeBidi: "plaintext" as const }}
            >
              {back}
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
};

const AdminReportDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingLog, setIsDownloadingLog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pdfPrintRef = useRef<HTMLDivElement>(null);

  const ensureFontsLoaded = async () => {
    if (typeof document === 'undefined') return;
    const fontFaceSet = (document as any).fonts as FontFaceSet | undefined;
    if (!fontFaceSet) return;
    try {
      await fontFaceSet.load("16px 'Vazirmatn'");
      await fontFaceSet.ready;
    } catch (err) {
      console.warn('Font loading for PDF failed', err);
    }
  };

  const stabilizeBeforeCapture = async () => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const fonts = (document as any).fonts as FontFaceSet | undefined;
    if (fonts?.ready) {
      try {
        await fonts.ready;
      } catch (err) {
        console.warn("Waiting for font readiness failed", err);
      }
    }
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    window.dispatchEvent(new Event("resize"));
    await new Promise<void>((resolve) => requestAnimationFrame(resolve));
  };

  useEffect(() => {
    if (!id || isNaN(Number(id))) {
      toast.error("شناسه گزارش معتبر نیست.");
      navigate("/admin/reports");
      return;
    }
    const fetchReportDetail = async () => {
      try {
        const response = await apiFetch(`admin/reports/${id}`);
        if (response.success && response.data) {
          setReport(response.data);
        } else {
          throw new Error(response.message || "جزئیات گزارش یافت نشد.");
        }
      } catch (err: any) {
        setError(err.message);
        toast.error(`خطا: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReportDetail();
  }, [id, navigate]);

  const handleDownloadPDF = async () => {
    const container = pdfPrintRef.current;
    if (!container || !report) return;
    setIsDownloading(true);
    try {
      await ensureFontsLoaded();
      const pageNodes = Array.from(container.querySelectorAll(".pdf-page")) as HTMLElement[];
      const targets = pageNodes.length > 0 ? pageNodes : [container];
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });

      for (let index = 0; index < targets.length; index += 1) {
        const page = targets[index];
        await stabilizeBeforeCapture();
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#fff",
          scrollX: 0,
          scrollY: -window.scrollY,
        });
        const imgData = canvas.toDataURL("image/png");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        if (index > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(`Report-${report.username}-${report.id}.pdf`);
      toast.success("فایل PDF ساخته شد.");
    } catch (e) {
      toast.error("خطا در ساخت فایل PDF.");
      console.error(e);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadChartsLog = async () => {
    if (!report || isDownloadingLog) return;
    setIsDownloadingLog(true);
    try {
      await downloadReportChartsLog(report.id, report.username);
      toast.success("فایل لاگ نمودارها دانلود شد.");
    } catch (e: any) {
      toast.error(e?.message || "خطا در دانلود فایل لاگ نمودارها.");
    } finally {
      setIsDownloadingLog(false);
    }
  };

  const analysis = hydrateAnalysis(report?.analysis ?? {});
  const phaseBreakdown: PhaseBreakdownEntry[] = Array.isArray(analysis?.phase_breakdown)
    ? (analysis.phase_breakdown as PhaseBreakdownEntry[])
    : [];
  const phaseFullReports = useMemo<PhaseFullReportView[]>(() => {
    if (!report) return [];
    return phaseBreakdown
      .map((phase, index) => {
        if (!phase.analysis) return null;
        const phaseNumber = typeof phase.phase === "number" && phase.phase > 0 ? phase.phase : index + 1;
        const personaLabel = phase.personaName?.trim() || null;
        const tabLabel = personaLabel
          ? `پرسشنامه ${phaseNumber} · ${personaLabel}`
          : `پرسشنامه ${phaseNumber}`;
        const clonedReport: ReportDetail = {
          ...report,
          questionnaire_title: `${report.questionnaire_title} | ${tabLabel}`,
          analysis: phase.analysis,
        };
        return {
          id: `phase-full-${phaseNumber}-${index}`,
          label: tabLabel,
          phaseNumber,
          personaName: personaLabel,
          report: clonedReport,
        };
      })
      .filter((item): item is PhaseFullReportView => Boolean(item));
  }, [phaseBreakdown, report]);
  const phaseComparison = useMemo(() => buildPhaseSpiderComparison(phaseBreakdown), [phaseBreakdown]);

  if (isLoading)
    return (
      <div className="flex h-full items-center justify-center p-10">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  if (error || !report)
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <p className="mt-4 font-semibold text-destructive">خطا: {error}</p>
      </div>
    );

  const factorScoreRaw = resolveAnalysisField(analysis, ["factor_scores", "factor score", "factor-score"]);
  const scatterRaw = resolveAnalysisField(analysis, [
    "factor_scatter",
    "scatter_data",
    "factor_correlation",
    "scatter",
    "factor scatter",
  ]);
  const scatterData = normalizeFactorEntries(scatterRaw);

  const treemapRaw = resolveAnalysisField(analysis, [
    "factor_contribution",
    "factor_share",
    "factor_treemap",
    "factor contribution",
  ]);
  const treemapData = normalizeFactorEntries(treemapRaw);

  const baseFactorData = normalizeFactorEntries(factorScoreRaw);
  const chartData =
    baseFactorData.length > 0
      ? baseFactorData
      : scatterData.length > 0
        ? scatterData
        : treemapData.length > 0
          ? treemapData
          : [];

  // ✅ سری نهایی برای Scatter (همبستگی فاکتورها)
  const scatterSeries = (scatterData.length > 0 ? scatterData : chartData).map((item, index) => ({
    ...item,
    name: item.subject || `فاکتور ${index + 1}`,
  }));

  // ✅ سری نهایی برای Treemap (سهم فاکتورها)
  const treemapSeries = (treemapData.length > 0 ? treemapData : chartData).map((item, index) => ({
    name: item.subject || `فاکتور ${index + 1}`,
    size: item.score,
    value: item.score,
  }));
  const factorHeatmapData = (() => {
    if (treemapSeries.length === 0) return [];
    const total = treemapSeries.reduce((sum, entry) => sum + toNum(entry.value ?? entry.size), 0);
    if (!total) return [];
    return treemapSeries.map((entry) => {
      const score = toNum(entry.value ?? entry.size);
      const percent = (score / total) * 100;
      return {
        name: entry.name,
        value: score,
        percent: Math.round(percent * 10) / 10,
      };
    });
  })();

  const sentimentRawData = analysis.sentiment_analysis
    ? Object.entries(analysis.sentiment_analysis).map(([name, value]) => ({
      name,
      value: toNum(value),
    }))
    : [];
  const sentimentChartData = buildSentimentChartData(sentimentRawData);
  const keywordData = prepareWordCloudData(analysis.keyword_analysis);
  const conversationWordCloudData = prepareWordCloudData(
    analysis.word_cloud_full ?? (analysis as Record<string, unknown>).conversation_word_cloud ?? analysis.keyword_analysis,
  );
  const verbosityData =
    analysis.verbosity_trend?.map((i: any) => ({
      ...i,
      word_count: toNum(i.word_count),
    })) || [];
  const averageWordCount =
    analysis.average_word_count !== undefined && analysis.average_word_count !== null
      ? toNum(analysis.average_word_count)
      : null;

  const rawReportedScore =
    analysis.score ??
    (analysis as Record<string, unknown>).total_score ??
    (analysis as Record<string, unknown>).overall_score;
  const numericReportedScore = Number.isFinite(toNum(rawReportedScore)) ? toNum(rawReportedScore) : null;
  const phaseScoreValues = phaseBreakdown
    .map((phase) =>
      phase.analysis && typeof phase.analysis.score !== "undefined" && phase.analysis.score !== null
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
  const maxScore = toNum(report.max_score ?? (analysis as Record<string, unknown>).max_score ?? 100) || 100;
  const normalizedOverallScore =
    overallScoreDisplay !== null && maxScore
      ? clamp((overallScoreDisplay / maxScore) * 100, 0, 100)
      : null;
  const normalizedConfidence =
    analysis.confidence_level && typeof analysis.confidence_level.score !== "undefined"
      ? clamp(toNum(analysis.confidence_level.score) * 10, 0, 100)
      : normalizedOverallScore !== null
        ? clamp(normalizedOverallScore, 0, 100)
        : null;
  const confidenceScore =
    analysis.confidence_level && typeof analysis.confidence_level.score !== "undefined"
      ? clamp(toNum(analysis.confidence_level.score), 0, 10)
      : normalizedOverallScore !== null
        ? clamp(normalizedOverallScore / 10, 0, 10)
        : null;
  const confidenceScoreDisplay = confidenceScore;
  const confidenceAngle = (confidenceScore ?? 0) * 36;

  const radialSummaryData = [
    normalizedOverallScore !== null && normalizedOverallScore > 0
      ? { name: "امتیاز کلی", value: normalizedOverallScore, fill: "#4f46e5" }
      : null,
    normalizedConfidence !== null && normalizedConfidence > 0
      ? { name: "اطمینان تحلیل", value: normalizedConfidence, fill: "#f97316" }
      : null,
  ].filter(Boolean) as { name: string; value: number; fill: string }[];

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
  const renderScatterPoint = (props: any) => {
    const { cx, cy } = props;
    if (typeof cx !== "number" || typeof cy !== "number") return null;
    return (
      <g>
        <circle cx={cx} cy={cy} r={9} fill="url(#scatterGlow)" opacity={0.55} />
        <circle cx={cx} cy={cy} r={5} fill="#6366f1" stroke="#ffffff" strokeWidth={2} />
      </g>
    );
  };

  const normalizeToArray = (value: unknown): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === "string") return item.trim();
          if (typeof item === "number") return item.toString();
          if (item && typeof item === "object") {
            const text = (item as Record<string, unknown>).text ?? (item as Record<string, unknown>).value;
            return typeof text === "string" ? text.trim() : "";
          }
          return "";
        })
        .filter(Boolean);
    }
    if (typeof value === "string") {
      return value.trim() ? [value.trim()] : [];
    }
    if (value && typeof value === "object") {
      return Object.values(value as Record<string, unknown>)
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean);
    }
    return [];
  };

  const summaryText = (() => {
    if (typeof analysis.summary === "string") {
      return analysis.summary.trim();
    }
    if (Array.isArray(analysis.summary)) {
      return analysis.summary
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
        .join(" \u2022 ");
    }
    return null;
  })();

  const strengthsList = normalizeToArray(analysis.strengths);
  const recommendationsList = normalizeToArray(analysis.recommendations);
  const developmentPlanList = normalizeToArray((analysis as Record<string, unknown>).development_plan);
  const riskFlagsList = normalizeToArray((analysis as Record<string, unknown>).risk_flags);

  const factorScoresRaw = Array.isArray(analysis.factor_scores) ? analysis.factor_scores : [];
  const factorScores = factorScoresRaw.map((item: any) => {
    const max = toNum(item?.maxScore ?? item?.max_score ?? 5) || 5;
    return {
      factor: item?.factor ?? item?.name ?? "شاخص",
      score: toNum(item?.score),
      maxScore: max,
    };
  });
  const averageFactorScore =
    factorScores.length > 0
      ? Math.round(
        (factorScores.reduce((sum, item) => sum + (item.score / (item.maxScore || 1)) * 100, 0) / factorScores.length) *
        10,
      ) / 10
      : null;

  const dominantSentiment =
    sentimentRawData.length > 0
      ? sentimentRawData.reduce(
        (best, current) => (current.value > best.value ? current : best),
        sentimentRawData[0],
      )
      : null;
  const sentimentInsightFromAnalysis = normalizeSentimentInsight(
    (analysis as Record<string, unknown>)?.sentiment_insight,
  );
  const sentimentNarrative = sentimentInsightFromAnalysis ?? buildSentimentNarrative(sentimentRawData);

  const formatSupplementaryLabel = (key: string, index: number) => {
    const numericMatch = key.match(/\d+/);
    const order = numericMatch ? Number(numericMatch[0]) : index + 1;
    return `پاسخ سوال تکمیلی ${order}`;
  };

  const renderSupplementaryAnswers = (answers?: Record<string, any> | null) => {
    if (!answers) return null;
    const entries = Object.entries(answers);
    if (entries.length === 0) return null;
    return (
      <div className="space-y-2 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-700">پاسخ سوالات تکمیلی</p>
        <ul className="space-y-2">
          {entries.map(([key, value], idx) => (
            <li key={key}>
              <span className="font-medium text-slate-500">{formatSupplementaryLabel(key, idx)}:&nbsp;</span>
              <span>{String(value ?? "—")}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div dir="rtl" className="space-y-6">
      <div style={{ position: "absolute", left: -9999, top: 0, pointerEvents: "none" }}>
        {report && <ReportPDFLayout report={report} ref={pdfPrintRef} />}
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-right" style={{ fontFamily: rtlFontStack }}>
          جزئیات گزارش: {report.firstName} {report.lastName}
        </h1>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/admin/reports")} variant="outline" className="flex-row-reverse gap-2">
            بازگشت
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button onClick={handleDownloadChartsLog} disabled={isDownloadingLog} variant="outline" className="flex-row-reverse gap-2">
            {isDownloadingLog ? (
              <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="ml-2 h-4 w-4" />
            )}
            دانلود لاگ نمودارها
          </Button>
          <Button onClick={handleDownloadPDF} disabled={isDownloading} className="flex-row-reverse gap-2">
            {isDownloading ? (
              <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="ml-2 h-4 w-4" />
            )}
            دانلود PDF
          </Button>
        </div>
      </div>

      {phaseBreakdown.length > 0 && (
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-indigo-500/10">
          <div className="flex flex-col gap-2 text-right">
            <h2 className="text-xl font-bold text-slate-900">تحلیل تفکیکی پرسشنامه‌ها</h2>
            <p className="text-sm text-slate-500">
              هر پرسشنامه بر اساس پرامپت تحلیل اختصاصی خود ارزیابی شده است. در ادامه می‌توانید خروجی و پاسخ‌های تکمیلی هر مرحله را مشاهده کنید.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {phaseBreakdown.map((phase, index) => {
              const phaseScore =
                phase.analysis && typeof phase.analysis.score !== "undefined"
                  ? toNum(phase.analysis.score)
                  : null;
              const factorScores = Array.isArray(phase.analysis?.factor_scores)
                ? phase.analysis.factor_scores
                : [];
              const strengthsList = Array.isArray(phase.analysis?.strengths)
                ? phase.analysis?.strengths
                : typeof phase.analysis?.strengths === "string"
                  ? [phase.analysis.strengths]
                  : [];
              const recommendationsList = Array.isArray(phase.analysis?.recommendations)
                ? phase.analysis?.recommendations
                : typeof phase.analysis?.recommendations === "string"
                  ? [phase.analysis.recommendations]
                  : [];
              const phaseReport =
                typeof phase.analysis?.report === "string" ? phase.analysis.report : null;
              const phaseWordCloud = prepareWordCloudData(
                phase.analysis?.word_cloud_full ?? phase.analysis?.keyword_analysis,
              );

              return (
                <Card key={`phase-breakdown-${phase.phase ?? index}`} dir="rtl">
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-right">
                        <p className="text-xs text-slate-500">پرسشنامه {phase.phase ?? index + 1}</p>
                        <CardTitle className="text-base">
                          {phase.personaName || `مرحله ${phase.phase ?? index + 1}`}
                        </CardTitle>
                      </div>
                      {phaseScore !== null && (
                        <Badge variant="outline" className="rounded-full border-indigo-200 text-indigo-600">
                          امتیاز: {phaseScore}
                        </Badge>
                      )}
                    </div>
                    {phase.prompt && (
                      <CardDescription className="text-xs text-slate-500">
                        تحلیل براساس پرامپت اختصاصی این مرحله
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-slate-600">
                    {phaseReport && (
                      <div className="prose prose-sm max-w-none rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                        <ReactMarkdown>{phaseReport}</ReactMarkdown>
                      </div>
                    )}
                    {factorScores.length > 0 && (
                      <div className="space-y-2 rounded-2xl border border-slate-200 bg-white/80 p-4">
                        <p className="text-xs font-semibold text-slate-500">مولفه‌های کلیدی</p>
                        <ul className="space-y-1">
                          {factorScores.map((factor: any, idx2: number) => (
                            <li
                              key={`${phase.phase}-factor-${idx2}`}
                              className="flex items-center justify-between"
                            >
                              <span>{factor.factor || factor.label || `مولفه ${idx2 + 1}`}</span>
                              <span className="font-semibold text-slate-900">
                                {toNum(factor.score)} / {toNum(factor.maxScore ?? maxScore)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {strengthsList.length > 0 && (
                      <div className="space-y-2 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
                        <p className="text-xs font-semibold text-emerald-600">نقاط قوت</p>
                        <ul className="list-disc space-y-1 pr-4 text-right text-xs text-emerald-700">
                          {strengthsList.map((item, idx2) => (
                            <li key={`strength-${phase.phase}-${idx2}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {recommendationsList.length > 0 && (
                      <div className="space-y-2 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
                        <p className="text-xs font-semibold text-indigo-600">توصیه‌های ویژه</p>
                        <ul className="list-disc space-y-1 pr-4 text-right text-xs text-indigo-700">
                          {recommendationsList.map((item, idx2) => (
                            <li key={`recommendation-${phase.phase}-${idx2}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {phaseWordCloud.length > 0 && (
                      <div className="space-y-2 rounded-2xl border border-slate-200 bg-white/80 p-4">
                        <p className="text-xs font-semibold text-slate-600">ابر واژگان کامل گفتگو</p>
                        <div className="min-h-[160px] rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-3">
                          <KeywordWordCloud data={phaseWordCloud} />
                        </div>
                      </div>
                    )}
                    {renderSupplementaryAnswers(phase.supplementary_answers)}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}
      {phaseFullReports.length > 0 && (
        <section className="space-y-4 rounded-3xl border border-indigo-100 bg-white/95 p-6 shadow-lg shadow-indigo-500/10" dir="rtl">
          <div className="flex flex-col gap-2 text-right">
            <h2 className="text-xl font-bold text-slate-900">نمودار و گزارش کامل هر مرحله</h2>
            <p className="text-sm text-slate-500">
              هر پرسشنامه چندمرحله‌ای حالا تمام نمودارها و تحلیل‌ها را در یک بخش جداگانه نمایش می‌دهد تا مقایسه‌ی مستقیم آسان‌تر شود.
            </p>
          </div>
          <div className="flex flex-col gap-6">
            {phaseFullReports.map((phase) => (
              <div
                key={`phase-report-${phase.id}`}
                className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-4 shadow-inner"
              >
                <div className="flex flex-col gap-1 text-right">
                  <p className="text-xs font-semibold text-slate-500">پرسشنامه {phase.phaseNumber}</p>
                  <p className="text-base font-bold text-slate-900">{phase.label}</p>
                  {phase.personaName && <p className="text-sm text-slate-600">پرسونا: {phase.personaName}</p>}
                </div>
                <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="flex flex-col items-center justify-center bg-slate-100/80 p-4">
                    <ReportPDFLayout report={phase.report} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card dir="rtl">
          <CardHeader className="text-right">
            <CardTitle className="text-right">کاربر</CardTitle>
          </CardHeader>
          <CardContent className="text-right" style={{ fontFamily: rtlFontStack }}>
            <p className="font-bold">{report.username}</p>
            <p className="text-xs text-muted-foreground">{report.email}</p>
          </CardContent>
        </Card>
        <Card dir="rtl">
          <CardHeader className="text-right">
            <CardTitle className="text-right">پرسشنامه</CardTitle>
          </CardHeader>
          <CardContent className="text-right" style={{ fontFamily: rtlFontStack }}>{report.questionnaire_title}</CardContent>
        </Card>
        <Card dir="rtl">
          <CardHeader className="text-right">
            <CardTitle className="text-right">تاریخ تکمیل</CardTitle>
          </CardHeader>
          <CardContent className="text-right" style={{ fontFamily: rtlFontStack }}>
            {report.completed_at
              ? new Date(report.completed_at).toLocaleDateString("fa-IR")
              : "نامشخص"}
          </CardContent>
        </Card>
        <Card dir="rtl" className="bg-primary text-primary-foreground">
          <CardHeader className="text-right">
            <CardTitle className="text-right">امتیاز کل</CardTitle>
          </CardHeader>
          <CardContent className="text-right" style={{ fontFamily: rtlFontStack }}>
            <div className="text-3xl font-bold">
              {overallScoreDisplay !== null ? overallScoreDisplay : "—"}
              <span className="text-base font-semibold opacity-80"> / {report.max_score || 100}</span>
            </div>
            <p className="mt-2 text-xs opacity-80">
              {report.completed_at ? `تکمیل در ${new Date(report.completed_at).toLocaleDateString("fa-IR")}` : "تاریخ نامشخص"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card dir="rtl" className="border-dashed">
          <CardHeader className="pb-2 text-right">
            <CardTitle className="text-sm text-muted-foreground">شاخص اطمینان</CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className="text-2xl font-bold text-slate-900" style={{ fontFamily: rtlFontStack }}>
              {confidenceScoreDisplay !== null ? confidenceScoreDisplay.toFixed(1) : "—"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">از ۱۰</p>
          </CardContent>
        </Card>
        <Card dir="rtl" className="border-dashed">
          <CardHeader className="pb-2 text-right">
            <CardTitle className="text-sm text-muted-foreground">غالب‌ترین احساس</CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className="text-2xl font-bold text-slate-900" style={{ fontFamily: rtlFontStack }}>
              {dominantSentiment ? dominantSentiment.name : "—"}
            </div>
            {dominantSentiment && (
              <p className="mt-1 text-xs text-muted-foreground">{`${dominantSentiment.value} واحد ثبت شده`}</p>
            )}
          </CardContent>
        </Card>
        <Card dir="rtl" className="border-dashed">
          <CardHeader className="pb-2 text-right">
            <CardTitle className="text-sm text-muted-foreground">میانگین عملکرد ابعاد</CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className="text-2xl font-bold text-slate-900" style={{ fontFamily: rtlFontStack }}>
              {averageFactorScore !== null ? `${averageFactorScore}%` : "—"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">میانگین امتیاز نسبت به سقف هر بعد</p>
          </CardContent>
        </Card>
        <Card dir="rtl" className="border-dashed">
          <CardHeader className="pb-2 text-right">
            <CardTitle className="text-sm text-muted-foreground">میانگین حجم پاسخ‌ها</CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className="text-2xl font-bold text-slate-900" style={{ fontFamily: rtlFontStack }}>
              {averageWordCount !== null ? `${averageWordCount} کلمه` : "—"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">بر اساس تحلیل روند حجم گفتگو</p>
          </CardContent>
        </Card>
      </div>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card dir="rtl" className="min-h-[320px]">
          <CardHeader className="text-right">
            <CardTitle className="text-right">تحلیل احساسات</CardTitle>
            <CardDescription className="text-right text-muted-foreground">
              توزیع درصدی احساسات مثبت، خنثی و منفی در پاسخ‌ها
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[240px]">
            {sentimentChartData.length === 0 ? (
              noData("داده‌ای برای تحلیل احساسات وجود ندارد.")
            ) : (
              <ResponsiveContainer className="chart-ltr" width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={sentimentChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    stroke="rgba(15,23,42,0.1)"
                    strokeWidth={2}
                    label={({ name, value }) =>
                      `${normalizeBidi(name)}: ${normalizeBidi(Number(value).toFixed(1))}٪`
                    }
                    labelLine={false}
                  >
                    {sentimentChartData.map((entry, index) => (
                      <Cell key={`sentiment-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number, name: string, item: any) => [
                      normalizeBidi(`${Number(value).toFixed(1)}٪`),
                      normalizeBidi(name),
                    ]}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: 12, direction: "rtl" as const }}
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-xs text-slate-600" style={{ fontFamily: rtlFontStack }}>
                        {normalizeBidi(value as string)}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card dir="rtl" className="min-h-[320px]">
          <CardHeader className="text-right">
            <CardTitle className="text-right">ابر واژگان کلیدی</CardTitle>
            <CardDescription className="text-right text-muted-foreground">
              پرتکرارترین واژه‌ها و عبارت‌های تحلیل‌شده
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[240px]">
            <div className="flex h-full items-center justify-center">
              {keywordData.length === 0 ? (
                noData("ابر واژگانی ثبت نشده است.")
              ) : (
                <div className="w-full">
                  <KeywordWordCloud data={keywordData} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card dir="rtl" className="min-h-[320px]">
          <CardHeader className="text-right">
            <CardTitle className="text-right">ابر واژگان کامل گفتگو</CardTitle>
            <CardDescription className="text-right text-muted-foreground">
              پاکسازی‌شده از کلمات بی‌اثر برای تمرکز بر واژه‌های مهم
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[240px]">
            <div className="flex h-full items-center justify-center">
              {conversationWordCloudData.length === 0 ? (
                noData("واژه‌ای برای نمایش یافت نشد.")
              ) : (
                <div className="w-full">
                  <KeywordWordCloud data={conversationWordCloudData} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card dir="rtl" className="min-h-[360px]">
          <CardHeader className="text-right">
            <CardTitle className="text-right">نقشه حرارتی سهم فاکتورها</CardTitle>
            <CardDescription className="text-right text-muted-foreground">
              سهم نسبی هر فاکتور از کل امتیاز گزارش
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[260px]">
            {factorHeatmapData.length === 0 ? (
              noData("سهمی برای فاکتورها قابل محاسبه نیست.")
            ) : (
              <ResponsiveContainer className="chart-ltr" width="100%" height={260}>
                <BarChart data={factorHeatmapData} layout="vertical" margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid stroke={chartGridColor} horizontal={false} />
                  <XAxis type="number" hide domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={140} orientation="right" {...verticalAxisProps} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(_value: number, _name: string, item: any) => [
                      normalizeBidi(`${item.payload.percent}٪`),
                      normalizeBidi(item.payload.name),
                    ]}
                  />
                  <Bar dataKey="percent" radius={[12, 12, 12, 12]}>
                    {factorHeatmapData.map((entry, index) => (
                      <Cell key={`heat-${entry.name}-${index}`} fill={getHeatmapColor(entry.percent)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card dir="rtl" className="min-h-[360px]">
          <CardHeader className="text-right">
            <CardTitle className="text-right">پراکندگی پیشرفت با خط روند</CardTitle>
            <CardDescription className="text-right text-muted-foreground">
              مقایسه امتیاز مراحل متوالی همراه با میانگین متحرک
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[260px]">
            {scatterLineData.length === 0 ? (
              noData("داده‌ای برای روند پیشرفت در دسترس نیست.")
            ) : (
              <ResponsiveContainer className="chart-ltr" width="100%" height={260}>
                <ComposedChart data={scatterLineData} margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
                  <defs>
                    <linearGradient id="trendAreaSimple" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
                    </linearGradient>
                    <radialGradient id="scatterGlowSimple" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </radialGradient>
                  </defs>
                  <CartesianGrid stroke={chartGridColor} strokeDasharray="6 6" />
                  <XAxis
                    dataKey="iteration"
                    {...axisProps}
                    tickFormatter={(value: number) => normalizeBidi(`مرحله ${value}`)}
                  />
                  <YAxis {...axisProps} orientation="right" />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number, name: string) => [
                      normalizeBidi(`${value} امتیاز`),
                      normalizeBidi(name === "performance" ? "نتیجه مشاهده‌شده" : "خط روند"),
                    ]}
                    labelFormatter={(value: number) => normalizeBidi(`مرحله ${value}`)}
                  />
                  <Legend
                    wrapperStyle={{ direction: "rtl" as const }}
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-xs text-slate-600" style={{ fontFamily: rtlFontStack }}>
                        {normalizeBidi(value as string)}
                      </span>
                    )}
                  />
                  <ReferenceLine
                    y={scatterAverage}
                    stroke="#c084fc"
                    strokeDasharray="4 4"
                    ifOverflow="extendDomain"
                    label={{
                      value: "میانگین عملکرد",
                      position: "right",
                      fill: "#7c3aed",
                      fontSize: 11,
                      fontFamily: rtlFontStack,
                    }}
                  />
                  <Area type="monotone" dataKey="trend" fill="url(#trendAreaSimple)" stroke="none" name="میانگین متحرک" />
                  <Scatter
                    name="نتیجه مشاهده‌شده"
                    dataKey="performance"
                    shape={renderScatterPoint}
                    fillOpacity={0}
                  >
                    {scatterLineData.map((entry, index) => (
                      <Cell key={`scatter-${index}`} fill="url(#scatterGlowSimple)" />
                    ))}
                  </Scatter>
                  <Line
                    name="خط روند"
                    type="monotone"
                    dataKey="trend"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: "#2563eb", stroke: "#ffffff", strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>

      {radialSummaryData.length > 0 && (
        <Card dir="rtl" className="border-slate-200 bg-slate-50/70">
          <CardHeader className="text-right">
            <CardTitle className="text-right">نمای کلی شاخص‌ها</CardTitle>
            <CardDescription className="text-right text-muted-foreground">
              مقایسه امتیاز کلی گزارش و شاخص اطمینان در قالب نمودار حلقه‌ای.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="flex-1 min-h-[420px]">
              <ResponsiveContainer className="chart-ltr">
                <RadialBarChart data={radialSummaryData} innerRadius="35%" outerRadius="80%" startAngle={180} endAngle={-180}>
                  <PolarAngleAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fill: "#475569", fontSize: 11, fontFamily: rtlFontStack }}
                  />
                  <RadialBar
                    dataKey="value"
                    cornerRadius={12}
                    background={{ fill: "rgba(148,163,184,0.15)" }}
                    clockWise
                    minAngle={10}
                    fill="#6366f1"
                  >
                    {radialSummaryData.map((entry) => (
                      <Cell key={`radial-${entry.name}`} fill={entry.fill} />
                    ))}
                  </RadialBar>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number, name: string) => [
                      normalizeBidi(`${value}٪`),
                      normalizeBidi(name),
                    ]}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full rounded-3xl border border-slate-200 bg-white/70 p-4 text-xs text-slate-600 shadow-inner lg:w-64" style={{ fontFamily: rtlFontStack }}>
              <p className="mb-3 text-sm font-semibold text-slate-700">توضیح شاخص‌ها</p>
              <div className="space-y-2">
                {radialSummaryData.map((entry) => (
                  <div key={`legend-${entry.name}`} className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                      <span>{normalizeBidi(entry.name)}</span>
                    </span>
                    <span className="font-semibold text-slate-900">
                      {normalizeBidi(`${entry.value.toFixed(1)}٪`)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {summaryText && (
        <Card dir="rtl" className="border-slate-200 bg-slate-50/70">
          <CardHeader className="text-right">
            <CardTitle className="text-right">چکیده تحلیلی</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-slate-700" style={{ fontFamily: rtlFontStack }}>
            <p className="whitespace-pre-wrap">{summaryText}</p>
          </CardContent>
        </Card>
      )}

      {(strengthsList.length > 0 || recommendationsList.length > 0 || riskFlagsList.length > 0 || developmentPlanList.length > 0) && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {strengthsList.length > 0 && (
            <Card dir="rtl">
              <CardHeader className="text-right">
                <CardTitle className="text-right">نقاط قوت برجسته</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-2 pr-5 text-sm text-slate-700">
                  {strengthsList.map((item, index) => (
                    <li key={`strength-${index}`}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {recommendationsList.length > 0 && (
            <Card dir="rtl">
              <CardHeader className="text-right">
                <CardTitle className="text-right">پیشنهادهای توسعه</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-2 pr-5 text-sm text-slate-700">
                  {recommendationsList.map((item, index) => (
                    <li key={`recommendation-${index}`}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {riskFlagsList.length > 0 && (
            <Card dir="rtl">
              <CardHeader className="text-right">
                <CardTitle className="text-right">پرچم‌های ریسک</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-2 pr-5 text-sm text-slate-700">
                  {riskFlagsList.map((item, index) => (
                    <li key={`risk-${index}`}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {developmentPlanList.length > 0 && (
            <Card dir="rtl">
              <CardHeader className="text-right">
                <CardTitle className="text-right">برنامه پیشنهادی رشد</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-2 pr-5 text-sm text-slate-700">
                  {developmentPlanList.map((item, index) => (
                    <li key={`development-${index}`}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {sentimentRawData.length > 0 && (
        <Card dir="rtl">
          <CardHeader className="text-right">
            <CardTitle className="text-right">خلاصه تحلیل احساسی</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {sentimentRawData.map((item) => (
              <div
                key={`sentiment-chip-${item.name}`}
                className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1"
              >
                <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                  {item.name}
                </Badge>
                <span className="text-sm text-slate-600">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {sentimentNarrative && (
        <Card dir="rtl" className="border-fuchsia-200 bg-fuchsia-50/70">
          <CardHeader className="text-right">
            <CardTitle className="text-right">توضیح هوشمند احساسات (اختصاصی ادمین)</CardTitle>
            <CardDescription className="text-right text-fuchsia-700">
              این تحلیل به صورت خودکار توسط AI تولید می‌شود، فقط در داشبورد ادمین دیده می‌شود و در خروجی کاربر قرار نمی‌گیرد.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-right text-sm leading-7 text-slate-700" style={{ fontFamily: rtlFontStack }}>
            <p className="font-semibold text-slate-900">{sentimentNarrative.headline}</p>
            {sentimentNarrative.bullets.length > 0 && (
              <ul className="list-disc space-y-1 pr-5 text-slate-600">
                {sentimentNarrative.bullets.map((item, index) => (
                  <li key={`sentiment-narrative-${index}`}>{item}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <ChartFlipCard
        className="min-h-[420px]"
        title="نمودار شایستگی‌ها"
        front={
          <div className="h-[380px]" dir="rtl" style={{ direction: "rtl", unicodeBidi: "plaintext" as const }}>
            {chartData.length > 0 ? (
              phaseComparison.series.length >= 2 ? (
                <ComparisonSpiderChart data={phaseComparison.data} series={phaseComparison.series} />
              ) : (
                <SpiderChart data={chartData} />
              )
            ) : (
              <p className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                داده‌ای وجود ندارد.
              </p>
            )}
          </div>
        }
        back={
          <>
            <p>
              این نمودار راداری وضعیت شایستگی‌های کاربر را نسبت به سقف امتیاز هر بعد نمایش می‌دهد و به شما کمک می‌کند قوت
              و ضعف هر حوزه را در یک نگاه ببینید.
            </p>
            <ul className="list-disc space-y-1 pr-5">
              <li>هر رأس نمودار نماینده یک فاکتور ارزیابی است.</li>
              <li>گسترش سطح در یک بعد یعنی امتیاز آن حوزه به سقف خود نزدیک‌تر است.</li>
              <li>با نگه‌داشتن نشانگر روی هر نقطه می‌توانید مقدار دقیق همان بعد را ببینید.</li>
            </ul>
          </>
        }
      />

    </div>
  );
};
export default AdminReportDetail;
