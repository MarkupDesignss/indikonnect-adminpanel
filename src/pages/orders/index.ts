import React from 'react';
import type { RouteObject } from 'react-router-dom';
import Orders from './Orders';

export { default } from './Orders';

export const orderRoutes: RouteObject[] = [
  { path: 'orders', element: React.createElement(Orders) },
];
