import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiDownload,
  FiPlus,
  FiSearch,
  FiChevronDown,
  FiPackage,
  FiLock,
  FiShoppingCart,
  FiDollarSign,
  FiArrowDown,
  FiArrowUp,
  FiArrowRight,  // Changed from FiArrowLeftRight
  FiClock,
} from "react-icons/fi";

// ==============================
// TYPES
// ==============================

type InventoryStatus = "In Stock" | "Low Stock" | "Out of Stock";

type InventoryItem = {
  id: number;
  name: string;
  sku: string;
  warehouse: string;
  available: number;
  reserved: number;
  status: InventoryStatus;
  image: string;
};

type MovementType =
  | "received"
  | "reserved"
  | "shipped"
  | "transfer";

type Movement = {
  id: number;
  type: MovementType;
  title: string;
  location: string;
  time: string;
};

// ==============================
// DUMMY INVENTORY DATA
// ==============================

const inventoryData: InventoryItem[] = [
  {
    id: 1,
    name: "MechKey Pro 2.0",
    sku: "MKP-20-BLK",
    warehouse: "WH-East",
    available: 1250,
    reserved: 300,
    status: "In Stock",
    image:
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=120&h=120&fit=crop",
  },
  {
    id: 2,
    name: "ErgoMouse X",
    sku: "EMX-WHT",
    warehouse: "WH-West",
    available: 45,
    reserved: 20,
    status: "Low Stock",
    image:
      "https://images.unsplash.com/photo-1527814050087-3793815479db?w=120&h=120&fit=crop",
  },
  {
    id: 3,
    name: "Aura NC Headphones",
    sku: "ANC-500",
    warehouse: "WH-Central",
    available: 0,
    reserved: 150,
    status: "Out of Stock",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120&h=120&fit=crop",
  },
  {
    id: 4,
    name: "Dual Monitor Arm V2",
    sku: "DMA-V2",
    warehouse: "WH-East",
    available: 890,
    reserved: 50,
    status: "In Stock",
    image:
      "https://images.unsplash.com/photo-1616627980798-3d0e9a3e3e2a?w=120&h=120&fit=crop",
  },
  {
    id: 5,
    name: "UltraView 27 Monitor",
    sku: "UVM-27",
    warehouse: "WH-West",
    available: 120,
    reserved: 25,
    status: "In Stock",
    image:
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=120&h=120&fit=crop",
  },
  {
    id: 6,
    name: "ProDesk Mechanical Pad",
    sku: "PDM-100",
    warehouse: "WH-Central",
    available: 32,
    reserved: 10,
    status: "Low Stock",
    image:
      "https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=120&h=120&fit=crop",
  },
];

// ==============================
// DUMMY MOVEMENTS
// ==============================

const movements: Movement[] = [
  {
    id: 1,
    type: "received",
    title: "Received 500 units of MechKey Pro 2.0",
    location: "WH-East",
    time: "2 hours ago",
  },
  {
    id: 2,
    type: "reserved",
    title: "Reserved 120 units of ErgoMouse X for Order #12044",
    location: "WH-West",
    time: "4 hours ago",
  },
  {
    id: 3,
    type: "shipped",
    title: "Shipped 200 units of Aura NC Headphones (Order #12040)",
    location: "WH-Central",
    time: "Yesterday",
  },
  {
    id: 4,
    type: "transfer",
    title: "Transferred 50 units of Dual Monitor Arm V2",
    location: "WH-East to WH-West",
    time: "Yesterday",
  },
];

// ==============================
// WAREHOUSES
// ==============================

const warehouses: string[] = [
  "All Warehouses",
  "WH-East",
  "WH-West",
  "WH-Central",
];

// ==============================
// STATUS CLASS
// ==============================

const getStatusClasses = (
  status: InventoryStatus
): string => {
  switch (status) {
    case "In Stock":
      return "bg-[#d1fae5] text-[#047857]";

    case "Low Stock":
      return "bg-[#fef3c7] text-[#b45309]";

    case "Out of Stock":
      return "bg-[#fee2e2] text-[#b91c1c]";

    default:
      return "bg-gray-100 text-gray-600";
  }
};

// ==============================
// MOVEMENT ICON
// ==============================

