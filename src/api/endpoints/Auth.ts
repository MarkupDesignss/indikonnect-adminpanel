import apiClient from '../client';

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  token: string;
  admin?: {
    id: number;
    name: string;
    email: string;
  };
  message?: string;
}


export interface AdminForgotPasswordRequest {
  email: string;
}

export interface AdminForgotPasswordResponse {
  message?: string;
}

export interface AdminVerifyOtpRequest {
  email: string;
  otp: string;
}

export interface AdminVerifyOtpResponse {
  success: boolean;
  message: string;
  data: {
    email: string;
    reset_token: string;
    expires_in: string;
  };
}

export interface AdminResetPasswordRequest {
  email: string;
  password: string;
  password_confirmation: string;
  reset_token: string;
}

export interface AdminResetPasswordResponse {
  message?: string;
  success?: boolean;
}

export interface AdminUpdateRequest {
  name: string;
}

export interface AdminUpdateResponse {
  success?: boolean;
  message?: string;

  admin?: {
    id: number;
    name: string;
    email: string;
    roles?: string[];
    created_at?: string | null;
    updated_at?: string;
  };

  data?: {
    id: number;
    name: string;
    email: string;
    roles?: string[];
    created_at?: string | null;
    updated_at?: string;
  };
}

export interface AdminProfile {
  id: number;
  name: string;
  email: string;
  roles: string[];
  created_at: string | null;
  updated_at: string;
}

export interface AdminProfileResponse {
  admin: AdminProfile;
  permissions_grouped: unknown[];
}

export interface AdminLogoutResponse {
  success?: boolean;
  message?: string;
}

export const adminApi = {

  login: (data: AdminLoginRequest) =>
    apiClient.post<AdminLoginResponse>(
      '/admin/login',
      data
    ),

  forgotPassword: (
    data: AdminForgotPasswordRequest
  ) =>
    apiClient.post<AdminForgotPasswordResponse>(
      '/admin/send-reset-otp',
      data
    ),

  verifyOtp: (
    data: AdminVerifyOtpRequest
  ) =>
    apiClient.post<AdminVerifyOtpResponse>(
      '/admin/verify-otp',
      data
    ),

  resetPassword: (
    data: AdminResetPasswordRequest
  ) =>
    apiClient.post<AdminResetPasswordResponse>(
      '/admin/reset-password',
      data
    ),

  update: (
    data: AdminUpdateRequest
  ) =>
    apiClient.put<AdminUpdateResponse>(
      '/admin/update',
      data
    ),

  me: () =>
    apiClient.get<AdminProfileResponse>(
      '/admin/me'
    ),

  logout: () =>
    apiClient.post<AdminLogoutResponse>(
      '/admin/logout'
    ),
};