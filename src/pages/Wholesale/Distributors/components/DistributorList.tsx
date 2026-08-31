import type { Distributor } from '@/types/wholesale';
import {
  getDistributorRankClass,
  getDistributorStatusClass,
  getDistributorStatusDotClass,
} from './DistributorBadges';

interface DistributorListProps {
  distributors: Distributor[];
  selectedId: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
}

const DistributorList = ({
  distributors,
  selectedId,
  searchQuery,
  onSearchChange,
  onSelect,
}: DistributorListProps) => {
  return (
    <section className="lg:w-1/3 flex flex-col bg-surface-container-lowest border border-border-light rounded-lg overflow-hidden flex-shrink-0">
      <div className="p-4 border-b border-border-light bg-surface-subtle flex flex-col gap-3">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            className="w-full pl-9 pr-3 py-2 text-sm border border-border-light rounded bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline-variant"
            placeholder="Search distributors..."
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs font-medium rounded border border-border-light bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">filter_list</span> Filter
          </button>
          <button className="px-3 py-1.5 text-xs font-medium rounded border border-border-light bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-1">
            Rank <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {distributors.map((distributor) => {
          const isActive = distributor.id === selectedId;

          return (
            <button
              key={distributor.id}
              type="button"
              onClick={() => onSelect(distributor.id)}
              className={`w-full text-left p-4 border-b border-border-light hover:bg-surface-subtle cursor-pointer transition-colors ${
                isActive
                  ? 'bg-surface-container-low border-l-4 border-l-secondary-container'
                  : 'bg-surface-container-lowest border-l-4 border-l-transparent'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-on-surface text-sm">{distributor.name}</h4>
                  <p className="text-xs text-on-surface-variant">ID: {distributor.id}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${getDistributorRankClass(
                    distributor.rank
                  )}`}
                >
                  {distributor.rank}
                </span>
              </div>
              <div className="flex justify-between items-end mt-3">
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wide">Wallet Balance</p>
                  <p className="font-data-tabular text-data-tabular text-on-surface font-semibold">
                    {distributor.walletBalance}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${getDistributorStatusClass(
                    distributor.status
                  )}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${getDistributorStatusDotClass(distributor.status)}`} />
                  {distributor.status}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default DistributorList;
