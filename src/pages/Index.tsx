import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Target, BarChart3 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-hrbooteh-gradient-subtle">
      {/* Header */}
      <header className="bg-hrbooteh-surface/80 backdrop-blur-sm shadow-hrbooteh-sm border-b border-hrbooteh-surface-elevated">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Logo variant="large" />
            <div className="flex gap-3">
              <Button variant="hrbooteh-ghost" onClick={() => navigate('/login')}>
                ورود
              </Button>
              <Button variant="hrbooteh" onClick={() => navigate('/register')}>
                ثبت‌نام
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-hrbooteh-text-primary mb-6 leading-tight">
            مسیر ارزیابی و توسعه
            <br />
            <span className="bg-hrbooteh-gradient-primary bg-clip-text text-transparent">
              شایستگی‌های حرفه‌ای
            </span>
          </h1>
          
          <p className="text-xl text-hrbooteh-text-secondary mb-12 max-w-2xl mx-auto leading-relaxed">
            در hrbooteh، شما یک مسیر هدایت‌شده برای ارزیابی و توسعه شایستگی‌های کلیدی حرفه‌ای خود طی می‌کنید. این پلتفرم به شما کمک می‌کند تا نقاط قوت و ضعف خود را شناسایی کرده و برای رشد حرفه‌ای برنامه‌ریزی کنید.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              variant="hrbooteh-gradient" 
              size="xl"
              onClick={() => navigate('/register')}
              className="group"
            >
              <ArrowLeft className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              شروع مسیر ارزیابی
            </Button>
            <Button 
              variant="hrbooteh-outline" 
              size="xl"
              onClick={() => navigate('/login')}
            >
              ورود به حساب کاربری
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="p-8 shadow-hrbooteh-md border-0 bg-hrbooteh-surface hover:shadow-hrbooteh-lg transition-all duration-300 group">
              <div className="w-16 h-16 bg-hrbooteh-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-hrbooteh-text-primary mb-3">
                ارزیابی هدایت‌شده
              </h3>
              <p className="text-hrbooteh-text-secondary leading-relaxed">
                یک مسیر مشخص و علمی برای ارزیابی شایستگی‌های کلیدی حرفه‌ای شما
              </p>
            </Card>

            <Card className="p-8 shadow-hrbooteh-md border-0 bg-hrbooteh-surface hover:shadow-hrbooteh-lg transition-all duration-300 group">
              <div className="w-16 h-16 bg-hrbooteh-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-hrbooteh-text-primary mb-3">
                تعامل با متخصصان
              </h3>
              <p className="text-hrbooteh-text-secondary leading-relaxed">
                ارزیابی‌های تعاملی با شبیه‌سازی گفتگوی واقعی با متخصصان حوزه HR
              </p>
            </Card>

            <Card className="p-8 shadow-hrbooteh-md border-0 bg-hrbooteh-surface hover:shadow-hrbooteh-lg transition-all duration-300 group">
              <div className="w-16 h-16 bg-hrbooteh-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-hrbooteh-text-primary mb-3">
                گزارش جامع
              </h3>
              <p className="text-hrbooteh-text-secondary leading-relaxed">
                دریافت گزارش تفصیلی از نتایج ارزیابی‌ها همراه با راهکارهای بهبود
              </p>
            </Card>
          </div>

          {/* Assessment Areas */}
          <div className="bg-hrbooteh-surface rounded-2xl p-8 shadow-hrbooteh-lg">
            <h2 className="text-2xl font-bold text-hrbooteh-text-primary mb-8">
              حوزه‌های ارزیابی
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-right">
              {[
                "شایستگی های فنی",
                "شایستگی های رفتاری", 
                "شایستگی های فردی",
                "شایستگی های رهبری و مدیریت",
                "شایستگی های شناختی",
                "و موارد بیشتر..."
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-hrbooteh-surface-elevated rounded-lg">
                  <div className="w-2 h-2 bg-hrbooteh-primary rounded-full"></div>
                  <span className="text-hrbooteh-text-primary font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-hrbooteh-surface border-t border-hrbooteh-surface-elevated mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Logo variant="default" className="mb-4" />
            <p className="text-hrbooteh-text-secondary text-sm">
              © 2025 hrbooteh. تمام حقوق محفوظ است.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
