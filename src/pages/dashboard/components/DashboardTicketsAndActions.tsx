import React from 'react';

interface Ticket {
  title: string;
  source: string;
  time: string;
  status: string;
  badgeClass: string;
}

interface Props {
  tickets: Ticket[];
}

export const DashboardTicketsAndActions: React.FC<Props> = ({ tickets }) => (
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
);
