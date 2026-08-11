import React, { useEffect, useMemo, useState } from 'react';
import { getBuyBackRequests } from '@/services/buyBackApi';
import type { BuyBackFilterTab, BuyBackRequest } from '@/types/buyBack';
import BuyBackDetail from './BuyBackDetail';
import BuyBackRequestList from './BuyBackRequestList';
import { buyBackFilterStatusMap } from './buyBackStatus';

const BuyBack = () => {
  const [requests, setRequests] = useState<BuyBackRequest[]>([]);
  const [activeTab, setActiveTab] = useState<BuyBackFilterTab>('All');
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchBuyBackRequests = async () => {
    try {
      setLoading(true);

      const data = await getBuyBackRequests();

      setRequests(data);
      setSelectedId((currentId) => currentId || data[0]?.id || '');
    } catch (error) {
      console.error('Get buyback requests error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyBackRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    const status = buyBackFilterStatusMap[activeTab];

    if (!status) {
      return requests;
    }

    return requests.filter((request) => request.status === status);
  }, [activeTab, requests]);

  const selectedRequest = requests.find((request) => request.id === selectedId) || requests[0];

  if (loading && requests.length === 0) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-on-surface-variant">
        Loading buyback requests...
      </div>
    );
  }

  if (!selectedRequest) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-on-surface-variant">
        No buyback requests found.
      </div>
    );
  }

  return (
    <section className="flex-1 overflow-hidden flex gap-6">
      <BuyBackRequestList
        activeTab={activeTab}
        requests={filteredRequests}
        selectedId={selectedRequest.id}
        onFilterChange={setActiveTab}
        onSelect={setSelectedId}
      />

      <BuyBackDetail request={selectedRequest} />
    </section>
  );
};

export default BuyBack;
