import { createBrowserRouter, Outlet } from "react-router-dom";

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
import AdminManagement from "@/pages/Rolemanagement/AdminManagement";

import HeaderManagement from "@/pages/Cms/HeaderManagement";
import FooterManagement from "@/pages/Cms/FooterManagement";
import GrowthSteps from "@/pages/Cms/GrowthSteps";
import ContentsManagement from "@/pages/Cms/ContentsManagement";
import AttributesManagement from "@/pages/AttributesManagement/AttributesManagement";

import Payout from "@/pages/PaymentManagement/Payout";
import Payment from "@/pages/PaymentManagement/Payment";

import UpdateProfile from "@/pages/User/UpdateProfile";
import ChangePassword from "@/pages/User/ChangePassword";

import BrandsManagement from "@/pages/Cms/BrandsManagement";
import CreditNotes from "@/pages/CreditNotes/CreditNotes";
import ReelsManagement from "@/pages/ReelsManagement/ReelsManagement";
import SubCategories from "@/pages/Inventory/SubCategories";

import ScrollToTop from "../ScrollToTop";

import TestimonialsManagement from "@/pages/Cms/TestimonialsManagement";
import CancelRefund from "@/pages/Fiance/CancelRefund";
import BuyBack from "@/pages/Fiance/BuyBack";
import CoolOff from "@/pages/Fiance/CoolOff";

import FAQManagement from "@/pages/Cms/FAQManagement";
import SettingsManagement from "@/pages/SettingsManagement";
import NotificationTemplates from "@/pages/Cms/NotificationTemplates";
import SectionManagement from "@/pages/Cms/SectionManagement";
import LandingPageManagement from "@/pages/Cms/LandingPageManagement";

import Addwarehouse from "@/pages/Warehouse/Addwarehouse";
import Productsaasignment from "@/pages/Warehouse/Productsaasignment";

const ScrollLayout = () => {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
};

export const adminRouter = createBrowserRouter(
  [
    // ==========================================
    // AUTH ROUTES
    // ==========================================
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

    // ==========================================
    // ADMIN ROUTES
    // ==========================================
    {
      path: "/",
      element: <ScrollLayout />,
      children: [
        {
          element: <MainLayout />,
          children: [
            // Dashboard
            {
              index: true,
              element: <Dashboard />,
            },

            // INVENTORY
            {
              path: "inventory/Taxcategories",
              element: <Taxcategories />,
            },
            {
              path: "inventory/AttributesManagement",
              element: <AttributesManagement />,
            },
            {
              path: "inventory/SubCategories",
              element: <SubCategories />,
            },

            // USERS
            {
              path: "UserManagement",
              element: <UserManagement />,
            },

            // NOTIFICATIONS
            {
              path: "Notifications",
              element: <Notifications />,
            },

            // SUBSCRIBERS
            {
              path: "Subscribers",
              element: <Subscribers />,
            },

            // PAYMENT
            {
              path: "Payout",
              element: <Payout />,
            },
            {
              path: "Payment",
              element: <Payment />,
            },

            // CONTACT
            {
              path: "Contact",
              element: <Contact />,
            },

            // COUPONS
            {
              path: "Coupons",
              element: <Coupons />,
            },

            // ROLE MANAGEMENT
            {
              path: "RoleManagement/role",
              element: <RoleManagement />,
            },
            {
              path: "RoleManagement/addmember",
              element: <AdminManagement />,
            },

            // WAREHOUSE
            {
              path: "Addwarehouse",
              element: <Addwarehouse />,
            },
            {
              path: "Productsaasignment",
              element: <Productsaasignment />,
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
            {
              path: "cms/brands",
              element: <BrandsManagement />,
            },
            {
              path: "cms/ReelsManagement",
              element: <ReelsManagement />,
            },
            {
              path: "cms/FAQManagement",
              element: <FAQManagement />,
            },
            {
              path: "cms/TestimonialsManagement",
              element: <TestimonialsManagement />,
            },
            {
              path: "cms/NotificationTemplates",
              element: <NotificationTemplates />,
            },
            {
              path: "cms/SectionManagement",
              element: <SectionManagement />,
            },
            {
              path: "cms/LandingPageManagement",
              element: <LandingPageManagement />,
            },

            // CREDIT NOTES
            {
              path: "CreditNotes",
              element: <CreditNotes />,
            },

            // PROFILE
            {
              path: "UpdateProfile",
              element: <UpdateProfile />,
            },
            {
              path: "ChangePassword",
              element: <ChangePassword />,
            },

            // FINANCE EXISTING ADMIN PAGES
            {
              path: "Fiance/CoolOff",
              element: <CoolOff />,
            },
            {
              path: "Fiance/BuyBack",
              element: <BuyBack />,
            },
            {
              path: "Fiance/CancelRefund",
              element: <CancelRefund />,
            },

            // SETTINGS
            {
              path: "SettingsManagement",
              element: <SettingsManagement />,
            },

            // OTHER ADMIN ROUTES
            ...appRoutes,
          ],
        },
      ],
    },
  ],
  {
    basename: "/indiekonnect-admin",   // ✅ Subfolder fix
  }
);

export default adminRouter;