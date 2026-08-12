import type { CustomerStatus } from '@/types/wholesale';

interface CustomerStatusBadgeProps {
  status: CustomerStatus;
}

const CustomerStatusBadge = ({ status }: CustomerStatusBadgeProps) => {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
        status === 'Active' ? 'bg-status-success/10 text-status-success' : 'bg-status-warning/10 text-status-warning'
      }`}
    >
      {status}
    </span>
  );
};

export default CustomerStatusBadge;
