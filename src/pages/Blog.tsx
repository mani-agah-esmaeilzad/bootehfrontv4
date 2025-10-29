// src/pages/Blog.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft, ArrowUpRight, LoaderCircle } from "lucide-react";
import { getBlogPosts, resolveApiAssetUrl } from "@/services/apiService";
import type { BlogPostSummary } from "@/types/blog";
import { toast } from "sonner";

const formatPersianDate = (value: string | null | undefined) => {
  if (!value) return "در انتظار انتشار";
  try {
    return new Date(value).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "در انتظار انتشار";
  }
};

const Blog = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const response = await getBlogPosts();
        if (response.success) {
          setPosts(response.data);
        } else {
          throw new Error(response.message || "خطا در دریافت مقالات");
        }
      } catch (error: any) {
        toast.error(error.message || "خطا در دریافت مقالات");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-purple-100/60 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 md:px-6">
          <div className="space-y-1 text-right">
            <p className="text-xs font-semibold text-purple-600">مجله تخصصی بوته</p>
            <h1 className="text-2xl font-bold md:text-3xl">بینش‌ها و تجربه‌های دنیای توسعه شایستگی</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
              بازگشت
            </Button>
            <Button
              variant="outline"
              className="border border-purple-200 text-purple-700 hover:border-purple-300 hover:text-purple-800"
              onClick={() => navigate("/")}
            >
              صفحه اصلی
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-12 px-4 py-12 md:px-6 md:py-16">
        <section className="rounded-[32px] border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-white p-8 shadow-sm md:p-12">
          <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div className="space-y-4 text-right">
              <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">از تجربه‌های میدانی تا روایت‌های رشد</h2>
              <p className="text-sm leading-8 text-slate-700 md:text-base">
                هر یادداشت در بلاگ بوته، برداشت ما از چالش‌های واقعی منابع انسانی، توسعه شایستگی و طراحی تجربه‌های یادگیری است. حاصل گفتگوی کارشناسان، داده‌های واقعی و
                روایت‌هایی از سازمان‌های همکار.
              </p>
              <div className="flex flex-wrap justify-end gap-3 text-xs text-purple-600">
                <span className="inline-flex items-center gap-2 rounded-full border border-purple-200/70 px-4 py-2">
                  سناریوهای واقعی
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-purple-200/70 px-4 py-2">
                  تحلیل داده‌محور
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-purple-200/70 px-4 py-2">
                  راهکارهای قابل اجرا
                </span>
              </div>
            </div>
            <div className="rounded-[28px] border border-purple-100 bg-white/80 p-6 text-right shadow-inner">
              <h3 className="text-lg font-semibold text-slate-900">در این بلاگ چه می‌خوانید؟</h3>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                <li>• معرفی تازه‌ترین رویکردهای ارزیابی شایستگی با هوش مصنوعی</li>
                <li>• تجربه‌های موفق سازمان‌ها در طراحی مسیر رشد کارکنان</li>
                <li>• راهنمای عملی پیاده‌سازی گیمیفیکیشن در توسعه منابع انسانی</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">آخرین مقالات منتشر شده</h2>
            <p className="max-w-xl text-sm leading-8 text-slate-700">
              برای دریافت به‌روزترین بینش‌ها در حوزه منابع انسانی و توسعه مدیران، به طور منظم به این صفحه سر بزنید.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <LoaderCircle className="h-10 w-10 animate-spin text-purple-500" />
            </div>
          ) : posts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => {
                const coverImage = resolveApiAssetUrl(post.cover_image_url);
                return (
                  <article
                    key={post.id}
                    className="flex h-full flex-col overflow-hidden rounded-3xl border border-purple-100 bg-white/95 shadow-sm transition hover:-translate-y-1 hover:border-purple-200"
                  >
                    {coverImage && (
                      <div className="h-48 w-full overflow-hidden bg-slate-100">
                        <img src={coverImage} alt={post.title} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="flex h-full flex-col justify-between gap-4 p-6 text-right">
                      <div className="space-y-3">
                        <div className="flex items-center justify-end gap-2 text-xs text-slate-500">
                          <Calendar className="h-4 w-4" />
                          <span>{formatPersianDate(post.published_at || post.created_at)}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">{post.title}</h3>
                        <p className="text-sm leading-7 text-slate-700">{post.excerpt}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-purple-600">{post.author || "تیم بوته"}</span>
                        <Button
                          variant="ghost"
                          className="flex items-center gap-2 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                          onClick={() => navigate(`/blog/${post.slug}`)}
                        >
                          ادامه مطلب
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-purple-200 bg-white/70 p-10 text-center text-sm text-slate-600">
              هنوز مقاله‌ای منتشر نشده است. به زودی با تازه‌ترین محتواهای تخصصی در خدمت شما خواهیم بود.
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Blog;
