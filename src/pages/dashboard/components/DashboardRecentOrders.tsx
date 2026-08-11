import React from 'react';

interface Order {
  id: string;
  customer: string;
  total: string;
  status: string;
  badgeClass: string;
}

interface Props {
  recentOrders: Order[];
}

export const DashboardRecentOrders: React.FC<Props> = ({ recentOrders }) => (
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
);
