const API_BASE_URL = 'http://localhost:8000/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  roles: Role[];
  created_at: string;
}

interface Role {
  id: number;
  name: string;
  display_name: string;
  description: string;
}

interface Translation {
  id: number;
  original_text: string;
  translated_text: string;
  source_language: string;
  target_language: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  status: 'completed' | 'processing' | 'failed';
  created_at: string;
  updated_at: string;
}

interface Language {
  id: number;
  code: string;
  name: string;
  native_name: string;
  is_active: boolean;
  priority: number;
}

interface DashboardStats {
  total_users: number;
  active_users: number;
  total_translations: number;
  completed_translations: number;
  processing_translations: number;
  failed_translations: number;
  active_languages: number;
  total_storage_used: string;
  recent_activity: any[];
  system_status: any;
  last_updated?: string;
}

interface DatabaseStats {
  total_translations: number;
  total_users: number;
  storage_used: string;
  database_size: string;
  table_stats: Record<string, {
    records: number;
    size: string;
    last_updated: string;
  }>;
}

interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  suspended_users: number;
  admins: number;
  translators: number;
  regular_users: number;
}

interface AdminTranslationStats {
  total_translations: number;
  completed_translations: number;
  processing_translations: number;
  failed_translations: number;
  total_storage_used?: string;
  languages_used?: number;
  success_rate?: number;
  recent_activity?: any[];
}

// New interfaces for voice/practice
interface VoiceResult {
  audio_path: string;
  user_id: number;
  source_language: string;
  target_language: string;
  transcript: string;
  translation: string;
}

interface PracticeSession {
  id: string;
  user_id: number;
  target_language: string;
  mode: 'reading' | 'listening' | 'speaking' | 'writing';
  started_at: string;
}

interface PracticeAttemptResult {
  session_id: string;
  prompt_id: string;
  score: number;
  feedback: string;
  evaluated_at: string;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Create headers object, ensuring it's a Record<string, string>
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // If using FormData, let the browser set the Content-Type with boundary
    const isFormData = options.body instanceof FormData;
    if (isFormData) {
      delete headers['Content-Type'];
    }

