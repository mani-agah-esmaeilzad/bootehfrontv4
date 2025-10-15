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
const toNum = (val: any): number => Number(val) || 0;
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
    const semanticFields = withRtlFields(analysis.linguistic_semantic_analysis?.semantic_fields);

    return (
      <div
        ref={ref}
        style={{
          width: "850px",
          padding: "40px",
          backgroundColor: "white",
          color: "black",
          fontFamily: "Vazirmatn, Tahoma, sans-serif",
          direction: "rtl",
          textAlign: "right",
        }}
        className="pdf-font"
      >
        <style>
          {`
            .pdf-font *,
            .pdf-font text,
            .pdf-font tspan {
              font-family: 'Vazirmatn', Tahoma, sans-serif !important;
            }
          `}
        </style>
        {/* صفحه کاور */}
        <div className="flex flex-col items-center justify-center h-[90vh] border-4 border-gray-800 rounded-lg">
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
            {/* ۱. احساسات */}
            <Card><CardHeader><CardTitle>تحلیل احساسات</CardTitle></CardHeader><CardContent className="h-72">
              <ResponsiveContainer><PieChart>{sentimentData.length > 0 && (
                <Pie data={sentimentData} dataKey="value" nameKey="name" outerRadius={80} label>
                  {sentimentData.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie>)}<Tooltip/><Legend wrapperStyle={legendStyle}/></PieChart></ResponsiveContainer>
            </CardContent></Card>

            {/* ۲. کلمات کلیدی */}
            <Card><CardHeader><CardTitle>کلمات کلیدی پرتکرار</CardTitle></CardHeader><CardContent className="h-72">
              <ResponsiveContainer><BarChart data={keywordData} layout="vertical">
                <XAxis type="number" tick={baseAxisTick}/><YAxis dataKey="keyword" type="category" width={100} tick={baseAxisTick}/><Tooltip/>
                <Bar dataKey="mentions" fill="#82ca9d"/></BarChart></ResponsiveContainer>
            </CardContent></Card>

            {/* ۳. روند پرحرفی */}
            <Card><CardHeader><CardTitle>روند کلمات</CardTitle></CardHeader><CardContent className="h-72">
              <ResponsiveContainer><LineChart data={verbosityData}>
                <XAxis dataKey="turn" tick={baseAxisTick}/><YAxis tick={baseAxisTick}/><Tooltip/><Line dataKey="word_count" stroke="#ffc658"/></LineChart></ResponsiveContainer>
            </CardContent></Card>

            {/* ۴. کنش‌محوری */}
            <Card><CardHeader><CardTitle>کنش‌محوری</CardTitle></CardHeader><CardContent className="h-72">
              <ResponsiveContainer><BarChart data={actionData}>
                <XAxis dataKey="name" tick={baseAxisTick}/><YAxis tick={baseAxisTick}/><Tooltip/><Legend wrapperStyle={legendStyle}/>
                <Bar dataKey="action_words" fill="#8884d8"/><Bar dataKey="passive_words" fill="#82ca9d"/>
              </BarChart></ResponsiveContainer>
            </CardContent></Card>

            {/* ۵. حل مسئله */}
            <Card><CardHeader><CardTitle>رویکرد حل مسئله</CardTitle></CardHeader><CardContent className="h-72">
              <ResponsiveContainer><PieChart>{problemSolvingData.length>0&&(
                <Pie data={problemSolvingData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} label>
                  {problemSolvingData.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie>)}<Tooltip/><Legend wrapperStyle={legendStyle}/></PieChart></ResponsiveContainer>
            </CardContent></Card>

            {/* ۶. سطح اطمینان */}
            <Card><CardHeader><CardTitle>سطح اطمینان</CardTitle></CardHeader><CardContent className="text-center">
              <p className="text-7xl font-bold text-blue-700">{toNum(analysis.confidence_level?.score)}</p><p>از ۱۰</p>
            </CardContent></Card>

            {/* ۷. سبک ارتباطی */}
            <Card><CardHeader><CardTitle>سبک ارتباطی</CardTitle></CardHeader><CardContent className="h-72">
              <ResponsiveContainer><BarChart data={commStyle}><XAxis dataKey="name" tick={baseAxisTick}/><YAxis tick={baseAxisTick}/><Tooltip/>
              <Bar dataKey="value" fill="#A020F0"/></BarChart></ResponsiveContainer>
            </CardContent></Card>

            {/* ۸. توزیع نمرات */}
            <Card><CardHeader><CardTitle>توزیع نمرات</CardTitle></CardHeader><CardContent className="h-72">
              <ResponsiveContainer><AreaChart data={chartData}><XAxis dataKey="subject" tick={baseAxisTick}/><YAxis tick={baseAxisTick}/><Tooltip/>
              <Area dataKey="score" stroke="#8884d8" fill="#8884d8"/></AreaChart></ResponsiveContainer>
            </CardContent></Card>

            {/* ۹. Scatter */}
            <Card><CardHeader><CardTitle>همبستگی فاکتورها</CardTitle></CardHeader><CardContent className="h-72">
              <ResponsiveContainer><ScatterChart><XAxis dataKey="score" tick={baseAxisTick}/><YAxis dataKey="fullMark" tick={baseAxisTick}/><Tooltip/>
              <Scatter data={chartData} fill="#FF8042"/></ScatterChart></ResponsiveContainer>
            </CardContent></Card>

            {/* ۱۰. Treemap */}
            <Card><CardHeader><CardTitle>سهم فاکتورها</CardTitle></CardHeader><CardContent className="h-72">
              <ResponsiveContainer><Treemap data={chartData} dataKey="score" nameKey="subject" stroke="#fff" fill="#8884d8"/></ResponsiveContainer>
            </CardContent></Card>

            {/* ۱۱. شاخص‌های زبانی */}
            <Card><CardHeader><CardTitle>شاخص‌های زبانی</CardTitle></CardHeader><CardContent className="h-72">
              <ResponsiveContainer><RadarChart data={semanticRadar}><PolarGrid/><PolarAngleAxis dataKey="name" tick={lightAxisTick}/><PolarRadiusAxis tick={lightAxisTick}/>
              <Radar name="Semantic" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6}/></RadarChart></ResponsiveContainer>
            </CardContent></Card>

            {/* ۱۲. استفاده از ضمایر */}
            <Card><CardHeader><CardTitle>استفاده از ضمایر</CardTitle></CardHeader><CardContent className="h-72">
              <ResponsiveContainer><PieChart><Pie data={pronouns} dataKey="value" nameKey="name" outerRadius={80} label>
                {pronouns.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Pie><Tooltip/><Legend wrapperStyle={legendStyle}/></PieChart></ResponsiveContainer>
            </CardContent></Card>

            {/* ۱۳. حوزه‌های معنایی */}
            <Card><CardHeader><CardTitle>حوزه‌های معنایی پرتکرار</CardTitle></CardHeader><CardContent className="h-72">
              <ResponsiveContainer><BarChart data={semanticFields} layout="vertical">
                <XAxis type="number" tick={baseAxisTick}/><YAxis dataKey="field" type="category" width={100} tick={baseAxisTick}/><Tooltip/>
                <Bar dataKey="mentions" fill="#82ca9d"/></BarChart></ResponsiveContainer>
            </CardContent></Card>
          </div>
        </div>
      </div>
    );
  }
);

ReportPDFLayout.displayName = "ReportPDFLayout";
