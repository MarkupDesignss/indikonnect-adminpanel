
export const warehouseMenuItems = [
    {
        path: "/dashboard",
        label: "Dashboard",
        icon: "dashboard",
    },

    // =====================================================
    // WAREHOUSE ORDERS SECTION
    // =====================================================
    {
        path: "",
        label: "Orders",
        isHeading: true,
    },

    {
        path: "/warehouse/orders",
        label: "Users Orders",
        icon: "shopping_cart",
    },

    {
        path: "warehouse/products",
        label: "All Products",
        icon: "shopping_bag",
    },

    {
        path: "warehouse/inventory",
        label: "Inventory Update",
        icon: "inventory_2",
    },

    // =====================================================
    // QUICK UPDATE SECTION
    // =====================================================
    {
        path: "",
        label: "Quick Update",
        isHeading: true,
    },

    {
        path: "/notifications",
        label: "Notifications",
        icon: "notifications",
    },

    {
        path: "/ChangePassword",
        label: "Change Password",
        icon: "lock",
    },

    {
        path: "/UpdateProfile",
        label: "Update Profile",
        icon: "person",
    },
];