    // Handle options.headers properly
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, options.headers);
      }
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const maybeJson = async () => {
        try { return await response.json(); } catch { return null; }
      };

      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
          throw new Error('Unauthorized');
        }
        const body = await maybeJson();
        const msg = body?.message || `HTTP error! status: ${response.status}`;
        const err = new Error(msg);
        // @ts-expect-error attach metadata for callers
        err.status = response.status;
        // @ts-expect-error attach validation errors
        err.errors = body?.errors;
        throw err;
      }

      const data = await maybeJson();
      return data as ApiResponse<T>;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const response = await this.request<{ user: User; token: string }>('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success) {
      this.token = response.data.token;
      localStorage.setItem('auth_token', this.token);
      return response.data;
    }

    throw new Error(response.message || 'Login failed');
  }

  async logout(): Promise<void> {
    try {
      await this.request('/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.token = null;
      localStorage.removeItem('auth_token');
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request<User>('/me');
    return response.data;
  }

  // User management methods
  async getUserProfile(): Promise<User> {
    const response = await this.request<User>('/user/profile');
    return response.data;
  }

  async updateUserProfile(updates: Partial<User>): Promise<User> {
    const response = await this.request<User>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.data;
  }

  async getUserTranslations(params?: {
    status?: string;
    source_language?: string;
    target_language?: string;
    per_page?: number;
  }): Promise<{ data: Translation[]; total: number; current_page: number; last_page: number }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }

    const response = await this.request<{ data: Translation[]; total: number; current_page: number; last_page: number }>(
      `/user/translations?${queryParams.toString()}`
    );
    return response.data;
  }

  async getTranslationHistory(params?: {
    action_type?: string;
    per_page?: number;
  }): Promise<{ data: any[]; total: number; current_page: number; last_page: number }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }

    const response = await this.request<{ data: any[]; total: number; current_page: number; last_page: number }>(
      `/user/translation-history?${queryParams.toString()}`
    );
    return response.data;
  }

  // Translation methods
  async createTranslation(translationData: {
    original_text: string;
    translated_text: string;
    source_language: string;
    target_language: string;
    file_name?: string;
    file_type?: string;
    file_size?: number;
    metadata?: any;
  }): Promise<Translation> {
    const response = await this.request<Translation>('/translations', {
      method: 'POST',
      body: JSON.stringify(translationData),
    });
    return response.data;
  }

  async translateDocument(payload: {
    text: string;
    source_language: string;
    target_language: string;
    file_name?: string;
    file_type?: string;
    file_size?: number;
  }): Promise<{ translated_text: string; translation_id: number; character_count?: number; word_count?: number }> {
    const response = await this.request<{ translated_text: string; translation_id: number; character_count?: number; word_count?: number }>('/translations/translate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.data;
  }

  async getTranslationStats(): Promise<{
    total_translations: number;
    completed_translations: number;
    processing_translations: number;
    failed_translations: number;
    total_storage_used: string;
    languages_used: number;
  }> {
    const response = await this.request<{
      total_translations: number;
      completed_translations: number;
      processing_translations: number;
      failed_translations: number;
      total_storage_used: string;
      languages_used: number;
    }>('/translations/stats');
    return response.data;
  }

  // Language methods
  async getLanguages(): Promise<Language[]> {
    const response = await this.request<Language[]>('/languages');
    return response.data;
  }

  // Admin methods
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.request<DashboardStats>('/admin/dashboard-stats');
    return response.data;
  }

  async getDatabaseStats(): Promise<DatabaseStats> {
    const response = await this.request<DatabaseStats>('/admin/database-stats');
    return response.data;
  }

  async getSystemPerformance(): Promise<any> {
    const response = await this.request<any>('/admin/system-performance');
    return response.data;
  }

  async getAllUsers(params?: {
    role?: string;
    status?: string;
    search?: string;
    per_page?: number;
    page?: number;
  }): Promise<{ data: User[]; total: number; current_page: number; last_page: number }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }

    const response = await this.request<{ data: User[]; total: number; current_page: number; last_page: number }>(
      `/admin/users?${queryParams.toString()}`
    );
    return response.data;
  }

  async getUserStats(): Promise<UserStats> {
    const response = await this.request<UserStats>('/admin/users/stats');
    return response.data;
  }

  async createUser(userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    status?: string;
  }): Promise<User> {
    const response = await this.request<User>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.data;
  }

  async updateUser(userId: number, updates: Partial<User>): Promise<User> {
    const response = await this.request<User>(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.data;
  }

  async updateUserStatus(userId: number, status: string): Promise<User> {
    const response = await this.request<User>(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return response.data;
  }

  async deleteUser(userId: number): Promise<void> {
    await this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async getAllTranslations(params?: {
    status?: string;
    user_id?: number;
    source_language?: string;
    target_language?: string;
    date_from?: string;
    date_to?: string;
    per_page?: number;
    page?: number;
  }): Promise<{ data: Translation[]; total: number; current_page: number; last_page: number }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }

    const response = await this.request<{ data: Translation[]; total: number; current_page: number; last_page: number }>(
      `/admin/translations?${queryParams.toString()}`
    );
    return response.data;
  }

  async getAdminTranslationStats(): Promise<AdminTranslationStats> {
    // Add cache-busting parameter to ensure fresh data
    const timestamp = Date.now();
    // Temporarily use public endpoint for development
    const response = await this.request<AdminTranslationStats>(`/public-admin-stats?_t=${timestamp}`);
    return (response as any).data || response.data;
  }

  async getAdminTranslationHistory(params?: { user_id?: number; action_type?: string; per_page?: number; page?: number }): Promise<{ data: any[]; total: number; current_page: number; last_page: number }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value));
      });
    }
    const response = await this.request<{ data: any[]; total: number; current_page: number; last_page: number }>(`/admin/translations/history?${queryParams.toString()}`);
    return response.data;
  }

  // Database management
  async createDatabaseBackup(): Promise<{ backup_path: string; size: string }> {
    const response = await this.request<{ backup_path: string; size: string }>('/admin/database/backup', {
      method: 'POST'
    });
    return response.data;
  }

  async optimizeDatabase(): Promise<{ message: string }> {
    const response = await this.request<{ message: string }>('/admin/database/optimize', {
      method: 'POST'
    });
    return response.data;
  }

  async cleanupDatabase(): Promise<{ cleanup_results: any }> {
    const response = await this.request<{ cleanup_results: any }>('/admin/database/cleanup', {
      method: 'POST'
    });
    return response.data;
  }

  // Settings management
  async getAdminSettings(): Promise<any> {
    const response = await this.request<any>('/admin/settings');
    return response.data;
  }

  async updateAdminSettings(category: string, settings: any): Promise<{ message: string }> {
    const response = await this.request<{ message: string }>('/admin/settings', {
      method: 'POST',
      body: JSON.stringify({ category, settings })
    });
    return response.data;
  }

  // System management
  async clearCache(): Promise<{ message: string }> {
    const response = await this.request<{ message: string }>('/admin/cache/clear', {
      method: 'POST'
    });
    return response.data;
  }

  // Voice translator
  async voiceTranscribeTranslate(payload: {
    file: File;
    target_language: string;
    source_language?: string;
  }): Promise<VoiceResult> {
    const form = new FormData();
    form.append('audio', payload.file);
    form.append('target_language', payload.target_language);
    if (payload.source_language) form.append('source_language', payload.source_language);

    const response = await this.request<VoiceResult>('/voice/transcribe-translate', {
      method: 'POST',
      body: form,
    });
    return response.data;
  }

  // Practice
  async practiceStartSession(params: { target_language: string; mode: PracticeSession['mode'] }): Promise<PracticeSession> {
    const response = await this.request<PracticeSession>('/practice/sessions', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return response.data;
  }

  async practiceSubmitAttempt(params: {
    session_id: string;
    prompt_id: string;
    answer_text?: string;
    answer_audio?: File;
  }): Promise<PracticeAttemptResult> {
    let body: FormData | string;
    let options: RequestInit = { method: 'POST' };

    if (params.answer_audio) {
      const form = new FormData();
      form.append('session_id', params.session_id);
      form.append('prompt_id', params.prompt_id);
      if (params.answer_text) form.append('answer_text', params.answer_text);
      form.append('answer_audio', params.answer_audio);
      body = form;
    } else {
      body = JSON.stringify({ session_id: params.session_id, prompt_id: params.prompt_id, answer_text: params.answer_text });
      options.headers = { 'Content-Type': 'application/json' };
    }

    const response = await this.request<PracticeAttemptResult>('/practice/attempts', {
      ...options,
      body,
    });
    return response.data;
  }

  // Rajabasha
  async getRajabashaPapers(): Promise<RajabashaPaper[]> {
    const response = await this.request<RajabashaPaper[]>('/rajabasha/papers');
    return response.data;
  }

  async createRajabashaPaper(payload: { title: string; description?: string; language?: string }): Promise<RajabashaPaper> {
    const response = await this.request<RajabashaPaper>('/rajabasha/papers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.data;
  }

  async getRajabashaQuestions(paperId: number): Promise<RajabashaQuestion[]> {
    const response = await this.request<{ paper: RajabashaPaper; questions: RajabashaQuestion[] }>(`/rajabasha/papers/${paperId}/questions`);
    return response.data.questions;
  }

  async createRajabashaQuestion(paperId: number, payload: {
    question_text: string;
    question_type?: 'mcq' | 'short';
    options?: Array<{ id: string; text: string }> | null;
    answer_key?: string | null;
    marks?: number;
  }): Promise<RajabashaQuestion> {
    const response = await this.request<RajabashaQuestion>(`/rajabasha/papers/${paperId}/questions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.data;
  }

  async submitRajabashaAttempt(paperId: number, answers: Record<number, string>): Promise<{ score: number; total: number }> {
    const response = await this.request<{ score: number; total: number }>(`/rajabasha/papers/${paperId}/attempts`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
    return response.data;
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }
}

export const apiService = new ApiService();
export type { User, Role, Translation, Language, DashboardStats, DatabaseStats, UserStats, VoiceResult, PracticeSession, PracticeAttemptResult, AdminTranslationStats };
export type RajabashaPaper = {
  id: number;
  title: string;
  description?: string | null;
  language: string;
  created_by?: number | null;
  created_at?: string;
  updated_at?: string;
  questions_count?: number;
};
export type RajabashaQuestion = {
  id: number;
  paper_id: number;
  question_text: string;
  question_type: 'mcq' | 'short';
  options?: Array<{ id: string; text: string }> | null;
  answer_key?: string | null;
  marks: number;
  created_at?: string;
  updated_at?: string;
}; 