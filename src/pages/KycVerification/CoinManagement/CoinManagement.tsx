import React, { useState, useMemo } from 'react';
import { getCoinTransactions } from '../../../services/coinManagementService';

import { CoinSummaryCards } from './components/CoinSummaryCards';
import { CoinTransactionsTable } from './components/CoinTransactionsTable';
import { CoinRulesSidebar } from './components/CoinRulesSidebar';

type Tab = 'All Transactions' | 'Redemption History' | 'Expired Coins';

const CoinManagement = () => {
  const transactions = useMemo(() => getCoinTransactions(), []);

  const [activeTab, setActiveTab] = useState<Tab>('All Transactions');
  const [timeFilter, setTimeFilter] = useState('Last 30 Days');
  const [typeFilter, setTypeFilter] = useState('All Types');

  // Filter transactions by tab
  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab === 'All Transactions') return true;
    if (activeTab === 'Redemption History') return tx.type === 'redeemed';
    if (activeTab === 'Expired Coins') return tx.type === 'expired';
    return true;
  });

  return (
    <section className="flex-1 overflow-x-hidden">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">Loyalty Coins</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
            Manage wholesale loyalty balances and track transaction history.
          </p>
        </div>
        <button className="bg-surface-container-lowest border border-border-light text-on-surface hover:border-primary px-6 py-2 rounded-lg font-label-md text-label-md flex items-center transition-all">
          <span className="material-symbols-outlined mr-2 text-[18px]">download</span>
          Export Coin Report
        </button>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Main Canvas (Left 8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          <CoinSummaryCards />

          <CoinTransactionsTable
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            filteredTransactions={filteredTransactions}
          />
        </div>

        {/* Right Sidebar (4 cols) */}
        <CoinRulesSidebar />
      </div>
    </section>
  );
};

export default CoinManagement;