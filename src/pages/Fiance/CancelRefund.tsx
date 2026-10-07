"use client";

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
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiCheckCircle,
  FiCreditCard,
  FiBriefcase,
  FiTruck,
  FiSend,
  FiClock,
  FiXCircle,
  FiRotateCcw,
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

import GlobalModal from "@/components/common/GlobalModal";

import cancellationApi, {
  CancellationListItem,
  CancellationStatus,
} from "../../api/endpoints/cancellationApi";

// ✅ PERMISSIONS
import { usePermissions } from "../../pages/permissions/usePermissions";

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

  if (row.refund_amount != null) {
    return Number(row.refund_amount);
  }

  if (row.amount != null) {
    return Number(row.amount);
  }

  if (row.line_total != null) {
    return Number(row.line_total);
  }

  if (
    row.unit_price != null &&
    row.quantity != null
  ) {
    return (
      Number(row.unit_price) *
      Number(row.quantity)
    );
  }

  return 0;
};

const getCancellationAmount = (row: any): number => {
  return getRowAmount(row);
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
      return "border-[#FACC15]/40 bg-[#FEF9C3] text-[#8A6D16]";

    case "approved":
      return "border-[#1E3A8A]/25 bg-[#EAF1FF] text-[#1E3A8A]";

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

    case "rejected":
      return "bg-[#C23B32]";

    default:
      return "bg-[#8C97B2]";
  }
};

const formatDate = (date?: string | null) => {
  if (!date) return "—";

  const parsed = new Date(
    date.replace(" ", "T"),
  );

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

const formatCurrency = (
  amount?: number | string | null,
) =>
  `₹${Number(amount || 0).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}`;

const getCustomerName = (
  user?: {
    name?: string | null;
    full_name?: string | null;
    email?: string;
  } | null,
) => {
  if (!user) return "Customer";

  if (user.full_name?.trim()) {
    return user.full_name;
  }

  if (user.name?.trim()) {
    return user.name;
  }

  if (user.email) {
    return user.email.split("@")[0];
  }

  return "Customer";
};

// =====================================================
// ACCOUNT TYPE HELPERS
// =====================================================

const getAccountTypeLabel = (
  accountType?: string | null,
) => {
  if (!accountType) return "Customer";

  return accountType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    );
};

const getAccountTypeClass = (
  accountType?: string | null,
) => {
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
// TIMELINE
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
      description:
        "Order was placed by the customer.",
      date: timeline.created_at ?? null,
      color: "bg-[#1E3A8A]",
      icon: <FiPackage size={14} />,
    },
    {
      key: "dispatched_at",
      label: "Dispatched",
      description:
        "Order was handed over to courier.",
      date: timeline.dispatched_at ?? null,
      color: "bg-[#2563EB]",
      icon: <FiTruck size={14} />,
    },
    {
      key: "shipped_at",
      label: "Shipped",
      description:
        "Package is in transit.",
      date: timeline.shipped_at ?? null,
      color: "bg-[#2563EB]",
      icon: <FiSend size={14} />,
    },
    {
      key: "delivered_at",
      label: "Delivered",
      description:
        "Package delivered to the customer.",
      date: timeline.delivered_at ?? null,
      color: "bg-[#172554]",
      icon: <FiCheckCircle size={14} />,
    },
    {
      key: "cancellation_requested_at",
      label: "Cancellation Requested",
      description:
        "Customer requested order cancellation.",
      date:
        timeline.cancellation_requested_at ??
        null,
      color: "bg-[#FACC15]",
      icon: <FiClock size={14} />,
    },
    {
      key: "cancelled_at",
      label: "Cancelled",
      description:
        "Order cancellation was processed.",
      date: timeline.cancelled_at ?? null,
      color: "bg-[#C23B32]",
      icon: <FiXCircle size={14} />,
    },
    {
      key: "cancellation_rejected_at",
      label: "Cancellation Rejected",
      description:
        "Cancellation request was rejected.",
      date:
        timeline.cancellation_rejected_at ??
        null,
      color: "bg-[#C23B32]",
      icon: <FiXCircle size={14} />,
    },
    {
      key: "return_requested_at",
      label: "Return Requested",
      description:
        "Customer requested a return.",
      date: timeline.return_requested_at ?? null,
      color: "bg-[#FACC15]",
      icon: <FiRotateCcw size={14} />,
    },
    {
      key: "return_approved_at",
      label: "Return Approved",
      description:
        "Return request was approved.",
      date: timeline.return_approved_at ?? null,
      color: "bg-[#1E3A8A]",
      icon: <FiCheckCircle size={14} />,
    },
    {
      key: "return_rejected_at",
      label: "Return Rejected",
      description:
        "Return request was rejected.",
      date: timeline.return_rejected_at ?? null,
      color: "bg-[#C23B32]",
      icon: <FiXCircle size={14} />,
    },
    {
      key: "return_completed_at",
      label: "Return Completed",
      description:
        "Return process was completed.",
      date:
        timeline.return_completed_at ?? null,
      color: "bg-[#172554]",
      icon: <FiCheckCircle size={14} />,
    },
    {
      key: "updated_at",
      label: "Last Updated",
      description:
        "Last status change recorded.",
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
        new Date(
          a.date.replace(" ", "T"),
        ).getTime() -
        new Date(
          b.date.replace(" ", "T"),
        ).getTime(),
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
  accent: string;
  tileClass: string;
  tileIconClass: string;
}

const CancellationStatCard: React.FC<
  StatCardProps
