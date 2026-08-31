import React from "react";
import {
  FiPrinter,
  FiPackage,
  FiUser,
  FiCalendar,
  FiDollarSign,
  FiTruck,
  FiCreditCard,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
} from "react-icons/fi";
import {
  Order,
  PaymentStatus,
  ShippingStatus,
} from "./OrdersTable";

interface OrderSidebarProps {
  order: Order;
  onFulfill: () => void;
}

const paymentClass = (status: PaymentStatus) => {
  switch (status) {
    case "PAID":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "OVERDUE":
      return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
    case "PENDING":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    default:
      return "bg-gray-50 text-gray-600 ring-1 ring-gray-200";
  }
};

const shippingClass = (status: ShippingStatus) => {
  switch (status) {
    case "UNFULFILLED":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    case "SHIPPED":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
    case "DELIVERED":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "CANCELLED":
      return "bg-gray-50 text-gray-600 ring-1 ring-gray-200";
    default:
      return "bg-gray-50 text-gray-600 ring-1 ring-gray-200";
  }
};

const getPaymentIcon = (status: PaymentStatus) => {
  switch (status) {
    case "PAID":
      return FiCheckCircle;
    case "OVERDUE":
      return FiAlertCircle;
    case "PENDING":
      return FiClock;
    default:
      return FiCreditCard;
  }
};

const getShippingIcon = (status: ShippingStatus) => {
  switch (status) {
    case "UNFULFILLED":
      return FiClock;
    case "SHIPPED":
      return FiTruck;
    case "DELIVERED":
      return FiCheckCircle;
    case "CANCELLED":
      return FiAlertCircle;
    default:
      return FiPackage;
  }
};

const OrderSidebar: React.FC<OrderSidebarProps> = ({
  order,
  onFulfill,
}) => {
  const PaymentIcon = getPaymentIcon(order.payment);
  const ShippingIcon = getShippingIcon(order.shipping);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#071A41]/10 p-2.5">
              <FiPackage size={20} className="text-[#071A41]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {order.id}
              </h2>
              <p className="text-sm text-slate-500">
                Order Details
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <FiCalendar size={14} />
            <span>
              Placed on {order.date} at 10:42 AM
            </span>
          </div>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm"
        >
          <FiPrinter size={18} />
        </button>
      </div>

      {/* Customer Info */}
      <div className="mt-6 rounded-xl bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-[#071A41]/10 p-2">
            <FiUser size={16} className="text-[#071A41]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">
              {order.customer}
            </p>
            <p className="text-sm text-slate-500">
              {order.customerName}
            </p>
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Total Amount
          </p>
          <p className="mt-1 text-lg font-bold text-slate-800">
            {order.total}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Order Status
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-semibold text-slate-800">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Status Badges */}
      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#071A41]/10 p-1.5">
              <FiCreditCard size={14} className="text-[#071A41]" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Payment</p>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${paymentClass(
                  order.payment
                )}`}
              >
                <PaymentIcon size={12} />
                {order.payment}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#071A41]/10 p-1.5">
              <FiTruck size={14} className="text-[#071A41]" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Shipping</p>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${shippingClass(
                  order.shipping
                )}`}
              >
                <ShippingIcon size={12} />
                {order.shipping}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 space-y-2.5">
        <button
          type="button"
          onClick={onFulfill}
          disabled={order.shipping === "DELIVERED" || order.shipping === "CANCELLED"}
          className={`flex h-12 w-full items-center justify-center gap-2.5 rounded-xl font-semibold text-sm transition-all ${
            order.shipping === "DELIVERED" || order.shipping === "CANCELLED"
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-[#071A41] text-white shadow-sm shadow-[#071A41]/20 hover:shadow-[#071A41]/30 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] hover:bg-[#0a2a5a]"
          }`}
        >
          <FiPackage size={18} />
          {order.shipping === "DELIVERED"
            ? "Already Delivered"
            : order.shipping === "CANCELLED"
            ? "Order Cancelled"
            : "Fulfill Order"}
        </button>

        <button
          type="button"
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#071A41] bg-white text-sm font-medium text-[#071A41] transition-all hover:bg-[#071A41] hover:text-white hover:shadow-sm"
        >
          <FiPrinter size={16} />
          Print Invoice
        </button>
      </div>

      {/* Footer */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <p className="text-xs text-center text-slate-400">
          Last updated today at 10:42 AM
        </p>
      </div>
    </div>
  );
};

export default OrderSidebar;