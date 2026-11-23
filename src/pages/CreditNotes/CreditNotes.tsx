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
import GlobalModal from "@/components/common/GlobalModal";
import creditNotesApi, {
  CreditNote,
} from "../../api/endpoints/creditNotes";
import { usePermissions } from "../../pages/permissions/usePermissions";
import logoApi from "../../api/endpoints/logoApi";
import PermissionLoadingState from "@/components/common/PermissionLoadingState";

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
  const amount = Number(value ?? 0);
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// jsPDF default fonts do not support the ₹ symbol, so "Rs." is used in PDF
const formatAmountPdf = (value: string | number | null | undefined) => {
  const amount = Number(value ?? 0);
  return `Rs. ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const capitalize = (value?: string | null) => {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
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
  return accountType.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
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
    note?.buyer_name,
    note?.buyer_email,
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

  const matchesSearch = !query || searchable.includes(query);
  const reason = String(note?.reason ?? "").toLowerCase();
  const matchesReason =
    reasonFilter === "all" ||
    (reasonFilter === "return" && reason === "return") ||
    (reasonFilter === "other" && reason !== "return");
  return matchesSearch && matchesReason;
};

const csvCell = (value: unknown): string => {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
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
}

const CreditNoteViewModal: React.FC<CreditNoteViewModalProps> = ({
  open,
  note,
  onClose,
  onDownload,
  canDownload = false,
}) => {
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
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#4F8FF7]">Credit Note</p>
              <h2 className="mt-0.5 text-lg font-semibold text-[#111827]">{note.credit_note_number}</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[#F4F8FD] hover:text-[#2D6FE8]">
            <FiX size={17} />
          </button>
        </div>

        {/* BODY */}
        <div className="max-h-[75vh] overflow-y-auto bg-[#F4F8FD] p-5 sm:p-6">
          {/* TOP SUMMARY */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#DCE6F2] bg-white p-4">
              <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Order Reference</p>
              <p className="mt-1 break-all text-sm font-bold text-[#111827]">{order?.order_reference || (note as any).original_invoice_number || "—"}</p>
            </div>
            <div className="rounded-xl border border-[#DCE6F2] bg-white p-4">
              <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Reason</p>
              <span className={`mt-1.5 inline-flex rounded-full border px-2.5 py-1 text-[9px] font-bold ${getReasonClass(note.reason)}`}>{capitalize(note.reason)}</span>
            </div>
            <div className="rounded-xl border border-[#2D6FE8]/20 bg-[#EAF3FF] p-4">
              <p className="text-[9px] font-bold uppercase tracking-wide text-[#4F8FF7]">Credit Amount</p>
              <p className="mt-1 text-lg font-bold text-[#2D6FE8]">{formatAmount(note.amount)}</p>
            </div>
          </div>

          {/* BUYER */}
          <div className="mt-4 rounded-xl border border-[#DCE6F2] bg-white p-4">
            <div className="mb-4 flex items-center gap-3 border-b border-[#DCE6F2] pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF3FF] text-xs font-bold text-[#2D6FE8]">{getBuyerInitials(note.buyer_name)}</div>
              <div>
                <h3 className="text-sm font-bold text-[#111827]">Buyer Details</h3>
                <span className={`mt-0.5 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-bold ${getAccountTypeClass(accountType)}`}>
                  <FiBriefcase size={9} /> {getAccountTypeLabel(accountType)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Name</p><p className="mt-1 text-sm font-semibold text-[#111827]">{note.buyer_name || "Unknown"}</p></div>
              <div><p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Email</p><p className="mt-1 break-all text-sm font-semibold text-[#111827]">{note.buyer_email || "—"}</p></div>
              <div><p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">State</p><p className="mt-1 text-sm font-semibold text-[#111827]">{note.buyer_state || "—"}</p></div>
              <div><p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">GSTIN</p><p className="mt-1 text-sm font-semibold text-[#111827]">{note.buyer_gstin || "—"}</p></div>
              {note.buyer_address && <div className="sm:col-span-2"><p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Address</p><p className="mt-1 text-sm font-semibold text-[#111827]">{note.buyer_address}</p></div>}
            </div>
          </div>

          {/* ORDER DETAILS */}
          {order && (
            <div className="mt-4 rounded-xl border border-[#DCE6F2] bg-white p-4">
              <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-[#DCE6F2] pb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF3FF] text-[#2D6FE8]"><FiPackage size={16} /></div>
                <h3 className="text-sm font-bold text-[#111827]">Order Details</h3>
                <span className={`ml-auto inline-flex rounded-full border px-2.5 py-1 text-[9px] font-bold ${getOrderStatusClass(order.status)}`}>{capitalize(order.status)}</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div><p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Order Ref</p><p className="mt-1 break-all text-xs font-semibold text-[#111827]">{order.order_reference || "—"}</p></div>
                <div><p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Order Type</p><p className="mt-1 text-xs font-semibold text-[#111827]">{getAccountTypeLabel(order.order_type)}</p></div>
                <div><p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Payment Gateway</p><p className="mt-1 text-xs font-semibold text-[#111827]">{capitalize(order.payment_gateway)}</p></div>
                <div><p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Subtotal</p><p className="mt-1 text-xs font-semibold text-[#111827]">{formatAmount(order.subtotal)}</p></div>
                <div><p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Shipping</p><p className="mt-1 text-xs font-semibold text-[#111827]">{formatAmount(order.shipping_charge)}</p></div>
                <div><p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Total Payable</p><p className="mt-1 text-xs font-bold text-[#2D6FE8]">{formatAmount(order.total_payable)}</p></div>
                <div><p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Amount Paid</p><p className="mt-1 text-xs font-semibold text-[#111827]">{formatAmount(order.amount_paid)}</p></div>
                <div><p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Delivery Status</p><p className="mt-1 text-xs font-semibold text-[#111827]">{capitalize(order.delivery_status)}</p></div>
                <div><p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Return Status</p><p className="mt-1 text-xs font-semibold text-[#111827]">{capitalize(order.return_status)}</p></div>
                <div><p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Confirmed At</p><p className="mt-1 text-xs font-semibold text-[#111827]">{formatDateTime(order.confirmed_at)}</p></div>
                <div><p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Created At</p><p className="mt-1 text-xs font-semibold text-[#111827]">{formatDateTime(order.created_at)}</p></div>
                <div><p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Gateway Txn ID</p><p className="mt-1 break-all font-mono text-[10px] text-[#6B7280]">{order.gateway_transaction_id || "—"}</p></div>
              </div>
            </div>
          )}

          {/* REFUND DETAILS */}
          {refund && (
            <div className="mt-4 rounded-xl border border-[#DCE6F2] bg-white p-4">
              <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-[#DCE6F2] pb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF3FF] text-[#2D6FE8]"><FiCreditCard size={16} /></div>
                <h3 className="text-sm font-bold text-[#111827]">Refund Details</h3>
                <span className={`ml-auto inline-flex rounded-full border px-2.5 py-1 text-[9px] font-bold ${getOrderStatusClass(refund.status)}`}>{capitalize(refund.status)}</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Refund Amount</p><p className="mt-1 text-sm font-bold text-[#2D6FE8]">{formatAmount(refund.amount)}</p></div>
                <div><p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Refund Method</p><p className="mt-1 text-xs font-semibold text-[#111827]">{capitalize(refund.refund_method)}</p></div>
                <div><p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Gateway Reference</p><p className="mt-1 break-all font-mono text-[10px] text-[#6B7280]">{refund.gateway_reference || "—"}</p></div>
                <div><p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Completed At</p><p className="mt-1 text-xs font-semibold text-[#111827]">{formatDateTime(refund.completed_at)}</p></div>
              </div>
              {refund.deduction_breakdown && (
                <div className="mt-4 rounded-lg border border-[#DCE6F2] bg-[#F8FBFF] p-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[#2D6FE8]">Deduction Breakdown</p>
                  <div className="space-y-2">
                    {refund.deduction_breakdown.gross_refund && <div className="flex justify-between text-xs"><span className="text-[#6B7280]">Gross Refund</span><span className="font-semibold text-[#111827]">{formatAmount(refund.deduction_breakdown.gross_refund.total)}</span></div>}
                    {Array.isArray(refund.deduction_breakdown.deductions) && refund.deduction_breakdown.deductions.map((d: any, i: number) => <div key={i} className="flex justify-between text-xs"><span className="text-[#6B7280]">{d.label}</span><span className="font-semibold text-[#4F8FF7]">- {formatAmount(d.amount)}</span></div>)}
                    <div className="border-t border-[#DCE6F2] pt-2"><div className="flex justify-between text-xs"><span className="font-bold text-[#111827]">Net Refund</span><span className="font-bold text-[#2D6FE8]">{formatAmount(refund.deduction_breakdown.net_refund)}</span></div></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ITEMS */}
          <div className="mt-4 overflow-hidden rounded-xl border border-[#DCE6F2] bg-white">
            <div className="border-b border-[#DCE6F2] px-4 py-3"><h3 className="text-sm font-bold text-[#111827]">Credit Note Items</h3><p className="mt-0.5 text-[10px] text-[#6B7280]">{note.items?.length || 0} item{note.items?.length === 1 ? "" : "s"}</p></div>
            <div className="overflow-x-auto">
              {note.items && note.items.length > 0 ? (
                <table className="w-full min-w-[620px] border-collapse">
                  <thead><tr className="bg-[#F4F8FD]"><th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Product</th><th className="px-4 py-3 text-center text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Qty</th><th className="px-4 py-3 text-right text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Taxable</th><th className="px-4 py-3 text-right text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">GST</th><th className="px-4 py-3 text-right text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Total</th></tr></thead>
                  <tbody>{note.items.map((item) => <tr key={`${item.order_line_id}-${item.product_id}`} className="border-t border-[#DCE6F2]"><td className="px-4 py-3"><p className="text-xs font-semibold text-[#111827]">{item.product_name}</p><p className="mt-0.5 font-mono text-[9px] text-[#6B7280]">Code: {item.product_code || "—"}</p></td><td className="px-4 py-3 text-center text-xs font-semibold text-[#6B7280]">{item.quantity}</td><td className="px-4 py-3 text-right text-xs font-semibold text-[#6B7280]">{formatAmount(item.taxable_value)}</td><td className="px-4 py-3 text-right text-xs font-semibold text-[#6B7280]">{item.gst_rate}%</td><td className="px-4 py-3 text-right text-xs font-bold text-[#2D6FE8]">{formatAmount(item.line_total)}</td></tr>)}</tbody>
                </table>
              ) : (
                <div className="px-4 py-8 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]"><FiFileText size={20} /></div><p className="mt-3 text-xs font-semibold text-[#111827]">No line items available</p><p className="mt-1 text-[10px] text-[#6B7280]">This credit note has no item breakdown.</p></div>
              )}
            </div>
          </div>

          {/* TAX + TOTAL */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#DCE6F2] bg-white p-4">
              <h3 className="mb-3 text-sm font-bold text-[#111827]">Tax Summary</h3>
              <div className="space-y-2.5">
                <div className="flex justify-between text-xs"><span className="text-[#6B7280]">Taxable Value</span><span className="font-semibold text-[#111827]">{formatAmount(note.taxable_value)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-[#6B7280]">CGST</span><span className="font-semibold text-[#111827]">{formatAmount(note.cgst_amount)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-[#6B7280]">SGST</span><span className="font-semibold text-[#111827]">{formatAmount(note.sgst_amount)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-[#6B7280]">IGST</span><span className="font-semibold text-[#111827]">{formatAmount(note.igst_amount)}</span></div>
                <div className="border-t border-[#DCE6F2] pt-2.5"><div className="flex justify-between text-xs"><span className="font-bold text-[#111827]">Total GST</span><span className="font-bold text-[#2D6FE8]">{formatAmount(note.total_gst)}</span></div></div>
              </div>
            </div>
            <div className="rounded-xl border border-[#2D6FE8]/20 bg-[#EAF3FF] p-4">
              <p className="text-[9px] font-bold uppercase tracking-wide text-[#4F8FF7]">Final Credit Amount</p>
              <p className="mt-2 text-[28px] font-bold tracking-tight text-[#2D6FE8]">{formatAmount(note.amount)}</p>
              <div className="mt-4 border-t border-[#2D6FE8]/15 pt-3">
                <div className="flex items-center gap-2"><FiCalendar size={13} className="text-[#4F8FF7]" /><span className="text-[10px] font-semibold text-[#6B7280]">Issued {formatDate(note.issued_at)}</span></div>
                {refund && <div className="mt-2 flex items-center gap-2"><FiTag size={13} className="text-[#4F8FF7]" /><span className="text-[10px] font-semibold text-[#6B7280]">Refund ID: {refund.id}</span></div>}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 border-t border-[#DCE6F2] bg-white px-5 py-4 sm:px-6">
          <button type="button" onClick={onClose} className="rounded-xl border border-[#DCE6F2] bg-white px-5 py-2.5 text-sm font-medium text-[#6B7280] transition hover:bg-[#F4F8FD] hover:text-[#2D6FE8]">Close</button>
          {canDownload && <button type="button" onClick={() => onDownload(note)} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-[#2D6FE8] hover:to-[#2D6FE8]"><FiDownload size={15} /> Download PDF</button>}
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================
const CreditNotes: React.FC = () => {
  const { hasPermission, isSuperAdmin, loading: permissionsLoading } = usePermissions();

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
  const [initialCreditNotesLoading, setInitialCreditNotesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [search, setSearch] = useState("");
  const [reasonFilter, setReasonFilter] = useState<CreditNoteReasonFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
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
          (value): value is string => typeof value === "string" && /^https?:\/\//i.test(value.trim()),
        );
        if (!cancelled && resolvedLogo) setLogoUrl(resolvedLogo.trim());
      } catch (error) {
        console.error("Logo API error:", error);
      } finally {
        if (!cancelled) setLogoLoading(false);
      }
    };
    void fetchLogo();
    return () => { cancelled = true; };
  }, []);

  // FETCH
  const fetchCreditNotes = async (
    page = currentPage,
    force = false,
    isInitialLoad = false,
  ) => {
    if (fetchInFlightRef.current) return fetchInFlightRef.current;
    if (!force && page === 1 && hasInitialFetchRef.current) return;

    const requestPromise = (async () => {
      try {
        setLoading(true);
        const response = await creditNotesApi.getAll(page);
        if (response.data.success) {
          const pagination = response.data.data;
          setCreditNotes(pagination?.data || []);
          setCurrentPage(pagination?.current_page || page);
          setLastPage(pagination?.last_page || 1);
          setTotalRecords(pagination?.total || 0);
          if (page === 1) hasInitialFetchRef.current = true;
        } else {
          toast.error(response.data.message || "Unable to fetch credit notes.");
        }
      } catch (error: any) {
        console.error("Fetch credit notes error:", error);
        toast.error(error?.response?.data?.message || "Unable to fetch credit notes.");
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

  const pageLoading = permissionsLoading || logoLoading || initialCreditNotesLoading;

  // FILTER — includes order + refund fields
  const filteredCreditNotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return creditNotes.filter((note: any) => matchesCreditNoteFilters(note, query, reasonFilter));
  }, [creditNotes, search, reasonFilter]);

  const startEntry = totalRecords === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endEntry = totalRecords === 0 ? 0 : Math.min(startEntry + filteredCreditNotes.length - 1, totalRecords);

  const goToPage = (page: number) => {
    if (page < 1 || page > lastPage || page === currentPage || loading) return;
    fetchCreditNotes(page, true);
  };

  const handleRefresh = async () => {
    if (!canViewCreditNotes || loading) return;
    await fetchCreditNotes(currentPage, true);
    toast.success("Credit notes refreshed.");
  };

  // CSV EXPORT — downloads every API page, then applies the active search and reason filters.
  const handleDownloadCsv = async () => {
    if (!canDownloadCreditNotes || exportingCsv) return;

    const query = search.trim().toLowerCase();
    const activeReasonFilter = reasonFilter;

    try {
      setExportingCsv(true);
      const firstResponse = await creditNotesApi.getAll(1);
      if (!firstResponse.data.success) {
        throw new Error(firstResponse.data.message || "Unable to fetch credit notes for CSV.");
      }

      const firstPagination: any = firstResponse.data.data;
      const allNotes: any[] = Array.isArray(firstPagination?.data) ? [...firstPagination.data] : [];
      const totalPages = Math.max(1, Number(firstPagination?.last_page) || 1);

      for (let page = 2; page <= totalPages; page += 1) {
        const pageResponse = await creditNotesApi.getAll(page);
        if (!pageResponse.data.success) {
          throw new Error(pageResponse.data.message || `Unable to fetch credit notes page ${page}.`);
        }
        const pageData: any = pageResponse.data.data;
        if (Array.isArray(pageData?.data)) allNotes.push(...pageData.data);
      }

      const exportNotes = allNotes.filter((note) => matchesCreditNoteFilters(note, query, activeReasonFilter));
      if (exportNotes.length === 0) {
        toast.error("No credit notes match the selected search and filters.");
        return;
      }

      const headers = [
        "S.No.", "Credit Note Number", "Original Invoice Number",  "Order Reference",
        "Buyer Name", "Buyer Type", "Buyer Email", "Buyer State", "Buyer GSTIN", "Buyer Address",
        "Issued At", "Reason", "Order Type", "Order Status", "Delivery Status", "Return Status",
        "Payment Gateway", "Gateway Transaction ID", "Subtotal", "Shipping Charge", "Total Payable",
        "Amount Paid", "Taxable Value", "CGST Amount", "SGST Amount", "IGST Amount", "Total GST",
        "Credit Note Amount", "Refund ID", "Refund Amount", "Refund Method", "Refund Status",
        "Gateway Reference", "Refund Completed At", "Item Count", "Items",
      ];

      const rows = exportNotes.map((note: any, index: number) => {
        const order = note?.order ?? {};
        const refund = note?.refund ?? {};
        const items = Array.isArray(note?.items) ? note.items : [];
        const itemSummary = items.map((item: any) => {
          const name = item?.product_name || "Product";
          const code = item?.product_code ? ` [${item.product_code}]` : "";
          const quantity = item?.quantity != null ? ` x ${item.quantity}` : "";
          return `${name}${code}${quantity}`;
        }).join("; ");

        return [
          index + 1, note?.credit_note_number, note?.original_invoice_number, note?.order_id,
          order?.order_reference, note?.buyer_name, getCreditNoteAccountType(note), note?.buyer_email,
          note?.buyer_state, note?.buyer_gstin, note?.buyer_address, note?.issued_at, note?.reason,
          order?.order_type, order?.status, order?.delivery_status, order?.return_status,
          order?.payment_gateway, order?.gateway_transaction_id, order?.subtotal, order?.shipping_charge,
          order?.total_payable, order?.amount_paid, note?.taxable_value, note?.cgst_amount,
          note?.sgst_amount, note?.igst_amount, note?.total_gst, note?.amount,
          refund?.id ?? note?.refund_id, refund?.amount, refund?.refund_method, refund?.status,
          refund?.gateway_reference, refund?.completed_at, items.length, itemSummary,
        ];
      });

      const csvContent = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
      const blob = new Blob(["\uFEFF", csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStamp = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `credit-notes-${activeReasonFilter}-${dateStamp}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded ${exportNotes.length} credit note(s) as CSV.`);
    } catch (error: any) {
      console.error("Download credit notes CSV error:", error);
      toast.error(error?.response?.data?.message || error?.message || "Unable to download credit notes CSV.");
    } finally {
      setExportingCsv(false);
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
      doc.text(pdfVal(note.credit_note_number), pageW - ML, 14, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Issued: ${formatDate(note.issued_at)}`, pageW - ML, 21, { align: "right" });
      doc.text(`Reason: ${capitalize(note.reason)}`, pageW - ML, 27, { align: "right" });
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
            if (pending) { rows.push([pending]); pending = null; }
            rows.push([cell]);
          } else if (!pending) pending = cell;
          else { rows.push([pending, cell]); pending = null; }
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
          const rowH = Math.max(8, ...measured.map((m) => m.lines.length * 4 + 4));
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
            const tx = aligns[i] === "right" ? cx + widths[i] - PAD : aligns[i] === "center" ? cx + widths[i] / 2 : cx + PAD;
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
          const wrapped = row.map((cell, i) => String(cell).split("\n").flatMap((part) => doc.splitTextToSize(part, widths[i] - PAD * 2)));
          const rowH = Math.max(8, ...wrapped.map((lines) => lines.length * 4 + 4));
          if (y + rowH > BOTTOM) { doc.addPage(); y = 16; drawHeader(); }
          let cx = startX;
          row.forEach((_, i) => {
            const fill = style?.fill || (zebra && rIdx % 2 === 1 ? C.zebra : C.white);
            doc.setFillColor(...fill);
            doc.setDrawColor(...C.border);
            doc.setLineWidth(0.2);
            doc.rect(cx, y, widths[i], rowH, "FD");
            const lines = wrapped[i];
            lines.forEach((line: string, lIdx: number) => {
              const isSub = !style?.bold && i === 1 && lIdx > 0 && !!headers;
              doc.setFont("helvetica", style?.bold && !isSub ? "bold" : "normal");
              doc.setFontSize(isSub ? 7.5 : 8.5);
              if (isSub) doc.setTextColor(...C.muted);
              else doc.setTextColor(...(style?.color || C.text));
              const tx = aligns[i] === "right" ? cx + widths[i] - PAD : aligns[i] === "center" ? cx + widths[i] / 2 : cx + PAD;
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
        { label: "Credit Note No.", value: note.credit_note_number, bold: true },
        { label: "Issued Date", value: formatDate(note.issued_at) },
        { label: "Orig. Invoice", value: note.original_invoice_number },
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
        ...(note.buyer_address ? [{ label: "Address", value: note.buyer_address, full: true } as KVCell] : []),
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
          { label: "Total Payable", value: formatAmountPdf(order.total_payable), bold: true, color: C.blue },
          { label: "Amount Paid", value: formatAmountPdf(order.amount_paid) },
          { label: "Delivery", value: capitalize(order.delivery_status) },
          { label: "Return Status", value: capitalize(order.return_status) },
          { label: "Confirmed At", value: formatDateTime(order.confirmed_at) },
          { label: "Created At", value: formatDateTime(order.created_at) },
          { label: "Gateway Txn ID", value: order.gateway_transaction_id, full: true },
        ]);
      }

      // 3. REFUND DETAILS
      if (refund) {
        sectionTitle("Refund Details");
        drawKVTable([
          { label: "Refund ID", value: refund.id ?? note.refund_id },
          { label: "Status", value: capitalize(refund.status) },
          { label: "Refund Amount", value: formatAmountPdf(refund.amount), bold: true, color: C.blue },
          { label: "Method", value: capitalize(refund.refund_method) },
          { label: "Completed At", value: formatDateTime(refund.completed_at) },
          { label: "Gateway Ref", value: refund.gateway_reference },
        ]);
        const breakdown = refund.deduction_breakdown;
        if (breakdown) {
          const bRows: string[][] = [];
          if (breakdown.gross_refund) bRows.push(["Gross Refund", formatAmountPdf(breakdown.gross_refund.total)]);
          if (Array.isArray(breakdown.deductions)) breakdown.deductions.forEach((d: any) => bRows.push([`Less: ${pdfVal(d.label)}`, `- ${formatAmountPdf(d.amount)}`]));
          bRows.push(["Net Refund", formatAmountPdf(breakdown.net_refund)]);
          sectionTitle("Refund Deduction Breakdown");
          drawTable({ headers: ["Description", "Amount"], rows: bRows, widths: [CW - 50, 50], aligns: ["left", "right"], rowStyle: (i) => i === bRows.length - 1 ? { bold: true, fill: C.blueLight, color: C.blue } : undefined });
        }
      }

      // 4. ITEMS TABLE
      sectionTitle("Credit Note Items");
      const items = note.items || [];
      if (items.length > 0) {
        drawTable({
          headers: ["S.No", "Product", "Qty", "Taxable", "GST %", "Total"],
          rows: items.map((item, i) => [String(i + 1), `${item.product_name || "Product"}\nCode: ${pdfVal(item.product_code)}`, String(item.quantity), formatAmountPdf(item.taxable_value), `${item.gst_rate}%`, formatAmountPdf(item.line_total)]),
          widths: [12, 76, 14, 32, 16, 36],
          aligns: ["center", "left", "center", "right", "center", "right"],
        });
      } else {
        drawTable({ rows: [["No line items available for this credit note."]], widths: [CW], aligns: ["center"], zebra: false });
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
          if (i === taxRows.length - 1) return { bold: true, fill: C.blue, color: C.white };
          if (i === taxRows.length - 2) return { bold: true, fill: C.blueLight, color: C.blue };
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
        doc.text(`Refund ID: ${note.refund_id ?? "-"}`, pageW / 2, fy, { align: "center" });
        doc.text(`Page ${p} of ${totalPages}`, pageW - ML, fy, { align: "right" });
      }

      doc.save(`${note.credit_note_number}.pdf`);
      toast.success("Credit note PDF downloaded successfully.");
    } catch (error) {
      console.error("Generate credit note PDF error:", error);
      toast.error("Unable to generate PDF.");
    }
  };

  const visiblePages = useMemo(() => {
    if (lastPage <= 5) return Array.from({ length: lastPage }, (_, index) => index + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, 5];
    if (currentPage >= lastPage - 2) return [lastPage - 4, lastPage - 3, lastPage - 2, lastPage - 1, lastPage];
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
  }, [currentPage, lastPage]);

  if (pageLoading) return <PermissionLoadingState logoUrl={logoUrl} />;

  if (!canViewCreditNotes) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#F4F8FD] p-4 font-poppins">
        <div className="max-w-md rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#4F8FF7]"><FiAlertCircle size={26} /></div>
          <h2 className="text-lg font-bold text-[#111827]">Access Denied</h2>
          <p className="mt-2 text-sm text-[#6B7280]">You don't have permission to access this section.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="min-h-screen bg-white p-4 font-poppins sm:p-6">
        <div className="mx-auto max-w-[1500px]">
          {/* PAGE HEADER */}
          <motion.div variants={itemVariants} className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div className="flex min-w-0 items-center gap-4">
              <div className="min-w-0">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2D6FE8]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4F8FF7]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2D6FE8]">Finance & Returns</span>
                </div>
                <h1 className="text-[22px] font-semibold tracking-tight text-[#111827] sm:text-[24px]">Credit Notes</h1>
                <p className="mt-0.5 text-sm text-[#111827]">Manage issued credit notes and download customer credit records.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start">
              {canDownloadCreditNotes && (
                <button type="button" onClick={handleDownloadCsv} disabled={loading || exportingCsv} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#DCE6F2] bg-white px-4 text-sm font-semibold text-[#2D6FE8] shadow-sm transition hover:border-[#2D6FE8] hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-50">
                  <FiDownload size={16} className={exportingCsv ? "animate-pulse" : ""} />
                  {exportingCsv ? "Preparing CSV..." : "Download CSV"}
                </button>
              )}
              <button type="button" onClick={handleRefresh} disabled={loading || exportingCsv} className="flex h-11 items-center justify-center gap-2 self-start rounded-xl border border-[#DCE6F2] bg-white px-4 text-sm font-semibold text-[#2D6FE8] shadow-sm transition hover:border-[#2D6FE8] hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-50">
                <FiRefreshCw size={16} className={loading ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </motion.div>

          {/* MAIN CARD */}
          <motion.div variants={itemVariants} className="overflow-hidden rounded-[22px] border border-[#DCE6F2] bg-white shadow-sm">
            {/* TOOLBAR */}
            <div className="flex flex-col gap-4 border-b border-[#DCE6F2] bg-white p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#111827]">Credit Note Directory</h2>
                <p className="mt-1 text-xs text-[#6B7280]">{totalRecords.toLocaleString("en-IN")} credit note{totalRecords === 1 ? "" : "s"} found</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                {/* SEARCH */}
                <div className="relative w-full sm:w-[380px]">
                  <FiSearch size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D6FE8]" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search credit note, order ref (ORD...), invoice, buyer..." className="h-11 w-full rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] pl-10 pr-10 text-sm text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/10" />
                  {search && <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] transition hover:text-[#2D6FE8]"><FiX size={16} /></button>}
                </div>
                {/* FILTER */}
                <div className="flex gap-2">
                  {[
                    { key: "all" as const, label: "All" },
                    { key: "return" as const, label: "Returns" },
                    { key: "other" as const, label: "Other" },
                  ].map((filter) => (
                    <button key={filter.key} type="button" onClick={() => setReasonFilter(filter.key)} className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${reasonFilter === filter.key ? "bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] text-white shadow-sm" : "border border-[#DCE6F2] bg-[#F4F8FD] text-[#6B7280] hover:border-[#2D6FE8]/40 hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"}`}>
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* TABLE */}
            <p className="px-4 py-2 text-[10px] font-medium text-[#6B7280] sm:hidden">Swipe horizontally to view all table columns</p>
            <div className="block w-full overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[1080px] border-collapse">
                <thead>
                  <tr className="bg-[#4F8FF7]">
                    {[["S.No.", "left"], ["Credit Note", "left"], ["Order Ref", "left"], ["Buyer", "left"], ["Invoice", "left"], ["Issued", "left"], ["Reason", "left"], ["Amount", "right"], ["Actions", "center"]].map(([label, align]) => (
                      <th key={label} className={`px-5 py-4 ${align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"} text-[10px] font-bold uppercase tracking-[0.12em] text-white`}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {initialCreditNotesLoading || (loading && creditNotes.length === 0) ? (
                    <tr><td colSpan={9} className="px-5 py-16 text-center"><div className="flex flex-col items-center"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]"><FiRefreshCw size={22} className="animate-spin" /></div><p className="mt-4 text-sm font-bold text-[#111827]">Loading credit notes...</p></div></td></tr>
                  ) : filteredCreditNotes.length === 0 ? (
                    <tr><td colSpan={9} className="px-5 py-16 text-center"><div className="flex flex-col items-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]"><FiFileText size={24} /></div><p className="mt-4 text-sm font-bold text-[#111827]">No credit notes found</p><p className="mt-1 text-xs text-[#6B7280]">Try changing your search or filter.</p></div></td></tr>
                  ) : (
                    filteredCreditNotes.map((note: any, index: number) => {
                      const accountType = getCreditNoteAccountType(note);
                      return (
                        <motion.tr key={note.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.025 }} className="border-b border-[#DCE6F2] bg-white transition hover:bg-[#F8FBFF]">
                          <td className="px-5 py-4"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F4F8FD] text-xs font-bold text-[#2D6FE8]">{startEntry + index}</span></td>
                          <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2D6FE8] text-white"><FiFileText size={16} /></div><div className="min-w-0"><p className="text-sm font-bold text-[#111827]">{note.credit_note_number}</p></div></div></td>
                          <td className="px-5 py-4"><div className="flex items-center gap-2"><FiPackage size={13} className="text-[#2D6FE8]" /><div className="min-w-0"><p className="break-all text-xs font-semibold text-[#111827]">{note.order?.order_reference || note.original_invoice_number || "—"}</p>{note.order?.status && <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold ${getOrderStatusClass(note.order.status)}`}>{capitalize(note.order.status)}</span>}</div></div></td>
                          <td className="px-5 py-4"><div className="flex items-center gap-2.5"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF3FF] text-[10px] font-bold text-[#2D6FE8]">{getBuyerInitials(note.buyer_name)}</div><div className="min-w-0"><p className="max-w-[190px] truncate text-xs font-semibold text-[#111827]">{note.buyer_name}</p><span className={`mt-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold ${getAccountTypeClass(accountType)}`}><FiBriefcase size={9} />{getAccountTypeLabel(accountType)}</span></div></div></td>
                          <td className="px-5 py-4"><p className="text-xs font-semibold text-[#6B7280]">{note.original_invoice_number}</p></td>
                          <td className="px-5 py-4"><div className="flex items-center gap-2"><FiCalendar size={14} className="text-[#2D6FE8]" /><div><p className="text-xs font-semibold text-[#6B7280]">{formatDate(note.issued_at)}</p><p className="mt-1 text-[10px] text-[#6B7280]">{formatDateTime(note.issued_at).split(", ").pop()}</p></div></div></td>
                          <td className="px-5 py-4"><span className={`inline-flex rounded-full border px-3 py-1.5 text-[9px] font-bold ${getReasonClass(note.reason)}`}>{capitalize(note.reason)}</span></td>
                          <td className="px-5 py-4 text-right"><p className="text-sm font-bold text-[#2D6FE8]">{formatAmount(note.amount)}</p><p className="mt-1 text-[10px] text-[#6B7280]">GST {formatAmount(note.total_gst)}</p></td>
                          <td className="px-5 py-4"><div className="flex items-center justify-center gap-2"><button type="button" onClick={() => handleView(note)} title="View credit note" className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] text-[#2D6FE8] transition hover:border-[#2D6FE8] hover:bg-[#2D6FE8] hover:text-white"><FiEye size={15} /></button>{canDownloadCreditNotes && <button type="button" onClick={() => generateCreditNotePdf(note)} title="Download PDF" className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2D6FE8]/20 bg-[#EAF3FF] text-[#2D6FE8] transition hover:bg-[#2D6FE8] hover:text-white"><FiDownload size={15} /></button>}</div></td>
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
                  <p className="text-xs text-[#6B7280]">Showing <span className="font-bold text-[#111827]">{startEntry}</span> to <span className="font-bold text-[#111827]">{Math.max(startEntry, endEntry)}</span> of <span className="font-bold text-[#111827]">{totalRecords}</span> entries</p>
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1 || loading} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-30"><FiChevronLeft size={17} /></button>
                    {visiblePages.map((page) => <button key={page} type="button" onClick={() => goToPage(page)} disabled={loading} className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold transition ${currentPage === page ? "bg-[#2D6FE8] text-white shadow-md shadow-[#2D6FE8]/15" : "text-[#6B7280] hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"} disabled:cursor-not-allowed disabled:opacity-50`}>{page}</button>)}
                    <button type="button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === lastPage || loading} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-30"><FiChevronRight size={17} /></button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* VIEW MODAL */}
      <CreditNoteViewModal open={viewOpen} note={selectedNote} canDownload={canDownloadCreditNotes} onClose={() => { setViewOpen(false); setSelectedNote(null); }} onDownload={generateCreditNotePdf} />
    </>
  );
};

export default CreditNotes;
