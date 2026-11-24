"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiEye,
  FiFileText,
  FiRefreshCw,
  FiSearch,
  FiX,
  FiBriefcase,
  FiAlertCircle,
  FiPackage,
  FiCreditCard,
  FiTag,
} from "react-icons/fi";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import ExcelJS from "exceljs";
import GlobalModal from "@/components/common/GlobalModal";
import creditNotesApi, { CreditNote } from "../../api/endpoints/creditNotes";
import { usePermissions } from "../../pages/permissions/usePermissions";
import logoApi from "../../api/endpoints/logoApi";
import PermissionLoadingState from "@/components/common/PermissionLoadingState";

type ReportLanguage = "en" | "hi";
const HINDI: Record<string, string> = {
  "credit note no": "क्रेडिट नोट नंबर",
  "credit note date": "क्रेडिट नोट की तारीख",
  "original invoice date": "मूल इनवॉइस की तारीख",
  "customer name": "ग्राहक का नाम",
  "gstin no": "GSTIN नंबर",
  "place of supply (pos)": "आपूर्ति का स्थान (POS)",
  rate: "GST दर",
  "invoice value": "इनवॉइस राशि",
  "credit note": "क्रेडिट नोट",
  "order reference": "ऑर्डर संदर्भ",
  reason: "कारण",
  "credit amount": "क्रेडिट राशि",
  "buyer details": "ग्राहक की जानकारी",
  name: "नाम",
  email: "ईमेल",
  state: "राज्य",
  gstin: "GSTIN",
  address: "पता",
  "order details": "ऑर्डर की जानकारी",
  "order ref": "ऑर्डर संदर्भ",
  "order type": "ऑर्डर का प्रकार",
  "payment gateway": "भुगतान माध्यम",
  subtotal: "टैक्स से पहले राशि",
  shipping: "डिलीवरी शुल्क",
  "total payable": "कुल देय राशि",
  "amount paid": "भुगतान की गई राशि",
  "delivery status": "डिलीवरी स्थिति",
  "return status": "वापसी की स्थिति",
  "confirmed at": "पुष्टि का समय",
  "created at": "बनाने का समय",
  "gateway txn id": "भुगतान लेनदेन आईडी",
  "refund details": "रिफंड की जानकारी",
  "refund amount": "रिफंड राशि",
  "refund method": "रिफंड का माध्यम",
  "gateway reference": "भुगतान संदर्भ",
  "completed at": "पूरा होने का समय",
  "deduction breakdown": "कटौती का विवरण",
  "gross refund": "कटौती से पहले रिफंड",
  "net refund": "अंतिम रिफंड",
  "refund reconciliation — review required": "रिफंड राशि का मिलान आवश्यक है",
  "gross refund minus listed deductions:":
    "कुल रिफंड में से दर्ज कटौती घटाने पर:",
  "actual refund:": "वास्तविक रिफंड:",
  ". difference:": "। अंतर:",
  "the recorded refund and credit note amounts have not been changed.":
    "दर्ज रिफंड और क्रेडिट नोट की राशि नहीं बदली गई है।",
  "credit note items": "क्रेडिट नोट के उत्पाद",
  product: "उत्पाद",
  qty: "मात्रा",
  taxable: "कर योग्य राशि",
  gst: "GST",
  total: "कुल राशि",
  "code:": "कोड:",
  "no line items available": "कोई उत्पाद उपलब्ध नहीं है",
  "this credit note has no item breakdown.":
    "इस क्रेडिट नोट में उत्पाद का विवरण उपलब्ध नहीं है।",
  "tax summary": "टैक्स का विवरण",
  "taxable value": "कर योग्य राशि",
  cgst: "CGST",
  sgst: "SGST",
  igst: "IGST",
  "total gst": "कुल GST",
  "final credit amount": "अंतिम क्रेडिट राशि",
  issued: "जारी किया गया",
  "refund id:": "रिफंड आईडी:",
  close: "बंद करें",
  "download pdf": "PDF डाउनलोड (अंग्रेज़ी)",
  "access denied": "प्रवेश की अनुमति नहीं है",
  "you don't have permission to access this section.":
    "आपको इस भाग को देखने की अनुमति नहीं है।",
  "finance & returns": "वित्त और वापसी",
  "credit notes": "क्रेडिट नोट",
  "manage issued credit notes and download customer credit records.":
    "जारी किए गए क्रेडिट नोट देखें और ग्राहक की क्रेडिट रिपोर्ट डाउनलोड करें।",
  refresh: "रीफ़्रेश करें",
  "matching credit note(s) require refund reconciliation.":
    "क्रेडिट नोट में रिफंड राशि का मिलान आवश्यक है।",
  "credit note directory": "क्रेडिट नोट सूची",
  "search credit note, order ref (ord...), invoice, buyer...":
    "क्रेडिट नोट, ऑर्डर, इनवॉइस या ग्राहक खोजें...",
  "field filters": "फ़ील्ड के अनुसार फ़िल्टर",
  "all conditions must match. product conditions match the same item. exports include complete matching credit notes.":
    "सभी शर्तें मिलनी चाहिए। उत्पाद की शर्तें एक ही उत्पाद पर लागू होंगी। डाउनलोड में पूरे मेल खाने वाले क्रेडिट नोट शामिल होंगे।",
  "clear all": "सभी हटाएँ",
  "+ add filter": "+ फ़िल्टर जोड़ें",
  "filter field": "फ़िल्टर फ़ील्ड",
  "filter condition": "फ़िल्टर की शर्त",
  "gst registration": "GST पंजीकरण",
  "select gst type": "GST का प्रकार चुनें",
  "filter value": "फ़िल्टर का मान",
  value: "मान",
  "maximum filter value": "अधिकतम मान",
  "remove filter": "फ़िल्टर हटाएँ",
  "swipe horizontally to view all table columns":
    "सभी कॉलम देखने के लिए दाएँ-बाएँ स्क्रॉल करें",
  "loading credit notes...": "क्रेडिट नोट लोड हो रहे हैं...",
  "no credit notes found": "कोई क्रेडिट नोट नहीं मिला",
  "try changing your search or filter.": "खोज या फ़िल्टर बदलकर देखें।",
  "view credit note": "क्रेडिट नोट देखें",
  showing: "दिखाए जा रहे हैं",
  to: "से",
  of: "में से",
  entries: "रिकॉर्ड",
  "matching credit notes": "मेल खाने वाले क्रेडिट नोट",
  "credit note amount": "क्रेडिट नोट राशि",
  "completed refunds": "पूरे हुए रिफंड",
  all: "सभी",
  returns: "वापसी",
  other: "अन्य",
  "is exactly": "बिल्कुल बराबर",
  contains: "शामिल है",
  "is missing": "खाली है",
  equals: "बराबर",
  "at least / on or after": "कम से कम / इस तारीख से",
  "at most / on or before": "अधिकतम / इस तारीख तक",
  between: "के बीच",
  urp: "URP (अपंजीकृत)",
  registered: "पंजीकृत",
  missing: "उपलब्ध नहीं",
  "invoice date": "इनवॉइस की तारीख",
  "credit note id": "क्रेडिट नोट आईडी",
  "order id": "ऑर्डर आईडी",
  "order line id": "ऑर्डर आइटम आईडी",
  "product id": "उत्पाद आईडी",
  "total item amount (api)": "कुल आइटम राशि (API)",
  "sum of item line totals": "आइटम राशियों का योग",
  "item amount difference": "आइटम राशि का अंतर",
  "item breakdown": "उत्पादों का पूरा विवरण",
  "item gst amount": "उत्पाद GST राशि",
  confirmed: "पुष्टि हुई",
  none: "कोई नहीं",
  "s.no.": "क्रम संख्या",
  buyer: "ग्राहक",
  invoice: "इनवॉइस",
  amount: "राशि",
  actions: "कार्रवाई",
  "credit note number": "क्रेडिट नोट नंबर",
  "original invoice number": "मूल इनवॉइस नंबर",
  "buyer name": "ग्राहक का नाम",
  "buyer type": "ग्राहक का प्रकार",
  "buyer email": "ग्राहक का ईमेल",
  "buyer state": "ग्राहक का राज्य",
  "buyer gstin": "ग्राहक का GSTIN",
  "buyer address": "ग्राहक का पता",
  "issued at": "जारी करने का समय",
  "order status": "ऑर्डर स्थिति",
  "gateway transaction id": "भुगतान लेनदेन आईडी",
  "shipping charge": "डिलीवरी शुल्क",
  "cgst amount": "CGST राशि",
  "sgst amount": "SGST राशि",
  "igst amount": "IGST राशि",
  "refund id": "रिफंड आईडी",
  "refund status": "रिफंड स्थिति",
  "refund completed at": "रिफंड पूरा होने का समय",
  "item count": "उत्पाद पंक्तियों की संख्या",
  items: "उत्पाद",
  "listed deductions": "दर्ज कटौती",
  "calculated refund (gross - deductions)":
    "गणना की गई रिफंड राशि (कटौती के बाद)",
  "refund reconciliation difference": "रिफंड राशि का अंतर",
  "reconciliation status": "मिलान की स्थिति",
  unavailable: "उपलब्ध नहीं",
  "review required": "जाँच आवश्यक",
  matched: "मिलान हुआ",
  "refund reference": "रिफंड संदर्भ",
  "order subtotal": "ऑर्डर की टैक्स से पहले राशि",
  "actual refund": "वास्तविक रिफंड",
  "issued date": "जारी करने की तारीख",
  "refund completion date": "रिफंड पूरा होने की तारीख",
  "product name": "उत्पाद का नाम",
  "product code": "उत्पाद कोड",
  quantity: "मात्रा",
  "unit price": "प्रति इकाई कीमत",
  "gst rate": "GST दर",
  "item taxable value": "उत्पाद की कर योग्य राशि",
  "item cgst": "उत्पाद CGST",
  "item sgst": "उत्पाद SGST",
  "item igst": "उत्पाद IGST",
  "item total": "उत्पाद की कुल राशि",
  "transaction id": "लेनदेन आईडी",
  "download excel": "Excel डाउनलोड करें",
  "download csv": "CSV डाउनलोड करें",
  "preparing excel...": "Excel तैयार हो रही है...",
  "preparing csv...": "CSV तैयार हो रही है...",
  "grand total": "कुल योग",
  "credit note data": "क्रेडिट नोट विवरण",
  "item details": "उत्पाद विवरण",
  "no credit notes match the selected search and filters.":
    "चुनी गई खोज और फ़िल्टर से कोई क्रेडिट नोट नहीं मिला।",
  "unable to download credit notes report.":
    "क्रेडिट नोट रिपोर्ट डाउनलोड नहीं हो सकी।",
  "credit notes refreshed.": "क्रेडिट नोट रीफ़्रेश हो गए।",
  "unable to fetch credit notes.": "क्रेडिट नोट लोड नहीं हो सके।",
  "unable to generate pdf.": "PDF नहीं बन सकी।",
  "payment gateway charges": "भुगतान माध्यम शुल्क",
  customer: "ग्राहक",
  distributor: "वितरक",
  retailer: "खुदरा विक्रेता",
  wholesaler: "थोक विक्रेता",
  return: "वापसी",
  cancel: "रद्द",
  cancellation: "रद्दीकरण",
  cancelled: "रद्द किया गया",
  completed: "पूरा हुआ",
  delivered: "डिलीवर हुआ",
  pending: "लंबित",
  dispatched: "भेजा गया",
  "partial dispatched": "आंशिक रूप से भेजा गया",
  shipped: "भेजा गया",
  refunded: "रिफंड हुआ",
  returned: "वापस आया",
  failed: "विफल",
  processing: "प्रक्रिया में",
  delhi: "दिल्ली",
  punjab: "पंजाब",
  "uttar pradesh": "उत्तर प्रदेश",
  unknown: "अज्ञात",
  item: "उत्पाद",
  found: "मिले",
  "invalid credit notes response.": "क्रेडिट नोट का डेटा अमान्य है।",
};
const translate = (language: ReportLanguage, value: string) =>
  language === "hi"
    ? (HINDI[value.trim().replace(/_/g, " ").toLowerCase()] ?? value)
    : value;
