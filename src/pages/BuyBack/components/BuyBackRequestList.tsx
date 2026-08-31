import type { BuyBackFilterTab, BuyBackRequest } from '@/types/buyBack';
import { getBuyBackStatusBadge } from '../buyBackStatus';

interface BuyBackRequestListProps {
  activeTab: BuyBackFilterTab;
  requests: BuyBackRequest[];
  selectedId: string;
  onFilterChange: (tab: BuyBackFilterTab) => void;
  onSelect: (id: string) => void;
}

const tabs: BuyBackFilterTab[] = ['All', 'Pending', 'Eligible', 'Inspection', 'Approved'];

const BuyBackRequestList = ({
  activeTab,
  requests,
  selectedId,
  onFilterChange,
  onSelect,
}: BuyBackRequestListProps) => {
  return (
    <div className="w-full md:w-[380px] shrink-0 flex flex-col bg-surface border border-border-light rounded-lg h-full overflow-hidden shadow-sm">
      <div className="p-4 border-b border-border-light bg-surface shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-title-lg text-title-lg text-primary">Requests</h3>
          <button className="text-secondary hover:text-on-secondary-container font-label-md text-label-md uppercase font-bold flex items-center gap-1 transition-colors">
            <span className="material-symbols-outlined text-[16px]">filter_list</span> Filter
          </button>
        </div>
        <div className="flex overflow-x-auto scrollbar-hide gap-2 border-b border-border-light pb-1">
          {tabs.map((tab) => {
            const label = tab === 'Inspection' ? 'In Inspection' : tab;

            return (
              <button
                key={tab}
                onClick={() => onFilterChange(tab)}
                className={`px-3 py-1.5 font-label-md text-label-md border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-on-surface-variant hover:text-primary'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll p-2 space-y-2 bg-surface-subtle">
        {requests.map((request) => {
          const isSelected = request.id === selectedId;

          return (
            <button
              key={request.id}
              type="button"
              onClick={() => onSelect(request.id)}
              className={`w-full text-left bg-surface border rounded p-3 cursor-pointer transition-colors ${
                isSelected ? 'border-2 border-primary relative' : 'border-border-light hover:border-outline-variant'
              }`}
            >
              {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary-container rounded-l" />}
              <div className="flex justify-between items-start mb-2 pl-2">
                <div>
                  <span className="font-label-md text-label-md text-outline">{request.id}</span>
                  <h4 className="font-body-md text-body-md font-semibold text-primary mt-0.5">
                    {request.distributor}
                  </h4>
                </div>
                <span className={getBuyBackStatusBadge(request.status)}>{request.status}</span>
              </div>
              <div className="flex justify-between items-center pl-2 mt-3 text-on-surface-variant">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                  <span className="font-data-tabular text-data-tabular">{request.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                  <span className="font-data-tabular text-data-tabular">{request.items} Items</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BuyBackRequestList;
