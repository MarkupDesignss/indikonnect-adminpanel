import apiClient from "../client";

// =====================================================
// TYPES
// =====================================================

export interface AttributeValue {
  id: number;
  attribute_master_id: number;
  value: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AttributeMaster {
  id: number;
  attribute_key: string;
  is_required: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  values: AttributeValue[];
}

export interface AttributesResponse {
  success: boolean;
  message?: string;
  data: AttributeMaster[];
}

export interface AttributeActionResponse {
  success: boolean;
  message?: string;
  data?: AttributeMaster | AttributeValue | AttributeValue[];
}

export interface CreateAttributePayload {
  attribute_key: string;
  is_required?: boolean;
  sort_order?: number;
}

export interface UpdateAttributePayload {
  attribute_key: string;
  is_required: boolean;
  sort_order: number;
}

export interface BulkValuesPayload {
  values: string[];
}

export interface UpdateValuePayload {
  value: string;
  sort_order?: number;
}

// =====================================================
// API
// =====================================================

const attributesApi = {
  // GET ALL ATTRIBUTES
  getAll: () =>
    apiClient.get<AttributesResponse>(
      "/admin/attributes"
    ),

  // CREATE NEW ATTRIBUTE
  create: (payload: CreateAttributePayload) =>
    apiClient.post<AttributeActionResponse>(
      "/admin/attributes",
      payload
    ),

  // UPDATE ATTRIBUTE MASTER
  update: (
    id: number,
    payload: UpdateAttributePayload
  ) =>
    apiClient.put<AttributeActionResponse>(
      `/admin/attributes/${id}`,
      payload
    ),

  // DELETE ATTRIBUTE MASTER
  delete: (id: number) =>
    apiClient.delete<AttributeActionResponse>(
      `/admin/attributes/${id}`
    ),

  // ADD VALUES IN BULK
  addValues: (
    attributeId: number,
    payload: BulkValuesPayload
  ) =>
    apiClient.post<AttributeActionResponse>(
      `/admin/attributes/${attributeId}/values/bulk`,
      payload
    ),

  // UPDATE SINGLE VALUE
  updateValue: (
    attributeId: number,
    valueId: number,
    payload: UpdateValuePayload
  ) =>
    apiClient.put<AttributeActionResponse>(
      `/admin/attributes/${attributeId}/values/${valueId}`,
      payload
    ),

  // DELETE SINGLE VALUE
  deleteValue: (
    attributeId: number,
    valueId: number
  ) =>
    apiClient.delete<AttributeActionResponse>(
      `/admin/attributes/${attributeId}/values/${valueId}`
    ),
};

export default attributesApi;