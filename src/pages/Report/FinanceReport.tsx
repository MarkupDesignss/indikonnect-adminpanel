"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  Filter,
  CalendarDays,
  Loader2,
  ShieldAlert,
  Receipt,
  Wallet,
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

/* ================================================================
   THEME & CONSTANTS
================================================================ */

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

const formatReportValue = (field: string, value: unknown): string => {
  const raw = value == null ? "" : String(value);
  if (field === "Account Type") {
    return raw
      .trim()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
  }
  return ["Order Status", "Item Delivery Status"].includes(field)
    ? raw.replace(/_/g, " ")
    : raw;
};

/* ================================================================
   API TYPES
================================================================ */

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
  item_delivery_status?: string | null;
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

/* ================================================================
   GENERAL HELPERS
================================================================ */

const money = (value: number | string | null | undefined) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const numberValue = (value: number | string | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const optionalNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

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

const parseExcelDate = (
  value: unknown,
  dateOnly = false,
): Date | string | null => {
  const raw = trimmedValue(value);
  if (!raw) return null;

  const match = raw.match(
    /^(\d{2})-(\d{2})-(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (match) {
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
  }

  const iso = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (iso) {
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
  }
  return raw;
};

/* ================================================================
   DATE FILTER HELPERS
================================================================ */

type ReportDateRange = { from: string; to: string };
const EMPTY_DATE_RANGE: ReportDateRange = { from: "", to: "" };

const normalizeReportDate = (value: unknown): string => {
  const raw = trimmedValue(value);
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?=$|[T ])/);
  const dmy = raw.match(/^(\d{2})-(\d{2})-(\d{4})(?=$|[T ])/);
  const key = iso
    ? `${iso[1]}-${iso[2]}-${iso[3]}`
    : dmy
      ? `${dmy[3]}-${dmy[2]}-${dmy[1]}`
      : "";
  if (!key) return "";
  const parsed = new Date(`${key}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === key
    ? key
    : "";
};

const matchesOrderDateRange = (
  item: FinanceReportItem,
  range: ReportDateRange,
): boolean => {
  if (!range.from && !range.to) return true;
  const date = normalizeReportDate(item.order_date);
  return Boolean(date && date >= range.from && date <= range.to);
};

/* ================================================================
   PRODUCT / GST / SHIPPING HELPERS
================================================================ */

const getProductName = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  if (row.product_name?.trim()) return row.product_name.trim();
  if (Array.isArray(row.products) && row.products.length > 0) {
    return row.products
      .map((product) => product.name?.trim() || product.product_code?.trim() || "Product")
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

const isValidHsn = (value: string) => /^\d{4}(?:\d{2}){0,2}$/.test(value);

const getHsnCode = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  const directHsn = trimmedValue(row.hsn_code);
  if (directHsn && isValidHsn(directHsn)) return directHsn;
  if (Array.isArray(row.products) && row.products.length > 0) {
    return row.products
      .map((product) => trimmedValue(product.hsn_code))
      .filter((hsn) => Boolean(hsn) && isValidHsn(hsn))
      .join(" | ");
  }
  return "";
};

const getQuantity = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  if (row.quantity !== null && row.quantity !== undefined && row.quantity !== "") {
    return numberValue(row.quantity);
  }
  if (Array.isArray(row.products) && row.products.length > 0) {
    return row.products.reduce((sum, product) => sum + numberValue(product.quantity), 0);
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
  return trimmedValue(row.place_of_supply) || trimmedValue(row.delivery_state);
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

const getProductCategory = (item: FinanceReportItem): string => {
  const row = item as unknown as Record<string, unknown>;
  const categoryText = (value: unknown): string => {
    if (typeof value === "string") return value.trim();
    if (value && typeof value === "object") {
      const category = value as Record<string, unknown>;
      return (
        [category.name, category.category_name, category.title].find(
          (name): name is string => typeof name === "string" && name.trim().length > 0,
        )?.trim() || ""
      );
    }
    return "";
  };
  const product = row.product && typeof row.product === "object"
    ? (row.product as Record<string, unknown>)
    : {};
  return [
    row.product_category_name,
    row.product_head,
    row.product_head_name,
    row.category_name,
    row.product_category,
    row.category,
    product.category_name,
    product.product_head,
    product.category,
  ].map(categoryText).find(Boolean) || "";
};

/* ================================================================
   FINANCIAL CALCULATIONS

   Assumptions retained from the existing report:
   - unit_price_without_gst is the net taxable unit price.
   - line shipping base is for the complete product line.
   - shipping GST uses its own rate when supplied; otherwise product GST.
   - no additional GST is calculated on service charge.
================================================================ */

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
  return roundMoney(numberValue(row.unit_price_without_gst) * getQuantity(item));
};

const getLineGst = (item: FinanceReportItem) =>
  roundMoney((getLineSubtotal(item) * numberValue(asLineItem(item).line_tax_rate)) / 100);

const getLineShipping = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  return roundMoney(numberValue(row.line_shipping_charge_without_gst ?? row.shipping_charge_without_gst));
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
  roundMoney(numberValue(asLineItem(item).service_charge_per_unit) * getQuantity(item));

const getLineCombinedSubtotal = (item: FinanceReportItem) =>
  roundMoney(getLineSubtotal(item) + getLineShipping(item));

const getTaxRegime = (item: FinanceReportItem): "intra" | "inter" | null => {
  const row = asLineItem(item);
  const type = trimmedValue(row.tax_type ?? row.gst_type)
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  if (["igst", "inter", "interstate"].includes(type)) return "inter";
  if (["cgstsgst", "sgstcgst", "intra", "intrastate"].includes(type)) return "intra";

  const supplier = trimmedValue(row.supplier_state ?? row.seller_state).toLowerCase();
  const supply = trimmedValue(row.place_of_supply ?? row.delivery_state ?? row.billing_state).toLowerCase();
  if (supplier && supply) return supplier === supply ? "intra" : "inter";

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
  return { total, cgst: null, sgst: null, igst: null };
};

const getLineGross = (item: FinanceReportItem) =>
  roundMoney(
    getLineCombinedSubtotal(item) +
      getSalesLineTax(item).total +
      getLineServiceCharge(item),
  );

const getInvoiceKey = (item: FinanceReportItem, index: number) => {
  const row = asLineItem(item);
  return String(row.order_reference || item.invoice_number || `missing-invoice-${index}`);
};

/* ================================================================
   STATUS & SALES EXPORT MAPPING
================================================================ */

const statusStyle = (status: string | null | undefined) => {
  const value = (status || "").toLowerCase();
  if (value.startsWith("partial")) return { bg: THEME.orangeSoft, color: THEME.orange };
  if (["delivered", "completed", "paid"].includes(value)) return { bg: THEME.greenSoft, color: THEME.green };
  if (value.includes("ship")) return { bg: THEME.purpleSoft, color: THEME.purple };
  if (value.includes("refund") || value.includes("cancel")) return { bg: THEME.redSoft, color: THEME.red };
  if (value.includes("dispatch") || value.includes("confirm")) return { bg: THEME.primarySoft, color: THEME.primaryDark };
  return { bg: THEME.orangeSoft, color: THEME.orange };
};

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
  "Place Of Supply (POS)",
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
  "Item Delivery Status",
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

const buildSalesRows = (items: FinanceReportItem[]) => {
  const seenOrders = new Set<string>();
  const ordersWithLineCv = new Set(
    items.flatMap((item, index) =>
      optionalNumber(asLineItem(item).line_cv) === null ? [] : [getInvoiceKey(item, index)],
    ),
  );
  const ordersWithLineDiscount = new Set(
    items.flatMap((item, index) =>
      optionalNumber(asLineItem(item).line_discount_amount) === null ? [] : [getInvoiceKey(item, index)],
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
    const shipping = roundMoney(getLineShipping(item) + getLineShippingGst(item));

    const discount =
      optionalNumber(row.line_discount_amount) ??
      (firstOrderRow && !ordersWithLineDiscount.has(orderKey)
        ? optionalNumber(row.discount_amount)
        : optionalNumber(row.discount_amount) === 0
          ? 0
          : null);

    return [
      row.order_reference || "",
      row.item_reference_id || "",
      item.invoice_number || "",
      parseExcelDate(item.invoice_date, true),
      parseExcelDate(item.order_date),
      getProductName(item),
      getProductCategory(item),
      getProductCode(item),
      getQuantity(item),
      total,
      discount,
      optionalNumber(row.line_cv) ??
        (firstOrderRow && !ordersWithLineCv.has(orderKey) ? optionalNumber(row.cv) : null),
      tax.total,
      tax.cgst,
      tax.sgst,
      tax.igst,
      optionalNumber(row.line_tax_rate),
      getHsnCode(item),
      item.customer_name || "",
      row.customer_gstin || "",
      getPlaceOfSupply(item) || trimmedValue(row.billing_state),
      getPlaceOfSupply(item),
      shipping,
      optionalNumber(row.unit_price_without_gst),
      getLineSubtotal(item),
      getLineGst(item),
      getLineShipping(item),
      subtotal,
      getLineShippingGst(item),
      optionalNumber(row.service_charge_per_unit),
      getLineServiceCharge(item),
      total,
      item.order_status || "",
      row.item_delivery_status || "",
      parseExcelDate(row.confirmed_at),
      parseExcelDate(row.dispatched_at),
      parseExcelDate(row.delivered_at),
      item.account_type || "",
      item.user_name || "",
      trimmedValue(item.customer_mobile),
      item.customer_email || "",
      row.billing_state || "",
      item.payment_gateway || "",
      item.gateway_transaction_id || "",
      couriers.map((courier) => courier.courier_company || "").join(" | "),
      couriers.map((courier) => courier.courier_tracking_number || "").join(" | "),
    ];
  });
};

/* ================================================================
   GST REGISTRATION FILTER & POS FORMAT
================================================================ */

type GstRegistrationFilter = "" | "URP" | "Registered";

const salesGstRegistration = (item: FinanceReportItem): "URP" | "Registered" | "" => {
  const gstin = trimmedValue(asLineItem(item).customer_gstin).toUpperCase();
  return !gstin ? "" : gstin === "URP" ? "URP" : "Registered";
};

const isReportableSale = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  return (
    trimmedValue(item.order_status).toLowerCase() !== "confirmed" &&
    trimmedValue(row.item_delivery_status).toLowerCase() !== "confirmed"
  );
};

const filterByGstRegistration = (
  items: FinanceReportItem[],
  filter: GstRegistrationFilter,
) =>
  items.filter(
    (item) => isReportableSale(item) && (!filter || salesGstRegistration(item) === filter),
  );

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

const stateKey = (value: string) =>
  value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");

const formatPos = (item: FinanceReportItem) => {
  const raw = getPlaceOfSupply(item);
  const code = raw.match(/^(\d{2})(?:\s*[-–:]\s*.*)?$/)?.[1];
  if (code && GST_STATES[code]) return GST_STATES[code];
  const aliases: Record<string, string> = {
    newdelhi: "07",
    orissa: "21",
    pondicherry: "34",
    uttaranchal: "05",
    damananddiu: "26",
    dadraandnagarhaveli: "26",
  };
  const key = stateKey(raw);
  const matched = aliases[key] || Object.keys(GST_STATES).find((k) => stateKey(GST_STATES[k]) === key);
  return matched ? GST_STATES[matched] : raw;
};

/* ================================================================
   COMPACT GST EXPORT SHEETS
================================================================ */

const URP_HEADERS = [
  "Invoice Number",
  "Invoice date",
  "Customer Name",
  "Customer Email",
  "Place Of Supply (POS)",
  "Rate",
  "Taxable Value",
  "CGST",
  "SGST",
  "IGST",
  "Invoice Value",
];

type CompactSalesCell = string | number | Date | null;

const buildCompactSalesRows = (
  items: FinanceReportItem[],
  detailed: boolean,
): CompactSalesCell[][] => {
  const result: CompactSalesCell[][] = [];
  for (const item of items) {
    const row = asLineItem(item);
    const prefix: CompactSalesCell[] = [
      trimmedValue(item.invoice_number),
      parseExcelDate(item.invoice_date, true),
      trimmedValue(item.customer_name),
      trimmedValue(item.customer_email),
      formatPos(item),
    ];
    const suffix: CompactSalesCell[] = detailed
      ? [
          trimmedValue(row.customer_gstin),
          getProductName(item),
          trimmedValue(row.item_reference_id ?? row.order_line_id),
        ]
      : [];

    const rate = numberValue(row.line_tax_rate);
    const shipRate = getShippingTaxRate(item);
    const shipping = getLineShipping(item);
    const tax = getSalesLineTax(item);
    const add = (
      rateValue: number,
      base: number,
      cgst: number | null,
      sgst: number | null,
      igst: number | null,
      gross: number,
    ) => result.push([...prefix, rateValue, base, cgst, sgst, igst, gross, ...suffix]);

    if (!shipping || rate === shipRate) {
      add(rate, getLineCombinedSubtotal(item), tax.cgst, tax.sgst, tax.igst, getLineGross(item));
    } else {
      const productTax = getLineGst(item);
      const regime = getTaxRegime(item);
      const central = regime === "intra"
        ? Math.ceil(Math.round(productTax * 100) / 2) / 100
        : regime === "inter" || productTax === 0
          ? 0
          : null;
      const state = regime === "intra" && central !== null
        ? roundMoney(productTax - central)
        : central === null
          ? null
          : 0;
      const integrated = regime === "inter" ? productTax : central === null ? null : 0;
      const rest = (a: number | null, b: number | null) =>
        a === null || b === null ? null : roundMoney(a - b);

      add(
        rate,
        getLineSubtotal(item),
        central,
        state,
        integrated,
        roundMoney(getLineSubtotal(item) + productTax + getLineServiceCharge(item)),
      );
      add(
        shipRate,
        shipping,
        rest(tax.cgst, central),
        rest(tax.sgst, state),
        rest(tax.igst, integrated),
        roundMoney(shipping + getLineShippingGst(item)),
      );
    }
  }
  return result;
};

const getCompactSalesHeaders = (detailed: boolean) => [
  ...URP_HEADERS,
  ...(detailed ? ["GSTIN NO", "Product Name", "Item Reference ID"] : []),
];

const addCompactSalesSheet = (
  workbook: ExcelJS.Workbook,
  name: string,
  items: FinanceReportItem[],
  detailed: boolean,
) => {
  const headers = getCompactSalesHeaders(detailed);
  const rows = buildCompactSalesRows(items, detailed);
  const sheet = workbook.addWorksheet(name, {
    views: [{ state: "frozen", ySplit: 1, zoomScale: 80, showGridLines: false }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  const defaultWidths = [22, 15, 24, 34, 25, 9, 17, 14, 14, 14, 18, 20, 28, 22];
  sheet.columns = headers.map((_, i) => ({
    width: Math.min(
      34,
      rows.reduce(
        (max, row) => Math.max(max, (row[i] instanceof Date ? 12 : String(row[i] ?? "").length) + 3),
        defaultWidths[i] || 18,
      ),
    ),
  }));

  const edge: Partial<ExcelJS.Border> = { style: "thin", color: { argb: "FFD3DFEB" } };
  const header = sheet.addRow(headers);
  header.height = 32;
  header.eachCell((cell) => {
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF173B63" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = { top: edge, bottom: edge, left: edge, right: edge };
  });

  rows.forEach((values, index) => {
    const line = sheet.addRow(values);
    line.height = Math.min(
      120,
      Math.max(24, ...values.map((value, i) => {
        const width = Math.max(5, (sheet.getColumn(i + 1).width ?? 20) - 3);
        return 14 * Math.max(1, Math.ceil((value instanceof Date ? 12 : String(value ?? "").length) / width)) + 6;
      })),
    );
    headers.forEach((heading, i) => {
      const cell = line.getCell(i + 1);
      const numberCol = ["Rate", "Taxable Value", "CGST", "SGST", "IGST", "Invoice Value"].includes(heading);
      const isInvoiceValue = heading === "Invoice Value";
      cell.font = { name: "Calibri", size: 11, bold: isInvoiceValue, color: { argb: "FF173B63" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: isInvoiceValue ? "FFDCEEFF" : index % 2 ? "FFF3F7FC" : "FFFFFFFF" },
      };
      cell.alignment = { horizontal: numberCol ? "right" : "left", vertical: "top", wrapText: true };
      cell.border = { top: edge, bottom: edge, left: edge, right: edge };
      cell.numFmt = heading === "Invoice date" ? "dd-mmm-yy" : heading === "Rate" ? "0.##" : numberCol ? "#,##0.00" : "@";
    });
  });
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: rows.length + 1, column: headers.length } };
};

/* ================================================================
   CSV EXPORT HELPERS
================================================================ */

type SalesCsvFile = { name: string; csv: string };

const serializeSalesCsv = (headers: string[], rows: unknown[][], includeTime = false) => {
  const escapeCell = (value: unknown) => {
    let text = value instanceof Date
      ? value.toISOString().slice(0, includeTime ? 16 : 10).replace("T", " ")
      : String(value ?? "");
    if (typeof value === "string" && (/^\s*[=+@-]/.test(text) || /^[\t\r\n]/.test(text))) {
      text = "'" + text;
    }
    return `"${text.replace(/"/g, '""')}"`;
  };
  return "\uFEFF" + [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
};

