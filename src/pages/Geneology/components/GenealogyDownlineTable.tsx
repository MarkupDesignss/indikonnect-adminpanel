import React from 'react';

interface Member {
  id: string;
  name: string;
  rank: string;
  status: string;
  sales?: number;
  initials: string;
  avatar?: string;
}

interface SelectedMember {
  id: string;
  name: string;
  rank: string;
  status: string;
  joinDate: string;
  sponsor: any;
  contact: any;
  avatar: string;
}

interface Props {
  filteredMembers: Member[];
  selectedMemberData: SelectedMember;
  filter: string;
  setFilter: (val: any) => void;
}

export const GenealogyDownlineTable: React.FC<Props> = ({ filteredMembers, selectedMemberData, filter, setFilter }) => (
  <div className="bg-surface-container-lowest border border-border-light rounded-xl overflow-hidden mt-4 shadow-sm">
    {/* Table Header & Controls */}
    <div className="p-5 border-b border-border-light bg-surface-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <h3 className="font-title-lg text-title-lg text-on-background">Downline Roster</h3>
      <div className="flex bg-surface border border-border-light rounded p-1">
        {(['All', 'Active', 'Inactive'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded font-label-md text-[11px] uppercase tracking-wide transition-all ${
              filter === tab
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>

    {/* Table */}
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-primary text-on-primary">
            <th className="py-3 px-5 font-label-md text-[11px] uppercase tracking-wider font-semibold w-12"></th>
            <th className="py-3 px-5 font-label-md text-[11px] uppercase tracking-wider font-semibold">Member</th>
            <th className="py-3 px-5 font-label-md text-[11px] uppercase tracking-wider font-semibold">ID</th>
            <th className="py-3 px-5 font-label-md text-[11px] uppercase tracking-wider font-semibold">Rank</th>
            <th className="py-3 px-5 font-label-md text-[11px] uppercase tracking-wider font-semibold">Status</th>
            <th className="py-3 px-5 font-label-md text-[11px] uppercase tracking-wider font-semibold text-right">Total Sales (YTD)</th>
            <th className="py-3 px-5 font-label-md text-[11px] uppercase tracking-wider font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="font-data-tabular text-data-tabular">
          {filteredMembers.map((member, idx) => {
            const isSelected = member.id === selectedMemberData.id;
            const statusClass = member.status === 'Active'
              ? 'bg-status-success/10 border border-status-success/20 text-status-success'
              : 'bg-status-error/10 border border-status-error/20 text-status-error';
            const rankIcon = member.rank === 'Gold' ? 'secondary-container' :
                             member.rank === 'Silver' ? 'tertiary-fixed-dim' : 'on-surface-variant';
            return (
              <tr
                key={member.id}
                className={`border-b border-border-light hover:bg-surface-variant/30 transition-colors ${
                  idx % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface-subtle'
                } ${isSelected ? 'bg-surface-container-high/40' : ''}`}
              >
                <td className="py-3 px-5 relative">
                  {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary-container"></div>}
                  {member.avatar ? (
                    <div className="w-6 h-6 rounded-full bg-surface-variant flex items-center justify-center overflow-hidden">
                      <img className="w-full h-full rounded-full object-cover" src={member.avatar} alt={member.name} />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-surface-variant flex items-center justify-center font-label-md text-[10px] text-on-surface-variant uppercase">
                      {member.initials}
                    </div>
                  )}
                </td>
                <td className="py-3 px-5 font-semibold text-on-surface">{member.name}</td>
                <td className="py-3 px-5 text-on-surface-variant">{member.id}</td>
                <td className="py-3 px-5">
                  <span className="inline-flex items-center gap-1 text-on-surface">
                    <span className={`material-symbols-outlined text-[14px] text-${rankIcon}`} style={{ fontVariationSettings: member.rank === 'Gold' || member.rank === 'Silver' ? "'FILL' 1" : undefined }}>
                      workspace_premium
                    </span>
                    {member.rank}
                  </span>
                </td>
                <td className="py-3 px-5">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${statusClass} font-label-md text-[10px] uppercase`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'Active' ? 'bg-status-success' : 'bg-status-error'}`}></span>
                    {member.status}
                  </span>
                </td>
                <td className="py-3 px-5 text-right font-medium">
                  {member.sales ? `$${member.sales.toFixed(2)}` : '-'}
                </td>
                <td className="py-3 px-5 text-right">
                  <button className="text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[18px]">more_vert</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

    {/* Pagination */}
    <div className="p-4 border-t border-border-light bg-surface-container-lowest flex items-center justify-between">
      <span className="font-body-md text-[13px] text-on-surface-variant">
        Showing 1 to {filteredMembers.length} of 1,248 entries
      </span>
      <div className="flex gap-1">
        <button className="w-8 h-8 flex items-center justify-center rounded border border-border-light text-on-surface-variant hover:bg-surface-subtle disabled:opacity-50">
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded bg-primary text-on-primary font-data-tabular">1</button>
        <button className="w-8 h-8 flex items-center justify-center rounded border border-border-light text-on-surface-variant hover:bg-surface-subtle font-data-tabular">2</button>
        <button className="w-8 h-8 flex items-center justify-center rounded border border-border-light text-on-surface-variant hover:bg-surface-subtle font-data-tabular">3</button>
        <span className="w-8 h-8 flex items-center justify-center text-on-surface-variant">...</span>
        <button className="w-8 h-8 flex items-center justify-center rounded border border-border-light text-on-surface-variant hover:bg-surface-subtle disabled:opacity-50">
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
    </div>
  </div>
);
