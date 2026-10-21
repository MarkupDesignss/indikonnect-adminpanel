import React, { useEffect, useMemo, useState } from "react";

import {
  FiCheck,
  FiTrash2,
  FiX,
  FiUser,
  FiCheckCircle,
  FiStar,
  FiSearch,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";

import { motion } from "framer-motion";

import productReviewsApi, {
  ProductReview,
  ReviewAction,
} from "../../api/endpoints/review";
import { usePermissions } from "../../pages/permissions/usePermissions";
import logoApi from "../../api/endpoints/logoApi";
import PermissionLoadingState from "@/components/common/PermissionLoadingState";

const DEFAULT_LOGO_URL =
  "https://www.markupdesigns.net/indikonnect/storage/logos/MmVFOudCiVU3Y8C0sf2gEEXna5jSKroCDj8xYMo0.png";

export const getStatusBadge = (status: string) => {
  const base =
    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border";

  switch (status?.toLowerCase()) {
    case "pending":
      return `${base} bg-[#FEF9C3] text-[#A16207] border-[#FACC15]/40`;
    case "approved":
      return `${base} bg-[#EAF3FF] text-[#2D6FE8] border-[#2D6FE8]/25`;
    case "rejected":
      return `${base} bg-[#FEF2F2] text-[#C23B32] border-[#C23B32]/25`;
    default:
      return `${base} bg-[#F4F8FD] text-[#6B7280] border-[#DCE6F2]`;
  }
};


const AccessDenied: React.FC = () => (
  <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#F4F8FD] p-4 font-poppins">
    <div className="max-w-md rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-lg">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#C23B32]">
        <FiAlertCircle size={26} />
      </div>

      <h2 className="text-lg font-bold text-[#111827]">Access Denied</h2>

      <p className="mt-2 text-sm text-[#6B7280]">
        You don't have permission to access the Review Management module.
      </p>

      <div className="mt-5 rounded-xl border border-[#C23B32]/15 bg-[#FEF2F2] px-4 py-3 text-[10px] font-bold text-[#C23B32]">
        Contact your administrator to request access.
      </div>
    </div>
  </div>
);

// =====================================================
// REVIEW MASTER SIDEBAR — BLUE THEME
// =====================================================
interface ReviewMasterSidebarProps {
  reviewList: ProductReview[];
  selectedId: number | null;
  setSelectedId: (id: number) => void;
}

const ReviewMasterSidebar: React.FC<ReviewMasterSidebarProps> = ({
  reviewList,
  selectedId,
  setSelectedId,
}) => {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "—";
    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filteredReviews = useMemo(() => {
    return reviewList.filter((review) => {
      const productName = review.product?.name || "";
      const customerName = review.user?.name || "";
      const reviewText = review.review_text || "";
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        productName.toLowerCase().includes(searchText) ||
        customerName.toLowerCase().includes(searchText) ||
        reviewText.toLowerCase().includes(searchText);

      const matchesStatus =
        activeFilter === "all" ||
        review.status?.toLowerCase() === activeFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reviewList, search, activeFilter]);

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden rounded-[22px] border border-[#DCE6F2] bg-white shadow-sm md:w-1/3">
      {/* HEADER */}
      <div className="relative flex-shrink-0 border-b border-[#DCE6F2] p-4 sm:p-5">
        <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#4F8FF7] via-[#2D6FE8] to-[#2D6FE8]" />

        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#111827]">Reviews</h3>
            <p className="mt-1 text-xs text-[#6B7280]">
              Manage customer feedback
            </p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#2D6FE8]">
            <FiStar size={16} className="fill-[#FACC15] text-[#FACC15]" />
          </div>
        </div>

        {/* FILTERS */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {[
            { label: "All Reviews", value: "all" },
            { label: "Pending", value: "pending" },
            { label: "Approved", value: "approved" },
            { label: "Rejected", value: "rejected" },
          ].map((filter) => {
            const isActive = activeFilter === filter.value;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-wide transition ${
                  isActive
                    ? "bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] text-white shadow-[0_6px_14px_-6px_rgba(45,111,232,0.5)]"
                    : "border border-[#DCE6F2] bg-[#F4F8FD] text-[#6B7280] hover:border-[#4F8FF7]/30 hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* SEARCH */}
        <div className="relative">
          <FiSearch
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D6FE8]"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] pl-10 pr-3 text-xs text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/10"
            placeholder="Filter by product or customer..."
            type="text"
          />
        </div>
      </div>

      {/* LIST */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filteredReviews.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
              <FiStar size={23} />
            </div>

            <p className="mt-4 text-sm font-bold text-[#111827]">
              No reviews found
            </p>

            <p className="mt-1 text-xs text-[#6B7280]">
              Customer reviews will appear here.
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => {
            const isSelected = review.id === selectedId;
            const productName = review.product?.name || "Unknown Product";
            const customerName = review.user?.name || "Unknown Customer";
            const comment = review.review_text || "";
            const date = formatDate(review.created_at);

            return (
              <div
                key={review.id}
                onClick={() => setSelectedId(review.id)}
                className={`relative cursor-pointer border-b border-[#DCE6F2] p-4 transition-all duration-200 sm:p-5 ${
                  isSelected ? "bg-[#EAF3FF]/60" : "bg-white hover:bg-[#F8FBFF]"
                }`}
              >
                {isSelected && (
                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-[#4F8FF7] to-[#2D6FE8]" />
                )}

                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2D6FE8]">
                      <FiUser size={14} />
                    </div>

                    <h4
                      className={`truncate text-sm ${
                        isSelected
                          ? "font-bold text-[#111827]"
                          : "font-bold text-[#111827]"
                      }`}
                    >
                      {productName}
                    </h4>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-bold capitalize ${getStatusBadge(
                      review.status,
                    )}`}
                  >
                    {review.status}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-bold text-[#6B7280]">
                    {customerName}
                  </span>
                  <span className="shrink-0 text-[10px] text-[#6B7280]">
                    {date}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <FiStar
                      key={i}
                      size={14}
                      className={
                        i < review.rating
                          ? "fill-[#FACC15] text-[#FACC15]"
                          : "text-[#DCE6F2]"
                      }
                    />
                  ))}

                  <span className="ml-1 text-[10px] font-bold text-[#2D6FE8]">
                    {review.rating}.0
                  </span>
                </div>

                {comment && (
                  <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#6B7280]">
                    {comment}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER */}
      <div className="flex-shrink-0 border-t border-[#DCE6F2] bg-[#F8FBFF] px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">
            Total Reviews
          </span>
          <span className="rounded-full bg-[#EAF3FF] px-2.5 py-1 text-[10px] font-bold text-[#2D6FE8]">
            {filteredReviews.length}
          </span>
        </div>
      </div>
    </aside>
  );
};

// =====================================================
// REVIEW DETAIL PANE — BLUE THEME
// =====================================================
interface ReviewDetailPaneProps {
  selectedReview: ProductReview;
  onAction: (reviewId: number, action: ReviewAction) => Promise<void>;
  actionLoading: boolean;
  canApprove?: boolean;
  canReject?: boolean;
  canDelete?: boolean;
}

const ReviewDetailPane: React.FC<ReviewDetailPaneProps> = ({
  selectedReview,
  onAction,
  actionLoading = false,
  canApprove = false,
  canReject = false,
  canDelete = false,
}) => {
  const formatDate = (date: string | null) => {
    if (!date) return "—";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "—";
    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getProductImage = () => {
    const primaryImage = selectedReview.product?.product_images?.find(
      (img) => img.is_primary,
    );
    return (
      primaryImage?.image ||
      selectedReview.product?.product_images?.[0]?.image ||
      ""
    );
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const getProductName = () =>
    selectedReview.product?.name || "Unknown Product";
  const getCustomerName = () =>
    selectedReview.user?.name || "Unknown Customer";
  const getCustomerEmail = () => selectedReview.user?.email || "";
  const getRatingDisplay = () => `${selectedReview.rating}.0`;

  const getAccountTypeLabel = () => {
    const type = selectedReview.user?.account_type?.toLowerCase();
    if (type === "distributor") return "Distributor";
    if (type === "customer") return "Customer";
    return "Customer";
  };

  const hasAnyAction = canApprove || canReject || canDelete;

  return (
    <section className="flex h-full flex-1 flex-col overflow-hidden rounded-[22px] border border-[#DCE6F2] bg-white shadow-sm">
      {/* HEADER */}
      <div className="relative border-b border-[#DCE6F2] bg-white px-5 py-5 sm:px-6">
        <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#4F8FF7] via-[#2D6FE8] to-[#2D6FE8]" />

        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${getStatusBadge(
                  selectedReview.status,
                )}`}
              >
                {selectedReview.status} Review
              </span>

              <span className="text-xs text-[#6B7280]">
                Submitted on {formatDate(selectedReview.created_at)}
              </span>
            </div>

            <h3 className="truncate pr-2 text-xl font-bold text-[#111827] sm:text-2xl">
              {getProductName()}
            </h3>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EAF3FF] text-[#2D6FE8]">
                <FiUser size={15} />
              </div>

              <span className="text-sm font-bold text-[#6B7280]">
                {getCustomerName()}
              </span>

              <span className="text-[#DCE6F2]">•</span>

              <span className="flex items-center gap-1.5 text-xs font-bold text-[#2D6FE8]">
                <FiCheckCircle size={13} />
                Verified Buyer
              </span>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          {hasAnyAction && (
            <div className="flex flex-wrap gap-2">
              {canDelete && (
                <button
                  type="button"
                  onClick={() => onAction(selectedReview.id, "delete")}
                  disabled={actionLoading}
                  className="flex items-center gap-2 rounded-xl border border-[#C23B32]/20 bg-[#FEF2F2] px-4 py-2.5 text-xs font-bold text-[#C23B32] transition hover:border-transparent hover:bg-[#C23B32] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiTrash2 size={15} />
                  Delete
                </button>
              )}

              {canReject && (
                <button
                  type="button"
                  onClick={() => onAction(selectedReview.id, "rejected")}
                  disabled={
                    actionLoading || selectedReview.status === "rejected"
                  }
                  className="flex items-center gap-2 rounded-xl border border-[#C23B32]/20 bg-[#FEF2F2] px-4 py-2.5 text-xs font-bold text-[#C23B32] transition hover:border-transparent hover:bg-[#C23B32] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiX size={15} />
                  Reject
                </button>
              )}

              {canApprove && (
                <button
                  type="button"
                  onClick={() => onAction(selectedReview.id, "approved")}
                  disabled={
                    actionLoading || selectedReview.status === "approved"
                  }
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-4 py-2.5 text-xs font-bold text-white shadow-[0_8px_18px_-8px_rgba(45,111,232,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(45,111,232,0.7)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiCheck size={15} />
                  Approve
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto bg-[#F4F8FD] p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          {/* LEFT MAIN */}
          <div className="space-y-5 xl:col-span-2">
            {/* REVIEW */}
            <div className="relative overflow-hidden rounded-2xl border border-[#DCE6F2] bg-white p-5 shadow-sm sm:p-6">
              <div className="absolute left-0 top-0 h-[3px] w-full bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8]" />

              <div className="mb-5 flex flex-wrap items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FiStar
                    key={i}
                    size={22}
                    className={
                      i < selectedReview.rating
                        ? "fill-[#FACC15] text-[#FACC15]"
                        : "text-[#DCE6F2]"
                    }
                  />
                ))}

                <span className="ml-2 text-lg font-bold text-[#111827]">
                  {getRatingDisplay()}
                </span>

                <span className="rounded-full bg-[#EAF3FF] px-2.5 py-1 text-[10px] font-bold text-[#2D6FE8]">
                  Customer Rating
                </span>
              </div>

              <h4 className="text-xl font-bold text-[#111827]">
                Review by {getCustomerName()}
              </h4>

              <div className="my-4 h-px bg-[#DCE6F2]" />

              <p className="text-sm leading-7 text-[#6B7280] sm:text-base">
                {selectedReview.review_text || "No comment provided."}
              </p>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#DCE6F2] bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
                  Review Status
                </p>

                <div className="mt-2">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${getStatusBadge(
                      selectedReview.status,
                    )}`}
                  >
                    {selectedReview.status}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#DCE6F2] bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
                  Rating Given
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xl font-bold text-[#111827]">
                    {getRatingDisplay()}/5
                  </span>
                  <FiStar
                    size={16}
                    className="fill-[#FACC15] text-[#FACC15]"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[#DCE6F2] bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
                  Submitted
                </p>

                <p className="mt-2 text-sm font-bold text-[#111827]">
                  {formatDate(selectedReview.created_at)}
                </p>
              </div>
            </div>

            {/* IMAGES */}
            {selectedReview.images && selectedReview.images.length > 0 && (
              <div className="rounded-2xl border border-[#DCE6F2] bg-white p-4 shadow-sm">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
                  Review Images
                </p>

                <div className="flex flex-wrap gap-3">
                  {selectedReview.images.map((image) => (
                    <div
                      key={image.id}
                      className="h-20 w-20 overflow-hidden rounded-lg border border-[#DCE6F2] bg-[#F4F8FD]"
                    >
                      <img
                        src={image.image_path}
                        alt={`Review image ${image.id}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="space-y-5">
            {/* CUSTOMER */}
            <div className="relative overflow-hidden rounded-2xl border border-[#DCE6F2] bg-white p-5 shadow-sm">
              <div className="absolute left-0 top-0 h-[3px] w-full bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8]" />

              <h5 className="mb-4 border-b border-[#DCE6F2] pb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
                {selectedReview.user?.account_type?.toLowerCase() ===
                "distributor"
                  ? "Distributor Profile"
                  : "Customer Profile"}
              </h5>

              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-sm font-bold text-white shadow-[0_6px_14px_-6px_rgba(45,111,232,0.5)]">
                  {getInitials(getCustomerName())}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-[#111827]">
                    {getCustomerName()}
                  </div>
                  <div className="mt-1 break-all text-xs text-[#6B7280]">
                    {getCustomerEmail()}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between gap-4 py-2.5">
                  <span className="shrink-0 text-xs text-[#6B7280]">
                    Account Type
                  </span>
                  <span className="shrink-0 rounded-lg bg-[#EAF3FF] px-2.5 py-1 text-xs font-bold capitalize text-[#2D6FE8]">
                    {getAccountTypeLabel()}
                  </span>
                </div>
              </div>
            </div>

            {/* PRODUCT */}
            <div className="relative overflow-hidden rounded-2xl border border-[#DCE6F2] bg-white p-5 shadow-sm">
              <div className="absolute left-0 top-0 h-[3px] w-full bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8]" />

              <h5 className="mb-4 border-b border-[#DCE6F2] pb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
                Product Context
              </h5>

              <div className="mb-4 flex gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#DCE6F2] bg-[#F4F8FD]">
                  {getProductImage() ? (
                    <img
                      alt={getProductName()}
                      className="h-full w-full object-cover"
                      src={getProductImage()}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#6B7280]">
                      <FiStar size={18} />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 line-clamp-2 text-sm font-bold text-[#111827]">
                    {getProductName()}
                  </div>

                  <div className="inline-flex rounded-lg bg-[#EAF3FF] px-2 py-1 font-mono text-[10px] font-bold text-[#2D6FE8]">
                    SKU: {selectedReview.product?.product_code || "N/A"}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[#DCE6F2] bg-[#F8FBFF] p-3">
                <span className="text-xs text-[#6B7280]">Product ID</span>
                <span className="text-sm font-bold text-[#111827]">
                  #{selectedReview.product?.id || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================
const ReviewsModeration = () => {
  // ===================================================
  // PERMISSIONS
  // ===================================================
  const {
    hasPermission,
    hasModuleAccess,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  const canViewReviews = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("review") ||
      hasPermission("review.view"),
    [isSuperAdmin, hasModuleAccess, hasPermission],
  );

  const canApproveReview = useMemo(
    () => isSuperAdmin || hasPermission("review.approve"),
    [isSuperAdmin, hasPermission],
  );

  const canRejectReview = useMemo(
    () => isSuperAdmin || hasPermission("review.reject"),
    [isSuperAdmin, hasPermission],
  );

  const canDeleteReview = useMemo(
    () => isSuperAdmin || hasPermission("review.delete"),
    [isSuperAdmin, hasPermission],
  );

  // ===================================================
  // ✅ LOGO STATE (same pattern as Orders / ReturnRefund / CreditNotes / Payment)
  // ===================================================

  const [logoUrl, setLogoUrl] = useState<string | null>(DEFAULT_LOGO_URL);
  const [logoLoading, setLogoLoading] = useState(true);

  // ===================================================
  // STATE
  // ===================================================
  const [reviewList, setReviewList] = useState<ProductReview[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // ✅ first load only — subsequent fetches don't block page
  const [initialReviewsLoading, setInitialReviewsLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  // ===================================================
  // LOGO FETCH (same as Orders / ReturnRefund / CreditNotes / Payment)
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
  // FETCH
  // isInitialLoad = true ONLY FOR THE FIRST LOAD
  // ===================================================
  const fetchReviews = async (isInitialLoad = false) => {
    try {
      setError("");
      setLoading(true);

      const response = await productReviewsApi.getAll();

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Failed to fetch reviews.");
      }

      const reviews = response.data.data || [];

      const validatedReviews = reviews.map((review: ProductReview) => ({
        ...review,
        rating:
          typeof review.rating === "number"
            ? review.rating
            : Number(review.rating) || 0,
        status: review.status || "pending",
        review_text: review.review_text || "",
        images: Array.isArray(review.images) ? review.images : [],
        user: review.user || {
          id: 0,
          name: "Unknown Customer",
          email: "",
          account_type: "customer",
        },
        product: review.product || {
          id: 0,
          name: "Unknown Product",
          product_code: "",
          slug: "",
          product_images: [],
        },
      }));

      setReviewList(validatedReviews);

      setSelectedId((prev) => {
        if (
          prev !== null &&
          validatedReviews.some((review) => review.id === prev)
        ) {
          return prev;
        }
        return validatedReviews.length > 0 ? validatedReviews[0].id : null;
      });
    } catch (err: any) {
      console.error("Fetch reviews error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch product reviews.",
      );
    } finally {
      setLoading(false);

      if (isInitialLoad) {
        setInitialReviewsLoading(false);
      }
    }
  };

  // ===================================================
  // INITIAL LOAD
  // WAIT FOR PERMISSIONS BEFORE REQUESTING REVIEWS
  // ===================================================
  useEffect(() => {
    if (permissionsLoading) return;

    if (!canViewReviews) {
      setLoading(false);
      setInitialReviewsLoading(false);
      return;
    }

    void fetchReviews(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionsLoading, canViewReviews]);

  // ===================================================
  // COMBINED INITIAL LOADING
  // ===================================================

  const pageLoading =
    permissionsLoading ||
    logoLoading ||
    initialReviewsLoading;

  // ===================================================
  // SELECTED
  // ===================================================
  const selectedReview = useMemo(() => {
    if (selectedId === null) return null;
    return reviewList.find((review) => review.id === selectedId) || null;
  }, [reviewList, selectedId]);

  // ===================================================
  // ACTION
  // ===================================================
  const handleReviewAction = async (
    reviewId: number,
    action: ReviewAction,
  ) => {
    try {
      setActionLoading(true);

      const response = await productReviewsApi.action(reviewId, { action });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || `Failed to ${action} review.`,
        );
      }

      if (action === "delete") {
        setReviewList((prev) => prev.filter((review) => review.id !== reviewId));
        setSelectedId((prev) => {
          if (prev !== reviewId) return prev;
          const nextReview = reviewList.find(
            (review) => review.id !== reviewId,
          );
          return nextReview?.id ?? null;
        });
      } else {
        setReviewList((prev) =>
          prev.map((review) =>
            review.id === reviewId ? { ...review, status: action } : review,
          ),
        );
      }

      await fetchReviews();
    } catch (err: any) {
      console.error(`Review ${action} error:`, err);
      alert(
        err?.response?.data?.message ||
          err?.message ||
          `Failed to ${action} review.`,
      );
      await fetchReviews();
    } finally {
      setActionLoading(false);
    }
  };


  if (pageLoading) {
    return <PermissionLoadingState logoUrl={logoUrl} />;
  }

  if (!canViewReviews) return <AccessDenied />;

  // ===================================================
  // ERROR
  // ===================================================
  if (error && reviewList.length === 0) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#F4F8FD] p-6 font-poppins">
        <div className="text-center">
          <p className="mb-3 text-sm font-bold text-[#C23B32]">{error}</p>

          <button
            type="button"
            onClick={async () => {
              await fetchReviews();
            }}
            className="rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-4 py-2 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(45,111,232,0.6)] transition hover:-translate-y-0.5"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ===================================================
  // MAIN UI
  // ===================================================
  return (
    <div className="flex flex-1 overflow-hidden bg-white font-poppins">
      {/* ACTION LOADING OVERLAY */}
      {actionLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
          <div className="flex items-center gap-3 rounded-xl border border-[#DCE6F2] bg-white px-5 py-4 shadow-[0_18px_40px_-12px_rgba(45,111,232,0.35)]">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#EAF3FF] border-t-[#2D6FE8]" />
            <span className="text-sm font-bold text-[#6B7280]">
              Updating review...
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-1 gap-4 overflow-hidden p-4">
        <ReviewMasterSidebar
          reviewList={reviewList}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
        />

        {selectedReview ? (
          <ReviewDetailPane
            selectedReview={selectedReview}
            onAction={handleReviewAction}
            actionLoading={actionLoading}
            canApprove={canApproveReview}
            canReject={canRejectReview}
            canDelete={canDeleteReview}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-[22px] border border-[#DCE6F2] bg-white">
            <p className="text-sm font-bold text-[#6B7280]">No reviews found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsModeration;