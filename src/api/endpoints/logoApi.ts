import apiClient from "../client";

export interface LogoData {
  logo: string;
}

export interface LogoResponse {
  success: boolean;
  message?: string;
  data: LogoData;
}

const logoApi = {
  getLogo: () =>
    apiClient.get<LogoResponse>(
      `/logo?_t=${Date.now()}`
    ),
};

export default logoApi;