const buildSeparatedSalesCsv = (
  items: FinanceReportItem[],
  filter: GstRegistrationFilter,
): SalesCsvFile[] => {
  const selected = filterByGstRegistration(items, filter);
  const groups: Array<GstRegistrationFilter> = filter ? [filter] : ["URP", "Registered", ""];
  const files: SalesCsvFile[] = [];

  if (!filter && selected.length) {
    const headers = ["GST Type", ...SALES_HEADERS];
    const rows = buildSalesRows(selected).map((row, index) => [
      salesGstRegistration(selected[index]) || "Missing GSTIN",
      ...row.map((value, i) =>
        typeof value === "string" && SALES_HEADERS[i] === "Account Type"
          ? formatReportValue(SALES_HEADERS[i], value)
          : value,
      ),
    ]);
    files.push({ name: "sales-all.csv", csv: serializeSalesCsv(headers, rows, true) });
  }

  for (const group of groups) {
    const groupItems = selected.filter((item) => salesGstRegistration(item) === group);
    if (!groupItems.length) continue;
    const detailed = filter !== "URP";
    const name = group === "URP"
      ? "sales-unregistered.csv"
      : group === "Registered"
        ? "sales-registered.csv"
        : "sales-missing-gstin.csv";
    files.push({
      name,
      csv: serializeSalesCsv(getCompactSalesHeaders(detailed), buildCompactSalesRows(groupItems, detailed)),
    });
  }
  return files;
};

