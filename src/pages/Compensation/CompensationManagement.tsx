import React from 'react';

const CompensationManagement = () => {
  // Static data – later replace with API calls
  const recentTransactions = [
    {
      date: 'Nov 02, 2023',
      source: 'ORD-9921',
      type: 'Direct Sales',
      amount: '$450.00',
      status: 'Cleared',
      statusClass: 'bg-status-success/10 text-status-success',
    },
    {
      date: 'Nov 01, 2023',
      source: 'Q3 Performance',
      type: 'Bonus',
      amount: '$1,200.00',
      status: 'Pending',
      statusClass: 'bg-status-warning/10 text-status-warning',
    },
    {
      date: 'Oct 28, 2023',
      source: 'TEAM-NW-Alpha',
      type: 'Team Override',
      amount: '$340.50',
      status: 'Cleared',
      statusClass: 'bg-status-success/10 text-status-success',
    },
  ];

  return (
    <section className="p-8 max-w-full mx-auto min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">
            Compensation Management
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Track earnings, commissions, and payout schedules.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="bg-surface-container-lowest border border-border-light text-on-surface font-body-md text-body-md py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Reports
          </button>
        </div>
      </div>

      {/* High-Level Metrics Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface-container-lowest border border-border-light rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-secondary-container"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-surface-container rounded-lg">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                account_balance_wallet
              </span>
            </div>
            <span className="bg-status-success/10 text-status-success font-label-md text-label-md py-1 px-2 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 12.5%
            </span>
          </div>
          <h3 className="font-body-md text-body-md text-on-surface-variant mb-1">Total Earnings (YTD)</h3>
          <p className="font-display-lg text-display-lg text-on-surface">$142,500.00</p>
        </div>

        <div className="bg-surface-container-lowest border border-border-light rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-status-warning"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-surface-container rounded-lg">
              <span className="material-symbols-outlined text-status-warning" style={{ fontVariationSettings: "'FILL' 1" }}>
                pending_actions
              </span>
            </div>
          </div>
          <h3 className="font-body-md text-body-md text-on-surface-variant mb-1">Pending Payments</h3>
          <p className="font-headline-lg text-headline-lg text-on-surface mb-2">$8,450.00</p>
          <p className="font-body-md text-body-md text-status-warning flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">info</span> Clears in 3-5 days
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-border-light rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-surface-container rounded-lg">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                event_upcoming
              </span>
            </div>
          </div>
          <h3 className="font-body-md text-body-md text-on-surface-variant mb-1">Next Payout</h3>
          <p className="font-headline-lg text-headline-lg text-on-surface mb-2">Nov 15, 2023</p>
          <p className="font-body-md text-body-md text-on-surface-variant">Estimated: $12,300.00</p>
        </div>
      </div>

      {/* Main Grid: Table + Side Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Tab Navigation & Table */}
        <div className="lg:col-span-2 space-y-8">
          {/* Tab Navigation (static) */}
          <div className="border-b border-border-light flex gap-6">
            <button className="pb-3 border-b-2 border-secondary font-title-lg text-title-lg text-primary">
              Commission History
            </button>
            <button className="pb-3 border-b-2 border-transparent font-title-lg text-title-lg text-on-surface-variant hover:text-on-surface">
              Payouts
            </button>
            <button className="pb-3 border-b-2 border-transparent font-title-lg text-title-lg text-on-surface-variant hover:text-on-surface">
              Bonuses
            </button>
          </div>

          {/* Recent Transactions Table */}
          <div className="bg-surface-container-lowest border border-border-light rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border-light bg-surface-subtle flex justify-between items-center">
              <h3 className="font-headline-md text-headline-md text-on-surface">Recent Transactions</h3>
              <button className="p-1 text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">filter_list</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-data-tabular text-data-tabular">
                <thead className="bg-primary text-on-primary">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Source (Order ID)</th>
                    <th className="py-3 px-4 font-semibold">Type</th>
                    <th className="py-3 px-4 font-semibold text-right">Amount</th>
                    <th className="py-3 px-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-border-light ${
                        idx % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface-subtle'
                      } hover:bg-surface transition-colors`}
                    >
                      <td className="py-3 px-4 text-on-surface-variant">{tx.date}</td>
                      <td className="py-3 px-4 text-primary font-medium">{tx.source}</td>
                      <td className="py-3 px-4 text-on-surface-variant">{tx.type}</td>
                      <td className="py-3 px-4 text-right text-on-surface font-semibold">{tx.amount}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block ${tx.statusClass} py-1 px-2 rounded-full text-[11px] font-bold uppercase tracking-wider`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Commission Rules & Bonus Tracker */}
        <div className="space-y-6">
          {/* Commission Rules */}
          <div className="bg-surface-container-lowest border border-border-light rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                rule
              </span>
              <h3 className="font-title-lg text-title-lg text-on-surface">Commission Rules</h3>
            </div>
            <ul className="space-y-4">
              <li className="flex justify-between items-center border-b border-border-light pb-2">
                <span className="font-body-md text-body-md text-on-surface-variant">Direct Wholesale</span>
                <span className="font-label-md text-label-md text-primary bg-surface-container py-1 px-2 rounded">15%</span>
              </li>
              <li className="flex justify-between items-center border-b border-border-light pb-2">
                <span className="font-body-md text-body-md text-on-surface-variant">Team Overrides</span>
                <span className="font-label-md text-label-md text-primary bg-surface-container py-1 px-2 rounded">3 - 5%</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="font-body-md text-body-md text-on-surface-variant">Enterprise Deals</span>
                <span className="font-label-md text-label-md text-primary bg-surface-container py-1 px-2 rounded">Custom</span>
              </li>
            </ul>
          </div>

          {/* Q4 Bonus Tracker */}
          <div className="bg-surface-container-lowest border border-border-light rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                military_tech
              </span>
              <h3 className="font-title-lg text-title-lg text-on-surface">Q4 Bonus Tracker</h3>
            </div>
            <div className="mb-2 flex justify-between font-body-md text-body-md">
              <span className="text-on-surface-variant">Volume Goal</span>
              <span className="text-on-surface font-semibold">$75k / $100k</span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-2.5 mb-4">
              <div className="bg-secondary-container h-2.5 rounded-full" style={{ width: '75%' }}></div>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant text-sm">
              $25k remaining to unlock 2% retroactive bonus.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompensationManagement;