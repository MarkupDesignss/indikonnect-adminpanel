import apiClient from "../client";

export interface InvoiceLineItem {
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: string;
  taxable_value: number;
  gst_rate: string;
  cgst: number;
  sgst: number;
  igst: number;
  gst_amount: string;
  line_total: string;
}

export interface InvoiceSummaryItem {
  product_id: number;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: string;
  taxable_value: number;
  gst_rate: string;
  cgst: number;
  sgst: number;
  igst: number;
  total_tax: string;
  line_total: string;
}

export interface InvoiceSummarySnapshot {
  subtotal: number;
  total_tax: number;
  grand_total: number;
  items: InvoiceSummaryItem[];
  tax_breakdown: unknown[];
}

export interface SellerDetails {
  name: string;
  gstin: string;
  address: string;
}

export interface BuyerDetails {
  name: string;
  gstin: string;
  address: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  issued_at: string;
  subtotal_before_redemption: string;
  coin_redeemed: string;
  total_taxable: string;
  total_tax: string;
  coupon_code: string | null;
  coupon_discount: string;
  shipping_charge: string;
  subtotal_after_discount: string;
  total: string;
  total_payable: string;

  // API is returning these as JSON strings
  line_items: string;
  summary_snapshot: string;

  seller_details: SellerDetails;
  buyer_details: BuyerDetails;
  delivery_state: string;
}

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

export interface Order {
  id: number;
  order_reference: string;
  order_type: string;
  subtotal: string;
  total_gst: string;
  shipping_charge: string;
  coin_redeemed: string;
  coin_redeemed_amount: string;
  total_payable: string;
  amount_paid: string;
  total_cgst: string;
  total_sgst: string;
  total_igst: string;
  status: string;
  payment_gateway: string;
  gateway_transaction_id: string | null;
  confirmed_at: string | null;
  courier_company: string | null;
  courier_tracking_number: string | null;
  courier_status: string | null;
  courier_delivery_date: string | null;
  delivery_notes: string | null;

  // API is returning these as JSON strings
  tax_breakdown: string;
  summary_data: string;

  created_at: string;
  updated_at: string;
}

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

export interface OrderInvoiceData {
  invoice: Invoice;
  order: Order;
  order_lines: OrderLine[];
}

export interface OrderInvoiceResponse {
  success: boolean;
  message?: string;
  data: OrderInvoiceData;
}


const orderInvoiceApi = {

  getByOrderId: (orderId: number) =>
    apiClient.get<OrderInvoiceResponse>(
      `/invoice/order/${orderId}`
    ),
};

export default orderInvoiceApi;