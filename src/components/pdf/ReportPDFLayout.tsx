// src/components/pdf/ReportPDFLayout.tsx
import React from "react";
import React from "react";
import ReactMarkdown from "react-markdown";
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
const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div
    style={{
      border: "1px solid #e5e7eb",
      borderRadius: "20px",
      padding: "20px",
      boxShadow: "0 8px 20px rgba(15,23,42,0.08)",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      background: "white",
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
    const verbosityRows = verbosityData.slice(0, 8).map((entry: any, index: number) => ({
      turn: entry.turn ?? index + 1,
      words: entry.word_count ?? entry.performance ?? 0,
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

    const twoColumnGrid: React.CSSProperties = {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "16px",
    };

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
          <div style={twoColumnGrid}>
            <SectionCard title="مشخصات کلی">
              <SimpleList items={infoItems} />
            </SectionCard>
            <SectionCard title="امتیاز کل">
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <p style={{ fontSize: "48px", fontWeight: 800, color: "#2563eb" }}>{toNum(analysis.score)}</p>
                <p style={{ fontSize: "14px", color: "#6b7280" }}>از {report.max_score || 100}</p>
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

          <SectionCard title="تحلیل کیفی">
            <div style={{ fontSize: "13px", lineHeight: 1.8, color: "#374151" }}>
              <ReactMarkdown>{analysis.report || "تحلیل کیفی برای این گزارش ثبت نشده است."}</ReactMarkdown>
            </div>
          </SectionCard>
        </section>

        <section className="pdf-page" style={pageStyle}>
          <h2 className="text-2xl font-bold text-gray-900">تحلیل‌های تکمیلی - بخش اول</h2>
          <div style={twoColumnGrid}>
            <SectionCard title="تحلیل احساسات">
              {sentimentList.length ? (
                <SimpleList items={sentimentList} />
              ) : (
                <p style={{ fontSize: "12px", color: "#6b7280" }}>داده‌ای موجود نیست.</p>
              )}
            </SectionCard>
            <SectionCard title="کلمات کلیدی پرتکرار">
              {keywordList.length ? (
                <PlainTable
                  columns={[
                    { key: "label", label: "کلمه" },
                    { key: "value", label: "دفعات" },
                  ]}
                  rows={keywordList.map((item) => ({ label: item.label, value: item.value }))}
                />
              ) : (
                <p style={{ fontSize: "12px", color: "#6b7280" }}>داده‌ای موجود نیست.</p>
              )}
            </SectionCard>

            <SectionCard title="روند کلمات">
              {verbosityRows.length ? (
                <PlainTable
                  columns={[
                    { key: "turn", label: "نوبت" },
                    { key: "words", label: "تعداد واژه" },
                  ]}
                  rows={verbosityRows}
                />
              ) : (
                <p style={{ fontSize: "12px", color: "#6b7280" }}>داده‌ای موجود نیست.</p>
              )}
            </SectionCard>

            <SectionCard title="کنش‌محوری">
              {actionRows.length ? (
                <SimpleList items={actionRows} />
              ) : (
                <p style={{ fontSize: "12px", color: "#6b7280" }}>اطلاعاتی درباره واژگان کنشی ثبت نشده است.</p>
              )}
            </SectionCard>

            <SectionCard title="رویکرد حل مسئله">
              {problemRows.length ? (
                <SimpleList items={problemRows} />
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
          <div style={twoColumnGrid}>
            <SectionCard title="سبک ارتباطی">
              {commRows.length ? (
                <SimpleList items={commRows} />
              ) : (
                <p style={{ fontSize: "12px", color: "#6b7280" }}>اطلاعاتی ثبت نشده است.</p>
              )}
            </SectionCard>

            <SectionCard title="توزیع نمرات">
              {factorProgress.length ? (
                <SimpleList
                  items={factorProgress.map((item) => ({
                    label: item.label,
                    value: `${Math.round(item.value)}%`,
                  }))}
                />
              ) : (
                <p style={{ fontSize: "12px", color: "#6b7280" }}>اطلاعاتی ثبت نشده است.</p>
              )}
            </SectionCard>

            <SectionCard title="شاخص‌های زبانی">
              {radarRows.length ? (
                <SimpleList items={radarRows.map((item) => ({ label: item.label, value: item.value }))} />
              ) : (
                <p style={{ fontSize: "12px", color: "#6b7280" }}>اطلاعاتی ثبت نشده است.</p>
              )}
            </SectionCard>

            <SectionCard title="استفاده از ضمایر">
              {pronounRows.length ? (
                <SimpleList items={pronounRows.map((item) => ({ label: item.label, value: item.value }))} />
              ) : (
                <p style={{ fontSize: "12px", color: "#6b7280" }}>اطلاعاتی موجود نیست.</p>
              )}
            </SectionCard>

            <SectionCard title="حوزه‌های معنایی پرتکرار">
              {semanticRows.length ? (
                <PlainTable
                  columns={[
                    { key: "label", label: "حوزه" },
                    { key: "value", label: "تکرار" },
                  ]}
                  rows={semanticRows}
                />
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
