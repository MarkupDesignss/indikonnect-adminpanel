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

interface SelectedReview {
id: number;
product: string;
customer: string;
date: string;
rating: number;
status: string;
title: string;
comment: string;
customerProfile: any;
productContext: any;
}

interface Props {
selectedReview: SelectedReview;
}

export const ReviewDetailPane: React.FC<Props> = ({
selectedReview,
}) => (

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
          Submitted on {selectedReview.date}
        </span>
      </div>

      <h3 className="truncate pr-2 font-serif text-xl font-bold text-[#2a2620] sm:text-2xl">
        {selectedReview.product}
      </h3>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#faf8f3] text-[#b8902e]">
          <FiUser size={15} />
        </div>

        <span className="text-sm font-semibold text-[#4a4436]">
          {selectedReview.customer}
        </span>

        <span className="text-[#c2b6a0]">•</span>

        <span className="flex items-center gap-1.5 text-xs font-medium text-[#8f6d1d]">
          <FiCheckCircle size={13} />
          Verified Buyer
        </span>
      </div>
    </div>

    {/* ACTIONS */}

    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="flex items-center gap-2 rounded-xl border border-[#b8902e]/20 bg-white px-4 py-2.5 text-xs font-bold text-[#786f60] transition-all hover:border-[#b8902e]/35 hover:bg-[#faf8f3] hover:text-[#8f6d1d]"
      >
        <FiTrash2 size={15} />
        Delete
      </button>

      <button
        type="button"
        className="flex items-center gap-2 rounded-xl border border-[#c98d83]/25 bg-[#fff8f6] px-4 py-2.5 text-xs font-bold text-[#b46055] transition-all hover:border-[#b46055]/40 hover:bg-[#b46055]/10"
      >
        <FiX size={15} />
        Reject
      </button>

      <button
        type="button"
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#b8902e]/15 transition-all hover:from-[#a8841c] hover:to-[#795b14]"
      >
        <FiCheck size={15} />
        Approve
      </button>
    </div>
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
            {selectedReview.rating}.0
          </span>

          <span className="rounded-full bg-[#faf8f3] px-2.5 py-1 text-[10px] font-semibold text-[#8f6d1d]">
            Customer Rating
          </span>
        </div>

        <h4 className="text-xl font-bold text-[#2a2620]">
          {selectedReview.title}
        </h4>

        <div className="my-4 h-px bg-[#b8902e]/10" />

        <p className="text-sm leading-7 text-[#786f60] sm:text-base">
          {selectedReview.comment}
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
              {selectedReview.rating}/5
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
            {selectedReview.date}
          </p>
        </div>
      </div>
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
            {selectedReview.customerProfile.initials}
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-[#2a2620]">
              {selectedReview.customerProfile.name}
            </div>

            <div className="mt-1 text-xs text-[#a89a7d]">
              {selectedReview.customerProfile.role}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between border-b border-[#b8902e]/10 py-2.5">
            <span className="text-xs text-[#a89a7d]">
              Total Orders
            </span>

            <span className="text-sm font-bold text-[#2a2620]">
              {selectedReview.customerProfile.totalOrders}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-[#b8902e]/10 py-2.5">
            <span className="text-xs text-[#a89a7d]">
              Total Reviews
            </span>

            <span className="text-sm font-bold text-[#2a2620]">
              {selectedReview.customerProfile.totalReviews}
            </span>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <span className="text-xs text-[#a89a7d]">
              Account Status
            </span>

            <span className="flex items-center gap-1.5 text-xs font-bold text-[#806319]">
              <FiCheckCircle size={13} />
              {selectedReview.customerProfile.accountStatus}
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
              alt={selectedReview.productContext.name}
              className="h-full w-full object-cover"
              src={selectedReview.productContext.image}
            />
          </div>

          <div className="min-w-0">
            <div className="mb-2 line-clamp-2 text-sm font-bold text-[#2a2620]">
              {selectedReview.productContext.name}
            </div>

            <div className="inline-flex rounded-lg bg-[#faf8f3] px-2 py-1 font-mono text-[10px] font-semibold text-[#8f6d1d]">
              SKU: {selectedReview.productContext.sku}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3">
          <span className="text-xs text-[#a89a7d]">
            Overall Rating
          </span>

          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-[#2a2620]">
              {selectedReview.productContext.overallRating}
            </span>

            <FiStar
              size={14}
              className="fill-[#d4af52] text-[#b8902e]"
            />

            <span className="text-[11px] text-[#a89a7d]">
              (
              {
                selectedReview.productContext
                  .totalRatings
              }
              )
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

  </section>
);
