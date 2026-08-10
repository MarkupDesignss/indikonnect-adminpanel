import React from "react";
import {
  FiClipboard,
  FiShoppingBag,
  FiCreditCard,
  FiCheckCircle,
} from "react-icons/fi";

interface OrderStatsProps {
  totalOrders?: number;
  pendingFulfillment?: number;
  awaitingPayment?: string;
  completedToday?: number;
}

const OrderStats: React.FC<OrderStatsProps> = ({
  totalOrders = 1248,
  pendingFulfillment = 42,
  awaitingPayment = "₹14,250",
  completedToday = 18,
}) => {
  const stats = [
    {
      title: "TOTAL ORDERS",
      value: totalOrders.toLocaleString(),
      icon: FiClipboard,
      type: "yellow",
      bottom: (
        <span className="text-[#10b981]">
          ↗ +12% vs last month
        </span>
      ),
    },
    {
      title: "PENDING FULFILLMENT",
      value: pendingFulfillment.toString(),
      icon: FiShoppingBag,
      type: "yellow",
      bottom: "Requires action",
    },
    {
      title: "AWAITING PAYMENT",
      value: awaitingPayment,
      icon: FiCreditCard,
      type: "red",
      bottom: (
        <span className="text-[#ef4444]">
          3 overdue invoices
        </span>
      ),
    },
    {
      title: "COMPLETED TODAY",
      value: completedToday.toString(),
      icon: FiCheckCircle,
      type: "green",
      bottom: "₹4,500 total value",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        const borderColor =
          stat.type === "red"
            ? "bg-[#ef4444]"
            : stat.type === "green"
            ? "bg-[#10b981]"
            : "bg-[#f59e0b]";

        return (
          <div
            key={stat.title}
            className="relative overflow-hidden rounded-[4px] border border-[#d8e0e9] bg-white px-5 py-5"
          >
            <div
              className={`absolute left-0 right-0 top-0 h-[4px] ${borderColor}`}
            />

            <div className="flex items-start justify-between">
              <div>
                <p className="font-lato text-[14px] font-bold tracking-[0.3px] text-[#30445d]">
                  {stat.title}
                </p>

                <h2 className="mt-6 font-lato text-[30px] font-black leading-none text-[#071a35]">
                  {stat.value}
                </h2>
              </div>

              <Icon
                size={25}
                strokeWidth={1.8}
                className="text-[#68798d]"
              />
            </div>

            <div className="mt-4 font-arimo text-[13px] font-semibold text-[#243a54]">
              {stat.bottom}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderStats;