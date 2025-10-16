// src/services/apiService.ts

// const API_BASE_URL = import.meta.env.API_BASE_URL;
const API_BASE_URL = 'https://hrbooteh.com/api';
const API_BASE_ORIGIN =
    typeof window !== "undefined"
        ? window.location.origin
        : API_BASE_URL.replace(/\/api\/?$/, "");

export const resolveApiAssetUrl = (path?: string | null): string => {
    if (!path) return '';
    const trimmed = path.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
        return trimmed;
    }
    try {
        const target = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
        return new URL(target, API_BASE_ORIGIN).toString();
    } catch {
        return trimmed;
    }
};

const getToken = (endpoint: string): string | null => {
    if (endpoint.startsWith('admin/')) {
        return localStorage.getItem('adminAuthToken');
    }
    return localStorage.getItem('authToken');
};

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = getToken(endpoint);
    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(options.headers as Record<string, string>),
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, { ...options, headers });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `خطای ${response.status} در ارتباط با سرور` }));
        throw new Error(errorData.message || 'خطایی در شبکه رخ داد');
    }
    const contentType = response.headers.get("content-type");
    if (response.status === 204 || !contentType || !contentType.includes("application/json")) {
        return { success: true, message: "عملیات با موفقیت انجام شد" };
    }
    return response.json();
};

export default apiFetch;

// --- توابع آپلود و سازمان‌ها ---

export const bulkUploadUsers = async (file: File) => {
    const token = localStorage.getItem('adminAuthToken');
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/admin/users/bulk-upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'آپلود کاربران با خطا مواجه شد');
    }
    return response.json();
};
export const getOrganizations = async () => await apiFetch('admin/organizations');
export const getOrganizationDetails = async (id: number) => await apiFetch(`admin/organizations/${id}`);
export const createOrganization = async (data: { name: string; questionnaireIds: number[]; userIds: number[] }) => await apiFetch('admin/organizations', { method: 'POST', body: JSON.stringify(data) });
export const updateOrganization = async (id: number, data: { name: string; questionnaireIds: number[]; userIds: number[] }) => await apiFetch(`admin/organizations/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteOrganization = async (id: number) => await apiFetch(`admin/organizations/${id}`, { method: 'DELETE' });


// --- توابع خروجی اکسل ---

export const exportUserResults = async (userId: number, username: string) => {
    const token = getToken('admin/export');
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE_URL}/admin/export/user/${userId}`, { headers });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'خطا در ایجاد فایل خروجی');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `results-${username}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
};

export const exportGroupResults = async (userIds: number[]) => {
    const token = getToken('admin/export');

    const response = await fetch(`${API_BASE_URL}/admin/export/group`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userIds }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'خطا در ایجاد فایل خروجی گروهی');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `group-results.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
};

// --- تابع جدید برای جزئیات کاربر ---

/**
 * دریافت جزئیات کامل یک کاربر خاص
 * @param userId شناسه کاربر
 */
export const getUserDetails = async (userId: number) => {
    return await apiFetch(`admin/users/${userId}`);
};

// --- آزمون‌های شخصیتی ---

export const getPersonalityTests = async () => await apiFetch('personality-tests');
export const getPersonalityTest = async (slug: string) => await apiFetch(`personality-tests/${slug}`);

type PersonalityTestPayload = {
    name: string;
    slug: string;
    tagline: string;
    description: string;
    report_name: string;
    highlights: string[];
    is_active: boolean;
};

export const adminGetPersonalityTests = async () => await apiFetch('admin/personality-tests');
export const adminCreatePersonalityTest = async (data: PersonalityTestPayload) =>
    await apiFetch('admin/personality-tests', { method: 'POST', body: JSON.stringify(data) });
export const adminUpdatePersonalityTest = async (id: number, data: PersonalityTestPayload) =>
    await apiFetch(`admin/personality-tests/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const adminDeletePersonalityTest = async (id: number) =>
    await apiFetch(`admin/personality-tests/${id}`, { method: 'DELETE' });

export const startPersonalityTest = async (slug: string) =>
    await apiFetch(`personality/start/${slug}`, { method: 'POST' });

export const sendPersonalityMessage = async (sessionId: string, message: string) =>
    await apiFetch(`personality/chat/${sessionId}`, {
        method: 'POST',
        body: JSON.stringify({ message }),
    });

export const finishPersonalityTest = async (sessionId: string) =>
    await apiFetch(`personality/finish/${sessionId}`, { method: 'POST' });

export const getPersonalityResults = async () =>
    await apiFetch('personality/results');

export const getPersonalityResult = async (sessionId: string) =>
    await apiFetch(`personality/results/${sessionId}`);

export const adminGetPersonalityResults = async () =>
    await apiFetch('admin/personality-tests/results');

// --- بلاگ ---

export type BlogPostPayload = {
    title: string;
    slug: string;
    excerpt?: string;
    content: string;
    cover_image_url?: string;
    author?: string;
    is_published?: boolean;
};

export const getBlogPosts = async (limit?: number) =>
    await apiFetch(limit ? `blog?limit=${limit}` : 'blog');

export const getBlogPost = async (slug: string) =>
    await apiFetch(`blog/${slug}`);

export const adminGetBlogPosts = async () =>
    await apiFetch('admin/blog');

export const adminCreateBlogPost = async (data: BlogPostPayload) =>
    await apiFetch('admin/blog', { method: 'POST', body: JSON.stringify(data) });

// --- رازمایی ---

export type MysteryImagePayload = {
    image_url: string;
    title: string;
    description?: string;
    ai_notes?: string;
    display_order?: number;
};

export type MysteryAssessmentPayload = {
    name: string;
    slug: string;
    short_description: string;
    intro_message: string;
    guide_name?: string;
    system_prompt: string;
    analysis_prompt?: string;
    is_active?: boolean;
    images: MysteryImagePayload[];
};

export const getMysteryTests = async () => await apiFetch('mystery');

export const getMysteryTest = async (slug: string) => await apiFetch(`mystery/${slug}`);

export const startMysteryTest = async (slug: string) =>
    await apiFetch(`mystery/start/${slug}`, { method: 'POST' });

export const sendMysteryMessage = async (sessionId: string, message: string) =>
    await apiFetch(`mystery/chat/${sessionId}`, {
        method: 'POST',
        body: JSON.stringify({ message }),
    });

export const finishMysteryTest = async (sessionId: string) =>
    await apiFetch(`mystery/finish/${sessionId}`, { method: 'POST' });

export const adminGetMysteryAssessments = async () =>
    await apiFetch('admin/mystery');

export const adminCreateMysteryAssessment = async (data: MysteryAssessmentPayload) =>
    await apiFetch('admin/mystery', { method: 'POST', body: JSON.stringify(data) });

export const adminUpdateMysteryAssessment = async (id: number, data: MysteryAssessmentPayload) =>
    await apiFetch(`admin/mystery/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const adminDeleteMysteryAssessment = async (id: number) =>
    await apiFetch(`admin/mystery/${id}`, { method: 'DELETE' });

export const adminUploadMysteryImage = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('adminAuthToken');
    const response = await fetch(`${API_BASE_URL}/admin/mystery/images/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'آپلود تصویر با خطا مواجه شد' }));
        throw new Error(errorData.message || 'آپلود تصویر با خطا مواجه شد');
    }
    return response.json();
};
