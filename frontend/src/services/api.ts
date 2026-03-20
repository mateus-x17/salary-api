const API_BASE = 'http://localhost:3000/v1';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: { code: string; message: string } | null;
}

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const isBodyless = !options.body;
    const headers: Record<string, string> = {
      ...(isBodyless ? {} : { 'Content-Type': 'application/json' }),
      ...((options.headers as Record<string, string>) || {}),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const json: ApiResponse<T> = await res.json();

    if (!json.success) {
      throw new Error(json.error?.message || 'Erro desconhecido na API');
    }

    return json.data;
  }

  // ── Auth ──
  async login(email: string, password: string) {
    const data = await this.request<{ token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async register(payload: any) {
    return this.request<{ id: string; email: string; role: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ── Profile ──
  async getProfile() {
    return this.request<{
      userId: string;
      city: string;
      experienceLevel: string;
      stacks: string[];
      currentSalary: number;
      email: string;
      nome: string;
    }>('/profile');
  }

  async createProfile(data: { cityId: string; experienceLevel: string; salary: number }) {
    return this.request('/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProfile(data: { cityId?: string; experienceLevel?: string }) {
    return this.request('/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ── Profile Stacks ──
  async getProfileStacks() {
    return this.request<{ id: string; name: string }[]>('/profile/stacks');
  }

  async addProfileStack(stackId: string) {
    return this.request('/profile/stacks', {
      method: 'POST',
      body: JSON.stringify({ stackId }),
    });
  }

  async removeProfileStack(stackId: string) {
    return this.request(`/profile/stacks/${stackId}`, { method: 'DELETE' });
  }

  // ── Salary ──
  async addSalary(salary: number) {
    return this.request<{ salary: number; createdAt: string }>('/profile/salary', {
      method: 'POST',
      body: JSON.stringify({ salary }),
    });
  }

  async getSalaryHistory() {
    return this.request<{ salary: number; createdAt: string }[]>('/profile/salary/history');
  }

  // ── Analytics ──
  async getGlobalAnalytics() {
    return this.request<{ averageSalary: number }>('/analytics/salary/global');
  }

  async getStackAnalytics(stackId?: string) {
    const qs = stackId ? `?stackId=${stackId}` : '';
    return this.request<{ stack: string; averageSalary: number; totalRecords: number }>(
      `/analytics/salary/stack${qs}`
    );
  }

  async getCityAnalytics(cityId?: string) {
    const qs = cityId ? `?cityId=${cityId}` : '';
    return this.request(`/analytics/salary/city${qs}`);
  }

  async getFilteredAnalytics(params: { stackId?: string; cityId?: string; experienceLevel?: string }) {
    const qs = new URLSearchParams();
    if (params.stackId) qs.set('stackId', params.stackId);
    if (params.cityId) qs.set('cityId', params.cityId);
    if (params.experienceLevel) qs.set('experienceLevel', params.experienceLevel);
    return this.request<{ averageSalary: number; totalRecords: number }>(`/analytics/salary/filter?${qs.toString()}`);
  }

  async getChartByLevel(experienceLevel?: string) {
    const qs = experienceLevel ? `?experienceLevel=${experienceLevel}` : '';
    return this.request<{ stack: string; averageSalary: number; totalRecords: number }[]>(`/analytics/charts/by-level${qs}`);
  }

  async getChartByCity(cityId?: string) {
    const qs = cityId ? `?cityId=${cityId}` : '';
    return this.request<{ stack: string; averageSalary: number; totalRecords: number }[]>(`/analytics/charts/by-city${qs}`);
  }

  async getChartByStack(stackId?: string) {
    const qs = stackId ? `?stackId=${stackId}` : '';
    return this.request<{ experienceLevel: string; label: string; averageSalary: number; totalRecords: number }[]>(`/analytics/charts/by-stack${qs}`);
  }

  async getStackRanking() {
    return this.request<{ stack: string; averageSalary: number; totalRecords: number }[]>(
      '/analytics/ranking/stacks'
    );
  }

  async getCityRankings() {
    return this.request<{ 
      above: { city: string; averageSalary: number; totalRecords: number }[],
      below: { city: string; averageSalary: number; totalRecords: number }[]
    }>('/analytics/ranking/cities');
  }

  // ── Admin ──
  async listUsers() {
    return this.request<any[]>('/admin/users');
  }

  async updateUser(id: string, data: any) {
    return this.request(`/admin/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }
  async countUsers() {
    return this.request<{ count: number }>('/admin/users/count');
  }

  // ── Resources ──
  async listCities() {
    return this.request<{ id: string; name: string; state: string; country: string }[]>('/cities');
  }

  async listStacks() {
    return this.request<{ id: string; name: string }[]>('/stacks');
  }

  logout() {
    this.setToken(null);
  }
}

export const api = new ApiService();
