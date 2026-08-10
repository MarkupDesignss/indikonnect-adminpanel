import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/pages/dashboard/dashboard';
import Orders from '@/pages/orders/Orders';
import Inventory from '@/pages/Inventory/WarehouseInventory';
import Categories from '@/pages/Inventory/categories/Addcategories';
import Products from '@/pages/Inventory/product/Products';
import ReviewsModeration from '@/pages/ReviewsModeration/ReviewsModeration';
import Compensation from '@/pages/Compensation/CompensationManagement';
import KYCVerification from '@/pages/KycVerification/KycVerification';
import Wholesale from '@/pages/Wholesale/Wholesale';
// ... import other pages

export const router = createBrowserRouter([
  {
    path: '/',
    element: React.createElement(MainLayout),
    children: [
      { index: true, element: React.createElement(Navigate, { to: '/dashboard', replace: true }) },
      { path: 'dashboard', element: React.createElement(Dashboard) },
      { path: 'orders', element: React.createElement(Orders) },
      { path: 'inventory', element: React.createElement(Inventory) },
      { path: 'inventory/categories', element: React.createElement(Categories) },
      { path: 'inventory/products', element: React.createElement(Products) },
      { path: 'analytics', element: React.createElement(Compensation) },
      { path: 'reviews', element: React.createElement(ReviewsModeration) },
      { path: 'kyc', element: React.createElement(KYCVerification) },
      { path: 'wholesale', element: React.createElement(Wholesale) },
      // ... add all routes
    ],
  },
]);