const zipSalesCsvFiles = (files: SalesCsvFile[]): Blob => {
  const encoder = new TextEncoder();
  const crc32 = (bytes: Uint8Array) => {
    let crc = 0xffffffff;
    for (const byte of bytes) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
  };

  const locals: ArrayBuffer[] = [];
  const directory: ArrayBuffer[] = [];
  let offset = 0;
  let directorySize = 0;

  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.csv);
    const crc = crc32(data);
    const local = new ArrayBuffer(30 + name.length);
    const localView = new DataView(local);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(12, 0x0021, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, name.length, true);
    new Uint8Array(local).set(name, 30);

    const central = new ArrayBuffer(46 + name.length);
    const centralView = new DataView(central);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(14, 0x0021, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint32(42, offset, true);
    new Uint8Array(central).set(name, 46);

    const payload = new ArrayBuffer(data.length);
    new Uint8Array(payload).set(data);
    locals.push(local, payload);
    directory.push(central);
    offset += local.byteLength + data.length;
    directorySize += central.byteLength;
    if (offset + directorySize > 0xffffffff - 22) throw new Error("CSV archive is too large for ZIP export.");
  }

  const end = new ArrayBuffer(22);
  const endView = new DataView(end);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, directorySize, true);
  endView.setUint32(16, offset, true);
  return new Blob([...locals, ...directory, end], { type: "application/zip" });
};

/* ================================================================
   SUMMARY HELPERS
================================================================ */

const summarizeSales = (items: FinanceReportItem[]) => {
  const rows = buildSalesRows(items);
  const sum = (heading: string): number | null => {
    const index = SALES_HEADERS.indexOf(heading);
    const values = rows
      .map((row) => row[index])
      .filter((value): value is number => typeof value === "number");
    if (["CGST", "SGST", "IGST"].includes(heading) && values.length !== rows.length) return null;
    return values.length
      ? roundMoney(values.reduce((total, value) => total + value, 0))
      : rows.length
        ? null
        : 0;
  };

  return {
    orders: new Set(items.map((item, index) => getInvoiceKey(item, index))).size,
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

const displayMoney = (amount: number | null | undefined) => amount == null ? "—" : money(amount);
const displayNumber = (amount: number | null | undefined) => amount == null ? "—" : amount.toLocaleString("en-IN");

/* ================================================================
   SMALL UI COMPONENTS
================================================================ */

function StatusBadge({ status }: { status: string | null | undefined }) {
  const style = statusStyle(status);
  return (
    <span
      className="inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize"
      style={{ background: style.bg, color: style.color }}
    >
      {formatReportValue("Order Status", status) || "—"}
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
        <p className="text-[13px] font-semibold text-slate-600">{title}</p>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: bg, color }}>
          <Icon size={18} />
        </div>
      </div>
      <h3 className="mt-2 break-words text-xl font-bold tracking-tight text-slate-900 tabular-nums sm:text-2xl">
        {value}
      </h3>
      <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{subtitle}</p>
    </div>
  );
}

