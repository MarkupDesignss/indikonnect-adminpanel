import { createBrowserRouter, Outlet } from "react-router-dom";
import Login from "../pages/User/Login";
import ForgotPassword from "@/pages/User/ForgotPassword";
import OTPVerification from "@/pages/User/OTPVerification";
import ResetPassword from "@/pages/User/ResetPassword";
import Dashboard from "@/pages/dashboard";
import Notifications from "@/pages/Notification/Notifications";
import Payment from "@/pages/PaymentManagement/Payment";
import CreditNotes from "@/pages/CreditNotes/CreditNotes";
import UpdateProfile from "@/pages/User/UpdateProfile";
import ChangePassword from "@/pages/User/ChangePassword";
import CancelRefund from "@/pages/Fiance/CancelRefund";
import BuyBack from "@/pages/Fiance/BuyBack";
import CoolOff from "@/pages/Fiance/CoolOff";
import FinanceLayout from "@/components/layout/FinanceLayout";
import ScrollToTop from "../ScrollToTop";

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

export const financeRouter = createBrowserRouter(
  [

    { path: "/login", element: <Login /> },
    { path: "/forgot-password", element: <ForgotPassword /> },
    { path: "/otp-verification", element: <OTPVerification /> },
    { path: "/reset-password", element: <ResetPassword /> },

    {
      path: "/",
      element: <ScrollLayout />,
      children: [
        {
          element: <FinanceLayout />,
          children: [
            // Dashboard
            { index: true, element: <Dashboard /> },
            { path: "dashboard", element: <Dashboard /> },

            // Returns & Refunds
            { path: "return-refund", element: <CoolOff /> },

            // Cancel & Refunds
            { path: "Fiance/CancelRefund", element: <CancelRefund /> },

            // Buy Back
            { path: "Fiance/BuyBack", element: <BuyBack /> },

            // Credit Notes
            { path: "CreditNotes", element: <CreditNotes /> },

            // Payment
            { path: "Payment", element: <Payment /> },

            // Notifications
            { path: "notifications", element: <Notifications /> },

        
            // Profile
            { path: "UpdateProfile", element: <UpdateProfile /> },

            // Change Password
            { path: "ChangePassword", element: <ChangePassword /> },
            { path: "*", element: <NotFound /> },
          ],
        },
      ],
    },
  ],
  {
    basename: "/indiekonnect-finance",  
  }
);

export default financeRouter;