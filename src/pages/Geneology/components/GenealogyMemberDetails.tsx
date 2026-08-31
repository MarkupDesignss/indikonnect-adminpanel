import React from 'react';

interface Sponsor {
  name: string;
  id: string;
}

interface Contact {
  email: string;
  phone: string;
  location: string;
}

interface SelectedMember {
  id: string;
  name: string;
  rank: string;
  status: string;
  joinDate: string;
  sponsor: Sponsor;
  contact: Contact;
  avatar: string;
}

interface Props {
  selectedMemberData: SelectedMember;
}

export const GenealogyMemberDetails: React.FC<Props> = ({ selectedMemberData }) => (
  <div className="lg:col-span-4 flex flex-col gap-6">
    {/* Detail Card */}
    <div className="bg-surface-container-lowest border border-border-light rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(26,26,27,0.02)]">
      <div className="h-2 bg-secondary-container w-full"></div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-title-lg text-title-lg text-on-background">Member Details</h3>
          <span className="bg-surface-container-high text-on-surface-variant text-[10px] font-label-md px-2 py-1 rounded uppercase tracking-wider">Selected</span>
        </div>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-surface-variant overflow-hidden border-2 border-surface-container-lowest shadow-sm">
            <img
              className="w-full h-full object-cover"
              src={selectedMemberData.avatar}
              alt={selectedMemberData.name}
            />
          </div>
          <div>
            <h4 className="font-headline-md text-headline-md text-on-background">{selectedMemberData.name}</h4>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              {selectedMemberData.rank} Distributor • {selectedMemberData.id}
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-subtle p-3 rounded border border-border-light">
              <div className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Status</div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-status-success"></div>
                <span className="font-data-tabular text-data-tabular text-on-surface">{selectedMemberData.status}</span>
              </div>
            </div>
            <div className="bg-surface-subtle p-3 rounded border border-border-light">
              <div className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Join Date</div>
              <div className="font-data-tabular text-data-tabular text-on-surface">{selectedMemberData.joinDate}</div>
            </div>
          </div>
          <div className="border-t border-border-light pt-4">
            <h5 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-3">Sponsor Information</h5>
            <div className="flex items-center justify-between p-3 bg-surface rounded border border-border-light">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary text-on-primary flex items-center justify-center font-label-md">
                  {selectedMemberData.sponsor.name.split(' ').map(w => w[0]).join('')}
                </div>
                <div>
                  <div className="font-body-md text-body-md font-semibold text-on-surface">{selectedMemberData.sponsor.name}</div>
                  <div className="font-label-md text-[10px] text-on-surface-variant">{selectedMemberData.sponsor.id}</div>
                </div>
              </div>
              <button className="text-secondary-container hover:text-secondary-fixed-dim transition-colors">
                <span className="material-symbols-outlined text-[18px]">visibility</span>
              </button>
            </div>
          </div>
          <div className="border-t border-border-light pt-4">
            <h5 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-3">Contact</h5>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-on-surface font-body-md text-[13px]">
                <span className="material-symbols-outlined text-on-surface-variant text-[16px]">mail</span>
                {selectedMemberData.contact.email}
              </div>
              <div className="flex items-center gap-3 text-on-surface font-body-md text-[13px]">
                <span className="material-symbols-outlined text-on-surface-variant text-[16px]">phone</span>
                {selectedMemberData.contact.phone}
              </div>
              <div className="flex items-center gap-3 text-on-surface font-body-md text-[13px]">
                <span className="material-symbols-outlined text-on-surface-variant text-[16px]">location_on</span>
                {selectedMemberData.contact.location}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-border-light">
          <button className="w-full bg-primary text-on-primary py-2.5 rounded font-label-md text-label-md uppercase tracking-wide hover:bg-tertiary-container transition-colors">
            View Full Profile
          </button>
        </div>
      </div>
    </div>

    {/* Quick Stats Widget */}
    <div className="bg-surface-container-lowest border border-border-light rounded-xl p-5 shadow-sm">
      <h4 className="font-title-lg text-[16px] text-on-background mb-4">Network Overview</h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-subtle p-3 rounded flex flex-col justify-between h-20">
          <span className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider">Total Downline</span>
          <span className="font-headline-md text-headline-md text-on-background">1,248</span>
        </div>
        <div className="bg-surface-subtle p-3 rounded flex flex-col justify-between h-20">
          <span className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider">Active Rate</span>
          <span className="font-headline-md text-headline-md text-status-success">84%</span>
        </div>
      </div>
    </div>
  </div>
);
