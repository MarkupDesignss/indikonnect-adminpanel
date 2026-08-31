import type { ReturnRequest } from '@/types/returnRefund';

interface ReturnReasonItemsProps {
  request: ReturnRequest;
}

const ReturnReasonItems = ({ request }: ReturnReasonItemsProps) => {
  return (
    <div className="bg-white rounded border border-border-light p-6">
      <div className="flex items-center gap-2 mb-4 border-b border-border-light pb-3">
        <span className="material-symbols-outlined text-outline">assignment_late</span>
        <h3 className="text-title-lg font-title-lg text-primary">Return Reason &amp; Items</h3>
      </div>
      {request.reason && (
        <div className="bg-[#fef2f2] border border-[#fecaca] rounded p-4 mb-6">
          <h4 className="text-body-md font-body-md text-[#991b1b] font-bold mb-1">Reason: {request.reason.title}</h4>
          <p className="text-body-md font-body-md text-[#7f1d1d]">{request.reason.description}</p>
        </div>
      )}
      <div className="border border-border-light rounded overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-primary text-on-primary text-label-md font-label-md uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-medium">Product / SKU</th>
              <th className="px-4 py-3 font-medium text-right">Qty</th>
              <th className="px-4 py-3 font-medium text-right">Unit Price</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-border-light text-body-md font-body-md text-on-surface">
            {request.itemDetails ? (
              request.itemDetails.map((item, index) => (
                <tr
                  key={item.sku}
                  className={index % 2 === 0 ? 'hover:bg-surface-subtle' : 'bg-surface-subtle hover:bg-surface-container-low'}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-primary">{item.name}</div>
                    <div className="text-on-surface-variant text-sm font-data-tabular">SKU: {item.sku}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-data-tabular">{item.qty}</td>
                  <td className="px-4 py-3 text-right font-data-tabular">${item.unitPrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-data-tabular font-medium">${item.total.toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-3 text-center text-on-surface-variant">
                  Item details unavailable
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReturnReasonItems;
