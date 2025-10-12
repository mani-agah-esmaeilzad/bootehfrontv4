// src/pages/admin/AdminPersonalityAssessments.tsx

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import {
  adminCreatePersonalityTest,
  adminDeletePersonalityTest,
  adminGetPersonalityTests,
  adminUpdatePersonalityTest,
} from "@/services/apiService";
import { LoaderCircle, Pencil, PlusCircle, Trash2 } from "lucide-react";

type PersonalityTest = {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  report_name: string;
  highlights: string[];
  is_active: boolean;
  created_at: string;
};

const personalityTestSchema = z.object({
  name: z.string().min(3, "نام آزمون حداقل باید ۳ کاراکتر باشد."),
  slug: z
    .string()
    .min(3, "Slug حداقل باید ۳ کاراکتر باشد.")
    .regex(/^[a-z0-9-]+$/i, "Slug باید فقط شامل حروف، اعداد و خط تیره باشد."),
  tagline: z.string().min(5, "عنوان کوتاه حداقل باید ۵ کاراکتر باشد."),
  description: z.string().min(20, "توضیحات باید حداقل ۲۰ کاراکتر باشد."),
  report_name: z.string().min(3, "نام گزارش باید حداقل ۳ کاراکتر باشد."),
  highlights: z.string().min(10, "ویژگی‌ها باید حداقل ۱۰ کاراکتر باشد."),
  is_active: z.boolean().default(true),
});

type PersonalityFormValues = z.infer<typeof personalityTestSchema>;

const AdminPersonalityAssessments = () => {
  const [tests, setTests] = useState<PersonalityTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<PersonalityTest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PersonalityFormValues>({
    resolver: zodResolver(personalityTestSchema),
    defaultValues: {
      name: "",
      slug: "",
      tagline: "",
      description: "",
      report_name: "",
      highlights: "",
      is_active: true,
    },
  });

  const openCreateDialog = () => {
    setEditingTest(null);
    form.reset({
      name: "",
      slug: "",
      tagline: "",
      description: "",
      report_name: "",
      highlights: "",
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (test: PersonalityTest) => {
    setEditingTest(test);
    form.reset({
      name: test.name,
      slug: test.slug,
      tagline: test.tagline,
      description: test.description,
      report_name: test.report_name,
      highlights: test.highlights.join("\n"),
      is_active: test.is_active,
    });
    setIsDialogOpen(true);
  };

  const highlightsToArray = (highlights: string) =>
    highlights
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

  const fetchTests = async () => {
    setIsLoading(true);
    try {
      const response = await adminGetPersonalityTests();
      if (response.success) {
        setTests(response.data);
      } else {
        throw new Error(response.message || "خطا در دریافت لیست آزمون‌ها");
      }
    } catch (error: any) {
      toast.error(error.message || "خطا در دریافت لیست آزمون‌ها");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleSubmit = async (values: PersonalityFormValues) => {
    setIsSubmitting(true);
    const payload = {
      ...values,
      highlights: highlightsToArray(values.highlights),
    };

    try {
      if (editingTest) {
        await adminUpdatePersonalityTest(editingTest.id, payload);
        toast.success("آزمون با موفقیت بروزرسانی شد.");
      } else {
        await adminCreatePersonalityTest(payload);
        toast.success("آزمون جدید با موفقیت ایجاد شد.");
      }
      setIsDialogOpen(false);
      fetchTests();
    } catch (error: any) {
      toast.error(error.message || "خطا در ذخیره آزمون");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف این آزمون اطمینان دارید؟")) return;
    try {
      await adminDeletePersonalityTest(id);
      toast.success("آزمون با موفقیت حذف شد.");
      setTests((prev) => prev.filter((test) => test.id !== id));
    } catch (error: any) {
      toast.error(error.message || "خطا در حذف آزمون");
    }
  };

  const testsCount = useMemo(() => tests.length, [tests]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">آزمون‌های شخصیتی</h1>
          <p className="text-sm text-slate-500">
            مدیریت کامل آزمون‌های MBTI، NEO، Enneagram، DISC و CliftonStrengths با گزارش‌های اختصاصی.
          </p>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center gap-2 bg-purple-600 text-white hover:bg-purple-700">
          <PlusCircle className="h-4 w-4" />
          ایجاد آزمون جدید
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>لیست آزمون‌ها</CardTitle>
          <span className="text-sm text-slate-500">تعداد: {testsCount}</span>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <LoaderCircle className="h-10 w-10 animate-spin text-purple-500" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نام آزمون</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>گزارش</TableHead>
                  <TableHead className="text-left">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">{test.name}</TableCell>
                    <TableCell className="text-xs text-slate-500" dir="ltr">
                      {test.slug}
                    </TableCell>
                    <TableCell>{test.is_active ? "فعال" : "غیرفعال"}</TableCell>
                    <TableCell>{test.report_name}</TableCell>
                    <TableCell className="text-left">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEditDialog(test)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(test.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTest ? "ویرایش آزمون" : "ایجاد آزمون جدید"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نام آزمون</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: MBTI – نقشه تیپ‌های تعاملی" {...field} />
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
                        <Input placeholder="مثال: mbti" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="tagline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عنوان کوتاه</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: روایت تیپ‌ها در میدان واقعی سازمان" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>توضیحات کامل</FormLabel>
                    <FormControl>
                      <Textarea rows={5} placeholder="شرح دقیق آزمون و تجربه کاربر..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="report_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام گزارش خروجی</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: گزارش «هم‌نوردی تیمی»" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="highlights"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نکات کلیدی (هر خط یک مورد)</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="مثال:\nسازگارترین هم‌تیمی‌ها\nنقاط تنش با مدیر مستقیم" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <FormLabel className="font-medium">فعال باشد؟</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-3">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  انصراف
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "ذخیره آزمون"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPersonalityAssessments;
