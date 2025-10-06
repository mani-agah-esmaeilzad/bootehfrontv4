// فایل کامل: mani-agah-esmaeilzad/hrbooteh-pathfinder/src/pages/Results.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Share2, Award, LoaderCircle, AlertTriangle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import apiFetch from "@/services/apiService";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown'; // ✅ ایمپورت کتابخانه جدید

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

const Results = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    fetchResults();
  }, []);

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