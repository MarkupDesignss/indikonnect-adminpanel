import type { CustomerTab, WholesaleCustomer } from '@/types/wholesale';
import CustomerDetailHeader from './CustomerDetailHeader';
import CustomerTabs from './CustomerTabs';

interface CustomerDetailProps {
  activeTab: CustomerTab;
  customer: WholesaleCustomer;
  onTabChange: (tab: CustomerTab) => void;
}

const CustomerDetail = ({ activeTab, customer, onTabChange }: CustomerDetailProps) => {
  return (
    <div className="hidden md:flex flex-1 flex-col bg-surface-container-lowest rounded-xl border border-border-light overflow-hidden relative">
      <div className="h-1 bg-secondary-container w-full absolute top-0 left-0" />
      <CustomerDetailHeader customer={customer} />
      <CustomerTabs activeTab={activeTab} customer={customer} onTabChange={onTabChange} />
    </div>
  );
};

export default CustomerDetail;
