// src/utils/csvUtils.ts
import { toast } from "react-hot-toast";

// =====================================================
// CSV HELPERS
// =====================================================

export const escapeCsvValue = (value: any): string => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
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

export const formatCsvStatus = (status?: string) => {
  if (!status) return "";
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// =====================================================
// CSV GENERATOR (item-wise)
// =====================================================

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

  const rows: string[] = [];
  rows.push(headers.map(escapeCsvValue).join(","));

  let counter = 0;

  orders.forEach((order) => {
    const items =
      Array.isArray(order.items) && order.items.length > 0
        ? order.items
        : [null];

    items.forEach((item: any) => {
      counter += 1;

      const row = [
        counter,
        order.order_reference || order.id || "",
        formatCsvDate(order.order_date || order.date) || "",
        order.user?.name || order.customer || "",
        order.user?.email || order.userEmail || "",
        order.user?.phone || order.userPhone || "",
        order.order_type === "retail"
          ? "Customer"
          : order.order_type || "",
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

// =====================================================
// DOWNLOAD CSV (respects the currently passed array)
// =====================================================

export const downloadOrdersCsv = (
  orders: any[],
  filenamePrefix = "orders",
) => {
  if (!orders || orders.length === 0) {
    toast.error("No orders available to export.");
    return;
  }

  try {
    const csvContent = generateOrdersCsv(orders);
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    const today = new Date().toISOString().slice(0, 10);
    link.download = `${filenamePrefix}-${today}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success(`CSV downloaded — ${orders.length} orders exported`);
  } catch (error: any) {
    console.error("CSV download error:", error);
    toast.error("Failed to download CSV. Please try again.");
  }
};

// =====================================================
// INVOICE PDF GENERATION
// Uses jsPDF + autoTable to build a real PDF file,
// opens it in a new browser tab (not a details modal).
// =====================================================

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface InvoicePayload {
  invoice: any;
  order: any;
}

/**
 * Builds an invoice PDF and opens it in a new tab.
 */
export const openInvoicePdfInNewTab = (
  payload: InvoicePayload,
  orderItemId: number | null = null,
) => {
  try {
    const { invoice = {}, order = {} } = payload || {};

    const orderItems = (order && order.order_items) || [];
    const filteredItems = orderItemId
      ? orderItems.filter((it: any) => it.id === orderItemId)
      : orderItems;

    const doc = new jsPDF({
      unit: "pt",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 40;
    let cursorY = 40;

    // ============ HEADER BAR ============
    doc.setFillColor(22, 63, 32); // #163F20
    doc.rect(0, 0, pageWidth, 60, "F");

    doc.setTextColor(234, 243, 234); // #EAF3EA
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("TAX INVOICE", marginX, 38);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Invoice #: ${invoice.invoice_number || "N/A"}`,
      pageWidth - marginX,
      28,
      { align: "right" },
    );
    doc.text(
      `Order Ref: ${order.order_reference || "N/A"}`,
      pageWidth - marginX,
      42,
      { align: "right" },
    );
    doc.text(
      `Date: ${
        order.order_date
          ? new Date(order.order_date).toLocaleDateString("en-IN")
          : "N/A"
      }`,
      pageWidth - marginX,
      56,
      { align: "right" },
    );

    cursorY = 85;

    // ============ SELLER / BUYER BLOCKS ============
    const colWidth = (pageWidth - marginX * 2 - 20) / 2;

    // Seller
    doc.setDrawColor(216, 226, 216);
    doc.setFillColor(245, 247, 245);
    doc.roundedRect(marginX, cursorY, colWidth, 90, 6, 6, "FD");

    doc.setTextColor(154, 162, 156);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("SELLER", marginX + 12, cursorY + 18);

    doc.setTextColor(32, 39, 33);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(
      (invoice.seller && invoice.seller.name) || "N/A",
      marginX + 12,
      cursorY + 36,
    );

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(89, 100, 92);

    const sellerGst = `GSTIN: ${
      (invoice.seller && invoice.seller.gstin) || "N/A"
    }`;
    doc.text(sellerGst, marginX + 12, cursorY + 52);

    const sellerAddr = doc.splitTextToSize(
      (invoice.seller && invoice.seller.address) || "N/A",
      colWidth - 24,
    );
    doc.text(sellerAddr, marginX + 12, cursorY + 68);

    // Buyer
    const buyerX = marginX + colWidth + 20;
    doc.setDrawColor(216, 226, 216);
    doc.setFillColor(245, 247, 245);
    doc.roundedRect(buyerX, cursorY, colWidth, 90, 6, 6, "FD");

    doc.setTextColor(154, 162, 156);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("BUYER", buyerX + 12, cursorY + 18);

    doc.setTextColor(32, 39, 33);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(
      (invoice.buyer && invoice.buyer.name) || "N/A",
      buyerX + 12,
      cursorY + 36,
    );

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(89, 100, 92);
    const buyerAddr = doc.splitTextToSize(
      (invoice.buyer && invoice.buyer.address) || "N/A",
      colWidth - 24,
    );
    doc.text(buyerAddr, buyerX + 12, cursorY + 52);

    cursorY += 110;

    // ============ ITEMS TABLE ============
    const tableHead = [
      ["#", "Product", "Code", "Qty", "Unit Price", "GST", "Total"],
    ];

    const tableBody = filteredItems.map((item: any, idx: number) => [
      idx + 1,
      item.product_name || "N/A",
      item.product_code || "N/A",
      item.quantity || 0,
      `Rs. ${Number(item.unit_price || 0).toFixed(2)}`,
      `${item.gst_rate || 0}%`,
      `Rs. ${Number(item.line_total || 0).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: cursorY,
      head: tableHead,
      body: tableBody,
      theme: "grid",
      headStyles: {
        fillColor: [22, 63, 32],
        textColor: [234, 243, 234],
        fontStyle: "bold",
        fontSize: 9,
        halign: "left",
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [63, 74, 65],
      },
      alternateRowStyles: {
        fillColor: [250, 251, 250],
      },
      columnStyles: {
        0: { cellWidth: 30, halign: "center" },
        1: { cellWidth: "auto" },
        2: { cellWidth: 80 },
        3: { cellWidth: 45, halign: "center" },
        4: { cellWidth: 80, halign: "right" },
        5: { cellWidth: 50, halign: "right" },
        6: { cellWidth: 90, halign: "right" },
      },
      margin: { left: marginX, right: marginX },
    });

    // @ts-ignore
    cursorY = doc.lastAutoTable.finalY + 20;

    // ============ TOTALS ============
    const isItemSpecific = orderItemId && filteredItems.length > 0;

    let subtotal = 0;
    let totalTax = 0;
    let totalPayable = 0;
    let couponDiscount = 0;
    let shippingCharge = 0;

    if (isItemSpecific) {
      const item = filteredItems[0];
      subtotal =
        parseFloat(item.line_total || 0) - parseFloat(item.gst_amount || 0);
      totalTax = parseFloat(item.gst_amount || 0);
      totalPayable = parseFloat(item.line_total || 0);
      const totalOrderItems = orderItems.length || 1;
      couponDiscount =
        totalOrderItems > 0
          ? parseFloat(invoice.coupon_discount || 0) / totalOrderItems
          : 0;
      shippingCharge =
        totalOrderItems > 0
          ? parseFloat(invoice.shipping_charge || 0) / totalOrderItems
          : 0;
    } else {
      subtotal = parseFloat(invoice.subtotal_before_redemption || 0);
      totalPayable = parseFloat(invoice.total_payable || 0);
      totalTax = parseFloat(invoice.total_tax || 0);
      couponDiscount = parseFloat(invoice.coupon_discount || 0);
      shippingCharge = parseFloat(invoice.shipping_charge || 0);
    }

    const summaryX = pageWidth - marginX - 260;
    const summaryWidth = 260;

    doc.setDrawColor(216, 226, 216);
    doc.setFillColor(245, 247, 245);
    doc.roundedRect(summaryX, cursorY, summaryWidth, 140, 6, 6, "FD");

    let innerY = cursorY + 20;

    const drawRow = (label: string, value: string) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(89, 100, 92);
      doc.text(label, summaryX + 14, innerY);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(32, 39, 33);
      doc.text(value, summaryX + summaryWidth - 14, innerY, { align: "right" });
      innerY += 20;
    };

    drawRow("Subtotal", `Rs. ${subtotal.toFixed(2)}`);
    drawRow("Coupon Discount", `Rs. ${couponDiscount.toFixed(2)}`);
    drawRow("Shipping", `Rs. ${shippingCharge.toFixed(2)}`);
    drawRow("Tax (GST)", `Rs. ${totalTax.toFixed(2)}`);

    // Divider
    doc.setDrawColor(22, 63, 32);
    doc.setLineWidth(1);
    doc.line(summaryX + 10, innerY - 10, summaryX + summaryWidth - 10, innerY - 10);

    innerY += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(22, 63, 32);
    doc.text("Total Payable", summaryX + 14, innerY);
    doc.setFontSize(13);
    doc.text(
      `Rs. ${totalPayable.toFixed(2)}`,
      summaryX + summaryWidth - 14,
      innerY,
      { align: "right" },
    );

    // ============ FOOTER ============
    const footerY = doc.internal.pageSize.getHeight() - 40;
    doc.setDrawColor(216, 226, 216);
    doc.setLineWidth(0.5);
    doc.line(marginX, footerY - 10, pageWidth - marginX, footerY - 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(154, 162, 156);
    doc.text(
      `Generated on ${new Date().toLocaleString("en-IN")}`,
      marginX,
      footerY,
    );
    doc.text(
      "This is a computer-generated invoice.",
      pageWidth - marginX,
      footerY,
      { align: "right" },
    );

    // ============ OPEN IN NEW TAB ============
    const pdfBlob = doc.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);

    const newTab = window.open(blobUrl, "_blank");
    if (!newTab) {
      toast.error("Please allow pop-ups to view the invoice PDF.");
    } else {
      toast.success("Invoice PDF opened in a new tab.");
    }

    // Clean up blob URL after some time
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  } catch (err) {
    console.error("Invoice PDF generation error:", err);
    toast.error("Failed to generate invoice PDF.");
  }
};