// src/pages/admin/AdminReports.tsx

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { toast } from "sonner";
import { ArrowLeft, BarChart as BarChartIcon, LoaderCircle, RefreshCw, Search, Trash2 } from "lucide-react";
import apiFetch, { adminGetReportsOverview } from "@/services/apiService";
import { ComparisonSpiderChart } from "@/components/ui/ComparisonSpiderChart";

const persianDigitMap: Record<string, string> = {
    "۰": "0",
    "۱": "1",
    "۲": "2",
    "۳": "3",
    "۴": "4",
    "۵": "5",
    "۶": "6",
    "۷": "7",
    "۸": "8",
    "۹": "9",
};

const toNum = (val: any): number => {
    if (typeof val === "number" && Number.isFinite(val)) return val;
    if (val === null || val === undefined) return 0;
    let str = String(val).trim();
    if (!str) return 0;
    str = str.replace(/[۰-۹]/g, (digit) => persianDigitMap[digit] ?? digit);
    str = str.replace(/,/g, "").replace(/%/g, "");
    str = str.replace(/[^\d.-]/g, "");
    const parsed = Number(str);
    return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeKey = (key: string) => key.toLowerCase().replace(/[\s_-]+/g, "");
const resolveAnalysisField = (source: Record<string, any>, candidates: string[]) => {
    if (!source || typeof source !== "object") return undefined;
    const normalizedMap = new Map<string, string>();
    Object.keys(source).forEach((key) => normalizedMap.set(normalizeKey(key), key));
    for (const candidate of candidates) {
        const normalized = normalizeKey(candidate);
        if (normalizedMap.has(normalized)) return source[normalizedMap.get(normalized)!];
    }
    return undefined;
};

const parseArrayLike = (input: unknown): unknown[] => {
    if (Array.isArray(input)) return input;
    if (typeof input === "string") {
        const trimmed = input.trim();
        if (
            (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
            (trimmed.startsWith("{") && trimmed.endsWith("}"))
        ) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) return parsed;
            } catch {
                return [];
            }
        }
    }
    return [];
};

const extractLooseJsonBlock = (source: string, label: string) => {
    const idx = source.toLowerCase().indexOf(label.toLowerCase());
    if (idx === -1) return undefined;
    const afterLabel = source.slice(idx + label.length);
    const bracketIndex = afterLabel.indexOf("[");
    const braceIndex = afterLabel.indexOf("{");
    const hasBracket = bracketIndex !== -1;
    const hasBrace = braceIndex !== -1;
    let startOffset = -1;
    let openChar: "[" | "{" | null = null;
    if (hasBracket && (!hasBrace || bracketIndex < braceIndex)) {
        startOffset = bracketIndex;
        openChar = "[";
    } else if (hasBrace) {
        startOffset = braceIndex;
        openChar = "{";
    }
    if (startOffset === -1 || !openChar) return undefined;
    const closeChar = openChar === "[" ? "]" : "}";
    let depth = 0;
    for (let i = idx + label.length + startOffset; i < source.length; i += 1) {
        const char = source[i];
        if (char === openChar) depth += 1;
        else if (char === closeChar) depth -= 1;
        if (depth === 0) {
            const block = source.slice(idx + label.length + startOffset, i + 1);
            try {
                return JSON.parse(block);
            } catch {
                return undefined;
            }
        }
    }
    return undefined;
};

const parseLooseAnalysisString = (raw: string) => {
    const blocks: Record<string, string> = {
        keyword_analysis: "Keyword Analysis",
        verbosity_trend: "Verbosity Trend",
        action_orientation: "Action Orientation",
        problem_solving_approach: "Problem Solving Approach",
        communication_style: "Communication Style",
        linguistic_semantic_analysis: "Linguistic Semantic Analysis",
        factor_scatter: "Factor Scatter",
        factor_contribution: "Factor Contribution",
        factor_scores: "Factor Scores",
        sentiment_analysis: "Sentiment Analysis",
    };
    const result: Record<string, unknown> = {};
    for (const [key, label] of Object.entries(blocks)) {
        const parsed = extractLooseJsonBlock(raw, label);
        if (parsed !== undefined) {
            result[key] = parsed;
        }
    }
    return result;
};

