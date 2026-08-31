import React from 'react';
import type { RouteObject } from 'react-router-dom';
import Compensation from './CompensationManagement';

export { default } from './CompensationManagement';

export const compensationRoutes: RouteObject[] = [
  { path: 'analytics', element: React.createElement(Compensation) },
];
