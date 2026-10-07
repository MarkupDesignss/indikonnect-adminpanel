import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
  FiChevronDown,
  FiUser,
  FiAlertCircle,
  FiClock,
  FiCheckCircle,
  FiCreditCard,
  FiBriefcase,
  FiSend,
  FiXCircle,
  FiRotateCcw,
  FiRotateCw,
  FiDollarSign,
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

import GlobalModal from "@/components/common/GlobalModal";

import returnApi, {
  ReturnListItem,
  SingleReturnResponse,
} from "../../api/endpoints/return";

import { FaRupeeSign } from "react-icons/fa";

// ✅ PERMISSIONS
import { usePermissions } from "../../pages/permissions/usePermissions";

// =====================================================
// ANIMATION
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

type ReturnFilterTab =
  | "All"
  | "pending"
  | "approved"
  | "rejected"
  | "received"
  | "completed";

interface ActionLoading {
  type: "approve" | "reject" | "received" | "complete" | null;
  id: number | null;
}

interface TimelineEvent {
  key: string;
  label: string;
  description: string;
  date: string;
  color: string;
  icon: React.ReactNode;
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

// ✅ SAME RETURN/REFUND NAVY THEME
const getStatusClass = (status: string) => {
  switch (status) {
    case "pending":
      return "border-[#FACC15]/40 bg-[#FEF9C3] text-[#8A6D16]";

    case "approved":
      return "border-[#1E3A8A]/25 bg-[#EAF1FF] text-[#1E3A8A]";

    case "received":
      return "border-[#2563EB]/25 bg-[#DBEAFE] text-[#1E40AF]";

    case "completed":
      return "border-[#1E3A8A]/30 bg-[#DBEAFE] text-[#172554]";

    case "rejected":
      return "border-[#C23B32]/25 bg-[#FBEAEA] text-[#C23B32]";

    default:
      return "border-[#D8E2F0] bg-[#F5F8FF] text-[#4A5778]";
  }
};

const getStatusDot = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-[#FACC15]";

    case "approved":
      return "bg-[#1E3A8A]";

    case "received":
      return "bg-[#2563EB]";

    case "completed":
      return "bg-[#172554]";

    case "rejected":
      return "bg-[#C23B32]";

    default:
      return "bg-[#8C97B2]";
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

// ✅ SAME ACCOUNT TYPE COLORS
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

const formatMethodLabel = (method?: string | null) => {
  if (!method) return "—";

  return method
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// =====================================================
// TIMELINE BUILDER
// =====================================================

const buildTimelineEvents = (
  timeline: Record<string, any> | undefined,
): TimelineEvent[] => {
  if (!timeline) return [];

  const rawEvents: Array<{
    key: string;
    label: string;
    description: string;
    date: string | null;
    color: string;
    icon: React.ReactNode;
  }> = [
    {
      key: "created_at",
      label: "Order Created",
      description: "Order was placed by the customer.",
      date: timeline.created_at ?? null,
      color: "bg-[#1E3A8A]",
      icon: <FiPackage size={14} />,
    },
    {
      key: "dispatched_at",
      label: "Dispatched",
      description: "Order was handed over to courier.",
      date: timeline.dispatched_at ?? null,
      color: "bg-[#2563EB]",
      icon: <FiTruck size={14} />,
    },
    {
      key: "shipped_at",
      label: "Shipped",
      description: "Package is in transit.",
      date: timeline.shipped_at ?? null,
      color: "bg-[#2563EB]",
      icon: <FiSend size={14} />,
    },
    {
      key: "delivered_at",
      label: "Delivered",
      description: "Package delivered to the customer.",
      date: timeline.delivered_at ?? null,
      color: "bg-[#172554]",
      icon: <FiCheckCircle size={14} />,
    },
    {
      key: "cancellation_requested_at",
      label: "Cancellation Requested",
      description: "Customer requested order cancellation.",
      date: timeline.cancellation_requested_at ?? null,
      color: "bg-[#FACC15]",
      icon: <FiClock size={14} />,
    },
    {
      key: "cancelled_at",
      label: "Cancelled",
      description: "Order was cancelled.",
      date: timeline.cancelled_at ?? null,
      color: "bg-[#C23B32]",
      icon: <FiXCircle size={14} />,
    },
    {
      key: "cancellation_rejected_at",
      label: "Cancellation Rejected",
      description: "Cancellation request was rejected.",
      date: timeline.cancellation_rejected_at ?? null,
      color: "bg-[#C23B32]",
      icon: <FiXCircle size={14} />,
    },
    {
      key: "return_requested_at",
      label: "Return Requested",
      description: "Customer requested a return.",
      date: timeline.return_requested_at ?? null,
      color: "bg-[#FACC15]",
      icon: <FiRotateCcw size={14} />,
    },
    {
      key: "return_approved_at",
      label: "Return Approved",
      description: "Return request was approved.",
      date: timeline.return_approved_at ?? null,
      color: "bg-[#1E3A8A]",
      icon: <FiCheckCircle size={14} />,
    },
    {
      key: "return_rejected_at",
      label: "Return Rejected",
      description: "Return request was rejected.",
      date: timeline.return_rejected_at ?? null,
      color: "bg-[#C23B32]",
      icon: <FiXCircle size={14} />,
    },
    {
      key: "return_completed_at",
      label: "Return Completed",
      description: "Return process was completed.",
      date: timeline.return_completed_at ?? null,
      color: "bg-[#172554]",
      icon: <FiCheckCircle size={14} />,
    },
    {
      key: "buyback_requested_at",
      label: "Buyback Requested",
      description: "Customer requested a buyback.",
      date: timeline.buyback_requested_at ?? null,
      color: "bg-[#FACC15]",
      icon: <FiRotateCw size={14} />,
    },
    {
      key: "buyback_approved_at",
      label: "Buyback Approved",
      description: "Buyback request was approved.",
      date: timeline.buyback_approved_at ?? null,
      color: "bg-[#1E3A8A]",
      icon: <FiCheckCircle size={14} />,
    },
    {
      key: "buyback_rejected_at",
      label: "Buyback Rejected",
      description: "Buyback request was rejected.",
      date: timeline.buyback_rejected_at ?? null,
      color: "bg-[#C23B32]",
      icon: <FiXCircle size={14} />,
    },
    {
      key: "buyback_refunded_at",
      label: "Buyback Refunded",
      description: "Buyback refund was processed.",
      date: timeline.buyback_refunded_at ?? null,
      color: "bg-[#172554]",
      icon: <FiDollarSign size={14} />,
    },
    {
      key: "updated_at",
      label: "Last Updated",
      description: "Last status change recorded.",
      date: timeline.updated_at ?? null,
      color: "bg-[#2563EB]",
      icon: <FiClock size={14} />,
    },
  ];

  return rawEvents
    .filter((event) => Boolean(event.date))
    .map((event) => ({
      ...event,
      date: event.date as string,
    }))
    .sort(
      (a, b) =>
        new Date(a.date.replace(" ", "T")).getTime() -
        new Date(b.date.replace(" ", "T")).getTime(),
    );
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
  tileClass?: string;
  tileIconClass?: string;
}

const ReturnStatCard: React.FC<ReturnStatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accent,
  tileClass = "bg-[#EAF1FF]",
  tileIconClass = "text-[#1E3A8A]",
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -4,
        boxShadow: "0 16px 30px -18px rgba(30,58,138,0.28)",
      }}
      className="relative min-h-[135px] overflow-hidden rounded-2xl border border-[#1E3A8A]/10 bg-white p-5 shadow-sm"
    >
      <div className={`absolute left-0 top-0 h-1 w-full ${accent}`} />

      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full border border-[#2563EB]/15" />

      <div className="pointer-events-none absolute -right-3 -top-3 h-14 w-14 rounded-full border border-[#1E3A8A]/10" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8C97B2]">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-[#0F1B3D]">
            {value.toLocaleString("en-IN")}
          </p>

