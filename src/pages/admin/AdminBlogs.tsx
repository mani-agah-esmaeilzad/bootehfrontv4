// src/pages/admin/AdminBlogs.tsx

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  adminCreateBlogPost,
  adminGetBlogPosts,
  BlogPostPayload,
} from "@/services/apiService";
import type { AdminBlogPost } from "@/types/blog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LoaderCircle, RefreshCcw } from "lucide-react";

const blogPostSchema = z.object({
  title: z.string().min(3, { message: "عنوان باید حداقل ۳ کاراکتر باشد." }),
  slug: z
    .string()
    .min(3, { message: "اسلاگ باید حداقل ۳ کاراکتر باشد." })
    .regex(/^[a-z0-9-]+$/i, { message: "اسلاگ فقط می‌تواند شامل حروف، اعداد و خط تیره باشد." }),
  excerpt: z
    .string()
    .min(10, { message: "خلاصه باید حداقل ۱۰ کاراکتر باشد." })
    .max(400, { message: "خلاصه حداکثر می‌تواند ۴۰۰ کاراکتر باشد." }),
  content: z.string().min(100, { message: "متن مقاله باید حداقل ۱۰۰ کاراکتر باشد." }),
  cover_image_url: z
    .union([
      z
        .string()
        .trim()
        .url({ message: "آدرس تصویر معتبر نیست." }),
      z.literal(""),
    ])
    .optional(),
  author: z
    .union([
      z
        .string()
        .min(2, { message: "نام نویسنده باید حداقل ۲ کاراکتر باشد." })
        .max(100, { message: "نام نویسنده حداکثر می‌تواند ۱۰۰ کاراکتر باشد." }),
      z.literal(""),
    ])
    .optional(),
  is_published: z.boolean().default(true),
});

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

const AdminBlogs = () => {
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof blogPostSchema>>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      cover_image_url: "",
      author: "تیم بوته",
      is_published: true,
    },
  });

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const response = await adminGetBlogPosts();
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

  useEffect(() => {
    fetchPosts();
  }, []);

  const onSubmit = async (values: z.infer<typeof blogPostSchema>) => {
    setIsSubmitting(true);
    try {
      const payload: BlogPostPayload = {
        title: values.title.trim(),
        slug: values.slug.trim().toLowerCase(),
        excerpt: values.excerpt.trim(),
        content: values.content.trim(),
        cover_image_url: values.cover_image_url?.trim() ? values.cover_image_url.trim() : undefined,
        author: values.author?.trim() ? values.author.trim() : undefined,
        is_published: values.is_published,
      };

      const response = await adminCreateBlogPost(payload);
      if (!response.success) {
        throw new Error(response.message || "خطا در ثبت مقاله");
      }

      toast.success("مقاله جدید با موفقیت منتشر شد.");
      form.reset({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        cover_image_url: "",
        author: "تیم بوته",
        is_published: true,
      });
      await fetchPosts();
    } catch (error: any) {
      toast.error(error.message || "خطا در ثبت مقاله");
    } finally {
      setIsSubmitting(false);
    }
  };

  const publishedCount = useMemo(
    () => posts.filter((post) => post.is_published).length,
    [posts]
  );

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2 text-right">
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">مدیریت بلاگ</h1>
          <p className="text-sm text-slate-600">
            مقالات تخصصی بوته را از این بخش مدیریت، منتشر و آرشیو کنید.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="px-3 py-1 text-xs text-slate-600">
            {publishedCount} مقاله منتشر شده
          </Badge>
          <Button
            variant="outline"
            size="icon"
            className="border border-purple-200 text-purple-700 hover:border-purple-300 hover:text-purple-800"
            onClick={fetchPosts}
            disabled={isLoading}
          >
            <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.3fr]">
        <Card>
          <CardHeader>
            <CardTitle>ثبت مقاله جدید</CardTitle>
            <CardDescription>عنوان، خلاصه و متن مقاله را وارد کنید. در صورت تمایل می‌توانید آدرس تصویر شاخص را هم اضافه کنید.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عنوان مقاله</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: چگونه گیمیفیکیشن انگیزه کارکنان را تقویت می‌کند؟" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسلاگ (آدرس مقاله)</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: gamification-in-hr" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>خلاصه مقاله</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="چند جمله جذاب درباره محتوای مقاله بنویسید..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>متن کامل مقاله</FormLabel>
                      <FormControl>
                        <Textarea rows={10} placeholder="متن اصلی مقاله را اینجا بنویسید..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cover_image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>آدرس تصویر شاخص (اختیاری)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/cover.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="author"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نام نویسنده (اختیاری)</FormLabel>
                      <FormControl>
                        <Input placeholder="نام نویسنده یا تیم محتوا" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_published"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border border-dashed border-purple-200 p-4">
                      <div className="space-y-1 text-right">
                        <FormLabel>انتشار فوری</FormLabel>
                        <CardDescription className="text-xs text-slate-500">
                          با فعال بودن این گزینه، مقاله بلافاصله در سایت نمایش داده می‌شود.
                        </CardDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "ثبت مقاله"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-2 text-right">
            <CardTitle>فهرست مقالات</CardTitle>
            <CardDescription>
              {posts.length > 0
                ? "نمایش آخرین مقالات منتشر شده یا در حال آماده‌سازی"
                : "هنوز مقاله‌ای ثبت نشده است."}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <LoaderCircle className="h-10 w-10 animate-spin text-purple-500" />
              </div>
            ) : posts.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="text-right">
                      <TableHead className="text-right">عنوان</TableHead>
                      <TableHead className="text-right">وضعیت</TableHead>
                      <TableHead className="text-right">تاریخ انتشار</TableHead>
                      <TableHead className="text-right">آخرین بروزرسانی</TableHead>
                      <TableHead className="text-right">اسلاگ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post.id} className="text-right">
                        <TableCell className="max-w-xs">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-900">{post.title}</p>
                            <p className="text-xs text-slate-500">{post.excerpt}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={post.is_published ? "default" : "secondary"}>
                            {post.is_published ? "منتشر شده" : "پیش‌نویس"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {formatPersianDate(post.published_at)}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {formatPersianDate(post.updated_at)}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {post.slug}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="px-6 pb-10">
                <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/60 p-8 text-center text-sm text-slate-600">
                  هیچ مقاله‌ای برای نمایش وجود ندارد. اولین مقاله‌تان را با فرم کنار این بخش ایجاد کنید.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminBlogs;
