import apiClient from "../client";

export interface Testimonial {
  id: number;
  video_path: string;
  video_title: string;
  person_name: string;
  heading: string;
  rating: string;
  text: string;
  is_active: boolean;
  display_order: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TestimonialApiResponse {
  data: {
    current_page: number;
    data: Testimonial[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{
      url: string | null;
      label: string;
      page: number | null;
      active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
  message?: string;
  success?: boolean;
}

export interface TestimonialSingleResponse {
  data?: Testimonial;
  message?: string;
  success?: boolean;
}

const testimonialsApi = {
  // =====================================================
  // GET /api/testimonials
  // =====================================================

  getAll: (params?: { page?: number; per_page?: number }) =>
    apiClient.get<TestimonialApiResponse>("/testimonials", { params }),

  // =====================================================
  // GET /api/testimonials/:id
  // =====================================================

  getById: (id: number) =>
    apiClient.get<TestimonialSingleResponse>(`/testimonials/${id}`),

  // =====================================================
  // POST /api/testimonials
  // =====================================================

  create: (formData: FormData) =>
    apiClient.post<TestimonialSingleResponse>("/testimonials", formData),

  // =====================================================
  // POST /api/testimonials/:id (Update with _method=PUT)
  // =====================================================

  update: (id: number, formData: FormData) => {

    return apiClient.post<TestimonialSingleResponse>(
      `/testimonials/${id}`,
      formData
    );
  },

  // =====================================================
  // DELETE /api/testimonials/:id
  // =====================================================

  delete: (id: number) =>
    apiClient.delete<TestimonialSingleResponse>(`/testimonials/${id}`),
};

export default testimonialsApi;