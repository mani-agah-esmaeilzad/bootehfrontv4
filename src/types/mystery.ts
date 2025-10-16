export type MysteryImage = {
  id: number;
  image_url: string;
  title: string;
  description?: string | null;
  ai_notes?: string | null;
  display_order: number;
};

export type MysteryTestSummary = {
  id: number;
  name: string;
  slug: string;
  short_description: string;
  created_at: string;
  preview_image?: string | null;
};

export type MysteryTestDetail = MysteryTestSummary & {
  intro_message: string;
  images: Array<Pick<MysteryImage, 'id' | 'image_url' | 'title' | 'description' | 'display_order'>>;
};

export type MysteryChatHistoryItem = {
  role: 'user' | 'assistant';
  content: string;
};

export type MysteryStartResponse = {
  sessionId: string;
  testName: string;
  guideName: string;
  introMessage: string;
  history: MysteryChatHistoryItem[];
  systemInstruction: string;
};

export type MysteryAnalysis = Record<string, unknown> & {
  summary?: string;
  strengths?: unknown;
  recommendations?: unknown;
};
