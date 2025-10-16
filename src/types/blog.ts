export type BlogPostSummary = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string | null;
  author: string | null;
  published_at: string | null;
  created_at: string;
};

export type BlogPostDetail = BlogPostSummary & {
  content: string;
  updated_at?: string;
};

export type AdminBlogPost = BlogPostDetail & {
  is_published: boolean;
};
