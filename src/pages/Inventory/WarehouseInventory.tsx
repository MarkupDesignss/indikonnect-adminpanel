// WarehouseInventory.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  FiDownload,
  FiPlus,
} from "react-icons/fi";

import Products from "./product";
import StatsCard from "@/components/common/StatsCard";

// SVG Icons
const BoxSVG = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M2 7V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M22 7V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const LockBoxSVG = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M2 7V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M22 7V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <rect x="9" y="13" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.8" />
    <path d="M10 13V11C10 9.89543 10.8954 9 12 9C13.1046 9 14 9.89543 14 11V13" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const CartBoxSVG = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#F59E0B" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M2 17L12 22L22 17" stroke="#F59E0B" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M2 12L12 17L22 12" stroke="#F59E0B" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M2 7V17" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M22 7V17" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="9.5" cy="18.5" r="1.5" stroke="#F59E0B" strokeWidth="1.8" />
    <circle cx="15.5" cy="18.5" r="1.5" stroke="#F59E0B" strokeWidth="1.8" />
    <path d="M7 13L8 9H17L18 13" stroke="#F59E0B" strokeWidth="1.8" />
  </svg>
);

const DollarBoxSVG = () => (
  <svg width="37" height="37" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#10B981" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M2 17L12 22L22 17" stroke="#10B981" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M2 12L12 17L22 12" stroke="#10B981" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M2 7V17" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M22 7V17" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" />
    <text x="10" y="16" fontSize="12" fontWeight="bold" fill="#10B981">$</text>
  </svg>
);

const WarehouseInventory: React.FC = () => {
  // All stats data passed as params
  const statsData = [
    {
      title: "Available Stock",
      value: "42,500",
      icon: <BoxSVG />,
      barColor: "bg-black",
    },
    {
      title: "Reserved Stock",
      value: "8,230",
      icon: <LockBoxSVG />,
      barColor: "bg-[#DBE8FF]",
    },
    {
      title: "⚠ Low Stock",
      value: "14",
      icon: <CartBoxSVG />,
      barColor: "bg-[#F59E0B]",
      textColor: "text-[#F59E0B]",
    },
    {
      title: "Stock Value",
      value: "$1.2M",
      icon: <DollarBoxSVG />,
      barColor: "bg-[#10B981]",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f9fc] font-arimo text-[#071a35]">
      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-[#071a35] sm:text-[24px]">
            Inventory Management
          </h1>
          <p className="font-arimo text-[16px] text-[#30445d]">
            Monitor and manage stock levels across all warehouse locations.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/inventory/categories"
            className="flex h-[44px] items-center justify-center rounded-[3px] border border-[#C8D0DA] bg-white px-4 font-lato text-[14px] font-bold text-[#071A35] transition hover:bg-[#F5F7FA]"
          >
            Categories
          </Link>

          <button
            type="button"
            className="flex h-[44px] items-center justify-center gap-2 rounded-[3px] border border-[#C8D0DA] bg-white px-4 font-lato text-[14px] font-bold text-[#071A35] transition hover:bg-[#F5F7FA]"
          >
            <FiDownload size={16} />
            Export
          </button>

          <button
            type="button"
            className="flex h-[44px] items-center justify-center gap-2 rounded-[3px] bg-black px-4 font-lato text-[14px] font-bold text-white transition hover:bg-[#172033]"
          >
            <FiPlus size={18} />
            Update Stock
          </button>
        </div>
      </div>

      {/* STATISTICS */}
      <StatsCard stats={statsData} />

      {/* PRODUCTS */}
      <div className="mt-8 rounded-[4px] border border-[#D8E0E9] bg-white p-5">
        <Products />
      </div>
    </div>
  );
};

export default WarehouseInventory;