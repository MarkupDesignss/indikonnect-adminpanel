import React, { useEffect, useMemo, useState } from "react";
import {
  FiCheck,
  FiTrash2,
  FiX,
  FiUser,
  FiCheckCircle,
  FiStar,
  FiSearch,
} from "react-icons/fi";

import productReviewsApi, {
  ProductReview,
  ReviewAction,
} from "../../api/endpoints/review";

// =====================================================
// STATUS BADGE
// =====================================================

export const getStatusBadge = (status: string) => {
  const base =
    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border";

  switch (status?.toLowerCase()) {
    case "pending":
      return `${base} bg-[#FBF3DC] text-[#8A6D16] border-[#D9A900]/30`;
    case "approved":
      return `${base} bg-[#EAF3EA] text-[#163F20] border-[#163F20]/25`;
    case "rejected":
      return `${base} bg-[#FBEAEA] text-[#C23B32] border-[#C23B32]/25`;
    default:
      return `${base} bg-[#F3F6F3] text-[#59645C] border-[#D8E2D8]`;
  }
};

// =====================================================
// SKELETON
// =====================================================

const ReviewsPageSkeleton = () => {
  return (
    <div className="flex flex-1 gap-4 overflow-hidden bg-[#F5F7F5] p-4">
      {/* LEFT */}
      <aside className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white shadow-sm md:w-1/3">
        <div className="border-b border-[#163F20]/10 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-20 animate-pulse rounded bg-[#EAF3EA]" />
              <div className="h-3 w-36 animate-pulse rounded bg-[#F5F7F5]" />
            </div>

            <div className="h-9 w-9 animate-pulse rounded-xl bg-[#EAF3EA]" />
          </div>

          <div className="mb-4 flex gap-2">
            <div className="h-8 w-24 animate-pulse rounded-full bg-[#EAF3EA]" />
            <div className="h-8 w-20 animate-pulse rounded-full bg-[#F5F7F5]" />
            <div className="h-8 w-20 animate-pulse rounded-full bg-[#F5F7F5]" />
          </div>

          <div className="h-11 w-full animate-pulse rounded-xl bg-[#F5F7F5]" />
        </div>

        <div className="flex-1 overflow-hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="border-b border-[#163F20]/10 p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-1 items-center gap-2">
                  <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-[#EAF3EA]" />
                  <div className="h-4 w-32 animate-pulse rounded bg-[#EAF3EA]" />
                </div>

                <div className="h-5 w-16 animate-pulse rounded-full bg-[#F5F7F5]" />
              </div>

              <div className="mt-3 flex justify-between">
                <div className="h-3 w-24 animate-pulse rounded bg-[#F5F7F5]" />
                <div className="h-3 w-16 animate-pulse rounded bg-[#F5F7F5]" />
              </div>

              <div className="mt-3 flex gap-1">
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <div
                    key={starIndex}
                    className="h-3.5 w-3.5 animate-pulse rounded-full bg-[#F5F7F5]"
                  />
                ))}
              </div>

              <div className="mt-3 space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-[#F5F7F5]" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-[#F5F7F5]" />
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* RIGHT */}
      <section className="flex h-full flex-1 flex-col overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white shadow-sm">
        <div className="border-b border-[#163F20]/10 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:justify-between">
            <div className="flex-1 space-y-3">
              <div className="h-6 w-24 animate-pulse rounded-full bg-[#EAF3EA]" />
              <div className="h-7 w-64 animate-pulse rounded bg-[#EAF3EA]" />

              <div className="flex items-center gap-2">
                <div className="h-8 w-8 animate-pulse rounded-full bg-[#EAF3EA]" />
                <div className="h-4 w-32 animate-pulse rounded bg-[#F5F7F5]" />
              </div>
            </div>

            <div className="flex gap-2">
              <div className="h-10 w-20 animate-pulse rounded-xl bg-[#F5F7F5]" />
              <div className="h-10 w-20 animate-pulse rounded-xl bg-[#F5F7F5]" />
              <div className="h-10 w-24 animate-pulse rounded-xl bg-[#EAF3EA]" />
            </div>
          </div>
        </div>

        <div className="flex-1 bg-[#F5F7F5] p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="space-y-5 xl:col-span-2">
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-5 flex gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-5 w-5 animate-pulse rounded-full bg-[#EAF3EA]"
                    />
                  ))}
                </div>

                <div className="h-6 w-48 animate-pulse rounded bg-[#EAF3EA]" />

                <div className="my-4 h-px bg-[#EAF3EA]" />

                <div className="space-y-3">
                  <div className="h-4 w-full animate-pulse rounded bg-[#F5F7F5]" />
                  <div className="h-4 w-full animate-pulse rounded bg-[#F5F7F5]" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-[#F5F7F5]" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="h-3 w-20 animate-pulse rounded bg-[#F5F7F5]" />
                    <div className="mt-3 h-6 w-16 animate-pulse rounded bg-[#EAF3EA]" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="mb-4 h-3 w-28 animate-pulse rounded bg-[#F5F7F5]" />

                  <div className="mb-5 flex items-center gap-3">
                    <div className="h-11 w-11 animate-pulse rounded-full bg-[#EAF3EA]" />

                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-28 animate-pulse rounded bg-[#EAF3EA]" />
                      <div className="h-3 w-20 animate-pulse rounded bg-[#F5F7F5]" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="h-3 w-full animate-pulse rounded bg-[#F5F7F5]" />
                    <div className="h-3 w-3/4 animate-pulse rounded bg-[#F5F7F5]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// =====================================================
// REVIEW MASTER SIDEBAR
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
        activeFilter === "all" || review.status?.toLowerCase() === activeFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reviewList, search, activeFilter]);

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white shadow-sm md:w-1/3">
      {/* HEADER */}
      <div className="relative flex-shrink-0 border-b border-[#163F20]/10 p-4 sm:p-5">
        <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-[#4C8A57] via-[#163F20] to-[#0F3219]" />

        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#202721]">Reviews</h3>
            <p className="mt-1 text-xs text-[#9AA29C]">
              Manage customer feedback
            </p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
            <FiStar size={16} className="fill-[#4C8A57]" />
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
                    ? "bg-gradient-to-r from-[#4C8A57] to-[#163F20] text-white shadow-[0_6px_14px_-6px_rgba(22,63,32,0.5)]"
                    : "border border-[#163F20]/15 bg-[#F5F7F5] text-[#59645C] hover:border-[#163F20]/30 hover:bg-[#EAF3EA] hover:text-[#163F20]"
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
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#163F20]"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] pl-10 pr-3 text-xs text-[#202721] outline-none transition-all placeholder:text-[#9AA29C] focus:border-[#163F20] focus:bg-white focus:ring-2 focus:ring-[#163F20]/15"
            placeholder="Filter by product or customer..."
            type="text"
          />
        </div>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredReviews.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#163F20]">
              <FiStar size={23} />
            </div>

            <p className="mt-4 text-sm font-bold text-[#202721]">
              No reviews found
            </p>

            <p className="mt-1 text-xs text-[#9AA29C]">
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
                className={`relative cursor-pointer border-b border-[#163F20]/10 p-4 transition-all duration-200 sm:p-5 ${
                  isSelected ? "bg-[#EAF3EA]/50" : "bg-white hover:bg-[#FAFBFA]"
                }`}
              >
                {isSelected && (
                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-[#4C8A57] to-[#0F3219]" />
                )}

                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF3EA] text-[#163F20]">
                      <FiUser size={14} />
                    </div>

                    <h4
                      className={`truncate text-sm ${
                        isSelected
                          ? "font-bold text-[#202721]"
                          : "font-semibold text-[#3F4A41]"
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
                  <span className="truncate text-xs font-medium text-[#59645C]">
                    {customerName}
                  </span>

                  <span className="shrink-0 text-[10px] text-[#9AA29C]">
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
                          ? "fill-[#4C8A57] text-[#163F20]"
                          : "text-[#D8E2D8]"
                      }
                    />
                  ))}

                  <span className="ml-1 text-[10px] font-bold text-[#163F20]">
                    {review.rating}.0
                  </span>
                </div>

                {comment && (
                  <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#9AA29C]">
                    {comment}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER */}
      <div className="flex-shrink-0 border-t border-[#163F20]/10 bg-[#FAFBFA] px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#9AA29C]">
            Total Reviews
          </span>

          <span className="rounded-full bg-[#EAF3EA] px-2.5 py-1 text-[10px] font-bold text-[#163F20]">
            {filteredReviews.length}
          </span>
        </div>
      </div>
    </aside>
  );
};

// =====================================================
// REVIEW DETAIL PANE
// =====================================================

interface ReviewDetailPaneProps {
  selectedReview: ProductReview;
  onAction: (reviewId: number, action: ReviewAction) => Promise<void>;
  actionLoading: boolean;
}

const ReviewDetailPane: React.FC<ReviewDetailPaneProps> = ({
  selectedReview,
  onAction,
  actionLoading = false,
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
  const getCustomerName = () => selectedReview.user?.name || "Unknown Customer";
  const getCustomerEmail = () => selectedReview.user?.email || "";
  const getRatingDisplay = () => `${selectedReview.rating}.0`;

  // ✅ NEW: Account type label
  const getAccountTypeLabel = () => {
    const type = selectedReview.user?.account_type?.toLowerCase();
    if (type === "distributor") return "Distributor";
    if (type === "customer") return "Customer";
    return "Customer"; // default fallback
  };

  return (
    <section className="flex h-full flex-1 flex-col overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white shadow-sm">
      {/* HEADER */}
      <div className="relative border-b border-[#163F20]/10 bg-white px-5 py-5 sm:px-6">
        <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-[#4C8A57] via-[#163F20] to-[#0F3219]" />

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

              <span className="text-xs text-[#9AA29C]">
                Submitted on {formatDate(selectedReview.created_at)}
              </span>
            </div>

            <h3 className="truncate pr-2 text-xl font-bold text-[#202721] sm:text-2xl">
              {getProductName()}
            </h3>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EAF3EA] text-[#163F20]">
                <FiUser size={15} />
              </div>

              <span className="text-sm font-semibold text-[#3F4A41]">
                {getCustomerName()}
              </span>

              <span className="text-[#C2B6A0]">•</span>

              <span className="flex items-center gap-1.5 text-xs font-medium text-[#163F20]">
                <FiCheckCircle size={13} />
                Verified Buyer
              </span>
            </div>
          </div>

          {onAction && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onAction(selectedReview.id, "delete")}
                disabled={actionLoading}
                className="flex items-center gap-2 rounded-xl border border-[#163F20]/20 bg-white px-4 py-2.5 text-xs font-bold text-[#59645C] transition-all hover:border-[#163F20]/35 hover:bg-[#F5F7F5] hover:text-[#163F20] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiTrash2 size={15} />
                Delete
              </button>

              <button
                type="button"
                onClick={() => onAction(selectedReview.id, "rejected")}
                disabled={actionLoading || selectedReview.status === "rejected"}
                className="flex items-center gap-2 rounded-xl border border-[#C23B32]/25 bg-[#FBEAEA] px-4 py-2.5 text-xs font-bold text-[#C23B32] transition-all hover:border-transparent hover:bg-[#C23B32] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiX size={15} />
                Reject
              </button>

              <button
                type="button"
                onClick={() => onAction(selectedReview.id, "approved")}
                disabled={actionLoading || selectedReview.status === "approved"}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#4C8A57] via-[#163F20] to-[#0F3219] px-4 py-2.5 text-xs font-bold text-white shadow-[0_8px_18px_-8px_rgba(22,63,32,0.6)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-8px_rgba(22,63,32,0.7)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiCheck size={15} />
                Approve
              </button>
            </div>
          )}
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto bg-[#F5F7F5] p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          {/* LEFT MAIN */}
          <div className="space-y-5 xl:col-span-2">
            {/* REVIEW */}
            <div className="relative overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white p-5 shadow-sm sm:p-6">
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#8FC199] to-[#163F20]" />

              <div className="mb-5 flex flex-wrap items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FiStar
                    key={i}
                    size={22}
                    className={
                      i < selectedReview.rating
                        ? "fill-[#4C8A57] text-[#163F20]"
                        : "text-[#D8E2D8]"
                    }
                  />
                ))}

                <span className="ml-2 text-lg font-bold text-[#202721]">
                  {getRatingDisplay()}
                </span>

                <span className="rounded-full bg-[#EAF3EA] px-2.5 py-1 text-[10px] font-semibold text-[#163F20]">
                  Customer Rating
                </span>
              </div>

              <h4 className="text-xl font-bold text-[#202721]">
                Review by {getCustomerName()}
              </h4>

              <div className="my-4 h-px bg-[#163F20]/10" />

              <p className="text-sm leading-7 text-[#59645C] sm:text-base">
                {selectedReview.review_text || "No comment provided."}
              </p>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#E5EAE5] bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9AA29C]">
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

              <div className="rounded-2xl border border-[#E5EAE5] bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9AA29C]">
                  Rating Given
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xl font-bold text-[#202721]">
                    {getRatingDisplay()}/5
                  </span>

                  <FiStar size={16} className="fill-[#4C8A57] text-[#163F20]" />
                </div>
              </div>

              <div className="rounded-2xl border border-[#E5EAE5] bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9AA29C]">
                  Submitted
                </p>

                <p className="mt-2 text-sm font-bold text-[#202721]">
                  {formatDate(selectedReview.created_at)}
                </p>
              </div>
            </div>

            {/* IMAGES */}
            {selectedReview.images && selectedReview.images.length > 0 && (
              <div className="rounded-2xl border border-[#E5EAE5] bg-white p-4 shadow-sm">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9AA29C]">
                  Review Images
                </p>

                <div className="flex flex-wrap gap-3">
                  {selectedReview.images.map((image) => (
                    <div
                      key={image.id}
                      className="h-20 w-20 overflow-hidden rounded-lg border border-[#163F20]/15 bg-[#F5F7F5]"
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
            <div className="relative overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white p-5 shadow-sm">
  <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#4C8A57] to-[#0F3219]" />

  <h5 className="mb-4 border-b border-[#163F20]/10 pb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
    {selectedReview.user?.account_type?.toLowerCase() === "distributor"
      ? "Distributor Profile"
      : "Customer Profile"}
  </h5>

  <div className="mb-5 flex items-center gap-3">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4C8A57] to-[#163F20] text-sm font-bold text-white shadow-[0_6px_14px_-6px_rgba(22,63,32,0.5)]">
      {getInitials(getCustomerName())}
    </div>

    <div className="min-w-0 flex-1">
      <div className="text-sm font-bold text-[#202721]">
        {getCustomerName()}
      </div>

      <div className="mt-1 break-all text-xs text-[#9AA29C]">
        {getCustomerEmail()}
      </div>
    </div>
  </div>

  <div className="space-y-1">
    {/* Account Type Row */}
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="shrink-0 text-xs text-[#9AA29C]">Account Type</span>

      <span className="shrink-0 rounded-lg bg-[#EAF3EA] px-2.5 py-1 text-xs font-bold capitalize text-[#163F20]">
        {getAccountTypeLabel()}
      </span>
    </div>
  </div>
</div>

            {/* PRODUCT */}
            <div className="relative overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white p-5 shadow-sm">
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#8FC199] to-[#163F20]" />

              <h5 className="mb-4 border-b border-[#163F20]/10 pb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
                Product Context
              </h5>

              <div className="mb-4 flex gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#163F20]/15 bg-[#F5F7F5]">
                  <img
                    alt={getProductName()}
                    className="h-full w-full object-cover"
                    src={getProductImage()}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 line-clamp-2 text-sm font-bold text-[#202721]">
                    {getProductName()}
                  </div>

                  <div className="inline-flex rounded-lg bg-[#EAF3EA] px-2 py-1 font-mono text-[10px] font-semibold text-[#163F20]">
                    SKU: {selectedReview.product?.product_code || "N/A"}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] p-3">
                <span className="text-xs text-[#9AA29C]">Product ID</span>

                <span className="text-sm font-bold text-[#202721]">
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
// MAIN COMPONENT - ReviewsModeration
// =====================================================

const ReviewsModeration = () => {
  const [reviewList, setReviewList] = useState<ProductReview[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // FETCH REVIEWS
  // =====================================================

  const fetchReviews = async () => {
    try {
      setError("");

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
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchReviews();
      setLoading(false);
    };

    load();
  }, []);

  // =====================================================
  // SELECTED
  // =====================================================

  const selectedReview = useMemo(() => {
    if (selectedId === null) return null;
    return reviewList.find((review) => review.id === selectedId) || null;
  }, [reviewList, selectedId]);

  // =====================================================
  // ACTION
  // =====================================================

  const handleReviewAction = async (reviewId: number, action: ReviewAction) => {
    try {
      setActionLoading(true);

      const response = await productReviewsApi.action(reviewId, { action });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || `Failed to ${action} review.`,
        );
      }

      if (action === "delete") {
        setReviewList((prev) =>
          prev.filter((review) => review.id !== reviewId),
        );

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

  // =====================================================
  // RENDER
  // =====================================================

  if (loading) {
    return <ReviewsPageSkeleton />;
  }

  if (error && reviewList.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#F5F7F5] p-6">
        <div className="text-center">
          <p className="mb-3 text-sm text-[#C23B32]">{error}</p>

          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              setError("");
              await fetchReviews();
              setLoading(false);
            }}
            className="rounded-lg bg-gradient-to-br from-[#4C8A57] to-[#163F20] px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden bg-[#F5F7F5]">
      {/* ACTION LOADING OVERLAY */}
      {actionLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
          <div className="flex items-center gap-3 rounded-xl border border-[#163F20]/20 bg-white px-5 py-4 shadow-[0_18px_40px_-12px_rgba(22,63,32,0.35)]">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#EAF3EA] border-t-[#163F20]" />

            <span className="text-sm font-medium text-[#3F4A41]">
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
          />
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-[#E5EAE5] bg-white">
            <p className="text-sm text-[#59645C]">No reviews found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsModeration;