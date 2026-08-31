import React from 'react';
import type { RouteObject } from 'react-router-dom';
import ReturnRefund from './ReturnRefund';

export { default } from './ReturnRefund';

export const returnRefundRoutes: RouteObject[] = [
  { path: 'return-refund', element: React.createElement(ReturnRefund) },
];