const MovementIcon = ({
  type,
}: {
  type: MovementType;
}) => {
  if (type === "received") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d1fae5] text-[#059669]">
        <FiArrowDown size={19} />
      </div>
    );
  }

  if (type === "reserved") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e5edff] text-[#17395f]">
        <FiLock size={17} />
      </div>
    );
  }

  if (type === "shipped") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fee2e2] text-[#dc2626]">
        <FiArrowUp size={19} />
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e5edff] text-[#17395f]">
      <FiArrowRight size={18} />  {/* Changed from FiArrowLeftRight */}
    </div>
  );
};

// ==============================
// MAIN COMPONENT
// ==============================

const WarehouseInventory: React.FC = () => {
  const [search, setSearch] = useState<string>("");
  const [warehouse, setWarehouse] =
    useState<string>("All Warehouses");

  const [currentPage, setCurrentPage] =
    useState<number>(1);

  const itemsPerPage = 4;

  // ==============================
  // FILTER DATA
  // ==============================

  const filteredData = useMemo<InventoryItem[]>(() => {
    return inventoryData.filter((item) => {
      const searchText = search
        .toLowerCase()
        .trim();

      const matchesSearch =
        item.name
          .toLowerCase()
          .includes(searchText) ||
        item.sku
          .toLowerCase()
          .includes(searchText);

      const matchesWarehouse =
        warehouse === "All Warehouses" ||
        item.warehouse === warehouse;

      return (
        matchesSearch &&
        matchesWarehouse
      );
    });
  }, [search, warehouse]);

  // ==============================
  // PAGINATION
  // ==============================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredData.length / itemsPerPage
    )
  );

  const paginatedData =
    filteredData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );

  // ==============================
  // SEARCH
  // ==============================

  const handleSearch = (
    value: string
  ): void => {
    setSearch(value);
    setCurrentPage(1);
  };

  // ==============================
  // WAREHOUSE FILTER
  // ==============================

  const handleWarehouseChange = (
    value: string
  ): void => {
    setWarehouse(value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] px-4 py-6 font-arimo text-[#071a35] sm:px-6 lg:px-8 xl:px-[30px]">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-lato text-[34px] font-black leading-tight tracking-[-1px] text-[#071a35] sm:text-[38px]">
            Warehouse Inventory
          </h1>

          <p className="mt-2 text-[16px] text-[#1d3553]">
            Monitor and manage stock levels
            across all warehouse locations.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/inventory/categories"
            className="flex h-[48px] items-center justify-center rounded-[3px] border border-[#c8d0da] bg-white px-5 font-lato text-[16px] font-bold text-[#071a35] transition hover:bg-[#f5f7fa]"
          >
            Categories
          </Link>

          <Link
            to="/inventory/products"
            className="flex h-[48px] items-center justify-center rounded-[3px] bg-black px-5 font-lato text-[16px] font-bold text-white transition hover:bg-[#172033]"
          >
            Products
          </Link>

          {/* Export */}

          <button
            type="button"
            className="flex h-[48px] items-center justify-center gap-2 rounded-[3px] border border-[#c8d0da] bg-white px-5 font-lato text-[16px] font-bold text-[#071a35] transition hover:bg-[#f5f7fa]"
          >
            <FiDownload size={17} />
            Export
          </button>

          {/* Update Stock */}

          <button
            type="button"
            className="flex h-[48px] items-center justify-center gap-2 rounded-[3px] bg-black px-5 font-lato text-[16px] font-bold text-white transition hover:bg-[#172033]"
          >
            <FiPlus size={19} />
            Update Stock
          </button>
        </div>
      </div>

      {/* ======================================
          STATISTICS
      ====================================== */}

      <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

        {/* Available Stock */}

        <div className="relative min-h-[157px] overflow-hidden rounded-[4px] border border-[#d8e0e9] bg-white px-7 py-6">
          <div className="absolute left-0 right-0 top-0 h-[5px] bg-black" />

          <div className="flex items-start justify-between">
            <div>
              <p className="font-lato text-[15px] font-bold uppercase text-[#334155]">
                Total Available Stock
              </p>

              <h2 className="mt-3 font-lato text-[40px] font-black leading-none tracking-[-2px] text-[#101b2c]">
                42,500
              </h2>
            </div>

            <FiPackage
              size={34}
              strokeWidth={1.8}
              className="text-[#405a78]"
            />
          </div>
        </div>

        {/* Reserved Stock */}

        <div className="relative min-h-[157px] overflow-hidden rounded-[4px] border border-[#d8e0e9] bg-white px-7 py-6">
          <div className="absolute left-0 right-0 top-0 h-[5px] bg-[#dbe8ff]" />

          <div className="flex items-start justify-between">
            <div>
              <p className="font-lato text-[15px] font-bold uppercase text-[#334155]">
                Total Reserved Stock
              </p>

              <h2 className="mt-3 font-lato text-[40px] font-black leading-none tracking-[-2px] text-[#101b2c]">
                8,230
              </h2>
            </div>

            <FiLock
              size={34}
              strokeWidth={1.8}
              className="text-[#405a78]"
            />
          </div>
        </div>

        {/* Low Stock */}

        <div className="relative min-h-[157px] overflow-hidden rounded-[4px] border border-[#d8e0e9] bg-white px-7 py-6">
          <div className="absolute left-0 right-0 top-0 h-[5px] bg-[#f59e0b]" />

          <div className="flex items-start justify-between">
            <div>
              <p className="font-lato text-[15px] font-bold uppercase text-[#f59e0b]">
                ⚠ Low Stock Items
              </p>

              <h2 className="mt-3 font-lato text-[40px] font-black leading-none tracking-[-2px] text-[#101b2c]">
                14
              </h2>
            </div>

            <FiShoppingCart
              size={36}
              strokeWidth={1.8}
              className="text-[#f59e0b]"
            />
          </div>
        </div>

        {/* Stock Value */}

        <div className="relative min-h-[157px] overflow-hidden rounded-[4px] border border-[#d8e0e9] bg-white px-7 py-6">
          <div className="absolute left-0 right-0 top-0 h-[5px] bg-[#10b981]" />

          <div className="flex items-start justify-between">
            <div>
              <p className="font-lato text-[15px] font-bold uppercase text-[#334155]">
                Total Stock Value
              </p>

              <h2 className="mt-3 font-lato text-[40px] font-black leading-none tracking-[-2px] text-[#101b2c]">
                $1.2M
              </h2>
            </div>

            <FiDollarSign
              size={37}
              strokeWidth={1.8}
              className="text-[#10b981]"
            />
          </div>
        </div>
      </div>

      {/* ======================================
          MAIN GRID
      ====================================== */}

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,2fr)_minmax(350px,1fr)]">

        {/* ====================================
            LEFT SIDE
        ==================================== */}

        <div className="min-w-0">

          {/* Search */}

          <div className="mb-8 rounded-[4px] border border-[#d8e0e9] bg-white p-5">

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.8fr)_minmax(250px,1fr)]">

              {/* Search Input */}

              <div className="relative">
                <FiSearch
                  size={22}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#17395f]"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    handleSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search by Product Name or SKU..."
                  className="h-[48px] w-full rounded-[2px] border border-[#c8ced7] bg-white pl-[50px] pr-4 font-arimo text-[16px] text-[#071a35] outline-none placeholder:text-[#60738e] focus:border-[#17395f]"
                />
              </div>

              {/* Warehouse */}

              <div className="relative">
                <select
                  value={warehouse}
                  onChange={(e) =>
                    handleWarehouseChange(
                      e.target.value
                    )
                  }
                  className="h-[48px] w-full cursor-pointer appearance-none rounded-[2px] border border-[#c8ced7] bg-white px-4 pr-12 font-arimo text-[16px] text-[#071a35] outline-none focus:border-[#17395f]"
                >
                  {warehouses.map(
                    (item: string) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>

                <FiChevronDown
                  size={20}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#52647a]"
                />
              </div>
            </div>
          </div>

          {/* ====================================
              TABLE
          ==================================== */}

          <div className="overflow-hidden rounded-[4px] border border-[#d8e0e9] bg-white">

            {/* Desktop */}

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[800px] border-collapse">

                <thead>
                  <tr className="bg-black text-white">

                    <th className="px-7 py-5 text-left font-lato text-[15px] font-bold">
                      Product
                    </th>

                    <th className="px-5 py-5 text-left font-lato text-[15px] font-bold">
                      Warehouse
                    </th>

                    <th className="px-5 py-5 text-center font-lato text-[15px] font-bold">
                      Available
                    </th>

                    <th className="px-5 py-5 text-center font-lato text-[15px] font-bold">
                      Reserved
                    </th>

                    <th className="px-7 py-5 text-center font-lato text-[15px] font-bold">
                      Status
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {paginatedData.length > 0 ? (
                    paginatedData.map(
                      (
                        item: InventoryItem
                      ) => (
                        <tr
                          key={item.id}
                          className="border-b border-[#dbe1e8] last:border-b-0 hover:bg-[#f8fafc]"
                        >

                          {/* Product */}

                          <td className="px-7 py-5">
                            <div className="flex items-center gap-4">

                              <div className="h-[60px] w-[60px] shrink-0 overflow-hidden rounded-[2px] border border-[#dce2e9] bg-[#f1f4f7]">
                                <img
                                  src={
                                    item.image
                                  }
                                  alt={
                                    item.name
                                  }
                                  className="h-full w-full object-cover"
                                />
                              </div>

                              <div>
                                <p className="font-lato text-[16px] font-bold text-[#071a35]">
                                  {
                                    item.name
                                  }
                                </p>

                                <p className="mt-1 font-arimo text-[14px] text-[#17395f]">
                                  SKU:{" "}
                                  {
                                    item.sku
                                  }
                                </p>
                              </div>

                            </div>
                          </td>

                          {/* Warehouse */}

                          <td className="px-5 py-5 font-arimo text-[15px] text-[#17395f]">
                            {
                              item.warehouse
                            }
                          </td>

                          {/* Available */}

                          <td className="px-5 py-5 text-center font-lato text-[16px] font-bold text-[#071a35]">
                            {item.available.toLocaleString()}
                          </td>

                          {/* Reserved */}

                          <td className="px-5 py-5 text-center font-arimo text-[16px] text-[#17395f]">
                            {item.reserved.toLocaleString()}
                          </td>

                          {/* Status */}

                          <td className="px-7 py-5 text-center">
                            <span
                              className={`inline-flex rounded-full px-3 py-[7px] font-arimo text-[13px] font-bold ${getStatusClasses(
                                item.status
                              )}`}
                            >
                              {
                                item.status
                              }
                            </span>
                          </td>

                        </tr>
                      )
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-14 text-center text-[#60738e]"
                      >
                        No inventory
                        found.
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>
            </div>

            {/* ====================================
                MOBILE TABLE
            ==================================== */}

            <div className="block md:hidden">

              {paginatedData.length > 0 ? (
                paginatedData.map(
                  (
                    item: InventoryItem
                  ) => (
                    <div
                      key={item.id}
                      className="border-b border-[#dbe1e8] p-5 last:border-b-0"
                    >

                      <div className="flex gap-4">

                        <div className="h-[60px] w-[60px] shrink-0 overflow-hidden rounded-[2px] border border-[#dce2e9]">
                          <img
                            src={
                              item.image
                            }
                            alt={
                              item.name
                            }
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">

                          <h3 className="font-lato text-[16px] font-bold text-[#071a35]">
                            {
                              item.name
                            }
                          </h3>

                          <p className="mt-1 text-[13px] text-[#52647a]">
                            SKU:{" "}
                            {
                              item.sku
                            }
                          </p>

                          <p className="mt-2 text-[14px] text-[#17395f]">
                            {
                              item.warehouse
                            }
                          </p>

                        </div>

                        <span
                          className={`h-fit shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold ${getStatusClasses(
                            item.status
                          )}`}
                        >
                          {
                            item.status
                          }
                        </span>

                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#e3e7ed] pt-4">

                        <div>
                          <p className="text-[12px] text-[#68798e]">
                            Available
                          </p>

                          <p className="mt-1 font-lato font-bold">
                            {item.available.toLocaleString()}
                          </p>
                        </div>

                        <div>
                          <p className="text-[12px] text-[#68798e]">
                            Reserved
                          </p>

                          <p className="mt-1 font-lato font-bold">
                            {item.reserved.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                )
              ) : (
                <div className="px-6 py-14 text-center text-[#60738e]">
                  No inventory found.
                </div>
              )}

            </div>

   
            <div className="flex flex-col gap-4 border-t border-[#dbe1e8] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-arimo text-[15px] text-[#17395f]">
                Showing{" "}
                {filteredData.length === 0
                  ? 0
                  : (currentPage - 1) *
                      itemsPerPage +
                    1}

                {" "}to{" "}

                {Math.min(
                  currentPage *
                    itemsPerPage,
                  filteredData.length
                )}

                {" "}of{" "}

                {filteredData.length}

                {" "}entries

              </p>

              <div className="flex items-center gap-2">

                {/* Prev */}

                <button
                  type="button"
                  disabled={
                    currentPage === 1
                  }
                  onClick={() =>
                    setCurrentPage(
                      (prev: number) =>
                        Math.max(
                          1,
                          prev - 1
                        )
                    )
                  }
                  className={`flex h-[38px] min-w-[68px] items-center justify-center rounded-[2px] border px-3 font-arimo text-[14px] ${
                    currentPage === 1
                      ? "cursor-not-allowed border-[#e0e5eb] text-[#b7c0cb]"
                      : "border-[#d5dce5] text-[#17395f] hover:bg-[#f4f7fa]"
                  }`}
                >
                  Prev
                </button>

                {/* Pages */}

                {Array.from(
                  {
                    length: totalPages,
                  },
                  (_, index) => (
                    <button
                      key={index + 1}
                      type="button"
                      onClick={() =>
                        setCurrentPage(
                          index + 1
                        )
                      }
                      className={`hidden h-[38px] min-w-[38px] items-center justify-center rounded-[2px] font-lato text-[14px] font-bold sm:flex ${
                        currentPage ===
                        index + 1
                          ? "bg-black text-white"
                          : "text-[#17395f] hover:bg-[#f3f5f8]"
                      }`}
                    >
                      {index + 1}
                    </button>
                  )
                )}

                {/* Next */}

                <button
                  type="button"
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  onClick={() =>
                    setCurrentPage(
                      (prev: number) =>
                        Math.min(
                          totalPages,
                          prev + 1
                        )
                    )
                  }
                  className={`flex h-[38px] min-w-[68px] items-center justify-center rounded-[2px] border px-3 font-arimo text-[14px] ${
                    currentPage ===
                    totalPages
                      ? "cursor-not-allowed border-[#e0e5eb] text-[#b7c0cb]"
                      : "border-[#d5dce5] text-[#17395f] hover:bg-[#f4f7fa]"
                  }`}
                >
                  Next
                </button>

              </div>
            </div>
          </div>
        </div>

        {/* ======================================
            RECENT MOVEMENTS
        ====================================== */}

        <div className="h-fit rounded-[4px] border border-[#d8e0e9] bg-white p-7 xl:sticky xl:top-5">

          <div className="flex items-center justify-between">

            <h2 className="font-lato text-[26px] font-black text-[#071a35]">
              Recent Movements
            </h2>

            <FiClock
              size={21}
              className="text-[#61748d]"
            />

          </div>

          <div className="mt-5 border-t border-[#dce2e9]" />

          <div className="mt-6 space-y-7">

            {movements.map(
              (movement: Movement) => (
                <div
                  key={movement.id}
                  className="flex gap-5"
                >

                  <MovementIcon
                    type={
                      movement.type
                    }
                  />

                  <div className="min-w-0">

                    <p className="font-arimo text-[16px] leading-[1.5] text-[#071a35]">
                      {
                        movement.title
                      }
                    </p>

                    <p className="mt-1 font-arimo text-[14px] text-[#52647a]">
                      {
                        movement.location
                      }{" "}
                      •{" "}
                      {
                        movement.time
                      }
                    </p>

                  </div>

                </div>
              )
            )}

          </div>

          <button
            type="button"
            className="mt-10 flex w-full items-center justify-center gap-2 font-lato text-[16px] font-bold text-[#071a35] hover:underline"
          >
            View Full Stock History
            <span className="text-[20px]">
              →
            </span>
          </button>

        </div>
      </div>
    </div>
  );
};

export default WarehouseInventory;