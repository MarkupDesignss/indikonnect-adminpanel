import React, { useEffect, useMemo, useState } from "react";

import {
  FiPlus,
  FiSearch,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiX,
  FiPercent,
  FiTag,
  FiCalendar,
  FiUsers,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

import GlobalModal from "@/components/common/GlobalModal";

import couponApi, {
  Coupon,
  CouponPayload,
  CouponType,
} from "../../api/endpoints/coupons";

// =====================================================
// ANIMATION
// =====================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 14 },
  },
};

// =====================================================
// HELPERS
// =====================================================

const formatDate = (value?: string | null) => {
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

const formatDateOnly = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatMoney = (value?: string | number | null) => {
  const amount = Number(value ?? 0);
  return `₹${amount.toLocaleString("en-IN")}`;
};

const formatCouponValue = (coupon: Coupon) => {
  const value = Number(coupon.value ?? 0);

  if (coupon.type === "percentage") return `${value}%`;
  return formatMoney(value);
};

const getStatusClass = (active: boolean) =>
  active
    ? "border-[#163F20]/25 bg-[#EAF3EA] text-[#163F20]"
    : "border-[#D8E2D8] bg-[#F3F6F3] text-[#59645C]";

const getTypeClass = (type: string) =>
  type === "percentage"
    ? "border-[#163F20]/20 bg-[#EAF3EA] text-[#163F20]"
    : "border-[#D8E2D8] bg-[#F3F6F3] text-[#3F4A41]";

const getInitials = (title: string) => {
  const parts = title.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "CP";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const getExpiryState = (expiresAt: string) => {
  if (!expiresAt) return "unknown";

  const expiry = new Date(expiresAt).getTime();
  const now = Date.now();

  return expiry < now ? "expired" : "active";
};

// =====================================================
// FORM DEFAULT
// =====================================================

const emptyForm: CouponPayload = {
  code: "",
  title: "",
  type: "percentage",
  value: 0,
  min_order: 0,
  max_order: 0,
  max_uses: 100,
  expires_at: "",
  is_active: true,
};

// =====================================================
// STATUS BADGE
// =====================================================

const StatusBadge: React.FC<{ active: boolean }> = ({ active }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${getStatusClass(
      active,
    )}`}
  >
    <span
      className={`h-1.5 w-1.5 rounded-full ${
        active ? "bg-[#163F20]" : "bg-[#89918B]"
      }`}
    />
    {active ? "Active" : "Inactive"}
  </span>
);

// =====================================================
// TYPE BADGE
// =====================================================

const TypeBadge: React.FC<{ type: string }> = ({ type }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold capitalize ${getTypeClass(
      type,
    )}`}
  >
    {type === "percentage" ? <FiPercent size={12} /> : <FiTag size={12} />}
    {type}
  </span>
);

// =====================================================
// DETAIL ITEM
// =====================================================

const DetailItem: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] p-4">
    <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
      {label}
    </p>
    <p className="mt-1.5 text-sm font-bold text-[#202721]">{value}</p>
  </div>
);

// =====================================================
// DETAIL ROW
// =====================================================

const DetailRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="flex items-start justify-between gap-4 border-b border-[#163F20]/10 pb-3 last:border-0 last:pb-0">
    <span className="text-xs text-[#9AA29C]">{label}</span>
    <span className="max-w-[65%] text-right text-xs font-bold text-[#3F4A41]">
      {value}
    </span>
  </div>
);

// =====================================================
// DELETE MODAL
// =====================================================

interface DeleteModalProps {
  open: boolean;
  loading: boolean;
  coupon?: Coupon | null;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteCouponModal: React.FC<DeleteModalProps> = ({
  open,
  loading,
  coupon,
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <GlobalModal isOpen={open} onClose={onClose} closeOnOverlayClick={!loading}>
      <div className="w-full max-w-[480px] overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-[#4C8A57] to-[#C23B32]" />

        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FBEAEA] text-[#C23B32]">
              <FiAlertCircle size={23} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#202721]">
                Delete Coupon
              </h2>

              <p className="mt-1 text-sm leading-6 text-[#59645C]">
                This coupon will be removed permanently. This action cannot be
                undone.
              </p>
            </div>
          </div>

          {coupon && (
            <div className="mt-5 rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] text-xs font-bold text-white">
                  {getInitials(coupon.title)}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#202721]">
                    {coupon.code}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-[#9AA29C]">
                    {coupon.title}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-[#163F20]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#59645C] transition hover:bg-[#F5F7F5] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#C23B32] to-[#A62F27] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(194,59,50,0.6)] transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? (
                <FiRefreshCw size={15} className="animate-spin" />
              ) : (
                <FiTrash2 size={15} />
              )}
              {loading ? "Deleting..." : "Delete Coupon"}
            </button>
          </div>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// COUPON FORM
// =====================================================

interface CouponFormProps {
  form: CouponPayload;
  loading: boolean;
  editing: boolean;
  onChange: (
    key: keyof CouponPayload,
    value: string | number | boolean,
  ) => void;
  onSubmit: () => void;
  onClose: () => void;
}

const CouponForm: React.FC<CouponFormProps> = ({
  form,
  loading,
  editing,
  onChange,
  onSubmit,
  onClose,
}) => (
  <div className="w-full max-w-[620px] overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white shadow-2xl">
    <div className="h-1 w-full bg-gradient-to-r from-[#4C8A57] via-[#163F20] to-[#0F3219]" />

    {/* HEADER */}
    <div className="flex items-center justify-between border-b border-[#163F20]/10 px-5 py-4 sm:px-6">
      <div>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
            <FiTag size={17} />
          </div>

          <h2 className="text-lg font-bold text-[#202721]">
            {editing ? "Edit Coupon" : "Add Coupon"}
          </h2>
        </div>

        <p className="mt-1 text-xs text-[#9AA29C]">
          {editing
            ? "Update coupon offer and usage settings."
            : "Create a new promotional coupon for customers."}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        disabled={loading}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9AA29C] transition hover:bg-[#EAF3EA] hover:text-[#163F20]"
      >
        <FiX size={18} />
      </button>
    </div>

    {/* BODY */}
    <div className="max-h-[75vh] overflow-y-auto p-5 sm:p-6">
      <div className="space-y-5">
        {/* CODE + TITLE */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#59645C]">
              Coupon Code <span className="text-[#C23B32]">*</span>
            </label>

            <input
              type="text"
              value={form.code || ""}
              onChange={(e) => onChange("code", e.target.value.toUpperCase())}
              placeholder="SAVE10"
              className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] px-4 text-sm font-bold uppercase text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#163F20] focus:bg-white focus:ring-2 focus:ring-[#163F20]/15"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#59645C]">
              Coupon Title <span className="text-[#C23B32]">*</span>
            </label>

            <input
              type="text"
              value={form.title || ""}
              onChange={(e) => onChange("title", e.target.value)}
              placeholder="10% Off on Your Order"
              className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] px-4 text-sm text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#163F20] focus:bg-white focus:ring-2 focus:ring-[#163F20]/15"
            />
          </div>
        </div>

        {/* TYPE + VALUE */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#59645C]">
              Discount Type <span className="text-[#C23B32]">*</span>
            </label>

            <select
              value={form.type || "percentage"}
              onChange={(e) => onChange("type", e.target.value as CouponType)}
              className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] px-4 text-sm text-[#202721] outline-none transition focus:border-[#163F20] focus:bg-white focus:ring-2 focus:ring-[#163F20]/15"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#59645C]">
              Discount Value <span className="text-[#C23B32]">*</span>
            </label>

            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.value || ""}
                onChange={(e) => onChange("value", Number(e.target.value) || 0)}
                placeholder={form.type === "percentage" ? "10" : "500"}
                className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] px-4 pr-12 text-sm text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#163F20] focus:bg-white focus:ring-2 focus:ring-[#163F20]/15"
              />

              <div className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-r-xl border-l border-[#D8E2D8] bg-[#EAF3EA] text-[#163F20]">
                {form.type === "percentage" ? (
                  <FiPercent size={16} />
                ) : (
                  <span className="text-sm font-bold">₹</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ORDER LIMITS */}
        <div className="rounded-2xl border border-[#163F20]/10 bg-[#FAFBFA] p-4">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF3EA] text-[#163F20]">
              <FiTag size={15} />
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#202721]">Order Limits</h3>

              <p className="text-[11px] text-[#9AA29C]">
                Configure minimum and maximum cart values.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#59645C]">
                Minimum Order
              </label>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#9AA29C]">
                  ₹
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.min_order || ""}
                  onChange={(e) =>
                    onChange("min_order", Number(e.target.value) || 0)
                  }
                  className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-white pl-8 pr-3 text-sm text-[#202721] outline-none transition focus:border-[#163F20]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#59645C]">
                Maximum Order
              </label>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#9AA29C]">
                  ₹
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.max_order || ""}
                  onChange={(e) =>
                    onChange("max_order", Number(e.target.value) || 0)
                  }
                  className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-white pl-8 pr-3 text-sm text-[#202721] outline-none transition focus:border-[#163F20]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* USES + EXPIRY */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#59645C]">
              Maximum Uses
            </label>

            <div className="relative">
              <FiUsers
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#163F20]"
              />

              <input
                type="number"
                min="1"
                value={form.max_uses || ""}
                onChange={(e) =>
                  onChange("max_uses", Number(e.target.value) || 1)
                }
                className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] pl-10 pr-3 text-sm text-[#202721] outline-none transition focus:border-[#163F20] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#59645C]">
              Expiry Date <span className="text-[#C23B32]">*</span>
            </label>

            <div className="relative">
              <FiCalendar
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#163F20]"
              />

              <input
                type="datetime-local"
                value={form.expires_at || ""}
                onChange={(e) => onChange("expires_at", e.target.value)}
                className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] pl-10 pr-3 text-sm text-[#202721] outline-none transition focus:border-[#163F20] focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* STATUS */}
        <div className="flex items-center justify-between rounded-2xl border border-[#163F20]/10 bg-[#F5F7F5] p-4">
          <div>
            <p className="text-sm font-bold text-[#202721]">Coupon Status</p>

            <p className="mt-1 text-[11px] text-[#9AA29C]">
              Inactive coupons cannot be applied to orders.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onChange("is_active", !form.is_active)}
            className={`relative h-7 w-12 rounded-full transition ${
              form.is_active ? "bg-[#163F20]" : "bg-[#D8E2D8]"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                form.is_active ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>

    {/* FOOTER */}
    <div className="flex items-center justify-end gap-2 border-t border-[#163F20]/10 bg-[#FAFBFA] px-5 py-4 sm:px-6">
      <button
        type="button"
        onClick={onClose}
        disabled={loading}
        className="rounded-xl border border-[#163F20]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#59645C] transition hover:bg-[#F5F7F5] disabled:opacity-50"
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={onSubmit}
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4C8A57] via-[#163F20] to-[#0F3219] px-6 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(22,63,32,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(22,63,32,0.7)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading && <FiRefreshCw size={14} className="animate-spin" />}
        {loading
          ? editing
            ? "Updating..."
            : "Creating..."
          : editing
            ? "Update Coupon"
            : "Create Coupon"}
      </button>
    </div>
  </div>
);

// =====================================================
// VIEW MODAL
// =====================================================

interface ViewModalProps {
  coupon: Coupon | null;
  open: boolean;
  onClose: () => void;
  onEdit: (coupon: Coupon) => void;
}

const ViewCouponModal: React.FC<ViewModalProps> = ({
  coupon,
  open,
  onClose,
  onEdit,
}) => {
  if (!open || !coupon) return null;

  const expiryState = getExpiryState(coupon.expires_at);

  return (
    <GlobalModal isOpen={open} onClose={onClose}>
      <div className="w-full max-w-[600px] overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-[#4C8A57] via-[#163F20] to-[#0F3219]" />

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-[#163F20]/10 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] text-sm font-bold text-white">
              {getInitials(coupon.title)}
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#202721]">
                Coupon Details
              </h2>

              <p className="text-xs text-[#9AA29C]">{coupon.code}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9AA29C] transition hover:bg-[#EAF3EA] hover:text-[#163F20]"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="max-h-[75vh] overflow-y-auto bg-[#F5F7F5] p-5 sm:p-6">
          <div className="space-y-5">
            {/* MAIN SUMMARY */}
            <div className="rounded-2xl border border-[#163F20]/15 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
                    Coupon Code
                  </p>

                  <p className="mt-1 text-2xl font-black tracking-wide text-[#163F20]">
                    {coupon.code}
                  </p>

                  <p className="mt-2 text-sm font-semibold text-[#3F4A41]">
                    {coupon.title}
                  </p>
                </div>

                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <StatusBadge active={coupon.is_active} />
                  <TypeBadge type={coupon.type} />
                </div>
              </div>
            </div>

            {/* DISCOUNT + USAGE */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[#163F20]/10 bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                  Discount
                </p>

                <p className="mt-2 text-2xl font-bold text-[#202721]">
                  {formatCouponValue(coupon)}
                </p>
              </div>

              <div className="rounded-xl border border-[#163F20]/10 bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                  Usage
                </p>

                <p className="mt-2 text-2xl font-bold text-[#202721]">
                  {coupon.used_count}
                  <span className="ml-1 text-sm font-medium text-[#9AA29C]">
                    / {coupon.max_uses}
                  </span>
                </p>
              </div>
            </div>

            {/* ORDER RULES */}
            <div className="rounded-2xl border border-[#163F20]/10 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <FiTag size={16} className="text-[#163F20]" />
                <h3 className="text-sm font-bold text-[#202721]">
                  Order Rules
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Minimum Order"
                  value={formatMoney(coupon.min_order)}
                />

                <DetailItem
                  label="Maximum Order"
                  value={formatMoney(coupon.max_order)}
                />
              </div>
            </div>

            {/* TIMELINE */}
            <div className="rounded-2xl border border-[#163F20]/10 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <FiCalendar size={16} className="text-[#163F20]" />
                <h3 className="text-sm font-bold text-[#202721]">
                  Coupon Timeline
                </h3>
              </div>

              <div className="space-y-3">
                <DetailRow
                  label="Created At"
                  value={formatDate(coupon.created_at)}
                />

                <DetailRow
                  label="Updated At"
                  value={formatDate(coupon.updated_at)}
                />

                <DetailRow
                  label="Expires At"
                  value={formatDate(coupon.expires_at)}
                />

                <div className="flex items-center justify-between border-t border-[#163F20]/10 pt-3">
                  <span className="text-xs text-[#9AA29C]">Expiry Status</span>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold ${
                      expiryState === "expired"
                        ? "bg-[#FBEAEA] text-[#C23B32]"
                        : "bg-[#EAF3EA] text-[#163F20]"
                    }`}
                  >
                    {expiryState === "expired" ? (
                      <FiClock size={12} />
                    ) : (
                      <FiCheckCircle size={12} />
                    )}
                    {expiryState === "expired" ? "Expired" : "Valid"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 border-t border-[#163F20]/10 bg-white px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#163F20]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#59645C] transition hover:bg-[#F5F7F5]"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => onEdit(coupon)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(22,63,32,0.5)] transition hover:-translate-y-0.5"
          >
            <FiEdit2 size={14} />
            Edit Coupon
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// MAIN PAGE
// =====================================================

const Coupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "percentage" | "fixed">(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponPayload>({ ...emptyForm });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const ITEMS_PER_PAGE = 10;

  // ===================================================
  // FETCH
  // ===================================================

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await couponApi.getAll(1, 100);

      if (response.data.success) {
        setCoupons(response.data.data?.data || []);
      } else {
        toast.error(response.data.message || "Unable to fetch coupons.");
      }
    } catch (error: any) {
      console.error("Fetch coupons error:", error);
      toast.error(error?.response?.data?.message || "Unable to fetch coupons.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // ===================================================
  // FORM CHANGE
  // ===================================================

  const handleFormChange = (
    key: keyof CouponPayload,
    value: string | number | boolean,
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ===================================================
  // FILTER
  // ===================================================

  const filteredCoupons = useMemo(() => {
    const query = search.trim().toLowerCase();

    return coupons.filter((coupon) => {
      const matchesSearch =
        !query ||
        [coupon.code, coupon.title, coupon.type, String(coupon.value)]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesType = typeFilter === "all" || coupon.type === typeFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && coupon.is_active) ||
        (statusFilter === "inactive" && !coupon.is_active);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [coupons, search, typeFilter, statusFilter]);

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCoupons.length / ITEMS_PER_PAGE),
  );

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCoupons = filteredCoupons.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const startEntry = filteredCoupons.length === 0 ? 0 : startIndex + 1;
  const endEntry = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredCoupons.length,
  );

  const paginationPages = useMemo(() => {
    if (totalPages <= 5)
      return Array.from({ length: totalPages }, (_, index) => index + 1);

    if (currentPage <= 3) return [1, 2, 3, 4, 5];

    if (currentPage >= totalPages - 2)
      return [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];

    return [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
    ];
  }, [currentPage, totalPages]);

  // ===================================================
  // OPEN ADD
  // ===================================================

  const openAdd = () => {
    setForm({ ...emptyForm });
    setAddOpen(true);
  };

  // ===================================================
  // VALIDATE
  // ===================================================

  const validateForm = () => {
    if (!form.code.trim()) {
      toast.error("Please enter coupon code.");
      return false;
    }

    if (!form.title.trim()) {
      toast.error("Please enter coupon title.");
      return false;
    }

    if (Number(form.value) <= 0) {
      toast.error("Discount value must be greater than 0.");
      return false;
    }

    if (form.type === "percentage" && Number(form.value) > 100) {
      toast.error("Percentage discount cannot be more than 100.");
      return false;
    }

    if (Number(form.min_order) < 0) {
      toast.error("Minimum order cannot be negative.");
      return false;
    }

    if (Number(form.max_order) < Number(form.min_order)) {
      toast.error("Maximum order must be greater than minimum order.");
      return false;
    }

    if (Number(form.max_uses) <= 0) {
      toast.error("Maximum uses must be greater than 0.");
      return false;
    }

    if (!form.expires_at) {
      toast.error("Please select expiry date.");
      return false;
    }

    return true;
  };

  // ===================================================
  // CREATE
  // ===================================================

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      setActionLoading(true);

      const payload: CouponPayload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        title: form.title.trim(),
        value: Number(form.value),
        min_order: Number(form.min_order),
        max_order: Number(form.max_order),
        max_uses: Number(form.max_uses),
      };

      const response = await couponApi.create(payload);

      if (response.data.success) {
        toast.success(response.data.message || "Coupon created successfully.");

        setAddOpen(false);
        await fetchCoupons();
        setCurrentPage(1);
      } else {
        toast.error(response.data.message || "Unable to create coupon.");
      }
    } catch (error: any) {
      console.error("Create coupon error:", error);
      toast.error(error?.response?.data?.message || "Unable to create coupon.");
    } finally {
      setActionLoading(false);
    }
  };

  // ===================================================
  // OPEN EDIT
  // ===================================================

  const openEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon);

    const expiryDate = coupon.expires_at ? new Date(coupon.expires_at) : null;
    let formattedExpiry = "";

    if (expiryDate && !Number.isNaN(expiryDate.getTime())) {
      const local = new Date(
        expiryDate.getTime() - expiryDate.getTimezoneOffset() * 60000,
      );
      formattedExpiry = local.toISOString().slice(0, 16);
    }

    setForm({
      code: coupon.code || "",
      title: coupon.title || "",
      type: (coupon.type as CouponType) || "percentage",
      value: Number(coupon.value) || 0,
      min_order: Number(coupon.min_order) || 0,
      max_order: Number(coupon.max_order) || 0,
      max_uses: Number(coupon.max_uses) || 100,
      expires_at: formattedExpiry,
      is_active: coupon.is_active,
    });

    setEditOpen(true);
  };

  // ===================================================
  // UPDATE
  // ===================================================

  const handleUpdate = async () => {
    if (!selectedCoupon) return;
    if (!validateForm()) return;

    try {
      setActionLoading(true);

      const payload: CouponPayload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        title: form.title.trim(),
        value: Number(form.value),
        min_order: Number(form.min_order),
        max_order: Number(form.max_order),
        max_uses: Number(form.max_uses),
      };

      const response = await couponApi.update(selectedCoupon.id, payload);

      if (response.data.success) {
        toast.success(response.data.message || "Coupon updated successfully.");

        setEditOpen(false);
        setSelectedCoupon(null);
        await fetchCoupons();
      } else {
        toast.error(response.data.message || "Unable to update coupon.");
      }
    } catch (error: any) {
      console.error("Update coupon error:", error);
      toast.error(error?.response?.data?.message || "Unable to update coupon.");
    } finally {
      setActionLoading(false);
    }
  };

  // ===================================================
  // VIEW / DELETE
  // ===================================================

  const openView = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setViewOpen(true);
  };

  const openDelete = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedCoupon) return;

    try {
      setDeleteLoading(true);

      const response = await couponApi.delete(selectedCoupon.id);

      if (response.data.success) {
        toast.success(response.data.message || "Coupon deleted successfully.");

        setCoupons((prev) =>
          prev.filter((item) => item.id !== selectedCoupon.id),
        );

        setDeleteOpen(false);
        setSelectedCoupon(null);
      } else {
        toast.error(response.data.message || "Unable to delete coupon.");
      }
    } catch (error: any) {
      console.error("Delete coupon error:", error);
      toast.error(error?.response?.data?.message || "Unable to delete coupon.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ===================================================
  // UI
  // ===================================================

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="min-h-screen bg-[#F5F7F5] p-4"
      >
        {/* HEADER */}
        <motion.div
          variants={itemVariants}
          className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center"
        >
          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-[#202721] sm:text-[30px]">
              Promo Codes
            </h1>

            <p className="mt-1 text-sm text-[#59645C]">
              Create, manage and monitor promotional discount codes.
            </p>
          </div>

          <button
            type="button"
            onClick={openAdd}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4C8A57] via-[#163F20] to-[#0F3219] px-5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(22,63,32,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(22,63,32,0.7)]"
          >
            <FiPlus size={18} />
            Add Coupon
          </button>
        </motion.div>

        {/* TOP BAR */}
        <motion.div
          variants={itemVariants}
          className="mb-5 overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white shadow-sm"
        >
          <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-[480px]">
              <FiSearch
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#163F20]"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search coupon code, title or type..."
                className="h-12 w-full rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] pl-11 pr-4 text-sm text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#163F20] focus:bg-white focus:ring-2 focus:ring-[#163F20]/15"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(
                    e.target.value as "all" | "percentage" | "fixed",
                  );
                  setCurrentPage(1);
                }}
                className="h-10 rounded-xl border border-[#163F20]/15 bg-[#F5F7F5] px-3 text-xs font-semibold text-[#59645C] outline-none focus:border-[#163F20]"
              >
                <option value="all">All Types</option>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(
                    e.target.value as "all" | "active" | "inactive",
                  );
                  setCurrentPage(1);
                }}
                className="h-10 rounded-xl border border-[#163F20]/15 bg-[#F5F7F5] px-3 text-xs font-semibold text-[#59645C] outline-none focus:border-[#163F20]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <button
                type="button"
                onClick={fetchCoupons}
                disabled={loading}
                className="flex h-10 items-center gap-2 rounded-xl border border-[#163F20]/15 bg-white px-3 text-xs font-bold text-[#163F20] transition hover:bg-[#EAF3EA] disabled:opacity-50"
              >
                <FiRefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </div>
        </motion.div>

        {/* TABLE CARD */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white shadow-sm"
        >
          <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-[#8FC199] via-[#163F20] to-[#0F3219]" />

          {/* TABLE HEADER */}
          <div className="flex flex-col justify-between gap-3 border-b border-[#163F20]/10 px-4 pb-4 pt-5 sm:flex-row sm:items-center sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                <FiTag size={18} />
              </div>

              <div>
                <h2 className="text-base font-bold text-[#202721]">
                  Coupon Directory
                </h2>

                <p className="mt-0.5 text-xs text-[#9AA29C]">
                  {filteredCoupons.length} coupon
                  {filteredCoupons.length === 1 ? "" : "s"} found
                </p>
              </div>
            </div>

            {(search || typeFilter !== "all" || statusFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setTypeFilter("all");
                  setStatusFilter("all");
                  setCurrentPage(1);
                }}
                className="flex items-center gap-1.5 self-start rounded-lg bg-[#EAF3EA] px-3 py-2 text-[10px] font-bold text-[#163F20] sm:self-auto"
              >
                <FiX size={13} />
                Clear Filters
              </button>
            )}
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full min-w-[1250px] border-collapse">
              <thead>
                <tr className="bg-[#163F20]">
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF3EA]">
                    S.No.
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF3EA]">
                    Coupon
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF3EA]">
                    Type
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF3EA]">
                    Discount
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF3EA]">
                    Order Limit
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF3EA]">
                    Usage
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF3EA]">
                    Expires
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
                    <td colSpan={9} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#163F20]">
                          <FiRefreshCw size={21} className="animate-spin" />
                        </div>

                        <p className="mt-4 text-sm font-bold text-[#202721]">
                          Loading coupons...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#163F20]">
                          <FiTag size={24} />
                        </div>

                        <p className="mt-4 text-sm font-bold text-[#202721]">
                          No coupons found
                        </p>

                        <p className="mt-1 text-xs text-[#9AA29C]">
                          Try changing your search or filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedCoupons.map((coupon, index) => (
                    <tr
                      key={coupon.id}
                      className="border-b border-[#163F20]/10 bg-white transition hover:bg-[#FAFBFA]"
                    >
                      <td className="px-5 py-4">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF3EA] text-xs font-bold text-[#163F20]">
                          {startIndex + index + 1}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] text-[10px] font-bold text-white">
                            {getInitials(coupon.title)}
                          </div>

                          <div className="min-w-0">
                            <p className="font-mono text-sm font-black tracking-wide text-[#163F20]">
                              {coupon.code}
                            </p>

                            <p className="mt-1 max-w-[230px] truncate text-xs font-semibold text-[#3F4A41]">
                              {coupon.title}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <TypeBadge type={coupon.type} />
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-black text-[#202721]">
                          {formatCouponValue(coupon)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-[#3F4A41]">
                            Min: {formatMoney(coupon.min_order)}
                          </p>

                          <p className="text-[10px] text-[#9AA29C]">
                            Max: {formatMoney(coupon.max_order)}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="min-w-[90px]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#3F4A41]">
                              {coupon.used_count}
                            </span>

                            <span className="text-[10px] text-[#9AA29C]">
                              / {coupon.max_uses}
                            </span>
                          </div>

                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#EAF3EA]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#4C8A57] to-[#163F20]"
                              style={{
                                width: `${Math.min(
                                  (Number(coupon.used_count) /
                                    Math.max(Number(coupon.max_uses), 1)) *
                                    100,
                                  100,
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <FiCalendar size={14} className="text-[#163F20]" />

                          <div>
                            <p className="text-xs font-semibold text-[#3F4A41]">
                              {formatDateOnly(coupon.expires_at)}
                            </p>

                            <p className="mt-1 text-[10px] text-[#9AA29C]">
                              {getExpiryState(coupon.expires_at) === "expired"
                                ? "Expired"
                                : "Valid"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <StatusBadge active={coupon.is_active} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openView(coupon)}
                            title="View Coupon"
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#163F20]/15 bg-[#F5F7F5] text-[#163F20] transition hover:border-transparent hover:bg-[#163F20] hover:text-white"
                          >
                            <FiEye size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => openEdit(coupon)}
                            title="Edit Coupon"
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#163F20]/15 bg-white text-[#163F20] transition hover:border-transparent hover:bg-[#163F20] hover:text-white"
                          >
                            <FiEdit2 size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => openDelete(coupon)}
                            title="Delete Coupon"
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#C23B32]/20 bg-[#FBEAEA] text-[#C23B32] transition hover:border-transparent hover:bg-[#C23B32] hover:text-white"
                          >
                            <FiTrash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE */}
          <div className="block lg:hidden">
            {paginatedCoupons.length > 0 ? (
              paginatedCoupons.map((coupon, index) => (
                <div
                  key={coupon.id}
                  className="border-b border-[#163F20]/10 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] text-[10px] font-bold text-white">
                        {getInitials(coupon.title)}
                      </div>

                      <div className="min-w-0">
                        <p className="font-mono text-sm font-black tracking-wide text-[#163F20]">
                          {coupon.code}
                        </p>

                        <p className="mt-1 truncate text-xs font-semibold text-[#3F4A41]">
                          {coupon.title}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-[#9AA29C]">
                      #{startIndex + index + 1}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                        Discount
                      </p>

                      <p className="mt-1 text-sm font-black text-[#202721]">
                        {formatCouponValue(coupon)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                        Usage
                      </p>

                      <p className="mt-1 text-sm font-black text-[#202721]">
                        {coupon.used_count}
                        <span className="text-xs font-medium text-[#9AA29C]">
                          /{coupon.max_uses}
                        </span>
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                        Minimum Order
                      </p>

                      <p className="mt-1 text-xs font-bold text-[#202721]">
                        {formatMoney(coupon.min_order)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                        Expires
                      </p>

                      <p className="mt-1 text-xs font-bold text-[#202721]">
                        {formatDateOnly(coupon.expires_at)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <TypeBadge type={coupon.type} />
                      <StatusBadge active={coupon.is_active} />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openView(coupon)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#163F20]/15 bg-[#F5F7F5] text-[#163F20]"
                      >
                        <FiEye size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => openEdit(coupon)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#163F20]/15 bg-white text-[#163F20]"
                      >
                        <FiEdit2 size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => openDelete(coupon)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#C23B32]/20 bg-[#FBEAEA] text-[#C23B32]"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center px-5 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#163F20]">
                  <FiTag size={24} />
                </div>

                <p className="mt-4 text-sm font-bold text-[#202721]">
                  No coupons found
                </p>

                <p className="mt-1 text-xs text-[#9AA29C]">
                  Try changing your search or filter.
                </p>
              </div>
            )}
          </div>

          {/* PAGINATION */}
          {filteredCoupons.length > 0 && (
            <div className="border-t border-[#163F20]/10 bg-[#FAFBFA] px-4 py-4 sm:px-5">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-xs text-[#89918B]">
                  Showing{" "}
                  <span className="font-bold text-[#3F4A41]">{startEntry}</span>{" "}
                  to{" "}
                  <span className="font-bold text-[#3F4A41]">{endEntry}</span>{" "}
                  of{" "}
                  <span className="font-bold text-[#3F4A41]">
                    {filteredCoupons.length}
                  </span>{" "}
                  entries
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.max(page - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#163F20]/15 bg-white text-[#163F20] transition hover:bg-[#EAF3EA] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronLeft size={17} />
                  </button>

                  {paginationPages.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold ${
                        currentPage === page
                          ? "bg-gradient-to-br from-[#4C8A57] to-[#163F20] text-white shadow-[0_6px_14px_-6px_rgba(22,63,32,0.5)]"
                          : "text-[#59645C] hover:bg-[#F5F7F5] hover:text-[#163F20]"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.min(page + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#163F20]/15 bg-white text-[#163F20] transition hover:bg-[#EAF3EA] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronRight size={17} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* ADD MODAL */}
      <GlobalModal
        isOpen={addOpen}
        onClose={() => {
          if (!actionLoading) setAddOpen(false);
        }}
        closeOnOverlayClick={!actionLoading}
      >
        <CouponForm
          form={form}
          loading={actionLoading}
          editing={false}
          onChange={handleFormChange}
          onSubmit={handleCreate}
          onClose={() => setAddOpen(false)}
        />
      </GlobalModal>

      {/* EDIT MODAL */}
      <GlobalModal
        isOpen={editOpen}
        onClose={() => {
          if (!actionLoading) {
            setEditOpen(false);
            setSelectedCoupon(null);
          }
        }}
        closeOnOverlayClick={!actionLoading}
      >
        <CouponForm
          form={form}
          loading={actionLoading}
          editing={true}
          onChange={handleFormChange}
          onSubmit={handleUpdate}
          onClose={() => {
            setEditOpen(false);
            setSelectedCoupon(null);
          }}
        />
      </GlobalModal>

      {/* VIEW MODAL */}
      <ViewCouponModal
        open={viewOpen}
        coupon={selectedCoupon}
        onClose={() => {
          setViewOpen(false);
          setSelectedCoupon(null);
        }}
        onEdit={(coupon) => {
          setViewOpen(false);
          openEdit(coupon);
        }}
      />

      {/* DELETE MODAL */}
      <DeleteCouponModal
        open={deleteOpen}
        loading={deleteLoading}
        coupon={selectedCoupon}
        onClose={() => {
          if (!deleteLoading) {
            setDeleteOpen(false);
            setSelectedCoupon(null);
          }
        }}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default Coupons;
