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
  FiTruck,
  FiRefreshCw,
  FiDollarSign,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiCalendar,
  FiFileText,
  FiAlertCircle,
  FiClock,
  FiCheckCircle,
  FiImage,
  FiCreditCard,
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

import GlobalModal from "@/components/common/GlobalModal";
import returnApi, {
  ReturnListItem,
  ReturnStatus,
  SingleReturnResponse,
} from "../../api/endpoints/return";

// =====================================================
// ANIMATION VARIANTS
// =====================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
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
  type:
    | "approve"
    | "reject"
    | "received"
    | "complete"
    | "payment"
    | null;
  id: number | null;
}

// =====================================================
// HELPERS
// =====================================================

const getStatusLabel = (
  status: string
) => {
  if (!status) return "N/A";

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
};

const getStatusClass = (
  status: string
) => {
  switch (status) {
    case "pending":
      return "border-[#d9a441]/30 bg-[#fff8e8] text-[#a06f13]";

    case "approved":
      return "border-[#b8902e]/25 bg-[#f8f3e5] text-[#8f6d1d]";

    case "received":
      return "border-[#d4af52]/30 bg-[#fffaf0] text-[#9a741c]";

    case "completed":
      return "border-[#a8841c]/25 bg-[#f4f0df] text-[#806319]";

    case "rejected":
      return "border-[#c98d83]/25 bg-[#fff8f6] text-[#b46055]";

    default:
      return "border-[#d8d1c4] bg-[#f6f4ef] text-[#857b6c]";
  }
};

const getStatusDot = (
  status: string
) => {
  switch (status) {
    case "pending":
      return "bg-[#d9a441]";

    case "approved":
      return "bg-[#b8902e]";

    case "received":
      return "bg-[#c49b3a]";

    case "completed":
      return "bg-[#806319]";

    case "rejected":
      return "bg-[#b46055]";

    default:
      return "bg-[#a89a7d]";
  }
};

