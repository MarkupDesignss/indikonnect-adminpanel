export const getDashboardMetrics = () => [
  {
    label: 'Total Sales',
    value: '$24,500',
    icon: 'attach_money',
    trendIcon: 'trending_up',
    change: '+12.5%',
    note: 'vs last week',
    toneClass: 'text-status-success',
    featured: true,
  },
  { label: 'Orders', value: '156', icon: 'shopping_cart', trendIcon: 'trending_up', change: '+8.2%', toneClass: 'text-status-success' },
  { label: 'Customers', value: '89', icon: 'groups', trendIcon: 'trending_flat', change: '+2.1%', toneClass: 'text-status-warning' },
  { label: 'Distributors', value: '12', icon: 'local_shipping', trendIcon: 'trending_up', change: '+1', toneClass: 'text-status-success' },
  { label: 'Revenue', value: '$18,200', icon: 'account_balance_wallet', trendIcon: 'trending_down', change: '-3.4%', toneClass: 'text-status-error' },
];

export const getChartDays = () => [
  { day: 'Mon', height: 'h-[40%]', isCurrent: false },
  { day: 'Tue', height: 'h-[60%]', isCurrent: false },
  { day: 'Wed', height: 'h-[30%]', isCurrent: false },
  { day: 'Thu', height: 'h-[80%]', isCurrent: false },
  { day: 'Fri', height: 'h-[100%]', isCurrent: true, value: '$6,200' },
  { day: 'Sat', height: 'h-[50%]', isCurrent: false },
  { day: 'Sun', height: 'h-[70%]', isCurrent: false },
];

export const getRecentOrders = () => [
  { id: '#ORD-092', customer: 'Apex Dist.', total: '$1,240', status: 'Pending', badgeClass: 'bg-status-warning/20 text-status-warning' },
  { id: '#ORD-091', customer: 'Nexus Goods', total: '$850', status: 'Shipped', badgeClass: 'bg-primary/10 text-primary' },
  { id: '#ORD-090', customer: 'Global Tech', total: '$3,100', status: 'Delivered', badgeClass: 'bg-status-success/20 text-status-success' },
  { id: '#ORD-089', customer: 'Prime Retail', total: '$420', status: 'Delivered', badgeClass: 'bg-status-success/20 text-status-success' },
  { id: '#ORD-088', customer: 'Alpha Corp', total: '$2,150', status: 'Shipped', badgeClass: 'bg-primary/10 text-primary' },
];

export const getKycReviews = () => [
  ['Meridian Traders', 'Submitted 2 hours ago'],
  ['Zenith Wholesale', 'Submitted 5 hours ago'],
  ['Summit Supplies', 'Submitted 1 day ago'],
];

export const getInventoryAlerts = () => [
  { name: 'Widget Pro Max', stock: '3 left', toneClass: 'text-status-error' },
  { name: 'Standard Gizmo', stock: '12 left', toneClass: 'text-status-warning' },
  { name: 'Premium Case', stock: 'Out of stock', toneClass: 'text-status-error' },
];

export const getTickets = () => [
  { title: 'Shipping Delay Inquiry', source: 'From: Apex Dist. (Ticket #4092)', time: '10m ago', status: 'Urgent', badgeClass: 'bg-status-error/10 text-status-error' },
  { title: 'Invoice Discrepancy', source: 'From: Nexus Goods (Ticket #4091)', time: '2h ago', status: 'Open', badgeClass: 'bg-surface-dim text-on-surface-variant' },
];
