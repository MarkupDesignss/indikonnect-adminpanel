import apiClient from "../client";


export interface Warehouse {
  id: number;
  name: string;
  code: string;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  contact_person: string;
  contact_number: string;
  contact_email?: string | null;
  is_active: boolean;
  is_default: boolean;
  total_capacity: number;
  opening_time: string;
  closing_time: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}


export interface WarehouseCreatePayload {
  name: string;
  code: string;

  address_line_1: string;
  address_line_2?: string;

  city: string;
  state: string;
  pincode: string;
  country: string;

  contact_person: string;
  contact_number: string;
  contact_email?: string;

  is_active: boolean;
  is_default: boolean;

  total_capacity: number;

  opening_time: string;
  closing_time: string;
}


export interface WarehouseUpdatePayload {
  name: string;
  code: string;

  address_line_1: string;
  address_line_2?: string;

  city: string;
  state: string;
  pincode: string;
  country: string;

  contact_person: string;
  contact_number: string;
  contact_email?: string;

  is_active: boolean;
  is_default: boolean;

  total_capacity: number;

  opening_time: string;
  closing_time: string;
}


export interface WarehousePaginationLink {
  url: string | null;
  label: string;
  page: number | null;
  active: boolean;
}

export interface WarehousePagination {
  current_page: number;
  data: Warehouse[];

  first_page_url?: string | null;

  from: number | null;

  last_page: number;

  last_page_url?: string | null;

  links?: WarehousePaginationLink[];

  next_page_url: string | null;

  path?: string;

  per_page: number;

  prev_page_url: string | null;

  to: number | null;

  total: number;
}


export interface WarehousesResponse {
  success: boolean;
  message?: string;

  data: WarehousePagination;
}

export interface WarehouseResponse {
  success: boolean;

  message?: string;

  errors?: Record<string, string[]>;

  data: Warehouse | null;
}


const warehousesApi = {

  getAll: (page: number = 1, perPage: number = 15) => {
    return apiClient.get<WarehousesResponse>("/warehouses", {
      params: {
        page,
        per_page: perPage,
      },
    });
  },


  getById: (id: number) => {
    return apiClient.get<WarehouseResponse>(`/warehouses/${id}`);
  },


  create: (payload: WarehouseCreatePayload) => {
    return apiClient.post<WarehouseResponse>("/warehouses", {
      name: payload.name,
      code: payload.code,

      address_line_1: payload.address_line_1,
      address_line_2: payload.address_line_2 ?? "",

      city: payload.city,
      state: payload.state,
      pincode: payload.pincode,
      country: payload.country,

      contact_person: payload.contact_person,
      contact_number: payload.contact_number,
      contact_email: payload.contact_email ?? "",

      is_active: payload.is_active,
      is_default: payload.is_default,

      total_capacity: payload.total_capacity,

      opening_time: payload.opening_time,
      closing_time: payload.closing_time,
    });
  },

  update: (
    id: number,
    payload: WarehouseUpdatePayload
  ) => {
    return apiClient.post<WarehouseResponse>(
      `/warehouses/${id}`,
      {
        name: payload.name,
        code: payload.code,

        address_line_1: payload.address_line_1,
        address_line_2: payload.address_line_2 ?? "",

        city: payload.city,
        state: payload.state,
        pincode: payload.pincode,
        country: payload.country,

        contact_person: payload.contact_person,
        contact_number: payload.contact_number,
        contact_email: payload.contact_email ?? "",

        is_active: payload.is_active,
        is_default: payload.is_default,

        total_capacity: payload.total_capacity,

        opening_time: payload.opening_time,
        closing_time: payload.closing_time,
      }
    );
  },
};

export default warehousesApi;