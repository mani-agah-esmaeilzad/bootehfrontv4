import type { ChartModuleConfig, ChartModuleItem, ChartModuleType } from "@/types/chart-modules";

type ItemFieldType = "text" | "number";

export interface ChartModuleItemField {
  key: keyof ChartModuleItem;
  label: string;
  type: ItemFieldType;
  placeholder?: string;
}

export interface ChartModuleSettingField {
  key: string;
  label: string;
  type: ItemFieldType;
  placeholder?: string;
}

export interface ChartModuleDefinition {
  type: ChartModuleType;
  title: string;
  description: string;
  supportsItems?: boolean;
  itemLabel?: string;
  itemFields?: ChartModuleItemField[];
  settingsFields?: ChartModuleSettingField[];
  defaultItems?: ChartModuleItem[];
  defaultSettings?: Record<string, any>;
}

export const CHART_MODULE_DEFINITIONS: ChartModuleDefinition[] = [
  {
    type: "factor_metrics",
    title: "مولفه‌های اصلی (نمودار عنکبوتی و مقایسه فاکتورها)",
    description: "لیست فاکتورهایی که باید در نمودار عنکبوتی، توزیع فاکتورها و چرخ توانمندی نمایش داده شوند.",
    supportsItems: true,
    itemLabel: "فاکتور",
    itemFields: [
      { key: "label", label: "عنوان", type: "text", placeholder: "مثال: اعتماد به حل مسئله" },
      { key: "key", label: "شناسه انگلیسی", type: "text", placeholder: "مثال: problem_trust" },
      { key: "maxScore", label: "حداکثر امتیاز", type: "number", placeholder: "مثال: 5" },
      { key: "category", label: "دسته (اختیاری)", type: "text", placeholder: "مثال: اعتماد" },
    ],
    defaultItems: [
      { key: "problem_trust", label: "اعتماد به حل مسئله", maxScore: 5 },
      { key: "approach_style", label: "سبک رویکرد-اجتناب", maxScore: 5 },
      { key: "self_control", label: "کنترل شخصی", maxScore: 5 },
    ],
  },
  {
    type: "sentiment_profile",
    title: "تحلیل احساسات",
    description: "دسته‌هایی که در نمودار احساسات نمایش داده می‌شود.",
    supportsItems: true,
    itemLabel: "دسته احساسات",
    itemFields: [
      { key: "label", label: "عنوان", type: "text", placeholder: "مثال: مثبت" },
      { key: "key", label: "شناسه انگلیسی", type: "text", placeholder: "مثال: positive" },
    ],
    defaultItems: [
      { key: "positive", label: "مثبت" },
      { key: "neutral", label: "خنثی" },
      { key: "negative", label: "منفی" },
    ],
  },
  {
    type: "keyword_focus",
    title: "ابر واژگان و کلمات کلیدی",
    description: "واژگانی که باید در خروجی «Keyword Analysis» شمارش شوند.",
    supportsItems: true,
    itemLabel: "کلمه کلیدی",
    itemFields: [
      { key: "label", label: "عبارت", type: "text", placeholder: "مثال: راه‌حل" },
      { key: "key", label: "شناسه انگلیسی", type: "text", placeholder: "مثال: solution" },
    ],
    defaultItems: [
      { key: "solution", label: "راه‌حل" },
      { key: "control", label: "کنترل" },
      { key: "teamwork", label: "کار تیمی" },
    ],
  },
  {
    type: "verbosity_trend",
    title: "روند حجم پاسخ‌ها",
    description: "فعال بودن این ماژول باعث می‌شود AI طول پاسخ‌ها را در هر نوبت گزارش دهد.",
  },
  {
    type: "action_profile",
    title: "کنش‌محوری در کار تیمی",
    description: "برچسب‌گذاری ستون‌های نمودار کنش‌محوری.",
    settingsFields: [
      { key: "activeLabel", label: "عنوان ستون کنشی", type: "text", placeholder: "مثال: واژگان کنشی" },
      { key: "passiveLabel", label: "عنوان ستون غیرکنشی", type: "text", placeholder: "مثال: واژگان غیرکنشی" },
    ],
    defaultSettings: {
      activeLabel: "واژگان کنشی",
      passiveLabel: "واژگان غیرکنشی",
    },
  },
  {
    type: "problem_solving_profile",
    title: "مولفه‌های مهارت حل مسئله",
    description: "برای نمودار دایره‌ای حل مسئله سه یا چند مولفه معرفی کنید.",
    supportsItems: true,
    itemLabel: "مولفه",
    itemFields: [
      { key: "label", label: "عنوان", type: "text" },
      { key: "key", label: "شناسه انگلیسی", type: "text" },
      { key: "maxScore", label: "حداکثر امتیاز", type: "number" },
    ],
    defaultItems: [
      { key: "problem_trust", label: "اعتماد به حل مسئله", maxScore: 5 },
      { key: "approach_style", label: "سبک رویکرد-اجتناب", maxScore: 5 },
      { key: "self_control", label: "کنترل شخصی", maxScore: 5 },
    ],
  },
  {
    type: "communication_profile",
    title: "سبک ارتباطی",
    description: "برچسب‌های نمودار سبک ارتباطی (خوب/ضعیف) یا دسته‌های دیگر.",
    supportsItems: true,
    itemLabel: "شاخص ارتباطی",
    itemFields: [
      { key: "label", label: "عنوان", type: "text" },
      { key: "key", label: "شناسه انگلیسی", type: "text" },
    ],
    defaultItems: [
      { key: "strong", label: "خوب" },
      { key: "weak", label: "ضعیف" },
    ],
  },
  {
    type: "semantic_fields",
    title: "حوزه‌های معنایی",
    description: "حوزه‌هایی که باید در نمودار «حوزه‌های پرتکرار» شمارش شوند.",
    supportsItems: true,
    itemLabel: "حوزه",
    itemFields: [
      { key: "label", label: "عنوان", type: "text" },
      { key: "key", label: "شناسه انگلیسی", type: "text" },
    ],
    defaultItems: [
      { key: "options", label: "گزینه‌سازی و تولید راه‌حل" },
      { key: "control", label: "احساس کنترل و مدیریت موقعیت" },
      { key: "analysis", label: "تحلیل و تصمیم‌گیری" },
    ],
  },
  {
    type: "linguistic_axes",
    title: "شاخص‌های زبانی",
    description: "محورهای رادار شاخص‌های زبانی (تنوع واژگان، انسجام و ...).",
    supportsItems: true,
    itemLabel: "شاخص زبانی",
    itemFields: [
      { key: "label", label: "عنوان", type: "text" },
      { key: "key", label: "شناسه انگلیسی", type: "text" },
    ],
    defaultItems: [
      { key: "lexical_diversity", label: "تنوع واژگانی" },
      { key: "semantic_coherence", label: "انسجام معنایی" },
      { key: "concreteness_level", label: "عینیت" },
      { key: "abstractness_level", label: "انتزاع" },
    ],
  },
  {
    type: "pronoun_usage",
    title: "تحلیل ضمایر",
    description: "برای نمودار استفاده از ضمایر، AI باید تعداد ضمایر اول/دوم/سوم شخص را گزارش کند.",
  },
  {
    type: "confidence_index",
    title: "شاخص اطمینان تحلیل",
    description: "AI باید کلید confidence_level را با امتیاز ۰ تا ۱۰ و یک توضیح کوتاه تولید کند.",
  },
  {
    type: "readiness_index",
    title: "شاخص آمادگی",
    description: "خروجی readiness_index/score برای رسم گیج آمادگی.",
  },
  {
    type: "progress_timeline",
    title: "روند پیشرفت مراحل",
    description: "AI باید آرایه‌ای از iteration/score برای نمودار پیشرفت ثبت کند.",
  },
];

export const buildDefaultChartModules = (): ChartModuleConfig[] =>
  CHART_MODULE_DEFINITIONS.map((definition, index) => ({
    id: `${definition.type}-${index + 1}`,
    type: definition.type,
    title: definition.title,
    enabled: true,
    items: definition.defaultItems ? [...definition.defaultItems] : undefined,
    settings: definition.defaultSettings ? { ...definition.defaultSettings } : undefined,
  }));
