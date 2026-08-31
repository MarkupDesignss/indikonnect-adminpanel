import apiClient from "../client";

export interface BusinessProfile {
  id: number;
  user_id: number;

  aadhaar_verified: number;
  aadhaar_verified_at: string | null;
  aadhaar_consent: number;

  pan_verified: number;
  pan_verified_at: string | null;

  bank_ifsc: string | null;
  bank_name: string | null;
  title: string | null;
  type_of_entity: string | null;
  branch_name: string | null;
  account_type: string | null;

  bank_verified: number;
  bank_holder_name: string | null;

  kyc_status: string | null;
  application_status: string | null;

  location_consent: number;
  location_consent_at: string | null;

  latitude: string | null;
  longitude: string | null;

  registration_completed: number;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: number | null;

  rejection_reason: string | null;
  terms_accepted_at: string | null;

  created_at: string;
  updated_at: string;

  encrypted_aadhaar?: string | null;
  encrypted_pan?: string | null;
  encrypted_bank_account?: string | null;
}

export interface RegisteredUser {
  id: number;
  distributor_id: string | null;

  full_name: string | null;
  email: string;
  phone: string | null;

  phone_verified_at: string | null;

  country: string | null;
  date_of_birth: string | null;

  account_type: "customer" | "distributor" | string;

  terms_condition: boolean;

  otp: string | null;
  otp_expires_at: string | null;

  temp_verification_token: string | null;
  otp_verified_at: string | null;

  email_verified_at: string | null;

  email_otp: string | null;
  email_otp_expires_at: string | null;

  phone_verified: number;

  aadhaar_last4: string | null;
  pan_last4: string | null;
  account_last4: string | null;

  accept_terms: number;
  accept_agreement: number;
  accept_code_of_conduct: number;
  location_consent_given: number;

  is_registered: boolean;
  is_active: boolean;

  profile_picture: string | null;

  role_id: number | null;
  sponsor_id: string | null;
  placement_leg: string | null;

  kyc_status: string;

  activation_date: string | null;

  registration_step: number;

  temp_token: string | null;

  registration_completed_at: string | null;

  created_at: string;
  updated_at: string;

  role: any | null;
  business_profile: BusinessProfile | null;
}


export interface RegisteredUsersResponse {
  success: boolean;
  message: string;
  data: RegisteredUser[];
}

export interface RegisteredUserDetailResponse {
  success: boolean;
  message: string;
  data: RegisteredUser[];
}

export interface UserStatusResponse {
  success: boolean;
  message: string;
  data: {
    user_id: number;
    is_active: boolean;
    status: string;
  };
}

export interface DistributorStatusResponse {
  success: boolean;
  message: string;
  data?: {
    user_id?: number;
    distributor_id?: string | number;
    is_active?: boolean;
    status?: string;
    kyc_status?: string;
  };
}

export const userManagementApi = {

  getRegisteredUsers: () =>
    apiClient.get<RegisteredUsersResponse>(
      "/admin/registered-users"
    ),

  getUserById: (id: number) =>
    apiClient.get<RegisteredUserDetailResponse>(
      `/admin/registered-users/${id}`
    ),

  updateUserStatus: (
    id: number,
    is_active: boolean
  ) =>
    apiClient.post<UserStatusResponse>(
      `/admin/update-user-status/${id}`,
      {
        is_active,
      }
    ),

  updateDistributorStatus: (
    id: number,
    kyc_status: string
  ) =>
    apiClient.post<DistributorStatusResponse>(
      `/admin/distributors/${id}/status`,
      {
        kyc_status,
      }
    ),
};

export default userManagementApi;