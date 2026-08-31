import apiClient from "../client";

// =====================================================
// TYPES
// =====================================================

export interface GrowthStep {
  id?: number;
  number: string;
  subtitle: string;
  description: string;
  order: number;
  is_active: boolean;
}

export interface GrowthStepsData {
  title: string | null;
  steps: GrowthStep[];
  total_steps: number;
}

export interface GrowthStepsResponse {
  success: boolean;
  message?: string;
  data: GrowthStepsData;
}

export interface GrowthStepResponse {
  success: boolean;
  message?: string;
  data: GrowthStep;
}

export interface GrowthStepPayload {
  title: string;
  number: string;
  subtitle: string;
  description: string;
  order: number;
  is_active: boolean;
}

// =====================================================
// API
// =====================================================

export const growthStepsApi = {
  /**
   * GET /api/growth-steps
   */
  getAll: () =>
    apiClient.get<GrowthStepsResponse>(
      "/growth-steps"
    ),

  /**
   * POST /api/growth-steps
   */
  create: (payload: GrowthStepPayload) =>
    apiClient.post<GrowthStepResponse>(
      "/growth-steps",
      payload
    ),

  /**
   * PUT /api/growth-steps/:id
   */
  update: (
    id: number,
    payload: GrowthStepPayload
  ) =>
    apiClient.put<GrowthStepResponse>(
      `/growth-steps/${id}`,
      payload
    ),

  /**
   * DELETE /api/growth-steps/:id
   */
  delete: (id: number) =>
    apiClient.delete<GrowthStepResponse>(
      `/growth-steps/${id}`
    ),
};

export default growthStepsApi;