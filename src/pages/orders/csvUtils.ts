"use client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import Logo from "../../../public/indiekonnect-web/images/logo.png";
// =====================================================
// CONFIGURATION
// =====================================================
type InvoiceRecord = Record<string, any>;
type RGB = [number, number, number];
const LOGO_PATHS = [
  Logo.src,
  "/indiekonnect-web/images/logo.png",
  "/images/logo.png",
  "/logo.png",
];
const INK: RGB = [30, 30, 30];
const GRAY: RGB = [95, 95, 95];
const BORDER: RGB = [75, 75, 75];
const LIGHT: RGB = [242, 242, 242];
// =====================================================
// COMMON HELPERS
// =====================================================
const isPresent = (value: any): boolean =>
  value !== undefined && value !== null && String(value).trim() !== "";
const firstValue = (...values: any[]): any => values.find(isPresent);
const safeText = (value: any, fallback = "-"): string =>
  isPresent(value) ? String(value).trim() : fallback;
const toNumber = (value: any): number | null => {
  if (!isPresent(value)) return null;
  const number = Number(String(value).replace(/[,₹]/g, "").trim());
  return Number.isFinite(number) ? number : null;
};
const formatMoney = (value: any): string => {
  const number = toNumber(value);
  if (number === null) return "-";
  return number.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
const formatDate = (value: any): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
};
const prettyStatus = (value: any): string =>
  safeText(value)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
// =====================================================
// LOGO HELPERS
// =====================================================
const loadImageAsBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error(`Unable to load logo: ${url}`));
    img.src = url;
  });
};
const loadLogo = async (): Promise<string | null> => {
  for (const path of LOGO_PATHS) {
    try {
      if (path) return await loadImageAsBase64(path);
    } catch {
      continue;
    }
  }
  return null;
};
// =====================================================
// API NORMALIZATION
// =====================================================
const normalizeInvoiceResponse = (response: any) => {
  const root = response || {};
  const payload = [root?.data?.data, root?.data, root].find(
    (candidate) => candidate?.invoice,
  );
  if (!payload) {
    throw new Error("Invoice information not found.");
  }
  const invoice = payload.invoice || {};
  const order = payload.order || {};
  const rawItems = firstValue(
    invoice.invoice_items,
    invoice.line_items,
    invoice.items,
    order.order_items,
    order.items,
    order.order_lines,
  );
  const items = normalizeItems(rawItems);
  const invoiceType = firstValue(
    root.invoice_type,
    root.data?.invoice_type,
    payload.invoice_type,
    invoice.invoice_type,
    order.order_items && !Array.isArray(order.order_items)
      ? "single_item"
      : undefined,
    "complete",
  );
  return {
    invoice,
    order,
    items,
    invoiceType,
  };
};
const normalizeItems = (value: any): InvoiceRecord[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((item) => item && typeof item === "object");
  }
  if (typeof value === "string") {
    try {
      return normalizeItems(JSON.parse(value));
    } catch {
      return [];
    }
  }
  if (typeof value === "object") return [value];
  return [];
};
// =====================================================
// ADDRESS HELPERS
// =====================================================
const formatAddress = (address: any): string => {
  if (!address) return "-";
  if (typeof address === "string") return address;
  const parts = [
    address.address_line_1,
    address.address_line_2,
    address.landmark,
    address.post_office,
    address.city,
    address.district,
    address.state,
    address.pincode,
    address.country,
  ]
    .filter(isPresent)
    .map((part) => String(part).trim());
  return [...new Set(parts)].join(", ") || safeText(address.full_address);
};
// =====================================================
// AMOUNT IN WORDS - INDIAN FORMAT
// =====================================================
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
const numberToWords = (number: number): string => {
  const n = Math.floor(Math.abs(number));
  if (n === 0) return "Zero";
  if (n < 20) return SMALL[n];
  if (n < 100) {
    return [TENS[Math.floor(n / 10)], n % 10 ? SMALL[n % 10] : ""]
      .filter(Boolean)
      .join(" ");
  }
  const units: [number, string][] = [
    [10000000, "Crore"],
    [100000, "Lakh"],
    [1000, "Thousand"],
    [100, "Hundred"],
  ];
  for (const [value, label] of units) {
    if (n >= value) {
      return [
        numberToWords(Math.floor(n / value)),
        label,
        n % value ? numberToWords(n % value) : "",
      ]
        .filter(Boolean)
        .join(" ");
    }
  }
  return "";
};
const amountInWords = (value: any): string => {
  const amount = toNumber(value);
  if (amount === null) return "Not available";
  const totalPaise = Math.round(Math.abs(amount) * 100);
  const rupees = Math.floor(totalPaise / 100);
  const paise = totalPaise % 100;
  return [
    amount < 0 ? "Minus" : "",
    "Rupees",
    numberToWords(rupees),
    paise ? `and ${numberToWords(paise)} Paise` : "",
    "Only",
  ]
    .filter(Boolean)
    .join(" ");
};
// =====================================================
// ITEM TOTALS
// =====================================================
const sumField = (items: InvoiceRecord[], field: string): number | null => {
  if (!items.length) return null;
  const values = items.map((item) => toNumber(item[field]));
  if (values.some((value) => value === null)) {
    return null;
  }
  return values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
};
// =====================================================
// VALIDATION — preserve invoice scope and never fabricate tax
// =====================================================
const closeMoney = (a: number, b: number) => Math.abs(a - b) <= 0.02;
const n = toNumber;
const money = formatMoney;
const rate = (value: any) =>
  isPresent(value) ? `${String(value).replace(/%$/, "")}%` : "-";
const sumNumbers = (...values: (number | null)[]): number | null =>
  values.some((value) => value === null)
    ? null
    : values.reduce<number>((a, b) => a + (b ?? 0), 0);
const validHttpUrl = (value: any): string => {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value.trim());
    return ["https:", "http:"].includes(url.protocol) ? value.trim() : "";
  } catch {
    return "";
  }
};
const reverseChargeText = (value: any): string => {
  if (!isPresent(value)) return "Not provided";
  const normalized = String(value).toLowerCase().trim();
  if (["true", "1", "yes"].includes(normalized)) return "Yes";
  if (["false", "0", "no"].includes(normalized)) return "No";
  return "Not provided";
};

// Exported separately so the backend response can be checked before generating a PDF.
export const getInvoiceValidation = (response: any) => {
  const { invoice, order, items, invoiceType } =
    normalizeInvoiceResponse(response);
  const isSingleItem = String(invoiceType).toLowerCase() === "single_item";
  const sum = (field: string) => sumField(items, field);
  const totals = {
    qty: sum("quantity"),
    productBase: sum("line_price_excl_gst"),
    productGST: sum("line_gst_amount"),
    productGross: sum("line_price_incl_gst"),
    shippingBase: sum("shipping_excl_gst"),
    shippingGST: sum("shipping_gst_amount"),
    shippingGross: sum("shipping_incl_gst"),
    service: sum("product_service_charge"),
    cgst: sum("cgst_amount"),
    sgst: sum("sgst_amount"),
    utgst: sum("utgst_amount"),
    igst: sum("igst_amount"),
    fullBase: sum("line_total_excl_gst"),
    fullGST: sum("line_total_gst_amount"),
    fullGross: sum("line_total_incl_gst"),
  };
  const issues: string[] = [];
  const check = (label: string, a: number | null, b: number | null) => {
    if (a === null || b === null) issues.push(`${label}: missing amount.`);
    else if (!closeMoney(a, b))
      issues.push(`${label}: INR ${money(a)} vs INR ${money(b)}.`);
  };
  const seller = invoice.seller || invoice.seller_details || {};
  const buyer = invoice.buyer || invoice.buyer_details || {};
  if (!items.length) issues.push("No product details provided.");
  if (isSingleItem && items.length !== 1)
    issues.push("Single-item invoice must contain exactly one product line.");
  if (!isPresent(firstValue(invoice.invoice_number, invoice.number)))
    issues.push("Invoice number is missing.");
  if (!isPresent(firstValue(invoice.issued_at, invoice.created_at)))
    issues.push("Invoice date is missing.");
  if (
    !isPresent(seller.name) ||
    !isPresent(seller.gstin) ||
    formatAddress(seller.address) === "-"
  )
    issues.push("Seller information is incomplete.");
  if (
    !isPresent(
      firstValue(
        invoice.place_of_supply,
        invoice.delivery_state,
        buyer.delivery_address?.state,
        order.delivery_address?.state,
      ),
    )
  )
    issues.push("Place of supply is missing.");
  if (
    reverseChargeText(
      firstValue(invoice.reverse_charge, invoice.is_reverse_charge),
    ) === "Not provided"
  )
    issues.push("Reverse charge flag is missing or unrecognized.");
  items.forEach((item, i) => {
    const prefix = `Item ${i + 1}`;
    if (!isPresent(item.hsn_code))
      issues.push(`${prefix}: HSN/SAC is missing.`);
    if (
      !isPresent(firstValue(item.product_name, item.name)) ||
      !isPresent(item.uom) ||
      (n(item.quantity) ?? 0) <= 0 ||
      n(item.gst_rate_percent) === null
    )
      issues.push(
        `${prefix}: description, UOM, quantity or GST rate missing/invalid.`,
      );
    check(
      `${prefix} product total`,
      sumNumbers(n(item.line_price_excl_gst), n(item.line_gst_amount)),
      n(item.line_price_incl_gst),
    );
    check(
      `${prefix} shipping total`,
      sumNumbers(n(item.shipping_excl_gst), n(item.shipping_gst_amount)),
      n(item.shipping_incl_gst),
    );
    check(
      `${prefix} line total`,
      sumNumbers(n(item.line_total_excl_gst), n(item.line_total_gst_amount)),
      n(item.line_total_incl_gst),
    );
    const localTax = n(firstValue(item.utgst_amount, item.sgst_amount));
    check(
      `${prefix} product tax components`,
      sumNumbers(n(item.cgst_amount), localTax, n(item.igst_amount)),
      n(item.line_gst_amount),
    );
  });
  // The current endpoint does not specify whether total_taxable includes freight.
  // Accept either scope for that field, but insist on matching gross and GST totals.
  const invoiceTaxable = n(invoice.total_taxable);
  if (
    invoiceTaxable === null ||
    ![totals.productBase, totals.fullBase].some(
      (v) => v !== null && closeMoney(v, invoiceTaxable),
    )
  ) {
    issues.push(
      "Invoice taxable amount does not match product or combined line taxable amount.",
    );
  }
  const payable = n(invoice.total_payable); // Never use full-order payable as a single-item fallback.
  const invoiceGST = n(invoice.total_tax);
  check("Invoice vs line GST", invoiceGST, totals.fullGST);
  const invoiceLocalTax = n(
    firstValue(invoice.total_utgst, invoice.total_sgst),
  );
  check(
    "Invoice GST component total",
    sumNumbers(n(invoice.total_cgst), invoiceLocalTax, n(invoice.total_igst)),
    invoiceGST,
  );
  check(
    "Invoice vs line shipping (inclusive)",
    n(invoice.shipping_charge),
    totals.shippingGross,
  );
  const coin = n(invoice.coin_redeemed);
  const coupon = n(invoice.coupon_discount);
  if (coin === null || coupon === null)
    issues.push("Invoice discount/redemption amounts are not provided.");
  const hasAdjustments =
    (coin ?? 0) !== 0 || (coupon ?? 0) !== 0 || (totals.service ?? 0) !== 0;
  if (hasAdjustments) {
    // Do not assume whether coin/coupon/service amounts have already been applied
    // to line totals or whether they affect the taxable base.
    issues.push(
      "Discount/redemption/service-charge allocation requires backend verification.",
    );
  } else {
    check("Invoice vs line payable", payable, totals.fullGross);
    check(
      "Product plus shipping vs line gross",
      sumNumbers(totals.productGross, totals.shippingGross),
      totals.fullGross,
    );
    check(
      "Product plus shipping GST vs line GST",
      sumNumbers(totals.productGST, totals.shippingGST),
      totals.fullGST,
    );
    check(
      "Product plus shipping taxable vs line taxable",
      sumNumbers(totals.productBase, totals.shippingBase),
      totals.fullBase,
    );
  }
  return {
    invoice,
    order,
    items,
    invoiceType,
    isSingleItem,
    totals,
    payable,
    issues,
    hasMismatch: issues.length > 0,
  };
};

// =====================================================
// MAIN PDF — original bordered layout, dynamic QR and tables
// =====================================================
export const generateInvoicePDF = async (response: any): Promise<void> => {
  const previewWindow = window.open("", "_blank");
  try {
    const {
      invoice,
      order,
      items,
      isSingleItem,
      totals,
      payable,
      issues,
      hasMismatch,
    } = getInvoiceValidation(response);
    const seller = invoice.seller || invoice.seller_details || {};
    const buyer = invoice.buyer || invoice.buyer_details || {};
    const bill =
      buyer.billing_address ||
      invoice.billing_address ||
      order.billing_address ||
      {};
    const ship =
      buyer.delivery_address ||
      invoice.delivery_address ||
      order.delivery_address ||
      order.shipping_address ||
      {};
    const sellerName = safeText(seller.name, "IndieKonnect");
    const invoiceNo = safeText(
      firstValue(invoice.invoice_number, invoice.number),
    );
    const orderRef = safeText(firstValue(order.order_reference, order.id));
    const buyerName = firstValue(buyer.name, order.user?.name);
    const supply = firstValue(
      invoice.place_of_supply,
      invoice.delivery_state,
      ship.state,
    );
    const title = hasMismatch ? "Invoice Preview" : "Tax Invoice";
    if (hasMismatch)
      console.warn("Invoice requires verification", { invoiceNo, issues });
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
      compress: true,
    });
    doc.setProperties({
      title: `${title} ${invoiceNo}`,
      subject: `Order ${orderRef}`,
      author: "IndieKonnect",
      creator: "IndieKonnect Distributor Panel",
    });
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const M = 32,
      R = PW - M,
      W = PW - 2 * M,
      DIV = M + W * 0.69;
    const LW = DIV - M,
      RW = R - DIV;
    let y = M;
    const txt = (
      value: any,
      x: number,
      top: number,
      size = 8,
      bold = false,
      options: any = {},
      muted = false,
    ) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      doc.setTextColor(...(muted ? GRAY : INK));
      doc.text(safeText(value), x, top, options);
    };
    const wrap = (
      value: any,
      width: number,
      size = 8,
      bold = false,
    ): string[] => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      return doc.splitTextToSize(safeText(value), width) as string[];
    };
    const rect = (x: number, top: number, w: number, h: number) => {
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.5);
      doc.rect(x, top, w, h);
    };
    const rule = (x: number, top: number, x2: number, y2: number) => {
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.5);
      doc.line(x, top, x2, y2);
    };
    const fill = (x: number, top: number, w: number, h: number) => {
      doc.setFillColor(...LIGHT);
      doc.rect(x, top, w, h, "F");
    };
    const room = (h: number) => {
      if (y + h > PH - 45) {
        doc.addPage();
        y = M;
      }
    };
    const heading = (label: string) => {
      room(55);
      fill(M, y, W, 20);
      rect(M, y, W, 20);
      txt(label, M + 8, y + 13, 8.5, true);
      y += 20;
    };
    const table = (
      head: string[],
      body: any[][],
      widths: number[],
      aligns: ("left" | "center" | "right")[],
      size = 7.5,
    ) => {
      const total = widths.reduce((a, b) => a + b, 0);
      const columnStyles: Record<number, any> = {};
      widths.forEach((w, i) => {
        columnStyles[i] = {
          cellWidth: (W * w) / total,
          halign: aligns[i] || "left",
        };
      });
      autoTable(doc, {
        startY: y,
        margin: { top: M, bottom: 45, left: M, right: M },
        theme: "grid",
        head: [head],
        body,
        styles: {
          font: "helvetica",
          fontSize: size,
          textColor: INK,
          lineColor: BORDER,
          lineWidth: 0.45,
          cellPadding: 4,
          overflow: "linebreak",
          valign: "middle",
          fillColor: [255, 255, 255],
        },
        headStyles: {
          fillColor: LIGHT,
          textColor: INK,
          fontStyle: "bold",
          halign: "center",
          fontSize: size,
          lineColor: BORDER,
          lineWidth: 0.45,
        },
        columnStyles,
        rowPageBreak: "avoid",
        showHead: "everyPage",
      });
      y = (doc as any).lastAutoTable.finalY;
    };
    const note = (message: string, bold = false) => {
      const lines = wrap(message, W - 18, 8, bold),
        h = lines.length * 10 + 12;
      room(h);
      rect(M, y, W, h);
      lines.forEach((line, i) => txt(line, M + 9, y + 12 + i * 10, 8, bold));
      y += h;
    };
    type Entry = { label: string; value: any };
    const entry = (label: string, value: any): Entry => ({ label, value });
    // Dynamic-height key/value columns, keeping separate billing and delivery addresses.
    const panels = (
      columns: { title: string; width: number; entries: Entry[] }[],
    ) => {
      const prepared = columns.map((c) => ({
        ...c,
        rows: c.entries.map((e) => ({
          label: e.label,
          lines: wrap(e.value, c.width - 18, 8),
        })),
      }));
      const height = Math.max(
        ...prepared.map(
          (c) =>
            29 +
            c.rows.reduce(
              (a, row) => a + (row.label ? 10 : 0) + row.lines.length * 10 + 4,
              0,
            ),
        ),
      );
      room(height);
      let x = M;
      prepared.forEach((c) => {
        fill(x, y, c.width, 19);
        rect(x, y, c.width, height);
        rule(x, y + 19, x + c.width, y + 19);
        txt(c.title, x + 8, y + 13, 8.5, true);
        let cursor = y + 31;
        c.rows.forEach((row) => {
          if (row.label) {
            txt(row.label, x + 8, cursor, 7, true);
            cursor += 10;
          }
          row.lines.forEach((line) => {
            txt(line, x + 8, cursor, 8);
            cursor += 10;
          });
          cursor += 4;
        });
        x += c.width;
      });
      y += height;
    };
    // 1. Original logo and invoice title
    const headerH = 62;
    rect(M, y, W, headerH);
    rule(DIV, y, DIV, y + headerH);
    const logo = await loadLogo();
    let logoW = 0;
    if (logo) {
      const props = doc.getImageProperties(logo),
        scale = Math.min(142 / props.width, 48 / props.height);
      logoW = props.width * scale;
      const h = props.height * scale;
      doc.addImage(logo, "PNG", M + 10, y + (headerH - h) / 2, logoW, h);
    }
    txt("INDIEKONNECT", M + (logoW ? logoW + 20 : 10), y + 35, 15, true);
    txt(title, DIV + RW / 2, y + 25, 14, true, { align: "center" });
    txt(
      hasMismatch ? "PENDING VERIFICATION" : "ORIGINAL FOR RECIPIENT",
      DIV + RW / 2,
      y + 40,
      7,
      false,
      { align: "center" },
      true,
    );
    txt(
      isSingleItem ? "SINGLE ITEM" : "ORDER INVOICE",
      DIV + RW / 2,
      y + 51,
      7,
      false,
      { align: "center" },
      true,
    );
    y += headerH;
    // 2. Seller and QR (the API URL is used unchanged)
    const sellerFields = [
      entry("GSTIN", seller.gstin),
      entry("PAN", seller.pan),
      entry("CIN", seller.cin),
      entry("State", seller.state),
      entry("Contact", seller.phone),
      entry("Email", seller.email),
      entry("FSSAI Licence", seller.fssai_license_number),
    ].filter((e) => isPresent(e.value));
    const sellerLines = wrap(sellerName, LW - 20, 10, true);
    const addrLines = wrap(formatAddress(seller.address), LW - 20, 8);
    const fieldLines = sellerFields.flatMap((e) =>
      wrap(`${e.label}: ${e.value}`, LW - 20, 8),
    );
    const sellerH = Math.max(
      119,
      35 +
        sellerLines.length * 12 +
        addrLines.length * 10 +
        fieldLines.length * 11,
    );
    room(sellerH);
    rect(M, y, W, sellerH);
    rule(DIV, y, DIV, y + sellerH);
    txt("Sold By / Seller", M + 9, y + 15, 8, true);
    let cursor = y + 29;
    sellerLines.forEach((line) => {
      txt(line, M + 9, cursor, 10, true);
      cursor += 12;
    });
    addrLines.forEach((line) => {
      txt(line, M + 9, cursor, 8);
      cursor += 10;
    });
    cursor += 4;
    fieldLines.forEach((line) => {
      txt(line, M + 9, cursor, 8);
      cursor += 11;
    });
    const productUrl =
      isSingleItem || items.length === 1
        ? validHttpUrl(items[0]?.product_url)
        : validHttpUrl(firstValue(invoice.order_url, order.order_url));
    if (productUrl) {
      try {
        const qr = await QRCode.toDataURL(productUrl, {
          width: 400,
          margin: 4,
          errorCorrectionLevel: "M",
        });
        const qrSize = 76,
          qrX = DIV + (RW - qrSize) / 2;
        doc.addImage(qr, "PNG", qrX, y + 2, qrSize, qrSize);
        doc.link(qrX, y + 2, qrSize, qrSize, { url: productUrl });
        txt(
          /order-history|order_history/i.test(productUrl) || items.length > 1
            ? "Scan to View Order"
            : "Scan to View Product",
          DIV + RW / 2,
          y + 86,
          7,
          false,
          { align: "center" },
        );
      } catch (err) {
        console.warn("QR unavailable", err);
        txt("QR unavailable", DIV + RW / 2, y + 45, 8, false, {
          align: "center",
        });
      }
    } else
      txt("Link unavailable", DIV + RW / 2, y + 45, 8, false, {
        align: "center",
      });
    txt(`Invoice: ${invoiceNo}`, DIV + RW / 2, y + 104, 8, true, {
      align: "center",
      maxWidth: RW - 12,
    });
    y += sellerH;
    // 3. Order details and addresses
    const orderEntries = [
      entry("Invoice No.", invoiceNo),
      entry(
        "Invoice Date",
        formatDate(firstValue(invoice.issued_at, invoice.created_at)),
      ),
      entry("Order Reference", orderRef),
      entry("Order Date", formatDate(order.created_at)),
      entry("Place of Supply", supply),
      entry("Order Type", prettyStatus(order.order_type)),
    ];
    if (isSingleItem)
      orderEntries.push(entry("Order Item ID", items[0]?.order_line_id));
    const billEntries = [
      entry("Customer", buyerName),
      entry(
        "Billing Recipient",
        firstValue(bill.recipient_name, bill.name, buyerName),
      ),
      entry("Address", formatAddress(bill)),
      entry("Phone", firstValue(bill.contact_number, bill.phone)),
      entry("GSTIN", buyer.gstin || "Not provided"),
    ];
    const shipEntries = [
      entry("Recipient", firstValue(ship.recipient_name, ship.name, buyerName)),
      entry("Address", formatAddress(ship)),
      entry("Phone", firstValue(ship.contact_number, ship.phone)),
      entry("State", ship.state),
    ];
    if (isPresent(order.courier_tracking_number))
      shipEntries.push(entry("Tracking / AWB", order.courier_tracking_number));
    if (isPresent(order.courier_company))
      shipEntries.push(entry("Courier", order.courier_company));
    panels([
      { title: "Order Information", width: W * 0.32, entries: orderEntries },
      { title: "Bill To", width: W * 0.34, entries: billEntries },
      { title: "Ship To", width: W * 0.34, entries: shipEntries },
    ]);
    // 4. Product table: inclusive and exclusive unit prices, quantity, SKU and HSN
    y += 7;
    heading("Product Details (INR)");
    table(
      [
        "No.",
        "Item Description / SKU",
        "HSN / SAC",
        "Qty / UOM",
        "Unit Price Excl. GST",
        "Unit Price Incl. GST",
        "Taxable Amount",
        "GST Rate",
        "Amount Incl. GST",
      ],
      items.length
        ? items.map((item, i) => [
            i + 1,
            [
              safeText(firstValue(item.product_name, item.name)),
              isPresent(item.product_code) ? `SKU: ${item.product_code}` : "",
              isPresent(item.product_service_charge) &&
              n(item.product_service_charge) !== 0
                ? `Service: ${money(item.product_service_charge)}`
                : "",
            ]
              .filter(Boolean)
              .join("\n"),
            safeText(item.hsn_code, "Not provided"),
            `${safeText(item.quantity)} ${safeText(item.uom, "")}`.trim(),
            money(item.price_excl_gst),
            money(item.price_incl_gst),
            money(item.line_price_excl_gst),
            rate(item.gst_rate_percent),
            money(item.line_price_incl_gst),
          ])
        : [["-", "No item data supplied", "-", "-", "-", "-", "-", "-", "-"]],
      [21, 105, 48, 36, 65, 65, 65, 35, 65],
      [
        "center",
        "left",
        "center",
        "center",
        "right",
        "right",
        "right",
        "center",
        "right",
      ],
      7,
    );
    // 5. Product GST components. Shipping tax has its own section, not double counted.
    y += 7;
    heading("Product GST Breakdown (INR)");
    const showUT = items.some((item) => isPresent(item.utgst_amount));
    const localLabel = showUT
      ? "UTGST"
      : String(order.gst_breakdown?.sgst_label || "SGST").toUpperCase() ===
          "UTGST"
        ? "UTGST"
        : "SGST";
    table(
      [
        "Item / SKU",
        "Taxable Amount",
        "GST / Unit",
        "CGST",
        localLabel,
        "IGST",
        "Product GST",
      ],
      items.map((item) => [
        safeText(firstValue(item.product_code, item.product_name)),
        money(item.line_price_excl_gst),
        money(item.gst_amount_per_unit),
        money(item.cgst_amount),
        money(firstValue(item.utgst_amount, item.sgst_amount)),
        money(item.igst_amount),
        money(item.line_gst_amount),
      ]),
      [95, 75, 67, 60, 60, 60, 75],
      ["left", "right", "right", "right", "right", "right", "right"],
    );
    // 6. Shipping/delivery charges (amounts are already inclusive where stated)
    y += 7;
    heading("Shipping / Delivery Charges (INR)");
    table(
      [
        "Item / SKU",
        "Shipping / Unit Excl.",
        "Shipping / Unit Incl.",
        "Taxable Shipping",
        "Shipping GST",
        "Shipping Incl. GST",
      ],
      items.map((item) => [
        safeText(firstValue(item.product_code, item.product_name)),
        money(item.shipping_per_unit_excl_gst),
        money(item.shipping_per_unit_incl_gst),
        money(item.shipping_excl_gst),
        money(item.shipping_gst_amount),
        money(item.shipping_incl_gst),
      ]),
      [95, 85, 85, 85, 70, 85],
      ["left", "right", "right", "right", "right", "right"],
    );
    // 7. Invoice-scope line summary; no full-order values are mixed into the math.
    y += 7;
    heading(
      isSingleItem
        ? "Selected Item Summary (INR)"
        : "Invoice Line Summary (INR)",
    );
    const lineSummary: [string, any][] = [
      ["Product taxable value", totals.productBase],
      ["Product GST", totals.productGST],
      ["Product total (incl. GST)", totals.productGross],
      ["Shipping taxable value", totals.shippingBase],
      ["Shipping GST", totals.shippingGST],
      ["Shipping total (incl. GST)", totals.shippingGross],
      ["Combined taxable amount", totals.fullBase],
      ["Combined GST amount", totals.fullGST],
    ];
    if (totals.service !== null && totals.service !== 0)
      lineSummary.push([
        "Service charge (as reported; not added again)",
        totals.service,
      ]);
    lineSummary.push([
      "Line total (product + shipping; as reported)",
      totals.fullGross,
    ]);
    table(
      ["Particulars", "Amount (INR)"],
      lineSummary.map(([label, value]) => [label, money(value)]),
      [340, 160],
      ["left", "right"],
      8,
    );
    // 8. Backend invoice totals and discounts (separate when inconsistent).
    y += 7;
    heading(
      hasMismatch
        ? "Reported Invoice Totals - Unverified (INR)"
        : "Invoice Totals (INR)",
    );
    const invoiceRows: [string, any][] = [
      ["Subtotal before redemption", invoice.subtotal_before_redemption],
      ["Coin redemption (as reported)", invoice.coin_redeemed],
      ["Coupon discount (as reported)", invoice.coupon_discount],
      ["Subtotal after discount", invoice.subtotal_after_discount],
      ["Total taxable amount", invoice.total_taxable],
      ["CGST", invoice.total_cgst],
      [
        isPresent(invoice.total_utgst) ? "UTGST" : localLabel,
        firstValue(invoice.total_utgst, invoice.total_sgst),
      ],
      ["IGST", invoice.total_igst],
      ["Total GST", invoice.total_tax],
      ["Shipping charge (as reported)", invoice.shipping_charge],
      ["Invoice total (as reported)", invoice.total],
    ];
    if (isPresent(invoice.coupon_code))
      invoiceRows.splice(3, 0, [`Coupon code: ${invoice.coupon_code}`, null]);
    invoiceRows.push([
      hasMismatch ? "REPORTED PAYABLE - NOT VERIFIED" : "GRAND TOTAL PAYABLE",
      payable,
    ]);
    table(
      ["Particulars", "Amount (INR)"],
      invoiceRows.map(([label, value]) => [label, money(value)]),
      [340, 160],
      ["left", "right"],
      8,
    );
    note(
      `${hasMismatch ? "Selected line total in words (not verified payable)" : "Amount in words"}: ${amountInWords(hasMismatch ? totals.fullGross : payable)}`,
      true,
    );
    // 9. Payment: full-order amount is context only; do not suggest that it was paid for this item.
    y += 7;
    const paymentEntries = [
      entry("Payment Gateway", prettyStatus(order.payment_gateway)),
      entry("Transaction Reference (Order)", order.gateway_transaction_id),
      entry(
        isSingleItem
          ? "Full Order Amount Paid (reference only)"
          : "Order Amount Paid",
        n(order.amount_paid) === null
          ? "Not provided"
          : `INR ${money(order.amount_paid)}`,
      ),
    ];
    if (isSingleItem)
      paymentEntries.push(
        entry(
          "Item Amount Paid",
          isPresent(invoice.amount_paid)
            ? `INR ${money(invoice.amount_paid)}`
            : "Not separately provided",
        ),
      );
    const fulfilmentEntries = [
      entry("Order Status", prettyStatus(order.status)),
      entry("Delivery Status", prettyStatus(order.delivery_status)),
      entry("Return Status", prettyStatus(order.return_status)),
    ];
    if (isPresent(order.refund_status))
      fulfilmentEntries.push(
        entry("Refund Status", prettyStatus(order.refund_status)),
      );
    if (isPresent(order.delivered_at))
      fulfilmentEntries.push(
        entry("Delivered On", formatDate(order.delivered_at)),
      );
    panels([
      { title: "Payment Information", width: W / 2, entries: paymentEntries },
      {
        title: "Order Status (Order-level)",
        width: W / 2,
        entries: fulfilmentEntries,
      },
    ]);
    // 10. Required declarations, and clearly visible reconciliation warnings.
    note(
      `Whether tax is payable on reverse charge: ${reverseChargeText(firstValue(invoice.reverse_charge, invoice.is_reverse_charge))}`,
    );
    if (hasMismatch) {
      y += 7;
      heading("Verification Required - NOT A FINAL TAX INVOICE");
      note(
        "Invoice and item amounts or required fields are inconsistent/incomplete. Do not use for tax issuance or payment collection.",
        true,
      );
      issues.forEach((issue) => note(issue));
    }
    // 11. Authorised signatory (never insert signature on a mismatched preview).
    y += 7;
    room(70);
    rect(M, y, W, 70);
    rule(DIV, y, DIV, y + 70);
    txt(`For ${sellerName}`, M + 9, y + 17, 9, true);
    txt(`GSTIN: ${safeText(seller.gstin)}`, M + 9, y + 32, 8);
    txt("Computer-generated document.", M + 9, y + 48, 7.5, false, {}, true);
    const signature = firstValue(
      invoice.signature_data_url,
      seller.signature_data_url,
    );
    if (
      !hasMismatch &&
      typeof signature === "string" &&
      /^data:image\/(png|jpeg|jpg);base64,/i.test(signature)
    ) {
      try {
        const p = doc.getImageProperties(signature);
        const scale = Math.min((RW - 20) / p.width, 38 / p.height);
        const sw = p.width * scale,
          sh = p.height * scale;
        doc.addImage(
          signature,
          /^data:image\/png/i.test(signature) ? "PNG" : "JPEG",
          DIV + (RW - sw) / 2,
          y + 6,
          sw,
          sh,
        );
      } catch (err) {
        console.warn("Signature unavailable", err);
      }
    }
    txt(
      hasMismatch ? "Pending Verification" : "Authorised Signatory",
      DIV + RW / 2,
      y + 57,
      8,
      true,
      { align: "center" },
    );
    // 12. Page footer and open/download PDF.
    const count = doc.getNumberOfPages();
    for (let page = 1; page <= count; page++) {
      doc.setPage(page);
      rule(M, PH - 32, R, PH - 32);
      txt(
        `IndieKonnect | ${title} | ${invoiceNo}`,
        M,
        PH - 19,
        7,
        false,
        {},
        true,
      );
      txt(
        `Page ${page} of ${count}`,
        R,
        PH - 19,
        7,
        false,
        { align: "right" },
        true,
      );
    }
    const filename = `${invoiceNo.replace(/[^a-zA-Z0-9_-]/g, "_") || "invoice"}${hasMismatch ? "-preview" : ""}.pdf`;
    if (previewWindow && !previewWindow.closed) {
      const url = URL.createObjectURL(doc.output("blob"));
      try {
        previewWindow.location.replace(url);
        window.setTimeout(() => URL.revokeObjectURL(url), 300000);
      } catch {
        URL.revokeObjectURL(url);
        doc.save(filename);
      }
    } else doc.save(filename);
  } catch (error) {
    if (previewWindow && !previewWindow.closed) previewWindow.close();
    console.error("Invoice PDF generation failed", error);
    throw error;
  }
};
