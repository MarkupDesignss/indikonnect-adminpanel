import React from 'react';
import type { RouteObject } from 'react-router-dom';
import Dashboard from './dashboard';

export { default } from './dashboard';

export const dashboardRoutes: RouteObject[] = [
  { path: 'dashboard', element: React.createElement(Dashboard) },
];
