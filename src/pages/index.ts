import { compensationRoutes } from './Compensation';
import { dashboardRoutes } from './dashboard';
import { genealogyRoutes } from './Geneology';
import { inventoryRoutes } from './Inventory';
import { kycRoutes } from './KycVerification';
import { orderRoutes } from './orders';
import { returnRefundRoutes } from './ReturnRefund';
import { reviewRoutes } from './ReviewsModeration';
import { wholesaleRoutes } from './Wholesale';

export const appRoutes = [
  ...dashboardRoutes,
  ...orderRoutes,
  ...inventoryRoutes,
  ...compensationRoutes,
  ...returnRefundRoutes,
  ...wholesaleRoutes,
  ...genealogyRoutes,
  ...kycRoutes,
  ...reviewRoutes,
];
