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
        return <div className="text-center py-16"><LoaderCircle className="mx-auto h-12 w-12 animate-spin text-gray-400" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <header className="flex items-center gap-4 mb-8">
                    <Button onClick={() => navigate('/admin/organizations')} variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-3xl font-bold">ایجاد سازمان جدید</h1>
                </header>

                <form onSubmit={handleSubmit}>
                    <Card>
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
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? <LoaderCircle className="animate-spin" /> : "ذخیره سازمان"}
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
