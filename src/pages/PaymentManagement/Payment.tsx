"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiSearch,
  FiCreditCard,
  FiActivity,
  FiUser,
  FiDownload,
  FiAlertCircle,
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

import paymentManagementApi, {
  PaymentRecord,
} from "../../api/endpoints/payment";

import { usePermissions } from "../../pages/permissions/usePermissions";

// =====================================================
// THEME - BLUE / NAVY
// =====================================================

const PRIMARY = "#1E3A8A";
const DARK_PRIMARY = "#172554";
const BLUE = "#1E40AF";
const ACCENT = "#2563EB";

const LIGHT_BLUE = "#EAF1FF";
const SOFT_BLUE = "#DBEAFE";
const PAGE_BG = "#F5F8FF";

const TEXT_PRIMARY = "#0F1B3D";
const TEXT_SECONDARY = "#4A5778";
const MUTED = "#8C97B2";

const BORDER = "#D8E2F0";
const WHITE = "#FFFFFF";

const DANGER = "#C23B32";
const DANGER_BG = "#FBEAEA";

const WARNING = "#D9A900";
const WARNING_TEXT = "#8A6D16";
const WARNING_BG = "#FBF3DC";

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
  value: string | number | null | undefined,
) => {
  const amount = Number(value || 0);

  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (
  value?: string | null,
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

const formatStatus = (
  status: string,
) => {
  if (!status) {
    return "—";
  }

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    );
};

const getStatusClass = (
  status: string,
) => {
  switch (status) {
    case "confirmed":
      return "border-[#1E3A8A]/25 bg-[#EAF1FF] text-[#1E3A8A]";

    case "delivered":
      return "border-[#2563EB]/25 bg-[#DBEAFE] text-[#1E40AF]";

    case "pending":
      return "border-[#D9A900]/30 bg-[#FBF3DC] text-[#8A6D16]";

    case "returned":
      return "border-[#C23B32]/25 bg-[#FBEAEA] text-[#C23B32]";

    case "partial_returned":
      return "border-[#D9A900]/25 bg-[#FDF4E3] text-[#8A6D16]";

    case "partial_return_pending":
      return "border-[#D9A900]/25 bg-[#FDF4E3] text-[#8A6D16]";

    case "partial_delivered":
      return "border-[#2563EB]/25 bg-[#EAF1FF] text-[#1E3A8A]";

    default:
      return "border-[#D8E2F0] bg-[#F5F8FF] text-[#4A5778]";
  }
};

// =====================================================
// CUSTOMER HELPERS
// =====================================================

const getCustomerName = (
  payment: PaymentRecord,
) => {
  const anyPayment = payment as any;

  if (anyPayment.full_name?.trim()) {
    return anyPayment.full_name;
  }

  if (anyPayment.name?.trim()) {
    return anyPayment.name;
  }

  if (anyPayment.user?.name?.trim()) {
    return anyPayment.user.name;
  }

  if (anyPayment.email) {
    return String(anyPayment.email).split("@")[0];
  }

  return "Customer";
};

const getInitials = (
  name: string,
) => {
  if (!name) {
    return "?";
  }

  const parts = name
    .trim()
    .split(/\s+/);

  if (parts.length === 1) {
    return parts[0]
      .charAt(0)
      .toUpperCase();
  }

  return (
    parts[0]
      .charAt(0)
      .toUpperCase() +
    parts[parts.length - 1]
      .charAt(0)
      .toUpperCase()
  );
};

const getAccountTypeBadge = (
  accountType: string,
) => {
  const normalized = (
    accountType || ""
  ).toLowerCase();

  switch (normalized) {
    case "distributor":
      return "border-[#1E3A8A]/20 bg-[#EAF1FF] text-[#1E3A8A]";

    case "customer":
      return "border-[#2563EB]/25 bg-[#DBEAFE] text-[#1E40AF]";

    case "admin":
      return "border-[#D9A900]/25 bg-[#FBF3DC] text-[#8A6D16]";

    default:
      return "border-[#D8E2F0] bg-[#F5F8FF] text-[#4A5778]";
  }
};

const formatAccountType = (
  accountType: string,
) => {
  if (!accountType) {
    return "—";
  }

  return accountType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    );
};

