import React, { useState, useMemo } from 'react';
import { getKycList } from '../../services/kycService';

import { KycMasterList } from './components/KycMasterList';
import { KycDetailPane } from './components/KycDetailPane';

const KycVerification = () => {
  const kycList = useMemo(() => getKycList(), []);
  const [selectedId, setSelectedId] = useState(1);
  const selected = kycList.find((item) => item.id === selectedId) || kycList[0];

  // Filter buttons (static for now)
  const filters = ['Pending (12)', 'Approved', 'Rejected'];

  return (
    <section className="flex-1 overflow-hidden flex">
      {/* Master List (Left Pane) */}
      <KycMasterList
        kycList={kycList}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        filters={filters}
      />

      {/* Detail Pane (Right Pane) */}
      <KycDetailPane selected={selected} />
    </section>
  );
};

export default KycVerification;