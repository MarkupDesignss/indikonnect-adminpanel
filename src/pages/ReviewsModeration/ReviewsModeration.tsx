import React from 'react';

// Sample data – move to a separate file later if needed
const reviewList = [
  {
    id: 1,
    product: 'Industrial LED High Bay Light',
    customer: 'Sarah Jenkins',
    date: 'Oct 24, 2023',
    rating: 4,
    status: 'Pending',
    comment:
      'Good quality lights, but the packaging was slightly damaged upon arrival. Installation was straightforward.',
  },
  {
    id: 2,
    product: 'Commercial Grade Extension Cord 50ft',
    customer: 'TechBuild Inc.',
    date: 'Oct 23, 2023',
    rating: 2,
    status: 'Pending',
    comment: '',
  },
  {
    id: 3,
    product: 'Smart Warehouse Sensor Kit v2',
    customer: 'Marcus Cole',
    date: 'Oct 21, 2023',
    rating: 5,
    status: 'Approved',
    comment: '',
  },
];

const selectedReview = {
  id: 1,
  product: 'Industrial LED High Bay Light',
  customer: 'Sarah Jenkins',
  date: 'Oct 24, 2023',
  rating: 4,
  status: 'Pending',
  title: 'Solid performance, minor shipping issue',
  comment:
    'We ordered 50 of these for our new warehouse expansion. The light output is fantastic and exactly what we needed for the high ceilings. Installation was straightforward as advertised. However, I\'m giving 4 stars instead of 5 because about 3 of the boxes arrived pretty banged up. The lights inside were fine, but better protective packaging would be appreciated for bulk orders like this. Will likely order again for phase 2.',
  customerProfile: {
    initials: 'SJ',
    name: 'Sarah Jenkins',
    role: 'Procurement Manager',
    totalOrders: 12,
    totalReviews: 4,
    accountStatus: 'Active',
  },
  productContext: {
    name: 'Industrial LED High Bay Light, 150W',
    sku: 'LGT-HB-150W',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAyIh70qvOins0jht3G3XPO7FYcKwV1kI1VzH77fw4_byxehrdmY4Fh_MlVzS6cO0jlqT_rZP6ng-9OdoGHCnE57AjD40ikooMLoDW8Ba8xh0YNXqJqFPE-mR6rPqXEUTK5NPG8S4tVFLruSJAK6Tny5pjjPMEljrbpEAifRKpCucX9rfpqz5krPY3KLZC6j_cUkCtVthXCdb6TfhcLu-H_tQJuE3G4NzxMnmgfgp9C6Ed-MGwJvlU9iQ',
    overallRating: 4.8,
    totalRatings: 128,
  },
};

const ReviewsModeration = () => {
  // Helper: render stars
  const renderStars = (rating: number, max = 5) => {
    const filled = '★';
    const empty = '☆';
    let stars = '';
    for (let i = 1; i <= max; i++) {
      stars += i <= rating ? filled : empty;
    }
    return stars;
  };

  // Status badge styles
  const getStatusBadge = (status: string) => {
    const base = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border';
    switch (status.toLowerCase()) {
      case 'pending':
        return `${base} bg-amber-100 text-status-warning border-amber-200`;
      case 'approved':
        return `${base} bg-emerald-100 text-status-success border-emerald-200`;
      case 'rejected':
        return `${base} bg-red-100 text-status-error border-red-200`;
      default:
        return `${base} bg-gray-100 text-on-surface-variant border-border-light`;
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden mt-16 p-4 gap-4">
      {/* Left Sidebar – Master List */}
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
          {reviewList.map((review, idx) => {
            const isSelected = idx === 0; // first is selected for demo
            return (
              <div
                key={review.id}
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

      {/* Right Detail Pane */}
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
    </div>
  );
};

export default ReviewsModeration;