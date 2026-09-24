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

const ScrollLayout = () => {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
};

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


    {
      path: "/",
      element: <ScrollLayout />,
      children: [
        {
          element: <MainLayout />,
          children: [
            {
              index: true,
              element: <Dashboard />,
            },

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

            {
              path: "Notifications",
              element: <Notifications />,
            },

            {
              path: "Subscribers",
              element: <Subscribers />,
            },

            {
              path: "Payout",
              element: <Payout />,
            },

            {
              path: "Payment",
              element: <Payment />,
            },

            {
              path: "Contact",
              element: <Contact />,
            },

            {
              path: "Coupons",
              element: <Coupons />,
            },
            {
              path: "RoleManagement/role",
              element: <RoleManagement />,
            },

            {
              path: "RoleManagement/addmember",
              element: <AdminManagement />,
            },

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
              path: "UserManagement",
              element: <UserManagement />,
            },

            {
              path: "CreditNotes",
              element: <CreditNotes />,
            },

            {
              path: "UpdateProfile",
              element: <UpdateProfile />,
            },

            {
              path: "ChangePassword",
              element: <ChangePassword />,
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
              path: "Fiance/CoolOff",
              element: <CoolOff />,
            },
            {
              path: "/SettingsManagement",
              element: <SettingsManagement />,
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
            {
              path: "Fiance/BuyBack",
              element: <BuyBack />,
            },
            {
              path: "Fiance/CancelRefund",
              element: <CancelRefund />,
            },
            ...appRoutes,
          ],
        },
      ],
    },
  ],
  {
    basename,
  }
);

export default router;