const displayEnum = (language: ReportLanguage, value: unknown) =>
  value == null || value === "" ? "" : translate(language, String(value));

// =====================================================
// DEFAULT LOGO
// =====================================================
const DEFAULT_LOGO_URL =
  "https://www.markupdesigns.net/indikonnect/storage/logos/MmVFOudCiVU3Y8C0sf2gEEXna5jSKroCDj8xYMo0.png";

// =====================================================
// ANIMATIONS
// =====================================================
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 110, damping: 16 },
  },
};

// =====================================================
// HELPERS
// =====================================================
const formatAmount = (value: string | number | null | undefined) => {
  if (
    value == null ||
    String(value).trim() === "" ||
    !Number.isFinite(Number(value))
  )
    return "—";
  const amount = Number(value);
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// jsPDF default fonts do not support the ₹ symbol, so "Rs." is used in PDF
const formatAmountPdf = (value: string | number | null | undefined) => {
  if (
    value == null ||
    String(value).trim() === "" ||
    !Number.isFinite(Number(value))
  )
    return "-";
  const amount = Number(value);
  return `Rs. ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const parseReportDate = (value: string): Date => {
  const indian =
    /^(\d{2})-(\d{2})-(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(
      value,
    );
  if (indian)
    return new Date(
      `${indian[3]}-${indian[2]}-${indian[1]}T${indian[4] ?? "00"}:${indian[5] ?? "00"}:${indian[6] ?? "00"}+05:30`,
    );
  const local = /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/.test(
    value,
  );
  return new Date(
    local
      ? value.length === 10
        ? `${value}T00:00:00+05:30`
        : value.replace(" ", "T") + "+05:30"
      : value,
  );
};
const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = parseReportDate(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = parseReportDate(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const capitalize = (value?: string | null) => {
  if (!value) return "—";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getReasonClass = (reason?: string) => {
  switch (reason?.toLowerCase()) {
    case "return":
      return "border-[#2D6FE8]/25 bg-[#EAF3FF] text-[#2D6FE8]";
    case "cancel":
    case "cancellation":
      return "border-[#C23B32]/25 bg-[#FEF2F2] text-[#C23B32]";
    default:
      return "border-[#DCE6F2] bg-[#F4F8FD] text-[#6B7280]";
  }
};

const getBuyerInitials = (name?: string) => {
  if (!name || name === "Unknown") return "CN";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const getAccountTypeLabel = (accountType?: string | null) => {
  if (!accountType) return "Customer";
  return accountType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getAccountTypeClass = (accountType?: string | null) => {
  switch (accountType) {
    case "distributor":
      return "border-[#2D6FE8]/25 bg-[#EAF3FF] text-[#2D6FE8]";
    case "retailer":
      return "border-[#4F8FF7]/25 bg-[#EAF3FF] text-[#2D6FE8]";
    case "wholesaler":
      return "border-[#2D6FE8]/25 bg-[#EAF3FF] text-[#2D6FE8]";
    case "customer":
    default:
      return "border-[#DCE6F2] bg-[#F4F8FD] text-[#6B7280]";
  }
};

const getCreditNoteAccountType = (note: any): string => {
  if (!note) return "customer";
  return note.buyer_type || note.order?.order_type || "customer";
};

// Adapt the flat API contract to the legacy UI model, once, on ingestion.
// Explicit zero values are preserved. Missing amounts are never invented.
const normalizeCreditNote = (raw: any): CreditNote => {
  const oldOrder = raw.order ?? {};
  const oldRefund = raw.refund ?? {};
  const order = {
    ...oldOrder,
    id: raw.order_id ?? oldOrder.id,
    order_reference: raw.order_reference ?? oldOrder.order_reference,
    order_type: raw.order_type ?? oldOrder.order_type,
    status: raw.order_status ?? oldOrder.status,
    delivery_status: raw.delivery_status ?? oldOrder.delivery_status,
    return_status: raw.return_status ?? oldOrder.return_status,
    payment_gateway: raw.payment_gateway ?? oldOrder.payment_gateway,
    gateway_transaction_id:
      raw.gateway_transaction_id ?? oldOrder.gateway_transaction_id,
    subtotal: raw.subtotal ?? oldOrder.subtotal,
    shipping_charge: raw.shipping_charge ?? oldOrder.shipping_charge,
    total_payable: raw.total_payable ?? oldOrder.total_payable,
    amount_paid: raw.amount_paid ?? oldOrder.amount_paid,
  };
  const refund = {
    ...oldRefund,
    id: raw.refund_id ?? oldRefund.id,
    amount: raw.refund_amount ?? oldRefund.amount,
    refund_method: raw.refund_method ?? oldRefund.refund_method,
    status: raw.refund_status ?? oldRefund.status,
    gateway_reference: raw.gateway_reference ?? oldRefund.gateway_reference,
    completed_at: raw.refund_completed_at ?? oldRefund.completed_at,
  };
  return {
    ...raw,
    amount: raw.credit_note_amount ?? raw.amount,
    cgst_amount: raw.gst_breakdown?.cgst ?? raw.cgst_amount,
    sgst_amount: raw.gst_breakdown?.sgst ?? raw.sgst_amount,
    igst_amount: raw.gst_breakdown?.igst ?? raw.igst_amount,
    order: Object.values(order).some((v) => v != null) ? order : null,
    refund: Object.values(refund).some((v) => v != null) ? refund : null,
    items: Array.isArray(raw.items) ? raw.items : [],
  } as CreditNote;
};
const gstRegistration = (value: unknown): "URP" | "Registered" | "" => {
  const v = String(value ?? "")
    .trim()
    .toUpperCase();
  return !v ? "" : v === "URP" ? "URP" : "Registered";
};
// Registered is a report grouping, not validation of GST registration.
const itemLineSum = (note: any): number | null => {
  if (
    !Array.isArray(note.items) ||
    !note.items.length ||
    note.items.some((i: any) => numeric(i.line_total) === null)
  )
    return null;
  return round2(
    note.items.reduce((sum: number, i: any) => sum + Number(i.line_total), 0),
  );
};
const itemAmountDifference = (note: any): number | null => {
  const sum = itemLineSum(note),
    reported = numeric(note.total_item_amount);
  return sum === null || reported === null ? null : round2(sum - reported);
};
// Shared by the directory and CSV export so both use identical filter rules.
type CreditNoteReasonFilter = "all" | "return" | "other";

const matchesCreditNoteFilters = (
  note: any,
  query: string,
  reasonFilter: CreditNoteReasonFilter,
): boolean => {
  const order = note?.order;
  const refund = note?.refund;
  const searchable = [
    note?.credit_note_number,
    note?.original_invoice_number,
    note?.invoice_date,
    note?.order_line_id,
    note?.refund_id,
    gstRegistration(note?.buyer_gstin),
    note?.buyer_name,
    note?.buyer_email,
    note?.buyer_gstin,
    note?.buyer_state,
    note?.buyer_address,
    ...(Array.isArray(note?.items)
      ? note.items.flatMap((item: any) => [
          item.product_name,
          item.product_code,
        ])
      : []),
    String(note?.id ?? ""),
    String(note?.order_id ?? ""),
    note?.reason,
    getCreditNoteAccountType(note),
    order?.order_reference,
    order?.order_type,
    order?.status,
    order?.delivery_status,
    order?.return_status,
    order?.payment_gateway,
    order?.gateway_transaction_id,
    refund?.gateway_reference,
    refund?.refund_method,
    refund?.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const translated = [
    note?.buyer_state,
    note?.reason,
    getCreditNoteAccountType(note),
    order?.status,
    order?.delivery_status,
    order?.return_status,
    refund?.status,
  ]
    .map((v) => displayEnum("hi", v))
    .join(" ")
    .toLowerCase();
  const matchesSearch =
    !query || searchable.includes(query) || translated.includes(query);
  const reason = String(note?.reason ?? "").toLowerCase();
  const matchesReason =
    reasonFilter === "all" ||
    (reasonFilter === "return" && reason === "return") ||
    (reasonFilter === "other" && reason !== "return");
  return matchesSearch && matchesReason;
};

// Do not replace settled refund or issued credit note amounts with estimates.
const numeric = (value: unknown): number | null => {
  if (value == null || String(value).trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const reconciliation = (note: any) => {
  const b = note?.refund?.deduction_breakdown;
  const gross = numeric(b?.gross_refund?.total);
  const deductions =
    numeric(b?.deductions_total) ??
    (Array.isArray(b?.deductions) &&
    b.deductions.every((d: any) => numeric(d.amount) !== null)
      ? round2(
          b.deductions.reduce(
            (sum: number, d: any) => sum + Number(d.amount),
            0,
          ),
        )
      : null);
  const expected =
    gross !== null && deductions !== null ? round2(gross - deductions) : null;
  const actual = numeric(note?.refund?.amount);
  const difference =
    expected !== null && actual !== null ? round2(expected - actual) : null;
  return { gross, deductions, expected, actual, difference };
};

// ================= COMPACT GST CREDIT NOTE EXPORT =================
// Keep the reference format independent of the dashboard and PDF.
const CREDIT_EXPORT_HEADERS = [
  "Credit Note No",
  "Credit Note Date",
  "Original Invoice Number",
  "Original Invoice Date",
  "Customer Name",
  "GSTIN NO",
  "Place Of Supply (POS)",
  "Rate",
  "Taxable Value",
  "CGST",
  "SGST",
  "IGST",
  "Invoice Value",
];
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

const creditPos = (note: any): string => {
  const raw =
    String(note.place_of_supply ?? note.order?.place_of_supply ?? "").trim() ||
    String(note.buyer_state ?? "").trim();
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
  const match =
    aliases[key] ||
    Object.keys(GST_STATES).find((k) => stateKey(GST_STATES[k]) === key);
  return match ? `${match}-${GST_STATES[match]}` : raw;
};
const creditExcelDate = (value: unknown): Date | string | null => {
  if (value == null || !String(value).trim()) return null;
  const parsed = parseReportDate(String(value).trim());
  if (!Number.isFinite(parsed.getTime())) return String(value);
  // Excel dates are date-only, using the Indian calendar day.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(parsed);
  const part = (name: string) =>
    Number(parts.find((p) => p.type === name)?.value);
  return new Date(Date.UTC(part("year"), part("month") - 1, part("day")));
};
type CreditExportRow = (string | number | Date | null)[];
const creditSum = (values: unknown[]): number | null => {
  const numbers = values.map(numeric);
  if (!numbers.length || numbers.some((n) => n === null)) return null;
  return round2(numbers.reduce<number>((sum, n) => sum + (n ?? 0), 0));
};
const buildCreditExportRows = (notes: CreditNote[]): CreditExportRow[] => {
  return notes.flatMap((raw): CreditExportRow[] => {
    const note: any = normalizeCreditNote(raw);
    const prefix = [
      String(note.credit_note_number ?? ""),
      creditExcelDate(note.issued_at),
      String(note.original_invoice_number ?? ""),
      creditExcelDate(note.invoice_date ?? note.original_invoice_date),
      String(note.buyer_name ?? ""),
      String(note.buyer_gstin ?? ""),
      creditPos(note),
    ];
    const items: any[] = note.items;
    const groups = new Map<number | null, any[]>();
    for (const item of items) {
      const rate = numeric(item.gst_rate);
      const group = groups.get(rate) ?? [];
      group.push(item);
      groups.set(rate, group);
    }
    if (!groups.size) groups.set(numeric(note.gst_rate ?? note.rate), []);
    const singleRate = groups.size === 1;
    return Array.from(groups, ([rate, lines]) => {
      // For one rate, use the credit note's recorded tax amounts; for mixed
      // rates use the item tax amounts, never repeat the entire note totals.
      const value = (noteValue: unknown, field: string) =>
        (singleRate ? numeric(noteValue) : null) ??
        creditSum(lines.map((i) => i[field]));
      const taxable = value(note.taxable_value, "taxable_value");
      const cgst = value(note.cgst_amount, "cgst");
      const sgst = value(note.sgst_amount, "sgst");
      const igst = value(note.igst_amount, "igst");
      // As in the reference: invoice value = taxable amount + GST.
      // This is not the amount refunded or the payment settlement amount.
      const invoiceValue = creditSum([taxable, cgst, sgst, igst]);
      return [...prefix, rate, taxable, cgst, sgst, igst, invoiceValue];
    });
  });
};
const creditExportCellText = (value: CreditExportRow[number]) => {
  if (value instanceof Date)
    return value
      .toLocaleDateString("en-GB", {
        timeZone: "UTC",
        day: "2-digit",
        month: "short",
        year: "2-digit",
      })
      .replace(/ /g, "-");
  return value;
};

const csvCell = (value: unknown): string => {
  let text = value === null || value === undefined ? "" : String(value);
  // Protect exported text against spreadsheet formula injection.
  if (
    typeof value === "string" &&
    /^\s*[=+@-]/.test(text) &&
    !/^-?\d+(?:\.\d+)?$/.test(text)
  )
    text = "'" + text;
  return `"${text.replace(/"/g, '""')}"`;
};

