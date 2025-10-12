// src/pages/admin/AdminOrganizations.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Button onClick={() => navigate('/admin/dashboard')} variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                        <h1 className="text-3xl font-bold">مدیریت پنل‌های سازمانی</h1>
                    </div>
                    {/* استفاده از کامپوننت مودال */}
                    <NewOrganizationModal onOrganizationCreated={fetchOrganizations} />
                </header>
                <Card>
                    <CardHeader>
                        <CardTitle>لیست سازمان‌ها</CardTitle>
                        <CardDescription>تمام پنل‌های سازمانی ایجاد شده در این لیست نمایش داده می‌شوند.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-16"><LoaderCircle className="mx-auto h-12 w-12 animate-spin text-gray-400" /></div>
                        ) : (
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>نام سازمان</TableHead>
                                            <TableHead>آدرس یونیک (Slug)</TableHead>
                                            <TableHead className="text-center">کاربران</TableHead>
                                            <TableHead className="text-center">ارزیابی‌ها</TableHead>
                                            <TableHead className="text-center">تاریخ ایجاد</TableHead>
                                            <TableHead className="text-center">عملیات</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {organizations.length > 0 ? organizations.map((org) => (
                                            <TableRow key={org.id}>
                                                <TableCell className="font-medium">{org.name}</TableCell>
                                                <TableCell className="text-muted-foreground text-left" dir="ltr">{org.slug}</TableCell>
                                                <TableCell className="text-center">{org.user_count}</TableCell>
                                                <TableCell className="text-center">{org.questionnaire_count}</TableCell>
                                                <TableCell className="text-center">{new Date(org.created_at).toLocaleDateString('fa-IR')}</TableCell>
                                                <TableCell className="text-center">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => navigate(`/admin/organizations/edit/${org.id}`)}><Pencil className="ml-2 h-4 w-4" /> ویرایش</DropdownMenuItem>
                                                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(org.id)}><Trash2 className="ml-2 h-4 w-4" /> حذف</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow><TableCell colSpan={6} className="text-center h-24">هیچ سازمانی یافت نشد. برای شروع، یک سازمان جدید ایجاد کنید.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminOrganizations;
