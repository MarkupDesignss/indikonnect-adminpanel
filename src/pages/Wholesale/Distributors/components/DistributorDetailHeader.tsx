import type { Distributor } from '@/types/wholesale';

interface DistributorDetailHeaderProps {
  distributor: Distributor;
}

const DistributorDetailHeader = ({ distributor }: DistributorDetailHeaderProps) => {
  return (
    <div className="p-6 border-b border-border-light mt-1">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-surface-variant border border-border-light flex items-center justify-center overflow-hidden shrink-0">
            <span className="material-symbols-outlined text-[32px] text-on-surface-variant">domain</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-headline-md text-headline-md text-on-surface">{distributor.name}</h3>
              {distributor.status === 'Verified' && (
                <span className="material-symbols-outlined text-status-success text-[20px]">check_circle</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-on-surface-variant">ID: {distributor.id}</span>
              <span className="w-1 h-1 rounded-full bg-outline-variant" />
              <span className="text-sm text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">location_on</span> {distributor.location}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded bg-surface-container-lowest border border-primary text-primary font-label-md text-label-md hover:bg-surface-container-low transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">chat</span> Message
          </button>
          <button className="px-4 py-2 rounded bg-primary text-on-primary font-label-md text-label-md hover:bg-secondary hover:text-primary transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">edit</span> Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default DistributorDetailHeader;
