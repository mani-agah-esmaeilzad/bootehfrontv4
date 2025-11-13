// src/pages/admin/AdminOrganizations.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoaderCircle, ArrowLeft, PlusCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import apiFetch from "@/services/apiService";
import { getOrganizations, deleteOrganization, createOrganization } from "@/services/apiService";
import { QuestionnaireCategory } from "@/constants/questionnaireCategories";

// Interfaces
interface Organization {
    id: number; name: string; slug: string; created_at: string;
    user_count: number; questionnaire_count: number;
}
interface Questionnaire { id: number; title?: string; name?: string; category?: QuestionnaireCategory; }
interface User { id: number; username: string; first_name: string; last_name: string; }

// --- کامپوننت مودال برای ایجاد سازمان جدید ---
const NewOrganizationModal = ({ onOrganizationCreated }: { onOrganizationCreated: () => void }) => {
    const [name, setName] = useState("");
    const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedQuestionnaires, setSelectedQuestionnaires] = useState<number[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen) { // فقط زمانی دیتا را لود کن که مودال باز می‌شود
            const fetchData = async () => {
                setIsLoading(true);
                try {
                    const [qResponse, uResponse] = await Promise.all([
                        apiFetch('admin/questionnaires'),
                        apiFetch('admin/users')
                    ]);
                    if (qResponse.success) setQuestionnaires(qResponse.data);
                    if (uResponse.success) setUsers(uResponse.data);
                } catch (error: any) {
                    toast.error(error.message);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, [isOpen]);

    const handleCheckboxChange = (id: number, list: number[], setter: React.Dispatch<React.SetStateAction<number[]>>) => {
        setter(prev => list.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleSubmit = async () => {
        if (!name.trim() || selectedQuestionnaires.length === 0 || selectedUsers.length === 0) {
            toast.error("لطفاً تمام فیلدها را پر کرده و حداقل یک کاربر و یک پرسشنامه انتخاب کنید.");
            return;
        }
        setIsSubmitting(true);
        try {
            await createOrganization({ name, questionnaireIds: selectedQuestionnaires, userIds: selectedUsers });
            toast.success("سازمان با موفقیت ایجاد شد!");
            onOrganizationCreated(); // تابع والد را برای رفرش لیست فراخوانی کن
            setIsOpen(false); // بستن مودال
        } catch (error: any) {
            toast.error(`خطا در ایجاد سازمان: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    ایجاد سازمان جدید
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>ایجاد سازمان جدید</DialogTitle>
                    <DialogDescription>نام سازمان را وارد کرده و پرسشنامه‌ها و کاربران مربوطه را انتخاب کنید.</DialogDescription>
                </DialogHeader>
                {isLoading ? (
                    <div className="text-center py-16"><LoaderCircle className="mx-auto h-12 w-12 animate-spin" /></div>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">نام سازمان</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً: شرکت فناوری نوین" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>انتخاب پرسشنامه‌ها</Label>
                                <ScrollArea className="h-60 rounded-md border p-2">
                                    {questionnaires.map(q => {
                                        const label = q.title ?? q.name ?? "بدون عنوان";
                                        return (
                                            <div key={q.id} className="flex items-center space-x-2 space-x-reverse p-2">
                                                <Checkbox id={`q-${q.id}`} onCheckedChange={() => handleCheckboxChange(q.id, selectedQuestionnaires, setSelectedQuestionnaires)} />
                                                <Label htmlFor={`q-${q.id}`} className="cursor-pointer flex flex-col">
                                                    <span>{label}</span>
                                                    {q.category && <span className="text-xs text-muted-foreground">{q.category}</span>}
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </ScrollArea>
                            </div>
                            <div className="space-y-2">
                                <Label>انتخاب کاربران</Label>
                                <ScrollArea className="h-60 rounded-md border p-2">
                                    {users.map(u => (
                                        <div key={u.id} className="flex items-center space-x-2 space-x-reverse p-2">
                                            <Checkbox id={`u-${u.id}`} onCheckedChange={() => handleCheckboxChange(u.id, selectedUsers, setSelectedUsers)} />
                                            <Label htmlFor={`u-${u.id}`} className="cursor-pointer">{u.first_name} {u.last_name} ({u.username})</Label>
                                        </div>
                                    ))}
                                </ScrollArea>
                            </div>
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">انصراف</Button></DialogClose>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? <LoaderCircle className="animate-spin" /> : "ذخیره سازمان"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


// --- کامپوننت اصلی صفحه لیست سازمان‌ها ---
const AdminOrganizations = () => {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const fetchOrganizations = async () => {
        setIsLoading(true);
        try {
            const response = await getOrganizations();
            if (response.success) {
                setOrganizations(response.data);
            } else {
                throw new Error(response.message);
            }
        } catch (error: any) {
            toast.error("خطا در دریافت لیست سازمان‌ها: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrganizations();
    }, []);

    const handleDelete = async (id: number) => {
        if (confirm("آیا از حذف این سازمان اطمینان دارید؟")) {
            try {
                await deleteOrganization(id);
                toast.success("سازمان با موفقیت حذف شد.");
                fetchOrganizations(); // رفرش لیست
            } catch (error: any) {
                toast.error("خطا در حذف سازمان: " + error.message);
            }
        }
    };

    return (
        <div className="admin-page">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-white">پنل‌های سازمانی</h1>
                    <p className="text-sm text-white/70">مدیریت سازمان‌ها، دسترسی کاربران و انتساب پرسشنامه‌ها.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        variant="outline"
                        className="rounded-2xl border-white/30 bg-white/10 text-white hover:bg-white/20"
                        onClick={() => navigate('/admin/dashboard')}
                    >
                        <ArrowLeft className="ml-2 h-4 w-4" />
                        بازگشت
                    </Button>
                    <NewOrganizationModal onOrganizationCreated={fetchOrganizations} />
                </div>
            </div>

            <section className="admin-surface space-y-6">
                {isLoading ? (
                    <div className="py-16 text-center">
                        <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-slate-400" />
                        <p className="mt-3 text-sm text-slate-500">در حال بارگذاری فهرست سازمان‌ها...</p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-3xl border border-slate-100">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead>نام سازمان</TableHead>
                                        <TableHead>Slug</TableHead>
                                        <TableHead className="text-center">کاربران</TableHead>
                                        <TableHead className="text-center">پرسشنامه‌ها</TableHead>
                                        <TableHead className="text-center">تاریخ ایجاد</TableHead>
                                        <TableHead className="text-center">عملیات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {organizations.length > 0 ? (
                                        organizations.map((org) => (
                                            <TableRow key={org.id} className="transition hover:bg-indigo-50/60">
                                                <TableCell className="font-semibold text-slate-900">{org.name}</TableCell>
                                                <TableCell className="text-left text-slate-500" dir="ltr">
                                                    {org.slug}
                                                </TableCell>
                                                <TableCell className="text-center">{org.user_count}</TableCell>
                                                <TableCell className="text-center">{org.questionnaire_count}</TableCell>
                                                <TableCell className="text-center">
                                                    {new Date(org.created_at).toLocaleDateString('fa-IR')}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 rounded-full p-0 text-slate-500 hover:text-slate-900">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => navigate(`/admin/organizations/edit/${org.id}`)}>
                                                                <Pencil className="ml-2 h-4 w-4" />
                                                                ویرایش
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(org.id)}>
                                                                <Trash2 className="ml-2 h-4 w-4" />
                                                                حذف
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                                هیچ سازمانی یافت نشد. از دکمه ایجاد سازمان جدید استفاده کنید.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
};

export default AdminOrganizations;
