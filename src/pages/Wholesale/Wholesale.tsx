import React, { useState } from 'react';

// Sample data – replace with API later
const customers = [
  {
    id: 1,
    name: 'Sarah Jenkins',
    company: 'Eco-Friendly Goods Co.',
    email: 'sarah.j@ecogoods.com',
    phone: '+1 (555) 123-4567',
    status: 'Active',
    since: 'Oct 12, 2022',
    taxId: 'FR1234567890',
    rep: { initials: 'AK', name: 'Alex Kramer' },
    financials: { lifetimeValue: '$45,280', aov: '$1,886', creditLimit: '$15,000', availableCredit: '$12,500' },
    orders: [
      { id: '#ORD-0922A', date: 'Oct 24, 2023', total: '$2,450.00', status: 'Fulfilled' },
      { id: '#ORD-0815B', date: 'Sep 15, 2023', total: '$1,120.50', status: 'Fulfilled' },
    ],
    initials: 'SJ',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-8BA5s9euiOrQHhj_Dwc8KmoX2jKNqYxzYoWxPXsB7e78_TDXIHZD34wXPr5DLnizZdNGNfZOh44EJI4Engp6nHZuiP71p-ScmgHxyCzWHGwAosj0S3MINMXZ5IfTjJ29iySzDR6ZJ3K7LCgJqalgg6GccQwtmQONjZGfza59xIv9WYVgNYZ2oiItAJgSVdSXlYZ1CRIt7cEtFl68fdEoyKZd1zsmt1C7csN40Esho77poTvGTRNmXA',
  },
  {
    id: 2,
    name: 'Michael Chen',
    company: 'Urban Lifestyle Supply',
    email: 'michael.c@urbanlife.com',
    phone: '+1 (555) 987-6543',
    status: 'Pending',
    since: 'Jan 5, 2023',
    taxId: 'FR9876543210',
    rep: { initials: 'MC', name: 'Maria Costa' },
    financials: { lifetimeValue: '$450', aov: '$450', creditLimit: '$5,000', availableCredit: '$4,500' },
    orders: [
      { id: '#ORD-0012C', date: 'Jan 10, 2023', total: '$450.00', status: 'Fulfilled' },
    ],
    initials: 'MC',
    avatar: '',
  },
];

type Tab = 'Details' | 'Addresses' | 'Orders' | 'Wishlist';

