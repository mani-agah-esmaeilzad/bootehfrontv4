// src/pages/admin/AdminReportDetail.tsx

"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiFetch from "@/services/apiService";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, LoaderCircle, AlertTriangle, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "@/lib/chartSetup";
import { Bar, Line, Pie, Doughnut, Scatter } from "react-chartjs-2";
import { createReportChartConfigs } from "@/lib/reportCharts";
import { SpiderChart } from "@/components/ui/SpiderChart";
import { ReportPDFLayout } from "@/components/pdf/ReportPDFLayout";

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

const toNum = (val: any): number => Number(val) || 0;
const emptyMessage = "داده‌ای برای نمایش وجود ندارد.";

const ChartBox = ({ height = 256, children }: { height?: number; children: React.ReactNode }) => (
  <div className="relative w-full" style={{ height }}>
    {children}
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
      if ((document as any).fonts?.ready) {
        await (document as any).fonts.ready;
      }
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#fff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });
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

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <p className="mt-4 font-semibold text-destructive">خطا: {error}</p>
      </div>
    );
  }

  const { analysis } = report;
  const chartData =
    analysis.factor_scores?.map((item: any) => ({
      subject: item.factor,
      score: toNum(item.score),
      fullMark: toNum(item.maxScore),
    })) || [];

  const chartConfigs = useMemo(() => createReportChartConfigs(analysis), [analysis]);

  return (
    <div className="space-y-6">
      {/* Hidden PDF Layout */}
      <div style={{ position: "absolute", top: 0, left: -9999, width: "850px", pointerEvents: "none" }}>
        {report && <ReportPDFLayout report={report} ref={pdfPrintRef} />}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            جزئیات گزارش: {report.firstName} {report.lastName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{report.email}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/admin/reports")} variant="outline">
            بازگشت
            <ArrowRight className="mr-2 h-4 w-4" />
          </Button>
          <Button onClick={handleDownloadPDF} disabled={isDownloading}>
            {isDownloading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            دانلود PDF
          </Button>
        </div>
      </div>

      {/* Info Cards */}
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
            {report.completed_at ? new Date(report.completed_at).toLocaleDateString("fa-IR") : "نامشخص"}
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

      {/* Radar + Report */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>نمودار شایستگی‌ها</CardTitle>
          </CardHeader>
          <CardContent className="h-[360px]">
            {chartData.length > 0 ? (
              <SpiderChart data={chartData} />
            ) : (
              <p className="text-center text-sm text-muted-foreground">{emptyMessage}</p>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>تحلیل کلی</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none leading-7 text-muted-foreground">
              <ReactMarkdown>{analysis.report || "تحلیل متنی وجود ندارد."}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <h2 className="pt-4 text-2xl font-bold">تحلیل‌های تکمیلی</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>۱. تحلیل احساسات</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>۲. کلمات کلیدی پرتکرار</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>۳. روند کلمات</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>۴. کنش‌محوری</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>۵. رویکرد حل مسئله</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>۶. سطح اطمینان</CardTitle>
          </CardHeader>
          <CardContent className="flex h-56 flex-col items-center justify-center gap-2">
            <p className="text-6xl font-bold text-blue-700">
              {toNum(analysis.confidence_level?.score)}
            </p>
            <span className="text-sm text-muted-foreground">از ۱۰</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>۷. سبک ارتباطی</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>۸. توزیع نمرات</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>۹. همبستگی فاکتورها</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>۱۰. استفاده از ضمایر</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>۱۱. حوزه‌های معنایی پرتکرار</CardTitle>
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
  );
};

export default AdminReportDetail;
