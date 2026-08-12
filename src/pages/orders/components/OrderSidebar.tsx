import React from "react";
import {
  FiPrinter,
  FiPackage,
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

const paymentClass = (
  status: PaymentStatus
) => {
  switch (status) {
    case "PAID":
      return "border-[#a7e8ca] bg-[#d1fae5] text-[#047857]";

    case "OVERDUE":
      return "border-[#fecaca] bg-[#fee2e2] text-[#dc2626]";

    case "PENDING":
      return "border-[#fde68a] bg-[#fef3c7] text-[#b45309]";

    default:
      return "";
  }
};

const shippingClass = (
  status: ShippingStatus
) => {
  switch (status) {
    case "UNFULFILLED":
      return "border-[#fcd34d] bg-[#fef3c7] text-[#b45309]";

    case "SHIPPED":
      return "border-[#c7d2fe] bg-[#e0e7ff] text-[#4338ca]";

    case "DELIVERED":
      return "border-[#a7e8ca] bg-[#d1fae5] text-[#047857]";

    case "CANCELLED":
      return "border-[#d7dde5] bg-[#f1f5f9] text-[#475569]";

    default:
      return "";
  }
};

const OrderSidebar: React.FC<OrderSidebarProps> = ({
  order,
  onFulfill,
}) => {
  return (
    <div className="rounded-[4px] border border-[#d8e0e9] bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-lato text-[25px] font-black text-[#071a35]">
            Order {order.id}
          </h2>

          <p className="mt-1 font-arimo text-[13px] text-[#30445d]">
            Placed on {order.date} at 10:42 AM
          </p>
        </div>

        <button
          type="button"
          className="flex h-[46px] w-[46px] items-center justify-center rounded-[2px] border border-[#ccd4de] bg-white text-[#17395f] hover:bg-[#f6f8fa]"
        >
          <FiPrinter size={18} />
        </button>
      </div>

      {/* STATUS */}

      <div className="mt-5 flex flex-wrap gap-2">
        <span
          className={`border px-3 py-1.5 font-arimo text-[12px] font-bold ${paymentClass(
            order.payment
          )}`}
        >
          {order.payment}
        </span>

        <span
          className={`border px-3 py-1.5 font-arimo text-[12px] font-bold ${shippingClass(
            order.shipping
          )}`}
        >
          {order.shipping}
        </span>
      </div>

      {/* FULFILL */}

      <button
        type="button"
        onClick={onFulfill}
        className="mt-5 flex h-[42px] w-full items-center justify-center gap-2 rounded-[2px] bg-black font-lato text-[14px] font-bold text-white transition hover:bg-[#172033]"
      >
        <FiPackage size={17} />
        Fulfill Order
      </button>
    </div>
  );
};

export default OrderSidebar;