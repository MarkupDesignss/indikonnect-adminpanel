"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Download,
  FileText,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  Loader2,
  ShieldAlert,
  Receipt,
  Wallet,
  Package,
  CreditCard,
  Truck,
} from "lucide-react";
import { toast } from "react-hot-toast";
import ExcelJS from "exceljs";
import financeReportApi, {
  FinanceReportItem,
} from "../../api/endpoints/report/financeReport";
import { usePermissions } from "../../pages/permissions/usePermissions";
import logoApi from "../../api/endpoints/logoApi";
import PermissionLoadingState from "@/components/common/PermissionLoadingState";
/* ================= THEME ================= */
const THEME = {
  primary: "#2D6FE8",
  primaryDark: "#1E40AF",
  primarySoft: "#EAF3FF",
  background: "#F4F8FD",
  border: "#DCE6F2",
  green: "#15803D",
  greenSoft: "#DCFCE7",
  orange: "#C2410C",
  orangeSoft: "#FFEDD5",
  purple: "#6D28D9",
  purpleSoft: "#EDE9FE",
  red: "#C23B32",
  redSoft: "#FEE2E2",
};
const DEFAULT_LOGO_URL =
  "https://www.markupdesigns.net/indikonnect/storage/logos/MmVFOudCiVU3Y8C0sf2gEEXna5jSKroCDj8xYMo0.png";
const PER_PAGE = 100;
/* ================= API ITEM TYPES ================= */
type LineCourier = {
  courier_company?: string | null;
  courier_tracking_number?: string | null;
};
type FinanceReportLineItem = FinanceReportItem & {
  mrp?: number | string | null;
  line_list_price?: number | string | null;
  list_price?: number | string | null;
  article_status?: string | null;
  line_discount_amount?: number | string | null;
  line_cv?: number | string | null;
  cv?: number | string | null;
  line_tax_breakdown?: {
    cgst?: number | string | null;
    sgst?: number | string | null;
    igst?: number | string | null;
  } | null;
  order_reference?: string | null;
  billing_state?: string | null;
  delivery_state?: string | null;
  customer_gstin?: string | null;
  product_name?: string | null;
  product_code?: string | null;
  product_slug?: string | null;
  hsn_code?: string | null;
  item_reference_id?: string | null;
  order_line_id?: string | number | null;
  quantity?: number | string | null;
  unit_price_without_gst?: number | string | null;
  line_total_without_gst?: number | string | null;
  line_tax_rate?: number | string | null;
  shipping_tax_rate?: number | string | null;
  line_shipping_tax_rate?: number | string | null;
  shipping_gst_rate?: number | string | null;
  tax_type?: string | null;
  gst_type?: string | null;
  supplier_state?: string | null;
  seller_state?: string | null;
  place_of_supply?: string | null;
  line_gst_amount?: number | string | null;
  line_shipping_charge_without_gst?: number | string | null;
  line_shipping_gst?: number | string | null;
  line_couriers?: LineCourier[] | null;
  confirmed_at?: string | null;
  dispatched_at?: string | null;
  delivered_at?: string | null;
  courier_company?: string | null;
  courier_tracking_number?: string | null;
  is_refunded?: string | boolean | number | null;
  refunded_items?: number | string | null;
  product_subtotal?: number | string | null;
  shipping_charge_without_gst?: number | string | null;
  subtotal?: number | string | null;
  product_total_shipping_charge_without_gst?: number | string | null;
  service_charge_per_unit?: number | string | null;
  total_service_charge?: number | string | null;
  total_item_amount?: number | string | null;
  total_items?: number | string | null;
  product_gst?: number | string | null;
  shipping_gst?: number | string | null;
  total_gst?: number | string | null;
  discount_amount?: number | string | null;
  order_amount?: number | string | null;
  net_order_amount?: number | string | null;
  products?: Array<{
    name?: string | null;
    product_code?: string | null;
    hsn_code?: string | null;
    quantity?: number | string | null;
  }>;
  tax_breakdown?: {
    cgst?: number | string | null;
    sgst?: number | string | null;
    igst?: number | string | null;
  } | null;
};
const asLineItem = (item: FinanceReportItem): FinanceReportLineItem =>
  item as FinanceReportLineItem;
/* ================= HELPERS ================= */
const money = (value: number | string | null | undefined) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
const numberValue = (value: number | string | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};
const valueOrDash = (value: unknown) =>
  value === null || value === undefined || value === "" ? "—" : String(value);
const trimmedValue = (value: unknown) =>
  typeof value === "string"
    ? value.trim()
    : value == null
      ? ""
      : String(value).trim();
