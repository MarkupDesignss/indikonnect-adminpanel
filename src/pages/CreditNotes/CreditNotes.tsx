"use client";

import React, { useEffect, useMemo, useState } from "react";

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
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";
import jsPDF from "jspdf";

import GlobalModal from "@/components/common/GlobalModal";

import creditNotesApi, {
  CreditNote,
} from "../../api/endpoints/creditNotes";

// =====================================================
// THEME
// =====================================================

const PRIMARY = "#163F20";
const DARK_PRIMARY = "#0F3219";
const ACCENT = "#4C8A57";
const LIGHT_GREEN = "#EAF3EA";
const PAGE_BG = "#F5F7F5";
const TEXT_PRIMARY = "#202721";
const TEXT_SECONDARY = "#59645C";
const MUTED = "#9AA29C";
const BORDER = "#D8E2D8";
const WHITE = "#FFFFFF";
const DANGER = "#C23B32";

// =====================================================
// ANIMATIONS
// =====================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
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

// Used for on-screen UI.
const formatAmount = (
  value: string | number | null | undefined,
) => {
  const amount = Number(value ?? 0);

  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Used only inside the PDF.
// jsPDF built-in Helvetica does not support ₹ reliably.
const formatAmountPdf = (
  value: string | number | null | undefined,
) => {
  const amount = Number(value ?? 0);

  return `Rs.${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const capitalize = (value?: string | null) => {
  if (!value) {
    return "—";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getReasonClass = (reason?: string) => {
  switch (reason?.toLowerCase()) {
    case "return":
      return "border-[#4C8A57]/25 bg-[#EAF3EA] text-[#163F20]";

    case "cancel":
    case "cancellation":
      return "border-red-200 bg-red-50 text-[#C23B32]";

    default:
      return "border-[#D8E2D8] bg-[#F5F7F5] text-[#59645C]";
  }
};

const getBuyerInitials = (name?: string) => {
  if (!name || name === "Unknown") {
    return "CN";
  }

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[1][0]).toUpperCase();
};

// =====================================================
// VIEW MODAL
// =====================================================

interface CreditNoteViewModalProps {
  open: boolean;
  note: CreditNote | null;
  onClose: () => void;
  onDownload: (note: CreditNote) => void;
}

const CreditNoteViewModal: React.FC<CreditNoteViewModalProps> = ({
  open,
  note,
  onClose,
  onDownload,
}) => {
  if (!open || !note) {
    return null;
  }

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick
      title=""
    >
      <div className="w-full max-w-[760px] overflow-hidden rounded-[22px] border border-[#163F20]/10 bg-white shadow-2xl">
        {/* TOP ACCENT */}
        <div className="h-[3px] w-full bg-gradient-to-r from-[#4C8A57] via-[#163F20] to-[#0F3219]" />

        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-[#D8E2D8] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
              <FiFileText size={19} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#4C8A57]">
                Credit Note
              </p>

              <h2 className="mt-0.5 text-lg font-semibold text-[#202721]">
                {note.credit_note_number}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9AA29C] transition hover:bg-[#F5F7F5] hover:text-[#163F20]"
          >
            <FiX size={17} />
          </button>
        </div>

        {/* BODY */}
        <div className="max-h-[75vh] overflow-y-auto bg-[#F5F7F5] p-5 sm:p-6">
          {/* TOP SUMMARY */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#D8E2D8] bg-white p-4">
              <p className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                Invoice
              </p>

              <p className="mt-1 text-sm font-bold text-[#202721]">
                {note.original_invoice_number}
              </p>
            </div>

            <div className="rounded-xl border border-[#D8E2D8] bg-white p-4">
              <p className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                Reason
              </p>

              <span
                className={`mt-1.5 inline-flex rounded-full border px-2.5 py-1 text-[9px] font-bold ${getReasonClass(
                  note.reason,
                )}`}
              >
                {capitalize(note.reason)}
              </span>
            </div>

            <div className="rounded-xl border border-[#4C8A57]/20 bg-gradient-to-br from-[#EAF3EA] to-[#f4f8f4] p-4">
              <p className="text-[9px] font-bold uppercase tracking-wide text-[#4C8A57]">
                Credit Amount
              </p>

              <p className="mt-1 text-lg font-bold text-[#163F20]">
                {formatAmount(note.amount)}
              </p>
            </div>
          </div>

          {/* BUYER */}
          <div className="mt-4 rounded-xl border border-[#D8E2D8] bg-white p-4">
            <div className="mb-4 flex items-center gap-3 border-b border-[#D8E2D8] pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF3EA] text-xs font-bold text-[#163F20]">
                {getBuyerInitials(note.buyer_name)}
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#202721]">
                  Buyer Details
                </h3>

                <p className="text-[10px] text-[#9AA29C]">
                  Credit note customer information
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                  Name
                </p>

                <p className="mt-1 text-sm font-semibold text-[#202721]">
                  {note.buyer_name || "Unknown"}
                </p>
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                  Email
                </p>

                <p className="mt-1 break-all text-sm font-semibold text-[#202721]">
                  {note.buyer_email || "—"}
                </p>
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                  State
                </p>

                <p className="mt-1 text-sm font-semibold text-[#202721]">
                  {note.buyer_state || "—"}
                </p>
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                  GSTIN
                </p>

                <p className="mt-1 text-sm font-semibold text-[#202721]">
                  {note.buyer_gstin || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* ITEMS */}
          <div className="mt-4 overflow-hidden rounded-xl border border-[#D8E2D8] bg-white">
            <div className="border-b border-[#D8E2D8] px-4 py-3">
              <h3 className="text-sm font-bold text-[#202721]">
                Credit Note Items
              </h3>

              <p className="mt-0.5 text-[10px] text-[#9AA29C]">
                {note.items?.length || 0} item
                {note.items?.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse">
                <thead>
                  <tr className="bg-[#F5F7F5]">
                    <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-wide text-[#59645C]">
                      Product
                    </th>

                    <th className="px-4 py-3 text-center text-[9px] font-bold uppercase tracking-wide text-[#59645C]">
                      Qty
                    </th>

                    <th className="px-4 py-3 text-right text-[9px] font-bold uppercase tracking-wide text-[#59645C]">
                      Taxable
                    </th>

                    <th className="px-4 py-3 text-right text-[9px] font-bold uppercase tracking-wide text-[#59645C]">
                      GST
                    </th>

                    <th className="px-4 py-3 text-right text-[9px] font-bold uppercase tracking-wide text-[#59645C]">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {(note.items || []).map((item) => (
                    <tr
                      key={`${item.order_line_id}-${item.product_id}`}
                      className="border-t border-[#D8E2D8]"
                    >
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-[#202721]">
                          {item.product_name}
                        </p>

                        <p className="mt-0.5 font-mono text-[9px] text-[#9AA29C]">
                          Code: {item.product_code || "—"}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-center text-xs font-semibold text-[#59645C]">
                        {item.quantity}
                      </td>

                      <td className="px-4 py-3 text-right text-xs font-semibold text-[#59645C]">
                        {formatAmount(item.taxable_value)}
                      </td>

                      <td className="px-4 py-3 text-right text-xs font-semibold text-[#59645C]">
                        {item.gst_rate}%
                      </td>

                      <td className="px-4 py-3 text-right text-xs font-bold text-[#163F20]">
                        {formatAmount(item.line_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TAX + TOTAL */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#D8E2D8] bg-white p-4">
              <h3 className="mb-3 text-sm font-bold text-[#202721]">
                Tax Summary
              </h3>

              <div className="space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#59645C]">Taxable Value</span>

                  <span className="font-semibold text-[#202721]">
                    {formatAmount(note.taxable_value)}
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-[#59645C]">CGST</span>

                  <span className="font-semibold text-[#202721]">
                    {formatAmount(note.cgst_amount)}
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-[#59645C]">SGST</span>

                  <span className="font-semibold text-[#202721]">
                    {formatAmount(note.sgst_amount)}
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-[#59645C]">IGST</span>

                  <span className="font-semibold text-[#202721]">
                    {formatAmount(note.igst_amount)}
                  </span>
                </div>

                <div className="border-t border-[#D8E2D8] pt-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-[#202721]">
                      Total GST
                    </span>

                    <span className="font-bold text-[#163F20]">
                      {formatAmount(note.total_gst)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#4C8A57]/20 bg-gradient-to-br from-[#EAF3EA] to-[#f4f8f4] p-4">
              <p className="text-[9px] font-bold uppercase tracking-wide text-[#4C8A57]">
                Final Credit Amount
              </p>

              <p className="mt-2 text-[28px] font-bold tracking-tight text-[#163F20]">
                {formatAmount(note.amount)}
              </p>

              <div className="mt-4 border-t border-[#4C8A57]/15 pt-3">
                <div className="flex items-center gap-2">
                  <FiCalendar size={13} className="text-[#4C8A57]" />

                  <span className="text-[10px] font-semibold text-[#59645C]">
                    Issued {formatDate(note.issued_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 border-t border-[#D8E2D8] bg-white px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#D8E2D8] bg-white px-5 py-2.5 text-sm font-medium text-[#59645C] transition hover:bg-[#F5F7F5] hover:text-[#163F20]"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => onDownload(note)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4C8A57] to-[#163F20] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-[#3f7749] hover:to-[#0F3219]"
          >
            <FiDownload size={15} />
            Download PDF
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const CreditNotes: React.FC = () => {
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);

  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [reasonFilter, setReasonFilter] = useState<
    "all" | "return" | "other"
  >("all");

  const [currentPage, setCurrentPage] = useState(1);

  const [lastPage, setLastPage] = useState(1);

  const [totalRecords, setTotalRecords] = useState(0);

  const [selectedNote, setSelectedNote] = useState<CreditNote | null>(null);

  const [viewOpen, setViewOpen] = useState(false);

  const ITEMS_PER_PAGE = 20;

  // ===================================================
  // FETCH
  // ===================================================

  const fetchCreditNotes = async (page = currentPage) => {
    try {
      setLoading(true);

      const response = await creditNotesApi.getAll(page);

      if (response.data.success) {
        const pagination = response.data.data;

        setCreditNotes(pagination?.data || []);

        setCurrentPage(pagination?.current_page || page);

        setLastPage(pagination?.last_page || 1);

        setTotalRecords(pagination?.total || 0);
      } else {
        toast.error(
          response.data.message || "Unable to fetch credit notes.",
        );
      }
    } catch (error: any) {
      console.error("Fetch credit notes error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Unable to fetch credit notes.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // INITIAL FETCH
  // ===================================================

  useEffect(() => {
    fetchCreditNotes(1);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===================================================
  // FILTER
  // ===================================================

  const filteredCreditNotes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return creditNotes.filter((note) => {
      const matchesSearch =
        !query ||
        [
          note.credit_note_number,
          note.original_invoice_number,
          note.buyer_name,
          note.buyer_email,
          String(note.id),
          String(note.order_id),
          note.reason,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      let matchesReason = true;

      if (reasonFilter === "return") {
        matchesReason = note.reason?.toLowerCase() === "return";
      }

      if (reasonFilter === "other") {
        matchesReason = note.reason?.toLowerCase() !== "return";
      }

      return matchesSearch && matchesReason;
    });
  }, [creditNotes, search, reasonFilter]);

  // ===================================================
  // DISPLAY PAGINATION
  // ===================================================

  const startEntry =
    totalRecords === 0
      ? 0
      : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const endEntry = Math.min(
    startEntry + filteredCreditNotes.length - 1,
    totalRecords,
  );

  // ===================================================
  // PAGE CHANGE
  // ===================================================

  const goToPage = (page: number) => {
    if (page < 1 || page > lastPage || page === currentPage) {
      return;
    }

    fetchCreditNotes(page);
  };

  // ===================================================
  // VIEW
  // ===================================================

  const handleView = (note: CreditNote) => {
    setSelectedNote(note);
    setViewOpen(true);
  };

  // ===================================================
  // PDF
  // ===================================================

  const generateCreditNotePdf = (note: CreditNote) => {
    try {
      const doc = new jsPDF({
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();

      let y = 18;

      // =================================================
      // HEADER
      // =================================================

      doc.setFillColor(15, 50, 25);

      doc.rect(0, 0, pageWidth, 31, "F");

      doc.setTextColor(255, 255, 255);

      doc.setFontSize(20);

      doc.setFont("helvetica", "bold");

      doc.text("CREDIT NOTE", 15, 14);

      doc.setFontSize(9);

      doc.setFont("helvetica", "normal");

      doc.text("IndieKonnect", 15, 22);

      doc.setFontSize(9);

      doc.text(note.credit_note_number, pageWidth - 15, 13, {
        align: "right",
      });

      doc.text(
        `Issued: ${formatDate(note.issued_at)}`,
        pageWidth - 15,
        20,
        {
          align: "right",
        },
      );

      y = 41;

      // =================================================
      // BUYER / DOCUMENT
      // =================================================

      doc.setTextColor(32, 39, 33);

      doc.setFontSize(11);

      doc.setFont("helvetica", "bold");

      doc.text("Buyer Details", 15, y);

      doc.text("Document Details", 112, y);

      y += 7;

      doc.setFontSize(9);

      doc.setFont("helvetica", "normal");

      doc.text(`Name: ${note.buyer_name || "Unknown"}`, 15, y);

      doc.text(
        `Credit Note: ${note.credit_note_number}`,
        112,
        y,
      );

      y += 5;

      doc.text(`Email: ${note.buyer_email || "—"}`, 15, y);

      doc.text(
        `Original Invoice: ${note.original_invoice_number}`,
        112,
        y,
      );

      y += 5;

      doc.text(`State: ${note.buyer_state || "—"}`, 15, y);

      doc.text(`Order ID: ${note.order_id}`, 112, y);

      y += 5;

      doc.text(`GSTIN: ${note.buyer_gstin || "—"}`, 15, y);

      doc.text(`Reason: ${capitalize(note.reason)}`, 112, y);

      // =================================================
      // DIVIDER
      // =================================================

      y += 10;

      doc.setDrawColor(216, 226, 216);

      doc.line(15, y, pageWidth - 15, y);

      y += 9;

      // =================================================
      // ITEMS TITLE
      // =================================================

      doc.setFontSize(11);

      doc.setFont("helvetica", "bold");

      doc.text("Credit Note Items", 15, y);

      y += 7;

      // =================================================
      // TABLE HEADER
      // =================================================

      doc.setFillColor(234, 243, 234);

      doc.rect(15, y - 5, pageWidth - 30, 8, "F");

      doc.setFontSize(8);

      doc.setFont("helvetica", "bold");

      doc.setTextColor(22, 63, 32);

      doc.text("Product", 17, y);

      doc.text("Qty", 104, y, { align: "center" });

      doc.text("Taxable", 145, y, { align: "right" });

      doc.text("GST", 170, y, { align: "right" });

      doc.text("Total", pageWidth - 17, y, { align: "right" });

      y += 7;

      doc.setFont("helvetica", "normal");

      // =================================================
      // ITEMS
      // =================================================

      (note.items || []).forEach((item) => {
        const productName = item.product_name || "Product";

        const wrapped = doc.splitTextToSize(productName, 75);

        const rowHeight = Math.max(7, wrapped.length * 4);

        // Add new page if needed
        if (y + rowHeight > 275) {
          doc.addPage();

          y = 18;

          doc.setFontSize(11);

          doc.setFont("helvetica", "bold");

          doc.setTextColor(32, 39, 33);

          doc.text("Credit Note Items - Continued", 15, y);

          y += 9;
        }

        doc.setDrawColor(230, 235, 230);

        doc.line(15, y + rowHeight - 2, pageWidth - 15, y + rowHeight - 2);

        doc.setFontSize(8);

        doc.setFont("helvetica", "normal");

        doc.setTextColor(55, 65, 57);

        doc.text(wrapped, 17, y);

        doc.text(String(item.quantity), 104, y, { align: "center" });

        doc.text(
          formatAmountPdf(item.taxable_value),
          145,
          y,
          { align: "right" },
        );

        doc.text(`${item.gst_rate}%`, 170, y, { align: "right" });

        doc.text(
          formatAmountPdf(item.line_total),
          pageWidth - 17,
          y,
          { align: "right" },
        );

        y += rowHeight;
      });

      // =================================================
      // TOTALS
      // =================================================

      y += 7;

      if (y > 245) {
        doc.addPage();
        y = 20;
      }

      doc.setDrawColor(76, 138, 87);

      doc.line(110, y, pageWidth - 15, y);

      y += 7;

      const totals: Array<[string, string]> = [
        ["Taxable Value", formatAmountPdf(note.taxable_value)],
        ["CGST", formatAmountPdf(note.cgst_amount)],
        ["SGST", formatAmountPdf(note.sgst_amount)],
        ["IGST", formatAmountPdf(note.igst_amount)],
        ["Total GST", formatAmountPdf(note.total_gst)],
      ];

      doc.setFontSize(9);

      totals.forEach(([label, value]) => {
        doc.setFont("helvetica", "normal");

        doc.setTextColor(89, 100, 92);

        doc.text(label, 112, y);

        doc.setFont("helvetica", "bold");

        doc.setTextColor(32, 39, 33);

        doc.text(value, pageWidth - 17, y, { align: "right" });

        y += 6;
      });

      y += 3;

      // =================================================
      // FINAL AMOUNT
      // =================================================

      doc.setFillColor(234, 243, 234);

      doc.roundedRect(107, y, pageWidth - 122, 18, 3, 3, "F");

      doc.setTextColor(22, 63, 32);

      doc.setFont("helvetica", "bold");

      doc.setFontSize(9);

      doc.text("CREDIT NOTE AMOUNT", 112, y + 7);

      doc.setFontSize(15);

      doc.text(
        formatAmountPdf(note.amount),
        pageWidth - 17,
        y + 12,
        { align: "right" },
      );

      // =================================================
      // FOOTER
      // =================================================

      const footerY = 286;

      doc.setDrawColor(220, 228, 220);

      doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);

      doc.setFontSize(7.5);

      doc.setFont("helvetica", "normal");

      doc.setTextColor(120, 130, 122);

      doc.text(
        "This credit note is generated electronically.",
        15,
        footerY,
      );

      doc.text(
        `Refund ID: ${note.refund_id ?? "—"}`,
        pageWidth - 15,
        footerY,
        { align: "right" },
      );

      // =================================================
      // DOWNLOAD
      // =================================================

      doc.save(`${note.credit_note_number}.pdf`);

      toast.success("Credit note PDF downloaded successfully.");
    } catch (error) {
      console.error("Generate credit note PDF error:", error);

      toast.error("Unable to generate PDF.");
    }
  };

  // ===================================================
  // PAGE NUMBERS
  // ===================================================

  const visiblePages = useMemo(() => {
    if (lastPage <= 5) {
      return Array.from({ length: lastPage }, (_, index) => index + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5];
    }

    if (currentPage >= lastPage - 2) {
      return [
        lastPage - 4,
        lastPage - 3,
        lastPage - 2,
        lastPage - 1,
        lastPage,
      ];
    }

    return [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
    ];
  }, [currentPage, lastPage]);

  // ===================================================
  // INITIAL LOADING
  // ===================================================

  if (loading && creditNotes.length === 0) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: PAGE_BG }}
      >
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#D8E2D8] border-t-[#163F20]" />

          <p className="mt-3 text-sm text-[#59645C]">
            Loading credit notes...
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="min-h-screen px-4 py-5 sm:px-6 lg:px-8"
        style={{ backgroundColor: PAGE_BG }}
      >
        <div className="mx-auto max-w-[1500px]">
          {/* PAGE HEADER */}
          <motion.div
            variants={itemVariants}
            className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-center"
          >
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4C8A57]" />

                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#163F20]">
                  Finance & Returns
                </span>
              </div>

              <h1 className="text-[29px] font-semibold tracking-tight text-[#202721] sm:text-[32px]">
                Credit Notes
              </h1>

              <p className="mt-1.5 text-sm text-[#59645C]">
                Manage issued credit notes and download customer credit
                records.
              </p>
            </div>

            <button
              type="button"
              onClick={() => fetchCreditNotes(currentPage)}
              disabled={loading}
              className="flex h-11 items-center justify-center gap-2 self-start rounded-xl border border-[#D8E2D8] bg-white px-4 text-sm font-semibold text-[#163F20] shadow-sm transition hover:border-[#4C8A57] hover:bg-[#EAF3EA] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiRefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />

              <span className="hidden sm:inline">Refresh</span>
            </button>
          </motion.div>

          {/* MAIN CARD */}
          <motion.div
            variants={itemVariants}
            className="overflow-hidden rounded-[22px] border border-[#D8E2D8] bg-white shadow-sm"
          >
            {/* TOP ACCENT */}
            <div className="h-[3px] w-full bg-gradient-to-r from-[#4C8A57] via-[#163F20] to-[#4C8A57]" />

            {/* TOOLBAR */}
            <div className="flex flex-col gap-4 border-b border-[#D8E2D8] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#202721]">
                  Credit Note Directory
                </h2>

                <p className="mt-1 text-xs text-[#9AA29C]">
                  {totalRecords.toLocaleString("en-IN")} credit note
                  {totalRecords === 1 ? "" : "s"} found
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {/* SEARCH */}
                <div className="relative w-full sm:w-[330px]">
                  <FiSearch
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4C8A57]"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search credit note, invoice or buyer..."
                    className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] pl-10 pr-10 text-sm text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#4C8A57] focus:bg-white focus:ring-2 focus:ring-[#4C8A57]/10"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA29C] transition hover:text-[#163F20]"
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
                      className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                        reasonFilter === filter.key
                          ? "bg-gradient-to-r from-[#4C8A57] to-[#163F20] text-white shadow-sm"
                          : "border border-[#D8E2D8] bg-[#F5F7F5] text-[#59645C] hover:border-[#4C8A57]/40 hover:bg-[#EAF3EA] hover:text-[#163F20]"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* TABLE INFO */}
            <div className="flex flex-col justify-between gap-3 border-b border-[#D8E2D8] px-4 pb-4 pt-5 sm:flex-row sm:items-center sm:px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                  <FiFileText size={18} />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#202721]">
                    Issued Credit Notes
                  </h3>

                  <p className="mt-0.5 text-[11px] text-[#9AA29C]">
                    Customer refund and return credit records
                  </p>
                </div>
              </div>

              <span className="rounded-lg bg-[#EAF3EA] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[#163F20]">
                {reasonFilter === "all"
                  ? "All Credit Notes"
                  : reasonFilter === "return"
                    ? "Return Credit Notes"
                    : "Other Credit Notes"}
              </span>
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1120px] border-collapse">
                <thead>
                  <tr className="bg-[#0F3219]">
                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                      S.No.
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                      Credit Note
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                      Buyer
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                      Invoice
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                      Issued
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                      Reason
                    </th>

                    <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                      Amount
                    </th>

                    <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#163F20]">
                            <FiRefreshCw
                              size={22}
                              className="animate-spin"
                            />
                          </div>

                          <p className="mt-4 text-sm font-bold text-[#202721]">
                            Loading credit notes...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredCreditNotes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#4C8A57]">
                            <FiFileText size={24} />
                          </div>

                          <p className="mt-4 text-sm font-bold text-[#202721]">
                            No credit notes found
                          </p>

                          <p className="mt-1 text-xs text-[#9AA29C]">
                            Try changing your search or filter.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCreditNotes.map((note, index) => (
                      <motion.tr
                        key={note.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.025 }}
                        className="border-b border-[#D8E2D8] bg-white transition hover:bg-[#FAFBFA]"
                      >
                        {/* S.NO */}
                        <td className="px-5 py-4">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F7F5] text-xs font-bold text-[#163F20]">
                            {startEntry + index}
                          </span>
                        </td>

                        {/* CREDIT NOTE */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] text-white">
                              <FiFileText size={16} />
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[#202721]">
                                {note.credit_note_number}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* BUYER */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF3EA] text-[10px] font-bold text-[#163F20]">
                              {getBuyerInitials(note.buyer_name)}
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[190px] truncate text-xs font-semibold text-[#202721]">
                                {note.buyer_name}
                              </p>

                              <p className="mt-1 max-w-[190px] truncate text-[10px] text-[#9AA29C]">
                                {note.buyer_email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* INVOICE */}
                        <td className="px-5 py-4">
                          <p className="text-xs font-semibold text-[#59645C]">
                            {note.original_invoice_number}
                          </p>

                          <p className="mt-1 text-[10px] text-[#9AA29C]">
                            Order #{note.order_id}
                          </p>
                        </td>

                        {/* DATE */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <FiCalendar
                              size={14}
                              className="text-[#4C8A57]"
                            />

                            <div>
                              <p className="text-xs font-semibold text-[#59645C]">
                                {formatDate(note.issued_at)}
                              </p>

                              <p className="mt-1 text-[10px] text-[#9AA29C]">
                                {formatDateTime(note.issued_at)
                                  .split(", ")
                                  .pop()}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* REASON */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1.5 text-[9px] font-bold ${getReasonClass(
                              note.reason,
                            )}`}
                          >
                            {capitalize(note.reason)}
                          </span>
                        </td>

                        {/* AMOUNT */}
                        <td className="px-5 py-4 text-right">
                          <p className="text-sm font-bold text-[#163F20]">
                            {formatAmount(note.amount)}
                          </p>

                          <p className="mt-1 text-[10px] text-[#9AA29C]">
                            GST {formatAmount(note.total_gst)}
                          </p>
                        </td>

                        {/* ACTIONS */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleView(note)}
                              title="View credit note"
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] text-[#163F20] transition hover:border-[#163F20] hover:bg-[#163F20] hover:text-white"
                            >
                              <FiEye size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => generateCreditNotePdf(note)}
                              title="Download PDF"
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#4C8A57]/20 bg-[#EAF3EA] text-[#163F20] transition hover:bg-[#4C8A57] hover:text-white"
                            >
                              <FiDownload size={15} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE */}
            <div className="block lg:hidden">
              {filteredCreditNotes.length > 0 ? (
                filteredCreditNotes.map((note, index) => (
                  <motion.div
                    key={note.id}
                    variants={itemVariants}
                    className="border-b border-[#D8E2D8] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] text-white">
                          <FiFileText size={17} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#202721]">
                            {note.credit_note_number}
                          </p>

                          <p className="mt-1 truncate text-[10px] text-[#9AA29C]">
                            {note.original_invoice_number}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-[#9AA29C]">
                        #{startEntry + index}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                          Buyer
                        </p>

                        <p className="mt-1 truncate text-xs font-semibold text-[#202721]">
                          {note.buyer_name}
                        </p>

                        <p className="mt-0.5 truncate text-[10px] text-[#9AA29C]">
                          {note.buyer_email}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#4C8A57]/20 bg-[#EAF3EA] p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-[#4C8A57]">
                          Amount
                        </p>

                        <p className="mt-1 text-sm font-bold text-[#163F20]">
                          {formatAmount(note.amount)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                          Issued
                        </p>

                        <p className="mt-1 text-xs font-semibold text-[#202721]">
                          {formatDate(note.issued_at)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                          Reason
                        </p>

                        <span
                          className={`mt-1.5 inline-flex rounded-full border px-2.5 py-1 text-[9px] font-bold ${getReasonClass(
                            note.reason,
                          )}`}
                        >
                          {capitalize(note.reason)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleView(note)}
                        className="flex h-9 items-center gap-2 rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] px-3 text-xs font-bold text-[#163F20]"
                      >
                        <FiEye size={14} />
                        View
                      </button>

                      <button
                        type="button"
                        onClick={() => generateCreditNotePdf(note)}
                        className="flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-[#4C8A57] to-[#163F20] px-3 text-xs font-bold text-white"
                      >
                        <FiDownload size={14} />
                        PDF
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center px-5 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#4C8A57]">
                    <FiFileText size={24} />
                  </div>

                  <p className="mt-4 text-sm font-bold text-[#202721]">
                    No credit notes found
                  </p>

                  <p className="mt-1 text-xs text-[#9AA29C]">
                    Try another search or filter.
                  </p>
                </div>
              )}
            </div>

            {/* PAGINATION */}
            {lastPage > 1 && (
              <div className="border-t border-[#D8E2D8] bg-[#FAFBFA] px-4 py-4 sm:px-5">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <p className="text-xs text-[#59645C]">
                    Showing{" "}
                    <span className="font-bold text-[#202721]">
                      {startEntry}
                    </span>{" "}
                    to{" "}
                    <span className="font-bold text-[#202721]">
                      {Math.max(startEntry, endEntry)}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-[#202721]">
                      {totalRecords}
                    </span>{" "}
                    entries
                  </p>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8E2D8] bg-white text-[#163F20] transition hover:bg-[#EAF3EA] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <FiChevronLeft size={17} />
                    </button>

                    {visiblePages.map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => goToPage(page)}
                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold transition ${
                          currentPage === page
                            ? "bg-gradient-to-br from-[#4C8A57] to-[#163F20] text-white shadow-md shadow-[#163F20]/15"
                            : "text-[#59645C] hover:bg-[#EAF3EA] hover:text-[#163F20]"
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === lastPage}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8E2D8] bg-white text-[#163F20] transition hover:bg-[#EAF3EA] disabled:cursor-not-allowed disabled:opacity-30"
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
        open={viewOpen}
        note={selectedNote}
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