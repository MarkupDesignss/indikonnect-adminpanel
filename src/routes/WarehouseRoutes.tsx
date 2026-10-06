import { createBrowserRouter, Outlet } from "react-router-dom";

// ─── Auth Pages ───
import Login from "../pages/User/Login";
import ForgotPassword from "@/pages/User/ForgotPassword";
import OTPVerification from "@/pages/User/OTPVerification";
import ResetPassword from "@/pages/User/ResetPassword";

// ─── Common Pages ───
import Dashboard from "@/pages/dashboard";
import Notifications from "@/pages/Notification/Notifications";
import UpdateProfile from "@/pages/User/UpdateProfile";
import ChangePassword from "@/pages/User/ChangePassword";

import Addwarehouse from "@/pages/Warehouse/Addwarehouse";
import Productsaasignment from "@/pages/Warehouse/Productsaasignment";

import ScrollToTop from "../ScrollToTop";
import WarehouseLayout from "@/components/layout/WarehouseLayout";
import Orders from "@/pages/orders";
import WarehouseProducts from "@/pages/Warehouse/WarehouseProducts";
import Inventorywarehouse from "@/pages/Warehouse/Inventorywarehouse";

const ScrollLayout = () => {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
};

const NotFound = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <h1 className="text-6xl font-bold text-[#163F20]">404</h1>
      <p className="mt-3 text-lg text-[#59645C]">Page not found</p>
      <a
        href="/dashboard"
        className="
          mt-6 inline-block rounded-xl bg-[#163F20] px-6 py-3
          text-sm font-bold text-white transition hover:bg-[#0F3219]
        "
      >
        Go to Dashboard
      </a>
    </div>
  );
};

export const warehouseRouter = createBrowserRouter(
  [
    // ─── Auth Routes (same as finance) ───
    { path: "/login", element: <Login /> },
    { path: "/forgot-password", element: <ForgotPassword /> },
    { path: "/otp-verification", element: <OTPVerification /> },
    { path: "/reset-password", element: <ResetPassword /> },

    {
      path: "/",
      element: <ScrollLayout />,
      children: [
        {
          element: <WarehouseLayout />,
          children: [
            // ── Dashboard ──
            { index: true, element: <Dashboard /> },
            { path: "dashboard", element: <Dashboard /> },

            // ── Warehouse Section ──
            { path: "Addwarehouse", element: <Addwarehouse /> },
            { path: "Productsaasignment", element: <Productsaasignment /> },

            { path: "warehouse/orders", element: <Orders /> },

      
            // ── Products ──
            { path: "warehouse/products", element: <WarehouseProducts /> },

            { path: "warehouse/inventory", element: <Inventorywarehouse /> },


            // ── Quick Update ──
            { path: "notifications", element: <Notifications /> },
            { path: "UpdateProfile", element: <UpdateProfile /> },
            { path: "ChangePassword", element: <ChangePassword /> },

            // ── 404 ──
            { path: "*", element: <NotFound /> },
          ],
        },
      ],
    },
  ],
  {
    basename: "/indiekonnect-warehouse",   
  }
);

export default warehouseRouter;