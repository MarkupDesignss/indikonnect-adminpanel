import React from 'react';

interface Metric {
  label: string;
  value: string;
  icon: string;
  trendIcon: string;
  change: string;
  note?: string;
  toneClass: string;
  featured?: boolean;
}

interface Props {
  metrics: Metric[];
}

export const DashboardKpiCards: React.FC<Props> = ({ metrics }) => (
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
);