/* Compact value-only cells: no repeated field labels. */
function AccountDetails({ item }: { item: FinanceReportItem }) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="break-words text-[13px] font-medium leading-5 text-slate-900">
        {valueOrDash(item.customer_name)}
      </p>
      <p className="break-all text-[12px] leading-4 text-slate-500">
        {getGstinNumber(item)}
      </p>
    </div>
  );
}

/* Product name and GST rate only; the GST label is intentionally omitted. */
function ProductDetails({ item }: { item: FinanceReportItem }) {
  return (
    <div className="min-w-0 w-full max-w-full">
      <p className="line-clamp-2 text-[13px] font-medium leading-5 text-gray-800">
        {valueOrDash(getProductName(item))}
      </p>
      <span className="mt-1 inline-flex rounded-md bg-blue-50 px-2 py-0.5 text-[12px] font-medium text-blue-700">
        {getGstPercentage(item) || "—"}
      </span>
    </div>
  );
}

/* Show the courier value without a field heading. */
function CourierDetails({ item }: { item: FinanceReportItem }) {
  const couriers = getCouriers(item);
  if (!couriers.length) {
    return <span className="text-[12px] text-gray-400">—</span>;
  }
  const firstCourier = couriers[0];
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-[12px] font-medium leading-4 text-gray-600">
        <Truck size={12} className="shrink-0 text-[#2D6FE8]" />
        <span className="truncate">{valueOrDash(firstCourier.courier_company)}</span>
        {couriers.length > 1 && (
          <span className="shrink-0 text-[11px] text-gray-400">+{couriers.length - 1}</span>
        )}
      </p>
    </div>
  );
}

/* One concise tax value; avoid repeating the same amount as Total GST. */
function TaxBreakdownDetails({ item }: { item: FinanceReportItem }) {
  const tax = getSalesLineTax(item);
  const regime = getTaxRegime(item);

  if (tax.total === 0) {
    return <p className="text-[12px] font-medium text-gray-600">₹0.00</p>;
  }

  if (regime === "inter") {
    return (
      <p className="break-words text-[12px] font-medium leading-5 text-gray-700">
        IGST {tax.igst === null ? "—" : money(tax.igst)}
      </p>
    );
  }

  if (regime === "intra") {
    return (
      <p className="break-words text-[12px] font-medium leading-5 text-gray-700">
        CGST {tax.cgst === null ? "—" : money(tax.cgst)}
        <span className="text-gray-400"> · </span>
        SGST {tax.sgst === null ? "—" : money(tax.sgst)}
      </p>
    );
  }

  return <p className="text-[12px] font-medium text-gray-600">{money(tax.total)}</p>;
}

/* ================================================================
   MAIN REPORT COMPONENT
================================================================ */

const FinanceReport = () => {
  const {
    hasPermission,
    hasModuleAccess,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  const canViewReport = useMemo(() => {
    if (isSuperAdmin) return true;
    return hasModuleAccess("finance_sales_report") || hasPermission("finance_sales_report.view");
  }, [isSuperAdmin, hasModuleAccess, hasPermission]);

  const canExport = useMemo(() => {
    if (isSuperAdmin) return true;
    return hasPermission("finance_sales_report.download");
  }, [isSuperAdmin, hasPermission]);

  /* Logo */
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
          (value) => typeof value === "string" && /^https?:\/\//i.test(value.trim()),
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

  /* Report state */
  const [exporting, setExporting] = useState(false);
  const [gstFilter, setGstFilter] = useState<GstRegistrationFilter>("");
  const [draftRange, setDraftRange] = useState<ReportDateRange>(EMPTY_DATE_RANGE);
  const [appliedRange, setAppliedRange] = useState<ReportDateRange>(EMPTY_DATE_RANGE);
  const hasPendingDateChanges = draftRange.from !== appliedRange.from || draftRange.to !== appliedRange.to;
  const [currentPage, setCurrentPage] = useState(1);
  const [overviewRows, setOverviewRows] = useState<FinanceReportItem[] | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState(false);
  const [overviewRevision, setOverviewRevision] = useState(0);
  const loading = overviewLoading;
  const refreshing = overviewLoading;

  /* Fetch every API page so filters, totals, pagination and exports use one snapshot. */
  const fetchAllReportRows = useCallback(async (isActive: () => boolean) => {
    const allItems: FinanceReportItem[] = [];
    let page = 1;
    let pages = 1;
    do {
      if (!isActive()) return [];
      const response = await financeReportApi.getAll({ page, per_page: PER_PAGE });
      const body = typeof (response as any)?.success === "boolean"
        ? response
        : ((response as any)?.data ?? response);
      if ((body as any)?.success === false) {
        throw new Error((body as any).message || "Unable to load finance report");
      }
      const payload = (body as any)?.data ?? body;
      const rows = Array.isArray(payload) ? payload : (payload as any)?.data;
      if (!Array.isArray(rows)) throw new Error("Invalid finance report response");
      allItems.push(...(rows as FinanceReportItem[]).filter(isReportableSale));
      const last = Number(
        (payload as any)?.last_page ??
          (body as any)?.meta?.last_page ??
          (response as any)?.meta?.last_page ??
          1,
      );
      pages = Number.isFinite(last) ? Math.max(1, Math.floor(last)) : 1;
      page += 1;
    } while (page <= pages);
    return allItems;
  }, []);

  useEffect(() => {
    if (permissionsLoading) return;
    if (!canViewReport) {
      setOverviewRows(null);
      setOverviewLoading(false);
      return;
    }

    let active = true;
    setOverviewRows(null);
    setOverviewLoading(true);
    setOverviewError(false);
    fetchAllReportRows(() => active)
      .then((items) => {
        if (active) setOverviewRows(items);
      })
      .catch((error) => {
        console.error("Finance report error:", error);
        if (active) {
          setOverviewError(true);
          toast.error("Unable to load all report pages. Please retry.");
        }
      })
      .finally(() => {
        if (active) setOverviewLoading(false);
      });
    return () => {
      active = false;
    };
  }, [permissionsLoading, canViewReport, fetchAllReportRows, overviewRevision]);

  const refreshReport = () => {
    setOverviewLoading(true);
    setOverviewRows(null);
    setOverviewError(false);
    setOverviewRevision((value) => value + 1);
    setCurrentPage(1);
  };

  const matchedReports = useMemo(
    () => filterByGstRegistration(overviewRows ?? [], gstFilter).filter((item) => matchesOrderDateRange(item, appliedRange)),
    [overviewRows, gstFilter, appliedRange],
  );

  const totalRecords = matchedReports.length;
  const lastPage = Math.max(1, Math.ceil(totalRecords / PER_PAGE));
  const safePage = Math.min(currentPage, lastPage);
  const filteredReports = useMemo(
    () => matchedReports.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE),
    [matchedReports, safePage],
  );

  const summary = useMemo(
    () => overviewRows === null || matchedReports.some(hasMissingCalculationInputs)
      ? null
      : summarizeSales(matchedReports),
    [overviewRows, matchedReports],
  );
  const pageSummary = useMemo(() => summarizeSales(filteredReports), [filteredReports]);
  void pageSummary;

  const summaryMoney = (value: number | null | undefined) => loading ? "…" : displayMoney(value);
  const summaryNumber = (value: number | null | undefined) => loading ? "…" : displayNumber(value);
  void summaryNumber;

  const canDownload =
    canExport &&
    !exporting &&
    !loading &&
    !overviewError &&
    !hasPendingDateChanges &&
    matchedReports.length > 0 &&
    summary !== null;

  const datePeriod = appliedRange.from && appliedRange.to
    ? `${appliedRange.from} to ${appliedRange.to}`
    : "All available dates";
  const exportDateSuffix = appliedRange.from && appliedRange.to
    ? `${appliedRange.from}_to_${appliedRange.to}`
    : formatDateInput(new Date());
  const filterDescription = [
    gstFilter ? `GST Registration: ${formatReportValue("GST Registration", gstFilter)}` : "",
    appliedRange.from ? `Order Date: ${datePeriod}` : "",
  ].filter(Boolean).join(" | ");

  const applyDateRange = () => {
    if (!draftRange.from || !draftRange.to) {
      toast.error("Select both From Date and To Date.");
      return;
    }
    if (!normalizeReportDate(draftRange.from) || !normalizeReportDate(draftRange.to)) {
      toast.error("Select valid dates.");
      return;
    }
    if (draftRange.from > draftRange.to) {
      toast.error("From date cannot be greater than To date");
      return;
    }
    setAppliedRange({ ...draftRange });
    setCurrentPage(1);
  };

  const resetDateRange = () => {
    setDraftRange(EMPTY_DATE_RANGE);
    setAppliedRange(EMPTY_DATE_RANGE);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setGstFilter("");
    resetDateRange();
  };

  const urpExport = gstFilter === "URP";

  /* CSV export */
  const exportCSV = () => {
    if (!canExport) {
      toast.error("You don't have permission to export this report.");
      return;
    }
    if (!canDownload) return;
    try {
      const selectedFilter = gstFilter;
      const exportItems = filterByGstRegistration(matchedReports, selectedFilter);
      const files = buildSeparatedSalesCsv(exportItems, selectedFilter);
      if (!files.length) {
        toast.error("No finance records available to export");
        return;
      }
      const blob = selectedFilter
        ? new Blob([files[0].csv], { type: "text/csv;charset=utf-8;" })
        : zipSalesCsvFiles(files);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = selectedFilter
        ? files[0].name.replace(/\.csv$/, `-${exportDateSuffix}.csv`)
        : `sales-gst-wise-${exportDateSuffix}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(`${exportItems.length} matching product lines exported`);
    } catch (error) {
      console.error("CSV export error:", error);
      toast.error("Failed to export Sales Data");
    }
  };

  /* Excel export - detailed Sales Data plus GST-specific worksheets. */
  const exportExcel = async () => {
    if (!canExport) {
      toast.error("You don't have permission to export this report.");
      return;
    }
    if (!canDownload) return;
    setExporting(true);

    try {
      const exportItems = matchedReports;
      if (exportItems.some(hasMissingCalculationInputs)) {
        throw new Error("Cannot calculate sales: quantity, taxable unit price, GST rate or shipping base is missing.");
      }
      const rows = buildSalesRows(exportItems).map((row) =>
        row.map((value, index) =>
          typeof value === "string" && SALES_HEADERS[index] === "Account Type"
            ? formatReportValue(SALES_HEADERS[index], value)
            : value,
        ),
      );
      if (!rows.length) {
        toast.error("No finance records available to export");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "IndieKonnect";
      workbook.calcProperties.fullCalcOnLoad = true;

      if (urpExport) {
        addCompactSalesSheet(workbook, "URP Sales", exportItems, false);
      } else {
        /* Simple overview worksheet */
        const overview = workbook.addWorksheet("Sales Overview", {
          views: [{ state: "frozen", xSplit: 3, ySplit: 5, showGridLines: false }],
          properties: { defaultRowHeight: 25 },
        });
        const overviewColumns = [
          { source: "Invoice Number", label: "Invoice No.", width: 18 },
          { source: "Customer Name", label: "Customer Name", width: 25 },
          { source: "Customer Email", label: "Customer Email", width: 31 },
          { source: "Place Of Supply (POS)", label: "Place Of Supply (POS)", width: 25 },
          { source: "User Name", label: "User Name", width: 22 },
          { source: "Account Type", label: "Account Type", width: 20 },
          { source: "Product Name", label: "Product Name", width: 33 },
          { source: "Product Head", label: "Product Category", width: 23 },
          { source: "Quantity", label: "Qty", width: 9 },
          { source: "Product Subtotal Without GST", label: "Product Amount\n(before tax)", width: 19 },
          { source: "Shipping Charges Without GST", label: "Shipping\n(before tax)", width: 17 },
          { source: "Sub Total", label: "Subtotal\n(before tax)", width: 19 },
          { source: "Total Tax", label: "GST\n(total tax)", width: 17 },
          { source: "Total Service Charge", label: "Service\nCharges", width: 16 },
          { source: "Total", label: "Final Amount\n(incl. tax)", width: 21 },
        ];
        const textCount = overviewColumns.findIndex((column) => column.source === "Quantity");
        const simpleRows = rows.map((row) => overviewColumns.map(({ source }) => row[SALES_HEADERS.indexOf(source)]));
        const widths = overviewColumns.map((column, index) => {
          const longest = [column.label, ...simpleRows.map((row) => String(row[index] ?? ""))]
            .reduce((max, value) => Math.max(max, value.length), 0);
          return Math.min(index >= textCount ? 48 : 42, Math.max(column.width, Math.ceil(longest * 1.12) + 5));
        });
        overview.columns = widths.map((width) => ({ width }));
        const fill = (argb: string): ExcelJS.Fill => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
        const banner = (rowNumber: number, value: string, bg: string, fg: string, size: number, bold = false) => {
          overview.mergeCells(rowNumber, 1, rowNumber, overviewColumns.length);
          const cell = overview.getCell(rowNumber, 1);
          cell.value = value;
          cell.fill = fill(bg);
          cell.font = { name: "Calibri", size, bold, color: { argb: fg } };
          cell.alignment = { vertical: "middle", horizontal: "left", indent: 1, wrapText: true };
        };
        banner(1, "INDIEKONNECT  /  SALES OVERVIEW", "FF173B63", "FFFFFFFF", 20, true);
        overview.getRow(1).height = 42;
        banner(2, `Order Date: ${datePeriod}  |  ${rows.length} product lines  |  All amounts in INR (₹)`, "FFF0F7FF", "FF456580", 11);
        overview.getRow(2).height = 25;
        banner(3, "Product amount + shipping = subtotal  •  Subtotal + GST + service charges = final amount", "FFFFFFFF", "FF173B63", 12, true);
        overview.getRow(3).height = 30;
        banner(4, filterDescription ? `Applied filters: ${filterDescription}` : "All matching records. Full GST, payment and courier details are in Sales Data.", "FFFFFFFF", "FF456580", 11);
        overview.getRow(4).height = 28;

        const header = overview.addRow(overviewColumns.map((column) => column.label));
        header.height = 44;
        header.eachCell((cell, columnNumber) => {
          const source = overviewColumns[columnNumber - 1].source;
          const key = source === "Sub Total" || source === "Total";
          cell.fill = fill(key ? "FFBBDCFB" : "FF24466A");
          cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: key ? "FF173B63" : "FFFFFFFF" } };
          cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
          cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
        });

        simpleRows.forEach((values, rowIndex) => {
          const line = overview.addRow(values);
          line.height = 32;
          values.forEach((_, columnIndex) => {
            const source = overviewColumns[columnIndex].source;
            const isTotal = source === "Total";
            const isSubtotal = source === "Sub Total";
            const cell = line.getCell(columnIndex + 1);
            cell.fill = fill(isTotal ? "FFDCEEFF" : isSubtotal ? "FFF0F7FF" : rowIndex % 2 ? "FFF5F8FC" : "FFFFFFFF");
            cell.font = { name: "Calibri", size: 11, bold: isTotal, color: { argb: isTotal || isSubtotal ? "FF173B63" : "FF253C52" } };
            cell.alignment = { horizontal: columnIndex < textCount ? "left" : "right", vertical: "middle", wrapText: true };
            cell.border = { top: { style: "thin", color: { argb: "FFD3DFEB" } }, bottom: { style: "thin", color: { argb: "FFD3DFEB" } }, left: { style: "thin", color: { argb: "FFD3DFEB" } }, right: { style: "thin", color: { argb: "FFD3DFEB" } } };
            cell.numFmt = columnIndex < textCount ? "@" : source === "Quantity" ? "#,##0" : "#,##0.00";
          });
        });
        const overviewLast = simpleRows.length + 5;
        overview.autoFilter = { from: { row: 5, column: 1 }, to: { row: overviewLast, column: overviewColumns.length } };
        const totalRow = overview.addRow([]);
        totalRow.height = 40;
        overview.mergeCells(totalRow.number, 1, totalRow.number, textCount);
        totalRow.getCell(1).value = "GRAND TOTAL";
        overviewColumns.forEach((column, index) => {
          const cell = totalRow.getCell(index + 1);
          cell.fill = fill(column.source === "Total" ? "FFBBDCFB" : "FFDCEEFF");
          cell.font = { name: "Calibri", size: 12, bold: true, color: { argb: "FF173B63" } };
          cell.alignment = { horizontal: index < textCount ? "left" : "right", vertical: "middle", indent: 1 };
          if (index >= textCount) {
            const letter = overview.getColumn(index + 1).letter;
            const sum = roundMoney(simpleRows.reduce((acc, row) => acc + (typeof row[index] === "number" ? Number(row[index]) : 0), 0));
            cell.value = { formula: `SUBTOTAL(109,${letter}6:${letter}${overviewLast})`, result: sum };
            cell.numFmt = column.source === "Quantity" ? "#,##0" : "#,##0.00";
          }
        });
        banner(overviewLast + 3, "Calculation note: taxable unit price is treated as discount-adjusted. If shipping GST rate is absent, the product rate is used. No separate service GST is assumed.", "FFF0F7FF", "FF456580", 10);
        overview.getRow(overviewLast + 3).height = 31;

        /* Detailed sales data worksheet */
        const sheet = workbook.addWorksheet("Sales Data", {
          views: [{ state: "frozen", xSplit: 3, ySplit: 1, showGridLines: false }],
          properties: { defaultRowHeight: 23 },
        });
        const textHeaders = new Set([
          "Order Reference", "Item Reference ID", "Invoice Number", "SKU", "HSN Code", "User Name", "Customer Mobile", "Place Of Supply (POS)", "Gateway Transaction ID", "Courier Company", "Courier Tracking Number",
        ]);
        const moneyHeaders = new Set([
          "Price", "Total Discount", "Total Tax", "CGST", "SGST", "IGST", "Sub Total", "Total", "Shipping Charges", "Unit Price Without GST", "Product Subtotal Without GST", "Product GST", "Shipping Charges Without GST", "Shipping GST", "Service Charge Per Unit", "Total Service Charge",
        ]);
        const dateTimeHeaders = new Set(["Order Date", "Confirmed At", "Dispatched At", "Delivered At"]);
        const colWidths = SALES_HEADERS.map((heading, index) => {
          const length = Math.max(heading.length, ...rows.map((row) => String(row[index] ?? "").length));
          return Math.min(42, Math.max(moneyHeaders.has(heading) ? 18 : 14, length + 3));
        });
        sheet.columns = colWidths.map((width) => ({ width }));
        const headerRow = sheet.addRow(SALES_HEADERS);
        headerRow.height = 42;
        headerRow.eachCell((cell, columnNumber) => {
          const heading = SALES_HEADERS[columnNumber - 1];
          const isKey = ["Sub Total", "Total"].includes(heading);
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isKey ? "FFBBDCFB" : "FF173B63" } };
          cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: isKey ? "FF173B63" : "FFFFFFFF" } };
          cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
          cell.border = { top: { style: "thin", color: { argb: "FF9FB5CA" } }, bottom: { style: "thin", color: { argb: "FF9FB5CA" } }, left: { style: "thin", color: { argb: "FF9FB5CA" } }, right: { style: "thin", color: { argb: "FF9FB5CA" } } };
        });
        rows.forEach((values, rowIndex) => {
          const line = sheet.addRow(values);
          line.height = 30;
          SALES_HEADERS.forEach((heading, columnIndex) => {
            const cell = line.getCell(columnIndex + 1);
            const numeric = moneyHeaders.has(heading) || ["Quantity", "CV", "Tax Percentage"].includes(heading);
            const keyTotal = ["Sub Total", "Total"].includes(heading);
            cell.font = { name: "Calibri", size: 10, bold: keyTotal, color: { argb: keyTotal ? "FF173B63" : "FF253C52" } };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: keyTotal ? (heading === "Total" ? "FFDCEEFF" : "FFF0F7FF") : rowIndex % 2 ? "FFF2F6FA" : "FFFFFFFF" } };
            cell.alignment = { vertical: "middle", horizontal: numeric ? "right" : "left", wrapText: true };
            cell.border = { top: { style: "thin", color: { argb: "FFD3DFEB" } }, bottom: { style: "thin", color: { argb: "FFD3DFEB" } }, left: { style: "thin", color: { argb: "FFD3DFEB" } }, right: { style: "thin", color: { argb: "FFD3DFEB" } } };
            if (textHeaders.has(heading)) cell.numFmt = "@";
            if (moneyHeaders.has(heading)) cell.numFmt = "#,##0.00;[Red](#,##0.00);0.00";
            if (["Quantity", "CV"].includes(heading)) cell.numFmt = "#,##0.##";
            if (heading === "Tax Percentage") cell.numFmt = '0.##"%"';
            if (heading === "Invoice Date") cell.numFmt = "dd-mm-yyyy";
            if (dateTimeHeaders.has(heading)) cell.numFmt = "dd-mm-yyyy hh:mm";
          });
        });
        const lastDataRow = rows.length + 1;
        sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: lastDataRow, column: SALES_HEADERS.length } };
        const footer = sheet.addRow([]);
        footer.height = 40;
        sheet.mergeCells(footer.number, 1, footer.number, 3);
        footer.getCell(1).value = "GRAND TOTAL  |  VISIBLE ROWS";
        footer.getCell(1).font = { bold: true, color: { argb: "FF173B63" } };
        footer.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
        SALES_TOTAL_HEADERS.forEach((heading) => {
          const columnIndex = SALES_HEADERS.indexOf(heading);
          if (columnIndex < 0) return;
          const values = rows.map((row) => row[columnIndex]).filter((value): value is number => typeof value === "number");
          if (!values.length) return;
          if (["CGST", "SGST", "IGST"].includes(heading) && values.length !== rows.length) return;
          const columnLetter = sheet.getColumn(columnIndex + 1).letter;
          const sum = roundMoney(values.reduce((acc, value) => acc + value, 0));
          const cell = footer.getCell(columnIndex + 1);
          cell.value = { formula: `SUBTOTAL(109,${columnLetter}2:${columnLetter}${lastDataRow})`, result: sum };
          cell.numFmt = moneyHeaders.has(heading) ? "#,##0.00;[Red](#,##0.00);0.00" : "#,##0.##";
          cell.font = { bold: true, color: { argb: "FF173B63" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: heading === "Total" ? "FFBBDCFB" : "FFDCEEFF" } };
        });

        if (!gstFilter) {
          addCompactSalesSheet(workbook, "Sales Unregistered", filterByGstRegistration(exportItems, "URP"), true);
        }
        if (!gstFilter || gstFilter === "Registered") {
          addCompactSalesSheet(workbook, "Sales Registered", filterByGstRegistration(exportItems, "Registered"), true);
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const bytes = new Uint8Array(buffer);
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sales-${gstFilter ? gstFilter.toLowerCase() : "all"}-${exportDateSuffix}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Sales Data exported successfully");
    } catch (error) {
      console.error("Sales Data export error:", error);
      toast.error(error instanceof Error ? String(error.message ?? "") : "Failed to export Sales Data");
    } finally {
      setExporting(false);
    }
  };

  /* ================================================================
     PAGE STATES
  ================================================================ */

  const startRecord = totalRecords === 0 ? 0 : (safePage - 1) * PER_PAGE + 1;
  const endRecord = Math.min(safePage * PER_PAGE, totalRecords);
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
    <div className="min-h-screen space-y-5 p-3 sm:p-5 lg:p-6" lang="en" style={{ background: THEME.background }}>
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#2D6FE8]">
            <span>Reports</span>
            <ChevronRight size={13} />
            <span>Finance Sales Report</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
            Finance Sales Report
          </h1>
          <p className="mt-1 text-[13px] text-gray-500">
            Product-wise sales and GST calculated from unit prices, quantities and tax rates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={refreshReport}
            disabled={loading || exporting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#DCE6F2] bg-white px-4 text-[13px] font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          {canExport && (
            <button
              type="button"
              onClick={() => void exportExcel()}
              disabled={!canDownload}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2D6FE8] px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {exporting ? "Exporting..." : `Export Excel (${totalRecords})`}
            </button>
          )}

          {canExport && (
            <button
              type="button"
              onClick={exportCSV}
              disabled={!canDownload}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#DCE6F2] bg-white px-4 text-[13px] font-semibold text-[#173B63] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={15} />
              {gstFilter ? "Export CSV (" : "Export CSV ZIP ("}
              {totalRecords})
            </button>
          )}
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <section className="space-y-3" aria-label="Financial summary">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="min-w-0 rounded-xl border border-[#BBDCFB] bg-[#EAF3FF] p-4 text-[#173B63] shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-semibold text-[#315B86]">Total Sales</p>
              <div className="rounded-lg bg-[#D5E9FF] p-2"><Wallet size={18} /></div>
            </div>
            <p className="mt-2 break-words text-2xl font-bold tracking-tight tabular-nums">
              {summaryMoney(summary?.sales)}
            </p>
            <p className="mt-1 text-[12px] text-[#315B86]">Total item amount · incl. GST</p>
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
      </section>

      {/* FILTERS */}
      <section
        className="rounded-xl border border-[#DCE6F2] bg-white p-4 shadow-sm"
        aria-label="GST Registration and Custom Date Range"
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex h-10 items-center gap-2 text-[13px] font-semibold text-slate-800">
            <Filter size={17} className="text-[#2D6FE8]" />
            GST Registration
          </div>

          <select
            aria-label="GST Registration"
            value={gstFilter}
            disabled={loading || exporting}
            onChange={(event) => {
              setGstFilter(event.target.value as GstRegistrationFilter);
              setCurrentPage(1);
            }}
            className="h-10 min-w-[180px] rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-800 outline-none focus:border-[#2D6FE8] focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
          >
            <option value="">All</option>
            <option value="URP">URP</option>
            <option value="Registered">Registered</option>
          </select>

          {(gstFilter || appliedRange.from || draftRange.from || draftRange.to) && (
            <button
              type="button"
              onClick={clearFilters}
              disabled={exporting}
              className="h-10 text-[12px] font-semibold text-[#2D6FE8] hover:underline disabled:opacity-50"
            >
              Clear Filters
            </button>
          )}

          <div className="hidden h-10 w-px bg-[#DCE6F2] sm:block" />

          <div className="flex h-10 items-center gap-2 text-[13px] font-semibold text-slate-800">
            <CalendarDays size={17} className="text-[#2D6FE8]" />
            Custom Date Range · Order Date
          </div>

          <label className="flex min-w-[150px] flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-slate-600">From Date</span>
            <input
              type="date"
              value={draftRange.from}
              max={draftRange.to || undefined}
              disabled={loading || exporting}
              onChange={(event) => setDraftRange((range) => ({ ...range, from: event.target.value }))}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-800 outline-none focus:border-[#2D6FE8] focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
            />
          </label>

          <label className="flex min-w-[150px] flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-slate-600">To Date</span>
            <input
              type="date"
              value={draftRange.to}
              min={draftRange.from || undefined}
              disabled={loading || exporting}
              onChange={(event) => setDraftRange((range) => ({ ...range, to: event.target.value }))}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-800 outline-none focus:border-[#2D6FE8] focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
            />
          </label>

          <button
            type="button"
            onClick={applyDateRange}
            disabled={loading || exporting || !hasPendingDateChanges || !draftRange.from || !draftRange.to}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2D6FE8] px-4 text-[13px] font-semibold text-white hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Filter size={15} /> Apply Filter
          </button>

          <button
            type="button"
            onClick={resetDateRange}
            disabled={loading || exporting || (!draftRange.from && !draftRange.to && !appliedRange.from)}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#DCE6F2] bg-white px-4 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={15} /> Reset
          </button>
        </div>
      </section>

      {/* FINANCE RECORDS */}
      <div className="overflow-hidden rounded-xl border border-[#DCE6F2] bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center">
            <Loader2 size={32} className="animate-spin text-[#2D6FE8]" />
            <p className="mt-3 text-[13px] font-medium text-gray-500">Loading finance report...</p>
          </div>
        ) : overviewError ? (
          <div className="p-8 text-center text-[13px] text-red-700" role="alert">
            Could not load all report pages. {" "}
            <button type="button" onClick={refreshReport} className="font-semibold underline">Retry</button>
          </div>
        ) : filteredReports.some(hasMissingCalculationInputs) ? (
          <div className="p-8 text-center text-[13px] text-amber-800" role="alert">
            Sales calculation unavailable: one or more records are missing quantity, taxable unit price, GST rate or shipping base.
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
              <FileText size={25} />
            </div>
            <h3 className="mt-4 text-base font-bold text-gray-800">No Finance Records Found</h3>
            <p className="mt-1 max-w-sm text-[13px] text-gray-500">
              No records match the selected GST and date filters.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 rounded-lg bg-[#2D6FE8] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#1E40AF]"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden w-full overflow-x-auto xl:block">
              <table className="w-full min-w-[1480px] table-fixed border-collapse text-left">
                <colgroup>
                  <col style={{ width: "5%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "9%" }} />
                </colgroup>
                <thead>
                  <tr className="bg-[#F7FAFE]">
                    {[
                      "S.No",
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
                        className={`whitespace-normal break-words border-b border-[#DCE6F2] px-2.5 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-gray-600 ${heading === "S.No" ? "text-center" : ""}`}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredReports.map((item, index) => {
                    const row = asLineItem(item);
                    const shippingTotal = roundMoney(
                      getLineShipping(item) + getLineShippingGst(item),
                    );

                    return (
                      <tr
                        key={`${item.invoice_number || "invoice"}-${row.order_line_id ?? row.item_reference_id ?? index}-${index}`}
                        className="border-b border-gray-100 transition last:border-0 hover:bg-[#F8FBFF]"
                      >
                        {/* SERIAL NUMBER */}
                        <td className="px-2.5 py-3 text-center align-top">
                          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-[#EAF3FF] px-2 text-[12px] font-semibold text-[#2D6FE8]">
                            {startRecord + index}
                          </span>
                        </td>

                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <p className="break-words text-[13px] font-semibold text-gray-900">
                            {valueOrDash(item.invoice_number)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-gray-500">
                            {formatDate(item.invoice_date)}
                          </p>
                        </td>

                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <AccountDetails item={item} />
                        </td>

                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <ProductDetails item={item} />
                        </td>

                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <p className="text-[13px] font-medium text-gray-900">
                            {getQuantity(item)} Qty
                          </p>
                          <p className="mt-1 break-words text-[13px] text-gray-700">
                            {money(row.unit_price_without_gst)}
                          </p>
                        </td>

                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <p className="text-[13px] font-medium text-gray-900">
                            {money(shippingTotal)}
                          </p>
                          <div className="mt-1.5">
                            <CourierDetails item={item} />
                          </div>
                        </td>

                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <p className="text-[13px] font-semibold text-gray-900">
                            {money(getLineGross(item))}
                          </p>
                          <p className="mt-1 text-[12px] text-gray-600">
                            GST {money(getLineGst(item))}
                          </p>
                        </td>

                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <TaxBreakdownDetails item={item} />
                        </td>

                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <p className="break-words text-[13px] font-medium text-gray-800">
                            {valueOrDash(item.payment_gateway)}
                          </p>
                          <p className="mt-1 break-all text-[11px] leading-4 text-gray-500">
                            {valueOrDash(item.gateway_transaction_id)}
                          </p>
                        </td>

                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <div className="flex flex-col items-start gap-1.5">
                            <StatusBadge status={item.order_status} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE / TABLET CARDS */}
            <div className="space-y-2.5 p-2.5 xl:hidden">
              {filteredReports.map((item, index) => {
                const row = asLineItem(item);
                const shippingTotal = roundMoney(
                  getLineShipping(item) + getLineShippingGst(item),
                );

                return (
                  <div
                    key={`${item.invoice_number || "invoice"}-${row.order_line_id ?? row.item_reference_id ?? index}-${index}`}
                    className="overflow-hidden rounded-lg border border-[#DCE6F2] bg-white"
                  >
                    <div className="space-y-2.5 p-3">
                      {/* Invoice, serial number and status */}
                      <div className="flex items-start justify-between gap-2 border-b border-[#EDF1F6] pb-2">
                        <div className="flex min-w-0 items-start gap-2">
                          <span className="inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md bg-[#EAF3FF] px-2 text-[12px] font-bold text-[#2D6FE8]">
                            {startRecord + index}
                          </span>
                          <div className="min-w-0">
                            <p className="break-all text-[13px] font-semibold text-gray-900">
                              {valueOrDash(item.invoice_number)}
                            </p>
                            <p className="mt-0.5 text-[11px] text-gray-500">
                              {formatDate(item.invoice_date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <StatusBadge status={item.order_status} />
                        </div>
                      </div>

                      {/* Customer values */}
                      <div className="rounded-md bg-[#F7FAFE] px-2.5 py-2">
                        <AccountDetails item={item} />
                      </div>

                      {/* Product name and rate */}
                      <div className="rounded-md border border-[#E8EEF6] px-2.5 py-2">
                        <ProductDetails item={item} />
                      </div>

                      {/* Direct financial values, no field labels */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="min-w-0 rounded-md bg-[#F7FAFE] px-2.5 py-2">
                          <p className="text-[13px] font-medium text-gray-900">
                            {getQuantity(item)} Qty
                          </p>
                          <p className="mt-0.5 break-words text-[13px] text-gray-700">
                            {money(row.unit_price_without_gst)}
                          </p>
                        </div>

                        <div className="min-w-0 rounded-md bg-[#F7FAFE] px-2.5 py-2">
                          <p className="break-words text-[13px] font-semibold text-gray-900">
                            {money(shippingTotal)}
                          </p>
                          <div className="mt-1">
                            <CourierDetails item={item} />
                          </div>
                        </div>

                        <div className="min-w-0 rounded-md bg-[#F7FAFE] px-2.5 py-2">
                          <p className="break-words text-[13px] font-semibold text-gray-900">
                            {money(getLineGross(item))}
                          </p>
                          <p className="mt-0.5 text-[12px] text-gray-600">
                            GST {money(getLineGst(item))}
                          </p>
                        </div>

                        <div className="min-w-0 rounded-md bg-[#F7FAFE] px-2.5 py-2">
                          <TaxBreakdownDetails item={item} />
                        </div>
                      </div>

                      {/* Payment values */}
                      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 border-t border-[#EDF1F6] pt-2">
                        <p className="break-words text-[13px] font-medium text-gray-800">
                          {valueOrDash(item.payment_gateway)}
                        </p>
                        <p className="min-w-0 break-all text-[11px] text-gray-500">
                          {valueOrDash(item.gateway_transaction_id)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PAGINATION */}
            <div className="flex flex-col justify-between gap-3 border-t border-[#DCE6F2] px-4 py-3 sm:flex-row sm:items-center">
              <p className="text-[12px] text-gray-500">
                Showing product lines{" "}
                <span className="font-semibold text-gray-800">{startRecord}–{endRecord}</span>{" "}
                of <span className="font-semibold text-gray-800">{totalRecords}</span>
                <span className="ml-1 text-gray-400">({filteredReports.length} product rows on this page)</span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1 || loading}
                  onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE6F2] text-gray-600 hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="min-w-[85px] text-center text-[12px] font-semibold text-gray-700">
                  Page {safePage} of {lastPage}
                </span>
                <button
                  type="button"
                  disabled={safePage >= lastPage || loading}
                  onClick={() => setCurrentPage(Math.min(lastPage, safePage + 1))}
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
