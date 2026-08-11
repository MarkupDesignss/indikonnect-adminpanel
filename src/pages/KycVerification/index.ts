import React from 'react';
import type { RouteObject } from 'react-router-dom';
import CoinManagement from './CoinManagement';
import KycVerification from './KycVerification';

export { default } from './KycVerification';

export const kycRoutes: RouteObject[] = [
  { path: 'kyc', element: React.createElement(KycVerification) },
  { path: 'kyc/coin-management', element: React.createElement(CoinManagement) },
];
