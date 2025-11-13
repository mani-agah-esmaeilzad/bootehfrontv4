// src/pages/admin/NewOrganization.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoaderCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import apiFetch from "@/services/apiService";
import { createOrganization } from "@/services/apiService";

interface Questionnaire {
  id: number;
  name: string;
}

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

const NewOrganization = () => {
    const [name, setName] = useState("");
    const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedQuestionnaires, setSelectedQuestionnaires] = useState<number[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [qResponse, uResponse] = await Promise.all([
                    apiFetch('admin/questionnaires'),
                    apiFetch('admin/users')
                ]);

                if (qResponse.success) setQuestionnaires(qResponse.data);
                else throw new Error(qResponse.message || "خطا در دریافت پرسشنامه‌ها");

                if (uResponse.success) setUsers(uResponse.data);
                else throw new Error(uResponse.message || "خطا در دریافت کاربران");

            } catch (error: any) {
                toast.error(error.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleCheckboxChange = (
        id: number,
        list: number[],
        setter: React.Dispatch<React.SetStateAction<number[]>>
    ) => {
        if (list.includes(id)) {
            setter(list.filter(itemId => itemId !== id));
        } else {
            setter([...list, id]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("نام سازمان نمی‌تواند خالی باشد.");
            return;
        }
        if (selectedQuestionnaires.length === 0 || selectedUsers.length === 0) {
            toast.error("باید حداقل یک پرسشنامه و یک کاربر را انتخاب کنید.");
            return;
        }
        setIsSubmitting(true);
        try {
            await createOrganization({
                name: name,
                questionnaireIds: selectedQuestionnaires,
                userIds: selectedUsers,
            });
            toast.success("سازمان با موفقیت ایجاد شد!");
            navigate('/admin/organizations');
        } catch (error: any) {
            toast.error(`خطا در ایجاد سازمان: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="admin-page">
                <div className="admin-surface text-center">
                    <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-slate-400" />
                    <p className="mt-4 text-sm text-slate-500">در حال بارگذاری اطلاعات...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="mx-auto w-full max-w-4xl space-y-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold text-white">ایجاد سازمان جدید</h1>
                        <p className="text-sm text-white/70">انتخاب پرسشنامه‌ها و کاربران وابسته به این سازمان.</p>
                    </div>
                    <Button
                        onClick={() => navigate('/admin/organizations')}
                        variant="outline"
                        className="rounded-2xl border-white/30 bg-white/10 text-white hover:bg-white/20"
                    >
                        <ArrowLeft className="ml-2 h-4 w-4" />
                        بازگشت
                    </Button>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card className="rounded-3xl border border-slate-100 bg-white/85 shadow-lg shadow-indigo-500/10">
                        <CardHeader>
                            <CardTitle>اطلاعات سازمان</CardTitle>
                            <CardDescription>نام سازمان را وارد کرده و پرسشنامه‌ها و کاربران مربوطه را انتخاب کنید.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">نام سازمان</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً: شرکت فناوری نوین" required />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>انتخاب پرسشنامه‌ها</Label>
                                    <ScrollArea className="h-72 w-full rounded-md border p-4">
                                        {questionnaires.map(q => (
                                            <div key={q.id} className="flex items-center space-x-2 space-x-reverse mb-2">
                                                <Checkbox id={`q-${q.id}`} onCheckedChange={() => handleCheckboxChange(q.id, selectedQuestionnaires, setSelectedQuestionnaires)} />
                                                <Label htmlFor={`q-${q.id}`} className="flex-1 cursor-pointer">{q.name}</Label>
                                            </div>
                                        ))}
                                    </ScrollArea>
                                </div>
                                <div className="space-y-2">
                                    <Label>انتخاب کاربران</Label>
                                    <ScrollArea className="h-72 w-full rounded-md border p-4">
                                        {users.map(u => (
                                            <div key={u.id} className="flex items-center space-x-2 space-x-reverse mb-2">
                                                <Checkbox id={`u-${u.id}`} onCheckedChange={() => handleCheckboxChange(u.id, selectedUsers, setSelectedUsers)} />
                                                <Label htmlFor={`u-${u.id}`} className="flex-1 cursor-pointer">{u.first_name} {u.last_name} ({u.username})</Label>
                                            </div>
                                        ))}
                                    </ScrollArea>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-500 px-6 py-5 font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-90 sm:w-auto"
                                >
                                    {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "ذخیره سازمان"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </div>
    );
};

export default NewOrganization;
