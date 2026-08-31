import type { ReturnFilterTab, ReturnRequest } from '@/types/returnRefund';
import { getReturnStatusBadge } from '../returnStatus';

interface ReturnQueueProps {
  activeFilter: ReturnFilterTab;
  requests: ReturnRequest[];
  searchQuery: string;
  selectedId: string;
  totalRequests: ReturnRequest[];
  onFilterChange: (filter: ReturnFilterTab) => void;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
}

const filters: ReturnFilterTab[] = ['All', 'Pending', 'Approved', 'Rejected'];

const ReturnQueue = ({
  activeFilter,
  requests,
  searchQuery,
  selectedId,
  totalRequests,
  onFilterChange,
  onSearchChange,
  onSelect,
}: ReturnQueueProps) => {
  return (
    <div className="w-full md:w-[350px] lg:w-[400px] flex flex-col h-full bg-white border-r border-border-light shrink-0 z-0">
      <div className="p-4 border-b border-border-light bg-white sticky top-0">
        <h2 className="text-title-lg font-title-lg text-primary mb-4">Return Requests</h2>
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 hide-scrollbar">
          {filters.map((tab) => (
            <button
              key={tab}
              onClick={() => onFilterChange(tab)}
              className={`px-3 py-1 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors ${
                activeFilter === tab
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container border border-border-light text-on-surface-variant hover:bg-surface-variant'
              }`}
            >
              {tab} ({tab === 'All' ? totalRequests.length : totalRequests.filter((request) => request.status === tab).length})
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            filter_list
          </span>
          <input
            className="w-full pl-9 pr-3 py-1.5 bg-surface border border-border-light rounded text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            placeholder="Filter by ID, Distributor..."
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {requests.map((request) => {
          const isActive = request.id === selectedId;
          const itemCount = Array.isArray(request.items) ? request.items.length : request.items;

          return (
            <button
              key={request.id}
              type="button"
              onClick={() => onSelect(request.id)}
              className={`w-full text-left p-4 border-b border-border-light cursor-pointer transition-colors ${
                isActive
                  ? 'bg-surface-container-low border-l-4 border-l-primary hover:bg-surface-container'
                  : 'bg-white hover:bg-surface-subtle'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`font-data-tabular text-data-tabular font-bold ${isActive ? 'text-primary' : 'text-on-surface'}`}>
                  #{request.id}
                </span>
                <span className={getReturnStatusBadge(request.status)}>{request.status}</span>
              </div>
              <div className="text-body-md font-body-md text-on-surface font-medium truncate mb-1">
                {request.distributor}
              </div>
              <div className="flex justify-between items-center text-label-md font-label-md text-on-surface-variant">
                <span>{request.date}</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">inventory_2</span> {itemCount}{' '}
                  {itemCount === 1 ? 'item' : 'items'}
                </span>
              </div>
            </button>
          );
        })}
        {requests.length === 0 && (
          <p className="p-6 text-center text-body-md text-on-surface-variant">No return requests found.</p>
        )}
      </div>
    </div>
  );
};

export default ReturnQueue;
