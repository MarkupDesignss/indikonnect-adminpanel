import apiClient from "../client";

// =====================================================
// ADMIN LOGIN
// =====================================================

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

// =====================================================
// FORGOT PASSWORD
// =====================================================

export interface AdminForgotPasswordRequest {
  email: string;
}

export interface AdminForgotPasswordResponse {
  message?: string;
}

// =====================================================
// VERIFY OTP
// =====================================================

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

// =====================================================
// RESET PASSWORD
// =====================================================

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

// =====================================================
// ADMIN PROFILE
// =====================================================

export interface AdminUpdateRequest {
  email?: string;
  name?: string;
  profile_image?: File | null;
}

export interface AdminUpdateResponse {
  success?: boolean;
  message?: string;

  admin?: {
    id: number;
    name: string;
    email: string;
    roles?: string[];
    profile_image?: string | null;
    created_at?: string | null;
    updated_at?: string;
  };

  data?: {
    id: number;
    name: string;
    email: string;
    roles?: string[];
    profile_image?: string | null;
    created_at?: string | null;
    updated_at?: string;
  };
}

export interface AdminProfile {
  id: number;
  name: string;
  email: string;
  roles: string[];
  profile_image?: string | null;
  created_at: string | null;
  updated_at: string;
}

export interface AdminProfileResponse {
  admin: AdminProfile;
  permissions_grouped: unknown[];
}

// =====================================================
// LOGOUT
// =====================================================

export interface AdminLogoutResponse {
  success?: boolean;
  message?: string;
}

// =====================================================
// CHANGE PASSWORD
// =====================================================

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface ChangePasswordResponse {
  success?: boolean;
  message?: string;
  data?: unknown;
}

// =====================================================
// PROFILE UPDATE
// =====================================================

export interface UpdateProfileRequest {
  email?: string;
  name?: string;
  profile_image?: File | null;
}

export interface UpdateProfileResponse {
  success?: boolean;
  message?: string;
  data?: unknown;
  admin?: AdminProfile;
}

// =====================================================
// ADMIN API
// =====================================================

export const adminApi = {
  // ===================================================
  // LOGIN
  // ===================================================

  login: (data: AdminLoginRequest) =>
    apiClient.post<AdminLoginResponse>(
      "/admin/login",
      data
    ),

  // ===================================================
  // FORGOT PASSWORD
  // ===================================================

  forgotPassword: (
    data: AdminForgotPasswordRequest
  ) =>
    apiClient.post<AdminForgotPasswordResponse>(
      "/admin/send-reset-otp",
      data
    ),

  // ===================================================
  // VERIFY OTP
  // ===================================================

  verifyOtp: (
    data: AdminVerifyOtpRequest
  ) =>
    apiClient.post<AdminVerifyOtpResponse>(
      "/admin/verify-otp",
      data
    ),

  // ===================================================
  // RESET PASSWORD
  // ===================================================

  resetPassword: (
    data: AdminResetPasswordRequest
  ) =>
    apiClient.post<AdminResetPasswordResponse>(
      "/admin/reset-password",
      data
    ),

  // ===================================================
  // UPDATE ADMIN
  // POST /admin/update
  // form-data:
  // email
  // name
  // profile_image
  // ===================================================

  update: (data: AdminUpdateRequest) => {
    const formData = new FormData();

    if (data.email !== undefined) {
      formData.append("email", data.email);
    }

    if (data.name !== undefined) {
      formData.append("name", data.name);
    }

    if (data.profile_image) {
      formData.append(
        "profile_image",
        data.profile_image
      );
    }

    return apiClient.post<AdminUpdateResponse>(
      "/admin/update",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },

  // ===================================================
  // GET ADMIN PROFILE
  // GET /admin/me
  // ===================================================

  me: () =>
    apiClient.get<AdminProfileResponse>(
      "/admin/me"
    ),

  // ===================================================
  // LOGOUT
  // ===================================================

  logout: () =>
    apiClient.post<AdminLogoutResponse>(
      "/admin/logout"
    ),

  // ===================================================
  // CHANGE PASSWORD
  // ===================================================

  changePassword: (
    data: ChangePasswordRequest
  ) =>
    apiClient.post<ChangePasswordResponse>(
      "/user/change-password",
      data
    ),

  // ===================================================
  // UPDATE PROFILE
  // Same /admin/update API
  // ===================================================

  updateProfile: (
    data: UpdateProfileRequest
  ) => {
    const formData = new FormData();

    if (data.email !== undefined) {
      formData.append("email", data.email);
    }

    if (data.name !== undefined) {
      formData.append("name", data.name);
    }

    if (data.profile_image) {
      formData.append(
        "profile_image",
        data.profile_image
      );
    }

    return apiClient.post<UpdateProfileResponse>(
      "/admin/update",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },
};

export default adminApi;