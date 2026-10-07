import apiClient from "../client";

// =====================================================
// COMMON TYPES
// =====================================================

export interface AdminPermission {
  id: number;
  name: string;
  slug: string;
  module: string;
  action: string;
  source?: string;
  created_at?: string;
  updated_at?: string;
}

// =====================================================
// WAREHOUSE TYPES
// =====================================================

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  city: string;
  state: string;
  is_active: boolean;
  is_default: boolean;
}

export interface WarehouseRole {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface WarehouseAssignment {
  id: number;

  warehouse: Warehouse | null;

  role: WarehouseRole | null;

  role_id: number;
  role_slug: string;

  is_primary: boolean;
  is_active: boolean;
  is_current: boolean;

  assigned_from: string | null;
  assigned_until: string | null;

  notes: string | null;

  assigned_by: number;

  created_at: string;
  updated_at: string;
}

export interface WarehouseByRole {
  id: number;

  warehouse_id: number;
  warehouse_name: string;
  warehouse_code: string;

  role_id: number;
  role_name: string;
  role_slug: string;

  is_primary: boolean;

  assigned_from: string | null;
  assigned_until: string | null;
}

// =====================================================
// ADMIN PROFILE
// =====================================================

export interface AdminProfile {
  id: number;
  name: string;
  email: string;

  profile_image?: string | null;

  created_at: string | null;
  updated_at: string;

  /*
   * Backend future mein roles bheje
   * to TypeScript error nahi aayega.
   */
  roles?: string[];
}

// =====================================================
// ADMIN / ME RESPONSE DATA
// GET /admin/me
// =====================================================

export interface AdminMeData {
  admin: AdminProfile;

  /*
   * Example:
   *
   * [
   *   {
   *     id: 1,
   *     name: "Product Create",
   *     slug: "product.create",
   *     module: "product",
   *     action: "create",
   *     source: "global_role"
   *   }
   * ]
   */
  permissions_details: AdminPermission[];

  /*
   * Example:
   *
   * {
   *   product: ["create", "view", "update"],
   *   order: ["view", "details"]
   * }
   */
  permissions_grouped: Record<string, string[]>;

  /*
   * Warehouse assignments
   */
  warehouse_assignments: WarehouseAssignment[];

  /*
   * Example:
   *
   * {
   *   "warehouse-manager": [...]
   * }
   */
  warehouses_by_role: Record<string, WarehouseByRole[]>;

  /*
   * true / false
   */
  has_warehouse_access: boolean;
}

// =====================================================
// GET ADMIN / ME RESPONSE
// =====================================================

export interface AdminProfileResponse {
  success: boolean;

  data: AdminMeData;

  message?: string;
}

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

  success?: boolean;
}

// =====================================================
// FORGOT PASSWORD
// =====================================================

export interface AdminForgotPasswordRequest {
  email: string;
}

export interface AdminForgotPasswordResponse {
  success?: boolean;
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
// ADMIN UPDATE
// =====================================================

export interface AdminUpdateRequest {
  email?: string;
  name?: string;
  profile_image?: File | null;
}

export interface AdminUpdateResponse {
  success?: boolean;
  message?: string;

  admin?: AdminProfile;

  data?: AdminProfile;
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
  // POST /admin/login
  // ===================================================

  login: (data: AdminLoginRequest) =>
    apiClient.post<AdminLoginResponse>(
      "/admin/login",
      data,
    ),

  // ===================================================
  // FORGOT PASSWORD
  // POST /admin/send-reset-otp
  // ===================================================

  forgotPassword: (
    data: AdminForgotPasswordRequest,
  ) =>
    apiClient.post<AdminForgotPasswordResponse>(
      "/admin/send-reset-otp",
      data,
    ),

  // ===================================================
  // VERIFY OTP
  // POST /admin/verify-otp
  // ===================================================

  verifyOtp: (
    data: AdminVerifyOtpRequest,
  ) =>
    apiClient.post<AdminVerifyOtpResponse>(
      "/admin/verify-otp",
      data,
    ),

  // ===================================================
  // RESET PASSWORD
  // POST /admin/reset-password
  // ===================================================

  resetPassword: (
    data: AdminResetPasswordRequest,
  ) =>
    apiClient.post<AdminResetPasswordResponse>(
      "/admin/reset-password",
      data,
    ),

  // ===================================================
  // UPDATE ADMIN
  // POST /admin/update
  //
  // form-data:
  // email
  // name
  // profile_image
  // ===================================================

  update: (
    data: AdminUpdateRequest,
  ) => {
    const formData = new FormData();

    if (data.email !== undefined) {
      formData.append(
        "email",
        data.email,
      );
    }

    if (data.name !== undefined) {
      formData.append(
        "name",
        data.name,
      );
    }

    if (data.profile_image) {
      formData.append(
        "profile_image",
        data.profile_image,
      );
    }

    return apiClient.post<AdminUpdateResponse>(
      "/admin/update",
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      },
    );
  },

  // ===================================================
  // GET ADMIN PROFILE + PERMISSIONS
  // GET /admin/me
  //
  // IMPORTANT:
  // Ye hi API ab complete admin permission system
  // ke liye use hogi.
  // ===================================================

  me: () =>
    apiClient.get<AdminProfileResponse>(
      "/admin/me",
    ),

  // ===================================================
  // LOGOUT
  // POST /admin/logout
  // ===================================================

  logout: () =>
    apiClient.post<AdminLogoutResponse>(
      "/admin/logout",
    ),

  // ===================================================
  // CHANGE PASSWORD
  // POST /user/change-password
  // ===================================================

  changePassword: (
    data: ChangePasswordRequest,
  ) =>
    apiClient.post<ChangePasswordResponse>(
      "/user/change-password",
      data,
    ),

  // ===================================================
  // UPDATE PROFILE
  // POST /admin/update
  //
  // Same API as update()
  // ===================================================

  updateProfile: (
    data: UpdateProfileRequest,
  ) => {
    const formData = new FormData();

    if (data.email !== undefined) {
      formData.append(
        "email",
        data.email,
      );
    }

    if (data.name !== undefined) {
      formData.append(
        "name",
        data.name,
      );
    }

    if (data.profile_image) {
      formData.append(
        "profile_image",
        data.profile_image,
      );
    }

    return apiClient.post<UpdateProfileResponse>(
      "/admin/update",
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      },
    );
  },
};

export default adminApi;