const hydrateAnalysis = (raw: any) => {
    let base: Record<string, any> =
        typeof raw === "string"
            ? parseLooseAnalysisString(raw)
            : raw && typeof raw === "object"
                ? { ...raw }
                : {};

    const additional = base?.additional_details;
    if (typeof additional === "string") {
        const parsed = parseLooseAnalysisString(additional);
        Object.entries(parsed).forEach(([key, value]) => {
            if (base[key] === undefined) {
                base[key] = value;
            }
        });
    }

    const normalizeField = (key: string, value: unknown) => {
        if (value === undefined || value === null) return;
        base[key] = value;
    };

    const normalizedKeys = Object.keys(base).reduce<Record<string, unknown>>((acc, key) => {
        acc[normalizeKey(key)] = base[key];
        return acc;
    }, {});

    const aliasPairs: Record<string, string[]> = {
        factor_scores: ["factorscores", "factorscore", "factors", "scores"],
    };

    Object.entries(aliasPairs).forEach(([target, aliases]) => {
        for (const alias of aliases) {
            if (normalizedKeys[alias] !== undefined && base[target] === undefined) {
                base[target] = normalizedKeys[alias];
                break;
            }
        }
    });

    const fixToArray = (fieldName: string) => {
        const val = base[fieldName];
        if (val && !Array.isArray(val) && typeof val === "object") {
            base[fieldName] = Object.entries(val).map(([key, value]) => {
                const score = toNum(value);
                const maxScore = 5;
                return {
                    factor: key,
                    name: key,
                    subject: key,
                    score,
                    maxScore,
                    fullMark: maxScore,
                    size: score,
                    value: score,
                };
            });
        }
    };

    fixToArray("factor_scores");

    return base;
};

const normalizeFactorEntries = (input: unknown): any[] => {
    const candidateArray = parseArrayLike(input);
    if (!Array.isArray(candidateArray)) return [];

    return candidateArray
        .map((entry, index) => {
            if (entry && typeof entry === "object") {
                const record = entry as Record<string, unknown>;

                const name =
                    (record.subject as string) ||
                    (record.factor as string) ||
                    (record.name as string) ||
                    (record.label as string) ||
                    `فاکتور ${index + 1}`;

                const score = toNum(
                    record.score ??
                    record.value ??
                    record.actual ??
                    record.current ??
                    record.raw ??
                    record.scoreValue
                );

        const fullMark =
          toNum(
            record.maxScore ??
              (record as Record<string, unknown>).max_score ??
              record.fullMark ??
              record.target ??
              record.max ??
              5,
          ) || 5;

                return {
                    name,
                    subject: name,
                    score,
                    fullMark,
                    size: score,
                    value: score,
                };
            }

            const scoreValue = toNum(entry);
            return {
                name: `فاکتور ${index + 1}`,
                subject: `فاکتور ${index + 1}`,
                score: scoreValue,
                fullMark: 5,
                size: scoreValue,
                value: scoreValue,
            };
        })
        .filter((item) => Number.isFinite(item.score));
};

interface AssessmentReport {
    assessment_id: number;
    user_id: number;
    username: string;
    first_name: string;
    last_name: string;
    questionnaire_id: number;
    questionnaire_title: string;
    status: string;
    completed_at: string | null;
}

interface ReportsOverview {
    totals: {
        totalCompleted: number;
        uniqueUsers: number;
        questionnaireCount: number;
        lastCompletedAt: string | null;
    };
    statusBreakdown: { status: string; total: number }[];
    assessmentsByQuestionnaire: { id: number; title: string; total: number }[];
    recentAssessments: {
        assessmentId: number;
        username: string;
        firstName: string;
        lastName: string;
        questionnaireTitle: string;
        completedAt: string | null;
    }[];
}

interface ComparisonDetail {
    assessmentId: number;
    displayName: string;
    username: string;
    questionnaireTitle: string;
    completedAt: string | null;
    score: number;
    factorScores: { factor: string; score: number; maxScore: number }[];
}

