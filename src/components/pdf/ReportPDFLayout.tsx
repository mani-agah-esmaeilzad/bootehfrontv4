// src/components/pdf/ReportPDFLayout.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SpiderChart } from "@/components/ui/SpiderChart";
import ReactMarkdown from "react-markdown";
import { Logo } from "@/components/ui/logo";
import { Bar, Line, Pie, Doughnut, Scatter } from "react-chartjs-2";
import "@/lib/chartSetup";
import { createReportChartConfigs } from "@/lib/reportCharts";

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

const toNum = (val: any): number => Number(val) || 0;

const emptyMessage = "داده‌ای برای نمایش وجود ندارد.";

const ChartBox = ({ height = 280, children }: { height?: number; children: React.ReactNode }) => (
  <div className="relative w-full" style={{ height }}>
    {children}
  </div>
);

export const ReportPDFLayout = React.forwardRef<HTMLDivElement, PDFLayoutProps>(({ report }, ref) => {
  const { analysis } = report;
  const chartData =
    analysis.factor_scores?.map((item: any) => ({
      subject: item.factor,
      score: toNum(item.score),
      fullMark: toNum(item.maxScore),
    })) || [];

  const radarMaxScore = React.useMemo(
    () => Math.max(...chartData.map((item) => item.fullMark), 5),
    [chartData],
  );

  const chartConfigs = React.useMemo(() => createReportChartConfigs(analysis), [analysis]);

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
      {/* صفحه کاور */}
      <div className="flex h-[90vh] flex-col items-center justify-center rounded-lg border-4 border-gray-800">
        <Logo variant="large" />
        <h1 className="mt-10 text-4xl font-extrabold text-gray-900">گزارش نهایی ارزیابی شایستگی</h1>
        <h2 className="mt-6 text-2xl text-blue-700">
          {report.firstName} {report.lastName} ({report.username})
        </h2>
        <p className="mt-4 text-gray-600">{report.questionnaire_title}</p>
        <p className="mt-2 text-gray-500">
          تاریخ تکمیل:{" "}
          {report.completed_at ? new Date(report.completed_at).toLocaleDateString("fa-IR") : "نامشخص"}
        </p>
      </div>

      {/* خلاصه مدیریتی */}
      <div style={{ pageBreakBefore: "always" }}>
        <h2 className="mb-4 border-b-2 pb-2 text-2xl font-bold">خلاصه مدیریتی</h2>
        <p className="text-sm leading-relaxed text-gray-700">
          این گزارش به منظور تحلیل شایستگی‌های کلیدی {report.firstName} {report.lastName} تدوین شده است.
          داده‌ها شامل نمودارها و تحلیل‌های کیفی و زبانی هستند که تصویری روشن از نقاط قوت و زمینه‌های بهبود فرد
          ارائه می‌دهند.
        </p>
      </div>

      {/* امتیاز کل + رادار شایستگی + تحلیل کیفی */}
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
            {chartData.length > 0 ? (
              <SpiderChart data={chartData} />
            ) : (
              <p className="mt-4 text-center text-sm text-gray-500">{emptyMessage}</p>
            )}
            <p className="mt-4 text-xs text-gray-500">
              حداکثر امتیاز هر شاخص: {radarMaxScore}
            </p>
          </div>
          <div className="col-span-3">
            <h2 className="border-b pb-2 text-xl font-bold">تحلیل کیفی</h2>
            <div className="prose prose-sm mt-4 max-w-none leading-7 text-gray-700">
              <ReactMarkdown>{analysis.report || ""}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>

      {/* تحلیل‌های تکمیلی */}
      <div style={{ pageBreakBefore: "always" }}>
        <h2 className="mb-6 border-b-2 pb-4 text-2xl font-bold">تحلیل‌های تکمیلی</h2>
        <div className="grid grid-cols-2 gap-8">
          {/* ۱. احساسات */}
          <Card>
            <CardHeader>
              <CardTitle>تحلیل احساسات</CardTitle>
            </CardHeader>
            <CardContent>
              {chartConfigs.sentiment ? (
                <ChartBox>
                  <Pie data={chartConfigs.sentiment.data} options={chartConfigs.sentiment.options} />
                </ChartBox>
              ) : (
                <p className="text-center text-sm text-muted-foreground">{emptyMessage}</p>
              )}
            </CardContent>
          </Card>

          {/* ۲. کلمات کلیدی */}
          <Card>
            <CardHeader>
              <CardTitle>کلمات کلیدی پرتکرار</CardTitle>
            </CardHeader>
            <CardContent>
              {chartConfigs.keywords ? (
                <ChartBox>
                  <Bar data={chartConfigs.keywords.data} options={chartConfigs.keywords.options} />
                </ChartBox>
              ) : (
                <p className="text-center text-sm text-muted-foreground">{emptyMessage}</p>
              )}
            </CardContent>
          </Card>

          {/* ۳. روند کلمات */}
          <Card>
            <CardHeader>
              <CardTitle>روند کلمات</CardTitle>
            </CardHeader>
            <CardContent>
              {chartConfigs.distribution ? (
                <ChartBox>
                  <Line data={chartConfigs.distribution.data} options={chartConfigs.distribution.options} />
                </ChartBox>
              ) : (
                <p className="text-center text-sm text-muted-foreground">{emptyMessage}</p>
              )}
            </CardContent>
          </Card>

          {/* ۴. کنش‌محوری */}
          <Card>
            <CardHeader>
              <CardTitle>کنش‌محوری</CardTitle>
            </CardHeader>
            <CardContent>
              {chartConfigs.action ? (
                <ChartBox>
                  <Bar data={chartConfigs.action.data} options={chartConfigs.action.options} />
                </ChartBox>
              ) : (
                <p className="text-center text-sm text-muted-foreground">{emptyMessage}</p>
              )}
            </CardContent>
          </Card>

          {/* ۵. رویکرد حل مسئله */}
          <Card>
            <CardHeader>
              <CardTitle>رویکرد حل مسئله</CardTitle>
            </CardHeader>
            <CardContent>
              {chartConfigs.problemSolving ? (
                <ChartBox>
                  <Pie data={chartConfigs.problemSolving.data} options={chartConfigs.problemSolving.options} />
                </ChartBox>
              ) : (
                <p className="text-center text-sm text-muted-foreground">{emptyMessage}</p>
              )}
            </CardContent>
          </Card>

          {/* ۶. سطح اطمینان */}
          <Card>
            <CardHeader>
              <CardTitle>سطح اطمینان</CardTitle>
            </CardHeader>
            <CardContent className="flex h-72 flex-col items-center justify-center gap-2">
              <p className="text-7xl font-bold text-blue-700">
                {toNum(analysis.confidence_level?.score)}
              </p>
              <span className="text-sm text-gray-500">از ۱۰</span>
            </CardContent>
          </Card>

          {/* ۷. سبک ارتباطی */}
          <Card>
            <CardHeader>
              <CardTitle>سبک ارتباطی</CardTitle>
            </CardHeader>
            <CardContent>
              {chartConfigs.communication ? (
                <ChartBox>
                  <Bar data={chartConfigs.communication.data} options={chartConfigs.communication.options} />
                </ChartBox>
              ) : (
                <p className="text-center text-sm text-muted-foreground">{emptyMessage}</p>
              )}
            </CardContent>
          </Card>

          {/* ۸. توزیع نمرات */}
          <Card>
            <CardHeader>
              <CardTitle>توزیع نمرات</CardTitle>
            </CardHeader>
            <CardContent>
              {chartConfigs.verbosity ? (
                <ChartBox>
                  <Line data={chartConfigs.verbosity.data} options={chartConfigs.verbosity.options} />
                </ChartBox>
              ) : (
                <p className="text-center text-sm text-muted-foreground">{emptyMessage}</p>
              )}
            </CardContent>
          </Card>

          {/* ۹. همبستگی فاکتورها */}
          <Card>
            <CardHeader>
              <CardTitle>همبستگی فاکتورها</CardTitle>
            </CardHeader>
            <CardContent>
              {chartConfigs.scatter ? (
                <ChartBox>
                  <Scatter data={chartConfigs.scatter.data} options={chartConfigs.scatter.options} />
                </ChartBox>
              ) : (
                <p className="text-center text-sm text-muted-foreground">{emptyMessage}</p>
              )}
            </CardContent>
          </Card>

          {/* ۱۰. استفاده از ضمایر */}
          <Card>
            <CardHeader>
              <CardTitle>استفاده از ضمایر</CardTitle>
            </CardHeader>
            <CardContent>
              {chartConfigs.pronouns ? (
                <ChartBox>
                  <Doughnut data={chartConfigs.pronouns.data} options={chartConfigs.pronouns.options} />
                </ChartBox>
              ) : (
                <p className="text-center text-sm text-muted-foreground">{emptyMessage}</p>
              )}
            </CardContent>
          </Card>

          {/* ۱۱. حوزه‌های معنایی */}
          <Card>
            <CardHeader>
              <CardTitle>حوزه‌های معنایی پرتکرار</CardTitle>
            </CardHeader>
            <CardContent>
              {chartConfigs.semanticFields ? (
                <ChartBox>
                  <Bar data={chartConfigs.semanticFields.data} options={chartConfigs.semanticFields.options} />
                </ChartBox>
              ) : (
                <p className="text-center text-sm text-muted-foreground">{emptyMessage}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
});

ReportPDFLayout.displayName = "ReportPDFLayout";
