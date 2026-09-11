import type { ReturnRequest } from '@/types/returnRefund';
import { getReturnStatusBadge } from '../returnStatus';

interface ReturnDetailHeaderProps {
  request: ReturnRequest;
}

const ReturnDetailHeader = ({ request }: ReturnDetailHeaderProps) => {
  return (
    <div className="bg-white border-b border-border-light px-8 py-6 sticky top-0 z-10 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg-mobile md:font-headline-lg text-primary">
              #{request.id}
            </h2>
            <span className={getReturnStatusBadge(request.status)} style={{ padding: '0.25rem 0.75rem' }}>
              {request.status} Review
            </span>
          </div>
          <p className="text-body-md font-body-md text-on-surface-variant">
            Submitted on {request.submitted || request.date}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={request.status !== 'Pending'}
            className="px-4 py-2 rounded bg-white text-status-error border border-status-error hover:bg-[#fef2f2] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-label-md text-label-md"
          >
            Reject
          </button>
          <button
            type="button"
            disabled={request.status !== 'Pending'}
            className="px-4 py-2 rounded bg-primary text-on-primary hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-label-md text-label-md shadow-sm"
          >
            Approve Return
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnDetailHeader;
