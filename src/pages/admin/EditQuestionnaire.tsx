// src/pages/admin/EditQuestionnaire.tsx

import { useEffect, useState } from 'react'; // ✅ وارد کردن useState
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import apiFetch from "@/services/apiService";
import { LoaderCircle, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QUESTIONNAIRE_CATEGORIES } from "@/constants/questionnaireCategories";
import ChartModulesBuilder from "@/components/admin/ChartModulesBuilder";
import { buildDefaultChartModules } from "@/constants/chartModules";

const chartModuleItemSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  maxScore: z.number().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
});

const chartModuleSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  title: z.string().optional(),
  enabled: z.boolean().optional(),
  items: z.array(chartModuleItemSchema).optional(),
  settings: z.record(z.any()).optional(),
});

const questionnaireSchema = z
  .object({
    name: z.string().min(3, { message: "نام پرسشنامه حداقل باید ۳ کاراکتر باشد." }),
    category: z.enum(QUESTIONNAIRE_CATEGORIES, { errorMap: () => ({ message: "یک دسته‌بندی معتبر انتخاب کنید." }) }),
    welcome_message: z.string().min(10, { message: "پیام خوشامدگویی حداقل باید ۱۰ کاراکتر باشد." }),
    persona_name: z.string().min(2, { message: "نام نقش AI حداقل باید ۲ کاراکتر باشد." }),
    persona_prompt: z.string().min(20, { message: "پرامپت شخصیت AI حداقل باید ۲۰ کاراکتر باشد." }),
    analysis_prompt: z.string().min(20, { message: "پرامپت تحلیل حداقل باید ۲۰ کاراکتر باشد." }),
    has_timer: z.boolean().default(false),
    timer_duration: z.coerce.number().optional().nullable(),
    secondary_persona_name: z.string().optional().nullable(),
    secondary_persona_prompt: z.string().optional().nullable(),
    enable_second_phase: z.boolean().default(false),
    phase_two_persona_name: z.string().optional().nullable(),
    phase_two_persona_prompt: z.string().optional().nullable(),
    phase_two_analysis_prompt: z.string().optional().nullable(),
    phase_two_welcome_message: z.string().optional().nullable(),
    chart_modules: z.array(chartModuleSchema).optional(),
    is_active: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.enable_second_phase) {
      if (!data.phase_two_persona_name || data.phase_two_persona_name.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phase_two_persona_name"],
          message: "نام شخصیت مرحله دوم الزامی است.",
        });
      }
      if (!data.phase_two_persona_prompt || data.phase_two_persona_prompt.trim().length < 20) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phase_two_persona_prompt"],
          message: "پرامپت مرحله دوم باید حداقل ۲۰ کاراکتر باشد.",
        });
      }
      if (!data.phase_two_analysis_prompt || data.phase_two_analysis_prompt.trim().length < 20) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phase_two_analysis_prompt"],
          message: "پرامپت تحلیل مرحله دوم باید حداقل ۲۰ کاراکتر باشد.",
        });
      }
    }
  });

