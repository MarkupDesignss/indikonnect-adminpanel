import apiClient from "../client";

export type Correctionrejected_reason =
  | "both_wrong_at_signup"
  | "wrong_name_at_signup"
  | "wrong_dob_at_signup"
  | string;

export type CorrectionStatus =
  | "pending"
  | "completed"
  | "expired"
  | "rejected"
  | string;

export interface CorrectionRequestUser {
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
  distributor_status?: string | null;
  kyc_status?: string | null;
  activation_date: string | null;
  registration_step: number;
  temp_token: string | null;
  registration_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CorrectionRequest {
  id: number;
  user_id: number;
  full_name: string | null;
  date_of_birth: string | null;
  status: CorrectionStatus;
  token: string;
  token_expires_at: string | null;
  token_used_at: string | null;
  created_at: string;
  updated_at: string;
  email: string;
  rejected_reason: Correctionrejected_reason;
  user: CorrectionRequestUser | null;
}

export interface CorrectionRequestsListResponse {
  status: boolean;
  data: CorrectionRequest[];
  message?: string;
}

export interface CorrectionActionResponse {
  status: boolean;
  message: string;
  data?: {
    id?: number;
    token?: string;
    status?: string;
    token_expires_at?: string | null;
    [key: string]: any;
  };
}

export interface RejectCorrectionRequestPayload {
  rejected_reason: string;
}

export const correctionRequestsApi = {
  getRequests: () =>
    apiClient.get<CorrectionRequestsListResponse>("/admin/correction/requests"),

  sendLink: (id: number) =>
    apiClient.post<CorrectionActionResponse>(
      `/admin/correction/requests/${id}/send-link`,
      {},
    ),

  rejectRequest: (id: number, rejected_reason: string) =>
    apiClient.post<CorrectionActionResponse>(
      `/admin/correction-requests/${id}/reject`,
      { rejected_reason } satisfies RejectCorrectionRequestPayload,
    ),

  // Assumed REST route: confirm this path with your backend API if it differs.
  approveRequest: (id: number) =>
    apiClient.post<CorrectionActionResponse>(
      `/admin/correction-requests/${id}/approve`,
      {},
    ),
};

export default correctionRequestsApi;
