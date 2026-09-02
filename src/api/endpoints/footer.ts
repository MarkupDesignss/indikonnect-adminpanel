import apiClient from "../client";

// =====================================================
// TYPES
// =====================================================

export interface FooterData {
  id?: number;

  logo?: string | null;
  title?: string | null;

  instagram?: string | null;
  facebook?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
  youtube?: string | null;

  email?: string | null;
  phone?: string | null;

  quote1?: string | null;
  quote2?: string | null;
  quote3?: string | null;

  copyright?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
}

export interface FooterResponse {
  success: boolean;
  message?: string;
  data: FooterData;
}

export interface FooterUpdateResponse {
  success: boolean;
  message?: string;
  data?: FooterData;
}

// =====================================================
// PAYLOAD
// =====================================================

export interface FooterUpdatePayload {
  logo?: File | null;
  title: string;
  instagram: string;
  facebook: string;
  linkedin: string;
  twitter: string;
  youtube: string;
  email: string;
  phone: string;
  quote1: string;
  quote2: string;
  quote3: string;
  copyright: string;
}

// =====================================================
// FORM DATA
// =====================================================

const createFooterFormData = (
  payload: FooterUpdatePayload
) => {
  const formData = new FormData();

  if (payload.logo) {
    formData.append("logo", payload.logo);
  }

  formData.append("title", payload.title);
  formData.append("instagram", payload.instagram);
  formData.append("facebook", payload.facebook);
  formData.append("linkedin", payload.linkedin);
  formData.append("twitter", payload.twitter);
  formData.append("youtube", payload.youtube);
  formData.append("email", payload.email);
  formData.append("phone", payload.phone);
  formData.append("quote1", payload.quote1);
  formData.append("quote2", payload.quote2);
  formData.append("quote3", payload.quote3);
  formData.append("copyright", payload.copyright);

  return formData;
};

// =====================================================
// API
// =====================================================

export const footerApi = {
  /**
   * GET /api/footer
   */
  get: () =>
    apiClient.get<FooterResponse>(
      "/footer"
    ),

  /**
   * UPDATE /api/footer
   *
   * Logo is optional.
   * If logo is not selected, existing logo remains unchanged.
   */
  update: (
    payload: FooterUpdatePayload
  ) =>
    apiClient.post<FooterUpdateResponse>(
      "/footer/update",
      createFooterFormData(payload),
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    ),
};

export default footerApi;