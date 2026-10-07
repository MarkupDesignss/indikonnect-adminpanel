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
  children?: MenuItem[];
}

export const menuItems: MenuItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
  },

  {
    path: '/UserManagement',
    label: 'User Management',
    icon: 'people',
    module: 'user',
    permission: 'user.view',
    anyOf: ['user.view', 'user.details', 'user.change_status'],
  },

  {
    path: '/orders',
    label: 'Orders',
    icon: 'shopping_cart',
    module: 'order',
    permission: 'order.view',
    anyOf: ['order.view', 'order.details'],
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
    ],
    children: [
      {
        path: '/cms/brands',
        label: 'Brands',
        icon: 'sell',
        permission: 'brand.view',
        module: 'brand',
      },
      {
        path: '/inventory/categories',
        label: 'Categories',
        icon: 'category',
        permission: 'category.view',
        module: 'category',
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
        path: '/inventory/AttributesManagement',
        label: 'Attributes Management',
        icon: 'tune',
        permission: 'attribute.view',
        module: 'attribute',
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
    ],
  },

  {
    path: '/finance',
    label: 'Finance',
    icon: 'account_balance',
    module: 'finance',
    anyOf: ['payout.view', 'return_refund.view'],
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
        path: '/Payment',
        label: 'Payment Summary',
        icon: 'payments',
        permission: 'payout.view',
        module: 'payout',
      },
    ],
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
        path: '/cms/faq',
        label: 'FAQ Management',
        icon: 'quiz',
        isHeading: true,
        permission: 'content.view',
        module: 'content',
        children: [
          {
            path: 'cms/SectionManagement',
            label: 'Section Management',
            icon: 'view_agenda',
            permission: 'content.view',
            module: 'content',
          },
          {
            path: 'cms/FAQManagement',
            label: 'FAQ Management',
            icon: 'quiz',
            permission: 'content.view',
            module: 'content',
          },
        ],
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
        permission: 'notification.view',
        module: 'notification',
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
        permission: 'admin_member.create',
        module: 'admin_member',
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

  // ✅ Common — no permission needed
  {
    path: '/ChangePassword',
    label: 'Change Password',
    icon: 'lock',
  },
  {
    path: '/UpdateProfile',
    label: 'Update Profile',
    icon: 'person',
  },
  {
    path: '/SettingsManagement',
    label: 'Admin Settings',
    icon: 'settings',
    module: 'settings',
    permission: 'settings.view',
  },
];