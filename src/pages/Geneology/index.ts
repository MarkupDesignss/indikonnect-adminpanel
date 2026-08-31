import React from 'react';
import type { RouteObject } from 'react-router-dom';
import Genealogy from './Geneology';

export { default } from './Geneology';

export const genealogyRoutes: RouteObject[] = [
  { path: 'genealogy', element: React.createElement(Genealogy) },
];
