import React from 'react';

interface Props {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
}

export const GenealogyHeader: React.FC<Props> = ({ searchQuery, setSearchQuery }) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
    <div>
      <h2 className="font-headline-lg text-headline-lg md:font-headline-lg md:text-headline-lg text-on-background">
        Genealogy Management
      </h2>
      <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
        Visualize and manage your distributor network hierarchy.
      </p>
    </div>
    <div className="flex items-center gap-3">
      <div className="relative w-full md:w-auto">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
          search
        </span>
        <input
          className="w-full md:w-56 bg-surface-container-lowest border border-border-light rounded px-3 py-2 pl-9 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:border-2 transition-all"
          placeholder="Find Member..."
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <button className="bg-surface-container-lowest border border-primary text-primary px-4 py-2 rounded font-label-md text-label-md uppercase tracking-wide hover:bg-surface-container-low transition-colors flex items-center gap-2 whitespace-nowrap">
        <span className="material-symbols-outlined text-[18px]">download</span>
        Export
      </button>
    </div>
  </div>
);
