import apiClient from "../client";

// =====================================================
// TYPES
// =====================================================

export interface HeaderLogo {
  id: number;
  type: string;
  logo: string | null;
  favicon: string | null;
}

export interface HeaderMenu {
  id: number;
  title: string;
  slug: string;
  sort_order: number;
  status: boolean;
}

export interface HeaderData {
  logo: HeaderLogo | null;
  menus: HeaderMenu[];
}

export interface HeaderResponse {
  success: boolean;
  message?: string;
  data: HeaderData;
}

export interface HeaderActionResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// =====================================================
// CREATE HEADER / MENU
// POST /header/add
//
// FormData:
// logo      -> File
// favicon   -> File
// title     -> Text
// status    -> 1 / 0
// type      -> menu
// =====================================================

export interface AddHeaderPayload {
  logo?: File | null;
  favicon?: File | null;
  title: string;
  status: boolean;
  type: string;
}

const buildHeaderFormData = (
  payload: AddHeaderPayload
) => {
  const formData = new FormData();

  if (payload.logo) {
    formData.append("logo", payload.logo);
  }

  if (payload.favicon) {
    formData.append("favicon", payload.favicon);
  }

  formData.append("title", payload.title);
  formData.append("status", payload.status ? "1" : "0");
  formData.append("type", payload.type);

  return formData;
};

// =====================================================
// API
// =====================================================

export const headerApi = {
  /**
   * GET /api/header
   * Get header logo, favicon and menus
   */
  getAll: () =>
    apiClient.get<HeaderResponse>(
      "/header"
    ),

  /**
   * POST /header/add
   * Add header menu / header configuration
   */
  add: (
    payload: AddHeaderPayload
  ) =>
    apiClient.post<HeaderActionResponse>(
      "/header/add",
      buildHeaderFormData(payload),
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    ),

  /**
   * POST /header/update/:id
   * Update header menu / header configuration
   */
  update: (
    id: number,
    payload: AddHeaderPayload
  ) =>
    apiClient.post<HeaderActionResponse>(
      `/header/update/${id}`,
      buildHeaderFormData(payload),
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    ),

  /**
   * DELETE /header/delete/:id
   * Delete header menu
   */
  delete: (
    id: number
  ) =>
    apiClient.delete<HeaderActionResponse>(
      `/header/delete/${id}`
    ),
};

export default headerApi;