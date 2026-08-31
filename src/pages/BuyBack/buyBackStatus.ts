import type { BuyBackFilterTab, BuyBackStatus } from '@/types/buyBack';

export const buyBackFilterStatusMap: Record<BuyBackFilterTab, BuyBackStatus | ''> = {
  All: '',
  Pending: 'Pending',
  Eligible: 'Eligible',
  Inspection: 'In Inspection',
  Approved: 'Approved',
};

export const getBuyBackStatusBadge = (status: BuyBackStatus) => {
  const base = 'px-2 py-0.5 rounded-full font-label-md text-label-md border';

  if (status === 'Pending') {
    return `${base} bg-status-warning/10 text-status-warning border-status-warning/20`;
  }

  if (status === 'Eligible') {
    return `${base} bg-blue-100 text-blue-700 border-blue-200`;
  }

  if (status === 'In Inspection') {
    return `${base} bg-purple-100 text-purple-700 border-purple-200`;
  }

  if (status === 'Approved') {
    return `${base} bg-status-success/10 text-status-success border-status-success/20`;
  }

  return `${base} bg-status-error/10 text-status-error border-status-error/20`;
};
