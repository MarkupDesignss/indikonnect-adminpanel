import React from "react";
import { FiList } from "react-icons/fi";

interface OrderItem {
  name: string;
  sku: string;
  quantity: number;
  price: string;
  total: string;
}

const items: OrderItem[] = [
  {
    name: "Industrial Widget Pro - 500pk",
    sku: "IWP-500",
    quantity: 2,
    price: "₹1,500.00",
    total: "₹3,000.00",
  },
  {
    name: "Heavy Duty Fasteners",
    sku: "HDF-100",
    quantity: 10,
    price: "₹152.00",
    total: "₹1,520.00",
  },
];

const OrderItems: React.FC = () => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <FiList
          size={18}
          className="text-[#304b6b]"
        />

        <h3 className="font-lato text-[14px] font-bold tracking-[0.5px] text-[#30445d]">
          ORDER ITEMS
        </h3>
      </div>

      <div className="mt-5 space-y-5">
        {items.map((item) => (
          <div
            key={item.sku}
            className="flex items-start justify-between gap-5"
          >
            <div>
              <p className="font-lato text-[15px] font-bold text-[#071a35]">
                {item.name}
              </p>

              <p className="mt-1 font-arimo text-[13px] text-[#304b6b]">
                SKU: {item.sku}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="font-arimo text-[14px] text-[#071a35]">
                {item.quantity} x{" "}
                {item.price}
              </p>

              <p className="mt-1 font-lato text-[15px] font-bold text-[#071a35]">
                {item.total}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="my-5 border-t border-[#dce2e9]" />

      <div className="space-y-3">
        <div className="flex justify-between font-arimo text-[15px] text-[#30445d]">
          <span>Subtotal</span>
          <span>₹4,520.00</span>
        </div>

        <div className="flex justify-between font-arimo text-[15px] text-[#30445d]">
          <span>Shipping (Standard)</span>
          <span>₹0.00</span>
        </div>

        <div className="flex justify-between font-arimo text-[15px] text-[#30445d]">
          <span>Tax</span>
          <span>₹0.00</span>
        </div>
      </div>

      <div className="my-4 border-t border-[#dce2e9]" />

      <div className="flex items-center justify-between">
        <span className="font-lato text-[18px] font-bold text-[#071a35]">
          Total
        </span>

        <span className="font-lato text-[19px] font-black text-[#071a35]">
          ₹4,520.00
        </span>
      </div>
    </div>
  );
};

export default OrderItems;