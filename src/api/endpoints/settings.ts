import apiClient from "../client";

export interface Setting {
  id: number;
  group: string;
  key: string;
  value: string;
  data_type: "integer" | "string" | "boolean" | "email";
  description: string;
  is_editable: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateSettingPayload {
  value: string | number | boolean;
  data_type: Setting["data_type"];
  description: string;
}

interface SettingsResponse {
  success: boolean;
  message?: string;
  data: Setting[];
}

interface SettingResponse {
  success: boolean;
  message?: string;
  data: Setting | null;
}

const settingsApi = {
  // GET ALL
  getAll: () => {
    return apiClient.get<SettingsResponse>("/admin/settings");
  },



  // UPDATE
  update: (
    key: string,
    payload: UpdateSettingPayload
  ) => {
    return apiClient.put<SettingResponse>(
      `/admin/settings/${key}`,
      payload
    );
  },
};

export default settingsApi;