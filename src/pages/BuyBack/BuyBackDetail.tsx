import type { BuyBackRequest } from '@/types/buyBack';
import { getBuyBackStatusBadge } from './buyBackStatus';

interface BuyBackDetailProps {
  request: BuyBackRequest;
}

const BuyBackDetail = ({ request }: BuyBackDetailProps) => {
  return (
    <div className="hidden md:flex flex-1 flex-col bg-surface border border-border-light rounded-lg h-full overflow-hidden shadow-sm">
      <BuyBackDetailHeader request={request} />

      <div className="flex-1 overflow-y-auto custom-scroll p-6 space-y-8 bg-surface-subtle">
        <ProductEligibilitySection request={request} />
        <InspectionSection request={request} />
        <FinancialSummarySection request={request} />
      </div>
    </div>
  );
};

const BuyBackDetailHeader = ({ request }: BuyBackDetailProps) => {
  return (
    <div className="p-6 border-b border-border-light flex justify-between items-start bg-surface shrink-0">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h2 className="font-headline-lg text-headline-lg text-primary">Request {request.id}</h2>
          <span className={`px-3 py-1 rounded-full ${getBuyBackStatusBadge(request.status)} flex items-center gap-1`}>
            {request.status === 'Pending' && <span className="material-symbols-outlined text-[16px]">pending</span>}
            {request.status}
          </span>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-4">
          <span>
            <strong className="text-primary">Distributor:</strong> {request.distributor}
          </span>
          <span className="w-1 h-1 rounded-full bg-outline-variant" />
          <span>
            <strong className="text-primary">Submitted:</strong> {request.date} 14:30 EST
          </span>
        </p>
      </div>
      <div className="flex gap-3">
        <ActionButton icon="close" label="Reject" />
        <ActionButton icon="search_check" label="Send to Inspection" />
        <button className="px-4 py-2 bg-primary text-on-primary rounded hover:bg-secondary-container hover:text-on-secondary-container transition-colors font-body-md text-body-md font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span> Approve
        </button>
      </div>
    </div>
  );
};

const ProductEligibilitySection = ({ request }: BuyBackDetailProps) => {
  return (
    <section className="bg-surface rounded-lg border border-border-light p-5">
      <h3 className="font-title-lg text-title-lg text-primary mb-4 flex items-center gap-2 border-b border-border-light pb-2">
        <span className="material-symbols-outlined text-secondary">inventory_2</span> Product Details &amp; Eligibility
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="mb-4">
            <span className="font-label-md text-label-md text-outline uppercase tracking-wider block mb-1">Product Name</span>
            <p className="font-body-lg text-body-lg text-primary font-medium">{request.product}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DetailField label="SKU" value={request.sku} />
            <DetailField label="Quantity" value={`${request.quantity} Units`} />
            <DetailField label="Original Purchase" value={request.originalPurchase} />
            <DetailField label="PO Number" value={request.poNumber} link />
          </div>
        </div>

        <div className="bg-surface-subtle p-4 rounded border border-border-light">
          <span className="font-label-md text-label-md text-primary font-bold uppercase tracking-wider block mb-3">
            Eligibility Criteria
          </span>
          <ul className="space-y-3">
            <EligibilityItem label="Within 90-day return window" value={request.eligibility.withinReturnWindow} />
            <EligibilityItem label="Original packaging intact" value={request.eligibility.originalPackaging} />
            <EligibilityItem label="Unused / Factory condition" value={request.eligibility.unusedCondition} />
          </ul>
        </div>
      </div>
    </section>
  );
};

const InspectionSection = ({ request }: BuyBackDetailProps) => {
  return (
    <section className="bg-surface rounded-lg border border-border-light p-5">
      <div className="flex justify-between items-center mb-4 border-b border-border-light pb-2">
        <h3 className="font-title-lg text-title-lg text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">fact_check</span> Inspection Report
        </h3>
        <button className="text-secondary hover:text-on-secondary-container font-label-md text-label-md uppercase font-bold flex items-center gap-1 transition-colors">
          <span className="material-symbols-outlined text-[16px]">edit</span> Edit Report
        </button>
      </div>
      {request.inspection ? (
        <div className="p-4 bg-surface-subtle rounded border border-border-light">
          <p className="font-body-md text-body-md text-on-surface-variant">{request.inspection.report}</p>
        </div>
      ) : (
        <div className="py-8 flex flex-col items-center justify-center text-center bg-surface-subtle border border-dashed border-border-light rounded">
          <span className="material-symbols-outlined text-[48px] text-outline-variant mb-3">image_search</span>
          <h4 className="font-body-lg text-body-lg font-medium text-primary mb-1">No Inspection Data Yet</h4>
          <p className="font-body-md text-body-md text-outline max-w-md">
            Items must be received at the warehouse before an inspection report can be generated.
          </p>
          <button className="mt-4 px-4 py-2 bg-surface text-primary border border-primary rounded hover:bg-surface-container-low transition-colors font-body-md text-body-md font-medium">
            Log Receipt &amp; Begin Inspection
          </button>
        </div>
      )}
    </section>
  );
};

