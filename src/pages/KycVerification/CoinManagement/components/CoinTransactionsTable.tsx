import React from 'react';

type Tab = 'All Transactions' | 'Redemption History' | 'Expired Coins';

interface Transaction {
  date: string;
  description: string;
  orderRef: string;
  amount: string;
  balance: string;
  type: string;
}

interface Props {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  timeFilter: string;
  setTimeFilter: (val: string) => void;
  typeFilter: string;
  setTypeFilter: (val: string) => void;
  filteredTransactions: Transaction[];
}

export const CoinTransactionsTable: React.FC<Props> = ({
  activeTab, setActiveTab, timeFilter, setTimeFilter, typeFilter, setTypeFilter, filteredTransactions
}) => (
  <div className="bg-surface-container-lowest border border-border-light rounded-xl overflow-hidden mt-8">
    {/* Tabs Header */}
    <div className="border-b border-border-light px-6 py-4 flex gap-6 overflow-x-auto">
      {(['All Transactions', 'Redemption History', 'Expired Coins'] as Tab[]).map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`font-label-md text-label-md pb-2 whitespace-nowrap transition-colors ${
            activeTab === tab
              ? 'text-primary border-b-2 border-primary'
              : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>

    {/* Filter Bar */}
    <div className="px-6 py-4 bg-surface-subtle border-b border-border-light flex flex-wrap gap-3 items-center">
      <select
        className="bg-surface-container-lowest border border-border-light text-on-surface rounded font-body-md text-body-md px-3 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
        value={timeFilter}
        onChange={(e) => setTimeFilter(e.target.value)}
      >
        <option>Last 30 Days</option>
        <option>Last 90 Days</option>
        <option>Year to Date</option>
      </select>
      <select
        className="bg-surface-container-lowest border border-border-light text-on-surface rounded font-body-md text-body-md px-3 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value)}
      >
        <option>All Types</option>
        <option>Earned</option>
        <option>Redeemed</option>
      </select>
    </div>

    {/* Data Table */}
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-primary text-on-primary">
            <th className="font-label-md text-label-md py-3 px-6 whitespace-nowrap">Date</th>
            <th className="font-label-md text-label-md py-3 px-6">Description</th>
            <th className="font-label-md text-label-md py-3 px-6 whitespace-nowrap">Order Ref</th>
            <th className="font-label-md text-label-md py-3 px-6 whitespace-nowrap text-right">Amount</th>
            <th className="font-label-md text-label-md py-3 px-6 whitespace-nowrap text-right">Balance</th>
          </tr>
        </thead>
        <tbody className="font-data-tabular text-data-tabular">
          {filteredTransactions.map((tx, idx) => {
            const isEarned = tx.amount.startsWith('+');
            const isRedeemed = tx.amount.startsWith('-') && tx.type === 'redeemed';
            const isExpired = tx.amount.startsWith('-') && tx.type === 'expired';
            const amountClass = isEarned
              ? 'text-status-success'
              : isRedeemed
              ? 'text-status-error'
              : 'text-status-warning';

            return (
              <tr
                key={idx}
                className={`border-b border-border-light ${
                  idx % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface-subtle'
                } hover:bg-surface-subtle transition-colors`}
              >
                <td className="py-4 px-6 text-on-surface-variant">{tx.date}</td>
                <td className="py-4 px-6 text-on-surface">{tx.description}</td>
                <td className="py-4 px-6 text-on-surface-variant">{tx.orderRef}</td>
                <td className={`py-4 px-6 text-right font-bold ${amountClass}`}>{tx.amount}</td>
                <td className="py-4 px-6 text-on-surface text-right">{tx.balance}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

    {/* Pagination */}
    <div className="px-6 py-4 flex justify-between items-center border-t border-border-light bg-surface-container-lowest">
      <span className="font-data-tabular text-data-tabular text-on-surface-variant">
        Showing 1-{filteredTransactions.length} of 128 transactions
      </span>
      <div className="flex gap-2">
        <button className="p-1 border border-border-light rounded text-on-surface-variant hover:border-primary disabled:opacity-50">
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>
        <button className="p-1 border border-border-light rounded text-on-surface-variant hover:border-primary">
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>
      </div>
    </div>
  </div>
);
