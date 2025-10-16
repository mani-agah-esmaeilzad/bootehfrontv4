// src/pages/MysteryAssessments.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, LoaderCircle, Sparkles, ArrowLeft, ArrowUpRight } from "lucide-react";
import { getMysteryTests, resolveApiAssetUrl } from "@/services/apiService";
import type { MysteryTestSummary } from "@/types/mystery";
import { toast } from "sonner";

const formatDate = (value?: string | null) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return value;
  }
};

const MysteryAssessments = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<MysteryTestSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      setIsLoading(true);
      try {
        const response = await getMysteryTests();
        if (response.success) {
          setTests(response.data);
        } else {
          throw new Error(response.message || "خطا در دریافت لیست رازمایی");
        }
      } catch (error: any) {
        toast.error(error.message || "خطا در دریافت لیست آزمون های رازمایی");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTests();
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white text-slate-900">
      <header className="border-b border-purple-100/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-6 md:px-6">
          <div className="space-y-2 text-right">
            <p className="text-xs font-semibold text-purple-600">سفر تصویری - رازمایی</p>
            <h1 className="text-3xl font-bold md:text-4xl">رازهای پنهان تصاویر را کشف کن</h1>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              در هر رازمایی، مجموعه‌ای از تصاویر روایت‌محور به‌صورت تمام‌صفحه ظاهر می‌شود. نگاه دقیق تو سرنخ‌ها را آشکار می‌کند و در پایان، هوش مصنوعی با چند سؤال هدفمند عمق تحلیل تو را می‌سنجد.
            </p>
          </div>
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
            بازگشت
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-10 px-4 py-12 md:px-6 md:py-16">
        <section className="rounded-[36px] border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-white p-10 shadow-sm">
          <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div className="space-y-5 text-right">
              <h2 className="text-2xl font-semibold text-slate-900 md:text-3xl">رازمایی چگونه کار می‌کند؟</h2>
              <p className="text-sm leading-7 text-slate-700">
                ابتدا با اسکرول یا سوایپ، تصاویر تمام‌صفحه را یکی‌یکی کشف می‌کنی. سپس در گفتگو با «رازمَستر»، برداشت‌ها، نشانه‌ها و رازهایی که پیدا کرده‌ای را روایت می‌کنی. هوش مصنوعی با طرح پرسش‌های عمیق‌تر، نگاه تحلیلی تو را به چالش می‌کشد و در نهایت گزارشی از مسیر کشف تو ارائه می‌دهد.
              </p>
              <div className="flex flex-wrap justify-end gap-3 text-xs text-purple-600">
                <span className="inline-flex items-center gap-2 rounded-full border border-purple-200/70 px-4 py-2">
                  <Sparkles className="h-4 w-4" />
                  روایت تعاملی
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-purple-200/70 px-4 py-2">
                  <Sparkles className="h-4 w-4" />
                  هوش مصنوعی پرسشگر
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-purple-200/70 px-4 py-2">
                  <Sparkles className="h-4 w-4" />
                  تحلیل نهایی شخصی‌سازی‌شده
                </span>
              </div>
            </div>
            <Card className="overflow-hidden border-none bg-gradient-to-br from-slate-900 via-slate-800 to-purple-900 text-white shadow-xl">
              <CardContent className="space-y-4 p-6 text-right">
                <h3 className="text-lg font-semibold">چرا رازمایی؟</h3>
                <p className="text-sm leading-7 text-slate-200">
                  با مشاهدهٔ جزئیات تصاویر و پاسخ به پرسش‌های باز، مهارت تحلیل موقعیت، توجه به نشانه‌ها و توان روایت‌گری خود را محک می‌زنی. این مسیر، تمرینی برای ذهن کاوشگر و نگاه کنجکاو توست.
                </p>
                <div className="flex flex-col gap-3 rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-300">مراحل تجربه</p>
                  <ul className="space-y-2 text-sm leading-6 text-white/90">
                    <li>۱. ورود به دنیای راز و روایت</li>
                    <li>۲. کشف جزئیات تصاویر با اسکرول یا سوایپ تمام‌صفحه</li>
                    <li>۳. گفتگوی هوشمندانه با رازمَستر</li>
                    <li>۴. دریافت گزارش اختصاصی از نگاه تحلیلی تو</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">انتخاب رازمایی</h2>
            <p className="text-xs text-slate-500">تعداد سناریوها: {tests.length}</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <LoaderCircle className="h-10 w-10 animate-spin text-purple-500" />
            </div>
          ) : tests.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-purple-200 bg-white/70 p-10 text-center text-sm text-slate-600">
              هنوز رازمایی فعال ثبت نشده است. به زودی با داستان‌های تصویری تازه برمی‌گردیم.
            </div>
          ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {tests.map((test) => (
                <article
                  key={test.id}
                  className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-purple-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-purple-200 hover:shadow-lg"
                >
                  {test.preview_image ? (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={resolveApiAssetUrl(test.preview_image)}
                        alt={test.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent" />
                    </div>
                  ) : (
                    <div className="flex h-48 items-center justify-center bg-slate-100 text-sm text-slate-500">
                      بدون تصویر پیش‌نمایش
                    </div>
                  )}
                  <div className="flex flex-1 flex-col justify-between gap-4 p-6 text-right">
                    <div className="space-y-3">
                      <div className="flex items-center justify-end gap-2 text-xs text-slate-400">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(test.created_at)}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">{test.name}</h3>
                      <p className="text-sm leading-7 text-slate-600">{test.short_description}</p>
                    </div>
                    <Button
                      variant="ghost"
                      className="self-start text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                      onClick={() => navigate(`/mystery/${test.slug}`)}
                    >
                      شروع مسیر کشف
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-purple-400 via-amber-400 to-purple-600 opacity-0 transition-opacity group-hover:opacity-100" />
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default MysteryAssessments;
