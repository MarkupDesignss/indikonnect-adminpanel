import type { ReturnStatus } from '@/types/returnRefund';

export const getReturnStatusBadge = (status: ReturnStatus) => {
  const base = 'inline-flex items-center px-2 py-0.5 rounded-full font-label-md text-[10px] uppercase tracking-wider';

  if (status === 'Pending') {
    return `${base} bg-[#fef3c7] text-[#92400e]`;
  }

  if (status === 'Approved') {
    return `${base} bg-[#d1fae5] text-[#065f46]`;
  }

  return `${base} bg-[#fee2e2] text-[#991b1b]`;
};
