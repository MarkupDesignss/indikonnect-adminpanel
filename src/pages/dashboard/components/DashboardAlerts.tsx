import React from 'react';

interface InventoryAlert {
  name: string;
  stock: string;
  toneClass: string;
}

interface Props {
  kycReviews: string[][];
  inventoryAlerts: InventoryAlert[];
}

export const DashboardAlerts: React.FC<Props> = ({ kycReviews, inventoryAlerts }) => (
  <div className="space-y-8">
    {/* Pending KYC */}
    <div className="bg-surface-container-lowest border border-border-light rounded-lg p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-status-warning"></div>
      <h3 className="font-title-lg text-title-lg text-on-surface mb-4 flex items-center">
        <span className="material-symbols-outlined mr-2 text-status-warning">verified_user</span>
        Pending KYC Reviews
      </h3>
      <ul className="space-y-3">
        {kycReviews.map(([name, time]) => (
          <li key={name} className="flex justify-between items-center p-3 border border-border-light rounded bg-surface-subtle">
            <div>
              <div className="font-medium text-sm">{name}</div>
              <div className="text-xs text-on-surface-variant">{time}</div>
            </div>
            <button className="bg-surface-container-lowest border border-primary text-primary px-3 py-1 rounded text-xs font-medium hover:bg-surface-subtle transition-colors">
              Review
            </button>
          </li>
        ))}
      </ul>
    </div>

    {/* Inventory Alerts */}
    <div className="bg-surface-container-lowest border border-border-light rounded-lg p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-status-error"></div>
      <h3 className="font-title-lg text-title-lg text-on-surface mb-4 flex items-center">
        <span className="material-symbols-outlined mr-2 text-status-error">warning</span>
        Inventory Alerts
      </h3>
      <div className="space-y-3 text-sm">
        {inventoryAlerts.map(({ name, stock, toneClass }, idx) => (
          <div key={name} className={`flex items-center justify-between py-2 ${idx !== inventoryAlerts.length - 1 ? 'border-b border-border-light' : ''}`}>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-surface-variant rounded flex items-center justify-center mr-3">
                <span className="material-symbols-outlined text-sm text-on-surface">inventory_2</span>
              </div>
              <span>{name}</span>
            </div>
            <span className={`font-medium ${toneClass}`}>{stock}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);
