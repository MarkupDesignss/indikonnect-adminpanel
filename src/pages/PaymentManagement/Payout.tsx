
import React, { useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiCalendar,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiDownload,
  FiEye,
  FiFileText,
  FiLock,
  FiMail,
  FiRefreshCw,
  FiSearch,
  FiUnlock,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import GlobalModal from "@/components/common/GlobalModal";

import payoutApi, {
  Payout,
} from "../../api/endpoints/payout";

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
      stiffness: 110,
      damping: 15,
    },
  },
};

// =====================================================
// HELPERS
// =====================================================

const formatAmount = (
  value: string | number | null | undefined
) => {
  const amount = Number(value || 0);

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

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatPeriod = (
  period: string
) => {
  if (!period) {
    return "—";
  }

  const [year, month] = period.split("-");

  if (!year || !month) {
    return period;
  }

  const date = new Date(
    Number(year),
    Number(month) - 1,
    1
  );

  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const getStatusClass = (
  status: string
) => {
  switch (status) {
    case "released":
      return "border-[#b8902e]/25 bg-[#f8f3e5] text-[#806319]";

    case "pending":
      return "border-[#e5b756]/30 bg-[#fff8e8] text-[#9a741b]";

    default:
      return "border-[#d8d1c4] bg-[#f6f4ef] text-[#786f60]";
  }
};

// =====================================================
// STAT CARD
// =====================================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  accent: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accent,
}) => {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{
        y: -4,
        boxShadow:
          "0 16px 32px -18px rgba(140,105,25,0.26)",
      }}
      className="relative min-h-[138px] overflow-hidden rounded-[20px] border border-[#b8902e]/12 bg-white p-5 shadow-[0_8px_24px_rgba(70,55,20,0.045)]"
    >
      <div
        className={`absolute left-0 right-0 top-0 h-[3px] ${accent}`}
      />

      <div className="pointer-events-none absolute -right-7 -top-7 h-24 w-24 rounded-full border border-[#d4af52]/15" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#a89a7d]">
            {title}
          </p>

          <p className="mt-2 text-[29px] font-bold tracking-tight text-[#29251f]">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-[#817665]">
            {subtitle}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#faf8f3] text-[#b8902e]">
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

// =====================================================
// VIEW PAYOUT MODAL
// =====================================================

interface ViewPayoutModalProps {
  payout: Payout | null;
  open: boolean;
  onClose: () => void;
}

const ViewPayoutModal: React.FC<ViewPayoutModalProps> = ({
  payout,
  open,
  onClose,
}) => {
  if (!open || !payout) {
    return null;
  }

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={true}
    >
      <div className="w-full max-w-[650px] overflow-hidden rounded-[22px] border border-[#b8902e]/15 bg-white shadow-2xl">
        <div className="h-[3px] w-full bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]" />

        <div className="flex items-start justify-between border-b border-[#b8902e]/10 px-5 py-5 sm:px-6">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
                <FiFileText size={17} />
              </div>

              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a741b]">
                Payout Details
              </span>
            </div>

            <h2 className="text-[20px] font-bold text-[#29251f]">
              Payout #{payout.id}
            </h2>

            <p className="mt-1 text-xs text-[#a19583]">
              {formatPeriod(payout.period)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faf8f3] text-[#8f6d1d] transition hover:bg-[#f2ead8]"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="max-h-[72vh] overflow-y-auto p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#b8902e]/10 bg-[#fbfaf7] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                Period
              </p>

              <p className="mt-1.5 text-sm font-bold text-[#29251f]">
                {formatPeriod(payout.period)}
              </p>
            </div>

            <div className="rounded-xl border border-[#b8902e]/10 bg-[#fbfaf7] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                Status
              </p>

              <span
                className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold capitalize ${getStatusClass(
                  payout.status
                )}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {payout.status}
              </span>
            </div>

            <div className="rounded-xl border border-[#b8902e]/10 bg-[#fbfaf7] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                Total Gross
              </p>

              <p className="mt-1.5 text-lg font-bold text-[#29251f]">
                {formatAmount(payout.total_gross)}
              </p>
            </div>

            <div className="rounded-xl border border-[#b8902e]/10 bg-[#fbfaf7] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                Total TDS
              </p>

              <p className="mt-1.5 text-lg font-bold text-[#29251f]">
                {formatAmount(payout.total_tds)}
              </p>
            </div>

            <div className="rounded-xl border border-[#b8902e]/10 bg-[#fffaf0] p-4 sm:col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#9b741d]">
                Total Net Payout
              </p>

              <p className="mt-1 text-[28px] font-bold tracking-tight text-[#8f6d1d]">
                {formatAmount(payout.total_net)}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
              <div className="flex items-center gap-2">
                <FiCalendar
                  size={15}
                  className="text-[#b8902e]"
                />

                <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                  Created At
                </p>
              </div>

              <p className="mt-2 text-xs font-semibold text-[#4d463b]">
                {formatDate(payout.created_at)}
              </p>
            </div>

            <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
              <div className="flex items-center gap-2">
                <FiCheck
                  size={15}
                  className="text-[#b8902e]"
                />

                <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                  Released At
                </p>
              </div>

              <p className="mt-2 text-xs font-semibold text-[#4d463b]">
                {formatDate(payout.released_at)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-[#b8902e]/10 bg-[#fffdfa] px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#b8902e]/15 bg-white px-5 py-2.5 text-sm font-bold text-[#786f60] transition hover:bg-[#faf8f3]"
          >
            Close
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// HOLD MODAL
// =====================================================

interface HoldModalProps {
  open: boolean;
  loading: boolean;
  payout: Payout | null;
  onClose: () => void;
  onConfirm: (entryId: number) => void;
}

const HoldEntryModal: React.FC<HoldModalProps> = ({
  open,
  loading,
  payout,
  onClose,
  onConfirm,
}) => {
  const [entryId, setEntryId] = useState("");

  useEffect(() => {
    if (!open) {
      setEntryId("");
    }
  }, [open]);

  if (!open || !payout) {
    return null;
  }

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={!loading}
    >
      <div className="w-full max-w-[480px] overflow-hidden rounded-[22px] border border-[#b8902e]/15 bg-white shadow-2xl">
        <div className="h-[3px] w-full bg-gradient-to-r from-[#e8c97a] to-[#8a6c1f]" />

        <div className="flex items-start justify-between border-b border-[#b8902e]/10 px-5 py-5">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff8e8] text-[#a67d1c]">
                <FiLock size={16} />
              </div>

              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a741b]">
                Hold Payment
              </span>
            </div>

            <h2 className="text-[19px] font-bold text-[#29251f]">
              Hold Payout Entry
            </h2>

            <p className="mt-1 text-xs text-[#a19583]">
              Payout #{payout.id} • {formatPeriod(payout.period)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faf8f3] text-[#8f6d1d] disabled:opacity-50"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="p-5">
          <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
              Payout Net Amount
            </p>

            <p className="mt-1 text-xl font-bold text-[#8f6d1d]">
              {formatAmount(payout.total_net)}
            </p>
          </div>

          <div className="mt-5">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#786f60]">
              Payout Entry ID
            </label>

            <input
              type="number"
              min={1}
              value={entryId}
              onChange={(e) => setEntryId(e.target.value)}
              placeholder="Enter payout entry ID"
              className="h-12 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 text-sm font-medium text-[#29251f] outline-none transition focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/10"
            />

            <p className="mt-2 text-[10px] leading-5 text-[#9b9182]">
              Hold API works on a payout entry:
              <span className="font-semibold text-[#8f6d1d]">
                {" "}
                /admin/payouts/entries/{"{entryId}"}/hold
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#b8902e]/10 bg-[#fffdfa] px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-[#b8902e]/15 bg-white px-5 py-2.5 text-sm font-bold text-[#786f60] transition hover:bg-[#faf8f3] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              const id = Number(entryId);

              if (!id || id <= 0) {
                toast.error(
                  "Please enter a valid payout entry ID."
                );
                return;
              }

              onConfirm(id);
            }}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-5 py-2.5 text-sm font-bold text-white transition hover:from-[#a98227] hover:to-[#7e6017] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <FiRefreshCw
                size={15}
                className="animate-spin"
              />
            ) : (
              <FiLock size={15} />
            )}

            {loading ? "Holding..." : "Hold Payment"}
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// NOTIFY MODAL
// =====================================================

interface NotifyModalProps {
  open: boolean;
  loading: boolean;
  payout: Payout | null;
  onClose: () => void;
  onConfirm: () => void;
}

const NotifyModal: React.FC<NotifyModalProps> = ({
  open,
  loading,
  payout,
  onClose,
  onConfirm,
}) => {
  if (!open || !payout) {
    return null;
  }

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={!loading}
    >
      <div className="w-full max-w-[450px] overflow-hidden rounded-[22px] border border-[#b8902e]/15 bg-white shadow-2xl">
        <div className="h-[3px] w-full bg-gradient-to-r from-[#d4af52] to-[#8a6c1f]" />

        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#b8902e]">
              <FiMail size={20} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#29251f]">
                Notify Users
              </h2>

              <p className="mt-1 text-sm leading-6 text-[#786f60]">
                Send payout notification for{" "}
                <span className="font-bold text-[#8f6d1d]">
                  {formatPeriod(payout.period)}
                </span>
                .
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#a89a7d]">
                Net payout
              </span>

              <span className="text-base font-bold text-[#8f6d1d]">
                {formatAmount(payout.total_net)}
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-[#b8902e]/15 bg-white px-5 py-2.5 text-sm font-bold text-[#786f60] transition hover:bg-[#faf8f3] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-5 py-2.5 text-sm font-bold text-white transition hover:from-[#a98227] hover:to-[#7e6017] disabled:opacity-50"
            >
              {loading ? (
                <FiRefreshCw
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <FiMail size={15} />
              )}

              {loading
                ? "Sending..."
                : "Send Notification"}
            </button>
          </div>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// RELEASE MODAL
// =====================================================

interface ReleaseModalProps {
  open: boolean;
  loading: boolean;
  payout: Payout | null;
  onClose: () => void;
  onConfirm: () => void;
}

const ReleaseModal: React.FC<ReleaseModalProps> = ({
  open,
  loading,
  payout,
  onClose,
  onConfirm,
}) => {
  if (!open || !payout) {
    return null;
  }

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={!loading}
    >
      <div className="w-full max-w-[460px] overflow-hidden rounded-[22px] border border-[#b8902e]/15 bg-white shadow-2xl">
        <div className="h-[3px] w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f8f3e5] text-[#8f6d1d]">
              <FiUnlock size={21} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#29251f]">
                Release Payout
              </h2>

              <p className="mt-1 text-sm leading-6 text-[#786f60]">
                Are you sure you want to release the payout for{" "}
                <span className="font-bold text-[#8f6d1d]">
                  {formatPeriod(payout.period)}
                </span>
                ?
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-[#b8902e]/10 bg-[#fffaf0] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#a89a7d]">
                Total Net
              </span>

              <span className="text-lg font-bold text-[#8f6d1d]">
                {formatAmount(payout.total_net)}
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-[#b8902e]/15 bg-white px-5 py-2.5 text-sm font-bold text-[#786f60] transition hover:bg-[#faf8f3] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-5 py-2.5 text-sm font-bold text-white transition hover:from-[#a98227] hover:to-[#7e6017] disabled:opacity-50"
            >
              {loading ? (
                <FiRefreshCw
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <FiUnlock size={15} />
              )}

              {loading
                ? "Releasing..."
                : "Release Payout"}
            </button>
          </div>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// PAYMENT MANAGEMENT
// =====================================================

const Payout: React.FC = () => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "released"
  >("all");

  const [currentPage, setCurrentPage] = useState(1);

  const [selectedPayout, setSelectedPayout] =
    useState<Payout | null>(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [holdOpen, setHoldOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);

  const [releaseLoading, setReleaseLoading] =
    useState(false);

  const [holdLoading, setHoldLoading] =
    useState(false);

  const [notifyLoading, setNotifyLoading] =
    useState(false);

  const [exportLoading, setExportLoading] =
    useState<number | null>(null);

  const ITEMS_PER_PAGE = 10;

  // ===================================================
  // GET PAYOUTS
  // ===================================================

  const fetchPayouts = async () => {
    try {
      setLoading(true);

      const response = await payoutApi.getAll();

      if (response.data.success) {
        setPayouts(response.data.data || []);
      } else {
        toast.error(
          response.data.message ||
            "Unable to fetch payouts."
        );
      }
    } catch (error: any) {
      console.error(
        "Fetch payouts error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to fetch payouts."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  // ===================================================
  // STATS
  // ===================================================

  const stats = useMemo(() => {
    const totalPayouts = payouts.length;

    const pendingPayouts = payouts.filter(
      (item) => item.status === "pending"
    ).length;

    const releasedPayouts = payouts.filter(
      (item) => item.status === "released"
    ).length;

    const totalNet = payouts.reduce(
      (sum, item) =>
        sum + Number(item.total_net || 0),
      0
    );

    return {
      totalPayouts,
      pendingPayouts,
      releasedPayouts,
      totalNet,
    };
  }, [payouts]);

  // ===================================================
  // FILTER
  // ===================================================

  const filteredPayouts = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return payouts.filter((payout) => {
      const matchesSearch =
        !query ||
        [
          String(payout.id),
          payout.period,
          payout.status,
          formatPeriod(payout.period),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        payout.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [payouts, search, statusFilter]);

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredPayouts.length /
        ITEMS_PER_PAGE
    )
  );

  const startIndex =
    (currentPage - 1) *
    ITEMS_PER_PAGE;

  const paginatedPayouts =
    filteredPayouts.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );

  const startEntry =
    filteredPayouts.length === 0
      ? 0
      : startIndex + 1;

  const endEntry = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredPayouts.length
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // ===================================================
  // PAGINATION BUTTONS
  // ===================================================

  const paginationPages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1
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
  // VIEW
  // ===================================================

  const handleView = (payout: Payout) => {
    setSelectedPayout(payout);
    setViewOpen(true);
  };

  // ===================================================
  // RELEASE
  // ===================================================

  const openRelease = (payout: Payout) => {
    if (payout.status === "released") {
      toast.error(
        "This payout is already released."
      );
      return;
    }

    setSelectedPayout(payout);
    setReleaseOpen(true);
  };

  const handleRelease = async () => {
    if (!selectedPayout) {
      return;
    }

    try {
      setReleaseLoading(true);

      const response =
        await payoutApi.release(
          selectedPayout.id
        );

      if (response.data?.success) {
        toast.success(
          response.data?.message ||
            "Payout released successfully."
        );

        await fetchPayouts();

        setReleaseOpen(false);
        setSelectedPayout(null);
      } else {
        toast.error(
          response.data?.message ||
            "Unable to release payout."
        );
      }
    } catch (error: any) {
      console.error(
        "Release payout error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to release payout."
      );
    } finally {
      setReleaseLoading(false);
    }
  };

  // ===================================================
  // HOLD
  // ===================================================

  const openHold = (payout: Payout) => {
    setSelectedPayout(payout);
    setHoldOpen(true);
  };

  const handleHold = async (
    entryId: number
  ) => {
    try {
      setHoldLoading(true);

      const response =
        await payoutApi.holdEntry(
          entryId
        );

      if (response.data?.success) {
        toast.success(
          response.data?.message ||
            "Payment held successfully."
        );

        await fetchPayouts();

        setHoldOpen(false);
        setSelectedPayout(null);
      } else {
        toast.error(
          response.data?.message ||
            "Unable to hold payment."
        );
      }
    } catch (error: any) {
      console.error(
        "Hold payment error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to hold payment."
      );
    } finally {
      setHoldLoading(false);
    }
  };

  // ===================================================
  // NOTIFY
  // ===================================================

  const openNotify = (payout: Payout) => {
    setSelectedPayout(payout);
    setNotifyOpen(true);
  };

  const handleNotify = async () => {
    if (!selectedPayout) {
      return;
    }

    try {
      setNotifyLoading(true);

      const response =
        await payoutApi.notify(
          selectedPayout.id
        );

      if (response.data?.success) {
        toast.success(
          response.data?.message ||
            "Payout notification sent successfully."
        );

        setNotifyOpen(false);
        setSelectedPayout(null);
      } else {
        toast.error(
          response.data?.message ||
            "Unable to send notification."
        );
      }
    } catch (error: any) {
      console.error(
        "Notify payout error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to send notification."
      );
    } finally {
      setNotifyLoading(false);
    }
  };

  // ===================================================
  // EXPORT
  // ===================================================

  const handleExport = async (
    payout: Payout
  ) => {
    try {
      setExportLoading(payout.id);

      const response =
        await payoutApi.export(
          payout.id
        );

      const blob = new Blob([
        response.data,
      ]);

      const url =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement("a");

      link.href = url;

      const contentType =
        response.headers?.[
          "content-type"
        ] || "";

      const extension =
        contentType.includes("csv")
          ? "csv"
          : "xlsx";

      link.download =
        `payout-${payout.period}.${extension}`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success(
        "Payout exported successfully."
      );
    } catch (error: any) {
      console.error(
        "Export payout error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to export payout."
      );
    } finally {
      setExportLoading(null);
    }
  };

  // ===================================================
  // UI
  // ===================================================

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="min-h-screen bg-[#f7f5ef] p-4 sm:p-5 lg:p-7"
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <motion.div
          variants={itemVariants}
          className=" flex flex-col justify-between gap-4 xl:flex-row xl:items-center"
        >
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#b8902e]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9a741b]">
                Finance & Payouts
              </span>
            </div>

            <h1 className="font-serif text-[29px] font-bold tracking-tight text-[#29251f] sm:text-[34px]">
              PayOut Management
            </h1>

            <p className=" max-w-2xl text-sm leading-6 text-[#8d8372]">
              Review payout cycles, hold individual payments,
              release payouts and export financial records.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchPayouts}
            disabled={loading}
            className="flex h-11 items-center justify-center gap-2 self-start rounded-xl border border-[#b8902e]/20 bg-white px-4 text-sm font-bold text-[#8f6d1d] shadow-sm transition hover:border-[#b8902e]/35 hover:bg-[#faf8f3] disabled:cursor-not-allowed disabled:opacity-50"
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

        {/* =================================================
            STATS
        ================================================= */}

        <motion.div
          variants={containerVariants}
          className="mb-5 mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <StatCard
            title="Total Payout Cycles"
            value={stats.totalPayouts}
            subtitle="All payout periods"
            icon={<FiFileText size={21} />}
            accent="bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]"
          />

          <StatCard
            title="Pending Payouts"
            value={stats.pendingPayouts}
            subtitle="Waiting for release"
            icon={<FiClock size={21} />}
            accent="bg-gradient-to-r from-[#e8c97a] to-[#b8902e]"
          />

          <StatCard
            title="Released Payouts"
            value={stats.releasedPayouts}
            subtitle="Successfully released"
            icon={<FiCheck size={21} />}
            accent="bg-gradient-to-r from-[#c9a84c] to-[#8a6c1f]"
          />

          <StatCard
            title="Total Net Value"
            value={formatAmount(stats.totalNet)}
            subtitle="Across loaded payout cycles"
            icon={<FiUnlock size={21} />}
            accent="bg-gradient-to-r from-[#f0d38a] via-[#b8902e] to-[#8a6c1f]"
          />
        </motion.div>

        {/* =================================================
            MAIN CARD
        ================================================= */}

        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-[22px] border border-[#b8902e]/12 bg-white shadow-[0_8px_30px_rgba(70,55,20,0.045)]"
        >
          <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

          {/* TOOLBAR */}

          <div className="border-b border-[#b8902e]/10 p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-[500px]">
                <FiSearch
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a8841c]"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(
                      e.target.value
                    );
                    setCurrentPage(1);
                  }}
                  placeholder="Search payout ID, period or status..."
                  className="h-12 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] pl-11 pr-4 text-sm text-[#29251f] outline-none transition placeholder:text-[#a89a7d] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/10"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  {
                    key: "all" as const,
                    label: "All",
                  },
                  {
                    key: "pending" as const,
                    label: "Pending",
                  },
                  {
                    key: "released" as const,
                    label: "Released",
                  },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setStatusFilter(
                        item.key
                      );
                      setCurrentPage(1);
                    }}
                    className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                      statusFilter ===
                      item.key
                        ? "bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] text-white shadow-md shadow-[#b8902e]/20"
                        : "border border-[#b8902e]/15 bg-[#faf8f3] text-[#786f60] hover:border-[#b8902e]/30 hover:bg-[#b8902e]/10 hover:text-[#8f6d1d]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>


          {/* DESKTOP TABLE */}

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1200px] border-collapse">
              <thead>
                <tr className="bg-[#2f2a22]">
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                    S.No.
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                    Payout
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                    Period
                  </th>

                  <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                    Gross
                  </th>

                  <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                    TDS
                  </th>

                  <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                    Net
                  </th>

                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                    Status
                  </th>

                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                    Released At
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
                      colSpan={9}
                      className="px-5 py-16 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b8902e]/10 text-[#b8902e]">
                          <FiRefreshCw
                            size={22}
                            className="animate-spin"
                          />
                        </div>

                        <p className="mt-4 text-sm font-bold text-[#29251f]">
                          Loading payouts...
                        </p>

                        <p className="mt-1 text-xs text-[#a89a7d]">
                          Please wait while payout data is fetched.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedPayouts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-16 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#b8902e]">
                          <FiSearch size={24} />
                        </div>

                        <p className="mt-4 text-sm font-bold text-[#29251f]">
                          No payouts found
                        </p>

                        <p className="mt-1 text-xs text-[#a89a7d]">
                          Try another search or filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedPayouts.map(
                    (payout, index) => (
                      <motion.tr
                        key={payout.id}
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
                            index * 0.03,
                        }}
                        className="border-b border-[#b8902e]/10 bg-white transition hover:bg-[#fcfaf5]"
                      >
                        <td className="px-5 py-4">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-xs font-bold text-[#8f6d1d]">
                            {startIndex +
                              index +
                              1}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-white">
                              <FiFileText
                                size={17}
                              />
                            </div>

                            <div>
                              <p className="text-sm font-bold text-[#29251f]">
                                Payout #
                                {payout.id}
                              </p>

                              <p className="mt-1 text-[10px] text-[#a89a7d]">
                                Created by Admin #
                                {payout.created_by ??
                                  "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <FiCalendar
                              size={14}
                              className="text-[#b8902e]"
                            />

                            <div>
                              <p className="text-xs font-bold text-[#4a4436]">
                                {formatPeriod(
                                  payout.period
                                )}
                              </p>

                              <p className="mt-1 text-[10px] text-[#a89a7d]">
                                {payout.period}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span className="text-sm font-semibold text-[#4d463b]">
                            {formatAmount(
                              payout.total_gross
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span className="text-sm font-semibold text-[#8e554d]">
                            {formatAmount(
                              payout.total_tds
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span className="text-sm font-bold text-[#8f6d1d]">
                            {formatAmount(
                              payout.total_net
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold capitalize ${getStatusClass(
                              payout.status
                            )}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {payout.status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <FiClock
                              size={13}
                              className="text-[#b8902e]"
                            />

                            <span className="text-[10px] font-semibold text-[#786f60]">
                              {payout.released_at
                                ? formatDate(
                                    payout.released_at
                                  )
                                : "Not Released"}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleView(
                                  payout
                                )
                              }
                              title="View payout"
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] text-[#8f6d1d] transition hover:bg-[#b8902e] hover:text-white"
                            >
                              <FiEye
                                size={15}
                              />
                            </button>

                            {payout.status ===
                              "pending" && (
                              <button
                                type="button"
                                onClick={() =>
                                  openRelease(
                                    payout
                                  )
                                }
                                title="Release payout"
                                className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#b8902e]/20 bg-[#fffaf0] px-3 text-[10px] font-bold text-[#8f6d1d] transition hover:bg-[#b8902e] hover:text-white"
                              >
                                <FiUnlock
                                  size={14}
                                />
                                Release
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                openHold(
                                  payout
                                )
                              }
                              title="Hold payment entry"
                              className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#d8a85a]/20 bg-[#fff8e8] px-3 text-[10px] font-bold text-[#9a741b] transition hover:bg-[#c99739] hover:text-white"
                            >
                              <FiLock
                                size={14}
                              />
                              Hold
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openNotify(
                                  payout
                                )
                              }
                              title="Notify users"
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] text-[#8f6d1d] transition hover:bg-[#b8902e] hover:text-white"
                            >
                              <FiMail
                                size={15}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleExport(
                                  payout
                                )
                              }
                              disabled={
                                exportLoading ===
                                payout.id
                              }
                              title="Export payout"
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-white text-[#8f6d1d] transition hover:bg-[#b8902e] hover:text-white disabled:opacity-50"
                            >
                              {exportLoading ===
                              payout.id ? (
                                <FiRefreshCw
                                  size={14}
                                  className="animate-spin"
                                />
                              ) : (
                                <FiDownload
                                  size={15}
                                />
                              )}
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
            {paginatedPayouts.length > 0 ? (
              paginatedPayouts.map(
                (payout, index) => (
                  <motion.div
                    key={payout.id}
                    variants={itemVariants}
                    className="border-b border-[#b8902e]/10 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-white">
                          <FiFileText
                            size={17}
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#29251f]">
                            Payout #
                            {payout.id}
                          </p>

                          <p className="mt-1 text-[10px] text-[#a89a7d]">
                            {formatPeriod(
                              payout.period
                            )}
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
                          Gross
                        </p>

                        <p className="mt-1 text-sm font-bold text-[#4a4436]">
                          {formatAmount(
                            payout.total_gross
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#b8902e]/10 bg-[#fffaf0] p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-[#a89a7d]">
                          Net
                        </p>

                        <p className="mt-1 text-sm font-bold text-[#8f6d1d]">
                          {formatAmount(
                            payout.total_net
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-[#a89a7d]">
                          TDS
                        </p>

                        <p className="mt-1 text-sm font-bold text-[#8e554d]">
                          {formatAmount(
                            payout.total_tds
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-[#a89a7d]">
                          Status
                        </p>

                        <span
                          className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold capitalize ${getStatusClass(
                            payout.status
                          )}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {payout.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleView(
                            payout
                          )
                        }
                        className="flex h-9 items-center gap-1.5 rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] px-3 text-xs font-bold text-[#8f6d1d]"
                      >
                        <FiEye size={14} />
                        View
                      </button>

                      {payout.status ===
                        "pending" && (
                        <button
                          type="button"
                          onClick={() =>
                            openRelease(
                              payout
                            )
                          }
                          className="flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-3 text-xs font-bold text-white"
                        >
                          <FiUnlock
                            size={14}
                          />
                          Release
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          openHold(
                            payout
                          )
                        }
                        className="flex h-9 items-center gap-1.5 rounded-xl border border-[#d8a85a]/20 bg-[#fff8e8] px-3 text-xs font-bold text-[#9a741b]"
                      >
                        <FiLock size={14} />
                        Hold
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openNotify(
                            payout
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] text-[#8f6d1d]"
                      >
                        <FiMail size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleExport(
                            payout
                          )
                        }
                        disabled={
                          exportLoading ===
                          payout.id
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-white text-[#8f6d1d] disabled:opacity-50"
                      >
                        {exportLoading ===
                        payout.id ? (
                          <FiRefreshCw
                            size={14}
                            className="animate-spin"
                          />
                        ) : (
                          <FiDownload
                            size={14}
                          />
                        )}
                      </button>
                    </div>
                  </motion.div>
                )
              )
            ) : (
              <div className="flex flex-col items-center px-5 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#b8902e]">
                  <FiSearch size={24} />
                </div>

                <p className="mt-4 text-sm font-bold text-[#29251f]">
                  No payouts found
                </p>

                <p className="mt-1 text-xs text-[#a89a7d]">
                  Try another search or filter.
                </p>
              </div>
            )}
          </div>

          {/* =================================================
              PAGINATION
          ================================================= */}

          {filteredPayouts.length > 0 && (
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
                    {filteredPayouts.length}
                  </span>{" "}
                  entries
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          page - 1
                      )
                    }
                    disabled={currentPage === 1}
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
                          setCurrentPage(
                            page
                          )
                        }
                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold ${
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
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          page + 1
                      )
                    }
                    disabled={
                      currentPage ===
                      totalPages
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

        <div className="h-4" />
      </motion.div>

      {/* =================================================
          MODALS
      ================================================= */}

      <ViewPayoutModal
        open={viewOpen}
        payout={selectedPayout}
        onClose={() => {
          setViewOpen(false);
          setSelectedPayout(null);
        }}
      />

      <ReleaseModal
        open={releaseOpen}
        loading={releaseLoading}
        payout={selectedPayout}
        onClose={() => {
          if (releaseLoading) return;

          setReleaseOpen(false);
          setSelectedPayout(null);
        }}
        onConfirm={handleRelease}
      />

      <HoldEntryModal
        open={holdOpen}
        loading={holdLoading}
        payout={selectedPayout}
        onClose={() => {
          if (holdLoading) return;

          setHoldOpen(false);
          setSelectedPayout(null);
        }}
        onConfirm={handleHold}
      />

      <NotifyModal
        open={notifyOpen}
        loading={notifyLoading}
        payout={selectedPayout}
        onClose={() => {
          if (notifyLoading) return;

          setNotifyOpen(false);
          setSelectedPayout(null);
        }}
        onConfirm={handleNotify}
      />
    </>
  );
};

export default Payout;
