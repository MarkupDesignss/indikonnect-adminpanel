import React, { useEffect, useMemo, useState } from "react";

import {
  FiAlertCircle,
  FiCalendar,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiEdit2,
  FiEye,
  FiFileText,
  FiFilter,
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTrash2,
  FiTruck,
  FiUser,
  FiX,
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { getBuyBackRequests } from "@/services/buyBackApi";
import type {
  BuyBackFilterTab,
  BuyBackRequest,
} from "@/types/buyBack";
import { buyBackFilterStatusMap } from "./buyBackStatus";

// =====================================================
// TYPES
// =====================================================

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  variant?: "default" | "danger" | "primary";
  onClick?: () => void;
}

interface DetailFieldProps {
  label: string;
  value: React.ReactNode;
  link?: boolean;
}

interface EligibilityItemProps {
  label: string;
  value: boolean | null;
}

interface FinancialRowProps {
  label: string;
  value: string;
  danger?: boolean;
  suffix?: string;
}

// =====================================================
// THEME
// =====================================================

const GOLD = "#b8902e";
const DARK_GOLD = "#8f6d1d";
const LIGHT_GOLD = "#d4af52";
const CREAM = "#faf8f3";
const TEXT_DARK = "#29251f";
const TEXT_MUTED = "#8d8372";
const BORDER = "rgba(184,144,46,0.12)";

const cardClass =
  "rounded-2xl border border-[#b8902e]/12 bg-white shadow-[0_8px_30px_rgba(70,55,20,0.045)]";

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
    y: 12,
  },

  visible: {
    opacity: 1,
    y: 0,

    transition: {
      type: "spring",
      stiffness: 110,
      damping: 16,
    },
  },
};

// =====================================================
// STATUS
// =====================================================

const getBuyBackStatusBadge = (
  status: string
) => {
  switch (status) {
    case "Pending":
      return "border border-[#e2c779]/35 bg-[#fff9e9] text-[#9a741b]";

    case "Eligible":
      return "border border-[#b8902e]/20 bg-[#f8f3e5] text-[#806319]";

    case "Inspection":
      return "border border-[#d2b261]/30 bg-[#fbf5e7] text-[#8f6d1d]";

    case "Approved":
      return "border border-[#b8902e]/25 bg-[#f6f1df] text-[#755a17]";

    case "Rejected":
      return "border border-[#c98d83]/25 bg-[#fff7f5] text-[#b46055]";

    default:
      return "border border-[#d8d1c4] bg-[#f6f4ef] text-[#786f60]";
  }
};

const getPaymentStatusClass = (
  status: BuyBackRequest["financials"]["paymentStatus"]
) => {
  if (status === "Processed") {
    return "bg-[#f3f7ed] text-[#5f7a42] border-[#8ca96b]/25";
  }

  if (status === "Rejected") {
    return "bg-[#fff7f5] text-[#b46055] border-[#c98d83]/25";
  }

  return "bg-[#f7f4ed] text-[#8b806d] border-[#d8d1c4]";
};

const getPaymentStatusIcon = (
  status: BuyBackRequest["financials"]["paymentStatus"]
) => {
  if (status === "Processed") {
    return "check_circle";
  }

  if (status === "Rejected") {
    return "cancel";
  }

  return "hourglass_empty";
};

// =====================================================
// HELPERS
// =====================================================

