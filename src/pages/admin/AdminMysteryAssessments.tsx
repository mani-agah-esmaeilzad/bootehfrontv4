// src/pages/admin/AdminMysteryAssessments.tsx

import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  adminCreateMysteryAssessment,
  adminDeleteMysteryAssessment,
  adminGetMysteryAssessments,
  adminUpdateMysteryAssessment,
} from "@/services/apiService";
import { LoaderCircle, Pencil, PlusCircle, Trash2, ImagePlus } from "lucide-react";

type MysteryImage = {
  id?: number;
  image_url: string;
  title: string;
  description?: string;
  ai_notes?: string;
  display_order?: number;
};

type MysteryAssessment = {
  id: number;
  name: string;
  slug: string;
  short_description: string;
  intro_message: string;
  guide_name: string;
  system_prompt: string;
  analysis_prompt?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  images: MysteryImage[];
};

const imageSchema = z.object({
  image_url: z.string().url({ message: "آدرس تصویر معتبر نیست." }),
  title: z.string().min(3, { message: "عنوان تصویر حداقل باید ۳ کاراکتر باشد." }),
  description: z.string().optional(),
  ai_notes: z.string().optional(),
  display_order: z.coerce.number().nonnegative().optional(),
});

const assessmentSchema = z.object({
  name: z.string().min(3, { message: "نام آزمون حداقل باید ۳ کاراکتر باشد." }),
  slug: z
    .string()
    .min(3, { message: "اسلاگ حداقل باید ۳ کاراکتر باشد." })
    .regex(/^[a-z0-9-]+$/i, { message: "اسلاگ فقط شامل حروف انگلیسی، اعداد و خط تیره باشد." }),
  short_description: z.string().min(20, { message: "توضیح کوتاه حداقل باید ۲۰ کاراکتر باشد." }),
  intro_message: z.string().min(10, { message: "پیام آغاز حداقل باید ۱۰ کاراکتر باشد." }),
  guide_name: z.string().min(2, { message: "نام راهنما حداقل باید ۲ کاراکتر باشد." }).optional(),
  system_prompt: z.string().min(30, { message: "پرامپت سیستم حداقل باید ۳۰ کاراکتر باشد." }),
  analysis_prompt: z.string().optional(),
  is_active: z.boolean().default(true),
  images: z.array(imageSchema).min(1, { message: "حداقل یک تصویر باید تعریف شود." }),
});

type MysteryFormValues = z.infer<typeof assessmentSchema>;

const emptyImage: MysteryImage = {
  image_url: "",
  title: "",
  description: "",
  ai_notes: "",
  display_order: 0,
};

