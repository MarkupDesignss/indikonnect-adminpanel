import React, { useState, useMemo } from 'react';
import { getDownlineMembers, getSelectedMemberData } from '../../services/genealogyService';

import { GenealogyHeader } from './components/GenealogyHeader';
import { GenealogyTree } from './components/GenealogyTree';
import { GenealogyMemberDetails } from './components/GenealogyMemberDetails';
import { GenealogyDownlineTable } from './components/GenealogyDownlineTable';

const Genealogy = () => {
  const downlineMembers = useMemo(() => getDownlineMembers(), []);
  const selectedMemberData = useMemo(() => getSelectedMemberData(), []);

  const [filter, setFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = downlineMembers.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.id.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'All') return true;
    return m.status === filter;
  });

  return (
    <section className="flex-1 flex flex-col gap-8 max-w-[max-width] mx-auto w-full">
      {/* Header Section */}
      <GenealogyHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Bento Grid Layout for Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Tree View Section (Span 8) */}
        <GenealogyTree />

        {/* Sponsor Details Sidebar (Span 4) */}
        <GenealogyMemberDetails selectedMemberData={selectedMemberData} />
      </div>

      {/* Downline Table Section */}
      <GenealogyDownlineTable
        filteredMembers={filteredMembers}
        selectedMemberData={selectedMemberData}
        filter={filter}
        setFilter={setFilter}
      />
    </section>
  );
};

export default Genealogy;