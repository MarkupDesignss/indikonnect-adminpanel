export const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { 
    path: '/inventory', 
    label: 'Inventory', 
    icon: 'inventory_2',
    children: [
      { path: '/inventory/products', label: 'Products', icon: 'inventory' },
      { path: '/inventory/categories', label: 'Categories', icon: 'category' },
      { path: '/inventory/stock', label: 'Stock', icon: 'warehouse' },
      { path: '/inventory/tax-categories', label: 'Tax Categories', icon: 'percent' },
    ]
  },
  { path: '/orders', label: 'Orders', icon: 'shopping_cart' },
  { path: '/return-refund', label: 'Returns & Refunds', icon: 'assignment_return' },
  { 
    path: '/PaymentManagement', 
    label: 'Payment Management', 
    icon: 'payments',
  },
  { path: '/coupons', label: 'Promo Codes', icon: 'local_offer' },
  { path: '/UserManagement', label: 'User Management', icon: 'people' },
  { path: '/RoleManagement', label: 'Role Management', icon: 'admin_panel_settings' },
  { path: '/reviews', label: 'Reviews Moderation', icon: 'rate_review' },
  { path: '/subscribers', label: 'Subscribers', icon: 'subscriptions' },
  { path: '/notifications', label: 'Notifications', icon: 'notifications' },
  { path: '/contact', label: 'Contact', icon: 'contact_mail' },
  { 
    path: '/cms', 
    label: 'CMS Management', 
    icon: 'web',
    children: [
      { path: '/cms/header', label: 'Header Management', icon: 'header' },
      { path: '/cms/content', label: 'Content Management', icon: 'content' },
      { path: '/cms/growth', label: 'Leaders Management', icon: 'trending_up' },
      { path: '/cms/footer', label: 'Footer Management', icon: 'footer' },
    ]
  },
];