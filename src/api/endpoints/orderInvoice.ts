// src/api/endpoints/orderInvoice.ts
import apiClient from "../client";

// =====================================================
// ADDRESS
// =====================================================

export interface InvoiceAddress {
  id: number;
  recipient_name: string | null;
  contact_number: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  post_office: string | null;
  type: string | null;
  state: string | null;
  pincode: string | null;
  country: string | null;
  // Sometimes present from order-details API
  full_name?: string | null;
  phone?: string | null;
  postal_code?: string | null;
  full_address?: string | null;
}

// =====================================================
// SELLER / BUYER
// =====================================================

export interface InvoiceSeller {
  name: string;
  gstin: string;
  address: string;
  gst_number?: string;
  fssai_license_number?: string | null;
  cin?: string | null;
  pan?: string | null;
  signature_data_url?: string | null;
}

export interface InvoiceBuyer {
  name: string;
  gstin: string;
  billing_address: InvoiceAddress | null;
  delivery_address: InvoiceAddress | null;
  // legacy shape (kept optional for safety)
  address?: string | null;
  phone?: string | null;
}

// =====================================================
// ORDER ITEM — single_item OBJECT or full_order ARRAY
// =====================================================

export interface InvoiceOrderItem {
  order_line_id: number;
  product_id: number;
  variant_id: number | null;
  product_name: string;
  product_code: string;
  hsn_code: string | null;
  uom: string | null;
  quantity: number;
  gst_rate_percent: number;
  tax_category_name: string | null;

  // Product amounts
  price_incl_gst: number;
  price_excl_gst: number;
  gst_amount_per_unit: number;
  line_price_incl_gst: number;
  line_price_excl_gst: number;
  line_gst_amount: number;

  // Shipping amounts
  shipping_per_unit_incl_gst: number;
  shipping_per_unit_excl_gst: number;
  shipping_incl_gst: number;
  shipping_excl_gst: number;
  shipping_gst_amount: number;

  // Line totals
  line_total_incl_gst: number;
  line_total_excl_gst: number;
  line_total_gst_amount: number;

  // Tax split
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;

  // Optional extras (order-details items)
  unit_price?: number;
  gst_rate?: number;
  gst_amount?: number;
  line_total?: number;
  delivery_status?: string;
  primary_image?: string;
}

// =====================================================
// INVOICE
// =====================================================

export interface Invoice {
  id: number;
  invoice_number: string;
  order_id: number;
  issued_at: string;
  created_at: string;
  updated_at: string;

  seller: InvoiceSeller;
  buyer: InvoiceBuyer;

  delivery_state: string | null;
  subtotal_before_redemption: string;
  coin_redeemed: string;
  coupon_code: string | null;
  coupon_discount: string;
  shipping_charge: string;
  subtotal_after_discount: string;
  total_taxable: string;
  total_cgst: string;
  total_sgst: string;
  total_igst: string;
  total_tax: string;
  total: string;
  total_payable: string;
  pdf_path: string | null;

  // Legacy optional fields, in case older API shape appears
  seller_details?: InvoiceSeller;
  buyer_details?: InvoiceBuyer;
  line_items?: string;
  summary_snapshot?: string;
  number?: string;
  place_of_supply?: string;
  reverse_charge?: string | boolean | null;
  is_reverse_charge?: string | boolean | null;
  signature_data_url?: string | null;
}

// =====================================================
// ORDER
// =====================================================

export interface InvoiceOrderUser {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
}

export interface InvoiceOrderSummaryData {
  subtotal: number;
  total_tax: number;
  coupon_discount: number;
  shipping_charge: number;
  net_subtotal: number;
  tax_breakdown?: Array<{
    product_name: string;
    tax_category: string;
    rate: string;
  }>;
}

