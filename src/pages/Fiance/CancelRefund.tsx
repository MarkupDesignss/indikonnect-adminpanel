"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiSearch,
  FiPackage,
  FiEye,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiCalendar,
  FiAlertCircle,
  FiCheckCircle,
  FiCreditCard,
  FiBriefcase,
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

import GlobalModal from "@/components/common/GlobalModal";

import cancellationApi, {
  CancellationListItem,
  CancellationStatus,
} from "../../api/endpoints/cancellationApi";

// =====================================================
// ANIMATIONS
// =====================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

// =====================================================
// TYPES
// =====================================================

type CancellationFilterTab =
  | "All"
  | "pending"
  | "approved"
  | "rejected";

interface ActionLoading {
  type: "approve" | "reject" | null;
  id: number | null;
}

// =====================================================
// HELPERS
// =====================================================

const deriveStatus = (row: any): CancellationStatus => {
  if (!row) return "pending";

  if (
    row.status === "pending" ||
    row.status === "approved" ||
    row.status === "rejected"
  ) {
    return row.status;
  }

  if (row.rejected_at) return "rejected";
  if (row.approved_at) return "approved";
  if (row.paid_at) return "approved";

  if (
    row.delivery_status === "cancel_pending" ||
    row.delivery_status === "cancellation_requested"
  ) {
    return "pending";
  }

  if (
    row.delivery_status === "cancelled" ||
    row.cancelled_at
  ) {
    return "approved";
  }

  return "pending";
};

const getRowAmount = (row: any): number => {
  if (!row) return 0;

  if (row.refund_amount != null)
    return Number(row.refund_amount);

  if (row.amount != null) return Number(row.amount);

  if (row.line_total != null)
    return Number(row.line_total);

  if (row.unit_price != null && row.quantity != null)
    return Number(row.unit_price) * Number(row.quantity);

  return 0;
};

const getStatusLabel = (status: string) => {
  if (!status) return "N/A";
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const getStatusClass = (status: string) => {
  switch (status) {
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "approved":
      return "border-[#4C8A57]/25 bg-[#EAF3EA] text-[#163F20]";
    case "rejected":
      return "border-red-200 bg-red-50 text-[#C23B32]";
    default:
      return "border-[#D8E2D8] bg-[#F5F7F5] text-[#59645C]";
  }
};

const getStatusDot = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-amber-500";
    case "approved":
      return "bg-[#4C8A57]";
    case "rejected":
      return "bg-[#C23B32]";
    default:
      return "bg-[#9AA29C]";
  }
};

const formatDate = (date?: string | null) => {
  if (!date) return "—";
  const parsed = new Date(date.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (
  amount?: number | string | null
) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getCustomerName = (
  user?: {
    name?: string | null;
    full_name?: string | null;
    email?: string;
  } | null
) => {
  if (!user) return "Customer";
  if (user.full_name?.trim()) return user.full_name;
  if (user.name?.trim()) return user.name;
  if (user.email) return user.email.split("@")[0];
  return "Customer";
};

const getCancellationAmount = (row: any) => {
  if (!row) return 0;
  return Number(
    row.refund_amount ??
      row.amount ??
      row.line_total ??
      (row.unit_price && row.quantity
        ? Number(row.unit_price) * Number(row.quantity)
        : 0) ??
      0
  );
};

// =====================================================
// ACCOUNT TYPE HELPERS
// =====================================================

const getAccountTypeLabel = (
  accountType?: string | null
) => {
  if (!accountType) return "Customer";

  return accountType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getAccountTypeClass = (
  accountType?: string | null
) => {
  switch (accountType) {
    case "distributor":
      return "border-purple-200 bg-purple-50 text-purple-700";

    case "retailer":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "wholesaler":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";

    case "customer":
      return "border-[#D8E2D8] bg-[#F5F7F5] text-[#59645C]";

    default:
      return "border-[#D8E2D8] bg-[#F5F7F5] text-[#59645C]";
  }
};


const getRowAccountType = (row: any): string => {
  if (!row) return "customer";

  return (
    row.user?.account_type ||
    row.order?.user?.account_type ||
    row.order?.order_type ||
    "customer"
  );
};

// =====================================================
// STAT CARD
// =====================================================

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  loading?: boolean;
}

const CancellationStatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  loading = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -4,
        boxShadow:
          "0 16px 30px -18px rgba(22,63,32,0.28)",
      }}
      className="relative min-h-[150px] overflow-hidden rounded-2xl border border-[#163F20]/10 bg-white p-5 shadow-sm"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full border border-[#4C8A57]/15" />
      <div className="pointer-events-none absolute -right-3 -top-3 h-14 w-14 rounded-full border border-[#163F20]/10" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
            {title}
          </p>

          {loading ? (
            <div className="mt-3 h-9 w-16 animate-pulse rounded-lg bg-[#EAF3EA]" />
          ) : (
            <p className="mt-3 text-4xl font-bold leading-none text-[#202721]">
              {value.toLocaleString("en-IN")}
            </p>
          )}

          <p className="mt-2 text-xs text-[#9AA29C]">
            {subtitle}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

// =====================================================
// REJECT POPUP
// =====================================================

interface RejectPopupProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: (
    rejectionReason: string,
    adminNotes: string
  ) => void;
}

