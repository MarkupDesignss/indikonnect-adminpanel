import React, { useMemo, useState } from "react";
import {
  FiSearch,
  FiChevronDown,
  FiMoreVertical,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiX,
} from "react-icons/fi";

export type PaymentStatus = "PAID" | "OVERDUE" | "PENDING";

export type ShippingStatus =
  | "UNFULFILLED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface Order {
  id: string;
  date: string;
  customer: string;
  customerName: string;
  total: string;
  payment: PaymentStatus;
  shipping: ShippingStatus;
}

interface OrdersTableProps {
  onSelectOrder: (order: Order) => void;
  selectedOrderId?: string;
}

const dummyOrders: Order[] = [
  {
    id: "#ORD-9021",
    date: "Oct 24, 2023",
    customer: "Acme Corp",
    customerName: "Jane Doe",
    total: "$4,520.00",
    payment: "PAID",
    shipping: "UNFULFILLED",
  },
  {
    id: "#ORD-9020",
    date: "Oct 23, 2023",
    customer: "TechSolutions LLC",
    customerName: "Mike Smith",
    total: "₹1,250.50",
    payment: "OVERDUE",
    shipping: "SHIPPED",
  },
  {
    id: "#ORD-9019",
    date: "Oct 22, 2023",
    customer: "Global Industries",
    customerName: "Sarah Connor",
    total: "₹8,900.00",
    payment: "PENDING",
    shipping: "DELIVERED",
  },
  {
    id: "#ORD-9018",
    date: "Oct 21, 2023",
    customer: "Nexus Retail",
    customerName: "Tom Hanks",
    total: "₹345.00",
    payment: "PAID",
    shipping: "CANCELLED",
  },
  {
    id: "#ORD-9017",
    date: "Oct 20, 2023",
    customer: "Vertex Solutions",
    customerName: "David Miller",
    total: "₹2,450.00",
    payment: "PAID",
    shipping: "SHIPPED",
  },
  {
    id: "#ORD-9016",
    date: "Oct 19, 2023",
    customer: "Prime Wholesale",
    customerName: "Robert Green",
    total: "₹5,780.00",
    payment: "PENDING",
    shipping: "UNFULFILLED",
  },
  {
    id: "#ORD-9015",
    date: "Oct 18, 2023",
    customer: "Urban Traders",
    customerName: "Michael Scott",
    total: "₹980.00",
    payment: "PAID",
    shipping: "DELIVERED",
  },
  {
    id: "#ORD-9014",
    date: "Oct 17, 2023",
    customer: "Digital World",
    customerName: "Emily Stone",
    total: "₹3,240.00",
    payment: "OVERDUE",
    shipping: "CANCELLED",
  },
];

