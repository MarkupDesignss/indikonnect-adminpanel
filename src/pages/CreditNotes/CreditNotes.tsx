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
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";
import jsPDF from "jspdf";

import GlobalModal from "@/components/common/GlobalModal";

import creditNotesApi, {
  CreditNote,
} from "../../api/endpoints/creditNotes";

import { usePermissions } from "../../pages/permissions/usePermissions";

// =====================================================
// ANIMATIONS
// =====================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 16,
    },
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

// Used inside PDF because built-in Helvetica
// does not reliably support ₹ symbol.
const formatAmountPdf = (value: string | number | null | undefined) => {
  const amount = Number(value ?? 0);

  return `Rs.${amount.toLocaleString("en-IN", {
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

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// ✅ NAVY THEME
const getReasonClass = (reason?: string) => {
  switch (reason?.toLowerCase()) {
    case "return":
      return "border-[#1E3A8A]/25 bg-[#EAF1FF] text-[#1E3A8A]";

    case "cancel":
    case "cancellation":
      return "border-[#C23B32]/25 bg-[#FBEAEA] text-[#C23B32]";

    default:
      return "border-[#D8E2F0] bg-[#F5F8FF] text-[#4A5778]";
  }
};

const getBuyerInitials = (name?: string) => {
  if (!name || name === "Unknown") return "CN";

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[1][0]).toUpperCase();
};

// =====================================================
// ACCOUNT TYPE HELPERS — NAVY THEME
// =====================================================

const getAccountTypeLabel = (accountType?: string | null) => {
  if (!accountType) return "Customer";

  return accountType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// ✅ NAVY THEME
const getAccountTypeClass = (accountType?: string | null) => {
  switch (accountType) {
    case "distributor":
      return "border-[#1E3A8A]/25 bg-[#EAF1FF] text-[#1E3A8A]";

    case "retailer":
      return "border-[#2563EB]/25 bg-[#DBEAFE] text-[#1E40AF]";

    case "wholesaler":
      return "border-[#1E40AF]/25 bg-[#EAF1FF] text-[#1E40AF]";

    case "customer":
      return "border-[#D8E2F0] bg-[#F5F8FF] text-[#4A5778]";

    default:
      return "border-[#D8E2F0] bg-[#F5F8FF] text-[#4A5778]";
  }
};

/**
 * Resolve account type for a credit note row.
 *
 * Priority:
 * 1. note.buyer_type
 * 2. note.order.order_type
 * 3. customer
 */
const getCreditNoteAccountType = (note: any): string => {
  if (!note) return "customer";

  return note.buyer_type || note.order?.order_type || "customer";
};

// =====================================================
// VIEW MODAL — NAVY THEME
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
  if (!open || !note) {
    return null;
  }

  const accountType = getCreditNoteAccountType(note);

  return (
    <GlobalModal isOpen={open} onClose={onClose} closeOnOverlayClick title="">
      <div className="w-full max-w-[760px] overflow-hidden rounded-[22px] border border-[#1E3A8A]/10 bg-white font-poppins shadow-2xl">
        {/* TOP ACCENT — NAVY */}
        <div className="h-[3px] w-full bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1E3A8A]" />

        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-[#D8E2F0] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
              <FiFileText size={19} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#2563EB]">
                Credit Note
              </p>

              <h2 className="mt-0.5 text-lg font-semibold text-[#0F1B3D]">
                {note.credit_note_number}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8C97B2] transition hover:bg-[#F5F8FF] hover:text-[#1E3A8A]"
          >
            <FiX size={17} />
          </button>
        </div>

        {/* BODY */}
        <div className="max-h-[75vh] overflow-y-auto bg-[#F5F8FF] p-5 sm:p-6">
          {/* TOP SUMMARY */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#D8E2F0] bg-white p-4">
              <p className="text-[9px] font-bold uppercase tracking-wide text-[#8C97B2]">
                Invoice
              </p>

              <p className="mt-1 text-sm font-bold text-[#0F1B3D]">
                {note.original_invoice_number}
              </p>
            </div>

            <div className="rounded-xl border border-[#D8E2F0] bg-white p-4">
              <p className="text-[9px] font-bold uppercase tracking-wide text-[#8C97B2]">
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

            <div className="rounded-xl border border-[#1E3A8A]/20 bg-gradient-to-br from-[#EAF1FF] to-[#f4f8ff] p-4">
              <p className="text-[9px] font-bold uppercase tracking-wide text-[#2563EB]">
                Credit Amount
              </p>

              <p className="mt-1 text-lg font-bold text-[#1E3A8A]">
                {formatAmount(note.amount)}
              </p>
            </div>
          </div>

          {/* BUYER */}
          <div className="mt-4 rounded-xl border border-[#D8E2F0] bg-white p-4">
            <div className="mb-4 flex items-center gap-3 border-b border-[#D8E2F0] pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF1FF] text-xs font-bold text-[#1E3A8A]">
                {getBuyerInitials(note.buyer_name)}
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#0F1B3D]">
                  Buyer Details
                </h3>

                <span
                  className={`mt-0.5 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-bold ${getAccountTypeClass(
                    accountType,
                  )}`}
                >
                  <FiBriefcase size={9} />

                  {getAccountTypeLabel(accountType)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#8C97B2]">
                  Name
                </p>

                <p className="mt-1 text-sm font-semibold text-[#0F1B3D]">
                  {note.buyer_name || "Unknown"}
                </p>
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#8C97B2]">
                  Email
                </p>

                <p className="mt-1 break-all text-sm font-semibold text-[#0F1B3D]">
                  {note.buyer_email || "—"}
                </p>
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#8C97B2]">
                  State
                </p>

                <p className="mt-1 text-sm font-semibold text-[#0F1B3D]">
                  {note.buyer_state || "—"}
                </p>
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#8C97B2]">
                  GSTIN
                </p>

                <p className="mt-1 text-sm font-semibold text-[#0F1B3D]">
                  {note.buyer_gstin || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* ITEMS */}
          <div className="mt-4 overflow-hidden rounded-xl border border-[#D8E2F0] bg-white">
            <div className="border-b border-[#D8E2F0] px-4 py-3">
              <h3 className="text-sm font-bold text-[#0F1B3D]">
                Credit Note Items
              </h3>

              <p className="mt-0.5 text-[10px] text-[#8C97B2]">
                {note.items?.length || 0} item
                {note.items?.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse">
                <thead>
                  <tr className="bg-[#F5F8FF]">
                    <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-wide text-[#4A5778]">
                      Product
                    </th>

                    <th className="px-4 py-3 text-center text-[9px] font-bold uppercase tracking-wide text-[#4A5778]">
                      Qty
                    </th>

                    <th className="px-4 py-3 text-right text-[9px] font-bold uppercase tracking-wide text-[#4A5778]">
                      Taxable
                    </th>

                    <th className="px-4 py-3 text-right text-[9px] font-bold uppercase tracking-wide text-[#4A5778]">
                      GST
                    </th>

                    <th className="px-4 py-3 text-right text-[9px] font-bold uppercase tracking-wide text-[#4A5778]">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {(note.items || []).map((item) => (
                    <tr
                      key={`${item.order_line_id}-${item.product_id}`}
                      className="border-t border-[#D8E2F0]"
                    >
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-[#0F1B3D]">
                          {item.product_name}
                        </p>

                        <p className="mt-0.5 font-mono text-[9px] text-[#8C97B2]">
                          Code: {item.product_code || "—"}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-center text-xs font-semibold text-[#4A5778]">
                        {item.quantity}
                      </td>

                      <td className="px-4 py-3 text-right text-xs font-semibold text-[#4A5778]">
                        {formatAmount(item.taxable_value)}
                      </td>

                      <td className="px-4 py-3 text-right text-xs font-semibold text-[#4A5778]">
                        {item.gst_rate}%
                      </td>

                      <td className="px-4 py-3 text-right text-xs font-bold text-[#1E3A8A]">
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
            <div className="rounded-xl border border-[#D8E2F0] bg-white p-4">
              <h3 className="mb-3 text-sm font-bold text-[#0F1B3D]">
                Tax Summary
              </h3>

              <div className="space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#4A5778]">Taxable Value</span>

                  <span className="font-semibold text-[#0F1B3D]">
                    {formatAmount(note.taxable_value)}
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-[#4A5778]">CGST</span>

                  <span className="font-semibold text-[#0F1B3D]">
                    {formatAmount(note.cgst_amount)}
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-[#4A5778]">SGST</span>

                  <span className="font-semibold text-[#0F1B3D]">
                    {formatAmount(note.sgst_amount)}
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-[#4A5778]">IGST</span>

                  <span className="font-semibold text-[#0F1B3D]">
                    {formatAmount(note.igst_amount)}
                  </span>
                </div>

                <div className="border-t border-[#D8E2F0] pt-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-[#0F1B3D]">
                      Total GST
                    </span>

                    <span className="font-bold text-[#1E3A8A]">
                      {formatAmount(note.total_gst)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#1E3A8A]/20 bg-gradient-to-br from-[#EAF1FF] to-[#f4f8ff] p-4">
              <p className="text-[9px] font-bold uppercase tracking-wide text-[#2563EB]">
                Final Credit Amount
              </p>

              <p className="mt-2 text-[28px] font-bold tracking-tight text-[#1E3A8A]">
                {formatAmount(note.amount)}
              </p>

              <div className="mt-4 border-t border-[#1E3A8A]/15 pt-3">
                <div className="flex items-center gap-2">
                  <FiCalendar size={13} className="text-[#2563EB]" />

                  <span className="text-[10px] font-semibold text-[#4A5778]">
                    Issued {formatDate(note.issued_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 border-t border-[#D8E2F0] bg-white px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#D8E2F0] bg-white px-5 py-2.5 text-sm font-medium text-[#4A5778] transition hover:bg-[#F5F8FF] hover:text-[#1E3A8A]"
          >
            Close
          </button>

          {canDownload && (
            <button
              type="button"
              onClick={() => onDownload(note)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1E40AF] to-[#1E3A8A] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-[#1E3A8A] hover:to-[#172554]"
            >
              <FiDownload size={15} />
              Download PDF
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
  // ===================================================
  // PERMISSIONS
  // ===================================================

  const {
    hasPermission,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  // Exact backend permission:
  // "Credit Notes": ["view", "download"]

  const canViewCreditNotes = useMemo(
    () => isSuperAdmin || hasPermission("Credit Notes.view"),
    [isSuperAdmin, hasPermission],
  );

  const canDownloadCreditNotes = useMemo(
    () => isSuperAdmin || hasPermission("Credit Notes.download"),
    [isSuperAdmin, hasPermission],
  );

  // ===================================================
  // STATE
  // ===================================================

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
  // DUPLICATE API PROTECTION
  // ===================================================

  const fetchInFlightRef = useRef<Promise<void> | null>(null);
  const hasInitialFetchRef = useRef(false);

  // ===================================================
  // FETCH
  // ===================================================

  const fetchCreditNotes = async (page = currentPage, force = false) => {
    if (fetchInFlightRef.current) {
      return fetchInFlightRef.current;
    }

    if (!force && page === 1 && hasInitialFetchRef.current) {
      return;
    }

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

          if (page === 1) {
            hasInitialFetchRef.current = true;
          }
        } else {
          toast.error(
            response.data.message || "Unable to fetch credit notes.",
          );
        }
      } catch (error: any) {
        console.error("Fetch credit notes error:", error);

        toast.error(
          error?.response?.data?.message || "Unable to fetch credit notes.",
        );
      } finally {
        setLoading(false);
      }
    })();

    fetchInFlightRef.current = requestPromise;

    try {
      await requestPromise;
    } finally {
      fetchInFlightRef.current = null;
    }
  };

  // ===================================================
  // INITIAL FETCH
  // ===================================================

  useEffect(() => {
    if (
      !permissionsLoading &&
      canViewCreditNotes &&
      !hasInitialFetchRef.current
    ) {
      fetchCreditNotes(1);
    }
  }, [permissionsLoading, canViewCreditNotes]);

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
          getCreditNoteAccountType(note),
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
    totalRecords === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const endEntry =
    totalRecords === 0
      ? 0
      : Math.min(
          startEntry + filteredCreditNotes.length - 1,
          totalRecords,
        );

  // ===================================================
  // PAGE CHANGE
  // ===================================================

  const goToPage = (page: number) => {
    if (
      page < 1 ||
      page > lastPage ||
      page === currentPage ||
      loading
    ) {
      return;
    }

    fetchCreditNotes(page, true);
  };

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = async () => {
    if (!canViewCreditNotes || loading) return;

    await fetchCreditNotes(currentPage, true);

    toast.success("Credit notes refreshed.");
  };

  // ===================================================
  // VIEW
  // ===================================================

  const handleView = (note: CreditNote) => {
    setSelectedNote(note);
    setViewOpen(true);
  };

  // ===================================================
  // PDF DOWNLOAD
  // ===================================================

  const generateCreditNotePdf = (note: CreditNote) => {
    if (!canDownloadCreditNotes) {
      toast.error(
        "You do not have permission to download credit note PDF.",
      );
      return;
    }

    try {
      const doc = new jsPDF({
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();

      const accountType = getCreditNoteAccountType(note);

      let y = 18;

      // =================================================
      // HEADER — NAVY
      // =================================================

      doc.setFillColor(30, 58, 138); // #1E3A8A
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

      doc.setTextColor(15, 27, 61); // #0F1B3D

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Buyer Details", 15, y);
      doc.text("Document Details", 112, y);

      y += 7;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");

      doc.text(`Name: ${note.buyer_name || "Unknown"}`, 15, y);
      doc.text(`Credit Note: ${note.credit_note_number}`, 112, y);

      y += 5;

      doc.text(`Email: ${note.buyer_email || "—"}`, 15, y);
      doc.text(`Original Invoice: ${note.original_invoice_number}`, 112, y);

      y += 5;

      doc.text(
        `Account Type: ${getAccountTypeLabel(accountType)}`,
        15,
        y,
      );
      doc.text(`Order ID: ${note.order_id}`, 112, y);

      y += 5;

      doc.text(`State: ${note.buyer_state || "—"}`, 15, y);
      doc.text(`Reason: ${capitalize(note.reason)}`, 112, y);

      y += 5;

      doc.text(`GSTIN: ${note.buyer_gstin || "—"}`, 15, y);

      // =================================================
      // DIVIDER
      // =================================================

      y += 10;

      doc.setDrawColor(216, 226, 240); // #D8E2F0
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
      // TABLE HEADER — LIGHT NAVY BG
      // =================================================

      doc.setFillColor(234, 241, 255); // #EAF1FF
      doc.rect(15, y - 5, pageWidth - 30, 8, "F");

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 58, 138); // #1E3A8A

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

        if (y + rowHeight > 275) {
          doc.addPage();
          y = 18;

          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(15, 27, 61);

          doc.text("Credit Note Items - Continued", 15, y);

          y += 9;
        }

        doc.setDrawColor(230, 235, 250);
        doc.line(15, y + rowHeight - 2, pageWidth - 15, y + rowHeight - 2);

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(58, 70, 104); // #3A4668

        doc.text(wrapped, 17, y);

        doc.text(String(item.quantity), 104, y, {
          align: "center",
        });

        doc.text(
          formatAmountPdf(item.taxable_value),
          145,
          y,
          { align: "right" },
        );

        doc.text(`${item.gst_rate}%`, 170, y, {
          align: "right",
        });

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

      doc.setDrawColor(37, 99, 235); // #2563EB
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
        doc.setTextColor(74, 87, 120); // #4A5778

        doc.text(label, 112, y);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 27, 61);

        doc.text(value, pageWidth - 17, y, {
          align: "right",
        });

        y += 6;
      });

      y += 3;

      // =================================================
      // FINAL AMOUNT — LIGHT NAVY BG
      // =================================================

      doc.setFillColor(234, 241, 255); // #EAF1FF
      doc.roundedRect(107, y, pageWidth - 122, 18, 3, 3, "F");

      doc.setTextColor(30, 58, 138);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);

      doc.text("CREDIT NOTE AMOUNT", 112, y + 7);

      doc.setFontSize(15);

      doc.text(formatAmountPdf(note.amount), pageWidth - 17, y + 12, {
        align: "right",
      });

      // =================================================
      // FOOTER
      // =================================================

      const footerY = 286;

      doc.setDrawColor(220, 228, 245);
      doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(140, 151, 178); // #8C97B2

      doc.text(
        "This credit note is generated electronically.",
        15,
        footerY,
      );

      doc.text(
        `Refund ID: ${note.refund_id ?? "—"}`,
        pageWidth - 15,
        footerY,
        {
          align: "right",
        },
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
  // PERMISSION LOADING
  // ===================================================

  if (permissionsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8FF] font-poppins">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
            <FiRefreshCw size={27} className="animate-spin" />
          </div>

          <p className="mt-4 text-sm font-bold text-[#0F1B3D]">
            Checking permissions...
          </p>

          <p className="mt-1 text-xs text-[#8C97B2]">
            Please wait while we verify your access.
          </p>
        </div>
      </div>
    );
  }


  if (loading && creditNotes.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8FF] font-poppins">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#D8E2F0] border-t-[#1E3A8A]" />

          <p className="mt-3 text-sm text-[#4A5778]">
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
        className="min-h-screen bg-[#F5F8FF] px-4 py-5 font-poppins sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-[1500px]">
          {/* PAGE HEADER */}
          <motion.div
            variants={itemVariants}
            className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-center"
          >
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1E3A8A]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />

                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2563EB]">
                  Finance & Returns
                </span>
              </div>

              <h1 className="text-[29px] font-semibold tracking-tight text-[#0F1B3D] sm:text-[32px]">
                Credit Notes
              </h1>

              <p className="mt-1.5 text-sm text-[#4A5778]">
                Manage issued credit notes and download customer credit
                records.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="flex h-11 items-center justify-center gap-2 self-start rounded-xl border border-[#D8E2F0] bg-white px-4 text-sm font-semibold text-[#1E3A8A] shadow-sm transition hover:border-[#1E3A8A] hover:bg-[#EAF1FF] disabled:cursor-not-allowed disabled:opacity-50"
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
            className="overflow-hidden rounded-[22px] border border-[#D8E2F0] bg-white shadow-sm"
          >
            {/* TOP ACCENT — NAVY */}
            <div className="h-[3px] w-full bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1E3A8A]" />

            {/* TOOLBAR */}
            <div className="flex flex-col gap-4 border-b border-[#D8E2F0] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#0F1B3D]">
                  Credit Note Directory
                </h2>

                <p className="mt-1 text-xs text-[#8C97B2]">
                  {totalRecords.toLocaleString("en-IN")} credit note
                  {totalRecords === 1 ? "" : "s"} found
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {/* SEARCH */}
                <div className="relative w-full sm:w-[330px]">
                  <FiSearch
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1E3A8A]"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search credit note, invoice or buyer..."
                    className="h-11 w-full rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] pl-10 pr-10 text-sm text-[#0F1B3D] outline-none transition placeholder:text-[#8C97B2] focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/10"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C97B2] transition hover:text-[#1E3A8A]"
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
                          ? "bg-gradient-to-r from-[#1E40AF] to-[#1E3A8A] text-white shadow-sm"
                          : "border border-[#D8E2F0] bg-[#F5F8FF] text-[#4A5778] hover:border-[#1E3A8A]/40 hover:bg-[#EAF1FF] hover:text-[#1E3A8A]"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1120px] border-collapse">
                <thead>
                  <tr className="bg-[#1E3A8A]">
                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                      S.No.
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                      Credit Note
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                      Buyer
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                      Invoice
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                      Issued
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                      Reason
                    </th>

                    <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                      Amount
                    </th>

                    <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
                            <FiRefreshCw size={22} className="animate-spin" />
                          </div>

                          <p className="mt-4 text-sm font-bold text-[#0F1B3D]">
                            Loading credit notes...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredCreditNotes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
                            <FiFileText size={24} />
                          </div>

                          <p className="mt-4 text-sm font-bold text-[#0F1B3D]">
                            No credit notes found
                          </p>

                          <p className="mt-1 text-xs text-[#8C97B2]">
                            Try changing your search or filter.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCreditNotes.map((note, index) => {
                      const accountType = getCreditNoteAccountType(note);

                      return (
                        <motion.tr
                          key={note.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.025 }}
                          className="border-b border-[#D8E2F0] bg-white transition hover:bg-[#FAFBFF]"
                        >
                          {/* S.NO */}
                          <td className="px-5 py-4">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F8FF] text-xs font-bold text-[#1E3A8A]">
                              {startEntry + index}
                            </span>
                          </td>

                          {/* CREDIT NOTE */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] text-white">
                                <FiFileText size={16} />
                              </div>

                              <div className="min-w-0">
                                <p className="text-sm font-bold text-[#0F1B3D]">
                                  {note.credit_note_number}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* BUYER */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF1FF] text-[10px] font-bold text-[#1E3A8A]">
                                {getBuyerInitials(note.buyer_name)}
                              </div>

                              <div className="min-w-0">
                                <p className="max-w-[190px] truncate text-xs font-semibold text-[#0F1B3D]">
                                  {note.buyer_name}
                                </p>

                                <span
                                  className={`mt-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold ${getAccountTypeClass(
                                    accountType,
                                  )}`}
                                >
                                  <FiBriefcase size={9} />

                                  {getAccountTypeLabel(accountType)}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* INVOICE */}
                          <td className="px-5 py-4">
                            <p className="text-xs font-semibold text-[#4A5778]">
                              {note.original_invoice_number}
                            </p>
                          </td>

                          {/* DATE */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <FiCalendar
                                size={14}
                                className="text-[#1E3A8A]"
                              />

                              <div>
                                <p className="text-xs font-semibold text-[#4A5778]">
                                  {formatDate(note.issued_at)}
                                </p>

                                <p className="mt-1 text-[10px] text-[#8C97B2]">
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
                            <p className="text-sm font-bold text-[#1E3A8A]">
                              {formatAmount(note.amount)}
                            </p>

                            <p className="mt-1 text-[10px] text-[#8C97B2]">
                              GST {formatAmount(note.total_gst)}
                            </p>
                          </td>

                          {/* ACTIONS */}
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              {/* VIEW */}
                              <button
                                type="button"
                                onClick={() => handleView(note)}
                                title="View credit note"
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] text-[#1E3A8A] transition hover:border-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white"
                              >
                                <FiEye size={15} />
                              </button>

                              {/* DOWNLOAD */}
                              {canDownloadCreditNotes && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    generateCreditNotePdf(note)
                                  }
                                  title="Download PDF"
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E3A8A]/20 bg-[#EAF1FF] text-[#1E3A8A] transition hover:bg-[#1E3A8A] hover:text-white"
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

            {/* MOBILE */}
            <div className="block lg:hidden">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={`mobile-skeleton-${i}`}
                    className="animate-pulse border-b border-[#D8E2F0] bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="h-11 w-11 rounded-xl bg-[#EAF1FF]" />

                      <div className="h-4 w-16 rounded bg-[#F5F8FF]" />
                    </div>

                    <div className="mt-4 h-4 w-40 rounded bg-[#EAF1FF]" />

                    <div className="mt-2 h-3 w-28 rounded bg-[#F5F8FF]" />

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="h-16 rounded-xl bg-[#EAF1FF]" />

                      <div className="h-16 rounded-xl bg-[#F5F8FF]" />
                    </div>
                  </div>
                ))
              ) : filteredCreditNotes.length > 0 ? (
                filteredCreditNotes.map((note, index) => {
                  const accountType = getCreditNoteAccountType(note);

                  return (
                    <motion.div
                      key={note.id}
                      variants={itemVariants}
                      className="border-b border-[#D8E2F0] bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] text-white">
                            <FiFileText size={17} />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[#0F1B3D]">
                              {note.credit_note_number}
                            </p>

                            <p className="mt-1 truncate text-[10px] text-[#8C97B2]">
                              {note.original_invoice_number}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold text-[#8C97B2]">
                          #{startEntry + index}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] p-3">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-[#8C97B2]">
                            Buyer
                          </p>

                          <p className="mt-1 truncate text-xs font-semibold text-[#0F1B3D]">
                            {note.buyer_name}
                          </p>

                          <p className="mt-0.5 truncate text-[10px] text-[#8C97B2]">
                            {note.buyer_email}
                          </p>

                          <span
                            className={`mt-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold ${getAccountTypeClass(
                              accountType,
                            )}`}
                          >
                            <FiBriefcase size={9} />

                            {getAccountTypeLabel(accountType)}
                          </span>
                        </div>

                        <div className="rounded-xl border border-[#1E3A8A]/20 bg-[#EAF1FF] p-3">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-[#2563EB]">
                            Amount
                          </p>

                          <p className="mt-1 text-sm font-bold text-[#1E3A8A]">
                            {formatAmount(note.amount)}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] p-3">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-[#8C97B2]">
                            Issued
                          </p>

                          <p className="mt-1 text-xs font-semibold text-[#0F1B3D]">
                            {formatDate(note.issued_at)}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] p-3">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-[#8C97B2]">
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
                          className="flex h-9 items-center gap-2 rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] px-3 text-xs font-bold text-[#1E3A8A]"
                        >
                          <FiEye size={14} />
                          View
                        </button>

                        {canDownloadCreditNotes && (
                          <button
                            type="button"
                            onClick={() => generateCreditNotePdf(note)}
                            className="flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-[#1E40AF] to-[#1E3A8A] px-3 text-xs font-bold text-white"
                          >
                            <FiDownload size={14} />
                            PDF
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center bg-white px-5 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
                    <FiFileText size={24} />
                  </div>

                  <p className="mt-4 text-sm font-bold text-[#0F1B3D]">
                    No credit notes found
                  </p>

                  <p className="mt-1 text-xs text-[#8C97B2]">
                    Try another search or filter.
                  </p>
                </div>
              )}
            </div>

            {/* PAGINATION */}
            {lastPage > 1 && (
              <div className="border-t border-[#D8E2F0] bg-[#FAFBFF] px-4 py-4 sm:px-5">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <p className="text-xs text-[#4A5778]">
                    Showing{" "}
                    <span className="font-bold text-[#0F1B3D]">
                      {startEntry}
                    </span>{" "}
                    to{" "}
                    <span className="font-bold text-[#0F1B3D]">
                      {Math.max(startEntry, endEntry)}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-[#0F1B3D]">
                      {totalRecords}
                    </span>{" "}
                    entries
                  </p>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8E2F0] bg-white text-[#1E3A8A] transition hover:bg-[#EAF1FF] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <FiChevronLeft size={17} />
                    </button>

                    {visiblePages.map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => goToPage(page)}
                        disabled={loading}
                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold transition ${
                          currentPage === page
                            ? "bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] text-white shadow-md shadow-[#1E3A8A]/15"
                            : "text-[#4A5778] hover:bg-[#EAF1FF] hover:text-[#1E3A8A]"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === lastPage || loading}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8E2F0] bg-white text-[#1E3A8A] transition hover:bg-[#EAF1FF] disabled:cursor-not-allowed disabled:opacity-30"
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