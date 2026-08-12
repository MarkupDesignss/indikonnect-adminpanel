import type { Distributor, DistributorTab } from '@/types/wholesale';
import DistributorDetailHeader from './DistributorDetailHeader';
import DistributorStats from './DistributorStats';
import DistributorTabs from './DistributorTabs';

interface DistributorDetailProps {
  activeTab: DistributorTab;
  distributor: Distributor;
  onTabChange: (tab: DistributorTab) => void;
}

const DistributorDetail = ({ activeTab, distributor, onTabChange }: DistributorDetailProps) => {
  return (
    <section className="lg:w-2/3 flex flex-col bg-surface-container-lowest border border-border-light rounded-lg overflow-hidden flex-shrink-0 relative">
      <div className="h-1 w-full bg-secondary-container absolute top-0 left-0" />

      <DistributorDetailHeader distributor={distributor} />

      <div className="flex-1 overflow-y-auto p-6 bg-surface-subtle">
        <DistributorStats distributor={distributor} />
        <DistributorTabs activeTab={activeTab} distributor={distributor} onTabChange={onTabChange} />
      </div>
    </section>
  );
};

export default DistributorDetail;
