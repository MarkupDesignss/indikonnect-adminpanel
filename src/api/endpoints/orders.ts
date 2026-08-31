import apiClient from '../client';

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled'
  | 'return_initiated'
  | 'return_pending'
  | 'return_approved'
  | 'return_rejected'
  | 'returned';

export type PaymentStatus = 'paid' | 'unpaid' | 'refunded' | 'failed';

export type DeliveryStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled' 
  | 'returned'
  | 'return_approved'
  | 'return_initiated';

export type ReturnStatus = 'none' | 'returned' | 'approved' | 'rejected' | 'pending' | 'initiated';

export type OrderType = 'retail' | 'distributor' | 'wholesale';

export interface OrderUser {
  id: number;
  name: string | null;
  email: string;
  phone: string;
  account_type?: string;
  is_distributor: boolean;
}

// Image Interface
export interface OrderImage {
  id: number;
  image_url: string;
  is_primary: boolean;
}

// Order Item Timeline
export interface OrderItemTimeline {
  shipped_at: string | null;
  delivered_at: string | null;
  return_requested_at: string | null;
  return_approved_at: string | null;
  return_rejected_at: string | null;
  return_completed_at: string | null;
}

// Order Item
export interface OrderItem {
  line_id: number;
  product_id: number;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: number;
  gst_rate: number;
  gst_amount: number;
  line_total: number;
  commissionable_volume: number;
  delivery_status: DeliveryStatus;
  return_status: ReturnStatus;
  returned_quantity: number;
  available_for_return: number;
  is_returnable: boolean;
  timeline?: OrderItemTimeline;
  images: OrderImage[];
  primary_image: string | null;
  is_reviewed?: boolean;
}

// Order Payment
export interface OrderPayment {
  payment_gateway: string;
  gateway_transaction_id: string | null;
  amount_paid: number;
  payment_status: PaymentStatus;
}

// Tax Breakdown Item
export interface TaxBreakdownItem {
  product_id: number;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: string;
  line_total_before_tax: number;
  tax_category: string;
  tax_rate: string;
  tax_amount: number;
  line_total_after_tax: number;
}

// Tax By Category
export interface TaxByCategory {
  tax_rate: string;
  total_taxable_amount: number;
  total_tax_amount: number;
  items: string[];
}

// Order Summary
export interface OrderSummary {
  subtotal: number;
  total_gst: number;
  shipping_charge: number;
  coupon_code: string | null;
  coupon_discount: number;
  coin_redeemed: number;
  coin_redeemed_amount: number;
  total_payable: number;
}

// Order Tax Breakdown
export interface OrderTaxBreakdown {
  items: TaxBreakdownItem[];
  summary: {
    subtotal: number;
    total_tax: number;
    shipping_charge: number;
    coupon_discount: number;
    coin_redeemed: number;
    coin_redeemed_amount: number;
    net_subtotal: number;
    grand_total: number;
  };
  tax_by_category: Record<string, TaxByCategory>;
}

// Shipping Method
export interface ShippingMethod {
  id: number;
  name: string;
  code: string;
  description: string;
  estimated_days: number;
}

// Address
export interface OrderAddress {
  id: number;
  full_name: string | null;
  phone: string | null;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  postal_code: string | null;
  country: string;
  full_address: string;
}

// Order Return
export interface OrderReturn {
  id: number;
  order_id: number;
  line_id: number;
  quantity: number;
  reason: string;
  status: ReturnStatus;
  created_at: string;
  updated_at: string;
}

// Order (List/Dashboard)
export interface OrderList {
  order_id: number;
  order_reference: string;
  order_status: OrderStatus;
  order_type: OrderType;
  order_date: string;
  confirmed_date: string | null;
  line_id: number;
  product_id: number;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: number;
  gst_rate: number;
  gst_amount: number;
  line_total: number;
  commissionable_volume: number;
  delivery_status: DeliveryStatus;
  return_status: ReturnStatus;
  returned_quantity: number;
  available_for_return: number;
  is_returnable: number;
  is_reviewed: boolean;
  images: OrderImage[];
  primary_image: string | null;
  payment_gateway: string;
  gateway_transaction_id: string | null;
  amount_paid: number;
  payment_status: PaymentStatus;
  subtotal: number;
  total_gst: number;
  shipping_charge: number;
  coin_redeemed: number;
  coin_redeemed_amount: number;
  total_payable: number;
  user: OrderUser;
}

// Order Details Response
export interface OrderDetailsResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    order_reference: string;
    order_status: OrderStatus;
    order_type: OrderType;
    order_date: string;
    confirmed_date: string | null;
    user: OrderUser;
    items: OrderItem[];
    payment: OrderPayment;
    summary: OrderSummary;
    tax_breakdown: OrderTaxBreakdown;
    shipping_method: ShippingMethod;
    billing_address: OrderAddress;
    delivery_address: OrderAddress;
    invoice: string | null;
    returns: OrderReturn[];
  };
}

// Orders List Response
export interface OrdersListResponse {
  success: boolean;
  data: OrderList[];
}

// Order Statuses Response
export interface OrderStatusesResponse {
  success: boolean;
  data: OrderStatus[];
}

export const orderApi = {

  getOrders: () =>
    apiClient.get<OrdersListResponse>('/admin/all-orders'),


  getOrderDetails: (orderId: number) =>
    apiClient.get<OrderDetailsResponse>(`/admin/get-order-details/${orderId}`),

  getOrderStatuses: () =>
    apiClient.get<OrderStatusesResponse>('/admin/orders/statuses'),
};

export default orderApi;