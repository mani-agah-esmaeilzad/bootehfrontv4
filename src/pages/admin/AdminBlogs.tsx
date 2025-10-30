// src/pages/admin/AdminBlogs.tsx

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  adminCreateBlogPost,
  adminDeleteBlogPost,
  adminGetBlogPosts,
  adminUpdateBlogPost,
  adminUploadBlogImage,
  BlogPostPayload,
  resolveApiAssetUrl,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, ImagePlus, LoaderCircle, MoreHorizontal, RefreshCcw, Trash2, X } from "lucide-react";

const isValidImageUrl = (value: string) => {
  if (!value) return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  return (
    /^https?:\/\//i.test(trimmed) ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("uploads/") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  );
};

const imageUrlSchema = z
  .string()
  .trim()
  .refine(isValidImageUrl, { message: "آدرس تصویر معتبر نیست." });

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
  cover_image_url: imageUrlSchema.optional(),
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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingInlineImage, setIsUploadingInlineImage] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingPost, setEditingPost] = useState<AdminBlogPost | null>(null);
  const [postToDelete, setPostToDelete] = useState<AdminBlogPost | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inlineImageInputRef = useRef<HTMLInputElement | null>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);

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

  const coverImageValue = form.watch("cover_image_url");
  const coverPreviewUrl = useMemo(
    () => resolveApiAssetUrl(coverImageValue),
    [coverImageValue]
  );

  const insertImageAtCursor = (rawUrl: string) => {
    if (!rawUrl) return;
    const textarea = contentTextareaRef.current;
    const currentContent = form.getValues("content") ?? "";
    const markdownSnippet = `\n\n![تصویر مقاله](${rawUrl})\n\n`;

    if (!textarea) {
      form.setValue("content", `${currentContent}${markdownSnippet}`, {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    const selectionStart = textarea.selectionStart ?? currentContent.length;
    const selectionEnd = textarea.selectionEnd ?? currentContent.length;
    const nextContent =
      currentContent.slice(0, selectionStart) +
      markdownSnippet +
      currentContent.slice(selectionEnd);

    form.setValue("content", nextContent, {
      shouldDirty: true,
      shouldValidate: true,
    });

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = selectionStart + markdownSnippet.length;
      textarea.selectionStart = cursor;
      textarea.selectionEnd = cursor;
    });
  };

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

      if (editingPost) {
        const response = await adminUpdateBlogPost(editingPost.id, payload);
        if (!response.success) {
          throw new Error(response.message || "خطا در بروزرسانی مقاله");
        }
        toast.success("تغییرات مقاله با موفقیت ذخیره شد.");
      } else {
        const response = await adminCreateBlogPost(payload);
        if (!response.success) {
          throw new Error(response.message || "خطا در ثبت مقاله");
        }
        toast.success("مقاله جدید با موفقیت منتشر شد.");
      }

      setEditingPost(null);
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
      toast.error(error.message || "خطا در ذخیره مقاله");
    } finally {
      setIsSubmitting(false);
    }
  };

  const publishedCount = useMemo(
    () => posts.filter((post) => post.is_published).length,
    [posts]
  );

  const handleStartEdit = (post: AdminBlogPost) => {
    setEditingPost(post);
    form.reset({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      content: post.content,
      cover_image_url: post.cover_image_url || "",
      author: post.author || "تیم بوته",
      is_published: post.is_published,
    });
    toast.info("در حال ویرایش مقاله انتخاب‌شده هستید.");
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    form.reset({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      cover_image_url: "",
      author: "تیم بوته",
      is_published: true,
    });
  };

  const handleDeleteRequest = (post: AdminBlogPost) => {
    setPostToDelete(post);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    try {
      const response = await adminDeleteBlogPost(postToDelete.id);
      if (!response.success) {
        throw new Error(response.message || "خطا در حذف مقاله");
      }
      toast.success("مقاله مورد نظر حذف شد.");
      if (editingPost?.id === postToDelete.id) {
        handleCancelEdit();
      }
      await fetchPosts();
    } catch (error: any) {
      toast.error(error.message || "خطا در حذف مقاله");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const response = await adminUploadBlogImage(file);
      if (!response.success) {
        throw new Error(response.message || "خطا در آپلود تصویر");
      }
      const uploadedUrl = response.data?.url;
      if (!uploadedUrl) {
        throw new Error("آدرس تصویر دریافتی نامعتبر است.");
      }
      form.setValue("cover_image_url", uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast.success("تصویر با موفقیت بارگذاری شد.");
    } catch (error: any) {
      toast.error(error.message || "خطا در آپلود تصویر");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleInlineImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingInlineImage(true);
    try {
      const response = await adminUploadBlogImage(file);
      if (!response.success) {
        throw new Error(response.message || "خطا در آپلود تصویر");
      }
      const uploadedUrl = response.data?.url;
      if (!uploadedUrl) {
        throw new Error("آدرس تصویر دریافتی نامعتبر است.");
      }
      insertImageAtCursor(uploadedUrl);
      toast.success("تصویر در متن مقاله درج شد.");
    } catch (error: any) {
      toast.error(error.message || "خطا در آپلود تصویر");
    } finally {
      setIsUploadingInlineImage(false);
      if (inlineImageInputRef.current) {
        inlineImageInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      <input
        ref={inlineImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInlineImageUpload}
      />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف مقاله</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف مقاله&nbsp;
              <span className="font-semibold text-slate-900">
                {postToDelete?.title}
              </span>
              &nbsp;اطمینان دارید؟ این عملیات قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                "حذف مقاله"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                {editingPost && (
                  <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-right text-sm text-amber-700 md:flex-row md:items-center md:justify-between">
                    <div>
                      در حال ویرایش مقاله{" "}
                      <span className="font-semibold text-slate-900">{editingPost.title}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                    >
                      <X className="ml-2 h-4 w-4" />
                      لغو ویرایش
                    </Button>
                  </div>
                )}
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
                        <div className="space-y-3">
                          <Textarea
                            rows={12}
                            placeholder="متن اصلی مقاله را اینجا بنویسید..."
                            {...field}
                            ref={(element) => {
                              field.ref(element);
                              contentTextareaRef.current = element;
                            }}
                          />
                          <div className="flex flex-col items-start gap-2 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
                            <p>
                              از نگارش مارک‌داون پشتیبانی می‌کنیم. برای افزودن تصویر میان متن از
                              دکمه زیر استفاده کنید.
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                              onClick={() => inlineImageInputRef.current?.click()}
                              disabled={isUploadingInlineImage}
                            >
                              {isUploadingInlineImage ? (
                                <>
                                  <LoaderCircle className="h-4 w-4 animate-spin" />
                                  در حال آپلود تصویر
                                </>
                              ) : (
                                <>
                                  <ImagePlus className="h-4 w-4" />
                                  افزودن تصویر به متن
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
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
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col gap-3 md:flex-row">
                            <Input
                              placeholder="https://example.com/cover.jpg"
                              className="md:flex-1"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploadingImage}
                              className="whitespace-nowrap"
                            >
                              {isUploadingImage ? (
                                <>
                                  <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
                                  در حال آپلود...
                                </>
                              ) : (
                                <>
                                  <ImagePlus className="ml-2 h-4 w-4" />
                                  بارگذاری تصویر
                                </>
                              )}
                            </Button>
                          </div>
                          {coverPreviewUrl && (
                            <div className="overflow-hidden rounded-xl border border-dashed border-purple-200 bg-purple-50/60 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-xs text-slate-500">پیش‌نمایش تصویر</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() =>
                                    form.setValue("cover_image_url", "", {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    })
                                  }
                                >
                                  <X className="ml-2 h-4 w-4" />
                                  حذف تصویر
                                </Button>
                              </div>
                              <div className="mt-3 overflow-hidden rounded-lg border border-purple-100 bg-white">
                                <img
                                  src={coverPreviewUrl}
                                  alt="پیش‌نمایش تصویر مقاله"
                                  className="h-56 w-full object-cover"
                                />
                              </div>
                            </div>
                          )}
                        </div>
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
                  {isSubmitting ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : editingPost ? (
                    "ذخیره تغییرات"
                  ) : (
                    "ثبت مقاله"
                  )}
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
                      <TableHead className="text-right">عملیات</TableHead>
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
                        <TableCell className="text-xs text-slate-500" dir="ltr">
                          {post.slug}
                        </TableCell>
                        <TableCell className="w-0">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => handleStartEdit(post)}>
                                <Edit className="ml-2 h-4 w-4" />
                                ویرایش
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDeleteRequest(post)}
                              >
                                <Trash2 className="ml-2 h-4 w-4" />
                                حذف
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
