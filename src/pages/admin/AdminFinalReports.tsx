// src/pages/admin/AdminFinalReports.tsx

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  Search,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { ComparisonSpiderChart } from "@/components/ui/ComparisonSpiderChart";
import { PowerWheelChart } from "@/components/ui/PowerWheelChart";
import { getFinalReportSummaries, getFinalReportDetail } from "@/services/apiService";
import { cn } from "@/lib/utils";

interface CategoryScore {
  label: string;
  normalizedScore: number;
  completedCount: number;
  totalAssignments: number;
}

interface FinalReportSummary {
  userId: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  assignedCount: number;
  completedCount: number;
  completionPercent: number;
  isReady: boolean;
  lastCompletedAt: string | null;
  overallScore: number;
  categoryScores: CategoryScore[];
}

interface CategorySummary extends CategoryScore {
  key: string;
  contributions: {
    assessmentId: number;
    questionnaireId: number;
    questionnaireTitle: string;
    normalizedScore: number;
    rawScore: number;
    maxScore: number;
    completedAt: string | null;
  }[];
}

interface RadarPoint {
  subject: string;
  userScore: number;
  targetScore: number;
}

interface PowerWheelSegment {
  label: string;
  value: number;
  status: "pending" | "partial" | "completed";
  completedCount: number;
  totalAssignments: number;
}

interface ParsedCompletion {
  assessmentId: number;
  questionnaireId: number;
  questionnaireTitle: string;
  category: string;
  completedAt: string | null;
  normalizedScore: number;
  rawScore: number;
  maxScore: number;
  summary: string | null;
  strengths: string[];
  recommendations: string[];
  developmentPlan: string[];
  risks: string[];
  factorScores: { name: string; score: number; maxScore: number }[];
}

interface AssignmentInfo {
  questionnaire_id: number;
  questionnaire_title: string;
  display_order: number | null;
  category: string | null;
}

interface FinalReportDetail {
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    is_active: boolean;
  };
  progress: {
    assignedCount: number;
    completedCount: number;
    completionPercent: number;
    remainingCount: number;
    isReady: boolean;
    lastCompletedAt: string | null;
  };
  overview: {
    overallScore: number;
    averageScore: number;
  };
  categories: CategorySummary[];
  radar: RadarPoint[];
  powerWheel: PowerWheelSegment[];
  assessments: ParsedCompletion[];
  pendingAssignments: AssignmentInfo[];
  strengths: string[];
  recommendations: string[];
  developmentPlan: string[];
  risks: string[];
}

