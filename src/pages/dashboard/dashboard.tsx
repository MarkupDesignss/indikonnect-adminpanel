import React, { useMemo } from 'react';
import {
  getDashboardMetrics,
  getChartDays,
  getRecentOrders,
  getKycReviews,
  getInventoryAlerts,
  getTickets
} from '../../services/dashboardService';

import { DashboardKpiCards } from './components/DashboardKpiCards';
import { DashboardSalesAnalytics } from './components/DashboardSalesAnalytics';
import { DashboardRecentOrders } from './components/DashboardRecentOrders';
import { DashboardAlerts } from './components/DashboardAlerts';
import { DashboardTicketsAndActions } from './components/DashboardTicketsAndActions';

const Dashboard = () => {
  const metrics = useMemo(() => getDashboardMetrics(), []);
  const chartDays = useMemo(() => getChartDays(), []);
  const recentOrders = useMemo(() => getRecentOrders(), []);
  const kycReviews = useMemo(() => getKycReviews(), []);
  const inventoryAlerts = useMemo(() => getInventoryAlerts(), []);
  const tickets = useMemo(() => getTickets(), []);

  return (
    <div className="space-y-8">
      {/* Mobile page header */}
      <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:hidden">Dashboard</h1>

      {/* KPI Cards */}
      <DashboardKpiCards metrics={metrics} />

      {/* Analytics & Recent Orders */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <DashboardSalesAnalytics chartDays={chartDays} />
        <DashboardRecentOrders recentOrders={recentOrders} />
      </div>

      {/* Two-Column Grid (Secondary Info) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-8">
        {/* Left Column: KYC & Inventory Alerts */}
        <DashboardAlerts kycReviews={kycReviews} inventoryAlerts={inventoryAlerts} />

        {/* Right Column: Support Tickets & Quick Actions */}
        <DashboardTicketsAndActions tickets={tickets} />
      </div>
    </div>
  );
};

export default Dashboard;