const AdminMysteryAssessments = () => {
  const [assessments, setAssessments] = useState<MysteryAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<MysteryAssessment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MysteryFormValues>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      name: "",
      slug: "",
      short_description: "",
      intro_message: "",
      guide_name: "رازمَستر",
      system_prompt: "",
      analysis_prompt: "",
      is_active: true,
      images: [emptyImage],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "images",
  });

  const openCreateDialog = () => {
    setEditingAssessment(null);
    form.reset({
      name: "",
      slug: "",
      short_description: "",
      intro_message: "",
      guide_name: "رازمَستر",
      system_prompt: "",
      analysis_prompt: "",
      is_active: true,
      images: [emptyImage],
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (assessment: MysteryAssessment) => {
    setEditingAssessment(assessment);
    form.reset({
      name: assessment.name,
      slug: assessment.slug,
      short_description: assessment.short_description,
      intro_message: assessment.intro_message,
      guide_name: assessment.guide_name || "رازمَستر",
      system_prompt: assessment.system_prompt,
      analysis_prompt: assessment.analysis_prompt || "",
      is_active: assessment.is_active,
      images: assessment.images.length > 0 ? assessment.images.map((image, index) => ({
        image_url: image.image_url,
        title: image.title,
        description: image.description || "",
        ai_notes: image.ai_notes || "",
        display_order: image.display_order ?? index,
      })) : [emptyImage],
    });
    setIsDialogOpen(true);
  };

  const fetchAssessments = async () => {
    setIsLoading(true);
    try {
      const response = await adminGetMysteryAssessments();
      if (response.success) {
        setAssessments(response.data);
      } else {
        throw new Error(response.message || "خطا در دریافت لیست رازمایی");
      }
    } catch (error: any) {
      toast.error(error.message || "خطا در دریافت لیست رازمایی");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const handleSubmit = async (values: MysteryFormValues) => {
    setIsSubmitting(true);
    const payload = {
      ...values,
      guide_name: values.guide_name?.trim() || "رازمَستر",
      images: values.images.map((image, index) => ({
        ...image,
        display_order: image.display_order ?? index,
      })),
    };

    try {
      if (editingAssessment) {
        await adminUpdateMysteryAssessment(editingAssessment.id, payload);
        toast.success("رازمایی با موفقیت بروزرسانی شد.");
      } else {
        await adminCreateMysteryAssessment(payload);
        toast.success("رازمایی جدید ایجاد شد.");
      }
      setIsDialogOpen(false);
      fetchAssessments();
    } catch (error: any) {
      toast.error(error.message || "خطا در ذخیره رازمایی");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف این رازمایی اطمینان دارید؟")) return;
    try {
      await adminDeleteMysteryAssessment(id);
      toast.success("رازمایی حذف شد.");
      setAssessments((prev) => prev.filter((item) => item.id !== id));
    } catch (error: any) {
      toast.error(error.message || "خطا در حذف رازمایی");
    }
  };

  const assessmentsCount = useMemo(() => assessments.length, [assessments]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1 text-right">
          <h1 className="text-3xl font-bold">رازمایی‌ها</h1>
          <p className="text-sm text-slate-500">
            مدیریت سناریوهای تصویری و دستورالعمل‌های هوش مصنوعی برای گفتگوی تحلیلی.
          </p>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center gap-2 bg-purple-600 text-white hover:bg-purple-700">
          <PlusCircle className="h-4 w-4" />
          ایجاد رازمایی جدید
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>لیست رازمایی‌ها</CardTitle>
          <span className="text-sm text-slate-500">تعداد: {assessmentsCount}</span>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <LoaderCircle className="h-10 w-10 animate-spin text-purple-500" />
            </div>
          ) : assessments.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-purple-200 bg-purple-50/60 p-10 text-center text-sm text-slate-600">
              هنوز هیچ رازمایی ثبت نشده است. با دکمه بالا اولین مورد را بسازید.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>عنوان</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>تعداد تصاویر</TableHead>
                  <TableHead>آخرین بروزرسانی</TableHead>
                  <TableHead className="text-left">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessments.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell>
                      <div className="space-y-1 text-right">
                        <p className="font-semibold text-slate-900">{assessment.name}</p>
                        <p className="text-xs text-slate-500 line-clamp-2">{assessment.short_description}</p>
                      </div>
                    </TableCell>
                    <TableCell>{assessment.slug}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs ${assessment.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                        {assessment.is_active ? "فعال" : "غیرفعال"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">{assessment.images.length}</TableCell>
                    <TableCell className="text-sm text-slate-500">{new Date(assessment.updated_at).toLocaleString("fa-IR")}</TableCell>
                    <TableCell className="flex justify-end gap-3">
                      <Button variant="outline" size="icon" onClick={() => openEditDialog(assessment)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(assessment.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingAssessment ? "ویرایش رازمایی" : "ایجاد رازمایی جدید"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 text-right">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نام رازمایی</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: راز کافه نیمه‌شب" {...field} />
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
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: midnight-cafe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="guide_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نام راهنمای گفتگو</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: رازمَستر" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex h-full items-center justify-between rounded-lg border border-dashed border-purple-200 px-4 py-3">
                      <div className="space-y-1">
                        <FormLabel>فعال باشد؟</FormLabel>
                        <p className="text-xs text-slate-500">در صورت غیرفعال بودن، در لیست عمومی نمایش داده نمی‌شود.</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="short_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>توضیح کوتاه</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="توضیحی کوتاه و جذاب درباره سناریو" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="intro_message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>پیام آغاز گفتگو</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="پیام ابتدایی که رازمَستر به کاربر می‌گوید" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="system_prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>پرامپت سیستم برای هوش مصنوعی</FormLabel>
                    <FormControl>
                      <Textarea rows={6} placeholder="نقش AI، هدف گفتگو، لحن و ساختار سوالات را توضیح دهید" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="analysis_prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>پرامپت تحلیل نهایی (اختیاری)</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="اگر خالی باشد، تحلیل پیش‌فرض سیستم تولید می‌شود" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base font-semibold">تصاویر راز</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => append({ ...emptyImage, display_order: fields.length })}
                  >
                    <ImagePlus className="h-4 w-4" />
                    افزودن تصویر
                  </Button>
                </div>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="rounded-3xl border border-purple-100 bg-purple-50/40 p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">تصویر {index + 1}</span>
                        {fields.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`images.${index}.image_url` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>آدرس تصویر</FormLabel>
                              <FormControl>
                                <Input placeholder="https://example.com/image.jpg" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`images.${index}.title` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>عنوان تصویر</FormLabel>
                              <FormControl>
                                <Input placeholder="مثال: میز خالی کنار پنجره" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`images.${index}.description` as const}
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>توضیح قابل نمایش برای کاربر</FormLabel>
                              <FormControl>
                                <Textarea rows={3} placeholder="شرحی کوتاه که کاربر می‌خواند" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`images.${index}.ai_notes` as const}
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>نکات راهنما برای AI</FormLabel>
                              <FormControl>
                                <Textarea rows={3} placeholder="نشانه‌های مخفی، پیام‌های پنهان یا هدف تصویر برای مطرح شدن در سوالات" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`images.${index}.display_order` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ترتیب نمایش</FormLabel>
                              <FormControl>
                                <Input type="number" min={0} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-start">
                <Button type="submit" disabled={isSubmitting} className="bg-purple-600 text-white hover:bg-purple-700">
                  {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : editingAssessment ? "ذخیره تغییرات" : "ایجاد رازمایی"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  انصراف
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMysteryAssessments;
