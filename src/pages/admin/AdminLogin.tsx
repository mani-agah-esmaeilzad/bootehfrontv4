// src/pages/admin/AdminLogin.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
// *** FIX APPLIED HERE: The import path is now correct ***
import { useNavigate } from "react-router-dom";
import apiFetch from "@/services/apiService";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await apiFetch('admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (response.success) {
        localStorage.setItem('isAdminLoggedIn', 'true');
        toast.success("ورود با موفقیت انجام شد!");
        navigate('/admin/dashboard');
      } else {
        throw new Error(response.message || 'نام کاربری یا رمز عبور نامعتبر است');
      }
    } catch (error: any) {
      toast.error(error.message || 'خطا در ورود به سیستم');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo variant="large" />
          </div>
          <CardTitle className="text-2xl font-bold">ورود به پنل مدیریت</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">نام کاربری</Label>
              <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <LoaderCircle className="animate-spin" /> : 'ورود'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