const FinancialSummarySection = ({ request }: BuyBackDetailProps) => {
  const unitPrice = request.financials.originalPrice / request.quantity;

  return (
    <section className="bg-surface rounded-lg border border-border-light p-5">
      <h3 className="font-title-lg text-title-lg text-primary mb-4 flex items-center gap-2 border-b border-border-light pb-2">
        <span className="material-symbols-outlined text-secondary">account_balance_wallet</span> Financial Summary
      </h3>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <table className="w-full text-left font-data-tabular text-data-tabular">
            <thead>
              <tr className="text-outline uppercase font-label-md text-label-md border-b border-border-light">
                <th className="pb-2 font-normal">Description</th>
                <th className="pb-2 font-normal text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              <FinancialRow
                label={`Original Purchase Price (${request.quantity} Units @ $${unitPrice.toFixed(2)})`}
                value={`$${request.financials.originalPrice.toFixed(2)}`}
              />
              <FinancialRow label="Restocking Fee (15%)" value={`-$${request.financials.restockingFee.toFixed(2)}`} danger />
              <FinancialRow
                label="Estimated Depreciation"
                value={`-$${request.financials.depreciation.toFixed(2)}`}
                danger
                suffix="(Pending Insp.)"
              />
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-primary">
                <td className="py-3 font-bold text-primary font-body-lg text-body-lg">Estimated Buy-Back Value</td>
                <td className="py-3 text-right font-bold text-primary font-headline-md text-headline-md">
                  ${request.financials.estimatedValue.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="w-full lg:w-64 bg-surface-container-low p-4 rounded border border-border-light flex flex-col justify-center">
          <span className="font-label-md text-label-md text-outline uppercase tracking-wider block mb-2 text-center">
            Payment Status
          </span>
          <div className="text-center mb-4">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border font-label-md text-label-md ${getPaymentStatusClass(request.financials.paymentStatus)}`}>
              <span className="material-symbols-outlined text-[16px]">{getPaymentStatusIcon(request.financials.paymentStatus)}</span>
              {request.financials.paymentStatus}
            </span>
          </div>
          <p className="font-label-md text-label-md text-on-surface-variant text-center">
            Funds will be credited to the distributor account balance upon final approval.
          </p>
        </div>
      </div>
    </section>
  );
};

const ActionButton = ({ icon, label }: { icon: string; label: string }) => {
  return (
    <button className="px-4 py-2 bg-surface text-primary border border-border-light rounded hover:border-primary hover:bg-surface-subtle transition-colors font-body-md text-body-md font-medium flex items-center gap-2">
      <span className="material-symbols-outlined text-[18px]">{icon}</span> {label}
    </button>
  );
};

const DetailField = ({ label, value, link }: { label: string; value: string; link?: boolean }) => {
  return (
    <div>
      <span className="font-label-md text-label-md text-outline uppercase tracking-wider block mb-1">{label}</span>
      <p className={`font-data-tabular text-data-tabular ${link ? 'text-secondary underline cursor-pointer' : 'text-primary'}`}>
        {value}
      </p>
    </div>
  );
};

const EligibilityItem = ({ label, value }: { label: string; value: boolean | null }) => {
  return (
    <li className="flex items-center gap-3">
      <span className={`material-symbols-outlined ${value === false ? 'text-status-error' : value === true ? 'text-status-success' : 'text-status-warning'}`}>
        {value === false ? 'cancel' : value === true ? 'check_circle' : 'help'}
      </span>
      <span className="font-body-md text-body-md text-on-surface-variant">{label}</span>
      {value === true && <span className="ml-auto text-status-success font-label-md text-label-md">Pass</span>}
      {value === false && <span className="ml-auto text-status-error font-label-md text-label-md">Fail</span>}
      {value === null && <span className="ml-auto text-outline font-label-md text-label-md italic">Pending Inspection</span>}
    </li>
  );
};

const FinancialRow = ({
  danger,
  label,
  suffix,
  value,
}: {
  danger?: boolean;
  label: string;
  suffix?: string;
  value: string;
}) => {
  return (
    <tr>
      <td className={`py-3 ${danger ? 'text-status-error' : 'text-primary'}`}>
        {danger && <span className="material-symbols-outlined text-[14px] align-middle mr-1">remove</span>}
        {label}
      </td>
      <td className={`py-3 text-right ${danger ? 'text-status-error' : 'text-primary'}`}>
        {value} {suffix && <span className="text-outline text-[11px] italic ml-1">{suffix}</span>}
      </td>
    </tr>
  );
};

const getPaymentStatusClass = (status: BuyBackRequest['financials']['paymentStatus']) => {
  if (status === 'Processed') {
    return 'bg-status-success/10 text-status-success border-status-success/20';
  }

  if (status === 'Rejected') {
    return 'bg-status-error/10 text-status-error border-status-error/20';
  }

  return 'bg-surface text-outline border-border-light';
};

const getPaymentStatusIcon = (status: BuyBackRequest['financials']['paymentStatus']) => {
  if (status === 'Processed') {
    return 'check_circle';
  }

  if (status === 'Rejected') {
    return 'cancel';
  }

  return 'hourglass_empty';
};

export default BuyBackDetail;