const statusLabels: Record<string, string> = {
    completed: "تکمیل‌شده",
    "in-progress": "در حال انجام",
    cancelled: "لغو‌شده",
};

const statusColors: Record<string, string> = {
    completed: "#22c55e",
    "in-progress": "#6366f1",
    cancelled: "#f97316",
};

const formatDate = (value: string | null | undefined) => {
    if (!value) return "—";
    try {
        return new Date(value).toLocaleString("fa-IR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return "—";
    }
};

const AdminReports = () => {
    const navigate = useNavigate();

    const [reports, setReports] = useState<AssessmentReport[]>([]);
    const [overview, setOverview] = useState<ReportsOverview | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOverviewLoading, setIsOverviewLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<string>("all");
    const [deletingReportId, setDeletingReportId] = useState<number | null>(null);
    const [compareQuestionnaireId, setCompareQuestionnaireId] = useState<number | null>(null);
    const [selectedCompareIds, setSelectedCompareIds] = useState<{ primary: number | null; secondary: number | null }>({
        primary: null,
        secondary: null,
    });
    const [compareDetails, setCompareDetails] = useState<Record<number, ComparisonDetail>>({});
    const [compareLoadingId, setCompareLoadingId] = useState<number | null>(null);
    const [compareError, setCompareError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        setIsOverviewLoading(true);
        try {
            const [reportsResponse, overviewResponse] = await Promise.all([
                apiFetch('admin/reports'),
                adminGetReportsOverview(),
            ]);

            if (reportsResponse.success) {
                setReports(reportsResponse.data);
            } else {
                throw new Error(reportsResponse.message);
            }

            if (overviewResponse.success) {
                setOverview(overviewResponse.data);
            } else {
                throw new Error(overviewResponse.message);
            }
        } catch (error: any) {
            toast.error(error.message || "خطا در دریافت اطلاعات گزارش");
        } finally {
            setIsLoading(false);
            setIsOverviewLoading(false);
        }
    };

    const questionnaireOptions = useMemo(() => {
        const fromOverview = overview?.assessmentsByQuestionnaire?.map((item) => item.title) ?? [];
        const fromReports = reports.map((report) => report.questionnaire_title);
        const unique = Array.from(new Set([...fromOverview, ...fromReports])).filter(Boolean);
        return unique.sort((a, b) => a.localeCompare(b, "fa"));
    }, [overview, reports]);

    const comparisonQuestionnaireOptions = useMemo(() => {
        const map = new Map<number, string>();
        reports.forEach((report) => {
            if (!map.has(report.questionnaire_id)) {
                map.set(report.questionnaire_id, report.questionnaire_title);
            }
        });
        return Array.from(map.entries())
            .map(([id, title]) => ({ id, title }))
            .sort((a, b) => a.title.localeCompare(b.title, "fa"));
    }, [reports]);

    useEffect(() => {
        if (comparisonQuestionnaireOptions.length === 0) {
            setCompareQuestionnaireId(null);
            setSelectedCompareIds({ primary: null, secondary: null });
            return;
        }
        setCompareQuestionnaireId((prev) => {
            if (prev && comparisonQuestionnaireOptions.some((item) => item.id === prev)) {
                return prev;
            }
            return comparisonQuestionnaireOptions[0].id;
        });
    }, [comparisonQuestionnaireOptions]);

    useEffect(() => {
        setSelectedCompareIds({ primary: null, secondary: null });
        setCompareError(null);
    }, [compareQuestionnaireId]);

    const filteredReports = useMemo(() => {
        return reports.filter((report) => {
            const matchesQuestionnaire =
                selectedQuestionnaire === "all" || report.questionnaire_title === selectedQuestionnaire;
            const fullName = `${report.first_name ?? ""} ${report.last_name ?? ""}`.trim();
            const matchesSearch = searchTerm
                ? report.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  report.questionnaire_title.toLowerCase().includes(searchTerm.toLowerCase())
                : true;
            return matchesQuestionnaire && matchesSearch;
        });
    }, [reports, selectedQuestionnaire, searchTerm]);

    const comparisonCandidates = useMemo(() => {
        if (!compareQuestionnaireId) return [];
        return reports
            .filter((report) => report.questionnaire_id === compareQuestionnaireId)
            .sort((a, b) => {
                const dateA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
                const dateB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
                return dateB - dateA;
            });
    }, [reports, compareQuestionnaireId]);

    const fetchComparisonDetail = useCallback(async (assessmentId: number) => {
        if (compareDetails[assessmentId]) {
            return compareDetails[assessmentId];
        }
        setCompareLoadingId(assessmentId);
        try {
            const response = await apiFetch(`admin/reports/${assessmentId}`);
            if (!response.success || !response.data) {
                throw new Error(response.message || "دریافت داده‌های مقایسه ممکن نشد.");
            }
            const detailData = response.data;
            const hydrated = hydrateAnalysis(detailData.analysis || {});
            const factorSource =
                resolveAnalysisField(hydrated, ["factor_scores", "factor score", "factor-score"]) ??
                hydrated.factor_scores;
            const normalizedFactors = normalizeFactorEntries(factorSource);
            const factorScores = normalizedFactors.map((entry: any) => ({
                factor: entry.name ?? entry.subject ?? "مولفه ناشناس",
                score: toNum(entry.score),
                maxScore: toNum(entry.fullMark ?? entry.maxScore ?? 5) || 5,
            }));

            const rawScore =
                hydrated.score ??
                hydrated.overall_score ??
                hydrated.total_score ??
                detailData.analysis?.score ??
                detailData.analysis?.overall_score ??
                0;

            const detail: ComparisonDetail = {
                assessmentId,
                displayName: `${detailData.firstName ?? ""} ${detailData.lastName ?? ""}`.trim() || detailData.username,
                username: detailData.username,
                questionnaireTitle: detailData.questionnaire_title,
                completedAt: detailData.completed_at ?? null,
                score: toNum(rawScore),
                factorScores,
            };
            setCompareDetails((prev) => ({ ...prev, [assessmentId]: detail }));
            return detail;
        } catch (error: any) {
            const message = error?.message || "دریافت داده‌های مقایسه با مشکل مواجه شد.";
            setCompareError(message);
            toast.error(message);
            throw error;
        } finally {
            setCompareLoadingId((current) => (current === assessmentId ? null : current));
        }
    }, [compareDetails]);

    const handleCompareSelection = useCallback(
        (slot: "primary" | "secondary", rawValue: string) => {
            const parsedValue = rawValue === "none" ? null : Number(rawValue);
            setCompareError(null);
            setSelectedCompareIds((prev) => {
                const next = { ...prev };
                if (slot === "primary") {
                    next.primary = parsedValue;
                    if (parsedValue && parsedValue === prev.secondary) {
                        next.secondary = null;
                    }
                } else {
                    next.secondary = parsedValue;
                    if (parsedValue && parsedValue === prev.primary) {
                        next.primary = null;
                    }
                }
                return next;
            });
            if (parsedValue) {
                fetchComparisonDetail(parsedValue);
            }
        },
        [fetchComparisonDetail]
    );

    const primaryDetail = selectedCompareIds.primary
        ? compareDetails[selectedCompareIds.primary] ?? null
        : null;
    const secondaryDetail = selectedCompareIds.secondary
        ? compareDetails[selectedCompareIds.secondary] ?? null
        : null;

    const comparisonChartData = useMemo(() => {
        const activeEntries: Array<{
            key: "primary" | "secondary";
            color: string;
            detail: ComparisonDetail;
        }> = [];
        if (primaryDetail) {
            activeEntries.push({ key: "primary", color: "#6366F1", detail: primaryDetail });
        }
        if (secondaryDetail) {
            activeEntries.push({ key: "secondary", color: "#F97316", detail: secondaryDetail });
        }
        if (activeEntries.length === 0) return null;

        const factorNames = new Set<string>();
        activeEntries.forEach(({ detail }) => {
            detail.factorScores.forEach((item) => factorNames.add(item.factor));
        });
        if (factorNames.size === 0) return null;

        const data = Array.from(factorNames).map((name) => {
            const entry: Record<string, number | string | undefined> = { subject: name };
            let maxScore = 0;
            activeEntries.forEach(({ key, detail }) => {
                const found = detail.factorScores.find((item) => item.factor === name);
                if (found) {
                    entry[key] = found.score ?? 0;
                    maxScore = Math.max(maxScore, found.maxScore ?? 0);
                } else {
                    entry[key] = 0;
                }
            });
            entry.fullMark = maxScore || undefined;
            return entry;
        });

        const maxDomain = Math.max(
            5,
            ...data.flatMap((entry) =>
                activeEntries.map(({ key }) => (typeof entry[key] === "number" ? Number(entry[key]) : 0))
            ),
            ...data.map((entry) => (typeof entry.fullMark === "number" ? Number(entry.fullMark) : 0))
        );

        return {
            data,
            maxDomain,
            series: activeEntries.map(({ key, color, detail }) => ({
                key,
                color,
                label: detail.displayName,
            })),
        };
    }, [primaryDetail, secondaryDetail]);

    const handleDeleteReport = async (reportId: number, fullName: string) => {
        if (!window.confirm(`آیا از حذف گزارش مربوط به «${fullName}» اطمینان دارید؟ این کار قابل بازگشت نیست.`)) {
            return;
        }

        setDeletingReportId(reportId);
        const previousReports = [...reports];
        setReports((prev) => prev.filter((item) => item.assessment_id !== reportId));

        try {
            const response = await apiFetch(`admin/reports/${reportId}`, { method: 'DELETE' });
            if (!response.success) {
                throw new Error(response.message || 'حذف گزارش موفق نبود.');
            }
            toast.success('گزارش با موفقیت حذف شد.');
            // پس از حذف موفق، نمای کلی را هم تازه می‌کنیم
            await loadData();
        } catch (error: any) {
            toast.error(error.message || 'خطا در حذف گزارش');
            setReports(previousReports);
        } finally {
            setDeletingReportId(null);
        }
    };

    const statusChartData = useMemo(() => {
        return (overview?.statusBreakdown || []).map((item) => ({
            name: statusLabels[item.status] || item.status,
            value: item.total,
            rawStatus: item.status,
        }));
    }, [overview]);

    const questionnaireChartData = useMemo(() => {
        return (overview?.assessmentsByQuestionnaire || []).map((item) => ({
            name: item.title,
            total: item.total,
        }));
    }, [overview]);

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">گزارش‌های ارزیابی</h1>
                    <p className="text-sm text-muted-foreground">بر عملکرد آزمون‌ها، کاربران و وضعیت ارزیابی‌ها نظارت کنید.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
                        <ArrowLeft className="ml-2 h-4 w-4" /> بازگشت به داشبورد
                    </Button>
                    <Button variant="secondary" onClick={loadData} disabled={isLoading || isOverviewLoading}>
                        {(isLoading || isOverviewLoading) ? (
                            <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="ml-2 h-4 w-4" />
                        )}
                        به‌روزرسانی داده‌ها
                    </Button>
                </div>
            </header>

            <section>
                <Card>
                    <CardHeader>
                        <CardTitle>شاخص‌های کلیدی</CardTitle>
                        <CardDescription>چکیده‌ای از وضعیت ارزیابی‌ها در یک نگاه.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isOverviewLoading && !overview ? (
                            <div className="flex items-center justify-center py-16">
                                <LoaderCircle className="h-10 w-10 animate-spin text-muted-foreground" />
                            </div>
                        ) : overview ? (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <Card className="border-dashed border-slate-200 bg-slate-50">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-muted-foreground">گزارش‌های تکمیل‌شده</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold text-slate-900">{overview.totals.totalCompleted}</p>
                                    </CardContent>
                                </Card>
                                <Card className="border-dashed border-slate-200 bg-slate-50">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-muted-foreground">کاربران یکتا</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold text-slate-900">{overview.totals.uniqueUsers}</p>
                                    </CardContent>
                                </Card>
                                <Card className="border-dashed border-slate-200 bg-slate-50">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-muted-foreground">تعداد پرسشنامه‌ها</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold text-slate-900">{overview.totals.questionnaireCount}</p>
                                    </CardContent>
                                </Card>
                                <Card className="border-dashed border-slate-200 bg-slate-50">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-muted-foreground">آخرین گزارش ثبت شده</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-slate-700">{formatDate(overview.totals.lastCompletedAt)}</p>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <p className="py-6 text-center text-sm text-muted-foreground">اطلاعاتی برای نمایش وجود ندارد.</p>
                        )}
                    </CardContent>
                </Card>
            </section>

            <section>
                <Card>
                    <CardHeader>
                        <CardTitle>مقایسه شرکت‌کنندگان در نمودار عنکبوتی</CardTitle>
                        <CardDescription>دو گزارش از یک پرسشنامه را انتخاب کنید و عملکرد آن‌ها را بر اساس مولفه‌های مشترک مقایسه کنید.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">پرسشنامه</label>
                                <Select
                                    value={compareQuestionnaireId ? String(compareQuestionnaireId) : "none"}
                                    onValueChange={(value) => setCompareQuestionnaireId(value === "none" ? null : Number(value))}
                                    disabled={comparisonQuestionnaireOptions.length === 0}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="انتخاب پرسشنامه" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {comparisonQuestionnaireOptions.length === 0 ? (
                                            <SelectItem value="none" disabled>
                                                هنوز گزارشی ثبت نشده است
                                            </SelectItem>
                                        ) : (
                                            comparisonQuestionnaireOptions.map((option) => (
                                                <SelectItem key={option.id} value={String(option.id)}>
                                                    {option.title}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">شرکت‌کننده اول</label>
                                <Select
                                    value={selectedCompareIds.primary ? String(selectedCompareIds.primary) : "none"}
                                    onValueChange={(value) => handleCompareSelection("primary", value)}
                                    disabled={!compareQuestionnaireId || comparisonCandidates.length === 0}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="انتخاب شرکت‌کننده اول" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">انتخاب نشده</SelectItem>
                                        {comparisonCandidates.map((candidate) => {
                                            const fullName = `${candidate.first_name ?? ""} ${candidate.last_name ?? ""}`.trim() || candidate.username;
                                            return (
                                                <SelectItem
                                                    key={candidate.assessment_id}
                                                    value={String(candidate.assessment_id)}
                                                    disabled={candidate.assessment_id === selectedCompareIds.secondary}
                                                >
                                                    {fullName} ({candidate.username})
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">شرکت‌کننده دوم</label>
                                <Select
                                    value={selectedCompareIds.secondary ? String(selectedCompareIds.secondary) : "none"}
                                    onValueChange={(value) => handleCompareSelection("secondary", value)}
                                    disabled={!compareQuestionnaireId || comparisonCandidates.length === 0}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="انتخاب شرکت‌کننده دوم" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">انتخاب نشده</SelectItem>
                                        {comparisonCandidates.map((candidate) => {
                                            const fullName = `${candidate.first_name ?? ""} ${candidate.last_name ?? ""}`.trim() || candidate.username;
                                            return (
                                                <SelectItem
                                                    key={`${candidate.assessment_id}-second`}
                                                    value={String(candidate.assessment_id)}
                                                    disabled={candidate.assessment_id === selectedCompareIds.primary}
                                                >
                                                    {fullName} ({candidate.username})
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {compareError && (
                            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                                {compareError}
                            </div>
                        )}

                        {(!compareQuestionnaireId || comparisonCandidates.length < 2) && (
                            <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center text-sm text-slate-600">
                                برای این پرسشنامه حداقل دو گزارش تکمیل‌شده لازم است تا امکان مقایسه فراهم شود.
                            </div>
                        )}

                        {compareQuestionnaireId && comparisonCandidates.length >= 2 && (
                            <>
                                {comparisonChartData ? (
                                    <div className="grid gap-6 lg:grid-cols-3">
                                        <div className="space-y-4">
                                            {[{ label: "شرکت‌کننده اول", detail: primaryDetail, selected: Boolean(selectedCompareIds.primary) },
                                              { label: "شرکت‌کننده دوم", detail: secondaryDetail, selected: Boolean(selectedCompareIds.secondary) }].map(
                                                ({ label, detail, selected }) => (
                                                    <div
                                                        key={label}
                                                        className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 shadow-sm"
                                                    >
                                                        <p className="text-xs font-semibold text-slate-500">{label}</p>
                                                        {selected ? (
                                                            detail ? (
                                                                <>
                                                                    <p className="text-base font-bold text-slate-900">{detail.displayName}</p>
                                                                    <p className="text-xs text-slate-500">{detail.username}</p>
                                                                    <div className="mt-3 text-sm text-slate-700">
                                                                        امتیاز کل: <span className="font-semibold">{detail.score}</span>
                                                                    </div>
                                                                    <p className="text-xs text-slate-500">{formatDate(detail.completedAt)}</p>
                                                                </>
                                                            ) : (
                                                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                                                    در حال بارگذاری اطلاعات...
                                                                </div>
                                                            )
                                                        ) : (
                                                            <p className="text-xs text-slate-500">شرکت‌کننده‌ای انتخاب نشده است</p>
                                                        )}
                                                    </div>
                                                )
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-slate-600 hover:text-slate-900"
                                                onClick={() => setSelectedCompareIds({ primary: null, secondary: null })}
                                            >
                                                پاک‌سازی انتخاب‌ها
                                            </Button>
                                        </div>
                                        <div className="lg:col-span-2">
                                            <div className="relative rounded-3xl border border-slate-200 bg-slate-900/90 p-4 shadow-inner min-h-[360px]">
                                                {compareLoadingId && (
                                                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-slate-900/60 backdrop-blur">
                                                        <LoaderCircle className="h-8 w-8 animate-spin text-white" />
                                                    </div>
                                                )}
                                                <ComparisonSpiderChart
                                                    data={comparisonChartData.data}
                                                    series={comparisonChartData.series}
                                                    maxDomain={comparisonChartData.maxDomain}
                                                />
                                            </div>
                                            {comparisonChartData.series.length === 1 && (
                                                <p className="pt-3 text-xs text-slate-400">
                                                    برای مقایسه نفر دوم، یک شرکت‌کننده دیگر را نیز انتخاب کنید.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-md border border-dashed border-slate-200 p-6 text-center text-sm text-slate-600">
                                        {compareLoadingId ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <LoaderCircle className="h-4 w-4 animate-spin" />
                                                در حال بارگذاری داده‌های مقایسه...
                                            </div>
                                        ) : selectedCompareIds.primary || selectedCompareIds.secondary ? (
                                            "برای نمایش نمودار، منتظر بمانید تا داده‌های شرکت‌کننده انتخاب شده بارگذاری شود."
                                        ) : (
                                            "برای مشاهده نمودار، حداقل یک شرکت‌کننده را انتخاب کنید."
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </section>

            <section className="flex flex-col gap-6 lg:flex-row lg:flex-nowrap">
                <Card className="lg:flex-1 lg:min-w-0">
                    <CardHeader>
                        <CardTitle>پراکندگی گزارش‌ها بر اساس پرسشنامه</CardTitle>
                        <CardDescription>حجم ارزیابی‌های تکمیل‌شده برای هر پرسشنامه فعال.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[440px]">
                        {questionnaireChartData.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                داده‌ای برای نمایش وجود ندارد.
                            </div>
                        ) : (
                            <ResponsiveContainer className="chart-ltr">
                                <BarChart data={questionnaireChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={80} />
                                    <YAxis allowDecimals={false} />
                                    <RechartsTooltip formatter={(value: number) => [`${value} گزارش`, "تعداد"]} />
                                    <Bar dataKey="total" radius={8} fill="#6366f1" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
                <Card className="lg:flex-1 lg:min-w-0">
                    <CardHeader>
                        <CardTitle>وضعیت گزارش‌ها</CardTitle>
                        <CardDescription>رصد سریع چرخهٔ ارزیابی‌ها در وضعیت‌های مختلف.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[440px]">
                        {statusChartData.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                داده‌ای برای نمایش وجود ندارد.
                            </div>
                        ) : (
                            <ResponsiveContainer className="chart-ltr">
                                <PieChart>
                                    <Pie data={statusChartData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                                        {statusChartData.map((entry, index) => (
                                            <Cell key={`cell-${entry.rawStatus}`} fill={statusColors[entry.rawStatus] || ["#6366f1", "#22c55e", "#f97316"][index % 3]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(value: number, name: string) => [`${value} گزارش`, name]} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-3">
                        <CardTitle>گزارش‌های ثبت‌شده</CardTitle>
                        <CardDescription>فهرست ارزیابی‌های تکمیل‌شده به همراه گزینه‌های مدیریتی.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="relative w-full md:max-w-xs">
                                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="جستجو بر اساس نام کاربر یا عنوان پرسشنامه..."
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    className="pr-9"
                                />
                            </div>
                            <div className="w-full md:w-64">
                                <Select value={selectedQuestionnaire} onValueChange={setSelectedQuestionnaire}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="همه پرسشنامه‌ها" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">همه پرسشنامه‌ها</SelectItem>
                                        {questionnaireOptions.map((title) => (
                                            <SelectItem key={title} value={title}>
                                                {title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <LoaderCircle className="h-10 w-10 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredReports.length === 0 ? (
                            <div className="rounded-md border border-dashed border-slate-200 py-16 text-center text-sm text-muted-foreground">
                                هیچ گزارشی با فیلترهای فعلی یافت نشد.
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>کاربر</TableHead>
                                            <TableHead>پرسشنامه</TableHead>
                                            <TableHead className="text-center">وضعیت</TableHead>
                                            <TableHead className="text-center">تاریخ تکمیل</TableHead>
                                            <TableHead className="text-center">عملیات</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredReports.map((report) => {
                                            const fullName = `${report.first_name ?? ''} ${report.last_name ?? ''}`.trim() || report.username;
                                            return (
                                                <TableRow key={report.assessment_id} className="hover:bg-slate-50">
                                                    <TableCell>
                                                        <div className="font-medium text-slate-900">{fullName}</div>
                                                        <div className="text-xs text-muted-foreground">{report.username}</div>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-slate-700">{report.questionnaire_title}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                                                            {statusLabels[report.status] || report.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center text-sm text-slate-600">
                                                        {report.completed_at ? new Date(report.completed_at).toLocaleDateString('fa-IR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={deletingReportId === report.assessment_id}
                                                                onClick={() => navigate(`/admin/reports/${report.assessment_id}`)}
                                                            >
                                                                <BarChartIcon className="ml-2 h-4 w-4" />
                                                                جزئیات
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                className="gap-2"
                                                                disabled={deletingReportId === report.assessment_id}
                                                                onClick={() => handleDeleteReport(report.assessment_id, fullName)}
                                                            >
                                                                {deletingReportId === report.assessment_id ? (
                                                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="h-4 w-4" />
                                                                )}
                                                                حذف
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>آخرین گزارش‌های تکمیل‌شده</CardTitle>
                        <CardDescription>مرور سریع جدیدترین ارزیابی‌های ثبت‌شده.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isOverviewLoading && !overview ? (
                            <div className="flex items-center justify-center py-12">
                                <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : overview && overview.recentAssessments.length > 0 ? (
                            <div className="space-y-3">
                                {overview.recentAssessments.map((item) => {
                                    const fullName = `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim() || item.username;
                                    return (
                                        <div key={item.assessmentId} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <div>
                                                    <p className="font-medium text-slate-900">{fullName}</p>
                                                    <p className="text-xs text-muted-foreground">{item.questionnaireTitle}</p>
                                                </div>
                                                <span className="text-xs text-slate-500">{formatDate(item.completedAt)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="py-6 text-center text-sm text-muted-foreground">هنوز گزارشی ثبت نشده است.</p>
                        )}
                    </CardContent>
                </Card>
            </section>
        </div>
    );
};

export default AdminReports;
