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
} from "recharts";

import { SpiderChart } from '@/components/ui/SpiderChart';
import { ReportPDFLayout } from '@/components/pdf/ReportPDFLayout';
import { withRtlFields } from '@/lib/reports';

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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A020F0", "#FF69B4"];
const toNum = (val: any): number => Number(val) || 0;

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
  const actionData = analysis.action_orientation
    ? [
        {
          name: "مقایسه",
          action_words: toNum(analysis.action_orientation.action_words),
          passive_words: toNum(analysis.action_orientation.passive_words),
        },
      ]
    : [];
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

      <h2 className="pt-4 text-2xl font-bold">تحلیل‌های تکمیلی</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>۱. تحلیل احساسات</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
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
            <CardTitle>۲. کلمات کلیدی</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <BarChart data={keywordData} layout="vertical">
                <XAxis type="number" />
                <YAxis type="category" dataKey="keyword" width={80} />
                <Tooltip />
                <Bar dataKey="mentions" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>۳. روند پرحرفی</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
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
            <CardTitle>۴. کنش‌محوری</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
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
            <CardTitle>۵. رویکرد حل مسئله</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
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
            <CardTitle>۶. سطح اطمینان</CardTitle>
          </CardHeader>
          <CardContent className="flex h-64 items-center justify-center">
            <p className="text-6xl font-bold text-blue-700">
              {toNum(analysis.confidence_level?.score)}/10
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>۷. سبک ارتباطی</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
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
            <CardTitle>۸. توزیع نمرات (Histogram)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
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
            <CardTitle>۹. همبستگی فاکتورها (Scatter)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
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
            <CardTitle>۱۰. سهم فاکتورها (Treemap)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <Treemap data={chartData} dataKey="score" nameKey="subject" stroke="#fff" fill="#8884d8" />
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>۱۱. شاخص‌های زبانی</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <RadarChart data={semanticRadar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis />
                <Radar name="Semantic" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>۱۲. استفاده از ضمایر</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
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
            <CardTitle>۱۳. حوزه‌های معنایی پرتکرار</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <BarChart data={semanticFields} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="field" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="mentions" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminReportDetail;
