import React from 'react';

// Status badge styles
export const getStatusBadge = (status: string) => {
  const base = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border';
  switch (status.toLowerCase()) {
    case 'pending':
      return `${base} bg-amber-100 text-status-warning border-amber-200`;
    case 'approved':
      return `${base} bg-emerald-100 text-status-success border-emerald-200`;
    case 'rejected':
      return `${base} bg-red-100 text-status-error border-red-200`;
    default:
      return `${base} bg-gray-100 text-on-surface-variant border-border-light`;
  }
};
