import { apiService } from './api-service';

export interface UploadedFile {
  id: number;
  original_name: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  user_id: number;
  status: 'uploaded' | 'processing' | 'translated' | 'failed';
  source_language: string;
  target_language: string;
  translation_accuracy?: number;
  created_at: string;
  updated_at: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

class FileUploadService {
  private readonly API_BASE_URL = 'http://localhost:8000/api';

  async uploadFile(
    file: File,
    sourceLanguage: string,
    targetLanguage: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_language', sourceLanguage);
    formData.append('target_language', targetLanguage);
    // Required by backend validation
    formData.append('original_name', file.name);
    formData.append('file_type', file.type || 'application/octet-stream');
    formData.append('file_size', String(file.size));

    try {
      const response = await fetch(`${this.API_BASE_URL}/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiService.getToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Upload failed:', {
          status: response.status,
          statusText: response.statusText,
          response: text,
          token: apiService.getToken() ? 'Present' : 'Missing'
        });
        throw new Error(`Upload failed (${response.status}): ${response.statusText}${text ? ` - ${text}` : ''}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }

  async getUploadedFiles(params?: {
    status?: string;
    user_id?: number;
    per_page?: number;
    page?: number;
  }): Promise<{ data: UploadedFile[]; total: number; current_page: number; last_page: number }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }

    const response = await fetch(`${this.API_BASE_URL}/files?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${apiService.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch uploaded files');
    }

    const json = await response.json();
    // Normalize: backend may return { success, data: { data: [], total, current_page, last_page } }
    if (json && json.data && Array.isArray(json.data.data)) {
      return {
        data: json.data.data as UploadedFile[],
        total: json.data.total ?? (json.data.data.length || 0),
        current_page: json.data.current_page ?? 1,
        last_page: json.data.last_page ?? 1,
      };
    }
    // Or already normalized
    if (json && Array.isArray(json.data)) {
      return {
        data: json.data as UploadedFile[],
        total: json.total ?? (json.data.length || 0),
        current_page: json.current_page ?? 1,
        last_page: json.last_page ?? 1,
      };
    }
    // Fallback to empty
    return { data: [], total: 0, current_page: 1, last_page: 1 };
  }

  async getFileStats(): Promise<{
    total_files: number;
    processing_files: number;
    translated_files: number;
    failed_files: number;
    average_accuracy: number;
    total_storage_used: string;
  }> {
    const response = await fetch(`${this.API_BASE_URL}/files/stats`, {
      headers: {
        'Authorization': `Bearer ${apiService.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch file stats');
    }

    const json = await response.json();
    return (json && json.data) ? json.data : json;
  }

  async deleteFile(fileId: number): Promise<void> {
    const response = await fetch(`${this.API_BASE_URL}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiService.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
  }

  async updateFileStatus(fileId: number, status: string): Promise<UploadedFile> {
    const response = await fetch(`${this.API_BASE_URL}/files/${fileId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiService.getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error('Failed to update file status');
    }

    const result = await response.json();
    return result.data;
  }
}

export const fileUploadService = new FileUploadService(); 