          <p className="mt-1 text-xs text-[#4A5778]">{subtitle}</p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${tileClass} ${tileIconClass}`}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

// =====================================================
// TIMELINE STEPPER
// =====================================================

interface TimelineStepperProps {
  events: TimelineEvent[];
  emptyText?: string;
}

const TimelineStepper: React.FC<TimelineStepperProps> = ({
  events,
  emptyText = "No timeline events available.",
}) => {
  if (!events || events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#D8E2F0] bg-[#FAFBFF] p-4 text-center">
        <p className="text-xs text-[#8C97B2]">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {events.map((event, index) => {
        const isLast = index === events.length - 1;

        return (
          <div
            key={event.key}
            className="relative flex gap-4 pb-6 last:pb-0"
          >
            <div className="relative flex flex-col items-center">
              <div
                className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm ${event.color}`}
              >
                {event.icon}
              </div>

              {!isLast && (
                <div className="absolute top-9 bottom-0 w-px bg-[#D8E2F0]" />
              )}
            </div>

            <div className="flex-1 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-[#0F1B3D]">
                  {event.label}
                </p>

                {isLast && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#1E3A8A]/25 bg-[#EAF1FF] px-2 py-0.5 text-[10px] font-bold text-[#1E3A8A]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1E3A8A]" />
                    Latest
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs leading-5 text-[#4A5778]">
                {event.description}
              </p>

              <p className="mt-1 text-[11px] font-semibold text-[#8C97B2]">
                {formatDate(event.date)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// =====================================================
// APPROVE POPUP
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
      <div className="w-full max-w-[480px] overflow-hidden rounded-2xl border border-[#1E3A8A]/10 bg-white shadow-2xl font-poppins">
        <div className="h-1 w-full bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1E3A8A]" />

        <div className="flex items-start justify-between gap-4 border-b border-[#D8E2F0] px-4 py-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#1E3A8A]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1E3A8A]">
                Approve Buyback
              </span>
            </div>

            <h2 className="text-base font-bold text-[#0F1B3D]">
              Approve Buyback Request
            </h2>

            <p className="mt-0.5 text-[11px] text-[#8C97B2]">
              Approve this buyback. Refund will be processed on receipt.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E2F0] bg-[#F5F8FF] text-[#4A5778] transition hover:bg-[#EAF1FF] hover:text-[#1E3A8A] disabled:opacity-50"
          >
            <FiX size={16} />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <div className="rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] p-3">
            <div className="flex justify-between gap-4">
              <span className="text-xs text-[#8C97B2]">Order</span>

              <span className="text-right text-sm font-bold text-[#0F1B3D]">
                {orderReference}
              </span>
            </div>

            <div className="mt-2 flex justify-between gap-4 border-t border-[#D8E2F0] pt-2">
              <span className="text-xs text-[#8C97B2]">Customer</span>

              <span className="text-right text-sm font-semibold text-[#0F1B3D]">
                {customerName}
              </span>
            </div>

            <div className="mt-2 flex justify-between gap-4 border-t border-[#D8E2F0] pt-2">
              <span className="text-xs text-[#8C97B2]">
                Estimated Refund
              </span>

              <span className="text-right text-sm font-bold text-[#1E3A8A]">
                {formatCurrency(suggestedAmount)}
              </span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[#4A5778]">
              Admin Notes
            </label>

            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={2}
              placeholder="Optional internal notes..."
              className="w-full resize-none rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] px-3 py-2.5 text-sm text-[#0F1B3D] outline-none transition placeholder:text-[#8C97B2] focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/15"
              disabled={loading}
            />
          </div>

          <div className="rounded-xl border border-[#1E3A8A]/20 bg-[#EAF1FF] p-2.5">
            <p className="text-[11px] leading-4 text-[#4A5778]">
              ⚠️ By approving, this buyback will be marked as approved. Refund
              will be processed on receipt.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#D8E2F0] bg-[#FAFBFF] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-[#D8E2F0] bg-white px-4 py-2 text-sm font-semibold text-[#4A5778] transition hover:bg-[#F5F8FF] hover:text-[#1E3A8A] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => onConfirm(adminNotes.trim())}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1E40AF] to-[#1E3A8A] px-5 py-2 text-sm font-bold text-white shadow-md shadow-[#1E3A8A]/15 transition hover:from-[#1E3A8A] hover:to-[#172554] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <FiRefreshCw size={14} className="animate-spin" />
            ) : (
              <FiCheck size={14} />
            )}

            {loading ? "Processing..." : "Approve Buyback"}
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// REJECT POPUP
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
      <div className="w-full max-w-[460px] overflow-hidden rounded-2xl border border-[#1E3A8A]/10 bg-white shadow-2xl font-poppins">
        <div className="h-1 w-full bg-gradient-to-r from-[#1E3A8A] to-[#C23B32]" />

        <div className="flex items-start justify-between border-b border-[#D8E2F0] px-4 py-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#C23B32]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#C23B32]">
                Buyback Review
              </span>
            </div>

            <h2 className="text-base font-bold text-[#0F1B3D]">
              Reject Buyback
            </h2>

            <p className="mt-0.5 text-[11px] text-[#8C97B2]">
              Add an optional note before rejecting.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E2F0] bg-[#F5F8FF] text-[#4A5778] disabled:opacity-50"
          >
            <FiX size={16} />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[#4A5778]">
              Admin Notes
            </label>

            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              placeholder="Optional internal notes..."
              className="w-full resize-none rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] px-3 py-2.5 text-sm text-[#0F1B3D] outline-none transition placeholder:text-[#8C97B2] focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/15"
              disabled={loading}
            />
          </div>

          <div className="rounded-xl border border-[#C23B32]/20 bg-[#FBEAEA] p-2.5">
            <p className="text-[11px] leading-4 text-[#8b3a34]">
              ⚠️ Rejecting will mark this buyback as rejected. Customer will be
              notified.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#D8E2F0] bg-[#FAFBFF] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-[#D8E2F0] bg-white px-4 py-2 text-sm font-semibold text-[#4A5778] transition hover:bg-[#F5F8FF] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => onConfirm(adminNotes.trim())}
            className="flex items-center gap-2 rounded-xl bg-[#C23B32] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#a8322b] disabled:opacity-50"
          >
            {loading && (
              <FiRefreshCw size={14} className="animate-spin" />
            )}

            Reject Buyback
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// MARK RECEIVED POPUP
// =====================================================

interface MarkReceivedPopupProps {
  open: boolean;
  orderReference: string;
  customerName: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: (adminNotes: string) => void;
}

const MarkReceivedPopup: React.FC<MarkReceivedPopupProps> = ({
  open,
  orderReference,
  customerName,
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
      <div className="w-full max-w-[480px] overflow-hidden rounded-2xl border border-[#1E3A8A]/10 bg-white shadow-2xl font-poppins">
        <div className="h-1 w-full bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1E3A8A]" />

        <div className="flex items-start justify-between gap-4 border-b border-[#D8E2F0] px-4 py-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#1E3A8A]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1E3A8A]">
                Mark Received
              </span>
            </div>

            <h2 className="text-base font-bold text-[#0F1B3D]">
              Confirm Item Received
            </h2>

            <p className="mt-0.5 text-[11px] text-[#8C97B2]">
              Confirm that the buyback item has been received.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E2F0] bg-[#F5F8FF] text-[#4A5778] transition hover:bg-[#EAF1FF] hover:text-[#1E3A8A] disabled:opacity-50"
          >
            <FiX size={16} />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <div className="rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] p-3">
            <div className="flex justify-between gap-4">
              <span className="text-xs text-[#8C97B2]">Order</span>

              <span className="text-right text-sm font-bold text-[#0F1B3D]">
                {orderReference}
              </span>
            </div>

            <div className="mt-2 flex justify-between gap-4 border-t border-[#D8E2F0] pt-2">
              <span className="text-xs text-[#8C97B2]">Customer</span>

              <span className="text-right text-sm font-semibold text-[#0F1B3D]">
                {customerName}
              </span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[#4A5778]">
              Admin Notes
            </label>

            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={2}
              placeholder="Optional internal notes..."
              className="w-full resize-none rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] px-3 py-2.5 text-sm text-[#0F1B3D] outline-none transition placeholder:text-[#8C97B2] focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/15"
              disabled={loading}
            />
          </div>

          <div className="rounded-xl border border-[#1E3A8A]/20 bg-[#EAF1FF] p-2.5">
            <p className="text-[11px] leading-4 text-[#4A5778]">
              ⚠️ By confirming, the buyback items will be marked as received.
              After this, you can complete with refund.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#D8E2F0] bg-[#FAFBFF] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-[#D8E2F0] bg-white px-4 py-2 text-sm font-semibold text-[#4A5778] transition hover:bg-[#F5F8FF] hover:text-[#1E3A8A] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => onConfirm(adminNotes.trim())}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1E40AF] to-[#1E3A8A] px-5 py-2 text-sm font-bold text-white shadow-md shadow-[#1E3A8A]/15 transition hover:from-[#1E3A8A] hover:to-[#172554] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <FiRefreshCw size={14} className="animate-spin" />
            ) : (
              <FiTruck size={14} />
            )}

            {loading ? "Processing..." : "Mark as Received"}
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// COMPLETE POPUP
// =====================================================

interface CompletePopupProps {
  open: boolean;
  loading: boolean;
  orderReference: string;
  customerName: string;
  suggestedAmount: number;
  onClose: () => void;
  onConfirm: (refundAmount: number, adminNotes: string) => void;
}

const CompletePopup: React.FC<CompletePopupProps> = ({
  open,
  loading,
  orderReference,
  customerName,
  suggestedAmount,
  onClose,
  onConfirm,
}) => {
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    if (open) {
      setRefundAmount(
        suggestedAmount ? String(Number(suggestedAmount).toFixed(2)) : "",
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
      <div className="w-full max-w-[480px] overflow-hidden rounded-2xl border border-[#1E3A8A]/10 bg-white shadow-2xl font-poppins">
        <div className="h-1 w-full bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1E3A8A]" />

        <div className="flex items-start justify-between gap-4 border-b border-[#D8E2F0] px-4 py-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#1E3A8A]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1E3A8A]">
                Complete Buyback
              </span>
            </div>

            <h2 className="text-base font-bold text-[#0F1B3D]">
              Complete Buyback & Refund
            </h2>

            <p className="mt-0.5 text-[11px] text-[#8C97B2]">
              Enter the refund amount to return to the customer.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E2F0] bg-[#F5F8FF] text-[#4A5778] transition hover:bg-[#EAF1FF] hover:text-[#1E3A8A] disabled:opacity-50"
          >
            <FiX size={16} />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <div className="rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] p-3">
            <div className="flex justify-between gap-4">
              <span className="text-xs text-[#8C97B2]">Order</span>

              <span className="text-right text-sm font-bold text-[#0F1B3D]">
                {orderReference}
              </span>
            </div>

            <div className="mt-2 flex justify-between gap-4 border-t border-[#D8E2F0] pt-2">
              <span className="text-xs text-[#8C97B2]">Customer</span>

              <span className="text-right text-sm font-semibold text-[#0F1B3D]">
                {customerName}
              </span>
            </div>

            <div className="mt-2 flex justify-between gap-4 border-t border-[#D8E2F0] pt-2">
              <span className="text-xs text-[#8C97B2]">Full Amount</span>

              <span className="text-right text-sm font-bold text-[#1E3A8A]">
                {formatCurrency(suggestedAmount)}
              </span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[#4A5778]">
              Refund Amount <span className="text-[#C23B32]">*</span>
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#1E3A8A]">
                ₹
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="Enter refund amount"
                className="h-10 w-full rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] pl-8 pr-3 text-sm font-semibold text-[#0F1B3D] outline-none transition placeholder:font-normal placeholder:text-[#8C97B2] focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/15"
                disabled={loading}
              />
            </div>

            <p className="mt-1 text-[10px] text-[#8C97B2]">
              Full amount is pre-filled. You can change it.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[#4A5778]">
              Admin Notes
            </label>

            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={2}
              placeholder="Optional internal notes..."
              className="w-full resize-none rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] px-3 py-2.5 text-sm text-[#0F1B3D] outline-none transition placeholder:text-[#8C97B2] focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/15"
              disabled={loading}
            />
          </div>

          <div className="rounded-xl border border-[#1E3A8A]/20 bg-[#EAF1FF] p-2.5">
            <p className="text-[11px] leading-4 text-[#4A5778]">
              ⚠️ By confirming, the buyback will be completed and the entered
              refund amount will be sent back to the customer. This action
              cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#D8E2F0] bg-[#FAFBFF] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-[#D8E2F0] bg-white px-4 py-2 text-sm font-semibold text-[#4A5778] transition hover:bg-[#F5F8FF] hover:text-[#1E3A8A] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading || !isValidAmount}
            onClick={() => onConfirm(parsedAmount, adminNotes.trim())}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1E40AF] to-[#1E3A8A] px-5 py-2 text-sm font-bold text-white shadow-md shadow-[#1E3A8A]/15 transition hover:from-[#1E3A8A] hover:to-[#172554] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <FiRefreshCw size={14} className="animate-spin" />
            ) : (
              <FaRupeeSign size={14} />
            )}

            {loading ? "Processing..." : "Complete & Refund"}
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
  onComplete: () => void;

  // ✅ PERMISSIONS
  canApprove?: boolean;
  canReject?: boolean;
  canMarkReceived?: boolean;
  canComplete?: boolean;
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
  onComplete,

  canApprove = false,
  canReject = false,
  canMarkReceived = false,
  canComplete = false,
}) => {
  const [refundBreakdownOpen, setRefundBreakdownOpen] = useState(true);

  useEffect(() => {
    if (open) {
      setRefundBreakdownOpen(true);
    }
  }, [open, detail?.id]);

  if (!open) return null;

  if (loading) {
    return (
      <GlobalModal
        isOpen={open}
        onClose={onClose}
        closeOnOverlayClick={false}
      >
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#1E3A8A]/10 bg-white shadow-2xl font-poppins">
          <div className="h-1 w-full bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1E3A8A]" />

          <div className="flex min-h-[320px] flex-col items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
              <FiRefreshCw size={27} className="animate-spin" />
            </div>

            <p className="mt-4 text-sm font-bold text-[#0F1B3D]">
              Loading buyback details...
            </p>

            <p className="mt-1 text-xs text-[#8C97B2]">
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
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#1E3A8A]/10 bg-white shadow-2xl font-poppins">
          <div className="h-1 w-full bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1E3A8A]" />

          <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBEAEA] text-[#C23B32]">
              <FiAlertCircle size={28} />
            </div>

            <p className="mt-4 text-sm font-bold text-[#C23B32]">
              Buyback details not found.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="mt-5 rounded-xl bg-gradient-to-r from-[#1E40AF] to-[#1E3A8A] px-6 py-2.5 text-sm font-bold text-white"
            >
              Close
            </button>
          </div>
        </div>
      </GlobalModal>
    );
  }

  const isCompleted = detail.status === "completed";

  const refundDetails = detail.refund_details;

  const refundMethod =
    refundDetails?.method ||
    detail.refund_info?.refund_method ||
    "";

  const refundBreakdown = detail.refund_info?.deduction_breakdown;

  const hasRefundBreakdown = Boolean(refundBreakdown);

  const rawDetail: any = detail;

  const timelineSource =
    rawDetail.timeline ||
    rawDetail.order_lines_timeline?.[0]?.timeline ||
    rawDetail.order_line_timeline?.timeline ||
    null;

  const timelineEvents = timelineSource
    ? buildTimelineEvents(timelineSource)
    : buildTimelineEvents({
        created_at:
          rawDetail.order_created_at || rawDetail.created_at || null,

        buyback_requested_at:
          rawDetail.buyback_requested_at ||
          rawDetail.created_at ||
          null,

        buyback_approved_at: rawDetail.approved_at || null,

        buyback_rejected_at:
          detail.status === "rejected"
            ? rawDetail.updated_at
            : null,

        buyback_refunded_at:
          detail.status === "completed"
            ? rawDetail.refunded_at || rawDetail.updated_at
            : null,

        updated_at: rawDetail.updated_at || null,
      });

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={false}
    >
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#1E3A8A]/10 bg-white shadow-2xl font-poppins">
        <div className="h-1 w-full bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1E3A8A]" />

        {/* HEADER */}
        <div className="flex items-start justify-between gap-4 border-b border-[#D8E2F0] px-5 py-4 sm:px-6">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#1E3A8A]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1E3A8A]">
                Buyback & Refunds
              </span>
            </div>

            <h2 className="text-xl font-bold text-[#0F1B3D]">
              Buyback Request
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#8C97B2]">
              <span>{detail.order?.order_reference || "—"}</span>

              <span>•</span>

              <span>{formatDate(detail.created_at)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] text-[#4A5778] transition hover:bg-[#EAF1FF] hover:text-[#1E3A8A]"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="max-h-[calc(95vh-185px)] overflow-y-auto p-5 sm:p-6">
          {/* COMPLETED BANNER */}
          {isCompleted && (
            <div className="overflow-hidden rounded-2xl border border-[#1E3A8A]/25">
              <div className="flex items-center justify-between gap-3 border-b border-[#1E3A8A]/20 bg-gradient-to-r from-[#EAF1FF] to-[#f4f8ff] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#1E3A8A]">
                    <FiCreditCard size={17} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#1E3A8A]">
                      Refund Completed
                    </h3>

                    <p className="mt-0.5 text-xs text-[#4A5778]">
                      The refund has been processed successfully.
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1E3A8A]/20 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#1E3A8A]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1E3A8A]" />
                  Refunded
                </span>
              </div>

              <div className="bg-white p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                      Refund Amount
                    </p>

                    <p className="mt-1 text-xl font-bold text-[#1E3A8A]">
                      {formatCurrency(
                        detail.refund_info?.amount ??
                          detail.refund_details?.total,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                      Refund Method
                    </p>

                    <p className="mt-1 text-sm font-bold capitalize text-[#0F1B3D]">
                      {detail.refund_info?.refund_method ||
                        "Original Payment"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                      Refunded At
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#0F1B3D]">
                      {formatDate(
                        detail.refund_info?.completed_at ||
                          detail.refunded_at ||
                          detail.updated_at,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CUSTOMER + ORDER */}
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#D8E2F0] bg-[#F5F8FF] p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
                  <FiUser size={17} />
                </div>

                <h3 className="text-sm font-bold text-[#0F1B3D]">
                  {detail.user?.account_type?.toLowerCase() === "distributor"
                    ? "Distributor Information"
                    : "Customer Information"}
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between gap-4 border-b border-[#D8E2F0] pb-2.5">
                  <span className="text-xs text-[#8C97B2]">Name</span>

                  <span className="text-right text-sm font-semibold text-[#0F1B3D]">
                    {getCustomerName(detail.user)}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4 border-b border-[#D8E2F0] pb-2.5">
                  <span className="shrink-0 text-xs text-[#8C97B2]">
                    Email
                  </span>

                  <div className="min-w-0 text-right">
                    <p className="truncate text-sm font-semibold text-[#0F1B3D]">
                      {detail.user?.email || "—"}
                    </p>

                    <span
                      className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getAccountTypeClass(
                        detail.user?.account_type,
                      )}`}
                    >
                      <FiBriefcase size={10} />

                      {getAccountTypeLabel(
                        detail.user?.account_type,
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-xs text-[#8C97B2]">Phone</span>

                  <span className="text-sm font-semibold text-[#0F1B3D]">
                    {detail.user?.phone || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#D8E2F0] bg-[#F5F8FF] p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
                  <FiPackage size={17} />
                </div>

                <h3 className="text-sm font-bold text-[#0F1B3D]">
                  Order Information
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between gap-4 border-b border-[#D8E2F0] pb-2.5">
                  <span className="text-xs text-[#8C97B2]">
                    Order Reference
                  </span>

                  <span className="text-right text-sm font-bold text-[#1E3A8A]">
                    {detail.order?.order_reference || "—"}
                  </span>
                </div>

                <div className="flex justify-between gap-4 border-b border-[#D8E2F0] pb-2.5">
                  <span className="text-xs text-[#8C97B2]">
                    Order Status
                  </span>

                  <span className="text-sm font-semibold capitalize text-[#0F1B3D]">
                    {getStatusLabel(detail.order?.status || "")}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-xs text-[#8C97B2]">
                    Delivered At
                  </span>

                  <span className="text-right text-xs font-semibold text-[#4A5778]">
                    {formatDate(detail.order?.delivered_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ITEMS */}
          <div className="mt-5 overflow-hidden rounded-2xl border border-[#D8E2F0]">
            <div className="border-b border-[#D8E2F0] bg-[#FAFBFF] px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
                    <FiPackage size={17} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#0F1B3D]">
                      Buyback Items
                    </h3>

                    <p className="mt-0.5 text-xs text-[#8C97B2]">
                      {detail.items.length} item(s)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="divide-y divide-[#D8E2F0]">
              {detail.items.map((item) => (
                <div key={item.order_line_id} className="p-5">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                      {item.product.image ? (
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-16 w-16 shrink-0 rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] text-[#1E3A8A]">
                          <FiPackage size={22} />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-[#0F1B3D]">
                          {item.product.name}
                        </h4>

                        <p className="mt-1 text-xs text-[#8C97B2]">
                          SKU: {item.product.product_code}
                        </p>

                        <p className="mt-2 text-sm font-semibold text-[#1E3A8A]">
                          Qty: {item.quantity}
                        </p>
                      </div>
                    </div>

                    {item.image_urls && item.image_urls.length > 0 && (
                      <div>
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                          Buyback Images
                        </p>

                        <div className="flex flex-wrap gap-3">
                          {item.image_urls.map(
                            (imageUrl, imageIndex) => (
                              <a
                                key={`${item.order_line_id}-${imageIndex}`}
                                href={imageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="group relative overflow-hidden rounded-xl border border-[#D8E2F0] bg-[#F5F8FF]"
                              >
                                <img
                                  src={imageUrl}
                                  alt={`Buyback evidence ${
                                    imageIndex + 1
                                  }`}
                                  className="h-20 w-20 object-cover transition-transform duration-300 group-hover:scale-105"
                                />

                                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
                                  <FiEye
                                    size={15}
                                    className="text-white opacity-0 transition group-hover:opacity-100"
                                  />
                                </div>
                              </a>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                          Unit Price
                        </p>

                        <p className="mt-1 text-sm font-bold text-[#0F1B3D]">
                          {formatCurrency(item.unit_price)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                          Subtotal
                        </p>

                        <p className="mt-1 text-sm font-bold text-[#0F1B3D]">
                          {formatCurrency(item.subtotal)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                          Tax
                        </p>

                        <p className="mt-1 text-sm font-bold text-[#0F1B3D]">
                          {formatCurrency(item.tax)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#1E3A8A]/20 bg-[#EAF1FF] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#2563EB]">
                          Reason
                        </p>

                        <p className="mt-1 line-clamp-2 text-xs font-semibold text-[#4A5778]">
                          {item.reason || "No reason"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TRACK ORDER */}
          <div className="mt-5 overflow-hidden rounded-2xl border border-[#D8E2F0] bg-white">
            <div className="border-b border-[#D8E2F0] bg-[#FAFBFF] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
                  <FiTruck size={17} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#0F1B3D]">
                    Track Order
                  </h3>

                  <p className="mt-0.5 text-xs text-[#8C97B2]">
                    Full timeline of this buyback request
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="rounded-2xl border border-[#D8E2F0] bg-[#FAFBFF] p-5">
                <TimelineStepper
                  events={timelineEvents}
                  emptyText="No timeline events recorded for this request yet."
                />
              </div>
            </div>
          </div>

          {/* REFUND SECTION */}
          {hasRefundBreakdown ? (
            <div className="mt-5 overflow-hidden rounded-2xl border border-[#1E3A8A]/20 bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-[#D8E2F0] bg-[#F5F8FF] px-4 py-3 sm:px-5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF1FF] text-[#1E3A8A]">
                    <FaRupeeSign size={14} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-bold leading-4 text-[#0F1B3D]">
                      Refund Breakdown
                    </h3>

                    <p className="mt-0.5 text-[10px] leading-3 text-[#8C97B2]">
                      Complete refund calculation
                    </p>
                  </div>
                </div>

                <span className="shrink-0 text-sm font-bold text-[#1E3A8A]">
                  {formatCurrency(refundBreakdown?.net_refund)}
                </span>
              </div>

              <div className="px-4 sm:px-5">
                <div className="flex items-center justify-between gap-4 border-b border-[#D8E2F0] py-2.5">
                  <span className="text-xs font-semibold text-[#4A5778]">
                    Subtotal
                  </span>

                  <span className="text-xs font-bold text-[#0F1B3D]">
                    {formatCurrency(
                      refundBreakdown?.gross_refund?.subtotal,
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-[#D8E2F0] py-2.5">
                  <span className="text-xs font-semibold text-[#4A5778]">
                    Tax
                  </span>

                  <span className="text-xs font-bold text-[#0F1B3D]">
                    {formatCurrency(refundBreakdown?.gross_refund?.tax)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-[#D8E2F0] py-2.5">
                  <span className="text-xs font-semibold text-[#4A5778]">
                    Shipping
                  </span>

                  <span className="text-xs font-bold text-[#0F1B3D]">
                    {formatCurrency(
                      refundBreakdown?.gross_refund?.shipping,
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-[#D8E2F0] py-2.5">
                  <span className="text-xs font-bold text-[#0F1B3D]">
                    Gross Refund
                  </span>

                  <span className="text-sm font-bold text-[#1E3A8A]">
                    {formatCurrency(
                      refundBreakdown?.gross_refund?.total,
                    )}
                  </span>
                </div>

                {refundBreakdown?.deductions?.map(
                  (deduction, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-4 border-b border-[#D8E2F0] py-2.5"
                    >
                      <span className="text-xs font-semibold text-[#C0392B]">
                        - {deduction.label}
                      </span>

                      <span className="text-xs font-bold text-[#C0392B]">
                        -{formatCurrency(deduction.amount)}
                      </span>
                    </div>
                  ),
                )}

                <div className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-xs font-bold text-[#1E3A8A]">
                      Net Refund
                    </p>

                    <p className="mt-0.5 text-[9px] text-[#2563EB]">
                      Final refunded amount
                    </p>
                  </div>

                  <span className="rounded-lg border border-[#1E3A8A]/20 bg-gradient-to-r from-[#EAF1FF] to-[#f4f8ff] px-3 py-1.5 text-sm font-bold text-[#1E3A8A]">
                    {formatCurrency(refundBreakdown?.net_refund)}
                  </span>
                </div>
              </div>

              {detail.refund_info?.notes && (
                <div className="border-t border-[#D8E2F0] bg-[#FAFBFF] px-4 py-3 sm:px-5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                    Refund Notes
                  </p>

                  <p className="mt-1.5 text-sm leading-5 text-[#4A5778]">
                    {detail.refund_info.notes}
                  </p>
                </div>
              )}

              {detail.refund_info?.status && (
                <div className="border-t border-[#1E3A8A]/20 bg-[#EAF1FF] px-4 py-3 sm:px-5">
                  <div className="flex items-start gap-3">
                    <FiCheckCircle
                      size={18}
                      className="mt-0.5 shrink-0 text-[#1E3A8A]"
                    />

                    <div>
                      <p className="text-sm font-bold text-[#1E3A8A]">
                        Refund Status:{" "}
                        {getStatusLabel(detail.refund_info.status)}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#4A5778]">
                        Refund of{" "}
                        <span className="font-bold text-[#1E3A8A]">
                          {formatCurrency(detail.refund_info.amount)}
                        </span>{" "}
                        has been successfully processed.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-5 overflow-hidden rounded-2xl border border-[#D8E2F0] bg-white">
              <button
                type="button"
                onClick={() =>
                  setRefundBreakdownOpen((prev) => !prev)
                }
                className="flex w-full items-center justify-between gap-3 bg-[#F5F8FF] px-4 py-3 transition hover:bg-[#EAF1FF] sm:px-5 sm:py-3.5"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF1FF] text-[#1E3A8A]">
                    <FaRupeeSign size={14} />
                  </div>

                  <div className="min-w-0 text-left">
                    <h3 className="text-sm font-bold leading-4 text-[#0F1B3D]">
                      Refund Summary
                    </h3>

                    <p className="mt-0.5 text-[10px] leading-3 text-[#8C97B2]">
                      View complete refund breakdown
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2.5">
                  <span className="text-sm font-bold text-[#1E3A8A]">
                    {formatCurrency(refundDetails?.total)}
                  </span>

                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg border border-[#D8E2F0] bg-white text-[#1E3A8A] transition-transform duration-200 ${
                      refundBreakdownOpen ? "rotate-180" : ""
                    }`}
                  >
                    <FiChevronDown size={15} />
                  </span>
                </div>
              </button>

              {refundBreakdownOpen && (
                <div className="border-t border-[#D8E2F0] bg-white">
                  <div className="px-4 sm:px-5">
                    <div className="flex items-center justify-between gap-4 border-b border-[#D8E2F0] py-2.5">
                      <div>
                        <p className="text-xs font-semibold text-[#4A5778]">
                          Method
                        </p>

                        <p className="mt-0.5 text-[9px] text-[#8C97B2]">
                          Buyback collection method
                        </p>
                      </div>

                      <span className="rounded-md bg-[#EAF1FF] px-2.5 py-1 text-[11px] font-bold capitalize text-[#1E3A8A]">
                        {formatMethodLabel(refundMethod)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-b border-[#D8E2F0] py-2.5">
                      <div>
                        <p className="text-xs font-semibold text-[#4A5778]">
                          Subtotal
                        </p>

                        <p className="mt-0.5 text-[9px] text-[#8C97B2]">
                          Product amount
                        </p>
                      </div>

                      <span className="text-xs font-bold text-[#0F1B3D]">
                        {formatCurrency(refundDetails?.subtotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-b border-[#D8E2F0] py-2.5">
                      <div>
                        <p className="text-xs font-semibold text-[#4A5778]">
                          Added Tax
                        </p>

                        <p className="mt-0.5 text-[9px] text-[#8C97B2]">
                          Tax adjustment
                        </p>
                      </div>

                      <span className="text-xs font-bold text-[#0F1B3D]">
                        {formatCurrency(refundDetails?.tax)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-b border-[#D8E2F0] py-2.5">
                      <div>
                        <p className="text-xs font-semibold text-[#4A5778]">
                          Shipping
                        </p>

                        <p className="mt-0.5 text-[9px] text-[#8C97B2]">
                          Shipping amount
                        </p>
                      </div>

                      <span className="text-xs font-bold text-[#0F1B3D]">
                        {formatCurrency(refundDetails?.shipping)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-b border-[#D8E2F0] py-2.5">
                      <div>
                        <p className="text-xs font-semibold text-[#4A5778]">
                          Amount with Tax & Shipping
                        </p>

                        <p className="mt-0.5 text-[9px] text-[#8C97B2]">
                          Gross amount
                        </p>
                      </div>

                      <span className="text-xs font-bold text-[#0F1B3D]">
                        {formatCurrency(
                          refundDetails?.amount_with_tax_shipping,
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-b border-[#D8E2F0] py-2.5">
                      <div>
                        <p className="text-xs font-semibold text-[#4A5778]">
                          Deducted Shipping Charge
                        </p>

                        <p className="mt-0.5 text-[9px] text-[#8C97B2]">
                          Shipping deduction
                        </p>
                      </div>

                      <span className="text-xs font-bold text-[#C0392B]">
                        -{" "}
                        {formatCurrency(
                          refundDetails?.deducted_shipping_charge,
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-b border-[#D8E2F0] py-2.5">
                      <div>
                        <p className="text-xs font-semibold text-[#4A5778]">
                          Deducted Tax
                        </p>

                        <p className="mt-0.5 text-[9px] text-[#8C97B2]">
                          Tax adjustment
                        </p>
                      </div>

                      <span className="text-xs font-bold text-[#C0392B]">
                        -{formatCurrency(refundDetails?.tax)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-b border-[#D8E2F0] py-2.5">
                      <div>
                        <p className="text-xs font-semibold text-[#4A5778]">
                          Gateway Charges
                        </p>

                        <p className="mt-0.5 text-[9px] text-[#8C97B2]">
                          Payment gateway deduction
                        </p>
                      </div>

                      <span className="text-xs font-bold text-[#C0392B]">
                        -{" "}
                        {formatCurrency(
                          refundDetails?.refund_gateway_charges,
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 py-3">
                      <div>
                        <p className="text-xs font-bold text-[#1E3A8A]">
                          Buyback Amount
                        </p>

                        <p className="mt-0.5 text-[9px] text-[#2563EB]">
                          Final refundable amount
                        </p>
                      </div>

                      <span className="rounded-lg border border-[#1E3A8A]/20 bg-gradient-to-r from-[#EAF1FF] to-[#f4f8ff] px-3 py-1.5 text-sm font-bold text-[#1E3A8A]">
                        {formatCurrency(refundDetails?.total)}
                      </span>
                    </div>

                    {isCompleted &&
                      detail.refund_info?.amount !== undefined &&
                      detail.refund_info?.amount !== null && (
                        <div className="flex items-center justify-between gap-4 border-t border-[#D8E2F0] py-2.5">
                          <div>
                            <p className="text-xs font-semibold text-[#2563EB]">
                              Refunded Amount
                            </p>

                            <p className="mt-0.5 text-[9px] text-[#8C97B2]">
                              Amount actually refunded
                            </p>
                          </div>

                          <span className="text-sm font-bold text-[#2563EB]">
                            {formatCurrency(
                              detail.refund_info.amount,
                            )}
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
          )}

          {detail.admin_notes && (
            <div className="mt-5 rounded-2xl border border-[#D8E2F0] bg-[#F5F8FF] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                Admin Notes
              </p>

              <p className="mt-2 text-sm leading-6 text-[#4A5778]">
                {detail.admin_notes}
              </p>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="border-t border-[#D8E2F0] bg-[#FAFBFF] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#D8E2F0] bg-white px-5 py-2.5 text-sm font-semibold text-[#4A5778] transition hover:bg-[#F5F8FF] hover:text-[#1E3A8A]"
            >
              Close
            </button>

            <div className="flex flex-wrap justify-end gap-2">
              {detail.can_approve && canApprove && (
                <button
                  type="button"
                  onClick={onApprove}
                  disabled={actionLoading.type === "approve"}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1E40AF] to-[#1E3A8A] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#1E3A8A]/15 transition hover:from-[#1E3A8A] hover:to-[#172554] disabled:opacity-50"
                >
                  {actionLoading.type === "approve" ? (
                    <FiRefreshCw
                      size={14}
                      className="animate-spin"
                    />
                  ) : (
                    <FiCheck size={14} />
                  )}

                  Approve Buyback
                </button>
              )}

              {detail.can_reject && canReject && (
                <button
                  type="button"
                  onClick={onReject}
                  disabled={actionLoading.type === "reject"}
                  className="flex items-center gap-2 rounded-xl border border-[#C23B32]/25 bg-[#FBEAEA] px-4 py-2.5 text-xs font-bold text-[#C23B32] transition hover:bg-[#C23B32] hover:text-white disabled:opacity-50"
                >
                  {actionLoading.type === "reject" ? (
                    <FiRefreshCw
                      size={14}
                      className="animate-spin"
                    />
                  ) : (
                    <FiX size={14} />
                  )}

                  Reject Buyback
                </button>
              )}

              {detail.status === "approved" && canMarkReceived && (
                <button
                  type="button"
                  onClick={onReceived}
                  disabled={actionLoading.type === "received"}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1E40AF] to-[#1E3A8A] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#1E3A8A]/15 transition hover:from-[#1E3A8A] hover:to-[#172554] disabled:opacity-50"
                >
                  {actionLoading.type === "received" ? (
                    <FiRefreshCw
                      size={14}
                      className="animate-spin"
                    />
                  ) : (
                    <FiTruck size={14} />
                  )}

                  Mark as Received
                </button>
              )}

              {detail.status === "received" && canComplete && (
                <button
                  type="button"
                  onClick={onComplete}
                  disabled={actionLoading.type === "complete"}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1E40AF] to-[#1E3A8A] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#1E3A8A]/15 transition hover:from-[#1E3A8A] hover:to-[#172554] disabled:opacity-50"
                >
                  {actionLoading.type === "complete" ? (
                    <FiRefreshCw
                      size={14}
                      className="animate-spin"
                    />
                  ) : (
                    <FiCheckCircle size={14} />
                  )}

                  Complete & Refund
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

const BuyBack: React.FC = () => {
  // ===================================================
  // PERMISSIONS
  // ===================================================

  const {
    hasPermission,
    hasModuleAccess,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  // ✅ API PERMISSION KEYS:
  // Buyback: details, approve, reject, received, completed

  const canViewBuyback = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("Buyback") ||
      hasPermission("Buyback.details"),
    [isSuperAdmin, hasModuleAccess, hasPermission],
  );

  const canApproveBuyback = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("Buyback.approve"),
    [isSuperAdmin, hasPermission],
  );

  const canRejectBuyback = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("Buyback.reject"),
    [isSuperAdmin, hasPermission],
  );

  const canMarkReceived = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("Buyback.received"),
    [isSuperAdmin, hasPermission],
  );

  const canCompleteBuyback = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("Buyback.completed"),
    [isSuperAdmin, hasPermission],
  );

  // ===================================================
  // STATE
  // ===================================================

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

  const [completeModalOpen, setCompleteModalOpen] = useState(false);

  const [actionLoading, setActionLoading] =
    useState<ActionLoading>({
      type: null,
      id: null,
    });

  const [receivedLoading, setReceivedLoading] = useState(false);

  const [completeLoading, setCompleteLoading] = useState(false);

  const ITEMS_PER_PAGE = 10;

  // ✅ PREVENT DUPLICATE GET-ALL API CALL
  const listFetchInFlightRef = useRef<Promise<void> | null>(null);
  const hasFetchedListRef = useRef(false);

  // ===================================================
  // CLOSE ALL MODALS
  // ===================================================

  const closeAllModals = () => {
    setDetailModalOpen(false);
    setApproveModalOpen(false);
    setRejectModalOpen(false);
    setReceivedModalOpen(false);
    setCompleteModalOpen(false);
  };

  // ===================================================
  // FETCH ALL
  // ===================================================

  const fetchReturnRequests = async (force = false) => {
    // ✅ Already fetching -> do not create another same request
    if (listFetchInFlightRef.current) {
      return listFetchInFlightRef.current;
    }

    // ✅ Initial data already loaded -> don't hit GET ALL again
    if (!force && hasFetchedListRef.current) {
      return;
    }

    const requestPromise = (async () => {
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

          const buybackRequests = list.filter(
            (item) => item.type === "buyback",
          );

          setRequests(buybackRequests);

          // ✅ Mark only after successful response
          hasFetchedListRef.current = true;
        } else {
          toast.error(
            "Unable to fetch buyback requests.",
          );
        }
      } catch (error: any) {
        console.error(
          "Get buyback requests error:",
          error,
        );

        toast.error(
          error?.response?.data?.message ||
            "Unable to fetch buyback requests.",
        );
      } finally {
        setLoading(false);
      }
    })();

    listFetchInFlightRef.current = requestPromise;

    try {
      await requestPromise;
    } finally {
      listFetchInFlightRef.current = null;
    }
  };

  // ===================================================
  // INITIAL FETCH
  // ===================================================

  useEffect(() => {
    if (
      !permissionsLoading &&
      canViewBuyback &&
      !hasFetchedListRef.current
    ) {
      fetchReturnRequests();
    }
  }, [permissionsLoading, canViewBuyback]);

  // ===================================================
  // STATS
  // ===================================================

  const stats = useMemo(() => {
    return {
      total: requests.length,

      pending: requests.filter(
        (item) => item.status === "pending",
      ).length,

      approved: requests.filter(
        (item) => item.status === "approved",
      ).length,

      completed: requests.filter(
        (item) => item.status === "completed",
      ).length,
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
        activeFilter === "All" ||
        request.status === activeFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, activeFilter]);

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredRequests.length / ITEMS_PER_PAGE,
    ),
  );

  const startIndex =
    (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedRequests = filteredRequests.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const startEntry =
    filteredRequests.length === 0
      ? 0
      : startIndex + 1;

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
        toast.error(
          "Unable to fetch buyback details.",
        );
      }
    } catch (error: any) {
      console.error(
        "Buyback detail error:",
        error,
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to fetch buyback details.",
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
  // OPEN APPROVE POPUP
  // ===================================================

  const handleOpenApproveFromTable = async (
    id: number,
  ) => {
    if (!canApproveBuyback) {
      toast.error(
        "You do not have permission to approve buybacks.",
      );
      return;
    }

    setApproveModalOpen(true);
    setSelectedDetail(null);

    await fetchReturnDetail(id);
  };

  const handleOpenApprove = () => {
    if (!selectedDetail) return;

    if (!canApproveBuyback) {
      toast.error(
        "You do not have permission to approve buybacks.",
      );
      return;
    }

    setApproveModalOpen(true);
  };

  // ===================================================
  // SUBMIT APPROVE
  // ===================================================

  const handleApprove = async (
    adminNotes: string,
  ) => {
    if (!canApproveBuyback) {
      toast.error(
        "You do not have permission to approve buybacks.",
      );
      return;
    }

    const id = selectedDetail?.id;

    if (!id) return;

    try {
      setActionLoading({
        type: "approve",
        id,
      });

      const response = await returnApi.approve(id, {
        admin_notes:
          adminNotes || undefined,
      });

      if (response.data.success) {
        toast.success(
          response.data.message ||
            "Buyback approved successfully.",
        );

        // ✅ FORCE refresh after successful action
        await fetchReturnRequests(true);

        closeAllModals();
      } else {
        toast.error(
          response.data.message ||
            "Unable to approve buyback.",
        );
      }
    } catch (error: any) {
      console.error(
        "Approve buyback error:",
        error,
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to approve buyback.",
      );
    } finally {
      setActionLoading({
        type: null,
        id: null,
      });
    }
  };

  // ===================================================
  // OPEN REJECT
  // ===================================================

  const handleOpenReject = async (
    id: number,
  ) => {
    if (!canRejectBuyback) {
      toast.error(
        "You do not have permission to reject buybacks.",
      );
      return;
    }

    if (selectedDetail?.id !== id) {
      await fetchReturnDetail(id);
    }

    setRejectModalOpen(true);
  };

  const handleOpenRejectFromModal = () => {
    if (!selectedDetail) return;

    if (!canRejectBuyback) {
      toast.error(
        "You do not have permission to reject buybacks.",
      );
      return;
    }

    setRejectModalOpen(true);
  };

  // ===================================================
  // SUBMIT REJECT
  // ===================================================

  const handleReject = async (
    adminNotes: string,
  ) => {
    if (!canRejectBuyback) {
      toast.error(
        "You do not have permission to reject buybacks.",
      );
      return;
    }

    const id = selectedDetail?.id;

    if (!id) return;

    try {
      setActionLoading({
        type: "reject",
        id,
      });

      const response = await returnApi.reject(
        id,
        adminNotes || undefined,
      );

      if (response.data.success) {
        toast.success(
          response.data.message ||
            "Buyback rejected successfully.",
        );

        // ✅ FORCE refresh after successful action
        await fetchReturnRequests(true);

        closeAllModals();
      } else {
        toast.error(
          response.data.message ||
            "Unable to reject buyback.",
        );
      }
    } catch (error: any) {
      console.error(
        "Reject buyback error:",
        error,
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to reject buyback.",
      );
    } finally {
      setActionLoading({
        type: null,
        id: null,
      });
    }
  };

  // ===================================================
  // OPEN MARK RECEIVED
  // ===================================================

  const handleOpenReceived = () => {
    if (!selectedDetail) return;

    if (!canMarkReceived) {
      toast.error(
        "You do not have permission to mark buybacks as received.",
      );
      return;
    }

    if (selectedDetail.status !== "approved") {
      toast.error(
        "Buyback must be approved before marking as received.",
      );

      return;
    }

    setReceivedModalOpen(true);
  };

  // ===================================================
  // MARK RECEIVED
  // ===================================================

  const handleMarkReceived = async (
    adminNotes: string,
  ) => {
    if (!selectedDetail) return;

    if (!canMarkReceived) {
      toast.error(
        "You do not have permission to mark buybacks as received.",
      );
      return;
    }

    setReceivedLoading(true);

    setActionLoading({
      type: "received",
      id: selectedDetail.id,
    });

    try {
      const response =
        await returnApi.markReceived(
          selectedDetail.id,
          {
            admin_notes:
              adminNotes || undefined,
          },
        );

      if (response.data.success) {
        toast.success(
          response.data.message ||
            "Buyback marked as received successfully.",
        );

        // ✅ FORCE refresh after successful action
        await fetchReturnRequests(true);

        closeAllModals();
      } else {
        toast.error(
          response.data.message ||
            "Unable to mark buyback as received.",
        );
      }
    } catch (error: any) {
      console.error(
        "Mark received error:",
        error,
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to mark buyback as received.",
      );
    } finally {
      setReceivedLoading(false);

      setActionLoading({
        type: null,
        id: null,
      });
    }
  };

  // ===================================================
  // OPEN COMPLETE
  // ===================================================

  const handleOpenComplete = () => {
    if (!selectedDetail) return;

    if (!canCompleteBuyback) {
      toast.error(
        "You do not have permission to complete buybacks.",
      );
      return;
    }

    if (selectedDetail.status !== "received") {
      toast.error(
        "Buyback must be received before completing.",
      );

      return;
    }

    setCompleteModalOpen(true);
  };

  // ===================================================
  // SUBMIT COMPLETE
  // ===================================================

  const handleComplete = async (
    refundAmount: number,
    adminNotes: string,
  ) => {
    if (!selectedDetail) return;

    if (!canCompleteBuyback) {
      toast.error(
        "You do not have permission to complete buybacks.",
      );
      return;
    }

    setCompleteLoading(true);

    setActionLoading({
      type: "complete",
      id: selectedDetail.id,
    });

    try {
      const response =
        await returnApi.complete(
          selectedDetail.id,
          {
            resolution: "refund",
            refund_amount: refundAmount,
            admin_notes:
              adminNotes || undefined,
          },
        );

      if (response.data.success) {
        toast.success(
          response.data.message ||
            "Buyback completed successfully.",
        );

        // ✅ FORCE refresh after successful action
        await fetchReturnRequests(true);

        closeAllModals();
      } else {
        toast.error(
          response.data.message ||
            "Unable to complete buyback.",
        );
      }
    } catch (error: any) {
      console.error(
        "Complete buyback error:",
        error,
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to complete buyback.",
      );
    } finally {
      setCompleteLoading(false);

      setActionLoading({
        type: null,
        id: null,
      });
    }
  };

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = async () => {
    if (!canViewBuyback || loading) return;

    await fetchReturnRequests(true);

    if (selectedDetail) {
      await fetchReturnDetail(
        selectedDetail.id,
      );
    }

    toast.success(
      "Buyback requests refreshed.",
    );
  };

  // ===================================================
  // FILTER
  // ===================================================

  const handleFilterChange = (
    filter: ReturnFilterTab,
  ) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  // ===================================================
  // SEARCH
  // ===================================================

  const handleSearch = (
    value: string,
  ) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // ===================================================
  // PAGINATION
  // ===================================================

  const handlePageChange = (
    page: number,
  ) => {
    if (
      page < 1 ||
      page > totalPages
    ) {
      return;
    }

    setCurrentPage(page);
  };

  const paginationPages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1,
      );
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5];
    }

    if (
      currentPage >=
      totalPages - 2
    ) {
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
  // PERMISSION LOADING
  // ===================================================

  if (permissionsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8FF] font-poppins">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
            <FiRefreshCw
              size={26}
              className="animate-spin"
            />
          </div>

          <p className="mt-4 text-sm font-bold text-[#0F1B3D]">
            Checking permissions...
          </p>

          <p className="mt-1 text-xs text-[#8C97B2]">
            Please wait.
          </p>
        </div>
      </div>
    );
  }


  return (
    <>
      <motion.div
        className="min-h-screen bg-[#F5F8FF] p-4 font-poppins"
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
              <div className="h-2 w-2 rounded-full bg-[#1E3A8A]" />
              <div className="h-2 w-2 rounded-full bg-[#FACC15]" />
              <div className="h-2 w-2 rounded-full bg-[#2563EB]" />

              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2563EB]">
                Buyback & Refunds
              </span>
            </div>

            <h1 className="text-[28px] font-bold tracking-tight text-[#0F1B3D] sm:text-[30px]">
              Buyback Requests
            </h1>

            <p className="mt-1 text-sm text-[#4A5778]">
              Review buyback requests, approve buybacks,
              and process refunds on receipt.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D8E2F0] bg-white px-4 text-sm font-semibold text-[#1E3A8A] shadow-sm transition hover:border-[#1E3A8A] hover:bg-[#EAF1FF] disabled:opacity-50"
          >
            <FiRefreshCw
              size={16}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
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
            title="Total Buybacks"
            value={stats.total}
            subtitle="All buyback requests"
            icon={<FiPackage size={21} />}
            accent="bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1E3A8A]"
            tileClass="bg-[#EAF1FF]"
            tileIconClass="text-[#1E3A8A]"
          />

          <ReturnStatCard
            title="Pending"
            value={stats.pending}
            subtitle="Waiting for review"
            icon={<FiClock size={21} />}
            accent="bg-gradient-to-r from-[#FDE047] to-[#FACC15]"
            tileClass="bg-[#FEF9C3]"
            tileIconClass="text-[#1E293B]"
          />

          <ReturnStatCard
            title="Approved"
            value={stats.approved}
            subtitle="Approved requests"
            icon={<FiCheckCircle size={21} />}
            accent="bg-gradient-to-r from-[#60A5FA] to-[#2563EB]"
            tileClass="bg-[#DBEAFE]"
            tileIconClass="text-[#1E40AF]"
          />

          <ReturnStatCard
            title="Completed"
            value={stats.completed}
            subtitle="Finished buybacks"
            icon={<FiCheck size={21} />}
            accent="bg-gradient-to-r from-[#1E40AF] to-[#172554]"
            tileClass="bg-[#DBEAFE]"
            tileIconClass="text-[#172554]"
          />
        </motion.div>

        {/* MAIN CARD */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-[#1E3A8A]/10 bg-white shadow-sm"
        >
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1E3A8A]" />

          {/* TOOLBAR */}
          <div className="border-b border-[#D8E2F0] p-4 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full xl:max-w-[540px]">
                <FiSearch
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1E3A8A]"
                />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) =>
                    handleSearch(e.target.value)
                  }
                  placeholder="Search order, customer, email..."
                  className="h-12 w-full rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] pl-11 pr-10 text-sm text-[#0F1B3D] outline-none transition placeholder:text-[#8C97B2] focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/15"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() =>
                      handleSearch("")
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C97B2] hover:text-[#1E3A8A]"
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  {
                    key: "All" as ReturnFilterTab,
                    label: "All",
                  },
                  {
                    key: "pending" as ReturnFilterTab,
                    label: "Pending",
                  },
                  {
                    key: "approved" as ReturnFilterTab,
                    label: "Approved",
                  },
                  {
                    key: "rejected" as ReturnFilterTab,
                    label: "Rejected",
                  },
                  {
                    key: "received" as ReturnFilterTab,
                    label: "Received",
                  },
                  {
                    key: "completed" as ReturnFilterTab,
                    label: "Completed",
                  },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() =>
                      handleFilterChange(
                        filter.key,
                      )
                    }
                    className={`rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                      activeFilter === filter.key
                        ? "bg-gradient-to-r from-[#1E40AF] to-[#1E3A8A] text-white shadow-md shadow-[#1E3A8A]/15"
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
            <table className="w-full min-w-[1200px] border-collapse">
              <thead>
                <tr className="bg-[#1E3A8A]">
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    S.No.
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    Order Reference
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    Buyer
                  </th>

                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    Quantity
                  </th>

                  <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    Buyback Amount
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    Reason
                  </th>

                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    Status
                  </th>

                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
                          <FiRefreshCw
                            size={23}
                            className="animate-spin"
                          />
                        </div>

                        <p className="mt-4 text-sm font-bold text-[#0F1B3D]">
                          Loading buyback requests...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F8FF] text-[#1E3A8A]">
                          <FiPackage size={24} />
                        </div>

                        <p className="mt-4 text-sm font-bold text-[#0F1B3D]">
                          No buyback requests found
                        </p>

                        <p className="mt-1 text-xs text-[#8C97B2]">
                          Try changing the search
                          or status filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRequests.map(
                    (request, index) => {
                      const canApprove =
                        request.can_approve &&
                        canApproveBuyback;

                      const canReject =
                        request.can_reject &&
                        canRejectBuyback;

                      const approveLoading =
                        actionLoading.type ===
                          "approve" &&
                        actionLoading.id ===
                          request.id;

                      const showMarkReceived =
                        request.status ===
                          "approved" &&
                        canMarkReceived;

                      const showComplete =
                        request.status ===
                          "received" &&
                        canCompleteBuyback;

                      return (
                        <React.Fragment
                          key={request.id}
                        >
                          <tr className="group border-b border-[#D8E2F0] bg-white transition hover:bg-[#FAFBFF]">
                            <td className="px-5 py-4">
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F8FF] text-xs font-bold text-[#1E3A8A]">
                                {startIndex +
                                  index +
                                  1}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span className="inline-flex rounded-lg bg-[#EAF1FF] px-3 py-1.5 text-xs font-bold text-[#1E3A8A]">
                                {request.order_reference ||
                                  "—"}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <p className="text-sm font-bold text-[#0F1B3D]">
                                {getCustomerName(
                                  request.user,
                                )}
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
                              <span className="inline-flex min-w-[42px] items-center justify-center rounded-full border border-[#D8E2F0] bg-[#F5F8FF] px-3 py-1.5 text-xs font-bold text-[#1E3A8A]">
                                {request.items_count}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-right">
                              <div className="inline-flex flex-col items-end">
                                <span className="text-sm font-bold text-[#1E3A8A]">
                                  {formatCurrency(
                                    request.refund_amount,
                                  )}
                                </span>

                                {request.status ===
                                  "completed" && (
                                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#2563EB]">
                                    Refunded{" "}
                                    {formatCurrency(
                                      request.refund_info
                                        ?.amount,
                                    )}
                                  </p>
                                )}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <p
                                title={
                                  request.reason || ""
                                }
                                className="max-w-[210px] truncate text-xs text-[#4A5778]"
                              >
                                {request.reason ||
                                  "No reason provided"}
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

                                {getStatusLabel(
                                  request.status,
                                )}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex flex-nowrap items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleView(
                                      request.id,
                                    )
                                  }
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] text-[#1E3A8A] transition hover:border-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white"
                                  title="View"
                                >
                                  <FiEye size={15} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleView(
                                      request.id,
                                    )
                                  }
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#2563EB]/25 bg-[#DBEAFE] text-[#1E3A8A] transition hover:border-transparent hover:bg-[#1E3A8A] hover:text-white"
                                  title="Track Order"
                                >
                                  <FiTruck size={15} />
                                </button>

                                {canApprove && (
                                  <button
                                    type="button"
                                    disabled={
                                      approveLoading
                                    }
                                    onClick={() =>
                                      handleOpenApproveFromTable(
                                        request.id,
                                      )
                                    }
                                    className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1E40AF] to-[#1E3A8A] px-3 text-[10px] font-bold text-white shadow-sm transition hover:from-[#1E3A8A] hover:to-[#172554] disabled:opacity-50"
                                  >
                                    {approveLoading ? (
                                      <FiRefreshCw
                                        size={13}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <FiCheck
                                        size={13}
                                      />
                                    )}

                                    Approve
                                  </button>
                                )}

                                {canReject && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleOpenReject(
                                        request.id,
                                      )
                                    }
                                    className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-[#C23B32]/25 bg-[#FBEAEA] px-3 text-[10px] font-bold text-[#C23B32] transition hover:border-[#C23B32] hover:bg-[#C23B32] hover:text-white"
                                  >
                                    <FiX size={13} />
                                    Reject
                                  </button>
                                )}

                                {showMarkReceived && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleView(
                                        request.id,
                                      )
                                    }
                                    className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1E40AF] to-[#1E3A8A] px-3 text-[10px] font-bold text-white shadow-sm transition hover:from-[#1E3A8A] hover:to-[#172554]"
                                  >
                                    <FiTruck size={13} />
                                    Received
                                  </button>
                                )}

                                {showComplete && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleView(
                                        request.id,
                                      )
                                    }
                                    className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1E40AF] to-[#1E3A8A] px-3 text-[10px] font-bold text-white shadow-sm transition hover:from-[#1E3A8A] hover:to-[#172554]"
                                  >
                                    <FiCheckCircle size={13} />
                                    Complete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    },
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE */}
          <div className="block lg:hidden">
            {paginatedRequests.length > 0 ? (
              paginatedRequests.map(
                (request, index) => {
                  const approveLoading =
                    actionLoading.type ===
                      "approve" &&
                    actionLoading.id ===
                      request.id;

                  const showMarkReceived =
                    request.status ===
                      "approved" &&
                    canMarkReceived;

                  const showComplete =
                    request.status ===
                      "received" &&
                    canCompleteBuyback;

                  const canApprove =
                    request.can_approve &&
                    canApproveBuyback;

                  const canReject =
                    request.can_reject &&
                    canRejectBuyback;

                  return (
                    <div
                      key={request.id}
                      className="border-b border-[#D8E2F0] bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="inline-flex rounded-lg bg-[#EAF1FF] px-2.5 py-1 text-xs font-bold text-[#1E3A8A]">
                            {request.order_reference ||
                              "—"}
                          </span>
                        </div>

                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F8FF] text-xs font-bold text-[#1E3A8A]">
                          {startIndex +
                            index +
                            1}
                        </span>
                      </div>

                      <div className="mt-4">
                        <p className="text-sm font-bold text-[#0F1B3D]">
                          {getCustomerName(
                            request.user,
                          )}
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
                        <div className="rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                            Buyback Amount
                          </p>

                          <p className="mt-1 text-base font-bold text-[#1E3A8A]">
                            {formatCurrency(
                              request.refund_amount,
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                            Quantity
                          </p>

                          <p className="mt-1 text-base font-bold text-[#0F1B3D]">
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

                          {getStatusLabel(
                            request.status,
                          )}
                        </span>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleView(
                                request.id,
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] text-[#1E3A8A]"
                            title="View"
                          >
                            <FiEye size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleView(
                                request.id,
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2563EB]/25 bg-[#DBEAFE] text-[#1E3A8A]"
                            title="Track"
                          >
                            <FiTruck size={15} />
                          </button>

                          {canApprove && (
                            <button
                              type="button"
                              disabled={
                                approveLoading
                              }
                              onClick={() =>
                                handleOpenApproveFromTable(
                                  request.id,
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1E3A8A] text-white disabled:opacity-50"
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

                          {canReject && (
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenReject(
                                  request.id,
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FBEAEA] text-[#C23B32]"
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
                            onClick={() =>
                              handleView(
                                request.id,
                              )
                            }
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1E40AF] to-[#1E3A8A] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:from-[#1E3A8A] hover:to-[#172554]"
                          >
                            <FiTruck size={14} />
                            Mark as Received
                          </button>
                        </div>
                      )}

                      {showComplete && (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleView(
                                request.id,
                              )
                            }
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1E40AF] to-[#1E3A8A] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:from-[#1E3A8A] hover:to-[#172554]"
                          >
                            <FiCheckCircle
                              size={14}
                            />
                            Complete & Refund
                          </button>
                        </div>
                      )}

                      <div className="mt-3 rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] p-3">
                        <p className="text-xs leading-5 text-[#4A5778]">
                          {request.reason ||
                            "No reason provided."}
                        </p>
                      </div>

                      <div className="mt-3 rounded-xl border border-[#1E3A8A]/20 bg-gradient-to-r from-[#EAF1FF] to-[#f4f8ff] p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">
                            Buyback Amount
                          </span>

                          <span className="text-sm font-bold text-[#1E3A8A]">
                            {formatCurrency(
                              request.refund_amount,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                },
              )
            ) : (
              <div className="flex flex-col items-center px-5 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F8FF] text-[#1E3A8A]">
                  <FiPackage size={24} />
                </div>

                <p className="mt-4 text-sm font-bold text-[#0F1B3D]">
                  No buyback requests found
                </p>

                <p className="mt-1 text-xs text-[#8C97B2]">
                  Try changing the search or
                  status filter.
                </p>
              </div>
            )}
          </div>

          {/* PAGINATION */}
          {filteredRequests.length > 0 && (
            <div className="border-t border-[#D8E2F0] bg-[#FAFBFF] px-4 py-4 sm:px-5">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-xs text-[#8C97B2]">
                  Showing{" "}
                  <span className="font-bold text-[#0F1B3D]">
                    {startEntry}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-[#0F1B3D]">
                    {endEntry}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-[#0F1B3D]">
                    {filteredRequests.length}
                  </span>{" "}
                  entries
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={
                      currentPage === 1
                    }
                    onClick={() =>
                      handlePageChange(
                        currentPage - 1,
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8E2F0] bg-white text-[#1E3A8A] transition hover:bg-[#EAF1FF] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronLeft size={17} />
                  </button>

                  {paginationPages.map(
                    (page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() =>
                          handlePageChange(
                            page,
                          )
                        }
                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold transition ${
                          currentPage === page
                            ? "bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] text-white shadow-md shadow-[#1E3A8A]/15"
                            : "text-[#4A5778] hover:bg-[#EAF1FF] hover:text-[#1E3A8A]"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}

                  <button
                    type="button"
                    disabled={
                      currentPage ===
                      totalPages
                    }
                    onClick={() =>
                      handlePageChange(
                        currentPage + 1,
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8E2F0] bg-white text-[#1E3A8A] transition hover:bg-[#EAF1FF] disabled:cursor-not-allowed disabled:opacity-30"
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
        onClose={() =>
          setDetailModalOpen(false)
        }
        onApprove={handleOpenApprove}
        onReject={handleOpenRejectFromModal}
        onReceived={handleOpenReceived}
        onComplete={handleOpenComplete}
        canApprove={canApproveBuyback}
        canReject={canRejectBuyback}
        canMarkReceived={canMarkReceived}
        canComplete={canCompleteBuyback}
      />

      {/* APPROVE POPUP */}
      <ApprovePopup
        open={approveModalOpen}
        loading={
          actionLoading.type === "approve"
        }
        orderReference={
          selectedDetail?.order
            ?.order_reference || "N/A"
        }
        customerName={getCustomerName(
          selectedDetail?.user,
        )}
        suggestedAmount={
          selectedDetail?.refund_details
            ?.total || 0
        }
        onClose={() =>
          setApproveModalOpen(false)
        }
        onConfirm={handleApprove}
      />

      {/* REJECT POPUP */}
      <RejectPopup
        open={rejectModalOpen}
        loading={
          actionLoading.type === "reject"
        }
        onClose={() =>
          setRejectModalOpen(false)
        }
        onConfirm={handleReject}
      />

      {/* MARK RECEIVED POPUP */}
      <MarkReceivedPopup
        open={receivedModalOpen}
        orderReference={
          selectedDetail?.order
            ?.order_reference || "N/A"
        }
        customerName={getCustomerName(
          selectedDetail?.user,
        )}
        loading={receivedLoading}
        onClose={() =>
          setReceivedModalOpen(false)
        }
        onConfirm={handleMarkReceived}
      />

      {/* COMPLETE POPUP */}
      <CompletePopup
        open={completeModalOpen}
        loading={completeLoading}
        orderReference={
          selectedDetail?.order
            ?.order_reference || "N/A"
        }
        customerName={getCustomerName(
          selectedDetail?.user,
        )}
        suggestedAmount={
          selectedDetail?.refund_details
            ?.total || 0
        }
        onClose={() =>
          setCompleteModalOpen(false)
        }
        onConfirm={handleComplete}
      />
    </>
  );
};

export default BuyBack;