// src/pages/admin/AdminPersonalityResults.tsx

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LoaderCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { adminGetPersonalityResults } from "@/services/apiService";

interface PersonaResultRow {
  sessionId: string;
  status: string;
  created_at: string;
  updated_at: string;
  assessment_name: string;
  slug: string;
  report_name: string;
  user: {
    id: number;
    full_name: string;
    email: string;
  };
  results: {
    history?: Array<{ role: string; content: string }>;
    analysis?: Record<string, any>;
  } | null;
}

const AdminPersonalityResults = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState<PersonaResultRow[]>([]);
  const [selected, setSelected] = useState<PersonaResultRow | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await adminGetPersonalityResults();
        if (!response.success) {
          throw new Error(response.message || "خطا در دریافت گزارش‌ها");
        }
        setRows(response.data || []);
      } catch (error: any) {
        toast.error(error.message || "مشکل در دریافت گزارش‌ها");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const formattedRows = useMemo(() => rows, [rows]);

  const formatDate = (value: string) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleString("fa-IR");
    } catch (error) {
      return value;
    }
  };

  const renderAnalysis = (row: PersonaResultRow) => {
    if (!row.results?.analysis) {
      return <p className="text-sm text-slate-500">گزارشی ثبت نشده است.</p>;
    }
    return (
      <div className="space-y-3">
        {Object.entries(row.results.analysis).map(([key, value]) => (
          <div key={key} className="rounded-lg border border-purple-100 bg-slate-50 p-3 text-xs text-slate-700">
            <p className="font-semibold text-purple-700">{key}</p>
            <pre className="mt-1 whitespace-pre-wrap break-words">{JSON.stringify(value, null, 2)}</pre>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">گزارش‌های آزمون شخصیتی</h1>
          <p className="text-sm text-slate-500">مروری بر نتایج گفتگوهای شخصیتی کاربران.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لیست گزارش‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-sm text-slate-500">
              <LoaderCircle className="h-10 w-10 animate-spin text-purple-500" />
              در حال دریافت داده‌ها...
            </div>
          ) : formattedRows.length === 0 ? (
            <div className="rounded-md border border-dashed border-purple-200 bg-purple-50/50 پ-10 text-center text-sm text-slate-500">
              هنوز گزارشی ثبت نشده است.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>کاربر</TableHead>
                  <TableHead>آزمون</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>تاریخ</TableHead>
                  <TableHead className="text-left">گزارش</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formattedRows.map((row) => (
                  <TableRow key={row.sessionId}>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold text-slate-900">{row.user.full_name || "-"}</p>
                        <p className="text-xs text-slate-500">{row.user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold text-slate-900">{row.assessment_name}</p>
                        <p className="text-xs text-slate-500">{row.report_name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 rounded-full border border-purple-200/70 px-3 py-1 text-xs text-purple-600">
                        <Sparkles className="h-3.5 w-3.5" />
                        {row.status === "completed" ? "تکمیل شده" : row.status === "in-progress" ? "در حال انجام" : "لغو شده"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-xs text-slate-500">
                        <p>ایجاد: {formatDate(row.created_at)}</p>
                        <p>آخرین تغییر: {formatDate(row.updated_at)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-left">
                      <Button variant="outline" size="sm" onClick={() => setSelected(row)}>
                        مشاهده
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selected && (
        <Card className="border-purple-100 bg-white/90 shadow-sm">
          <CardHeader className="flex flex-col gap-1">
            <CardTitle className="text-lg text-slate-900">جزئیات آزمون {selected.assessment_name}</CardTitle>
            <p className="text-xs text-slate-500">کاربر: {selected.user.full_name} ({selected.user.email})</p>
            <p className="text-xs text-slate-400">شناسه جلسه: {selected.sessionId}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderAnalysis(selected)}
            <div className="text-left">
              <Button variant="outline" onClick={() => setSelected(null)}>
                بستن
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminPersonalityResults;