const formatDate = (
  date?: string | null
) => {
  if (!date) return "—";

  const parsed = new Date(
    date.replace(" ", "T")
  );

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleString(
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

const formatCurrency = (
  amount?: number | null
) => {
  return `₹${Number(
    amount || 0
  ).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const getCustomerName = (
  user?: {
    name?: string | null;
    email?: string;
  }
) => {
  if (user?.name?.trim()) {
    return user.name;
  }

  if (user?.email) {
    return user.email.split("@")[0];
  }

  return "Customer";
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

const ReturnStatCard: React.FC<
  ReturnStatCardProps
> = ({
  title,
  value,
  subtitle,
  icon,
  accent,
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
          "0 16px 30px -18px rgba(140,105,25,0.30)",
      }}
      className="relative min-h-[135px] overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white p-5 shadow-sm"
    >
      <div
        className={`absolute left-0 top-0 h-1 w-full ${accent}`}
      />

      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full border border-[#d4af52]/20" />

      <div className="pointer-events-none absolute -right-3 -top-3 h-14 w-14 rounded-full border border-[#b8902e]/10" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#a89a7d]">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-[#2a2620]">
            {value.toLocaleString(
              "en-IN"
            )}
          </p>

          <p className="mt-1 text-xs text-[#786f60]">
            {subtitle}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

// =====================================================
// PAYMENT POPUP
// =====================================================

interface PaymentPopupProps {
  open: boolean;
  amount: number;
  orderReference: string;
  customerName: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const PaymentPopup: React.FC<
  PaymentPopupProps
> = ({
  open,
  amount,
  orderReference,
  customerName,
  loading,
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={!loading}
    >
      <div className="w-full max-w-[470px] overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

        {/* Header */}

        <div className="flex items-start justify-between gap-4 border-b border-[#b8902e]/10 px-5 py-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#b8902e]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#b8902e]">
                Refund Payment
              </span>
            </div>

            <h2 className="text-lg font-bold text-[#2a2620]">
              Send Payment
            </h2>

            <p className="mt-1 text-xs text-[#a89a7d]">
              Process the refund amount for this
              approved return.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] text-[#8f6d1d] transition hover:bg-[#b8902e]/10 disabled:opacity-50"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Body */}

        <div className="space-y-4 p-5">
          {/* Amount */}

          <div className="relative overflow-hidden rounded-2xl border border-[#b8902e]/20 bg-gradient-to-br from-[#fffaf0] to-[#f8f1df] p-5 text-center">
            <div className="pointer-events-none absolute -right-7 -top-7 h-20 w-20 rounded-full border border-[#d4af52]/20" />

            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a06f13]">
              Return Amount
            </p>

            <p className="mt-2 text-4xl font-bold text-[#8f6d1d]">
              {formatCurrency(
                amount
              )}
            </p>

            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-[#786f60]">
              <FiCreditCard size={14} />

              Refund payment amount
            </div>
          </div>

          {/* Order */}

          <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
            <div className="flex justify-between gap-4">
              <span className="text-xs text-[#a89a7d]">
                Order
              </span>

              <span className="text-right text-sm font-bold text-[#2a2620]">
                {orderReference}
              </span>
            </div>

            <div className="mt-3 flex justify-between gap-4 border-t border-[#b8902e]/10 pt-3">
              <span className="text-xs text-[#a89a7d]">
                Customer
              </span>

              <span className="text-right text-sm font-semibold text-[#2a2620]">
                {customerName}
              </span>
            </div>
          </div>

          {/* Notice */}

          <div className="rounded-xl border border-[#b8902e]/15 bg-[#fffaf0] p-3">
            <p className="text-xs leading-5 text-[#786f60]">
              Once payment is processed, the refund
              should be sent using your configured
              payment/refund gateway.
            </p>
          </div>
        </div>

        {/* Footer */}

        <div className="flex justify-end gap-3 border-t border-[#b8902e]/10 bg-[#fffdfa] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-[#b8902e]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#786f60] transition hover:bg-[#faf8f3] hover:text-[#8f6d1d] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#b8902e]/20 transition hover:from-[#a8841c] hover:to-[#795b14] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <FiRefreshCw
                size={15}
                className="animate-spin"
              />
            ) : (
              <FiDollarSign
                size={15}
              />
            )}

            {loading
              ? "Processing..."
              : "Send Payment"}
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
  onConfirm: (
    rejectionReason: string,
    adminNotes: string
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
      <div className="w-full max-w-[500px] overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-[#d4af52] to-[#b46055]" />

        <div className="flex items-start justify-between border-b border-[#b8902e]/10 px-5 py-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#b46055]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#b46055]">
                Return Review
              </span>
            </div>

            <h2 className="text-lg font-bold text-[#2a2620]">
              Reject Return
            </h2>

            <p className="mt-1 text-xs text-[#a89a7d]">
              Enter the reason for rejecting this
              request.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] text-[#786f60] disabled:opacity-50"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6b6152]">
              Rejection Reason{" "}
              <span className="text-[#b46055]">
                *
              </span>
            </label>

            <textarea
              value={
                rejectionReason
              }
              onChange={(e) =>
                setRejectionReason(
                  e.target.value
                )
              }
              rows={4}
              placeholder="Enter rejection reason..."
              className="w-full resize-none rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 py-3 text-sm text-[#2a2620] outline-none transition focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6b6152]">
              Admin Notes
            </label>

            <textarea
              value={
                adminNotes
              }
              onChange={(e) =>
                setAdminNotes(
                  e.target.value
                )
              }
              rows={3}
              placeholder="Optional internal notes..."
              className="w-full resize-none rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 py-3 text-sm text-[#2a2620] outline-none transition focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#b8902e]/10 bg-[#fffdfa] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-[#b8902e]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#786f60]"
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
                adminNotes.trim()
              )
            }
            className="flex items-center gap-2 rounded-xl bg-[#b46055] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#9e5048] disabled:opacity-50"
          >
            {loading && (
              <FiRefreshCw
                size={14}
                className="animate-spin"
              />
            )}

            Reject Return
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
  onPayment: () => void;
}

const ReturnDetailModal: React.FC<
  ReturnDetailModalProps
> = ({
  open,
  loading,
  detail,
  actionLoading,
  onClose,
  onApprove,
  onReject,
  onReceived,
  onComplete,
  onPayment,
}) => {
  if (!open) return null;

  if (loading) {
    return (
      <GlobalModal
        isOpen={open}
        onClose={onClose}
        closeOnOverlayClick={false}
      >
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
          <div className="h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

          <div className="flex min-h-[320px] flex-col items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#b8902e]/10 text-[#b8902e]">
              <FiRefreshCw
                size={27}
                className="animate-spin"
              />
            </div>

            <p className="mt-4 text-sm font-bold text-[#2a2620]">
              Loading return details...
            </p>

            <p className="mt-1 text-xs text-[#a89a7d]">
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
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
          <div className="h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

          <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#b46055]/10 text-[#b46055]">
              <FiAlertCircle size={28} />
            </div>

            <p className="mt-4 text-sm font-bold text-[#b46055]">
              Return details not found.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="mt-5 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-6 py-2.5 text-sm font-bold text-white"
            >
              Close
            </button>
          </div>
        </div>
      </GlobalModal>
    );
  }

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={false}
    >
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
        {/* TOP ACCENT */}

        <div className="h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

        {/* HEADER */}

        <div className="flex items-start justify-between gap-4 border-b border-[#b8902e]/10 px-5 py-4 sm:px-6">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#b8902e]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#b8902e]">
                Returns & Refunds
              </span>
            </div>

            <h2 className="text-xl font-bold text-[#2a2620]">
              Return Request
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#a89a7d]">
              <span>
                Request #{detail.id}
              </span>

              <span>•</span>

              <span>
                {
                  detail.order
                    .order_reference
                }
              </span>

              <span>•</span>

              <span>
                {formatDate(
                  detail.created_at
                )}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] text-[#8f6d1d] hover:bg-[#b8902e]/10"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* BODY */}

        <div className="max-h-[calc(95vh-185px)] overflow-y-auto p-5 sm:p-6">
          {/* SUMMARY */}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                Status
              </p>

              <div className="mt-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusClass(
                    detail.status
                  )}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${getStatusDot(
                      detail.status
                    )}`}
                  />

                  {getStatusLabel(
                    detail.status
                  )}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#b8902e]/20 bg-gradient-to-br from-[#fffaf0] to-[#f8f1df] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#a06f13]">
                Return Amount
              </p>

              <p className="mt-1 text-2xl font-bold text-[#8f6d1d]">
                {formatCurrency(
                  detail.refund_details
                    ?.total
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                Items
              </p>

              <p className="mt-1 text-2xl font-bold text-[#2a2620]">
                {detail.items.length}
              </p>
            </div>
          </div>

          {/* CUSTOMER + ORDER */}

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                  <FiUser size={17} />
                </div>

                <h3 className="text-sm font-bold text-[#2a2620]">
                  Customer Information
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between gap-4 border-b border-[#b8902e]/10 pb-2.5">
                  <span className="text-xs text-[#a89a7d]">
                    Name
                  </span>

                  <span className="text-right text-sm font-semibold text-[#2a2620]">
                    {getCustomerName(
                      detail.user
                    )}
                  </span>
                </div>

                <div className="flex justify-between gap-4 border-b border-[#b8902e]/10 pb-2.5">
                  <span className="text-xs text-[#a89a7d]">
                    Email
                  </span>

                  <span className="max-w-[65%] truncate text-right text-sm font-semibold text-[#2a2620]">
                    {detail.user.email}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-xs text-[#a89a7d]">
                    Phone
                  </span>

                  <span className="text-sm font-semibold text-[#2a2620]">
                    {detail.user.phone ||
                      "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                  <FiPackage size={17} />
                </div>

                <h3 className="text-sm font-bold text-[#2a2620]">
                  Order Information
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between gap-4 border-b border-[#b8902e]/10 pb-2.5">
                  <span className="text-xs text-[#a89a7d]">
                    Order Reference
                  </span>

                  <span className="text-right text-sm font-bold text-[#8f6d1d]">
                    {
                      detail.order
                        .order_reference
                    }
                  </span>
                </div>

                <div className="flex justify-between gap-4 border-b border-[#b8902e]/10 pb-2.5">
                  <span className="text-xs text-[#a89a7d]">
                    Order Status
                  </span>

                  <span className="text-sm font-semibold capitalize text-[#2a2620]">
                    {getStatusLabel(
                      detail.order
                        .status
                    )}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-xs text-[#a89a7d]">
                    Delivered At
                  </span>

                  <span className="text-right text-xs font-semibold text-[#4a4436]">
                    {formatDate(
                      detail.order
                        .delivered_at
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RETURN REASON */}

          <div className="mt-5 rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                <FiFileText size={17} />
              </div>

              <h3 className="text-sm font-bold text-[#2a2620]">
                Return Reason
              </h3>
            </div>

            <p className="text-sm leading-6 text-[#6b6152]">
              {detail.reason ||
                "No overall reason provided."}
            </p>
          </div>

          {/* ITEMS */}

          <div className="mt-5 overflow-hidden rounded-2xl border border-[#b8902e]/15">
            <div className="border-b border-[#b8902e]/10 bg-[#fffdfa] px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                    <FiPackage size={17} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#2a2620]">
                      Returned Items
                    </h3>

                    <p className="mt-0.5 text-xs text-[#a89a7d]">
                      {
                        detail.items
                          .length
                      }{" "}
                      item(s)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="divide-y divide-[#b8902e]/10">
              {detail.items.map(
                (item) => (
                  <div
                    key={
                      item.order_line_id
                    }
                    className="p-5"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start gap-4">
                        {/* PRODUCT IMAGE */}

                        {item.product
                          .image ? (
                          <img
                            src={
                              item
                                .product
                                .image
                            }
                            alt={
                              item
                                .product
                                .name
                            }
                            className="h-16 w-16 shrink-0 rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] text-[#b8902e]">
                            <FiPackage
                              size={
                                22
                              }
                            />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-[#2a2620]">
                            {
                              item
                                .product
                                .name
                            }
                          </h4>

                          <p className="mt-1 text-xs text-[#a89a7d]">
                            SKU:{" "}
                            {
                              item
                                .product
                                .product_code
                            }
                          </p>

                          <p className="mt-2 text-sm font-semibold text-[#8f6d1d]">
                            Qty:{" "}
                            {
                              item.quantity
                            }
                          </p>
                        </div>
                      </div>

                      {/* RETURN IMAGES */}

                      {item.image_urls &&
                        item.image_urls
                          .length > 0 && (
                          <div>
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                              Return Images
                            </p>

                            <div className="flex flex-wrap gap-3">
                              {item.image_urls.map(
                                (
                                  imageUrl,
                                  imageIndex
                                ) => (
                                  <a
                                    key={`${item.order_line_id}-${imageIndex}`}
                                    href={
                                      imageUrl
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group relative overflow-hidden rounded-xl border border-[#b8902e]/15 bg-[#faf8f3]"
                                  >
                                    <img
                                      src={
                                        imageUrl
                                      }
                                      alt={`Return evidence ${
                                        imageIndex +
                                        1
                                      }`}
                                      className="h-20 w-20 object-cover transition-transform duration-300 group-hover:scale-105"
                                    />

                                    <div className="absolute inset-0 flex items-center justify-center bg-[#2f2a22]/0 transition group-hover:bg-[#2f2a22]/30">
                                      <FiEye
                                        size={
                                          15
                                        }
                                        className="text-white opacity-0 transition group-hover:opacity-100"
                                      />
                                    </div>
                                  </a>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* ITEM INFO */}

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                            Unit Price
                          </p>

                          <p className="mt-1 text-sm font-bold text-[#2a2620]">
                            {formatCurrency(
                              item.unit_price
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                            Subtotal
                          </p>

                          <p className="mt-1 text-sm font-bold text-[#2a2620]">
                            {formatCurrency(
                              item.subtotal
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                            Tax
                          </p>

                          <p className="mt-1 text-sm font-bold text-[#2a2620]">
                            {formatCurrency(
                              item.tax
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#b8902e]/20 bg-[#fffaf0] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#a06f13]">
                            Reason
                          </p>

                          <p className="mt-1 line-clamp-2 text-xs font-semibold text-[#786f60]">
                            {item.reason ||
                              "No reason"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* REFUND */}

          <div className="mt-5 rounded-2xl border border-[#b8902e]/15 bg-[#faf8f3] p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                <FiDollarSign size={17} />
              </div>

              <h3 className="text-sm font-bold text-[#2a2620]">
                Refund Summary
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-[#b8902e]/10 bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                  Subtotal
                </p>

                <p className="mt-1 text-base font-bold text-[#2a2620]">
                  {formatCurrency(
                    detail.refund_details
                      ?.subtotal
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-[#b8902e]/10 bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                  Tax
                </p>

                <p className="mt-1 text-base font-bold text-[#2a2620]">
                  {formatCurrency(
                    detail.refund_details
                      ?.tax
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-[#b8902e]/10 bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                  Shipping
                </p>

                <p className="mt-1 text-base font-bold text-[#2a2620]">
                  {formatCurrency(
                    detail.refund_details
                      ?.shipping
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-[#b8902e]/20 bg-gradient-to-br from-[#fffaf0] to-[#f8f1df] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#a06f13]">
                  Return Amount
                </p>

                <p className="mt-1 text-xl font-bold text-[#8f6d1d]">
                  {formatCurrency(
                    detail.refund_details
                      ?.total
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* TIMELINE */}

          <div className="mt-5 rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                <FiCalendar size={17} />
              </div>

              <h3 className="text-sm font-bold text-[#2a2620]">
                Return Timeline
              </h3>
            </div>

            <div className="space-y-5">
              {/* CREATED */}

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#b8902e]/10">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#b8902e]" />
                  </div>

                  <div className="h-10 w-px bg-[#d4af52]/30" />
                </div>

                <div className="pt-1">
                  <p className="text-sm font-bold text-[#2a2620]">
                    Return Requested
                  </p>

                  <p className="mt-1 text-xs text-[#a89a7d]">
                    {formatDate(
                      detail.created_at
                    )}
                  </p>
                </div>
              </div>

              {/* APPROVED */}

              {detail.approved_at && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#b8902e]/10">
                      <div className="h-2.5 w-2.5 rounded-full bg-[#b8902e]" />
                    </div>

                    <div className="h-10 w-px bg-[#d4af52]/30" />
                  </div>

                  <div className="pt-1">
                    <p className="text-sm font-bold text-[#2a2620]">
                      Return Approved
                    </p>

                    <p className="mt-1 text-xs text-[#a89a7d]">
                      {formatDate(
                        detail.approved_at
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* RECEIVED */}

              {detail.received_at && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d4af52]/15">
                      <div className="h-2.5 w-2.5 rounded-full bg-[#c49b3a]" />
                    </div>

                    <div className="h-10 w-px bg-[#d4af52]/30" />
                  </div>

                  <div className="pt-1">
                    <p className="text-sm font-bold text-[#2a2620]">
                      Return Received
                    </p>

                    <p className="mt-1 text-xs text-[#a89a7d]">
                      {formatDate(
                        detail.received_at
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* COMPLETED */}

              {detail.completed_at && (
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#806319]/10">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#806319]" />
                  </div>

                  <div className="pt-1">
                    <p className="text-sm font-bold text-[#2a2620]">
                      Return Completed
                    </p>

                    <p className="mt-1 text-xs text-[#a89a7d]">
                      {formatDate(
                        detail.completed_at
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* REJECTED */}

              {detail.status ===
                "rejected" &&
                detail.rejection_reason && (
                  <div className="rounded-xl border border-[#c98d83]/20 bg-[#fff8f6] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#b46055]">
                      Rejection Reason
                    </p>

                    <p className="mt-1 text-sm leading-6 text-[#8d544d]">
                      {
                        detail.rejection_reason
                      }
                    </p>
                  </div>
                )}
            </div>
          </div>

          {/* ADMIN NOTES */}

          {detail.admin_notes && (
            <div className="mt-5 rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                Admin Notes
              </p>

              <p className="mt-2 text-sm leading-6 text-[#6b6152]">
                {detail.admin_notes}
              </p>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}

        <div className="border-t border-[#b8902e]/10 bg-[#fffdfa] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#b8902e]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#786f60] transition hover:bg-[#faf8f3] hover:text-[#8f6d1d]"
            >
              Close
            </button>

            <div className="flex flex-wrap justify-end gap-2">
              {/* APPROVE */}

              {detail.can_approve && (
                <button
                  type="button"
                  onClick={
                    onApprove
                  }
                  disabled={
                    actionLoading.type ===
                    "approve"
                  }
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#b8902e]/15 transition hover:from-[#a8841c] hover:to-[#795b14] disabled:opacity-50"
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

                  Accept Return
                </button>
              )}

              {/* REJECT */}

              {detail.can_reject && (
                <button
                  type="button"
                  onClick={
                    onReject
                  }
                  disabled={
                    actionLoading.type ===
                    "reject"
                  }
                  className="flex items-center gap-2 rounded-xl border border-[#c98d83]/25 bg-[#fff8f6] px-4 py-2.5 text-xs font-bold text-[#b46055] transition hover:bg-[#fcefeb] disabled:opacity-50"
                >
                  <FiX size={14} />

                  Reject Return
                </button>
              )}

              {/* SEND PAYMENT AFTER APPROVED */}

              {detail.status ===
                "approved" && (
                <button
                  type="button"
                  onClick={
                    onPayment
                  }
                  className="flex items-center gap-2 rounded-xl border border-[#b8902e]/20 bg-[#fffaf0] px-4 py-2.5 text-xs font-bold text-[#8f6d1d] transition hover:bg-[#f8f1df]"
                >
                  <FiDollarSign
                    size={14}
                  />

                  Send Payment
                </button>
              )}

              {/* MARK RECEIVED */}

              {detail.can_mark_received && (
                <button
                  type="button"
                  onClick={
                    onReceived
                  }
                  disabled={
                    actionLoading.type ===
                    "received"
                  }
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#b8902e]/15 transition hover:from-[#a8841c] hover:to-[#795b14] disabled:opacity-50"
                >
                  {actionLoading.type ===
                  "received" ? (
                    <FiRefreshCw
                      size={14}
                      className="animate-spin"
                    />
                  ) : (
                    <FiTruck size={14} />
                  )}

                  Mark Received
                </button>
              )}

              {/* COMPLETE */}

              {detail.can_complete && (
                <button
                  type="button"
                  onClick={
                    onComplete
                  }
                  disabled={
                    actionLoading.type ===
                    "complete"
                  }
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#806319] to-[#66500f] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#806319]/15 transition hover:from-[#705813] hover:to-[#56430d] disabled:opacity-50"
                >
                  {actionLoading.type ===
                  "complete" ? (
                    <FiRefreshCw
                      size={14}
                      className="animate-spin"
                    />
                  ) : (
                    <FiCheckCircle
                      size={14}
                    />
                  )}

                  Complete Return
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
  const [requests, setRequests] =
    useState<ReturnListItem[]>([]);

  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState<ReturnFilterTab>(
      "All"
    );

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  const [
    selectedDetail,
    setSelectedDetail,
  ] =
    useState<
      SingleReturnResponse["data"] | null
    >(null);

  const [
    detailModalOpen,
    setDetailModalOpen,
  ] = useState(false);

  const [
    rejectModalOpen,
    setRejectModalOpen,
  ] = useState(false);

  const [
    paymentModalOpen,
    setPaymentModalOpen,
  ] = useState(false);

  const [
    actionLoading,
    setActionLoading,
  ] =
    useState<ActionLoading>({
      type: null,
      id: null,
    });

  const [
    paymentLoading,
    setPaymentLoading,
  ] = useState(false);

  const ITEMS_PER_PAGE = 10;

  // ===================================================
  // FETCH ALL
  // ===================================================

  const fetchReturnRequests =
    async () => {
      try {
        setLoading(true);

        const response =
          await returnApi.getAll(
            1,
            100,
            undefined,
            "all",
            "created_at",
            "desc"
          );

        if (
          response.data.success
        ) {
          const list =
            response.data.data
              ?.data || [];

          setRequests(list);
        } else {
          toast.error(
            "Unable to fetch return requests."
          );
        }
      } catch (error: any) {
        console.error(
          "Get return requests error:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            "Unable to fetch return requests."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchReturnRequests();
  }, []);

  // ===================================================
  // STATS FROM API
  // ===================================================

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter(
        (item) =>
          item.status ===
          "pending"
      ).length,
      approved: requests.filter(
        (item) =>
          item.status ===
          "approved"
      ).length,
      completed: requests.filter(
        (item) =>
          item.status ===
          "completed"
      ).length,
    };
  }, [requests]);

  // ===================================================
  // FILTER
  // ===================================================

  const filteredRequests =
    useMemo(() => {
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
              request.user.name ||
                "",
              request.user.email ||
                "",
              request.reason ||
                "",
              String(
                request.id
              ),
            ]
              .join(" ")
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            activeFilter ===
              "All" ||
            request.status ===
              activeFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
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
        ITEMS_PER_PAGE
    )
  );

  const startIndex =
    (currentPage - 1) *
    ITEMS_PER_PAGE;

  const paginatedRequests =
    filteredRequests.slice(
      startIndex,
      startIndex +
        ITEMS_PER_PAGE
    );

  const startEntry =
    filteredRequests.length ===
    0
      ? 0
      : startIndex + 1;

  const endEntry = Math.min(
    startIndex +
      ITEMS_PER_PAGE,
    filteredRequests.length
  );

  // ===================================================
  // FETCH DETAIL
  // ===================================================

  const fetchReturnDetail =
    async (id: number) => {
      try {
        setDetailLoading(true);

        const response =
          await returnApi.getById(
            id
          );

        if (
          response.data.success
        ) {
          setSelectedDetail(
            response.data.data
          );
        } else {
          toast.error(
            "Unable to fetch return details."
          );
        }
      } catch (error: any) {
        console.error(
          "Return detail error:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            "Unable to fetch return details."
        );
      } finally {
        setDetailLoading(false);
      }
    };

  // ===================================================
  // OPEN DETAIL
  // ===================================================

  const handleView = async (
    id: number
  ) => {
    setDetailModalOpen(true);
    setSelectedDetail(null);

    await fetchReturnDetail(id);
  };

  // ===================================================
  // DIRECT ACCEPT
  // ===================================================

  const handleDirectApprove =
    async (id: number) => {
      try {
        setActionLoading({
          type: "approve",
          id,
        });

        const response =
          await returnApi.approve(
            id
          );

        if (
          response.data.success
        ) {
          toast.success(
            response.data
              .message ||
              "Return approved successfully."
          );

          await fetchReturnRequests();

          if (
            selectedDetail?.id ===
            id
          ) {
            await fetchReturnDetail(
              id
            );
          }
        } else {
          toast.error(
            response.data
              .message ||
              "Unable to approve return."
          );
        }
      } catch (error: any) {
        console.error(
          "Approve return error:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            "Unable to approve return."
        );
      } finally {
        setActionLoading({
          type: null,
          id: null,
        });
      }
    };

  // ===================================================
  // APPROVE FROM MODAL
  // ===================================================

  const handleApprove =
    async () => {
      if (!selectedDetail)
        return;

      await handleDirectApprove(
        selectedDetail.id
      );
    };

  // ===================================================
  // OPEN REJECT
  // ===================================================

  const handleOpenReject = async (
    id: number
  ) => {
    if (
      selectedDetail?.id !== id
    ) {
      await fetchReturnDetail(
        id
      );
    }

    setRejectModalOpen(true);
  };

  // ===================================================
  // REJECT
  // ===================================================

  const handleReject = async (
    rejectionReason: string,
    adminNotes: string
  ) => {
    const id =
      selectedDetail?.id;

    if (!id) return;

    try {
      setActionLoading({
        type: "reject",
        id,
      });

      const response =
        await returnApi.reject(
          id,
          rejectionReason,
          adminNotes ||
            undefined
        );

      if (
        response.data.success
      ) {
        toast.success(
          response.data
            .message ||
            "Return rejected successfully."
        );

        setRejectModalOpen(
          false
        );

        await fetchReturnRequests();
        await fetchReturnDetail(
          id
        );
      } else {
        toast.error(
          response.data
            .message ||
            "Unable to reject return."
        );
      }
    } catch (error: any) {
      console.error(
        "Reject return error:",
        error
      );

      toast.error(
        error?.response?.data
          ?.message ||
          "Unable to reject return."
      );
    } finally {
      setActionLoading({
        type: null,
        id: null,
      });
    }
  };

  // ===================================================
  // MARK RECEIVED
  // ===================================================

  const handleMarkReceived =
    async () => {
      if (!selectedDetail)
        return;

      try {
        setActionLoading({
          type: "received",
          id: selectedDetail.id,
        });

        const response =
          await returnApi.markReceived(
            selectedDetail.id
          );

        if (
          response.data.success
        ) {
          toast.success(
            response.data
              .message ||
              "Return marked as received."
          );

          await fetchReturnRequests();
          await fetchReturnDetail(
            selectedDetail.id
          );
        } else {
          toast.error(
            response.data
              .message ||
              "Unable to mark return as received."
          );
        }
      } catch (error: any) {
        console.error(
          "Mark received error:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            "Unable to mark return as received."
        );
      } finally {
        setActionLoading({
          type: null,
          id: null,
        });
      }
    };

  // ===================================================
  // COMPLETE
  // ===================================================

  const handleComplete =
    async () => {
      if (!selectedDetail)
        return;

      try {
        setActionLoading({
          type: "complete",
          id: selectedDetail.id,
        });

        const response =
          await returnApi.complete(
            selectedDetail.id
          );

        if (
          response.data.success
        ) {
          toast.success(
            response.data
              .message ||
              "Return completed successfully."
          );

          await fetchReturnRequests();
          await fetchReturnDetail(
            selectedDetail.id
          );
        } else {
          toast.error(
            response.data
              .message ||
              "Unable to complete return."
          );
        }
      } catch (error: any) {
        console.error(
          "Complete return error:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            "Unable to complete return."
        );
      } finally {
        setActionLoading({
          type: null,
          id: null,
        });
      }
    };

  // ===================================================
  // OPEN PAYMENT
  // ===================================================

  const handleOpenPayment = () => {
    if (!selectedDetail)
      return;

    if (
      selectedDetail.status !==
      "approved"
    ) {
      toast.error(
        "Payment is available only for approved returns."
      );
      return;
    }

    setPaymentModalOpen(true);
  };

  // ===================================================
  // SEND PAYMENT
  // ===================================================

  const handleSendPayment =
    async () => {
      if (!selectedDetail)
        return;

      setPaymentLoading(true);

      /*
       * IMPORTANT:
       *
       * There is no payment/refund endpoint
       * in the provided returnApi.
       *
       * This UI is ready and shows the exact
       * return amount. Replace the block below
       * with the actual payment API once backend
       * endpoint is available.
       */

      try {
        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              700
            )
        );

        toast.success(
          `Refund payment of ${formatCurrency(
            selectedDetail
              .refund_details
              ?.total
          )} is ready to process.`
        );

        setPaymentModalOpen(
          false
        );
      } finally {
        setPaymentLoading(false);
      }
    };

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh =
    async () => {
      await fetchReturnRequests();

      if (selectedDetail) {
        await fetchReturnDetail(
          selectedDetail.id
        );
      }

      toast.success(
        "Return requests refreshed."
      );
    };

  // ===================================================
  // FILTER
  // ===================================================

  const handleFilterChange = (
    filter: ReturnFilterTab
  ) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  // ===================================================
  // SEARCH
  // ===================================================

  const handleSearch = (
    value: string
  ) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // ===================================================
  // PAGINATION
  // ===================================================

  const handlePageChange = (
    page: number
  ) => {
    if (
      page < 1 ||
      page > totalPages
    ) {
      return;
    }

    setCurrentPage(page);
  };

  const paginationPages =
    useMemo(() => {
      if (totalPages <= 5) {
        return Array.from(
          {
            length: totalPages,
          },
          (_, index) =>
            index + 1
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
    }, [
      currentPage,
      totalPages,
    ]);

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <>
      <motion.div
        className="min-h-screen bg-[#faf8f3] p-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {
            opacity: 0,
          },
          visible: {
            opacity: 1,
          },
        }}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#b8902e]" />

              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b8902e]">
                Returns & Refunds
              </span>
            </div>

            <h1 className="font-serif text-[28px] font-bold tracking-tight text-[#2a2620] sm:text-[30px]">
              Return Requests
            </h1>

            <p className="mt-1 text-sm text-[#786f60]">
              Review return requests, approve refunds,
              and manage the return lifecycle.
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleRefresh
            }
            disabled={loading}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#b8902e]/20 bg-white px-4 text-sm font-semibold text-[#8f6d1d] shadow-sm transition hover:border-[#b8902e]/35 hover:bg-[#faf8f3] disabled:opacity-50"
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

        {/* =================================================
            STATS
        ================================================= */}

        <motion.div
          variants={containerVariants}
          className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <ReturnStatCard
            title="Total Returns"
            value={stats.total}
            subtitle="All return requests"
            icon={
              <FiPackage size={21} />
            }
            accent="bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]"
          />

          <ReturnStatCard
            title="Pending"
            value={stats.pending}
            subtitle="Waiting for review"
            icon={
              <FiClock size={21} />
            }
            accent="bg-gradient-to-r from-[#e8c97a] to-[#b8902e]"
          />

          <ReturnStatCard
            title="Approved"
            value={stats.approved}
            subtitle="Approved requests"
            icon={
              <FiCheckCircle
                size={21}
              />
            }
            accent="bg-gradient-to-r from-[#d4af52] to-[#8f6d1d]"
          />

          <ReturnStatCard
            title="Completed"
            value={stats.completed}
            subtitle="Finished returns"
            icon={
              <FiCheck size={21} />
            }
            accent="bg-gradient-to-r from-[#c49b3a] to-[#806319]"
          />
        </motion.div>

        {/* =================================================
            MAIN CARD
        ================================================= */}

        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-sm"
        >
          {/* ACCENT */}

          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

          {/* =================================================
              TOOLBAR
          ================================================= */}

          <div className="border-b border-[#b8902e]/10 p-4 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              {/* SEARCH */}

              <div className="relative w-full xl:max-w-[540px]">
                <FiSearch
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a8841c]"
                />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) =>
                    handleSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search order, customer, email..."
                  className="h-12 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] pl-11 pr-10 text-sm text-[#2a2620] outline-none transition placeholder:text-[#a89a7d] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() =>
                      handleSearch("")
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a89a7d] hover:text-[#8f6d1d]"
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>

              {/* STATUS FILTERS */}

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
                ].map(
                  (filter) => (
                    <button
                      key={
                        filter.key
                      }
                      type="button"
                      onClick={() =>
                        handleFilterChange(
                          filter.key
                        )
                      }
                      className={`rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                        activeFilter ===
                        filter.key
                          ? "bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] text-white shadow-md shadow-[#b8902e]/20"
                          : "border border-[#b8902e]/15 bg-[#faf8f3] text-[#786f60] hover:border-[#b8902e]/30 hover:bg-[#b8902e]/10 hover:text-[#8f6d1d]"
                      }`}
                    >
                      {filter.label}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* =================================================
              DESKTOP TABLE
          ================================================= */}

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1200px] border-collapse">
              <thead>
                <tr className="bg-[#2f2a22]">
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    S.No.
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    Order
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    Customer
                  </th>

                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    Items
                  </th>

                  <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    Return Amount
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    Reason
                  </th>

                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    Status
                  </th>

                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
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
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b8902e]/10 text-[#b8902e]">
                          <FiRefreshCw
                            size={23}
                            className="animate-spin"
                          />
                        </div>

                        <p className="mt-4 text-sm font-bold text-[#2a2620]">
                          Loading return requests...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedRequests.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#b8902e]">
                          <FiPackage size={24} />
                        </div>

                        <p className="mt-4 text-sm font-bold text-[#2a2620]">
                          No return requests found
                        </p>

                        <p className="mt-1 text-xs text-[#a89a7d]">
                          Try changing the search or status filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRequests.map(
                    (
                      request,
                      index
                    ) => {
                      const canApprove =
                        request.can_approve;

                      const canReject =
                        request.can_reject;

                      const approveLoading =
                        actionLoading.type ===
                          "approve" &&
                        actionLoading.id ===
                          request.id;

                      return (
                        <tr
                          key={
                            request.id
                          }
                          className="group border-b border-[#b8902e]/10 bg-white transition hover:bg-[#faf8f3]"
                        >
                          {/* S.NO */}

                          <td className="px-5 py-4">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-xs font-bold text-[#8f6d1d]">
                              {startIndex +
                                index +
                                1}
                            </span>
                          </td>

                          {/* ORDER */}

                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-lg bg-[#faf8f3] px-3 py-1.5 text-xs font-bold text-[#4a4436]">
                              {
                                request.order_reference
                              }
                            </span>
                          </td>

                          {/* CUSTOMER */}

                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-[#2a2620]">
                              {getCustomerName(
                                request.user
                              )}
                            </p>

                            <p className="mt-1 max-w-[200px] truncate text-xs text-[#a89a7d]">
                              {
                                request.user
                                  .email
                              }
                            </p>
                          </td>

                          {/* ITEMS */}

                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex min-w-[42px] items-center justify-center rounded-full border border-[#b8902e]/20 bg-[#faf8f3] px-3 py-1.5 text-xs font-bold text-[#8f6d1d]">
                              {
                                request.items_count
                              }
                            </span>
                          </td>

                          {/* RETURN AMOUNT */}

                          <td className="px-5 py-4 text-right">
                            <span className="text-sm font-bold text-[#8f6d1d]">
                              {formatCurrency(
                                request.refund_amount
                              )}
                            </span>
                          </td>

                          {/* REASON */}

                          <td className="px-5 py-4">
                            <p
                              title={
                                request.reason ||
                                ""
                              }
                              className="max-w-[210px] truncate text-xs text-[#786f60]"
                            >
                              {request.reason ||
                                "No reason provided"}
                            </p>
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4 text-center">
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

                          {/* ACTIONS */}

                          <td className="px-5 py-4">
                            <div className="flex flex-wrap justify-center gap-2">
                              {/* VIEW */}

                              <button
                                type="button"
                                onClick={() =>
                                  handleView(
                                    request.id
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/20 bg-[#faf8f3] text-[#8f6d1d] transition hover:border-[#b8902e] hover:bg-[#b8902e] hover:text-white"
                                title="View"
                              >
                                <FiEye size={15} />
                              </button>

                              {/* ACCEPT */}

                              {canApprove && (
                                <button
                                  type="button"
                                  disabled={
                                    approveLoading
                                  }
                                  onClick={() =>
                                    handleDirectApprove(
                                      request.id
                                    )
                                  }
                                  className="flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-3 text-[10px] font-bold text-white shadow-sm transition hover:from-[#a8841c] hover:to-[#795b14] disabled:opacity-50"
                                >
                                  {approveLoading ? (
                                    <FiRefreshCw
                                      size={
                                        13
                                      }
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <FiCheck
                                      size={
                                        13
                                      }
                                    />
                                  )}

                                  Accept
                                </button>
                              )}

                              {/* REJECT */}

                              {canReject && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenReject(
                                      request.id
                                    )
                                  }
                                  className="flex h-9 items-center gap-1.5 rounded-xl border border-[#c98d83]/20 bg-[#fff8f6] px-3 text-[10px] font-bold text-[#b46055] transition hover:border-[#b46055] hover:bg-[#b46055] hover:text-white"
                                >
                                  <FiX
                                    size={
                                      13
                                    }
                                  />

                                  Reject
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* =================================================
              MOBILE
          ================================================= */}

          <div className="block lg:hidden">
            {paginatedRequests.length >
            0 ? (
              paginatedRequests.map(
                (
                  request,
                  index
                ) => {
                  const approveLoading =
                    actionLoading.type ===
                      "approve" &&
                    actionLoading.id ===
                      request.id;

                  return (
                    <div
                      key={
                        request.id
                      }
                      className="border-b border-[#b8902e]/10 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="inline-flex rounded-lg bg-[#faf8f3] px-2.5 py-1 text-xs font-bold text-[#4a4436]">
                            {
                              request.order_reference
                            }
                          </span>

                          
                        </div>

                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-xs font-bold text-[#8f6d1d]">
                          {startIndex +
                            index +
                            1}
                        </span>
                      </div>

                      <div className="mt-4">
                        <p className="text-sm font-bold text-[#2a2620]">
                          {getCustomerName(
                            request.user
                          )}
                        </p>

                        <p className="mt-1 truncate text-xs text-[#a89a7d]">
                          {
                            request.user
                              .email
                          }
                        </p>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                            Return Amount
                          </p>

                          <p className="mt-1 text-base font-bold text-[#8f6d1d]">
                            {formatCurrency(
                              request.refund_amount
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                            Items
                          </p>

                          <p className="mt-1 text-base font-bold text-[#2a2620]">
                            {
                              request.items_count
                            }
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
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

                        <div className="flex gap-2">
                          {/* VIEW */}

                          <button
                            type="button"
                            onClick={() =>
                              handleView(
                                request.id
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/20 bg-[#faf8f3] text-[#8f6d1d]"
                          >
                            <FiEye
                              size={
                                15
                              }
                            />
                          </button>

                          {/* ACCEPT */}

                          {request.can_approve && (
                            <button
                              type="button"
                              disabled={
                                approveLoading
                              }
                              onClick={() =>
                                handleDirectApprove(
                                  request.id
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e] text-white disabled:opacity-50"
                            >
                              {approveLoading ? (
                                <FiRefreshCw
                                  size={
                                    15
                                  }
                                  className="animate-spin"
                                />
                              ) : (
                                <FiCheck
                                  size={
                                    15
                                  }
                                />
                              )}
                            </button>
                          )}

                          {/* REJECT */}

                          {request.can_reject && (
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenReject(
                                  request.id
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff0ed] text-[#b46055]"
                            >
                              <FiX
                                size={
                                  15
                                }
                              />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3">
                        <p className="text-xs leading-5 text-[#786f60]">
                          {request.reason ||
                            "No reason provided."}
                        </p>
                      </div>
                    </div>
                  );
                }
              )
            ) : (
              <div className="flex flex-col items-center px-5 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#b8902e]">
                  <FiPackage size={24} />
                </div>

                <p className="mt-4 text-sm font-bold text-[#2a2620]">
                  No return requests found
                </p>

                <p className="mt-1 text-xs text-[#a89a7d]">
                  Try changing your search or status filter.
                </p>
              </div>
            )}
          </div>

          {/* =================================================
              PAGINATION
          ================================================= */}

          {filteredRequests.length >
            0 && (
            <div className="border-t border-[#b8902e]/10 bg-[#fffdfa] px-4 py-4 sm:px-5">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-xs text-[#8b8171]">
                  Showing{" "}
                  <span className="font-bold text-[#4a4436]">
                    {startEntry}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-[#4a4436]">
                    {endEntry}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-[#4a4436]">
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
                          1
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#b8902e]/15 bg-white text-[#8f6d1d] disabled:cursor-not-allowed disabled:opacity-30"
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
                            page
                          )
                        }
                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold transition ${
                          currentPage ===
                          page
                            ? "bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-white shadow-md shadow-[#b8902e]/20"
                            : "text-[#786f60] hover:bg-[#faf8f3] hover:text-[#8f6d1d]"
                        }`}
                      >
                        {page}
                      </button>
                    )
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
                          1
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#b8902e]/15 bg-white text-[#8f6d1d] disabled:cursor-not-allowed disabled:opacity-30"
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

      {/* =================================================
          DETAIL POPUP
      ================================================= */}

      <ReturnDetailModal
        open={
          detailModalOpen
        }
        loading={
          detailLoading
        }
        detail={
          selectedDetail
        }
        actionLoading={
          actionLoading
        }
        onClose={() => {
          setDetailModalOpen(
            false
          );
        }}
        onApprove={
          handleApprove
        }
        onReject={() =>
          setRejectModalOpen(
            true
          )
        }
        onReceived={
          handleMarkReceived
        }
        onComplete={
          handleComplete
        }
        onPayment={
          handleOpenPayment
        }
      />

      {/* =================================================
          REJECT POPUP
      ================================================= */}

      <RejectPopup
        open={
          rejectModalOpen
        }
        loading={
          actionLoading.type ===
          "reject"
        }
        onClose={() =>
          setRejectModalOpen(
            false
          )
        }
        onConfirm={
          handleReject
        }
      />

      {/* =================================================
          PAYMENT POPUP
      ================================================= */}

      <PaymentPopup
        open={
          paymentModalOpen
        }
        amount={Number(
          selectedDetail
            ?.refund_details
            ?.total || 0
        )}
        orderReference={
          selectedDetail
            ?.order
            .order_reference ||
          "N/A"
        }
        customerName={
          getCustomerName(
            selectedDetail?.user
          )
        }
        loading={
          paymentLoading
        }
        onClose={() =>
          setPaymentModalOpen(
            false
          )
        }
        onConfirm={
          handleSendPayment
        }
      />
    </>
  );
};

export default ReturnRefund;