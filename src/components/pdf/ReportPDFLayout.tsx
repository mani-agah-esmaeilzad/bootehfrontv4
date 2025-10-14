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
const toNum = (val: any): number => Number(val) || 0;
const RTL_CHAR_PATTERN = /[\u0600-\u06FF]/;

const ensureRtlText = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  if (!RTL_CHAR_PATTERN.test(value)) return value;
  if (value.includes("\u200F")) return value;
  return `\u200F${value}\u200F`;
};

const withRtlFields = <T extends Record<string, any>>(item: T): T => {
  const cloned: Record<string, any> = { ...item };
  Object.keys(cloned).forEach((key) => {
    cloned[key] = ensureRtlText(cloned[key]);
  });
  return cloned as T;
};

export const ReportPDFLayout = React.forwardRef<HTMLDivElement, PDFLayoutProps>(
  ({ report }, ref) => {
    const { analysis } = report;

    const chartData =
      analysis.factor_scores?.map((item: any) =>
        withRtlFields({
          subject: item.factor,
          score: toNum(item.score),
          fullMark: toNum(item.maxScore),
        })
      ) || [];

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

    const semanticFields =
      analysis.linguistic_semantic_analysis?.semantic_fields?.map((item: any) =>
        withRtlFields(item)
      ) || [];

    return (
      <div
        ref={ref}
        style={{
          width: "850px",
          padding: "40px",
          backgroundColor: "white",
          color: "black",
          fontFamily: "Vazir, Tahoma, sans-serif",
          direction: "rtl",
          textAlign: "right",
        }}
      >
        <style>
          {`
            svg text, svg tspan {
              font-family: "Vazir", "Tahoma", sans-serif !important;
              unicode-bidi: plaintext;
              direction: rtl;
              font-feature-settings: "rlig" 1, "liga" 1, "calt" 1;
              letter-spacing: normal;
            }
          `}
        </style>
        <div className="flex h-[90vh] flex-col items-center justify-center rounded-lg border-4 border-gray-800">
          <Logo variant="large" />
          <h1 className="mt-10 text-4xl font-extrabold text-gray-900">گزارش نهایی ارزیابی شایستگی</h1>
          <h2 className="mt-6 text-2xl text-blue-700">
            {report.firstName} {report.lastName} ({report.username})
          </h2>
          <p className="mt-4 text-gray-600">{report.questionnaire_title}</p>
          <p className="mt-2 text-gray-500">
            تاریخ تکمیل:{" "}
            {report.completed_at
              ? new Date(report.completed_at).toLocaleDateString("fa-IR")
              : "نامشخص"}
          </p>
        </div>

        <div style={{ pageBreakBefore: "always" }}>
          <h2 className="mb-4 border-b-2 pb-2 text-2xl font-bold">خلاصه مدیریتی</h2>
          <p className="text-sm leading-relaxed text-gray-700">
            این گزارش به منظور تحلیل شایستگی‌های کلیدی {report.firstName} {report.lastName} تدوین شده است.
            داده‌ها شامل نمودارها و تحلیل‌های کیفی و زبانی هستند که تصویری روشن از نقاط قوت و زمینه‌های بهبود فرد ارائه می‌دهند.
          </p>
        </div>

        <div style={{ pageBreakBefore: "always" }}>
          <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
            <div className="col-span-2">
              <h2 className="border-b pb-2 text-xl font-bold">امتیاز کل</h2>
              <div className="rounded-lg bg-blue-50 p-4 text-center">
                <p className="text-6xl font-bold text-blue-800">
                  {toNum(analysis.score)}
                  <span className="text-2xl text-gray-500"> / {report.max_score || 100}</span>
                </p>
              </div>
              <h2 className="mt-6 border-b pb-2 text-xl font-bold">نمودار شایستگی‌ها</h2>
              <div className="h-[300px] w-full">
                {chartData.length > 0 ? (
                  <SpiderChart data={chartData} />
                ) : (
                  <p className="mt-4 text-center text-sm text-gray-500">داده‌ای وجود ندارد.</p>
                )}
              </div>
            </div>
            <div className="col-span-3">
              <h2 className="border-b pb-2 text-xl font-bold">تحلیل کیفی</h2>
              <div className="prose prose-sm mt-4 max-w-none leading-7 text-gray-700">
                <ReactMarkdown>{analysis.report || ""}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        <div style={{ pageBreakBefore: "always" }}>
          <h2 className="mb-6 border-b-2 pb-4 text-2xl font-bold">تحلیل‌های تکمیلی</h2>
          <div className="grid grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>تحلیل احساسات</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer>
                  <PieChart>
                    {sentimentData.length > 0 && (
                      <Pie data={sentimentData} dataKey="value" nameKey="name" outerRadius={80} label>
                        {sentimentData.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    )}
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>کلمات کلیدی پرتکرار</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer>
                  <BarChart data={keywordData} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="keyword" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="mentions" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>روند کلمات</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer>
                  <LineChart data={verbosityData}>
                    <XAxis dataKey="turn" />
                    <YAxis />
                    <Tooltip />
                    <Line dataKey="word_count" stroke="#ffc658" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>کنش‌محوری</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer>
                  <BarChart data={actionData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="action_words" fill="#8884d8" />
                    <Bar dataKey="passive_words" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>رویکرد حل مسئله</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer>
                  <PieChart>
                    {problemSolvingData.length > 0 && (
                      <Pie
                        data={problemSolvingData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={80}
                        label
                      >
                        {problemSolvingData.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    )}
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>سطح اطمینان</CardTitle>
              </CardHeader>
              <CardContent className="flex h-72 items-center justify-center">
                <p className="text-7xl font-bold text-blue-700">
                  {toNum(analysis.confidence_level?.score)}/10
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>سبک ارتباطی</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer>
                  <BarChart data={commStyle}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#A020F0" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>توزیع نمرات</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer>
                  <AreaChart data={chartData}>
                    <XAxis dataKey="subject" />
                    <YAxis />
                    <Tooltip />
                    <Area dataKey="score" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>همبستگی فاکتورها</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer>
                  <ScatterChart>
                    <XAxis dataKey="score" />
                    <YAxis dataKey="fullMark" />
                    <Tooltip />
                    <Scatter data={chartData} fill="#FF8042" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>شاخص‌های زبانی</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer>
                  <RadarChart data={semanticRadar}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis />
                    <Radar
                      name="شاخص"
                      dataKey="value"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>استفاده از ضمایر</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer>
                  <PieChart>
                    {pronouns.length > 0 && (
                      <Pie data={pronouns} dataKey="value" nameKey="name" outerRadius={80} label>
                        {pronouns.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    )}
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>حوزه‌های معنایی پرتکرار</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer>
                  <BarChart data={semanticFields} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="field" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="mentions" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
);

ReportPDFLayout.displayName = "ReportPDFLayout";
