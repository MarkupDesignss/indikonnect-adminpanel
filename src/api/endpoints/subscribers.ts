import apiClient from "../client";

export interface Subscriber {
id: number;
email: string;
subscribed_at: string;
is_active: boolean;
ip_address: string;
created_at: string;
updated_at: string;
}

export interface SubscribersResponse {
success: boolean;
message: string;
data: Subscriber[];
count: number;
}

export interface SubscriberDeleteResponse {
success: boolean;
message: string;
data?: Subscriber | null;
}

export const subscriberApi = {

  getAll: () =>
  apiClient.get<SubscribersResponse>(
  "/subscribers"
  ),


  delete: (email: string) =>
  apiClient.delete<SubscriberDeleteResponse>(
  `/subscribers/${encodeURIComponent(email)}`
  ),
  };

export default subscriberApi;