const formatDate = (value: string | null) => {
  if (!value) return "نامشخص";
  try {
    return new Date(value).toLocaleString("fa-IR", {
      dateStyle: "long",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
};

const AdminFinalReports = () => {
  const navigate = useNavigate();
  const [summaries, setSummaries] = useState<FinalReportSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [detail, setDetail] = useState<FinalReportDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadSummaries = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getFinalReportSummaries();
      if (!response.success) {
        throw new Error(response.message || "خطا در دریافت فهرست کاربران");
      }
      setSummaries(response.data || []);
    } catch (error: any) {
      toast.error(error.message || "خطا در دریافت گزارش‌های نهایی");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadDetail = useCallback(
    async (userId: number) => {
      setSelectedUserId(userId);
      setDetail(null);
      setDetailError(null);
      setDetailLoading(true);
      try {
        const response = await getFinalReportDetail(userId);
        if (!response.success) {
          throw new Error(response.message || "جزئیات گزارش یافت نشد");
        }
        setDetail(response.data);
      } catch (error: any) {
        const message = error.message || "خطا در دریافت جزئیات گزارش";
        toast.error(message);
        setDetailError(message);
      } finally {
        setDetailLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadSummaries();
  }, [loadSummaries]);

  useEffect(() => {
    if (!selectedUserId && summaries.length > 0 && !isLoading) {
      loadDetail(summaries[0].userId);
    }
  }, [summaries, selectedUserId, isLoading, loadDetail]);

  const filteredSummaries = useMemo(() => {
    if (!searchTerm.trim()) return summaries;
    const term = searchTerm.trim().toLowerCase();
    return summaries.filter((summary) => {
      const displayName = `${summary.first_name ?? ""} ${summary.last_name ?? ""}`.trim();
      return (
        summary.username.toLowerCase().includes(term) ||
        displayName.toLowerCase().includes(term) ||
        summary.email.toLowerCase().includes(term)
      );
    });
  }, [summaries, searchTerm]);

  const spiderData = useMemo(() => {
    if (!detail?.radar) return [];
    return detail.radar.map((entry) => ({
      subject: entry.subject,
      user: entry.userScore,
      target: entry.targetScore,
    }));
  }, [detail]);

  const spiderSeries = [
    { key: "user", label: "امتیاز کاربر", color: "#6366f1" },
    { key: "target", label: "هدف (۱۰۰)", color: "#94a3b8" },
  ];

  return (
    <div className="admin-page space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white">گزارش‌های نهایی مسیر</h1>
          <p className="text-sm text-white/70">
            وضعیت کلی کاربران را مشاهده کنید و کارنامه نهایی هر مسیر را در قالب پاورویل و نمودار عنکبوتی بررسی نمایید.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="rounded-2xl border-white/30 bg-white/10 text-white hover:bg-white/20"
            onClick={() => navigate("/admin/dashboard")}
          >
            <ArrowLeft className="ml-2 h-4 w-4" />
            بازگشت
          </Button>
          <Button
            variant="secondary"
            className="rounded-2xl bg-white/80 text-slate-900 shadow-md shadow-indigo-500/10"
            onClick={loadSummaries}
            disabled={isLoading}
          >
            {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="ml-2 h-4 w-4" />}
            بروزرسانی
          </Button>
        </div>
      </div>

      <section className="admin-surface space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
            <Search className="h-4 w-4 text-white/60" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجوی نام یا نام‌کاربری..."
              className="border-0 bg-transparent text-white placeholder:text-white/40 focus-visible:ring-0"
            />
          </div>
          <p className="text-xs text-white/60">
            {filteredSummaries.length} مسیر تعریف شده - {summaries.filter((s) => s.isReady).length} کاربر آماده تحویل
          </p>
        </div>
        <div className="rounded-3xl border border-white/5">
          {isLoading ? (
            <div className="py-16 text-center text-white/70">
              <LoaderCircle className="mx-auto mb-3 h-10 w-10 animate-spin" />
              در حال آماده‌سازی گزارش‌ها...
            </div>
          ) : (
            <div className="max-h-[460px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-white/5 text-white/70">
                    <TableHead>کاربر</TableHead>
                    <TableHead className="text-center">پیشرفت</TableHead>
                    <TableHead className="text-center">میانگین امتیاز</TableHead>
                    <TableHead className="text-center">آخرین بروزرسانی</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSummaries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-white/60">
                        موردی برای نمایش وجود ندارد.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSummaries.map((summary) => {
                      const isActive = summary.userId === selectedUserId;
                      return (
                        <TableRow
                          key={summary.userId}
                          onClick={() => loadDetail(summary.userId)}
                          className={cn(
                            "cursor-pointer transition hover:bg-indigo-500/10",
                            isActive && "bg-indigo-500/20",
                          )}
                        >
                          <TableCell className="space-y-1 text-white">
                            <div className="font-semibold">
                              {summary.first_name} {summary.last_name}
                            </div>
                            <div className="text-xs text-white/60">@{summary.username}</div>
                            <Badge variant={summary.isReady ? "default" : "secondary"} className="mt-1">
                              {summary.isReady ? "آماده تحویل" : "در حال تکمیل"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-white">
                            <div className="mb-1 text-xs text-white/70">
                              {summary.completedCount}/{summary.assignedCount} مرحله
                            </div>
                            <Progress value={summary.completionPercent} className="bg-white/20" />
                          </TableCell>
                          <TableCell className="text-center text-2xl font-black text-white">
                            {summary.overallScore?.toFixed(0) ?? "—"}
                          </TableCell>
                          <TableCell className="text-center text-white/70">
                            {summary.lastCompletedAt ? formatDate(summary.lastCompletedAt) : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </section>
      <section className="admin-surface space-y-6">
        {detailLoading ? (
          <div className="py-16 text-center text-white/70">
            <LoaderCircle className="mx-auto mb-3 h-10 w-10 animate-spin" />
            در حال دریافت گزارش نهایی کاربر...
          </div>
        ) : detailError ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-center text-white">
            <AlertTriangle className="h-10 w-10 text-red-300" />
            <p className="text-sm text-red-200">{detailError}</p>
          </div>
        ) : detail ? (
          <>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {detail.user.first_name} {detail.user.last_name}{" "}
                  <span className="text-sm text-white/50">(@{detail.user.username})</span>
                </h2>
                <p className="text-xs text-white/50">
                  آخرین بروزرسانی: {detail.progress.lastCompletedAt ? formatDate(detail.progress.lastCompletedAt) : "نامشخص"}
                </p>
              </div>
              <Badge variant={detail.progress.isReady ? "default" : "secondary"} className="rounded-full bg-white/80 text-slate-900">
                {detail.progress.isReady ? "کاربر آماده تحویل نهایی" : "هنوز برخی مراحل باقی مانده است"}
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-white/5 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white/70">پیشرفت مسیر</CardTitle>
                  <CardDescription className="text-xs text-white/50">مراحل تکمیل‌شده</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-black">
                    {detail.progress.completedCount}/{detail.progress.assignedCount}
                  </p>
                  <Progress className="mt-3 bg-white/20" value={detail.progress.completionPercent} />
                </CardContent>
              </Card>
              <Card className="bg-white/5 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white/70">میانگین امتیاز</CardTitle>
                  <CardDescription className="text-xs text-white/50">بر اساس تحلیل نهایی</CardDescription>
                </CardHeader>
                <CardContent className="flex items-end gap-2">
                  <p className="text-4xl font-black">{detail.overview.overallScore.toFixed(0)}</p>
                  <span className="text-sm text-white/60">/ 100</span>
                </CardContent>
              </Card>
              <Card className="bg-white/5 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white/70">میانگین امتیاز خام</CardTitle>
                  <CardDescription className="text-xs text-white/50">نمره میانگین گفت‌وگوها</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-3">
                  <ShieldCheck className="h-10 w-10 text-emerald-300" />
                  <div>
                    <p className="text-2xl font-bold">{detail.overview.averageScore.toFixed(1)}</p>
                    <p className="text-xs text-white/60">میانگین خام</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-indigo-900/40 to-slate-950/40 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  پاورویل شایستگی‌ها
                </div>
                <div className="mt-4">
                  <PowerWheelChart data={detail.powerWheel} />
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-indigo-900/40 to-slate-950/40 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <ShieldCheck className="h-4 w-4 text-sky-300" />
                  نمودار عنکبوتی مقایسه دسته‌بندی‌ها
                </div>
                <div className="mt-4 h-[360px]">
                  {spiderData.length > 0 ? (
                    <ComparisonSpiderChart data={spiderData} series={spiderSeries} />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-white/60">
                      داده‌ای برای نمودار در دسترس نیست.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {detail.categories.map((category) => (
                <Card key={category.key} className="bg-white/5 text-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{category.label}</CardTitle>
                    <CardDescription className="text-xs text-white/50">
                      {category.completedCount}/{category.totalAssignments || 0} مرحله
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-black">{category.normalizedScore.toFixed(1)}</p>
                    <Progress className="mt-3 bg-white/20" value={category.normalizedScore} />
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-white/5 text-white">
                <CardHeader>
                  <CardTitle>نقاط قوت</CardTitle>
                  <CardDescription>ترسیم‌شده از تمام گفت‌وگوها</CardDescription>
                </CardHeader>
                <CardContent>
                  {detail.strengths.length === 0 ? (
                    <p className="text-sm text-white/60">هنوز تحلیلی ثبت نشده است.</p>
                  ) : (
                    <ul className="space-y-2 text-sm text-white/90">
                      {detail.strengths.map((item, index) => (
                        <li key={`strength-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-2">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-white/5 text-white">
                <CardHeader>
                  <CardTitle>پیشنهادهای توسعه</CardTitle>
                  <CardDescription>ترکیب توصیه‌های تحلیل نهایی</CardDescription>
                </CardHeader>
                <CardContent>
                  {detail.developmentPlan.length === 0 && detail.recommendations.length === 0 ? (
                    <p className="text-sm text-white/60">پیشنهاد مشخصی ثبت نشده است.</p>
                  ) : (
                    <ul className="space-y-2 text-sm text-white/90">
                      {[...detail.developmentPlan, ...detail.recommendations].map((item, index) => (
                        <li key={`plan-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-2">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/5 text-white">
              <CardHeader>
                <CardTitle>گفت‌وگوهای تکمیل شده</CardTitle>
                <CardDescription>میانگین امتیاز و خلاصه هر مرحله</CardDescription>
              </CardHeader>
              <CardContent>
                {detail.assessments.length === 0 ? (
                  <p className="text-sm text-white/60">هیچ مرحله‌ای تکمیل نشده است.</p>
                ) : (
                  <ScrollArea className="max-h-[360px]">
                    <div className="space-y-4">
                      {detail.assessments.map((assessment) => (
                        <div
                          key={assessment.assessmentId}
                          className="rounded-2xl border border-white/10 bg-white/5 p-4"
                        >
                          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="text-sm text-white/60">{assessment.category}</p>
                              <h4 className="text-lg font-semibold text-white">{assessment.questionnaireTitle}</h4>
                            </div>
                            <div className="text-right text-white">
                              <div className="text-3xl font-black">{assessment.normalizedScore.toFixed(1)}</div>
                              <p className="text-xs text-white/60">{assessment.completedAt ? formatDate(assessment.completedAt) : "—"}</p>
                            </div>
                          </div>
                          {assessment.summary && (
                            <p className="mt-3 text-sm text-white/80">{assessment.summary}</p>
                          )}
                          {assessment.strengths.length > 0 && (
                            <div className="mt-3 text-xs text-white/60">
                              <span className="font-semibold text-white">نکات برجسته:</span>{" "}
                              {assessment.strengths.slice(0, 3).join("، ")}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/5 text-white">
              <CardHeader>
                <CardTitle>مراحل باقیمانده</CardTitle>
                <CardDescription>برای کامل شدن مسیر باید این مراحل تکمیل شوند</CardDescription>
              </CardHeader>
              <CardContent>
                {detail.pendingAssignments.length === 0 ? (
                  <p className="text-sm text-emerald-200">تمام مراحل تکمیل شده است.</p>
                ) : (
                  <ul className="space-y-2 text-sm text-white/90">
                    {detail.pendingAssignments.map((assignment, index) => (
                      <li key={`pending-${assignment.questionnaire_id}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <p className="font-semibold">{assignment.questionnaire_title}</p>
                        <p className="text-xs text-white/60">{assignment.category || "بدون دسته‌بندی"}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="py-16 text-center text-white/70">
            برای مشاهده جزئیات، یکی از کاربران را از جدول بالا انتخاب کنید.
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminFinalReports;
