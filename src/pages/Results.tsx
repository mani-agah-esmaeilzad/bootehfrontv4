// فایل کامل: mani-agah-esmaeilzad/hrbooteh-pathfinder/src/pages/Results.tsx
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Share2, Award, LoaderCircle, AlertTriangle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import apiFetch, { getUserFinalReport } from "@/services/apiService";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown'; // ✅ ایمپورت کتابخانه جدید
import { ComparisonSpiderChart } from "@/components/ui/ComparisonSpiderChart";

interface AssessmentResult {
  assessment: {
    id: number;
    questionnaire_id: number;
    score: number;
    max_score: number;
    description: string;
    completed_at: string;
  };
  messages: any[];
}

interface FinalReportOverview {
  overallScore: number;
  averageScore: number;
}

interface FinalReportCategory {
  key: string;
  label: string;
  normalizedScore: number;
}

interface FinalReportRadarEntry {
  subject: string;
  userScore: number;
  targetScore: number;
}

interface FinalReportData {
  overview?: FinalReportOverview;
  categories?: FinalReportCategory[];
  radar?: FinalReportRadarEntry[];
  strengths?: string[];
  recommendations?: string[];
  developmentPlan?: string[];
  risks?: string[];
}

const clampScore = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const toPercentage = (value: unknown): number => {
  if (typeof value === "number") {
    return clampScore(Number.isFinite(value) ? value : 0);
  }
  if (typeof value === "string") {
    const normalized = value.trim().replace(/[^\d.-]/g, "");
    const parsed = Number(normalized);
    return clampScore(Number.isFinite(parsed) ? parsed : 0);
  }
  const parsed = Number(value);
  return clampScore(Number.isFinite(parsed) ? parsed : 0);
};

const finalReportSpiderSeries = [
  { key: "user", label: "امتیاز شما", color: "#6366f1" },
  { key: "target", label: "هدف (۱۰۰)", color: "#94a3b8" },
];