const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";
  // API date formats: DD-MM-YYYY and DD-MM-YYYY HH:mm.
  const match = value.match(/^(\d{2})-(\d{2})-(\d{4})(.*)$/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}${match[4] || ""}`;
  const parsed = new Date(value.replace(" ", "T"));
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};
const formatDateInput = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const getProductName = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  if (row.product_name?.trim()) return row.product_name.trim();
  if (Array.isArray(row.products) && row.products.length > 0) {
    return row.products
      .map(
        (product) =>
          product.name?.trim() || product.product_code?.trim() || "Product",
      )
      .join(" | ");
  }
  return item.product_names || "";
};
const getProductCode = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  if (row.product_code?.trim()) return row.product_code.trim();
  if (Array.isArray(row.products) && row.products.length > 0) {
    return row.products
      .map((product) => product.product_code?.trim() || "")
      .filter(Boolean)
      .join(" | ");
  }
  return "";
};
// HSN is a numeric classification code, not the SKU.
const isValidHsn = (value: string) => /^\d{4}(?:\d{2}){0,2}$/.test(value);
const getHsnCode = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  const directHsn = trimmedValue(row.hsn_code);
  if (directHsn && isValidHsn(directHsn)) return directHsn;
  if (Array.isArray(row.products) && row.products.length > 0) {
    const validHsnCodes = row.products
      .map((product) => trimmedValue(product.hsn_code))
      .filter((hsn) => Boolean(hsn) && isValidHsn(hsn));
    return validHsnCodes.join(" | ");
  }
  return "";
};
const getQuantity = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  if (
    row.quantity !== null &&
    row.quantity !== undefined &&
    row.quantity !== ""
  ) {
    return numberValue(row.quantity);
  }
  if (Array.isArray(row.products) && row.products.length > 0) {
    return row.products.reduce(
      (sum, product) => sum + numberValue(product.quantity),
      0,
    );
  }
  return 0;
};
const getCouriers = (item: FinanceReportItem): LineCourier[] => {
  const row = asLineItem(item);
  if (Array.isArray(row.line_couriers) && row.line_couriers.length > 0) {
    return row.line_couriers;
  }
  if (row.courier_company || row.courier_tracking_number) {
    return [
      {
        courier_company: row.courier_company,
        courier_tracking_number: row.courier_tracking_number,
      },
    ];
  }
  return [];
};
const getPlaceOfSupply = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  return trimmedValue(row.delivery_state) || trimmedValue(row.billing_state);
};
const getGstinNumber = (item: FinanceReportItem) => {
  const gstin = trimmedValue(asLineItem(item).customer_gstin);
  return gstin || "—";
};
const getGstPercentage = (item: FinanceReportItem) => {
  const rate = asLineItem(item).line_tax_rate;
  if (rate === null || rate === undefined || rate === "") return "";
  return `${numberValue(rate)}%`;
};
/* All calculated financial fields use primitive inputs, not API totals.
 * Assumptions for the current API contract:
 * - unit_price_without_gst is the net taxable unit price (discount already reflected).
 * - line_shipping_charge_without_gst is the shipping base for the entire line.
 * - shipping uses the product GST rate unless a separate shipping rate is supplied.
 * - service charge per unit is added as supplied; no separate service GST is assumed.
 */
const hasMissingCalculationInputs = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  return [
    row.quantity,
    row.unit_price_without_gst,
    row.line_tax_rate,
    row.line_shipping_charge_without_gst ?? row.shipping_charge_without_gst,
  ].some((value) => optionalNumber(value) === null);
};
const getLineSubtotal = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  return roundMoney(
    numberValue(row.unit_price_without_gst) * getQuantity(item),
  );
};
const getLineGst = (item: FinanceReportItem) =>
  roundMoney(
    (getLineSubtotal(item) * numberValue(asLineItem(item).line_tax_rate)) / 100,
  );
const getLineShipping = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  return roundMoney(
    numberValue(
      row.line_shipping_charge_without_gst ?? row.shipping_charge_without_gst,
    ),
  );
};
const getShippingTaxRate = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  return numberValue(
    row.line_shipping_tax_rate ??
      row.shipping_tax_rate ??
      row.shipping_gst_rate ??
      row.line_tax_rate,
  );
};
const getLineShippingGst = (item: FinanceReportItem) =>
  roundMoney((getLineShipping(item) * getShippingTaxRate(item)) / 100);
const getLineServiceCharge = (item: FinanceReportItem) =>
  roundMoney(
    numberValue(asLineItem(item).service_charge_per_unit) * getQuantity(item),
  );
const getLineCombinedSubtotal = (item: FinanceReportItem) =>
  roundMoney(getLineSubtotal(item) + getLineShipping(item));
const getLineGross = (item: FinanceReportItem) =>
  roundMoney(
    getLineCombinedSubtotal(item) +
      getSalesLineTax(item).total +
      getLineServiceCharge(item),
  );
const getInvoiceKey = (item: FinanceReportItem, index: number) => {
  const row = asLineItem(item);
  return String(
    row.order_reference || item.invoice_number || `missing-invoice-${index}`,
  );
};

const statusStyle = (status: string | null | undefined) => {
  const value = (status || "").toLowerCase();
  if (value.startsWith("partial")) {
    return { bg: THEME.orangeSoft, color: THEME.orange };
  }
  if (value === "delivered" || value === "completed" || value === "paid") {
    return { bg: THEME.greenSoft, color: THEME.green };
  }
  if (value.includes("ship") || value.includes("partial")) {
    return { bg: THEME.purpleSoft, color: THEME.purple };
  }
  if (value.includes("refund") || value.includes("cancel")) {
    return { bg: THEME.redSoft, color: THEME.red };
  }
  if (value.includes("dispatch") || value.includes("confirm")) {
    return { bg: THEME.primarySoft, color: THEME.primaryDark };
  }
  return { bg: THEME.orangeSoft, color: THEME.orange };
};
/* ================= SALES DATA EXCEL MAPPING ================= */
const SALES_HEADERS = [
  "Order Reference",
  "Item Reference ID",
  "Invoice Number",
  "Invoice Date",
  "Order Date",
  "Product Name",
  "Product Head",
  "SKU",
  "Quantity",
  "Price",
  "Total Discount",
  "CV",
  "Total Tax",
  "CGST",
  "SGST",
  "IGST",
  "Tax Percentage",
  "HSN Code",
  "Customer Name",
  "Customer GSTIN",
  "Customer State",
  "Shipping Charges",
  "Unit Price Without GST",
  "Product Subtotal Without GST",
  "Product GST",
  "Shipping Charges Without GST",
  "Sub Total",
  "Shipping GST",
  "Service Charge Per Unit",
  "Total Service Charge",
  "Total",
  "Order Status",
  "Confirmed At",
  "Dispatched At",
  "Delivered At",
  "Account Type",
  "User Name",
  "Customer Mobile",
  "Customer Email",
  "Billing State",
  "Payment Gateway",
  "Gateway Transaction ID",
  "Courier Company",
  "Courier Tracking Number",
];
const SALES_WIDTHS = [
  24.0, // Order Reference
  24.0, // Item Reference ID
  16.85546875, // Invoice Number
  15.85546875, // Invoice Date
  10.7109375, // Order Date
  34.5703125, // Product Name
  34.5703125, // Product Head
  8.0, // SKU
  8.7109375, // Quantity
  7.0, // Price
  13.7109375, // Total Discount
  5.0, // CV
  9.0, // Total Tax
  8.0, // CGST
  8.0, // SGST
  9.0, // IGST
  14.5703125, // Tax Percentage
  9.7109375, // HSN Code
  33.42578125, // Customer Name
  15.42578125, // Customer GSTIN
  24.5703125, // Customer State
  16.28515625, // Shipping Charges
  25.0, // Unit Price Without GST
  30.0, // Product Subtotal Without GST
  16.0, // Product GST
  30.0, // Shipping Charges Without GST
  10.0, // Sub Total
  16.0, // Shipping GST
  24.0, // Service Charge Per Unit
  22.0, // Total Service Charge
  9.0, // Total
  23.0, // Order Status
  23.0, // Confirmed At
  23.0, // Dispatched At
  23.0, // Delivered At
  18.0, // Account Type
  24.0, // User Name
  22.0, // Customer Mobile
  34.0, // Customer Email
  24.0, // Billing State
  22.0, // Payment Gateway
  30.0, // Gateway Transaction ID
  32.0, // Courier Company
  32.0, // Courier Tracking Number
];
// Additive columns only; do not sum rates, per-unit prices or repeated order fields.
const SALES_TOTAL_HEADERS = [
  "Price",
  "Total Tax",
  "CGST",
  "SGST",
  "IGST",
  "Sub Total",
  "Total",
  "Product Subtotal Without GST",
  "Product GST",
  "Shipping Charges Without GST",
  "Shipping GST",
  "Total Service Charge",
  "Shipping Charges",
  "Total Discount",
  "CV",
  "Quantity",
];
const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;
const optionalNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseExcelDate = (
  value: unknown,
  dateOnly = false,
): Date | string | null => {
  const raw = trimmedValue(value);
  if (!raw) return null;
  const match = raw.match(
    /^(\d{2})-(\d{2})-(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (match)
    return new Date(
      Date.UTC(
        Number(match[3]),
        Number(match[2]) - 1,
        Number(match[1]),
        dateOnly ? 0 : Number(match[4] || 0),
        dateOnly ? 0 : Number(match[5] || 0),
        dateOnly ? 0 : Number(match[6] || 0),
      ),
    );
  const iso = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (iso)
    return new Date(
      Date.UTC(
        Number(iso[1]),
        Number(iso[2]) - 1,
        Number(iso[3]),
        dateOnly ? 0 : Number(iso[4] || 0),
        dateOnly ? 0 : Number(iso[5] || 0),
        dateOnly ? 0 : Number(iso[6] || 0),
      ),
    );
  return raw;
};
// Determine the tax regime without using backend tax amounts in arithmetic.
const getTaxRegime = (item: FinanceReportItem): "intra" | "inter" | null => {
  const row = asLineItem(item);
  const type = trimmedValue(row.tax_type ?? row.gst_type)
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  if (["igst", "inter", "interstate"].includes(type)) return "inter";
  if (["cgstsgst", "sgstcgst", "intra", "intrastate"].includes(type))
    return "intra";
  const supplier = trimmedValue(
    row.supplier_state ?? row.seller_state,
  ).toLowerCase();
  const supply = trimmedValue(
    row.place_of_supply ?? row.delivery_state ?? row.billing_state,
  ).toLowerCase();
  if (supplier && supply) return supplier === supply ? "intra" : "inter";
  // Legacy response has no tax type. Use only the nonzero pattern as a regime hint.
  const hint = row.line_tax_breakdown ?? row.tax_breakdown;
  const central = numberValue(hint?.cgst) > 0;
  const state = numberValue(hint?.sgst) > 0;
  const integrated = numberValue(hint?.igst) > 0;
  if (integrated && !central && !state) return "inter";
  if (!integrated && central && state) return "intra";
  return null;
};
const getSalesLineTax = (item: FinanceReportItem) => {
  const total = roundMoney(getLineGst(item) + getLineShippingGst(item));
  if (total === 0) return { total, cgst: 0, sgst: 0, igst: 0 };
  const regime = getTaxRegime(item);
  if (regime === "inter") return { total, cgst: 0, sgst: 0, igst: total };
  if (regime === "intra") {
    const paise = Math.round(total * 100);
    const central = Math.ceil(paise / 2);
    return {
      total,
      cgst: central / 100,
      sgst: (paise - central) / 100,
      igst: 0,
    };
  }
  // Missing or ambiguous regime: do not invent a tax classification.
  return { total, cgst: null, sgst: null, igst: null };
};
// Use the product category from the API; never infer it from the product name.
const getProductCategory = (item: FinanceReportItem): string => {
  const row = item as unknown as Record<string, unknown>;
  const categoryText = (value: unknown): string => {
    if (typeof value === "string") return value.trim();
    if (value && typeof value === "object") {
      const category = value as Record<string, unknown>;
      return (
        [category.name, category.category_name, category.title]
          .find(
            (name): name is string =>
              typeof name === "string" && name.trim().length > 0,
          )
          ?.trim() || ""
      );
    }
    return "";
  };
  const product =
    row.product && typeof row.product === "object"
      ? (row.product as Record<string, unknown>)
      : {};
  return (
    [
      row.product_category_name,
      row.product_head,
      row.product_head_name,
      row.category_name,
      row.product_category,
      row.category,
      product.category_name,
      product.product_head,
      product.category,
    ]
      .map(categoryText)
      .find(Boolean) || ""
  );
};
const buildSalesRows = (items: FinanceReportItem[]) => {
  const seenOrders = new Set<string>();
  const ordersWithLineCv = new Set(
    items.flatMap((item, index) =>
      optionalNumber(asLineItem(item).line_cv) === null
        ? []
        : [getInvoiceKey(item, index)],
    ),
  );
  const ordersWithLineDiscount = new Set(
    items.flatMap((item, index) =>
      optionalNumber(asLineItem(item).line_discount_amount) === null
        ? []
        : [getInvoiceKey(item, index)],
    ),
  );
  return items.map((item, index) => {
    const row = asLineItem(item);
    const orderKey = getInvoiceKey(item, index);
    const firstOrderRow = !seenOrders.has(orderKey);
    seenOrders.add(orderKey);
    const tax = getSalesLineTax(item);
    const subtotal = getLineCombinedSubtotal(item);
    const total = getLineGross(item);
    const couriers = getCouriers(item);
    const shipping = roundMoney(
      getLineShipping(item) + getLineShippingGst(item),
    );
    const discount =
      optionalNumber(row.line_discount_amount) ??
      (firstOrderRow && !ordersWithLineDiscount.has(orderKey)
        ? optionalNumber(row.discount_amount)
        : optionalNumber(row.discount_amount) === 0
          ? 0
          : null);
    return [
      row.order_reference || "", // Order Reference
      row.item_reference_id || "", // Item Reference ID
      item.invoice_number || "", // Invoice Number
      parseExcelDate(item.invoice_date, true), // Invoice Date
      parseExcelDate(item.order_date), // Order Date
      getProductName(item), // Product Name
      getProductCategory(item), // Product Head
      getProductCode(item), // SKU
      getQuantity(item), // Quantity
      total, // Price
      discount, // Total Discount
      optionalNumber(row.line_cv) ??
        (firstOrderRow && !ordersWithLineCv.has(orderKey)
          ? optionalNumber(row.cv)
          : null), // CV
      tax.total, // Total Tax
      tax.cgst, // CGST
      tax.sgst, // SGST
      tax.igst, // IGST
      optionalNumber(row.line_tax_rate), // Tax Percentage
      getHsnCode(item), // HSN Code
      item.customer_name || "", // Customer Name
      row.customer_gstin || "", // Customer GSTIN
      getPlaceOfSupply(item), // Customer State
      shipping, // Shipping Charges
      optionalNumber(row.unit_price_without_gst), // Unit Price Without GST
      getLineSubtotal(item), // Product Subtotal Without GST
      getLineGst(item), // Product GST
      getLineShipping(item), // Shipping Charges Without GST
      subtotal, // Sub Total
      getLineShippingGst(item), // Shipping GST
      optionalNumber(row.service_charge_per_unit), // Service Charge Per Unit
      getLineServiceCharge(item), // Total Service Charge
      total, // Total
      item.order_status || "", // Order Status
      parseExcelDate(row.confirmed_at), // Confirmed At
      parseExcelDate(row.dispatched_at), // Dispatched At
      parseExcelDate(row.delivered_at), // Delivered At
      item.account_type || "", // Account Type
      item.user_name || "", // User Name
      trimmedValue(item.customer_mobile), // Customer Mobile
      item.customer_email || "", // Customer Email
      row.billing_state || "", // Billing State
      item.payment_gateway || "", // Payment Gateway
      item.gateway_transaction_id || "", // Gateway Transaction ID
      couriers.map((courier) => courier.courier_company || "").join(" | "), // Courier Company
      couriers
        .map((courier) => courier.courier_tracking_number || "")
        .join(" | "), // Courier Tracking Number
    ];
  });
};

/* ================= URP / B2C INVOICE REPORT ================= */
const URP_HEADERS = [
  "Invoice Number",
  "Invoice date",
  "Customer Name",
  "Place Of Supply (POS)",
  "Rate",
  "Taxable Value",
  "CGST",
  "SGST",
  "IGST",
  "Invoice Value",
];
const isUrp = (item: FinanceReportItem) =>
  trimmedValue(asLineItem(item).customer_gstin).toUpperCase() === "URP";

const GST_STATES: Record<string, string> = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "26": "Dadra and Nagar Haveli and Daman and Diu",
  "27": "Maharashtra",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
  "97": "Other Territory",
};
const stateKey = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
const formatPos = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  const raw = trimmedValue(row.place_of_supply) || getPlaceOfSupply(item);
  const code = raw.match(/^(\d{2})(?:\s*[-–:]\s*.*)?$/)?.[1];
  if (code && GST_STATES[code]) return `${code}-${GST_STATES[code]}`;
  const aliases: Record<string, string> = {
    newdelhi: "07",
    orissa: "21",
    pondicherry: "34",
    uttaranchal: "05",
    damananddiu: "26",
    dadraandnagarhaveli: "26",
  };
  const key = stateKey(raw);
  const matched =
    aliases[key] ||
    Object.keys(GST_STATES).find((k) => stateKey(GST_STATES[k]) === key);
  return matched ? `${matched}-${GST_STATES[matched]}` : raw;
};
type UrpRow = [
  string,
  Date | string | null,
  string,
  string,
  number,
  number,
  number | null,
  number | null,
  number | null,
  number,
];
const buildUrpRows = (items: FinanceReportItem[]): UrpRow[] => {
  const groups = new Map<string, UrpRow>();
  items.forEach((item, index) => {
    if (!isUrp(item)) return;
    const row = asLineItem(item);
    const invoice = trimmedValue(item.invoice_number);
    const date = parseExcelDate(item.invoice_date, true);
    const customer = trimmedValue(item.customer_name);
    const pos = formatPos(item);
    const rate = numberValue(row.line_tax_rate);
    const shippingRate = getShippingTaxRate(item);
    const product = getLineSubtotal(item);
    const shipping = getLineShipping(item);
    const service = getLineServiceCharge(item);
    const tax = getSalesLineTax(item);
    const add = (
      r: number,
      base: number,
      cgst: number | null,
      sgst: number | null,
      igst: number | null,
      value: number,
    ) => {
      const key = JSON.stringify([
        invoice || `missing-${index}`,
        date,
        customer,
        pos,
        r,
      ]);
      const previous = groups.get(key);
      const next: UrpRow = [
        invoice,
        date,
        customer,
        pos,
        r,
        base,
        cgst,
        sgst,
        igst,
        value,
      ];
      if (previous) {
        previous[5] = roundMoney(previous[5] + base);
        ([6, 7, 8] as const).forEach((i) => {
          const a = previous[i],
            b = next[i];
          previous[i] = a === null || b === null ? null : roundMoney(a + b);
        });
        previous[9] = roundMoney(previous[9] + value);
      } else groups.set(key, next);
    };
    if (shipping === 0 || shippingRate === rate) {
      add(
        rate,
        getLineCombinedSubtotal(item),
        tax.cgst,
        tax.sgst,
        tax.igst,
        getLineGross(item),
      );
    } else {
      // A separate shipping rate must occupy its own rate row. Preserve line rounding.
      const productTax = getLineGst(item);
      const regime = getTaxRegime(item);
      const central =
        regime === "intra"
          ? Math.ceil(Math.round(productTax * 100) / 2) / 100
          : regime === "inter" || productTax === 0
            ? 0
            : null;
      const state =
        regime === "intra" && central !== null
          ? roundMoney(productTax - central)
          : central === null
            ? null
            : 0;
      const integrated =
        regime === "inter" ? productTax : central === null ? null : 0;
      const rest = (total: number | null, part: number | null) =>
        total === null || part === null ? null : roundMoney(total - part);
      add(
        rate,
        product,
        central,
        state,
        integrated,
        roundMoney(product + productTax + service),
      );
      add(
        shippingRate,
        shipping,
        rest(tax.cgst, central),
        rest(tax.sgst, state),
        rest(tax.igst, integrated),
        roundMoney(shipping + getLineShippingGst(item)),
      );
    }
  });
  return Array.from(groups.values());
};
const urpCellText = (value: UrpRow[number], col: number) => {
  if (value == null || value === "") return "—";
  if (value instanceof Date)
    return value
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
      })
      .replace(/ /g, "-");
  if (typeof value === "number")
    return value.toLocaleString(
      "en-IN",
      col === 4
        ? { maximumFractionDigits: 2 }
        : { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    );
  return value;
};
const salesCsvCell = (value: unknown): string => {
  let text =
    value == null
      ? ""
      : value instanceof Date
        ? Number.isNaN(value.getTime())
          ? ""
          : value
              .toISOString()
              .slice(0, 19)
              .replace("T00:00:00", "")
              .replace("T", " ")
        : String(value);
  // Escape formula-like text, but leave actual numeric values numeric.
  if (typeof value === "string" && /^\s*[=+@-]/.test(text)) text = "'" + text;
  return `"${text.replace(/"/g, '""')}"`;
};