const formatDateTime = (
  value?: string | null
) => {
  if (!value) return "—";

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

// =====================================================
// ACTION BUTTON
// =====================================================

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  variant = "default",
  onClick,
}) => {
  const variantClass =
    variant === "primary"
      ? "bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] text-white border-transparent hover:from-[#a98227] hover:to-[#7e6017]"
      : variant === "danger"
      ? "border-[#c98d83]/25 bg-[#fff7f5] text-[#b46055] hover:border-[#b46055]/40 hover:bg-[#b46055] hover:text-white"
      : "border-[#b8902e]/15 bg-white text-[#8f6d1d] hover:bg-[#faf8f3] hover:border-[#b8902e]/30";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition ${variantClass}`}
    >
      {icon}
      {label}
    </button>
  );
};

// =====================================================
// DETAIL FIELD
// =====================================================

const DetailField: React.FC<DetailFieldProps> = ({
  label,
  value,
  link,
}) => {
  return (
    <div>
      <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-[#a89a7d]">
        {label}
      </span>

      <p
        className={`text-xs font-semibold ${
          link
            ? "cursor-pointer text-[#8f6d1d] underline underline-offset-2"
            : "text-[#29251f]"
        }`}
      >
        {value}
      </p>
    </div>
  );
};

// =====================================================
// ELIGIBILITY
// =====================================================

const EligibilityItem: React.FC<
  EligibilityItemProps
> = ({ label, value }) => {
  const icon =
    value === true ? (
      <FiCheck size={13} />
    ) : value === false ? (
      <FiX size={13} />
    ) : (
      <FiClock size={13} />
    );

  const iconClass =
    value === true
      ? "bg-[#f3f7ed] text-[#69814b]"
      : value === false
      ? "bg-[#fff7f5] text-[#b46055]"
      : "bg-[#fff9e9] text-[#9a741b]";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#b8902e]/10 bg-white px-3 py-2.5">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
      >
        {icon}
      </div>

      <span className="min-w-0 flex-1 text-xs font-medium text-[#5c5549]">
        {label}
      </span>

      {value === true && (
        <span className="text-[9px] font-bold uppercase tracking-wide text-[#69814b]">
          Pass
        </span>
      )}

      {value === false && (
        <span className="text-[9px] font-bold uppercase tracking-wide text-[#b46055]">
          Fail
        </span>
      )}

      {value === null && (
        <span className="text-[9px] italic text-[#a89a7d]">
          Pending
        </span>
      )}
    </div>
  );
};

// =====================================================
// FINANCIAL ROW
// =====================================================

const FinancialRow: React.FC<
  FinancialRowProps
> = ({
  label,
  value,
  danger,
  suffix,
}) => {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#b8902e]/10 py-3 last:border-b-0">
      <div
        className={`text-xs ${
          danger
            ? "text-[#b46055]"
            : "text-[#4d463b]"
        }`}
      >
        <div className="flex items-center gap-1">
          {danger && (
            <span className="font-bold">
              −
            </span>
          )}

          <span>{label}</span>
        </div>

        {suffix && (
          <span className="mt-0.5 block text-[9px] italic text-[#a89a7d]">
            {suffix}
          </span>
        )}
      </div>

      <span
        className={`shrink-0 text-xs font-bold ${
          danger
            ? "text-[#b46055]"
            : "text-[#29251f]"
        }`}
      >
        {value}
      </span>
    </div>
  );
};

// =====================================================
// BUYBACK DETAIL
// =====================================================

interface BuyBackDetailProps {
  request: BuyBackRequest;
  onRefresh: () => void;
}

const BuyBackDetail: React.FC<
  BuyBackDetailProps
> = ({ request, onRefresh }) => {
  const unitPrice =
    request.quantity > 0
      ? request.financials.originalPrice /
        request.quantity
      : 0;

  return (
    <section className="hidden min-w-0 flex-1 overflow-hidden rounded-2xl border border-[#b8902e]/12 bg-white shadow-[0_8px_30px_rgba(70,55,20,0.045)] md:flex">
      <div className="flex h-full w-full flex-col">
        {/* DETAIL HEADER */}

        <div className="shrink-0 border-b border-[#b8902e]/10 bg-white px-5 py-5 sm:px-6">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#b8902e]">
                  Buy-Back Request
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-bold ${getBuyBackStatusBadge(
                    request.status
                  )}`}
                >
                  {request.status ===
                    "Pending" && (
                    <FiClock
                      size={11}
                    />
                  )}

                  {request.status}
                </span>
              </div>

              <h2 className="text-[22px] font-bold tracking-tight text-[#29251f]">
                Request {request.id}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-[#8d8372]">
                <span>
                  <strong className="text-[#4d463b]">
                    Distributor:
                  </strong>{" "}
                  {request.distributor}
                </span>

                <span className="h-1 w-1 rounded-full bg-[#c9c0ae]" />

                <span>
                  <strong className="text-[#4d463b]">
                    Submitted:
                  </strong>{" "}
                  {request.date}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <ActionButton
                icon={<FiX size={14} />}
                label="Reject"
                variant="danger"
              />

              <ActionButton
                icon={<FiSearch size={14} />}
                label="Inspection"
              />

              <ActionButton
                icon={<FiCheck size={14} />}
                label="Approve"
                variant="primary"
              />
            </div>
          </div>
        </div>

        {/* SCROLL AREA */}

        <div className="custom-scroll flex-1 overflow-y-auto bg-[#faf8f3] p-5 sm:p-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-5"
          >
            {/* =========================================
                PRODUCT DETAILS
            ========================================= */}

            <motion.section
              variants={itemVariants}
              className={cardClass}
            >
              <div className="border-b border-[#b8902e]/10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
                    <FiPackage size={17} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#29251f]">
                      Product Details &
                      Eligibility
                    </h3>

                    <p className="mt-0.5 text-[10px] text-[#a19583]">
                      Product and buy-back eligibility information
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 p-5 xl:grid-cols-2">
                <div>
                  <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-[#a89a7d]">
                    Product Name
                  </span>

                  <p className="text-base font-bold text-[#29251f]">
                    {request.product}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <DetailField
                      label="SKU"
                      value={
                        request.sku
                      }
                    />

                    <DetailField
                      label="Quantity"
                      value={`${request.quantity} Units`}
                    />

                    <DetailField
                      label="Original Purchase"
                      value={
                        request.originalPurchase
                      }
                    />

                    <DetailField
                      label="PO Number"
                      value={
                        request.poNumber
                      }
                      link
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#8f6d1d]">
                      Eligibility Criteria
                    </span>

                    <FiShield
                      size={15}
                      className="text-[#b8902e]"
                    />
                  </div>

                  <div className="space-y-2">
                    <EligibilityItem
                      label="Within 90-day return window"
                      value={
                        request
                          .eligibility
                          .withinReturnWindow
                      }
                    />

                    <EligibilityItem
                      label="Original packaging intact"
                      value={
                        request
                          .eligibility
                          .originalPackaging
                      }
                    />

                    <EligibilityItem
                      label="Unused / Factory condition"
                      value={
                        request
                          .eligibility
                          .unusedCondition
                      }
                    />
                  </div>
                </div>
              </div>
            </motion.section>

            {/* =========================================
                INSPECTION
            ========================================= */}

            <motion.section
              variants={itemVariants}
              className={cardClass}
            >
              <div className="flex items-center justify-between border-b border-[#b8902e]/10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
                    <FiFileText
                      size={17}
                    />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#29251f]">
                      Inspection Report
                    </h3>

                    <p className="mt-0.5 text-[10px] text-[#a19583]">
                      Warehouse inspection information
                    </p>
                  </div>
                </div>

                {request.inspection && (
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#8f6d1d] transition hover:text-[#b8902e]"
                  >
                    <FiEdit2
                      size={13}
                    />
                    Edit Report
                  </button>
                )}
              </div>

              <div className="p-5">
                {request.inspection ? (
                  <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
                    <p className="text-xs leading-6 text-[#625b4f]">
                      {
                        request
                          .inspection
                          .report
                      }
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#d8d0c0] bg-[#faf8f3] px-5 py-9 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#b8902e] shadow-sm">
                      <FiSearch
                        size={23}
                      />
                    </div>

                    <h4 className="mt-4 text-sm font-bold text-[#29251f]">
                      No Inspection Data Yet
                    </h4>

                    <p className="mt-1 max-w-[430px] text-xs leading-5 text-[#a19583]">
                      Items must be received at the warehouse before an inspection report can be generated.
                    </p>

                    <button
                      type="button"
                      className="mt-4 flex items-center gap-2 rounded-xl border border-[#b8902e]/20 bg-white px-4 py-2.5 text-[10px] font-bold text-[#8f6d1d] transition hover:bg-[#b8902e] hover:text-white"
                    >
                      <FiTruck
                        size={13}
                      />
                      Log Receipt & Begin Inspection
                    </button>
                  </div>
                )}
              </div>
            </motion.section>

            {/* =========================================
                FINANCIAL SUMMARY
            ========================================= */}

            <motion.section
              variants={itemVariants}
              className={cardClass}
            >
              <div className="border-b border-[#b8902e]/10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
                    ₹
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#29251f]">
                      Financial Summary
                    </h3>

                    <p className="mt-0.5 text-[10px] text-[#a19583]">
                      Estimated buy-back calculation
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 p-5 xl:grid-cols-[1fr_250px]">
                <div>
                  <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] px-4">
                    <FinancialRow
                      label={`Original Purchase Price (${request.quantity} Units @ ₹${unitPrice.toFixed(
                        2
                      )})`}
                      value={`₹${request.financials.originalPrice.toFixed(
                        2
                      )}`}
                    />

                    <FinancialRow
                      label="Restocking Fee (15%)"
                      value={`-₹${request.financials.restockingFee.toFixed(
                        2
                      )}`}
                      danger
                    />

                    <FinancialRow
                      label="Estimated Depreciation"
                      value={`-₹${request.financials.depreciation.toFixed(
                        2
                      )}`}
                      danger
                      suffix="Pending inspection"
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-xl border border-[#b8902e]/15 bg-[#fffaf0] px-4 py-4">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#9a741b]">
                        Estimated Buy-Back
                      </p>

                      <p className="mt-1 text-xs text-[#a19583]">
                        Final value after inspection
                      </p>
                    </div>

                    <span className="text-[24px] font-bold tracking-tight text-[#8f6d1d]">
                      ₹
                      {request.financials.estimatedValue.toFixed(
                        2
                      )}
                    </span>
                  </div>
                </div>

                {/* PAYMENT */}

                <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
                  <div className="flex items-center justify-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#b8902e] shadow-sm">
                      <FiCheck
                        size={18}
                      />
                    </div>
                  </div>

                  <p className="mt-3 text-center text-[9px] font-bold uppercase tracking-[0.15em] text-[#a89a7d]">
                    Payment Status
                  </p>

                  <div className="mt-2 flex justify-center">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-bold ${getPaymentStatusClass(
                        request
                          .financials
                          .paymentStatus
                      )}`}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {getPaymentStatusIcon(
                          request
                            .financials
                            .paymentStatus
                        )}
                      </span>

                      {
                        request
                          .financials
                          .paymentStatus
                      }
                    </span>
                  </div>

                  <p className="mt-4 text-center text-[10px] leading-5 text-[#a19583]">
                    Funds will be credited to the distributor account balance upon final approval.
                  </p>
                </div>
              </div>
            </motion.section>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// =====================================================
// REQUEST LIST
// =====================================================

const tabs: BuyBackFilterTab[] = [
  "All",
  "Pending",
  "Eligible",
  "Inspection",
  "Approved",
];

interface BuyBackRequestListProps {
  activeTab: BuyBackFilterTab;
  requests: BuyBackRequest[];
  selectedId: string;
  onFilterChange: (
    tab: BuyBackFilterTab
  ) => void;
  onSelect: (id: string) => void;
}

const BuyBackRequestList: React.FC<
  BuyBackRequestListProps
> = ({
  activeTab,
  requests,
  selectedId,
  onFilterChange,
  onSelect,
}) => {
  const [search, setSearch] =
    useState("");

  const filtered = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return requests;
    }

    return requests.filter(
      (request) =>
        [
          request.id,
          request.distributor,
          request.product,
          request.sku,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
    );
  }, [requests, search]);

  return (
    <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-[#b8902e]/12 bg-white shadow-[0_8px_30px_rgba(70,55,20,0.045)] md:w-[370px] lg:w-[390px]">
      {/* HEADER */}

      <div className="shrink-0 border-b border-[#b8902e]/10 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
                <FiPackage
                  size={17}
                />
              </div>

              <div>
                <h3 className="text-base font-bold text-[#29251f]">
                  Buy-Back Requests
                </h3>

                <p className="text-[10px] text-[#a19583]">
                  Review distributor requests
                </p>
              </div>
            </div>
          </div>

          <span className="rounded-full bg-[#faf4df] px-3 py-1.5 text-[9px] font-bold text-[#8f6d1d]">
            {requests.length}
          </span>
        </div>

        {/* SEARCH */}

        <div className="relative mb-4">
          <FiSearch
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b8902e]"
          />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search request, distributor or product..."
            className="h-10 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] pl-10 pr-4 text-xs text-[#29251f] outline-none transition placeholder:text-[#a89a7d] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/10"
          />
        </div>

        {/* FILTER TABS */}

        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {tabs.map((tab) => {
            const label =
              tab === "Inspection"
                ? "In Inspection"
                : tab;

            return (
              <button
                key={tab}
                type="button"
                onClick={() =>
                  onFilterChange(
                    tab
                  )
                }
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-[9px] font-bold transition ${
                  activeTab ===
                  tab
                    ? "bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] text-white shadow-sm"
                    : "bg-[#faf8f3] text-[#786f60] hover:bg-[#f2ead8] hover:text-[#8f6d1d]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* LIST */}

      <div className="custom-scroll flex-1 overflow-y-auto bg-[#faf8f3] p-2">
        {filtered.length >
        0 ? (
          <div className="space-y-2">
            {filtered.map(
              (request) => {
                const selected =
                  request.id ===
                  selectedId;

                return (
                  <motion.button
                    key={
                      request.id
                    }
                    type="button"
                    whileHover={{
                      x: 2,
                    }}
                    onClick={() =>
                      onSelect(
                        request.id
                      )
                    }
                    className={`relative w-full rounded-xl border p-3.5 text-left transition ${
                      selected
                        ? "border-[#b8902e]/35 bg-[#fffaf0] shadow-sm"
                        : "border-[#b8902e]/10 bg-white hover:border-[#b8902e]/25 hover:bg-[#fffdf8]"
                    }`}
                  >
                    {selected && (
                      <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-[#b8902e]" />
                    )}

                    <div className="pl-1.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
                            <FiUser
                              size={
                                15
                              }
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[#29251f]">
                              {
                                request.distributor
                              }
                            </p>

                            <p className="mt-0.5 truncate text-[9px] font-mono text-[#a19583]">
                              {
                                request.id
                              }
                            </p>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[8px] font-bold ${getBuyBackStatusBadge(
                            request.status
                          )}`}
                        >
                          {
                            request.status
                          }
                        </span>
                      </div>

                      <p className="mt-3 line-clamp-1 text-xs font-semibold text-[#4d463b]">
                        {
                          request.product
                        }
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-3 text-[#8d8372]">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <FiCalendar
                            size={
                              12
                            }
                          />

                          <span className="truncate text-[9px]">
                            {
                              request.date
                            }
                          </span>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          <FiPackage
                            size={
                              12
                            }
                          />

                          <span className="text-[9px]">
                            {
                              request.items
                            }{" "}
                            Items
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              }
            )}
          </div>
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#b8902e] shadow-sm">
              <FiSearch
                size={23}
              />
            </div>

            <p className="mt-4 text-sm font-bold text-[#29251f]">
              No requests found
            </p>

            <p className="mt-1 text-xs text-[#a89a7d]">
              Try another search or filter.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

