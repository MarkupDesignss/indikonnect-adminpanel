import React from 'react';
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

export const ReviewMasterSidebar: React.FC<Props> = ({ reviewList, selectedId, setSelectedId }) => (
  <aside className="w-1/3 bg-surface-container-lowest rounded-xl border border-border-light flex flex-col h-full shadow-sm">
    {/* Filters & Search */}
    <div className="p-4 border-b border-border-light space-y-4">
      <div className="flex gap-2 text-label-md font-label-md overflow-x-auto pb-1 hide-scrollbar">
        <button className="px-3 py-1.5 rounded-full bg-primary text-on-primary whitespace-nowrap">
          All Reviews
        </button>
        <button className="px-3 py-1.5 rounded-full border border-border-light text-on-surface-variant hover:bg-surface-variant whitespace-nowrap">
          Pending
        </button>
        <button className="px-3 py-1.5 rounded-full border border-border-light text-on-surface-variant hover:bg-surface-variant whitespace-nowrap">
          Approved
        </button>
        <button className="px-3 py-1.5 rounded-full border border-border-light text-on-surface-variant hover:bg-surface-variant whitespace-nowrap">
          Rejected
        </button>
      </div>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
          search
        </span>
        <input
          className="w-full pl-9 pr-3 py-2 bg-surface text-body-md border border-border-light rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          placeholder="Filter by product or customer..."
          type="text"
        />
      </div>
    </div>

    {/* Review List */}
    <div className="flex-1 overflow-y-auto">
      {reviewList.map((review) => {
        const isSelected = review.id === selectedId;
        return (
          <div
            key={review.id}
            onClick={() => setSelectedId(review.id)}
            className={`p-4 border-b border-border-light hover:bg-surface cursor-pointer transition-colors ${
              isSelected ? 'bg-surface-container border-l-4 border-l-secondary-container' : ''
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-data-tabular text-data-tabular font-semibold text-primary truncate pr-4">
                {review.product}
              </h4>
              <span className={getStatusBadge(review.status)}>{review.status}</span>
            </div>
            <div className="flex justify-between items-center text-body-md text-on-surface-variant mb-2">
              <span>{review.customer}</span>
              <span className="text-xs">{review.date}</span>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`material-symbols-outlined text-[16px] ${
                    i < review.rating ? 'text-status-warning' : 'text-outline-variant'
                  }`}
                  style={{ fontVariationSettings: i < review.rating ? "'FILL' 1" : undefined }}
                >
                  star
                </span>
              ))}
            </div>
            {review.comment && (
              <p className="text-body-md text-on-surface-variant mt-2 line-clamp-2">{review.comment}</p>
            )}
          </div>
        );
      })}
    </div>
  </aside>
);
