
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
import AdminManagement from "@/pages/Rolemanagement/AdminManagement"; 

import HeaderManagement from "@/pages/Cms/HeaderManagement";
import FooterManagement from "@/pages/Cms/FooterManagement";
import GrowthSteps from "@/pages/Cms/GrowthSteps";
import ContentsManagement from "@/pages/Cms/ContentsManagement";
import AttributesManagement from "@/pages/AttributesManagement/AttributesManagement";
import BuyBack from "@/pages/BuyBack";
import Payout from "@/pages/PaymentManagement/Payout";
import Payment from "@/pages/PaymentManagement/Payment";

const basename = import.meta.env.PROD ? "/indiekonnect-admin" : "/";

export const router = createBrowserRouter(
  [
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
          path: "Notifications",
          element: <Notifications />,
        },
        {
          path: "Subscribers",
          element: <Subscribers />,
        },
        {
          path: "/Payout",
          element: <Payout />,
        },
        {
          path: "/Payment",
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
          path: "/BuyBack",
          element: <BuyBack />,
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
          path: "UserManagement",
          element: <UserManagement />,
        },
        ...appRoutes,
      ],
    },
  ],
  {
    basename,
  }
);

export default router;