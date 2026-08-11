import React from 'react';

export const CoinSummaryCards: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {/* Total Balance */}
    <div className="bg-surface-container-lowest border border-border-light rounded-xl p-6 relative overflow-hidden md:col-span-2">
      <div className="absolute top-0 left-0 w-full h-1 bg-secondary-container"></div>
      <div className="flex justify-between items-start">
        <div>
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
            Total Coin Balance
          </p>
          <h3 className="font-display-lg text-display-lg text-primary">25,400</h3>
        </div>
        <div className="bg-surface-subtle p-3 rounded-full">
          <span className="material-symbols-outlined text-secondary-container text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            toll
          </span>
        </div>
      </div>
      <div className="mt-6 flex items-center text-status-success font-data-tabular text-data-tabular">
        <span className="material-symbols-outlined text-[16px] mr-1">trending_up</span>
        +1,200 this month
      </div>
    </div>

    {/* Secondary Metrics */}
    <div className="space-y-6 md:col-span-1 flex flex-col">
      <div className="bg-surface-container-lowest border border-border-light rounded-xl p-5 flex-1">
        <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
          Pending Coins
        </p>
        <h4 className="font-headline-md text-headline-md text-on-surface mt-1">3,150</h4>
        <p className="font-data-tabular text-data-tabular text-on-surface-variant mt-2 text-xs">
          Clearing in 3-5 days
        </p>
      </div>
      <div className="bg-surface-container-lowest border border-border-light rounded-xl p-5 flex-1 relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-status-warning rounded-l-xl"></div>
        <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1 pl-2">
          Expiring Soon
        </p>
        <h4 className="font-headline-md text-headline-md text-status-warning mt-1 pl-2">850</h4>
        <p className="font-data-tabular text-data-tabular text-on-surface-variant mt-2 pl-2 text-xs">
          Within 30 days
        </p>
      </div>
    </div>
  </div>
);
