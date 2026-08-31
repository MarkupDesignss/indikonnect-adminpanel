import { createBrowserRouter } from "react-router-dom";

import Login from "../pages/User/Login";
import MainLayout from "../components/layout/MainLayout";

import ForgotPassword from "@/pages/User/ForgotPassword";
import OTPVerification from "@/pages/User/OTPVerification";
import ResetPassword from "@/pages/User/ResetPassword";

import { appRoutes } from "../pages/index";

import Dashboard from "@/pages/dashboard";
import Taxcategories from "@/pages/Inventory/categories/Taxcategories";
import Notifications from "@/pages/Notification/Notifications";
import UserManagement from "@/pages/User/UserManagement";
import Subscribers from "@/pages/Subscribers/Subscribers";
import Contact from "@/pages/Contact/contact";
import Coupons from "@/pages/Coupons/coupons";
import RoleManagement from "@/pages/Rolemanagement/RoleManagement";
import PaymentManagement from "@/pages/PaymentManagement/PaymentManagement";

import HeaderManagement from "@/pages/Cms/HeaderManagement";
import FooterManagement from "@/pages/Cms/FooterManagement";
import GrowthSteps from "@/pages/Cms/GrowthSteps";
import ContentsManagement from "@/pages/Cms/ContentsManagement";

const basename = import.meta.env.PROD ? "/indiekonnect-admin" : "/";

export const router = createBrowserRouter(
  [
    // =========================
    // AUTH ROUTES
    // =========================

    {
      path: "/login",
      element: <Login />,
    },

    {
      path: "/forgot-password",
      element: <ForgotPassword />,
    },

    {
      path: "/reset-password",
      element: <ResetPassword />,
    },

    {
      path: "/otp-verification",
      element: <OTPVerification />,
    },

    // =========================
    // MAIN APPLICATION
    // =========================

    {
      path: "/",
      element: <MainLayout />,
      children: [
        // Dashboard
        {
          index: true,
          element: <Dashboard />,
        },

        // Inventory
        {
          path: "inventory/Taxcategories",
          element: <Taxcategories />,
        },

        // Notifications
        {
          path: "Notifications",
          element: <Notifications />,
        },

        // Subscribers
        {
          path: "Subscribers",
          element: <Subscribers />,
        },

        // Contact
        {
          path: "Contact",
          element: <Contact />,
        },

        // Coupons
        {
          path: "Coupons",
          element: <Coupons />,
        },

        // Payment Management
        {
          path: "PaymentManagement",
          element: <PaymentManagement />,
        },

        // Role Management
        {
          path: "RoleManagement",
          element: <RoleManagement />,
        },

        // CMS
        {
          path: "cms/header",
          element: <HeaderManagement />,
        },

        {
          path: "cms/footer",
          element: <FooterManagement />,
        },

        {
          path: "cms/growth",
          element: <GrowthSteps />,
        },

        {
          path: "cms/content",
          element: <ContentsManagement />,
        },

        // User Management
        {
          path: "UserManagement",
          element: <UserManagement />,
        },

        // Other application routes
        ...appRoutes,
      ],
    },
  ],
  {
    basename,
  },
);

export default router;
