
export interface MenuItem {
  path: string;
  label: string;
  icon: string;
  module?: string;
  permission?: string;
  anyOf?: string[];
  allOf?: string[];
  isHeading?: boolean;
  isPublic?: boolean;
  children?: MenuItem[];
}

export const menuItems: MenuItem[] = [
  // =====================================================
  // DASHBOARD
  // =====================================================
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: "dashboard",
    isPublic: true,
  },

  // =====================================================
  // ORDERS
  // =====================================================
  {
    path: "/orders",
    label: "Orders",
    icon: "shopping_cart",
    module: "order",
    permission: "order.view",
    anyOf: ["order.view", "order.details", "order.allow"],
  },

  // =====================================================
  // INVENTORY
  // =====================================================
  {
    path: "/inventory",
    label: "Inventory",
    icon: "inventory_2",
    module: "inventory",
    anyOf: [
      "product.view",
      "category.view",
      "attribute.view",
      "tax_category.view",
      "stock.view",
    ],
    children: [
      {
        path: "/inventory/categories",
        label: "Categories",
        icon: "category",
        permission: "category.view",
        module: "category",
      },
      {
        path: "/cms/brands",
        label: "Brands",
        icon: "sell",
        permission: "brand.view",
        module: "brand",
      },
      {
        path: "/inventory/SubCategories",
        label: "Sub Categories",
        icon: "account_tree",
        permission: "sub category.view",
        module: "sub category",
      },
      {
        path: "/inventory/tax-categories",
        label: "Tax Categories",
        icon: "percent",
        permission: "tax_category.view",
        module: "tax_category",
      },
      {
        path: "/inventory/products",
        label: "Products",
        icon: "shopping_bag",
        permission: "product.view",
        module: "product",
      },
      {
        path: "/inventory/stock",
        label: "Stock",
        icon: "warehouse",
        permission: "stock.view",
        module: "stock",
      },
      {
        path: "/coupons",
        label: "Promo Codes",
        icon: "local_offer",
        permission: "promocode.view",
        module: "promocode",
      },
    ],
  },

  // =====================================================
  // WAREHOUSE
  // =====================================================
  {
    path: "/warehouse",
    label: "Warehouse",
    icon: "warehouse",
    module: "warehouse",
    anyOf: [
      "warehouse.view",
      "warehouse.create",
      "warehouse.edit",
    ],
    children: [
      {
        path: "/Addwarehouse",
        label: "Add Warehouse",
        icon: "add_business",
        permission: "warehouse.create",
        module: "warehouse",
      },
      {
        path: "/Productsaasignment",
        label: "Product Assignment",
        icon: "assignment_ind",
        permission: "product assignment.add",
        module: "product assignment",
      },
      {
        path: "/warehouse/inventory",
        label: "Inventory Update",
        icon: "inventory_2",
        permission: "warehouse_inventory.view",
        module: "warehouse_inventory",
      },
      {
        path: "/warehouse/products",
        label: "Warehouse Products",
        icon: "shopping_bag",
        permission: "warehouse_product.view",
        module: "warehouse_product",
      },
    ],
  },

  // =====================================================
  // FINANCE
  // =====================================================
  {
    path: "/finance-heading",
    label: "Finance",
    icon: "account_balance",
    isHeading: true,
    children: [
      {
        path: "/finance",
        label: "Order Operations",
        icon: "account_balance",
        module: "finance",
        anyOf: [
          "payout.view",
          "return_refund.view",
          "cancel.details",
          "buyback.details",
          "partner data exports.view",
        ],
        children: [
          {
            path: "/return-refund",
            label: "Returns & Refunds",
            icon: "assignment_return",
            permission: "return_refund.view",
            module: "return_refund",
          },
          {
            path: "/Fiance/CancelRefund",
            label: "Cancel & Refunds",
            icon: "currency_exchange",
            permission: "cancel.details",
            module: "cancel",
          },
          {
            path: "/Fiance/BuyBack",
            label: "Buy Back",
            icon: "replay",
            permission: "buyback.details",
            module: "buyback",
          },
          {
            path: "/CreditNotes",
            label: "Credit Notes",
            icon: "receipt_long",
            permission: "payout.view",
            module: "payout",
          },
          {
            path: "/Fiance/CommissionCalendar",
            label: "Commission History",
            icon: "calendar_month",
            permission: "payout.view",
            module: "payout",
            anyOf: [
              "payout.view",
              "finance.commission export",
              "finance.commission-export",
              "finance.commission_export",
              "finance.commissionExport",
            ],
          },
          {
            path: "/Payment",
            label: "Payment Summary",
            icon: "payments",
            permission: "payout.view",
            module: "payout",
          },
          {
            path: "/IgniteExports",
            label: "Partner Data Exports",
            icon: "receipt_long",
            module: "partner data exports",
            permission: "partner data exports.view",
            anyOf: [
              "partner data exports.view",
              "partner data exports.download",
            ],
          },
        ],
      },
    ],
  },

  // =====================================================
  // SALES
  // =====================================================
  {
    path: "/sales-heading",
    label: "Sales",
    icon: "point_of_sale",
    isHeading: true,
    children: [
      {
        path: "/sales-analytics",
        label: "Sales Analytics",
        icon: "analytics",
        module: "sales_Analytics",
        permission: "sales_Analytics.view",
      },
      {
        path: "/sales-panel",
        label: "Sales Report",
        icon: "assessment",
        children: [
          {
            path: "/product-sales-report",
            label: "Product Sales Report",
            icon: "inventory_2",
            module: "sales_product_report",
            permission: "sales_product_report.view",
          },
          {
            path: "/category-sales-report",
            label: "Category Sales Report",
            icon: "category",
            module: "sales_category_report",
            permission: "sales_category_report.view",
          },
        ],
      },
    ],
  },

  // =====================================================
  // REPORTS
  // =====================================================
  {
    path: "/reports",
    label: "Reports",
    icon: "assessment",
    module: "reports",
    anyOf: [
      "delivery_report.view",
      "sales_report.view",
      "return_refund_report.view",
    ],
    children: [
      {
        path: "/delivery-report",
        label: "Delivery Report",
        icon: "local_shipping",
        module: "delivery_report",
        permission: "delivery_report.view",
      },
      {
        path: "/sales/report",
        label: "Sales Report",
        icon: "trending_up",
        module: "sales_report",
        permission: "sales_report.view",
      },
      {
        path: "/returns-report",
        label: "Returns Report",
        icon: "assignment_return",
        module: "return_refund_report",
        permission: "return_refund_report.view",
      },
    ],
  },
  // =====================================================
  // USER MANAGEMENT
  // =====================================================
  {
    path: "/UserManagement",
    label: "User Management",
    icon: "group",
    module: "user",
    permission: "user.view",
    anyOf: [
      "user.view",
      "user.create",
      "user.update",
      "user.delete",
    ],
  },

  // =====================================================
  // CORRECTION REQUESTS
  // =====================================================
  {
    path: "/CorrectionRequests",
    label: "Correction Requests",
    icon: "published_with_changes",
    module: "correction",
    permission: "correction.view",
    anyOf: [
      "correction.view",
      "correction.send link",
      "user.view",
    ],
  },

  // =====================================================
  // CMS MANAGEMENT
  // =====================================================
  {
    path: "/cms",
    label: "CMS Management",
    icon: "web",
    module: "cms",
    anyOf: [
      "header.view",
      "content.view",
      "footer.view",
    ],
    children: [
      {
        path: "/cms/header",
        label: "Header Management",
        icon: "vertical_align_top",
        permission: "header.view",
        module: "header",
      },
      {
        path: "/cms/content",
        label: "Content Management",
        icon: "description",
        permission: "content.view",
        module: "content",
      },
      {
        path: "/cms/LandingPageManagement",
        label: "LandingPage Management",
        icon: "description",
        permission: "landing page.view",
        module: "landing page",
      },
      {
        path: "/cms/ReelsManagement",
        label: "Reels Management",
        icon: "movie",
        permission: "reels.view",
        module: "reels",
      },
      {
        path: "/cms/TestimonialsManagement",
        label: "Testimonials Management",
        icon: "format_quote",
        permission: "testimonial.view",
        module: "testimonial",
      },
      {
        path: "/cms/footer",
        label: "Footer Management",
        icon: "vertical_align_bottom",
        permission: "footer.view",
        module: "footer",
      },
      {
        path: "/cms/NotificationTemplates",
        label: "Notification Templates",
        icon: "notifications_active",
        permission: "notification templates.view",
        module: "notification templates",
      },
    ],
  },

  // =====================================================
  // FAQ MANAGEMENT
  // =====================================================
  {
    path: "/cms/faq",
    label: "FAQ Management",
    icon: "quiz",
    permission: "faq.view",
    module: "faq",
    children: [
      {
        path: "/cms/SectionManagement",
        label: "Section Management",
        icon: "view_agenda",
        permission: "content.view",
        module: "content",
      },
      {
        path: "/cms/FAQManagement",
        label: "FAQ Management",
        icon: "quiz",
        permission: "faq.view",
        module: "faq",
      },
    ],
  },

  // =====================================================
  // ROLE MANAGEMENT
  // =====================================================
  {
    path: "/RoleManagement",
    label: "Role Management",
    icon: "admin_panel_settings",
    module: "role",
    anyOf: [
      "role.view",
      "admin_member.view",
    ],
    children: [
      {
        path: "/RoleManagement/role",
        label: "Roles & Permissions",
        icon: "lock",
        permission: "role.view",
        module: "role",
      },
      {
        path: "/RoleManagement/addmember",
        label: "Add Member",
        icon: "person_add",
        permission: "add_member.create",
        module: "add_member",
      },
    ],
  },

  // =====================================================
  // REVIEWS
  // =====================================================
  {
    path: "/reviews",
    label: "Reviews Moderation",
    icon: "rate_review",
    permission: "review.view",
    module: "review",
  },

  // =====================================================
  // NEWSLETTER
  // =====================================================
  {
    path: "/subscribers",
    label: "Newsletter",
    icon: "subscriptions",
    permission: "newsletter.view",
    module: "newsletter",
  },

  // =====================================================
  // NOTIFICATIONS
  // =====================================================
  {
    path: "/notifications",
    label: "Notifications",
    icon: "notifications",
    permission: "notification.view",
    module: "notification",
  },

  // =====================================================
  // CONTACT
  // =====================================================
  {
    path: "/contact",
    label: "Contact",
    icon: "contact_mail",
    permission: "contacts.view",
    module: "contacts",
  },

  // =====================================================
  // ACCOUNT ITEMS
  // =====================================================
  {
    path: "/UpdateProfile",
    label: "Update Profile",
    icon: "person",
    isPublic: true,
  },
  {
    path: "/ChangePassword",
    label: "Change Password",
    icon: "lock",
    isPublic: true,
  },
  {
    path: "/SettingsManagement",
    label: "Admin Settings",
    icon: "settings",
    module: "admin settings",
    permission: "admin settings.view",
  },
];