// =====================================================
// MAIN PAGE
// =====================================================

const BuyBack: React.FC = () => {
  const [requests, setRequests] =
    useState<
      BuyBackRequest[]
    >([]);

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<BuyBackFilterTab>(
      "All"
    );

  const [
    selectedId,
    setSelectedId,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  // ===================================================
  // FETCH
  // ===================================================

  const fetchBuyBackRequests =
    async () => {
      try {
        setLoading(true);

        const data =
          await getBuyBackRequests();

        setRequests(data);

        setSelectedId(
          (currentId) =>
            currentId ||
            data[0]?.id ||
            ""
        );
      } catch (error) {
        console.error(
          "Get buyback requests error:",
          error
        );

        toast.error(
          "Unable to load buy-back requests."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchBuyBackRequests();
  }, []);

  // ===================================================
  // FILTER STATUS
  // ===================================================

  const filteredRequests =
    useMemo(() => {
      const status =
        buyBackFilterStatusMap[
          activeTab
        ];

      if (!status) {
        return requests;
      }

      return requests.filter(
        (request) =>
          request.status ===
          status
      );
    }, [
      activeTab,
      requests,
    ]);

  // ===================================================
  // SELECTED REQUEST
  // ===================================================

  const selectedRequest =
    requests.find(
      (request) =>
        request.id ===
        selectedId
    ) ||
    filteredRequests[0] ||
    requests[0];

  // ===================================================
  // KEEP SELECTED VALID
  // ===================================================

  useEffect(() => {
    if (
      filteredRequests.length >
        0 &&
      !filteredRequests.some(
        (request) =>
          request.id ===
          selectedId
      )
    ) {
      setSelectedId(
        filteredRequests[0].id
      );
    }
  }, [
    filteredRequests,
    selectedId,
  ]);

  // ===================================================
  // LOADING
  // ===================================================

  if (
    loading &&
    requests.length === 0
  ) {
    return (
      <div className="flex min-h-[500px] items-center justify-center bg-[#faf8f3]">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b8902e]/10 text-[#b8902e]">
            <FiRefreshCw
              size={23}
              className="animate-spin"
            />
          </div>

          <p className="mt-4 text-sm font-bold text-[#29251f]">
            Loading buy-back requests...
          </p>

          <p className="mt-1 text-xs text-[#a19583]">
            Please wait while requests are fetched.
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // EMPTY
  // ===================================================

  if (
    !selectedRequest
  ) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center bg-[#faf8f3] text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#b8902e] shadow-sm">
          <FiPackage
            size={27}
          />
        </div>

        <h3 className="mt-5 text-base font-bold text-[#29251f]">
          No Buy-Back Requests
        </h3>

        <p className="mt-1 max-w-[350px] text-xs leading-5 text-[#a19583]">
          There are currently no buy-back requests available for review.
        </p>

        <button
          type="button"
          onClick={
            fetchBuyBackRequests
          }
          className="mt-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-5 py-2.5 text-xs font-bold text-white"
        >
          <FiRefreshCw
            size={13}
          />
          Refresh
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      className="min-h-screen bg-[#faf8f3] p-4 sm:p-5 lg:p-6"
    >
      {/* PAGE HEADER */}

      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center"
      >
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#b8902e]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9a741b]">
              Operations
            </span>
          </div>

          <h1 className="font-serif text-[29px] font-bold tracking-tight text-[#29251f] sm:text-[33px]">
            Buy-Back Management
          </h1>

          <p className="mt-1 text-sm text-[#8d8372]">
            Review distributor buy-back requests, eligibility, inspection and financial details.
          </p>
        </div>

        <button
          type="button"
          onClick={
            fetchBuyBackRequests
          }
          disabled={loading}
          className="flex h-11 items-center justify-center gap-2 self-start rounded-xl border border-[#b8902e]/20 bg-white px-5 text-sm font-bold text-[#8f6d1d] shadow-sm transition hover:bg-[#faf8f3] disabled:opacity-50"
        >
          <FiRefreshCw
            size={15}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />
          Refresh
        </button>
      </motion.div>

      {/* MAIN TWO-PANE */}

      <motion.section
        initial={{
          opacity: 0,
          y: 8,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.25,
        }}
        className="flex min-h-[calc(100vh-175px)] flex-col gap-4 lg:flex-row"
      >
        <BuyBackRequestList
          activeTab={
            activeTab
          }
          requests={
            filteredRequests
          }
          selectedId={
            selectedRequest.id
          }
          onFilterChange={
            setActiveTab
          }
          onSelect={
            setSelectedId
          }
        />

        <BuyBackDetail
          request={
            selectedRequest
          }
          onRefresh={
            fetchBuyBackRequests
          }
        />
      </motion.section>
    </motion.div>
  );
};

export default BuyBack;