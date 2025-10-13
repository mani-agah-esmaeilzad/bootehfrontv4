// src/pages/PersonalityAssessments.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowUpRight, LoaderCircle, Sparkles } from "lucide-react";
import { getPersonalityTests } from "@/services/apiService";
import { toast } from "sonner";

type PersonalityTest = {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  report_name: string;
  highlights: string[];
};

const PersonalityAssessments = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<PersonalityTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      setIsLoading(true);
      try {
        const response = await getPersonalityTests();
        if (response.success) {
          setTests(response.data);
        } else {
          throw new Error(response.message || "خطا در دریافت آزمون‌ها");
        }
      } catch (error: any) {
        toast.error(error.message || "خطا در دریافت آزمون‌ها");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTests();
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-purple-100/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-5 md:px-6">
          <div className="space-y-1 text-right">
            <p className="text-xs font-semibold text-purple-600">پنل آزمون‌های شخصیتی بوته</p>
            <h1 className="text-2xl font-bold md:text-3xl">سفر پنج‌گانه شناخت شخصیت حرفه‌ای</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="transition hover:border-purple-300 hover:text-purple-700" onClick={() => navigate("/personality/results")}>
              گزارش‌های من
            </Button>
            <Button variant="ghost" className="flex items-center gap-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              بازگشت
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl space-y-12 px-4 py-12 md:px-6 md:py-16">
        <section className="rounded-[32px] border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-white p-10 shadow-sm">
          <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div className="space-y-5 text-right">
              <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">چرا آزمون‌های شخصیتی بوته متفاوت‌اند؟</h2>
              <p className="text-sm leading-8 text-slate-700 md:text-base">
                هر آزمون با سناریوهای تعاملی، هوش مصنوعی و تحلیل داده پشتیبانی می‌شود تا تصویری واقعی از رفتار حرفه‌ای بسازد.
                خروجی فقط یک گزارش نیست؛ مسیر پیشنهادی برای اقدام است.
              </p>
              <div className="flex flex-wrap justify-end gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 px-4 py-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  سناریوهای بومی
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 px-4 py-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  تحلیل داده‌محور
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 px-4 py-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  گزارش‌های قابل اقدام
                </span>
              </div>
            </div>
            <div className="rounded-[28px] border border-purple-100 bg-white/80 p-6 shadow-inner">
              <p className="text-sm leading-7 text-slate-700">
                هر آزمون برای یک سوال کلیدی طراحی شده است: «چگونه می‌توانیم در محیطی واقعی، رفتار و انگیزه‌های اصلی یک فرد را بشناسیم و برای رشد او برنامه‌ای عملی ارائه دهیم؟»
                پاسخ ما ترکیبی از هوش مصنوعی، روایت تعاملی و تحلیل داده است.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">لیست آزمون‌ها</h2>
            <p className="max-w-xl text-sm leading-8 text-slate-700">
              پنج آزمون اصلی برای شناخت تیپ شخصیتی و نقاط قوت. هر کارت به صفحه اختصاصی آزمون و شروع فوری گفتگو هدایت‌تان می‌کند.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <LoaderCircle className="h-10 w-10 animate-spin text-purple-500" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {tests.map((test) => (
                <div key={test.id} className="flex h-full min-h-[340px] flex-col justify-between rounded-3xl border border-purple-100 bg-white/95 p-7 shadow-sm transition hover:-translate-y-1 hover:border-purple-200">
                  <div className="space-y-3 text-right">
                    <h3 className="text-xl font-semibold text-slate-900">{test.name}</h3>
                    <p className="text-sm font-medium text-purple-700">{test.tagline}</p>
                    <p className="text-sm leading-7 text-slate-700">{test.description}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-between gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/70 px-3 py-1">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      {test.report_name}
                    </span>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 text-purple-700 hover:border-purple-300 hover:text-purple-800"
                      onClick={() => navigate(`/personality/${test.slug}`)}
                    >
                      مشاهده جزئیات
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default PersonalityAssessments;
