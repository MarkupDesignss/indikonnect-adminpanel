import React, { useEffect, useMemo, useState } from "react";

import {
  FiCalendar,
  FiCheck,
  FiClock,
  FiEdit2,
  FiFileText,
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTruck,
  FiUser,
  FiX,
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { getBuyBackRequests } from "@/services/buyBackApi";
import type { BuyBackFilterTab, BuyBackRequest } from "@/types/buyBack";
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
// THEME (GREEN)
// =====================================================

const GREEN = "#163F20";
const DARK_GREEN = "#0F3219";
const LIGHT_GREEN = "#4C8A57";
const MINT = "#EAF3EA";
const TEXT_DARK = "#202721";
const TEXT_MUTED = "#9AA29C";
const BORDER = "rgba(22,63,32,0.12)";

const cardClass =
  "rounded-2xl border border-[#163F20]/12 bg-white shadow-[0_8px_30px_rgba(22,63,32,0.06)]";

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
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 110, damping: 16 },
  },
};

// =====================================================
// STATUS BADGES
// =====================================================

const getBuyBackStatusBadge = (status: string) => {
  switch (status) {
    case "Pending":
      return "border border-[#D9A900]/35 bg-[#FBF3DC] text-[#8A6D16]";

    case "Eligible":
      return "border border-[#163F20]/20 bg-[#EAF3EA] text-[#163F20]";

    case "Inspection":
      return "border border-[#4C8A57]/30 bg-[#F0F6F0] text-[#4C8A57]";

    case "Approved":
      return "border border-[#163F20]/25 bg-[#E0EEE1] text-[#0F3219]";

    case "Rejected":
      return "border border-[#C23B32]/25 bg-[#FBEAEA] text-[#C23B32]";

    default:
      return "border border-[#D8E2D8] bg-[#F3F6F3] text-[#59645C]";
  }
};

const getPaymentStatusClass = (
  status: BuyBackRequest["financials"]["paymentStatus"],
) => {
  if (status === "Processed") {
    return "bg-[#EAF3EA] text-[#163F20] border-[#163F20]/25";
  }

  if (status === "Rejected") {
    return "bg-[#FBEAEA] text-[#C23B32] border-[#C23B32]/25";
  }

  return "bg-[#F3F6F3] text-[#59645C] border-[#D8E2D8]";
};

const getPaymentStatusIcon = (
  status: BuyBackRequest["financials"]["paymentStatus"],
) => {
  if (status === "Processed") return "check_circle";
  if (status === "Rejected") return "cancel";
  return "hourglass_empty";
};

// =====================================================
// HELPERS
// =====================================================

const formatDateTime = (value?: string | null) => {
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
      ? "bg-gradient-to-br from-[#4C8A57] via-[#163F20] to-[#0F3219] text-white border-transparent shadow-[0_8px_18px_-8px_rgba(22,63,32,0.6)] hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(22,63,32,0.7)]"
      : variant === "danger"
        ? "border-[#C23B32]/25 bg-[#FBEAEA] text-[#C23B32] hover:border-transparent hover:bg-[#C23B32] hover:text-white"
        : "border-[#163F20]/15 bg-white text-[#163F20] hover:bg-[#EAF3EA] hover:border-[#163F20]/30";

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

const DetailField: React.FC<DetailFieldProps> = ({ label, value, link }) => (
  <div>
    <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
      {label}
    </span>

    <p
      className={`text-xs font-semibold ${
        link
          ? "cursor-pointer text-[#163F20] underline underline-offset-2"
          : "text-[#202721]"
      }`}
    >
      {value}
    </p>
  </div>
);

// =====================================================
// ELIGIBILITY ITEM
// =====================================================

const EligibilityItem: React.FC<EligibilityItemProps> = ({ label, value }) => {
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
      ? "bg-[#EAF3EA] text-[#163F20]"
      : value === false
        ? "bg-[#FBEAEA] text-[#C23B32]"
        : "bg-[#FBF3DC] text-[#8A6D16]";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#163F20]/10 bg-white px-3 py-2.5">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
      >
        {icon}
      </div>

      <span className="min-w-0 flex-1 text-xs font-medium text-[#3F4A41]">
        {label}
      </span>

      {value === true && (
        <span className="text-[9px] font-bold uppercase tracking-wide text-[#163F20]">
          Pass
        </span>
      )}

      {value === false && (
        <span className="text-[9px] font-bold uppercase tracking-wide text-[#C23B32]">
          Fail
        </span>
      )}

      {value === null && (
        <span className="text-[9px] italic text-[#9AA29C]">Pending</span>
      )}
    </div>
  );
};

