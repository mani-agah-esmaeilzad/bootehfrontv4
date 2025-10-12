// src/services/apiService.ts

// const API_BASE_URL = import.meta.env.API_BASE_URL;
const API_BASE_URL = 'https://hrbooteh.com/api';

const getToken = (endpoint: string): string | null => {
    if (endpoint.startsWith('admin/')) {
        return localStorage.getItem('adminAuthToken');
    }
    return localStorage.getItem('authToken');
};

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = getToken(endpoint);
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
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