const RejectPopup: React.FC<RejectPopupProps> = ({
  open,
  loading,
  onClose,
  onConfirm,
}) => {
  const [rejectionReason, setRejectionReason] =
    useState("");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    if (open) {
      setRejectionReason("");
      setAdminNotes("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={!loading}
    >
      <div className="w-full max-w-[500px] overflow-hidden rounded-2xl border border-[#163F20]/10 bg-white shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-[#163F20] to-[#C23B32]" />

        <div className="flex items-start justify-between border-b border-[#D8E2D8] px-5 py-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#C23B32]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#C23B32]">
                Cancellation Review
              </span>
            </div>

            <h2 className="text-lg font-bold text-[#202721]">
              Reject Cancellation
            </h2>

            <p className="mt-1 text-xs text-[#9AA29C]">
              Enter the reason for rejecting this request.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] text-[#59645C] disabled:opacity-50"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#59645C]">
              Rejection Reason{" "}
              <span className="text-[#C23B32]">*</span>
            </label>

            <textarea
              value={rejectionReason}
              onChange={(e) =>
                setRejectionReason(e.target.value)
              }
              rows={4}
              placeholder="Enter rejection reason..."
              className="w-full resize-none rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] px-4 py-3 text-sm text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#4C8A57] focus:bg-white focus:ring-2 focus:ring-[#4C8A57]/15"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#D8E2D8] bg-[#FAFBFA] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-[#D8E2D8] bg-white px-5 py-2.5 text-sm font-semibold text-[#59645C] transition hover:bg-[#F5F7F5] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={
              loading || !rejectionReason.trim()
            }
            onClick={() =>
              onConfirm(
                rejectionReason.trim(),
                adminNotes.trim()
              )
            }
            className="flex items-center gap-2 rounded-xl bg-[#C23B32] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#a8322b] disabled:opacity-50"
          >
            {loading && (
              <FiRefreshCw
                size={14}
                className="animate-spin"
              />
            )}
            Reject Cancellation
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// PAY POPUP (used on Approve)
// =====================================================

interface PayPopupProps {
  open: boolean;
  orderLineId: number | null;
  orderReference: string;
  customerName: string;
  defaultAmount: number;
  loading: boolean;
  onClose: () => void;
  onConfirm: (amount: number, adminNotes: string) => void;
}

const PayPopup: React.FC<PayPopupProps> = ({
  open,
  orderLineId,
  orderReference,
  customerName,
  defaultAmount,
  loading,
  onClose,
  onConfirm,
}) => {
  const [amount, setAmount] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    if (open) {
      setAmount(
        defaultAmount > 0
          ? defaultAmount.toFixed(2)
          : ""
      );
      setAdminNotes("");
    }
  }, [open, defaultAmount]);

  if (!open) return null;

  const numericAmount = Number(amount);
  const isValid =
    Number.isFinite(numericAmount) &&
    numericAmount > 0;

  return (
    <GlobalModal
      isOpen={open}
      onClose={() => {
        if (!loading) onClose();
      }}
      closeOnOverlayClick={!loading}
    >
      <div className="w-full max-w-[470px] overflow-hidden rounded-2xl border border-[#163F20]/10 bg-white shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-[#4C8A57] to-[#163F20]" />

        <div className="flex items-start justify-between gap-4 border-b border-[#D8E2D8] px-5 py-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#4C8A57]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#163F20]">
                Approve Cancellation
              </span>
            </div>

            <h2 className="text-lg font-bold text-[#202721]">
              Pay Cancellation Amount
            </h2>

            <p className="mt-1 text-xs text-[#9AA29C]">
              Enter the amount to be refunded to the customer.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] text-[#59645C] transition hover:bg-[#EAF3EA] disabled:opacity-50"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] p-4">
            <div className="flex justify-between gap-4">
              <span className="text-xs text-[#9AA29C]">
                Order
              </span>
              <span className="text-right text-sm font-bold text-[#202721]">
                {orderReference}
              </span>
            </div>

            <div className="mt-3 flex justify-between gap-4 border-t border-[#D8E2D8] pt-3">
              <span className="text-xs text-[#9AA29C]">
                Customer
              </span>
              <span className="text-right text-sm font-semibold text-[#202721]">
                {customerName}
              </span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#59645C]">
              Payment Amount{" "}
              <span className="text-[#C23B32]">*</span>
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#163F20]">
                ₹
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value)
                }
                placeholder="Enter amount"
                disabled={loading}
                className="w-full rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] py-3 pl-9 pr-4 text-base font-bold text-[#202721] outline-none transition focus:border-[#4C8A57] focus:bg-white focus:ring-2 focus:ring-[#4C8A57]/15 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Admin Notes Field */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#59645C]">
              Admin Notes (Optional)
            </label>

            <textarea
              value={adminNotes}
              onChange={(e) =>
                setAdminNotes(e.target.value)
              }
              rows={3}
              placeholder="Add any internal notes..."
              disabled={loading}
              className="w-full resize-none rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] px-4 py-3 text-sm text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#4C8A57] focus:bg-white focus:ring-2 focus:ring-[#4C8A57]/15 disabled:opacity-60"
            />
          </div>

          <div className="rounded-xl border border-[#4C8A57]/20 bg-[#EAF3EA] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#163F20]">
                <FiCreditCard size={17} />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#4C8A57]">
                  Amount To Pay
                </p>
                <p className="mt-1 text-xl font-bold text-[#163F20]">
                  {formatCurrency(numericAmount)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#D8E2D8] bg-[#FAFBFA] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-[#D8E2D8] bg-white px-5 py-2.5 text-sm font-semibold text-[#59645C] transition hover:bg-[#F5F7F5] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading || !isValid}
            onClick={() =>
              onConfirm(numericAmount, adminNotes.trim())
            }
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4C8A57] to-[#163F20] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#163F20]/15 transition hover:from-[#3f7749] hover:to-[#0F3219] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <FiRefreshCw
                size={15}
                className="animate-spin"
              />
            ) : (
              <FiCheck size={15} />
            )}
            {loading ? "Processing..." : "Approve & Pay"}
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// DETAIL MODAL
// =====================================================

interface CancellationDetailModalProps {
  open: boolean;
  detail: CancellationListItem | null;
  actionLoading: ActionLoading;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

const CancellationDetailModal: React.FC<
  CancellationDetailModalProps
> = ({
  open,
  detail,
  actionLoading,
  onClose,
  onApprove,
  onReject,
}) => {
  if (!open) return null;

  if (!detail) {
    return (
      <GlobalModal
        isOpen={open}
        onClose={onClose}
        closeOnOverlayClick={false}
      >
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#163F20]/10 bg-white shadow-2xl">
          <div className="h-1 w-full bg-gradient-to-r from-[#4C8A57] to-[#163F20]" />
          <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-[#C23B32]">
              <FiAlertCircle size={28} />
            </div>
            <p className="mt-4 text-sm font-bold text-[#C23B32]">
              Cancellation details not found.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 rounded-xl bg-gradient-to-r from-[#4C8A57] to-[#163F20] px-6 py-2.5 text-sm font-bold text-white"
            >
              Close
            </button>
          </div>
        </div>
      </GlobalModal>
    );
  }

  const raw: any = detail;
  const amount = getCancellationAmount(raw);
  const status =
    detail.status || deriveStatus(raw);
 
  const orderReference =
    raw.order_reference ||
    raw.order?.order_reference ||
    "N/A";

  const customer = {
    full_name:
      raw.user?.full_name ||
      raw.order?.user?.full_name ||
      raw.order?.user?.name ||
      null,
    name:
      raw.user?.name ||
      raw.order?.user?.name ||
      null,
    email:
      raw.user?.email ||
      raw.order?.user?.email ||
      "",
    phone:
      raw.user?.phone ||
      raw.order?.user?.phone ||
      "",
  };

  const accountType = getRowAccountType(raw);

  const quantity = Number(
    raw.quantity ?? 1
  );
  const unitPrice = Number(
    raw.unit_price ?? 0
  );
  const subtotal =
    raw.subtotal ??
    unitPrice * quantity;
  const tax =
    raw.tax ??
    raw.gst_amount ??
    raw.igst_amount ??
    0;
  const reason =
    raw.reason ??
    raw.cancellation_reason ??
    "No reason provided.";
  const itemReference =
    raw.item_reference_id || "N/A";

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={false}
    >
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#163F20]/10 bg-white shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-[#4C8A57] to-[#163F20]" />

        <div className="flex items-start justify-between gap-4 border-b border-[#D8E2D8] px-5 py-4 sm:px-6">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#4C8A57]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#163F20]">
                Cancellation Requests
              </span>
            </div>

            <h2 className="text-xl font-bold text-[#202721]">
              Cancellation Request
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#9AA29C]">
              <span>Item Ref: {itemReference}</span>
              {orderReference !== "N/A" && (
                <>
                  <span>•</span>
                  <span>{orderReference}</span>
                </>
              )}
              {raw.created_at && (
                <>
                  <span>•</span>
                  <span>
                    {formatDate(raw.created_at)}
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] text-[#59645C] transition hover:bg-[#EAF3EA] hover:text-[#163F20]"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="max-h-[calc(95vh-185px)] overflow-y-auto p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#D8E2D8] bg-[#F5F7F5] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                Status
              </p>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusClass(
                    status
                  )}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${getStatusDot(
                      status
                    )}`}
                  />
                  {getStatusLabel(status)}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#4C8A57]/20 bg-gradient-to-br from-[#EAF3EA] to-[#f4f8f4] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#4C8A57]">
                Cancellation Amount
              </p>
              <p className="mt-1 text-2xl font-bold text-[#163F20]">
                {formatCurrency(amount)}
              </p>
            </div>

            <div className="rounded-2xl border border-[#D8E2D8] bg-[#F5F7F5] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                Quantity
              </p>
              <p className="mt-1 text-2xl font-bold text-[#202721]">
                {quantity}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#D8E2D8] bg-[#F5F7F5] p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                  <FiUser size={17} />
                </div>
                <h3 className="text-sm font-bold text-[#202721]">
                  Customer Information
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between gap-4 border-b border-[#D8E2D8] pb-2.5">
                  <span className="text-xs text-[#9AA29C]">
                    Name
                  </span>
                  <span className="text-right text-sm font-semibold text-[#202721]">
                    {getCustomerName(customer)}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4 border-b border-[#D8E2D8] pb-2.5">
                  <span className="shrink-0 text-xs text-[#9AA29C]">
                    Email
                  </span>
                  <div className="min-w-0 text-right">
                    <p className="truncate text-sm font-semibold text-[#202721]">
                      {customer.email || "N/A"}
                    </p>
                    <span
                      className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getAccountTypeClass(
                        accountType
                      )}`}
                    >
                      <FiBriefcase size={10} />
                      {getAccountTypeLabel(accountType)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-xs text-[#9AA29C]">
                    Phone
                  </span>
                  <span className="text-sm font-semibold text-[#202721]">
                    {customer.phone || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#D8E2D8] bg-[#F5F7F5] p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                  <FiPackage size={17} />
                </div>
                <h3 className="text-sm font-bold text-[#202721]">
                  Order Information
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between gap-4 border-b border-[#D8E2D8] pb-2.5">
                  <span className="text-xs text-[#9AA29C]">
                    Order Reference
                  </span>
                  <span className="text-right text-sm font-bold text-[#163F20]">
                    {orderReference}
                  </span>
                </div>

                <div className="flex justify-between gap-4 border-b border-[#D8E2D8] pb-2.5">
                  <span className="text-xs text-[#9AA29C]">
                    Item Reference
                  </span>
                  <span className="text-sm font-semibold text-[#202721]">
                    {itemReference}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-xs text-[#9AA29C]">
                    Delivery Status
                  </span>
                  <span className="text-sm font-semibold capitalize text-[#202721]">
                    {getStatusLabel(
                      raw.delivery_status || "N/A"
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-[#D8E2D8]">
            <div className="border-b border-[#D8E2D8] bg-[#FAFBFA] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                  <FiPackage size={17} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#202721]">
                    Cancellation Item
                  </h3>
                  <p className="mt-0.5 text-xs text-[#9AA29C]">
                    {quantity} item(s)
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-start gap-4">
                {raw.product?.image ? (
                  <img
                    src={raw.product.image}
                    alt={raw.product.name}
                    className="h-16 w-16 shrink-0 rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] text-[#4C8A57]">
                    <FiPackage size={22} />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-[#202721]">
                    {raw.product?.name ||
                      "Cancellation Item"}
                  </h4>
                  <p className="mt-1 text-xs text-[#9AA29C]">
                    SKU:{" "}
                    {raw.product?.product_code ||
                      "N/A"}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#163F20]">
                    Qty: {quantity}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                    Unit Price
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#202721]">
                    {formatCurrency(unitPrice)}
                  </p>
                </div>

                <div className="rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                    Subtotal
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#202721]">
                    {formatCurrency(subtotal)}
                  </p>
                </div>

                <div className="rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                    Tax
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#202721]">
                    {formatCurrency(tax)}
                  </p>
                </div>

                <div className="rounded-xl border border-[#4C8A57]/20 bg-[#EAF3EA] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#4C8A57]">
                    Reason
                  </p>
                  <p className="mt-1 line-clamp-3 text-xs font-semibold text-[#59645C]">
                    {reason}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-[#D8E2D8] bg-[#F5F7F5] p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                <FiCreditCard size={17} />
              </div>
              <h3 className="text-sm font-bold text-[#202721]">
                Cancellation Payment Summary
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-[#D8E2D8] bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                  Subtotal
                </p>
                <p className="mt-1 text-base font-bold text-[#202721]">
                  {formatCurrency(subtotal)}
                </p>
              </div>

              <div className="rounded-xl border border-[#D8E2D8] bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                  Tax
                </p>
                <p className="mt-1 text-base font-bold text-[#202721]">
                  {formatCurrency(tax)}
                </p>
              </div>

              <div className="rounded-xl border border-[#D8E2D8] bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                  Shipping
                </p>
                <p className="mt-1 text-base font-bold text-[#202721]">
                  {formatCurrency(
                    raw.shipping_charge
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-[#4C8A57]/20 bg-gradient-to-br from-[#EAF3EA] to-[#f4f8f4] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#4C8A57]">
                  Pay Amount
                </p>
                <p className="mt-1 text-xl font-bold text-[#163F20]">
                  {formatCurrency(amount)}
                </p>
              </div>
            </div>
          </div>

          {/* CANCELLATION TIMELINE */}
          <div className="mt-5 rounded-2xl border border-[#D8E2D8] bg-[#F5F7F5] p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                <FiCalendar size={17} />
              </div>
              <h3 className="text-sm font-bold text-[#202721]">
                Cancellation Timeline
              </h3>
            </div>

            <div className="space-y-5">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EAF3EA]">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#4C8A57]" />
                  </div>
                </div>
                <div className="pt-1">
                  <p className="text-sm font-bold text-[#202721]">
                    Cancellation Requested
                  </p>
                  <p className="mt-1 text-xs text-[#9AA29C]">
                    {formatDate(
                      raw.cancellation_requested_at ||
                        raw.created_at
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {raw.admin_notes && (
            <div className="mt-5 rounded-2xl border border-[#D8E2D8] bg-[#F5F7F5] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                Admin Notes
              </p>
              <p className="mt-2 text-sm leading-6 text-[#59645C]">
                {raw.admin_notes}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-[#D8E2D8] bg-[#FAFBFA] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#D8E2D8] bg-white px-5 py-2.5 text-sm font-semibold text-[#59645C] transition hover:bg-[#F5F7F5] hover:text-[#163F20]"
            >
              Close
            </button>

            <div className="flex flex-wrap justify-end gap-2">
              {(detail.can_approve ??
                status === "pending") && (
                <button
                  type="button"
                  onClick={onApprove}
                  disabled={
                    actionLoading.type === "approve"
                  }
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4C8A57] to-[#163F20] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#163F20]/15 transition hover:from-[#3f7749] hover:to-[#0F3219] disabled:opacity-50"
                >
                  {actionLoading.type ===
                  "approve" ? (
                    <FiRefreshCw
                      size={14}
                      className="animate-spin"
                    />
                  ) : (
                    <FiCheck size={14} />
                  )}
                  Approve
                </button>
              )}

              {(detail.can_reject ??
                status === "pending") && (
                <button
                  type="button"
                  onClick={onReject}
                  disabled={
                    actionLoading.type === "reject"
                  }
                  className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-[#C23B32] transition hover:border-[#C23B32] hover:bg-[#C23B32] hover:text-white disabled:opacity-50"
                >
                  <FiX size={14} />
                  Reject
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// MAIN
// =====================================================

const CancelRefund: React.FC = () => {
  const [requests, setRequests] = useState<
    CancellationListItem[]
  >([]);

  const [activeFilter, setActiveFilter] =
    useState<CancellationFilterTab>("All");

  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(false);

  const [selectedDetail, setSelectedDetail] =
    useState<CancellationListItem | null>(null);

  const [detailModalOpen, setDetailModalOpen] =
    useState(false);

  const [rejectModalOpen, setRejectModalOpen] =
    useState(false);

  const [payModalOpen, setPayModalOpen] =
    useState(false);

  const [selectedPayRequest, setSelectedPayRequest] =
    useState<CancellationListItem | null>(null);

  const [actionLoading, setActionLoading] =
    useState<ActionLoading>({
      type: null,
      id: null,
    });

  const ITEMS_PER_PAGE = 10;

  // =================================================
  // FETCH ALL
  // =================================================

  const fetchCancellationRequests = async () => {
    try {
      setLoading(true);

      const response = await cancellationApi.getAll(
        1,
        100,
        undefined,
        "all",
        "created_at",
        "desc"
      );

      if (response.data.success) {
        const rawList: any[] =
          response.data.data?.data || [];

        const normalized: CancellationListItem[] =
          rawList.map((row) => {
            const status = deriveStatus(row);

            return {
              ...row,
              id: row.id,
              order_line_id:
                row.order_line_id ?? row.id,
              order_reference:
                row.order?.order_reference || "N/A",
              item_reference_id:
                row.item_reference_id || "N/A",
              user: row.order?.user
                ? {
                    id: row.order.user.id,
                    name:
                      row.order.user.full_name ||
                      row.order.user.name ||
                      null,
                    email:
                      row.order.user.email || "",
                    phone:
                      row.order.user.phone || null,
                    account_type:
                      row.order.user.account_type ||
                      row.order?.order_type ||
                      null,
                  }
                : undefined,
              status,
              items_count: row.quantity ?? 1,
              refund_amount: getRowAmount(row),
              amount: getRowAmount(row),
              reason:
                row.cancellation_reason || null,
              created_at:
                row.created_at ||
                row.cancellation_requested_at ||
                "",
              can_approve: status === "pending",
              can_reject: status === "pending",
              can_pay: status === "approved",
              product: row.product,
            } as CancellationListItem;
          });

        setRequests(normalized);

        const maxPage = Math.max(
          1,
          Math.ceil(
            normalized.length / ITEMS_PER_PAGE
          )
        );

        setCurrentPage((page) =>
          Math.min(page, maxPage)
        );
      } else {
        toast.error(
          "Unable to fetch cancellation requests."
        );
      }
    } catch (error: any) {
      console.error(
        "Get cancellation requests error:",
        error
      );
      toast.error(
        error?.response?.data?.message ||
          "Unable to fetch cancellation requests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCancellationRequests();
  }, []);

  // =================================================
  // STATS
  // =================================================

  const stats = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter(
        (i) => i.status === "pending"
      ).length,
      approved: requests.filter(
        (i) => i.status === "approved"
      ).length,
      rejected: requests.filter(
        (i) => i.status === "rejected"
      ).length,
    }),
    [requests]
  );

  // =================================================
  // FILTER
  // =================================================

  const filteredRequests = useMemo(() => {
    const query = searchQuery
      .trim()
      .toLowerCase();

    return requests.filter((request) => {
      const matchesSearch =
        !query ||
        [
          request.order_reference,
          (request as any).item_reference_id ||
            "",
          request.user?.name || "",
          request.user?.email || "",
          request.user?.account_type || "",
          request.reason || "",
          String(request.order_line_id),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        activeFilter === "All" ||
        request.status === activeFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, activeFilter]);

  // =================================================
  // PAGINATION
  // =================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredRequests.length / ITEMS_PER_PAGE
    )
  );

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedRequests = filteredRequests.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const startEntry =
    filteredRequests.length === 0
      ? 0
      : startIndex + 1;

  const endEntry = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredRequests.length
  );

  const paginationPages = Array.from(
    { length: totalPages },
    (_, i) => i + 1
  );

  // =================================================
  // VIEW
  // =================================================

  const handleView = (request: CancellationListItem) => {
    setSelectedDetail(request);
    setDetailModalOpen(true);
  };

  // =================================================
  // APPROVE (opens Pay popup)
  // =================================================

  const handleOpenApprove = (
    request: CancellationListItem
  ) => {
    setSelectedPayRequest(request);
    setPayModalOpen(true);
  };

  const handleApproveWithPay = async (
    amount: number,
    adminNotes: string
  ) => {
    const orderLineId =
      selectedPayRequest?.order_line_id;

    if (!orderLineId) {
      toast.error("Cancellation request not found.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(
        "Please enter a valid payment amount."
      );
      return;
    }

    try {
      setActionLoading({
        type: "approve",
        id: orderLineId,
      });

      const response =
        await cancellationApi.approve(
          orderLineId,
          {
            refund_amount: amount,
            admin_notes: adminNotes || undefined,
          }
        );

      if (response.data.success) {
        toast.success(
          response.data.message ||
            "Cancellation approved successfully."
        );
        setPayModalOpen(false);
        await fetchCancellationRequests();

        if (
          selectedDetail?.order_line_id ===
          orderLineId
        ) {
          const updated =
            requests.find(
              (r) => r.order_line_id === orderLineId
            ) || null;
          setSelectedDetail(updated);
        }
      } else {
        toast.error(
          response.data.message ||
            "Unable to approve cancellation."
        );
      }
    } catch (error: any) {
      console.error(
        "Approve cancellation error:",
        error
      );
      toast.error(
        error?.response?.data?.message ||
          "Unable to approve cancellation."
      );
    } finally {
      setActionLoading({ type: null, id: null });
    }
  };

  // =================================================
  // REJECT
  // =================================================

  const handleOpenReject = (
    request: CancellationListItem
  ) => {
    setSelectedDetail(request);
    setRejectModalOpen(true);
  };

  const handleReject = async (
    rejectionReason: string,
    adminNotes: string
  ) => {
    const orderLineId =
      selectedDetail?.order_line_id;

    if (!orderLineId) return;

    try {
      setActionLoading({
        type: "reject",
        id: orderLineId,
      });

      const response = await cancellationApi.reject(
        orderLineId,
        rejectionReason,
        adminNotes || undefined
      );

      if (response.data.success) {
        toast.success(
          response.data.message ||
            "Cancellation rejected successfully."
        );
        setRejectModalOpen(false);
        setDetailModalOpen(false);
        await fetchCancellationRequests();
      } else {
        toast.error(
          response.data.message ||
            "Unable to reject cancellation."
        );
      }
    } catch (error: any) {
      console.error(
        "Reject cancellation error:",
        error
      );
      toast.error(
        error?.response?.data?.message ||
          "Unable to reject cancellation."
      );
    } finally {
      setActionLoading({ type: null, id: null });
    }
  };

  // =================================================
  // REFRESH
  // =================================================

  const handleRefresh = async () => {
    await fetchCancellationRequests();
    toast.success(
      "Cancellation requests refreshed."
    );
  };

  const handleFilterChange = (
    filter: CancellationFilterTab
  ) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // =================================================
  // RENDER
  // =================================================

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full p-4"
      >
        <motion.div
          variants={itemVariants}
          className="mb-6"
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4C8A57]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#163F20]">
                  Order Management
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-[#202721] sm:text-3xl">
                Cancellation Requests
              </h1>

              <p className="mt-1 text-sm text-[#9AA29C]">
                Review, approve, reject and pay customer
                cancellation requests.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="flex w-fit items-center gap-2 rounded-xl border border-[#D8E2D8] bg-white px-4 py-2.5 text-xs font-bold text-[#163F20] transition hover:bg-[#EAF3EA] disabled:opacity-50"
            >
              <FiRefreshCw
                size={14}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <CancellationStatCard
            title="Total Requests"
            value={stats.total}
            subtitle="All cancellation requests"
            icon={<FiPackage size={19} />}
            loading={loading}
          />
          <CancellationStatCard
            title="Pending"
            value={stats.pending}
            subtitle="Waiting for review"
            icon={<FiCalendar size={19} />}
            loading={loading}
          />
          <CancellationStatCard
            title="Approved"
            value={stats.approved}
            subtitle="Approved requests"
            icon={<FiCheckCircle size={19} />}
            loading={loading}
          />
          <CancellationStatCard
            title="Rejected"
            value={stats.rejected}
            subtitle="Rejected requests"
            icon={<FiX size={19} />}
            loading={loading}
          />
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mb-5 overflow-hidden rounded-2xl border border-[#163F20]/10 bg-white shadow-sm"
        >
          <div className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full xl:max-w-md">
                <FiSearch
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9AA29C]"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) =>
                    handleSearchChange(e.target.value)
                  }
                  placeholder="Search order, customer, email..."
                  disabled={loading}
                  className="w-full rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] py-3 pl-11 pr-4 text-sm text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#4C8A57] focus:bg-white focus:ring-2 focus:ring-[#4C8A57]/15 disabled:opacity-60"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {(
                  [
                    "All",
                    "pending",
                    "approved",
                    "rejected",
                  ] as CancellationFilterTab[]
                ).map((filter) => {
                  const count =
                    filter === "All"
                      ? requests.length
                      : requests.filter(
                          (item) =>
                            item.status === filter
                        ).length;

                  return (
                    <button
                      key={filter}
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        handleFilterChange(filter)
                      }
                      className={`rounded-xl px-3.5 py-2 text-[11px] font-bold transition disabled:opacity-60 ${
                        activeFilter === filter
                          ? "bg-gradient-to-br from-[#4C8A57] to-[#163F20] text-white shadow-md shadow-[#163F20]/15"
                          : "border border-[#D8E2D8] bg-[#F5F7F5] text-[#59645C] hover:bg-[#EAF3EA] hover:text-[#163F20]"
                      }`}
                    >
                      {getStatusLabel(filter)}
                      <span className="ml-1.5 opacity-80">
                        ({count})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="overflow-hidden rounded-2xl border border-[#163F20]/10 bg-white shadow-sm"
        >
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1050px]">
              <thead>
                <tr className="bg-[#163F20]">
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-white">
                    S.No.
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-white">
                    Order Reference
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-white">
                    Buyer
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-white">
                    Quantity
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-white">
                    Cancellation Amount
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-white">
                    Reason
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-white">
                    Status
                  </th>
                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-white">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#D8E2D8]">
                {loading ? (
                  // ================= SKELETON LOADING =================
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="animate-pulse">
                      <td className="px-5 py-4">
                        <div className="h-8 w-8 rounded-lg bg-[#EAF3EA]" />
                      </td>
                      <td className="px-5 py-4">
                        <div className="h-6 w-32 rounded-lg bg-[#EAF3EA]" />
                        <div className="mt-2 h-3 w-24 rounded bg-[#F5F7F5]" />
                      </td>
                      <td className="px-5 py-4">
                        <div className="h-4 w-32 rounded bg-[#EAF3EA]" />
                        <div className="mt-2 h-3 w-40 rounded bg-[#F5F7F5]" />
                        <div className="mt-2 h-4 w-20 rounded-full bg-[#F5F7F5]" />
                      </td>
                      <td className="px-5 py-4">
                        <div className="h-4 w-8 rounded bg-[#EAF3EA]" />
                      </td>
                      <td className="px-5 py-4">
                        <div className="h-4 w-20 rounded bg-[#EAF3EA]" />
                      </td>
                      <td className="px-5 py-4">
                        <div className="h-3 w-40 rounded bg-[#F5F7F5]" />
                        <div className="mt-2 h-3 w-32 rounded bg-[#F5F7F5]" />
                      </td>
                      <td className="px-5 py-4">
                        <div className="h-6 w-24 rounded-full bg-[#EAF3EA]" />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-2">
                          <div className="h-9 w-9 rounded-xl bg-[#EAF3EA]" />
                          <div className="h-9 w-20 rounded-xl bg-[#EAF3EA]" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : paginatedRequests.length > 0 ? (
                  paginatedRequests.map(
                    (request, index) => {
                      const requestId =
                        request.order_line_id;
                      const raw: any = request;

                      const isApproveLoading =
                        actionLoading.type ===
                          "approve" &&
                        actionLoading.id === requestId;

                      const amount =
                        getRowAmount(request);

                      const accountType =
                        getRowAccountType(raw);

                      return (
                        <tr
                          key={`${requestId}-${index}`}
                          className="transition hover:bg-[#FAFBFA]"
                        >
                          <td className="px-5 py-4">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F7F5] text-xs font-bold text-[#163F20]">
                              {startIndex + index + 1}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div>
                              <span className="inline-flex rounded-lg bg-[#EAF3EA] px-2.5 py-1 text-xs font-bold text-[#163F20]">
                                {request.order_reference}
                              </span>
                              <p className="mt-2 text-[11px] text-[#9AA29C]">
                                Item Ref:{" "}
                                {raw.item_reference_id ||
                                  "N/A"}
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-[#202721]">
                              {getCustomerName(
                                request.user
                              )}
                            </p>
                            <span
                              className={`mt-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold ${getAccountTypeClass(
                                accountType
                              )}`}
                            >
                              <FiBriefcase size={9} />
                              {getAccountTypeLabel(
                                accountType
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-[#202721]">
                              {request.items_count || 1}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-[#163F20]">
                              {formatCurrency(amount)}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="max-w-[230px] line-clamp-2 text-xs leading-5 text-[#59645C]">
                              {request.reason ||
                                "No reason provided."}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${getStatusClass(
                                request.status
                              )}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${getStatusDot(
                                  request.status
                                )}`}
                              />
                              {getStatusLabel(
                                request.status
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex flex-nowrap items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleView(request)
                                }
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] text-[#163F20] transition hover:border-[#163F20] hover:bg-[#163F20] hover:text-white"
                                title="View"
                              >
                                <FiEye size={15} />
                              </button>

                              {request.can_approve && (
                                <button
                                  type="button"
                                  disabled={isApproveLoading}
                                  onClick={() =>
                                    handleOpenApprove(
                                      request
                                    )
                                  }
                                  className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#4C8A57] to-[#163F20] px-3 text-[10px] font-bold text-white shadow-sm transition hover:from-[#3f7749] hover:to-[#0F3219] disabled:opacity-50"
                                >
                                  {isApproveLoading ? (
                                    <FiRefreshCw
                                      size={13}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <FiCheck size={13} />
                                  )}
                                  Approve
                                </button>
                              )}

                              {request.can_reject && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenReject(
                                      request
                                    )
                                  }
                                  className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 text-[10px] font-bold text-[#C23B32] transition hover:border-[#C23B32] hover:bg-[#C23B32] hover:text-white"
                                >
                                  <FiX size={13} />
                                  Reject
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F7F5] text-[#4C8A57]">
                          <FiPackage size={24} />
                        </div>
                        <p className="mt-4 text-sm font-bold text-[#202721]">
                          No cancellation requests found
                        </p>
                        <p className="mt-1 text-xs text-[#9AA29C]">
                          Try changing your search or status
                          filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="block lg:hidden">
            {loading ? (
              // ================= MOBILE SKELETON =================
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`mob-skeleton-${i}`}
                  className="animate-pulse border-b border-[#D8E2D8] bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="h-6 w-32 rounded-lg bg-[#EAF3EA]" />
                    <div className="h-8 w-8 rounded-lg bg-[#EAF3EA]" />
                  </div>
                  <div className="mt-4">
                    <div className="h-4 w-28 rounded bg-[#EAF3EA]" />
                    <div className="mt-2 h-3 w-40 rounded bg-[#F5F7F5]" />
                    <div className="mt-2 h-4 w-20 rounded-full bg-[#F5F7F5]" />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="h-16 rounded-xl bg-[#EAF3EA]" />
                    <div className="h-16 rounded-xl bg-[#EAF3EA]" />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <div className="h-9 w-9 rounded-xl bg-[#EAF3EA]" />
                    <div className="h-9 w-9 rounded-xl bg-[#EAF3EA]" />
                  </div>
                </div>
              ))
            ) : paginatedRequests.length > 0 ? (
              paginatedRequests.map((request, index) => {
                const requestId =
                  request.order_line_id;
                const raw: any = request;

                const isApproveLoading =
                  actionLoading.type === "approve" &&
                  actionLoading.id === requestId;

                const accountType =
                  getRowAccountType(raw);

                return (
                  <div
                    key={`${requestId}-${index}`}
                    className="border-b border-[#D8E2D8] bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-flex rounded-lg bg-[#EAF3EA] px-2.5 py-1 text-xs font-bold text-[#163F20]">
                          {request.order_reference}
                        </span>
                        <p className="mt-2 text-[10px] text-[#9AA29C]">
                          Item Ref:{" "}
                          {raw.item_reference_id || "N/A"}
                        </p>
                      </div>

                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F7F5] text-xs font-bold text-[#163F20]">
                        {startIndex + index + 1}
                      </span>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-bold text-[#202721]">
                        {getCustomerName(request.user)}
                      </p>
                      <p className="mt-1 truncate text-xs text-[#9AA29C]">
                        {request.user?.email}
                      </p>
                      <span
                        className={`mt-1.5 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getAccountTypeClass(
                          accountType
                        )}`}
                      >
                        <FiBriefcase size={10} />
                        {getAccountTypeLabel(accountType)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                          Amount
                        </p>
                        <p className="mt-1 text-base font-bold text-[#163F20]">
                          {formatCurrency(
                            getRowAmount(request)
                          )}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                          Items
                        </p>
                        <p className="mt-1 text-base font-bold text-[#202721]">
                          {request.items_count}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${getStatusClass(
                          request.status
                        )}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${getStatusDot(
                            request.status
                          )}`}
                        />
                        {getStatusLabel(request.status)}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleView(request)
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] text-[#163F20]"
                        title="View"
                      >
                        <FiEye size={15} />
                      </button>

                      {request.can_approve && (
                        <button
                          type="button"
                          disabled={isApproveLoading}
                          onClick={() =>
                            handleOpenApprove(request)
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4C8A57] text-white disabled:opacity-50"
                          title="Approve"
                        >
                          {isApproveLoading ? (
                            <FiRefreshCw
                              size={15}
                              className="animate-spin"
                            />
                          ) : (
                            <FiCheck size={15} />
                          )}
                        </button>
                      )}

                      {request.can_reject && (
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenReject(request)
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-[#C23B32]"
                          title="Reject"
                        >
                          <FiX size={15} />
                        </button>
                      )}
                    </div>

                    <div className="mt-3 rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] p-3">
                      <p className="text-xs leading-5 text-[#59645C]">
                        {request.reason ||
                          "No reason provided."}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center px-5 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F7F5] text-[#4C8A57]">
                  <FiPackage size={24} />
                </div>
                <p className="mt-4 text-sm font-bold text-[#202721]">
                  No cancellation requests found
                </p>
                <p className="mt-1 text-xs text-[#9AA29C]">
                  Try changing your search or status filter.
                </p>
              </div>
            )}
          </div>

          {!loading && filteredRequests.length > 0 && (
            <div className="border-t border-[#D8E2D8] bg-[#FAFBFA] px-4 py-4 sm:px-5">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-xs text-[#9AA29C]">
                  Showing{" "}
                  <span className="font-bold text-[#202721]">
                    {startEntry}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-[#202721]">
                    {endEntry}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-[#202721]">
                    {filteredRequests.length}
                  </span>{" "}
                  entries
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() =>
                      handlePageChange(currentPage - 1)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8E2D8] bg-white text-[#163F20] transition hover:bg-[#EAF3EA] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronLeft size={17} />
                  </button>

                  {paginationPages.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() =>
                        handlePageChange(page)
                      }
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
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      handlePageChange(currentPage + 1)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8E2D8] bg-white text-[#163F20] transition hover:bg-[#EAF3EA] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronRight size={17} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      <CancellationDetailModal
        open={detailModalOpen}
        detail={selectedDetail}
        actionLoading={actionLoading}
        onClose={() => setDetailModalOpen(false)}
        onApprove={() => {
          if (!selectedDetail) return;
          setDetailModalOpen(false);
          handleOpenApprove(selectedDetail);
        }}
        onReject={() => {
          if (!selectedDetail) return;
          setDetailModalOpen(false);
          handleOpenReject(selectedDetail);
        }}
      />

      <RejectPopup
        open={rejectModalOpen}
        loading={actionLoading.type === "reject"}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={handleReject}
      />

      <PayPopup
        open={payModalOpen}
        orderLineId={
          selectedPayRequest?.order_line_id || null
        }
        orderReference={
          selectedPayRequest?.order_reference || "N/A"
        }
        customerName={getCustomerName(
          selectedPayRequest?.user
        )}
        defaultAmount={Number(
          selectedPayRequest?.refund_amount ||
            selectedPayRequest?.amount ||
            0
        )}
        loading={actionLoading.type === "approve"}
        onClose={() => setPayModalOpen(false)}
        onConfirm={handleApproveWithPay}
      />
    </>
  );
};

export default CancelRefund;