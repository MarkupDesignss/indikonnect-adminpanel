import React, { useEffect, useMemo, useState } from "react";

import {
  FiSearch,
  FiPackage,
  FiEye,
  FiCheck,
  FiX,
  FiTruck,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiCalendar,
  FiAlertCircle,
  FiClock,
  FiCheckCircle,
  FiCreditCard,
  FiBriefcase,
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

import GlobalModal from "@/components/common/GlobalModal";
import returnApi, {
  ReturnListItem,
  SingleReturnResponse,
} from "../../../api/endpoints/return";
import { FaRupeeSign } from "react-icons/fa";


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

type ReturnFilterTab =
  | "All"
  | "pending"
  | "approved"
  | "rejected"
  | "received"
  | "completed";

interface ActionLoading {
  type: "approve" | "reject" | "received" | null;
  id: number | null;
}

// =====================================================
// HELPERS
// =====================================================

const getStatusLabel = (status: string) => {
  if (!status) return "N/A";

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getStatusClass = (status: string) => {
  switch (status) {
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "approved":
      return "border-[#4C8A57]/25 bg-[#EAF3EA] text-[#163F20]";

    case "received":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "completed":
      return "border-[#163F20]/20 bg-[#edf5ee] text-[#0F3219]";

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

    case "received":
      return "bg-blue-500";

    case "completed":
      return "bg-[#163F20]";

    case "rejected":
      return "bg-[#C23B32]";

    default:
      return "bg-[#9AA29C]";
  }
};

const formatDate = (date?: string | null) => {
  if (!date) return "—";

  const parsed = new Date(date.replace(" ", "T"));

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (amount?: number | null) => {
  return `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const getCustomerName = (user?: {
  name?: string | null;
  email?: string;
}) => {
  if (user?.name?.trim()) {
    return user.name;
  }

  if (user?.email) {
    return user.email.split("@")[0];
  }

  return "Customer";
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

// =====================================================
// STAT CARD
// =====================================================

interface ReturnStatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  accent: string;
}

const ReturnStatCard: React.FC<ReturnStatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accent,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -4,
        boxShadow: "0 16px 30px -18px rgba(22,63,32,0.28)",
      }}
      className="relative min-h-[135px] overflow-hidden rounded-2xl border border-[#163F20]/10 bg-white p-5 shadow-sm"
    >
      <div className={`absolute left-0 top-0 h-1 w-full ${accent}`} />

      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full border border-[#4C8A57]/15" />

      <div className="pointer-events-none absolute -right-3 -top-3 h-14 w-14 rounded-full border border-[#163F20]/10" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9AA29C]">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-[#202721]">
            {value.toLocaleString("en-IN")}
          </p>

          <p className="mt-1 text-xs text-[#59645C]">{subtitle}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

// =====================================================
// APPROVE POPUP (simple confirmation — no refund amount)
// =====================================================

interface ApprovePopupProps {
  open: boolean;
  loading: boolean;
  orderReference: string;
  customerName: string;
  suggestedAmount: number;
  onClose: () => void;
  onConfirm: (adminNotes: string) => void;
}

const ApprovePopup: React.FC<ApprovePopupProps> = ({
  open,
  loading,
  orderReference,
  customerName,
  suggestedAmount,
  onClose,
  onConfirm,
}) => {
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    if (open) {
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
      <div className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-[#163F20]/10 bg-white shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-[#4C8A57] to-[#163F20]" />

        <div className="flex items-start justify-between gap-4 border-b border-[#D8E2D8] px-5 py-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#4C8A57]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#163F20]">
                Approve Return
              </span>
            </div>

            <h2 className="text-lg font-bold text-[#202721]">
              Approve Return Request
            </h2>

            <p className="mt-1 text-xs text-[#9AA29C]">
              Approve this return request. Refund will be processed when the
              item is received.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] text-[#59645C] transition hover:bg-[#EAF3EA] hover:text-[#163F20] disabled:opacity-50"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] p-4">
            <div className="flex justify-between gap-4">
              <span className="text-xs text-[#9AA29C]">Order</span>

              <span className="text-right text-sm font-bold text-[#202721]">
                {orderReference}
              </span>
            </div>

            <div className="mt-3 flex justify-between gap-4 border-t border-[#D8E2D8] pt-3">
              <span className="text-xs text-[#9AA29C]">Customer</span>

              <span className="text-right text-sm font-semibold text-[#202721]">
                {customerName}
              </span>
            </div>

            <div className="mt-3 flex justify-between gap-4 border-t border-[#D8E2D8] pt-3">
              <span className="text-xs text-[#9AA29C]">
                Estimated Refund
              </span>

              <span className="text-right text-sm font-bold text-[#163F20]">
                {formatCurrency(suggestedAmount)}
              </span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#59645C]">
              Admin Notes
            </label>

            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              placeholder="Optional internal notes..."
              className="w-full resize-none rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] px-4 py-3 text-sm text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#4C8A57] focus:bg-white focus:ring-2 focus:ring-[#4C8A57]/15"
              disabled={loading}
            />
          </div>

          <div className="rounded-xl border border-[#4C8A57]/20 bg-[#EAF3EA] p-3">
            <p className="text-xs leading-5 text-[#59645C]">
              ⚠️ By approving, this return request will be marked as approved.
              The refund will be processed once the item is received and marked
              as received.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#D8E2D8] bg-[#FAFBFA] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-[#D8E2D8] bg-white px-5 py-2.5 text-sm font-semibold text-[#59645C] transition hover:bg-[#F5F7F5] hover:text-[#163F20] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => onConfirm(adminNotes.trim())}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4C8A57] to-[#163F20] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#163F20]/15 transition hover:from-[#3f7749] hover:to-[#0F3219] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <FiRefreshCw size={15} className="animate-spin" />
            ) : (
              <FiCheck size={15} />
            )}

            {loading ? "Processing..." : "Approve Return"}
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// REJECT POPUP (admin notes only)
// =====================================================

interface RejectPopupProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: (adminNotes: string) => void;
}

const RejectPopup: React.FC<RejectPopupProps> = ({
  open,
  loading,
  onClose,
  onConfirm,
}) => {
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    if (open) {
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
                Return Review
              </span>
            </div>

            <h2 className="text-lg font-bold text-[#202721]">
              Reject Return
            </h2>

            <p className="mt-1 text-xs text-[#9AA29C]">
              Add an optional note before rejecting this request.
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
              Admin Notes
            </label>

            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
              placeholder="Optional internal notes..."
              className="w-full resize-none rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] px-4 py-3 text-sm text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#4C8A57] focus:bg-white focus:ring-2 focus:ring-[#4C8A57]/15"
              disabled={loading}
            />
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-xs leading-5 text-[#8b3a34]">
              ⚠️ Rejecting will mark this return request as rejected. The
              customer will be notified.
            </p>
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
            disabled={loading}
            onClick={() => onConfirm(adminNotes.trim())}
            className="flex items-center gap-2 rounded-xl bg-[#C23B32] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#a8322b] disabled:opacity-50"
          >
            {loading && <FiRefreshCw size={14} className="animate-spin" />}

            Reject Return
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// MARK RECEIVED & REFUND POPUP (with refund amount)
// =====================================================

interface MarkReceivedPopupProps {
  open: boolean;
  orderReference: string;
  customerName: string;
  suggestedAmount: number;
  loading: boolean;
  onClose: () => void;
  onConfirm: (refundAmount: number, adminNotes: string) => void;
}

const MarkReceivedPopup: React.FC<MarkReceivedPopupProps> = ({
  open,
  orderReference,
  customerName,
  suggestedAmount,
  loading,
  onClose,
  onConfirm,
}) => {
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    if (open) {
      setRefundAmount(
        suggestedAmount ? String(Number(suggestedAmount).toFixed(2)) : ""
      );
      setAdminNotes("");
    }
  }, [open, suggestedAmount]);

  if (!open) return null;

  const parsedAmount = parseFloat(refundAmount);
  const isValidAmount =
    !Number.isNaN(parsedAmount) && parsedAmount > 0;

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={!loading}
    >
      <div className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-[#163F20]/10 bg-white shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-[#4C8A57] to-[#163F20]" />

        <div className="flex items-start justify-between gap-4 border-b border-[#D8E2D8] px-5 py-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#4C8A57]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#163F20]">
                Mark Received & Refund
              </span>
            </div>

            <h2 className="text-lg font-bold text-[#202721]">
              Confirm Received & Process Refund
            </h2>

            <p className="mt-1 text-xs text-[#9AA29C]">
              Enter the refund amount to return to the customer.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] text-[#59645C] transition hover:bg-[#EAF3EA] hover:text-[#163F20] disabled:opacity-50"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] p-4">
            <div className="flex justify-between gap-4">
              <span className="text-xs text-[#9AA29C]">Order</span>

              <span className="text-right text-sm font-bold text-[#202721]">
                {orderReference}
              </span>
            </div>

            <div className="mt-3 flex justify-between gap-4 border-t border-[#D8E2D8] pt-3">
              <span className="text-xs text-[#9AA29C]">Customer</span>

              <span className="text-right text-sm font-semibold text-[#202721]">
                {customerName}
              </span>
            </div>

            <div className="mt-3 flex justify-between gap-4 border-t border-[#D8E2D8] pt-3">
              <span className="text-xs text-[#9AA29C]">Full Amount</span>

              <span className="text-right text-sm font-bold text-[#163F20]">
                {formatCurrency(suggestedAmount)}
              </span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#59645C]">
              Refund Amount <span className="text-[#C23B32]">*</span>
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#163F20]">
                ₹
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="Enter refund amount"
                className="h-12 w-full rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] pl-9 pr-4 text-sm font-semibold text-[#202721] outline-none transition placeholder:font-normal placeholder:text-[#9AA29C] focus:border-[#4C8A57] focus:bg-white focus:ring-2 focus:ring-[#4C8A57]/15"
                disabled={loading}
              />
            </div>

            <p className="mt-2 text-[11px] text-[#9AA29C]">
              Full amount is pre-filled. You can change it before confirming.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#59645C]">
              Admin Notes
            </label>

            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              placeholder="Optional internal notes..."
              className="w-full resize-none rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] px-4 py-3 text-sm text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#4C8A57] focus:bg-white focus:ring-2 focus:ring-[#4C8A57]/15"
              disabled={loading}
            />
          </div>

          <div className="rounded-xl border border-[#4C8A57]/20 bg-[#EAF3EA] p-3">
            <p className="text-xs leading-5 text-[#59645C]">
              ⚠️ By confirming, the return items will be marked as received and
              the entered refund amount will be sent back to the customer's
              original payment method. This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#D8E2D8] bg-[#FAFBFA] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-[#D8E2D8] bg-white px-5 py-2.5 text-sm font-semibold text-[#59645C] transition hover:bg-[#F5F7F5] hover:text-[#163F20] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading || !isValidAmount}
            onClick={() =>
              onConfirm(parsedAmount, adminNotes.trim())
            }
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4C8A57] to-[#163F20] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#163F20]/15 transition hover:from-[#3f7749] hover:to-[#0F3219] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <FiRefreshCw size={15} className="animate-spin" />
            ) : (
              <FiTruck size={15} />
            )}

            {loading ? "Processing..." : "Mark Received & Refund"}
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// DETAIL MODAL
// =====================================================

interface ReturnDetailModalProps {
  open: boolean;
  loading: boolean;
  detail: SingleReturnResponse["data"] | null;
  actionLoading: ActionLoading;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onReceived: () => void;
}

const ReturnDetailModal: React.FC<ReturnDetailModalProps> = ({
  open,
  loading,
  detail,
  actionLoading,
  onClose,
  onApprove,
  onReject,
  onReceived,
}) => {
  if (!open) return null;

  if (loading) {
    return (
      <GlobalModal
        isOpen={open}
        onClose={onClose}
        closeOnOverlayClick={false}
      >
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#163F20]/10 bg-white shadow-2xl">
          <div className="h-1 w-full bg-gradient-to-r from-[#4C8A57] to-[#163F20]" />

          <div className="flex min-h-[320px] flex-col items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#163F20]">
              <FiRefreshCw size={27} className="animate-spin" />
            </div>

            <p className="mt-4 text-sm font-bold text-[#202721]">
              Loading return details...
            </p>

            <p className="mt-1 text-xs text-[#9AA29C]">
              Please wait while we fetch the request.
            </p>
          </div>
        </div>
      </GlobalModal>
    );
  }

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
              Return details not found.
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

  const isCompleted = detail.status === "completed";

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={false}
    >
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#163F20]/10 bg-white shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-[#4C8A57] to-[#163F20]" />

        {/* HEADER */}
        <div className="flex items-start justify-between gap-4 border-b border-[#D8E2D8] px-5 py-4 sm:px-6">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#4C8A57]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#163F20]">
                Returns & Refunds
              </span>
            </div>

            <h2 className="text-xl font-bold text-[#202721]">
              Return Request
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#9AA29C]">
              <span>{detail.order?.order_reference || "—"}</span>

              <span>•</span>

              <span>{formatDate(detail.created_at)}</span>
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

        {/* BODY */}
        <div className="max-h-[calc(95vh-185px)] overflow-y-auto p-5 sm:p-6">
          {/* REFUND DETAILS (shown when completed) */}
          {isCompleted && (
            <div className=" overflow-hidden rounded-2xl border border-[#4C8A57]/25">
              <div className="flex items-center justify-between gap-3 border-b border-[#4C8A57]/20 bg-gradient-to-r from-[#EAF3EA] to-[#f4f8f4] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#163F20]">
                    <FiCreditCard size={17} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#163F20]">
                      Refund Completed
                    </h3>

                    <p className="mt-0.5 text-xs text-[#59645C]">
                      The refund has been processed successfully.
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#163F20]/20 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#163F20]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#163F20]" />
                  Refunded
                </span>
              </div>

              <div className="bg-white p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                      Refund Amount
                    </p>

                    <p className="mt-1 text-xl font-bold text-[#163F20]">
                      {formatCurrency(detail.refund_info?.amount)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                      Refund Method
                    </p>

                    <p className="mt-1 text-sm font-bold capitalize text-[#202721]">
                      {detail.refund_info?.refund_method || "Original Payment"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                      Refunded At
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#202721]">
                      {formatDate(
                        detail.refund_info?.completed_at ||
                        detail.refunded_at ||
                        detail.updated_at,
                      )}
                    </p>
                  </div>
                </div>

                {/* Refund Info Details */}
                {detail.refund_info && (
                  <div className="mt-4 space-y-3">
                    {detail.refund_info.gateway_reference && (
                      <div className="rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] p-4">
                        <div className="flex justify-between gap-4">
                          <span className="text-xs text-[#9AA29C]">Gateway Reference</span>
                          <span className="text-right text-sm font-bold text-[#202721]">
                            {detail.refund_info.gateway_reference}
                          </span>
                        </div>
                      </div>
                    )}

                    {detail.refund_info.deduction_breakdown && (
                      <div className="rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] p-4">
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                          Refund Breakdown
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between gap-4 border-b border-[#D8E2D8] pb-2">
                            <span className="text-xs text-[#59645C]">Subtotal</span>
                            <span className="text-sm font-bold text-[#202721]">
                              {formatCurrency(detail.refund_info.deduction_breakdown.gross_refund.subtotal)}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4 border-b border-[#D8E2D8] pb-2">
                            <span className="text-xs text-[#59645C]">Tax</span>
                            <span className="text-sm font-bold text-[#202721]">
                              {formatCurrency(detail.refund_info.deduction_breakdown.gross_refund.tax)}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4 border-b border-[#D8E2D8] pb-2">
                            <span className="text-xs text-[#59645C]">Shipping</span>
                            <span className="text-sm font-bold text-[#202721]">
                              {formatCurrency(detail.refund_info.deduction_breakdown.gross_refund.shipping)}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4 border-b border-[#D8E2D8] pb-2">
                            <span className="text-xs font-bold text-[#202721]">Gross Refund</span>
                            <span className="text-sm font-bold text-[#163F20]">
                              {formatCurrency(detail.refund_info.deduction_breakdown.gross_refund.total)}
                            </span>
                          </div>
                          {detail.refund_info.deduction_breakdown.deductions.map((deduction, idx) => (
                            <div key={idx} className="flex justify-between gap-4">
                              <span className="text-xs text-[#C0392B]">
                                - {deduction.label}
                              </span>
                              <span className="text-sm font-bold text-[#C0392B]">
                                -{formatCurrency(deduction.amount)}
                              </span>
                            </div>
                          ))}
                          <div className="flex justify-between gap-4 border-t border-[#D8E2D8] pt-2">
                            <span className="text-xs font-bold text-[#163F20]">Net Refund</span>
                            <span className="text-base font-bold text-[#163F20]">
                              {formatCurrency(detail.refund_info.deduction_breakdown.net_refund)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {detail.refund_info.notes && (
                      <div className="rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                          Refund Notes
                        </p>
                        <p className="mt-1 text-sm text-[#59645C]">
                          {detail.refund_info.notes}
                        </p>
                      </div>
                    )}

                    {detail.refund_info.status && (
                      <div className="rounded-xl border border-[#4C8A57]/20 bg-[#EAF3EA] p-4">
                        <div className="flex items-center gap-3">
                          <FiCheckCircle size={18} className="text-[#163F20]" />
                          <div>
                            <p className="text-sm font-bold text-[#163F20]">
                              Refund Status: {getStatusLabel(detail.refund_info.status)}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-[#59645C]">
                              Refund of{" "}
                              <span className="font-bold text-[#163F20]">
                                {formatCurrency(detail.refund_info.amount)}
                              </span>{" "}
                              has been successfully processed.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CUSTOMER + ORDER */}
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#D8E2D8] bg-[#F5F7F5] p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                  <FiUser size={17} />
                </div>

                <h3 className="text-sm font-bold text-[#202721]">
                  {detail.user?.account_type?.toLowerCase() === "distributor"
                    ? "Distributor Information"
                    : "Customer Information"}
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between gap-4 border-b border-[#D8E2D8] pb-2.5">
                  <span className="text-xs text-[#9AA29C]">Name</span>

                  <span className="text-right text-sm font-semibold text-[#202721]">
                    {getCustomerName(detail.user)}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4 border-b border-[#D8E2D8] pb-2.5">
                  <span className="shrink-0 text-xs text-[#9AA29C]">Email</span>

                  <div className="min-w-0 text-right">
                    <p className="truncate text-sm font-semibold text-[#202721]">
                      {detail.user?.email || "—"}
                    </p>

                    <span
                      className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getAccountTypeClass(
                        detail.user?.account_type,
                      )}`}
                    >
                      <FiBriefcase size={10} />
                      {getAccountTypeLabel(detail.user?.account_type)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-xs text-[#9AA29C]">Phone</span>

                  <span className="text-sm font-semibold text-[#202721]">
                    {detail.user?.phone || "N/A"}
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
                    {detail.order?.order_reference || "—"}
                  </span>
                </div>

                <div className="flex justify-between gap-4 border-b border-[#D8E2D8] pb-2.5">
                  <span className="text-xs text-[#9AA29C]">
                    Order Status
                  </span>

                  <span className="text-sm font-semibold capitalize text-[#202721]">
                    {getStatusLabel(detail.order?.status || "")}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-xs text-[#9AA29C]">
                    Delivered At
                  </span>

                  <span className="text-right text-xs font-semibold text-[#59645C]">
                    {formatDate(detail.order?.delivered_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ITEMS */}
          <div className="mt-5 overflow-hidden rounded-2xl border border-[#D8E2D8]">
            <div className="border-b border-[#D8E2D8] bg-[#FAFBFA] px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                    <FiPackage size={17} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#202721]">
                      Returned Items
                    </h3>

                    <p className="mt-0.5 text-xs text-[#9AA29C]">
                      {detail.items.length} item(s)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="divide-y divide-[#D8E2D8]">
              {detail.items.map((item) => (
                <div key={item.order_line_id} className="p-5">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                      {item.product.image ? (
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-16 w-16 shrink-0 rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] text-[#4C8A57]">
                          <FiPackage size={22} />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-[#202721]">
                          {item.product.name}
                        </h4>

                        <p className="mt-1 text-xs text-[#9AA29C]">
                          SKU: {item.product.product_code}
                        </p>

                        <p className="mt-2 text-sm font-semibold text-[#163F20]">
                          Qty: {item.quantity}
                        </p>
                      </div>
                    </div>

                    {item.image_urls && item.image_urls.length > 0 && (
                      <div>
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                          Return Images
                        </p>

                        <div className="flex flex-wrap gap-3">
                          {item.image_urls.map((imageUrl, imageIndex) => (
                            <a
                              key={`${item.order_line_id}-${imageIndex}`}
                              href={imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="group relative overflow-hidden rounded-xl border border-[#D8E2D8] bg-[#F5F7F5]"
                            >
                              <img
                                src={imageUrl}
                                alt={`Return evidence ${imageIndex + 1}`}
                                className="h-20 w-20 object-cover transition-transform duration-300 group-hover:scale-105"
                              />

                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
                                <FiEye
                                  size={15}
                                  className="text-white opacity-0 transition group-hover:opacity-100"
                                />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                          Unit Price
                        </p>

                        <p className="mt-1 text-sm font-bold text-[#202721]">
                          {formatCurrency(item.unit_price)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                          Subtotal
                        </p>

                        <p className="mt-1 text-sm font-bold text-[#202721]">
                          {formatCurrency(item.subtotal)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                          Tax
                        </p>

                        <p className="mt-1 text-sm font-bold text-[#202721]">
                          {formatCurrency(item.tax)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#4C8A57]/20 bg-[#EAF3EA] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#4C8A57]">
                          Reason
                        </p>

                        <p className="mt-1 line-clamp-2 text-xs font-semibold text-[#59645C]">
                          {item.reason || "No reason"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* REFUND SUMMARY */}
          <div className="mt-5 rounded-2xl border border-[#D8E2D8] bg-[#F5F7F5] p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                <FaRupeeSign size={17} />
              </div>

              <h3 className="text-sm font-bold text-[#202721]">
                Refund Summary
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-[#D8E2D8] bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                  Subtotal
                </p>

                <p className="mt-1 text-base font-bold text-[#202721]">
                  {formatCurrency(detail.refund_details?.subtotal)}
                </p>
              </div>

              <div className="rounded-xl border border-[#D8E2D8] bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                  Tax
                </p>

                <p className="mt-1 text-base font-bold text-[#C0392B]">
                  -{formatCurrency(detail.refund_details?.tax)}
                </p>
              </div>

              <div className="rounded-xl border border-[#D8E2D8] bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                  Gateway Charges
                </p>

                <p className="mt-1 text-base font-bold text-[#C0392B]">
                  -{formatCurrency(detail.refund_details?.refund_gateway_charges)}
                </p>
              </div>

              <div className="rounded-xl border border-[#4C8A57]/20 bg-gradient-to-br from-[#EAF3EA] to-[#f4f8f4] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#4C8A57]">
                  Return Amount
                </p>

                <p className="mt-1 text-xl font-bold text-[#163F20]">
                  {formatCurrency(detail.refund_details?.total)}
                </p>
              </div>
            </div>
          </div>
          {/* TIMELINE */}
          <div className="mt-5 rounded-2xl border border-[#D8E2D8] bg-[#F5F7F5] p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                <FiCalendar size={17} />
              </div>

              <h3 className="text-sm font-bold text-[#202721]">
                Return Timeline
              </h3>
            </div>

            <div className="space-y-5">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EAF3EA]">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#4C8A57]" />
                  </div>

                  <div className="h-10 w-px bg-[#D8E2D8]" />
                </div>

                <div className="pt-1">
                  <p className="text-sm font-bold text-[#202721]">
                    Return Requested
                  </p>

                  <p className="mt-1 text-xs text-[#9AA29C]">
                    {formatDate(detail.created_at)}
                  </p>
                </div>
              </div>

              {detail.approved_at && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EAF3EA]">
                      <div className="h-2.5 w-2.5 rounded-full bg-[#4C8A57]" />
                    </div>

                    <div className="h-10 w-px bg-[#D8E2D8]" />
                  </div>

                  <div className="pt-1">
                    <p className="text-sm font-bold text-[#202721]">
                      Return Approved
                    </p>

                    <p className="mt-1 text-xs text-[#9AA29C]">
                      {formatDate(detail.approved_at)}
                    </p>
                  </div>
                </div>
              )}

              {detail.received_at && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
                      <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    </div>

                    <div className="h-10 w-px bg-[#D8E2D8]" />
                  </div>

                  <div className="pt-1">
                    <p className="text-sm font-bold text-[#202721]">
                      Return Received
                    </p>

                    <p className="mt-1 text-xs text-[#9AA29C]">
                      {formatDate(detail.received_at)}
                    </p>
                  </div>
                </div>
              )}

              {isCompleted && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EAF3EA]">
                      <div className="h-2.5 w-2.5 rounded-full bg-[#163F20]" />
                    </div>
                  </div>

                  <div className="pt-1">
                    <p className="text-sm font-bold text-[#163F20]">
                      Refund Completed
                    </p>

                    <p className="mt-1 text-xs text-[#9AA29C]">
                      {formatDate(
                        detail.refunded_at || detail.updated_at,
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {detail.admin_notes && (
            <div className="mt-5 rounded-2xl border border-[#D8E2D8] bg-[#F5F7F5] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                Admin Notes
              </p>

              <p className="mt-2 text-sm leading-6 text-[#59645C]">
                {detail.admin_notes}
              </p>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
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
              {detail.can_approve && (
                <button
                  type="button"
                  onClick={onApprove}
                  disabled={actionLoading.type === "approve"}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4C8A57] to-[#163F20] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#163F20]/15 transition hover:from-[#3f7749] hover:to-[#0F3219] disabled:opacity-50"
                >
                  {actionLoading.type === "approve" ? (
                    <FiRefreshCw size={14} className="animate-spin" />
                  ) : (
                    <FiCheck size={14} />
                  )}

                  Approve Return
                </button>
              )}

              {detail.can_reject && (
                <button
                  type="button"
                  onClick={onReject}
                  disabled={actionLoading.type === "reject"}
                  className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-[#C23B32] transition hover:bg-[#C23B32] hover:text-white disabled:opacity-50"
                >
                  <FiX size={14} />
                  Reject Return
                </button>
              )}

              {detail.status === "approved" && (
                <button
                  type="button"
                  onClick={onReceived}
                  disabled={actionLoading.type === "received"}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4C8A57] to-[#163F20] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#163F20]/15 transition hover:from-[#3f7749] hover:to-[#0F3219] disabled:opacity-50"
                >
                  {actionLoading.type === "received" ? (
                    <FiRefreshCw size={14} className="animate-spin" />
                  ) : (
                    <FiTruck size={14} />
                  )}

                  Mark Received & Refund
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

const ReturnRefund: React.FC = () => {
  const [requests, setRequests] = useState<ReturnListItem[]>([]);

  const [activeFilter, setActiveFilter] =
    useState<ReturnFilterTab>("All");

  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(false);

  const [detailLoading, setDetailLoading] = useState(false);

  const [selectedDetail, setSelectedDetail] =
    useState<SingleReturnResponse["data"] | null>(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const [approveModalOpen, setApproveModalOpen] = useState(false);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  const [receivedModalOpen, setReceivedModalOpen] = useState(false);

  const [actionLoading, setActionLoading] = useState<ActionLoading>({
    type: null,
    id: null,
  });

  const [receivedLoading, setReceivedLoading] = useState(false);

  const ITEMS_PER_PAGE = 10;

  // ===================================================
  // FETCH ALL
  // ===================================================

  const fetchReturnRequests = async () => {
    try {
      setLoading(true);

      const response = await returnApi.getAll(
        1,
        100,
        undefined,
        "all",
        "created_at",
        "desc",
      );

      if (response.data.success) {
        const list = response.data.data?.data || [];

        // Show only Return requests in this list.
        // Buyback requests (type === "buyback") are excluded.
        const returnRequests = list.filter(
          (item) => item.type === "return",
        );

        setRequests(returnRequests);
      } else {
        toast.error("Unable to fetch return requests.");
      }
    } catch (error: any) {
      console.error("Get return requests error:", error);

      toast.error(
        error?.response?.data?.message ||
        "Unable to fetch return requests.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturnRequests();
  }, []);

  // ===================================================
  // STATS
  // ===================================================

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((item) => item.status === "pending").length,
      approved: requests.filter((item) => item.status === "approved").length,
      completed: requests.filter((item) => item.status === "completed").length,
    };
  }, [requests]);

  // ===================================================
  // FILTER
  // ===================================================

  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesSearch =
        !query ||
        [
          request.order_reference,
          request.user.name || "",
          request.user.email || "",
          request.user.account_type || "",
          request.reason || "",
          String(request.id),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        activeFilter === "All" || request.status === activeFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, activeFilter]);

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRequests.length / ITEMS_PER_PAGE),
  );

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedRequests = filteredRequests.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const startEntry =
    filteredRequests.length === 0 ? 0 : startIndex + 1;

  const endEntry = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredRequests.length,
  );

  // ===================================================
  // FETCH DETAIL
  // ===================================================

  const fetchReturnDetail = async (id: number) => {
    try {
      setDetailLoading(true);

      const response = await returnApi.getById(id);

      if (response.data.success) {
        setSelectedDetail(response.data.data);
      } else {
        toast.error("Unable to fetch return details.");
      }
    } catch (error: any) {
      console.error("Return detail error:", error);

      toast.error(
        error?.response?.data?.message ||
        "Unable to fetch return details.",
      );
    } finally {
      setDetailLoading(false);
    }
  };

  // ===================================================
  // OPEN DETAIL
  // ===================================================

  const handleView = async (id: number) => {
    setDetailModalOpen(true);
    setSelectedDetail(null);

    await fetchReturnDetail(id);
  };

  // ===================================================
  // OPEN APPROVE POPUP (from table row)
  // ===================================================

  const handleOpenApproveFromTable = async (id: number) => {
    setApproveModalOpen(true);
    setSelectedDetail(null);

    await fetchReturnDetail(id);
  };

  // ===================================================
  // OPEN APPROVE POPUP (from detail modal)
  // ===================================================

  const handleOpenApprove = () => {
    if (!selectedDetail) return;

    setApproveModalOpen(true);
  };

  // ===================================================
  // SUBMIT APPROVE (no refund amount — just approval)
  // ===================================================

  const handleApprove = async (adminNotes: string) => {
    const id = selectedDetail?.id;

    if (!id) return;

    try {
      setActionLoading({ type: "approve", id });

      const response = await returnApi.approve(id, {
        admin_notes: adminNotes || undefined,
      });

      if (response.data.success) {
        toast.success(
          response.data.message || "Return approved successfully.",
        );

        setApproveModalOpen(false);

        await fetchReturnRequests();

        await fetchReturnDetail(id);
      } else {
        toast.error(
          response.data.message || "Unable to approve return.",
        );
      }
    } catch (error: any) {
      console.error("Approve return error:", error);

      toast.error(
        error?.response?.data?.message || "Unable to approve return.",
      );
    } finally {
      setActionLoading({ type: null, id: null });
    }
  };

  // ===================================================
  // OPEN REJECT
  // ===================================================

  const handleOpenReject = async (id: number) => {
    if (selectedDetail?.id !== id) {
      await fetchReturnDetail(id);
    }

    setRejectModalOpen(true);
  };

  const handleOpenRejectFromModal = () => {
    if (!selectedDetail) return;

    setRejectModalOpen(true);
  };

  // ===================================================
  // SUBMIT REJECT (admin notes only)
  // ===================================================

  const handleReject = async (adminNotes: string) => {
    const id = selectedDetail?.id;

    if (!id) return;

    try {
      setActionLoading({ type: "reject", id });

      const response = await returnApi.reject(
        id,
        adminNotes || undefined,
      );

      if (response.data.success) {
        toast.success(
          response.data.message || "Return rejected successfully.",
        );

        setRejectModalOpen(false);

        await fetchReturnRequests();

        await fetchReturnDetail(id);
      } else {
        toast.error(
          response.data.message || "Unable to reject return.",
        );
      }
    } catch (error: any) {
      console.error("Reject return error:", error);

      toast.error(
        error?.response?.data?.message || "Unable to reject return.",
      );
    } finally {
      setActionLoading({ type: null, id: null });
    }
  };

  // ===================================================
  // OPEN MARK RECEIVED
  // ===================================================

  const handleOpenReceived = () => {
    if (!selectedDetail) return;

    if (selectedDetail.status !== "approved") {
      toast.error(
        "Return must be approved before marking as received.",
      );
      return;
    }

    setReceivedModalOpen(true);
  };

  // ===================================================
  // MARK RECEIVED & REFUND
  // ===================================================

  const handleMarkReceived = async (
    refundAmount: number,
    adminNotes: string,
  ) => {
    if (!selectedDetail) return;

    setReceivedLoading(true);

    setActionLoading({ type: "received", id: selectedDetail.id });

    try {
      const response = await returnApi.markReceived(selectedDetail.id, {
        refund_amount: refundAmount,
        admin_notes: adminNotes || undefined,
      });

      if (response.data.success) {
        toast.success(
          response.data.message ||
          "Return marked as received and refund processed successfully.",
        );

        setReceivedModalOpen(false);

        await fetchReturnRequests();

        await fetchReturnDetail(selectedDetail.id);
      } else {
        toast.error(
          response.data.message ||
          "Unable to mark return as received.",
        );
      }
    } catch (error: any) {
      console.error("Mark received error:", error);

      toast.error(
        error?.response?.data?.message ||
        "Unable to mark return as received.",
      );
    } finally {
      setReceivedLoading(false);

      setActionLoading({ type: null, id: null });
    }
  };

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = async () => {
    await fetchReturnRequests();

    if (selectedDetail) {
      await fetchReturnDetail(selectedDetail.id);
    }

    toast.success("Return requests refreshed.");
  };

  // ===================================================
  // FILTER
  // ===================================================

  const handleFilterChange = (filter: ReturnFilterTab) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  // ===================================================
  // SEARCH
  // ===================================================

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // ===================================================
  // PAGINATION
  // ===================================================

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) {
      return;
    }

    setCurrentPage(page);
  };

  const paginationPages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5];
    }

    if (currentPage >= totalPages - 2) {
      return [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
    ];
  }, [currentPage, totalPages]);

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <>
      <motion.div
        className="min-h-screen bg-[#F5F7F5] p-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        }}
      >
        {/* HEADER */}
        <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#4C8A57]" />

              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#163F20]">
                Returns & Refunds
              </span>
            </div>

            <h1 className="text-[28px] font-bold tracking-tight text-[#202721] sm:text-[30px]">
              Return Requests
            </h1>

            <p className="mt-1 text-sm text-[#59645C]">
              Review return requests, approve returns, and process refunds on
              receipt.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D8E2D8] bg-white px-4 text-sm font-semibold text-[#163F20] shadow-sm transition hover:border-[#4C8A57] hover:bg-[#EAF3EA] disabled:opacity-50"
          >
            <FiRefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />

            Refresh
          </button>
        </div>

        {/* STATS */}
        <motion.div
          variants={containerVariants}
          className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <ReturnStatCard
            title="Total Returns"
            value={stats.total}
            subtitle="All return requests"
            icon={<FiPackage size={21} />}
            accent="bg-gradient-to-r from-[#4C8A57] to-[#163F20]"
          />

          <ReturnStatCard
            title="Pending"
            value={stats.pending}
            subtitle="Waiting for review"
            icon={<FiClock size={21} />}
            accent="bg-gradient-to-r from-[#86A98C] to-[#4C8A57]"
          />

          <ReturnStatCard
            title="Approved"
            value={stats.approved}
            subtitle="Approved requests"
            icon={<FiCheckCircle size={21} />}
            accent="bg-gradient-to-r from-[#5F9968] to-[#163F20]"
          />

          <ReturnStatCard
            title="Completed"
            value={stats.completed}
            subtitle="Finished returns"
            icon={<FiCheck size={21} />}
            accent="bg-gradient-to-r from-[#4C8A57] to-[#0F3219]"
          />
        </motion.div>

        {/* MAIN CARD */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-[#163F20]/10 bg-white shadow-sm"
        >
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#4C8A57] to-[#163F20]" />

          {/* TOOLBAR */}
          <div className="border-b border-[#D8E2D8] p-4 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              {/* SEARCH */}
              <div className="relative w-full xl:max-w-[540px]">
                <FiSearch
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4C8A57]"
                />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search order, customer, email..."
                  className="h-12 w-full rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] pl-11 pr-10 text-sm text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#4C8A57] focus:bg-white focus:ring-2 focus:ring-[#4C8A57]/15"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => handleSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA29C] hover:text-[#163F20]"
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>

              {/* STATUS FILTERS */}
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "All" as ReturnFilterTab, label: "All" },
                  { key: "pending" as ReturnFilterTab, label: "Pending" },
                  { key: "approved" as ReturnFilterTab, label: "Approved" },
                  { key: "rejected" as ReturnFilterTab, label: "Rejected" },
                  { key: "received" as ReturnFilterTab, label: "Received" },
                  { key: "completed" as ReturnFilterTab, label: "Completed" },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => handleFilterChange(filter.key)}
                    className={`rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${activeFilter === filter.key
                      ? "bg-gradient-to-r from-[#4C8A57] to-[#163F20] text-white shadow-md shadow-[#163F20]/15"
                      : "border border-[#D8E2D8] bg-[#F5F7F5] text-[#59645C] hover:border-[#4C8A57]/40 hover:bg-[#EAF3EA] hover:text-[#163F20]"
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
            <table className="w-full min-w-[1200px] border-collapse">
              <thead>
                <tr className="bg-[#0F3219]">
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF3EA]">
                    S.No.
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF3EA]">
                    Order Reference
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF3EA]">
                    Buyer
                  </th>

                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#EAF3EA]">
                    Quantity
                  </th>

                  <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-[#EAF3EA]">
                    Return Amount
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF3EA]">
                    Reason
                  </th>

                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#EAF3EA]">
                    Status
                  </th>

                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#EAF3EA]">
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
                          <FiRefreshCw size={23} className="animate-spin" />
                        </div>

                        <p className="mt-4 text-sm font-bold text-[#202721]">
                          Loading return requests...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F7F5] text-[#4C8A57]">
                          <FiPackage size={24} />
                        </div>

                        <p className="mt-4 text-sm font-bold text-[#202721]">
                          No return requests found
                        </p>

                        <p className="mt-1 text-xs text-[#9AA29C]">
                          Try changing the search or status filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRequests.map((request, index) => {
                    const canApprove = request.can_approve;

                    const canReject = request.can_reject;

                    const approveLoading =
                      actionLoading.type === "approve" &&
                      actionLoading.id === request.id;

                    const showMarkReceived =
                      request.status === "approved";

                    return (
                      <React.Fragment key={request.id}>
                        <tr
                          className="group border-b border-[#D8E2D8] bg-white transition hover:bg-[#FAFBFA]"
                        >
                          <td className="px-5 py-4">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F7F5] text-xs font-bold text-[#163F20]">
                              {startIndex + index + 1}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-lg bg-[#EAF3EA] px-3 py-1.5 text-xs font-bold text-[#163F20]">
                              {request.order_reference || "—"}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-[#202721]">
                              {getCustomerName(request.user)}
                            </p>

                            <span
                              className={`mt-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold ${getAccountTypeClass(
                                request.user.account_type,
                              )}`}
                            >
                              <FiBriefcase size={9} />
                              {getAccountTypeLabel(
                                request.user.account_type,
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex min-w-[42px] items-center justify-center rounded-full border border-[#D8E2D8] bg-[#F5F7F5] px-3 py-1.5 text-xs font-bold text-[#163F20]">
                              {request.items_count}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <span className="text-sm font-bold text-[#163F20]">
                              {formatCurrency(request.refund_amount)}
                            </span>
                            {request.status === "completed" && (
                              <p className="text-[10px] mt-1 font-bold uppercase tracking-[0.08em] text-[#4C8A57]">
                                Refunded {formatCurrency(request.refund_info?.amount)}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <p
                              title={request.reason || ""}
                              className="max-w-[210px] truncate text-xs text-[#59645C]"
                            >
                              {request.reason || "No reason provided"}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${getStatusClass(
                                request.status,
                              )}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${getStatusDot(
                                  request.status,
                                )}`}
                              />

                              {getStatusLabel(request.status)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex flex-nowrap items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleView(request.id)}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] text-[#163F20] transition hover:border-[#163F20] hover:bg-[#163F20] hover:text-white"
                                title="View"
                              >
                                <FiEye size={15} />
                              </button>

                              {canApprove && (
                                <button
                                  type="button"
                                  disabled={approveLoading}
                                  onClick={() =>
                                    handleOpenApproveFromTable(request.id)
                                  }
                                  className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#4C8A57] to-[#163F20] px-3 text-[10px] font-bold text-white shadow-sm transition hover:from-[#3f7749] hover:to-[#0F3219] disabled:opacity-50"
                                >
                                  {approveLoading ? (
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

                              {canReject && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenReject(request.id)
                                  }
                                  className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 text-[10px] font-bold text-[#C23B32] transition hover:border-[#C23B32] hover:bg-[#C23B32] hover:text-white"
                                >
                                  <FiX size={13} />
                                  Reject
                                </button>
                              )}

                              {showMarkReceived && (
                                <button
                                  type="button"
                                  onClick={() => handleView(request.id)}
                                  className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#4C8A57] to-[#163F20] px-3 text-[10px] font-bold text-white shadow-sm transition hover:from-[#3f7749] hover:to-[#0F3219]"
                                >
                                  <FiTruck size={13} />
                                  Received
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE */}
          <div className="block lg:hidden">
            {paginatedRequests.length > 0 ? (
              paginatedRequests.map((request, index) => {
                const approveLoading =
                  actionLoading.type === "approve" &&
                  actionLoading.id === request.id;

                const showMarkReceived = request.status === "approved";

                return (
                  <div
                    key={request.id}
                    className="border-b border-[#D8E2D8] bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-flex rounded-lg bg-[#EAF3EA] px-2.5 py-1 text-xs font-bold text-[#163F20]">
                          {request.order_reference || "—"}
                        </span>
                      </div>

                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F7F5] text-xs font-bold text-[#163F20]">
                        {startIndex + index + 1}
                      </span>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-bold text-[#202721]">
                        {getCustomerName(request.user)}
                      </p>

                      <span
                        className={`mt-1.5 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getAccountTypeClass(
                          request.user.account_type,
                        )}`}
                      >
                        <FiBriefcase size={10} />
                        {getAccountTypeLabel(
                          request.user.account_type,
                        )}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                          Return Amount
                        </p>

                        <p className="mt-1 text-base font-bold text-[#163F20]">
                          {formatCurrency(request.refund_amount)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                          Quantity
                        </p>

                        <p className="mt-1 text-base font-bold text-[#202721]">
                          {request.items_count}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${getStatusClass(
                          request.status,
                        )}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${getStatusDot(
                            request.status,
                          )}`}
                        />

                        {getStatusLabel(request.status)}
                      </span>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleView(request.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] text-[#163F20]"
                        >
                          <FiEye size={15} />
                        </button>

                        {request.can_approve && (
                          <button
                            type="button"
                            disabled={approveLoading}
                            onClick={() =>
                              handleOpenApproveFromTable(request.id)
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4C8A57] text-white disabled:opacity-50"
                          >
                            {approveLoading ? (
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
                              handleOpenReject(request.id)
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-[#C23B32]"
                          >
                            <FiX size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    {showMarkReceived && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => handleView(request.id)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4C8A57] to-[#163F20] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:from-[#3f7749] hover:to-[#0F3219]"
                        >
                          <FiTruck size={14} />
                          Mark Received & Refund
                        </button>
                      </div>
                    )}

                    <div className="mt-3 rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] p-3">
                      <p className="text-xs leading-5 text-[#59645C]">
                        {request.reason || "No reason provided."}
                      </p>
                    </div>

                    {/* RETURN AMOUNT - GREEN COLOR BELOW (MOBILE) */}
                    <div className="mt-3 rounded-xl border border-[#4C8A57]/20 bg-gradient-to-r from-[#EAF3EA] to-[#f4f8f4] p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#4C8A57]">
                          Return Amount
                        </span>
                        <span className="text-sm font-bold text-[#163F20]">
                          {formatCurrency(request.refund_amount)}
                        </span>
                      </div>
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
                  No return requests found
                </p>

                <p className="mt-1 text-xs text-[#9AA29C]">
                  Try changing your search or status filter.
                </p>
              </div>
            )}
          </div>

          {/* PAGINATION */}
          {filteredRequests.length > 0 && (
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
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8E2D8] bg-white text-[#163F20] transition hover:bg-[#EAF3EA] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronLeft size={17} />
                  </button>

                  {paginationPages.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => handlePageChange(page)}
                      className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold transition ${currentPage === page
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
                    onClick={() => handlePageChange(currentPage + 1)}
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

      {/* DETAIL POPUP */}
      <ReturnDetailModal
        open={detailModalOpen}
        loading={detailLoading}
        detail={selectedDetail}
        actionLoading={actionLoading}
        onClose={() => {
          setDetailModalOpen(false);
        }}
        onApprove={handleOpenApprove}
        onReject={handleOpenRejectFromModal}
        onReceived={handleOpenReceived}
      />

      {/* APPROVE POPUP */}
      <ApprovePopup
        open={approveModalOpen}
        loading={actionLoading.type === "approve"}
        orderReference={
          selectedDetail?.order?.order_reference || "N/A"
        }
        customerName={getCustomerName(selectedDetail?.user)}
        suggestedAmount={selectedDetail?.refund_details?.total || 0}
        onClose={() => setApproveModalOpen(false)}
        onConfirm={handleApprove}
      />

      {/* REJECT POPUP */}
      <RejectPopup
        open={rejectModalOpen}
        loading={actionLoading.type === "reject"}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={handleReject}
      />

      {/* MARK RECEIVED & REFUND POPUP */}
      <MarkReceivedPopup
        open={receivedModalOpen}
        orderReference={
          selectedDetail?.order?.order_reference || "N/A"
        }
        customerName={getCustomerName(selectedDetail?.user)}
        suggestedAmount={selectedDetail?.refund_details?.total || 0}
        loading={receivedLoading}
        onClose={() => setReceivedModalOpen(false)}
        onConfirm={handleMarkReceived}
      />
    </>
  );
};

export default ReturnRefund;