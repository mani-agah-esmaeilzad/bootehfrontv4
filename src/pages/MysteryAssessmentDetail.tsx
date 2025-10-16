// src/pages/MysteryAssessmentDetail.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoaderCircle, ArrowLeft, Sparkles, Image as ImageIcon } from "lucide-react";
import { getMysteryTest } from "@/services/apiService";
import type { MysteryTestDetail } from "@/types/mystery";
import { toast } from "sonner";

const MysteryAssessmentDetail = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const [test, setTest] = useState<MysteryTestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const fetchTest = async () => {
      setIsLoading(true);
      try {
        const response = await getMysteryTest(slug);
        if (response.success) {
          setTest(response.data);
        } else {
          throw new Error(response.message || "آزمون رازمایی یافت نشد");
        }
      } catch (error: any) {
        toast.error(error.message || "خطا در دریافت اطلاعات رازمایی");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTest();
  }, [slug]);

  const images = useMemo(() => test?.images ?? [], [test]);

  const ensureAuth = (redirectTo: string) => {
    const isLoggedIn = !!localStorage.getItem("isLoggedIn") || !!localStorage.getItem("isAdminLoggedIn");
    if (!isLoggedIn) {
      toast.info("برای شروع رازمایی ابتدا وارد حساب کاربری خود شوید.");
      navigate("/login", { state: { redirectTo } });
      return false;
    }
    return true;
  };

  const handleStart = () => {
    if (!test) return;
    const redirect = `/mystery/${test.slug}/chat`;
    if (!ensureAuth(redirect)) {
      return;
    }
    navigate(redirect);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
        <LoaderCircle className="h-10 w-10 animate-spin text-purple-500" />
        <p className="text-sm text-slate-500">در حال بارگذاری رازمایی...</p>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
        <p className="text-sm text-slate-600">رازمایی مورد نظر یافت نشد.</p>
        <Button onClick={() => navigate("/mystery")}>بازگشت به لیست رازمایی</Button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-purple-100/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-6 md:px-6">
          <div className="space-y-1 text-right">
            <p className="text-xs font-semibold text-purple-600">رازمایی</p>
            <h1 className="text-3xl font-bold md:text-4xl">{test.name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button className="bg-purple-600 text-white hover:bg-purple-700" onClick={handleStart}>
              شروع گفتگو با رازمَستر
            </Button>
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
              onClick={() => navigate("/mystery")}
            >
              <ArrowLeft className="h-4 w-4" />
              بازگشت
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl space-y-12 px-4 py-12 md:px-6 md:py-16">
        <section className="rounded-[36px] border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-white p-10 shadow-sm">
          <div className="space-y-6 text-right">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-200/70 bg-white/70 px-4 py-2 text-xs font-semibold text-purple-600 shadow-sm">
              <Sparkles className="h-4 w-4" />
              آمادهٔ کشف رازها
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 md:text-3xl">پیش از شروع بدان...</h2>
            <p className="text-sm leading-7 text-slate-700 md:text-base md:leading-8">{test.short_description}</p>
            <Card className="border-none bg-slate-900 text-white">
              <CardContent className="space-y-4 p-6 text-right">
                <h3 className="text-lg font-semibold">پیام آغاز رازمَستر</h3>
                <p className="text-sm leading-7 text-slate-200">{test.intro_message}</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-2 text-right">
            <h2 className="text-2xl font-semibold text-slate-900">گالری رازها</h2>
            <p className="text-sm text-slate-600">
              اسکرول افقی را آغاز کن؛ هر تصویر سرنخ جدیدی را نمایان می‌کند. به ترکیب رنگ، نگاه سوژه‌ها، اشیای پنهان و ارتباط آن‌ها توجه کن.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[32px] border border-purple-100 bg-slate-900/95 p-6 text-white shadow-lg">
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-900 via-slate-900/20 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-slate-900 via-slate-900/20 to-transparent" />
            <div className="flex items-center gap-3 pb-4 text-xs text-slate-300">
              <ImageIcon className="h-4 w-4" />
              برای مرور تصاویر، اسکرول افقی انجام بده
            </div>
            <div className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6 pe-6 ps-1 transition-all duration-700" style={{ scrollbarWidth: "none" }}>
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className="group relative flex w-[280px] shrink-0 snap-center flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-lg transition-transform duration-500 hover:-translate-y-2 md:w-[340px]"
                >
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={image.image_url}
                      alt={image.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent" />
                    <span className="absolute right-4 top-4 rounded-full bg-white/20 px-3 py-1 text-xs backdrop-blur">
                      تصویر {index + 1}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5 text-right">
                    <h3 className="text-lg font-semibold text-white">{image.title}</h3>
                    <p className="text-sm leading-6 text-slate-200">
                      {image.description || "برای کشف جزئیات، نگاهت را دقیق‌تر کن."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[36px] border border-purple-100 bg-white p-10 shadow-sm">
          <div className="grid gap-6 md:grid-cols-2 md:items-center">
            <div className="space-y-4 text-right">
              <h3 className="text-xl font-semibold text-slate-900">آماده‌ای گفتگو را شروع کنیم؟</h3>
              <p className="text-sm leading-7 text-slate-600">
                پس از مشاهده تصاویر، روی شروع گفتگو کلیک کن. رازمَستر با سوالاتی کنجکاوانه از تو می‌خواهد سرنخ‌هایی که پیدا کرده‌ای را بازگو کنی و لایه‌های deeper داستان را آشکار سازی.
              </p>
              <div className="flex flex-wrap justify-end gap-3 text-xs text-slate-500">
                <span className="rounded-full border border-purple-200/60 px-3 py-1">پاسخ‌های تو ذخیره می‌شود</span>
                <span className="rounded-full border border-purple-200/60 px-3 py-1">در پایان گزارش اختصاصی می‌گیری</span>
              </div>
            </div>
            <Card className="border border-purple-100 bg-purple-50/60">
              <CardContent className="flex flex-col gap-4 p-6 text-right">
                <p className="text-sm text-purple-700">نکته: هنگام گفتگو، به داستان خود عمق بده. به احساسات، ارتباط بین عناصر و پیش‌فرض‌هایی که در ذهنت شکل گرفته اشاره کن.</p>
                <Button className="bg-purple-600 text-white hover:bg-purple-700" onClick={handleStart}>
                  شروع گفتگو با رازمَستر
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MysteryAssessmentDetail;
