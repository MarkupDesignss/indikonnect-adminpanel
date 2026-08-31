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
      title: "Total Orders",
      value: totalOrders.toLocaleString(),
      icon: FiClipboard,
      gradient: "from-blue-500 to-blue-600",
      bgLight: "bg-blue-50",
      textColor: "text-blue-600",
      bottom: (
        <span className="text-emerald-600 text-sm font-medium">
          ↑ +12% vs last month
        </span>
      ),
    },
    {
      title: "Pending Fulfillment",
      value: pendingFulfillment.toString(),
      icon: FiShoppingBag,
      gradient: "from-amber-500 to-amber-600",
      bgLight: "bg-amber-50",
      textColor: "text-amber-600",
      bottom: "Requires action",
    },
    {
      title: "Awaiting Payment",
      value: awaitingPayment,
      icon: FiCreditCard,
      gradient: "from-rose-500 to-rose-600",
      bgLight: "bg-rose-50",
      textColor: "text-rose-600",
      bottom: (
        <span className="text-rose-500 text-sm font-medium">
          3 overdue invoices
        </span>
      ),
    },
    {
      title: "Completed Today",
      value: completedToday.toString(),
      icon: FiCheckCircle,
      gradient: "from-emerald-500 to-emerald-600",
      bgLight: "bg-emerald-50",
      textColor: "text-emerald-600",
      bottom: "₹4,500 total value",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.title}
            className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            {/* Gradient top bar */}
            <div
              className={`absolute left-0 right-0 top-0 h-1 bg-gradient-to-r ${stat.gradient}`}
            />

            {/* Subtle background icon */}
            <div className="absolute -right-4 -top-4 opacity-5">
              <Icon size={80} strokeWidth={0.8} />
            </div>

            <div className="flex items-start justify-between relative z-10">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {stat.title}
                </p>

                <h2 className="mt-3 text-3xl font-bold text-slate-800 tracking-tight">
                  {stat.value}
                </h2>
              </div>

              <div
                className={`rounded-xl p-3 ${stat.bgLight} ${stat.textColor} group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon size={22} strokeWidth={1.8} />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              {typeof stat.bottom === "string" ? (
                <span className="text-sm text-slate-600 font-medium">
                  {stat.bottom}
                </span>
              ) : (
                stat.bottom
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderStats;