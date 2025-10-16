// src/pages/admin/AdminReports.tsx

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoaderCircle, ArrowLeft, BarChart, Download } from "lucide-react";
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
    const navigate = useNavigate();

    const powerWheelData = [
        { dimension: "بینش فردی", score: 86 },
        { dimension: "رهبری", score: 92 },
        { dimension: "ارتباطات", score: 78 },
        { dimension: "نوآوری", score: 84 },
        { dimension: "مدیریت زمان", score: 73 },
        { dimension: "حل مسئله", score: 88 },
        { dimension: "تصمیم‌گیری", score: 81 },
        { dimension: "انعطاف‌پذیری", score: 76 },
        { dimension: "همکاری", score: 89 },
        { dimension: "هوش هیجانی", score: 94 },
        { dimension: "تفکر استراتژیک", score: 83 },
        { dimension: "اخلاق حرفه‌ای", score: 91 },
        { dimension: "انگیزش", score: 79 },
        { dimension: "برنامه‌ریزی", score: 87 },
        { dimension: "تاب‌آوری", score: 82 },
        { dimension: "مدیریت تعارض", score: 77 },
        { dimension: "هوش فرهنگی", score: 75 },
        { dimension: "یادگیری مستمر", score: 90 },
    ];

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
                    <CardTitle>Power Wheel Overview</CardTitle>
                    <CardDescription>
                        نمای کلی آزمایشی از عملکرد کلی کاربران شرکت‌کننده در ۱۸ بعد کلیدی.
                    </CardDescription>
                </CardHeader>
                <CardContent className="h-[420px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={powerWheelData} outerRadius="80%">
                            <defs>
                                <radialGradient id="powerWheelGradient" cx="50%" cy="50%" r="80%">
                                    <stop offset="0%" stopColor="#c084fc" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.4} />
                                </radialGradient>
                            </defs>
                            <PolarGrid strokeDasharray="4 8" radialLines={false} />
                            <PolarAngleAxis dataKey="dimension" tick={{ fill: "#475569", fontSize: 12 }} />
                            <PolarRadiusAxis
                                angle={90}
                                domain={[0, 100]}
                                tick={{ fill: "#94a3b8", fontSize: 10 }}
                                stroke="#cbd5f5"
                            />
                            <Radar
                                name="امتیاز ترکیبی"
                                dataKey="score"
                                stroke="#7c3aed"
                                strokeWidth={2}
                                fill="url(#powerWheelGradient)"
                                fillOpacity={0.7}
                            />
                            <RechartsTooltip
                                formatter={(value: number) => [`${value} از ۱۰۰`, "امتیاز"]}
                                labelFormatter={(label) => `بعد: ${label}`}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
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
                                                <Button variant="outline" size="sm" onClick={() => navigate(`/admin/reports/${report.assessment_id}`)}>
                                                    <BarChart className="ml-2 h-4 w-4" />
                                                    مشاهده جزئیات
                                                </Button>
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