// =====================================================
// CSV HELPERS
// =====================================================

const escapeCsvValue = (
  value: any,
): string => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  const str = String(value);

  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(
      /"/g,
      '""',
    )}"`;
  }

  return str;
};

const generateCsv = (
  records: PaymentRecord[],
): string => {
  const headers = [
    "S.No.",
    "Order Reference",
    "Customer Name",
    "Customer Email",
    "Customer Phone",
    "Account Type",
    "Transaction ID",
    "Amount Paid",
    "Status",
    "Payment Gateway",
    "Created At",
  ];

  const rows: string[] = [];

  rows.push(
    headers
      .map(escapeCsvValue)
      .join(","),
  );

  records.forEach(
    (payment, index) => {
      const anyPayment =
        payment as any;

      const customerName =
        getCustomerName(payment);

      const row = [
        index + 1,
        payment.order_reference || "",
        customerName || "",
        anyPayment.email || "",
        anyPayment.phone || "",
        formatAccountType(
          anyPayment.account_type,
        ) || "",
        payment.gateway_transaction_id ||
          "",
        Number(
          payment.amount_paid || 0,
        ).toFixed(2),
        formatStatus(
          payment.status,
        ) || "",
        payment.payment_gateway || "",
        formatDate(
          payment.created_at,
        ) || "",
      ];

      rows.push(
        row
          .map(escapeCsvValue)
          .join(","),
      );
    },
  );

  return rows.join("\r\n");
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

const StatCard: React.FC<
  StatCardProps
> = ({
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
          "0 16px 32px -18px rgba(30,58,138,0.28)",
      }}
      className="relative min-h-[138px] overflow-hidden rounded-[20px] border border-[#D8E2F0] bg-white p-5 shadow-[0_8px_24px_rgba(30,58,138,0.06)]"
    >
      <div
        className={`absolute left-0 right-0 top-0 h-[3px] ${accent}`}
      />

      <div className="pointer-events-none absolute -right-7 -top-7 h-24 w-24 rounded-full border border-[#2563EB]/15" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8C97B2]">
            {title}
          </p>

          <p className="mt-2 text-[29px] font-bold tracking-tight text-[#0F1B3D]">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-[#7E89A4]">
            {subtitle}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#EAF1FF] text-[#1E3A8A]">
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

// =====================================================
// PAYMENT MANAGEMENT
// =====================================================

const Payment: React.FC = () => {
  // ===================================================
  // PERMISSIONS
  // ===================================================

  const {
    hasPermission,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  // Exact backend permissions:
  //
  // "Payment": ["view", "export"]

  const canViewPayments = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission(
        "Payment.view",
      ),
    [
      isSuperAdmin,
      hasPermission,
    ],
  );

  const canExportPayments = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission(
        "Payment.export",
      ),
    [
      isSuperAdmin,
      hasPermission,
    ],
  );

  // ===================================================
  // STATE
  // ===================================================

  const [
    payments,
    setPayments,
  ] = useState<PaymentRecord[]>(
    [],
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    "all" | string
  >("all");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    downloadingCsv,
    setDownloadingCsv,
  ] = useState(false);

  const ITEMS_PER_PAGE = 10;

  // ===================================================
  // DUPLICATE API PROTECTION
  // ===================================================

  const fetchInFlightRef =
    useRef<Promise<void> | null>(
      null,
    );

  const hasInitialFetchRef =
    useRef(false);

  // ===================================================
  // GET PAYMENTS
  // ===================================================

  const fetchPayments = async (
    force = false,
  ) => {
    if (fetchInFlightRef.current) {
      return fetchInFlightRef.current;
    }

    if (
      !force &&
      hasInitialFetchRef.current
    ) {
      return;
    }

    const requestPromise =
      (async () => {
        try {
          setLoading(true);

          const response =
            await paymentManagementApi.getAll();

          if (
            response.data.success
          ) {
            setPayments(
              response.data.data || [],
            );

            hasInitialFetchRef.current =
              true;
          } else {
            toast.error(
              response.data.message ||
                "Unable to fetch payment records.",
            );
          }
        } catch (error: any) {
          console.error(
            "Fetch payment records error:",
            error,
          );

          toast.error(
            error?.response?.data
              ?.message ||
              "Unable to fetch payment records.",
          );
        } finally {
          setLoading(false);
        }
      })();

    fetchInFlightRef.current =
      requestPromise;

    try {
      await requestPromise;
    } finally {
      fetchInFlightRef.current =
        null;
    }
  };

  // ===================================================
  // INITIAL FETCH
  // ===================================================

  useEffect(() => {
    if (
      !permissionsLoading &&
      canViewPayments &&
      !hasInitialFetchRef.current
    ) {
      fetchPayments();
    }
  }, [
    permissionsLoading,
    canViewPayments,
  ]);

  // ===================================================
  // STATUS OPTIONS
  // ===================================================

  const statusOptions = [
    "all",
    "confirmed",
    "delivered",
    "returned",
    "pending",
    "partial_returned",
    "partial_return_pending",
    "partial_delivered",
  ];

  // ===================================================
  // STATS
  // ===================================================

  const stats = useMemo(() => {
    const totalPayments =
      payments.length;

    const confirmedPayments =
      payments.filter(
        (item) =>
          item.status ===
          "confirmed",
      ).length;

    const pendingPayments =
      payments.filter(
        (item) =>
          item.status ===
          "pending",
      ).length;

    const totalAmount =
      payments.reduce(
        (sum, item) =>
          sum +
          Number(
            item.amount_paid || 0,
          ),
        0,
      );

    return {
      totalPayments,
      confirmedPayments,
      pendingPayments,
      totalAmount,
    };
  }, [payments]);

  // ===================================================
  // FILTER
  // ===================================================

  const filteredPayments =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return payments.filter(
        (payment) => {
          const anyPayment =
            payment as any;

          const matchesSearch =
            !query ||
            [
              payment.order_reference,
              payment.gateway_transaction_id,
              payment.amount_paid,
              payment.status,
              payment.payment_gateway,
              formatDate(
                payment.created_at,
              ),
              anyPayment.full_name ||
                "",
              anyPayment.name ||
                "",
              anyPayment.email ||
                "",
              anyPayment.phone ||
                "",
              anyPayment.account_type ||
                "",
            ]
              .join(" ")
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            statusFilter ===
              "all" ||
            payment.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        },
      );
    }, [
      payments,
      search,
      statusFilter,
    ]);

  // ===================================================
  // ACTIVE FILTER LABEL
  // ===================================================

  const activeFilterLabel =
    useMemo(() => {
      const parts: string[] = [];

      if (
        statusFilter !==
        "all"
      ) {
        parts.push(
          formatStatus(
            statusFilter,
          ),
        );
      }

      if (search.trim()) {
        parts.push("Search");
      }

      return parts.length > 0
        ? parts.join(" • ")
        : "All Payments";
    }, [
      statusFilter,
      search,
    ]);

  // ===================================================
  // CSV DOWNLOAD PERMISSION
  // ===================================================

  const handleDownloadCsv =
    () => {
      if (
        !canExportPayments
      ) {
        toast.error(
          "You do not have permission to export payment records.",
        );
        return;
      }

      if (downloadingCsv) {
        return;
      }

      if (
        !filteredPayments ||
        filteredPayments.length ===
          0
      ) {
        toast.error(
          "No payment records match the current filters to export.",
        );
        return;
      }

      setDownloadingCsv(true);

      try {
        const csvContent =
          generateCsv(
            filteredPayments,
          );

        const BOM = "\uFEFF";

        const blob =
          new Blob(
            [BOM + csvContent],
            {
              type: "text/csv;charset=utf-8;",
            },
          );

        const url =
          window.URL.createObjectURL(
            blob,
          );

        const link =
          document.createElement(
            "a",
          );

        link.href = url;

        const today =
          new Date()
            .toISOString()
            .slice(0, 10);

        const slug =
          activeFilterLabel
            .toLowerCase()
            .replace(
              /[^a-z0-9]+/g,
              "-",
            )
            .replace(
              /^-+|-+$/g,
              "",
            );

        link.download = `payments-${
          slug || "filtered"
        }-${today}.csv`;

        document.body.appendChild(
          link,
        );

        link.click();

        document.body.removeChild(
          link,
        );

        window.URL.revokeObjectURL(
          url,
        );

        toast.success(
          `CSV downloaded — ${
            filteredPayments.length
          } record${
            filteredPayments.length ===
            1
              ? ""
              : "s"
          } exported`,
        );
      } catch (error: any) {
        console.error(
          "CSV download error:",
          error,
        );

        toast.error(
          "Failed to download CSV. Please try again.",
        );
      } finally {
        setDownloadingCsv(
          false,
        );
      }
    };

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredPayments.length /
          ITEMS_PER_PAGE,
      ),
    );

  const startIndex =
    (currentPage - 1) *
    ITEMS_PER_PAGE;

  const paginatedPayments =
    filteredPayments.slice(
      startIndex,
      startIndex +
        ITEMS_PER_PAGE,
    );

  const startEntry =
    filteredPayments.length ===
    0
      ? 0
      : startIndex + 1;

  const endEntry = Math.min(
    startIndex +
      ITEMS_PER_PAGE,
    filteredPayments.length,
  );

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages,
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const paginationPages =
    useMemo(() => {
      if (totalPages <= 5) {
        return Array.from(
          {
            length: totalPages,
          },
          (_, index) =>
            index + 1,
        );
      }

      if (currentPage <= 3) {
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
  // PERMISSION LOADING
  // ===================================================

  if (permissionsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8FF] p-6 font-poppins">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
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


  if (
    loading &&
    payments.length === 0
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8FF] font-poppins">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#D8E2F0] border-t-[#1E3A8A]" />

          <p className="mt-3 text-sm text-[#4A5778]">
            Loading payments...
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-[#F5F8FF] p-4 font-poppins sm:p-5 lg:p-7"
    >
      {/* HEADER */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center"
      >
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#1E3A8A]">
              Finance & Payments
            </span>
          </div>

          <h1 className="text-[29px] font-bold tracking-tight text-[#0F1B3D] sm:text-[34px]">
            Payment Summary
          </h1>

          <p className="max-w-2xl text-sm leading-6 text-[#4A5778]">
            Review payment transactions, order references, gateway details and
            payment statuses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start">
          {/* CSV EXPORT */}
          {canExportPayments && (
            <button
              type="button"
              onClick={
                handleDownloadCsv
              }
              disabled={
                downloadingCsv ||
                loading ||
                filteredPayments.length ===
                  0
              }
              title={`Export ${activeFilterLabel} as CSV`}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#1E3A8A]/20 bg-gradient-to-br from-[#2563EB] to-[#1E3A8A] px-4 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(30,58,138,0.5)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(30,58,138,0.6)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloadingCsv ? (
                <FiRefreshCw
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <FiDownload
                  size={16}
                />
              )}

              {downloadingCsv
                ? "Downloading..."
                : "Download CSV"}

              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                {activeFilterLabel}
              </span>

              {filteredPayments.length >
                0 && (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                  {
                    filteredPayments.length
                  }
                </span>
              )}
            </button>
          )}

          {/* REFRESH */}
          <button
            type="button"
            onClick={() =>
              fetchPayments(true)
            }
            disabled={loading}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#1E3A8A]/20 bg-white px-4 text-sm font-bold text-[#1E3A8A] shadow-sm transition hover:border-[#2563EB]/40 hover:bg-[#EAF1FF] disabled:cursor-not-allowed disabled:opacity-50"
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
      </motion.div>

      {/* STATS */}
      <motion.div
        variants={containerVariants}
        className="mb-5 mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          title="Total Payments"
          value={
            stats.totalPayments
          }
          subtitle="All loaded payment records"
          icon={
            <FiCreditCard
              size={21}
            />
          }
          accent="bg-gradient-to-r from-[#2563EB] via-[#1E3A8A] to-[#172554]"
        />

        <StatCard
          title="Confirmed Payments"
          value={
            stats.confirmedPayments
          }
          subtitle="Successfully confirmed"
          icon={
            <FiActivity
              size={21}
            />
          }
          accent="bg-gradient-to-r from-[#60A5FA] to-[#1E3A8A]"
        />

        <StatCard
          title="Pending Payments"
          value={
            stats.pendingPayments
          }
          subtitle="Currently pending"
          icon={
            <FiRefreshCw
              size={21}
            />
          }
          accent="bg-gradient-to-r from-[#FACC15] to-[#8A6D16]"
        />

        <StatCard
          title="Total Amount"
          value={formatAmount(
            stats.totalAmount,
          )}
          subtitle="Across loaded payment records"
          icon={
            <FiCreditCard
              size={21}
            />
          }
          accent="bg-gradient-to-r from-[#60A5FA] via-[#2563EB] to-[#172554]"
        />
      </motion.div>

      {/* MAIN CARD */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-[22px] border border-[#D8E2F0] bg-white shadow-[0_8px_30px_rgba(30,58,138,0.06)]"
      >
        <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#60A5FA] via-[#1E3A8A] to-[#172554]" />

        {/* TOOLBAR */}
        <div className="border-b border-[#D8E2F0] p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
              <FiSearch
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1E3A8A]"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(
                    e.target.value,
                  );
                  setCurrentPage(1);
                }}
                placeholder="Search order, transaction, customer, email..."
                className="h-11 w-full rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] pl-11 pr-4 text-sm text-[#0F1B3D] outline-none transition placeholder:text-[#8C97B2] focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/10"
              />
            </div>

            <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-0.5">
              {statusOptions.map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setStatusFilter(
                        status,
                      );
                      setCurrentPage(1);
                    }}
                    className={`shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2 text-[11px] font-bold transition ${
                      statusFilter ===
                      status
                        ? "bg-gradient-to-r from-[#2563EB] to-[#1E3A8A] text-white shadow-[0_6px_14px_-6px_rgba(30,58,138,0.5)]"
                        : "border border-[#D8E2F0] bg-[#F5F8FF] text-[#4A5778] hover:border-[#2563EB]/30 hover:bg-[#EAF1FF] hover:text-[#1E3A8A]"
                    }`}
                  >
                    {status ===
                    "all"
                      ? "All"
                      : formatStatus(
                          status,
                        )}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[1400px] border-collapse">
            <thead>
              <tr className="bg-[#172554]">
                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                  S.No.
                </th>

                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                  Order Reference
                </th>

                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                  User
                </th>

                <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                  Account Type
                </th>

                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                  Transaction ID
                </th>

                <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                  Amount Paid
                </th>

                <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                  Status
                </th>

                <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                  Gateway
                </th>

                <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                  Created At
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
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
                        <FiRefreshCw
                          size={22}
                          className="animate-spin"
                        />
                      </div>

                      <p className="mt-4 text-sm font-bold text-[#0F1B3D]">
                        Loading payments...
                      </p>

                      <p className="mt-1 text-xs text-[#8C97B2]">
                        Please wait while payment records are fetched.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : paginatedPayments.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-16 text-center"
                  >
                    <div className="flex flex-col items-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
                        <FiSearch
                          size={24}
                        />
                      </div>

                      <p className="mt-4 text-sm font-bold text-[#0F1B3D]">
                        No payment records found
                      </p>

                      <p className="mt-1 text-xs text-[#8C97B2]">
                        Try another search or filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPayments.map(
                  (
                    payment,
                    index,
                  ) => {
                    const anyPayment =
                      payment as any;

                    const customerName =
                      getCustomerName(
                        payment,
                      );

                    const initials =
                      getInitials(
                        customerName,
                      );

                    return (
                      <motion.tr
                        key={`${payment.order_reference}-${payment.gateway_transaction_id}-${index}`}
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
                            0.03,
                        }}
                        className="border-b border-[#D8E2F0] bg-white transition hover:bg-[#F9FBFF]"
                      >
                        <td className="px-5 py-4">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF1FF] text-xs font-bold text-[#1E3A8A]">
                            {startIndex +
                              index +
                              1}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1E3A8A] text-white">
                              <FiCreditCard
                                size={17}
                              />
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[210px] truncate text-sm font-bold text-[#0F1B3D]">
                                {
                                  payment.order_reference
                                }
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#60A5FA] to-[#1E3A8A] text-[11px] font-bold text-white">
                              {initials}
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[180px] truncate text-sm font-bold text-[#0F1B3D]">
                                {
                                  customerName
                                }
                              </p>

                              {anyPayment.email && (
                                <p className="mt-0.5 max-w-[180px] truncate text-[11px] text-[#8C97B2]">
                                  {
                                    anyPayment.email
                                  }
                                </p>
                              )}

                              {anyPayment.phone && (
                                <p className="mt-0.5 text-[10px] font-semibold text-[#4A5778]">
                                  {
                                    anyPayment.phone
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${getAccountTypeBadge(
                              anyPayment.account_type,
                            )}`}
                          >
                            <FiUser
                              size={11}
                            />

                            {formatAccountType(
                              anyPayment.account_type,
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <p className="max-w-[220px] truncate text-xs font-semibold text-[#4A5778]">
                            {
                              payment.gateway_transaction_id
                            }
                          </p>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span className="text-sm font-bold text-[#1E3A8A]">
                            {formatAmount(
                              payment.amount_paid,
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${getStatusClass(
                              payment.status,
                            )}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />

                            {formatStatus(
                              payment.status,
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center rounded-lg border border-[#D8E2F0] bg-[#F5F8FF] px-3 py-1.5 text-[10px] font-bold capitalize text-[#4A5778]">
                            {
                              payment.payment_gateway
                            }
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <FiCalendar
                              size={13}
                              className="text-[#1E3A8A]"
                            />

                            <span className="text-[10px] font-semibold text-[#4A5778]">
                              {formatDate(
                                payment.created_at,
                              )}
                            </span>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  },
                )
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE */}
        <div className="block lg:hidden">
          {loading ? (
            <div className="flex flex-col items-center px-5 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
                <FiRefreshCw
                  size={22}
                  className="animate-spin"
                />
              </div>

              <p className="mt-4 text-sm font-bold text-[#0F1B3D]">
                Loading payments...
              </p>

              <p className="mt-1 text-xs text-[#8C97B2]">
                Please wait while payment records are fetched.
              </p>
            </div>
          ) : paginatedPayments.length >
            0 ? (
            paginatedPayments.map(
              (
                payment,
                index,
              ) => {
                const anyPayment =
                  payment as any;

                const customerName =
                  getCustomerName(
                    payment,
                  );

                const initials =
                  getInitials(
                    customerName,
                  );

                return (
                  <motion.div
                    key={`${payment.order_reference}-${payment.gateway_transaction_id}-${index}`}
                    variants={
                      itemVariants
                    }
                    className="border-b border-[#D8E2F0] bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1E3A8A] text-white">
                          <FiCreditCard
                            size={17}
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#0F1B3D]">
                            {
                              payment.order_reference
                            }
                          </p>

                          <p className="mt-1 max-w-[220px] truncate text-[10px] text-[#8C97B2]">
                            {
                              payment.gateway_transaction_id
                            }
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-[#8C97B2]">
                        #
                        {startIndex +
                          index +
                          1}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#D8E2F0] bg-[#FAFBFF] p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#60A5FA] to-[#1E3A8A] text-[12px] font-bold text-white">
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[#0F1B3D]">
                          {
                            customerName
                          }
                        </p>

                        {anyPayment.email && (
                          <p className="mt-0.5 truncate text-[11px] text-[#8C97B2]">
                            {
                              anyPayment.email
                            }
                          </p>
                        )}

                        {anyPayment.phone && (
                          <p className="mt-0.5 text-[11px] font-semibold text-[#4A5778]">
                            {
                              anyPayment.phone
                            }
                          </p>
                        )}
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[9px] font-bold ${getAccountTypeBadge(
                          anyPayment.account_type,
                        )}`}
                      >
                        <FiUser
                          size={10}
                        />

                        {formatAccountType(
                          anyPayment.account_type,
                        )}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-[#2563EB]/20 bg-[#EAF1FF] p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-[#1E3A8A]">
                          Amount Paid
                        </p>

                        <p className="mt-1 text-sm font-bold text-[#172554]">
                          {formatAmount(
                            payment.amount_paid,
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-[#8C97B2]">
                          Status
                        </p>

                        <span
                          className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold ${getStatusClass(
                            payment.status,
                          )}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />

                          {formatStatus(
                            payment.status,
                          )}
                        </span>
                      </div>

                      <div className="rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-[#8C97B2]">
                          Gateway
                        </p>

                        <p className="mt-1 text-sm font-bold capitalize text-[#4A5778]">
                          {
                            payment.payment_gateway
                          }
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-[#8C97B2]">
                          Created At
                        </p>

                        <p className="mt-1 text-xs font-semibold text-[#4A5778]">
                          {formatDate(
                            payment.created_at,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-[#8C97B2]">
                        Transaction ID
                      </p>

                      <p className="mt-1 break-all text-xs font-semibold text-[#4A5778]">
                        {
                          payment.gateway_transaction_id
                        }
                      </p>
                    </div>
                  </motion.div>
                );
              },
            )
          ) : (
            <div className="flex flex-col items-center bg-white px-5 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
                <FiSearch
                  size={24}
                />
              </div>

              <p className="mt-4 text-sm font-bold text-[#0F1B3D]">
                No payment records found
              </p>

              <p className="mt-1 text-xs text-[#8C97B2]">
                Try another search or filter.
              </p>
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {filteredPayments.length >
          0 && (
          <div className="border-t border-[#D8E2F0] bg-[#FAFBFF] px-4 py-4 sm:px-5">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-xs text-[#7E89A4]">
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
                    filteredPayments.length
                  }
                </span>{" "}
                entries
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage(
                      (
                        page,
                      ) =>
                        page - 1,
                    )
                  }
                  disabled={
                    currentPage ===
                    1
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
                        setCurrentPage(
                          page,
                        )
                      }
                      className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold ${
                        currentPage ===
                        page
                          ? "bg-gradient-to-br from-[#2563EB] to-[#1E3A8A] text-white shadow-[0_6px_14px_-6px_rgba(30,58,138,0.5)]"
                          : "text-[#4A5778] hover:bg-[#EAF1FF] hover:text-[#1E3A8A]"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage(
                      (
                        page,
                      ) =>
                        page + 1,
                    )
                  }
                  disabled={
                    currentPage ===
                    totalPages
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

      <div className="h-4" />
    </motion.div>
  );
};

export default Payment;