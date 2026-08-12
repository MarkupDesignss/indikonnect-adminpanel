import React, { useMemo, useState } from "react";
import {
  FiSearch,
  FiChevronDown,
  FiMoreVertical,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

export type PaymentStatus =
  | "PAID"
  | "OVERDUE"
  | "PENDING";

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
      return "bg-[#d1fae5] text-[#047857]";

    case "OVERDUE":
      return "bg-[#fee2e2] text-[#dc2626]";

    case "PENDING":
      return "bg-[#fef3c7] text-[#b45309]";

    default:
      return "bg-gray-100 text-gray-600";
  }
};

const shippingClasses = (status: ShippingStatus) => {
  switch (status) {
    case "UNFULFILLED":
      return "bg-[#fef3c7] text-[#b45309]";

    case "SHIPPED":
      return "bg-[#e0e7ff] text-[#4338ca]";

    case "DELIVERED":
      return "bg-[#d1fae5] text-[#047857]";

    case "CANCELLED":
      return "bg-[#f1f5f9] text-[#475569]";

    default:
      return "bg-gray-100 text-gray-600";
  }
};

const OrdersTable: React.FC<OrdersTableProps> = ({
  onSelectOrder,
  selectedOrderId,
}) => {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("All Dates");
  const [paymentFilter, setPaymentFilter] =
    useState("Payment: All");
  const [shippingFilter, setShippingFilter] =
    useState("Shipping: All");

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 4;

  const filteredOrders = useMemo(() => {
    return dummyOrders.filter((order) => {
      const searchText = search.toLowerCase().trim();

      const searchMatch =
        order.id.toLowerCase().includes(searchText) ||
        order.customer
          .toLowerCase()
          .includes(searchText) ||
        order.customerName
          .toLowerCase()
          .includes(searchText);

      const paymentMatch =
        paymentFilter === "Payment: All" ||
        order.payment === paymentFilter.replace(
          "Payment: ",
          ""
        );

      const shippingMatch =
        shippingFilter === "Shipping: All" ||
        order.shipping === shippingFilter.replace(
          "Shipping: ",
          ""
        );

      return (
        searchMatch &&
        paymentMatch &&
        shippingMatch
      );
    });
  }, [
    search,
    paymentFilter,
    shippingFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredOrders.length / itemsPerPage
    )
  );

  const visibleOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const changePage = (page: number) => {
    setCurrentPage(
      Math.min(
        Math.max(page, 1),
        totalPages
      )
    );
  };

  return (
    <div className="rounded-[4px]">
      {/* FILTER BAR */}

      <div className="mb-5 rounded-[4px] border border-[#d8e0e9] bg-white p-5">
        <div className="flex flex-col gap-4 xl:flex-row">
          {/* SEARCH */}

          <div className="relative min-w-0 flex-1">
            <FiSearch
              size={22}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#526b87]"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search Order ID, Customer..."
              className="h-[48px] w-full rounded-[2px] border border-[#c8ced7] bg-white pl-[50px] pr-4 font-arimo text-[15px] text-[#071a35] outline-none placeholder:text-[#60738e] focus:border-[#17395f]"
            />
          </div>

          {/* DATE */}

          <div className="relative w-full xl:w-[185px]">
            <select
              value={dateFilter}
              onChange={(e) =>
                setDateFilter(e.target.value)
              }
              className="h-[48px] w-full appearance-none rounded-[2px] border border-[#c8ced7] bg-white px-4 pr-10 font-arimo text-[15px] text-[#071a35] outline-none"
            >
              <option>All Dates</option>
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>

            <FiChevronDown
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b]"
              size={18}
            />
          </div>

          {/* PAYMENT */}

          <div className="relative w-full xl:w-[170px]">
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-[48px] w-full appearance-none rounded-[2px] border border-[#c8ced7] bg-white px-4 pr-10 font-arimo text-[15px] text-[#071a35] outline-none"
            >
              <option>Payment: All</option>
              <option>PAID</option>
              <option>OVERDUE</option>
              <option>PENDING</option>
            </select>

            <FiChevronDown
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b]"
              size={18}
            />
          </div>

          {/* SHIPPING */}

          <div className="relative w-full xl:w-[170px]">
            <select
              value={shippingFilter}
              onChange={(e) => {
                setShippingFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-[48px] w-full appearance-none rounded-[2px] border border-[#c8ced7] bg-white px-4 pr-10 font-arimo text-[15px] text-[#071a35] outline-none"
            >
              <option>Shipping: All</option>
              <option>UNFULFILLED</option>
              <option>SHIPPED</option>
              <option>DELIVERED</option>
              <option>CANCELLED</option>
            </select>

            <FiChevronDown
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b]"
              size={18}
            />
          </div>

          {/* MORE FILTER */}

          <button
            type="button"
            className="flex h-[48px] shrink-0 items-center justify-center gap-2 px-3 font-lato text-[14px] font-bold text-[#071a35]"
          >
            <FiFilter size={17} />
            More Filters
          </button>
        </div>
      </div>

      {/* TABLE */}

      <div className="overflow-hidden rounded-[4px] border border-[#d8e0e9] bg-white">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="bg-black text-white">
                <th className="px-5 py-4 text-left font-lato text-[14px] font-bold">
                  ORDER ID
                </th>

                <th className="px-5 py-4 text-left font-lato text-[14px] font-bold">
                  DATE
                </th>

                <th className="px-5 py-4 text-left font-lato text-[14px] font-bold">
                  CUSTOMER
                </th>

                <th className="px-5 py-4 text-left font-lato text-[14px] font-bold">
                  TOTAL
                </th>

                <th className="px-5 py-4 text-center font-lato text-[14px] font-bold">
                  PAYMENT
                </th>

                <th className="px-5 py-4 text-center font-lato text-[14px] font-bold">
                  SHIPPING
                </th>

                <th className="w-[50px]" />
              </tr>
            </thead>

            <tbody>
              {visibleOrders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() =>
                    onSelectOrder(order)
                  }
                  className={`cursor-pointer border-b border-[#dbe1e8] transition last:border-b-0 ${
                    selectedOrderId === order.id
                      ? "bg-[#dbe8fa]"
                      : "hover:bg-[#f7f9fc]"
                  }`}
                >
                  <td className="px-5 py-4 font-arimo text-[15px] font-medium text-[#071a35]">
                    {order.id}
                  </td>

                  <td className="px-5 py-4 font-arimo text-[14px] text-[#30445d]">
                    {order.date}
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-lato text-[15px] font-bold text-[#071a35]">
                      {order.customer}
                    </p>

                    <p className="mt-1 font-arimo text-[13px] text-[#30445d]">
                      {order.customerName}
                    </p>
                  </td>

                  <td className="px-5 py-4 font-lato text-[15px] font-bold text-[#071a35]">
                    {order.total}
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-flex rounded-full px-3 py-1.5 font-arimo text-[12px] font-bold ${paymentClasses(
                        order.payment
                      )}`}
                    >
                      {order.payment}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-flex rounded-full px-3 py-1.5 font-arimo text-[12px] font-bold ${shippingClasses(
                        order.shipping
                      )}`}
                    >
                      {order.shipping}
                    </span>
                  </td>

                  <td className="px-3 py-4 text-center">
                    <button
                      type="button"
                      onClick={(e) =>
                        e.stopPropagation()
                      }
                      className="text-[#60738e] hover:text-black"
                    >
                      <FiMoreVertical
                        size={18}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE */}

        <div className="block md:hidden">
          {visibleOrders.map((order) => (
            <div
              key={order.id}
              onClick={() =>
                onSelectOrder(order)
              }
              className={`cursor-pointer border-b border-[#dbe1e8] p-5 ${
                selectedOrderId === order.id
                  ? "bg-[#dbe8fa]"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-lato font-bold">
                    {order.id}
                  </p>

                  <p className="mt-1 text-[13px] text-[#52647a]">
                    {order.date}
                  </p>
                </div>

                <FiMoreVertical />
              </div>

              <div className="mt-4">
                <p className="font-lato font-bold">
                  {order.customer}
                </p>

                <p className="text-[13px] text-[#52647a]">
                  {order.customerName}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <strong>{order.total}</strong>

                <div className="flex gap-2">
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-bold ${paymentClasses(
                      order.payment
                    )}`}
                  >
                    {order.payment}
                  </span>

                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-bold ${shippingClasses(
                      order.shipping
                    )}`}
                  >
                    {order.shipping}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* PAGINATION */}

        <div className="flex flex-col gap-4 border-t border-[#dbe1e8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-arimo text-[14px] text-[#30445d]">
            Showing 1 to{" "}
            {Math.min(
              itemsPerPage,
              filteredOrders.length
            )}{" "}
            of 1,248 entries
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                changePage(currentPage - 1)
              }
              disabled={currentPage === 1}
              className="flex h-[42px] w-[42px] items-center justify-center rounded-[2px] border border-[#ccd4de] disabled:text-[#bdc5cf]"
            >
              <FiChevronLeft />
            </button>

            {[1, 2, 3].map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => changePage(page)}
                className={`flex h-[42px] w-[42px] items-center justify-center rounded-[2px] border font-lato font-bold ${
                  currentPage === page
                    ? "border-black bg-black text-white"
                    : "border-[#ccd4de] text-[#17395f]"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={() =>
                changePage(currentPage + 1)
              }
              className="flex h-[42px] w-[42px] items-center justify-center rounded-[2px] border border-[#ccd4de]"
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersTable;