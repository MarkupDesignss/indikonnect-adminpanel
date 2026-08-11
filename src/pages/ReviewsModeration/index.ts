import React from 'react';
import type { RouteObject } from 'react-router-dom';
import ReviewsModeration from './ReviewsModeration';

export { default } from './ReviewsModeration';

export const reviewRoutes: RouteObject[] = [
  { path: 'reviews', element: React.createElement(ReviewsModeration) },
];