const addUrpWorksheet = (
  workbook: ExcelJS.Workbook,
  items: FinanceReportItem[],
) => {
  const sheet = workbook.addWorksheet("URP Sales", {
    views: [{ state: "frozen", ySplit: 1, showGridLines: true }],
  });
  const rows = buildUrpRows(items);
  const minimum = [22, 17, 27, 32, 10, 19, 16, 16, 16, 20];
  sheet.columns = URP_HEADERS.map((heading, i) => ({
    width: Math.min(
      60,
      rows.reduce(
        (max, row) => Math.max(max, urpCellText(row[i], i).length + 4),
        Math.max(minimum[i], heading.length + 4),
      ),
    ),
  }));
  const header = sheet.addRow(URP_HEADERS);
  header.height = 30;
  header.eachCell((cell) => {
    cell.font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF173B63" },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
  });
  rows.forEach((values, index) => {
    const row = sheet.addRow(values);
    row.height = Math.max(
      24,
      ...values.map(
        (v, i) =>
          14 *
            Math.ceil(
              urpCellText(v, i).length /
                Math.max(8, (sheet.getColumn(i + 1).width || 20) - 4),
            ) +
          8,
      ),
    );
    URP_HEADERS.forEach((_, i) => {
      const cell = row.getCell(i + 1);
      cell.font = {
        name: "Calibri",
        size: 11,
        bold: i === 9,
        color: { argb: "FF173B63" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: i === 9 ? "FFDCEEFF" : index % 2 ? "FFF3F7FC" : "FFFFFFFF",
        },
      };
      const edge: Partial<ExcelJS.Border> = {
        style: "thin",
        color: { argb: "FFD3DFEB" },
      };
      cell.border = { top: edge, bottom: edge, left: edge, right: edge };
      cell.alignment = {
        horizontal: i >= 4 ? "right" : "left",
        vertical: "top",
        wrapText: true,
        indent: 1,
      };
      cell.numFmt =
        i === 1 ? "dd-mmm-yy" : i === 4 ? "0.##" : i >= 5 ? "#,##0.00" : "@";
    });
  });
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: rows.length + 1, column: URP_HEADERS.length },
  };
};

// Calculate all additive fields from the same mapping used by Excel.
const summarizeSales = (items: FinanceReportItem[]) => {
  const rows = buildSalesRows(items);
  const sum = (heading: string): number | null => {
    const index = SALES_HEADERS.indexOf(heading);
    const values = rows
      .map((row) => row[index])
      .filter((value): value is number => typeof value === "number");
    if (
      ["CGST", "SGST", "IGST"].includes(heading) &&
      values.length !== rows.length
    )
      return null;
    return values.length
      ? roundMoney(values.reduce((total, value) => total + value, 0))
      : rows.length
        ? null
        : 0;
  };
  return {
    orders: new Set(items.map((item, index) => getInvoiceKey(item, index)))
      .size,
    rows: rows.length,
    quantity: sum("Quantity"),
    sales: sum("Total"),
    subtotal: sum("Sub Total"),
    gst: sum("Total Tax"),
    cgst: sum("CGST"),
    sgst: sum("SGST"),
    igst: sum("IGST"),
    productSubtotal: sum("Product Subtotal Without GST"),
    productGst: sum("Product GST"),
    shipping: sum("Shipping Charges"),
    shippingBase: sum("Shipping Charges Without GST"),
    shippingGst: sum("Shipping GST"),
    service: sum("Total Service Charge"),
    discount: sum("Total Discount"),
    cv: sum("CV"),
  };
};

const displayMoney = (amount: number | null | undefined) =>
  amount == null ? "—" : money(amount);
const displayNumber = (amount: number | null | undefined) =>
  amount == null ? "—" : amount.toLocaleString("en-IN");

