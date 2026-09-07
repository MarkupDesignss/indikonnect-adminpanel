import apiClient from "../client";

export interface ReelProduct {
  id: number;
  name?: string;
  product_code?: string;
  slug?: string;
  product_link?: string | null;
}

export interface Reel {
  id: number;
  title: string;
  creator_handle: string;
  followers_count: number;

  video_path?: string | null;
  video_url?: string | null;
  video_full_url?: string | null;
  video_full_path?: string | null;

  thumbnail?: string | null;
  thumbnail_url?: string | null;

  is_published: boolean;
  sort_order: number;

  created_at?: string | null;
  updated_at?: string | null;

  product?: ReelProduct | null;
}

export interface ReelApiResponse {
  data: Reel[];

  meta?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };

  message?: string;
  success?: boolean;
}

export interface ReelSingleResponse {
  data?: Reel;
  message?: string;
  success?: boolean;
}

export interface ReelPayload {
  title: string;
  creator_handle: string;
  followers_count: number;
  product_id?: number | null;
  is_published: boolean;
  sort_order?: number;
  video?: File | null;
  video_url?: string;
  thumbnail?: File | null;
}

const reelsApi = {
  // =====================================================
  // GET /api/reels
  // =====================================================

  getAll: () =>
    apiClient.get<ReelApiResponse>(
      "/reels"
    ),

  // =====================================================
  // POST /api/reels
  // =====================================================

  create: (
    formData: FormData
  ) =>
    apiClient.post<ReelSingleResponse>(
      "/reels",
      formData
    ),

  // =====================================================
  // PUT /api/reels/:id
  // POST + _method=PUT
  // =====================================================

  update: (
    id: number,
    formData: FormData
  ) => {
 

    return apiClient.post<ReelSingleResponse>(
      `/reels/${id}`,
      formData
    );
  },

  // =====================================================
  // DELETE /api/reels/:id
  // =====================================================

  delete: (
    id: number
  ) =>
    apiClient.delete<ReelSingleResponse>(
      `/reels/${id}`
    ),
};

export default reelsApi;