type FieldRule = {
  id: number;
  field: string;
  op: string;
  value: string;
  end: string;
};
type FieldDef = {
  key: string;
  label: string;
  kind: "text" | "number" | "date";
  read: (note: any, item?: any) => unknown;
  item?: boolean;
};
const FIELD_DEFS: FieldDef[] = [
  {
    key: "gstType",
    label: "GST registration",
    kind: "text",
    read: (n) => gstRegistration(n.buyer_gstin),
  },
  ...[
    ["id", "Credit Note ID"],
    ["s_no", "S.No."],
    ["order_id", "Order ID"],
    ["order_line_id", "Order Line ID"],
    ["refund_id", "Refund ID"],
    ["credit_note_number", "Credit note number"],
    ["original_invoice_number", "Original invoice number"],
    ["buyer_name", "Buyer name"],
    ["buyer_email", "Buyer email"],
    ["buyer_state", "Buyer state"],
    ["buyer_gstin", "Buyer GSTIN"],
    ["buyer_address", "Buyer address"],
    ["reason", "Reason"],
  ].map(([key, label]): FieldDef => ({
    key,
    label,
    kind: "text",
    read: (n) => n[key],
  })),
  {
    key: "buyer_type",
    label: "Buyer type",
    kind: "text",
    read: (n) => getCreditNoteAccountType(n),
  },
  ...[
    ["order_reference", "Order reference"],
    ["order_type", "Order type"],
    ["status", "Order status"],
    ["delivery_status", "Delivery status"],
    ["return_status", "Return status"],
    ["payment_gateway", "Payment gateway"],
    ["gateway_transaction_id", "Transaction ID"],
  ].map(([key, label]): FieldDef => ({
    key: "order." + key,
    label,
    kind: "text",
    read: (n) => n.order?.[key],
  })),
  ...[
    ["status", "Refund status"],
    ["refund_method", "Refund method"],
    ["gateway_reference", "Refund reference"],
  ].map(([key, label]): FieldDef => ({
    key: "refund." + key,
    label,
    kind: "text",
    read: (n) => n.refund?.[key],
  })),
  ...[
    ["amount", "Credit note amount"],
    ["taxable_value", "Taxable value"],
    ["cgst_amount", "CGST"],
    ["sgst_amount", "SGST"],
    ["igst_amount", "IGST"],
    ["total_gst", "Total GST"],
  ].map(([key, label]): FieldDef => ({
    key,
    label,
    kind: "number",
    read: (n) => n[key],
  })),
  ...[
    ["subtotal", "Order subtotal"],
    ["shipping_charge", "Shipping"],
    ["total_payable", "Total payable"],
    ["amount_paid", "Amount paid"],
  ].map(([key, label]): FieldDef => ({
    key: "order." + key,
    label,
    kind: "number",
    read: (n) => n.order?.[key],
  })),
  {
    key: "refund.amount",
    label: "Actual refund",
    kind: "number",
    read: (n) => n.refund?.amount,
  },
  {
    key: "difference",
    label: "Refund reconciliation difference",
    kind: "number",
    read: (n) => reconciliation(n).difference,
  },
  {
    key: "invoice_date",
    label: "Invoice Date",
    kind: "date",
    read: (n) => n.invoice_date,
  },
  {
    key: "item_count",
    label: "Item Count",
    kind: "number",
    read: (n) => n.item_count ?? n.items?.length,
  },
  {
    key: "total_item_amount",
    label: "Total Item Amount (API)",
    kind: "number",
    read: (n) => n.total_item_amount,
  },
  {
    key: "item_sum",
    label: "Sum of Item Line Totals",
    kind: "number",
    read: itemLineSum,
  },
  {
    key: "item_difference",
    label: "Item Amount Difference",
    kind: "number",
    read: itemAmountDifference,
  },
  {
    key: "issued_at",
    label: "Issued date",
    kind: "date",
    read: (n) => n.issued_at,
  },
  {
    key: "completed_at",
    label: "Refund completion date",
    kind: "date",
    read: (n) => n.refund?.completed_at,
  },
  ...[
    ["order_line_id", "Order Line ID"],
    ["product_id", "Product ID"],
    ["product_name", "Product name"],
    ["product_code", "Product code"],
  ].map(([key, label]): FieldDef => ({
    key: "item." + key,
    label,
    kind: "text",
    item: true,
    read: (_n, i) => i?.[key],
  })),
  ...[
    ["quantity", "Quantity"],
    ["unit_price", "Unit price"],
    ["gst_rate", "GST rate"],
    ["taxable_value", "Item taxable value"],
    ["cgst", "Item CGST"],
    ["sgst", "Item SGST"],
    ["igst", "Item IGST"],
    ["line_total", "Item total"],
  ].map(([key, label]): FieldDef => ({
    key: "item." + key,
    label,
    kind: "number",
    item: true,
    read: (_n, i) => i?.[key],
  })),
];
const fieldMatches = (
  field: FieldDef,
  rule: FieldRule,
  note: any,
  item?: any,
) => {
  const raw = field.read(note, item);
  const blank = raw == null || String(raw).trim() === "";
  if (rule.op === "empty") return blank;
  if (!rule.value.trim()) return true;
  if (blank) return false;
  if (field.kind === "number") {
    const n = numeric(raw),
      a = numeric(rule.value),
      b = numeric(rule.end);
    if (n === null || a === null) return false;
    return rule.op === "gte"
      ? n >= a
      : rule.op === "lte"
        ? n <= a
        : rule.op === "between"
          ? b !== null && n >= a && n <= b
          : n === a;
  }
  if (field.kind === "date") {
    const d = parseReportDate(String(raw));
    if (Number.isNaN(d.getTime())) return false;
    const day = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);
    const iso = ["year", "month", "day"]
      .map((k) => day.find((p) => p.type === k)?.value)
      .join("-");
    return rule.op === "gte"
      ? iso >= rule.value
      : rule.op === "lte"
        ? iso <= rule.value
        : rule.op === "between"
          ? !!rule.end && iso >= rule.value && iso <= rule.end
          : iso === rule.value;
  }
  const value = String(raw).trim().toLowerCase(),
    query = rule.value.trim().toLowerCase();
  const candidates = [value];
  if (
    [
      "gstType",
      "buyer_type",
      "buyer_state",
      "reason",
      "order.order_type",
      "order.status",
      "order.delivery_status",
      "order.return_status",
      "refund.status",
    ].includes(field.key)
  )
    candidates.push(translate("hi", value).toLowerCase());
  return candidates.some((v) =>
    rule.op === "contains" ? v.includes(query) : v === query,
  );
};
const matchesRules = (note: any, rules: FieldRule[]) => {
  const active = rules
    .filter((r) => r.op === "empty" || r.value.trim())
    .flatMap((rule) => {
      const field = FIELD_DEFS.find((f) => f.key === rule.field);
      return field ? [{ field, rule }] : [];
    });
  const itemRules = active.filter((x) => x.field.item);
  return (
    active
      .filter((x) => !x.field.item)
      .every(({ field, rule }) => fieldMatches(field, rule, note)) &&
    (!itemRules.length ||
      (Array.isArray(note.items) &&
        note.items.some((item: any) =>
          itemRules.every(({ field, rule }) =>
            fieldMatches(field, rule, note, item),
          ),
        )))
  );
};

const getOrderStatusClass = (status?: string | null) => {
  switch (status?.toLowerCase()) {
    case "completed":
    case "delivered":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "cancelled":
      return "border-red-200 bg-red-50 text-red-700";
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "partial_dispatched":
    case "dispatched":
    case "shipped":
      return "border-[#2D6FE8]/25 bg-[#EAF3FF] text-[#2D6FE8]";
    case "refunded":
      return "border-purple-200 bg-purple-50 text-purple-700";
    default:
      return "border-[#DCE6F2] bg-[#F4F8FD] text-[#6B7280]";
  }
};

// =====================================================
// PDF TABLE ENGINE (jsPDF only — no extra dependency)
// =====================================================
type RGB = [number, number, number];

const PDF_COLORS = {
  blue: [45, 111, 232] as RGB,
  blueLight: [234, 243, 255] as RGB,
  bgSoft: [244, 248, 253] as RGB,
  zebra: [250, 252, 255] as RGB,
  border: [200, 214, 232] as RGB,
  text: [17, 24, 39] as RGB,
  muted: [107, 114, 128] as RGB,
  white: [255, 255, 255] as RGB,
};

