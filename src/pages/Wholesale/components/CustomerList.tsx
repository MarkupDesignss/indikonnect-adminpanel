import type { CustomerFilter, WholesaleCustomer } from '@/types/wholesale';
import CustomerAvatar from './CustomerAvatar';
import CustomerStatusBadge from './CustomerStatusBadge';

interface CustomerListProps {
  customers: WholesaleCustomer[];
  filter: CustomerFilter;
  selectedId: number;
  onFilterChange: (filter: CustomerFilter) => void;
  onSelect: (id: number) => void;
}

const filterOptions: CustomerFilter[] = ['All', 'Active', 'Pending'];

const CustomerList = ({
  customers,
  filter,
  selectedId,
  onFilterChange,
  onSelect,
}: CustomerListProps) => {
  return (
    <div className="w-full md:w-[400px] lg:w-[450px] flex flex-col bg-surface-container-lowest rounded-xl border border-border-light overflow-hidden">
      <div className="p-5 border-b border-border-light shrink-0">
        <h2 className="text-title-lg font-title-lg text-primary">Customers</h2>
        <p className="text-body-md font-body-md text-on-surface-variant mt-1">
          Manage your wholesale relationships
        </p>
        <div className="mt-4 flex gap-2 overflow-x-auto hide-scrollbar">
          {filterOptions.map((label) => (
            <button
              key={label}
              onClick={() => onFilterChange(label)}
              className={`px-3 py-1.5 rounded-lg text-label-md font-label-md whitespace-nowrap transition-colors ${
                filter === label
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-subtle border border-border-light text-on-surface hover:bg-surface-variant'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {customers.map((customer) => {
          const isActive = customer.id === selectedId;

          return (
            <button
              key={customer.id}
              type="button"
              onClick={() => onSelect(customer.id)}
              className={`w-full text-left p-4 border-b border-border-light cursor-pointer transition-colors flex items-start gap-3 ${
                isActive ? 'bg-surface-container-low' : 'hover:bg-surface-container-low'
              }`}
            >
              <CustomerAvatar customer={customer} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-3">
                  <h3 className="text-body-lg font-body-lg font-medium text-primary truncate">{customer.name}</h3>
                  <CustomerStatusBadge status={customer.status} />
                </div>
                <p className="text-label-md font-label-md text-on-surface-variant truncate">{customer.company}</p>
                <div className="mt-2 flex gap-4 text-data-tabular font-data-tabular text-on-surface-variant">
                  <span>{customer.orders.length} Orders</span>
                  <span>{customer.financials.lifetimeValue} YTD</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CustomerList;
