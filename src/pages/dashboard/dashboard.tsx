import React from 'react';

const Dashboard = () => {
  // ----- Data definitions (same as before) -----
  const metrics = [
    {
      label: 'Total Sales',
      value: '$24,500',
      icon: 'attach_money',
      trendIcon: 'trending_up',
      change: '+12.5%',
      note: 'vs last week',
      toneClass: 'text-status-success',
      featured: true,
    },
    { label: 'Orders', value: '156', icon: 'shopping_cart', trendIcon: 'trending_up', change: '+8.2%', toneClass: 'text-status-success' },
    { label: 'Customers', value: '89', icon: 'groups', trendIcon: 'trending_flat', change: '+2.1%', toneClass: 'text-status-warning' },
    { label: 'Distributors', value: '12', icon: 'local_shipping', trendIcon: 'trending_up', change: '+1', toneClass: 'text-status-success' },
    { label: 'Revenue', value: '$18,200', icon: 'account_balance_wallet', trendIcon: 'trending_down', change: '-3.4%', toneClass: 'text-status-error' },
  ];

  const chartDays = [
    { day: 'Mon', height: 'h-[40%]', isCurrent: false },
    { day: 'Tue', height: 'h-[60%]', isCurrent: false },
    { day: 'Wed', height: 'h-[30%]', isCurrent: false },
    { day: 'Thu', height: 'h-[80%]', isCurrent: false },
    { day: 'Fri', height: 'h-[100%]', isCurrent: true, value: '$6,200' },
    { day: 'Sat', height: 'h-[50%]', isCurrent: false },
    { day: 'Sun', height: 'h-[70%]', isCurrent: false },
  ];

  const recentOrders = [
    { id: '#ORD-092', customer: 'Apex Dist.', total: '$1,240', status: 'Pending', badgeClass: 'bg-status-warning/20 text-status-warning' },
    { id: '#ORD-091', customer: 'Nexus Goods', total: '$850', status: 'Shipped', badgeClass: 'bg-primary/10 text-primary' },
    { id: '#ORD-090', customer: 'Global Tech', total: '$3,100', status: 'Delivered', badgeClass: 'bg-status-success/20 text-status-success' },
    { id: '#ORD-089', customer: 'Prime Retail', total: '$420', status: 'Delivered', badgeClass: 'bg-status-success/20 text-status-success' },
    { id: '#ORD-088', customer: 'Alpha Corp', total: '$2,150', status: 'Shipped', badgeClass: 'bg-primary/10 text-primary' },
  ];

  const kycReviews = [
    ['Meridian Traders', 'Submitted 2 hours ago'],
    ['Zenith Wholesale', 'Submitted 5 hours ago'],
    ['Summit Supplies', 'Submitted 1 day ago'],
  ];

  const inventoryAlerts = [
    { name: 'Widget Pro Max', stock: '3 left', toneClass: 'text-status-error' },
    { name: 'Standard Gizmo', stock: '12 left', toneClass: 'text-status-warning' },
    { name: 'Premium Case', stock: 'Out of stock', toneClass: 'text-status-error' },
  ];

  const tickets = [
    { title: 'Shipping Delay Inquiry', source: 'From: Apex Dist. (Ticket #4092)', time: '10m ago', status: 'Urgent', badgeClass: 'bg-status-error/10 text-status-error' },
    { title: 'Invoice Discrepancy', source: 'From: Nexus Goods (Ticket #4091)', time: '2h ago', status: 'Open', badgeClass: 'bg-surface-dim text-on-surface-variant' },
  ];

  // ----- Render -----
  return (
    <div className="space-y-8">
      {/* Mobile page header */}
      <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:hidden">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-surface-container-lowest border border-border-light rounded-lg p-4 relative overflow-hidden"
          >
            {metric.featured && <div className="absolute top-0 left-0 w-full h-1 bg-secondary-container"></div>}
            <div className="flex justify-between items-start mb-2">
              <span className="text-on-surface-variant font-label-md text-label-md">{metric.label}</span>
              <span className="material-symbols-outlined text-outline text-sm">{metric.icon}</span>
            </div>
            <div className="font-headline-md text-headline-md text-on-surface mb-1">{metric.value}</div>
            <div className={`flex items-center font-label-md text-label-md ${metric.toneClass}`}>
              <span className="material-symbols-outlined text-sm mr-1">{metric.trendIcon}</span>
              <span>{metric.change}</span>
              {metric.note && <span className="text-on-surface-variant ml-1 font-normal text-xs">{metric.note}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Analytics & Recent Orders */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Sales Analytics */}
        <div className="xl:col-span-2 bg-surface-container-lowest border border-border-light rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-title-lg text-title-lg text-on-surface">Sales Analytics</h2>
            <select className="bg-surface border border-border-light rounded text-sm px-2 py-1 text-on-surface-variant focus:outline-none focus:border-primary" defaultValue="This Week">
              <option>This Week</option>
              <option>Last Week</option>
              <option>This Month</option>
            </select>
          </div>
          <div className="h-64 w-full bg-surface-subtle flex items-end justify-between px-4 pb-4 border-b border-border-light relative pt-8">
            {chartDays.map(({ day, height, isCurrent, value }) => (
              <div
                key={day}
                className={`w-1/12 transition-colors rounded-t-sm ${height} ${
                  isCurrent ? 'bg-primary hover:bg-secondary-container relative group' : 'bg-primary-fixed hover:bg-secondary-container'
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-on-surface text-surface-container-lowest text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {value}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-on-surface-variant px-4">
            {chartDays.map(({ day }) => (
              <span key={day}>{day}</span>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-surface-container-lowest border border-border-light rounded-lg flex flex-col h-full">
          <div className="p-4 border-b border-border-light flex justify-between items-center">
            <h2 className="font-title-lg text-title-lg text-on-surface">Recent Orders</h2>
            <a className="text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
              View All
            </a>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-primary text-on-primary font-data-tabular text-data-tabular">
                <tr>
                  <th className="p-3 font-medium">Order ID</th>
                  <th className="p-3 font-medium">Customer</th>
                  <th className="p-3 font-medium">Total</th>
                  <th className="p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="font-data-tabular text-data-tabular text-on-surface">
                {recentOrders.map((order, idx) => (
                  <tr key={order.id} className={idx % 2 === 0 ? 'bg-surface-subtle border-b border-border-light' : 'bg-surface-container-lowest border-b border-border-light'}>
                    <td className="p-3">{order.id}</td>
                    <td className="p-3 truncate max-w-[100px]">{order.customer}</td>
                    <td className="p-3">{order.total}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${order.badgeClass}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Two‑Column Grid (Secondary Info) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-8">
        {/* Left Column: KYC & Inventory Alerts */}
        <div className="space-y-8">
          {/* Pending KYC */}
          <div className="bg-surface-container-lowest border border-border-light rounded-lg p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-status-warning"></div>
            <h3 className="font-title-lg text-title-lg text-on-surface mb-4 flex items-center">
              <span className="material-symbols-outlined mr-2 text-status-warning">verified_user</span>
              Pending KYC Reviews
            </h3>
            <ul className="space-y-3">
              {kycReviews.map(([name, time]) => (
                <li key={name} className="flex justify-between items-center p-3 border border-border-light rounded bg-surface-subtle">
                  <div>
                    <div className="font-medium text-sm">{name}</div>
                    <div className="text-xs text-on-surface-variant">{time}</div>
                  </div>
                  <button className="bg-surface-container-lowest border border-primary text-primary px-3 py-1 rounded text-xs font-medium hover:bg-surface-subtle transition-colors">
                    Review
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Inventory Alerts */}
          <div className="bg-surface-container-lowest border border-border-light rounded-lg p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-status-error"></div>
            <h3 className="font-title-lg text-title-lg text-on-surface mb-4 flex items-center">
              <span className="material-symbols-outlined mr-2 text-status-error">warning</span>
              Inventory Alerts
            </h3>
            <div className="space-y-3 text-sm">
              {inventoryAlerts.map(({ name, stock, toneClass }, idx) => (
                <div key={name} className={`flex items-center justify-between py-2 ${idx !== inventoryAlerts.length - 1 ? 'border-b border-border-light' : ''}`}>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-surface-variant rounded flex items-center justify-center mr-3">
                      <span className="material-symbols-outlined text-sm text-on-surface">inventory_2</span>
                    </div>
                    <span>{name}</span>
                  </div>
                  <span className={`font-medium ${toneClass}`}>{stock}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Support Tickets & Quick Actions */}
        <div className="space-y-8">
          {/* Support Tickets */}
          <div className="bg-surface-container-lowest border border-border-light rounded-lg p-6">
            <h3 className="font-title-lg text-title-lg text-on-surface mb-4">Recent Support Tickets</h3>
            <div className="space-y-4">
              {tickets.map(({ title, source, time, status, badgeClass }) => (
                <div key={title} className="p-3 border border-border-light rounded hover:border-outline transition-colors cursor-pointer">
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-medium text-sm">{title}</div>
                    <span className="text-xs text-on-surface-variant">{time}</span>
                  </div>
                  <div className="text-xs text-on-surface-variant mb-2">{source}</div>
                  <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-bold ${badgeClass}`}>
                    {status}
                  </span>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 text-center text-sm text-primary font-medium hover:underline">
              View All Tickets
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-surface-container-lowest border border-border-light rounded-lg p-6">
            <h3 className="font-title-lg text-title-lg text-on-surface mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button className="flex items-center justify-center space-x-2 bg-primary text-on-primary py-3 px-4 rounded hover:bg-secondary-container hover:text-on-secondary-container transition-colors font-medium text-sm">
                <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                <span>New Order</span>
              </button>
              <button className="flex items-center justify-center space-x-2 bg-surface-container-lowest border border-primary text-primary py-3 px-4 rounded hover:bg-surface-subtle transition-colors font-medium text-sm">
                <span className="material-symbols-outlined text-sm">person_add</span>
                <span>Add Customer</span>
              </button>
              <button className="flex items-center justify-center space-x-2 bg-surface-container-lowest border border-primary text-primary py-3 px-4 rounded hover:bg-surface-subtle transition-colors font-medium text-sm sm:col-span-2">
                <span className="material-symbols-outlined text-sm">summarize</span>
                <span>Generate Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;