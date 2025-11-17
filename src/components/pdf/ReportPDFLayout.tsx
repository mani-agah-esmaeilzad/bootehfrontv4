// src/components/pdf/ReportPDFLayout.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SpiderChart } from "@/components/ui/SpiderChart";
import ReactMarkdown from "react-markdown";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Pie,
  PieChart,
  Cell,
  Line,
  LineChart,
  Legend,
  Treemap,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
} from "recharts";
import { Logo } from "@/components/ui/logo";
import { withRtlFields } from "@/lib/reports";

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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A020F0", "#FF69B4"];
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;
const pageStyle: React.CSSProperties = {
  width: `${A4_WIDTH}px`,
  height: `${A4_HEIGHT}px`,
  padding: "48px",
  backgroundColor: "white",
  color: "#111827",
  boxSizing: "border-box",
  direction: "rtl",
  fontFamily: "Vazirmatn, Tahoma, sans-serif",
  display: "flex",
  flexDirection: "column",
  gap: "24px",
};
const ChartBox = ({ height = 240, children }: { height?: number; children: React.ReactNode }) => (
  <div style={{ width: "100%", height: `${height}px` }}>{children}</div>
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
        const fullMark = toNum(record.maxScore ?? record.fullMark ?? record.target ?? record.max ?? 5) || 5;
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
const chartFontFamily = "Vazirmatn, Tahoma, sans-serif";
const baseAxisTick = { fill: "#1f2937", fontFamily: chartFontFamily, fontSize: 12 };
const lightAxisTick = { fill: "#4b5563", fontFamily: chartFontFamily, fontSize: 12 };
const legendStyle: React.CSSProperties = {
  fontFamily: chartFontFamily,
  fontSize: "12px",
  direction: "rtl",
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

    const sentimentData =
      analysis.sentiment_analysis
        ? Object.entries(analysis.sentiment_analysis).map(([name, value]) =>
            withRtlFields({ name, value: toNum(value) })
          )
        : [];

    const keywordData =
      analysis.keyword_analysis?.map((item: any) =>
        withRtlFields({
          ...item,
          mentions: toNum(item.mentions),
        })
      ) || [];

    const verbosityData =
      analysis.verbosity_trend?.map((item: any) =>
        withRtlFields({
          ...item,
          word_count: toNum(item.word_count),
        })
      ) || [];

    const actionData = analysis.action_orientation
      ? [
          withRtlFields({
            name: "مقایسه",
            action_words: toNum(analysis.action_orientation.action_words),
            passive_words: toNum(analysis.action_orientation.passive_words),
          }),
        ]
      : [];

    const problemSolvingData =
      analysis.problem_solving_approach
        ? Object.entries(analysis.problem_solving_approach).map(([name, value]) =>
            withRtlFields({ name, value: toNum(value) })
          )
        : [];

    const commStyle =
      analysis.communication_style
        ? Object.entries(analysis.communication_style).map(([name, value]) =>
            withRtlFields({ name, value: toNum(value) })
          )
        : [];

    const semanticRadar = [
      withRtlFields({
        name: "تنوع واژگانی",
        value: toNum(analysis.linguistic_semantic_analysis?.lexical_diversity),
      }),
      withRtlFields({
        name: "انسجام معنایی",
        value: toNum(analysis.linguistic_semantic_analysis?.semantic_coherence),
      }),
      withRtlFields({
        name: "عینیت",
        value: toNum(analysis.linguistic_semantic_analysis?.concreteness_level),
      }),
      withRtlFields({
        name: "انتزاع",
        value: toNum(analysis.linguistic_semantic_analysis?.abstractness_level),
      }),
    ];

    const pronouns = [
      withRtlFields({
        name: "اول شخص",
        value: toNum(analysis.linguistic_semantic_analysis?.pronoun_usage?.first_person),
      }),
      withRtlFields({
        name: "دوم شخص",
        value: toNum(analysis.linguistic_semantic_analysis?.pronoun_usage?.second_person),
      }),
      withRtlFields({
        name: "سوم شخص",
        value: toNum(analysis.linguistic_semantic_analysis?.pronoun_usage?.third_person),
      }),
    ];
    const semanticFields = withRtlFields(analysis.linguistic_semantic_analysis?.semantic_fields) || [];
    const pronounChartData = pronouns.filter((item) => Number.isFinite(item.value));

    const infoItems = [
      { label: "نام کامل", value: `${report.firstName} ${report.lastName}`.trim() || "—" },
      { label: "نام کاربری", value: report.username },
      { label: "پرسشنامه", value: report.questionnaire_title },
      {
        label: "تاریخ تکمیل",
        value: report.completed_at ? new Date(report.completed_at).toLocaleString("fa-IR") : "نامشخص",
      },
    ];

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
          `}
        </style>

        <section className="pdf-page" style={{ ...pageStyle, justifyContent: "center", alignItems: "center" }}>
          <Logo variant="large" />
          <h1 className="mt-10 text-4xl font-extrabold text-gray-900">گزارش نهایی ارزیابی شایستگی</h1>
          <h2 className="mt-6 text-2xl text-blue-700">
            {report.firstName} {report.lastName} ({report.username})
          </h2>
          <p className="mt-4 text-gray-600">{report.questionnaire_title}</p>
          <p className="mt-2 text-gray-500">
            تاریخ تکمیل: {report.completed_at ? new Date(report.completed_at).toLocaleDateString("fa-IR") : "نامشخص"}
          </p>
        </section>

        <section className="pdf-page" style={pageStyle}>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">خلاصه مدیریتی</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              این گزارش تصویری یکپارچه از عملکرد {report.firstName} {report.lastName} ارائه می‌دهد و با تکیه بر
              سنجه‌های کیفی و کمی، نقاط قوت، ریسک‌ها و اولویت‌های توسعه‌ای او را مشخص می‌کند.
            </p>
          </div>
          <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
            <div className="space-y-4 rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div>
                <p className="text-sm text-gray-500">امتیاز کل</p>
                <p className="text-5xl font-extrabold text-blue-700">
                  {toNum(analysis.score)}
                  <span className="text-lg text-gray-500"> / {report.max_score || 100}</span>
                </p>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                {infoItems.map((item) => (
                  <div key={item.label} className="flex justify-between border-b border-dashed border-gray-200 pb-1">
                    <span className="font-semibold text-gray-500">{item.label}</span>
                    <span className="text-gray-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3 rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">نمودار شایستگی‌ها</h3>
              <ChartBox height={320}>
                {chartData.length > 0 ? (
                  <SpiderChart data={chartData} />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-500">داده‌ای وجود ندارد.</div>
                )}
              </ChartBox>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">تحلیل کیفی</h3>
            <div className="prose prose-sm mt-3 max-w-none leading-7 text-gray-700">
              <ReactMarkdown>{analysis.report || "تحلیل کیفی برای این گزارش ثبت نشده است."}</ReactMarkdown>
            </div>
          </div>
        </section>

        <section className="pdf-page" style={pageStyle}>
          <h2 className="text-2xl font-bold text-gray-900">تحلیل‌های تکمیلی - بخش اول</h2>
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>تحلیل احساسات</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartBox height={230}>
                  <ResponsiveContainer width="100%" height="100%" className="chart-ltr">
                    <PieChart>
                      {sentimentData.length > 0 ? (
                        <Pie data={sentimentData} dataKey="value" nameKey="name" outerRadius={80} label>
                          {sentimentData.map((entry, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      ) : (
                        <></>
                      )}
                      <Tooltip />
                      <Legend wrapperStyle={legendStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartBox>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>کلمات کلیدی پرتکرار</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartBox height={230}>
                  <ResponsiveContainer width="100%" height="100%" className="chart-ltr">
                    <BarChart data={keywordData} layout="vertical">
                      <XAxis type="number" tick={baseAxisTick} />
                      <YAxis dataKey="keyword" type="category" width={100} tick={baseAxisTick} />
                      <Tooltip />
                      <Bar dataKey="mentions" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartBox>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>روند کلمات</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartBox height={230}>
                  <ResponsiveContainer width="100%" height="100%" className="chart-ltr">
                    <LineChart data={verbosityData}>
                      <XAxis dataKey="turn" tick={baseAxisTick} />
                      <YAxis tick={baseAxisTick} />
                      <Tooltip />
                      <Line dataKey="word_count" stroke="#f97316" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartBox>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>کنش‌محوری</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartBox height={230}>
                  <ResponsiveContainer width="100%" height="100%" className="chart-ltr">
                    <BarChart data={actionData}>
                      <XAxis dataKey="name" tick={baseAxisTick} />
                      <YAxis tick={baseAxisTick} />
                      <Tooltip />
                      <Legend wrapperStyle={legendStyle} />
                      <Bar dataKey="action_words" fill="#8884d8" />
                      <Bar dataKey="passive_words" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartBox>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>رویکرد حل مسئله</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartBox height={230}>
                  <ResponsiveContainer width="100%" height="100%" className="chart-ltr">
                    <PieChart>
                      {problemSolvingData.length > 0 ? (
                        <Pie data={problemSolvingData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} label>
                          {problemSolvingData.map((entry, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      ) : (
                        <></>
                      )}
                      <Tooltip />
                      <Legend wrapperStyle={legendStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartBox>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>سطح اطمینان</CardTitle>
              </CardHeader>
              <CardContent className="flex h-[230px] flex-col items-center justify-center gap-2">
                <p className="text-5xl font-extrabold text-blue-600">{toNum(analysis.confidence_level?.score)}</p>
                <p className="text-sm text-gray-500">از ۱۰</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="pdf-page" style={pageStyle}>
          <h2 className="text-2xl font-bold text-gray-900">تحلیل‌های تکمیلی - بخش دوم</h2>
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>سبک ارتباطی</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartBox height={230}>
                  <ResponsiveContainer width="100%" height="100%" className="chart-ltr">
                    <BarChart data={commStyle}>
                      <XAxis dataKey="name" tick={baseAxisTick} />
                      <YAxis tick={baseAxisTick} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#A020F0" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartBox>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>توزیع نمرات</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartBox height={230}>
                  <ResponsiveContainer width="100%" height="100%" className="chart-ltr">
                    <AreaChart data={chartData}>
                      <XAxis dataKey="subject" tick={baseAxisTick} />
                      <YAxis tick={baseAxisTick} />
                      <Tooltip />
                      <Area dataKey="score" stroke="#6366f1" fill="#a5b4fc" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartBox>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>همبستگی فاکتورها</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartBox height={230}>
                  <ResponsiveContainer width="100%" height="100%" className="chart-ltr">
                    <ScatterChart>
                      <XAxis dataKey="score" tick={baseAxisTick} name="امتیاز" />
                      <YAxis dataKey="fullMark" tick={baseAxisTick} name="حداکثر" />
                      <Tooltip />
                      <Scatter data={scatterChartData} fill="#FF8042" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </ChartBox>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>سهم فاکتورها</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartBox height={230}>
                  <ResponsiveContainer width="100%" height="100%" className="chart-ltr">
                    <Treemap data={treemapChartData} dataKey="score" nameKey="subject" stroke="#fff" fill="#60a5fa" />
                  </ResponsiveContainer>
                </ChartBox>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>شاخص‌های زبانی</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartBox height={230}>
                  <ResponsiveContainer width="100%" height="100%" className="chart-ltr">
                    <RadarChart data={semanticRadar}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" tick={lightAxisTick} />
                      <PolarRadiusAxis tick={lightAxisTick} />
                      <Radar name="Semantic" dataKey="value" stroke="#8884d8" fill="#c4b5fd" fillOpacity={0.5} />
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartBox>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>استفاده از ضمایر</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartBox height={230}>
                  <ResponsiveContainer width="100%" height="100%" className="chart-ltr">
                    <PieChart>
                      {pronounChartData.length > 0 ? (
                        <Pie data={pronounChartData} dataKey="value" nameKey="name" outerRadius={80} label>
                          {pronounChartData.map((entry, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      ) : (
                        <></>
                      )}
                      <Tooltip />
                      <Legend wrapperStyle={legendStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartBox>
              </CardContent>
            </Card>

            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>حوزه‌های معنایی پرتکرار</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartBox height={260}>
                  <ResponsiveContainer width="100%" height="100%" className="chart-ltr">
                    <BarChart data={semanticFields} layout="vertical">
                      <XAxis type="number" tick={baseAxisTick} />
                      <YAxis dataKey="field" type="category" width={120} tick={baseAxisTick} />
                      <Tooltip />
                      <Bar dataKey="mentions" fill="#34d399" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartBox>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    );
  }
);

ReportPDFLayout.displayName = "ReportPDFLayout";
