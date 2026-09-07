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
  type?: string;
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
// API FUNCTIONS
// =====================================================

export const headerApi = {
  /**
   * GET /api/header
   * Get header logo, favicon and menus
   */
  getAll: () =>
    apiClient.get<HeaderResponse>("/header"),

  /**
   * POST /header/add
   * Add header menu
   * Sending as JSON instead of FormData
   */
  addMenu: (payload: { title: string; status: boolean; type: string }) =>
    apiClient.post<HeaderActionResponse>("/header/add", payload),

  /**
   * POST /header/update/:id
   * Update header menu
   * Sending as JSON instead of FormData
   */
  updateMenu: (
    id: number,
    payload: { title: string; status: boolean; type: string }
  ) =>
    apiClient.post<HeaderActionResponse>(`/header/update/${id}`, payload),

  /**
   * DELETE /header/delete/:id
   * Delete header menu
   */
  deleteMenu: (id: number) =>
    apiClient.delete<HeaderActionResponse>(`/header/delete/${id}`),

  /**
   * POST /header/update-branding/:id
   * Update branding (logo & favicon)
   * Using FormData for file uploads
   */
  updateBranding: (
    id: number,
    payload: { logo: File | null; favicon: File | null }
  ) => {
    const formData = new FormData();
    
    if (payload.logo) {
      formData.append("logo", payload.logo);
    }
    
    if (payload.favicon) {
      formData.append("favicon", payload.favicon);
    }
    
    return apiClient.post<HeaderActionResponse>(
      `/header/update-branding/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },
};

export default headerApi;