const Results = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finalReport, setFinalReport] = useState<FinalReportData | null>(null);
  const [finalReportError, setFinalReportError] = useState<string | null>(null);
  const [isFinalReportLoading, setIsFinalReportLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiFetch('assessment/results');
        if (response.success && response.data) {
          setResult(response.data);
        } else {
          throw new Error(response.message || 'نتایج ارزیابی یافت نشد.');
        }
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    const fetchFinalReport = async () => {
      setIsFinalReportLoading(true);
      setFinalReportError(null);
      try {
        const response = await getUserFinalReport();
        if (response.success && response.data) {
          setFinalReport(response.data);
        } else {
          setFinalReport(null);
          setFinalReportError(response.message || 'گزارش نهایی در دسترس نیست.');
        }
      } catch (err: any) {
        const message = err?.message || 'گزارش نهایی هنوز آماده نشده است.';
        setFinalReport(null);
        setFinalReportError(message);
        console.error('Final report fetch failed:', err);
      } finally {
        setIsFinalReportLoading(false);
      }
    };
    fetchResults();
    fetchFinalReport();
  }, []);

  const spiderData = useMemo(() => {
    if (finalReport?.radar && finalReport.radar.length > 0) {
      return finalReport.radar
        .map((entry) => ({
          subject: entry.subject,
          user: toPercentage(entry.userScore),
          target: toPercentage(entry.targetScore ?? 100),
        }))
        .filter((entry) => Number.isFinite(entry.user));
    }
    if (finalReport?.categories && finalReport.categories.length > 0) {
      return finalReport.categories
        .map((category) => ({
          subject: category.label,
          user: toPercentage(category.normalizedScore),
          target: 100,
        }))
        .filter((entry) => Number.isFinite(entry.user));
    }
    return [];
  }, [finalReport]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center p-10">
          <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-hrbooteh-primary" />
          <p className="mt-4 text-hrbooteh-text-secondary">در حال آماده‌سازی گزارش نهایی...</p>
        </div>
      );
    }

    if (error || !result) {
      return (
        <div className="text-center p-10 bg-destructive/10 rounded-lg">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
          <p className="mt-4 text-destructive font-semibold">خطا در دریافت گزارش</p>
          <p className="text-hrbooteh-text-secondary mt-2">{error || "نتیجه‌ای برای نمایش یافت نشد."}</p>
          <Button onClick={() => navigate('/dashboard')} variant="destructive" className="mt-4">
            بازگشت به داشبورد
          </Button>
        </div>
      );
    }

    const overallScore = result.assessment.score;
    const maxScore = result.assessment.max_score;

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-hrbooteh-gradient-primary rounded-full flex items-center justify-center">
              <Award className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-hrbooteh-text-primary mb-4">
            گزارش نهایی ارزیابی hrbooteh
          </h1>
          <p className="text-lg text-hrbooteh-text-secondary max-w-2xl mx-auto">
            تبریک! شما مسیر ارزیابی را با موفقیت تکمیل کرده‌اید. در ادامه تحلیل نهایی شما را مشاهده می‌کنید.
          </p>
        </div>

        <Card className="shadow-hrbooteh-lg border-0 bg-hrbooteh-surface">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl text-hrbooteh-text-primary">نمره ارزیابی</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="relative mb-6">
              <div className="w-32 h-32 mx-auto bg-hrbooteh-gradient-primary rounded-full flex items-center justify-center">
                <span className="text-4xl font-bold text-white">{overallScore}</span>
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="bg-hrbooteh-surface px-3 py-1 rounded-full border border-hrbooteh-surface-elevated">
                  <span className="text-sm font-medium text-hrbooteh-text-secondary">از {maxScore}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-hrbooteh-lg border-0 bg-hrbooteh-surface">
          <CardHeader>
            <CardTitle className="text-xl text-hrbooteh-text-primary">نمودار عنکبوتی دسته‌بندی‌ها</CardTitle>
            <CardDescription>مقایسه میانگین امتیاز شایستگی‌ها در مسیر شما</CardDescription>
          </CardHeader>
          <CardContent className="h-96">
            {isFinalReportLoading ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-hrbooteh-text-secondary">
                <LoaderCircle className="h-10 w-10 animate-spin text-hrbooteh-primary" />
                <p className="text-sm">در حال بارگذاری نمودار...</p>
              </div>
            ) : spiderData.length > 0 ? (
              <ComparisonSpiderChart data={spiderData} series={finalReportSpiderSeries} />
            ) : (
              <div className="flex h-full items-center justify-center text-center text-sm text-hrbooteh-text-secondary">
                {finalReportError || "برای نمایش نمودار لازم است تمام مراحل مسیر تکمیل شوند."}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-hrbooteh-lg border-0 bg-hrbooteh-surface">
          <CardHeader>
            <CardTitle className="text-xl text-hrbooteh-text-primary">تحلیل نهایی</CardTitle>
            <CardDescription>تحلیل تولید شده توسط هوش مصنوعی بر اساس مکالمات شما</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible defaultValue="item-1">
              <AccordionItem value="item-1" className="border rounded-lg p-4 bg-hrbooteh-surface-elevated">
                <AccordionTrigger className="hover:no-underline font-semibold text-hrbooteh-text-primary">
                  مشاهده تحلیل کامل
                </AccordionTrigger>
                <AccordionContent className="pt-4 border-t border-hrbooteh-surface mt-4">
                  {/* ✅ اصلاح کلیدی: استفاده از ReactMarkdown برای نمایش متن */}
                  <div className="prose prose-sm max-w-none text-hrbooteh-text-secondary leading-relaxed">
                    <ReactMarkdown>{result.assessment.description}</ReactMarkdown>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <p className="text-hrbooteh-text-secondary">
            برای ادامه مسیر توسعه حرفه‌ای خود می‌توانید مجدداً ارزیابی‌ها را انجام دهید.
          </p>
          <Button variant="hrbooteh" size="lg" onClick={() => navigate('/dashboard')}>
            بازگشت به داشبورد
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-hrbooteh-gradient-subtle">
      <header className="bg-hrbooteh-surface shadow-hrbooteh-sm border-b border-hrbooteh-surface-elevated">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="hrbooteh-ghost" size="icon-sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Logo variant="large" />
            <div className="flex gap-3">
              <Button variant="hrbooteh-outline" size="sm"><Share2 className="w-4 h-4 ml-2" /> اشتراک‌گذاری</Button>
              <Button variant="hrbooteh" size="sm"><Download className="w-4 h-4 ml-2" /> دانلود گزارش</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default Results;
