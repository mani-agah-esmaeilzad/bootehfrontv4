// src/pages/admin/AdminUsers.tsx
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoaderCircle, ArrowLeft, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import apiFetch from "@/services/apiService";
import { bulkUploadUsers } from "@/services/apiService";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface User {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    created_at: string;
    is_active: boolean;
}

const AdminUsers = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await apiFetch('admin/users');
            if (response.success) {
                setUsers(response.data.map((user: any) => ({ ...user, is_active: !!user.is_active })));
            } else {
                throw new Error(response.message);
            }
        } catch (error: any) {
            toast.error("خطا در دریافت لیست کاربران: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteUser = async (userId: number, fullName: string) => {
        if (!window.confirm(`آیا از حذف کاربر «${fullName}» اطمینان دارید؟ این عملیات قابل بازگشت نیست.`)) {
            return;
        }

        setDeletingUserId(userId);
        const previousUsers = [...users];
        setUsers((prev) => prev.filter((user) => user.id !== userId));

        try {
            const response = await apiFetch(`admin/users/${userId}`, {
                method: 'DELETE',
            });
            if (!response.success) {
                throw new Error(response.message || 'حذف کاربر موفق نبود.');
            }
            toast.success("کاربر با موفقیت حذف شد.");
        } catch (error: any) {
            toast.error(error.message || "خطا در حذف کاربر");
            setUsers(previousUsers);
        } finally {
            setDeletingUserId(null);
        }
    };
    
    const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        setUsers(prevUsers => prevUsers.map(user => user.id === userId ? { ...user, is_active: newStatus } : user));
        try {
            await apiFetch(`admin/users/${userId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ is_active: newStatus }),
            });
            toast.success("وضعیت کاربر با موفقیت تغییر کرد.");
        } catch (error: any) {
            toast.error(`خطا در تغییر وضعیت: ${error.message}`);
            setUsers(prevUsers => prevUsers.map(user => user.id === userId ? { ...user, is_active: currentStatus } : user));
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsUploading(true);
            try {
                const response = await bulkUploadUsers(file);
                toast.success(response.message);
                if (response.errors && response.errors.length > 0) {
                    response.errors.forEach((err: string) => toast.warning(err, { duration: 10000 }));
                }
                fetchUsers();
            } catch (error: any) {
                toast.error(error.message);
            } finally {
                setIsUploading(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        }
    };

    return (
        <div className="admin-page">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-white">کاربران سیستم</h1>
                    <p className="text-sm text-white/70">مدیریت وضعیت دسترسی و مشاهده جزئیات پروفایل‌ها.</p>
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
                    <div>
                        <Input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls" />
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="rounded-2xl bg-white text-slate-900 shadow-md shadow-indigo-500/10"
                        >
                            <Upload className="ml-2 h-4 w-4" />
                            {isUploading ? 'در حال آپلود...' : 'آپلود گروهی'}
                        </Button>
                    </div>
                </div>
            </div>

            <section className="admin-surface space-y-6">
                {isLoading ? (
                    <div className="py-16 text-center">
                        <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-slate-400" />
                        <p className="mt-4 text-sm text-slate-500">در حال بارگذاری کاربران...</p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-3xl border border-slate-100">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead>نام کامل</TableHead>
                                        <TableHead>ایمیل</TableHead>
                                        <TableHead className="text-center">وضعیت</TableHead>
                                        <TableHead className="text-center">فعال/غیرفعال</TableHead>
                                        <TableHead className="text-center">عملیات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow
                                            key={user.id}
                                            className="cursor-pointer transition hover:bg-indigo-50/60"
                                            onClick={() => navigate(`/admin/users/${user.id}`)}
                                        >
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
                                            <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                                <Switch
                                                    checked={user.is_active}
                                                    onCheckedChange={() => handleToggleUserStatus(user.id, user.is_active)}
                                                />
                                            </TableCell>
                                            <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="gap-2 rounded-full"
                                                    disabled={deletingUserId === user.id}
                                                    onClick={() =>
                                                        handleDeleteUser(
                                                            user.id,
                                                            `${user.first_name} ${user.last_name}`.trim() || user.username
                                                        )
                                                    }
                                                >
                                                    {deletingUserId === user.id ? (
                                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                    حذف
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
};

export default AdminUsers;
