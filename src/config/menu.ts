export const menuItems = [
  { 
    path: '/dashboard', 
    label: 'Dashboard', 
    icon: 'dashboard' 
  },
  { 
    path: '/UserManagement', 
    label: 'User Management', 
    icon: 'people' 
  },
  { 
    path: '/inventory', 
    label: 'Inventory', 
    icon: 'inventory_2',
    children: [
      { path: '/cms/brands', label: 'Brands', icon: 'brands' },
      { path: '/inventory/categories', label: 'Categories', icon: 'category' },
      { path: '/inventory/tax-categories', label: 'Tax Categories', icon: 'percent' },
      { path: '/inventory/AttributesManagement', label: 'Attributes Management', icon: 'tune' },
      { path: '/inventory/products', label: 'Products', icon: 'shopping_bag' },
      { path: '/inventory/stock', label: 'Stock', icon: 'warehouse' },
    ]
  },
  { 
    path: '/orders', 
    label: 'Orders', 
    icon: 'shopping_cart' 
  },
  { 
    path: '/return-refund', 
    label: 'Returns & Refunds', 
    icon: 'assignment_return' 
  },
  { 
    path: '/CreditNotes', 
    label: 'Credit Notes', 
    icon: 'assignment_return' 
  },
  { 
    path: '/coupons', 
    label: 'Promo Codes', 
    icon: 'local_offer' 
  },
  { 
    path: '/Payment', 
    label: 'Payment Summary', 
    icon: 'payments'
  },
  { 
    path: '/RoleManagement', 
    label: 'Role Management', 
    icon: 'admin_panel_settings',
    children: [
      { 
        path: '/RoleManagement/role', 
        label: 'Roles & Permissions', 
        icon: 'lock' 
      },
      { 
        path: '/RoleManagement/addmember', 
        label: 'Add Member', 
        icon: 'person_add' 
      },
    ]
  },
  { 
    path: '/cms', 
    label: 'CMS Management', 
    icon: 'web',
    children: [
      { path: '/cms/header', label: 'Header Management', icon: 'vertical_align_top' },
      { path: '/cms/content', label: 'Content Management', icon: 'description' },
      { path: '/cms/growth', label: 'Leaders Management', icon: 'trending_up' },
      { path: '/cms/footer', label: 'Footer Management', icon: 'vertical_align_bottom' },
    ]
  },
  { 
    path: '/Payout', 
    label: 'Payout Management', 
    icon: 'account_balance_wallet'
  },
  { 
    path: '/BuyBack', 
    label: 'Buy Back', 
    icon: 'sync_alt'
  },
  { 
    path: '/reviews', 
    label: 'Reviews Moderation', 
    icon: 'rate_review' 
  },
  { 
    path: '/subscribers', 
    label: 'Subscribers', 
    icon: 'subscriptions' 
  },
  { 
    path: '/notifications', 
    label: 'Notifications', 
    icon: 'notifications' 
  },
  { 
    path: '/contact', 
    label: 'Contact', 
    icon: 'contact_mail' 
  },
  { 
    path: '/ChangePassword', 
    label: 'Change Password',  
    icon: 'lock'               
  },
  { 
    path: '/UpdateProfile', 
    label: 'Update Profile',   
    icon: 'person'             
  },
 
];