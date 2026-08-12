import React, { useEffect, useMemo, useState } from 'react';
import { getReturnRequests } from '@/services/returnRefundApi';
import type { ReturnFilterTab, ReturnRequest } from '@/types/returnRefund';
import ReturnDetail from './components/ReturnDetail';
import ReturnQueue from './components/ReturnQueue';

const ReturnRefund = () => {
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [activeFilter, setActiveFilter] = useState<ReturnFilterTab>('All');
  const [selectedId, setSelectedId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchReturnRequests = async () => {
    try {
      setLoading(true);

      const data = await getReturnRequests();

      setRequests(data);
      setSelectedId((currentId) => currentId || data[0]?.id || '');
    } catch (error) {
      console.error('Get return requests error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturnRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesSearch = [request.id, request.distributor].join(' ').toLowerCase().includes(query);

      if (!matchesSearch) {
        return false;
      }

      if (activeFilter === 'All') {
        return true;
      }

      return request.status === activeFilter;
    });
  }, [activeFilter, requests, searchQuery]);

  const selectedRequest = requests.find((request) => request.id === selectedId) || requests[0];

  if (loading && requests.length === 0) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-on-surface-variant">
        Loading return requests...
      </div>
    );
  }

  if (!selectedRequest) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-on-surface-variant">
        No return requests found.
      </div>
    );
  }

  return (
    <section className="flex-1 flex flex-col md:flex-row overflow-hidden bg-surface-subtle">
      <ReturnQueue
        activeFilter={activeFilter}
        requests={filteredRequests}
        searchQuery={searchQuery}
        selectedId={selectedRequest.id}
        totalRequests={requests}
        onFilterChange={setActiveFilter}
        onSearchChange={setSearchQuery}
        onSelect={setSelectedId}
      />

      <ReturnDetail request={selectedRequest} />
    </section>
  );
};

export default ReturnRefund;
