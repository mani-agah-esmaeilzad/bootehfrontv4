// src/pages/admin/AdminReports.tsx

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoaderCircle, ArrowLeft, BarChart, Trash2 } from "lucide-react";
import {
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Tooltip as RechartsTooltip,
} from "recharts";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import apiFetch from "@/services/apiService";

interface AssessmentReport {
    assessment_id: number;
    user_id: number;
    username: string;
    first_name: string;
    last_name: string;
    questionnaire_title: string;
    completed_at: string | null; // The API can still theoretically send null
}

const AdminReports = () => {
    const [reports, setReports] = useState<AssessmentReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState<number | null>(null);
    const [deletingReportId, setDeletingReportId] = useState<number | null>(null);
    const navigate = useNavigate();

    const powerWheelCategories = [
        { key: "Teamwork", label: "Teamwork", color: "#f97316" },
        { key: "Communication", label: "Communication", color: "#22c55e" },
        { key: "CognitiveAbilities", label: "Cognitive Abilities", color: "#0ea5e9" },
        { key: "WorkEthic", label: "Work Ethic", color: "#facc15" },
        { key: "ProblemSolving", label: "Problem Solving", color: "#ec4899" },
        { key: "Leadership", label: "Leadership", color: "#6366f1" },
    ];

    const powerWheelDimensions = [
        { dimension: "Team Collaboration", category: "Teamwork", score: 82 },
        { dimension: "Conflict Management", category: "Teamwork", score: 76 },
        { dimension: "Relationship Building", category: "Teamwork", score: 88 },
        { dimension: "Active Listening", category: "Communication", score: 91 },
        { dimension: "Presentation Skills", category: "Communication", score: 84 },
        { dimension: "Feedback Delivery", category: "Communication", score: 79 },
        { dimension: "Analytical Thinking", category: "CognitiveAbilities", score: 86 },
        { dimension: "Strategic Planning", category: "CognitiveAbilities", score: 90 },
        { dimension: "Learning Agility", category: "CognitiveAbilities", score: 83 },
        { dimension: "Time Management", category: "WorkEthic", score: 88 },
        { dimension: "Reliability", category: "WorkEthic", score: 81 },
        { dimension: "Accountability", category: "WorkEthic", score: 85 },
        { dimension: "Creativity", category: "ProblemSolving", score: 87 },
        { dimension: "Critical Thinking", category: "ProblemSolving", score: 92 },
        { dimension: "Decision Making", category: "ProblemSolving", score: 78 },
        { dimension: "Vision Setting", category: "Leadership", score: 93 },
        { dimension: "Change Management", category: "Leadership", score: 89 },
        { dimension: "Coaching", category: "Leadership", score: 81 },
    ];

    const powerWheelData = powerWheelDimensions.map((dimension) => {
        const baseEntry = { dimension: dimension.dimension } as Record<string, number | string>;
        powerWheelCategories.forEach((category) => {
            baseEntry[category.key] = category.key === dimension.category ? dimension.score : 0;
        });
        return baseEntry;
    });

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setIsLoading(true);
        try {
            const response = await apiFetch('admin/reports');
            if (response.success) {
                setReports(response.data);
            } else {
                throw new Error(response.message);
            }
        } catch (error: any) {
            toast.error("خطا در دریافت لیست گزارش‌ها: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = async (userId: number, username: string) => {
        setIsDownloading(userId);
        toast.info(`در حال آماده‌سازی خروجی اکسل برای کاربر ${username}...`);
        // Placeholder for export logic
        setTimeout(() => setIsDownloading(null), 2000);
    };

    const handleDeleteReport = async (reportId: number, fullName: string) => {
        if (!window.confirm(`آیا از حذف گزارش مربوط به «${fullName}» اطمینان دارید؟ این کار قابل بازگشت نیست.`)) {
            return;
        }

        setDeletingReportId(reportId);
        const previousReports = [...reports];
        setReports((prev) => prev.filter((report) => report.assessment_id !== reportId));

        try {
            const response = await apiFetch(`admin/reports/${reportId}`, {
                method: 'DELETE',
            });
            if (!response.success) {
                throw new Error(response.message || 'حذف گزارش موفق نبود.');
            }
            toast.success('گزارش با موفقیت حذف شد.');
        } catch (error: any) {
            toast.error(error.message || 'خطا در حذف گزارش');
            setReports(previousReports);
        } finally {
            setDeletingReportId(null);
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between gap-4">
                <h1 className="text-3xl font-bold">گزارش‌های ارزیابی</h1>
                <Button onClick={() => navigate('/admin/dashboard')} variant="outline">
                    <ArrowLeft className="ml-2 h-4 w-4" />
                    بازگشت به داشبورد
                </Button>
            </header>
            <Card>
                <CardHeader>
                    <CardTitle>Power Wheel Performance Overview</CardTitle>
                    <CardDescription>
                        نسخه نمایشی از نحوه توزیع عملکرد کاربران در ۱۸ مهارت کلیدی در شش حوزه توانمندی.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
                    <div className="h-[420px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={powerWheelData} outerRadius="75%">
                                <PolarGrid strokeDasharray="3 6" />
                                <PolarAngleAxis
                                    dataKey="dimension"
                                    tick={{ fill: "#475569", fontSize: 11 }}
                                />
                                <PolarRadiusAxis
                                    angle={90}
                                    domain={[0, 100]}
                                    stroke="#cbd5f5"
                                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                                />
                                {powerWheelCategories.map((category) => (
                                    <Radar
                                        key={category.key}
                                        name={category.label}
                                        dataKey={category.key}
                                        stroke={category.color}
                                        fill={category.color}
                                        fillOpacity={0.2}
                                        strokeWidth={2}
                                    />
                                ))}
                                <RechartsTooltip
                                    formatter={(value: number, _name, item) => {
                                        if (typeof value !== "number" || value === 0 || !item) return null;
                                        const categoryLabel = powerWheelCategories.find((cat) => cat.key === item.dataKey)?.label;
                                        return [`${value} از ۱۰۰`, categoryLabel];
                                    }}
                                    labelFormatter={(label) => `مهارت: ${label}`}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            این نمودار برای تست رابط کاربری تهیه شده است و داده‌ها حالت نمونه دارند تا نحوه نمایش
                            ۱۸ بعد را روی شعاع چرخ قدرت نشان دهند. هر ناحیه رنگی معرف یکی از حوزه‌های توانمندی است.
                        </p>
                        <div className="grid grid-cols-1 gap-3">
                            {powerWheelCategories.map((category) => (
                                <div key={category.key} className="flex items-center gap-3 rounded-md border px-3 py-2">
                                    <span
                                        className="h-3 w-3 rounded-full"
                                        style={{ backgroundColor: category.color }}
                                        aria-hidden
                                    />
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{category.label}</p>
                                        <p className="text-xs text-muted-foreground">
                                            میانگین امتیازات ثبت شده برای مهارت‌های مرتبط با این حوزه.
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>ارزیابی‌های تکمیل شده</CardTitle>
                    <CardDescription>لیست تمام ارزیابی‌هایی که توسط کاربران به اتمام رسیده‌اند.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-16"><LoaderCircle className="mx-auto h-12 w-12 animate-spin text-gray-400" /></div>
                    ) : (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>نام کاربر</TableHead>
                                        <TableHead>عنوان پرسشنامه</TableHead>
                                        <TableHead>تاریخ تکمیل</TableHead>
                                        <TableHead className="text-center">عملیات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reports.length > 0 ? reports.map((report) => (
                                        <TableRow key={report.assessment_id}>
                                            <TableCell>
                                                <div className="font-medium">{report.first_name} {report.last_name}</div>
                                                <div className="text-sm text-muted-foreground">{report.username}</div>
                                            </TableCell>
                                            <TableCell>{report.questionnaire_title}</TableCell>
                                            <TableCell>
                                                {/* *** FINAL FIX: Handles null dates gracefully *** */}
                                                {report.completed_at
                                                    ? new Date(report.completed_at).toLocaleDateString('fa-IR', { day: '2-digit', month: 'long', year: 'numeric' })
                                                    : <span className="text-xs text-gray-500">—</span>
                                                }
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={deletingReportId === report.assessment_id}
                                                        onClick={() => navigate(`/admin/reports/${report.assessment_id}`)}
                                                    >
                                                        <BarChart className="ml-2 h-4 w-4" />
                                                        مشاهده جزئیات
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        className="gap-2"
                                                        disabled={deletingReportId === report.assessment_id}
                                                        onClick={() => handleDeleteReport(report.assessment_id, `${report.first_name} ${report.last_name}`.trim() || report.username)}
                                                    >
                                                        {deletingReportId === report.assessment_id ? (
                                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                        حذف
                                                    </Button>
                                                </div>
                                                {/* <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="mr-2"
                                                    disabled={isDownloading === report.user_id}
                                                    onClick={() => handleExport(report.user_id, report.username)}>
                                                    {isDownloading === report.user_id ? <LoaderCircle className="ml-2 h-4 w-4 animate-spin" /> : <Download className="ml-2 h-4 w-4" />}
                                                    خروجی اکسل
                                                </Button> */}
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                هیچ گزارش تکمیل شده‌ای یافت نشد.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminReports;
