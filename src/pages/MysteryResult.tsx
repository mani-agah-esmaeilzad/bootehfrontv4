// src/pages/MysteryResult.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MysteryAnalysis } from "@/types/mystery";
import { LoaderCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type StoredResult = {
  analysis: MysteryAnalysis;
  supplementary?: {
    q1: string;
    q2: string;
  };
  testName?: string;
  guideName?: string;
};

type StoredSession = {
  sessionId: string;
  testName?: string;
  guideName?: string;
};

const MysteryResult = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const [analysis, setAnalysis] = useState<MysteryAnalysis | null>(null);
  const [supplementary, setSupplementary] = useState<{ q1: string; q2: string } | null>(
    null
  );
  const [testName, setTestName] = useState<string>("");
  const [guideName, setGuideName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const storedSessionRaw = sessionStorage.getItem(`mystery_session_${slug}`);
    if (!storedSessionRaw) {
      toast.warning("برای مشاهده نتیجه ابتدا تحلیل را کامل کن.");
      navigate(`/mystery/${slug}`);
      return;
    }
    let session: StoredSession;
    try {
      session = JSON.parse(storedSessionRaw) as StoredSession;
    } catch {
      toast.error("اطلاعات جلسه نامعتبر است.");
      navigate(`/mystery/${slug}`);
      return;
    }
    if (!session.sessionId) {
      toast.error("شناسه جلسه یافت نشد.");
      navigate(`/mystery/${slug}`);
      return;
    }

    setTestName(session.testName ?? "");
    setGuideName(session.guideName ?? "");

    const storedResultRaw = sessionStorage.getItem(
      `mystery_result_${session.sessionId}`
    );
    if (!storedResultRaw) {
      toast.error("نتیجه‌ای برای نمایش وجود ندارد.");
      navigate(`/mystery/${slug}`);
      return;
    }
    try {
      const stored = JSON.parse(storedResultRaw) as StoredResult;
      setAnalysis(stored.analysis);
      setSupplementary(stored.supplementary ?? null);
      if (stored.testName) setTestName(stored.testName);
      if (stored.guideName) setGuideName(stored.guideName);
    } catch {
      toast.error("امکان خواندن نتیجه وجود ندارد.");
      navigate(`/mystery/${slug}`);
    } finally {
      setIsLoading(false);
    }
  }, [slug, navigate]);

  const analysisEntries = useMemo(() => {
    if (!analysis) return [];
    return Object.entries(analysis).filter(([_, value]) => value !== undefined);
  }, [analysis]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
        <LoaderCircle className="h-10 w-10 animate-spin text-purple-500" />
        <p className="text-sm text-slate-500">در حال آماده‌سازی نتیجه رازمایی...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
        <p className="text-sm text-slate-600">نتیجه‌ای یافت نشد.</p>
        <Button onClick={() => navigate("/mystery")}>بازگشت به لیست رازمایی</Button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-6 md:px-8">
          <div className="space-y-2 text-right">
            <p className="text-xs text-white/60">نتیجه تحلیل رازمایی</p>
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              {testName || "جمع‌بندی رازمَستر"}
            </h1>
            {guideName && (
              <p className="text-xs text-white/50">رازمَستر: {guideName}</p>
            )}
          </div>
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-white/70 hover:text-white"
            onClick={() => navigate(`/mystery/${slug}`)}
          >
            <ArrowLeft className="h-4 w-4" />
            بازگشت به تصاویر
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-10 text-right md:px-8">
        <div className="space-y-8">
          {supplementary && (
            <Card className="border-white/10 bg-white/10 text-white backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg">پاسخ‌های تکمیلی تو</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-white/80">
                <div>
                  <p className="font-semibold text-white">جمع‌بندی نهایی:</p>
                  <p className="mt-1 whitespace-pre-wrap text-white/70">{supplementary.q1}</p>
                </div>
                <div>
                  <p className="font-semibold text-white">ابهام یا سوال باقی‌مانده:</p>
                  <p className="mt-1 whitespace-pre-wrap text-white/70">{supplementary.q2}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-white/15 bg-white/10 text-white backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">تحلیل شخصی‌سازی‌شده رازمَستر</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {analysisEntries.map(([key, value]) => (
                <div key={key} className="rounded-2xl bg-white/5 p-5">
                  <p className="text-sm font-semibold text-purple-200">{key}</p>
                  <pre className="mt-3 whitespace-pre-wrap text-xs leading-7 text-white/80">
                    {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
                  </pre>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              variant="outline"
              className="border-white/15 text-white hover:bg-white/10"
              onClick={() => navigate("/mystery")}
            >
              سایر رازمایی‌ها
            </Button>
            <Button
              className="bg-purple-500 text-white hover:bg-purple-600"
              onClick={() => navigate("/dashboard")}
            >
              بازگشت به داشبورد
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MysteryResult;
