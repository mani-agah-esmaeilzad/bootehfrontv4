// src/pages/PersonalityResults.tsx

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoaderCircle, Sparkles } from "lucide-react";
import { getPersonalityResults } from "@/services/apiService";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface PersonalityResultItem {
  sessionId: string;
  name: string;
  slug: string;
  report_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  results: {
    history?: Array<{ role: string; content: string }>;
    analysis?: Record<string, any>;
  } | null;
}

const PersonalityResults = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<PersonalityResultItem[]>([]);

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const response = await getPersonalityResults();
        if (!response.success) {
          throw new Error(response.message || "خطا در دریافت گزارش‌ها");
        }
        setItems(response.data || []);
      } catch (error: any) {
        toast.error(error.message || "مشکل در دریافت گزارش‌ها");
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, []);

  const formatDate = (value: string) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleString("fa-IR");
    } catch (error) {
      return value;
    }
  };

  const content = useMemo(() => {
    if (!items.length) {
      return (
        <Card className="border-purple-100 bg-white shadow-sm">
          <CardContent className="p-8 text-center text-sm text-slate-600">
            هنوز گزارشی برای آزمون‌های شخصیتی ثبت نشده است.
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2">
        {items.map((item) => (
          <Card key={item.sessionId} className="border-purple-100 bg-white/90 shadow-sm">
            <CardHeader className="flex flex-col items-start gap-2">
              <CardTitle className="text-lg text-slate-900">{item.name}</CardTitle>
              <p className="text-xs text-slate-500">گزارش: {item.report_name}</p>
              <p className="text-xs text-slate-400">ثبت: {formatDate(item.created_at)}</p>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-slate-700">
              {item.results?.analysis ? (
                Object.entries(item.results.analysis).map(([key, value]) => (
                  <div key={key}>
                    <p className="font-semibold text-purple-700">{key}</p>
                    <pre className="mt-1 whitespace-pre-wrap break-words rounded-md bg-slate-50 p-3 text-xs text-slate-600">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">گزارش هنوز آماده نشده است.</p>
              )}
              <div className="flex flex-wrap justify-end gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-2 rounded-full border border-purple-200/60 px-3 py-1">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  وضعیت: {item.status === "completed" ? "تکمیل شده" : "در حال انجام"}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }, [items]);

  return (
    <div dir="rtl" className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-purple-100/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-5 md:px-6">
          <div className="space-y-1 text-right">
            <p className="text-xs font-semibold text-purple-600">گزارش‌های آزمون شخصیتی</p>
            <h1 className="text-2xl font-bold md:text-3xl">نتایج گفتگوهای شما</h1>
          </div>
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-slate-600 hover:text-slate-900">
            بازگشت
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-12 md:px-6 md:py-16">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-sm text-slate-500">
            <LoaderCircle className="h-10 w-10 animate-spin text-purple-500" />
            در حال دریافت گزارش‌ها...
          </div>
        ) : (
          content
        )}
      </main>
    </div>
  );
};

export default PersonalityResults;
