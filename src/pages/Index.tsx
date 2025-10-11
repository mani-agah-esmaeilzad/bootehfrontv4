import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Logo } from "@/components/ui/logo";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Target, BarChart3 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 bg-hrbooteh-surface/85 backdrop-blur-md z-40">
        <div className="container mx-auto px-4 py-2">
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
      <main className="container mx-auto px-4 py-24 md:py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-hrbooteh-text-primary mb-6 leading-tight">
            مسیر ارزیابی و توسعه
            <br />
            <span className="bg-hrbooteh-gradient-primary bg-clip-text text-transparent">
              شایستگی‌های حرفه‌ای
            </span>
          </h1>

          <p className="text-md md:text-xl text-hrbooteh-text-secondary mb-12 max-w-2xl mx-auto leading-relaxed">
            در HRbooteh، شما یک مسیر هدایت‌شده برای ارزیابی و توسعه شایستگی‌های کلیدی حرفه‌ای خود طی می‌کنید. این پلتفرم به شما کمک می‌کند تا نقاط قوت و ضعف خود را شناسایی کرده و برای رشد حرفه‌ای برنامه‌ریزی کنید.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              variant="hrbooteh-gradient"
              size="xl"
              onClick={() => navigate('/register')}
              className="group"
            >
              شروع مسیر ارزیابی
              <ArrowLeft className="w-5 h-5 ml-2 group-hover:-translate-x-1 transition-transform" />
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
          <div className="grid grid-cols-1 my-28">
            <div className="p-8 w-1/2 rounded-r-3xl py-20 border border-hrbooteh-primary border-l-0 group">
              <div className="size-24 bg-hrbooteh-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 md:group-hover:scale-110 group-active:scale-110 transition-transform">
                <Target className="size-12 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-hrbooteh-text-primary mb-3">
                ارزیابی هدایت‌شده
              </h3>
              <p className="text-hrbooteh-text-secondary leading-relaxed">
                یک مسیر مشخص و علمی برای ارزیابی شایستگی‌های کلیدی حرفه‌ای شما
              </p>
            </div>

            <div className="p-8 w-1/2 -mt-px mr-auto rounded-l-3xl py-20 border border-hrbooteh-primary border-r-0 group">
              <div className="size-24 bg-hrbooteh-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 md:group-hover:scale-110 group-active:scale-110 transition-transform">
                <Users className="size-12 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-hrbooteh-text-primary mb-3">
                تعامل با متخصصان
              </h3>
              <p className="text-hrbooteh-text-secondary leading-relaxed">
                ارزیابی‌های تعاملی با شبیه‌سازی گفتگوی واقعی با متخصصان حوزه HR
              </p>
            </div>

            <div className="p-8 w-1/2 -mt-px rounded-r-3xl py-20 border border-hrbooteh-primary border-l-0 group">
              <div className="size-24 bg-hrbooteh-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 md:group-hover:scale-110 group-active:scale-110 transition-transform">
                <BarChart3 className="size-12 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-hrbooteh-text-primary mb-3">
                گزارش جامع
              </h3>
              <p className="text-hrbooteh-text-secondary leading-relaxed">
                دریافت گزارش تفصیلی از نتایج ارزیابی‌ها همراه با راهکارهای بهبود
              </p>
            </div>
          </div>

          {/* Assessment Areas */}
          <div className="rounded-3xl p-8 max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-hrbooteh-text-primary mb-8">
              حوزه‌های ارزیابی
            </h2>
            <motion.div
              className="grid grid-cols-1 gap-6 text-right"
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.15,
                  },
                },
              }}
            >
              {[
                "شایستگی های فنی",
                "شایستگی های رفتاری",
                "شایستگی های فردی",
                "شایستگی های رهبری و مدیریت",
                "شایستگی های شناختی",
                "و موارد بیشتر..."
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-3 p-4 bg-hrbooteh-surface-elevated rounded-lg"
                  variants={{
                    hidden: { opacity: 0, y: 75 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: 0.6,
                        ease: "easeOut",
                      },
                    },
                  }}
                >
                  <span className="text-hrbooteh-text-primary font-medium">{item}</span>
                  <div className="w-2 h-2 mr-auto bg-gray-400/25 rounded-full" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-hrbooteh-surface border-t border-hrbooteh-surface-elevated mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <Logo variant="default" />
            <p className="text-hrbooteh-text-secondary/75 text-sm">
              2025 © HRbooteh. تمام حقوق محفوظ است.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
