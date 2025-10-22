// src/pages/MysterySupplementary.tsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import { sendMysteryMessage, finishMysteryTest } from "@/services/apiService";
import type { MysteryAnalysis } from "@/types/mystery";
import { toast } from "sonner";

type StoredSession = {
  sessionId: string;
  guideName?: string;
  testName?: string;
};

const MysterySupplementary = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [testName, setTestName] = useState<string>("");
  const [guideName, setGuideName] = useState<string>("");
  const [answers, setAnswers] = useState({ q1: "", q2: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const storedRaw = sessionStorage.getItem(`mystery_session_${slug}`);
    if (!storedRaw) {
      toast.warning("برای دسترسی به سوالات تکمیلی ابتدا تحلیل تصاویر را تکمیل کن.");
      navigate(`/mystery/${slug}`);
      return;
    }
    try {
      const stored = JSON.parse(storedRaw) as StoredSession;
      if (!stored.sessionId) {
        throw new Error("session id missing");
      }
      setSessionId(stored.sessionId);
      setGuideName(stored.guideName ?? "");
      setTestName(stored.testName ?? "");
    } catch {
      toast.error("اطلاعات جلسه معتبر نیست. دوباره تلاش کن.");
      sessionStorage.removeItem(`mystery_session_${slug}`);
      navigate(`/mystery/${slug}`);
    }
  }, [slug, navigate]);

  const handleChange = (field: "q1" | "q2", value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!sessionId || !slug) return;
    if (!answers.q1.trim() || !answers.q2.trim()) {
      toast.info("هر دو پاسخ تکمیلی را بنویس سپس ادامه بده.");
      return;
    }
    setIsSubmitting(true);
    try {
      await sendMysteryMessage(
        sessionId,
        `پاسخ سوال تکمیلی ۱: ${answers.q1.trim()}`
      );
      await sendMysteryMessage(
        sessionId,
        `پاسخ سوال تکمیلی ۲: ${answers.q2.trim()}`
      );
      const response = await finishMysteryTest(sessionId);
      if (!response.success) {
        throw new Error(response.message || "تحلیل نهایی تولید نشد.");
      }
      const analysis: MysteryAnalysis = response.data;
      sessionStorage.setItem(
        `mystery_result_${sessionId}`,
        JSON.stringify({
          analysis,
          supplementary: answers,
          testName,
          guideName,
        })
      );
      toast.success("نتیجه آماده نمایش است.");
      navigate(`/mystery/${slug}/result`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || "خطا در ثبت پاسخ‌ها");
      } else {
        toast.error("خطا در ثبت پاسخ‌ها");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sessionId) {
    return null;
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-6 md:px-8">
          <div className="text-right">
            <p className="text-xs text-white/60">سوالات تکمیلی</p>
            <h1 className="text-2xl font-bold text-white md:text-3xl">
              {testName || "تحلیل رازمایی"}
            </h1>
            {guideName && (
              <p className="mt-1 text-[0.7rem] text-white/50">رازمَستر: {guideName}</p>
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

      <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-4xl flex-col gap-6 px-4 py-10 text-right md:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur">
          <p className="text-sm text-white/70">
            حالا که برداشتت از تصاویر را گفتی، این دو سوال به رازمَستر کمک می‌کند نتیجه‌گیری
            دقیق‌تری داشته باشد. پاسخ‌هایت مستقیم به گفتگو اضافه می‌شود.
          </p>
          <div className="mt-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="q1" className="text-sm font-semibold text-white/90">
                مهم‌ترین نکته‌ای که از همه تصاویر به ذهن تو رسید چیست؟
              </Label>
              <Textarea
                id="q1"
                rows={4}
                value={answers.q1}
                onChange={(event) => handleChange("q1", event.target.value)}
                className="min-h-[140px] rounded-3xl border border-white/20 bg-white/10 text-sm text-white placeholder:text-white/50 focus-visible:ring-purple-400/70"
                placeholder="جمع‌بندی اولیه‌ات را با جزئیات بنویس..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="q2" className="text-sm font-semibold text-white/90">
                چه سوال یا ابهامی هنوز برایت باقی مانده که می‌خواهی بررسی شود؟
              </Label>
              <Textarea
                id="q2"
                rows={4}
                value={answers.q2}
                onChange={(event) => handleChange("q2", event.target.value)}
                className="min-h-[140px] rounded-3xl border border-white/20 bg-white/10 text-sm text-white placeholder:text-white/50 focus-visible:ring-purple-400/70"
                placeholder="اگر نکته یا فرضیه‌ای مانده، همین‌جا اضافه کن..."
              />
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-500 py-3 text-base font-semibold text-white hover:bg-purple-600 disabled:opacity-70"
          >
            {isSubmitting && <Loader2 className="h-5 w-5 animate-spin text-white" />}
            {isSubmitting ? "در حال ارسال..." : "مشاهده تحلیل نهایی"}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default MysterySupplementary;
