// src/pages/admin/AdminReportDetail.tsx

"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiFetch from "@/services/apiService";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, LoaderCircle, AlertTriangle, Download } from "lucide-react";
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
  LineChart,
  Line,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  Treemap,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

import { SpiderChart } from "@/components/ui/SpiderChart";
import { ReportPDFLayout } from "@/components/pdf/ReportPDFLayout";
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

const COLORS = ["#0ea5e9", "#22c55e", "#f97316", "#6366f1", "#facc15", "#ec4899"];
const toNum = (val: any): number => Number(val) || 0;

const tooltipStyle = {
  backgroundColor: "rgba(15,23,42,0.92)",
  borderRadius: "12px",
  border: "none",
  color: "#f8fafc",
  boxShadow: "0 12px 30px -12px rgba(15,23,42,0.65)",
  direction: "rtl" as const,
};

const axisProps = {
  tickLine: false,
  axisLine: { stroke: "#cbd5f5" },
  tick: { fill: "#475569", fontSize: 12 },
};

const verticalAxisProps = {
  ...axisProps,
  tick: { fill: "#475569", fontSize: 11 },
};

const chartGridColor = "rgba(148, 163, 184, 0.25)";

const noData = (message = "داده‌ای وجود ندارد.") => (
  <div className="flex h-full items-center justify-center rounded-lg bg-slate-50 text-center text-sm text-muted-foreground">
    {message}
  </div>
);

const AdminReportDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
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
    const input = pdfPrintRef.current;
    if (!input || !report) return;
    setIsDownloading(true);
    try {
      await ensureFontsLoaded();
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#fff',
        windowWidth: input.scrollWidth,
        windowHeight: input.scrollHeight,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const ratio = canvas.width / pdfWidth;
      const imgHeight = canvas.height / ratio;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
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

  const { analysis } = report;

  const chartData =
    analysis.factor_scores?.map((i: any) => ({
      subject: i.factor,
      score: toNum(i.score),
      fullMark: toNum(i.maxScore),
    })) || [];
  const sentimentData = analysis.sentiment_analysis
    ? Object.entries(analysis.sentiment_analysis).map(([name, value]) => ({
        name,
        value: toNum(value),
      }))
    : [];
  const keywordData =
    analysis.keyword_analysis?.map((i: any) => ({
      ...i,
      mentions: toNum(i.mentions),
    })) || [];
  const verbosityData =
    analysis.verbosity_trend?.map((i: any) => ({
      ...i,
      word_count: toNum(i.word_count),
    })) || [];
  const averageWordCount =
    analysis.average_word_count !== undefined && analysis.average_word_count !== null
      ? toNum(analysis.average_word_count)
      : null;
  const actionData = analysis.action_orientation
    ? [
        {
          name: "مقایسه",
          action_words: toNum(analysis.action_orientation.action_words),
          passive_words: toNum(analysis.action_orientation.passive_words),
        },
      ]
    : [];
  const confidenceScore = toNum(analysis.confidence_level?.score);
  const confidenceAngle = Math.min(Math.max(confidenceScore, 0), 10) * 36;
  const problemSolvingData = analysis.problem_solving_approach
    ? Object.entries(analysis.problem_solving_approach).map(([name, value]) => ({
        name,
        value: toNum(value),
      }))
    : [];
  const commStyle = analysis.communication_style
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
  const semanticFields = withRtlFields(analysis.linguistic_semantic_analysis?.semantic_fields);

  const powerWheelCategories = [
    { key: "teamwork", label: "کار تیمی", color: "#f97316" },
    { key: "communication", label: "ارتباطات", color: "#22c55e" },
    { key: "cognitive", label: "توانایی‌های شناختی", color: "#0ea5e9" },
    { key: "workEthic", label: "اخلاق کاری", color: "#facc15" },
    { key: "problemSolving", label: "حل مسئله", color: "#ec4899" },
    { key: "leadership", label: "رهبری", color: "#6366f1" },
  ];

  const powerWheelDimensions = [
    { dimension: "همکاری تیمی", category: "teamwork", score: 82 },
    { dimension: "مدیریت تعارض", category: "teamwork", score: 76 },
    { dimension: "ساخت روابط", category: "teamwork", score: 88 },
    { dimension: "گوش دادن فعال", category: "communication", score: 91 },
    { dimension: "مهارت ارائه", category: "communication", score: 84 },
    { dimension: "ارائه بازخورد", category: "communication", score: 79 },
    { dimension: "تفکر تحلیلی", category: "cognitive", score: 86 },
    { dimension: "برنامه‌ریزی راهبردی", category: "cognitive", score: 90 },
    { dimension: "چابکی یادگیری", category: "cognitive", score: 83 },
    { dimension: "مدیریت زمان", category: "workEthic", score: 88 },
    { dimension: "قابل اتکا بودن", category: "workEthic", score: 81 },
    { dimension: "پاسخگویی", category: "workEthic", score: 85 },
    { dimension: "خلاقیت", category: "problemSolving", score: 87 },
    { dimension: "تفکر انتقادی", category: "problemSolving", score: 92 },
    { dimension: "تصمیم‌گیری", category: "problemSolving", score: 78 },
    { dimension: "تعیین چشم‌انداز", category: "leadership", score: 93 },
    { dimension: "مدیریت تغییر", category: "leadership", score: 89 },
    { dimension: "مربی‌گری", category: "leadership", score: 81 },
  ];

  const powerWheelData = powerWheelDimensions.map((dimension) => {
    const baseEntry = { dimension: dimension.dimension } as Record<string, number | string>;
    powerWheelCategories.forEach((category) => {
      baseEntry[category.key] = category.key === dimension.category ? dimension.score : 0;
    });
    return baseEntry;
  });

  return (
    <div className="space-y-6">
      <div style={{ position: "absolute", left: -9999, top: 0, pointerEvents: "none" }}>
        {report && <ReportPDFLayout report={report} ref={pdfPrintRef} />}
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          جزئیات گزارش: {report.firstName} {report.lastName}
        </h1>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/admin/reports")} variant="outline">
            بازگشت
            <ArrowRight className="mr-2 h-4 w-4" />
          </Button>
          <Button onClick={handleDownloadPDF} disabled={isDownloading}>
            {isDownloading ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            دانلود PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>کاربر</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold">{report.username}</p>
            <p className="text-xs text-muted-foreground">{report.email}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>پرسشنامه</CardTitle>
          </CardHeader>
          <CardContent>{report.questionnaire_title}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>تاریخ تکمیل</CardTitle>
          </CardHeader>
          <CardContent>
            {report.completed_at
              ? new Date(report.completed_at).toLocaleDateString("fa-IR")
              : "نامشخص"}
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle>امتیاز کل</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {toNum(analysis.score)} / {report.max_score || 100}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>نمودار شایستگی‌ها</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            {chartData.length > 0 ? (
              <SpiderChart data={chartData} />
            ) : (
              <p className="text-center text-sm text-muted-foreground">داده‌ای وجود ندارد.</p>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>تحلیل کلی</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-muted-foreground">
              <ReactMarkdown>{analysis.report || "تحلیل متنی وجود ندارد."}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>چرخ توانمندی پاور ویل (نسخه آزمایشی)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={powerWheelData} outerRadius="75%">
                <PolarGrid strokeDasharray="3 6" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fill: "#475569", fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  stroke="#cbd5f5"
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                />
                {powerWheelCategories.map((category) => (
                  <Radar
                    key={category.key}
                    name={category.label}
                    dataKey={category.key}
                    stroke={category.color}
                    fill={category.color}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                ))}
                <Tooltip
                  formatter={(value: number, _name: string, item: any) => {
                    if (typeof value !== "number" || value === 0 || !item) return null;
                    const categoryLabel = powerWheelCategories.find((cat) => cat.key === item.dataKey)?.label;
                    return [`${value} از ۱۰۰`, categoryLabel];
                  }}
                  labelFormatter={(label: string) => `مهارت: ${label}`}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              این نمودار نمونه‌ای آزمایشی است تا نحوه نمایش ۱۸ مهارت کلیدی را در قالب چرخ توانمندی نشان دهد. هر ناحیه
              رنگی نماینده یک حوزه شایستگی است و امتیازهای نمایش داده شده صرفاً برای تست رابط کاربری می‌باشند.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {powerWheelCategories.map((category) => (
                <div key={category.key} className="flex items-center gap-3 rounded-md border px-3 py-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                    aria-hidden
                  />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{category.label}</p>
                    <p className="text-xs text-muted-foreground">
                      مجموعه‌ای از مهارت‌های مرتبط که در این گروه توانمندی ارزیابی می‌شوند.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <h2 className="pt-4 text-2xl font-bold">تحلیل‌های تکمیلی</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>۱. تحلیل احساسات</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {sentimentData.length === 0 ? (
              noData()
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <defs>
                    <radialGradient id="sentimentGradient" cx="0.5" cy="0.5" r="0.75">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8} />
                    </radialGradient>
                  </defs>
                  <Pie
                    data={sentimentData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    stroke="rgba(15,23,42,0.1)"
                    strokeWidth={2}
                    label={({ name, value }) => `${name} (%${value})`}
                    labelLine={false}
                    fill="url(#sentimentGradient)"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend
                    wrapperStyle={{ paddingTop: 12 }}
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>۲. کلمات کلیدی</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {keywordData.length === 0 ? (
              noData("کلمه کلیدی ثبت نشده است.")
            ) : (
              <ResponsiveContainer>
                <BarChart data={keywordData} layout="vertical" barCategoryGap={18}>
                  <CartesianGrid stroke={chartGridColor} horizontal={false} />
                  <XAxis type="number" {...axisProps} />
                  <YAxis type="category" dataKey="keyword" width={100} {...verticalAxisProps} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value} تکرار`, "ذکر شده"]} />
                  <defs>
                    <linearGradient id="keywordGradient" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#0ea5e9" />
                    </linearGradient>
                  </defs>
                  <Bar dataKey="mentions" radius={[10, 10, 10, 10]} fill="url(#keywordGradient)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>۳. روند پرحرفی</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {verbosityData.length === 0 ? (
              noData("داده‌ای برای روند گفتگو وجود ندارد.")
            ) : (
              <ResponsiveContainer>
                <LineChart data={verbosityData}>
                  <defs>
                    <linearGradient id="verbosityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#facc15" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={chartGridColor} />
                  <XAxis dataKey="turn" {...axisProps} />
                  <YAxis {...axisProps} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number) => [`${value} کلمه`, "حجم پاسخ"]}
                    labelFormatter={(label: string | number) => `نوبت ${label}`}
                  />
                  {averageWordCount !== null && (
                    <ReferenceLine y={averageWordCount} strokeDasharray="4 6" stroke="#6366f1" />
                  )}
                  <Line
                    type="monotone"
                    dataKey="word_count"
                    stroke="url(#verbosityGradient)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#f97316", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>۴. کنش‌محوری</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {actionData.length === 0 ? (
              noData("داده‌ای برای مقایسه واژگان کنشی موجود نیست.")
            ) : (
              <ResponsiveContainer>
                <BarChart data={actionData} barSize={32}>
                  <CartesianGrid stroke={chartGridColor} />
                  <XAxis dataKey="name" {...axisProps} />
                  <YAxis {...axisProps} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number, key: string) => [
                      `${value} واژه`,
                      key === "action_words" ? "واژگان کنشی" : "واژگان غیرکنشی",
                    ]}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: 10 }}
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                  />
                  <Bar dataKey="action_words" radius={[8, 8, 0, 0]} fill="#6366f1" />
                  <Bar dataKey="passive_words" radius={[8, 8, 0, 0]} fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>۵. رویکرد حل مسئله</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {problemSolvingData.length === 0 ? (
              noData("داده‌ای از رویکرد حل مسئله ثبت نشده است.")
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={problemSolvingData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    stroke="rgba(15,23,42,0.12)"
                    strokeWidth={2}
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {problemSolvingData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend
                    wrapperStyle={{ paddingTop: 12 }}
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>۶. سطح اطمینان</CardTitle>
          </CardHeader>
          <CardContent className="flex h-64 flex-col items-center justify-center gap-3">
            {analysis.confidence_level ? (
              <>
                <div
                  className="relative flex h-36 w-36 items-center justify-center rounded-full bg-slate-100 shadow-inner"
                  style={{
                    background: `conic-gradient(#38bdf8 0deg ${confidenceAngle}deg, #e2e8f0 ${confidenceAngle}deg 360deg)`,
                  }}
                >
                  <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
                    <span className="text-4xl font-bold text-slate-800">
                      {confidenceScore}
                    </span>
                    <span className="text-xs text-muted-foreground">از ۱۰</span>
                  </div>
                </div>
                <p className="max-w-[220px] text-center text-xs text-muted-foreground">
                  {analysis.confidence_level?.comment || "شاخص اعتماد به نفس محاسبه شده بر اساس تحلیل گفتار."}
                </p>
              </>
            ) : (
              noData("سطح اطمینان موجود نیست.")
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>۷. سبک ارتباطی</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {commStyle.length === 0 ? (
              noData("تحلیلی برای سبک ارتباطی موجود نیست.")
            ) : (
              <ResponsiveContainer>
                <BarChart data={commStyle} barCategoryGap={20}>
                  <CartesianGrid stroke={chartGridColor} vertical={false} />
                  <XAxis dataKey="name" {...axisProps} />
                  <YAxis {...axisProps} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value}`, "امتیاز"]} />
                  <defs>
                    <linearGradient id="commGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                  <Bar dataKey="value" radius={[10, 10, 4, 4]} fill="url(#commGradient)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>۸. توزیع نمرات</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {chartData.length === 0 ? (
              noData("داده‌ای برای نمرات فاکتور‌ها موجود نیست.")
            ) : (
              <ResponsiveContainer>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="scoreArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={chartGridColor} />
                  <XAxis dataKey="subject" {...axisProps} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis {...axisProps} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value}`, "امتیاز"]} />
                  <Area
                    dataKey="score"
                    type="monotone"
                    stroke="#0ea5e9"
                    strokeWidth={3}
                    fill="url(#scoreArea)"
                    activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>۹. همبستگی فاکتورها</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {chartData.length === 0 ? (
              noData()
            ) : (
              <ResponsiveContainer>
                <ScatterChart>
                  <CartesianGrid stroke={chartGridColor} />
                  <XAxis dataKey="score" name="امتیاز" {...axisProps} />
                  <YAxis dataKey="fullMark" name="حداکثر" {...axisProps} />
                  <Tooltip
                    cursor={{ strokeDasharray: "4 4" }}
                    contentStyle={tooltipStyle}
                    formatter={(value: number, name: string) => [`${value}`, name === "score" ? "امتیاز" : "حداکثر"]}
                  />
                  <Scatter
                    data={chartData}
                    fill="#f97316"
                    shape="circle"
                    legendType="circle"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>۱۰. سهم فاکتورها</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {chartData.length === 0 ? (
              noData()
            ) : (
              <ResponsiveContainer>
                <Treemap data={chartData} dataKey="score" nameKey="subject" stroke="#fff" fill="#6366f1" />
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>۱۱. شاخص‌های زبانی</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {semanticRadar.every((entry) => !entry.value) ? (
              noData("شاخص‌های زبانی محاسبه نشده‌اند.")
            ) : (
              <ResponsiveContainer>
                <RadarChart data={semanticRadar} outerRadius="75%">
                  <PolarGrid stroke={chartGridColor} />
                  <PolarAngleAxis dataKey="name" tick={{ fill: "#475569", fontSize: 11 }} />
                  <PolarRadiusAxis stroke="#cbd5f5" tick={{ fill: "#475569", fontSize: 10 }} />
                  <Radar
                    name="شاخص زبانی"
                    dataKey="value"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.4}
                  />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value}`, "امتیاز"]} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>۱۲. استفاده از ضمایر</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {pronouns.every((entry) => !entry.value) ? (
              noData("تحلیلی از ضمایر یافت نشد.")
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pronouns}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {pronouns.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend
                    wrapperStyle={{ paddingTop: 12 }}
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>۱۳. حوزه‌های معنایی پرتکرار</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {semanticFields.length === 0 ? (
              noData("حوزه معنایی شناسایی نشد.")
            ) : (
              <ResponsiveContainer>
                <BarChart data={semanticFields} layout="vertical" barCategoryGap={20}>
                  <CartesianGrid stroke={chartGridColor} horizontal={false} />
                  <XAxis type="number" {...axisProps} />
                  <YAxis dataKey="field" type="category" width={120} {...verticalAxisProps} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value} بار`, "تکرار"]} />
                  <defs>
                    <linearGradient id="semanticGradient" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#facc15" />
                    </linearGradient>
                  </defs>
                  <Bar dataKey="mentions" radius={[12, 12, 12, 12]} fill="url(#semanticGradient)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminReportDetail;
