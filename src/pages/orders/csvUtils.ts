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
// COMPACT BLACK-BORDERED TAX INVOICE (Blinkit-style)
// =====================================================
interface InvoicePayload {
  invoice: any;
  order: any;
}

type JsonObject = Record<string, any>;
const firstValue = (...values: any[]): any =>
  values.find((v) => v !== undefined && v !== null && v !== "") ?? null;
const safeText = (v: any, fallback = "-"): string =>
  v === undefined || v === null || v === "" ? fallback : String(v);
const money = (v: any): string => {
  const n = Number(v);
  return (Number.isFinite(n) ? n : 0).toFixed(2);
};
const number = (v: any, fallback = 0): number => {
  const n = Number(v);
  return v === null || v === undefined || v === "" || !Number.isFinite(n)
    ? fallback
    : n;
};
const hasNumber = (v: any): boolean =>
  v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v));
const dateLabel = (v: any): string => {
  if (!v) return "-";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? String(v)
    : d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};
const formatAddress = (v: any): string => {
  if (!v) return "-";
  if (typeof v === "string") return v;
  if (v.full_address) return String(v.full_address);
  return (
    [
      v.address_line1,
      v.address_line2,
      v.landmark,
      v.city,
      v.district,
      v.state,
      v.pincode || v.pin_code,
    ]
      .filter(Boolean)
      .join(", ") || "-"
  );
};

