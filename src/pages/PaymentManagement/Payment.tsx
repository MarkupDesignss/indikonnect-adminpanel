import React, { useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiSearch,
  FiCreditCard,
  FiActivity,
} from "react-icons/fi";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import paymentManagementApi, {
  PaymentRecord,
} from "../../api/endpoints/payment";

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
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getStatusClass = (status: string) => {
  switch (status) {
    case "confirmed":
      return "border-[#163F20]/25 bg-[#EAF3EA] text-[#163F20]";

    case "delivered":
      return "border-[#4C8A57]/30 bg-[#F0F6F0] text-[#4C8A57]";

    case "pending":
      return "border-[#D9A900]/30 bg-[#FBF3DC] text-[#8A6D16]";

    case "returned":
      return "border-[#C23B32]/25 bg-[#FBEAEA] text-[#C23B32]";

    case "partial_returned":
      return "border-[#D9A900]/25 bg-[#FDF4E3] text-[#8A6D16]";

    case "partial_delivered":
      return "border-[#4C8A57]/25 bg-[#EAF3EA] text-[#163F20]";

    default:
      return "border-[#D8E2D8] bg-[#F3F6F3] text-[#59645C]";
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
        boxShadow: "0 16px 32px -18px rgba(22,63,32,0.26)",
      }}
      className="relative min-h-[138px] overflow-hidden rounded-[20px] border border-[#E5EAE5] bg-white p-5 shadow-[0_8px_24px_rgba(22,63,32,0.06)]"
    >
      <div className={`absolute left-0 right-0 top-0 h-[3px] ${accent}`} />

      <div className="pointer-events-none absolute -right-7 -top-7 h-24 w-24 rounded-full border border-[#4C8A57]/15" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
            {title}
          </p>

          <p className="mt-2 text-[29px] font-bold tracking-tight text-[#202721]">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-[#89918B]">{subtitle}</p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#EAF3EA] text-[#163F20]">
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
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  // ===================================================
  // GET PAYMENTS
  // ===================================================

  const fetchPayments = async () => {
    try {
      setLoading(true);

      const response = await paymentManagementApi.getAll();

      if (response.data.success) {
        setPayments(response.data.data || []);
      } else {
        toast.error(
          response.data.message || "Unable to fetch payment records.",
        );
      }
    } catch (error: any) {
      console.error("Fetch payment records error:", error);
      toast.error(
        error?.response?.data?.message || "Unable to fetch payment records.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

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
    "partial_delivered",
  ];

  // ===================================================
  // STATS
  // ===================================================

  const stats = useMemo(() => {
    const totalPayments = payments.length;

    const confirmedPayments = payments.filter(
      (item) => item.status === "confirmed",
    ).length;

    const pendingPayments = payments.filter(
      (item) => item.status === "pending",
    ).length;

    const totalAmount = payments.reduce(
      (sum, item) => sum + Number(item.amount_paid || 0),
      0,
    );

    return { totalPayments, confirmedPayments, pendingPayments, totalAmount };
  }, [payments]);

  // ===================================================
  // FILTER
  // ===================================================

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesSearch =
        !query ||
        [
          payment.order_reference,
          payment.gateway_transaction_id,
          payment.amount_paid,
          payment.status,
          payment.payment_gateway,
          formatDate(payment.created_at),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" || payment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [payments, search, statusFilter]);

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPayments.length / ITEMS_PER_PAGE),
  );

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedPayments = filteredPayments.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const startEntry = filteredPayments.length === 0 ? 0 : startIndex + 1;
  const endEntry = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredPayments.length,
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

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
  // UI
  // ===================================================

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-[#F5F7F5] p-4 sm:p-5 lg:p-7"
    >
      {/* HEADER */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center"
      >
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#163F20]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#4C8A57]">
              Finance & Payments
            </span>
          </div>

          <h1 className="text-[29px] font-bold tracking-tight text-[#202721] sm:text-[34px]">
            Payment Summary
          </h1>

          <p className="max-w-2xl text-sm leading-6 text-[#59645C]">
            Review payment transactions, order references, gateway details and
            payment statuses.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPayments}
          disabled={loading}
          className="flex h-11 items-center justify-center gap-2 self-start rounded-xl border border-[#163F20]/20 bg-white px-4 text-sm font-bold text-[#163F20] shadow-sm transition hover:border-[#163F20]/35 hover:bg-[#EAF3EA] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiRefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </motion.div>

      {/* STATS */}
      <motion.div
        variants={containerVariants}
        className="mb-5 mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          title="Total Payments"
          value={stats.totalPayments}
          subtitle="All loaded payment records"
          icon={<FiCreditCard size={21} />}
          accent="bg-gradient-to-r from-[#4C8A57] via-[#163F20] to-[#0F3219]"
        />

        <StatCard
          title="Confirmed Payments"
          value={stats.confirmedPayments}
          subtitle="Successfully confirmed"
          icon={<FiActivity size={21} />}
          accent="bg-gradient-to-r from-[#8FC199] to-[#163F20]"
        />

        <StatCard
          title="Pending Payments"
          value={stats.pendingPayments}
          subtitle="Currently pending"
          icon={<FiRefreshCw size={21} />}
          accent="bg-gradient-to-r from-[#D9A900] to-[#8A6D16]"
        />

        <StatCard
          title="Total Amount"
          value={formatAmount(stats.totalAmount)}
          subtitle="Across loaded payment records"
          icon={<FiCreditCard size={21} />}
          accent="bg-gradient-to-r from-[#8FC199] via-[#4C8A57] to-[#0F3219]"
        />
      </motion.div>

      {/* MAIN CARD */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-[22px] border border-[#E5EAE5] bg-white shadow-[0_8px_30px_rgba(22,63,32,0.06)]"
      >
        <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#8FC199] via-[#163F20] to-[#0F3219]" />

        {/* TOOLBAR */}
        <div className="border-b border-[#163F20]/10 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
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
                placeholder="Search order, transaction ID, amount, gateway..."
                className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] pl-11 pr-4 text-sm text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#163F20] focus:bg-white focus:ring-2 focus:ring-[#163F20]/10"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 flex-nowrap">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    setStatusFilter(status);
                    setCurrentPage(1);
                  }}
                  className={`shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2 text-[11px] font-bold transition ${
                    statusFilter === status
                      ? "bg-gradient-to-r from-[#4C8A57] to-[#163F20] text-white shadow-[0_6px_14px_-6px_rgba(22,63,32,0.5)]"
                      : "border border-[#163F20]/15 bg-[#F5F7F5] text-[#59645C] hover:border-[#163F20]/30 hover:bg-[#EAF3EA] hover:text-[#163F20]"
                  }`}
                >
                  {status === "all" ? "All" : formatStatus(status)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[1050px] border-collapse">
            <thead>
              <tr className="bg-[#163F20]">
                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                  S.No.
                </th>
                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                  Order Reference
                </th>
                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                  Transaction ID
                </th>
                <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                  Amount Paid
                </th>
                <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                  Status
                </th>
                <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                  Gateway
                </th>
                <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                  Created At
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#163F20]">
                        <FiRefreshCw size={22} className="animate-spin" />
                      </div>

                      <p className="mt-4 text-sm font-bold text-[#202721]">
                        Loading payments...
                      </p>

                      <p className="mt-1 text-xs text-[#9AA29C]">
                        Please wait while payment records are fetched.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#163F20]">
                        <FiSearch size={24} />
                      </div>

                      <p className="mt-4 text-sm font-bold text-[#202721]">
                        No payment records found
                      </p>

                      <p className="mt-1 text-xs text-[#9AA29C]">
                        Try another search or filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((payment, index) => (
                  <motion.tr
                    key={`${payment.order_reference}-${payment.gateway_transaction_id}-${index}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-[#163F20]/10 bg-white transition hover:bg-[#FAFBFA]"
                  >
                    <td className="px-5 py-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF3EA] text-xs font-bold text-[#163F20]">
                        {startIndex + index + 1}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] text-white">
                          <FiCreditCard size={17} />
                        </div>

                        <div className="min-w-0">
                          <p className="max-w-[210px] truncate text-sm font-bold text-[#202721]">
                            {payment.order_reference}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="max-w-[220px] truncate text-xs font-semibold text-[#3F4A41]">
                        {payment.gateway_transaction_id}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-bold text-[#163F20]">
                        {formatAmount(payment.amount_paid)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${getStatusClass(
                          payment.status,
                        )}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />

                        {formatStatus(payment.status)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center rounded-lg border border-[#163F20]/10 bg-[#F5F7F5] px-3 py-1.5 text-[10px] font-bold capitalize text-[#59645C]">
                        {payment.payment_gateway}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <FiCalendar size={13} className="text-[#163F20]" />

                        <span className="text-[10px] font-semibold text-[#59645C]">
                          {formatDate(payment.created_at)}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE */}
        <div className="block lg:hidden">
          {loading ? (
            <div className="flex flex-col items-center px-5 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#163F20]">
                <FiRefreshCw size={22} className="animate-spin" />
              </div>

              <p className="mt-4 text-sm font-bold text-[#202721]">
                Loading payments...
              </p>

              <p className="mt-1 text-xs text-[#9AA29C]">
                Please wait while payment records are fetched.
              </p>
            </div>
          ) : paginatedPayments.length > 0 ? (
            paginatedPayments.map((payment, index) => (
              <motion.div
                key={`${payment.order_reference}-${payment.gateway_transaction_id}-${index}`}
                variants={itemVariants}
                className="border-b border-[#163F20]/10 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] text-white">
                      <FiCreditCard size={17} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#202721]">
                        {payment.order_reference}
                      </p>

                      <p className="mt-1 max-w-[220px] truncate text-[10px] text-[#9AA29C]">
                        {payment.gateway_transaction_id}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-[#9AA29C]">
                    #{startIndex + index + 1}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[#163F20]/15 bg-[#EAF3EA] p-3">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-[#163F20]">
                      Amount Paid
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#0F3219]">
                      {formatAmount(payment.amount_paid)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] p-3">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                      Status
                    </p>

                    <span
                      className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold ${getStatusClass(
                        payment.status,
                      )}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />

                      {formatStatus(payment.status)}
                    </span>
                  </div>

                  <div className="rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] p-3">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                      Gateway
                    </p>

                    <p className="mt-1 text-sm font-bold capitalize text-[#3F4A41]">
                      {payment.payment_gateway}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] p-3">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                      Created At
                    </p>

                    <p className="mt-1 text-xs font-semibold text-[#3F4A41]">
                      {formatDate(payment.created_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                    Transaction ID
                  </p>

                  <p className="mt-1 break-all text-xs font-semibold text-[#3F4A41]">
                    {payment.gateway_transaction_id}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center px-5 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#163F20]">
                <FiSearch size={24} />
              </div>

              <p className="mt-4 text-sm font-bold text-[#202721]">
                No payment records found
              </p>

              <p className="mt-1 text-xs text-[#9AA29C]">
                Try another search or filter.
              </p>
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {filteredPayments.length > 0 && (
          <div className="border-t border-[#163F20]/10 bg-[#FAFBFA] px-4 py-4 sm:px-5">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-xs text-[#89918B]">
                Showing{" "}
                <span className="font-bold text-[#3F4A41]">{startEntry}</span>{" "}
                to <span className="font-bold text-[#3F4A41]">{endEntry}</span>{" "}
                of{" "}
                <span className="font-bold text-[#3F4A41]">
                  {filteredPayments.length}
                </span>{" "}
                entries
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => page - 1)}
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
                  onClick={() => setCurrentPage((page) => page + 1)}
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

      <div className="h-4" />
    </motion.div>
  );
};

export default Payment;
