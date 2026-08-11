import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { appRoutes } from '@/pages';

export const router = createBrowserRouter([
  {
    path: '/',
    element: React.createElement(MainLayout),
    children: [
      { index: true, element: React.createElement(Navigate, { to: '/dashboard', replace: true }) },
      ...appRoutes,
    ],
  },
]);
