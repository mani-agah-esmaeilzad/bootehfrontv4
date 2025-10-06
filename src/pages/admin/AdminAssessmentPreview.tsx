// src/pages/admin/AdminAssessmentPreview.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
// ✅ ایمپورت تابع جدید
import { startAssessmentPreview } from '@/services/apiService';
import AssessmentChat from '@/pages/AssessmentChat';
import { LoaderCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdminAssessmentPreview = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [sessionData, setSessionData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const startPreviewSession = async () => {
            if (!id) {
                setError("شناسه پرسشنامه نامعتبر است.");
                setIsLoading(false);
                return;
            }
            try {
                // ✅ استفاده از تابع اختصاصی جدید
                const response = await startAssessmentPreview(id);

                if (response.success && response.data) {
                    setSessionData(response.data);
                } else {
                    // پرتاب خطا با پیام دریافتی از سرور
                    throw new Error(response.message || 'پاسخ سرور برای شروع پیش‌نمایش نامعتبر است');
                }
            } catch (err: any) {
                const errorMessage = err.message || 'خطا در شروع پیش‌نمایش. لطفاً دوباره تلاش کنید.';
                setError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        startPreviewSession();
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen">
                <LoaderCircle className="animate-spin h-10 w-10 text-gray-500" />
                <p className="mt-4 text-gray-600">در حال آماده‌سازی پیش‌نمایش...</p>
            </div>
        );
    }

    if (error || !sessionData) {
        return (
            <div className="flex flex-col justify-center items-center h-screen text-center p-4">
                <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-red-700">خطا در بارگذاری پیش‌نمایش</h2>
                <p className="text-gray-600 mt-2">{error}</p>
                <Button onClick={() => navigate(-1)} className="mt-6">
                    بازگشت به لیست پرسشنامه‌ها
                </Button>
            </div>
        );
    }

    // ارسال داده‌های جلسه به کامپوننت چت در حالت پیش‌نمایش
    return <AssessmentChat initialSessionData={sessionData} isAdminPreview={true} />;
};

export default AdminAssessmentPreview;