interface KVCell {
  label: string;
  value: string | number | null | undefined;
  full?: boolean;
  bold?: boolean;
  color?: RGB;
}

interface TableRowStyle {
  bold?: boolean;
  fill?: RGB;
  color?: RGB;
}

const pdfVal = (v: string | number | null | undefined) =>
  v === null || v === undefined || v === "" || v === "—" ? "-" : String(v);

// =====================================================
// VIEW MODAL
// =====================================================
interface CreditNoteViewModalProps {
  open: boolean;
  note: CreditNote | null;
  onClose: () => void;
  onDownload: (note: CreditNote) => void;
  canDownload?: boolean;
  language: ReportLanguage;
}

const CreditNoteViewModal: React.FC<CreditNoteViewModalProps> = ({
  open,
  note,
  onClose,
  onDownload,
  canDownload = false,
  language,
}) => {
  const t = (value: string) => translate(language, value);
  if (!open || !note) return null;

  const accountType = getCreditNoteAccountType(note);
  const order: any = (note as any).order;
  const refund: any = (note as any).refund;

  return (
    <GlobalModal isOpen={open} onClose={onClose} closeOnOverlayClick title="">
      <div className="w-full max-w-[860px] overflow-hidden rounded-[22px] border border-[#2D6FE8]/10 bg-white font-poppins shadow-2xl">
        <div className="h-[3px] w-full bg-gradient-to-r from-[#4F8FF7] via-[#4F8FF7] to-[#2D6FE8]" />
        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-[#DCE6F2] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#2D6FE8]">
              <FiFileText size={19} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#4F8FF7]">
                {t("Credit Note")}
              </p>
              <h2 className="mt-0.5 text-lg font-semibold text-[#111827]">
                {note.credit_note_number}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[#F4F8FD] hover:text-[#2D6FE8]"
          >
            <FiX size={17} />
          </button>
        </div>

        {/* BODY */}
        <div className="max-h-[75vh] overflow-y-auto bg-[#F4F8FD] p-5 sm:p-6">
          {/* TOP SUMMARY */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#DCE6F2] bg-white p-4">
              <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                {t("Order Reference")}
              </p>
              <p className="mt-1 break-all text-sm font-bold text-[#111827]">
                {order?.order_reference ||
                  (note as any).original_invoice_number ||
                  "—"}
              </p>
            </div>
            <div className="rounded-xl border border-[#DCE6F2] bg-white p-4">
              <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                {t("Reason")}
              </p>
              <span
                className={`mt-1.5 inline-flex rounded-full border px-2.5 py-1 text-[9px] font-bold ${getReasonClass(note.reason)}`}
              >
                {t(capitalize(note.reason))}
              </span>
            </div>
            <div className="rounded-xl border border-[#2D6FE8]/20 bg-[#EAF3FF] p-4">
              <p className="text-[9px] font-bold uppercase tracking-wide text-[#4F8FF7]">
                {t("Credit Amount")}
              </p>
              <p className="mt-1 text-lg font-bold text-[#2D6FE8]">
                {formatAmount(note.amount)}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl border border-[#DCE6F2] bg-white p-4 text-xs">
            <div>
              <p className="text-slate-500">{t("Original Invoice Number")}</p>
              <p className="mt-1 font-semibold">
                {note.original_invoice_number || "—"}
              </p>
            </div>
            <div>
              <p className="text-slate-500">{t("Invoice Date")}</p>
              <p className="mt-1 font-semibold">
                {formatDate((note as any).invoice_date)}
              </p>
            </div>
          </div>
          {/* BUYER */}
          <div className="mt-4 rounded-xl border border-[#DCE6F2] bg-white p-4">
            <div className="mb-4 flex items-center gap-3 border-b border-[#DCE6F2] pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF3FF] text-xs font-bold text-[#2D6FE8]">
                {getBuyerInitials(note.buyer_name)}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111827]">
                  {t("Buyer Details")}
                </h3>
                <span
                  className={`mt-0.5 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-bold ${getAccountTypeClass(accountType)}`}
                >
                  <FiBriefcase size={9} /> {t(getAccountTypeLabel(accountType))}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                  {t("Name")}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#111827]">
                  {note.buyer_name || t("Unknown")}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                  {t("Email")}
                </p>
                <p className="mt-1 break-all text-sm font-semibold text-[#111827]">
                  {note.buyer_email || "—"}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                  {t("State")}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#111827]">
                  {t(note.buyer_state || "—")}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                  GSTIN
                </p>
                <p className="mt-1 text-sm font-semibold text-[#111827]">
                  {note.buyer_gstin || "—"}
                </p>
              </div>
              {note.buyer_address && (
                <div className="sm:col-span-2">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                    {t("Address")}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#111827]">
                    {note.buyer_address}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ORDER DETAILS */}
          {order && (
            <div className="mt-4 rounded-xl border border-[#DCE6F2] bg-white p-4">
              <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-[#DCE6F2] pb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF3FF] text-[#2D6FE8]">
                  <FiPackage size={16} />
                </div>
                <h3 className="text-sm font-bold text-[#111827]">
                  {t("Order Details")}
                </h3>
                <span
                  className={`ml-auto inline-flex rounded-full border px-2.5 py-1 text-[9px] font-bold ${getOrderStatusClass(order.status)}`}
                >
                  {t(capitalize(order.status))}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                    {t("Order Ref")}
                  </p>
                  <p className="mt-1 break-all text-xs font-semibold text-[#111827]">
                    {order.order_reference || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                    {t("Order Type")}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#111827]">
                    {t(getAccountTypeLabel(order.order_type))}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                    {t("Payment Gateway")}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#111827]">
                    {t(capitalize(order.payment_gateway))}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                    {t("Subtotal")}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#111827]">
                    {formatAmount(order.subtotal)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                    {t("Shipping")}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#111827]">
                    {formatAmount(order.shipping_charge)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                    {t("Total Payable")}
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#2D6FE8]">
                    {formatAmount(order.total_payable)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                    {t("Amount Paid")}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#111827]">
                    {formatAmount(order.amount_paid)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                    {t("Delivery Status")}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#111827]">
                    {t(capitalize(order.delivery_status))}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                    {t("Return Status")}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#111827]">
                    {t(capitalize(order.return_status))}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                    {t("Confirmed At")}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#111827]">
                    {formatDateTime(order.confirmed_at)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                    {t("Created At")}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#111827]">
                    {formatDateTime(order.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                    {t("Gateway Txn ID")}
                  </p>
                  <p className="mt-1 break-all font-mono text-[10px] text-[#6B7280]">
                    {order.gateway_transaction_id || "—"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* REFUND DETAILS */}
          {refund && (
            <div className="mt-4 rounded-xl border border-[#DCE6F2] bg-white p-4">
              <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-[#DCE6F2] pb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF3FF] text-[#2D6FE8]">
                  <FiCreditCard size={16} />
                </div>
                <h3 className="text-sm font-bold text-[#111827]">
                  {t("Refund Details")}
                </h3>
                <span
                  className={`ml-auto inline-flex rounded-full border px-2.5 py-1 text-[9px] font-bold ${getOrderStatusClass(refund.status)}`}
                >
                  {t(capitalize(refund.status))}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                    {t("Refund Amount")}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#2D6FE8]">
                    {formatAmount(refund.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                    {t("Refund Method")}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#111827]">
                    {t(capitalize(refund.refund_method))}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                    {t("Gateway Reference")}
                  </p>
                  <p className="mt-1 break-all font-mono text-[10px] text-[#6B7280]">
                    {refund.gateway_reference || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                    {t("Completed At")}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#111827]">
                    {formatDateTime(refund.completed_at)}
                  </p>
                </div>
              </div>
              {refund.deduction_breakdown && (
                <div className="mt-4 rounded-lg border border-[#DCE6F2] bg-[#F8FBFF] p-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[#2D6FE8]">
                    {t("Deduction Breakdown")}
                  </p>
                  <div className="space-y-2">
                    {refund.deduction_breakdown.gross_refund && (
                      <div className="flex justify-between text-xs">
                        <span className="text-[#6B7280]">
                          {" "}
                          {t("Gross Refund")}{" "}
                        </span>
                        <span className="font-semibold text-[#111827]">
                          {formatAmount(
                            refund.deduction_breakdown.gross_refund.total,
                          )}
                        </span>
                      </div>
                    )}
                    {Array.isArray(refund.deduction_breakdown.deductions) &&
                      refund.deduction_breakdown.deductions.map(
                        (d: any, i: number) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-[#6B7280]">{t(d.label)}</span>
                            <span className="font-semibold text-[#4F8FF7]">
                              - {formatAmount(d.amount)}
                            </span>
                          </div>
                        ),
                      )}
                    <div className="border-t border-[#DCE6F2] pt-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-[#111827]">
                          {t("Net Refund")}
                        </span>
                        <span className="font-bold text-[#2D6FE8]">
                          {formatAmount(refund.deduction_breakdown.net_refund)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {(() => {
            const r = reconciliation(note);
            return r.difference !== null && Math.abs(r.difference) > 0.01 ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">
                  {" "}
                  {t("Refund reconciliation — review required")}{" "}
                </p>
                <p className="mt-1">
                  {" "}
                  {t("Gross refund minus listed deductions:")}{" "}
                  {formatAmount(r.expected)}.
                </p>
                <p>
                  {" "}
                  {t("Actual refund:")} {formatAmount(r.actual)}{" "}
                  {t(". Difference:")} {formatAmount(r.difference)}.
                </p>
                <p className="mt-1 text-xs">
                  {" "}
                  {t(
                    "The recorded refund and credit note amounts have not been changed.",
                  )}{" "}
                </p>
              </div>
            ) : null;
          })()}
          {/* ITEMS */}
          <div className="mt-4 overflow-hidden rounded-xl border border-[#DCE6F2] bg-white">
            <div className="border-b border-[#DCE6F2] px-4 py-3">
              <h3 className="text-sm font-bold text-[#111827]">
                {t("Credit Note Items")}
              </h3>
              <p className="mt-0.5 text-[10px] text-[#6B7280]">
                {note.items?.length || 0} {t("item")}
                {language === "en" && note.items?.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="overflow-x-auto">
              {note.items && note.items.length > 0 ? (
                <table className="w-full min-w-[620px] border-collapse">
                  <thead>
                    <tr className="bg-[#F4F8FD]">
                      <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                        {t("Product")}
                      </th>
                      <th className="px-4 py-3 text-center text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                        {t("Qty")}
                      </th>
                      <th className="px-4 py-3 text-right text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                        {t("Taxable")}
                      </th>
                      <th className="px-4 py-3 text-right text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                        GST
                      </th>
                      <th className="px-4 py-3 text-right text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                        {t("Total")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {note.items.map((item) => (
                      <tr
                        key={`${item.order_line_id}-${item.product_id}`}
                        className="border-t border-[#DCE6F2]"
                      >
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-[#111827]">
                            {item.product_name}
                          </p>
                          <p className="mt-0.5 font-mono text-[9px] text-[#6B7280]">
                            {t("Code:")}
                            {item.product_code || "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-semibold text-[#6B7280]">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-semibold text-[#6B7280]">
                          {formatAmount(item.taxable_value)}
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-semibold text-[#6B7280]">
                          {item.gst_rate}%
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-[#2D6FE8]">
                          {formatAmount(item.line_total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="px-4 py-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                    <FiFileText size={20} />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-[#111827]">
                    {t("No line items available")}
                  </p>
                  <p className="mt-1 text-[10px] text-[#6B7280]">
                    {t("This credit note has no item breakdown.")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {itemAmountDifference(note) !== null &&
            Math.abs(itemAmountDifference(note)!) > 0.01 && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                <p className="font-semibold">
                  {t("Review required")}: {t("Item Amount Difference")}
                </p>
                <p className="mt-1">
                  {t("Total Item Amount (API)")}:{" "}
                  {formatAmount((note as any).total_item_amount)}
                </p>
                <p>
                  {t("Sum of Item Line Totals")}:{" "}
                  {formatAmount(itemLineSum(note))}
                </p>
                <p>
                  {t("Item Amount Difference")}:{" "}
                  {formatAmount(itemAmountDifference(note))}
                </p>
              </div>
            )}
          {/* TAX + TOTAL */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#DCE6F2] bg-white p-4">
              <h3 className="mb-3 text-sm font-bold text-[#111827]">
                {t("Tax Summary")}
              </h3>
              <div className="space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#6B7280]"> {t("Taxable Value")} </span>
                  <span className="font-semibold text-[#111827]">
                    {formatAmount(note.taxable_value)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#6B7280]">CGST</span>
                  <span className="font-semibold text-[#111827]">
                    {formatAmount(note.cgst_amount)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#6B7280]">SGST</span>
                  <span className="font-semibold text-[#111827]">
                    {formatAmount(note.sgst_amount)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#6B7280]">IGST</span>
                  <span className="font-semibold text-[#111827]">
                    {formatAmount(note.igst_amount)}
                  </span>
                </div>
                <div className="border-t border-[#DCE6F2] pt-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-[#111827]">
                      {" "}
                      {t("Total GST")}{" "}
                    </span>
                    <span className="font-bold text-[#2D6FE8]">
                      {formatAmount(note.total_gst)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-[#2D6FE8]/20 bg-[#EAF3FF] p-4">
              <p className="text-[9px] font-bold uppercase tracking-wide text-[#4F8FF7]">
                {t("Final Credit Amount")}
              </p>
              <p className="mt-2 text-[28px] font-bold tracking-tight text-[#2D6FE8]">
                {formatAmount(note.amount)}
              </p>
              <div className="mt-4 border-t border-[#2D6FE8]/15 pt-3">
                <div className="flex items-center gap-2">
                  <FiCalendar size={13} className="text-[#4F8FF7]" />
                  <span className="text-[10px] font-semibold text-[#6B7280]">
                    {t("Issued")}
                    {formatDate(note.issued_at)}
                  </span>
                </div>
                {refund && (
                  <div className="mt-2 flex items-center gap-2">
                    <FiTag size={13} className="text-[#4F8FF7]" />
                    <span className="text-[10px] font-semibold text-[#6B7280]">
                      {t("Refund ID:")}
                      {refund.id}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 border-t border-[#DCE6F2] bg-white px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#DCE6F2] bg-white px-5 py-2.5 text-sm font-medium text-[#6B7280] transition hover:bg-[#F4F8FD] hover:text-[#2D6FE8]"
          >
            {t("Close")}
          </button>
          {canDownload && (
            <button
              type="button"
              onClick={() => onDownload(note)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-[#2D6FE8] hover:to-[#2D6FE8]"
            >
              <FiDownload size={15} />
              {t("Download PDF")}
            </button>
          )}
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================
const CreditNotes: React.FC = () => {
  const [language, setLanguage] = useState<ReportLanguage>("en");
  const t = (value: string) => translate(language, value);
  const [exportingExcel, setExportingExcel] = useState(false);
  const {
    hasPermission,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  const canViewCreditNotes = useMemo(
    () => isSuperAdmin || hasPermission("Credit Notes.view"),
    [isSuperAdmin, hasPermission],
  );
  const canDownloadCreditNotes = useMemo(
    () => isSuperAdmin || hasPermission("Credit Notes.download"),
    [isSuperAdmin, hasPermission],
  );

  const [logoUrl, setLogoUrl] = useState<string | null>(DEFAULT_LOGO_URL);
  const [logoLoading, setLogoLoading] = useState(true);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [initialCreditNotesLoading, setInitialCreditNotesLoading] =
    useState(true);
  const [loading, setLoading] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [search, setSearch] = useState("");
  const [reasonFilter, setReasonFilter] =
    useState<CreditNoteReasonFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rules, setRules] = useState<FieldRule[]>([]);
  const nextRuleId = useRef(1);
  const [selectedNote, setSelectedNote] = useState<CreditNote | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const ITEMS_PER_PAGE = 20;

  const fetchInFlightRef = useRef<Promise<void> | null>(null);
  const hasInitialFetchRef = useRef(false);

  // LOGO FETCH
  useEffect(() => {
    let cancelled = false;
    const fetchLogo = async () => {
      try {
        const response: any = await logoApi.getLogo();
        const possibleLogos: unknown[] = [
          response?.data?.data?.logo,
          response?.data?.logo,
          response?.data?.data?.data?.logo,
          response?.data?.data?.logo_url,
          response?.data?.logo_url,
          response?.logo,
        ];
        const resolvedLogo = possibleLogos.find(
          (value): value is string =>
            typeof value === "string" && /^https?:\/\//i.test(value.trim()),
        );
        if (!cancelled && resolvedLogo) setLogoUrl(resolvedLogo.trim());
      } catch (error) {
        console.error("Logo API error:", error);
      } finally {
        if (!cancelled) setLogoLoading(false);
      }
    };
    void fetchLogo();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load every API page once; filtering, pagination and CSV share this snapshot.
  const fetchCreditNotes = async (
    _page = 1,
    force = false,
    isInitialLoad = false,
  ) => {
    if (fetchInFlightRef.current) return fetchInFlightRef.current;
    if (!force && hasInitialFetchRef.current) return;
    const requestPromise = (async () => {
      try {
        setLoading(true);
        const all: CreditNote[] = [];
        let pages = 1;
        for (let page = 1; page <= pages; page++) {
          const response = await creditNotesApi.getAll(page);
          if (!response.data.success)
            throw new Error(
              response.data.message || "Unable to fetch credit notes.",
            );
          const pagination = response.data.data;
          if (!Array.isArray(pagination?.data))
            throw new Error("Invalid credit notes response.");
          all.push(...pagination.data.map(normalizeCreditNote));
          pages = Math.max(1, Number(pagination.last_page) || 1);
        }
        setCreditNotes(
          Array.from(new Map(all.map((note) => [note.id, note])).values()),
        );
        setCurrentPage(1);
        hasInitialFetchRef.current = true;
        if (force) toast.success(t("Credit notes refreshed."));
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            t("Unable to fetch credit notes."),
        );
      } finally {
        setLoading(false);
        if (isInitialLoad) setInitialCreditNotesLoading(false);
      }
    })();
    fetchInFlightRef.current = requestPromise;
    try {
      await requestPromise;
    } finally {
      fetchInFlightRef.current = null;
    }
  };

  // INITIAL FETCH
  useEffect(() => {
    if (permissionsLoading) return;
    if (canViewCreditNotes && !hasInitialFetchRef.current) {
      void fetchCreditNotes(1, false, true);
    } else if (!canViewCreditNotes) {
      setLoading(false);
      setInitialCreditNotesLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionsLoading, canViewCreditNotes]);

  const pageLoading =
    permissionsLoading || logoLoading || initialCreditNotesLoading;

  // One matching dataset for the directory, totals, and export.
  const matchingNotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return creditNotes.filter(
      (note) =>
        matchesCreditNoteFilters(note, query, reasonFilter) &&
        matchesRules(note, rules),
    );
  }, [creditNotes, search, reasonFilter, rules]);
  const totalRecords = matchingNotes.length;
  const lastPage = Math.max(1, Math.ceil(totalRecords / ITEMS_PER_PAGE));
  useEffect(() => {
    setCurrentPage(1);
  }, [search, reasonFilter, rules]);
  const activePage = Math.min(currentPage, lastPage);
  const filteredCreditNotes = matchingNotes.slice(
    (activePage - 1) * ITEMS_PER_PAGE,
    activePage * ITEMS_PER_PAGE,
  );
  const startEntry = totalRecords ? (activePage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const endEntry = totalRecords
    ? startEntry + filteredCreditNotes.length - 1
    : 0;
  const goToPage = (page: number) => {
    if (page >= 1 && page <= lastPage && !loading) setCurrentPage(page);
  };
  const handleRefresh = async () => {
    if (canViewCreditNotes && !loading) await fetchCreditNotes(1, true);
  };
  const totals = useMemo(() => {
    const sum = (read: (n: any) => unknown) =>
      round2(matchingNotes.reduce((a, n) => a + (numeric(read(n)) ?? 0), 0));
    return {
      credit: sum((n) => n.amount),
      gst: sum((n) => n.total_gst),
      refunded: sum((n) =>
        n.refund?.status === "completed" ? n.refund?.amount : null,
      ),
      flagged: matchingNotes.filter((n) => {
        const r = reconciliation(n);
        return r.difference !== null && Math.abs(r.difference) > 0.01;
      }).length,
    };
  }, [matchingNotes]);
  const updateRule = (id: number, patch: Partial<FieldRule>) =>
    setRules((old) => old.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  // CSV EXPORT — uses the exact same matching dataset as the directory.
  const handleDownloadReport = async (format: "csv" | "xlsx") => {
    if (
      !canViewCreditNotes ||
      !canDownloadCreditNotes ||
      exportingCsv ||
      exportingExcel ||
      loading
    )
      return;

    const activeReasonFilter = reasonFilter;

    try {
      if (format === "csv") setExportingCsv(true);
      else setExportingExcel(true);
      const exportNotes = matchingNotes;
      if (exportNotes.length === 0) {
        toast.error(
          t("No credit notes match the selected search and filters."),
        );
        return;
      }

      const headers = CREDIT_EXPORT_HEADERS.map(t);
      const rows = buildCreditExportRows(exportNotes);
      const dateStamp = new Date().toISOString().slice(0, 10);
      let blob: Blob;
      if (format === "csv") {
        const csvContent = [
          headers,
          ...rows.map((row) => row.map(creditExportCellText)),
        ]
          .map((row) => row.map(csvCell).join(","))
          .join("\r\n");
        blob = new Blob(["\uFEFF", csvContent], {
          type: "text/csv;charset=utf-8;",
        });
      } else {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = "IndieKonnect";
        // Compact, single-sheet layout. Column order and values are identical to CSV.
        const sheet = workbook.addWorksheet(t("Credit Note Data"), {
          views: [
            {
              state: "frozen",
              ySplit: 1,
              showGridLines: false,
              zoomScale: 80,
              zoomScaleNormal: 80,
            },
          ],
          properties: { defaultRowHeight: 19 },
          pageSetup: {
            orientation: "landscape",
            paperSize: 9,
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            printTitlesRow: "1:1",
            horizontalCentered: true,
            margins: {
              left: 0.25,
              right: 0.25,
              top: 0.35,
              bottom: 0.35,
              header: 0.15,
              footer: 0.15,
            },
          },
        });
        // Headers wrap rather than forcing every column to be as wide as its label.
        const minimum = [19, 13, 17, 14, 18, 19, 22, 8, 15, 13, 13, 13, 16];
        const maximum = [24, 15, 23, 16, 27, 23, 30, 10, 24, 24, 24, 24, 24];
        const displayText = (
          value: CreditExportRow[number],
          i: number,
        ): string => {
          const v = creditExportCellText(value);
          return typeof v === "number" && i >= 8
            ? v.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : String(v ?? "");
        };
        const widths = headers.map((_, i) =>
          Math.min(
            maximum[i],
            rows.reduce(
              (max, row) =>
                Math.max(
                  max,
                  Math.ceil(displayText(row[i], i).length * 1.03) + 2,
                ),
              minimum[i],
            ),
          ),
        );
        sheet.columns = widths.map((width) => ({ width }));
        const edge = { style: "thin" as const, color: { argb: "FFD3DFEB" } };
        const border = { top: edge, bottom: edge, left: edge, right: edge };
        const fontName = language === "hi" ? "Nirmala UI" : "Calibri";
        const headerRow = sheet.addRow(headers);
        headerRow.height = language === "hi" ? 42 : 34;
        headers.forEach((_, i) => {
          const cell = headerRow.getCell(i + 1);
          cell.font = {
            name: fontName,
            size: 10,
            bold: true,
            color: { argb: i === 12 ? "FF173B63" : "FFFFFFFF" },
          };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: i === 12 ? "FFBBDCFB" : "FF173B63" },
          };
          cell.border = border;
          cell.alignment = {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
          };
        });
        rows.forEach((values, index) => {
          const row = sheet.addRow(values);
          const lines = Math.max(
            1,
            ...values.map((v, i) =>
              i >= 7 || i === 1 || i === 3
                ? 1
                : Math.ceil(
                    displayText(v, i).length / Math.max(4, widths[i] - 3),
                  ),
            ),
          );
          row.height = Math.min(120, Math.max(23, lines * 13 + 8));
          headers.forEach((_, i) => {
            const cell = row.getCell(i + 1);
            cell.font = {
              name: fontName,
              size: 10,
              bold: i === 12,
              color: { argb: "FF173B63" },
            };
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb:
                  i === 12 ? "FFDCEEFF" : index % 2 ? "FFF1F6FC" : "FFFFFFFF",
              },
            };
            cell.border = border;
            cell.alignment = {
              vertical: "middle",
              horizontal:
                i === 1 || i === 3 || i === 7
                  ? "center"
                  : i >= 8
                    ? "right"
                    : "left",
              wrapText: i < 7 && i !== 1 && i !== 3,
              shrinkToFit: i >= 7 || i === 1 || i === 3,
            };
            cell.numFmt =
              i === 1 || i === 3
                ? "dd-mmm-yy"
                : i === 7
                  ? "0.##"
                  : i >= 8
                    ? "#,##0.00"
                    : "@";
          });
        });
        // Only the header and actual matching data are written. No padded rows,
        // merged banners, extra sheets or totals outside the reference format.
        sheet.autoFilter = {
          from: { row: 1, column: 1 },
          to: { row: rows.length + 1, column: headers.length },
        };
        sheet.pageSetup.printArea = `A1:M${rows.length + 1}`;
        const buffer = await workbook.xlsx.writeBuffer();
        blob = new Blob([new Uint8Array(buffer)], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `credit-notes-${activeReasonFilter}-${language}-${dateStamp}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      toast.success(
        language === "hi"
          ? `${exportNotes.length} क्रेडिट नोट डाउनलोड किए गए।`
          : `Downloaded ${exportNotes.length} credit note(s) as ${format.toUpperCase()}.`,
      );
    } catch (error: any) {
      console.error("Download credit notes CSV error:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          t("Unable to download credit notes report."),
      );
    } finally {
      setExportingCsv(false);
      setExportingExcel(false);
    }
  };

  const handleView = (note: CreditNote) => {
    setSelectedNote(note);
    setViewOpen(true);
  };

  // ===================================================
  // PDF — FULL TABLE LAYOUT
  // ===================================================
  const generateCreditNotePdf = (note: CreditNote) => {
    if (!canDownloadCreditNotes) {
      toast.error("You do not have permission to download credit note PDF.");
      return;
    }
    try {
      const C = PDF_COLORS;
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const ML = 12;
      const CW = pageW - ML * 2;
      const BOTTOM = pageH - 18;
      const accountType = getCreditNoteAccountType(note);
      const order: any = (note as any).order;
      const refund: any = (note as any).refund;
      let y = 0;

      const ensureSpace = (h: number) => {
        if (y + h > BOTTOM) {
          doc.addPage();
          y = 16;
        }
      };

      // HEADER BAND
      doc.setFillColor(...C.blue);
      doc.rect(0, 0, pageW, 32, "F");
      doc.setFillColor(79, 143, 247);
      doc.rect(0, 32, pageW, 1.2, "F");
      doc.setTextColor(...C.white);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("CREDIT NOTE", ML, 15);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text("IndieKonnect", ML, 23);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(pdfVal(note.credit_note_number), pageW - ML, 14, {
        align: "right",
      });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Issued: ${formatDate(note.issued_at)}`, pageW - ML, 21, {
        align: "right",
      });
      doc.text(`Reason: ${t(capitalize(note.reason))}`, pageW - ML, 27, {
        align: "right",
      });
      y = 42;

      const sectionTitle = (title: string) => {
        ensureSpace(16);
        doc.setFillColor(...C.blue);
        doc.rect(ML, y, 1.4, 5.2, "F");
        doc.setTextColor(...C.text);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.text(title, ML + 3.5, y + 4.2);
        y += 8;
      };

      const drawKVTable = (cells: KVCell[]) => {
        const LABEL_W = 29;
        const PAIR_W = CW / 2;
        const rows: KVCell[][] = [];
        let pending: KVCell | null = null;
        cells.forEach((cell) => {
          if (cell.full) {
            if (pending) {
              rows.push([pending]);
              pending = null;
            }
            rows.push([cell]);
          } else if (!pending) pending = cell;
          else {
            rows.push([pending, cell]);
            pending = null;
          }
        });
        if (pending) rows.push([pending]);

        rows.forEach((row) => {
          const isFull = row.length === 1 && row[0].full;
          const lastSingle = row.length === 1 && !row[0].full;
          const measured = row.map((cell) => {
            const valueW = isFull ? CW - LABEL_W : PAIR_W - LABEL_W;
            doc.setFont("helvetica", cell.bold ? "bold" : "normal");
            doc.setFontSize(8.5);
            const lines = doc.splitTextToSize(pdfVal(cell.value), valueW - 4);
            return { cell, lines, valueW };
          });
          const rowH = Math.max(
            8,
            ...measured.map((m) => m.lines.length * 4 + 4),
          );
          ensureSpace(rowH);
          measured.forEach((m, idx) => {
            const x = ML + idx * PAIR_W;
            doc.setFillColor(...C.bgSoft);
            doc.setDrawColor(...C.border);
            doc.setLineWidth(0.2);
            doc.rect(x, y, LABEL_W, rowH, "FD");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7.5);
            doc.setTextColor(...C.muted);
            doc.text(m.cell.label.toUpperCase(), x + 2, y + 5);
            doc.setFillColor(...C.white);
            doc.rect(x + LABEL_W, y, m.valueW, rowH, "FD");
            doc.setFont("helvetica", m.cell.bold ? "bold" : "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(...(m.cell.color || C.text));
            doc.text(m.lines, x + LABEL_W + 2, y + 5);
          });
          if (lastSingle) {
            const x = ML + PAIR_W;
            doc.setFillColor(...C.white);
            doc.setDrawColor(...C.border);
            doc.rect(x, y, PAIR_W, rowH, "FD");
          }
          y += rowH;
        });
        y += 6;
      };

      const drawTable = (opts: {
        headers?: string[];
        rows: string[][];
        widths: number[];
        aligns: Array<"left" | "center" | "right">;
        x?: number;
        rowStyle?: (rowIndex: number) => TableRowStyle | undefined;
        zebra?: boolean;
      }) => {
        const { headers, rows, widths, aligns, rowStyle, zebra = true } = opts;
        const startX = opts.x ?? ML;
        const PAD = 2;
        const drawHeader = () => {
          if (!headers) return;
          ensureSpace(10);
          let cx = startX;
          headers.forEach((h, i) => {
            doc.setFillColor(...C.blue);
            doc.setDrawColor(...C.blue);
            doc.rect(cx, y, widths[i], 8, "FD");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(...C.white);
            const tx =
              aligns[i] === "right"
                ? cx + widths[i] - PAD
                : aligns[i] === "center"
                  ? cx + widths[i] / 2
                  : cx + PAD;
            doc.text(h.toUpperCase(), tx, y + 5.3, { align: aligns[i] });
            cx += widths[i];
          });
          y += 8;
        };
        drawHeader();
        rows.forEach((row, rIdx) => {
          const style = rowStyle?.(rIdx);
          doc.setFont("helvetica", style?.bold ? "bold" : "normal");
          doc.setFontSize(8.5);
          const wrapped = row.map((cell, i) =>
            String(cell)
              .split("\n")
              .flatMap((part) =>
                doc.splitTextToSize(part, widths[i] - PAD * 2),
              ),
          );
          const rowH = Math.max(
            8,
            ...wrapped.map((lines) => lines.length * 4 + 4),
          );
          if (y + rowH > BOTTOM) {
            doc.addPage();
            y = 16;
            drawHeader();
          }
          let cx = startX;
          row.forEach((_, i) => {
            const fill =
              style?.fill || (zebra && rIdx % 2 === 1 ? C.zebra : C.white);
            doc.setFillColor(...fill);
            doc.setDrawColor(...C.border);
            doc.setLineWidth(0.2);
            doc.rect(cx, y, widths[i], rowH, "FD");
            const lines = wrapped[i];
            lines.forEach((line: string, lIdx: number) => {
              const isSub = !style?.bold && i === 1 && lIdx > 0 && !!headers;
              doc.setFont(
                "helvetica",
                style?.bold && !isSub ? "bold" : "normal",
              );
              doc.setFontSize(isSub ? 7.5 : 8.5);
              if (isSub) doc.setTextColor(...C.muted);
              else doc.setTextColor(...(style?.color || C.text));
              const tx =
                aligns[i] === "right"
                  ? cx + widths[i] - PAD
                  : aligns[i] === "center"
                    ? cx + widths[i] / 2
                    : cx + PAD;
              doc.text(line, tx, y + 5 + lIdx * 4, { align: aligns[i] });
            });
            cx += widths[i];
          });
          y += rowH;
        });
        y += 6;
      };

      // 1. DOCUMENT + BUYER DETAILS
      sectionTitle("Document Details");
      drawKVTable([
        {
          label: "Credit Note No.",
          value: note.credit_note_number,
          bold: true,
        },
        { label: "Issued Date", value: formatDate(note.issued_at) },
        { label: "Orig. Invoice", value: note.original_invoice_number },
        {
          label: "Invoice Date",
          value: formatDate((note as any).invoice_date),
        },
        { label: "Order ID", value: note.order_id },
        { label: "Order Ref", value: order?.order_reference },
        { label: "Reason", value: capitalize(note.reason) },
      ]);

      sectionTitle("Buyer Details");
      drawKVTable([
        { label: "Name", value: note.buyer_name || "Unknown", bold: true },
        { label: "Account Type", value: getAccountTypeLabel(accountType) },
        { label: "Email", value: note.buyer_email },
        { label: "State", value: note.buyer_state },
        { label: "GSTIN", value: note.buyer_gstin },
        ...(note.buyer_address
          ? [
              {
                label: "Address",
                value: note.buyer_address,
                full: true,
              } as KVCell,
            ]
          : []),
      ]);

      // 2. ORDER DETAILS
      if (order) {
        sectionTitle("Order Details");
        drawKVTable([
          { label: "Order Ref", value: order.order_reference, bold: true },
          { label: "Order Type", value: getAccountTypeLabel(order.order_type) },
          { label: "Order Status", value: capitalize(order.status) },
          { label: "Payment Via", value: capitalize(order.payment_gateway) },
          { label: "Subtotal", value: formatAmountPdf(order.subtotal) },
          { label: "Shipping", value: formatAmountPdf(order.shipping_charge) },
          {
            label: "Total Payable",
            value: formatAmountPdf(order.total_payable),
            bold: true,
            color: C.blue,
          },
          { label: "Amount Paid", value: formatAmountPdf(order.amount_paid) },
          { label: "Delivery", value: capitalize(order.delivery_status) },
          { label: "Return Status", value: capitalize(order.return_status) },
          { label: "Confirmed At", value: formatDateTime(order.confirmed_at) },
          { label: "Created At", value: formatDateTime(order.created_at) },
          {
            label: "Gateway Txn ID",
            value: order.gateway_transaction_id,
            full: true,
          },
        ]);
      }

      // 3. REFUND DETAILS
      if (refund) {
        sectionTitle("Refund Details");
        drawKVTable([
          { label: "Refund ID", value: refund.id ?? note.refund_id },
          { label: "Status", value: capitalize(refund.status) },
          {
            label: "Refund Amount",
            value: formatAmountPdf(refund.amount),
            bold: true,
            color: C.blue,
          },
          { label: "Method", value: capitalize(refund.refund_method) },
          { label: "Completed At", value: formatDateTime(refund.completed_at) },
          { label: "Gateway Ref", value: refund.gateway_reference },
        ]);
        const breakdown = refund.deduction_breakdown;
        if (breakdown) {
          const bRows: string[][] = [];
          if (breakdown.gross_refund)
            bRows.push([
              "Gross Refund",
              formatAmountPdf(breakdown.gross_refund.total),
            ]);
          if (Array.isArray(breakdown.deductions))
            breakdown.deductions.forEach((d: any) =>
              bRows.push([
                `Less: ${pdfVal(d.label)}`,
                `- ${formatAmountPdf(d.amount)}`,
              ]),
            );
          bRows.push([
            "Net Refund (reported)",
            formatAmountPdf(breakdown.net_refund),
          ]);
          const rec = reconciliation(note);
          if (rec.difference !== null && Math.abs(rec.difference) > 0.01) {
            bRows.push([
              "Calculated: gross less listed deductions",
              formatAmountPdf(rec.expected),
            ]);
            bRows.push([
              "Actual refund (recorded)",
              formatAmountPdf(rec.actual),
            ]);
            bRows.push([
              "Difference - review required",
              formatAmountPdf(rec.difference),
            ]);
          }
          sectionTitle("Refund Deduction Breakdown");
          drawTable({
            headers: ["Description", "Amount"],
            rows: bRows,
            widths: [CW - 50, 50],
            aligns: ["left", "right"],
            rowStyle: (i) =>
              i === bRows.length - 1
                ? { bold: true, fill: C.blueLight, color: C.blue }
                : undefined,
          });
        }
      }

      // 4. ITEMS TABLE
      sectionTitle("Credit Note Items");
      const items = note.items || [];
      if (items.length > 0) {
        drawTable({
          headers: ["S.No", "Product", "Qty", "Taxable", "GST %", "Total"],
          rows: items.map((item, i) => [
            String(i + 1),
            `${item.product_name || "Product"}\nCode: ${pdfVal(item.product_code)}`,
            String(item.quantity),
            formatAmountPdf(item.taxable_value),
            `${item.gst_rate}%`,
            formatAmountPdf(item.line_total),
          ]),
          widths: [12, 76, 14, 32, 16, 36],
          aligns: ["center", "left", "center", "right", "center", "right"],
        });
      } else {
        drawTable({
          rows: [["No line items available for this credit note."]],
          widths: [CW],
          aligns: ["center"],
          zebra: false,
        });
      }

      // 5. TAX SUMMARY + FINAL AMOUNT
      const TAX_W = 96;
      const taxRows: string[][] = [
        ["Taxable Value", formatAmountPdf(note.taxable_value)],
        ["CGST", formatAmountPdf(note.cgst_amount)],
        ["SGST", formatAmountPdf(note.sgst_amount)],
        ["IGST", formatAmountPdf(note.igst_amount)],
        ["Total GST", formatAmountPdf(note.total_gst)],
        ["Credit Note Amount", formatAmountPdf(note.amount)],
      ];
      ensureSpace(taxRows.length * 8 + 12);
      sectionTitle("Tax Summary");
      drawTable({
        rows: taxRows,
        widths: [TAX_W / 2, TAX_W / 2],
        aligns: ["left", "right"],
        x: pageW - ML - TAX_W,
        zebra: false,
        rowStyle: (i) => {
          if (i === taxRows.length - 1)
            return { bold: true, fill: C.blue, color: C.white };
          if (i === taxRows.length - 2)
            return { bold: true, fill: C.blueLight, color: C.blue };
          return undefined;
        },
      });

      // FOOTER ON EVERY PAGE
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        const fy = pageH - 10;
        doc.setDrawColor(...C.border);
        doc.setLineWidth(0.3);
        doc.line(ML, fy - 4, pageW - ML, fy - 4);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...C.muted);
        doc.text("This credit note is generated electronically.", ML, fy);
        doc.text(`Refund ID: ${note.refund_id ?? "-"}`, pageW / 2, fy, {
          align: "center",
        });
        doc.text(`Page ${p} of ${totalPages}`, pageW - ML, fy, {
          align: "right",
        });
      }

      doc.save(`${note.credit_note_number}.pdf`);
      toast.success("Credit note PDF downloaded successfully.");
    } catch (error) {
      console.error("Generate credit note PDF error:", error);
      toast.error(t("Unable to generate PDF."));
    }
  };

  const visiblePages = useMemo(() => {
    if (lastPage <= 5)
      return Array.from({ length: lastPage }, (_, index) => index + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, 5];
    if (currentPage >= lastPage - 2)
      return [lastPage - 4, lastPage - 3, lastPage - 2, lastPage - 1, lastPage];
    return [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
    ];
  }, [currentPage, lastPage]);

  if (pageLoading) return <PermissionLoadingState logoUrl={logoUrl} />;

  if (!canViewCreditNotes) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#F4F8FD] p-4 font-poppins">
        <div className="max-w-md rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#4F8FF7]">
            <FiAlertCircle size={26} />
          </div>
          <h2 className="text-lg font-bold text-[#111827]">
            {" "}
            {t("Access Denied")}{" "}
          </h2>
          <p className="mt-2 text-sm text-[#6B7280]">
            {t("You don't have permission to access this section.")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        lang={language}
        className="min-h-screen bg-white p-4 font-poppins sm:p-6"
      >
        <div className="mx-auto max-w-[1500px]">
          {/* PAGE HEADER */}
          <motion.div
            variants={itemVariants}
            className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-center"
          >
            <div className="flex min-w-0 items-center gap-4">
              <div className="min-w-0">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2D6FE8]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4F8FF7]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2D6FE8]">
                    {t("Finance & Returns")}
                  </span>
                </div>
                <h1 className="text-[22px] font-semibold tracking-tight text-[#111827] sm:text-[24px]">
                  {t("Credit Notes")}
                </h1>
                <p className="mt-0.5 text-sm text-[#111827]">
                  {t(
                    "Manage issued credit notes and download customer credit records.",
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start">
              <div
                className="inline-flex rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] p-1"
                role="group"
                aria-label="Report language / रिपोर्ट की भाषा"
              >
                {(["en", "hi"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={language === value}
                    onClick={() => setLanguage(value)}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold ${language === value ? "bg-white text-[#2D6FE8] shadow-sm" : "text-slate-600"}`}
                  >
                    {value === "en" ? "English" : "हिंदी"}
                  </button>
                ))}
              </div>
              {canDownloadCreditNotes && (
                <button
                  type="button"
                  onClick={() => void handleDownloadReport("xlsx")}
                  disabled={
                    loading ||
                    exportingCsv ||
                    exportingExcel ||
                    !matchingNotes.length
                  }
                  className="flex h-11 items-center gap-2 rounded-xl bg-[#16724E] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#10583D] disabled:opacity-50"
                >
                  <FiDownload
                    size={16}
                    className={exportingExcel ? "animate-pulse" : ""}
                  />
                  {t(exportingExcel ? "Preparing Excel..." : "Download Excel")}
                </button>
              )}
              {canDownloadCreditNotes && (
                <button
                  type="button"
                  onClick={() => void handleDownloadReport("csv")}
                  disabled={loading || exportingCsv || exportingExcel}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#DCE6F2] bg-white px-4 text-sm font-semibold text-[#2D6FE8] shadow-sm transition hover:border-[#2D6FE8] hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiDownload
                    size={16}
                    className={exportingCsv ? "animate-pulse" : ""}
                  />
                  {t(exportingCsv ? "Preparing CSV..." : "Download CSV")}
                </button>
              )}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading || exportingCsv || exportingExcel}
                className="flex h-11 items-center justify-center gap-2 self-start rounded-xl border border-[#DCE6F2] bg-white px-4 text-sm font-semibold text-[#2D6FE8] shadow-sm transition hover:border-[#2D6FE8] hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiRefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                <span className="hidden sm:inline"> {t("Refresh")} </span>
              </button>
            </div>
          </motion.div>

          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["Matching credit notes", totalRecords.toLocaleString("en-IN")],
              ["Credit note amount", formatAmount(totals.credit)],
              ["Total GST", formatAmount(totals.gst)],
              ["Completed refunds", formatAmount(totals.refunded)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="min-w-0 rounded-xl border border-[#DCE6F2] bg-white p-4"
              >
                <p className="text-xs text-slate-500">{t(label)}</p>
                <p className="mt-2 break-words text-lg font-bold tabular-nums text-[#173B63]">
                  {value}
                </p>
              </div>
            ))}
          </div>
          {totals.flagged > 0 && (
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {totals.flagged}{" "}
              {t("matching credit note(s) require refund reconciliation.")}{" "}
            </p>
          )}
          {/* MAIN CARD */}
          <motion.div
            variants={itemVariants}
            className="overflow-hidden rounded-[22px] border border-[#DCE6F2] bg-white shadow-sm"
          >
            {/* TOOLBAR */}
            <div className="flex flex-col gap-4 border-b border-[#DCE6F2] bg-white p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#111827]">
                  {t("Credit Note Directory")}
                </h2>
                <p className="mt-1 text-xs text-[#6B7280]">
                  {totalRecords.toLocaleString("en-IN")} {t("credit note")}
                  {language === "en" && totalRecords !== 1 ? "s" : ""}{" "}
                  {t("found")}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                {/* SEARCH */}
                <div className="relative w-full sm:w-[380px]">
                  <FiSearch
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D6FE8]"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t(
                      "Search credit note, order ref (ORD...), invoice, buyer...",
                    )}
                    className="h-11 w-full rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] pl-10 pr-10 text-sm text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/10"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] transition hover:text-[#2D6FE8]"
                    >
                      <FiX size={16} />
                    </button>
                  )}
                </div>
                {/* FILTER */}
                <div className="flex gap-2">
                  {[
                    { key: "all" as const, label: "All" },
                    { key: "return" as const, label: "Returns" },
                    { key: "other" as const, label: "Other" },
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => setReasonFilter(filter.key)}
                      className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${reasonFilter === filter.key ? "bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] text-white shadow-sm" : "border border-[#DCE6F2] bg-[#F4F8FD] text-[#6B7280] hover:border-[#2D6FE8]/40 hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"}`}
                    >
                      {t(filter.label)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-b border-[#DCE6F2] bg-[#F8FBFF] p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#173B63]">
                    {" "}
                    {t("Field filters")}{" "}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {" "}
                    {t(
                      "All conditions must match. Product conditions match the same item. Exports include complete matching credit notes.",
                    )}{" "}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setReasonFilter("all");
                      setRules([]);
                    }}
                    className="rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs font-semibold"
                  >
                    {" "}
                    {t("Clear all")}{" "}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const id = nextRuleId.current++;
                      setRules((old) => [
                        ...old,
                        { id, field: "gstType", op: "eq", value: "", end: "" },
                      ]);
                    }}
                    className="rounded-lg bg-[#2D6FE8] px-3 py-2 text-xs font-semibold text-white"
                  >
                    {" "}
                    {t("+ Add filter")}{" "}
                  </button>
                </div>
              </div>
              {rules.map((rule) => {
                const field = FIELD_DEFS.find((f) => f.key === rule.field)!;
                const ops =
                  field.key === "gstType"
                    ? [["eq", "Is exactly"]]
                    : field.kind === "text"
                      ? [
                          ["eq", "Is exactly"],
                          ["contains", "Contains"],
                          ["empty", "Is missing"],
                        ]
                      : [
                          ["eq", "Equals"],
                          ["gte", "At least / on or after"],
                          ["lte", "At most / on or before"],
                          ["between", "Between"],
                          ["empty", "Is missing"],
                        ];
                const inputClass =
                  "min-w-0 w-full rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-sm text-slate-800";
                return (
                  <div
                    key={rule.id}
                    className="mt-3 grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
                  >
                    <select
                      aria-label={t("Filter field")}
                      className={inputClass}
                      value={rule.field}
                      onChange={(e) =>
                        updateRule(rule.id, {
                          field: e.target.value,
                          op: "eq",
                          value: "",
                          end: "",
                        })
                      }
                    >
                      {FIELD_DEFS.map((f) => (
                        <option key={f.key} value={f.key}>
                          {t(f.label)}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label={t("Filter condition")}
                      className={inputClass}
                      value={rule.op}
                      onChange={(e) =>
                        updateRule(rule.id, { op: e.target.value, end: "" })
                      }
                    >
                      {ops.map(([value, label]) => (
                        <option key={value} value={value}>
                          {t(label)}
                        </option>
                      ))}
                    </select>
                    <div className="flex min-w-0 gap-2">
                      {rule.op !== "empty" &&
                        (rule.field === "gstType" && rule.op === "eq" ? (
                          <select
                            aria-label={t("GST registration")}
                            className={inputClass}
                            value={rule.value}
                            onChange={(e) =>
                              updateRule(rule.id, { value: e.target.value })
                            }
                          >
                            <option value=""> {t("Select GST type")} </option>
                            {["URP", "Registered"].map((v) => (
                              <option key={v} value={v}>
                                {t(v)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            aria-label={t("Filter value")}
                            className={inputClass}
                            type={
                              field.kind === "number"
                                ? "number"
                                : field.kind === "date"
                                  ? "date"
                                  : "text"
                            }
                            step={field.kind === "number" ? "any" : undefined}
                            placeholder={t("Value")}
                            value={rule.value}
                            onChange={(e) =>
                              updateRule(rule.id, { value: e.target.value })
                            }
                          />
                        ))}
                      {rule.op === "between" && (
                        <input
                          aria-label={t("Maximum filter value")}
                          className={inputClass}
                          type={field.kind === "date" ? "date" : "number"}
                          step="any"
                          value={rule.end}
                          onChange={(e) =>
                            updateRule(rule.id, { end: e.target.value })
                          }
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label={t("Remove filter")}
                      onClick={() =>
                        setRules((old) => old.filter((r) => r.id !== rule.id))
                      }
                      className="rounded-lg border border-[#DCE6F2] bg-white p-2 text-slate-500"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
            {/* TABLE */}
            <p className="px-4 py-2 text-[10px] font-medium text-[#6B7280] sm:hidden">
              {t("Swipe horizontally to view all table columns")}
            </p>
            <div className="block w-full overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[1080px] border-collapse">
                <thead>
                  <tr className="bg-[#4F8FF7]">
                    {[
                      ["S.No.", "left"],
                      ["Credit Note", "left"],
                      ["Order Ref", "left"],
                      ["Buyer", "left"],
                      ["Invoice", "left"],
                      ["Issued", "left"],
                      ["Reason", "left"],
                      ["Amount", "right"],
                      ["Actions", "center"],
                    ].map(([label, align]) => (
                      <th
                        key={label}
                        className={`px-5 py-4 ${align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"} text-[10px] font-bold uppercase tracking-[0.12em] text-white`}
                      >
                        {t(label)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {initialCreditNotesLoading ||
                  (loading && creditNotes.length === 0) ? (
                    <tr>
                      <td colSpan={9} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                            <FiRefreshCw size={22} className="animate-spin" />
                          </div>
                          <p className="mt-4 text-sm font-bold text-[#111827]">
                            {t("Loading credit notes...")}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredCreditNotes.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                            <FiFileText size={24} />
                          </div>
                          <p className="mt-4 text-sm font-bold text-[#111827]">
                            {t("No credit notes found")}
                          </p>
                          <p className="mt-1 text-xs text-[#6B7280]">
                            {t("Try changing your search or filter.")}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCreditNotes.map((note: any, index: number) => {
                      const accountType = getCreditNoteAccountType(note);
                      return (
                        <motion.tr
                          key={note.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.025 }}
                          className="border-b border-[#DCE6F2] bg-white transition hover:bg-[#F8FBFF]"
                        >
                          <td className="px-5 py-4">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F4F8FD] text-xs font-bold text-[#2D6FE8]">
                              {startEntry + index}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2D6FE8] text-white">
                                <FiFileText size={16} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-[#111827]">
                                  {note.credit_note_number}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <FiPackage size={13} className="text-[#2D6FE8]" />
                              <div className="min-w-0">
                                <p className="break-all text-xs font-semibold text-[#111827]">
                                  {note.order?.order_reference ||
                                    note.original_invoice_number ||
                                    "—"}
                                </p>
                                {note.order?.status && (
                                  <span
                                    className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold ${getOrderStatusClass(note.order.status)}`}
                                  >
                                    {t(capitalize(note.order.status))}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF3FF] text-[10px] font-bold text-[#2D6FE8]">
                                {getBuyerInitials(note.buyer_name)}
                              </div>
                              <div className="min-w-0">
                                <p className="max-w-[190px] truncate text-xs font-semibold text-[#111827]">
                                  {note.buyer_name}
                                </p>
                                <span
                                  className={`mt-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold ${getAccountTypeClass(accountType)}`}
                                >
                                  <FiBriefcase size={9} />
                                  {t(getAccountTypeLabel(accountType))}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-xs font-semibold text-[#6B7280]">
                              {note.original_invoice_number}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-500">
                              {formatDate(note.invoice_date)}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <FiCalendar
                                size={14}
                                className="text-[#2D6FE8]"
                              />
                              <div>
                                <p className="text-xs font-semibold text-[#6B7280]">
                                  {formatDate(note.issued_at)}
                                </p>
                                <p className="mt-1 text-[10px] text-[#6B7280]">
                                  {formatDateTime(note.issued_at)
                                    .split(", ")
                                    .pop()}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1.5 text-[9px] font-bold ${getReasonClass(note.reason)}`}
                            >
                              {t(capitalize(note.reason))}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <p className="text-sm font-bold text-[#2D6FE8]">
                              {formatAmount(note.amount)}
                            </p>
                            <p className="mt-1 text-[10px] text-[#6B7280]">
                              GST {formatAmount(note.total_gst)}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleView(note)}
                                title={t("View credit note")}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] text-[#2D6FE8] transition hover:border-[#2D6FE8] hover:bg-[#2D6FE8] hover:text-white"
                              >
                                <FiEye size={15} />
                              </button>
                              {canDownloadCreditNotes && (
                                <button
                                  type="button"
                                  onClick={() => generateCreditNotePdf(note)}
                                  title={t("Download PDF")}
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2D6FE8]/20 bg-[#EAF3FF] text-[#2D6FE8] transition hover:bg-[#2D6FE8] hover:text-white"
                                >
                                  <FiDownload size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            {!pageLoading && lastPage > 1 && (
              <div className="border-t border-[#DCE6F2] bg-[#F8FBFF] px-4 py-4 sm:px-5">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <p className="text-xs text-[#6B7280]">
                    {t("Showing")}{" "}
                    <span className="font-bold text-[#111827]">
                      {startEntry}
                    </span>{" "}
                    {t("to")}{" "}
                    <span className="font-bold text-[#111827]">
                      {Math.max(startEntry, endEntry)}
                    </span>{" "}
                    {t("of")}{" "}
                    <span className="font-bold text-[#111827]">
                      {totalRecords}
                    </span>{" "}
                    {t("entries")}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <FiChevronLeft size={17} />
                    </button>
                    {visiblePages.map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => goToPage(page)}
                        disabled={loading}
                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold transition ${currentPage === page ? "bg-[#2D6FE8] text-white shadow-md shadow-[#2D6FE8]/15" : "text-[#6B7280] hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"} disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === lastPage || loading}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <FiChevronRight size={17} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* VIEW MODAL */}
      <CreditNoteViewModal
        language={language}
        open={viewOpen}
        note={selectedNote}
        canDownload={canDownloadCreditNotes}
        onClose={() => {
          setViewOpen(false);
          setSelectedNote(null);
        }}
        onDownload={generateCreditNotePdf}
      />
    </>
  );
};

export default CreditNotes;