> = ({
  title,
  value,
  subtitle,
  icon,
  loading = false,
  accent,
  tileClass,
  tileIconClass,
}) => {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 15,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      whileHover={{
        y: -4,
        boxShadow:
          "0 16px 30px -18px rgba(30,58,138,0.28)",
      }}
      className="relative min-h-[135px] overflow-hidden rounded-2xl border border-[#1E3A8A]/10 bg-white p-5 shadow-sm"
    >
      <div
        className={`absolute left-0 top-0 h-1 w-full ${accent}`}
      />

      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full border border-[#2563EB]/15" />

      <div className="pointer-events-none absolute -right-3 -top-3 h-14 w-14 rounded-full border border-[#1E3A8A]/10" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8C97B2]">
            {title}
          </p>

          {loading ? (
            <div className="mt-3 h-9 w-16 animate-pulse rounded-lg bg-[#EAF1FF]" />
          ) : (
            <p className="mt-2 text-3xl font-bold text-[#0F1B3D]">
              {value.toLocaleString("en-IN")}
            </p>
          )}

          <p className="mt-1 text-xs text-[#4A5778]">
            {subtitle}
          </p>
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

const TimelineStepper: React.FC<
  TimelineStepperProps
> = ({
  events,
  emptyText = "No timeline events available.",
}) => {
  if (!events || events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#D8E2F0] bg-[#FAFBFF] p-4 text-center">
        <p className="text-xs text-[#8C97B2]">
          {emptyText}
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {events.map((event, index) => {
        const isLast =
          index === events.length - 1;

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
// REJECT POPUP
// =====================================================

interface RejectPopupProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: (
    rejectionReason: string,
    adminNotes: string,
  ) => void;
}

const RejectPopup: React.FC<
  RejectPopupProps
> = ({
  open,
  loading,
  onClose,
  onConfirm,
}) => {
  const [rejectionReason, setRejectionReason] =
    useState("");

  const [adminNotes, setAdminNotes] =
    useState("");

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
      <div className="w-full max-w-[500px] overflow-hidden rounded-2xl border border-[#1E3A8A]/10 bg-white shadow-2xl font-poppins">
        <div className="h-1 w-full bg-gradient-to-r from-[#1E3A8A] to-[#C23B32]" />

        <div className="flex items-start justify-between border-b border-[#D8E2F0] px-4 py-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#C23B32]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#C23B32]">
                Cancellation Review
              </span>
            </div>

            <h2 className="text-base font-bold text-[#0F1B3D]">
              Reject Cancellation
            </h2>

            <p className="mt-0.5 text-[11px] text-[#8C97B2]">
              Enter the reason for rejecting this request.
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
              Rejection Reason{" "}
              <span className="text-[#C23B32]">*</span>
            </label>

            <textarea
              value={rejectionReason}
              onChange={(e) =>
                setRejectionReason(
                  e.target.value,
                )
              }
              rows={3}
              placeholder="Enter rejection reason..."
              disabled={loading}
              className="w-full resize-none rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] px-3 py-2.5 text-sm text-[#0F1B3D] outline-none transition placeholder:text-[#8C97B2] focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/15 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[#4A5778]">
              Admin Notes
            </label>

            <textarea
              value={adminNotes}
              onChange={(e) =>
                setAdminNotes(
                  e.target.value,
                )
              }
              rows={2}
              placeholder="Optional internal notes..."
              disabled={loading}
              className="w-full resize-none rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] px-3 py-2.5 text-sm text-[#0F1B3D] outline-none transition placeholder:text-[#8C97B2] focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/15 disabled:opacity-60"
            />
          </div>

          <div className="rounded-xl border border-[#C23B32]/20 bg-[#FBEAEA] p-2.5">
            <p className="text-[11px] leading-4 text-[#8b3a34]">
              ⚠️ Rejecting will mark this cancellation
              request as rejected. Customer will be
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
            disabled={
              loading ||
              !rejectionReason.trim()
            }
            onClick={() =>
              onConfirm(
                rejectionReason.trim(),
                adminNotes.trim(),
              )
            }
            className="flex items-center gap-2 rounded-xl bg-[#C23B32] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#a8322b] disabled:opacity-50"
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
// PAY POPUP
// =====================================================

interface PayPopupProps {
  open: boolean;
  orderLineId: number | null;
  orderReference: string;
  customerName: string;
  defaultAmount: number;
  loading: boolean;
  onClose: () => void;
  onConfirm: (
    amount: number,
    adminNotes: string,
  ) => void;
}

const PayPopup: React.FC<PayPopupProps> = ({
  open,
  orderReference,
  customerName,
  defaultAmount,
  loading,
  onClose,
  onConfirm,
}) => {
  const [amount, setAmount] = useState("");
  const [adminNotes, setAdminNotes] =
    useState("");

  useEffect(() => {
    if (open) {
      setAmount(
        defaultAmount > 0
          ? defaultAmount.toFixed(2)
          : "",
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
                Approve Cancellation
              </span>
            </div>

            <h2 className="text-base font-bold text-[#0F1B3D]">
              Pay Cancellation Amount
            </h2>

            <p className="mt-0.5 text-[11px] text-[#8C97B2]">
              Enter the amount to be refunded to the customer.
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
              <span className="text-xs text-[#8C97B2]">
                Order
              </span>

              <span className="text-right text-sm font-bold text-[#0F1B3D]">
                {orderReference}
              </span>
            </div>

            <div className="mt-2 flex justify-between gap-4 border-t border-[#D8E2F0] pt-2">
              <span className="text-xs text-[#8C97B2]">
                Customer
              </span>

              <span className="text-right text-sm font-semibold text-[#0F1B3D]">
                {customerName}
              </span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[#4A5778]">
              Payment Amount{" "}
              <span className="text-[#C23B32]">*</span>
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#1E3A8A]">
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
                className="h-10 w-full rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] pl-8 pr-3 text-sm font-semibold text-[#0F1B3D] outline-none transition placeholder:text-[#8C97B2] focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/15 disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[#4A5778]">
              Admin Notes
            </label>

            <textarea
              value={adminNotes}
              onChange={(e) =>
                setAdminNotes(
                  e.target.value,
                )
              }
              rows={2}
              placeholder="Optional internal notes..."
              disabled={loading}
              className="w-full resize-none rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] px-3 py-2.5 text-sm text-[#0F1B3D] outline-none transition placeholder:text-[#8C97B2] focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/15 disabled:opacity-60"
            />
          </div>

          <div className="rounded-xl border border-[#1E3A8A]/20 bg-[#EAF1FF] p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#1E3A8A]">
                <FiCreditCard size={17} />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#2563EB]">
                  Amount To Pay
                </p>

                <p className="mt-1 text-xl font-bold text-[#1E3A8A]">
                  {formatCurrency(
                    numericAmount,
                  )}
                </p>
              </div>
            </div>
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
            disabled={
              loading || !isValid
            }
            onClick={() =>
              onConfirm(
                numericAmount,
                adminNotes.trim(),
              )
            }
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1E40AF] to-[#1E3A8A] px-5 py-2 text-sm font-bold text-white shadow-md shadow-[#1E3A8A]/15 transition hover:from-[#1E3A8A] hover:to-[#172554] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <FiRefreshCw
                size={15}
                className="animate-spin"
              />
            ) : (
              <FiCheck size={15} />
            )}

            {loading
              ? "Processing..."
              : "Approve & Pay"}
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

  canApprove?: boolean;
  canReject?: boolean;
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
  canApprove = false,
  canReject = false,
}) => {
  if (!open) return null;

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
              Cancellation details not found.
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

  const raw: any = detail;

  const amount =
    getCancellationAmount(raw);

  const status =
    detail.status ||
    deriveStatus(raw);

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

  const accountType =
    getRowAccountType(raw);

  const quantity = Number(
    raw.quantity ?? 1,
  );

  const unitPrice = Number(
    raw.unit_price ?? 0,
  );

  const subtotal =
    raw.refund_amount ??
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

  const timelineSource =
    raw.timeline ||
    raw.order_lines_timeline?.[0]
      ?.timeline ||
    raw.order_line_timeline?.timeline ||
    null;

  const timelineEvents =
    timelineSource
      ? buildTimelineEvents(
          timelineSource,
        )
      : buildTimelineEvents({
          created_at:
            raw.order_created_at ||
            raw.created_at ||
            null,

          cancellation_requested_at:
            raw.cancellation_requested_at ||
            raw.created_at ||
            null,

          cancelled_at:
            raw.cancelled_at ||
            (status === "approved"
              ? raw.updated_at
              : null),

          cancellation_rejected_at:
            raw.cancellation_rejected_at ||
            (status === "rejected"
              ? raw.updated_at
              : null),

          updated_at:
            raw.updated_at || null,
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
                Cancellation Requests
              </span>
            </div>

            <h2 className="text-xl font-bold text-[#0F1B3D]">
              Cancellation Request
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#8C97B2]">
              <span>
                Item Ref: {itemReference}
              </span>

              {orderReference !==
                "N/A" && (
                <>
                  <span>•</span>

                  <span>
                    {orderReference}
                  </span>
                </>
              )}

              {raw.created_at && (
                <>
                  <span>•</span>

                  <span>
                    {formatDate(
                      raw.created_at,
                    )}
                  </span>
                </>
              )}
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
          {/* STATUS BANNER */}
          <div
            className={`mb-5 overflow-hidden rounded-2xl border ${
              status === "pending"
                ? "border-[#FACC15]/30"
                : status === "rejected"
                  ? "border-[#C23B32]/25"
                  : "border-[#1E3A8A]/25"
            }`}
          >
            <div
              className={`px-5 py-3 ${
                status === "pending"
                  ? "bg-[#FEF9C3]"
                  : status === "rejected"
                    ? "bg-[#FBEAEA]"
                    : "bg-[#EAF1FF]"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8C97B2]">
                    Current Status
                  </p>

                  <p className="mt-1 text-sm font-bold text-[#0F1B3D]">
                    {getStatusLabel(
                      status,
                    )}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${getStatusClass(
                    status,
                  )}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${getStatusDot(
                      status,
                    )}`}
                  />

                  {getStatusLabel(
                    status,
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* ITEM CARD */}
          <div className="overflow-hidden rounded-2xl border border-[#D8E2F0]">
            <div className="border-b border-[#D8E2F0] bg-[#FAFBFF] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
                  <FiPackage size={17} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#0F1B3D]">
                    Cancellation Item
                  </h3>

                  <p className="mt-0.5 text-xs text-[#8C97B2]">
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
                    alt={
                      raw.product.name ||
                      "Product"
                    }
                    className="h-16 w-16 shrink-0 rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] text-[#1E3A8A]">
                    <FiPackage size={22} />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-[#0F1B3D]">
                    {raw.product?.name ||
                      "Cancellation Item"}
                  </h4>

                  <p className="mt-1 text-xs text-[#8C97B2]">
                    SKU:{" "}
                    {raw.product
                      ?.product_code ||
                      "N/A"}
                  </p>

                  <p className="mt-2 text-sm font-semibold text-[#1E3A8A]">
                    Qty: {quantity}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                    Price
                  </p>

                  <p className="mt-1 text-sm font-bold text-[#0F1B3D]">
                    {formatCurrency(
                      unitPrice,
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                    Tax
                  </p>

                  <p className="mt-1 text-sm font-bold text-[#0F1B3D]">
                    {formatCurrency(tax)}
                  </p>
                </div>

                <div className="rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                    Total
                  </p>

                  <p className="mt-1 text-sm font-bold text-[#0F1B3D]">
                    {formatCurrency(
                      subtotal,
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-[#1E3A8A]/20 bg-[#EAF1FF] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#2563EB]">
                    Reason
                  </p>

                  <p className="mt-1 line-clamp-3 text-xs font-semibold text-[#4A5778]">
                    {reason}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CUSTOMER + ORDER */}
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#D8E2F0] bg-[#F5F8FF] p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
                  <FiUser size={17} />
                </div>

                <h3 className="text-sm font-bold text-[#0F1B3D]">
                  {detail.user?.account_type?.toLowerCase() ===
                  "distributor"
                    ? "Distributor Information"
                    : "Customer Information"}
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between gap-4 border-b border-[#D8E2F0] pb-2.5">
                  <span className="text-xs text-[#8C97B2]">
                    Name
                  </span>

                  <span className="text-right text-sm font-semibold text-[#0F1B3D]">
                    {getCustomerName(
                      customer,
                    )}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4 border-b border-[#D8E2F0] pb-2.5">
                  <span className="shrink-0 text-xs text-[#8C97B2]">
                    Email
                  </span>

                  <div className="min-w-0 text-right">
                    <p className="truncate text-sm font-semibold text-[#0F1B3D]">
                      {customer.email ||
                        "N/A"}
                    </p>

                    <span
                      className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getAccountTypeClass(
                        accountType,
                      )}`}
                    >
                      <FiBriefcase
                        size={10}
                      />

                      {getAccountTypeLabel(
                        accountType,
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-xs text-[#8C97B2]">
                    Phone
                  </span>

                  <span className="text-sm font-semibold text-[#0F1B3D]">
                    {customer.phone ||
                      "N/A"}
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
                    {orderReference}
                  </span>
                </div>

                <div className="flex justify-between gap-4 border-b border-[#D8E2F0] pb-2.5">
                  <span className="text-xs text-[#8C97B2]">
                    Item Reference
                  </span>

                  <span className="text-sm font-semibold text-[#0F1B3D]">
                    {itemReference}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-xs text-[#8C97B2]">
                    Delivery Status
                  </span>

                  <span className="text-sm font-semibold capitalize text-[#0F1B3D]">
                    {getStatusLabel(
                      raw.delivery_status ||
                        "N/A",
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AMOUNT */}
          <div className="mt-5 rounded-2xl border border-[#1E3A8A]/20 bg-gradient-to-r from-[#EAF1FF] to-[#f4f8ff] p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#2563EB]">
                  Cancellation Amount
                </p>

                <p className="mt-1 text-2xl font-bold text-[#1E3A8A]">
                  {formatCurrency(amount)}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#1E3A8A]">
                <FiCreditCard size={20} />
              </div>
            </div>
          </div>

          {/* TIMELINE */}
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
                    Full timeline of this cancellation request
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

          {/* ADMIN NOTES */}
          {raw.admin_notes && (
            <div className="mt-5 rounded-2xl border border-[#D8E2F0] bg-[#F5F8FF] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                Admin Notes
              </p>

              <p className="mt-2 text-sm leading-6 text-[#4A5778]">
                {raw.admin_notes}
              </p>
            </div>
          )}
        </div>

        {/* FOOTER */}
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
              {detail.can_approve &&
                canApprove && (
                  <button
                    type="button"
                    onClick={onApprove}
                    disabled={
                      actionLoading.type ===
                      "approve"
                    }
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1E40AF] to-[#1E3A8A] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#1E3A8A]/15 transition hover:from-[#1E3A8A] hover:to-[#172554] disabled:opacity-50"
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

                    Approve & Pay
                  </button>
                )}

              {detail.can_reject &&
                canReject && (
                  <button
                    type="button"
                    onClick={onReject}
                    disabled={
                      actionLoading.type ===
                      "reject"
                    }
                    className="flex items-center gap-2 rounded-xl border border-[#C23B32]/25 bg-[#FBEAEA] px-4 py-2.5 text-xs font-bold text-[#C23B32] transition hover:bg-[#C23B32] hover:text-white disabled:opacity-50"
                  >
                    {actionLoading.type ===
                    "reject" ? (
                      <FiRefreshCw
                        size={14}
                        className="animate-spin"
                      />
                    ) : (
                      <FiX size={14} />
                    )}

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
  // ===================================================
  // PERMISSIONS
  // ===================================================

  const {
    hasPermission,
    hasModuleAccess,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  // ✅ EXACT BACKEND PERMISSION KEYS
  // API:
  // "Cancel": ["details", "approve", "reject"]

  const canViewCancellation = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("Cancel") ||
      hasPermission("Cancel.details"),
    [
      isSuperAdmin,
      hasModuleAccess,
      hasPermission,
    ],
  );

  const canApproveCancellation = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("Cancel.approve"),
    [
      isSuperAdmin,
      hasPermission,
    ],
  );

  const canRejectCancellation = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("Cancel.reject"),
    [
      isSuperAdmin,
      hasPermission,
    ],
  );

  // ===================================================
  // STATE
  // ===================================================

  const [requests, setRequests] =
    useState<CancellationListItem[]>(
      [],
    );

  const [activeFilter, setActiveFilter] =
    useState<CancellationFilterTab>(
      "All",
    );

  const [searchQuery, setSearchQuery] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [loading, setLoading] =
    useState(false);

  const [selectedDetail, setSelectedDetail] =
    useState<CancellationListItem | null>(
      null,
    );

  const [detailModalOpen, setDetailModalOpen] =
    useState(false);

  const [rejectModalOpen, setRejectModalOpen] =
    useState(false);

  const [payModalOpen, setPayModalOpen] =
    useState(false);

  const [
    selectedPayRequest,
    setSelectedPayRequest,
  ] =
    useState<CancellationListItem | null>(
      null,
    );

  const [actionLoading, setActionLoading] =
    useState<ActionLoading>({
      type: null,
      id: null,
    });

  const ITEMS_PER_PAGE = 10;

  // ===================================================
  // DUPLICATE API PROTECTION
  // ===================================================

  const listFetchInFlightRef =
    useRef<Promise<void> | null>(
      null,
    );

  const hasFetchedListRef =
    useRef(false);

  // ===================================================
  // FETCH ALL
  // ===================================================

  const fetchCancellationRequests = async (
    force = false,
  ) => {
    // ✅ Same request already running
    if (listFetchInFlightRef.current) {
      return listFetchInFlightRef.current;
    }

    // ✅ Initial request already completed
    if (
      !force &&
      hasFetchedListRef.current
    ) {
      return;
    }

    const requestPromise =
      (async () => {
        try {
          setLoading(true);

          const response =
            await cancellationApi.getAll(
              1,
              100,
              undefined,
              "all",
              "created_at",
              "desc",
            );

          if (response.data.success) {
            const rawList: any[] =
              response.data.data?.data ||
              [];

            const normalized: CancellationListItem[] =
              rawList.map((row) => {
                const status =
                  deriveStatus(row);

                return {
                  ...row,

                  id: row.id,

                  order_line_id:
                    row.order_line_id ??
                    row.id,

                  order_reference:
                    row.order
                      ?.order_reference ||
                    "N/A",

                  item_reference_id:
                    row.item_reference_id ||
                    "N/A",

                  user: row.order?.user
                    ? {
                        id: row
                          .order.user
                          .id,

                        name:
                          row.order.user
                            .full_name ||
                          row.order.user
                            .name ||
                          null,

                        email:
                          row.order.user
                            .email || "",

                        phone:
                          row.order.user
                            .phone ||
                          null,

                        account_type:
                          row.order.user
                            .account_type ||
                          row.order
                            ?.order_type ||
                          null,
                      }
                    : undefined,

                  status,

                  items_count:
                    row.quantity ?? 1,

                  refund_amount:
                    getRowAmount(row),

                  amount:
                    getRowAmount(row),

                  reason:
                    row.cancellation_reason ||
                    null,

                  created_at:
                    row.created_at ||
                    row.cancellation_requested_at ||
                    "",

                  can_approve:
                    status === "pending",

                  can_reject:
                    status === "pending",

                  can_pay:
                    status === "approved",

                  product: row.product,
                } as CancellationListItem;
              });

            setRequests(
              normalized,
            );

            const maxPage =
              Math.max(
                1,
                Math.ceil(
                  normalized.length /
                    ITEMS_PER_PAGE,
                ),
              );

            setCurrentPage((page) =>
              Math.min(
                page,
                maxPage,
              ),
            );

            // ✅ Only mark fetched after success
            hasFetchedListRef.current =
              true;
          } else {
            toast.error(
              "Unable to fetch cancellation requests.",
            );
          }
        } catch (error: any) {
          console.error(
            "Get cancellation requests error:",
            error,
          );

          toast.error(
            error?.response?.data
              ?.message ||
              "Unable to fetch cancellation requests.",
          );
        } finally {
          setLoading(false);
        }
      })();

    listFetchInFlightRef.current =
      requestPromise;

    try {
      await requestPromise;
    } finally {
      listFetchInFlightRef.current =
        null;
    }
  };

  // ===================================================
  // INITIAL FETCH
  // ===================================================

  useEffect(() => {
    if (
      !permissionsLoading &&
      canViewCancellation &&
      !hasFetchedListRef.current
    ) {
      fetchCancellationRequests();
    }
  }, [
    permissionsLoading,
    canViewCancellation,
  ]);

  // ===================================================
  // STATS
  // ===================================================

  const stats = useMemo(
    () => ({
      total: requests.length,

      pending: requests.filter(
        (i) => i.status === "pending",
      ).length,

      approved: requests.filter(
        (i) => i.status === "approved",
      ).length,

      rejected: requests.filter(
        (i) => i.status === "rejected",
      ).length,
    }),
    [requests],
  );

  // ===================================================
  // FILTER
  // ===================================================

  const filteredRequests = useMemo(() => {
    const query =
      searchQuery
        .trim()
        .toLowerCase();

    return requests.filter(
      (request) => {
        const matchesSearch =
          !query ||
          [
            request.order_reference,
            (request as any)
              .item_reference_id ||
              "",
            request.user?.name ||
              "",
            request.user?.email ||
              "",
            request.user
              ?.account_type ||
              "",
            request.reason || "",
            String(
              request.order_line_id,
            ),
          ]
            .join(" ")
            .toLowerCase()
            .includes(query);

        const matchesStatus =
          activeFilter === "All" ||
          request.status ===
            activeFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      },
    );
  }, [
    requests,
    searchQuery,
    activeFilter,
  ]);

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredRequests.length /
        ITEMS_PER_PAGE,
    ),
  );

  const startIndex =
    (currentPage - 1) *
    ITEMS_PER_PAGE;

  const paginatedRequests =
    filteredRequests.slice(
      startIndex,
      startIndex +
        ITEMS_PER_PAGE,
    );

  const startEntry =
    filteredRequests.length === 0
      ? 0
      : startIndex + 1;

  const endEntry = Math.min(
    startIndex +
      ITEMS_PER_PAGE,
    filteredRequests.length,
  );

  const paginationPages = useMemo(
    () => {
      if (totalPages <= 5) {
        return Array.from(
          {
            length: totalPages,
          },
          (_, i) => i + 1,
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
    },
    [currentPage, totalPages],
  );

  // ===================================================
  // VIEW
  // ===================================================

  const handleView = (
    request: CancellationListItem,
  ) => {
    setSelectedDetail(request);
    setDetailModalOpen(true);
  };

  // ===================================================
  // APPROVE / PAY
  // ===================================================

  const handleOpenApprove = (
    request: CancellationListItem,
  ) => {
    if (!canApproveCancellation) {
      toast.error(
        "You do not have permission to approve cancellation requests.",
      );
      return;
    }

    if (!request.can_approve) {
      toast.error(
        "This cancellation request cannot be approved.",
      );
      return;
    }

    setSelectedPayRequest(request);
    setPayModalOpen(true);
  };

  const handleApproveWithPay =
    async (
      amount: number,
      adminNotes: string,
    ) => {
      if (
        !canApproveCancellation
      ) {
        toast.error(
          "You do not have permission to approve cancellation requests.",
        );
        return;
      }

      const orderLineId =
        selectedPayRequest
          ?.order_line_id;

      if (!orderLineId) {
        toast.error(
          "Cancellation request not found.",
        );
        return;
      }

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        toast.error(
          "Please enter a valid payment amount.",
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
              admin_notes:
                adminNotes ||
                undefined,
            },
          );

        if (response.data.success) {
          toast.success(
            response.data.message ||
              "Cancellation approved successfully.",
          );

          setPayModalOpen(false);
          setSelectedPayRequest(
            null,
          );

          // ✅ Force fresh API after action
          await fetchCancellationRequests(
            true,
          );

          if (
            selectedDetail?.order_line_id ===
            orderLineId
          ) {
            setDetailModalOpen(false);
            setSelectedDetail(null);
          }
        } else {
          toast.error(
            response.data.message ||
              "Unable to approve cancellation.",
          );
        }
      } catch (error: any) {
        console.error(
          "Approve cancellation error:",
          error,
        );

        toast.error(
          error?.response?.data
            ?.message ||
            "Unable to approve cancellation.",
        );
      } finally {
        setActionLoading({
          type: null,
          id: null,
        });
      }
    };

  // ===================================================
  // REJECT
  // ===================================================

  const handleOpenReject = (
    request: CancellationListItem,
  ) => {
    if (!canRejectCancellation) {
      toast.error(
        "You do not have permission to reject cancellation requests.",
      );
      return;
    }

    if (!request.can_reject) {
      toast.error(
        "This cancellation request cannot be rejected.",
      );
      return;
    }

    setSelectedDetail(request);
    setRejectModalOpen(true);
  };

  const handleReject =
    async (
      rejectionReason: string,
      adminNotes: string,
    ) => {
      if (
        !canRejectCancellation
      ) {
        toast.error(
          "You do not have permission to reject cancellation requests.",
        );
        return;
      }

      const orderLineId =
        selectedDetail
          ?.order_line_id;

      if (!orderLineId) {
        toast.error(
          "Cancellation request not found.",
        );
        return;
      }

      try {
        setActionLoading({
          type: "reject",
          id: orderLineId,
        });

        const response =
          await cancellationApi.reject(
            orderLineId,
            rejectionReason,
            adminNotes ||
              undefined,
          );

        if (response.data.success) {
          toast.success(
            response.data.message ||
              "Cancellation rejected successfully.",
          );

          setRejectModalOpen(false);
          setDetailModalOpen(false);
          setSelectedDetail(null);

          // ✅ Force fresh API after action
          await fetchCancellationRequests(
            true,
          );
        } else {
          toast.error(
            response.data.message ||
              "Unable to reject cancellation.",
          );
        }
      } catch (error: any) {
        console.error(
          "Reject cancellation error:",
          error,
        );

        toast.error(
          error?.response?.data
            ?.message ||
            "Unable to reject cancellation.",
        );
      } finally {
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
    if (
      !canViewCancellation ||
      loading
    ) {
      return;
    }

    await fetchCancellationRequests(
      true,
    );

    toast.success(
      "Cancellation requests refreshed.",
    );
  };

  // ===================================================
  // FILTER
  // ===================================================

  const handleFilterChange = (
    filter: CancellationFilterTab,
  ) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  // ===================================================
  // SEARCH
  // ===================================================

  const handleSearchChange = (
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

  // ===================================================
  // PERMISSION LOADING UI
  // ===================================================

  if (permissionsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8FF] font-poppins">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
            <FiRefreshCw
              size={27}
              className="animate-spin"
            />
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
        <motion.div
          variants={itemVariants}
          className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center"
        >
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#1E3A8A]" />

              <div className="h-2 w-2 rounded-full bg-[#FACC15]" />

              <div className="h-2 w-2 rounded-full bg-[#2563EB]" />

              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2563EB]">
                Order Management
              </span>
            </div>

            <h1 className="text-[28px] font-bold tracking-tight text-[#0F1B3D] sm:text-[30px]">
              Cancellation Requests
            </h1>

            <p className="mt-1 text-sm text-[#4A5778]">
              Review, approve, reject and pay customer
              cancellation requests.
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
        </motion.div>

        {/* STATS */}
        <motion.div
          variants={containerVariants}
          className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <CancellationStatCard
            title="Total Requests"
            value={stats.total}
            subtitle="All cancellation requests"
            icon={<FiPackage size={21} />}
            loading={loading}
            accent="bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1E3A8A]"
            tileClass="bg-[#EAF1FF]"
            tileIconClass="text-[#1E3A8A]"
          />

          <CancellationStatCard
            title="Pending"
            value={stats.pending}
            subtitle="Waiting for review"
            icon={<FiClock size={21} />}
            loading={loading}
            accent="bg-gradient-to-r from-[#FDE047] to-[#FACC15]"
            tileClass="bg-[#FEF9C3]"
            tileIconClass="text-[#1E293B]"
          />

          <CancellationStatCard
            title="Approved"
            value={stats.approved}
            subtitle="Approved requests"
            icon={<FiCheckCircle size={21} />}
            loading={loading}
            accent="bg-gradient-to-r from-[#60A5FA] to-[#2563EB]"
            tileClass="bg-[#DBEAFE]"
            tileIconClass="text-[#1E40AF]"
          />

          <CancellationStatCard
            title="Rejected"
            value={stats.rejected}
            subtitle="Rejected requests"
            icon={<FiX size={21} />}
            loading={loading}
            accent="bg-gradient-to-r from-[#EF4444] to-[#C23B32]"
            tileClass="bg-[#FBEAEA]"
            tileIconClass="text-[#C23B32]"
          />
        </motion.div>

        {/* TOOLBAR */}
        <motion.div
          variants={itemVariants}
          className="mb-5 overflow-hidden rounded-2xl border border-[#1E3A8A]/10 bg-white shadow-sm"
        >
          <div className="border-b border-[#D8E2F0] p-4 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full xl:max-w-[540px]">
                <FiSearch
                  size={19}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#1E3A8A]"
                />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) =>
                    handleSearchChange(
                      e.target.value,
                    )
                  }
                  placeholder="Search order, customer, email..."
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] pl-11 pr-10 text-sm text-[#0F1B3D] outline-none transition placeholder:text-[#8C97B2] focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/15 disabled:opacity-60"
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
                            item.status ===
                            filter,
                        ).length;

                  return (
                    <button
                      key={filter}
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        handleFilterChange(
                          filter,
                        )
                      }
                      className={`rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                        activeFilter ===
                        filter
                          ? "bg-gradient-to-r from-[#1E40AF] to-[#1E3A8A] text-white shadow-md shadow-[#1E3A8A]/15"
                          : "border border-[#D8E2F0] bg-[#F5F8FF] text-[#4A5778] hover:border-[#1E3A8A]/40 hover:bg-[#EAF1FF] hover:text-[#1E3A8A]"
                      } disabled:opacity-60`}
                    >
                      {getStatusLabel(
                        filter,
                      )}

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

        {/* MAIN TABLE */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-[#1E3A8A]/10 bg-white shadow-sm"
        >
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1E3A8A]" />

          {/* DESKTOP */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1100px] border-collapse">
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

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    Quantity
                  </th>

                  <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    Cancellation Amount
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
                  Array.from({
                    length: 6,
                  }).map((_, i) => (
                    <tr
                      key={`skeleton-${i}`}
                      className="animate-pulse border-b border-[#D8E2F0]"
                    >
                      <td className="px-5 py-4">
                        <div className="h-8 w-8 rounded-lg bg-[#EAF1FF]" />
                      </td>

                      <td className="px-5 py-4">
                        <div className="h-6 w-32 rounded-lg bg-[#EAF1FF]" />

                        <div className="mt-2 h-3 w-24 rounded bg-[#F5F8FF]" />
                      </td>

                      <td className="px-5 py-4">
                        <div className="h-4 w-32 rounded bg-[#EAF1FF]" />

                        <div className="mt-2 h-4 w-20 rounded-full bg-[#F5F8FF]" />
                      </td>

                      <td className="px-5 py-4">
                        <div className="h-4 w-8 rounded bg-[#EAF1FF]" />
                      </td>

                      <td className="px-5 py-4">
                        <div className="ml-auto h-4 w-20 rounded bg-[#EAF1FF]" />
                      </td>

                      <td className="px-5 py-4">
                        <div className="h-3 w-40 rounded bg-[#F5F8FF]" />

                        <div className="mt-2 h-3 w-32 rounded bg-[#F5F8FF]" />
                      </td>

                      <td className="px-5 py-4">
                        <div className="h-6 w-24 rounded-full bg-[#EAF1FF]" />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-2">
                          <div className="h-9 w-9 rounded-xl bg-[#EAF1FF]" />

                          <div className="h-9 w-20 rounded-xl bg-[#EAF1FF]" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : paginatedRequests.length > 0 ? (
                  paginatedRequests.map(
                    (
                      request,
                      index,
                    ) => {
                      const requestId =
                        request.order_line_id;

                      const approveLoading =
                        actionLoading.type ===
                          "approve" &&
                        actionLoading.id ===
                          requestId;

                      const canApprove =
                        request.can_approve &&
                        canApproveCancellation;

                      const canReject =
                        request.can_reject &&
                        canRejectCancellation;

                      const raw: any =
                        request;

                      const accountType =
                        getRowAccountType(
                          raw,
                        );

                      return (
                        <tr
                          key={`${requestId}-${index}`}
                          className="group border-b border-[#D8E2F0] bg-white transition hover:bg-[#FAFBFF]"
                        >
                          <td className="px-5 py-4">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F8FF] text-xs font-bold text-[#1E3A8A]">
                              {startIndex +
                                index +
                                1}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div>
                              <span className="inline-flex rounded-lg bg-[#EAF1FF] px-2.5 py-1 text-xs font-bold text-[#1E3A8A]">
                                {
                                  request.order_reference
                                }
                              </span>

                              <p className="mt-2 text-[11px] text-[#8C97B2]">
                                Item Ref:{" "}
                                {raw.item_reference_id ||
                                  "N/A"}
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-[#0F1B3D]">
                              {getCustomerName(
                                request.user,
                              )}
                            </p>

                            <span
                              className={`mt-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold ${getAccountTypeClass(
                                accountType,
                              )}`}
                            >
                              <FiBriefcase
                                size={9}
                              />

                              {getAccountTypeLabel(
                                accountType,
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-[#0F1B3D]">
                              {request.items_count ||
                                1}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <p className="text-sm font-bold text-[#1E3A8A]">
                              {formatCurrency(
                                getRowAmount(
                                  request,
                                ),
                              )}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="line-clamp-2 max-w-[230px] text-xs leading-5 text-[#4A5778]">
                              {request.reason ||
                                "No reason provided."}
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
                                    request,
                                  )
                                }
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] text-[#1E3A8A] transition hover:border-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white"
                                title="View"
                              >
                                <FiEye
                                  size={15}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleView(
                                    request,
                                  )
                                }
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#2563EB]/25 bg-[#DBEAFE] text-[#1E3A8A] transition hover:border-transparent hover:bg-[#1E3A8A] hover:text-white"
                                title="Track Order"
                              >
                                <FiTruck
                                  size={15}
                                />
                              </button>

                              {canApprove && (
                                <button
                                  type="button"
                                  disabled={
                                    approveLoading
                                  }
                                  onClick={() =>
                                    handleOpenApprove(
                                      request,
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
                                      request,
                                    )
                                  }
                                  className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-[#C23B32]/25 bg-[#FBEAEA] px-3 text-[10px] font-bold text-[#C23B32] transition hover:border-[#C23B32] hover:bg-[#C23B32] hover:text-white"
                                >
                                  <FiX
                                    size={13}
                                  />

                                  Reject
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    },
                  )
                ) : (
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
                          No cancellation requests
                          found
                        </p>

                        <p className="mt-1 text-xs text-[#8C97B2]">
                          Try changing your
                          search or status
                          filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE */}
          <div className="block lg:hidden">
            {loading ? (
              Array.from({
                length: 4,
              }).map((_, i) => (
                <div
                  key={`mobile-skeleton-${i}`}
                  className="animate-pulse border-b border-[#D8E2F0] bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="h-6 w-32 rounded-lg bg-[#EAF1FF]" />

                    <div className="h-8 w-8 rounded-lg bg-[#EAF1FF]" />
                  </div>

                  <div className="mt-4">
                    <div className="h-4 w-28 rounded bg-[#EAF1FF]" />

                    <div className="mt-2 h-3 w-40 rounded bg-[#F5F8FF]" />

                    <div className="mt-2 h-4 w-20 rounded-full bg-[#F5F8FF]" />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="h-16 rounded-xl bg-[#EAF1FF]" />

                    <div className="h-16 rounded-xl bg-[#EAF1FF]" />
                  </div>

                  <div className="mt-4 flex gap-2">
                    <div className="h-9 w-9 rounded-xl bg-[#EAF1FF]" />

                    <div className="h-9 w-9 rounded-xl bg-[#EAF1FF]" />
                  </div>
                </div>
              ))
            ) : paginatedRequests.length > 0 ? (
              paginatedRequests.map(
                (
                  request,
                  index,
                ) => {
                  const requestId =
                    request.order_line_id;

                  const approveLoading =
                    actionLoading.type ===
                      "approve" &&
                    actionLoading.id ===
                      requestId;

                  const canApprove =
                    request.can_approve &&
                    canApproveCancellation;

                  const canReject =
                    request.can_reject &&
                    canRejectCancellation;

                  const accountType =
                    getRowAccountType(
                      request,
                    );

                  return (
                    <div
                      key={`${requestId}-${index}`}
                      className="border-b border-[#D8E2F0] bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="inline-flex rounded-lg bg-[#EAF1FF] px-2.5 py-1 text-xs font-bold text-[#1E3A8A]">
                            {
                              request.order_reference
                            }
                          </span>

                          <p className="mt-2 text-[10px] text-[#8C97B2]">
                            Item Ref:{" "}
                            {(request as any)
                              .item_reference_id ||
                              "N/A"}
                          </p>
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

                        <p className="mt-1 truncate text-xs text-[#8C97B2]">
                          {
                            request.user
                              ?.email
                          }
                        </p>

                        <span
                          className={`mt-1.5 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getAccountTypeClass(
                            accountType,
                          )}`}
                        >
                          <FiBriefcase
                            size={10}
                          />

                          {getAccountTypeLabel(
                            accountType,
                          )}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                            Amount
                          </p>

                          <p className="mt-1 text-base font-bold text-[#1E3A8A]">
                            {formatCurrency(
                              getRowAmount(
                                request,
                              ),
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                            Items
                          </p>

                          <p className="mt-1 text-base font-bold text-[#0F1B3D]">
                            {request.items_count ||
                              1}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
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
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleView(
                              request,
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
                              request,
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
                              handleOpenApprove(
                                request,
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1E3A8A] text-white disabled:opacity-50"
                            title="Approve"
                          >
                            {approveLoading ? (
                              <FiRefreshCw
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <FiCheck
                                size={15}
                              />
                            )}
                          </button>
                        )}

                        {canReject && (
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenReject(
                                request,
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FBEAEA] text-[#C23B32]"
                            title="Reject"
                          >
                            <FiX size={15} />
                          </button>
                        )}
                      </div>

                      <div className="mt-3 rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] p-3">
                        <p className="text-xs leading-5 text-[#4A5778]">
                          {request.reason ||
                            "No reason provided."}
                        </p>
                      </div>

                      <div className="mt-3 rounded-xl border border-[#1E3A8A]/20 bg-gradient-to-r from-[#EAF1FF] to-[#f4f8ff] p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">
                            Cancellation Amount
                          </span>

                          <span className="text-sm font-bold text-[#1E3A8A]">
                            {formatCurrency(
                              getRowAmount(
                                request,
                              ),
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
                  No cancellation requests
                  found
                </p>

                <p className="mt-1 text-xs text-[#8C97B2]">
                  Try changing your search
                  or status filter.
                </p>
              </div>
            )}
          </div>

          {/* PAGINATION */}
          {!loading &&
            filteredRequests.length >
              0 && (
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
                      {
                        filteredRequests.length
                      }
                    </span>{" "}
                    entries
                  </p>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={
                        currentPage ===
                        1
                      }
                      onClick={() =>
                        handlePageChange(
                          currentPage -
                            1,
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8E2F0] bg-white text-[#1E3A8A] transition hover:bg-[#EAF1FF] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <FiChevronLeft
                        size={17}
                      />
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
                            currentPage ===
                            page
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
                          currentPage +
                            1,
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8E2F0] bg-white text-[#1E3A8A] transition hover:bg-[#EAF1FF] disabled:cursor-not-allowed disabled:opacity-30"
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
      </motion.div>

      {/* DETAIL MODAL */}
      <CancellationDetailModal
        open={detailModalOpen}
        detail={selectedDetail}
        actionLoading={
          actionLoading
        }
        canApprove={
          canApproveCancellation
        }
        canReject={
          canRejectCancellation
        }
        onClose={() =>
          setDetailModalOpen(false)
        }
        onApprove={() => {
          if (!selectedDetail)
            return;

          if (
            !canApproveCancellation
          ) {
            toast.error(
              "You do not have permission to approve cancellation requests.",
            );
            return;
          }

          setDetailModalOpen(false);

          handleOpenApprove(
            selectedDetail,
          );
        }}
        onReject={() => {
          if (!selectedDetail)
            return;

          if (
            !canRejectCancellation
          ) {
            toast.error(
              "You do not have permission to reject cancellation requests.",
            );
            return;
          }

          setDetailModalOpen(false);

          handleOpenReject(
            selectedDetail,
          );
        }}
      />

      {/* REJECT POPUP */}
      <RejectPopup
        open={rejectModalOpen}
        loading={
          actionLoading.type ===
          "reject"
        }
        onClose={() =>
          setRejectModalOpen(false)
        }
        onConfirm={handleReject}
      />

      {/* PAY POPUP */}
      <PayPopup
        open={payModalOpen}
        orderLineId={
          selectedPayRequest?.order_line_id ||
          null
        }
        orderReference={
          selectedPayRequest?.order_reference ||
          "N/A"
        }
        customerName={getCustomerName(
          selectedPayRequest?.user,
        )}
        defaultAmount={Number(
          selectedPayRequest
            ?.refund_amount ||
            selectedPayRequest?.amount ||
            0,
        )}
        loading={
          actionLoading.type ===
          "approve"
        }
        onClose={() =>
          setPayModalOpen(false)
        }
        onConfirm={
          handleApproveWithPay
        }
      />
    </>
  );
};

export default CancelRefund;