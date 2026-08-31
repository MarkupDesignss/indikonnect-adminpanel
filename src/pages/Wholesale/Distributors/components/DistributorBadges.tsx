import type { DistributorRank, DistributorStatus } from '@/types/wholesale';

export const getDistributorRankClass = (rank: DistributorRank) => {
  if (rank === 'Diamond') {
    return 'bg-secondary-fixed text-on-secondary-fixed';
  }

  if (rank === 'Gold') {
    return 'bg-yellow-100 text-yellow-800';
  }

  return 'bg-gray-200 text-gray-800';
};

export const getDistributorStatusClass = (status: DistributorStatus) => {
  if (status === 'Verified') {
    return 'bg-green-100 text-status-success';
  }

  return 'bg-yellow-100 text-status-warning';
};

export const getDistributorStatusDotClass = (status: DistributorStatus) => {
  if (status === 'Verified') {
    return 'bg-status-success';
  }

  return 'bg-status-warning';
};