const paymentClasses = (status: PaymentStatus) => {
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

const shippingClasses = (status: ShippingStatus) => {
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

const OrdersTable: React.FC<OrdersTableProps> = ({
  onSelectOrder,
  selectedOrderId,
}) => {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("All Dates");
  const [paymentFilter, setPaymentFilter] = useState("Payment: All");
  const [shippingFilter, setShippingFilter] = useState("Shipping: All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const itemsPerPage = 4;

  const filteredOrders = useMemo(() => {
    return dummyOrders.filter((order) => {
      const searchText = search.toLowerCase().trim();

      const searchMatch =
        order.id.toLowerCase().includes(searchText) ||
        order.customer.toLowerCase().includes(searchText) ||
        order.customerName.toLowerCase().includes(searchText);

      const paymentMatch =
        paymentFilter === "Payment: All" ||
        order.payment === paymentFilter.replace("Payment: ", "");

      const shippingMatch =
        shippingFilter === "Shipping: All" ||
        order.shipping === shippingFilter.replace("Shipping: ", "");

      return searchMatch && paymentMatch && shippingMatch;
    });
  }, [search, paymentFilter, shippingFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));

  const visibleOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const changePage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  const clearFilters = () => {
    setSearch("");
    setDateFilter("All Dates");
    setPaymentFilter("Payment: All");
    setShippingFilter("Shipping: All");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    search !== "" ||
    dateFilter !== "All Dates" ||
    paymentFilter !== "Payment: All" ||
    shippingFilter !== "Shipping: All";

  return (
    <div className="space-y-5">
      {/* FILTER BAR */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          {/* SEARCH */}
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search orders, customers..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <FiX size={16} />
              </button>
            )}
          </div>

          {/* DESKTOP FILTERS */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-11 appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-9 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
              >
                <option>All Dates</option>
                <option>Today</option>
                <option>This Week</option>
                <option>This Month</option>
              </select>
              <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>

            <div className="relative">
              <select
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-9 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
              >
                <option>Payment: All</option>
                <option>PAID</option>
                <option>OVERDUE</option>
                <option>PENDING</option>
              </select>
              <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>

            <div className="relative">
              <select
                value={shippingFilter}
                onChange={(e) => {
                  setShippingFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-9 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
              >
                <option>Shipping: All</option>
                <option>UNFULFILLED</option>
                <option>SHIPPED</option>
                <option>DELIVERED</option>
                <option>CANCELLED</option>
              </select>
              <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className={`h-11 px-4 rounded-xl text-sm font-medium transition-all ${
                hasActiveFilters
                  ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <FiFilter size={16} className="inline mr-1.5" />
              Clear Filters
            </button>
          </div>

          {/* MOBILE FILTERS TOGGLE */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <FiFilter size={16} />
            Filters
            {hasActiveFilters && (
              <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                !
              </span>
            )}
          </button>
        </div>

        {/* MOBILE FILTERS */}
        {showMobileFilters && (
          <div className="mt-4 space-y-3 lg:hidden">
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 pr-9 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                <option>All Dates</option>
                <option>Today</option>
                <option>This Week</option>
                <option>This Month</option>
              </select>
              <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>

            <div className="relative">
              <select
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 pr-9 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                <option>Payment: All</option>
                <option>PAID</option>
                <option>OVERDUE</option>
                <option>PENDING</option>
              </select>
              <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>

            <div className="relative">
              <select
                value={shippingFilter}
                onChange={(e) => {
                  setShippingFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 pr-9 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                <option>Shipping: All</option>
                <option>UNFULFILLED</option>
                <option>SHIPPED</option>
                <option>DELIVERED</option>
                <option>CANCELLED</option>
              </select>
              <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="w-full h-11 rounded-xl bg-blue-50 text-blue-700 font-medium text-sm hover:bg-blue-100 transition-all"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-slate-800 to-slate-900">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-white/90">
                  Order ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-white/90">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-white/90">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-white/90">
                  Total
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-white/90">
                  Payment
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-white/90">
                  Shipping
                </th>
                <th className="w-[50px]" />
              </tr>
            </thead>

            <tbody>
              {visibleOrders.length > 0 ? (
                visibleOrders.map((order, index) => (
                  <tr
                    key={order.id}
                    onClick={() => onSelectOrder(order)}
                    className={`cursor-pointer transition-colors ${
                      index !== visibleOrders.length - 1 ? "border-b border-slate-100" : ""
                    } ${
                      selectedOrderId === order.id
                        ? "bg-blue-50/50 hover:bg-blue-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-800">
                        {order.id}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {order.date}
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-800">
                        {order.customer}
                      </p>
                      <p className="text-xs text-slate-500">
                        {order.customerName}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                      {order.total}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${paymentClasses(
                          order.payment
                        )}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {order.payment}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${shippingClasses(
                          order.shipping
                        )}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {order.shipping}
                      </span>
                    </td>

                    <td className="px-3 py-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
                      >
                        <FiMoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="rounded-full bg-slate-100 p-3">
                        <FiSearch size={24} className="text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-800">No orders found</p>
                      <p className="text-sm text-slate-500">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS */}
        <div className="block lg:hidden">
          {visibleOrders.length > 0 ? (
            visibleOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => onSelectOrder(order)}
                className={`cursor-pointer border-b border-slate-100 p-5 transition-colors ${
                  selectedOrderId === order.id ? "bg-blue-50/50" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{order.id}</p>
                    <p className="text-xs text-slate-500">{order.date}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                  >
                    <FiMoreVertical size={18} />
                  </button>
                </div>

                <div className="mt-3">
                  <p className="text-sm font-semibold text-slate-800">{order.customer}</p>
                  <p className="text-xs text-slate-500">{order.customerName}</p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-base font-bold text-slate-800">{order.total}</span>

                  <div className="flex gap-1.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${paymentClasses(
                        order.payment
                      )}`}
                    >
                      {order.payment}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${shippingClasses(
                        order.shipping
                      )}`}
                    >
                      {order.shipping}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center gap-2 px-6 py-12">
              <div className="rounded-full bg-slate-100 p-3">
                <FiSearch size={24} className="text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-800">No orders found</p>
              <p className="text-sm text-slate-500">Try adjusting your filters</p>
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {filteredOrders.length > 0 && (
          <div className="flex flex-col gap-4 border-t border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Showing{" "}
              <span className="font-medium text-slate-800">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-slate-800">
                {Math.min(currentPage * itemsPerPage, filteredOrders.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-slate-800">
                {filteredOrders.length}
              </span>{" "}
              entries
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <FiChevronLeft size={18} />
              </button>

              {[...Array(Math.min(totalPages, 3))].map((_, index) => {
                const page = index + 1;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => changePage(page)}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                      currentPage === page
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              {totalPages > 3 && (
                <span className="px-2 text-sm text-slate-400">...</span>
              )}

              <button
                type="button"
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <FiChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersTable;