// src/pages/admin/AdminUserStages.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  LoaderCircle,
  SlidersHorizontal,
  ListChecks,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import apiFetch, {
  getUserStageSummaries,
  getUserStageDetail,
  updateUserStageAssignments,
} from "@/services/apiService";

interface UserStageSummary {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  assignment_count: number;
  assignments_updated_at?: string | null;
}

interface QuestionnaireSummary {
  id: number;
  title: string;
  description?: string | null;
  category?: string | null;
}

const formatDate = (value?: string | null) => {
  if (!value) return "ثبت نشده";
  try {
    return new Date(value).toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return value;
  }
};

const AdminUserStages = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserStageSummary[]>([]);
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserStageSummary | null>(null);
  const [selectedQuestionnaireIds, setSelectedQuestionnaireIds] = useState<number[]>([]);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersResponse, questionnairesResponse] = await Promise.all([
        getUserStageSummaries(),
        apiFetch("admin/questionnaires"),
      ]);

      if (!usersResponse.success) {
        throw new Error(usersResponse.message || "خطا در دریافت کاربران");
      }
      if (!questionnairesResponse.success) {
        throw new Error(questionnairesResponse.message || "خطا در دریافت پرسشنامه‌ها");
      }

      setUsers(usersResponse.data || []);
      setQuestionnaires(questionnairesResponse.data || []);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "بارگذاری اطلاعات با خطا مواجه شد");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenManager = async (user: UserStageSummary) => {
    setSelectedUser(user);
    setSelectedQuestionnaireIds([]);
    setIsManagerOpen(true);
    setIsDetailLoading(true);
    try {
      const response = await getUserStageDetail(user.id);
      if (!response.success) {
        throw new Error(response.message || "جزئیات مراحل کاربر یافت نشد");
      }
      setSelectedQuestionnaireIds(response.data?.assignedQuestionnaireIds || []);
    } catch (error: any) {
      toast.error(error.message || "خطا در دریافت مراحل کاربر");
      setSelectedUser(null);
      setIsManagerOpen(false);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleCloseManager = () => {
    if (isSaving) return;
    setIsManagerOpen(false);
    setSelectedUser(null);
    setSelectedQuestionnaireIds([]);
  };

  const handleToggleQuestionnaire = (id: number) => {
    setSelectedQuestionnaireIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const orderedSelection = useMemo(() => {
    const selectedSet = new Set(selectedQuestionnaireIds);
    return questionnaires.filter((q) => selectedSet.has(q.id));
  }, [questionnaires, selectedQuestionnaireIds]);

  const groupedQuestionnaires = useMemo(() => {
    const groups = new Map<string, QuestionnaireSummary[]>();
    questionnaires.forEach((q) => {
      const category = q.category || "سایر دسته‌ها";
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(q);
    });
    return Array.from(groups.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([category, list]) => ({
        category,
        list: list.sort((a, b) => (a.title || "").localeCompare(b.title || "")),
      }));
  }, [questionnaires]);

  const handleSaveAssignments = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      const selectedSet = new Set(selectedQuestionnaireIds);
      const orderedIds = questionnaires.filter((q) => selectedSet.has(q.id)).map((q) => q.id);
      const response = await updateUserStageAssignments(selectedUser.id, orderedIds);
      if (!response.success) {
        throw new Error(response.message || "ذخیره مراحل با خطا مواجه شد");
      }
      toast.success("مراحل کاربر با موفقیت ذخیره شد");
      setUsers((prev) =>
        prev.map((user) =>
          user.id === selectedUser.id
            ? {
                ...user,
                assignment_count: orderedIds.length,
                assignments_updated_at: new Date().toISOString(),
              }
            : user
        )
      );
      handleCloseManager();
    } catch (error: any) {
      toast.error(error.message || "ذخیره مراحل با خطا مواجه شد");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="admin-page space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white">سفارشی‌سازی مسیر کاربران</h1>
          <p className="text-sm text-white/70">
            مشخص کنید هر کاربر به کدام مرحله‌ها دسترسی دارد. در صورت عدم انتخاب، تمام پرسشنامه‌ها قابل مشاهده خواهند بود.
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
            onClick={fetchData}
            disabled={isLoading}
          >
            <CheckCircle2 className="ml-2 h-4 w-4" />
            بروزرسانی داده‌ها
          </Button>
        </div>
      </div>

      <section className="admin-surface space-y-4">
        {isLoading ? (
          <div className="py-16 text-center">
            <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-slate-400" />
            <p className="mt-3 text-sm text-slate-500">در حال بارگذاری کاربران...</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-100">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>نام کاربر</TableHead>
                    <TableHead>ایمیل</TableHead>
                    <TableHead className="text-center">وضعیت</TableHead>
                    <TableHead className="text-center">مرحله‌های مجاز</TableHead>
                    <TableHead className="text-center">آخرین بروزرسانی</TableHead>
                    <TableHead className="text-center">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                        هنوز کاربری ثبت نشده است.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id} className="transition hover:bg-indigo-50/60">
                        <TableCell>
                          <div className="font-semibold text-slate-900">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-xs text-slate-500">@{user.username}</div>
                        </TableCell>
                        <TableCell className="text-slate-500">{user.email}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={user.is_active ? "default" : "destructive"}>
                            {user.is_active ? "فعال" : "غیرفعال"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-semibold text-slate-900">
                          {user.assignment_count > 0 ? (
                            <span>{user.assignment_count} مرحله</span>
                          ) : (
                            <span className="text-slate-400">همه مراحل</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-slate-500">
                          {formatDate(user.assignments_updated_at)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-2 rounded-full text-indigo-600 hover:bg-indigo-50"
                            onClick={() => handleOpenManager(user)}
                          >
                            <SlidersHorizontal className="h-4 w-4" />
                            مدیریت مرحله‌ها
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </section>

      <Dialog open={isManagerOpen} onOpenChange={(open) => { if (!open) handleCloseManager(); }}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>انتخاب مراحل برای {selectedUser?.first_name} {selectedUser?.last_name}</DialogTitle>
            <DialogDescription>
              در صورت انتخاب نکردن هیچ مرحله‌ای، کاربر به تمام پرسشنامه‌های فعال دسترسی خواهد داشت.
            </DialogDescription>
          </DialogHeader>
          {isDetailLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <LoaderCircle className="mb-3 h-10 w-10 animate-spin" />
              در حال دریافت اطلاعات کاربر...
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
              <ScrollArea className="h-[420px] rounded-2xl border border-slate-100 p-4">
                <div className="space-y-6">
                  {groupedQuestionnaires.map(({ category, list }) => (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <ListChecks className="h-4 w-4 text-indigo-500" />
                        <p className="text-sm font-semibold text-slate-900">{category}</p>
                      </div>
                      <div className="space-y-2">
                        {list.map((questionnaire) => {
                          const checked = selectedQuestionnaireIds.includes(questionnaire.id);
                          return (
                            <label
                              key={questionnaire.id}
                              className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-100 bg-white/50 p-3 text-sm text-slate-700 transition hover:border-indigo-200"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => handleToggleQuestionnaire(questionnaire.id)}
                              />
                              <div className="space-y-1">
                                <div className="font-semibold text-slate-900">{questionnaire.title}</div>
                                {questionnaire.description && (
                                  <p className="text-xs text-slate-500 line-clamp-2">{questionnaire.description}</p>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">مرحله‌های انتخابی</p>
                  <Badge variant="secondary">
                    {selectedQuestionnaireIds.length > 0 ? `${selectedQuestionnaireIds.length} مرحله` : "همه مراحل"}
                  </Badge>
                </div>
                {selectedQuestionnaireIds.length === 0 ? (
                  <div className="rounded-xl bg-white/70 p-4 text-sm text-slate-500">
                    برای محدودسازی دسترسی، حداقل یک مرحله را انتخاب کنید.
                  </div>
                ) : (
                  <ScrollArea className="h-[280px] rounded-xl border border-slate-100 bg-white/70 p-3">
                    <ol className="space-y-2 text-sm text-slate-700">
                      {orderedSelection.map((item, index) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2"
                        >
                          <span className="font-semibold text-slate-900">
                            {index + 1}. {item.title}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-red-500 hover:bg-red-50"
                            onClick={() => handleToggleQuestionnaire(item.id)}
                          >
                            حذف
                          </Button>
                        </li>
                      ))}
                    </ol>
                  </ScrollArea>
                )}
                <p className="text-xs text-slate-500">
                  ترتیب نمایش مراحل بر اساس لیست بالا ذخیره می‌شود.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseManager} disabled={isSaving}>
              انصراف
            </Button>
            <Button onClick={handleSaveAssignments} disabled={isSaving || isDetailLoading}>
              {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "ذخیره مراحل"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserStages;
