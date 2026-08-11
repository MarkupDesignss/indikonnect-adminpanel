import React from 'react';

interface ChartDay {
  day: string;
  height: string;
  isCurrent: boolean;
  value?: string;
}

interface Props {
  chartDays: ChartDay[];
}

export const DashboardSalesAnalytics: React.FC<Props> = ({ chartDays }) => (
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
);
