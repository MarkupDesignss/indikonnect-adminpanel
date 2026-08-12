import React, { useEffect, useMemo, useState } from 'react';
import { getDistributors } from '@/services/wholesaleApi';
import type { Distributor, DistributorTab } from '@/types/wholesale';
import DistributorDetail from './components/DistributorDetail';
import DistributorList from './components/DistributorList';

const Distributors = () => {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<DistributorTab>('Profile Details');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchDistributors = async () => {
    try {
      setLoading(true);

      const data = await getDistributors();

      setDistributors(data);
      setSelectedId((currentId) => currentId || data[0]?.id || '');
    } catch (error) {
      console.error('Get distributors error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistributors();
  }, []);

  const filteredDistributors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return distributors;
    }

    return distributors.filter((distributor) =>
      [distributor.name, distributor.id, distributor.location, distributor.rank, distributor.status]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [distributors, searchQuery]);

  const selectedDistributor =
    distributors.find((distributor) => distributor.id === selectedId) || distributors[0];

  if (loading && distributors.length === 0) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-on-surface-variant">
        Loading distributors...
      </div>
    );
  }

  if (!selectedDistributor) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-on-surface-variant">
        No distributors found.
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-max-width w-full mx-auto flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] overflow-hidden">
      <DistributorList
        distributors={filteredDistributors}
        selectedId={selectedDistributor.id}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelect={setSelectedId}
      />

      <DistributorDetail
        distributor={selectedDistributor}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
};

export default Distributors;