// =====================================================
// FINANCIAL ROW
// =====================================================

const FinancialRow: React.FC<FinancialRowProps> = ({
  label,
  value,
  danger,
  suffix,
}) => {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#163F20]/10 py-3 last:border-b-0">
      <div
        className={`text-xs ${danger ? "text-[#C23B32]" : "text-[#3F4A41]"}`}
      >
        <div className="flex items-center gap-1">
          {danger && <span className="font-bold">−</span>}
          <span>{label}</span>
        </div>

        {suffix && (
          <span className="mt-0.5 block text-[9px] italic text-[#9AA29C]">
            {suffix}
          </span>
        )}
      </div>

      <span
        className={`shrink-0 text-xs font-bold ${
          danger ? "text-[#C23B32]" : "text-[#202721]"
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

const BuyBackDetail: React.FC<BuyBackDetailProps> = ({
  request,
  onRefresh,
}) => {
  const unitPrice =
    request.quantity > 0
      ? request.financials.originalPrice / request.quantity
      : 0;

  return (
    <section className="hidden min-w-0 flex-1 overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white shadow-[0_8px_30px_rgba(22,63,32,0.06)] md:flex">
      <div className="flex h-full w-full flex-col">
        {/* DETAIL HEADER */}
        <div className="shrink-0 border-b border-[#163F20]/10 bg-white px-5 py-5 sm:px-6">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#4C8A57]">
                  Buy-Back Request
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-bold ${getBuyBackStatusBadge(
                    request.status,
                  )}`}
                >
                  {request.status === "Pending" && <FiClock size={11} />}
                  {request.status}
                </span>
              </div>

              <h2 className="text-[22px] font-bold tracking-tight text-[#202721]">
                Request {request.id}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-[#89918B]">
                <span>
                  <strong className="text-[#3F4A41]">Distributor:</strong>{" "}
                  {request.distributor}
                </span>

                <span className="h-1 w-1 rounded-full bg-[#D8E2D8]" />

                <span>
                  <strong className="text-[#3F4A41]">Submitted:</strong>{" "}
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

              <ActionButton icon={<FiSearch size={14} />} label="Inspection" />

              <ActionButton
                icon={<FiCheck size={14} />}
                label="Approve"
                variant="primary"
              />
            </div>
          </div>
        </div>

        {/* SCROLL AREA */}
        <div className="custom-scroll flex-1 overflow-y-auto bg-[#F5F7F5] p-5 sm:p-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-5"
          >
            {/* PRODUCT DETAILS */}
            <motion.section variants={itemVariants} className={cardClass}>
              <div className="border-b border-[#163F20]/10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                    <FiPackage size={17} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#202721]">
                      Product Details & Eligibility
                    </h3>

                    <p className="mt-0.5 text-[10px] text-[#9AA29C]">
                      Product and buy-back eligibility information
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 p-5 xl:grid-cols-2">
                <div>
                  <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
                    Product Name
                  </span>

                  <p className="text-base font-bold text-[#202721]">
                    {request.product}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <DetailField label="SKU" value={request.sku} />

                    <DetailField
                      label="Quantity"
                      value={`${request.quantity} Units`}
                    />

                    <DetailField
                      label="Original Purchase"
                      value={request.originalPurchase}
                    />

                    <DetailField
                      label="PO Number"
                      value={request.poNumber}
                      link
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#163F20]">
                      Eligibility Criteria
                    </span>

                    <FiShield size={15} className="text-[#163F20]" />
                  </div>

                  <div className="space-y-2">
                    <EligibilityItem
                      label="Within 90-day return window"
                      value={request.eligibility.withinReturnWindow}
                    />

                    <EligibilityItem
                      label="Original packaging intact"
                      value={request.eligibility.originalPackaging}
                    />

                    <EligibilityItem
                      label="Unused / Factory condition"
                      value={request.eligibility.unusedCondition}
                    />
                  </div>
                </div>
              </div>
            </motion.section>

            {/* INSPECTION */}
            <motion.section variants={itemVariants} className={cardClass}>
              <div className="flex items-center justify-between border-b border-[#163F20]/10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                    <FiFileText size={17} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#202721]">
                      Inspection Report
                    </h3>

                    <p className="mt-0.5 text-[10px] text-[#9AA29C]">
                      Warehouse inspection information
                    </p>
                  </div>
                </div>

                {request.inspection && (
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#163F20] transition hover:text-[#4C8A57]"
                  >
                    <FiEdit2 size={13} />
                    Edit Report
                  </button>
                )}
              </div>

              <div className="p-5">
                {request.inspection ? (
                  <div className="rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] p-4">
                    <p className="text-xs leading-6 text-[#3F4A41]">
                      {request.inspection.report}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#D8E2D8] bg-[#F5F7F5] px-5 py-9 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#163F20] shadow-sm">
                      <FiSearch size={23} />
                    </div>

                    <h4 className="mt-4 text-sm font-bold text-[#202721]">
                      No Inspection Data Yet
                    </h4>

                    <p className="mt-1 max-w-[430px] text-xs leading-5 text-[#9AA29C]">
                      Items must be received at the warehouse before an
                      inspection report can be generated.
                    </p>

                    <button
                      type="button"
                      className="mt-4 flex items-center gap-2 rounded-xl border border-[#163F20]/20 bg-white px-4 py-2.5 text-[10px] font-bold text-[#163F20] transition hover:bg-[#163F20] hover:text-white"
                    >
                      <FiTruck size={13} />
                      Log Receipt & Begin Inspection
                    </button>
                  </div>
                )}
              </div>
            </motion.section>

            {/* FINANCIAL SUMMARY */}
            <motion.section variants={itemVariants} className={cardClass}>
              <div className="border-b border-[#163F20]/10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20] font-bold">
                    ₹
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#202721]">
                      Financial Summary
                    </h3>

                    <p className="mt-0.5 text-[10px] text-[#9AA29C]">
                      Estimated buy-back calculation
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 p-5 xl:grid-cols-[1fr_250px]">
                <div>
                  <div className="rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] px-4">
                    <FinancialRow
                      label={`Original Purchase Price (${request.quantity} Units @ ₹${unitPrice.toFixed(
                        2,
                      )})`}
                      value={`₹${request.financials.originalPrice.toFixed(2)}`}
                    />

                    <FinancialRow
                      label="Restocking Fee (15%)"
                      value={`-₹${request.financials.restockingFee.toFixed(2)}`}
                      danger
                    />

                    <FinancialRow
                      label="Estimated Depreciation"
                      value={`-₹${request.financials.depreciation.toFixed(2)}`}
                      danger
                      suffix="Pending inspection"
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-xl border border-[#163F20]/15 bg-[#EAF3EA] px-4 py-4">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#163F20]">
                        Estimated Buy-Back
                      </p>

                      <p className="mt-1 text-xs text-[#4C8A57]">
                        Final value after inspection
                      </p>
                    </div>

                    <span className="text-[24px] font-bold tracking-tight text-[#0F3219]">
                      ₹{request.financials.estimatedValue.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* PAYMENT STATUS */}
                <div className="rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] p-4">
                  <div className="flex items-center justify-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#163F20] shadow-sm">
                      <FiCheck size={18} />
                    </div>
                  </div>

                  <p className="mt-3 text-center text-[9px] font-bold uppercase tracking-[0.15em] text-[#9AA29C]">
                    Payment Status
                  </p>

                  <div className="mt-2 flex justify-center">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-bold ${getPaymentStatusClass(
                        request.financials.paymentStatus,
                      )}`}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {getPaymentStatusIcon(request.financials.paymentStatus)}
                      </span>

                      {request.financials.paymentStatus}
                    </span>
                  </div>

                  <p className="mt-4 text-center text-[10px] leading-5 text-[#9AA29C]">
                    Funds will be credited to the distributor account balance
                    upon final approval.
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
  onFilterChange: (tab: BuyBackFilterTab) => void;
  onSelect: (id: string) => void;
}

const BuyBackRequestList: React.FC<BuyBackRequestListProps> = ({
  activeTab,
  requests,
  selectedId,
  onFilterChange,
  onSelect,
}) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return requests;

    return requests.filter((request) =>
      [request.id, request.distributor, request.product, request.sku]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [requests, search]);

  return (
    <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white shadow-[0_8px_30px_rgba(22,63,32,0.06)] md:w-[370px] lg:w-[390px]">
      {/* HEADER */}
      <div className="shrink-0 border-b border-[#163F20]/10 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                <FiPackage size={17} />
              </div>

              <div>
                <h3 className="text-base font-bold text-[#202721]">
                  Buy-Back Requests
                </h3>

                <p className="text-[10px] text-[#9AA29C]">
                  Review distributor requests
                </p>
              </div>
            </div>
          </div>

          <span className="rounded-full bg-[#EAF3EA] px-3 py-1.5 text-[9px] font-bold text-[#163F20]">
            {requests.length}
          </span>
        </div>

        {/* SEARCH */}
        <div className="relative mb-4">
          <FiSearch
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#163F20]"
          />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search request, distributor or product..."
            className="h-10 w-full rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] pl-10 pr-4 text-xs text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#163F20] focus:bg-white focus:ring-2 focus:ring-[#163F20]/10"
          />
        </div>

        {/* FILTER TABS */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {tabs.map((tab) => {
            const label = tab === "Inspection" ? "In Inspection" : tab;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => onFilterChange(tab)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-[9px] font-bold transition ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-[#4C8A57] to-[#163F20] text-white shadow-[0_6px_14px_-6px_rgba(22,63,32,0.5)]"
                    : "bg-[#F5F7F5] text-[#59645C] hover:bg-[#EAF3EA] hover:text-[#163F20]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* LIST */}
      <div className="custom-scroll flex-1 overflow-y-auto bg-[#F5F7F5] p-2">
        {filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map((request) => {
              const selected = request.id === selectedId;

              return (
                <motion.button
                  key={request.id}
                  type="button"
                  whileHover={{ x: 2 }}
                  onClick={() => onSelect(request.id)}
                  className={`relative w-full rounded-xl border p-3.5 text-left transition ${
                    selected
                      ? "border-[#163F20]/35 bg-[#EAF3EA] shadow-[0_4px_12px_-4px_rgba(22,63,32,0.25)]"
                      : "border-[#163F20]/10 bg-white hover:border-[#163F20]/25 hover:bg-[#FAFBFA]"
                  }`}
                >
                  {selected && (
                    <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-gradient-to-b from-[#4C8A57] to-[#0F3219]" />
                  )}

                  <div className="pl-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                          <FiUser size={15} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#202721]">
                            {request.distributor}
                          </p>

                          <p className="mt-0.5 truncate text-[9px] font-mono text-[#9AA29C]">
                            {request.id}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[8px] font-bold ${getBuyBackStatusBadge(
                          request.status,
                        )}`}
                      >
                        {request.status}
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-1 text-xs font-semibold text-[#3F4A41]">
                      {request.product}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-3 text-[#89918B]">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <FiCalendar size={12} />
                        <span className="truncate text-[9px]">
                          {request.date}
                        </span>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <FiPackage size={12} />
                        <span className="text-[9px]">
                          {request.items} Items
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#163F20] shadow-sm">
              <FiSearch size={23} />
            </div>

            <p className="mt-4 text-sm font-bold text-[#202721]">
              No requests found
            </p>

            <p className="mt-1 text-xs text-[#9AA29C]">
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
  const [requests, setRequests] = useState<BuyBackRequest[]>([]);
  const [activeTab, setActiveTab] = useState<BuyBackFilterTab>("All");
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);

  // ===================================================
  // FETCH
  // ===================================================

  const fetchBuyBackRequests = async () => {
    try {
      setLoading(true);

      const data = await getBuyBackRequests();
      setRequests(data);

      setSelectedId((currentId) => currentId || data[0]?.id || "");
    } catch (error) {
      console.error("Get buyback requests error:", error);
      toast.error("Unable to load buy-back requests.");
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

  const filteredRequests = useMemo(() => {
    const status = buyBackFilterStatusMap[activeTab];

    if (!status) return requests;

    return requests.filter((request) => request.status === status);
  }, [activeTab, requests]);

  // ===================================================
  // SELECTED REQUEST
  // ===================================================

  const selectedRequest =
    requests.find((request) => request.id === selectedId) ||
    filteredRequests[0] ||
    requests[0];

  // ===================================================
  // KEEP SELECTED VALID
  // ===================================================

  useEffect(() => {
    if (
      filteredRequests.length > 0 &&
      !filteredRequests.some((request) => request.id === selectedId)
    ) {
      setSelectedId(filteredRequests[0].id);
    }
  }, [filteredRequests, selectedId]);

  // ===================================================
  // LOADING
  // ===================================================

  if (loading && requests.length === 0) {
    return (
      <div className="flex min-h-[500px] items-center justify-center bg-[#F5F7F5]">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#163F20]">
            <FiRefreshCw size={23} className="animate-spin" />
          </div>

          <p className="mt-4 text-sm font-bold text-[#202721]">
            Loading buy-back requests...
          </p>

          <p className="mt-1 text-xs text-[#9AA29C]">
            Please wait while requests are fetched.
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // EMPTY
  // ===================================================

  if (!selectedRequest) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center bg-[#F5F7F5] text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#163F20] shadow-sm">
          <FiPackage size={27} />
        </div>

        <h3 className="mt-5 text-base font-bold text-[#202721]">
          No Buy-Back Requests
        </h3>

        <p className="mt-1 max-w-[350px] text-xs leading-5 text-[#9AA29C]">
          There are currently no buy-back requests available for review.
        </p>

        <button
          type="button"
          onClick={fetchBuyBackRequests}
          className="mt-4 flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] px-5 py-2.5 text-xs font-bold text-white shadow-[0_8px_18px_-8px_rgba(22,63,32,0.5)] transition hover:-translate-y-0.5"
        >
          <FiRefreshCw size={13} />
          Refresh
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#F5F7F5] p-4 sm:p-5 lg:p-6"
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
            <span className="h-2 w-2 rounded-full bg-[#163F20]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4C8A57]">
              Operations
            </span>
          </div>

          <h1 className="text-[29px] font-bold tracking-tight text-[#202721] sm:text-[33px]">
            Buy-Back Management
          </h1>

          <p className="mt-1 text-sm text-[#89918B]">
            Review distributor buy-back requests, eligibility, inspection and
            financial details.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchBuyBackRequests}
          disabled={loading}
          className="flex h-11 items-center justify-center gap-2 self-start rounded-xl border border-[#163F20]/20 bg-white px-5 text-sm font-bold text-[#163F20] shadow-sm transition hover:bg-[#EAF3EA] hover:border-[#163F20]/35 disabled:opacity-50"
        >
          <FiRefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </motion.div>

      {/* MAIN TWO-PANE */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex min-h-[calc(100vh-175px)] flex-col gap-4 lg:flex-row"
      >
        <BuyBackRequestList
          activeTab={activeTab}
          requests={filteredRequests}
          selectedId={selectedRequest.id}
          onFilterChange={setActiveTab}
          onSelect={setSelectedId}
        />

        <BuyBackDetail
          request={selectedRequest}
          onRefresh={fetchBuyBackRequests}
        />
      </motion.section>
    </motion.div>
  );
};

export default BuyBack;
