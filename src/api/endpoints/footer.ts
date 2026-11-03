
import apiClient from "../client";

// =====================================================
// HERITAGE SITE TYPES
// =====================================================

export interface HeritageSite {
  id: number;
  title: string;
  subtitle?: string | null;
  location?: string | null;
  state?: string | null;
  description?: string | null;
  image_url?: string | null;
  category?: string | null;
  full_location?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface HeritageSitesData {
  data: HeritageSite[];
  count: number;
}

// =====================================================
// FOOTER TYPES
// =====================================================

export interface FooterData {
  id?: number;

  logo?: string | null;
  logo_url?: string | null;

  title?: string | null;

  instagram?: string | null;
  facebook?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
  youtube?: string | null;
  pinterest?: string | null;

  email?: string | null;
  phone?: string | null;

  quote1?: string | null;
  quote2?: string | null;
  quote3?: string | null;

  location?: string | null;

  copyright?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
}

// =====================================================
// FOOTER GET RESPONSE
// =====================================================

export interface FooterResponse {
  success: boolean;
  message?: string;

  data: {
    footer: FooterData;
    heritage_sites: HeritageSitesData;
  };
}

export interface FooterUpdateResponse {
  success: boolean;
  message?: string;
  data?: FooterData;
}

// =====================================================
// HERITAGE API RESPONSE
// =====================================================

export interface HeritageMutationResponse {
  success: boolean;
  message?: string;
  data?: HeritageSite;
}

// =====================================================
// FOOTER PAYLOAD
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

  quote1?: string;
  quote2?: string;
  quote3?: string;

  copyright: string;
}

// =====================================================
// FOOTER FORM DATA
// =====================================================

const createFooterFormData = (
  payload: FooterUpdatePayload
): FormData => {
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
  formData.append("copyright", payload.copyright);

  if (payload.quote1 !== undefined) {
    formData.append("quote1", payload.quote1);
  }

  if (payload.quote2 !== undefined) {
    formData.append("quote2", payload.quote2);
  }

  if (payload.quote3 !== undefined) {
    formData.append("quote3", payload.quote3);
  }

  return formData;
};

// =====================================================
// HERITAGE SITE FORM DATA
// =====================================================

export interface HeritageSitePayload {
  title: string;
  subtitle?: string;
  location?: string;
  state?: string;
  description?: string;
  category?: string;
  image?: File | null;
}

const createHeritageFormData = (
  payload: HeritageSitePayload
): FormData => {
  const formData = new FormData();

  formData.append("title", payload.title);
  formData.append("subtitle", payload.subtitle || "");
  formData.append("location", payload.location || "");
  formData.append("state", payload.state || "");
  formData.append("description", payload.description || "");
  formData.append("category", payload.category || "");

  if (payload.image) {
    formData.append("image", payload.image);
  }

  return formData;
};

// =====================================================
// API
// =====================================================

export const footerApi = {
  // =================================================
  // GET FOOTER + HERITAGE SITES
  // GET /api/footer
  // =================================================

  get: () =>
    apiClient.get<FooterResponse>("/footer"),

  // =================================================
  // UPDATE FOOTER
  // POST /api/footer/update
  // =================================================

  update: (payload: FooterUpdatePayload) =>
    apiClient.post<FooterUpdateResponse>(
      "/footer/update",
      createFooterFormData(payload),
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    ),

  // =================================================
  // CREATE HERITAGE SITE
  // POST /api/heritage
  // =================================================

  createHeritageSite: (payload: HeritageSitePayload) =>
    apiClient.post<HeritageMutationResponse>(
      "/heritage",
      createHeritageFormData(payload)
    ),

  // =================================================
  // UPDATE HERITAGE SITE
  // PUT /api/heritage/{id}
  // =================================================

  updateHeritageSite: (
    id: number,
    payload: HeritageSitePayload
  ) =>
    apiClient.put<HeritageMutationResponse>(
      `/heritage/${id}`,
      createHeritageFormData(payload)
    ),

  // =================================================
  // DELETE HERITAGE SITE
  // DELETE /api/heritage/{id}
  // =================================================

  deleteHeritageSite: (id: number) =>
    apiClient.delete<HeritageMutationResponse>(
      `/heritage/${id}`
    ),
};

export default footerApi;
