import type { ReturnRequest } from '@/types/returnRefund';
import InternalNotes from './InternalNotes';
import ReturnDetailHeader from './ReturnDetailHeader';
import ReturnEvidence from './ReturnEvidence';
import ReturnOverviewCards from './ReturnOverviewCards';
import ReturnReasonItems from './ReturnReasonItems';

interface ReturnDetailProps {
  request: ReturnRequest;
}

const ReturnDetail = ({ request }: ReturnDetailProps) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-surface-subtle overflow-y-auto">
      <ReturnDetailHeader request={request} />

      <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
        <ReturnOverviewCards request={request} />
        <ReturnReasonItems request={request} />
        <ReturnEvidence evidence={request.evidence} />
        <InternalNotes notes={request.notes} />
      </div>
    </div>
  );
};

export default ReturnDetail;
