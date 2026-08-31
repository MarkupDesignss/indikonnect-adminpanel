import React from 'react';
import {
FiSearch,
FiUser,
FiStar,
} from 'react-icons/fi';

import { getStatusBadge } from './ReviewUtils';

interface Review {
id: number;
product: string;
customer: string;
date: string;
rating: number;
status: string;
comment: string;
}

interface Props {
reviewList: Review[];
selectedId: number;
setSelectedId: (id: number) => void;
}

export const ReviewMasterSidebar: React.FC<Props> = ({
reviewList,
selectedId,
setSelectedId,
}) => (

  <aside className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-sm md:w-1/3">
    {/* =====================================================
        HEADER / FILTERS
    ===================================================== */}

<div className="relative border-b border-[#b8902e]/10 p-4 sm:p-5">
  <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]" />

  <div className="mb-4 flex items-center justify-between">
    <div>
      <h3 className="text-base font-bold text-[#2a2620]">
        Reviews
      </h3>

      <p className="mt-1 text-xs text-[#a89a7d]">
        Manage customer feedback
      </p>
    </div>

    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
      <FiStar
        size={16}
        className="fill-[#d4af52]"
      />
    </div>
  </div>

  {/* FILTERS */}

  <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
    <button
      type="button"
      className="whitespace-nowrap rounded-full bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm"
    >
      All Reviews
    </button>

    <button
      type="button"
      className="whitespace-nowrap rounded-full border border-[#b8902e]/15 bg-[#faf8f3] px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-[#786f60] transition hover:border-[#b8902e]/30 hover:bg-[#b8902e]/10 hover:text-[#8f6d1d]"
    >
      Pending
    </button>

    <button
      type="button"
      className="whitespace-nowrap rounded-full border border-[#b8902e]/15 bg-[#faf8f3] px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-[#786f60] transition hover:border-[#b8902e]/30 hover:bg-[#b8902e]/10 hover:text-[#8f6d1d]"
    >
      Approved
    </button>

    <button
      type="button"
      className="whitespace-nowrap rounded-full border border-[#b8902e]/15 bg-[#faf8f3] px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-[#786f60] transition hover:border-[#b8902e]/30 hover:bg-[#b8902e]/10 hover:text-[#8f6d1d]"
    >
      Rejected
    </button>
  </div>

  {/* SEARCH */}

  <div className="relative">
    <FiSearch
      size={17}
      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a8841c]"
    />

    <input
      className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] pl-10 pr-3 text-xs text-[#2a2620] outline-none transition-all placeholder:text-[#a89a7d] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
      placeholder="Filter by product or customer..."
      type="text"
    />
  </div>
</div>

{/* =====================================================
    REVIEW LIST
===================================================== */}

<div className="flex-1 overflow-y-auto">
  {reviewList.length === 0 ? (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-5 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#b8902e]">
        <FiStar size={23} />
      </div>

      <p className="mt-4 text-sm font-bold text-[#2a2620]">
        No reviews found
      </p>

      <p className="mt-1 text-xs text-[#a89a7d]">
        Customer reviews will appear here.
      </p>
    </div>
  ) : (
    reviewList.map((review) => {
      const isSelected =
        review.id === selectedId;

      return (
        <div
          key={review.id}
          onClick={() =>
            setSelectedId(review.id)
          }
          className={`relative cursor-pointer border-b border-[#b8902e]/10 p-4 transition-all duration-200 sm:p-5 ${
            isSelected
              ? 'bg-[#faf8f3]'
              : 'bg-white hover:bg-[#fffdf7]'
          }`}
        >
          {/* Selected indicator */}

          {isSelected && (
            <div className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-[#d4af52] to-[#8a6c1f]" />
          )}

          {/* TOP */}

          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#faf8f3] text-[#b8902e]">
                <FiUser size={14} />
              </div>

              <h4
                className={`truncate text-sm ${
                  isSelected
                    ? 'font-bold text-[#2a2620]'
                    : 'font-semibold text-[#4a4436]'
                }`}
              >
                {review.product}
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

          {/* CUSTOMER / DATE */}

          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="truncate text-xs font-medium text-[#786f60]">
              {review.customer}
            </span>

            <span className="shrink-0 text-[10px] text-[#a89a7d]">
              {review.date}
            </span>
          </div>

          {/* RATING */}

          <div className="mt-3 flex items-center gap-1">
            {Array.from({
              length: 5,
            }).map((_, i) => (
              <FiStar
                key={i}
                size={14}
                className={
                  i < review.rating
                    ? 'fill-[#d4af52] text-[#b8902e]'
                    : 'text-[#d8d0c0]'
                }
              />
            ))}

            <span className="ml-1 text-[10px] font-bold text-[#8f6d1d]">
              {review.rating}.0
            </span>
          </div>

          {/* COMMENT */}

          {review.comment && (
            <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#a89a7d]">
              {review.comment}
            </p>
          )}
        </div>
      );
    })
  )}
</div>

{/* FOOTER */}

<div className="border-t border-[#b8902e]/10 bg-[#fffdfa] px-4 py-3">
  <div className="flex items-center justify-between">
    <span className="text-[10px] font-semibold uppercase tracking-wide text-[#a89a7d]">
      Total Reviews
    </span>

    <span className="rounded-full bg-[#b8902e]/10 px-2.5 py-1 text-[10px] font-bold text-[#8f6d1d]">
      {reviewList.length}
    </span>
  </div>
</div>


  </aside>
);
