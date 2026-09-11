import type { ReturnRequest } from '@/types/returnRefund';

interface ReturnOverviewCardsProps {
  request: ReturnRequest;
}

const ReturnOverviewCards = ({ request }: ReturnOverviewCardsProps) => {
  const itemCount = Array.isArray(request.items) ? request.items.length : request.items;
  const initials = request.distributor
    .split(' ')
    .map((word) => word[0])
    .join('')
    .substring(0, 2);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white rounded border border-border-light p-6">
        <div className="flex items-center gap-2 mb-4 border-b border-border-light pb-3">
          <span className="material-symbols-outlined text-outline">receipt_long</span>
          <h3 className="text-title-lg font-title-lg text-primary">Order Information</h3>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider mb-1">Linked Order</p>
            <a className="font-data-tabular text-data-tabular text-blue-600 hover:underline flex items-center gap-1" href="#">
              {request.order?.id || 'N/A'} <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Order Date" value={request.order?.date || 'N/A'} />
            <InfoField label="Fulfillment Center" value={request.order?.center || 'N/A'} />
          </div>
          <div className="pt-2">
            <p className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider mb-1">Distributor</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center text-on-surface font-bold text-lg">
                {initials}
              </div>
              <div>
                <p className="text-body-md font-body-md text-primary font-medium">{request.distributor}</p>
                <p className="text-body-md font-body-md text-on-surface-variant text-sm">
                  Account: {request.order?.account || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded border border-border-light p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-secondary-container" />
        <div className="flex items-center gap-2 mb-4 border-b border-border-light pb-3">
          <span className="material-symbols-outlined text-outline">payments</span>
          <h3 className="text-title-lg font-title-lg text-primary">Refund Estimate</h3>
        </div>
        <div className="bg-surface p-4 rounded border border-border-light mb-4">
          <AmountRow label={`Subtotal (${itemCount} items)`} value={`$${request.refund?.subtotal?.toFixed(2) || '0.00'}`} />
          <AmountRow
            label="Restocking Fee (10%)"
            value={`-$${request.refund?.restockingFee?.toFixed(2) || '0.00'}`}
            danger
          />
          <AmountRow label="Original Shipping" value={request.refund?.shipping || 'Non-refundable'} muted />
          <div className="border-t border-border-light pt-3 flex justify-between items-end">
            <span className="text-body-lg font-body-lg text-primary font-bold">Estimated Total</span>
            <span className="text-title-lg font-title-lg text-primary font-bold font-data-tabular">
              ${request.refund?.total?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>
        <button className="w-full py-2 rounded bg-white text-primary border border-primary hover:bg-surface-subtle transition-colors font-label-md text-label-md flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[18px]">calculate</span> Recalculate
        </button>
      </div>
    </div>
  );
};

const InfoField = ({ label, value }: { label: string; value: string }) => {
  return (
    <div>
      <p className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider mb-1">{label}</p>
      <p className="text-body-md font-body-md text-on-surface">{value}</p>
    </div>
  );
};

const AmountRow = ({ label, value, danger, muted }: { label: string; value: string; danger?: boolean; muted?: boolean }) => {
  return (
    <div className="flex justify-between items-center mb-2">
      <span className="text-body-md font-body-md text-on-surface">{label}</span>
      <span
        className={`font-data-tabular text-data-tabular ${
          danger ? 'text-status-error' : muted ? 'text-on-surface-variant' : 'text-on-surface'
        }`}
      >
        {value}
      </span>
    </div>
  );
};

export default ReturnOverviewCards;