export interface InvoiceOrderGstBreakdown {
  sgst_label: string;
  price_incl_gst: number;
  price_excl_gst: number;
  product_gst_amount: number;
  shipping_incl_gst: number;
  shipping_excl_gst: number;
  shipping_gst_amount: number;
  total_incl_gst: number;
  total_excl_gst: number;
  total_gst_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
}

export interface InvoiceOrder {
  id: number;
  order_reference: string;
  user_id: number;
  order_type: string;
  status: string;
  delivery_status: string;
  return_status: string;
  refund_status: string | null;

  subtotal: string;
  total_gst: string;
  total_cgst: string;
  total_sgst: string;
  total_igst: string;
  shipping_charge: string;
  shipping_method_id: number | null;
  coin_redeemed: string;
  coin_redeemed_amount: string;
  coupon_discount: string;
  coupon_code: string | null;
  total_payable: string;
  amount_paid: string;
  commissionable_volume: string | null;

  payment_gateway: string;
  gateway_transaction_id: string | null;
  checkout_type: string;

  courier_company: string | null;
  courier_tracking_number: string | null;
  courier_status: string | null;
  courier_delivery_date: string | null;
  delivery_notes: string | null;

  confirmed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;

  summary_data: InvoiceOrderSummaryData;

  user: InvoiceOrderUser;

  /**
   * For `invoice_type: "single_item"` the API returns a single OBJECT.
   * For `invoice_type: "full_order"` it returns an ARRAY.
   */
  order_items: InvoiceOrderItem | InvoiceOrderItem[];

  items_count: number;
  total_items: number;
  gst_breakdown: InvoiceOrderGstBreakdown;

  // Occasionally present from order-details API
  order_date?: string;
  confirmed_date?: string;
}

// =====================================================
// LEGACY ORDER-LINE SHAPE (kept for OrderDetails flows)
// =====================================================

export interface OrderLine {
  id: number;
  product_id: number;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: string;
  gst_rate: string;
  cgst_rate: string;
  sgst_rate: string;
  igst_rate: string;
  cgst_amount: string;
  sgst_amount: string;
  igst_amount: string;
  gst_amount: string;
  line_total: string;
  commissionable_volume: string;
  tax_data: unknown;
  product_image: string;
  product_images: string[];
}

// =====================================================
// TAX BREAKDOWN TYPES (kept — used elsewhere)
// =====================================================

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

export interface TaxByCategory {
  [category: string]: {
    tax_rate: string;
    total_taxable_amount: number;
    total_tax_amount: number;
    items: string[];
  };
}

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
  tax_by_category: TaxByCategory;
}

export interface OrderSummaryData {
  subtotal: number;
  total_tax: number;
  coupon_code: string | null;
  coupon_discount: number;
  shipping_charge: number;
  shipping_method_id: number;
  coin_redeemed: number;
  amount_redeemed: number;
  net_subtotal: number;
}

// =====================================================
// RESPONSE WRAPPER
// =====================================================

export type InvoiceType = "single_item" | "full_order";

export interface OrderInvoiceData {
  invoice: Invoice;
  order: InvoiceOrder;
  /**
   * legacy field — some endpoints return `order_lines` separately.
   * For /invoice/order/{id}/{itemId} it is usually absent.
   */
  order_lines?: OrderLine[];
}

export interface OrderInvoiceResponse {
  success: boolean;
  message?: string;
  data: OrderInvoiceData;
  invoice_type?: InvoiceType;
}

// =====================================================
// API CLIENT
// =====================================================

const orderInvoiceApi = {
  /**
   * Fetch invoice for a specific order line item.
   * Always hits /invoice/order/{orderId}/{itemId}
   *
   * @param orderId  Order ID (e.g. 1)
   * @param itemId   Order line ID (e.g. 1)
   */
  getByOrderId: (orderId: number, itemId: number) =>
    apiClient.get<OrderInvoiceResponse>(
      `/invoice/order/${orderId}/${itemId}`,
    ),
};

export default orderInvoiceApi;