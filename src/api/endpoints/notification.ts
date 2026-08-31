import apiClient from "../client";

export interface NotificationResponse {
  success: boolean;
  message?: string;
  data:
    | Notification[]
    | {
        data: Notification[];
        total?: number;
        unread?: number;
      };
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type?: string;
  is_read?: boolean;
  read_at?: string | null;
  created_at: string;
  updated_at?: string;
  data?: Record<string, any> | null;
}

export const notificationApi = {
  // GET ALL NOTIFICATIONS
  getAll: () =>
    apiClient.get<NotificationResponse>(
      "admin/notifications"
    ),

  // MARK ONE AS READ
  markAsRead: (id: number) =>
    apiClient.put(
      `/admin/notifications/${id}/read`
    ),

  // MARK ALL AS READ
  markAllAsRead: () =>
    apiClient.put(
      "/admin/notifications/read-all"
    ),

  // DELETE ONE
  delete: (id: number) =>
    apiClient.delete(
      `/admin/notifications/${id}`
    ),

  // DELETE ALL
  deleteAll: () =>
    apiClient.delete(
      "/admin/notifications"
    ),
};

export default notificationApi;