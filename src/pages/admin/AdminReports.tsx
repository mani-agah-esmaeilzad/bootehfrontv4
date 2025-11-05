// src/pages/admin/AdminReports.tsx

import { useEffect, useMemo, useState } from "react";
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

interface AssessmentReport {
    assessment_id: number;
    user_id: number;
    username: string;
    first_name: string;
    last_name: string;
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

            <section className="grid gap-6 lg:grid-cols-5">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>پراکندگی گزارش‌ها بر اساس پرسشنامه</CardTitle>
                        <CardDescription>حجم ارزیابی‌های تکمیل‌شده برای هر پرسشنامه فعال.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                        {questionnaireChartData.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                داده‌ای برای نمایش وجود ندارد.
                            </div>
                        ) : (
                            <ResponsiveContainer>
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
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>وضعیت گزارش‌ها</CardTitle>
                        <CardDescription>رصد سریع چرخهٔ ارزیابی‌ها در وضعیت‌های مختلف.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                        {statusChartData.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                داده‌ای برای نمایش وجود ندارد.
                            </div>
                        ) : (
                            <ResponsiveContainer>
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
