// src/pages/BlogDetail.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight, LoaderCircle } from "lucide-react";
import { getBlogPost, resolveApiAssetUrl } from "@/services/apiService";
import type { BlogPostDetail } from "@/types/blog";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="text-sm leading-8 text-slate-700 md:text-base">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc space-y-2 pr-6 text-sm leading-8 text-slate-700 md:text-base">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal space-y-2 pr-6 text-sm leading-8 text-slate-700 md:text-base">
      {children}
    </ol>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-semibold text-slate-900 md:text-xl">{children}</h3>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-r-4 border-purple-200 pr-4 text-sm italic leading-8 text-slate-600 md:text-base">
      {children}
    </blockquote>
  ),
  img: ({ node, ...props }) => {
    const src = typeof props.src === "string" ? resolveApiAssetUrl(props.src) : undefined;
    if (!src) return null;
    return (
      <figure className="my-10 space-y-3">
        <div className="overflow-hidden rounded-[32px] border border-purple-100 bg-slate-50">
          <img
            {...props}
            src={src}
            alt={props.alt ?? ""}
            className="h-full w-full object-cover"
          />
        </div>
        {props.alt && (
          <figcaption className="text-xs text-slate-500">{props.alt}</figcaption>
        )}
      </figure>
    );
  },
  a: ({ children, ...props }) => (
    <a
      {...props}
      className="text-purple-600 underline-offset-4 hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
};

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

const BlogDetail = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const fetchPost = async () => {
      setIsLoading(true);
      try {
        const response = await getBlogPost(slug);
        if (response.success) {
          setPost(response.data);
        } else {
          throw new Error(response.message || "مقاله یافت نشد");
        }
      } catch (error: any) {
        toast.error(error.message || "خطا در دریافت مقاله");
        setPost(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  const coverImageSrc = useMemo(
    () => resolveApiAssetUrl(post?.cover_image_url),
    [post?.cover_image_url]
  );


  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-slate-900" dir="rtl">
        <LoaderCircle className="h-12 w-12 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white text-slate-900" dir="rtl">
        <div className="max-w-md space-y-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">مقاله مورد نظر یافت نشد</h1>
          <p className="text-sm leading-7 text-slate-600">
            احتمالاً این مقاله حذف شده یا هنوز منتشر نشده است. لطفاً به صفحه بلاگ بازگردید و سایر مقالات را بررسی کنید.
          </p>
          <Button className="mx-auto flex items-center gap-2" onClick={() => navigate("/blog")}>
            بازگشت به بلاگ
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-purple-100/60 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-5 md:px-6">
          <div className="space-y-1 text-right">
            <p className="text-xs font-semibold text-purple-600">مجله تخصصی بوته</p>
            <h1 className="text-2xl font-bold md:text-3xl">{post.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 md:text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatPersianDate(post.published_at || post.created_at)}</span>
            </div>
            <span>•</span>
            <span>{post.author || "تیم بوته"}</span>
          </div>
          <Button
            variant="ghost"
            className="hidden items-center gap-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 md:flex"
            onClick={() => navigate(-1)}
          >
            <ArrowRight className="h-4 w-4" />
            بازگشت
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl space-y-10 px-4 py-12 md:px-6 md:py-16">
        {coverImageSrc && (
          <div className="overflow-hidden rounded-[32px] border border-purple-100 bg-slate-50">
            <img src={coverImageSrc} alt={post.title} className="h-full w-full object-cover" />
          </div>
        )}

        <article className="space-y-6 text-right leading-8 text-slate-700">
          <ReactMarkdown components={markdownComponents}>{post.content}</ReactMarkdown>
        </article>

        <div className="mt-12 flex flex-col items-end justify-between gap-4 border-t border-purple-100/60 pt-6 text-right text-xs text-slate-500 md:flex-row md:text-sm">
          <span>نویسنده: {post.author || "تیم بوته"}</span>
          <div className="flex items-center gap-3">
            <span>منتشر شده در: {formatPersianDate(post.published_at || post.created_at)}</span>
            <span>آخرین به‌روزرسانی: {formatPersianDate(post.updated_at || post.published_at || post.created_at)}</span>
          </div>
        </div>

        <div className="flex justify-center pt-6">
          <Button variant="outline" className="flex items-center gap-2" onClick={() => navigate("/blog")}>
            مشاهده سایر مقالات
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
};

export default BlogDetail;
