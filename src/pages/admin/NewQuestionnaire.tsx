// src/pages/admin/NewQuestionnaire.tsx

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import apiFetch from "@/services/apiService";
import { LoaderCircle, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QUESTIONNAIRE_CATEGORIES } from "@/constants/questionnaireCategories";

type MysteryOption = {
  id: number;
  name: string;
  slug: string;
};

const questionnaireSchema = z.object({
  name: z.string().min(3, { message: "نام پرسشنامه حداقل باید ۳ کاراکتر باشد." }),
  category: z.enum(QUESTIONNAIRE_CATEGORIES, { errorMap: () => ({ message: "یک دسته‌بندی معتبر انتخاب کنید." }) }),
  welcome_message: z.string().min(10, { message: "پیام خوشامدگویی حداقل باید ۱۰ کاراکتر باشد." }),
  persona_name: z.string().min(2, { message: "نام نقش AI حداقل باید ۲ کاراکتر باشد." }),
  persona_prompt: z.string().min(20, { message: "پرامپت شخصیت AI حداقل باید ۲۰ کاراکتر باشد." }),
  analysis_prompt: z.string().min(20, { message: "پرامپت تحلیل حداقل باید ۲۰ کاراکتر باشد." }),
  has_timer: z.boolean().default(false),
  timer_duration: z.coerce.number().optional(),
  secondary_persona_name: z.string().optional(),
  secondary_persona_prompt: z.string().optional(),
  next_mystery_slug: z
    .union([
      z
        .string()
        .trim()
        .regex(/^[a-z0-9-]+$/i, { message: "اسلاگ باید فقط شامل حروف انگلیسی، اعداد و خط تیره باشد." }),
      z.literal('')
    ])
    .optional()
    .nullable(),
});

const NewQuestionnaire = () => {
  const navigate = useNavigate();
  const [mysteryOptions, setMysteryOptions] = useState<MysteryOption[]>([]);
  const [isLoadingMysteries, setIsLoadingMysteries] = useState(false);
  const form = useForm<z.infer<typeof questionnaireSchema>>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      name: "",
      category: QUESTIONNAIRE_CATEGORIES[0],
      welcome_message: "",
      persona_name: "مشاور",
      persona_prompt: "",
      analysis_prompt: "",
      has_timer: false,
      timer_duration: 15,
      secondary_persona_name: "",
      secondary_persona_prompt: "",
      next_mystery_slug: "",
    },
  });

  useEffect(() => {
    const fetchMysteries = async () => {
      setIsLoadingMysteries(true);
      try {
        const response = await apiFetch('admin/mystery');
        if (response.success && Array.isArray(response.data)) {
          const options = response.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            slug: item.slug,
          }));
          setMysteryOptions(options);
        }
      } catch (error: any) {
        console.error('Failed to load mystery assessments for mapping', error);
      } finally {
        setIsLoadingMysteries(false);
      }
    };

    fetchMysteries();
  }, []);

  const onSubmit = async (values: z.infer<typeof questionnaireSchema>) => {
    try {
      const payload = {
        ...values,
        next_mystery_slug: values.next_mystery_slug && values.next_mystery_slug.trim().length > 0
          ? values.next_mystery_slug.trim()
          : null,
      };

      await apiFetch('admin/questionnaires', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      toast.success("پرسشنامه جدید با موفقیت ایجاد شد.");
      navigate('/admin/questionnaires');
    } catch (error: any) {
      toast.error("خطا در ایجاد پرسشنامه: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
            <Button onClick={() => navigate('/admin/questionnaires')} variant="outline" size="icon">
                <ArrowRight className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">ایجاد پرسشنامه جدید</h1>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>اطلاعات اصلی پرسشنامه</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>نام پرسشنامه</FormLabel> <FormControl><Input placeholder="مثال: ارزیابی مهارت مذاکره" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>دسته‌بندی</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="یک دسته‌بندی انتخاب کنید" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {QUESTIONNAIRE_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="welcome_message" render={({ field }) => ( <FormItem> <FormLabel>پیام خوشامدگویی</FormLabel> <FormControl><Textarea placeholder="پیامی که در ابتدای چت به کاربر نمایش داده می‌شود" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>شخصیت AI اصلی (مشاور)</CardTitle>
                <CardDescription>این AI مکالمه اصلی را با کاربر پیش می‌برد.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField control={form.control} name="persona_name" render={({ field }) => ( <FormItem> <FormLabel>نام نقش AI اصلی</FormLabel> <FormControl><Input placeholder="مثال: مشاور منابع انسانی" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="persona_prompt" render={({ field }) => ( <FormItem> <FormLabel>پرامپت شخصیت AI اصلی</FormLabel> <FormControl><Textarea rows={8} placeholder="شخصیت و وظایف AI اصلی را اینجا تعریف کنید..." {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              </CardContent>
            </Card>

            {/* ✅ بخش جدید برای AI دوم با ظاهر هماهنگ */}
            <Card>
              <CardHeader>
                <CardTitle>شخصیت AI دوم (ناظر - اختیاری)</CardTitle>
                <CardDescription>این AI می‌تواند مکالمه را مشاهده و در صورت نیاز مداخله کند. اگر نام نقش خالی باشد، این AI غیرفعال خواهد بود.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField control={form.control} name="secondary_persona_name" render={({ field }) => ( <FormItem> <FormLabel>نام نقش AI دوم</FormLabel> <FormControl><Input placeholder="مثال: مبصر، راهنمای فنی، ..." {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="secondary_persona_prompt" render={({ field }) => ( <FormItem> <FormLabel>پرامپت شخصیت AI دوم</FormLabel> <FormControl><Textarea rows={8} placeholder="وظایف و شرایط مداخله AI دوم را اینجا تعریف کنید..." {...field} /></FormControl> <FormDescription>پرامپت باید شامل این باشد که اگر نیازی به مداخله نیست، عبارت '__NO_INTERVENTION__' را برگرداند.</FormDescription> <FormMessage /> </FormItem> )}/>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تنظیمات نهایی</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="next_mystery_slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مرحله رازآموزی پس از این پرسشنامه (اختیاری)</FormLabel>
                      <Select
                        value={field.value ?? ''}
                        onValueChange={(value) => field.onChange(value || '')}
                        disabled={isLoadingMysteries}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isLoadingMysteries ? "در حال بارگذاری..." : "انتخاب رازآموزی"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">بدون مرحله رازآموزی</SelectItem>
                          {mysteryOptions.map((option) => (
                            <SelectItem key={option.slug} value={option.slug}>
                              {option.name} ({option.slug})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        در صورت انتخاب، پس از پایان این پرسشنامه کاربر به رازآموزی مربوط هدایت می‌شود.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="analysis_prompt" render={({ field }) => ( <FormItem> <FormLabel>پرامپت تحلیل نهایی</FormLabel> <FormControl><Textarea rows={8} placeholder="نحوه تحلیل مکالمه و ساختار خروجی JSON را اینجا تعریف کنید..." {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="has_timer" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"> <div className="space-y-0.5"> <FormLabel>تایمر فعال باشد؟</FormLabel> </div> <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl> </FormItem> )}/>
                {form.watch('has_timer') && (
                  <FormField control={form.control} name="timer_duration" render={({ field }) => ( <FormItem> <FormLabel>مدت زمان تایمر (به دقیقه)</FormLabel> <FormControl><Input type="number" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting} size="lg">
                  {form.formState.isSubmitting ? <LoaderCircle className="animate-spin" /> : "ایجاد پرسشنامه"}
                </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default NewQuestionnaire;
