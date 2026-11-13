// src/config/menu.ts

export interface MenuItem {
  path: string;
  label: string;
  icon: string;
  module?: string;
  permission?: string;
  anyOf?: string[];
  allOf?: string[];
  isHeading?: boolean;
  /** If true, item is ALWAYS visible regardless of permissions */
  isPublic?: boolean;
  children?: MenuItem[];
}

export const menuItems: MenuItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    isPublic: true,
  },

  {
    path: '/orders',
    label: 'Orders',
    icon: 'shopping_cart',
    module: 'order',
    permission: 'order.view',
    anyOf: ['order.view', 'order.details', 'order.allow'],
  },

  {
    path: '/inventory',
    label: 'Inventory',
    icon: 'inventory_2',
    module: 'inventory',
    anyOf: [
      'product.view',
      'category.view',
      'attribute.view',
      'tax_category.view',
      'stock.view',
    ],
    children: [
      {
        path: '/inventory/categories',
        label: 'Categories',
        icon: 'category',
        permission: 'category.view',
        module: 'category',
      },
      {
        path: '/cms/brands',
        label: 'Brands',
        icon: 'sell',
        permission: 'brand.view',
        module: 'brand',
      },
      {
        path: '/inventory/SubCategories',
        label: 'Sub Categories',
        icon: 'account_tree',
        permission: 'category.view',
        module: 'category',
      },
      {
        path: '/inventory/tax-categories',
        label: 'Tax Categories',
        icon: 'percent',
        permission: 'tax_category.view',
        module: 'tax_category',
      },
      {
        path: '/inventory/products',
        label: 'Products',
        icon: 'shopping_bag',
        permission: 'product.view',
        module: 'product',
      },
      {
        path: '/inventory/stock',
        label: 'Stock',
        icon: 'warehouse',
        permission: 'stock.view',
        module: 'stock',
      },
      {
        path: '/coupons',
        label: 'Promo Codes',
        icon: 'local_offer',
        permission: 'promocode.view',
        module: 'promocode',
      },
    ],
  },

  // ✅ Warehouse section
  {
    path: '/warehouse',
    label: 'Warehouse',
    icon: 'warehouse',
    module: 'warehouse',
    anyOf: ['warehouse.view', 'warehouse.create', 'warehouse.update'],
    children: [
      {
        path: '/Addwarehouse',
        label: 'Add Warehouse',
        icon: 'add_business',
        permission: 'warehouse.create',
        module: 'warehouse',
      },
      {
        path: '/Productsaasignment',
        label: 'Product Assignment',
        icon: 'assignment_ind',
        permission: 'warehouse.update',
        module: 'warehouse',
      },
      {
        path: '/warehouse/inventory',
        label: 'Inventory Update',
        icon: 'inventory_2',
        permission: 'warehouse.update',
        module: 'warehouse_inventory',
      },
      {
        path: '/warehouse/products',
        label: 'Warehouse Products',
        icon: 'shopping_bag',
        permission: 'warehouse.update',
        module: 'warehouse_product',
      },
    ],
  },

  {
    path: '/finance-heading',
    label: 'Finance',
    icon: 'account_balance',
    isHeading: true,
    children: [
      {
        path: '/finance',
        label: 'Order Operations',
        icon: 'account_balance',
        module: 'finance',
        anyOf: [
          'payout.view',
          'return_refund.view',
          'Cancel.details',
          'Buyback.details',
          'Partner Data Exports.view',
        ],
        children: [
          {
            path: '/return-refund',
            label: 'Returns & Refunds',
            icon: 'assignment_return',
            permission: 'return_refund.view',
            module: 'return_refund',
          },
          {
            path: '/Fiance/CancelRefund',
            label: 'Cancel & Refunds',
            icon: 'currency_exchange',
            permission: 'Cancel.details',
            module: 'Cancel',
          },
          {
            path: '/Fiance/BuyBack',
            label: 'Buy Back',
            icon: 'replay',
            permission: 'Buyback.details',
            module: 'Buyback',
          },
          {
            path: '/CreditNotes',
            label: 'Credit Notes',
            icon: 'receipt_long',
            permission: 'payout.view',
            module: 'payout',
          },

          {
            path: '/Fiance/CommissionCalendar',
            label: 'Commission History',
            icon: 'calendar_month',
            permission: 'payout.view',
            module: 'payout',
            anyOf: [
              'payout.view',
              'finance.commission-export',
              'finance.commission_export',
              'finance.commissionExport',
            ],
          },

          {
            path: '/Payment',
            label: 'Payment Summary',
            icon: 'payments',
            permission: 'payout.view',
            module: 'payout',
          },

          {
            path: '/IgniteExports',
            label: 'Partner Data Exports',
            icon: 'receipt_long',
            module: 'Partner Data Exports',
            permission: 'partner data exports.view',
            anyOf: [
              'partner data exports.view',
              'partner data exports.download',
            ],
          },
        ],
      },
    ],
  },
  {
    path: '/sales/report',
    label: 'Sales Report',
    icon: 'trending_up',
    module: 'sales',
    permission: 'sales.report',
    anyOf: ['sales.report'],
  },

  {
    path: '/UserManagement',
    label: 'User Management',
    icon: 'group',
    module: 'user',
    permission: 'user.view',
    anyOf: ['user.view', 'user.create', 'user.update', 'user.delete'],
  },

  {
    path: '/CorrectionRequests',
    label: 'Correction Requests',
    icon: 'published_with_changes',
    module: 'correction',
    permission: 'correction.view',
    anyOf: ['correction.view', 'correction.send_link', 'user.view'],
  },

  {
    path: '/cms',
    label: 'CMS Management',
    icon: 'web',
    module: 'cms',
    anyOf: ['header.view', 'content.view', 'footer.view'],
    children: [
      {
        path: '/cms/header',
        label: 'Header Management',
        icon: 'vertical_align_top',
        permission: 'header.view',
        module: 'header',
      },
      {
        path: '/cms/content',
        label: 'Content Management',
        icon: 'description',
        permission: 'content.view',
        module: 'content',
      },
      {
        path: '/cms/LandingPageManagement',
        label: 'LandingPage Management',
        icon: 'description',
        permission: 'content.view',
        module: 'content',
      },
      {
        path: '/cms/ReelsManagement',
        label: 'Reels Management',
        icon: 'movie',
        permission: 'content.view',
        module: 'content',
      },
      {
        path: '/cms/TestimonialsManagement',
        label: 'Testimonials Management',
        icon: 'format_quote',
        permission: 'content.view',
        module: 'content',
      },
      {
        path: '/cms/footer',
        label: 'Footer Management',
        icon: 'vertical_align_bottom',
        permission: 'footer.view',
        module: 'footer',
      },
      {
        path: '/cms/NotificationTemplates',
        label: 'Notification Templates',
        icon: 'notifications_active',
        permission: 'view',
        module: 'Notification Templates', 
      },
    ],
  },

  {
    path: '/cms/faq',
    label: 'FAQ Management',
    icon: 'quiz',
    permission: 'content.view',
    module: 'content',
    children: [
      {
        path: '/cms/SectionManagement',
        label: 'Section Management',
        icon: 'view_agenda',
        permission: 'content.view',
        module: 'content',
      },
      {
        path: '/cms/FAQManagement',
        label: 'FAQ Management',
        icon: 'quiz',
        permission: 'content.view',
        module: 'content',
      },
    ],
  },

  {
    path: '/RoleManagement',
    label: 'Role Management',
    icon: 'admin_panel_settings',
    module: 'role',
    anyOf: ['role.view', 'admin_member.view'],
    children: [
      {
        path: '/RoleManagement/role',
        label: 'Roles & Permissions',
        icon: 'lock',
        permission: 'role.view',
        module: 'role',
      },
      {
        path: '/RoleManagement/addmember',
        label: 'Add Member',
        icon: 'person_add',
        permission: 'add_member.create',
        module: 'add_member',
      },
    ],
  },

  {
    path: '/reviews',
    label: 'Reviews Moderation',
    icon: 'rate_review',
    permission: 'review.view',
    module: 'review',
  },
  {
    path: '/subscribers',
    label: 'Newsletter',
    icon: 'subscriptions',
    permission: 'subscriber.view',
    module: 'subscriber',
  },
  {
    path: '/notifications',
    label: 'Notifications',
    icon: 'notifications',
    permission: 'notification.view',
    module: 'notification',
  },
  {
    path: '/contact',
    label: 'Contact',
    icon: 'contact_mail',
    permission: 'contact_us.view',
    module: 'contact_us',
  },

  // ✅ Account items — ALWAYS visible to every logged-in user
  {
    path: '/UpdateProfile',
    label: 'Update Profile',
    icon: 'person',
    isPublic: true,
  },
  {
    path: '/ChangePassword',
    label: 'Change Password',
    icon: 'lock',
    isPublic: true,
  },
  {
    path: '/SettingsManagement',
    label: 'Admin Settings',
    icon: 'settings',
    module: 'Admin Settings',
    permission: 'Admin Settings.view',
  },
];