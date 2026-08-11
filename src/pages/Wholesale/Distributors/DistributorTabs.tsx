import type { Distributor, DistributorTab } from '@/types/wholesale';

const tabs: DistributorTab[] = ['Profile Details', 'Earnings & Wallet', 'Genealogy'];

interface DistributorTabsProps {
  activeTab: DistributorTab;
  distributor: Distributor;
  onTabChange: (tab: DistributorTab) => void;
}

const DistributorTabs = ({ activeTab, distributor, onTabChange }: DistributorTabsProps) => {
  return (
    <div className="bg-surface-container-lowest border border-border-light rounded-lg overflow-hidden">
      <div className="flex border-b border-border-light bg-surface-subtle">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-6 py-3 font-label-md text-label-md transition-colors ${
              activeTab === tab
                ? 'font-bold text-primary border-b-2 border-primary bg-surface-container-lowest'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTab === 'Profile Details' && <DistributorProfileTab distributor={distributor} />}

        {activeTab === 'Earnings & Wallet' && (
          <div>
            <h4 className="font-title-lg text-title-lg text-on-surface mb-4">Earnings &amp; Wallet</h4>
            <p className="text-on-surface-variant">
              Detailed earnings breakdown and wallet history will appear here.
            </p>
          </div>
        )}

        {activeTab === 'Genealogy' && (
          <div>
            <h4 className="font-title-lg text-title-lg text-on-surface mb-4">Genealogy Tree</h4>
            <p className="text-on-surface-variant">The distributor downline network will be displayed here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const DistributorProfileTab = ({ distributor }: { distributor: Distributor }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
      <div>
        <h4 className="font-title-lg text-title-lg mb-4 text-on-surface border-b border-border-light pb-2">
          Contact Information
        </h4>
        <div className="space-y-4">
          <ProfileField label="Primary Contact" value={distributor.contact.name} />
          <ProfileField label="Email Address" value={distributor.contact.email} />
          <ProfileField label="Phone Number" value={distributor.contact.phone} />
        </div>
      </div>

      <div>
        <h4 className="font-title-lg text-title-lg mb-4 text-on-surface border-b border-border-light pb-2">
          Account Details
        </h4>
        <div className="space-y-4">
          <ProfileField label="Registration Date" value={distributor.registrationDate} />
          <ProfileField label="Tax ID / EIN" value={distributor.taxId} />
          <ProfileField label="Billing Address" value={distributor.billingAddress} />
        </div>
      </div>

      <div className="lg:col-span-2 mt-4">
        <div className="p-4 rounded border border-border-light bg-surface-subtle flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-100 text-status-success flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined">verified</span>
            </div>
            <div>
              <h5 className="font-semibold text-on-surface text-sm">
                {distributor.kycCompleted ? 'KYC Verification Complete' : 'KYC Verification Pending'}
              </h5>
              <p className="text-xs text-on-surface-variant">
                {distributor.kycCompleted
                  ? 'All required corporate documents have been verified.'
                  : 'Please upload the required documents for verification.'}
              </p>
            </div>
          </div>
          <button className="px-4 py-2 rounded border border-border-light bg-surface-container-lowest text-on-surface text-xs font-medium hover:bg-surface-container-low transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">folder_open</span>
            {distributor.kycCompleted ? 'View Documents' : 'Upload Documents'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProfileField = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-on-surface-variant uppercase tracking-wide">{label}</span>
      <span className="font-body-md text-on-surface">{value}</span>
    </div>
  );
};

export default DistributorTabs;
