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


export const getStatusBadge = (status: string) => {
  const base = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border';
  switch (status?.toLowerCase()) {
    case 'pending':
      return `${base} bg-amber-100 text-amber-700 border-amber-200`;
    case 'approved':
      return `${base} bg-emerald-100 text-emerald-700 border-emerald-200`;
    case 'rejected':
      return `${base} bg-red-100 text-red-700 border-red-200`;
    default:
      return `${base} bg-gray-100 text-gray-600 border-gray-200`;
  }
};


const ReviewsPageSkeleton = () => {
  return (
    <div className="flex flex-1 gap-4 overflow-hidden p-4">
      {/* LEFT */}
      <aside className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-sm md:w-1/3">
        <div className="border-b border-[#b8902e]/10 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-36 animate-pulse rounded bg-gray-100" />
            </div>

            <div className="h-9 w-9 animate-pulse rounded-xl bg-gray-100" />
          </div>

          <div className="mb-4 flex gap-2">
            <div className="h-8 w-24 animate-pulse rounded-full bg-gray-200" />
            <div className="h-8 w-20 animate-pulse rounded-full bg-gray-100" />
            <div className="h-8 w-20 animate-pulse rounded-full bg-gray-100" />
          </div>

          <div className="h-11 w-full animate-pulse rounded-xl bg-gray-100" />
        </div>

        <div className="flex-1 overflow-hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="border-b border-gray-100 p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-1 items-center gap-2">
                  <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-gray-100" />
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                </div>

                <div className="h-5 w-16 animate-pulse rounded-full bg-gray-100" />
              </div>

              <div className="mt-3 flex justify-between">
                <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
              </div>

              <div className="mt-3 flex gap-1">
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <div
                    key={starIndex}
                    className="h-3.5 w-3.5 animate-pulse rounded-full bg-gray-100"
                  />
                ))}
              </div>

              <div className="mt-3 space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* RIGHT */}
      <section className="flex h-full flex-1 flex-col overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-sm">
        <div className="border-b border-[#b8902e]/10 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:justify-between">
            <div className="flex-1 space-y-3">
              <div className="h-6 w-24 animate-pulse rounded-full bg-gray-100" />
              <div className="h-7 w-64 animate-pulse rounded bg-gray-200" />

              <div className="flex items-center gap-2">
                <div className="h-8 w-8 animate-pulse rounded-full bg-gray-100" />
                <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
              </div>
            </div>

            <div className="flex gap-2">
              <div className="h-10 w-20 animate-pulse rounded-xl bg-gray-100" />
              <div className="h-10 w-20 animate-pulse rounded-xl bg-gray-100" />
              <div className="h-10 w-24 animate-pulse rounded-xl bg-gray-200" />
            </div>
          </div>
        </div>

        <div className="flex-1 bg-[#faf8f3] p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="space-y-5 xl:col-span-2">
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-5 flex gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-5 w-5 animate-pulse rounded-full bg-gray-100"
                    />
                  ))}
                </div>

                <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />

                <div className="my-4 h-px bg-gray-100" />

                <div className="space-y-3">
                  <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-gray-100" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-white p-4 shadow-sm"
                  >
                    <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
                    <div className="mt-3 h-6 w-16 animate-pulse rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-white p-5 shadow-sm"
                >
                  <div className="mb-4 h-3 w-28 animate-pulse rounded bg-gray-100" />

                  <div className="mb-5 flex items-center gap-3">
                    <div className="h-11 w-11 animate-pulse rounded-full bg-gray-100" />

                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                      <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
                    <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
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
        activeFilter === "all" ||
        review.status?.toLowerCase() === activeFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reviewList, search, activeFilter]);

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-sm md:w-1/3">
      <div className="relative border-b border-[#b8902e]/10 p-4 sm:p-5">
        <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]" />

        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#2a2620]">Reviews</h3>
            <p className="mt-1 text-xs text-[#a89a7d]">Manage customer feedback</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
            <FiStar size={16} className="fill-[#d4af52]" />
          </div>
        </div>

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
                    ? "bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] text-white shadow-sm"
                    : "border border-[#b8902e]/15 bg-[#faf8f3] text-[#786f60] hover:border-[#b8902e]/30 hover:bg-[#b8902e]/10 hover:text-[#8f6d1d]"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <div className="relative">
          <FiSearch
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a8841c]"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] pl-10 pr-3 text-xs text-[#2a2620] outline-none transition-all placeholder:text-[#a89a7d] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
            placeholder="Filter by product or customer..."
            type="text"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredReviews.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#b8902e]">
              <FiStar size={23} />
            </div>
            <p className="mt-4 text-sm font-bold text-[#2a2620]">No reviews found</p>
            <p className="mt-1 text-xs text-[#a89a7d]">Customer reviews will appear here.</p>
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
                className={`relative cursor-pointer border-b border-[#b8902e]/10 p-4 transition-all duration-200 sm:p-5 ${
                  isSelected ? "bg-[#faf8f3]" : "bg-white hover:bg-[#fffdf7]"
                }`}
              >
                {isSelected && (
                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-[#d4af52] to-[#8a6c1f]" />
                )}

                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#faf8f3] text-[#b8902e]">
                      <FiUser size={14} />
                    </div>
                    <h4
                      className={`truncate text-sm ${
                        isSelected ? "font-bold text-[#2a2620]" : "font-semibold text-[#4a4436]"
                      }`}
                    >
                      {productName}
                    </h4>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-bold capitalize ${getStatusBadge(
                      review.status
                    )}`}
                  >
                    {review.status}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium text-[#786f60]">
                    {customerName}
                  </span>
                  <span className="shrink-0 text-[10px] text-[#a89a7d]">{date}</span>
                </div>

                <div className="mt-3 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <FiStar
                      key={i}
                      size={14}
                      className={
                        i < review.rating
                          ? "fill-[#d4af52] text-[#b8902e]"
                          : "text-[#d8d0c0]"
                      }
                    />
                  ))}
                  <span className="ml-1 text-[10px] font-bold text-[#8f6d1d]">
                    {review.rating}.0
                  </span>
                </div>

                {comment && (
                  <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#a89a7d]">
                    {comment}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-[#b8902e]/10 bg-[#fffdfa] px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#a89a7d]">
            Total Reviews
          </span>
          <span className="rounded-full bg-[#b8902e]/10 px-2.5 py-1 text-[10px] font-bold text-[#8f6d1d]">
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
      (img) => img.is_primary
    );
    return primaryImage?.image || selectedReview.product?.product_images?.[0]?.image || "";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getProductName = () => selectedReview.product?.name || "Unknown Product";
  const getCustomerName = () => selectedReview.user?.name || "Unknown Customer";
  const getCustomerEmail = () => selectedReview.user?.email || "";
  const getRatingDisplay = () => `${selectedReview.rating}.0`;

  return (
    <section className="flex h-full flex-1 flex-col overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-sm">
      <div className="relative border-b border-[#b8902e]/10 bg-white px-5 py-5 sm:px-6">
        <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]" />

        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${getStatusBadge(
                  selectedReview.status
                )}`}
              >
                {selectedReview.status} Review
              </span>
              <span className="text-xs text-[#a89a7d]">
                Submitted on {formatDate(selectedReview.created_at)}
              </span>
            </div>

            <h3 className="truncate pr-2 font-serif text-xl font-bold text-[#2a2620] sm:text-2xl">
              {getProductName()}
            </h3>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#faf8f3] text-[#b8902e]">
                <FiUser size={15} />
              </div>
              <span className="text-sm font-semibold text-[#4a4436]">
                {getCustomerName()}
              </span>
              <span className="text-[#c2b6a0]">•</span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-[#8f6d1d]">
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
                className="flex items-center gap-2 rounded-xl border border-[#b8902e]/20 bg-white px-4 py-2.5 text-xs font-bold text-[#786f60] transition-all hover:border-[#b8902e]/35 hover:bg-[#faf8f3] hover:text-[#8f6d1d] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiTrash2 size={15} />
                Delete
              </button>

              <button
                type="button"
                onClick={() => onAction(selectedReview.id, "rejected")}
                disabled={actionLoading || selectedReview.status === "rejected"}
                className="flex items-center gap-2 rounded-xl border border-[#c98d83]/25 bg-[#fff8f6] px-4 py-2.5 text-xs font-bold text-[#b46055] transition-all hover:border-[#b46055]/40 hover:bg-[#b46055]/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiX size={15} />
                Reject
              </button>

              <button
                type="button"
                onClick={() => onAction(selectedReview.id, "approved")}
                disabled={actionLoading || selectedReview.status === "approved"}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#b8902e]/15 transition-all hover:from-[#a8841c] hover:to-[#795b14] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiCheck size={15} />
                Approve
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#faf8f3] p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="space-y-5 xl:col-span-2">
            <div className="relative overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white p-5 shadow-sm sm:p-6">
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#e8c97a] to-[#b8902e]" />

              <div className="mb-5 flex flex-wrap items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FiStar
                    key={i}
                    size={22}
                    className={
                      i < selectedReview.rating
                        ? "fill-[#d4af52] text-[#b8902e]"
                        : "text-[#d8d0c0]"
                    }
                  />
                ))}
                <span className="ml-2 text-lg font-bold text-[#2a2620]">
                  {getRatingDisplay()}
                </span>
                <span className="rounded-full bg-[#faf8f3] px-2.5 py-1 text-[10px] font-semibold text-[#8f6d1d]">
                  Customer Rating
                </span>
              </div>

              <h4 className="text-xl font-bold text-[#2a2620]">
                Review by {getCustomerName()}
              </h4>

              <div className="my-4 h-px bg-[#b8902e]/10" />

              <p className="text-sm leading-7 text-[#786f60] sm:text-base">
                {selectedReview.review_text || "No comment provided."}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#b8902e]/10 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#a89a7d]">
                  Review Status
                </p>
                <div className="mt-2">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${getStatusBadge(
                      selectedReview.status
                    )}`}
                  >
                    {selectedReview.status}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#b8902e]/10 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#a89a7d]">
                  Rating Given
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xl font-bold text-[#2a2620]">
                    {getRatingDisplay()}/5
                  </span>
                  <FiStar size={16} className="fill-[#d4af52] text-[#b8902e]" />
                </div>
              </div>

              <div className="rounded-2xl border border-[#b8902e]/10 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#a89a7d]">
                  Submitted
                </p>
                <p className="mt-2 text-sm font-bold text-[#2a2620]">
                  {formatDate(selectedReview.created_at)}
                </p>
              </div>
            </div>

            {selectedReview.images && selectedReview.images.length > 0 && (
              <div className="rounded-2xl border border-[#b8902e]/10 bg-white p-4 shadow-sm">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#a89a7d]">
                  Review Images
                </p>
                <div className="flex flex-wrap gap-3">
                  {selectedReview.images.map((image) => (
                    <div
                      key={image.id}
                      className="h-20 w-20 overflow-hidden rounded-lg border border-[#b8902e]/15 bg-[#faf8f3]"
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

          <div className="space-y-5">
            <div className="relative overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white p-5 shadow-sm">
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#d4af52] to-[#8a6c1f]" />

              <h5 className="mb-4 border-b border-[#b8902e]/10 pb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a89a7d]">
                Customer Profile
              </h5>

              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-sm font-bold text-white">
                  {getInitials(getCustomerName())}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-[#2a2620]">
                    {getCustomerName()}
                  </div>
                  <div className="mt-1 text-xs text-[#a89a7d]">{getCustomerEmail()}</div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between border-b border-[#b8902e]/10 py-2.5">
                  <span className="text-xs text-[#a89a7d]">Email</span>
                  <span className="text-sm font-bold text-[#2a2620]">
                    {getCustomerEmail()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-xs text-[#a89a7d]">Account Status</span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[#806319]">
                    <FiCheckCircle size={13} />
                    Verified
                  </span>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white p-5 shadow-sm">
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#e8c97a] to-[#b8902e]" />

              <h5 className="mb-4 border-b border-[#b8902e]/10 pb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a89a7d]">
                Product Context
              </h5>

              <div className="mb-4 flex gap-3">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-[#b8902e]/15 bg-[#faf8f3]">
                  <img
                    alt={getProductName()}
                    className="h-full w-full object-cover"
                    src={getProductImage()}
                  />
                </div>
                <div className="min-w-0">
                  <div className="mb-2 line-clamp-2 text-sm font-bold text-[#2a2620]">
                    {getProductName()}
                  </div>
                  <div className="inline-flex rounded-lg bg-[#faf8f3] px-2 py-1 font-mono text-[10px] font-semibold text-[#8f6d1d]">
                    SKU: {selectedReview.product?.product_code || "N/A"}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3">
                <span className="text-xs text-[#a89a7d]">Product ID</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-[#2a2620]">
                    #{selectedReview.product?.id || "N/A"}
                  </span>
                </div>
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
        rating: typeof review.rating === "number" ? review.rating : Number(review.rating) || 0,
        status: review.status || "pending",
        review_text: review.review_text || "",
        images: Array.isArray(review.images) ? review.images : [],
        user: review.user || { id: 0, name: "Unknown Customer", email: "" },
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
        if (prev !== null && validatedReviews.some((review) => review.id === prev)) {
          return prev;
        }
        return validatedReviews.length > 0 ? validatedReviews[0].id : null;
      });
    } catch (err: any) {
      console.error("Fetch reviews error:", err);
      setError(
        err?.response?.data?.message || err?.message || "Failed to fetch product reviews."
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
  // SELECTED REVIEW
  // =====================================================

  const selectedReview = useMemo(() => {
    if (selectedId === null) return null;
    return reviewList.find((review) => review.id === selectedId) || null;
  }, [reviewList, selectedId]);

  // =====================================================
  // HANDLE REVIEW ACTION - With fresh GET after action
  // =====================================================

  const handleReviewAction = async (reviewId: number, action: ReviewAction) => {
    try {
      setActionLoading(true);

      // =================================================
      // POST ACTION
      // =================================================

      const response = await productReviewsApi.action(reviewId, { action });

      if (!response.data?.success) {
        throw new Error(response.data?.message || `Failed to ${action} review.`);
      }

      // =================================================
      // IMMEDIATE LOCAL UPDATE (Optimistic UI)
      // =================================================

      if (action === "delete") {
        setReviewList((prev) => prev.filter((review) => review.id !== reviewId));

        setSelectedId((prev) => {
          if (prev !== reviewId) return prev;
          const nextReview = reviewList.find((review) => review.id !== reviewId);
          return nextReview?.id ?? null;
        });
      } else {
        // Approve / Reject - Immediate status update
        setReviewList((prev) =>
          prev.map((review) =>
            review.id === reviewId ? { ...review, status: action } : review
          )
        );
      }

      // =================================================
      // FRESH GET AFTER ACTION (Latest data from server)
      // =================================================

      await fetchReviews();
      
    } catch (err: any) {
      console.error(`Review ${action} error:`, err);
      alert(err?.response?.data?.message || err?.message || `Failed to ${action} review.`);
      
      // Re-fetch to ensure UI is in sync with server state
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
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center">
          <p className="mb-3 text-sm text-red-500">{error}</p>
          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              setError("");
              await fetchReviews();
              setLoading(false);
            }}
            className="rounded-lg bg-black px-4 py-2 text-sm text-white transition hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Action Loading Overlay */}
      {actionLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
          <div className="flex items-center gap-3 rounded-xl border border-[#b8902e]/20 bg-white px-5 py-4 shadow-xl">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-[#b8902e]" />
            <span className="text-sm font-medium text-[#4a4436]">Updating review...</span>
          </div>
        </div>
      )}

      <div className="flex flex-1 gap-4 overflow-hidden p-4">
        {/* LEFT - Sidebar */}
        <ReviewMasterSidebar
          reviewList={reviewList}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
        />

        {/* RIGHT - Detail Pane */}
        {selectedReview ? (
          <ReviewDetailPane
            selectedReview={selectedReview}
            onAction={handleReviewAction}
            actionLoading={actionLoading}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white">
            <p className="text-sm text-gray-500">No reviews found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsModeration;