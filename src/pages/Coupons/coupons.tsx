import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

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
    FiHash,
    FiUsers,
    FiRefreshCw,
    FiChevronLeft,
    FiChevronRight,
    FiClock,
    FiCheckCircle,
    FiAlertCircle,
} from "react-icons/fi";

import {
    motion,
} from "framer-motion";

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
    hidden: {
        opacity: 0,
    },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
        },
    },
};

const itemVariants = {
    hidden: {
        opacity: 0,
        y: 15,
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 14,
        },
    },
};

// =====================================================
// HELPERS
// =====================================================

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

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatDateOnly = (
    value?: string | null
) => {
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

const formatMoney = (
    value?: string | number | null
) => {
    const amount = Number(value ?? 0);
    return `₹${amount.toLocaleString("en-IN")}`;
};

const formatCouponValue = (
    coupon: Coupon
) => {
    const value = Number(coupon.value ?? 0);

    if (coupon.type === "percentage") {
        return `${value}%`;
    }

    return formatMoney(value);
};

const getStatusClass = (
    active: boolean
) => {
    return active
        ? "border-[#b8902e]/25 bg-[#f8f3e5] text-[#806319]"
        : "border-[#d8d1c4] bg-[#f6f4ef] text-[#786f60]";
};

const getTypeClass = (
    type: string
) => {
    return type === "percentage"
        ? "border-[#b8902e]/20 bg-[#faf4df] text-[#8f6d1d]"
        : "border-[#d6cdbd] bg-[#f6f2e9] text-[#665d50]";
};

const getInitials = (
    title: string
) => {
    const parts = title
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (!parts.length) {
        return "CP";
    }

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

const getExpiryState = (
    expiresAt: string
) => {
    if (!expiresAt) {
        return "unknown";
    }

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

const StatusBadge: React.FC<{
    active: boolean;
}> = ({
    active,
}) => (
    <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${getStatusClass(active)}`}
    >
        <span
            className={`h-1.5 w-1.5 rounded-full ${
                active ? "bg-[#b8902e]" : "bg-[#9b9182]"
            }`}
        />
        {active ? "Active" : "Inactive"}
    </span>
);

// =====================================================
// TYPE BADGE
// =====================================================

const TypeBadge: React.FC<{
    type: string;
}> = ({
    type,
}) => (
    <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold capitalize ${getTypeClass(type)}`}
    >
        {type === "percentage" ? (
            <FiPercent size={12} />
        ) : (
            <FiTag size={12} />
        )}
        {type}
    </span>
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
    if (!open) {
        return null;
    }

    return (
        <GlobalModal
            isOpen={open}
            onClose={onClose}
            closeOnOverlayClick={!loading}
        >
            <div className="w-full max-w-[480px] overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
                <div className="h-1 w-full bg-gradient-to-r from-[#d4af52] to-[#8a6c1f]" />
                <div className="p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                            <FiAlertCircle size={23} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#2a2620]">
                                Delete Coupon
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-[#786f60]">
                                This coupon will be removed permanently.
                                This action cannot be undone.
                            </p>
                        </div>
                    </div>

                    {coupon && (
                        <div className="mt-5 rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-xs font-bold text-white">
                                    {getInitials(coupon.title)}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-[#2a2620]">
                                        {coupon.code}
                                    </p>
                                    <p className="mt-0.5 truncate text-[11px] text-[#a89a7d]">
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
                            className="rounded-xl border border-[#b8902e]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#786f60] transition hover:bg-[#faf8f3] disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:from-red-600 hover:to-red-700 disabled:opacity-50"
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
    onChange: (key: keyof CouponPayload, value: string | number | boolean) => void;
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
    <div className="w-full max-w-[620px] overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]" />

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-[#b8902e]/10 px-5 py-4 sm:px-6">
            <div>
                <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
                        <FiTag size={17} />
                    </div>
                    <h2 className="text-lg font-bold text-[#2a2620]">
                        {editing ? "Edit Coupon" : "Add Coupon"}
                    </h2>
                </div>
                <p className="mt-1 text-xs text-[#a89a7d]">
                    {editing
                        ? "Update coupon offer and usage settings."
                        : "Create a new promotional coupon for customers."}
                </p>
            </div>

            <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#a89a7d] transition hover:bg-[#faf8f3] hover:text-[#2a2620]"
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
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#786f60]">
                            Coupon Code <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.code || ""}
                            onChange={(e) => onChange("code", e.target.value.toUpperCase())}
                            placeholder="SAVE10"
                            className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 text-sm font-bold uppercase text-[#2a2620] outline-none transition placeholder:text-[#a89a7d] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#786f60]">
                            Coupon Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.title || ""}
                            onChange={(e) => onChange("title", e.target.value)}
                            placeholder="10% Off on Your Order"
                            className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 text-sm text-[#2a2620] outline-none transition placeholder:text-[#a89a7d] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
                        />
                    </div>
                </div>

                {/* TYPE + VALUE */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#786f60]">
                            Discount Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={form.type || "percentage"}
                            onChange={(e) => onChange("type", e.target.value as CouponType)}
                            className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 text-sm text-[#2a2620] outline-none transition focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
                        >
                            <option value="percentage">Percentage</option>
                            <option value="fixed">Fixed Amount</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#786f60]">
                            Discount Value <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.value || ""}
                                onChange={(e) => onChange("value", Number(e.target.value) || 0)}
                                placeholder={form.type === "percentage" ? "10" : "500"}
                                className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 pr-12 text-sm text-[#2a2620] outline-none transition placeholder:text-[#a89a7d] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
                            />
                            <div className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-r-xl border-l border-[#d8d0c0] bg-[#f4efe2] text-[#8f6d1d]">
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
                <div className="rounded-2xl border border-[#b8902e]/10 bg-[#fffdfa] p-4">
                    <div className="mb-4 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-[#b8902e]">
                            <FiTag size={15} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[#2a2620]">
                                Order Limits
                            </h3>
                            <p className="text-[11px] text-[#a89a7d]">
                                Configure minimum and maximum cart values.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-[#786f60]">
                                Minimum Order
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#a89a7d]">
                                    ₹
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.min_order || ""}
                                    onChange={(e) => onChange("min_order", Number(e.target.value) || 0)}
                                    className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-white pl-8 pr-3 text-sm text-[#2a2620] outline-none transition focus:border-[#b8902e]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-[#786f60]">
                                Maximum Order
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#a89a7d]">
                                    ₹
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.max_order || ""}
                                    onChange={(e) => onChange("max_order", Number(e.target.value) || 0)}
                                    className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-white pl-8 pr-3 text-sm text-[#2a2620] outline-none transition focus:border-[#b8902e]"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* USES + EXPIRY */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#786f60]">
                            Maximum Uses
                        </label>
                        <div className="relative">
                            <FiUsers size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b8902e]" />
                            <input
                                type="number"
                                min="1"
                                value={form.max_uses || ""}
                                onChange={(e) => onChange("max_uses", Number(e.target.value) || 1)}
                                className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] pl-10 pr-3 text-sm text-[#2a2620] outline-none transition focus:border-[#b8902e] focus:bg-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#786f60]">
                            Expiry Date <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <FiCalendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b8902e]" />
                            <input
                                type="datetime-local"
                                value={form.expires_at || ""}
                                onChange={(e) => onChange("expires_at", e.target.value)}
                                className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] pl-10 pr-3 text-sm text-[#2a2620] outline-none transition focus:border-[#b8902e] focus:bg-white"
                            />
                        </div>
                    </div>
                </div>

                {/* STATUS */}
                <div className="flex items-center justify-between rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
                    <div>
                        <p className="text-sm font-bold text-[#2a2620]">
                            Coupon Status
                        </p>
                        <p className="mt-1 text-[11px] text-[#a89a7d]">
                            Inactive coupons cannot be applied to orders.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => onChange("is_active", !form.is_active)}
                        className={`relative h-7 w-12 rounded-full transition ${
                            form.is_active ? "bg-[#b8902e]" : "bg-[#b9b0a1]"
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
        <div className="flex items-center justify-end gap-2 border-t border-[#b8902e]/10 bg-[#fffdfa] px-5 py-4 sm:px-6">
            <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-[#b8902e]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#786f60] transition hover:bg-[#faf8f3] disabled:opacity-50"
            >
                Cancel
            </button>

            <button
                type="button"
                onClick={onSubmit}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#b8902e]/15 transition hover:from-[#a8841c] hover:to-[#7c5d12] disabled:cursor-not-allowed disabled:opacity-50"
            >
                {loading && <FiRefreshCw size={14} className="animate-spin" />}
                {loading
                    ? editing ? "Updating..." : "Creating..."
                    : editing ? "Update Coupon" : "Create Coupon"}
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
    if (!open || !coupon) {
        return null;
    }

    const expiryState = getExpiryState(coupon.expires_at);

    return (
        <GlobalModal isOpen={open} onClose={onClose}>
            <div className="w-full max-w-[600px] overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
                <div className="h-1 w-full bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]" />

                {/* HEADER */}
                <div className="flex items-center justify-between border-b border-[#b8902e]/10 px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-sm font-bold text-white">
                            {getInitials(coupon.title)}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#2a2620]">
                                Coupon Details
                            </h2>
                            <p className="text-xs text-[#a89a7d]">
                                {coupon.code}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#a89a7d] transition hover:bg-[#faf8f3] hover:text-[#2a2620]"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                {/* BODY */}
                <div className="max-h-[75vh] overflow-y-auto bg-[#faf8f3] p-5 sm:p-6">
                    <div className="space-y-5">
                        {/* MAIN SUMMARY */}
                        <div className="rounded-2xl border border-[#b8902e]/15 bg-white p-5 shadow-sm">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#a89a7d]">
                                        Coupon Code
                                    </p>
                                    <p className="mt-1 text-2xl font-black tracking-wide text-[#8f6d1d]">
                                        {coupon.code}
                                    </p>
                                    <p className="mt-2 text-sm font-semibold text-[#4a4436]">
                                        {coupon.title}
                                    </p>
                                </div>

                                <div className="flex flex-col items-start gap-2 sm:items-end">
                                    <StatusBadge active={coupon.is_active} />
                                    <TypeBadge type={coupon.type} />
                                </div>
                            </div>
                        </div>

                        {/* DISCOUNT */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="rounded-xl border border-[#b8902e]/10 bg-white p-4">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                                    Discount
                                </p>
                                <p className="mt-2 text-2xl font-bold text-[#2a2620]">
                                    {formatCouponValue(coupon)}
                                </p>
                            </div>

                            <div className="rounded-xl border border-[#b8902e]/10 bg-white p-4">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                                    Usage
                                </p>
                                <p className="mt-2 text-2xl font-bold text-[#2a2620]">
                                    {coupon.used_count}
                                    <span className="ml-1 text-sm font-medium text-[#a89a7d]">
                                        / {coupon.max_uses}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* ORDER RULES */}
                        <div className="rounded-2xl border border-[#b8902e]/10 bg-white p-5">
                            <div className="mb-4 flex items-center gap-2">
                                <FiTag size={16} className="text-[#b8902e]" />
                                <h3 className="text-sm font-bold text-[#2a2620]">
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

                        {/* DATES */}
                        <div className="rounded-2xl border border-[#b8902e]/10 bg-white p-5">
                            <div className="mb-4 flex items-center gap-2">
                                <FiCalendar size={16} className="text-[#b8902e]" />
                                <h3 className="text-sm font-bold text-[#2a2620]">
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

                                <div className="flex items-center justify-between border-t border-[#b8902e]/10 pt-3">
                                    <span className="text-xs text-[#a89a7d]">
                                        Expiry Status
                                    </span>

                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold ${
                                            expiryState === "expired"
                                                ? "bg-red-50 text-red-500"
                                                : "bg-[#f8f3e5] text-[#806319]"
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
                <div className="flex justify-end gap-2 border-t border-[#b8902e]/10 bg-white px-5 py-4 sm:px-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-[#b8902e]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#786f60] transition hover:bg-[#faf8f3]"
                    >
                        Close
                    </button>

                    <button
                        type="button"
                        onClick={() => onEdit(coupon)}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-5 py-2.5 text-sm font-bold text-white transition hover:from-[#a8841c] hover:to-[#7c5d12]"
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
// DETAIL ITEM
// =====================================================

const DetailItem: React.FC<{
    label: string;
    value: string;
}> = ({
    label,
    value,
}) => (
    <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
            {label}
        </p>
        <p className="mt-1.5 text-sm font-bold text-[#2a2620]">
            {value}
        </p>
    </div>
);

// =====================================================
// DETAIL ROW
// =====================================================

const DetailRow: React.FC<{
    label: string;
    value: string;
}> = ({
    label,
    value,
}) => (
    <div className="flex items-start justify-between gap-4 border-b border-[#b8902e]/10 pb-3 last:border-0 last:pb-0">
        <span className="text-xs text-[#a89a7d]">
            {label}
        </span>
        <span className="max-w-[65%] text-right text-xs font-bold text-[#4a4436]">
            {value}
        </span>
    </div>
);

// =====================================================
// MAIN PAGE
// =====================================================

const Coupons: React.FC = () => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<"all" | "percentage" | "fixed">("all");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
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
        value: string | number | boolean
    ) => {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    // ===================================================
    // FILTER
    // ===================================================

    const filteredCoupons = useMemo(() => {
        const query = search.trim().toLowerCase();

        return coupons.filter((coupon) => {
            const matchesSearch =
                !query ||
                [
                    coupon.code,
                    coupon.title,
                    coupon.type,
                    String(coupon.value),
                ]
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
        Math.ceil(filteredCoupons.length / ITEMS_PER_PAGE)
    );

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedCoupons = filteredCoupons.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const startEntry = filteredCoupons.length === 0 ? 0 : startIndex + 1;
    const endEntry = Math.min(startIndex + ITEMS_PER_PAGE, filteredCoupons.length);

    const paginationPages = useMemo(() => {
        if (totalPages <= 5) {
            return Array.from({ length: totalPages }, (_, index) => index + 1);
        }

        if (currentPage <= 3) {
            return [1, 2, 3, 4, 5];
        }

        if (currentPage >= totalPages - 2) {
            return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
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
    // OPEN ADD
    // ===================================================

    const openAdd = () => {
        setForm({ ...emptyForm });
        setAddOpen(true);
    };

    // ===================================================
    // VALIDATE FORM
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
        if (!validateForm()) {
            return;
        }

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
            const local = new Date(expiryDate.getTime() - expiryDate.getTimezoneOffset() * 60000);
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
        if (!selectedCoupon) {
            return;
        }

        if (!validateForm()) {
            return;
        }

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
    // VIEW
    // ===================================================

    const openView = (coupon: Coupon) => {
        setSelectedCoupon(coupon);
        setViewOpen(true);
    };

    // ===================================================
    // DELETE
    // ===================================================

    const openDelete = (coupon: Coupon) => {
        setSelectedCoupon(coupon);
        setDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedCoupon) {
            return;
        }

        try {
            setDeleteLoading(true);

            const response = await couponApi.delete(selectedCoupon.id);

            if (response.data.success) {
                toast.success(response.data.message || "Coupon deleted successfully.");
                setCoupons((prev) => prev.filter((item) => item.id !== selectedCoupon.id));
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
                className="min-h-screen bg-[#faf8f3] p-4"
            >
                {/* HEADER */}
                <motion.div
                    variants={itemVariants}
                    className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center"
                >
                    <div>
                        <h1 className="font-serif text-[28px] font-bold tracking-tight text-[#2a2620] sm:text-[30px]">
                            Promo Codes
                        </h1>
                        <p className="mt-1 text-sm text-[#786f60]">
                            Create, manage and monitor promotional discount codes.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openAdd}
                        className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-5 text-sm font-bold text-white shadow-md shadow-[#b8902e]/15 transition hover:from-[#a8841c] hover:to-[#7c5d12]"
                    >
                        <FiPlus size={18} />
                        Add Coupon
                    </button>
                </motion.div>

                {/* TOP BAR */}
                <motion.div
                    variants={itemVariants}
                    className="mb-5 overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-sm"
                >
                    <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                        {/* SEARCH */}
                        <div className="relative w-full lg:max-w-[480px]">
                            <FiSearch
                                size={18}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b8902e]"
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Search coupon code, title or type..."
                                className="h-12 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] pl-11 pr-4 text-sm text-[#2a2620] outline-none transition placeholder:text-[#a89a7d] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
                            />
                        </div>

                        {/* FILTERS */}
                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={typeFilter}
                                onChange={(e) => {
                                    setTypeFilter(e.target.value as "all" | "percentage" | "fixed");
                                    setCurrentPage(1);
                                }}
                                className="h-10 rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] px-3 text-xs font-semibold text-[#786f60] outline-none focus:border-[#b8902e]"
                            >
                                <option value="all">All Types</option>
                                <option value="percentage">Percentage</option>
                                <option value="fixed">Fixed Amount</option>
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value as "all" | "active" | "inactive");
                                    setCurrentPage(1);
                                }}
                                className="h-10 rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] px-3 text-xs font-semibold text-[#786f60] outline-none focus:border-[#b8902e]"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>

                            <button
                                type="button"
                                onClick={fetchCoupons}
                                disabled={loading}
                                className="flex h-10 items-center gap-2 rounded-xl border border-[#b8902e]/15 bg-white px-3 text-xs font-bold text-[#8f6d1d] transition hover:bg-[#faf8f3] disabled:opacity-50"
                            >
                                <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
                                Refresh
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* TABLE CARD */}
                <motion.div
                    variants={itemVariants}
                    className="relative overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-sm"
                >
                    <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]" />

                    {/* TABLE HEADER */}
                    <div className="flex flex-col justify-between gap-3 border-b border-[#b8902e]/10 px-4 pb-4 pt-5 sm:flex-row sm:items-center sm:px-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
                                <FiTag size={18} />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-[#2a2620]">
                                    Coupon Directory
                                </h2>
                                <p className="mt-0.5 text-xs text-[#a89a7d]">
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
                                className="flex items-center gap-1.5 self-start rounded-lg bg-[#faf8f3] px-3 py-2 text-[10px] font-bold text-[#8f6d1d] sm:self-auto"
                            >
                                <FiX size={13} />
                                Clear Filters
                            </button>
                        )}
                    </div>

                    {/* DESKTOP TABLE - Fixed overflow */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full min-w-[1250px] border-collapse">
                            <thead>
                                <tr className="bg-[#2f2a22]">
                                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                                        S.No.
                                    </th>
                                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                                        Coupon
                                    </th>
                                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                                        Type
                                    </th>
                                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                                        Discount
                                    </th>
                                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                                        Order Limit
                                    </th>
                                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                                        Usage
                                    </th>
                                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                                        Expires
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
                                        <td colSpan={9} className="px-5 py-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#b8902e]">
                                                    <FiRefreshCw size={21} className="animate-spin" />
                                                </div>
                                                <p className="mt-4 text-sm font-bold text-[#2a2620]">
                                                    Loading coupons...
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedCoupons.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-5 py-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#b8902e]">
                                                    <FiTag size={24} />
                                                </div>
                                                <p className="mt-4 text-sm font-bold text-[#2a2620]">
                                                    No coupons found
                                                </p>
                                                <p className="mt-1 text-xs text-[#a89a7d]">
                                                    Try changing your search or filters.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedCoupons.map((coupon, index) => (
                                        <tr
                                            key={coupon.id}
                                            className="border-b border-[#b8902e]/10 bg-white transition hover:bg-[#fffdf7]"
                                        >
                                            {/* S.NO */}
                                            <td className="px-5 py-4">
                                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-xs font-bold text-[#8f6d1d]">
                                                    {startIndex + index + 1}
                                                </span>
                                            </td>

                                            {/* COUPON */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-[10px] font-bold text-white">
                                                        {getInitials(coupon.title)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-mono text-sm font-black tracking-wide text-[#8f6d1d]">
                                                            {coupon.code}
                                                        </p>
                                                        <p className="mt-1 max-w-[230px] truncate text-xs font-semibold text-[#4a4436]">
                                                            {coupon.title}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* TYPE */}
                                            <td className="px-5 py-4">
                                                <TypeBadge type={coupon.type} />
                                            </td>

                                            {/* DISCOUNT */}
                                            <td className="px-5 py-4">
                                                <p className="text-sm font-black text-[#2a2620]">
                                                    {formatCouponValue(coupon)}
                                                </p>
                                            </td>

                                            {/* ORDER LIMIT */}
                                            <td className="px-5 py-4">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-semibold text-[#4a4436]">
                                                        Min: {formatMoney(coupon.min_order)}
                                                    </p>
                                                    <p className="text-[10px] text-[#a89a7d]">
                                                        Max: {formatMoney(coupon.max_order)}
                                                    </p>
                                                </div>
                                            </td>

                                            {/* USAGE */}
                                            <td className="px-5 py-4">
                                                <div className="min-w-[90px]">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-[#4a4436]">
                                                            {coupon.used_count}
                                                        </span>
                                                        <span className="text-[10px] text-[#a89a7d]">
                                                            / {coupon.max_uses}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#ece5d7]">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-[#d4af52] to-[#a8841c]"
                                                            style={{
                                                                width: `${Math.min(
                                                                    (Number(coupon.used_count) / Math.max(Number(coupon.max_uses), 1)) * 100,
                                                                    100
                                                                )}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>

                                            {/* EXPIRES */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <FiCalendar size={14} className="text-[#b8902e]" />
                                                    <div>
                                                        <p className="text-xs font-semibold text-[#4a4436]">
                                                            {formatDateOnly(coupon.expires_at)}
                                                        </p>
                                                        <p className="mt-1 text-[10px] text-[#a89a7d]">
                                                            {getExpiryState(coupon.expires_at) === "expired"
                                                                ? "Expired"
                                                                : "Valid"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* STATUS */}
                                            <td className="px-5 py-4 text-center">
                                                <StatusBadge active={coupon.is_active} />
                                            </td>

                                            {/* ACTIONS */}
                                            <td className="px-5 py-4">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openView(coupon)}
                                                        title="View Coupon"
                                                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] text-[#8f6d1d] transition hover:border-[#b8902e]/35 hover:bg-[#b8902e] hover:text-white"
                                                    >
                                                        <FiEye size={15} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(coupon)}
                                                        title="Edit Coupon"
                                                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-white text-[#8f6d1d] transition hover:border-[#b8902e]/35 hover:bg-[#b8902e] hover:text-white"
                                                    >
                                                        <FiEdit2 size={15} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => openDelete(coupon)}
                                                        title="Delete Coupon"
                                                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-500 transition hover:border-red-400 hover:bg-red-500 hover:text-white"
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
                                <div key={coupon.id} className="border-b border-[#b8902e]/10 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-[10px] font-bold text-white">
                                                {getInitials(coupon.title)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-mono text-sm font-black tracking-wide text-[#8f6d1d]">
                                                    {coupon.code}
                                                </p>
                                                <p className="mt-1 truncate text-xs font-semibold text-[#4a4436]">
                                                    {coupon.title}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-[#a89a7d]">
                                            #{startIndex + index + 1}
                                        </span>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3">
                                            <p className="text-[9px] font-bold uppercase tracking-wide text-[#a89a7d]">
                                                Discount
                                            </p>
                                            <p className="mt-1 text-sm font-black text-[#2a2620]">
                                                {formatCouponValue(coupon)}
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3">
                                            <p className="text-[9px] font-bold uppercase tracking-wide text-[#a89a7d]">
                                                Usage
                                            </p>
                                            <p className="mt-1 text-sm font-black text-[#2a2620]">
                                                {coupon.used_count}
                                                <span className="text-xs font-medium text-[#a89a7d]">
                                                    /{coupon.max_uses}
                                                </span>
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3">
                                            <p className="text-[9px] font-bold uppercase tracking-wide text-[#a89a7d]">
                                                Minimum Order
                                            </p>
                                            <p className="mt-1 text-xs font-bold text-[#2a2620]">
                                                {formatMoney(coupon.min_order)}
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3">
                                            <p className="text-[9px] font-bold uppercase tracking-wide text-[#a89a7d]">
                                                Expires
                                            </p>
                                            <p className="mt-1 text-xs font-bold text-[#2a2620]">
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
                                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] text-[#8f6d1d]"
                                            >
                                                <FiEye size={14} />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => openEdit(coupon)}
                                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-white text-[#8f6d1d]"
                                            >
                                                <FiEdit2 size={14} />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => openDelete(coupon)}
                                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-500"
                                            >
                                                <FiTrash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center px-5 py-16 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#b8902e]">
                                    <FiTag size={24} />
                                </div>
                                <p className="mt-4 text-sm font-bold text-[#2a2620]">
                                    No coupons found
                                </p>
                                <p className="mt-1 text-xs text-[#a89a7d]">
                                    Try changing your search or filter.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* PAGINATION */}
                    {filteredCoupons.length > 0 && (
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
                                        {filteredCoupons.length}
                                    </span>{" "}
                                    entries
                                </p>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#b8902e]/15 bg-white text-[#8f6d1d] disabled:cursor-not-allowed disabled:opacity-30"
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
                                                    ? "bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-white shadow-md shadow-[#b8902e]/20"
                                                    : "text-[#786f60] hover:bg-[#faf8f3] hover:text-[#8f6d1d]"
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#b8902e]/15 bg-white text-[#8f6d1d] disabled:cursor-not-allowed disabled:opacity-30"
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
                    if (!actionLoading) {
                        setAddOpen(false);
                    }
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