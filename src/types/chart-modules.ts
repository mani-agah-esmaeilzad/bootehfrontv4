export type ChartModuleType =
  | "factor_metrics"
  | "sentiment_profile"
  | "keyword_focus"
  | "verbosity_trend"
  | "action_profile"
  | "problem_solving_profile"
  | "communication_profile"
  | "semantic_fields"
  | "linguistic_axes"
  | "pronoun_usage"
  | "confidence_index"
  | "readiness_index"
  | "progress_timeline";

export interface ChartModuleItem {
  key: string;
  label: string;
  maxScore?: number;
  category?: string;
  description?: string;
}

export interface ChartModuleConfig {
  id?: string;
  type: ChartModuleType;
  title?: string;
  enabled?: boolean;
  items?: ChartModuleItem[];
  settings?: Record<string, any>;
}
