// src/pages/admin/AdminLayout.tsx

import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, BarChart3, Sparkles, BarChart4, LogOut, Newspaper } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const AdminLayout = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // چون بک‌اند کوکی را پاک می‌کند، فقط کافی است فلگ localStorage را حذف کنیم
        localStorage.removeItem('isAdminLoggedIn');
        toast.success('با موفقیت خارج شدید.');
        navigate('/admin/login');
    };

    const navItems = [
        { to: "/admin/dashboard", icon: <LayoutDashboard className="h-5 w-5" />, label: "داشبورد" },
        { to: "/admin/questionnaires", icon: <FileText className="h-5 w-5" />, label: "پرسشنامه‌ها" },
        { to: "/admin/users", icon: <Users className="h-5 w-5" />, label: "کاربران" },
        { to: "/admin/reports", icon: <BarChart3 className="h-5 w-5" />, label: "گزارش‌ها" },
        { to: "/admin/blog", icon: <Newspaper className="h-5 w-5" />, label: "بلاگ" },
        { to: "/admin/personality-tests", icon: <Sparkles className="h-5 w-5" />, label: "آزمون‌های شخصیتی" },
        { to: "/admin/personality-results", icon: <BarChart4 className="h-5 w-5" />, label: "نتایج شخصیتی" },
    ];

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="h-16 flex items-center justify-center px-4 border-b border-gray-200 dark:border-gray-700">
                    <Logo variant="large" />
                </div>
                <nav className="flex-1 px-4 py-6 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                isActive ? 'bg-gray-100 dark:bg-gray-700 font-semibold text-hrbooteh-primary' : ''
                                }`
                            }
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="flex items-center justify-start gap-3 w-full text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50 hover:text-red-600"
                    >
                        <LogOut className="h-5 w-5" />
                        <span>خروج</span>
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">
                    {/* کامپوننت‌های فرزند (صفحات داخلی ادمین) در اینجا رندر می‌شوند */}
                    <Outlet /> 
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
