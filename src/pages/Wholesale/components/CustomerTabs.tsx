import type { CustomerTab, WholesaleCustomer } from '@/types/wholesale';
import CustomerStatusBadge from './CustomerStatusBadge';

const tabs: CustomerTab[] = ['Details', 'Addresses', 'Orders', 'Wishlist'];

interface CustomerTabsProps {
  activeTab: CustomerTab;
  customer: WholesaleCustomer;
  onTabChange: (tab: CustomerTab) => void;
}

const CustomerTabs = ({ activeTab, customer, onTabChange }: CustomerTabsProps) => {
  return (
    <>
      <div className="px-6 border-b border-border-light flex gap-6 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`py-3 font-label-md text-label-md uppercase tracking-wide transition-colors ${
              activeTab === tab
                ? 'text-primary border-b-2 border-secondary'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-surface-subtle/50">
        {activeTab === 'Details' && <CustomerDetailsTab customer={customer} />}
        {activeTab === 'Addresses' && <EmptyTab title="Addresses" copy="Address details will appear here." />}
        {activeTab === 'Orders' && <CustomerOrdersTab customer={customer} />}
        {activeTab === 'Wishlist' && <EmptyTab title="Wishlist" copy="Wishlist items will appear here." />}
      </div>
    </>
  );
};

const CustomerDetailsTab = ({ customer }: { customer: WholesaleCustomer }) => {
  const availableCredit = parseFloat(customer.financials.availableCredit.replace(/[$,]/g, ''));
  const creditLimit = parseFloat(customer.financials.creditLimit.replace(/[$,]/g, ''));
  const creditPercent = creditLimit ? (availableCredit / creditLimit) * 100 : 0;

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="bg-surface-container-lowest p-5 rounded-xl border border-border-light">
        <h3 className="text-title-lg font-title-lg text-primary mb-4">Account Overview</h3>
        <div className="space-y-4">
          <div>
            <span className="block text-label-md font-label-md text-on-surface-variant mb-1">Status</span>
            <div className="flex items-center gap-2">
              <CustomerStatusBadge status={customer.status} />
              <label className="relative inline-flex items-center cursor-pointer ml-auto">
                <input checked={customer.status === 'Active'} className="sr-only peer" type="checkbox" readOnly />
                <div className="w-9 h-5 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>
          </div>
          <hr className="border-border-light" />
          <div className="grid grid-cols-2 gap-4">
            <DetailField label="Customer Since" value={customer.since} />
            <DetailField label="Tax ID / VAT" value={customer.taxId} />
          </div>
          <hr className="border-border-light" />
          <div>
            <span className="block text-label-md font-label-md text-on-surface-variant mb-1">Assigned Rep</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-6 h-6 rounded-full bg-surface-variant flex items-center justify-center text-[10px] font-bold">
                {customer.rep.initials}
              </div>
              <span className="text-body-md font-body-md text-primary">{customer.rep.name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest p-5 rounded-xl border border-border-light">
        <h3 className="text-title-lg font-title-lg text-primary mb-4">Financials</h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <FinancialMetric label="Lifetime Value" value={customer.financials.lifetimeValue} />
          <FinancialMetric label="AOV" value={customer.financials.aov} />
        </div>
        <div className="space-y-3">
          <SummaryRow label="Credit Limit" value={customer.financials.creditLimit} />
          <SummaryRow label="Available Credit" value={customer.financials.availableCredit} success />
          <div className="w-full bg-surface-variant rounded-full h-1.5 mt-2">
            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${creditPercent}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomerOrdersTab = ({ customer }: { customer: WholesaleCustomer }) => {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-border-light overflow-hidden">
      <div className="p-4 border-b border-border-light flex justify-between items-center">
        <h3 className="text-title-lg font-title-lg text-primary">Recent Orders</h3>
        <button className="text-label-md font-label-md text-on-surface-variant hover:text-primary transition-colors">
          View All
        </button>
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-primary text-on-primary">
            <th className="px-4 py-2 text-label-md font-label-md uppercase tracking-wider font-medium">Order ID</th>
            <th className="px-4 py-2 text-label-md font-label-md uppercase tracking-wider font-medium">Date</th>
            <th className="px-4 py-2 text-label-md font-label-md uppercase tracking-wider font-medium">Total</th>
            <th className="px-4 py-2 text-label-md font-label-md uppercase tracking-wider font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="text-data-tabular font-data-tabular">
          {customer.orders.map((order, index) => (
            <tr
              key={order.id}
              className={`border-b border-border-light hover:bg-surface-subtle transition-colors ${
                index % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface-subtle'
              }`}
            >
              <td className="px-4 py-3 text-primary font-medium">{order.id}</td>
              <td className="px-4 py-3 text-on-surface-variant">{order.date}</td>
              <td className="px-4 py-3 text-primary">{order.total}</td>
              <td className="px-4 py-3">
                <span className="bg-status-success/10 text-status-success px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {order.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const DetailField = ({ label, value }: { label: string; value: string }) => {
  return (
    <div>
      <span className="block text-label-md font-label-md text-on-surface-variant mb-1">{label}</span>
      <span className="text-data-tabular font-data-tabular text-primary">{value}</span>
    </div>
  );
};

const EmptyTab = ({ title, copy }: { title: string; copy: string }) => {
  return (
    <div className="bg-surface-container-lowest p-5 rounded-xl border border-border-light">
      <h3 className="text-title-lg font-title-lg text-primary mb-4">{title}</h3>
      <p className="text-on-surface-variant">{copy}</p>
    </div>
  );
};

const FinancialMetric = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="bg-surface-subtle p-3 rounded-lg border border-border-light">
      <span className="block text-label-md font-label-md text-on-surface-variant mb-1">{label}</span>
      <span className="text-headline-md font-headline-md text-primary">{value}</span>
    </div>
  );
};

const SummaryRow = ({ label, value, success }: { label: string; value: string; success?: boolean }) => {
  return (
    <div className="flex justify-between items-center">
      <span className="text-body-md font-body-md text-on-surface-variant">{label}</span>
      <span className={`text-data-tabular font-data-tabular ${success ? 'text-status-success font-bold' : 'text-primary'}`}>
        {value}
      </span>
    </div>
  );
};

export default CustomerTabs;
