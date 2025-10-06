// src/pages/admin/AdminDashboard.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Users, FileText, BarChart2, Building, LogOut } from "lucide-react"; // Building icon added
import { toast } from "sonner";

interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();

  const DashboardCard = ({ title, description, icon: Icon, path }: DashboardCardProps) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(path)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  const handleLogout = () => {
    localStorage.removeItem('adminAuthToken');
    toast.success("با موفقیت خارج شدید.");
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">داشبورد ادمین</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="ml-2 h-4 w-4" />
            خروج
          </Button>
        </header>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="کاربران"
            description="مدیریت کاربران ثبت‌نام شده در سیستم"
            icon={Users}
            path="/admin/users"
          />
          <DashboardCard
            title="پرسشنامه‌ها"
            description="ایجاد و ویرایش پرسشنامه‌های ارزیابی"
            icon={FileText}
            path="/admin/questionnaires"
          />
          {/* ✅ کارت جدید برای سازمان‌ها */}
          <DashboardCard
            title="پنل‌های سازمانی"
            description="مدیریت سازمان‌ها و دسترسی‌های آن‌ها"
            icon={Building}
            path="/admin/organizations"
          />
          <DashboardCard
            title="گزارش‌ها"
            description="مشاهده نتایج و گزارش‌های ارزیابی‌ها"
            icon={BarChart2}
            path="/admin/reports"
          />
        </div>

        {/* بخش‌های دیگر داشبورد می‌توانند اینجا اضافه شوند */}

      </div>
    </div>
  );
};

export default AdminDashboard;
