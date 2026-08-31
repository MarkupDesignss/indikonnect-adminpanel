import apiClient from "../client";

export type CouponType =
| "percentage"
| "fixed";

export interface Coupon {
id: number;
code: string;
title: string;
type: CouponType | string;
value: string | number;
min_order: string | number;
max_order: string | number;
max_uses: number;
used_count: number;
expires_at: string;
is_active: boolean;
created_at: string;
updated_at: string;
deleted_at?: string | null;
}

export interface CouponPayload {
code: string;
title: string;
type: CouponType;
value: number;
min_order: number;
max_order: number;
max_uses: number;
expires_at: string;
is_active: boolean;
}

export interface CouponPagination {
current_page: number;
first_page_url?: string | null;
from?: number | null;
last_page: number;
last_page_url?: string | null;
next_page_url?: string | null;
prev_page_url?: string | null;
per_page: number;
to?: number | null;
total: number;
}

export interface CouponListResponse {
success: boolean;
data: {
current_page: number;
data: Coupon[];
first_page_url?: string | null;
from?: number | null;
last_page: number;
last_page_url?: string | null;
next_page_url?: string | null;
prev_page_url?: string | null;
per_page: number;
to?: number | null;
total: number;
};
message?: string;
}

export interface CouponActionResponse {
success: boolean;
message: string;
data?: Coupon | null;
}

// =====================================================
// API
// =====================================================

export const couponApi = {
// GET /api/coupons
getAll: (
page = 1,
perPage = 15
) =>
apiClient.get<CouponListResponse>(
"/coupons",
{
params: {
page,
per_page: perPage,
},
}
),

// POST /api/coupons
create: (
payload: CouponPayload
) =>
apiClient.post<CouponActionResponse>(
"/coupons",
payload
),

// PUT /api/coupons/:id
// Change PUT to PATCH here if your backend expects PATCH.
update: (
id: number,
payload: CouponPayload
) =>
apiClient.post<CouponActionResponse>(
`/coupons/${id}`,
payload
),

// DELETE /api/coupons/:id
delete: (
id: number
) =>
apiClient.delete<CouponActionResponse>(
`/coupons/${id}`
),
};

export default couponApi;
