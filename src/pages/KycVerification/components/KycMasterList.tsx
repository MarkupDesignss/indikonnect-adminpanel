import React from 'react';

interface KycItem {
  id: number;
  name: string;
  type: string;
  submitted: string;
  status: string;
}

interface Props {
  kycList: KycItem[];
  selectedId: number;
  setSelectedId: (id: number) => void;
  filters: string[];
}

export const KycMasterList: React.FC<Props> = ({ kycList, selectedId, setSelectedId, filters }) => (
  <div className="w-1/3 min-w-[320px] max-w-[400px] bg-surface-container-lowest border-r border-outline-variant flex flex-col h-full">
    {/* List Header & Filters */}
    <div className="p-6 border-b border-outline-variant shrink-0">
      <h2 className="text-title-lg font-title-lg text-primary mb-4">Verification Queue</h2>
      <div className="flex gap-2">
        {filters.map((label) => (
          <button
            key={label}
            className={`flex-1 py-1.5 px-3 rounded-full text-data-tabular font-data-tabular text-center transition-colors ${
              label.includes('Pending')
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface border border-transparent hover:border-outline-variant'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>

    {/* List Items */}
    <div className="flex-1 overflow-y-auto">
      {kycList.map((item) => {
        const isActive = item.id === selectedId;
        return (
          <div
            key={item.id}
            onClick={() => setSelectedId(item.id)}
            className={`p-4 border-l-4 cursor-pointer hover:bg-surface-container transition-colors ${
              isActive
                ? 'border-l-secondary-container bg-surface-container-low'
                : 'border-l-transparent bg-surface-container-lowest border-b border-border-light'
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <h3
                className={`text-body-lg font-body-lg font-semibold ${
                  isActive ? 'text-primary' : 'text-on-surface'
                }`}
              >
                {item.name}
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-status-warning/10 text-status-warning">
                {item.status}
              </span>
            </div>
            <p className="text-data-tabular font-data-tabular text-on-surface-variant mb-2">
              {item.type} • Submitted {item.submitted}
            </p>
            {isActive && (
              <div className="flex items-center gap-2 text-data-tabular text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                <span>Awaiting Review</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);
