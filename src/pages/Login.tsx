// src/pages/Login.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import { useNavigate } from "react-router-dom";
import apiFetch from "@/services/apiService";
import { toast } from "sonner";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await apiFetch('auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.success) {
        // *** FIX APPLIED HERE ***
        // We no longer save the token in localStorage.
        // Instead, we set a simple flag to indicate the user is logged in.
        localStorage.setItem('isLoggedIn', 'true');

        toast.success("ورود با موفقیت انجام شد!");
        navigate('/dashboard');
      } else {
        throw new Error(response.message || 'ایمیل یا رمز عبور نامعتبر است');
      }
    } catch (error: any) {
      toast.error(error.message || 'خطا در ورود به سیستم. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hrbooteh-gradient-subtle flex items-center justify-center p-0 md:p-4">
      <Card className="w-full max-w-md shadow-hrbooteh-lg border-0 bg-hrbooteh-surface">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo variant="large" />
          </div>
          <CardTitle className="text-2xl font-bold text-hrbooteh-text-primary">ورود به حساب کاربری</CardTitle>
          <CardDescription className="text-hrbooteh-text-secondary">برای ادامه وارد حساب خود شوید</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">ایمیل</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
                <Button type="button" variant="hrbooteh-ghost" size="icon-sm" className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <Button type="submit" variant="hrbooteh-gradient" size="md" className="w-full" disabled={isLoading}>
              {isLoading ? <LoaderCircle className="animate-spin" /> : 'ورود'}
            </Button>
          </form>
          <div className="text-center mt-6">
            <p className="text-hrbooteh-text-secondary text-sm">
              حساب کاربری ندارید؟{" "}
              <button onClick={() => navigate('/register')} className="text-hrbooteh-primary hover:text-hrbooteh-primary-hover font-medium underline-offset-4 hover:underline transition-colors">
                ثبت‌نام کنید
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