const Wholesale = () => {
  const [selectedId, setSelectedId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<Tab>('Details');
  const [filter, setFilter] = useState<'All' | 'Active' | 'Pending'>('All');

  const selected = customers.find((c) => c.id === selectedId) || customers[0];

  // Filter customers based on selected filter
  const filteredCustomers = customers.filter((c) => {
    if (filter === 'All') return true;
    return c.status === filter;
  });

  return (
    <section className="flex-1 flex gap-6">
      {/* Left Column: Master List */}
      <div className="w-full md:w-[400px] lg:w-[450px] flex flex-col bg-surface-container-lowest rounded-xl border border-border-light overflow-hidden">
        {/* List Header */}
        <div className="p-5 border-b border-border-light shrink-0">
          <h2 className="text-title-lg font-title-lg text-primary">Customers</h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">
            Manage your wholesale relationships
          </p>
          <div className="mt-4 flex gap-2 overflow-x-auto hide-scrollbar">
            {(['All', 'Active', 'Pending'] as const).map((label) => (
              <button
                key={label}
                onClick={() => setFilter(label)}
                className={`px-3 py-1.5 rounded-lg text-label-md font-label-md whitespace-nowrap transition-colors ${
                  filter === label
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-subtle border border-border-light text-on-surface hover:bg-surface-variant'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto">
          {filteredCustomers.map((customer) => {
            const isActive = customer.id === selectedId;
            return (
              <div
                key={customer.id}
                onClick={() => setSelectedId(customer.id)}
                className={`p-4 border-b border-border-light cursor-pointer transition-colors flex items-start gap-3 ${
                  isActive ? 'bg-surface-container-low' : 'hover:bg-surface-container-low'
                }`}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-variant shrink-0 flex items-center justify-center text-on-surface-variant font-bold">
                  {customer.avatar ? (
                    <img className="w-full h-full object-cover" src={customer.avatar} alt={customer.name} />
                  ) : (
                    customer.initials
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="text-body-lg font-body-lg font-medium text-primary truncate">
                      {customer.name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        customer.status === 'Active'
                          ? 'bg-status-success/10 text-status-success'
                          : 'bg-status-warning/10 text-status-warning'
                      }`}
                    >
                      {customer.status}
                    </span>
                  </div>
                  <p className="text-label-md font-label-md text-on-surface-variant truncate">
                    {customer.company}
                  </p>
                  <div className="mt-2 flex gap-4 text-data-tabular font-data-tabular text-on-surface-variant">
                    <span>{customer.orders.length} Orders</span>
                    <span>
                      {customer.financials.lifetimeValue} YTD
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Detail View */}
      <div className="hidden md:flex flex-1 flex-col bg-surface-container-lowest rounded-xl border border-border-light overflow-hidden relative">
        {/* Top Accent Bar */}
        <div className="h-1 bg-secondary-container w-full absolute top-0 left-0"></div>

        {/* Detail Header */}
        <div className="p-6 border-b border-border-light shrink-0 pt-8 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-variant shrink-0 border border-border-light shadow-sm flex items-center justify-center text-2xl font-bold text-primary">
              {selected.avatar ? (
                <img className="w-full h-full object-cover" src={selected.avatar} alt={selected.name} />
              ) : (
                selected.initials
              )}
            </div>
            <div>
              <h2 className="text-headline-md font-headline-md text-primary leading-tight">
                {selected.name}
              </h2>
              <p className="text-body-lg font-body-lg text-on-surface-variant">{selected.company}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="material-symbols-outlined text-on-surface-variant text-[16px]">mail</span>
                <span className="text-data-tabular font-data-tabular text-on-surface-variant">{selected.email}</span>
                <span className="w-1 h-1 rounded-full bg-outline-variant mx-1"></span>
                <span className="material-symbols-outlined text-on-surface-variant text-[16px]">call</span>
                <span className="text-data-tabular font-data-tabular text-on-surface-variant">{selected.phone}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-surface-subtle border border-primary text-primary rounded-xl text-label-md font-label-md hover:bg-surface-variant transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">chat</span> Message
            </button>
            <button className="px-4 py-2 bg-primary text-on-primary rounded-xl text-label-md font-label-md hover:bg-secondary-container hover:text-on-secondary-container transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">edit</span> Edit
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-border-light flex gap-6 shrink-0">
          {(['Details', 'Addresses', 'Orders', 'Wishlist'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 font-label-md text-label-md uppercase tracking-wide transition-colors ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-secondary'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Detail Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface-subtle/50">
          {activeTab === 'Details' && (
            <div className="grid grid-cols-2 gap-6">
              {/* Account Overview Card */}
              <div className="bg-surface-container-lowest p-5 rounded-xl border border-border-light">
                <h3 className="text-title-lg font-title-lg text-primary mb-4">Account Overview</h3>
                <div className="space-y-4">
                  <div>
                    <span className="block text-label-md font-label-md text-on-surface-variant mb-1">Status</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          selected.status === 'Active'
                            ? 'bg-status-success/10 text-status-success'
                            : 'bg-status-warning/10 text-status-warning'
                        }`}
                      >
                        {selected.status}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer ml-auto">
                        <input checked={selected.status === 'Active'} className="sr-only peer" type="checkbox" readOnly />
                        <div className="w-9 h-5 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>
                  <hr className="border-border-light" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-label-md font-label-md text-on-surface-variant mb-1">Customer Since</span>
                      <span className="text-data-tabular font-data-tabular text-primary">{selected.since}</span>
                    </div>
                    <div>
                      <span className="block text-label-md font-label-md text-on-surface-variant mb-1">Tax ID / VAT</span>
                      <span className="text-data-tabular font-data-tabular text-primary">{selected.taxId}</span>
                    </div>
                  </div>
                  <hr className="border-border-light" />
                  <div>
                    <span className="block text-label-md font-label-md text-on-surface-variant mb-1">Assigned Rep</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-6 h-6 rounded-full bg-surface-variant flex items-center justify-center text-[10px] font-bold">
                        {selected.rep.initials}
                      </div>
                      <span className="text-body-md font-body-md text-primary">{selected.rep.name}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Summary Card */}
              <div className="bg-surface-container-lowest p-5 rounded-xl border border-border-light">
                <h3 className="text-title-lg font-title-lg text-primary mb-4">Financials</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-surface-subtle p-3 rounded-lg border border-border-light">
                    <span className="block text-label-md font-label-md text-on-surface-variant mb-1">Lifetime Value</span>
                    <span className="text-headline-md font-headline-md text-primary">{selected.financials.lifetimeValue}</span>
                  </div>
                  <div className="bg-surface-subtle p-3 rounded-lg border border-border-light">
                    <span className="block text-label-md font-label-md text-on-surface-variant mb-1">AOV</span>
                    <span className="text-headline-md font-headline-md text-primary">{selected.financials.aov}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-body-md font-body-md text-on-surface-variant">Credit Limit</span>
                    <span className="text-data-tabular font-data-tabular text-primary">{selected.financials.creditLimit}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-body-md font-body-md text-on-surface-variant">Available Credit</span>
                    <span className="text-data-tabular font-data-tabular text-status-success font-bold">
                      {selected.financials.availableCredit}
                    </span>
                  </div>
                  <div className="w-full bg-surface-variant rounded-full h-1.5 mt-2">
                    <div
                      className="bg-primary h-1.5 rounded-full"
                      style={{
                        width: `${(parseFloat(selected.financials.availableCredit.replace(/[$,]/g, '')) /
                          parseFloat(selected.financials.creditLimit.replace(/[$,]/g, ''))) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Addresses' && (
            <div className="bg-surface-container-lowest p-5 rounded-xl border border-border-light">
              <h3 className="text-title-lg font-title-lg text-primary mb-4">Addresses</h3>
              <p className="text-on-surface-variant">Address details will appear here.</p>
            </div>
          )}

          {activeTab === 'Orders' && (
            <div className="bg-surface-container-lowest rounded-xl border border-border-light overflow-hidden">
              <div className="p-4 border-b border-border-light flex justify-between items-center">
                <h3 className="text-title-lg font-title-lg text-primary">Recent Orders</h3>
                <button className="text-label-md font-label-md text-on-surface-variant hover:text-primary transition-colors">
                  View All
                </button>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-primary text-on-primary">
                    <th className="px-4 py-2 text-label-md font-label-md uppercase tracking-wider font-medium">Order ID</th>
                    <th className="px-4 py-2 text-label-md font-label-md uppercase tracking-wider font-medium">Date</th>
                    <th className="px-4 py-2 text-label-md font-label-md uppercase tracking-wider font-medium">Total</th>
                    <th className="px-4 py-2 text-label-md font-label-md uppercase tracking-wider font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="text-data-tabular font-data-tabular">
                  {selected.orders.map((order, idx) => (
                    <tr
                      key={order.id}
                      className={`border-b border-border-light hover:bg-surface-subtle transition-colors ${
                        idx % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface-subtle'
                      }`}
                    >
                      <td className="px-4 py-3 text-primary font-medium">{order.id}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{order.date}</td>
                      <td className="px-4 py-3 text-primary">{order.total}</td>
                      <td className="px-4 py-3">
                        <span className="bg-status-success/10 text-status-success px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'Wishlist' && (
            <div className="bg-surface-container-lowest p-5 rounded-xl border border-border-light">
              <h3 className="text-title-lg font-title-lg text-primary mb-4">Wishlist</h3>
              <p className="text-on-surface-variant">Wishlist items will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Wholesale;