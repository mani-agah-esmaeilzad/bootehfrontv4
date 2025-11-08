// src/pages/PersonalityAssessmentDetail.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LoaderCircle, Sparkles, Tag } from "lucide-react";
import { getPersonalityTest } from "@/services/apiService";
import { toast } from "sonner";

interface PersonalityTestDetail {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  report_name: string;
  highlights: string[];
}

const PersonalityAssessmentDetail = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [test, setTest] = useState<PersonalityTestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const fetchTest = async () => {
      setIsLoading(true);
      try {
        const response = await getPersonalityTest(slug);
        if (response.success) {
          setTest(response.data);
        } else {
          throw new Error(response.message || "آزمون یافت نشد");
        }
      } catch (error: any) {
        toast.error(error.message || "خطا در دریافت اطلاعات آزمون");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTest();
  }, [slug]);

  const highlights = useMemo(() => test?.highlights ?? [], [test]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <LoaderCircle className="h-10 w-10 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
        <p className="text-sm text-slate-600">آزمون مورد نظر یافت نشد.</p>
        <Button onClick={() => navigate("/personality")}>بازگشت به لیست آزمون‌ها</Button>
      </div>
    );
  }

  const handleStart = () => {
    const isLoggedIn = !!localStorage.getItem("isLoggedIn") || !!localStorage.getItem("isAdminLoggedIn");
    if (!isLoggedIn) {
      toast.info("برای شروع آزمون ابتدا وارد حساب کاربری خود شوید.");
      navigate("/login", { state: { redirectTo: `/personality/${test.slug}/chat` } });
      return;
    }
    if (test.slug === "mbti") {
      navigate(`/personality/${test.slug}/form`);
      return;
    }
    navigate(`/personality/${test.slug}/chat`);
  };

  const handleViewResults = () => {
    const isLoggedIn = !!localStorage.getItem("isLoggedIn") || !!localStorage.getItem("isAdminLoggedIn");
    if (!isLoggedIn) {
      toast.info("برای مشاهده گزارش‌های قبلی ابتدا وارد شوید.");
      navigate("/login", { state: { redirectTo: "/personality/results" } });
      return;
    }
    navigate("/personality/results");
  };

  return (
    <div dir="rtl" className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-purple-100/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-5 md:px-6">
          <div className="space-y-1 text-right">
            <p className="text-xs font-semibold text-purple-600">آزمون شخصیتی</p>
            <h1 className="text-2xl font-bold md:text-3xl">{test.name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button className="bg-purple-600 text-white hover:bg-purple-700" onClick={handleStart}>
              شروع آزمون
            </Button>
            <Button variant="outline" onClick={handleViewResults}>
              گزارش‌های من
            </Button>
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
              onClick={() => navigate("/personality")}
            >
              <ArrowLeft className="h-4 w-4" />
              بازگشت
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl space-y-10 px-4 py-12 md:px-6 md:py-16">
        <section className="rounded-[32px] border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-white p-10 shadow-sm">
          <div className="space-y-6 text-right">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-200/70 bg-white/70 px-4 py-2 text-xs font-semibold text-purple-600 shadow-sm">
              <Tag className="h-4 w-4" />
              {test.report_name}
            </div>
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">{test.tagline}</h2>
            <p className="text-sm leading-7 text-slate-600 md:text-base md:leading-8">{test.description}</p>
          </div>
        </section>

        <section className="rounded-[32px] border border-purple-100 bg-white/90 p-10 shadow-sm backdrop-blur">
          <h3 className="text-2xl font-semibold text-slate-900">این گزارش چه چیزی ارائه می‌دهد؟</h3>
          <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-600">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-100">
                  <Sparkles className="h-3 w-3 text-purple-600" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[32px] border border-purple-100 bg-slate-900 px-8 py-12 text-white shadow-sm">
          <div className="space-y-4 text-center">
            <h3 className="text-2xl font-semibold md:text-3xl">چگونه کار می‌کند؟</h3>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-200 md:text-base md:leading-8">
              گفتگوی تعاملی با کوچ اختصاصی آغاز می‌شود، سپس براساس پاسخ‌های تو یک گزارش ساختاریافته شامل جمع‌بندی، نقاط قوت و پیشنهادهای توسعه تولید می‌گردد. در پایان می‌توانی گزارش را در بخش «گزارش‌های من» مشاهده کنی.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button className="bg-purple-500 px-6 py-3 text-base font-semibold text-white hover:bg-purple-600" onClick={handleStart}>
                شروع گفتگو
              </Button>
              <Button
                variant="ghost"
                className="bg-white/10 px-6 py-3 text-base font-semibold text-white hover:bg-white/20"
                onClick={() => (window.location.href = "mailto:info@hrbooteh.com")}
              >
                گفتگو با تیم بوته
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PersonalityAssessmentDetail;
