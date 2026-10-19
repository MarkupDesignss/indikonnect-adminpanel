"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
import paymentManagementApi, { PaymentRecord } from "../../api/endpoints/payment";
import { usePermissions } from "../../pages/permissions/usePermissions";
import logoApi from "../../api/endpoints/logoApi";

// =====================================================
// DEFAULT LOGO
// =====================================================

const DEFAULT_LOGO_URL =
  "https://www.markupdesigns.net/indikonnect/storage/logos/MmVFOudCiVU3Y8C0sf2gEEXna5jSKroCDj8xYMo0.png";


// =====================================================
// ANIMATION
// =====================================================
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 110, damping: 15 },
  },
};

// =====================================================
// HELPERS
// =====================================================
const formatAmount = (value: string | number | null | undefined) => {
  const amount = Number(value || 0);
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

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

const formatStatus = (status: string) => {
  if (!status) return "—";
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

const getStatusClass = (status: string) => {
  switch (status) {
    case "confirmed":
      return "border-[#2D6FE8]/25 bg-[#EAF3FF] text-[#2D6FE8]";
    case "delivered":
      return "border-[#4F8FF7]/25 bg-[#EAF3FF] text-[#2D6FE8]";
    case "pending":
      return "border-[#FACC15]/30 bg-[#FEF9C3] text-[#A16207]";
    case "returned":
      return "border-[#C23B32]/25 bg-[#FEF2F2] text-[#C23B32]";
    case "partial_returned":
    case "partial_return_pending":
      return "border-[#FACC15]/25 bg-[#FEF9C3] text-[#A16207]";
    case "partial_delivered":
      return "border-[#4F8FF7]/25 bg-[#EAF3FF] text-[#2D6FE8]";
    default:
      return "border-[#DCE6F2] bg-[#F4F8FD] text-[#6B7280]";
  }
};

// =====================================================
// CUSTOMER HELPERS
// =====================================================
const getCustomerName = (payment: PaymentRecord) => {
  const anyPayment = payment as any;
  if (anyPayment.full_name?.trim()) return anyPayment.full_name;
  if (anyPayment.name?.trim()) return anyPayment.name;
  if (anyPayment.user?.name?.trim()) return anyPayment.user.name;
  if (anyPayment.email) return String(anyPayment.email).split("@")[0];
  return "Customer";
};

const getInitials = (name: string) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
};

const getAccountTypeBadge = (accountType: string) => {
  const normalized = (accountType || "").toLowerCase();
  switch (normalized) {
    case "distributor":
      return "border-[#2D6FE8]/20 bg-[#EAF3FF] text-[#2D6FE8]";
    case "customer":
      return "border-[#4F8FF7]/25 bg-[#EAF3FF] text-[#2D6FE8]";
    case "admin":
      return "border-[#FACC15]/25 bg-[#FEF9C3] text-[#A16207]";
    default:
      return "border-[#DCE6F2] bg-[#F4F8FD] text-[#6B7280]";
  }
};

const formatAccountType = (accountType: string) => {
  if (!accountType) return "—";
  return accountType.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

// =====================================================
// CSV HELPERS
// =====================================================
const escapeCsvValue = (value: any): string => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const generateCsv = (records: PaymentRecord[]): string => {
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
  rows.push(headers.map(escapeCsvValue).join(","));
  records.forEach((payment, index) => {
    const anyPayment = payment as any;
    const customerName = getCustomerName(payment);
    const row = [
      index + 1,
      payment.order_reference || "",
      customerName || "",
      anyPayment.email || "",
      anyPayment.phone || "",
      formatAccountType(anyPayment.account_type) || "",
      payment.gateway_transaction_id || "",
      Number(payment.amount_paid || 0).toFixed(2),
      formatStatus(payment.status) || "",
      payment.payment_gateway || "",
      formatDate(payment.created_at) || "",
    ];
    rows.push(row.map(escapeCsvValue).join(","));
  });
  return rows.join("\r\n");
};

// =====================================================
// ✅ PERMISSION / PAGE LOADING STATE (PULSING LOGO)
// Same pattern as Orders / ReturnRefund / CancelRefund / BuyBack / CreditNotes
// =====================================================

interface PermissionLoadingStateProps {
  logoUrl: string | null;
}

const PermissionLoadingState: React.FC<PermissionLoadingStateProps> = ({
  logoUrl,
}) => {
  const [displayLogo, setDisplayLogo] = useState(
    logoUrl || DEFAULT_LOGO_URL,
  );

  useEffect(() => {
    setDisplayLogo(logoUrl || DEFAULT_LOGO_URL);
  }, [logoUrl]);

  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center overflow-hidden rounded-xl bg-[#F4F8FD] p-6 font-poppins">
      <motion.img
        key={displayLogo}
        src={displayLogo}
        alt="IndieKonnect Logo"
        className="block max-h-[120px] max-w-[240px] object-contain"
        referrerPolicy="no-referrer"
        initial={{ opacity: 0.5, scale: 0.96 }}
        animate={{
          opacity: [0.8, 1, 0.8],
          scale: [0.98, 1, 0.98],
        }}
        transition={{
          duration: 1.6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        onError={() => {
          if (displayLogo !== DEFAULT_LOGO_URL) {
            setDisplayLogo(DEFAULT_LOGO_URL);
          }
        }}
      />
    </div>
  );
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

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, accent }) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ y: -4, boxShadow: "0 16px 32px -18px rgba(45,111,232,0.28)" }}
    className="relative min-h-[138px] overflow-hidden rounded-[20px] border border-[#DCE6F2] bg-white p-5 shadow-[0_8px_24px_rgba(45,111,232,0.06)]"
  >
    <div className={`absolute left-0 right-0 top-0 h-[3px] ${accent}`} />
    <div className="pointer-events-none absolute -right-7 -top-7 h-24 w-24 rounded-full border border-[#4F8FF7]/15" />
    <div className="relative z-10 flex items-start justify-between gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">{title}</p>
        <p className="mt-2 text-[29px] font-bold tracking-tight text-[#111827]">{value}</p>
        <p className="mt-1 text-[11px] text-[#6B7280]">{subtitle}</p>
      </div>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#EAF3FF] text-[#2D6FE8]">{icon}</div>
    </div>
  </motion.div>
);

// =====================================================
// PAYMENT MANAGEMENT
// =====================================================
const Payment: React.FC = () => {
  // ===================================================
  // PERMISSIONS
  // ===================================================
  const { hasPermission, isSuperAdmin, loading: permissionsLoading } = usePermissions();

  const canViewPayments = useMemo(
    () => isSuperAdmin || hasPermission("Payment.view"),
    [isSuperAdmin, hasPermission],
  );
  const canExportPayments = useMemo(
    () => isSuperAdmin || hasPermission("Payment.export"),
    [isSuperAdmin, hasPermission],
  );

  // ===================================================
  // LOGO STATE (same pattern as Orders / ReturnRefund / CreditNotes)
  // ===================================================

  const [logoUrl, setLogoUrl] = useState<string | null>(DEFAULT_LOGO_URL);
  const [logoLoading, setLogoLoading] = useState(true);

  // ===================================================
  // STATE
  // ===================================================
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  // ✅ first load only
  const [initialPaymentsLoading, setInitialPaymentsLoading] = useState(true);
  // ✅ subsequent fetch (refresh) — does NOT block page
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const ITEMS_PER_PAGE = 10;

  // ===================================================
  // DUPLICATE API PROTECTION
  // ===================================================
  const fetchInFlightRef = useRef<Promise<void> | null>(null);
  const hasInitialFetchRef = useRef(false);

  // ===================================================
  // LOGO FETCH (same as Orders / ReturnRefund / CreditNotes)
  // ===================================================

  useEffect(() => {
    let cancelled = false;

    const fetchLogo = async () => {
      try {
        const response: any = await logoApi.getLogo();

        const possibleLogos: unknown[] = [
          response?.data?.data?.logo,
          response?.data?.logo,
          response?.data?.data?.data?.logo,
          response?.data?.data?.logo_url,
          response?.data?.logo_url,
          response?.logo,
        ];

        const resolvedLogo = possibleLogos.find(
          (value): value is string =>
            typeof value === "string" && /^https?:\/\//i.test(value.trim()),
        );

        if (!cancelled && resolvedLogo) {
          setLogoUrl(resolvedLogo.trim());
        }
      } catch (error) {
        console.error("Logo API error:", error);
      } finally {
        if (!cancelled) {
          setLogoLoading(false);
        }
      }
    };

    void fetchLogo();

    return () => {
      cancelled = true;
    };
  }, []);

  // ===================================================
  // GET PAYMENTS
  // isInitialLoad = true ONLY FOR THE FIRST LOAD
  // ===================================================
  const fetchPayments = async (force = false, isInitialLoad = false) => {
    if (fetchInFlightRef.current) return fetchInFlightRef.current;
    if (!force && hasInitialFetchRef.current) return;

    const requestPromise = (async () => {
      try {
        setLoading(true);
        const response = await paymentManagementApi.getAll();
        if (response.data.success) {
          setPayments(response.data.data || []);
          hasInitialFetchRef.current = true;
        } else {
          toast.error(response.data.message || "Unable to fetch payment records.");
        }
      } catch (error: any) {
        console.error("Fetch payment records error:", error);
        toast.error(error?.response?.data?.message || "Unable to fetch payment records.");
      } finally {
        setLoading(false);

        if (isInitialLoad) {
          setInitialPaymentsLoading(false);
        }
      }
    })();

    fetchInFlightRef.current = requestPromise;
    try {
      await requestPromise;
    } finally {
      fetchInFlightRef.current = null;
    }
  };

  // ===================================================
  // INITIAL FETCH
  // WAIT FOR PERMISSIONS BEFORE REQUESTING PAYMENTS
  // ===================================================
  useEffect(() => {
    if (permissionsLoading) return;

    if (canViewPayments && !hasInitialFetchRef.current) {
      void fetchPayments(false, true);
    } else if (!canViewPayments) {
      setLoading(false);
      setInitialPaymentsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionsLoading, canViewPayments]);

  // ===================================================
  // COMBINED INITIAL LOADING
  // ===================================================

  const pageLoading =
    permissionsLoading ||
    logoLoading ||
    initialPaymentsLoading;

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
    const totalPayments = payments.length;
    const confirmedPayments = payments.filter((item) => item.status === "confirmed").length;
    const pendingPayments = payments.filter((item) => item.status === "pending").length;
    const totalAmount = payments.reduce((sum, item) => sum + Number(item.amount_paid || 0), 0);
    return { totalPayments, confirmedPayments, pendingPayments, totalAmount };
  }, [payments]);

  // ===================================================
  // FILTER
  // ===================================================
  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return payments.filter((payment) => {
      const anyPayment = payment as any;
      const matchesSearch = !query || [
        payment.order_reference,
        payment.gateway_transaction_id,
        payment.amount_paid,
        payment.status,
        payment.payment_gateway,
        formatDate(payment.created_at),
        anyPayment.full_name || "",
        anyPayment.name || "",
        anyPayment.email || "",
        anyPayment.phone || "",
        anyPayment.account_type || "",
      ].join(" ").toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payments, search, statusFilter]);

  // ===================================================
  // ACTIVE FILTER LABEL
  // ===================================================
  const activeFilterLabel = useMemo(() => {
    const parts: string[] = [];
    if (statusFilter !== "all") parts.push(formatStatus(statusFilter));
    if (search.trim()) parts.push("Search");
    return parts.length > 0 ? parts.join(" • ") : "All Payments";
  }, [statusFilter, search]);

  // ===================================================
  // CSV DOWNLOAD
  // ===================================================
  const handleDownloadCsv = () => {
    if (!canExportPayments) {
      toast.error("You do not have permission to export payment records.");
      return;
    }
    if (downloadingCsv) return;
    if (!filteredPayments || filteredPayments.length === 0) {
      toast.error("No payment records match the current filters to export.");
      return;
    }

    setDownloadingCsv(true);
    try {
      const csvContent = generateCsv(filteredPayments);
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const today = new Date().toISOString().slice(0, 10);
      const slug = activeFilterLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      link.download = `payments-${slug || "filtered"}-${today}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`CSV downloaded — ${filteredPayments.length} record${filteredPayments.length === 1 ? "" : "s"} exported`);
    } catch (error: any) {
      console.error("CSV download error:", error);
      toast.error("Failed to download CSV. Please try again.");
    } finally {
      setDownloadingCsv(false);
    }
  };

  // ===================================================
  // PAGINATION
  // ===================================================
  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const startEntry = filteredPayments.length === 0 ? 0 : startIndex + 1;
  const endEntry = Math.min(startIndex + ITEMS_PER_PAGE, filteredPayments.length);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginationPages = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, 5];
    if (currentPage >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
  }, [currentPage, totalPages]);

  // ===================================================
  // COMPONENT-LEVEL LOADING (PULSING LOGO)
  // SIDEBAR / NAVBAR UNTOUCHED
  // ===================================================

  if (pageLoading) {
    return <PermissionLoadingState logoUrl={logoUrl} />;
  }

  // ===================================================
  // ACCESS DENIED
  // ===================================================

  if (!canViewPayments) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#F4F8FD] p-4 font-poppins">
        <div className="max-w-md rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF5FF] text-[#C23B32]">
            <FiAlertCircle size={26} />
          </div>

          <h2 className="text-lg font-bold text-[#111827]">
            Access Denied
          </h2>

          <p className="mt-2 text-sm text-[#6B7280]">
            You don't have permission to access this section.
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
      className="min-h-screen bg-white p-4 font-poppins sm:p-5 lg:p-7"
    >
      {/* HEADER */}
      <motion.div variants={itemVariants} className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2D6FE8]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#4F8FF7]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#2D6FE8]">Finance & Payments</span>
          </div>
          <h1 className="text-[20px] font-medium tracking-tight text-[#111827] sm:text-[22px]">Payment Summary</h1>
          <p className="mt-0.5 text-sm text-[#111827]">Review payment transactions, order references, gateway details and payment statuses.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start">
          {canExportPayments && (
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={downloadingCsv || loading || filteredPayments.length === 0}
              title={`Export ${activeFilterLabel} as CSV`}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#2D6FE8]/20 bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(45,111,232,0.6)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloadingCsv ? <FiRefreshCw size={16} className="animate-spin" /> : <FiDownload size={16} />}
              {downloadingCsv ? "Downloading..." : "Download CSV"}
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">{activeFilterLabel}</span>
              {filteredPayments.length > 0 && <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">{filteredPayments.length}</span>}
            </button>
          )}
          <button
            type="button"
            onClick={() => fetchPayments(true)}
            disabled={loading}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#2D6FE8]/20 bg-white px-4 text-sm font-bold text-[#2D6FE8] transition hover:border-[#4F8FF7]/40 hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiRefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* STATS */}
      <motion.div variants={containerVariants} className="mb-5 mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Payments" value={stats.totalPayments} subtitle="All loaded payment records" icon={<FiCreditCard size={21} />} accent="bg-gradient-to-r from-[#4F8FF7] via-[#2D6FE8] to-[#2D6FE8]" />
        <StatCard title="Confirmed Payments" value={stats.confirmedPayments} subtitle="Successfully confirmed" icon={<FiActivity size={21} />} accent="bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8]" />
        <StatCard title="Pending Payments" value={stats.pendingPayments} subtitle="Currently pending" icon={<FiRefreshCw size={21} />} accent="bg-gradient-to-r from-[#FACC15] to-[#A16207]" />
        <StatCard title="Total Amount" value={formatAmount(stats.totalAmount)} subtitle="Across loaded payment records" icon={<FiCreditCard size={21} />} accent="bg-gradient-to-r from-[#4F8FF7] via-[#4F8FF7] to-[#2D6FE8]" />
      </motion.div>

      {/* MAIN CARD */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-[22px] border border-[#DCE6F2] bg-white shadow-[0_8px_30px_rgba(45,111,232,0.06)]">
        {/* FILTER BAR */}
        <div className="border-b border-[#DCE6F2] p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
              <FiSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2D6FE8]" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Search order, transaction, customer, email..."
                className="h-11 w-full rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] pl-11 pr-4 text-sm text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#4F8FF7]/10"
              />
            </div>
            <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-0.5">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                  className={`shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2 text-[11px] font-bold transition ${
                    statusFilter === status
                      ? "bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] text-white shadow-[0_6px_14px_-6px_rgba(45,111,232,0.5)]"
                      : "border border-[#DCE6F2] bg-[#F4F8FD] text-[#6B7280] hover:border-[#4F8FF7]/30 hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"
                  }`}
                >
                  {status === "all" ? "All" : formatStatus(status)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* DESKTOP TABLE - NO HORIZONTAL SCROLL */}
        {/* ============================================ */}
        <div className="hidden lg:block">
  <table className="w-full table-fixed border-collapse">
    <colgroup>
      <col className="w-[4%]" />
      <col className="w-[12%]" />
      <col className="w-[18%]" />
      <col className="w-[10%]" />
      <col className="w-[13%]" />
      <col className="w-[10%]" />
      <col className="w-[10%]" />
      <col className="w-[8%]" />
      <col className="w-[15%]" />
    </colgroup>
    <thead>
      <tr className="bg-[#4F8FF7]">
        <th className="rounded-tl-2xl px-2 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-white">
          S.No.
        </th>
        <th className="px-2 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-white">
          Order Ref.
        </th>
        <th className="px-2 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-white">
          User
        </th>
        <th className="px-2 py-3.5 text-center text-[9px] font-bold uppercase tracking-[0.1em] text-white">
          Account
        </th>
        <th className="px-2 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-white">
          Transaction ID
        </th>
        <th className="px-2 py-3.5 text-right text-[9px] font-bold uppercase tracking-[0.1em] text-white">
          Amount
        </th>
        <th className="px-2 py-3.5 text-center text-[9px] font-bold uppercase tracking-[0.1em] text-white">
          Status
        </th>
        <th className="px-2 py-3.5 text-center text-[9px] font-bold uppercase tracking-[0.1em] text-white">
          Gateway
        </th>
        <th className="rounded-tr-2xl px-2 py-3.5 text-center text-[9px] font-bold uppercase tracking-[0.1em] text-white">
          Created At
        </th>
      </tr>
    </thead>
    <tbody>
      {/* ✅ initialPaymentsLoading par full spinner — refresh ke baad nahi */}
      {initialPaymentsLoading ? (
        <tr>
          <td colSpan={9} className="px-5 py-16 text-center">
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                <FiRefreshCw size={22} className="animate-spin" />
              </div>
              <p className="mt-4 text-sm font-bold text-[#111827]">
                Loading payments...
              </p>
              <p className="mt-1 text-xs text-[#6B7280]">
                Please wait while payment records are fetched.
              </p>
            </div>
          </td>
        </tr>
      ) : loading && payments.length === 0 ? (
        <tr>
          <td colSpan={9} className="px-5 py-16 text-center">
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                <FiRefreshCw size={22} className="animate-spin" />
              </div>
              <p className="mt-4 text-sm font-bold text-[#111827]">
                Loading payments...
              </p>
              <p className="mt-1 text-xs text-[#6B7280]">
                Please wait while payment records are fetched.
              </p>
            </div>
          </td>
        </tr>
      ) : paginatedPayments.length === 0 ? (
        <tr>
          <td colSpan={9} className="px-5 py-16 text-center">
            <div className="flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                <FiSearch size={24} />
              </div>
              <p className="mt-4 text-sm font-bold text-[#111827]">
                No payment records found
              </p>
              <p className="mt-1 text-xs text-[#6B7280]">
                Try another search or filter.
              </p>
            </div>
          </td>
        </tr>
      ) : (
        paginatedPayments.map((payment, index) => {
          const anyPayment = payment as any;
          const customerName = getCustomerName(payment);
          const initials = getInitials(customerName);
          return (
            <motion.tr
              key={`${payment.order_reference}-${payment.gateway_transaction_id}-${index}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="border-b border-[#DCE6F2] bg-white transition hover:bg-[#F8FBFF]"
            >
              {/* S.No. */}
              <td className="px-2 py-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EAF3FF] text-[11px] font-bold text-[#2D6FE8]">
                  {startIndex + index + 1}
                </span>
              </td>

              {/* Order Reference */}
              <td className="px-2 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-white">
                    <FiCreditCard size={14} />
                  </div>
                  <p
                    className="truncate text-xs font-bold text-[#111827]"
                    title={payment.order_reference}
                  >
                    {payment.order_reference}
                  </p>
                </div>
              </td>

              {/* User */}
              <td className="px-2 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-[10px] font-bold text-white">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p
                      className="truncate text-xs font-bold text-[#111827]"
                      title={customerName}
                    >
                      {customerName}
                    </p>
                    {anyPayment.email && (
                      <p
                        className="truncate text-[10px] text-[#6B7280]"
                        title={anyPayment.email}
                      >
                        {anyPayment.email}
                      </p>
                    )}
                    {anyPayment.phone && (
                      <p className="truncate text-[10px] font-semibold text-[#6B7280]">
                        {anyPayment.phone}
                      </p>
                    )}
                  </div>
                </div>
              </td>

              {/* Account Type */}
              <td className="px-2 py-3 text-center">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-bold ${getAccountTypeBadge(
                    anyPayment.account_type,
                  )}`}
                >
                  <FiUser size={10} />
                  {formatAccountType(anyPayment.account_type)}
                </span>
              </td>

              {/* Transaction ID */}
              <td className="px-2 py-3">
                <p
                  className="truncate text-[11px] font-semibold text-[#6B7280]"
                  title={payment.gateway_transaction_id}
                >
                  {payment.gateway_transaction_id}
                </p>
              </td>

              {/* Amount Paid */}
              <td className="px-2 py-3 text-right">
                <span className="text-xs font-bold text-[#2D6FE8]">
                  {formatAmount(payment.amount_paid)}
                </span>
              </td>

              {/* Status */}
              <td className="px-2 py-3 text-center">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-bold ${getStatusClass(
                    payment.status,
                  )}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {formatStatus(payment.status)}
                </span>
              </td>

              {/* Gateway */}
              <td className="px-2 py-3 text-center">
                <span className="inline-flex items-center rounded-lg border border-[#DCE6F2] bg-[#F4F8FD] px-2 py-1 text-[9px] font-bold capitalize text-[#6B7280]">
                  {payment.payment_gateway}
                </span>
              </td>

              {/* Created At */}
              <td className="px-2 py-3 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <FiCalendar size={12} className="shrink-0 text-[#2D6FE8]" />
                  <span className="text-[10px] font-semibold text-[#6B7280]">
                    {formatDate(payment.created_at)}
                  </span>
                </div>
              </td>
            </motion.tr>
          );
        })
      )}
    </tbody>
  </table>
</div>
        {/* ============================================ */}
        {/* MOBILE CARDS */}
        {/* ============================================ */}
        <div className="block lg:hidden">
          {/* ✅ initialPaymentsLoading par full spinner — refresh ke baad nahi */}
          {initialPaymentsLoading ? (
            <div className="flex flex-col items-center px-5 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                <FiRefreshCw size={22} className="animate-spin" />
              </div>
              <p className="mt-4 text-sm font-bold text-[#111827]">Loading payments...</p>
              <p className="mt-1 text-xs text-[#6B7280]">Please wait while payment records are fetched.</p>
            </div>
          ) : loading && payments.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                <FiRefreshCw size={22} className="animate-spin" />
              </div>
              <p className="mt-4 text-sm font-bold text-[#111827]">Loading payments...</p>
              <p className="mt-1 text-xs text-[#6B7280]">Please wait while payment records are fetched.</p>
            </div>
          ) : paginatedPayments.length > 0 ? (
            paginatedPayments.map((payment, index) => {
              const anyPayment = payment as any;
              const customerName = getCustomerName(payment);
              const initials = getInitials(customerName);
              return (
                <motion.div
                  key={`${payment.order_reference}-${payment.gateway_transaction_id}-${index}`}
                  variants={itemVariants}
                  className="border-b border-[#DCE6F2] bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-white">
                        <FiCreditCard size={17} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#111827]">{payment.order_reference}</p>
                        <p className="mt-1 max-w-[220px] truncate text-[10px] text-[#6B7280]">{payment.gateway_transaction_id}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#6B7280]">#{startIndex + index + 1}</span>
                  </div>

                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#DCE6F2] bg-[#F8FBFF] p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-[12px] font-bold text-white">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#111827]">{customerName}</p>
                      {anyPayment.email && <p className="mt-0.5 truncate text-[11px] text-[#6B7280]">{anyPayment.email}</p>}
                      {anyPayment.phone && <p className="mt-0.5 text-[11px] font-semibold text-[#6B7280]">{anyPayment.phone}</p>}
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[9px] font-bold ${getAccountTypeBadge(anyPayment.account_type)}`}>
                      <FiUser size={10} />
                      {formatAccountType(anyPayment.account_type)}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-[#4F8FF7]/20 bg-[#EAF3FF] p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-[#2D6FE8]">Amount Paid</p>
                      <p className="mt-1 text-sm font-bold text-[#2D6FE8]">{formatAmount(payment.amount_paid)}</p>
                    </div>
                    <div className="rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Status</p>
                      <span className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold ${getStatusClass(payment.status)}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {formatStatus(payment.status)}
                      </span>
                    </div>
                    <div className="rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Gateway</p>
                      <p className="mt-1 text-sm font-bold capitalize text-[#6B7280]">{payment.payment_gateway}</p>
                    </div>
                    <div className="rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Created At</p>
                      <p className="mt-1 text-xs font-semibold text-[#6B7280]">{formatDate(payment.created_at)}</p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] p-3">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Transaction ID</p>
                    <p className="mt-1 break-all text-xs font-semibold text-[#6B7280]">{payment.gateway_transaction_id}</p>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="flex flex-col items-center bg-white px-5 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                <FiSearch size={24} />
              </div>
              <p className="mt-4 text-sm font-bold text-[#111827]">No payment records found</p>
              <p className="mt-1 text-xs text-[#6B7280]">Try another search or filter.</p>
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {!pageLoading && filteredPayments.length > 0 && (
          <div className="border-t border-[#DCE6F2] bg-[#F8FBFF] px-4 py-4 sm:px-5">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-xs text-[#6B7280]">
                Showing <span className="font-bold text-[#111827]">{startEntry}</span> to{" "}
                <span className="font-bold text-[#111827]">{endEntry}</span> of{" "}
                <span className="font-bold text-[#111827]">{filteredPayments.length}</span> entries
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => page - 1)}
                  disabled={currentPage === 1}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-30"
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
                        ? "bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-white shadow-[0_6px_14px_-6px_rgba(45,111,232,0.5)]"
                        : "text-[#6B7280] hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => page + 1)}
                  disabled={currentPage === totalPages}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <FiChevronRight size={17} />
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