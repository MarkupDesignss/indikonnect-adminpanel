import React from 'react';
import type { RouteObject } from 'react-router-dom';
import BuyBack from '@/pages/BuyBack';
import Categories from './categories';
import Products from './product';
import Inventory from './WarehouseInventory';
import TaxCategories from './categories/Taxcategories';
import Stock from './Stock'; // Import the Stock component (adjust path as needed)

export { default } from './WarehouseInventory';

export const inventoryRoutes: RouteObject[] = [
  { path: 'inventory', element: React.createElement(Inventory) },
  { path: 'inventory/buyback', element: React.createElement(BuyBack) },
  { path: 'inventory/categories', element: React.createElement(Categories) },
  { path: 'inventory/products', element: React.createElement(Products) },
  { path: 'inventory/tax-categories', element: React.createElement(TaxCategories) },
  { path: 'inventory/stock', element: React.createElement(Stock) }, // ✅ New route added
];