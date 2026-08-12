import React, { useState } from "react";

import OrderStats from "./components/OrderStats";

import OrdersTable, {
  Order,
} from "./components/OrdersTable";

import OrderSidebar from "./components/OrderSidebar";

import OrderCustomerDetails from "./components/OrderCustomerDetails";

import OrderItems from "./components/OrderItems";

import OrderPaymentInfo from "./components/OrderPaymentInfo"

import OrderTimeline from "./components/OrderTimeline";

const Orders: React.FC = () => {
  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const handleSelectOrder = (
    order: Order
  ) => {
    setSelectedOrder(order);
  };

  const handleFulfillOrder = () => {
    if (!selectedOrder) return;

    alert(
      `Order ${selectedOrder.id} is ready for fulfillment.`
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] px-4 py-6 font-arimo text-[#071a35] sm:px-6 lg:px-8 xl:px-[30px]">
      
      {/* =================================
          PAGE HEADER
      ================================= */}

      <div className="mb-8">
        <h1 className="font-lato text-[34px] font-black tracking-[-1px] text-[#071a35] sm:text-[38px]">
          Orders
        </h1>

        <p className="mt-2 font-arimo text-[16px] text-[#30445d]">
          Manage orders, payments and
          fulfillment.
        </p>
      </div>

      {/* =================================
          STAT CARDS
      ================================= */}

      <div className="mb-10">
        <OrderStats />
      </div>

      {/* =================================
          MAIN CONTENT
      ================================= */}

      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,2fr)_500px]">

        {/* =================================
            LEFT
        ================================= */}

        <div className="min-w-0">
          <OrdersTable
            onSelectOrder={
              handleSelectOrder
            }
            selectedOrderId={
              selectedOrder?.id
            }
          />
        </div>

        {/* =================================
            RIGHT SIDEBAR
        ================================= */}

        <div className="space-y-5">
          
          {/* ORDER DETAILS */}

          <OrderSidebar
            order={
              selectedOrder ?? {
                id: "#ORD-9021",
                date: "Oct 24, 2023",
                customer: "Acme Corp",
                customerName: "Jane Doe",
                total: "$4,520.00",
                payment: "PAID",
                shipping: "UNFULFILLED",
              }
            }
            onFulfill={
              handleFulfillOrder
            }
          />

          {/* CUSTOMER DETAILS */}

          <OrderCustomerDetails />

          {/* ORDER ITEMS */}

          <OrderItems />

          {/* PAYMENT */}

          <OrderPaymentInfo />

          {/* TIMELINE */}

          <OrderTimeline />
        </div>
      </div>
    </div>
  );
};

export default Orders;