const EditQuestionnaire = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // ✅ افزودن یک state ساده برای مدیریت بارگذاری
  const [isLoading, setIsLoading] = useState(true);
  const form = useForm<z.infer<typeof questionnaireSchema>>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      name: "",
      category: QUESTIONNAIRE_CATEGORIES[0],
      welcome_message: "",
      persona_name: "",
      persona_prompt: "",
      analysis_prompt: "",
      has_timer: false,
      timer_duration: null,
      secondary_persona_name: "",
      secondary_persona_prompt: "",
      enable_second_phase: false,
      phase_two_persona_name: "",
      phase_two_persona_prompt: "",
      phase_two_analysis_prompt: "",
      phase_two_welcome_message: "",
      chart_modules: buildDefaultChartModules(),
      is_active: true,
    },
  });
  const enableSecondPhase = form.watch("enable_second_phase");

  useEffect(() => {
    const fetchQuestionnaire = async () => {
      setIsLoading(true); // شروع بارگذاری
      try {
        const response = await apiFetch(`admin/questionnaires/${id}`);
        if (response.success && response.data) {
          const data = response.data;
          const isValidCategory = (value: unknown): value is typeof QUESTIONNAIRE_CATEGORIES[number] =>
            typeof value === "string" && QUESTIONNAIRE_CATEGORIES.includes(value as typeof QUESTIONNAIRE_CATEGORIES[number]);
          const resolvedCategory = isValidCategory(data.category) ? data.category : QUESTIONNAIRE_CATEGORIES[0];

          form.reset({
            name: data.title ?? "",
            category: resolvedCategory,
            welcome_message: data.welcome_message ?? "",
            persona_name: data.persona_name ?? "",
            persona_prompt: data.persona_prompt ?? "",
            analysis_prompt: data.analysis_prompt ?? "",
            has_timer: data.has_timer ?? false,
            timer_duration: data.timer_duration ?? null,
            secondary_persona_name: data.secondary_persona_name ?? "",
            secondary_persona_prompt: data.secondary_persona_prompt ?? "",
            enable_second_phase: (data.total_phases ?? 1) > 1,
            phase_two_persona_name: data.phase_two_persona_name ?? "",
            phase_two_persona_prompt: data.phase_two_persona_prompt ?? "",
            phase_two_analysis_prompt: data.phase_two_analysis_prompt ?? "",
            phase_two_welcome_message: data.phase_two_welcome_message ?? "",
            chart_modules: Array.isArray(data.chart_modules) && data.chart_modules.length > 0 ? data.chart_modules : buildDefaultChartModules(),
            is_active: Boolean(data.is_active),
          });
        } else {
          throw new Error("پرسشنامه یافت نشد.");
        }
      } catch (error: any) {
        toast.error(error.message);
        navigate('/admin/questionnaires');
      } finally {
        setIsLoading(false); // پایان بارگذاری در هر صورت
      }
    };
    fetchQuestionnaire();
  }, [id, navigate, form]);

  const onSubmit = async (values: z.infer<typeof questionnaireSchema>) => {
    try {
      await apiFetch(`admin/questionnaires/${id}`, {
        method: 'PUT',
        body: JSON.stringify(values),
      });
      toast.success("پرسشنامه با موفقیت به‌روزرسانی شد.");
      navigate('/admin/questionnaires');
    } catch (error: any) {
      toast.error("خطا در به‌روزرسانی: " + error.message);
    }
  };

  // ✅ استفاده از isLoading برای نمایش لودر
  if (isLoading) {
    return (
      <div className="admin-page">
        <div className="admin-surface text-center">
          <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-slate-400" />
          <p className="mt-4 text-sm text-slate-500">در حال بارگذاری پرسشنامه...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white">ویرایش پرسشنامه</h1>
            <p className="text-sm text-white/70">بازنگری محتوا، شخصیت‌ها و تنظیمات پیشرفته.</p>
          </div>
          <Button
            onClick={() => navigate('/admin/questionnaires')}
            variant="outline"
            className="rounded-2xl border-white/30 bg-white/10 text-white hover:bg-white/20"
          >
            <ArrowRight className="ml-2 h-4 w-4" />
            بازگشت
          </Button>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>اطلاعات اصلی پرسشنامه</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>نام پرسشنامه</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
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
                <FormField control={form.control} name="welcome_message" render={({ field }) => ( <FormItem> <FormLabel>پیام خوشامدگویی</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>وضعیت نمایش</FormLabel>
                        <FormDescription>اگر غیرفعال باشد، کاربران عمومی قادر به شروع این مرحله نخواهند بود.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>پیکربندی داده‌های نمودار‌ها</CardTitle>
                <CardDescription>نمودارهایی که در گزارش نهایی نمایش داده می‌شوند و مولفه‌های هر کدام را از این بخش مدیریت کنید.</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="chart_modules"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <ChartModulesBuilder value={field.value} onChange={field.onChange} />
                      <FormDescription>این تغییرات روی پرامپت تحلیل اعمال می‌شود و به صورت خودکار به AI ارسال خواهد شد.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>شخصیت AI اصلی (مشاور)</CardTitle>
                <CardDescription>این AI مکالمه اصلی را با کاربر پیش می‌برد.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField control={form.control} name="persona_name" render={({ field }) => ( <FormItem> <FormLabel>نام نقش AI اصلی</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="persona_prompt" render={({ field }) => ( <FormItem> <FormLabel>پرامپت شخصیت AI اصلی</FormLabel> <FormControl><Textarea rows={8} {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>شخصیت AI دوم (ناظر - اختیاری)</CardTitle>
                <CardDescription>این AI می‌تواند مکالمه را مشاهده و در صورت نیاز مداخله کند. اگر نام نقش خالی باشد، این AI غیرفعال خواهد بود.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField control={form.control} name="secondary_persona_name" render={({ field }) => ( <FormItem> <FormLabel>نام نقش AI دوم</FormLabel> <FormControl><Input placeholder="مثال: مبصر، راهنمای فنی، ..." {...field} value={field.value || ''} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="secondary_persona_prompt" render={({ field }) => ( <FormItem> <FormLabel>پرامپت شخصیت AI دوم</FormLabel> <FormControl><Textarea rows={8} placeholder="وظایف و شرایط مداخله AI دوم را اینجا تعریف کنید..." {...field} value={field.value || ''} /></FormControl> <FormDescription>پرامپت باید شامل این باشد که اگر نیازی به مداخله نیست، عبارت '__NO_INTERVENTION__' را برگرداند.</FormDescription> <FormMessage /> </FormItem> )}/>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>مرحله دوم (در صورت نیاز)</CardTitle>
                <CardDescription>پس از پایان مرحله اول، کاربر می‌تواند وارد گفتگوی دوم با پرسش‌های متفاوت شود.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="enable_second_phase"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>فعال‌سازی مرحله دوم</FormLabel>
                        <FormDescription>مرحله دوم شامل یک چت جدید و سپس سوالات تکمیلی اختصاصی است.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {enableSecondPhase && (
                  <div className="space-y-6 rounded-2xl border border-dashed border-purple-200/40 p-4">
                    <FormField
                      control={form.control}
                      name="phase_two_welcome_message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>پیام خوشامدگویی مرحله دوم</FormLabel>
                          <FormControl>
                            <Textarea rows={4} {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phase_two_persona_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نام شخصیت مرحله دوم</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phase_two_persona_prompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>پرامپت شخصیت مرحله دوم</FormLabel>
                          <FormControl>
                            <Textarea rows={8} {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phase_two_analysis_prompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>پرامپت تحلیل مرحله دوم</FormLabel>
                          <FormControl>
                            <Textarea rows={8} {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تنظیمات نهایی</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField control={form.control} name="analysis_prompt" render={({ field }) => ( <FormItem> <FormLabel>پرامپت تحلیل نهایی</FormLabel> <FormControl><Textarea rows={8} {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="has_timer" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"> <div className="space-y-0.5"> <FormLabel>تایمر فعال باشد؟</FormLabel> </div> <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl> </FormItem> )}/>
                {form.watch('has_timer') && (
                  <FormField control={form.control} name="timer_duration" render={({ field }) => ( <FormItem> <FormLabel>مدت زمان تایمر (به دقیقه)</FormLabel> <FormControl><Input type="number" {...field} value={field.value || ''} /></FormControl> <FormMessage /> </FormItem> )}/>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                size="lg"
                className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-500 px-8 py-6 font-semibold text-white shadow-xl shadow-indigo-500/20 hover:opacity-90 sm:w-auto"
              >
                {form.formState.isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "ذخیره تغییرات"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default EditQuestionnaire;
