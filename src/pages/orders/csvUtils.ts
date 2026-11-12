// src/pages/orders/csvUtils.ts

// Indiekonnect — CSV exports + compact GST tax-invoice PDF.

// Required: npm install jspdf jspdf-autotable qrcode

//            npm install -D @types/qrcode

import { toast } from "react-hot-toast";

import jsPDF from "jspdf";

import autoTable from "jspdf-autotable";

import QRCode from "qrcode";

import {
  INVOICE_LOGO_DATA_URL,
  INVOICE_LOGO_WIDTH,
  INVOICE_LOGO_HEIGHT,
} from "../../utils/invoiceLogoData";

// Logo: The ORIGINAL PNG is bundled as a data URI at build time.

// Generate it ONCE with: node scripts/embed-invoice-logo.mjs

// No runtime CORS, fetch, basePath, or /logo API dependency.

// =====================================================

// CSV HELPERS (existing functionality preserved)

// =====================================================

export const escapeCsvValue = (value: any): string => {
  if (value === null || value === undefined) return "";

  const str = String(value);

  return /[,"\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
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

export const generateOrdersCsv = (orders: any[]): string => {
  const headers = [
    "S.No.",

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

    "Product Name",

    "SKU",

    "Quantity",

    "Unit Price",

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

        order.order_reference || order.id || "",

        formatCsvDate(order.order_date || order.date) || "",

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

        order.courier_company || order.courierCompany || "",

        order.courier_tracking_number || order.courierTrackingNumber || "",

        formatCsvDate(
          order.courier_delivery_date || order.courierDeliveryDate,
        ) || "",

        item?.item_reference_id || item?.itemReferenceId || "",

        item?.product_name || item?.productName || "",

        item?.product_code || item?.sku || "",

        item?.quantity ?? "",

        item?.unit_price != null
          ? Number(item.unit_price).toFixed(2)
          : item?.unitPrice != null
            ? Number(item.unitPrice).toFixed(2)
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

    toast.success(`CSV downloaded — ${orders.length} orders exported`);
  } catch (error) {
    console.error("CSV download error:", error);

    toast.error("Failed to download CSV. Please try again.");
  }
};

// =====================================================
// BLINKIT-STYLE GST INVOICE - COMPLETE FULL-ORDER DATA
// =====================================================
// IMPORTANT:
// 1. Orders.tsx MUST continue to merge the invoice and order-details APIs.
// 2. This function NEVER filters products by orderItemId.
// 3. The order API is used for full-order totals; invoice API totals are
//    disclosed separately and flagged if they disagree.
// 4. This order-history QR is NOT an official signed GST e-invoice QR.

type InvoicePayload = {
  invoice?: Record<string, any>;
  order?: Record<string, any>;
  invoice_type?: string;
};

type AnyObject = Record<string, any>;
type RGB = [number, number, number];

const ORDER_HISTORY_URL =
  "https://www.markupdesigns.net/indikonnect-distributor/distributor/order-history/";

// Confirm registered legal name against the seller's legal/GST records.
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

const hasNumber = (value: any): boolean =>
  isPresent(value) && Number.isFinite(Number(value));

const formatMoney = (value: any): string =>
  asNumber(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const prettyStatus = (value: any) =>
  asText(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const dateIndia = (value: any): string => {
  if (!isPresent(value)) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return asText(value);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
};

const addressToText = (value: any): string => {
  if (!isPresent(value)) return "-";
  if (typeof value === "string") return asText(value);
  if (typeof value !== "object") return asText(value);
  const parts = [
    value.address_line_1 ?? value.address_line1,
    value.address_line_2 ?? value.address_line2,
    value.landmark,
    value.city,
    value.district,
    value.state,
    firstPresent(value.pincode, value.pin_code, value.postal_code),
    value.country,
  ].filter(isPresent);
  return parts.length ? parts.join(", ") : asText(value.full_address);
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

// A single source row may already include delivery charges in line_total.
// Split it only when the API amounts establish that relationship.
type InvoiceLine = {
  source: AnyObject;
  qty: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  shipping: number;
  itemTotal: number;
  fullLineTotal: number;
  splitShipping: boolean;
};

const normalizeInvoiceLine = (item: AnyObject): InvoiceLine => {
  const qty = asNumber(item.quantity, 1);
  const unit = asNumber(firstPresent(item.unit_price, item.unitPrice));
  const taxable = asNumber(
    firstPresent(item.taxable_value, item.taxable_amount),
    unit * qty,
  );
  const cgst = asNumber(firstPresent(item.cgst_amount, item.cgst));
  const sgst = asNumber(firstPresent(item.sgst_amount, item.sgst));
  const explicitIgst = firstPresent(item.igst_amount, item.igst);
  // Do not label unclassified GST as IGST without supporting data.
  const igst = asNumber(explicitIgst);
  const cess = asNumber(firstPresent(item.cess_amount, item.cess));
  const shipping = asNumber(
    firstPresent(
      item.total_shipping_charge,
      item.total_delivery_charge,
      hasNumber(item.shipping_charge_per_unit)
        ? asNumber(item.shipping_charge_per_unit) * qty
        : null,
    ),
  );
  const base = taxable + cgst + sgst + igst + cess;
  const fullLineTotal = asNumber(
    firstPresent(item.line_total, item.lineTotal),
    base + shipping,
  );
  const splitShipping =
    shipping > 0.00001 && Math.abs(fullLineTotal - (base + shipping)) <= 1.0;
  const itemTotal = splitShipping ? fullLineTotal - shipping : fullLineTotal;
  return {
    source: item,
    qty,
    taxable,
    cgst,
    sgst,
    igst,
    cess,
    shipping,
    itemTotal,
    fullLineTotal,
    splitShipping,
  };
};

export const openInvoicePdfInNewTab = async (
  payload: InvoicePayload,
  _orderItemId: number | null = null,
  targetWindow?: Window | null,
): Promise<void> => {
  // If the caller already opened a tab on click, reuse it to avoid popup blocks.
  const popup =
    targetWindow === undefined ? window.open("", "_blank") : targetWindow;

  try {
    const invoice: AnyObject = payload?.invoice ?? {};
    const order: AnyObject = payload?.order ?? {};
    const seller: AnyObject = invoice.seller ?? {};
    const buyer: AnyObject = invoice.buyer ?? {};
    const orderItems: AnyObject[] =
      Array.isArray(order.order_items) && order.order_items.length
        ? order.order_items
        : Array.isArray(order.items)
          ? order.items
          : [];
    if (!orderItems.length) {
      throw new Error(
        "Full-order item data is empty. Check the invoice and order API responses.",
      );
    }

    // Full order, irrespective of which row's invoice button was clicked.
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
    const buyerName = asText(
      firstPresent(buyer.name, order.user?.name, order.customer),
    );
    const buyerAddress = addressToText(
      firstPresent(
        order.billing_address,
        buyer.address,
        order.delivery_address,
        order.shipping_address,
      ),
    );
    const deliveryAddress = addressToText(
      firstPresent(
        order.delivery_address,
        order.shipping_address,
        buyer.address,
      ),
    );
    const sellerAddress = addressToText(
      firstPresent(seller.address, seller.full_address),
    );
    const state = firstPresent(
      invoice.delivery_state,
      invoice.place_of_supply,
      order.delivery_address?.state,
      order.billing_address?.state,
    );
    const payable = asNumber(
      firstPresent(order.total_payable, invoice.total_payable),
    );
    const invoicePayable = asNumber(invoice.total_payable);
    const itemSum = lines.reduce((acc, row) => acc + row.fullLineTotal, 0);
    const countQty = lines.reduce((acc, row) => acc + row.qty, 0);
    const taxableTotal = lines.reduce((acc, row) => acc + row.taxable, 0);
    const cgstTotal = lines.reduce((acc, row) => acc + row.cgst, 0);
    const sgstTotal = lines.reduce((acc, row) => acc + row.sgst, 0);
    const igstTotal = lines.reduce((acc, row) => acc + row.igst, 0);
    const cessTotal = lines.reduce((acc, row) => acc + row.cess, 0);

    console.info("GENERATING COMPLETE BLINKIT-STYLE PDF", {
      invoiceNumber,
      orderId: order.id,
      productCount: lines.length,
      productNames: lines.map(
        (line) => line.source.product_name ?? line.source.name,
      ),
      orderPayable: payable,
      invoicePayable,
    });

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
      compress: true,
    });
    doc.setProperties({
      title: `Indiekonnect Tax Invoice ${invoiceNumber}`,
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

    // 1. COMPACT TWO-COLUMN HEADER — same geometry as reference invoice.
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
      // The original tall logo is kept fully visible; brand wordmark fills
      // the wide left half of the reference-style header.
      text(
        "INDIEKONNECT",
        M + Math.max(68, logoDrawWidth + 17),
        y + 38,
        15.5,
        true,
      );
    }
    text("Tax Invoice", DIVIDER + RIGHT_W / 2, y + 42, 15.5, true, {
      align: "center",
    });
    y += headerH;

    // 2. SELLER / QR ROW.
    const sellerNameLines = wrap(DISPLAY_SELLER_NAME, LEFT_W - 15, 8.4, true);
    const sellerAddrLines = wrap(
      sellerAddress === "-"
        ? "Seller address not provided by API"
        : sellerAddress,
      LEFT_W - 16,
      7.2,
    );
    const sellerPairs: Array<[string, any]> = [
      ["GSTIN", firstPresent(seller.gstin, seller.gst_number)],
      [
        "FSSAI Licence No.",
        firstPresent(seller.fssai_license_number, seller.fssai),
      ],
      ["CIN", seller.cin],
      ["PAN", seller.pan],
    ].filter((entry) => isPresent(entry[1])) as Array<[string, any]>;
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

    // 3. INVOICE TO / ORDER IDENTIFIERS.
    // Addresses are explicitly taken from the full order object, not the
    // abbreviated invoice.buyer.address string.
    const buyerRows: Array<[string, any]> = [
      ["Name", buyerName],
      ["Address", buyerAddress],
      ["Delivery To", deliveryAddress],
      [
        "PIN Code",
        firstPresent(
          order.billing_address?.pincode,
          order.delivery_address?.pincode,
        ),
      ],
      ["State", state],
      ["Email", order.user?.email],
      ["Phone", order.user?.phone],
    ].filter(
      ([label, value]) => label !== "Delivery To" || value !== buyerAddress,
    ) as Array<[string, any]>;
    const infoRows: Array<[string, any]> = [
      ["Order Id", orderReference],
      [
        "Invoice Date",
        dateIndia(
          firstPresent(invoice.issued_at, invoice.created_at, order.created_at),
        ),
      ],
      [
        "Order Date",
        dateIndia(firstPresent(order.created_at, order.order_date)),
      ],
      ["Place of Supply", state],
      [
        "Order Status",
        prettyStatus(firstPresent(order.status, order.order_status)),
      ],
      ["Order Type", prettyStatus(order.order_type)],
    ];
    const leftLabelWidth = 82;
    const rightLabelWidth = 79;
    const calcRowsH = (
      rows: Array<[string, any]>,
      colWidth: number,
      labelW: number,
    ) =>
      rows.reduce(
        (total, [, value]) =>
          total +
          Math.max(
            14,
            wrap(value, colWidth - labelW - 14, 7.2).length * 9.2 + 4,
          ),
        33,
      );
    const infoH = Math.max(
      99,
      calcRowsH(buyerRows, LEFT_W, leftLabelWidth),
      calcRowsH(infoRows, RIGHT_W, rightLabelWidth),
    );
    room(infoH);
    borderRect(M, y, W, infoH);
    rule(DIVIDER, y, DIVIDER, y + infoH);
    text("Invoice To", M + 6, y + 13, 7.8, true);
    const drawDetails = (
      rows: Array<[string, any]>,
      x: number,
      width: number,
      labelW: number,
    ) => {
      let cursor = y + 26;
      rows.forEach(([label, value]) => {
        const wrapped = wrap(value, width - labelW - 14, 7.2);
        text(label, x + 6, cursor, 7.2, true);
        wrapped.forEach((line, i) =>
          text(
            `${i === 0 ? ": " : "  "}${line}`,
            x + labelW,
            cursor + i * 9.2,
            7.2,
          ),
        );
        cursor += Math.max(14, wrapped.length * 9.2 + 4);
      });
    };
    drawDetails(buyerRows, M, LEFT_W, leftLabelWidth);
    drawDetails(infoRows, DIVIDER, RIGHT_W, rightLabelWidth);
    y += infoH;

    // 4. PRODUCT GRID / CGST / SGST / IGST / DELIVERY LINES.
    // 14 columns are intentionally narrow, like the reference PDF.
    const widths = [18, 46, 104, 36, 30, 20, 45, 25, 31, 25, 31, 36, 31, 49];
    const ratio = W / widths.reduce((sum, next) => sum + next, 0);
    const columnStyles: Record<number, any> = {};
    widths.forEach((width, index) => {
      columnStyles[index] = {
        cellWidth: width * ratio,
        halign:
          index === 2 || index === 1
            ? "left"
            : index === 0 || index === 5
              ? "center"
              : "right",
      };
    });
    const body: string[][] = [];
    lines.forEach((row, index) => {
      const source = row.source;
      const mrp = firstPresent(
        source.mrp,
        source.mrp_price,
        source.maximum_retail_price,
        source.unit_price,
      );
      const explicitDiscount = firstPresent(
        source.discount_amount,
        source.discount_value,
      );
      const gstRate = asNumber(firstPresent(source.gst_rate, source.tax_rate));
      const cgstRate = firstPresent(
        source.cgst_rate,
        row.cgst > 0 && gstRate ? gstRate / 2 : null,
      );
      const sgstRate = firstPresent(
        source.sgst_rate,
        row.sgst > 0 && gstRate ? gstRate / 2 : null,
      );
      body.push([
        String(index + 1),
        asText(
          firstPresent(
            source.hsn_code,
            source.hsn,
            source.product_code,
            source.sku,
          ),
        ),
        asText(
          firstPresent(source.product_name, source.productName, source.name),
        ),
        formatMoney(mrp),
        isPresent(explicitDiscount) ? formatMoney(explicitDiscount) : "-",
        asText(row.qty),
        formatMoney(row.taxable),
        isPresent(cgstRate) ? formatMoney(cgstRate) : "-",
        formatMoney(row.cgst),
        isPresent(sgstRate) ? formatMoney(sgstRate) : "-",
        formatMoney(row.sgst),
        formatMoney(row.igst),
        formatMoney(row.cess),
        formatMoney(row.itemTotal),
      ]);
      if (row.splitShipping) {
        body.push([
          "-",
          "-",
          "Delivery and other charges",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          formatMoney(row.shipping),
        ]);
      }
    });
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M, top: 49, bottom: 45 },
      theme: "grid",
      head: [
        [
          "Sr.\nNo.",
          "HSN /\nSKU",
          "Item Description",
          "MRP",
          "Disc.",
          "Qty.",
          "Taxable\nValue",
          "CGST\n(%)",
          "CGST\n(INR)",
          "SGST\n(%)",
          "SGST\n(INR)",
          "IGST /\nGST",
          "Cess\n(INR)",
          "Total",
        ],
      ],
      body,
      foot: [
        [
          {
            content: "Total",
            colSpan: 5,
            styles: { halign: "center", fontStyle: "bold" },
          },
          asText(countQty),
          formatMoney(taxableTotal),
          "",
          formatMoney(cgstTotal),
          "",
          formatMoney(sgstTotal),
          formatMoney(igstTotal),
          formatMoney(cessTotal),
          formatMoney(itemSum),
        ],
      ],
      showFoot: "lastPage",
      styles: {
        font: "helvetica",
        fontSize: 6.25,
        textColor: INK,
        lineColor: LINE,
        lineWidth: 0.5,
        cellPadding: { top: 4.2, bottom: 4.2, left: 1.5, right: 1.5 },
        minCellHeight: 16,
        overflow: "linebreak",
        valign: "middle",
      },
      headStyles: {
        fillColor: LIGHT,
        textColor: INK,
        fontStyle: "bold",
        fontSize: 6.1,
        minCellHeight: 25,
      },
      footStyles: { fillColor: LIGHT, textColor: INK, fontStyle: "bold" },
      columnStyles,
    });
    y =
      (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY ?? y;

    // 5. AMOUNT IN WORDS — directly below the product table like Blinkit.
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

    // 6. SELLER / AUTHORISED SIGNATORY BOX.
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
      "Authorised Signatory",
      DIVIDER + RIGHT_W / 2,
      y + signatureH - 9,
      7.2,
      false,
      { align: "center" },
    );
    y += signatureH;

    // 7. REVERSE CHARGE — don't invent a "No" when API doesn't specify it.
    room(21);
    borderRect(M, y, W, 21);
    const reverse = firstPresent(
      invoice.reverse_charge,
      invoice.is_reverse_charge,
    );
    const reverseText =
      reverse === null
        ? "Not specified"
        : [true, 1, "1", "yes", "true"].includes(reverse)
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

    // 8. ANNEXURE — only supplied or item-level delivery charges.
    const suppliedCharges: AnyObject[] = Array.isArray(invoice.charges)
      ? invoice.charges
      : Array.isArray(invoice.annexure)
        ? invoice.annexure
        : [];
    const charges: AnyObject[] = suppliedCharges.length
      ? suppliedCharges
      : lines
          .filter((line) => line.shipping > 0)
          .map((line) => ({
            name: `Delivery / shipping: ${asText(firstPresent(line.source.product_name, line.source.name))}`,
            amount: line.shipping,
          }));
    if (charges.length) {
      room(40);
      text("Annexure", M, y + 10, 8, true);
      y += 13;
      autoTable(doc, {
        startY: y,
        margin: { left: M, right: M, top: 49, bottom: 45 },
        theme: "grid",
        head: [
          [
            "S.No.",
            "Nature of charge",
            "Tax Rate",
            "Cess Rate",
            "Charge (INR)",
            "CGST",
            "SGST",
            "IGST / GST",
            "Cess",
          ],
        ],
        body: charges.map((charge, index) => [
          String(index + 1),
          asText(firstPresent(charge.name, charge.label, charge.description)),
          hasNumber(charge.tax_rate) ? `${formatMoney(charge.tax_rate)}%` : "-",
          hasNumber(charge.cess_rate)
            ? `${formatMoney(charge.cess_rate)}%`
            : "-",
          formatMoney(
            firstPresent(charge.amount, charge.taxable_value, charge.total),
          ),
          hasNumber(charge.cgst_amount) ? formatMoney(charge.cgst_amount) : "-",
          hasNumber(charge.sgst_amount) ? formatMoney(charge.sgst_amount) : "-",
          hasNumber(charge.igst_amount) ? formatMoney(charge.igst_amount) : "-",
          hasNumber(charge.cess_amount) ? formatMoney(charge.cess_amount) : "-",
        ]),
        styles: {
          font: "helvetica",
          fontSize: 6.35,
          cellPadding: 3,
          lineColor: LINE,
          lineWidth: 0.5,
          textColor: INK,
          overflow: "linebreak",
        },
        headStyles: { fillColor: LIGHT, textColor: INK, fontStyle: "bold" },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: W - 28 - 7 * 53 },
          2: { cellWidth: 53 },
          3: { cellWidth: 53 },
          4: { cellWidth: 53 },
          5: { cellWidth: 53 },
          6: { cellWidth: 53 },
          7: { cellWidth: 53 },
          8: { cellWidth: 53 },
        },
      });
      y =
        ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
          ?.finalY ?? y) + 8;
    }

    // No forced supplementary/continued pages. The core invoice ends after
    // the Annexure above. Table overflow may still paginate automatically.

    // Consistent printed footer on every page.
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
      // Keep the object URL alive while the browser PDF viewer loads it.
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
