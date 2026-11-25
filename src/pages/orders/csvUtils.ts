// src/pages/orders/csvUtils.ts

// Indiekonnect — CSV exports + compact GST tax-invoice PDF.
// Required: npm install jspdf jspdf-autotable qrcode
//           npm install -D @types/qrcode

import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";

import {
  INVOICE_LOGO_DATA_URL,
  INVOICE_LOGO_WIDTH,
  INVOICE_LOGO_HEIGHT,
} from "../../utils/invoiceLogoData";

// =====================================================
// CSV HELPERS
// =====================================================

export const escapeCsvValue = (value: any): string => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  return /[,"\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

/**
 * The order-list API returns dates as "DD-MM-YYYY HH:mm".
 * Native `new Date("20-11-2026 15:32")` is invalid in most browsers,
 * so convert to an ISO-ish string before formatting.
 */
export const parseApiDate = (value?: string | null): string => {
  if (!value) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  const m = raw.match(/^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
  if (!m) return raw;
  const [, dd, mm, yyyy, hh = "00", min = "00"] = m;
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:00`;
};

export const formatCsvDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatCsvStatus = (status?: string) =>
  status
    ? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "";

// =====================================================
// API -> CSV SHAPE MAPPER
// =====================================================
//
// The order-list API returns:
//   order["Bill Id"], order["Order Date"], order["Customer Name"],
//   order["Customer Email"], order["Payment Gateway"],
//   order["Products"] = [{
//     name, slug, product_code,
//     quantity, unit_price, line_total, subtotal_per_unit
//   }, ...]
//   order["Line Couriers"] = [{ courier_company, courier_tracking_number }, ...]
//
// `generateOrdersCsv` expects `order.items[].product_name`, etc.
// This mapper converts each API order into that shape — one item per
// product — so ALL product + courier fields appear in the CSV.
//
export const mapApiOrdersForCsv = (apiOrders: any[]): any[] => {
  return (apiOrders || []).map((o) => {
    const products: any[] = Array.isArray(o?.Products) ? o.Products : [];
    const lineCouriers: any[] = Array.isArray(o?.["Line Couriers"])
      ? o["Line Couriers"]
      : [];

    const items = products.length
      ? products.map((p, idx) => {
          // Couriers and products are aligned by index on the API side.
          const courier = lineCouriers[idx] || {};
          return {
            product_name: p?.name || "",
            product_code: p?.product_code || "",
            sku: p?.product_code || "",
            item_reference_id: p?.slug || "",
            // ✅ per-product qty / price / line total now flow through
            quantity: p?.quantity ?? "",
            unit_price: p?.unit_price ?? "",
            line_total: p?.line_total ?? "",
            subtotal_per_unit: p?.subtotal_per_unit ?? "",
            // ✅ per-product delivery + courier
            delivery_status:
              o?.["Delivery Status"] || o?.["Order Status"] || "",
            courier_company: courier?.courier_company || "",
            courier_tracking_number: courier?.courier_tracking_number || "",
          };
        })
      : [null]; // fallback: one row carrying only order-level data

    return {
      order_reference: o?.["Bill Id"] || "",
      order_date: parseApiDate(o?.["Order Date"]),
      orderDateRaw: parseApiDate(o?.["Order Date"]),
      customer: o?.["Customer Name"] || "",
      userEmail: o?.["Customer Email"] || "",
      userPhone: o?.["Customer Mobile"] || "",
      order_type: "retail",
      order_status: o?.["Order Status"] || "",
      payment_status: o?.["Is Refunded"] === "TRUE" ? "refunded" : "",
      payment_gateway: o?.["Payment Gateway"] || "",
      gateway_transaction_id: "",
      subtotal: o?.["Total List Price"] ?? o?.["Gross Total"] ?? 0,
      total_gst: o?.["Total Tax"] ?? 0,
      shipping_charge: o?.["Shipping Charge"] ?? 0,
      total_payable: o?.["Order Amount"] ?? 0,
      amount_paid: o?.["Net Order Amount"] ?? 0,
      shipping_address: o?.["Customer Shipping State"] || "",
      // order-level courier fields (used only if per-item values are blank)
      courier_company: o?.["Courier Company"] || "",
      courier_tracking_number: o?.["Courier Tracking Number"] || "",
      courier_delivery_date: parseApiDate(o?.["Delivered At"]),
      items,
    };
  });
};

/**
 * Item-based CSV generator.
 *
 * Every entry in `orders` may either be:
 *   - a full order (with `.items`), OR
 *   - a single-row order whose `.items` contains only the filtered item(s).
 *
 * In either case, the resulting CSV will contain ONE ROW PER ITEM.
 *
 * Column order: Product Name is the FIRST data column (right after S.No.).
 * Added: Subtotal Per Unit, so all product-level values from the API appear.
 */
export const generateOrdersCsv = (orders: any[]): string => {
  const headers = [
    "S.No.",
    "Product Name",
    "Order Reference",
    "Order Date",
    "Customer Name",
    "Customer Email",
    "Customer Phone",
    "Order Type",
    "Order Status",
    "Payment Status",
    "Payment Gateway",
    "Transaction ID",
    "Subtotal",
    "Total GST",
    "Shipping Charge",
    "Total Payable",
    "Amount Paid",
    "Shipping Address",
    "Courier Company",
    "Courier Tracking Number",
    "Courier Delivery Date",
    "Item Reference",
    "SKU",
    "Quantity",
    "Unit Price",
    "Subtotal Per Unit",
    "Item Total",
    "Item Delivery Status",
    "Item Tracking Number",
  ];

  const rows: string[] = [headers.map(escapeCsvValue).join(",")];
  let counter = 0;

  orders.forEach((order) => {
    const items =
      Array.isArray(order.items) && order.items.length ? order.items : [null];

    items.forEach((item: any) => {
      counter += 1;
      const row = [
        counter,
        item?.product_name || item?.productName || "",
        order.order_reference || order.id || "",
        formatCsvDate(order.orderDateRaw || order.order_date || order.date) ||
          "",
        order.user?.name || order.customer || "",
        order.user?.email || order.userEmail || "",
        order.user?.phone || order.userPhone || "",
        order.order_type === "retail" ? "Customer" : order.order_type || "",
        formatCsvStatus(order.order_status || order.orderStatus) || "",
        formatCsvStatus(order.payment_status || order.paymentStatus) || "",
        order.payment_gateway || order.paymentGateway || "",
        order.gateway_transaction_id || order.gatewayTransactionId || "",
        Number(order.subtotal || 0).toFixed(2),
        Number(order.total_gst || order.totalGst || 0).toFixed(2),
        Number(order.shipping_charge || order.shippingCharge || 0).toFixed(2),
        Number(order.total_payable || order.totalPayable || 0).toFixed(2),
        Number(order.amount_paid || order.amountPaid || 0).toFixed(2),
        order.shipping_address?.full_address || order.shippingAddress || "",
        // Prefer per-item courier values, fall back to order-level
        item?.courier_company ||
          order.courier_company ||
          order.courierCompany ||
          "",
        item?.courier_tracking_number ||
          order.courier_tracking_number ||
          order.courierTrackingNumber ||
          "",
        formatCsvDate(
          order.courier_delivery_date || order.courierDeliveryDate,
        ) || "",
        item?.item_reference_id || item?.itemReferenceId || "",
        item?.product_code || item?.sku || "",
        item?.quantity ?? "",
        item?.unit_price != null
          ? Number(item.unit_price).toFixed(2)
          : item?.unitPrice != null
            ? Number(item.unitPrice).toFixed(2)
            : "",
        item?.subtotal_per_unit != null
          ? Number(item.subtotal_per_unit).toFixed(2)
          : "",
        item?.line_total != null
          ? Number(item.line_total).toFixed(2)
          : item?.lineTotal != null
            ? Number(item.lineTotal).toFixed(2)
            : "",
        formatCsvStatus(item?.delivery_status || item?.status) || "",
        item?.courier_tracking_number || item?.courierTrackingNumber || "",
      ];
      rows.push(row.map(escapeCsvValue).join(","));
    });
  });

  return rows.join("\r\n");
};

export const downloadOrdersCsv = (orders: any[], filenamePrefix = "orders") => {
  if (!orders?.length) {
    toast.error("No orders available to export.");
    return;
  }

  try {
    const itemRowCount = orders.reduce((total, order) => {
      const count =
        Array.isArray(order.items) && order.items.length
          ? order.items.length
          : 1;
      return total + count;
    }, 0);

    const content = `\uFEFF${generateOrdersCsv(orders)}`;
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(
      `CSV downloaded — ${itemRowCount} item row(s) from ${orders.length} order(s)`,
    );
  } catch (error) {
    console.error("CSV download error:", error);
    toast.error("Failed to download CSV. Please try again.");
  }
};

// =====================================================
// GST INVOICE PDF — selected item amounts, integer paise calculations
// =====================================================
type InvoicePayload = {
  invoice?: Record<string, any>;
  order?: Record<string, any>;
  invoice_type?: string;
  data?: InvoicePayload;
};

type AnyObject = Record<string, any>;
type RGB = [number, number, number];

const ORDER_HISTORY_URL =
  "https://www.markupdesigns.net/indiekonnect-admin/orders";

const DISPLAY_SELLER_NAME = "INDIEKONNECT ENTERPRISE PRIVATE LIMITED";

const isPresent = (value: any): boolean =>
  value !== undefined && value !== null && String(value).trim() !== "";

const firstPresent = (...values: any[]): any => values.find(isPresent) ?? null;

const asText = (value: any, fallback = "-"): string =>
  isPresent(value) ? String(value).trim() : fallback;

const asNumber = (value: any, fallback = 0): number => {
  if (!isPresent(value)) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const formatMoney = (value: any): string =>
  asNumber(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const prettyStatus = (value: any) =>
  asText(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const addressToText = (value: any): string => {
  if (!isPresent(value)) return "";
  if (typeof value === "string") return asText(value);
  if (typeof value !== "object") return asText(value);
  const parts = [
    value.address_line_1 ?? value.address_line1,
    value.address_line_2 ?? value.address_line2,
    value.landmark,
    value.city,
    value.post_office,
    value.district,
    value.state,
    firstPresent(value.pincode, value.pin_code, value.postal_code),
    value.country,
  ].filter(isPresent);
  return parts.length
    ? [...new Set(parts)].join(", ")
    : asText(value.full_address);
};

const smallWords = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const tensWords = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

const hundredsToWords = (amount: number): string => {
  let n = Math.floor(amount);
  const out: string[] = [];
  if (n >= 100) {
    out.push(`${smallWords[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) {
    out.push(tensWords[Math.floor(n / 10)]);
    if (n % 10) out.push(smallWords[n % 10]);
  } else if (n > 0) {
    out.push(smallWords[n]);
  }
  return out.join(" ");
};

const integerToIndianWords = (amount: number): string => {
  let n = Math.floor(Math.abs(amount));
  if (!n) return "Zero";
  const pieces: string[] = [];
  for (const [unit, title] of [
    [1000000000, "Arab"],
    [10000000, "Crore"],
    [100000, "Lakh"],
    [1000, "Thousand"],
  ] as const) {
    if (n >= unit) {
      pieces.push(`${hundredsToWords(Math.floor(n / unit))} ${title}`);
      n %= unit;
    }
  }
  if (n) pieces.push(hundredsToWords(n));
  return pieces.join(" ");
};

const amountInWords = (value: number): string => {
  const paise = Math.round(Math.abs(value) * 100);
  const whole = Math.floor(paise / 100);
  const remainder = paise % 100;
  return (
    `${value < 0 ? "Minus " : ""}Rupees ${integerToIndianWords(whole)}` +
    `${remainder ? ` and ${integerToIndianWords(remainder)} Paise` : ""} Only`
  );
};

// =====================================================
// LINE NORMALIZATION
// =====================================================

type TaxSplit = {
  cgst: number | null;
  sgst: number | null;
  utgst: number | null;
  igst: number | null;
  inferred: boolean;
};
const paise = (v: any): number | null => {
  if (!isPresent(v)) return null;
  const n = Number(v);
  return Number.isFinite(n) && Number.isSafeInteger(Math.round(n * 100))
    ? Math.round(n * 100)
    : null;
};
const pickPaise = (...values: any[]): number | null => {
  for (const v of values) {
    const n = paise(v);
    if (n !== null) return n;
  }
  return null;
};
const money = (p: number | null): string =>
  p === null ? "-" : formatMoney(p / 100);
const signed = (p: number): string =>
  p === 0 ? money(0) : `${p < 0 ? "-" : "+"} ${money(Math.abs(p))}`;
const differs = (a: number | null, b: number): boolean => a !== null && a !== b;
const taxKeys = ["cgst", "sgst", "utgst", "igst"] as const;
const taxSum = (t: TaxSplit) =>
  taxKeys.reduce((sum, key) => sum + (t[key] ?? 0), 0);
const readSplit = (item: AnyObject, prefix = ""): TaxSplit => ({
  cgst: paise(item[`${prefix}cgst_amount`]),
  sgst: paise(item[`${prefix}sgst_amount`]),
  utgst: paise(item[`${prefix}utgst_amount`]),
  igst: paise(item[`${prefix}igst_amount`]),
  inferred: false,
});
const completeSplit = (t: TaxSplit, gst: number): TaxSplit => {
  if (taxSum(t) === gst && (gst === 0 || taxKeys.some((k) => t[k] !== null))) {
    return {
      cgst: t.cgst ?? 0,
      sgst: t.sgst ?? 0,
      utgst: t.utgst ?? 0,
      igst: t.igst ?? 0,
      inferred: t.inferred,
    };
  }
  return t;
};
const hasSplit = (t: TaxSplit, gst: number): boolean =>
  taxKeys.every((k) => t[k] !== null) && taxSum(t) === gst;
const shippingSplit = (
  item: AnyObject,
  product: TaxSplit,
  gst: number,
): TaxSplit => {
  const explicit = readSplit(item, "shipping_");
  if (taxKeys.some((k) => explicit[k] !== null) || gst === 0)
    return completeSplit(explicit, gst);
  // Inferred only for an unambiguous product tax pattern. This is a preview,
  // not a confirmed shipping tax classification.
  if (product.igst && !product.cgst && !product.sgst && !product.utgst)
    return { cgst: 0, sgst: 0, utgst: 0, igst: gst, inferred: true };
  if (
    product.cgst &&
    !product.igst &&
    !!product.sgst !== !!product.utgst &&
    Math.abs(product.cgst - (product.sgst ?? 0) - (product.utgst ?? 0)) <= 1
  ) {
    const central = Math.round(gst / 2);
    return {
      cgst: central,
      sgst: product.sgst ? gst - central : 0,
      utgst: product.utgst ? gst - central : 0,
      igst: 0,
      inferred: true,
    };
  }
  return explicit;
};
const rateFrom = (base: number, gst: number): number | null =>
  base > 0 ? Math.round((gst / base) * 10000) / 100 : gst === 0 ? 0 : null;
const rateText = (rate: number | null): string =>
  rate === null ? "-" : `${rate}%`;
const normalizeInvoiceLine = (item: AnyObject) => {
  const issues: string[] = [];
  const qty = asNumber(item.quantity, 1);
  if (!Number.isFinite(qty) || qty <= 0)
    throw new Error("Invalid invoice quantity.");
  const unit = (v: any): number | null => {
    const n = paise(v);
    return n === null ? null : Math.round(n * qty);
  };
  let productBase =
    paise(item.line_price_excl_gst) ?? unit(item.price_excl_gst);
  let productGross =
    paise(item.line_price_incl_gst) ?? unit(item.price_incl_gst);
  const rawProductTax = readSplit(item);
  let productGst =
    paise(item.line_gst_amount) ??
    unit(item.gst_amount_per_unit) ??
    (taxKeys.some((k) => rawProductTax[k] !== null)
      ? taxSum(rawProductTax)
      : null);
  if (productBase === null && productGross !== null && productGst !== null)
    productBase = productGross - productGst;
  if (productGst === null && productBase !== null && productGross !== null)
    productGst = productGross - productBase;
  if (productBase === null || productGst === null)
    throw new Error("Product taxable value or GST is missing.");
  if (productGross !== null && productGross !== productBase + productGst)
    issues.push("Product amounts require verification.");
  productGross = productBase + productGst;
  const productTax = completeSplit(rawProductTax, productGst);
  if (!hasSplit(productTax, productGst))
    issues.push("Product GST breakup requires verification.");
  const explicitRate = isPresent(item.gst_rate_percent)
    ? Number(String(item.gst_rate_percent).replace(/%$/, ""))
    : NaN;
  const productRate =
    Number.isFinite(explicitRate) && explicitRate >= 0
      ? explicitRate
      : rateFrom(productBase, productGst);
  if (
    productRate !== null &&
    Math.abs(Math.round((productBase * productRate) / 100) - productGst) >
      Math.max(1, Math.ceil(qty))
  )
    issues.push("Product GST rate requires verification.");
  let shippingBase =
    paise(item.shipping_excl_gst) ?? unit(item.shipping_per_unit_excl_gst);
  let shippingGross =
    paise(item.shipping_incl_gst) ?? unit(item.shipping_per_unit_incl_gst);
  let shippingGst = paise(item.shipping_gst_amount);
  if (shippingBase === null && shippingGross !== null && shippingGst !== null)
    shippingBase = shippingGross - shippingGst;
  if (shippingGst === null && shippingGross !== null && shippingBase !== null)
    shippingGst = shippingGross - shippingBase;
  if (shippingBase === null || shippingGst === null) {
    if (shippingBase !== null || shippingGross !== null || shippingGst !== null)
      throw new Error("Shipping taxable value or GST is missing.");
    issues.push("Shipping details require verification.");
    shippingBase = 0;
    shippingGst = 0;
  }
  if (shippingGross !== null && shippingGross !== shippingBase + shippingGst)
    issues.push("Shipping amounts require verification.");
  shippingGross = shippingBase + shippingGst;
  const shipTax = shippingSplit(item, productTax, shippingGst);
  if (shipTax.inferred)
    issues.push("Shipping GST split is calculated; confirmation required.");
  if (!hasSplit(shipTax, shippingGst))
    issues.push("Shipping GST breakup requires verification.");
  const explicitShippingRate = isPresent(item.shipping_gst_rate_percent)
    ? Number(String(item.shipping_gst_rate_percent).replace(/%$/, ""))
    : NaN;
  const shippingRate =
    Number.isFinite(explicitShippingRate) && explicitShippingRate >= 0
      ? explicitShippingRate
      : rateFrom(shippingBase, shippingGst);
  if (
    shippingRate !== null &&
    Math.abs(Math.round((shippingBase * shippingRate) / 100) - shippingGst) >
      Math.max(1, Math.ceil(qty))
  )
    issues.push("Shipping GST rate requires verification.");
  const serviceCharge = paise(item.product_service_charge) ?? 0;
  // Only count a separately stated service charge when the line total proves it
  // is additional. Do not guess its tax treatment or charge it twice.
  const reportedTotal = paise(item.line_total_incl_gst);
  const includedService =
    serviceCharge > 0 &&
    reportedTotal === productGross + shippingGross + serviceCharge
      ? serviceCharge
      : 0;
  if (serviceCharge !== 0)
    issues.push("Service charge treatment requires verification.");
  const total = productGross + shippingGross + includedService;
  if (
    differs(reportedTotal, total) ||
    differs(paise(item.line_total_excl_gst), productBase + shippingBase) ||
    differs(paise(item.line_total_gst_amount), productGst + shippingGst)
  )
    issues.push("Item totals require verification.");
  if (!isPresent(item.hsn_code)) issues.push("Product HSN is missing.");
  return {
    source: item,
    qty,
    productBase,
    productGst,
    productGross,
    productRate,
    productTax,
    shippingBase,
    shippingGst,
    shippingGross,
    shippingRate,
    shipTax,
    includedService,
    total,
    issues,
  };
};
// =====================================================
// MAIN INVOICE PDF BUILDER
// =====================================================

export const openInvoicePdfInNewTab = async (
  payload: InvoicePayload,
  _orderItemId: number | null = null,
  targetWindow?: Window | null,
): Promise<void> => {
  const popup =
    targetWindow === undefined ? window.open("", "_blank") : targetWindow;

  try {
    // Accept both the unwrapped payload and the original response envelope.
    const data: InvoicePayload = payload?.data?.invoice
      ? payload.data
      : payload;
    const invoice: AnyObject = data?.invoice ?? {};
    const order: AnyObject = data?.order ?? {};
    const seller: AnyObject = invoice.seller ?? {};
    const buyer: AnyObject = invoice.buyer ?? {};
    const raw = order.order_items ?? order.items;
    const invoiceType = firstPresent(payload.invoice_type, data?.invoice_type);
    const isSingle =
      invoiceType === "single_item" ||
      _orderItemId !== null ||
      (!Array.isArray(raw) && raw && typeof raw === "object");
    let orderItems: AnyObject[] = Array.isArray(raw)
      ? raw
      : raw && typeof raw === "object"
        ? [raw]
        : [];
    if (_orderItemId !== null)
      orderItems = orderItems.filter(
        (item) =>
          String(item.order_line_id ?? item.order_item_id ?? item.id) ===
          String(_orderItemId),
      );
    if (!orderItems.length || (isSingle && orderItems.length !== 1))
      throw new Error("Selected invoice item not found or ambiguous.");
    const lines = orderItems.map(normalizeInvoiceLine);

    const invoiceNumber = asText(
      firstPresent(
        invoice.invoice_number,
        invoice.number,
        order.order_reference,
        order.id,
      ),
    );
    const orderReference = asText(
      firstPresent(order.order_reference, order.id),
    );

    const sellerAddress = addressToText(
      firstPresent(seller.address, seller.full_address),
    );
    const state = firstPresent(
      invoice.delivery_state,
      invoice.place_of_supply,
      buyer.delivery_address?.state,
      buyer.billing_address?.state,
      order.delivery_address?.state,
      order.billing_address?.state,
    );

    const sum = (
      key:
        | "productBase"
        | "productGst"
        | "productGross"
        | "shippingBase"
        | "shippingGst"
        | "shippingGross"
        | "includedService"
        | "total",
    ) => lines.reduce((n, line) => n + line[key], 0);
    const productBase = sum("productBase");
    const productGst = sum("productGst");
    const shippingBase = sum("shippingBase");
    const shippingGst = sum("shippingGst");
    const service = sum("includedService");
    const gross = sum("total");
    const issues = lines.flatMap((line) => line.issues);
    const recordedPayable = paise(invoice.total_payable);
    const recordedCoupon = paise(invoice.coupon_discount) ?? 0;
    const recordedCoin = paise(invoice.coin_redeemed) ?? 0;
    // Never allocate order-wide discounts to one item without evidence. For
    // nonzero deductions, require matching scoped header amounts and a matching
    // payable. A coupon may already be reflected in the item prices.
    let coupon = 0,
      coin = 0;
    if (recordedCoupon !== 0 || recordedCoin !== 0) {
      const itemCoupon = isSingle
        ? pickPaise(
            lines[0].source.line_coupon_discount,
            lines[0].source.coupon_discount,
          )
        : recordedCoupon;
      const itemCoin = isSingle
        ? pickPaise(
            lines[0].source.line_coin_redeemed_amount,
            lines[0].source.coin_redeemed_amount,
          )
        : recordedCoin;
      const c = recordedCoupon === 0 ? 0 : itemCoupon;
      const r = recordedCoin === 0 ? 0 : itemCoin;
      if (
        c !== null &&
        r !== null &&
        c >= 0 &&
        r >= 0 &&
        c + r <= gross &&
        c === recordedCoupon &&
        r === recordedCoin &&
        (recordedPayable === gross - c - r ||
          recordedPayable === Math.round((gross - c - r) / 100) * 100) &&
        paise(invoice.subtotal_before_redemption) === sum("productGross") &&
        paise(invoice.subtotal_after_discount) === sum("productGross") - c
      ) {
        coupon = c;
        coin = r;
      } else
        issues.push("Discount or redemption allocation requires verification.");
    }
    // Round the final payable once, not each product or GST component.
    // Nearest rupee policy; all calculations above remain in integer paise.
    const beforeRoundOff = gross - coupon - coin;
    const roundedPayable =
      Math.sign(beforeRoundOff) *
      Math.round(Math.abs(beforeRoundOff) / 100) *
      100;
    const roundOff = roundedPayable - beforeRoundOff;
    const recordedRoundOff = pickPaise(
      invoice.round_off,
      invoice.roundoff,
      invoice.round_off_amount,
    );
    if (recordedRoundOff !== null && recordedRoundOff !== roundOff)
      issues.push("Recorded rounding requires verification.");
    const payablePaise = beforeRoundOff + roundOff;
    const payable = payablePaise / 100;
    if (
      recordedPayable === null ||
      differs(recordedPayable, payablePaise) ||
      differs(paise(invoice.shipping_charge), sum("shippingGross")) ||
      differs(paise(invoice.total_tax), productGst + shippingGst) ||
      differs(paise(invoice.total_taxable), productBase + shippingBase)
    )
      issues.push(
        "Recorded invoice totals do not match selected item amounts.",
      );
    const taxTotal = (
      kind: "productTax" | "shipTax",
      key: (typeof taxKeys)[number],
    ) => lines.reduce((n, line) => n + (line[kind][key] ?? 0), 0);
    const splitComplete = (kind: "productTax" | "shipTax") =>
      lines.every((line) =>
        hasSplit(
          line[kind],
          kind === "productTax" ? line.productGst : line.shippingGst,
        ),
      );
    if (
      !isPresent(invoice.invoice_number) ||
      !isPresent(seller.gstin) ||
      !isPresent(state)
    )
      issues.push("Invoice identification requires verification.");
    if (
      splitComplete("productTax") &&
      splitComplete("shipTax") &&
      taxKeys.some((key) =>
        differs(
          paise(invoice[`total_${key}`]),
          taxTotal("productTax", key) + taxTotal("shipTax", key),
        ),
      )
    )
      issues.push("Recorded tax components require verification.");
    // Cross-check supplied GSTIN state code and place of supply. Do not
    // silently rewrite the source tax classification in the frontend.
    const stateCodes: Record<string, string> = {
      punjab: "03",
      karnataka: "29",
      "uttar pradesh": "09",
      delhi: "07",
      maharashtra: "27",
      haryana: "06",
      rajasthan: "08",
      gujarat: "24",
      "tamil nadu": "33",
      telangana: "36",
      "west bengal": "19",
      kerala: "32",
      "andhra pradesh": "37",
      bihar: "10",
      chandigarh: "04",
    };
    const sellerCode = String(seller.gstin ?? "").slice(0, 2);
    const destinationCode =
      stateCodes[
        String(state ?? "")
          .trim()
          .toLowerCase()
      ];
    const stateTaxMismatch =
      !!destinationCode &&
      /^\d{2}$/.test(sellerCode) &&
      sellerCode !== destinationCode &&
      lines.some(
        (line) =>
          (line.productTax.cgst ?? 0) +
            (line.productTax.sgst ?? 0) +
            (line.productTax.utgst ?? 0) >
          0,
      );
    if (stateTaxMismatch)
      issues.push(
        "GST classification and place of supply require verification.",
      );
    const preview = issues.length > 0;
    const title = preview ? "Invoice Preview" : "Tax Invoice";
    if (preview)
      console.warn("Invoice verification required", {
        issues: [...new Set(issues)],
        recordedPayable:
          recordedPayable === null ? null : recordedPayable / 100,
        calculatedPayable: payable,
      });

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
      compress: true,
    });

    doc.setProperties({
      title: `Indiekonnect ${title} ${invoiceNumber}`,
      subject: `Order ${orderReference}`,
      author: "Indiekonnect",
      creator: "Indiekonnect Admin Panel",
    });

    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const M = 34;
    const R = PW - M;
    const W = PW - M * 2;
    const DIVIDER = M + W * 0.69;
    const RIGHT_W = R - DIVIDER;
    const LEFT_W = DIVIDER - M;

    const INK: RGB = [35, 35, 35];
    const GRAY: RGB = [87, 87, 87];
    const LINE: RGB = [67, 67, 67];
    const LIGHT: RGB = [239, 239, 239];
    let y = M;

    const setFont = (size: number, bold = false, muted = false) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      doc.setTextColor(...(muted ? GRAY : INK));
    };
    const text = (
      value: any,
      x: number,
      baseline: number,
      size = 7.3,
      bold = false,
      options: any = {},
      muted = false,
    ) => {
      setFont(size, bold, muted);
      doc.text(asText(value), x, baseline, options);
    };
    const wrap = (
      value: any,
      width: number,
      size = 7.3,
      bold = false,
    ): string[] => {
      setFont(size, bold);
      return doc.splitTextToSize(
        asText(value),
        Math.max(12, width),
      ) as string[];
    };
    const borderRect = (
      x: number,
      top: number,
      width: number,
      height: number,
    ) => {
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.52);
      doc.rect(x, top, width, height, "S");
    };
    const rule = (x1: number, top: number, x2: number, bottom: number) => {
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.52);
      doc.line(x1, top, x2, bottom);
    };
    const nextPage = () => {
      doc.addPage();
      y = M;
    };
    const room = (height: number) => {
      if (y + height > PH - 43) nextPage();
    };

    // 1. HEADER
    const headerH = 70;
    borderRect(M, y, W, headerH);
    rule(DIVIDER, y, DIVIDER, y + headerH);

    const logo =
      typeof INVOICE_LOGO_DATA_URL === "string"
        ? INVOICE_LOGO_DATA_URL.trim()
        : "";
    let logoDrawn = false;
    let logoDrawWidth = 0;
    if (logo.startsWith("data:image/png;base64,")) {
      try {
        const realW = asNumber(INVOICE_LOGO_WIDTH, 829);
        const realH = asNumber(INVOICE_LOGO_HEIGHT, 1436);
        const scale = Math.min(61 / realH, 118 / realW);
        logoDrawWidth = realW * scale;
        doc.addImage(
          logo,
          "PNG",
          M + 7,
          y + (headerH - realH * scale) / 2,
          logoDrawWidth,
          realH * scale,
        );
        logoDrawn = true;
      } catch (err) {
        console.warn("Unable to render bundled Indiekonnect logo:", err);
      }
    }

    if (!logoDrawn) {
      text("INDIEKONNECT", M + 10, y + 38, 17, true);
    } else {
      text(
        "INDIEKONNECT",
        M + Math.max(68, logoDrawWidth + 17),
        y + 38,
        15.5,
        true,
      );
    }
    text(title, DIVIDER + RIGHT_W / 2, y + 42, 15.5, true, {
      align: "center",
    });
    y += headerH;

    // 2. SELLER / QR
    const sellerNameLines = wrap(DISPLAY_SELLER_NAME, LEFT_W - 15, 8.4, true);
    const sellerAddrLines = sellerAddress
      ? wrap(sellerAddress, LEFT_W - 16, 7.2)
      : [];
    const sellerPairs: Array<[string, any]> = (
      [
        ["GSTIN", firstPresent(seller.gstin, seller.gst_number)],
        [
          "FSSAI Licence No.",
          firstPresent(seller.fssai_license_number, seller.fssai),
        ],
        ["CIN", seller.cin],
        ["PAN", seller.pan],
      ] as Array<[string, any]>
    ).filter(([, v]) => isPresent(v));

    const sellerNeeded =
      36 +
      sellerNameLines.length * 10 +
      sellerAddrLines.length * 9 +
      sellerPairs.length * 11 +
      9;
    const sellerH = Math.max(110, sellerNeeded);

    borderRect(M, y, W, sellerH);
    rule(DIVIDER, y, DIVIDER, y + sellerH);
    text("Sold By / Seller", M + 6, y + 12, 7.5, true, {}, true);

    let sellerAt = y + 25;
    sellerNameLines.forEach((line) => {
      text(line, M + 6, sellerAt, 8.4, true);
      sellerAt += 10;
    });
    sellerAddrLines.forEach((line) => {
      text(line, M + 6, sellerAt, 7.2);
      sellerAt += 9;
    });
    sellerPairs.forEach(([label, value]) => {
      text(label, M + 6, sellerAt, 7.2, true);
      text(`: ${asText(value)}`, M + 119, sellerAt, 7.2);
      sellerAt += 11;
    });

    const qrDataUrl = await QRCode.toDataURL(ORDER_HISTORY_URL, {
      width: 280,
      margin: 1,
      errorCorrectionLevel: "M",
    });
    const QR_SIZE = Math.min(70, sellerH - 37);
    const qrX = DIVIDER + (RIGHT_W - QR_SIZE) / 2;
    const qrY = y + 5;
    doc.addImage(qrDataUrl, "PNG", qrX, qrY, QR_SIZE, QR_SIZE);
    doc.link(qrX, qrY, QR_SIZE, QR_SIZE, { url: ORDER_HISTORY_URL });
    text(
      "Scan for Order History",
      DIVIDER + RIGHT_W / 2,
      qrY + QR_SIZE + 9,
      6.0,
      false,
      { align: "center" },
      true,
    );

    text("Invoice Number:", DIVIDER + 6, y + sellerH - 12, 6.7, true);
    text(invoiceNumber, DIVIDER + 76, y + sellerH - 12, 6.7, false, {
      maxWidth: RIGHT_W - 81,
    });
    y += sellerH;

    // 3. ORDER / BILL TO / SHIP TO
    const billAddress = addressToText(
      firstPresent(
        order.billing_address,
        buyer.billing_address,
        buyer.address,
        order.delivery_address,
        buyer.delivery_address,
        order.shipping_address,
      ),
    );
    const shipAddress = addressToText(
      firstPresent(
        order.delivery_address,
        buyer.delivery_address,
        order.shipping_address,
        buyer.billing_address,
        order.billing_address,
      ),
    );
    const billToName = asText(
      firstPresent(
        order.billing_address?.recipient_name,
        buyer.billing_address?.recipient_name,
        order.billing_address?.name,
        order.billing_address?.full_name,
        buyer.name,
        order.user?.name,
        order.customer,
      ),
    );
    const shipToName = asText(
      firstPresent(
        buyer.delivery_address?.recipient_name,
        order.delivery_address?.recipient_name,
        order.delivery_address?.name,
        buyer.name,
        order.user?.name,
        order.customer,
      ),
    );
    const billPhone = firstPresent(
      buyer.billing_address?.contact_number,
      order.billing_address?.phone,
      order.billing_address?.mobile,
      buyer.phone,
      order.user?.phone,
    );
    const shipPhone = firstPresent(
      buyer.delivery_address?.contact_number,
      order.delivery_address?.phone,
      order.delivery_address?.mobile,
      buyer.phone,
      order.user?.phone,
    );
    const billEmail = firstPresent(
      buyer.billing_address?.email,
      order.billing_address?.email,
      order.user?.email,
    );
    const shipEmail = firstPresent(
      buyer.delivery_address?.email,
      order.delivery_address?.email,
    );

    const shortDate = (value: any): string => {
      if (!isPresent(value)) return "-";
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return asText(value);
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
        .format(parsed)
        .replace(/\//g, "-");
    };

    const colOrderW = W * 0.28;
    const colBillW = W * 0.36;
    const colShipW = W - colOrderW - colBillW;
    const xOrder = M;
    const xBill = M + colOrderW;
    const xShip = xBill + colBillW;
    const innerGap = 8;
    const orderTextW = colOrderW - innerGap * 2;
    const bodyLineH = 9.6;

    const orderIdLines = wrap(orderReference, orderTextW, 8.1, true);
    const orderMeta: Array<[string, any]> = [
      [
        "Order Date",
        shortDate(firstPresent(order.created_at, order.order_date)),
      ],
      [
        "Invoice Date",
        shortDate(
          firstPresent(invoice.issued_at, invoice.created_at, order.created_at),
        ),
      ],
      ["Place of Supply", state],
      [
        "Order Status",
        prettyStatus(firstPresent(order.status, order.order_status)),
      ],
      ["Order Type", prettyStatus(order.order_type)],
    ].filter(([, v]) => isPresent(v)) as Array<[string, any]>;

    const orderMetaValueWidth = colOrderW - 77;
    const measuredMeta = orderMeta.map(([label, value]) => ({
      label,
      values: wrap(value, orderMetaValueWidth, 7.0),
    }));
    const orderBlockH =
      15 +
      13 +
      orderIdLines.length * 10 +
      7 +
      measuredMeta.reduce(
        (sum, entry) => sum + Math.max(13, entry.values.length * 9.3 + 2),
        0,
      ) +
      9;

    type AddressColumn = {
      title: string;
      x: number;
      width: number;
      person: string[];
      address: string[];
      phone: string[];
      email: string[];
      height: number;
    };
    const makeAddressColumn = (
      title: string,
      x: number,
      width: number,
      name: string,
      address: string,
      phone: any,
      email: any,
      gstin?: any,
    ): AddressColumn => {
      const textW = width - innerGap * 2;
      const person = wrap(name, textW, 8.2, true);
      const locationLines = address ? wrap(address, textW, 7.4) : [];
      const phoneLines = isPresent(phone)
        ? wrap(`Phone: ${phone}`, textW, 7.1)
        : [];
      const emailLines = isPresent(email)
        ? wrap(`Email: ${email}`, textW, 7.1)
        : [];
      if (isPresent(gstin))
        emailLines.push(...wrap(`GSTIN: ${gstin}`, textW, 7.1));
      const height =
        15 +
        14 +
        person.length * 10.2 +
        4 +
        locationLines.length * bodyLineH +
        5 +
        phoneLines.length * bodyLineH +
        (emailLines.length ? 3 + emailLines.length * bodyLineH : 0) +
        10;
      return {
        title,
        x,
        width,
        person,
        address: locationLines,
        phone: phoneLines,
        email: emailLines,
        height,
      };
    };

    const billCol = makeAddressColumn(
      "Bill To",
      xBill,
      colBillW,
      billToName,
      billAddress,
      billPhone,
      billEmail,
      buyer.gstin,
    );
    const shipCol = makeAddressColumn(
      "Ship To",
      xShip,
      colShipW,
      shipToName,
      shipAddress,
      shipPhone,
      shipEmail,
    );

    const infoBlockH = Math.max(
      100,
      orderBlockH,
      billCol.height,
      shipCol.height,
    );
    room(infoBlockH);
    borderRect(M, y, W, infoBlockH);
    rule(xBill, y, xBill, y + infoBlockH);
    rule(xShip, y, xShip, y + infoBlockH);

    let orderY = y + 14;
    text("Order ID:", xOrder + innerGap, orderY, 8.0, true);
    orderY += 13;
    orderIdLines.forEach((line) => {
      text(line, xOrder + innerGap, orderY, 8.1, true);
      orderY += 10;
    });
    orderY += 7;
    measuredMeta.forEach((entry) => {
      text(`${entry.label}:`, xOrder + innerGap, orderY, 7.0, true);
      entry.values.forEach((line, index) => {
        text(line, xOrder + 75, orderY + index * 9.3, 7.0);
      });
      orderY += Math.max(13, entry.values.length * 9.3 + 2);
    });

    const drawAddressColumn = (column: AddressColumn) => {
      let cursor = y + 14;
      const x = column.x + innerGap;
      text(column.title, x, cursor, 9.0, true);
      cursor += 15;
      column.person.forEach((line) => {
        text(line, x, cursor, 8.2, true);
        cursor += 10.2;
      });
      cursor += 4;
      column.address.forEach((line) => {
        text(line, x, cursor, 7.4);
        cursor += bodyLineH;
      });
      cursor += 5;
      column.phone.forEach((line) => {
        text(line, x, cursor, 7.1);
        cursor += bodyLineH;
      });
      if (column.email.length) cursor += 3;
      column.email.forEach((line) => {
        text(line, x, cursor, 7.1);
        cursor += bodyLineH;
      });
    };
    drawAddressColumn(billCol);
    drawAddressColumn(shipCol);
    y += infoBlockH;

    // 4. COMBINED PRODUCT AND SHIPPING TABLE
    const widths = [22, 47, 112, 24, 63, 34, 49, 49, 43, 54, 66];
    const ratio = W / widths.reduce((sum, n) => sum + n, 0);
    const columnStyles: Record<number, any> = {};
    widths.forEach((width, index) => {
      columnStyles[index] = {
        cellWidth: width * ratio,
        halign:
          index === 2
            ? "left"
            : [0, 1, 3, 5].includes(index)
              ? "center"
              : "right",
      };
    });
    const body: string[][] = [];
    const combinedState = (t: TaxSplit) =>
      t.sgst === null && t.utgst === null
        ? null
        : (t.sgst ?? 0) + (t.utgst ?? 0);
    const taxCells = (t: TaxSplit) => [
      money(t.cgst),
      money(combinedState(t)),
      money(t.igst),
    ];
    let serial = 0;
    for (const line of lines) {
      const src = line.source;
      const name = asText(firstPresent(src.product_name, src.name));
      body.push([
        String(++serial),
        asText(src.hsn_code),
        name +
          (isPresent(src.product_code) ? `\nSKU: ${src.product_code}` : ""),
        asText(line.qty),
        money(line.productBase),
        rateText(line.productRate),
        ...taxCells(line.productTax),
        money(line.productGst),
        money(line.productGross),
      ]);
      if (
        line.shippingGross !== 0 ||
        line.shippingGst !== 0 ||
        line.shippingBase !== 0
      ) {
        body.push([
          String(++serial),
          asText(src.shipping_sac_code),
          `Shipping - ${name}${line.shipTax.inferred ? "*" : ""}`,
          "-",
          money(line.shippingBase),
          rateText(line.shippingRate),
          ...taxCells(line.shipTax),
          money(line.shippingGst),
          money(line.shippingGross),
        ]);
      }
      if (line.includedService)
        body.push([
          String(++serial),
          "-",
          "Service Charge",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          money(line.includedService),
        ]);
    }
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M, top: 34, bottom: 45 },
      theme: "grid",
      head: [
        [
          "Sr.\nNo.",
          "HSN / SAC",
          "Item Description",
          "Qty.",
          "Taxable\nAmount",
          "GST\nRate",
          "CGST",
          "SGST /\nUTGST",
          "IGST",
          "GST\nAmount",
          "Amount\n(Incl. GST)",
        ],
      ],
      body,
      foot: [
        [
          {
            content: "Items & Charges Total",
            colSpan: 10,
            styles: { halign: "right" },
          },
          { content: money(gross), styles: { halign: "right" } },
        ],
      ],
      showFoot: "lastPage",
      styles: {
        font: "helvetica",
        fontSize: 6.8,
        textColor: INK,
        lineColor: LINE,
        lineWidth: 0.5,
        cellPadding: { top: 5, bottom: 5, left: 2, right: 2 },
        overflow: "linebreak",
        valign: "middle",
      },
      headStyles: {
        fillColor: LIGHT,
        textColor: INK,
        fontStyle: "bold",
        halign: "center",
        fontSize: 6.4,
        minCellHeight: 25,
      },
      footStyles: {
        fillColor: LIGHT,
        textColor: INK,
        fontStyle: "bold",
        halign: "right",
      },
      columnStyles,
      rowPageBreak: "avoid",
    });
    y =
      (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY ?? y;

    // One simple invoice summary. GST is added exactly once.
    const summary: Array<[string, string]> = [
      ["Product Price (Excl. GST)", money(productBase)],
    ];
    const addTaxRows = (
      label: string,
      kind: "productTax" | "shipTax",
      gst: number,
    ) => {
      if (!gst) return;
      if (splitComplete(kind)) {
        for (const key of taxKeys) {
          const amount = taxTotal(kind, key);
          if (amount) {
            // Only label a component with a rate if every contributing line
            // agrees. Mixed-rate orders retain per-line rates in the table.
            const rates = lines
              .filter((l) => (l[kind][key] ?? 0) !== 0)
              .map((l) => {
                const base =
                  kind === "productTax" ? l.productBase : l.shippingBase;
                return rateFrom(base, l[kind][key] ?? 0);
              });
            const rateLabel =
              rates.length &&
              rates[0] !== null &&
              rates.every((r) => r === rates[0])
                ? ` (${rates[0]}%)`
                : "";
            summary.push([
              `${label} ${key.toUpperCase()}${rateLabel}${kind === "shipTax" && lines.some((l) => l.shipTax.inferred) ? "*" : ""}`,
              signed(amount),
            ]);
          }
        }
      } else summary.push([`${label} GST`, signed(gst)]);
    };
    addTaxRows("Product", "productTax", productGst);
    if (shippingBase || shippingGst) {
      summary.push(["Shipping Charges (Excl. GST)", signed(shippingBase)]);
      addTaxRows("Shipping", "shipTax", shippingGst);
    }
    if (service) summary.push(["Service Charge", signed(service)]);
    if (coupon) summary.push(["Coupon Discount", signed(-coupon)]);
    if (coin) summary.push(["Coin Redemption", signed(-coin)]);
    summary.push(["Round Off", signed(roundOff)]);
    const summaryH = 22 + summary.length * 18 + 28;
    y += 8;
    room(summaryH);
    doc.setFillColor(...LIGHT);
    doc.rect(M, y, W, 20, "F");
    text("INVOICE SUMMARY", M + 8, y + 13, 8.3, true);
    text("AMOUNT (INR)", R - 8, y + 13, 8.3, true, { align: "right" });
    y += 20;
    summary.forEach(([label, value]) => {
      text(label, M + 8, y + 12, 8);
      text(value, R - 8, y + 12, 8, false, { align: "right" });
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.4);
      doc.line(M, y + 18, R, y + 18);
      y += 18;
    });
    doc.setFillColor(...LIGHT);
    doc.rect(M, y, W, 26, "F");
    text(
      preview ? "Calculated Total" : "Total Payable",
      M + 8,
      y + 17,
      10,
      true,
    );
    text(money(payablePaise), R - 8, y + 17, 10, true, { align: "right" });
    y += 26;
    if (preview) {
      const notes = wrap(
        (lines.some((l) => l.shipTax.inferred)
          ? "* Shipping GST split is calculated and pending confirmation. "
          : "") +
          (stateTaxMismatch
            ? "GST registration and place of supply require confirmation. "
            : "") +
          "Invoice amounts require verification before issue.",
        W - 16,
        7.2,
      );
      room(10 + notes.length * 10);
      notes.forEach((note, i) =>
        text(note, M + 8, y + 10 + i * 10, 7.2, false, {}, true),
      );
      y += 10 + notes.length * 10;
    }

    // 5. AMOUNT IN WORDS
    const wordsLines = wrap(
      `Amount in Words: ${amountInWords(payable)}`,
      W - 13,
      7.0,
      true,
    );
    const wordsH = Math.max(23, 8 + wordsLines.length * 9.5);
    room(wordsH);
    borderRect(M, y, W, wordsH);
    wordsLines.forEach((wordLine, index) =>
      text(wordLine, M + 6, y + 13 + index * 9.5, 7.0, true),
    );
    y += wordsH;

    // 6. SELLER / AUTHORISED SIGNATORY BOX
    const signatureH = 65;
    room(signatureH);
    borderRect(M, y, W, signatureH);
    rule(DIVIDER, y, DIVIDER, y + signatureH);
    text(DISPLAY_SELLER_NAME, M + 6, y + 13, 8.1, true);
    if (isPresent(seller.gstin))
      text(`GSTIN: ${seller.gstin}`, M + 6, y + 28, 7);
    if (isPresent(seller.pan)) text(`PAN: ${seller.pan}`, M + 6, y + 40, 7);
    if (isPresent(seller.cin)) text(`CIN: ${seller.cin}`, M + 6, y + 52, 7);

    const signature = firstPresent(
      invoice.signature_data_url,
      seller.signature_data_url,
    );
    if (
      !preview &&
      typeof signature === "string" &&
      /^data:image\/(png|jpeg|jpg);base64,/i.test(signature)
    ) {
      try {
        doc.addImage(
          signature,
          /image\/png/i.test(signature) ? "PNG" : "JPEG",
          DIVIDER + 30,
          y + 4,
          RIGHT_W - 58,
          36,
        );
      } catch (error) {
        console.warn("Invoice signature could not be drawn:", error);
      }
    }
    text(
      preview ? "Pending Verification" : "Authorised Signatory",
      DIVIDER + RIGHT_W / 2,
      y + signatureH - 9,
      7.2,
      false,
      { align: "center" },
    );
    y += signatureH;

    // 7. REVERSE CHARGE
    const reverse = firstPresent(
      invoice.reverse_charge,
      invoice.is_reverse_charge,
    );
    if (reverse !== null) {
      room(21);
      borderRect(M, y, W, 21);
      const reverseText = [true, 1, "1", "yes", "true"].includes(reverse)
        ? "Yes"
        : "No";
      text(
        `Whether tax is payable on reverse charge: ${reverseText}`,
        M + 6,
        y + 13,
        7.4,
        true,
      );
      y += 21;
    }

    const pageCount = doc.getNumberOfPages();
    for (let index = 1; index <= pageCount; index++) {
      doc.setPage(index);
      rule(M, PH - 31, R, PH - 31);
      text(
        `Indiekonnect | ${invoiceNumber} | Page ${index} of ${pageCount}`,
        PW / 2,
        PH - 18,
        7,
        false,
        { align: "center" },
        true,
      );
    }

    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    if (popup && !popup.closed) {
      popup.location.replace(pdfUrl);
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 5 * 60 * 1000);
    } else {
      doc.save(`${invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, "_")}.pdf`);
      URL.revokeObjectURL(pdfUrl);
      toast.success("Invoice PDF downloaded; popup was blocked.");
    }
  } catch (error) {
    console.error("Indiekonnect invoice PDF error:", error);
    if (popup && !popup.closed) popup.close();
    toast.error(
      error instanceof Error
        ? error.message
        : "Could not generate invoice PDF.",
    );
  }
};
