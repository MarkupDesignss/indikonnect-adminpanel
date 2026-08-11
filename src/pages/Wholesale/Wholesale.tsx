import React, { useEffect, useMemo, useState } from 'react';
import { getWholesaleCustomers } from '@/services/wholesaleApi';
import type { CustomerFilter, CustomerTab, WholesaleCustomer } from '@/types/wholesale';
import CustomerDetail from './CustomerDetail';
import CustomerList from './CustomerList';

const Wholesale = () => {
  const [customers, setCustomers] = useState<WholesaleCustomer[]>([]);
  const [selectedId, setSelectedId] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<CustomerTab>('Details');
  const [filter, setFilter] = useState<CustomerFilter>('All');
  const [loading, setLoading] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      const data = await getWholesaleCustomers();

      setCustomers(data);
      setSelectedId((currentId) => currentId || data[0]?.id || 0);
    } catch (error) {
      console.error('Get wholesale customers error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    if (filter === 'All') {
      return customers;
    }

    return customers.filter((customer) => customer.status === filter);
  }, [customers, filter]);

  const selectedCustomer = customers.find((customer) => customer.id === selectedId) || customers[0];

  if (loading && customers.length === 0) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-on-surface-variant">
        Loading customers...
      </div>
    );
  }

  if (!selectedCustomer) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-on-surface-variant">
        No wholesale customers found.
      </div>
    );
  }

  return (
    <section className="flex-1 flex gap-6 h-full">
      <CustomerList
        customers={filteredCustomers}
        filter={filter}
        selectedId={selectedCustomer.id}
        onFilterChange={setFilter}
        onSelect={setSelectedId}
      />

      <CustomerDetail
        customer={selectedCustomer}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </section>
  );
};

export default Wholesale;
