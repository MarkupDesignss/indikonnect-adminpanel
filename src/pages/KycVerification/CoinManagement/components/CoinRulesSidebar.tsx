import React from 'react';

export const CoinRulesSidebar: React.FC = () => (
  <div className="lg:col-span-4 space-y-6">
    {/* Coin Rules Panel */}
    <div className="bg-surface-container-lowest border border-border-light rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          info
        </span>
        <h3 className="font-title-lg text-title-lg text-primary">Coin Rules &amp; Value</h3>
      </div>
      <div className="space-y-6">
        <div className="bg-surface-subtle p-4 rounded-lg border border-border-light">
          <p className="font-label-md text-label-md text-on-surface-variant uppercase mb-2">Earning Rate</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-md text-headline-md text-on-surface">1 Coin</span>
            <span className="font-body-md text-body-md text-on-surface-variant">per</span>
            <span className="font-headline-md text-headline-md text-on-surface">$10 Spent</span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2 text-sm">
            Earned on all standard wholesale orders. Excludes shipping and taxes.
          </p>
        </div>
        <div className="bg-surface-subtle p-4 rounded-lg border border-border-light">
          <p className="font-label-md text-label-md text-on-surface-variant uppercase mb-2">Redemption Value</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-md text-headline-md text-on-surface">100 Coins</span>
            <span className="font-body-md text-body-md text-on-surface-variant">=</span>
            <span className="font-headline-md text-headline-md text-status-success font-bold">$1 Discount</span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2 text-sm">
            Can be applied at checkout for future orders. Minimum redemption: 500 coins.
          </p>
        </div>
        <hr className="border-border-light" />
        <div>
          <p className="font-label-md text-label-md text-on-surface-variant uppercase mb-2">Expiration Policy</p>
          <p className="font-body-md text-body-md text-on-surface">
            Coins expire <strong className="font-semibold">365 days</strong> after they are earned if no new activity
            occurs on the account.
          </p>
        </div>
      </div>
    </div>

    {/* Promotional / Status Card */}
    <div className="bg-primary text-on-primary rounded-xl p-6 relative overflow-hidden shadow-lg">
      <div className="absolute -right-10 -top-10 opacity-10 pointer-events-none">
        <span className="material-symbols-outlined text-[150px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          star
        </span>
      </div>
      <h4 className="font-title-lg text-title-lg mb-2 relative z-10">Gold Tier Status</h4>
      <p className="font-body-md text-body-md text-primary-fixed-dim mb-4 relative z-10">
        You are earning a 15% bonus on all coin generation this quarter.
      </p>
      <div className="w-full bg-surface-tint rounded-full h-2 mb-2 relative z-10">
        <div className="bg-secondary-container h-2 rounded-full" style={{ width: '75%' }}></div>
      </div>
      <p className="font-data-tabular text-data-tabular text-primary-fixed-dim text-xs relative z-10">
        2,500 more coins to Platinum Tier
      </p>
    </div>
  </div>
);