/* ================= SMALL COMPONENTS ================= */
function StatusBadge({ status }: { status: string | null | undefined }) {
  const style = statusStyle(status);
  return (
    <span
      className="inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize"
      style={{ background: style.bg, color: style.color }}
    >
      {valueOrDash(status).replace(/_/g, " ")}
    </span>
  );
}
function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  bg,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-600">{title}</p>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ background: bg, color }}
        >
          <Icon size={18} />
        </div>
      </div>
      <h3 className="mt-2 break-words text-xl font-bold tracking-tight text-slate-900 tabular-nums sm:text-2xl">
        {value}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{subtitle}</p>
    </div>
  );
}

function CourierDetails({ item }: { item: FinanceReportItem }) {
  const couriers = getCouriers(item);
  if (!couriers.length)
    return <span className="text-xs text-gray-400">Not assigned</span>;
  return (
    <div className="min-w-0 max-w-full space-y-2">
      {couriers.map((courier, index) => (
        <div
          key={`${courier.courier_company || "courier"}-${courier.courier_tracking_number || index}-${index}`}
        >
          <p className="flex items-center gap-1 text-xs font-semibold text-gray-800">
            <Truck size={12} className="shrink-0 text-[#2D6FE8]" />
            <span>{valueOrDash(courier.courier_company)}</span>
          </p>
          <p className="mt-0.5 break-all pl-[17px] text-xs text-gray-500">
            Tracking: {valueOrDash(courier.courier_tracking_number)}
          </p>
        </div>
      ))}
    </div>
  );
}
function ProductDetails({ item }: { item: FinanceReportItem }) {
  const row = asLineItem(item);
  return (
    <div className="min-w-0 w-full max-w-full">
      <p className="line-clamp-2 text-xs font-semibold text-gray-800">
        {valueOrDash(getProductName(item))}
      </p>
      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-gray-500">
        <span>SKU: {valueOrDash(getProductCode(item))}</span>
        <span>Category: {valueOrDash(getProductCategory(item))}</span>
        <span>HSN: {valueOrDash(getHsnCode(item))}</span>
        <span>GST: {getGstPercentage(item) || "—"}</span>
      </div>
      {row.item_reference_id && (
        <p className="mt-1 break-all text-xs text-gray-400">
          Item Ref: {row.item_reference_id}
        </p>
      )}
    </div>
  );
}
function TaxBreakdownDetails({ item }: { item: FinanceReportItem }) {
  const tax = getSalesLineTax(item);
  return (
    <div className="min-w-0 space-y-1.5">
      {[
        ["CGST", tax.cgst],
        ["SGST", tax.sgst],
        ["IGST", tax.igst],
      ].map(([label, amount]) => (
        <div
          key={String(label)}
          className="flex items-center justify-between gap-1"
        >
          <span className="text-xs text-gray-500">{label}</span>
          <span className="break-words text-right text-xs font-semibold text-gray-700">
            {amount === null ? "—" : money(Number(amount))}
          </span>
        </div>
      ))}
      <div className="flex items-center justify-between gap-1 border-t border-[#E8EEF6] pt-1.5">
        <span className="text-xs font-bold text-gray-700">Total Tax</span>
        <span className="break-words text-right text-xs font-bold text-[#1E40AF]">
          {money(tax.total)}
        </span>
      </div>
    </div>
  );
}
/* ================= MAIN COMPONENT ================= */
const FinanceReport = () => {
  const {
    hasPermission,
    hasModuleAccess,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();
  const canViewReport = useMemo(() => {
    if (isSuperAdmin) return true;
    return (
      hasModuleAccess("finance_sales_report") ||
      hasPermission("finance_sales_report.view")
    );
  }, [isSuperAdmin, hasModuleAccess, hasPermission]);
  const canExport = useMemo(() => {
    if (isSuperAdmin) return true;
    return hasPermission("finance_sales_report.download");
  }, [isSuperAdmin, hasPermission]);
  /* ================= LOGO ================= */
  const [logoUrl, setLogoUrl] = useState<string | null>(DEFAULT_LOGO_URL);
  const [logoLoading, setLogoLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    const loadLogo = async () => {
      try {
        const response: any = await logoApi.getLogo();
        const candidates = [
          response?.data?.data?.logo,
          response?.data?.logo,
          response?.data?.data?.data?.logo,
          response?.data?.data?.logo_url,
          response?.data?.logo_url,
          response?.logo,
        ];
        const found = candidates.find(
          (value) =>
            typeof value === "string" && /^https?:\/\//i.test(value.trim()),
        );
        if (!cancelled && found) setLogoUrl(found.trim());
      } catch (error) {
        console.error("Logo API error:", error);
      } finally {
        if (!cancelled) setLogoLoading(false);
      }
    };
    void loadLogo();
    return () => {
      cancelled = true;
    };
  }, []);
  /* ================= REPORT STATE ================= */
  const [reports, setReports] = useState<FinanceReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [gstFilter, setGstFilter] = useState<"all" | "urp" | "registered">(
    "all",
  );
  const urpMode = gstFilter === "urp";
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedDates, setAppliedDates] = useState({
    fromDate: "",
    toDate: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [overviewRows, setOverviewRows] = useState<FinanceReportItem[] | null>(
    null,
  );
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState(false);
  const [overviewRevision, setOverviewRevision] = useState(0);
  /* ================= FETCH REPORT ================= */
  const fetchReports = useCallback(
    async (showLoader = true, page = currentPage) => {
      try {
        if (showLoader) setLoading(true);
        else setRefreshing(true);
        const response = await financeReportApi.getAll({
          page,
          per_page: PER_PAGE,
          from_date: appliedDates.fromDate || undefined,
          to_date: appliedDates.toDate || undefined,
        });
        if (response.success) {
          const data = Array.isArray(response.data) ? response.data : [];
          setReports(data);
          setTotalRecords(response.meta?.total ?? data.length);
          setLastPage(response.meta?.last_page ?? 1);
        } else {
          setReports([]);
          setTotalRecords(0);
          setLastPage(1);
          toast.error(response.message || "Unable to fetch finance report");
        }
      } catch (error: any) {
        console.error("Finance report error:", error);
        toast.error(
          error?.response?.data?.message || "Failed to fetch finance report",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentPage, appliedDates],
  );
  useEffect(() => {
    if (permissionsLoading) return;
    if (!canViewReport) {
      setLoading(false);
      return;
    }
    void fetchReports(true, Math.min(currentPage, lastPage));
  }, [permissionsLoading, canViewReport, fetchReports]);
  const fetchAllReportRows = useCallback(async () => {
    const allItems: FinanceReportItem[] = [];
    let page = 1;
    let pages = 1;
    do {
      const response = await financeReportApi.getAll({
        page,
        per_page: PER_PAGE,
        from_date: appliedDates.fromDate || undefined,
        to_date: appliedDates.toDate || undefined,
      });
      if (!response.success)
        throw new Error(response.message || "Unable to load finance totals");
      allItems.push(...(Array.isArray(response.data) ? response.data : []));
      pages = Math.max(1, Number(response.meta?.last_page) || 1);
      page += 1;
    } while (page <= pages);
    return allItems;
  }, [appliedDates]);

  useEffect(() => {
    if (permissionsLoading || !canViewReport) return;
    let active = true;
    setOverviewRows(null);
    setOverviewLoading(true);
    setOverviewError(false);
    fetchAllReportRows()
      .then((items) => {
        if (active) setOverviewRows(items);
      })
      .catch((error) => {
        console.error("Finance totals error:", error);
        if (active) setOverviewError(true);
      })
      .finally(() => {
        if (active) setOverviewLoading(false);
      });
    return () => {
      active = false;
    };
  }, [permissionsLoading, canViewReport, fetchAllReportRows, overviewRevision]);

  /* ================= SEARCH & FILTER ================= */
  const filterReports = useCallback(
    (source: FinanceReportItem[]) => {
      const query = search.trim().toLowerCase();
      return source.filter((item) => {
        const row = asLineItem(item);
        const couriers = getCouriers(item);
        const searchable = [
          item.invoice_number,
          row.order_reference,
          item.customer_name,
          item.customer_mobile,
          item.customer_email,
          row.customer_gstin,
          row.billing_state,
          row.delivery_state,
          item.user_name,
          item.product_names,
          row.product_name,
          row.product_code,
          row.product_slug,
          getProductCategory(item),
          row.hsn_code,
          row.item_reference_id,
          row.order_line_id,
          item.order_status,
          item.order_date,
          item.payment_gateway,
          item.gateway_transaction_id,
          ...couriers.flatMap((courier) => [
            courier.courier_company,
            courier.courier_tracking_number,
          ]),
        ];
        const matchesSearch =
          !query ||
          searchable.some((value) =>
            String(value ?? "")
              .toLowerCase()
              .includes(query),
          );
        const matchesStatus =
          statusFilter === "all" ||
          (item.order_status || "").toLowerCase() === statusFilter;
        const matchesAccount =
          accountFilter === "all" ||
          (item.account_type || "").toLowerCase() === accountFilter;
        const gstin = trimmedValue(row.customer_gstin);
        const matchesGst =
          gstFilter === "all" ||
          (gstFilter === "urp" ? isUrp(item) : !!gstin && !isUrp(item));
        return matchesSearch && matchesStatus && matchesAccount && matchesGst;
      });
    },
    [search, statusFilter, accountFilter, gstFilter],
  );
  const allFilteredReports = useMemo(
    () => (overviewRows === null ? null : filterReports(overviewRows)),
    [overviewRows, filterReports],
  );
  const displayTotal =
    allFilteredReports === null ? totalRecords : allFilteredReports.length;
  const displayLastPage =
    allFilteredReports === null
      ? lastPage
      : Math.max(1, Math.ceil(displayTotal / PER_PAGE));
  const displayPage = Math.min(currentPage, displayLastPage);
  const filteredReports = useMemo(
    () =>
      allFilteredReports === null
        ? filterReports(reports)
        : allFilteredReports.slice(
            (displayPage - 1) * PER_PAGE,
            displayPage * PER_PAGE,
          ),
    [allFilteredReports, displayPage, reports, filterReports],
  );
  useEffect(() => {
    setCurrentPage(1);
  }, [filterReports]);
  /* ================= SUMMARY ================= */
  const summary = useMemo(() => {
    if (overviewRows === null) return null;
    const matched = filterReports(overviewRows);
    return matched.some(hasMissingCalculationInputs)
      ? null
      : summarizeSales(matched);
  }, [overviewRows, filterReports]);
  const pageSummary = useMemo(
    () => summarizeSales(filteredReports),
    [filteredReports],
  );
  const summaryMoney = (value: number | null | undefined) =>
    overviewLoading ? "…" : displayMoney(value);
  const summaryNumber = (value: number | null | undefined) =>
    overviewLoading ? "…" : displayNumber(value);
  /* ================= APPLY / CLEAR FILTERS ================= */
  const applyFilters = () => {
    if (fromDate && toDate && fromDate > toDate) {
      toast.error("From date cannot be greater than To date");
      return;
    }
    setCurrentPage(1);
    setAppliedDates({ fromDate, toDate });
  };
  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setAccountFilter("all");
    setGstFilter("all");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
    setAppliedDates({ fromDate: "", toDate: "" });
  };
  /* ================= EXCEL EXPORT ================= */
  const exportExcel = async () => {
    if (!canExport) {
      toast.error("You don't have permission to export this report.");
      return;
    }
    if (exporting || exportingCsv) return;
    setExporting(true);
    try {
      const allItems = await fetchAllReportRows();
      const exportItems = filterReports(allItems);
      if (exportItems.some(hasMissingCalculationInputs)) {
        throw new Error(
          "Cannot calculate sales: quantity, taxable unit price, GST rate or shipping base is missing.",
        );
      }
      const rows = buildSalesRows(exportItems);
      if (!rows.length) {
        toast.error("No finance records available to export");
        return;
      }
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "IndieKonnect";
      workbook.calcProperties.fullCalcOnLoad = true;
      if (urpMode) {
        addUrpWorksheet(workbook, exportItems);
      } else {
        // The first worksheet is a compact, client-facing explanation of the same
        // calculated data. The 44-column audit worksheet stays intact.
        const overview = workbook.addWorksheet("Sales Overview", {
          views: [
            { state: "frozen", xSplit: 3, ySplit: 5, showGridLines: false },
          ],
          properties: { defaultRowHeight: 25 },
        });
        // Keep every value inside its own cell, including long customer details.
        const cellText = (value: unknown): string => {
          if (value == null) return "";
          if (value instanceof Date) return "00-00-0000 00:00";
          if (typeof value === "number")
            return value.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
          return String(value);
        };
        const fitWidth = (
          minimum: number,
          values: unknown[],
          numeric = false,
        ) => {
          const longest = values.reduce<number>(
            (max, value) =>
              Math.max(
                max,
                ...cellText(value)
                  .split("\n")
                  .map((part) => part.length),
              ),
            0,
          );
          // Numeric columns grow to accommodate large totals; text wraps at a sensible width.
          return Math.min(
            numeric ? 48 : 42,
            Math.max(minimum, Math.ceil(longest * 1.12) + 5),
          );
        };
        const fittedRowHeight = (
          values: unknown[],
          widths: number[],
          minimum = 34,
        ) => {
          const lines = values.reduce<number>((max, value, i) => {
            const capacity = Math.max(4, Math.floor((widths[i] - 5) / 1.12));
            const count = cellText(value)
              .split("\n")
              .reduce(
                (sum, part) =>
                  sum + Math.max(1, Math.ceil(part.length / capacity)),
                0,
              );
            return Math.max(max, count);
          }, 1);
          return Math.min(409, Math.max(minimum, 14 * lines + 12));
        };
        const cellGrid = (color = "FFD3DFEB"): Partial<ExcelJS.Borders> => ({
          top: { style: "thin", color: { argb: color } },
          bottom: { style: "thin", color: { argb: color } },
          left: { style: "thin", color: { argb: color } },
          right: { style: "thin", color: { argb: color } },
        });
        const overviewColumns = [
          { source: "Invoice Number", label: "Invoice No.", width: 18 },
          { source: "Customer Name", label: "Customer Name", width: 25 },
          { source: "Customer Email", label: "Customer Email", width: 31 },
          { source: "User Name", label: "User Name", width: 22 },
          { source: "Product Name", label: "Product Name", width: 33 },
          { source: "Product Head", label: "Product Category", width: 23 },
          { source: "Quantity", label: "Qty", width: 9 },
          {
            source: "Product Subtotal Without GST",
            label: "Product Amount\n(before tax)",
            width: 19,
          },
          {
            source: "Shipping Charges Without GST",
            label: "Shipping\n(before tax)",
            width: 17,
          },
          { source: "Sub Total", label: "Subtotal\n(before tax)", width: 19 },
          { source: "Total Tax", label: "GST\n(total tax)", width: 17 },
          {
            source: "Total Service Charge",
            label: "Service\nCharges",
            width: 16,
          },
          { source: "Total", label: "Final Amount\n(incl. tax)", width: 21 },
        ];
        const overviewTextCount = overviewColumns.findIndex(
          (col) => col.source === "Quantity",
        );
        const isOverviewTotal = (i: number) =>
          overviewColumns[i].source === "Total";
        const isOverviewSubtotal = (i: number) =>
          overviewColumns[i].source === "Sub Total";
        const isOverviewQuantity = (i: number) =>
          overviewColumns[i].source === "Quantity";
        const simpleRows = rows.map((row) =>
          overviewColumns.map(
            ({ source }) => row[SALES_HEADERS.indexOf(source)],
          ),
        );
        const overviewWidths = overviewColumns.map((col, i) => {
          const values = simpleRows.map((row) => row[i]);
          const total =
            i >= overviewTextCount
              ? values.reduce<number>(
                  (sum, value) => sum + (typeof value === "number" ? value : 0),
                  0,
                )
              : null;
          return fitWidth(
            Math.max(col.width, i >= overviewTextCount ? 17 : 19),
            [col.label, ...values, total],
            i >= overviewTextCount,
          );
        });
        overview.columns = overviewWidths.map((width) => ({ width }));
        const fill = (argb: string): ExcelJS.Fill => ({
          type: "pattern",
          pattern: "solid",
          fgColor: { argb },
        });
        const overviewBanner = (
          row: number,
          value: string,
          bg: string,
          fg: string,
          size: number,
          bold = false,
        ) => {
          overview.mergeCells(row, 1, row, overviewColumns.length);
          const cell = overview.getCell(row, 1);
          cell.value = value;
          cell.fill = fill(bg);
          cell.font = { name: "Calibri", size, bold, color: { argb: fg } };
          cell.alignment = {
            vertical: "middle",
            horizontal: "left",
            indent: 1,
            wrapText: true,
          };
        };
        overviewBanner(
          1,
          "INDIEKONNECT  /  SALES OVERVIEW",
          "FF173B63",
          "FFFFFFFF",
          20,
          true,
        );
        overview.getRow(1).height = 42;
        const period = `${appliedDates.fromDate || "Any start date"} to ${appliedDates.toDate || "Any end date"}`;
        overviewBanner(
          2,
          `${period}  |  ${rows.length} product lines  |  All amounts in INR (₹)`,
          "FFF0F7FF",
          "FF456580",
          11,
        );
        overview.getRow(2).height = 25;
        overviewBanner(
          3,
          "Product amount + shipping = subtotal  •  Subtotal + GST + service charges = final amount",
          "FFFFFFFF",
          "FF173B63",
          12,
          true,
        );
        overview.getRow(3).height = 30;
        overviewBanner(
          4,
          "Use the column filters to find a product or invoice. Full GST, payment and courier details are in Sales Data.",
          "FFFFFFFF",
          "FF456580",
          11,
        );
        overview.getRow(4).height = 25;
        const simpleHeader = overview.addRow(
          overviewColumns.map((col) => col.label),
        );
        simpleHeader.height = fittedRowHeight(
          overviewColumns.map((col) => col.label),
          overviewWidths,
          42,
        );
        overviewColumns.forEach((_, i) => {
          const cell = simpleHeader.getCell(i + 1);
          const key = isOverviewSubtotal(i) || isOverviewTotal(i);
          cell.fill = fill(key ? "FFBBDCFB" : "FF24466A");
          cell.font = {
            name: "Calibri",
            size: 11,
            bold: true,
            color: { argb: key ? "FF173B63" : "FFFFFFFF" },
          };
          cell.alignment = {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
          };
          cell.border = cellGrid("FF9FB5CA");
        });
        simpleRows.forEach((values, index) => {
          const line = overview.addRow(values);
          line.height = fittedRowHeight(values, overviewWidths);
          overviewColumns.forEach((_, i) => {
            const cell = line.getCell(i + 1);
            const key = isOverviewSubtotal(i) || isOverviewTotal(i);
            cell.fill = fill(
              isOverviewTotal(i)
                ? "FFDCEEFF"
                : isOverviewSubtotal(i)
                  ? "FFF0F7FF"
                  : index % 2
                    ? "FFF5F8FC"
                    : "FFFFFFFF",
            );
            cell.font = {
              name: "Calibri",
              size: 11,
              bold: isOverviewTotal(i),
              color: { argb: key ? "FF173B63" : "FF253C52" },
            };
            cell.alignment = {
              horizontal: i < overviewTextCount ? "left" : "right",
              vertical: "middle",
              indent: 1,
              wrapText: true,
            };
            cell.border = cellGrid();
            cell.numFmt =
              i < overviewTextCount
                ? "@"
                : isOverviewQuantity(i)
                  ? "#,##0"
                  : "#,##0.00";
          });
        });
        const overviewLast = simpleRows.length + 5;
        overview.autoFilter = {
          from: { row: 5, column: 1 },
          to: { row: overviewLast, column: overviewColumns.length },
        };
        const simpleTotal = overview.addRow([]);
        simpleTotal.height = 40;
        overview.mergeCells(
          simpleTotal.number,
          1,
          simpleTotal.number,
          overviewTextCount,
        );
        simpleTotal.getCell(1).value = "GRAND TOTAL";
        overviewColumns.forEach((_, i) => {
          const cell = simpleTotal.getCell(i + 1);
          cell.fill = fill(isOverviewTotal(i) ? "FFBBDCFB" : "FFDCEEFF");
          cell.font = {
            name: "Calibri",
            size: 12,
            bold: true,
            color: { argb: "FF173B63" },
          };
          cell.alignment = {
            horizontal: i < overviewTextCount ? "left" : "right",
            vertical: "middle",
            indent: 1,
            wrapText: true,
          };
          cell.border = cellGrid("FF9FB5CA");
          if (i >= overviewTextCount) {
            const letter = overview.getColumn(i + 1).letter;
            const sum = roundMoney(
              simpleRows.reduce(
                (acc, row) =>
                  acc + (typeof row[i] === "number" ? Number(row[i]) : 0),
                0,
              ),
            );
            cell.value = {
              formula: `SUBTOTAL(109,${letter}6:${letter}${overviewLast})`,
              result: sum,
            };
            cell.numFmt = isOverviewQuantity(i) ? "#,##0" : "#,##0.00";
          }
        });
        overviewBanner(
          overviewLast + 3,
          "Calculation note: taxable unit price is treated as discount-adjusted. If shipping GST rate is absent, the product rate is used. No separate service GST is assumed.",
          "FFF0F7FF",
          "FF456580",
          10,
        );
        overview.getRow(overviewLast + 3).height = 31;
        overviewBanner(
          overviewLast + 4,
          "The report uses calculations. Grand Total reflects the visible rows in this tab. Product categories are taken from the API; unavailable values remain blank.",
          "FFFFFFFF",
          "FF456580",
          10,
        );
        overview.getRow(overviewLast + 4).height = 28;
        const sheet = workbook.addWorksheet("Sales Data", {
          views: [
            { state: "frozen", xSplit: 3, ySplit: 1, showGridLines: false },
          ],
          properties: { defaultRowHeight: 23 },
        });
        const currencyFormat = "#,##0.00;[Red](#,##0.00);0.00";
        const textHeaders = new Set([
          "Order Reference",
          "Item Reference ID",
          "Invoice Number",
          "SKU",
          "HSN Code",
          "User Name",
          "Customer Mobile",
          "Gateway Transaction ID",
          "Courier Company",
          "Courier Tracking Number",
        ]);
        const moneyHeaders = new Set([
          "Price",
          "Total Discount",
          "Total Tax",
          "CGST",
          "SGST",
          "IGST",
          "Sub Total",
          "Total",
          "Shipping Charges",
          "Unit Price Without GST",
          "Product Subtotal Without GST",
          "Product GST",
          "Shipping Charges Without GST",
          "Shipping GST",
          "Service Charge Per Unit",
          "Total Service Charge",
        ]);
        const dateTimeHeaders = new Set([
          "Order Date",
          "Confirmed At",
          "Dispatched At",
          "Delivered At",
        ]);
        const groupColor = (heading: string) => {
          if (["Sub Total", "Total"].includes(heading)) return "FFBBDCFB";
          if (heading === "Price") return "FF13795B";
          if (
            [
              "Total Tax",
              "CGST",
              "SGST",
              "IGST",
              "Tax Percentage",
              "Product GST",
              "Shipping GST",
            ].includes(heading)
          )
            return "FF365A83";
          if (moneyHeaders.has(heading) || ["CV", "Quantity"].includes(heading))
            return "FF24466A";
          return "FF17324D";
        };
        const salesWidths = SALES_WIDTHS.map((width, i) => {
          const heading = SALES_HEADERS[i];
          const numeric =
            moneyHeaders.has(heading) ||
            ["Quantity", "CV", "Tax Percentage"].includes(heading);
          const values = rows.map((row) => row[i]);
          const total = SALES_TOTAL_HEADERS.includes(heading)
            ? values.reduce<number>(
                (sum, value) => sum + (typeof value === "number" ? value : 0),
                0,
              )
            : null;
          return fitWidth(
            Math.max(width, moneyHeaders.has(heading) ? 20 : numeric ? 14 : 18),
            [heading, ...values, total],
            numeric,
          );
        });
        sheet.columns = salesWidths.map((width) => ({ width }));
        // Row 1 headers, row 2 onward sales data, final row grand total.
        const header = sheet.addRow(SALES_HEADERS);
        header.height = fittedRowHeight(SALES_HEADERS, salesWidths, 42);
        for (let c = 1; c <= SALES_HEADERS.length; c++) {
          const cell = header.getCell(c);
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: groupColor(SALES_HEADERS[c - 1]) },
          };
          cell.font = {
            name: "Calibri",
            size: 11,
            bold: true,
            color: {
              argb: ["Sub Total", "Total"].includes(SALES_HEADERS[c - 1])
                ? "FF173B63"
                : "FFFFFFFF",
            },
          };
          cell.alignment = {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
          };
          cell.border = cellGrid("FF9FB5CA");
        }
        rows.forEach((values, index) => {
          const excelRow = sheet.addRow(values);
          excelRow.height = fittedRowHeight(values, salesWidths);
          for (let c = 1; c <= SALES_HEADERS.length; c++) {
            const heading = SALES_HEADERS[c - 1];
            const cell = excelRow.getCell(c);
            const numeric =
              moneyHeaders.has(heading) ||
              ["Quantity", "CV", "Tax Percentage"].includes(heading);
            const keyTotal = ["Sub Total", "Total"].includes(heading);
            cell.font = {
              name: "Calibri",
              size: 11,
              color: { argb: keyTotal ? "FF173B63" : "FF253C52" },
              bold: keyTotal,
            };
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb: keyTotal
                  ? heading === "Total"
                    ? "FFDCEEFF"
                    : "FFF0F7FF"
                  : index % 2 === 0
                    ? "FFFFFFFF"
                    : "FFF2F6FA",
              },
            };
            cell.alignment = {
              vertical: "middle",
              horizontal: numeric ? "right" : "left",
              indent: 1,
              wrapText: true,
            };
            cell.border = cellGrid();
            if (textHeaders.has(heading)) cell.numFmt = "@";
            if (moneyHeaders.has(heading)) cell.numFmt = currencyFormat;
            if (heading === "Quantity" || heading === "CV")
              cell.numFmt = "#,##0.##";
            if (heading === "Tax Percentage") cell.numFmt = '0.##"%"';
            if (heading === "Invoice Date") cell.numFmt = "dd-mm-yyyy";
            if (dateTimeHeaders.has(heading)) cell.numFmt = "dd-mm-yyyy hh:mm";
          }
        });
        const lastRow = rows.length + 1;
        const footer = sheet.addRow([]);
        footer.height = 40;
        sheet.autoFilter = {
          from: { row: 1, column: 1 },
          to: { row: lastRow, column: SALES_HEADERS.length },
        };
        // Label cells are outside the numeric columns. Merge only A:C so frozen panes remain intact.
        [footer.number].forEach((r) => {
          for (let c = 1; c <= SALES_HEADERS.length; c++) {
            const cell = sheet.getRow(r).getCell(c);
            const heading = SALES_HEADERS[c - 1];
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: heading === "Total" ? "FFBBDCFB" : "FFDCEEFF" },
            };
            cell.font = {
              name: "Calibri",
              size: 12,
              bold: true,
              color: { argb: "FF173B63" },
            };
            cell.alignment = {
              horizontal: "right",
              vertical: "middle",
              indent: 1,
              wrapText: true,
            };
            cell.border = cellGrid("FF9FB5CA");
          }
          sheet.mergeCells(r, 1, r, 3);
          const title = sheet.getCell(r, 1);
          title.value = "GRAND TOTAL  |  VISIBLE ROWS";
          title.alignment = {
            horizontal: "left",
            vertical: "middle",
            indent: 1,
          };
          const detail = sheet.getCell(r, 6);
          detail.value = "INR •calculated";
          detail.alignment = {
            horizontal: "left",
            vertical: "middle",
            indent: 1,
            wrapText: true,
          };
        });
        SALES_TOTAL_HEADERS.forEach((heading) => {
          const col = SALES_HEADERS.indexOf(heading);
          if (col < 0) return;
          const column = sheet.getColumn(col + 1).letter;
          const values = rows
            .map((row) => row[col])
            .filter((value): value is number => typeof value === "number");
          if (!values.length) return;
          if (
            ["CGST", "SGST", "IGST"].includes(heading) &&
            values.length !== rows.length
          )
            return;
          const sum = roundMoney(values.reduce((acc, value) => acc + value, 0));
          [footer.number].forEach((r) => {
            const cell = sheet.getRow(r).getCell(col + 1);
            cell.value = {
              formula: `SUBTOTAL(109,${column}2:${column}${lastRow})`,
              result: sum,
            };
            cell.numFmt = moneyHeaders.has(heading)
              ? currencyFormat
              : "#,##0.##";
          });
        });
      }
      const buffer = await workbook.xlsx.writeBuffer();
      const bytes = new Uint8Array(buffer);
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${urpMode ? "urp-sales" : "sales-data"}-${formatDateInput(new Date())}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Sales Data exported successfully");
    } catch (error) {
      console.error("Sales Data export error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to export Sales Data",
      );
    } finally {
      setExporting(false);
    }
  };

  /* ================= CSV EXPORT ================= */
  const exportCsv = async () => {
    if (!canExport) {
      toast.error("You don't have permission to export this report.");
      return;
    }
    if (exporting || exportingCsv) return;
    setExportingCsv(true);
    try {
      const exportItems = filterReports(await fetchAllReportRows());
      if (!exportItems.length) {
        toast.error("No finance records available to export");
        return;
      }
      if (exportItems.some(hasMissingCalculationInputs)) {
        throw new Error(
          "Cannot calculate sales: quantity, taxable unit price, GST rate or shipping base is missing.",
        );
      }
      // The compact format is exclusive to downloads with the URP filter.
      const headers = urpMode ? URP_HEADERS : SALES_HEADERS;
      const rows = urpMode
        ? buildUrpRows(exportItems)
        : buildSalesRows(exportItems);
      const csvRows = rows.map((row) =>
        row.map((value, i) =>
          urpMode && i === 1 && value instanceof Date
            ? urpCellText(value, i)
            : value,
        ),
      );
      const csv = [headers, ...csvRows]
        .map((row) => row.map(salesCsvCell).join(","))
        .join("\r\n");
      const blob = new Blob(["\uFEFF", csv], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${urpMode ? "urp-sales" : "sales-data"}-${formatDateInput(new Date())}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Sales Data exported successfully");
    } catch (error) {
      console.error("Sales Data CSV export error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to export Sales Data",
      );
    } finally {
      setExportingCsv(false);
    }
  };

  /* ================= PAGINATION ================= */
  const startRecord = displayTotal === 0 ? 0 : (displayPage - 1) * PER_PAGE + 1;
  const endRecord = Math.min(displayPage * PER_PAGE, displayTotal);
  const pageLoading = permissionsLoading || logoLoading;
  if (pageLoading) return <PermissionLoadingState logoUrl={logoUrl} />;
  if (!canViewReport) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#F4F8FD] p-4">
        <div className="max-w-md rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-lg">
          <ShieldAlert size={28} className="mx-auto mb-4 text-[#C23B32]" />
          <h2 className="text-lg font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-sm text-gray-500">
            You don't have permission to view the Finance Sales Report.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div
      className="min-h-screen space-y-5 p-3 sm:p-5 lg:p-6"
      style={{ background: THEME.background }}
    >
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#2D6FE8]">
            <span>Reports</span>
            <ChevronRight size={13} />
            <span>Finance Sales Report</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
            Finance Sales Report
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Product-wise sales and GST calculated from unit prices, quantities
            and tax rates.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void fetchReports(false, Math.min(currentPage, lastPage));
              setOverviewRevision((value) => value + 1);
            }}
            disabled={refreshing || loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#DCE6F2] bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          {canExport && (
            <button
              type="button"
              onClick={() => void exportCsv()}
              disabled={exporting || exportingCsv || loading || refreshing}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#DCE6F2] bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exportingCsv ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <FileText size={16} />
              )}
              {exportingCsv ? "Exporting CSV..." : "Export CSV"}
            </button>
          )}
          {canExport && (
            <button
              type="button"
              onClick={() => void exportExcel()}
              disabled={exporting || exportingCsv || loading || refreshing}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2D6FE8] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {exporting ? "Exporting..." : "Export Excel"}
            </button>
          )}
        </div>
      </div>
      {/* EXECUTIVE FINANCIAL SUMMARY */}
      <p className="text-xs text-slate-500">
        Calculated amounts. Shipping GST uses the product rate when no
        separate rate is supplied. Unit price is treated as net of discounts;
        service charges are added without separate GST.
      </p>
      <section className="space-y-3" aria-label="Financial summary">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Sales overview
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              All matching records across pages · INR
            </p>
          </div>
          {overviewLoading ? (
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 size={14} className="animate-spin" /> Updating totals
            </span>
          ) : overviewError ? (
            <button
              type="button"
              onClick={() => setOverviewRevision((value) => value + 1)}
              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700"
            >
              Totals unavailable · Retry
            </button>
          ) : (
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
              {summaryNumber(summary?.rows)} product lines
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="min-w-0 rounded-xl border border-[#BBDCFB] bg-[#EAF3FF] p-4 text-[#173B63] shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-[#315B86]">
                Total Sales
              </p>
              <div className="rounded-lg bg-[#D5E9FF] p-2">
                <Wallet size={18} />
              </div>
            </div>
            <p className="mt-2 break-words text-2xl font-bold tracking-tight tabular-nums">
              {summaryMoney(summary?.sales)}
            </p>
            <p className="mt-1 text-xs text-[#315B86]">
              Total item amount · incl. GST
            </p>
          </div>
          <SummaryCard
            title="Sub Total"
            value={summaryMoney(summary?.subtotal)}
            subtitle="Products + shipping, excl. GST"
            icon={Receipt}
            color="#2D6FE8"
            bg="#EAF3FF"
          />
          <SummaryCard
            title="Total GST"
            value={summaryMoney(summary?.gst)}
            subtitle="Product GST + shipping GST"
            icon={CreditCard}
            color="#6D28D9"
            bg="#EDE9FE"
          />
          <SummaryCard
            title="Shipping Charges"
            value={summaryMoney(summary?.shipping)}
            subtitle="Including shipping GST"
            icon={Truck}
            color="#15803D"
            bg="#DCFCE7"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">
              Sales breakdown
            </h3>
            <div className="mt-3 space-y-2.5 text-xs">
              {[
                ["Product subtotal", summary?.productSubtotal],
                ["Shipping excl. GST", summary?.shippingBase],
                ["Sub Total (excl. GST)", summary?.subtotal],
                ["Service charges", summary?.service],
                ["Discount", summary?.discount],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-slate-500">{label}</span>
                  <span className="font-semibold text-slate-800 tabular-nums">
                    {summaryMoney(value as number | null | undefined)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">GST breakdown</h3>
            <div className="mt-3 space-y-2.5 text-xs">
              {[
                ["CGST", summary?.cgst],
                ["SGST", summary?.sgst],
                ["IGST", summary?.igst],
                ["Product GST", summary?.productGst],
                ["Shipping GST", summary?.shippingGst],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-slate-500">{label}</span>
                  <span className="font-semibold text-slate-800 tabular-nums">
                    {summaryMoney(value as number | null | undefined)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Order activity
              </h3>
              <Package size={17} className="text-slate-400" />
            </div>
            <div className="mt-3 divide-y divide-slate-100">
              {[
                ["Unique orders", summary?.orders],
                ["Product quantity", summary?.quantity],
                ["Total CV", summary?.cv],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between gap-3 py-2 first:pt-0"
                >
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className="text-sm font-bold text-slate-900 tabular-nums">
                    {summaryNumber(value as number | null | undefined)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* FILTERS */}
      <div className="rounded-xl border border-[#DCE6F2] bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={17} className="text-[#2D6FE8]" />
          <h2 className="text-sm font-bold text-gray-800">Search & Filters</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_1fr_1fr_1fr_1fr_1fr_auto]">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search invoice, order, product, HSN, GSTIN, state, courier..."
              className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white pl-9 pr-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-[#2D6FE8] focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#2D6FE8]"
          >
            <option value="all">All Statuses</option>
            <option value="dispatched">Dispatched</option>
            <option value="shipped">Shipped</option>
            <option value="partial_shipped">Partial Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="partial_delivered">Partial Delivered</option>
          </select>
          <select
            value={accountFilter}
            onChange={(event) => setAccountFilter(event.target.value)}
            className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#2D6FE8]"
          >
            <option value="all">All Account Types</option>
            <option value="customer">Customer</option>
            <option value="distributor">Distributor</option>
          </select>
          <select
            aria-label="GST registration"
            value={gstFilter}
            onChange={(event) => {
              setGstFilter(event.target.value as "all" | "urp" | "registered");
              setCurrentPage(1);
            }}
            className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#2D6FE8]"
          >
            <option value="all">All GST Types</option>
            <option value="urp">URP</option>
            <option value="registered">Registered</option>
          </select>
          <div className="relative">
            <CalendarDays
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white pl-9 pr-2 text-sm text-gray-700 outline-none focus:border-[#2D6FE8]"
            />
          </div>
          <div className="relative">
            <CalendarDays
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white pl-9 pr-2 text-sm text-gray-700 outline-none focus:border-[#2D6FE8]"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={applyFilters}
              disabled={loading}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#2D6FE8] px-4 text-sm font-semibold text-white hover:bg-[#1E40AF] disabled:opacity-60"
            >
              <Filter size={15} /> Apply
            </button>
            <button
              type="button"
              onClick={clearFilters}
              title="Clear filters"
              className="flex h-10 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white px-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-red-500"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </div>
      {/* FINANCE RECORDS */}
      <div className="overflow-hidden rounded-xl border border-[#DCE6F2] bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-[#DCE6F2] p-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Finance Reports
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Product-wise sales and GST details. Export includes all matching
              records.
            </p>
          </div>
          <span className="w-fit rounded-full bg-[#EAF3FF] px-3 py-1.5 text-xs font-semibold text-[#1E40AF]">
            {filteredReports.length} Item Rows
          </span>
        </div>
        {loading ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center">
            <Loader2 size={32} className="animate-spin text-[#2D6FE8]" />
            <p className="mt-3 text-sm font-medium text-gray-500">
              Loading finance report...
            </p>
          </div>
        ) : filteredReports.some(hasMissingCalculationInputs) ? (
          <div className="p-8 text-center text-sm text-amber-800" role="alert">
            Sales calculation unavailable: one or more records are missing
            quantity, taxable unit price, GST rate or shipping base.
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
              <FileText size={25} />
            </div>
            <h3 className="mt-4 text-base font-bold text-gray-800">
              No Finance Records Found
            </h3>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              No records match your search or selected filters.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 rounded-lg bg-[#2D6FE8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E40AF]"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden w-full overflow-x-auto xl:block">
              <table className="w-full min-w-[1420px] table-fixed border-collapse text-left">
                <colgroup>
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "8%" }} />
                </colgroup>
                <thead>
                  <tr className="bg-[#F7FAFE]">
                    {[
                      "Invoice / Date",
                      "Customer / GSTIN",
                      "Product / GST %",
                      "Qty / Unit Price",
                      "Shipping",
                      "Item Total / GST",
                      "GST Breakdown",
                      "Payment",
                      "Order",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="whitespace-normal break-words border-b border-[#DCE6F2] px-2.5 py-3 text-xs font-bold uppercase tracking-wide text-gray-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((item, index) => {
                    const row = asLineItem(item);
                    return (
                      <tr
                        key={`${item.invoice_number || "invoice"}-${row.order_line_id ?? row.item_reference_id ?? index}-${index}`}
                        className="border-b border-gray-100 transition last:border-0 hover:bg-[#F8FBFF]"
                      >
                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <p className="break-words text-xs font-bold text-gray-900">
                            {valueOrDash(item.invoice_number)}
                          </p>
                          <p className="mt-1 break-words text-xs text-gray-500">
                            {formatDate(item.invoice_date)}
                          </p>
                          {row.order_reference && (
                            <p className="mt-1 break-all text-xs font-medium text-[#2D6FE8]">
                              {row.order_reference}
                            </p>
                          )}
                        </td>
                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <p className="break-words text-xs font-semibold text-gray-800">
                            {valueOrDash(item.customer_name)}
                          </p>
                          <p className="mt-1 break-all text-xs font-medium text-[#2D6FE8]">
                            Mobile: {valueOrDash(item.customer_mobile)}
                          </p>
                          <p className="mt-1 break-all text-xs text-gray-500">
                            {valueOrDash(item.customer_email)}
                          </p>
                          <p className="mt-1 break-words text-xs text-gray-600">
                            GSTIN: {getGstinNumber(item)}
                          </p>
                          <p className="mt-1 break-words text-xs text-gray-600">
                            State: {valueOrDash(getPlaceOfSupply(item))}
                          </p>
                          <p className="mt-1 break-words text-xs capitalize text-gray-400">
                            {valueOrDash(item.account_type)}
                          </p>
                        </td>
                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <ProductDetails item={item} />
                        </td>
                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <p className="break-words text-xs font-bold text-gray-900">
                            {getQuantity(item)} Qty
                          </p>
                          <p className="mt-1 break-words text-xs text-gray-600">
                            Unit: {money(row.unit_price_without_gst)}
                          </p>
                          <p className="mt-1 break-words text-xs text-gray-500">
                            Line: {money(getLineSubtotal(item))}
                          </p>
                        </td>
                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <p className="text-xs text-gray-500">Without GST</p>
                          <p className="mt-0.5 break-words text-xs font-semibold text-gray-800">
                            {money(getLineShipping(item))}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Shipping GST
                          </p>
                          <p className="mt-0.5 break-words text-xs font-semibold text-gray-800">
                            {money(getLineShippingGst(item))}
                          </p>
                          <div className="mt-2">
                            <CourierDetails item={item} />
                          </div>
                        </td>
                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <p className="break-words text-xs font-bold text-gray-900">
                            {money(getLineGross(item))}
                          </p>
                          <p className="mt-1 break-words text-xs text-gray-500">
                            Product GST: {money(getLineGst(item))}
                          </p>
                          <p className="mt-1 break-words text-xs text-gray-400">
                            Service charge: {money(getLineServiceCharge(item))}
                          </p>
                        </td>
                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <TaxBreakdownDetails item={item} />
                        </td>
                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <p className="break-words text-xs font-semibold text-gray-800">
                            {valueOrDash(item.payment_gateway)}
                          </p>
                          <p className="mt-1 break-all text-xs text-gray-500">
                            {valueOrDash(item.gateway_transaction_id)}
                          </p>
                        </td>
                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <StatusBadge status={item.order_status} />
                          <p className="mt-1 break-words text-xs text-gray-400">
                            {formatDate(item.order_date)}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* MOBILE / TABLET CARDS */}
            <div className="space-y-3 p-3 xl:hidden">
              {filteredReports.map((item, index) => {
                const row = asLineItem(item);
                const tax = getSalesLineTax(item);
                return (
                  <div
                    key={`${item.invoice_number || "invoice"}-${row.order_line_id ?? row.item_reference_id ?? index}-${index}`}
                    className="overflow-hidden rounded-xl border border-[#DCE6F2] bg-white"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Invoice Number
                          </p>
                          <p className="mt-1 break-all text-sm font-bold text-gray-900">
                            {valueOrDash(item.invoice_number)}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {formatDate(item.invoice_date)}
                          </p>
                          {row.order_reference && (
                            <p className="mt-1 break-all text-xs font-medium text-[#2D6FE8]">
                              {row.order_reference}
                            </p>
                          )}
                        </div>
                        <StatusBadge status={item.order_status} />
                      </div>
                      <div className="mt-4 rounded-lg bg-[#F7FAFE] p-3">
                        <p className="text-sm font-semibold text-gray-800">
                          {valueOrDash(item.customer_name)}
                        </p>
                        <p className="mt-1 break-all text-xs font-medium text-[#2D6FE8]">
                          Mobile: {valueOrDash(item.customer_mobile)}
                        </p>
                        <p className="mt-1 break-all text-xs text-gray-500">
                          {valueOrDash(item.customer_email)}
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <p className="break-all text-gray-600">
                            GSTIN:{" "}
                            <span className="font-semibold">
                              {getGstinNumber(item)}
                            </span>
                          </p>
                          <p className="break-words text-gray-600">
                            State:{" "}
                            <span className="font-semibold">
                              {valueOrDash(getPlaceOfSupply(item))}
                            </span>
                          </p>
                          <p className="capitalize text-gray-500">
                            {valueOrDash(item.account_type)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 rounded-lg border border-[#E8EEF6] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Product Item
                          </p>
                          <span className="rounded-full bg-[#EAF3FF] px-2 py-1 text-xs font-semibold text-[#1E40AF]">
                            Qty: {getQuantity(item)}
                          </span>
                        </div>
                        <p className="mt-1 break-words text-sm font-semibold text-gray-800">
                          {valueOrDash(getProductName(item))}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                          <span>Code: {valueOrDash(getProductCode(item))}</span>
                          <span>
                            Category: {valueOrDash(getProductCategory(item))}
                          </span>
                          <span>HSN: {valueOrDash(getHsnCode(item))}</span>
                          <span>GST: {getGstPercentage(item) || "—"}</span>
                        </div>
                        {row.item_reference_id && (
                          <p className="mt-1 break-all text-xs text-gray-400">
                            Item Ref: {row.item_reference_id}
                          </p>
                        )}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Product Total (excl. GST)
                          </p>
                          <p className="mt-1 break-words text-xs font-semibold text-gray-800">
                            {money(getLineSubtotal(item))}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Product GST
                          </p>
                          <p className="mt-1 break-words text-xs font-semibold text-gray-800">
                            {money(getLineGst(item))}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Shipping (excl. GST)
                          </p>
                          <p className="mt-1 break-words text-xs font-semibold text-gray-800">
                            {money(getLineShipping(item))}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Shipping GST
                          </p>
                          <p className="mt-1 break-words text-xs font-semibold text-gray-800">
                            {money(getLineShippingGst(item))}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Unit Price (excl. GST)
                          </p>
                          <p className="mt-1 break-words text-xs font-semibold text-gray-700">
                            {money(row.unit_price_without_gst)}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Payment Gateway
                          </p>
                          <p className="mt-1 break-words text-xs font-semibold text-gray-700">
                            {valueOrDash(item.payment_gateway)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 rounded-lg border border-[#DCE6F2] bg-[#F7FAFE] p-3">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <p className="text-xs font-bold uppercase tracking-wide text-gray-600">
                            GST Tax Breakdown
                          </p>
                          <span className="rounded-full bg-[#EAF3FF] px-2.5 py-1 text-xs font-semibold text-[#1E40AF]">
                            Product-line GST
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            ["CGST", tax.cgst],
                            ["SGST", tax.sgst],
                            ["IGST", tax.igst],
                            ["Total Tax", tax.total],
                          ].map(([label, amount]) => (
                            <div
                              key={String(label)}
                              className="rounded-lg border border-[#E8EEF6] bg-white p-2.5"
                            >
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                {label}
                              </p>
                              <p className="mt-1 break-words text-xs font-bold text-gray-800">
                                {amount === null ? "—" : money(Number(amount))}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3 border-t border-[#E8EEF6] pt-3">
                        <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                          <Truck size={12} /> Courier & Tracking
                        </p>
                        <CourierDetails item={item} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#E8EEF6] pt-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Order Date
                          </p>
                          <p className="mt-1 break-words text-xs text-gray-500">
                            {formatDate(item.order_date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Item Total
                          </p>
                          <p className="mt-1 break-words text-xs font-bold text-gray-800">
                            {money(getLineGross(item))}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Service Charge
                          </p>
                          <p className="mt-1 break-words text-xs font-bold text-gray-800">
                            {money(getLineServiceCharge(item))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* CURRENT PAGE TOTALS */}
            <div className="border-t border-slate-200 bg-[#F1F6FB] px-4 py-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Current page totals
                </h3>
                <span className="text-xs text-slate-500">
                  {filteredReports.length} visible product lines
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 xl:grid-cols-6">
                {[
                  ["Quantity", displayNumber(pageSummary.quantity)],
                  [
                    "Product subtotal",
                    displayMoney(pageSummary.productSubtotal),
                  ],
                  [
                    "Shipping excl. GST",
                    displayMoney(pageSummary.shippingBase),
                  ],
                  ["Sub Total", displayMoney(pageSummary.subtotal)],
                  ["Total GST", displayMoney(pageSummary.gst)],
                  ["Total Sales", displayMoney(pageSummary.sales)],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p
                      className={`mt-1 break-words text-sm font-bold tabular-nums ${label === "Total Sales" ? "text-[#1E40AF]" : "text-slate-900"}`}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            {/* PAGINATION */}
            <div className="flex flex-col justify-between gap-3 border-t border-[#DCE6F2] px-4 py-3 sm:flex-row sm:items-center">
              <p className="text-xs text-gray-500">
                Showing product rows{" "}
                <span className="font-semibold text-gray-800">
                  {startRecord}–{endRecord}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-800">
                  {displayTotal}
                </span>
                <span className="ml-1 text-gray-400">
                  ({filteredReports.length} product rows on this page)
                </span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={displayPage <= 1 || loading}
                  onClick={() => setCurrentPage(Math.max(1, displayPage - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE6F2] text-gray-600 hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="min-w-[85px] text-center text-xs font-semibold text-gray-700">
                  Page {displayPage} of {displayLastPage}
                </span>
                <button
                  type="button"
                  disabled={displayPage >= displayLastPage || loading}
                  onClick={() =>
                    setCurrentPage(Math.min(displayLastPage, displayPage + 1))
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE6F2] text-gray-600 hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default FinanceReport;
