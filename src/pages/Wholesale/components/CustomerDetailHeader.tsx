import type { WholesaleCustomer } from '@/types/wholesale';
import CustomerAvatar from './CustomerAvatar';

interface CustomerDetailHeaderProps {
  customer: WholesaleCustomer;
}

const CustomerDetailHeader = ({ customer }: CustomerDetailHeaderProps) => {
  return (
    <div className="p-6 border-b border-border-light shrink-0 pt-8 flex justify-between items-start">
      <div className="flex items-center gap-4">
        <CustomerAvatar customer={customer} size="lg" />
        <div>
          <h2 className="text-headline-md font-headline-md text-primary leading-tight">{customer.name}</h2>
          <p className="text-body-lg font-body-lg text-on-surface-variant">{customer.company}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="material-symbols-outlined text-on-surface-variant text-[16px]">mail</span>
            <span className="text-data-tabular font-data-tabular text-on-surface-variant">{customer.email}</span>
            <span className="w-1 h-1 rounded-full bg-outline-variant mx-1" />
            <span className="material-symbols-outlined text-on-surface-variant text-[16px]">call</span>
            <span className="text-data-tabular font-data-tabular text-on-surface-variant">{customer.phone}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-surface-subtle border border-primary text-primary rounded-xl text-label-md font-label-md hover:bg-surface-variant transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">chat</span> Message
        </button>
        <button className="px-4 py-2 bg-primary text-on-primary rounded-xl text-label-md font-label-md hover:bg-secondary-container hover:text-on-secondary-container transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">edit</span> Edit
        </button>
      </div>
    </div>
  );
};

export default CustomerDetailHeader;
