import apiClient from "../client";

/* =========================================================
   TYPES
========================================================= */

export interface NotificationTemplate {
  id: number;
  event_type: string;
  channel: string;
  subject: string;
  body: string;
  placeholders: string[];
  is_active: boolean;
  version: number;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface NotificationTemplatesMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface NotificationTemplatesFilters {
  event_types: string[];
  channels: string[];
}

export interface NotificationTemplatesResponse {
  success: boolean;
  message?: string;
  data: NotificationTemplate[];
  meta?: NotificationTemplatesMeta;
  filters?: NotificationTemplatesFilters;
}

export interface NotificationTemplateUpdatePayload {
  subject: string;
  body: string;
}

export interface NotificationTemplateUpdateResponse {
  success: boolean;
  message?: string;
  data?: NotificationTemplate;
}

/* =========================================================
   API
========================================================= */

export const notificationTemplateApi = {
  /**
   * GET /notification-templates?page=1
   *
   * Pagination is handled by API.
   */
  getAll: (page: number = 1) =>
    apiClient.get<NotificationTemplatesResponse>(
      "/notification-templates",
      {
        params: {
          page,
        },
      }
    ),

  /**
   * PUT /notification-templates/:id
   *
   * Update only subject and body.
   */
  update: (
    id: number,
    data: NotificationTemplateUpdatePayload
  ) =>
    apiClient.post<NotificationTemplateUpdateResponse>(
      `/notification-templates/${id}`,
      data
    ),
};