const SMALL = [
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
const TENS = [
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
const belowThousand = (value: number): string => {
  let n = Math.floor(value);
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(`${SMALL[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)]);
    if (n % 10) parts.push(SMALL[n % 10]);
  } else if (n > 0) parts.push(SMALL[n]);
  return parts.join(" ");
};
const indianNumberWords = (value: number): string => {
  if (!value) return "Zero";
  let n = Math.floor(value);
  const chunks: string[] = [];
  for (const [unit, name] of [
    [1000000000, "Arab"],
    [10000000, "Crore"],
    [100000, "Lakh"],
    [1000, "Thousand"],
  ] as const) {
    if (n >= unit) {
      chunks.push(`${belowThousand(Math.floor(n / unit))} ${name}`);
      n %= unit;
    }
  }
  if (n) chunks.push(belowThousand(n));
  return chunks.join(" ");
};
const amountInWords = (value: number): string => {
  const absPaise = Math.round(Math.abs(value) * 100);
  const rupees = Math.floor(absPaise / 100);
  const paise = absPaise % 100;
  return `${value < 0 ? "Minus " : ""}Rupees ${indianNumberWords(rupees)}${
    paise ? ` and ${indianNumberWords(paise)} Paise` : ""
  } Only`;
};

const imageFormat = (dataURL: string): "PNG" | "JPEG" | null => {
  if (/^data:image\/png;base64,/i.test(dataURL)) return "PNG";
  if (/^data:image\/(jpeg|jpg);base64,/i.test(dataURL)) return "JPEG";
  return null;
};

// IMPORTANT: The QR we generate is only an invoice-reference QR, NOT a signed GST e-invoice QR.
// If the backend returns a government-signed QR image as data URL, that image takes priority.
export const openInvoicePdfInNewTab = async (
  payload: InvoicePayload,
  orderItemId: number | null = null,
): Promise<void> => {
  // Decode and verify the actual PNG bytes, rather than rejecting valid
  // images because of a fragile Base64 regex or stale metadata.
  const logoData =
    typeof INVOICE_LOGO_DATA_URL === "string"
      ? INVOICE_LOGO_DATA_URL.trim()
      : "";
  let logoWidth = Number(INVOICE_LOGO_WIDTH);
  let logoHeight = Number(INVOICE_LOGO_HEIGHT);
  try {
    const prefix = "data:image/png;base64,";
    if (!logoData.startsWith(prefix))
      throw new Error("PNG data URL prefix missing");
    const binary = atob(logoData.slice(prefix.length).replace(/\s/g, ""));
    if (binary.length < 24) throw new Error("PNG data is incomplete");
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    if (!signature.every((byte, i) => binary.charCodeAt(i) === byte)) {
      throw new Error("Invalid PNG signature");
    }
    const readU32 = (offset: number) =>
      (binary.charCodeAt(offset) * 16777216 +
        (binary.charCodeAt(offset + 1) << 16) +
        (binary.charCodeAt(offset + 2) << 8) +
        binary.charCodeAt(offset + 3)) >>>
      0;
    // Read authoritative dimensions from the PNG IHDR chunk.
    logoWidth = readU32(16);
    logoHeight = readU32(20);
    if (logoWidth <= 0 || logoHeight <= 0) {
      throw new Error("PNG dimensions are invalid");
    }
  } catch (error) {
    console.error("Invoice PNG logo could not be loaded:", error, {
      dataLength: logoData.length,
      exportedWidth: INVOICE_LOGO_WIDTH,
      exportedHeight: INVOICE_LOGO_HEIGHT,
    });
    toast.error("Invoice logo could not be loaded. Check the PNG data file.");
    return;
  }

  // Open synchronously before QR async generation, so browser popup blockers do not intervene.
  const newTab = window.open("", "_blank");
  if (!newTab) {
    toast.error("Please allow pop-ups to view the invoice PDF.");
    return;
  }

  try {
    const invoice: JsonObject = payload?.invoice || {};
    const order: JsonObject = payload?.order || {};
    const seller: JsonObject = invoice.seller || {};
    const buyer: JsonObject = invoice.buyer || {};
    const orderItems: JsonObject[] = Array.isArray(order.order_items)
      ? order.order_items
      : Array.isArray(order.items)
        ? order.items
        : [];
    const items =
      orderItemId == null
        ? orderItems
        : orderItems.filter((it) => String(it.id) === String(orderItemId));
    if (orderItemId != null && !items.length)
      throw new Error("Requested order item was not found.");

    const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const X = 32;
    const W = pageWidth - 2 * X;
    const dividerX = X + W * 0.69;
    const BLACK: [number, number, number] = [27, 27, 27];
    const LIGHT: [number, number, number] = [244, 244, 244];
    let y = 32;
    const line = (x1: number, y1: number, x2: number, y2: number) => {
      doc.setDrawColor(...BLACK);
      doc.setLineWidth(0.55);
      doc.line(x1, y1, x2, y2);
    };
    const rect = (
      x: number,
      top: number,
      width: number,
      height: number,
      fill = false,
    ) => {
      doc.setDrawColor(...BLACK);
      doc.setLineWidth(0.55);
      if (fill) doc.setFillColor(...LIGHT);
      doc.rect(x, top, width, height, fill ? "FD" : "S");
    };
    const write = (
      content: any,
      x: number,
      baseline: number,
      size = 7.1,
      bold = false,
      options?: { align?: "left" | "center" | "right"; maxWidth?: number },
    ) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      doc.setTextColor(...BLACK);
      doc.text(safeText(content), x, baseline, options);
    };
    const wrap = (content: any, maxWidth: number, size = 7.1): string[] => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(size);
      return doc.splitTextToSize(safeText(content), maxWidth) as string[];
    };
    const pageIfNeeded = (needed: number) => {
      if (y + needed <= pageHeight - 40) return;
      doc.addPage();
      y = 32;
      write("TAX INVOICE — CONTINUED", X, y + 10, 9, true);
      line(X, y + 16, X + W, y + 16);
      y += 27;
    };

    const reference = safeText(
      firstValue(
        invoice.invoice_number,
        invoice.number,
        order.order_reference,
        order.id,
      ),
    );
    const orderReference = safeText(
      firstValue(order.order_reference, order.id),
    );
    const invoiceDate = firstValue(
      invoice.invoice_date,
      invoice.date,
      items[0]?.dispatched_at,
      orderItems[0]?.dispatched_at,
      order.created_at,
      order.order_date,
    );
    const sellerName = "INDIEKONNECT ENTERPRISE PRIVATE LIMITED";
    const buyerName = safeText(
      firstValue(buyer.name, order.user?.name, order.customer),
    );
    const sellerAddress = formatAddress(
      firstValue(seller.address, seller.full_address),
    );
    const buyerAddress = formatAddress(
      firstValue(buyer.address, order.shipping_address),
    );
    const sellerFields: Array<[string, any]> = [
      ["GSTIN", firstValue(seller.gstin, seller.gst_number)],
      [
        "FSSAI Licence Number",
        firstValue(seller.fssai_license_number, seller.fssai),
      ],
      ["CIN", seller.cin],
      ["PAN", seller.pan],
    ].filter(
      ([, value]) => value !== null && value !== undefined && value !== "",
    ) as Array<[string, any]>;

    // 1 — Original Indiekonnect logo + Tax Invoice heading.
    // The PNG bytes are embedded in the app at BUILD TIME and in the PDF at RUN TIME.
    // The embedded logo needs no external URL or CORS request.
    const titleH = 102;
    rect(X, y, W, titleH);
    line(dividerX, y, dividerX, y + titleH);

    const logoMaxW = dividerX - X - 18;
    const logoMaxH = titleH - 10;
    const logoScale = Math.min(logoMaxW / logoWidth, logoMaxH / logoHeight);
    const logoW = logoWidth * logoScale;
    const logoH = logoHeight * logoScale;

    doc.addImage(
      logoData,
      "PNG",
      X + 7,
      y + (titleH - logoH) / 2,
      logoW,
      logoH,
    );
    write("Tax Invoice", (dividerX + X + W) / 2, y + titleH / 2 + 5, 15, true, {
      align: "center",
    });
    y += titleH;

    // 2 — Seller (left) and reference QR (right)
    const sellerAddrLines = wrap(sellerAddress, dividerX - X - 18, 7);
    const nameLines = wrap(sellerName, dividerX - X - 18, 8.4);
    const sellerH = Math.max(
      110,
      38 +
        nameLines.length * 9 +
        sellerAddrLines.length * 8 +
        sellerFields.length * 10,
    );
    rect(X, y, W, sellerH);
    line(dividerX, y, dividerX, y + sellerH);
    write("Sold By / Seller", X + 6, y + 11, 7.3, true);
    nameLines.forEach((t, i) => write(t, X + 6, y + 24 + i * 9, 8.4, true));
    let sellerRowY = y + 27 + nameLines.length * 9;
    sellerAddrLines.forEach((t) => {
      write(t, X + 6, sellerRowY, 7);
      sellerRowY += 8;
    });
    sellerFields.forEach(([key, value]) => {
      write(`${key}:`, X + 6, sellerRowY + 2, 7, true);
      write(value, X + 112, sellerRowY + 2, 7);
      sellerRowY += 10;
    });

    const qrSize = Math.min(63, sellerH - 38);
    const qrX = dividerX + (X + W - dividerX - qrSize) / 2;
    const qrY = y + 7;
    const govtQr = firstValue(
      invoice.signed_qr_data_url,
      invoice.irn_qr_data_url,
    );
    let officialQr = false;
    if (typeof govtQr === "string" && imageFormat(govtQr)) {
      try {
        doc.addImage(govtQr, imageFormat(govtQr)!, qrX, qrY, qrSize, qrSize);
        officialQr = true;
      } catch (e) {
        console.warn("Official invoice QR could not be rendered:", e);
      }
    }
    if (!officialQr) {
      // Use the provided URL for the invoice reference QR
      const qrData = await QRCode.toDataURL(
        "https://www.markupdesigns.net/indiekonnect-distributor/distributor/order-history/",
        {
          width: 180,
          margin: 1,
          errorCorrectionLevel: "M",
        },
      );
      doc.addImage(qrData, "PNG", qrX, qrY, qrSize, qrSize);
    }
    write(
      officialQr ? "Signed invoice QR" : "Invoice reference QR",
      (dividerX + X + W) / 2,
      qrY + qrSize + 10,
      6.2,
      false,
      { align: "center" },
    );
    write("Invoice Number:", dividerX + 7, y + sellerH - 16, 7, true);
    write(reference, dividerX + 79, y + sellerH - 16, 6.7, false, {
      maxWidth: X + W - dividerX - 84,
    });
    y += sellerH;

    // 3 — Invoice To + order identifiers
    const buyerAddrLines = wrap(buyerAddress, dividerX - X - 79, 7);
    const buyerH = Math.max(85, 45 + buyerAddrLines.length * 8);
    rect(X, y, W, buyerH);
    line(dividerX, y, dividerX, y + buyerH);
    write("Invoice To", X + 6, y + 12, 7.5, true);
    write("Name", X + 6, y + 26, 7, true);
    write(`: ${buyerName}`, X + 78, y + 26, 7);
    write("Address", X + 6, y + 39, 7, true);
    buyerAddrLines.forEach((t, i) =>
      write(`${i === 0 ? ": " : "  "}${t}`, X + 78, y + 39 + i * 8, 7),
    );
    const pin = firstValue(
      buyer.pincode,
      buyer.pin_code,
      order.shipping_address?.pincode,
      order.shipping_address?.pin_code,
    );
    const state = firstValue(buyer.state, order.shipping_address?.state);
    const pos = firstValue(
      invoice.place_of_supply,
      order.place_of_supply,
      state,
    );
    const rightMeta: Array<[string, any]> = [
      ["Order ID", orderReference],
      ["Invoice Date", dateLabel(invoiceDate)],
      ["Place of Supply", pos],
      ...(orderItemId != null
        ? [["Item ID", orderItemId] as [string, any]]
        : []),
    ];
    rightMeta.forEach(([k, v], i) => {
      const ry = y + 15 + i * 14;
      write(`${k}:`, dividerX + 5, ry, 6.9, true);
      write(safeText(v), dividerX + 79, ry, 6.9, false, {
        maxWidth: X + W - dividerX - 83,
      });
    });
    if (pin) write(`PIN: ${pin}`, X + 6, y + buyerH - 8, 6.7);
    y += buyerH;

    // 4 — Item tax table. All amounts are sourced from the invoice/order response.
    // If the API has no CGST/SGST fields or verified state codes, tax remains in GST/IGST.
    const sellerStateCode = safeText(seller.gstin, "").slice(0, 2);
    // A buyer's GSTIN does not itself establish the legal place of supply.
    const supplyStateCode = safeText(
      firstValue(invoice.place_of_supply_code, invoice.pos_state_code),
      "",
    )
      .padStart(2, "0")
      .slice(0, 2);
    const isIntrastate =
      /^\d{2}$/.test(sellerStateCode) &&
      /^\d{2}$/.test(supplyStateCode) &&
      sellerStateCode === supplyStateCode;

    type ItemRow = {
      qty: number;
      taxable: number;
      cgst: number;
      sgst: number;
      gstOther: number;
      cess: number;
      amount: number;
      columns: string[];
    };
    const prepared: ItemRow[] = items.map((it, i) => {
      const qty = number(it.quantity, 1);
      const price = number(firstValue(it.unit_price, it.unitPrice));
      const mrp = number(
        firstValue(it.mrp, it.mrp_price, it.maximum_retail_price),
        price,
      );
      const discount = number(
        firstValue(it.discount_amount, it.discount_value),
        mrp > price ? (mrp - price) * qty : 0,
      );
      // unit_price is normally the selling price; do not deduct an MRP-based
      // display discount from it again (that would understate taxable value).
      const taxable = number(
        firstValue(it.taxable_value, it.taxable_amount),
        price * qty,
      );
      const gstRate = number(firstValue(it.gst_rate, it.tax_rate));
      const gstAmount = number(
        firstValue(it.gst_amount, it.tax_amount),
        hasNumber(it.taxable_value) || hasNumber(it.taxable_amount)
          ? (taxable * gstRate) / 100
          : 0,
      );
      const specifiedCGST = firstValue(it.cgst_amount, it.cgst);
      const specifiedSGST = firstValue(it.sgst_amount, it.sgst);
      const specifiedIGST = firstValue(it.igst_amount, it.igst);
      const hasSplit = [specifiedCGST, specifiedSGST, specifiedIGST].some(
        hasNumber,
      );
      let cgst = 0;
      let sgst = 0;
      let gstOther = 0;
      if (hasSplit) {
        cgst = number(specifiedCGST);
        sgst = number(specifiedSGST);
        gstOther = number(specifiedIGST, Math.max(0, gstAmount - cgst - sgst));
      } else if (isIntrastate) {
        cgst = Math.round(gstAmount * 50) / 100;
        sgst = gstAmount - cgst;
      } else {
        gstOther = gstAmount;
      }
      const cess = number(firstValue(it.cess_amount, it.cess));
      const amount = number(
        firstValue(it.line_total, it.lineTotal),
        taxable + gstAmount + cess,
      );
      return {
        qty,
        taxable,
        cgst,
        sgst,
        gstOther,
        cess,
        amount,
        columns: [
          String(i + 1),
          safeText(
            firstValue(it.hsn_code, it.hsn, it.upc, it.product_code, it.sku),
          ),
          safeText(firstValue(it.product_name, it.productName, it.name)),
          money(mrp),
          money(discount),
          String(qty),
          money(taxable),
          cgst || hasNumber(specifiedCGST)
            ? money(number(it.cgst_rate, gstRate / 2))
            : "-",
          money(cgst),
          sgst || hasNumber(specifiedSGST)
            ? money(number(it.sgst_rate, gstRate / 2))
            : "-",
          money(sgst),
          money(gstOther),
          money(cess),
          money(amount),
        ],
      };
    });
    const sums = (field: keyof ItemRow): number =>
      prepared.reduce((total, item) => total + Number(item[field] || 0), 0);
    const itemSpecific = orderItemId != null;
    const subtotal = itemSpecific
      ? number(
          firstValue(items[0]?.taxable_value, items[0]?.taxable_amount),
          sums("taxable"),
        )
      : number(
          firstValue(
            invoice.subtotal_before_redemption,
            invoice.subtotal,
            order.subtotal,
          ),
          sums("taxable"),
        );
    const discount = itemSpecific
      ? number(
          firstValue(
            items[0]?.coupon_discount,
            items[0]?.coupon_discount_amount,
          ),
        )
      : number(firstValue(invoice.coupon_discount, order.coupon_discount));
    const shipping = itemSpecific
      ? number(
          firstValue(
            items[0]?.total_shipping_charge,
            items[0]?.total_delivery_charge,
          ),
        )
      : number(
          firstValue(
            invoice.shipping_charge,
            order.shipping_charge,
            order.shippingCharge,
          ),
        );
    const taxTotal = itemSpecific
      ? number(
          firstValue(items[0]?.gst_amount, items[0]?.tax_amount),
          sums("cgst") + sums("sgst") + sums("gstOther"),
        )
      : number(
          firstValue(invoice.total_tax, order.total_gst, order.totalGst),
          sums("cgst") + sums("sgst") + sums("gstOther"),
        );
    const totalPayable = itemSpecific
      ? number(
          firstValue(items[0]?.line_total, items[0]?.lineTotal),
          sums("amount"),
        )
      : number(
          firstValue(
            invoice.total_payable,
            order.total_payable,
            order.totalPayable,
          ),
          sums("amount"),
        );

    // Add the total in the grid itself, as in the reference invoice.
    const tableWidths = [
      19, 48, 106, 34, 33, 22, 44, 27, 31, 27, 31, 29, 29, 51,
    ];
    const ratio = W / tableWidths.reduce((a, b) => a + b, 0);
    const columnStyles: Record<
      number,
      { cellWidth: number; halign: "left" | "right" | "center" }
    > = {};
    tableWidths.forEach((width, idx) => {
      columnStyles[idx] = {
        cellWidth: width * ratio,
        halign:
          idx === 2 ? "left" : idx === 0 || idx === 5 ? "center" : "right",
      };
    });
    columnStyles[1].halign = "left";
    autoTable(doc, {
      startY: y,
      margin: { left: X, right: X, top: 42, bottom: 42 },
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
          "GST /\nIGST",
          "Cess\n(INR)",
          "Total",
        ],
      ],
      body: prepared.length
        ? prepared.map((p) => p.columns)
        : [
            [
              "-",
              "-",
              "No item details provided",
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
              "-",
            ],
          ],
      foot: [
        [
          {
            content: "Total",
            colSpan: 5,
            styles: { halign: "center", fontStyle: "bold" },
          },
          String(sums("qty")),
          money(sums("taxable")),
          "",
          money(sums("cgst")),
          "",
          money(sums("sgst")),
          money(sums("gstOther")),
          money(sums("cess")),
          money(totalPayable),
        ],
      ],
      showFoot: "lastPage",
      styles: {
        font: "helvetica",
        fontSize: 6.35,
        textColor: BLACK,
        lineColor: BLACK,
        lineWidth: 0.45,
        cellPadding: { top: 5, right: 2, bottom: 5, left: 2 },
        valign: "middle",
        overflow: "linebreak",
        minCellHeight: 18,
      },
      headStyles: {
        fillColor: LIGHT,
        textColor: BLACK,
        fontStyle: "bold",
        fontSize: 6.4,
        minCellHeight: 30,
      },
      footStyles: { fillColor: LIGHT, textColor: BLACK, fontStyle: "bold" },
      columnStyles,
      didDrawPage: (data: { pageNumber: number }) => {
        if (data.pageNumber > 1) {
          write("TAX INVOICE — CONTINUED", X, 29, 9, true);
          write(`Invoice No: ${reference}`, X + W, 29, 7, false, {
            align: "right",
          });
        }
      },
    });
    const lastTable = doc as jsPDF & { lastAutoTable?: { finalY: number } };
    y = (lastTable.lastAutoTable?.finalY ?? y) + 9;

    // 5 — Order summary, amount in words, and seller/signature grid
    const summaryRows: Array<[string, string]> = [
      ["Subtotal", money(subtotal)],
      ["Coupon Discount", money(discount)],
      ["Shipping / Delivery Charge", money(shipping)],
      ["GST (as provided by API)", money(taxTotal)],
      ["Total Payable (INR)", money(totalPayable)],
    ];
    const summaryH = summaryRows.length * 16;
    pageIfNeeded(summaryH);
    const summaryLeft = X + W * 0.53;
    rect(summaryLeft, y, X + W - summaryLeft, summaryH);
    summaryRows.forEach(([label, amount], i) => {
      if (i) line(summaryLeft, y + i * 16, X + W, y + i * 16);
      if (i === summaryRows.length - 1) {
        doc.setFillColor(...LIGHT);
        doc.rect(
          summaryLeft + 0.5,
          y + i * 16 + 0.5,
          X + W - summaryLeft - 1,
          15,
          "F",
        );
      }
      write(
        label,
        summaryLeft + 5,
        y + 11 + i * 16,
        i === summaryRows.length - 1 ? 7.8 : 7.1,
        i === summaryRows.length - 1,
      );
      write(
        amount,
        X + W - 5,
        y + 11 + i * 16,
        i === summaryRows.length - 1 ? 8 : 7.1,
        true,
        { align: "right" },
      );
    });
    y += summaryH;

    const wordsLines = wrap(
      `Amount in Words: ${amountInWords(totalPayable)}`,
      W - 12,
      7.2,
    );
    const wordsH = Math.max(22, wordsLines.length * 9 + 8);
    pageIfNeeded(wordsH);
    rect(X, y, W, wordsH);
    wordsLines.forEach((t, i) => write(t, X + 6, y + 13 + i * 9, 7.2, i === 0));
    y += wordsH;

    const legalH = 67;
    pageIfNeeded(legalH);
    rect(X, y, W, legalH);
    line(dividerX, y, dividerX, y + legalH);
    write(sellerName, X + 6, y + 12, 7.6, true);
    if (seller.gstin) write(`GSTIN: ${seller.gstin}`, X + 6, y + 25, 7);
    if (seller.cin) write(`CIN: ${seller.cin}`, X + 6, y + 37, 7);
    if (seller.pan) write(`PAN: ${seller.pan}`, X + 6, y + 49, 7);
    const signatureData = firstValue(
      invoice.signature_data_url,
      seller.signature_data_url,
    );
    if (typeof signatureData === "string" && imageFormat(signatureData)) {
      try {
        doc.addImage(
          signatureData,
          imageFormat(signatureData)!,
          dividerX + 44,
          y + 5,
          78,
          37,
        );
      } catch (e) {
        console.warn("Invoice signature image was ignored:", e);
      }
    }
    write("Authorised Signatory", (dividerX + X + W) / 2, y + 57, 7, false, {
      align: "center",
    });
    y += legalH;

    const reverseCharge = firstValue(
      invoice.reverse_charge,
      invoice.is_reverse_charge,
    );
    pageIfNeeded(18);
    rect(X, y, W, 18);
    write(
      `Whether tax is payable on reverse charge: ${
        reverseCharge == null
          ? "Not specified"
          : reverseCharge === true ||
              reverseCharge === 1 ||
              reverseCharge === "1" ||
              reverseCharge === "yes"
            ? "Yes"
            : "No"
      }`,
      X + 6,
      y + 12,
      7,
      true,
    );
    y += 25;

    // 6 — Annexure, but only when charges are actually supplied by the backend.
    const suppliedCharges: JsonObject[] = Array.isArray(invoice.charges)
      ? invoice.charges
      : Array.isArray(invoice.annexure)
        ? invoice.annexure
        : [];
    const charges: JsonObject[] = suppliedCharges.length
      ? suppliedCharges
      : shipping > 0
        ? [{ name: "Shipping / delivery charge", amount: shipping }]
        : [];
    if (charges.length) {
      pageIfNeeded(36);
      write("Annexure", X, y + 1, 8.5, true);
      autoTable(doc, {
        startY: y + 6,
        margin: { left: X, right: X, top: 38, bottom: 40 },
        theme: "grid",
        head: [
          [
            "S.No.",
            "Nature of charge",
            "Tax Rate",
            "Cess Rate",
            "Taxable Value",
            "CGST",
            "SGST",
            "IGST / GST",
            "Cess",
          ],
        ],
        body: charges.map((charge, index) => [
          String(index + 1),
          safeText(firstValue(charge.name, charge.label, charge.description)),
          hasNumber(charge.tax_rate) ? money(charge.tax_rate) : "-",
          hasNumber(charge.cess_rate) ? money(charge.cess_rate) : "-",
          money(firstValue(charge.taxable_value, charge.amount, charge.total)),
          money(charge.cgst_amount),
          money(charge.sgst_amount),
          money(firstValue(charge.igst_amount, charge.gst_amount)),
          money(charge.cess_amount),
        ]),
        styles: {
          font: "helvetica",
          fontSize: 6.7,
          textColor: BLACK,
          lineColor: BLACK,
          lineWidth: 0.45,
          cellPadding: 3,
          minCellHeight: 14,
        },
        headStyles: {
          fillColor: LIGHT,
          textColor: BLACK,
          fontStyle: "bold",
          fontSize: 6.7,
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: W - 30 - 7 * 55 },
          2: { cellWidth: 55 },
          3: { cellWidth: 55 },
          4: { cellWidth: 55 },
          5: { cellWidth: 55 },
          6: { cellWidth: 55 },
          7: { cellWidth: 55 },
          8: { cellWidth: 55 },
        },
      });
      y =
        ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
          ?.finalY ?? y) + 14;
    }

    // 7 — Seller-provided terms only (no invented commercial or legal terms).
    const termsRaw = firstValue(
      invoice.terms_and_conditions,
      seller.terms_and_conditions,
    );
    const terms = Array.isArray(termsRaw)
      ? termsRaw.map(String).filter(Boolean)
      : typeof termsRaw === "string"
        ? termsRaw.split(/\r?\n/).filter(Boolean)
        : [];
    if (terms.length) {
      pageIfNeeded(34);
      write("Terms & Conditions:", X, y, 8.5, true);
      y += 10;
      terms.forEach((term, i) => {
        const lines = wrap(`${i + 1}. ${term}`, W - 5, 7);
        pageIfNeeded(lines.length * 9 + 3);
        lines.forEach((t) => {
          write(t, X, y + 8, 7);
          y += 9;
        });
        y += 2;
      });
    }

    // Page footer for all pages
    const pages = doc.getNumberOfPages();
    for (let p = 1; p <= pages; p += 1) {
      doc.setPage(p);
      line(X, pageHeight - 30, X + W, pageHeight - 30);
      write(
        "Invoice generated from the supplied order/invoice record.",
        X,
        pageHeight - 19,
        6.5,
      );
      write(`Page ${p} of ${pages}`, X + W, pageHeight - 19, 6.5, false, {
        align: "right",
      });
    }

    // Display the real PDF in the already-open browser tab.
    const blobUrl = URL.createObjectURL(doc.output("blob"));
    newTab.location.href = blobUrl;
    newTab.focus();
    toast.success("Invoice PDF opened in a new tab.");
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5 * 60 * 1000);
  } catch (error) {
    console.error("Invoice PDF generation error:", error);
    newTab.close();
    toast.error(
      error instanceof Error
        ? error.message
        : "Failed to generate invoice PDF.",
    );
  }
};
