import apiClient from './apiClient';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface AuthResponse {
  message: string;
  success: boolean;
}

class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        email,
        password,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
  }

  async requestPasswordReset(email: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        '/auth/forgot-password',
        { email }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send reset code');
    }
  }

  async verifyOtp(email: string, otp: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        '/auth/verify-otp',
        { email, otp }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'OTP verification failed');
    }
  }

  async resetPassword(
    email: string,
    otp: string,
    newPassword: string
  ): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        '/auth/reset-password',
        { email, otp, newPassword }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Password reset failed');
    }
  }

  async getProfile(): Promise<any> {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  }

  async updateProfile(data: any): Promise<any> {
    const response = await apiClient.put('/auth/profile', data);
    return response.data;
  }

  async changePassword(data: any): Promise<any> {
    const response = await apiClient.post('/auth/change-password', data);
    return response.data;
  }

  async logoutOthers(): Promise<any> {
    const response = await apiClient.post('/auth/logout-others');
    return response.data;
  }

  async logout(): Promise<void> {
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();
