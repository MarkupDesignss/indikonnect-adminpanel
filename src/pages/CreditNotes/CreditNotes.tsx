"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

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
// CONSTANTS
// =====================================================

const GOLD = "#b8902e";
const DARK_GOLD = "#8f6d1d";
const PAGE_BG = "#f7f5ef";

// =====================================================
// ANIMATIONS
// =====================================================

const containerVariants = {
  hidden: {
    opacity: 0,
  },
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

const formatAmount = (
  value: string | number | null | undefined
) => {
  const amount = Number(value ?? 0);

  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (
  value?: string | null
) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const formatDateTime = (
  value?: string | null
) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

const capitalize = (
  value?: string | null
) => {
  if (!value) {
    return "—";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
};

const getStatusClass = (
  reason?: string
) => {
  switch (reason?.toLowerCase()) {
    case "return":
      return "border-[#b8902e]/25 bg-[#f8f3e5] text-[#806319]";

    case "cancel":
    case "cancellation":
      return "border-[#d8aaa2] bg-[#fff5f3] text-[#a04d43]";

    default:
      return "border-[#d8d1c4] bg-[#f6f4ef] text-[#786f60]";
  }
};

const getBuyerInitials = (
  name?: string
) => {
  if (!name || name === "Unknown") {
    return "CN";
  }

  const parts =
    name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[1][0]
  ).toUpperCase();
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

const CreditNoteViewModal: React.FC<
  CreditNoteViewModalProps
> = ({
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
      <div className="w-full max-w-[760px] overflow-hidden rounded-[20px] border border-[#b8902e]/15 bg-white shadow-2xl">
        <div className="h-[3px] w-full bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]" />

        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
              <FiFileText size={19} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9a741b]">
                Credit Note
              </p>

              <h2 className="mt-0.5 text-lg font-semibold text-gray-900">
                {note.credit_note_number}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <FiX size={17} />
          </button>
        </div>

        {/* BODY */}
        <div className="max-h-[75vh] overflow-y-auto bg-[#faf8f3] p-5 sm:p-6">
          {/* TOP SUMMARY */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#b8902e]/10 bg-white p-4">
              <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                Invoice
              </p>

              <p className="mt-1 text-sm font-bold text-gray-800">
                {note.original_invoice_number}
              </p>
            </div>

            <div className="rounded-xl border border-[#b8902e]/10 bg-white p-4">
              <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                Reason
              </p>

              <span
                className={`mt-1.5 inline-flex rounded-full border px-2.5 py-1 text-[9px] font-bold ${getStatusClass(
                  note.reason
                )}`}
              >
                {capitalize(note.reason)}
              </span>
            </div>

            <div className="rounded-xl border border-[#b8902e]/10 bg-[#fffaf0] p-4">
              <p className="text-[9px] font-bold uppercase tracking-wide text-[#9a741b]">
                Credit Amount
              </p>

              <p className="mt-1 text-lg font-bold text-[#8f6d1d]">
                {formatAmount(
                  note.amount
                )}
              </p>
            </div>
          </div>

          {/* BUYER */}
          <div className="mt-4 rounded-xl border border-[#b8902e]/10 bg-white p-4">
            <div className="mb-4 flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#faf4df] text-xs font-bold text-[#8f6d1d]">
                {getBuyerInitials(
                  note.buyer_name
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Buyer Details
                </h3>

                <p className="text-[10px] text-gray-400">
                  Credit note customer information
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                  Name
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {note.buyer_name ||
                    "Unknown"}
                </p>
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                  Email
                </p>

                <p className="mt-1 break-all text-sm font-semibold text-gray-800">
                  {note.buyer_email ||
                    "—"}
                </p>
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                  State
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {note.buyer_state ||
                    "—"}
                </p>
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                  GSTIN
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {note.buyer_gstin ||
                    "—"}
                </p>
              </div>
            </div>
          </div>

          {/* ITEMS */}
          <div className="mt-4 overflow-hidden rounded-xl border border-[#b8902e]/10 bg-white">
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-sm font-bold text-gray-900">
                Credit Note Items
              </h3>

              <p className="mt-0.5 text-[10px] text-gray-400">
                {note.items?.length || 0} item
                {note.items?.length === 1
                  ? ""
                  : "s"}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse">
                <thead>
                  <tr className="bg-[#faf8f3]">
                    <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-wide text-gray-500">
                      Product
                    </th>

                    <th className="px-4 py-3 text-center text-[9px] font-bold uppercase tracking-wide text-gray-500">
                      Qty
                    </th>

                    <th className="px-4 py-3 text-right text-[9px] font-bold uppercase tracking-wide text-gray-500">
                      Taxable
                    </th>

                    <th className="px-4 py-3 text-right text-[9px] font-bold uppercase tracking-wide text-gray-500">
                      GST
                    </th>

                    <th className="px-4 py-3 text-right text-[9px] font-bold uppercase tracking-wide text-gray-500">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {(note.items || []).map(
                    (item) => (
                      <tr
                        key={`${item.order_line_id}-${item.product_id}`}
                        className="border-t border-gray-100"
                      >
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-gray-800">
                            {item.product_name}
                          </p>

                          <p className="mt-0.5 font-mono text-[9px] text-gray-400">
                            Code:{" "}
                            {item.product_code ||
                              "—"}
                          </p>
                        </td>

                        <td className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                          {item.quantity}
                        </td>

                        <td className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                          {formatAmount(
                            item.taxable_value
                          )}
                        </td>

                        <td className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                          {item.gst_rate}%
                        </td>

                        <td className="px-4 py-3 text-right text-xs font-bold text-[#8f6d1d]">
                          {formatAmount(
                            item.line_total
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TAX + TOTAL */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#b8902e]/10 bg-white p-4">
              <h3 className="mb-3 text-sm font-bold text-gray-900">
                Tax Summary
              </h3>

              <div className="space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">
                    Taxable Value
                  </span>

                  <span className="font-semibold text-gray-800">
                    {formatAmount(
                      note.taxable_value
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">
                    CGST
                  </span>

                  <span className="font-semibold text-gray-800">
                    {formatAmount(
                      note.cgst_amount
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">
                    SGST
                  </span>

                  <span className="font-semibold text-gray-800">
                    {formatAmount(
                      note.sgst_amount
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">
                    IGST
                  </span>

                  <span className="font-semibold text-gray-800">
                    {formatAmount(
                      note.igst_amount
                    )}
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-gray-700">
                      Total GST
                    </span>

                    <span className="font-bold text-[#8f6d1d]">
                      {formatAmount(
                        note.total_gst
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#b8902e]/10 bg-[#fffaf0] p-4">
              <p className="text-[9px] font-bold uppercase tracking-wide text-[#9a741b]">
                Final Credit Amount
              </p>

              <p className="mt-2 text-[28px] font-bold tracking-tight text-[#8f6d1d]">
                {formatAmount(
                  note.amount
                )}
              </p>

              <div className="mt-4 border-t border-[#b8902e]/10 pt-3">
                <div className="flex items-center gap-2">
                  <FiCalendar
                    size={13}
                    className="text-[#b8902e]"
                  />

                  <span className="text-[10px] font-semibold text-gray-600">
                    Issued{" "}
                    {formatDate(
                      note.issued_at
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 border-t border-gray-100 bg-white px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() =>
              onDownload(note)
            }
            className="flex items-center gap-2 rounded-xl bg-[#b8902e] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#9f7a25]"
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
  const [creditNotes, setCreditNotes] =
    useState<CreditNote[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [reasonFilter, setReasonFilter] =
    useState<
      "all" | "return" | "other"
    >("all");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [
    lastPage,
    setLastPage,
  ] = useState(1);

  const [
    totalRecords,
    setTotalRecords,
  ] = useState(0);

  const [
    selectedNote,
    setSelectedNote,
  ] = useState<CreditNote | null>(
    null
  );

  const [
    viewOpen,
    setViewOpen,
  ] = useState(false);

  const ITEMS_PER_PAGE = 20;

  // ===================================================
  // FETCH
  // ===================================================

  const fetchCreditNotes = async (
    page = currentPage
  ) => {
    try {
      setLoading(true);

      const response =
        await creditNotesApi.getAll(
          page
        );

      if (
        response.data.success
      ) {
        const pagination =
          response.data.data;

        setCreditNotes(
          pagination?.data || []
        );

        setCurrentPage(
          pagination?.current_page ||
            page
        );

        setLastPage(
          pagination?.last_page ||
            1
        );

        setTotalRecords(
          pagination?.total || 0
        );
      } else {
        toast.error(
          response.data.message ||
            "Unable to fetch credit notes."
        );
      }
    } catch (error: any) {
      console.error(
        "Fetch credit notes error:",
        error
      );

      toast.error(
        error?.response?.data
          ?.message ||
          "Unable to fetch credit notes."
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

  const filteredCreditNotes =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return creditNotes.filter(
        (note) => {
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

          if (
            reasonFilter ===
            "return"
          ) {
            matchesReason =
              note.reason?.toLowerCase() ===
              "return";
          }

          if (
            reasonFilter ===
            "other"
          ) {
            matchesReason =
              note.reason?.toLowerCase() !==
              "return";
          }

          return (
            matchesSearch &&
            matchesReason
          );
        }
      );
    }, [
      creditNotes,
      search,
      reasonFilter,
    ]);

  // ===================================================
  // LOCAL DISPLAY PAGINATION
  // ===================================================
  //
  // Backend already gives pagination.
  // Since only current API page is loaded,
  // display rows directly.

  const startEntry =
    totalRecords === 0
      ? 0
      : (currentPage - 1) *
          ITEMS_PER_PAGE +
        1;

  const endEntry =
    Math.min(
      startEntry +
        filteredCreditNotes.length -
        1,
      totalRecords
    );

  // ===================================================
  // PAGE CHANGE
  // ===================================================

  const goToPage = (
    page: number
  ) => {
    if (
      page < 1 ||
      page > lastPage ||
      page === currentPage
    ) {
      return;
    }

    fetchCreditNotes(page);
  };

  // ===================================================
  // VIEW
  // ===================================================

  const handleView = (
    note: CreditNote
  ) => {
    setSelectedNote(
      note
    );

    setViewOpen(true);
  };

  // ===================================================
  // PDF
  // ===================================================

  const generateCreditNotePdf = (
    note: CreditNote
  ) => {
    try {
      const doc =
        new jsPDF({
          unit: "mm",
          format: "a4",
        });

      const pageWidth =
        doc.internal.pageSize.getWidth();

      let y = 18;

      // =================================================
      // HEADER
      // =================================================

      doc.setFillColor(
        47,
        42,
        34
      );

      doc.rect(
        0,
        0,
        pageWidth,
        31,
        "F"
      );

      doc.setTextColor(
        255,
        255,
        255
      );

      doc.setFontSize(20);
      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.text(
        "CREDIT NOTE",
        15,
        14
      );

      doc.setFontSize(9);
      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.text(
        "IndieKonnect",
        15,
        22
      );

      doc.setFontSize(9);
      doc.text(
        note.credit_note_number,
        pageWidth - 15,
        13,
        {
          align: "right",
        }
      );

      doc.text(
        `Issued: ${formatDate(
          note.issued_at
        )}`,
        pageWidth - 15,
        20,
        {
          align: "right",
        }
      );

      y = 41;

      // =================================================
      // BUYER / DOCUMENT
      // =================================================

      doc.setTextColor(
        45,
        42,
        36
      );

      doc.setFontSize(11);
      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.text(
        "Buyer Details",
        15,
        y
      );

      doc.text(
        "Document Details",
        112,
        y
      );

      y += 7;

      doc.setFontSize(9);
      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.text(
        `Name: ${
          note.buyer_name ||
          "Unknown"
        }`,
        15,
        y
      );

      doc.text(
        `Credit Note: ${
          note.credit_note_number
        }`,
        112,
        y
      );

      y += 5;

      doc.text(
        `Email: ${
          note.buyer_email ||
          "—"
        }`,
        15,
        y
      );

      doc.text(
        `Original Invoice: ${
          note.original_invoice_number
        }`,
        112,
        y
      );

      y += 5;

      doc.text(
        `State: ${
          note.buyer_state ||
          "—"
        }`,
        15,
        y
      );

      doc.text(
        `Order ID: ${
          note.order_id
        }`,
        112,
        y
      );

      y += 5;

      doc.text(
        `GSTIN: ${
          note.buyer_gstin ||
          "—"
        }`,
        15,
        y
      );

      doc.text(
        `Reason: ${
          capitalize(note.reason)
        }`,
        112,
        y
      );

      // =================================================
      // DIVIDER
      // =================================================

      y += 10;

      doc.setDrawColor(
        210,
        204,
        192
      );

      doc.line(
        15,
        y,
        pageWidth - 15,
        y
      );

      y += 9;

      // =================================================
      // ITEMS TITLE
      // =================================================

      doc.setFontSize(11);
      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.text(
        "Credit Note Items",
        15,
        y
      );

      y += 7;

      // =================================================
      // TABLE HEADER
      // =================================================

      doc.setFillColor(
        250,
        248,
        243
      );

      doc.rect(
        15,
        y - 5,
        pageWidth - 30,
        8,
        "F"
      );

      doc.setFontSize(8);
      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.text(
        "Product",
        17,
        y
      );

      doc.text(
        "Qty",
        104,
        y,
        {
          align: "center",
        }
      );

      doc.text(
        "Taxable",
        145,
        y,
        {
          align: "right",
        }
      );

      doc.text(
        "GST",
        170,
        y,
        {
          align: "right",
        }
      );

      doc.text(
        "Total",
        pageWidth - 17,
        y,
        {
          align: "right",
        }
      );

      y += 7;

      doc.setFont(
        "helvetica",
        "normal"
      );

      // =================================================
      // ITEMS
      // =================================================

      (
        note.items || []
      ).forEach((item) => {
        const productName =
          item.product_name ||
          "Product";

        const wrapped =
          doc.splitTextToSize(
            productName,
            75
          );

        const rowHeight =
          Math.max(
            7,
            wrapped.length * 4
          );

        // Add new page if needed
        if (
          y + rowHeight >
          275
        ) {
          doc.addPage();

          y = 18;

          doc.setFontSize(
            11
          );

          doc.setFont(
            "helvetica",
            "bold"
          );

          doc.text(
            "Credit Note Items - Continued",
            15,
            y
          );

          y += 9;
        }

        doc.setDrawColor(
          230,
          226,
          218
        );

        doc.line(
          15,
          y + rowHeight - 2,
          pageWidth - 15,
          y + rowHeight - 2
        );

        doc.setFontSize(8);
        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.text(
          wrapped,
          17,
          y
        );

        doc.text(
          String(
            item.quantity
          ),
          104,
          y,
          {
            align: "center",
          }
        );

        doc.text(
          formatAmount(
            item.taxable_value
          ),
          145,
          y,
          {
            align: "right",
          }
        );

        doc.text(
          `${item.gst_rate}%`,
          170,
          y,
          {
            align: "right",
          }
        );

        doc.text(
          formatAmount(
            item.line_total
          ),
          pageWidth - 17,
          y,
          {
            align: "right",
          }
        );

        y += rowHeight;
      });

      // =================================================
      // TOTALS
      // =================================================

      y += 7;

      if (
        y > 245
      ) {
        doc.addPage();
        y = 20;
      }

      doc.setDrawColor(
        184,
        144,
        46
      );

      doc.line(
        110,
        y,
        pageWidth - 15,
        y
      );

      y += 7;

      const totals = [
        [
          "Taxable Value",
          formatAmount(
            note.taxable_value
          ),
        ],
        [
          "CGST",
          formatAmount(
            note.cgst_amount
          ),
        ],
        [
          "SGST",
          formatAmount(
            note.sgst_amount
          ),
        ],
        [
          "IGST",
          formatAmount(
            note.igst_amount
          ),
        ],
        [
          "Total GST",
          formatAmount(
            note.total_gst
          ),
        ],
      ];

      doc.setFontSize(9);

      totals.forEach(
        ([label, value]) => {
          doc.setFont(
            "helvetica",
            "normal"
          );

          doc.setTextColor(
            95,
            90,
            80
          );

          doc.text(
            label,
            112,
            y
          );

          doc.setFont(
            "helvetica",
            "bold"
          );

          doc.setTextColor(
            55,
            51,
            44
          );

          doc.text(
            value,
            pageWidth - 17,
            y,
            {
              align: "right",
            }
          );

          y += 6;
        }
      );

      y += 3;

      // =================================================
      // FINAL AMOUNT
      // =================================================

      doc.setFillColor(
        255,
        250,
        240
      );

      doc.roundedRect(
        107,
        y,
        pageWidth - 122,
        18,
        3,
        3,
        "F"
      );

      doc.setTextColor(
        143,
        109,
        29
      );

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(
        9
      );

      doc.text(
        "CREDIT NOTE AMOUNT",
        112,
        y + 7
      );

      doc.setFontSize(
        15
      );

      doc.text(
        formatAmount(
          note.amount
        ),
        pageWidth - 17,
        y + 12,
        {
          align: "right",
        }
      );

      // =================================================
      // FOOTER
      // =================================================

      const footerY =
        286;

      doc.setDrawColor(
        220,
        215,
        204
      );

      doc.line(
        15,
        footerY - 5,
        pageWidth - 15,
        footerY - 5
      );

      doc.setFontSize(
        7.5
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setTextColor(
        120,
        113,
        101
      );

      doc.text(
        "This credit note is generated electronically.",
        15,
        footerY
      );

      doc.text(
        `Refund ID: ${
          note.refund_id ??
          "—"
        }`,
        pageWidth - 15,
        footerY,
        {
          align: "right",
        }
      );

      // =================================================
      // DOWNLOAD
      // =================================================

      doc.save(
        `${note.credit_note_number}.pdf`
      );

      toast.success(
        "Credit note PDF downloaded successfully."
      );
    } catch (error) {
      console.error(
        "Generate credit note PDF error:",
        error
      );

      toast.error(
        "Unable to generate PDF."
      );
    }
  };

  // ===================================================
  // PAGE NUMBERS
  // ===================================================

  const visiblePages =
    useMemo(() => {
      if (lastPage <= 5) {
        return Array.from(
          {
            length: lastPage,
          },
          (_, index) =>
            index + 1
        );
      }

      if (
        currentPage <= 3
      ) {
        return [
          1,
          2,
          3,
          4,
          5,
        ];
      }

      if (
        currentPage >=
        lastPage - 2
      ) {
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
    }, [
      currentPage,
      lastPage,
    ]);

  // ===================================================
  // INITIAL LOADING
  // ===================================================

  if (
    loading &&
    creditNotes.length === 0
  ) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{
          backgroundColor:
            PAGE_BG,
        }}
      >
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-[#b8902e]" />

          <p className="mt-3 text-sm text-gray-500">
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
        variants={
          containerVariants
        }
        className="min-h-screen px-4 py-5 sm:px-6 lg:px-8"
        style={{
          backgroundColor:
            PAGE_BG,
        }}
      >
        <div className="mx-auto max-w-[1500px]">
          {/* =================================================
              PAGE HEADER
          ================================================= */}

          <motion.div
            variants={
              itemVariants
            }
            className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-center"
          >
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#b8902e]" />

                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9a741b]">
                  Finance & Returns
                </span>
              </div>

              <h1 className="font-serif text-[29px] font-semibold tracking-tight text-gray-900 sm:text-[32px]">
                Credit Notes
              </h1>

              <p className="mt-1.5 text-sm text-gray-500">
                Manage issued credit notes and
                download customer credit records.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                fetchCreditNotes(
                  currentPage
                )
              }
              disabled={
                loading
              }
              className="flex h-11 items-center justify-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiRefreshCw
                size={16}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              <span className="hidden sm:inline">
                Refresh
              </span>
            </button>
          </motion.div>

          {/* =================================================
              MAIN CARD
          ================================================= */}

          <motion.div
            variants={
              itemVariants
            }
            className="overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm"
          >
            <div
              className="h-[3px] w-full"
              style={{
                background:
                  `linear-gradient(90deg, ${GOLD}, #d7bd72, ${GOLD})`,
              }}
            />

            {/* =================================================
                TOOLBAR
            ================================================= */}

            <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Credit Note Directory
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {totalRecords.toLocaleString(
                    "en-IN"
                  )}{" "}
                  credit note
                  {totalRecords === 1
                    ? ""
                    : "s"}{" "}
                  found
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {/* SEARCH */}
                <div className="relative w-full sm:w-[330px]">
                  <FiSearch
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                    placeholder="Search credit note, invoice or buyer..."
                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-10 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/10"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() =>
                        setSearch(
                          ""
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
                    >
                      <FiX
                        size={16}
                      />
                    </button>
                  )}
                </div>

                {/* FILTER */}
                <div className="flex gap-2">
                  {[
                    {
                      key: "all" as const,
                      label: "All",
                    },
                    {
                      key: "return" as const,
                      label: "Returns",
                    },
                    {
                      key: "other" as const,
                      label: "Other",
                    },
                  ].map(
                    (filter) => (
                      <button
                        key={
                          filter.key
                        }
                        type="button"
                        onClick={() =>
                          setReasonFilter(
                            filter.key
                          )
                        }
                        className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                          reasonFilter ===
                          filter.key
                            ? "bg-[#b8902e] text-white shadow-sm"
                            : "border border-gray-200 bg-gray-50 text-gray-600 hover:bg-[#b8902e]/10 hover:text-[#8f6d1d]"
                        }`}
                      >
                        {
                          filter.label
                        }
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* =================================================
                TABLE INFO
            ================================================= */}

            <div className="flex flex-col justify-between gap-3 border-b border-gray-100 px-4 pb-4 pt-5 sm:flex-row sm:items-center sm:px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#faf8f3] text-[#a8841c]">
                  <FiFileText
                    size={18}
                  />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Issued Credit Notes
                  </h3>

                  <p className="mt-0.5 text-[11px] text-gray-400">
                    Customer refund and return
                    credit records
                  </p>
                </div>
              </div>

              <span className="rounded-lg bg-[#faf8f3] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[#8f6d1d]">
                {reasonFilter === "all"
                  ? "All Credit Notes"
                  : reasonFilter ===
                    "return"
                  ? "Return Credit Notes"
                  : "Other Credit Notes"}
              </span>
            </div>

            {/* =================================================
                DESKTOP TABLE
            ================================================= */}

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1120px] border-collapse">
                <thead>
                  <tr className="bg-[#2f2a22]">
                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                      S.No.
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                      Credit Note
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                      Buyer
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                      Invoice
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                      Issued
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                      Reason
                    </th>

                    <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                      Amount
                    </th>

                    <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={
                          8
                        }
                        className="px-5 py-16 text-center"
                      >
                        <div className="flex flex-col items-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b8902e]/10 text-[#b8902e]">
                            <FiRefreshCw
                              size={22}
                              className="animate-spin"
                            />
                          </div>

                          <p className="mt-4 text-sm font-bold text-gray-800">
                            Loading credit notes...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredCreditNotes.length ===
                    0 ? (
                    <tr>
                      <td
                        colSpan={
                          8
                        }
                        className="px-5 py-16 text-center"
                      >
                        <div className="flex flex-col items-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#b8902e]">
                            <FiFileText
                              size={24}
                            />
                          </div>

                          <p className="mt-4 text-sm font-bold text-gray-800">
                            No credit notes found
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            Try changing your
                            search or filter.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCreditNotes.map(
                      (
                        note,
                        index
                      ) => (
                        <motion.tr
                          key={
                            note.id
                          }
                          initial={{
                            opacity: 0,
                            y: 5,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          transition={{
                            delay:
                              index *
                              0.025,
                          }}
                          className="border-b border-gray-100 bg-white transition hover:bg-[#fcfaf5]"
                        >
                          {/* S.NO */}
                          <td className="px-5 py-4">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-xs font-bold text-[#8f6d1d]">
                              {startEntry +
                                index}
                            </span>
                          </td>

                          {/* CREDIT NOTE */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-white">
                                <FiFileText
                                  size={16}
                                />
                              </div>

                              <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-800">
                                  {
                                    note.credit_note_number
                                  }
                                </p>

                               
                              </div>
                            </div>
                          </td>

                          {/* BUYER */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#faf4df] text-[10px] font-bold text-[#8f6d1d]">
                                {getBuyerInitials(
                                  note.buyer_name
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="max-w-[190px] truncate text-xs font-semibold text-gray-800">
                                  {
                                    note.buyer_name
                                  }
                                </p>

                                <p className="mt-1 max-w-[190px] truncate text-[10px] text-gray-400">
                                  {
                                    note.buyer_email
                                  }
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* INVOICE */}
                          <td className="px-5 py-4">
                            <p className="text-xs font-semibold text-gray-700">
                              {
                                note.original_invoice_number
                              }
                            </p>

                            <p className="mt-1 text-[10px] text-gray-400">
                              Order #
                              {
                                note.order_id
                              }
                            </p>
                          </td>

                          {/* DATE */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <FiCalendar
                                size={14}
                                className="text-[#b8902e]"
                              />

                              <div>
                                <p className="text-xs font-semibold text-gray-700">
                                  {formatDate(
                                    note.issued_at
                                  )}
                                </p>

                                <p className="mt-1 text-[10px] text-gray-400">
                                  {formatDateTime(
                                    note.issued_at
                                  )
                                    .split(
                                      ", "
                                    )
                                    .pop()}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* REASON */}
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1.5 text-[9px] font-bold ${getStatusClass(
                                note.reason
                              )}`}
                            >
                              {capitalize(
                                note.reason
                              )}
                            </span>
                          </td>

                          {/* AMOUNT */}
                          <td className="px-5 py-4 text-right">
                            <p className="text-sm font-bold text-[#8f6d1d]">
                              {formatAmount(
                                note.amount
                              )}
                            </p>

                            <p className="mt-1 text-[10px] text-gray-400">
                              GST{" "}
                              {formatAmount(
                                note.total_gst
                              )}
                            </p>
                          </td>

                          {/* ACTIONS */}
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleView(
                                    note
                                  )
                                }
                                title="View credit note"
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-[#faf8f3] text-[#8f6d1d] transition hover:bg-[#b8902e] hover:text-white"
                              >
                                <FiEye
                                  size={15}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  generateCreditNotePdf(
                                    note
                                  )
                                }
                                title="Download PDF"
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/20 bg-[#fffaf0] text-[#8f6d1d] transition hover:bg-[#b8902e] hover:text-white"
                              >
                                <FiDownload
                                  size={15}
                                />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* =================================================
                MOBILE
            ================================================= */}

            <div className="block lg:hidden">
              {filteredCreditNotes.length >
              0 ? (
                filteredCreditNotes.map(
                  (
                    note,
                    index
                  ) => (
                    <motion.div
                      key={
                        note.id
                      }
                      variants={
                        itemVariants
                      }
                      className="border-b border-gray-100 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-white">
                            <FiFileText
                              size={17}
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-gray-800">
                              {
                                note.credit_note_number
                              }
                            </p>

                            <p className="mt-1 truncate text-[10px] text-gray-400">
                              {
                                note.original_invoice_number
                              }
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold text-gray-400">
                          #
                          {startEntry +
                            index}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-gray-100 bg-[#faf8f3] p-3">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                            Buyer
                          </p>

                          <p className="mt-1 truncate text-xs font-semibold text-gray-800">
                            {
                              note.buyer_name
                            }
                          </p>

                          <p className="mt-0.5 truncate text-[10px] text-gray-400">
                            {
                              note.buyer_email
                            }
                          </p>
                        </div>

                        <div className="rounded-xl border border-gray-100 bg-[#fffaf0] p-3">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                            Amount
                          </p>

                          <p className="mt-1 text-sm font-bold text-[#8f6d1d]">
                            {formatAmount(
                              note.amount
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl border border-gray-100 bg-[#faf8f3] p-3">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                            Issued
                          </p>

                          <p className="mt-1 text-xs font-semibold text-gray-800">
                            {formatDate(
                              note.issued_at
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl border border-gray-100 bg-[#faf8f3] p-3">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                            Reason
                          </p>

                          <span
                            className={`mt-1.5 inline-flex rounded-full border px-2.5 py-1 text-[9px] font-bold ${getStatusClass(
                              note.reason
                            )}`}
                          >
                            {capitalize(
                              note.reason
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleView(
                              note
                            )
                          }
                          className="flex h-9 items-center gap-2 rounded-xl border border-gray-200 bg-[#faf8f3] px-3 text-xs font-bold text-[#8f6d1d]"
                        >
                          <FiEye
                            size={14}
                          />
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            generateCreditNotePdf(
                              note
                            )
                          }
                          className="flex h-9 items-center gap-2 rounded-xl bg-[#b8902e] px-3 text-xs font-bold text-white"
                        >
                          <FiDownload
                            size={14}
                          />
                          PDF
                        </button>
                      </div>
                    </motion.div>
                  )
                )
              ) : (
                <div className="flex flex-col items-center px-5 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#b8902e]">
                    <FiFileText
                      size={24}
                    />
                  </div>

                  <p className="mt-4 text-sm font-bold text-gray-800">
                    No credit notes found
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Try another search or
                    filter.
                  </p>
                </div>
              )}
            </div>

            {/* =================================================
                PAGINATION
            ================================================= */}

            {lastPage > 1 && (
              <div className="border-t border-gray-100 bg-[#fffdfa] px-4 py-4 sm:px-5">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <p className="text-xs text-gray-500">
                    Showing{" "}
                    <span className="font-bold text-gray-800">
                      {startEntry}
                    </span>{" "}
                    to{" "}
                    <span className="font-bold text-gray-800">
                      {Math.max(
                        startEntry,
                        endEntry
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-gray-800">
                      {totalRecords}
                    </span>{" "}
                    entries
                  </p>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        goToPage(
                          currentPage -
                            1
                        )
                      }
                      disabled={
                        currentPage ===
                        1
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-[#8f6d1d] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <FiChevronLeft
                        size={17}
                      />
                    </button>

                    {visiblePages.map(
                      (
                        page
                      ) => (
                        <button
                          key={
                            page
                          }
                          type="button"
                          onClick={() =>
                            goToPage(
                              page
                            )
                          }
                          className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold ${
                            currentPage ===
                            page
                              ? "bg-[#b8902e] text-white shadow-sm"
                              : "text-gray-600 hover:bg-[#faf8f3] hover:text-[#8f6d1d]"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        goToPage(
                          currentPage +
                            1
                        )
                      }
                      disabled={
                        currentPage ===
                        lastPage
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-[#8f6d1d] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <FiChevronRight
                        size={17}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* =================================================
          VIEW MODAL
      ================================================= */}

      <CreditNoteViewModal
        open={
          viewOpen
        }
        note={
          selectedNote
        }
        onClose={() => {
          setViewOpen(
            false
          );
          setSelectedNote(
            null
          );
        }}
        onDownload={
          generateCreditNotePdf
        }
      />
    </>
  );
};

export default CreditNotes;