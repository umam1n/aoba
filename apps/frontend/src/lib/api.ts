import { supabase } from './supabase';
import { ApiResponse, ApiError } from './types';

// ============================================================
// AOBA API Client — Django Backend Communication Layer
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  private async getHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const companyId = typeof window !== 'undefined'
      ? localStorage.getItem('aoba_company_id') || ''
      : '';

    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'X-Company-ID': companyId,
    };
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<{ data: T | null; error: ApiError | null; loading: boolean }> {
    try {
      const headers = await this.getHeaders();
      const config: RequestInit = {
        method,
        headers,
      };

      if (body && method !== 'GET') {
        config.body = JSON.stringify(body);
      }

      const response = await fetch(`${API_URL}${endpoint}`, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Request failed with status ${response.status}`,
          code: `HTTP_${response.status}`,
        }));
        return {
          data: null,
          error: {
            message: errorData.message || errorData.detail || 'An error occurred',
            code: errorData.code || `HTTP_${response.status}`,
            details: errorData.details,
          },
          loading: false,
        };
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return { data: null, error: null, loading: false };
      }

      const data: T = await response.json();
      return { data, error: null, loading: false };
    } catch (err) {
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : 'Network error',
          code: 'NETWORK_ERROR',
        },
        loading: false,
      };
    }
  }

  async get<T>(endpoint: string): Promise<{ data: T | null; error: ApiError | null }> {
    const result = await this.request<T>('GET', endpoint);
    return { data: result.data, error: result.error };
  }

  async post<T>(endpoint: string, body: unknown): Promise<{ data: T | null; error: ApiError | null }> {
    const result = await this.request<T>('POST', endpoint, body);
    return { data: result.data, error: result.error };
  }

  async put<T>(endpoint: string, body: unknown): Promise<{ data: T | null; error: ApiError | null }> {
    const result = await this.request<T>('PUT', endpoint, body);
    return { data: result.data, error: result.error };
  }

  async del<T>(endpoint: string): Promise<{ data: T | null; error: ApiError | null }> {
    const result = await this.request<T>('DELETE', endpoint);
    return { data: result.data, error: result.error };
  }

  // Upload files (CSV import)
  async upload<T>(
    endpoint: string,
    file: File,
    additionalFields?: Record<string, string>
  ): Promise<{ data: T | null; error: ApiError | null }> {
    try {
      const headers = await this.getHeaders();
      // Remove Content-Type for FormData — browser sets it with boundary
      const { 'Content-Type': _, ...headersWithoutContentType } = headers as Record<string, string>;

      const formData = new FormData();
      formData.append('file', file);
      if (additionalFields) {
        Object.entries(additionalFields).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: headersWithoutContentType,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Upload failed',
          code: 'UPLOAD_ERROR',
        }));
        return {
          data: null,
          error: {
            message: errorData.message || 'Upload failed',
            code: errorData.code || 'UPLOAD_ERROR',
          },
        };
      }

      const data: T = await response.json();
      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : 'Upload failed',
          code: 'NETWORK_ERROR',
        },
      };
    }
  }
}

export const api = new ApiClient();

// Convenience hooks-compatible helpers
export function getCompanyId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('aoba_company_id') || '';
}

export function setCompanyId(id: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('aoba_company_id', id);
  }
}
