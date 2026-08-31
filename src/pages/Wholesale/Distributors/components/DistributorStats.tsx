import type { Distributor } from '@/types/wholesale';

interface DistributorStatsProps {
  distributor: Distributor;
}

const DistributorStats = ({ distributor }: DistributorStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-surface-container-lowest p-4 rounded border border-border-light flex flex-col justify-between">
        <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-2">Total Earnings</p>
        <p className="font-display-lg text-display-lg text-on-surface leading-none">{distributor.totalEarnings}</p>
      </div>
      <div className="bg-surface-container-lowest p-4 rounded border border-border-light flex flex-col justify-between">
        <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-2">Wallet Balance</p>
        <div className="flex items-end gap-2">
          <p className="font-display-lg text-display-lg text-on-surface leading-none">{distributor.walletBalance}</p>
          <p className="text-sm text-status-success flex items-center mb-1">
            <span className="material-symbols-outlined text-[16px]">trending_up</span> 4.2%
          </p>
        </div>
      </div>
      <div className="bg-surface-container-lowest p-4 rounded border border-border-light flex flex-col justify-between">
        <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-2">Team Size</p>
        <div className="flex items-end gap-2">
          <p className="font-display-lg text-display-lg text-on-surface leading-none">{distributor.teamSize}</p>
          <p className="text-sm text-on-surface-variant mb-1">Active nodes</p>
        </div>
      </div>
    </div>
  );
};

export default DistributorStats;
