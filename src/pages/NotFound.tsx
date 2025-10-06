import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { Home, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-hrbooteh-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-hrbooteh-lg border-0 bg-hrbooteh-surface text-center">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <Logo variant="large" />
          </div>
          
          <div className="w-20 h-20 bg-hrbooteh-warning/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-hrbooteh-warning" />
          </div>
          
          <h1 className="text-6xl font-bold text-hrbooteh-primary mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-hrbooteh-text-primary mb-3">
            صفحه یافت نشد
          </h2>
          <p className="text-hrbooteh-text-secondary mb-8 leading-relaxed">
            متأسفانه صفحه‌ای که به دنبال آن هستید وجود ندارد یا ممکن است منتقل شده باشد.
          </p>
          
          <div className="space-y-3">
            <Button 
              variant="hrbooteh" 
              size="lg" 
              onClick={() => navigate('/')}
              className="w-full group"
            >
              <Home className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
              بازگشت به صفحه اصلی
            </Button>
            <Button 
              variant="hrbooteh-ghost" 
              size="lg" 
              onClick={() => navigate(-1)}
              className="w-full"
            >
              بازگشت به صفحه قبل
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default NotFound;
