// src/pages/admin/AdminUserDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoaderCircle, ArrowLeft, User, Mail, Phone, Briefcase, GraduationCap, Calendar, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { getUserDetails } from "@/services/apiService";
import { Badge } from '@/components/ui/badge';

interface UserDetails {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    phone_number: string | null;
    age: number | null;
    education_level: string | null;
    work_experience: string | null;
    is_active: boolean;
    created_at: string;
}

const DetailRow = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number | null | undefined }) => (
    <div className="flex items-center border-b py-3">
        <Icon className="h-5 w-5 text-gray-500 ml-4" />
        <span className="font-semibold w-32">{label}:</span>
        <span className="text-gray-700">{value || 'ثبت نشده'}</span>
    </div>
);

const AdminUserDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [user, setUser] = useState<UserDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserDetails = async () => {
            if (!id) {
                toast.error("شناسه کاربر نامعتبر است");
                setIsLoading(false);
                return;
            }
            try {
                const response = await getUserDetails(parseInt(id, 10));
                if (response.success && response.data) {
                    setUser(response.data);
                } else {
                    throw new Error(response.message || "کاربر یافت نشد");
                }
            } catch (error: any) {
                toast.error(`خطا در دریافت اطلاعات کاربر: ${error.message}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserDetails();
    }, [id]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><LoaderCircle className="animate-spin h-12 w-12" /></div>;
    }

    if (!user) {
        return <div className="text-center py-16 text-red-600">اطلاعات این کاربر یافت نشد.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <header className="flex items-center gap-4 mb-8">
                    <Button onClick={() => navigate('/admin/users')} variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-3xl font-bold">جزئیات کاربر</h1>
                </header>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <User className="h-6 w-6" />
                            {user.first_name} {user.last_name}
                        </CardTitle>
                        <CardDescription>@{user.username}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <DetailRow icon={Mail} label="ایمیل" value={user.email} />
                            <DetailRow icon={Phone} label="شماره تماس" value={user.phone_number} />
                            <DetailRow icon={GraduationCap} label="سطح تحصیلات" value={user.education_level} />
                            <DetailRow icon={Briefcase} label="سابقه کار" value={user.work_experience} />
                            <DetailRow icon={Calendar} label="سن" value={user.age} />
                            <DetailRow icon={Calendar} label="تاریخ عضویت" value={new Date(user.created_at).toLocaleDateString('fa-IR')} />
                            <div className="flex items-center py-3">
                                {user.is_active ? <ToggleRight className="h-5 w-5 text-gray-500 ml-4" /> : <ToggleLeft className="h-5 w-5 text-gray-500 ml-4" />}
                                <span className="font-semibold w-32">وضعیت حساب:</span>
                                <Badge variant={user.is_active ? "default" : "destructive"}>
                                    {user.is_active ? "فعال" : "غیرفعال"}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminUserDetail;
