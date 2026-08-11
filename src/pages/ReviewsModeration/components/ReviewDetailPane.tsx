import React from 'react';
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

export const ReviewDetailPane: React.FC<Props> = ({ selectedReview }) => (
  <section className="flex-1 bg-surface-container-lowest rounded-xl border border-border-light flex flex-col h-full overflow-hidden shadow-sm">
    {/* Detail Header */}
    <div className="p-6 border-b border-border-light flex justify-between items-start bg-white">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className={getStatusBadge(selectedReview.status)}>
            {selectedReview.status} Review
          </span>
          <span className="text-body-md text-on-surface-variant">
            Submitted on {selectedReview.date}
          </span>
        </div>
        <h3 className="font-headline-md text-headline-md font-semibold text-primary mb-1">
          {selectedReview.product}
        </h3>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px]">person</span>
          </div>
          <span className="font-data-tabular text-data-tabular">{selectedReview.customer}</span>
          <span className="text-outline-variant px-1">•</span>
          <span className="text-body-md text-on-surface-variant">Verified Buyer</span>
        </div>
      </div>
      <div className="flex gap-3">
        <button className="px-4 py-2 border border-border-light rounded-lg text-body-md font-medium text-primary bg-white hover:bg-surface flex items-center gap-2 transition-colors">
          <span className="material-symbols-outlined text-[18px]">delete</span>
          Delete
        </button>
        <button className="px-4 py-2 border border-status-error rounded-lg text-body-md font-medium text-status-error bg-white hover:bg-error-container flex items-center gap-2 transition-colors">
          <span className="material-symbols-outlined text-[18px]">close</span>
          Reject
        </button>
        <button className="px-4 py-2 bg-primary rounded-lg text-body-md font-medium text-on-primary hover:bg-secondary-container hover:text-on-secondary-container flex items-center gap-2 transition-colors">
          <span className="material-symbols-outlined text-[18px]">check</span>
          Approve
        </button>
      </div>
    </div>

    {/* Detail Content (Scrollable) */}
    <div className="flex-1 overflow-y-auto p-6 bg-surface-subtle">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feedback Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* The Review */}
          <div className="bg-white p-6 rounded-xl border border-border-light">
            <div className="flex items-center gap-2 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`material-symbols-outlined text-[24px] ${
                    i < selectedReview.rating ? 'text-status-warning' : 'text-outline-variant'
                  }`}
                  style={{ fontVariationSettings: i < selectedReview.rating ? "'FILL' 1" : undefined }}
                >
                  star
                </span>
              ))}
              <span className="font-title-lg text-title-lg ml-2">{selectedReview.rating}.0</span>
            </div>
            <h4 className="font-title-lg text-title-lg font-semibold text-primary mb-3">
              {selectedReview.title}
            </h4>
            <p className="text-body-lg text-on-surface-variant leading-relaxed">
              {selectedReview.comment}
            </p>
          </div>

          {/* Moderation Panel */}
          <div className="bg-white p-6 rounded-xl border border-border-light border-t-4 border-t-primary">
            <h4 className="font-data-tabular text-data-tabular font-semibold text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
              Moderation Actions
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                  Internal Notes (Not visible to customer)
                </label>
                <textarea
                  className="w-full p-3 border border-border-light rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none h-24"
                  placeholder="Add administrative notes here..."
                ></textarea>
              </div>
              <div>
                <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                  Reason for Rejection (If applicable)
                </label>
                <select className="w-full p-3 border border-border-light rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white">
                  <option value="">Select a reason...</option>
                  <option value="profanity">Contains Profanity</option>
                  <option value="off_topic">Off-topic / Irrelevant</option>
                  <option value="competitor">Mentions Competitor</option>
                  <option value="spam">Spam / Promotional</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">
          {/* Customer Snapshot */}
          <div className="bg-white p-5 rounded-xl border border-border-light">
            <h5 className="text-label-md font-label-md uppercase tracking-wider text-on-surface-variant mb-4 border-b border-border-light pb-2">
              Customer Profile
            </h5>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary font-bold text-title-lg">
                {selectedReview.customerProfile.initials}
              </div>
              <div>
                <div className="font-data-tabular text-data-tabular font-semibold">
                  {selectedReview.customerProfile.name}
                </div>
                <div className="text-body-md text-on-surface-variant">
                  {selectedReview.customerProfile.role}
                </div>
              </div>
            </div>
            <div className="space-y-3 text-body-md">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Total Orders</span>
                <span className="font-medium">{selectedReview.customerProfile.totalOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Total Reviews</span>
                <span className="font-medium">{selectedReview.customerProfile.totalReviews}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Account Status</span>
                <span className="text-status-success font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  {selectedReview.customerProfile.accountStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Product Snapshot */}
          <div className="bg-white p-5 rounded-xl border border-border-light">
            <h5 className="text-label-md font-label-md uppercase tracking-wider text-on-surface-variant mb-4 border-b border-border-light pb-2">
              Product Context
            </h5>
            <div className="flex gap-3 mb-4">
              <div className="w-16 h-16 bg-surface-variant rounded-lg border border-border-light overflow-hidden flex-shrink-0">
                <img
                  alt={selectedReview.productContext.name}
                  className="w-full h-full object-cover"
                  src={selectedReview.productContext.image}
                />
              </div>
              <div>
                <div className="font-data-tabular text-data-tabular font-medium line-clamp-2 mb-1">
                  {selectedReview.productContext.name}
                </div>
                <div className="text-label-md text-on-surface-variant font-mono bg-surface px-1.5 py-0.5 rounded inline-block">
                  SKU: {selectedReview.productContext.sku}
                </div>
              </div>
            </div>
            <div className="bg-surface-subtle p-3 rounded-lg border border-border-light flex items-center justify-between">
              <span className="text-body-md text-on-surface-variant">Overall Rating</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold">{selectedReview.productContext.overallRating}</span>
                <span className="material-symbols-outlined text-status-warning text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
                <span className="text-body-md text-on-surface-variant">
                  ({selectedReview.productContext.totalRatings})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
