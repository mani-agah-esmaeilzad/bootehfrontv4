// src/pages/OrgPanel.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderCircle, AlertTriangle, ListChecks } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { toast } from 'sonner';

interface Questionnaire { id: number; name: string; description: string; }
interface OrgData { organizationName: string; questionnaires: Questionnaire[]; }

const OrgLogin = ({ slug, orgName }: { slug: string, orgName: string }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch(`/api/org/${slug}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const result = await response.json();
            if (response.ok && result.success) {
                localStorage.setItem('authToken', result.data.token);
                toast.success(`ورود به پنل ${orgName} موفقیت‌آمیز بود.`);
                // کاربر به داشبورد عمومی هدایت می‌شود. در آینده می‌توان این را به داشبورد اختصاصی تغییر داد.
                navigate('/dashboard');
            } else {
                throw new Error(result.message || 'خطا در ورود');
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <form onSubmit={handleLogin} className="space-y-4 my-6 border-t pt-6">
             <div className="space-y-2">
                <Label htmlFor="username">نام کاربری یا ایمیل</Label>
                <Input id="username" name="username" value={formData.username} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">رمز عبور</Label>
                <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? <LoaderCircle className="animate-spin" /> : "ورود به حساب کاربری"}
            </Button>
        </form>
    );
};


const OrgPanel = () => {
    const { slug } = useParams<{ slug: string }>();
    const [orgData, setOrgData] = useState<OrgData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrgData = async () => {
            if (!slug) return;
            try {
                const response = await fetch(`/api/org/${slug}`);
                const result = await response.json();
                if (response.ok && result.success) {
                    setOrgData(result.data);
                } else {
                    throw new Error(result.message || 'خطا در دریافت اطلاعات پنل');
                }
            } catch (err: any) {
                setError(err.message);
                toast.error(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrgData();
    }, [slug]);

    if (isLoading) return <div className="flex justify-center items-center h-screen"><LoaderCircle className="animate-spin h-10 w-10" /></div>;

    if (error) return (
        <div className="flex flex-col justify-center items-center h-screen text-center p-4">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-red-700">خطا</h2>
            <p className="text-gray-600 mt-2">{error}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
             <div className="flex justify-center mb-8"><Logo variant="large" /></div>
            <Card className="w-full max-w-2xl shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold">{orgData?.organizationName}</CardTitle>
                    <CardDescription className="text-lg mt-2">به پورتال ارزیابی خوش آمدید. برای شروع، وارد حساب کاربری خود شوید.</CardDescription>
                </CardHeader>
                <CardContent>
                    {slug && orgData?.organizationName && <OrgLogin slug={slug} orgName={orgData.organizationName} />}
                    <h3 className="text-xl font-semibold mb-4 text-center">لیست ارزیابی‌های موجود</h3>
                    <div className="space-y-4 max-h-60 overflow-y-auto">
                        {orgData?.questionnaires.map(q => (
                            <div key={q.id} className="border rounded-lg p-4 flex items-start">
                                <ListChecks className="text-blue-500 mr-4 h-6 w-6 shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold">{q.name}</h4>
                                    <p className="text-sm text-gray-600">{q.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default OrgPanel;

