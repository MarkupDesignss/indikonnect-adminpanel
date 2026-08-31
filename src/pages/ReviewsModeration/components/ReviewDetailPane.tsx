import React from 'react';
import {
  FiCheck,
  FiTrash2,
  FiX,
  FiUser,
  FiCheckCircle,
  FiStar,
} from 'react-icons/fi';
import { getStatusBadge } from './ReviewUtils';

// Update the interface to match the actual API response
interface SelectedReview {
  id: number;
  rating: number;
  review_text: string;
  status: string;
  images?: Array<{ id: number; image_path: string }>;
  user: {
    id: number;
    name: string;
    email: string;
  };
  product: {
    id: number;
    name: string;
    product_code: string;
    slug: string;
    product_images: Array<{
      id: number;
      image: string;
      sort_order: number;
      is_primary: boolean;
    }>;
  };
  created_at: string | null;
}

interface Props {
  selectedReview: SelectedReview;
  onAction?: (reviewId: number, action: string) => Promise<void>;
  actionLoading?: boolean;
}

export const ReviewDetailPane: React.FC<Props> = ({
  selectedReview,
  onAction,
  actionLoading = false,
}) => {
  // Helper function to format date
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

  // Get primary product image
  const getProductImage = () => {
    const primaryImage = selectedReview.product?.product_images?.find(
      (img) => img.is_primary
    );
    return primaryImage?.image || selectedReview.product?.product_images?.[0]?.image || "";
  };

  // Get customer initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Format product name
  const getProductName = () => {
    return selectedReview.product?.name || "Unknown Product";
  };

  // Format customer name
  const getCustomerName = () => {
    return selectedReview.user?.name || "Unknown Customer";
  };

  // Get customer email
  const getCustomerEmail = () => {
    return selectedReview.user?.email || "";
  };

  // Format rating display
  const getRatingDisplay = () => {
    return `${selectedReview.rating}.0`;
  };

  return (
    <section className="flex h-full flex-1 flex-col overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-sm">
      <div className="relative border-b border-[#b8902e]/10 bg-white px-5 py-5 sm:px-6">
        {/* Top gold line */}
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

          {/* ACTIONS */}
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

      {/* =====================================================
          DETAIL CONTENT
      ===================================================== */}

      <div className="flex-1 overflow-y-auto bg-[#faf8f3] p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          {/* =================================================
              MAIN FEEDBACK
          ================================================= */}

          <div className="space-y-5 xl:col-span-2">
            {/* REVIEW CARD */}

            <div className="relative overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white p-5 shadow-sm sm:p-6">
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#e8c97a] to-[#b8902e]" />

              <div className="mb-5 flex flex-wrap items-center gap-2">
                {Array.from({
                  length: 5,
                }).map((_, i) => (
                  <FiStar
                    key={i}
                    size={22}
                    className={
                      i < selectedReview.rating
                        ? 'fill-[#d4af52] text-[#b8902e]'
                        : 'text-[#d8d0c0]'
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

            {/* REVIEW SUMMARY */}

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

                  <FiStar
                    size={16}
                    className="fill-[#d4af52] text-[#b8902e]"
                  />
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

            {/* Review Images */}
            {selectedReview.images && selectedReview.images.length > 0 && (
              <div className="rounded-2xl border border-[#b8902e]/10 bg-white p-4 shadow-sm">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#a89a7d]">
                  Review Images
                </p>
                <div className="flex flex-wrap gap-3">
                  {selectedReview.images.map((image) => (
                    <div key={image.id} className="h-20 w-20 overflow-hidden rounded-lg border border-[#b8902e]/15 bg-[#faf8f3]">
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

          {/* =================================================
              RIGHT SIDEBAR
          ================================================= */}

          <div className="space-y-5">
            {/* CUSTOMER PROFILE */}

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

                  <div className="mt-1 text-xs text-[#a89a7d]">
                    {getCustomerEmail()}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
              

                <div className="flex items-center justify-between border-b border-[#b8902e]/10 py-2.5">
                  <span className="text-xs text-[#a89a7d]">
                    Email
                  </span>

                  <span className="text-sm font-bold text-[#2a2620]">
                    {getCustomerEmail()}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2.5">
                  <span className="text-xs text-[#a89a7d]">
                    Account Status
                  </span>

                  <span className="flex items-center gap-1.5 text-xs font-bold text-[#806319]">
                    <FiCheckCircle size={13} />
                    Verified
                  </span>
                </div>
              </div>
            </div>

            {/* PRODUCT CONTEXT */}

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
                <span className="text-xs text-[#a89a7d]">
                  Product ID
                </span>

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