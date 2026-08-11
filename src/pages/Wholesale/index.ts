import React from 'react';
import type { RouteObject } from 'react-router-dom';
import Distributors from './Distributors';
import Wholesale from './Wholesale';

export { default } from './Wholesale';

export const wholesaleRoutes: RouteObject[] = [
  { path: 'wholesale', element: React.createElement(Wholesale) },
  { path: 'wholesale/distributors', element: React.createElement(Distributors) },
];
