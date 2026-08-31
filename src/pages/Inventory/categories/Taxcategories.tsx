import React, { useEffect, useMemo, useState } from "react";
import {
  FiPlus,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiEye,
  FiX,
  FiPercent,
  FiLayers,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

import GlobalModal from "@/components/common/GlobalModal";
import AddTaxCategoryModal from "./components/AddTaxCategoryModal";
import { taxApi } from "../../../api/endpoints/taxApi";

// =====================================================
// TAX CATEGORY TYPES
// =====================================================

interface TaxCategory {
  id: number;
  name: string;
  rate: number;
  rate_formatted: string;
  created_at: string;
  updated_at: string;
}

interface TaxCategoryPayload {
  name: string;
  rate: string;
}

interface PaginationData {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
}

interface ApiResponse {
  data: TaxCategory[];
  pagination: PaginationData;
}

// =====================================================
// ANIMATION VARIANTS
// =====================================================

const containerVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: {
    y: 18,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 14,
    },
  },
};

// =====================================================
// TAX CATEGORIES
// =====================================================

const Taxcategories: React.FC = () => {
  const [taxCategories, setTaxCategories] = useState<
    TaxCategory[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  const [pagination, setPagination] =
    useState<PaginationData | null>(null);

  // ===================================================
  // ADD MODAL
  // ===================================================

  const [addModalOpen, setAddModalOpen] =
    useState(false);

  const [addLoading, setAddLoading] =
    useState(false);

  // ===================================================
  // EDIT MODAL
  // ===================================================

  const [editModalOpen, setEditModalOpen] =
    useState(false);

  const [editLoading, setEditLoading] =
    useState(false);

  const [selectedTaxCategory, setSelectedTaxCategory] =
    useState<TaxCategory | null>(null);

  // ===================================================
  // DELETE STATE
  // ===================================================

  const [deleteModalOpen] = useState(false);
  const [deleteLoading] = useState(false);

  // ===================================================
  // VIEW MODAL
  // ===================================================

  const [viewModalOpen, setViewModalOpen] =
    useState(false);

  const [viewTaxCategory, setViewTaxCategory] =
    useState<TaxCategory | null>(null);

  // ===================================================
  // EDIT FORM
  // ===================================================

  const [editName, setEditName] = useState("");
  const [editRate, setEditRate] = useState("");

  // ===================================================
  // GET TAX CATEGORIES
  // ===================================================

  const fetchTaxCategories = async () => {
    try {
      setLoading(true);

      const response = await taxApi.getAll();

      const data = response.data as ApiResponse;

      setTaxCategories(data.data || []);
      setPagination(data.pagination || null);
    } catch (error: any) {
      console.error(
        "Get tax categories error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to fetch tax categories."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // INITIAL FETCH
  // ===================================================

  useEffect(() => {
    fetchTaxCategories();
  }, []);

  // ===================================================
  // SEARCH
  // ===================================================

  const filteredCategories = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return taxCategories;
    }

    return taxCategories.filter((item) =>
      [
        item.name,
        item.rate_formatted,
        String(item.rate),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [taxCategories, search]);

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.ceil(
    filteredCategories.length /
      ITEMS_PER_PAGE
  );

  const startIndex =
    (currentPage - 1) *
    ITEMS_PER_PAGE;

  const paginatedCategories =
    filteredCategories.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );

  const startEntry =
    filteredCategories.length === 0
      ? 0
      : startIndex + 1;

  const endEntry = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredCategories.length
  );

  // ===================================================
  // SEARCH HANDLER
  // ===================================================

  const handleSearch = (
    value: string
  ) => {
    setSearch(value);
    setCurrentPage(1);
  };

  // ===================================================
  // ADD TAX CATEGORY
  // ===================================================

  const handleAddTaxCategory = async (
    payload: TaxCategoryPayload
  ) => {
    try {
      setAddLoading(true);

      const response =
        await taxApi.add({
          name: payload.name,
          rate: parseFloat(payload.rate),
        });

      await fetchTaxCategories();

      setAddModalOpen(false);
      setCurrentPage(1);

      toast.success(
        response?.data?.message ||
          "Tax category added successfully."
      );
    } catch (error: any) {
      console.error(
        "Add tax category error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to add tax category."
      );
    } finally {
      setAddLoading(false);
    }
  };

  // ===================================================
  // EDIT OPEN
  // ===================================================

  const handleEdit = (
    category: TaxCategory
  ) => {
    setSelectedTaxCategory(category);

    setEditName(category.name);
    setEditRate(String(category.rate));

    setEditModalOpen(true);
  };

  // ===================================================
  // UPDATE TAX CATEGORY
  // ===================================================

  const handleUpdateTaxCategory =
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!selectedTaxCategory) return;

      if (!editName.trim()) {
        toast.error(
          "Please enter tax category name"
        );
        return;
      }

      if (
        !editRate.trim() ||
        isNaN(Number(editRate))
      ) {
        toast.error(
          "Please enter a valid tax rate"
        );
        return;
      }

      const rateNum = Number(editRate);

      if (
        rateNum < 0 ||
        rateNum > 100
      ) {
        toast.error(
          "Tax rate must be between 0 and 100"
        );
        return;
      }

      try {
        setEditLoading(true);

        const response =
          await taxApi.update(
            selectedTaxCategory.id,
            {
              name: editName.trim(),
              rate: rateNum,
            }
          );

        await fetchTaxCategories();

        setEditModalOpen(false);

        resetEditForm();

        toast.success(
          response?.data?.message ||
            "Tax category updated successfully."
        );
      } catch (error: any) {
        console.error(
          "Update tax category error:",
          error
        );

        toast.error(
          error?.response?.data?.message ||
            "Unable to update tax category."
        );
      } finally {
        setEditLoading(false);
      }
    };

  // ===================================================
  // VIEW
  // ===================================================

  const handleView = (
    category: TaxCategory
  ) => {
    setViewTaxCategory(category);
    setViewModalOpen(true);
  };

  // ===================================================
  // RESET FORM
  // ===================================================

  const resetEditForm = () => {
    setEditName("");
    setEditRate("");
    setSelectedTaxCategory(null);
  };

  // ===================================================
  // PAGE CHANGE
  // ===================================================

  const handlePageChange = (
    page: number
  ) => {
    if (page < 1) return;

    if (
      totalPages > 0 &&
      page > totalPages
    ) {
      return;
    }

    setCurrentPage(page);
  };

  // ===================================================
  // PAGINATION RANGE
  // ===================================================

  const getPaginationPages = () => {
    if (totalPages <= 5) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1
      );
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5];
    }

    if (currentPage >= totalPages - 2) {
      return [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
    ];
  };

  const paginationPages =
    getPaginationPages();

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <motion.div
      className="min-h-screen bg-[#faf8f3] p-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <motion.div
        variants={itemVariants}
        className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center"
      >
        <div>
          <div className="mb-1 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#b8902e]" />

            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b8902e]">
              Tax Management
            </span>
          </div>

          <h1 className="font-serif text-[28px] font-bold tracking-tight text-[#2a2620] sm:text-[30px]">
            Tax Categories
          </h1>

          <p className="mt-1 text-sm text-[#786f60]">
            Manage tax categories, rates, and
            applicable tax information.
          </p>
        </div>

        {/* Total */}

        <div className="hidden rounded-xl border border-[#b8902e]/15 bg-white px-4 py-2.5 shadow-sm sm:block">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#a89a7d]">
            Total Tax Categories
          </div>

          <div className="mt-0.5 text-lg font-bold text-[#2a2620]">
            {pagination?.total ??
              taxCategories.length}
          </div>
        </div>
      </motion.div>

      {/* =================================================
          SEARCH + ACTION
      ================================================= */}

      <motion.div
        variants={itemVariants}
        className="relative mb-6 overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white p-4 shadow-sm sm:p-5"
      >
        {/* Top Accent */}

        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#d4af52] via-[#c49b3a] to-[#8a6c1f]" />

        {/* Decorative Circles */}

        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full border border-[#d4af52]/20" />

        <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full border border-[#b8902e]/15" />

        <div className="pointer-events-none absolute right-8 top-8 h-3 w-3 rounded-full bg-[#d4af52]/30" />

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search */}

          <div className="relative w-full lg:max-w-[560px]">
            <FiSearch
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a8841c]"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                handleSearch(
                  e.target.value
                )
              }
              placeholder="Search tax categories..."
              className="h-[48px] w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] pl-11 pr-4 text-sm text-[#2a2620] outline-none transition-all placeholder:text-[#a89a7d] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
            />
          </div>

          {/* Add Button */}

          <motion.button
            type="button"
            onClick={() =>
              setAddModalOpen(true)
            }
            whileHover={{
              y: -2,
              boxShadow:
                "0 8px 20px rgba(140,105,25,0.20)",
            }}
            whileTap={{
              scale: 0.97,
            }}
            className="flex h-[46px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-5 text-sm font-bold text-white shadow-md shadow-[#b8902e]/20 transition-all hover:from-[#a8841c] hover:to-[#795b14]"
          >
            <FiPlus size={19} />

            <span>
              Add Tax Category
            </span>
          </motion.button>
        </div>
      </motion.div>

      {/* =================================================
          TABLE CARD
      ================================================= */}

      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-sm"
      >
        {/* Top Accent */}

        <div className="h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

      
        {/* =================================================
            TABLE
        ================================================= */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse">
            <thead>
              <tr className="bg-[#2f2a22] text-left">
                <th className="w-[80px] px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#f3dfab]">
                  S.No.
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#f3dfab]">
                  Tax Name
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#f3dfab]">
                  Rate
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#f3dfab]">
                  Created At
                </th>

                <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-[#f3dfab]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {/* =================================================
                  LOADING
              ================================================= */}

              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-16 text-center"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-4 flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-[#b8902e]/10">
                        <FiPercent
                          size={22}
                          className="text-[#b8902e]"
                        />
                      </div>

                      <p className="text-sm font-semibold text-[#4a4436]">
                        Loading tax categories...
                      </p>

                      <p className="mt-1 text-xs text-[#a89a7d]">
                        Please wait while we fetch
                        your tax information.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : paginatedCategories.length ===
                0 ? (
                /* =================================================
                    EMPTY
                ================================================= */

                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-16 text-center"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#b8902e]/15 bg-[#faf8f3]">
                        <FiLayers
                          size={24}
                          className="text-[#b8902e]"
                        />
                      </div>

                      <p className="text-sm font-semibold text-[#2a2620]">
                        No tax categories found
                      </p>

                      <p className="mt-1 max-w-sm text-xs text-[#a89a7d]">
                        There are no tax categories
                        matching your current search.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                /* =================================================
                    DATA ROWS
                ================================================= */

                paginatedCategories.map(
                  (item, index) => {
                    const serialNumber =
                      startIndex +
                      index +
                      1;

                    return (
                      <tr
                        key={item.id}
                        className="group border-b border-[#b8902e]/10 bg-white transition-all duration-200 hover:bg-[#faf8f3]"
                      >
                        {/* S.NO */}

                        <td className="px-5 py-4">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-xs font-bold text-[#8f6d1d]">
                            {serialNumber}
                          </span>
                        </td>

                        {/* TAX NAME */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#d4af52]" />

                            <span className="text-sm font-bold text-[#2a2620]">
                              {item.name}
                            </span>
                          </div>
                        </td>

                        {/* RATE */}

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b8902e]/20 bg-[#faf8f3] px-3 py-1.5 text-xs font-bold text-[#8f6d1d]">
                            <FiPercent size={13} />

                            {item.rate_formatted}
                          </span>
                        </td>

                        {/* CREATED */}

                        <td className="px-5 py-4">
                          <span className="text-xs font-medium text-[#786f60]">
                            {item.created_at
                              ? new Date(
                                  item.created_at
                                ).toLocaleString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )
                              : "—"}
                          </span>
                        </td>

                        {/* ACTIONS */}

                        <td className="px-5 py-4">
                          <div className="flex justify-center gap-2">
                            {/* VIEW */}

                            <button
                              type="button"
                              title="View Details"
                              onClick={() =>
                                handleView(
                                  item
                                )
                              }
                              className="group/view flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/20 bg-[#faf8f3] text-[#8f6d1d] transition-all duration-200 hover:border-[#b8902e] hover:bg-[#b8902e] hover:text-white hover:shadow-md hover:shadow-[#b8902e]/20"
                            >
                              <FiEye
                                size={16}
                                className="transition-transform group-hover/view:scale-110"
                              />
                            </button>

                            {/* EDIT */}

                            <button
                              type="button"
                              title="Edit Tax Category"
                              onClick={() =>
                                handleEdit(
                                  item
                                )
                              }
                              className="group/edit flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/20 bg-[#faf8f3] text-[#8f6d1d] transition-all duration-200 hover:border-[#8f6d1d] hover:bg-[#8f6d1d] hover:text-white hover:shadow-md hover:shadow-[#8f6d1d]/20"
                            >
                              <FiEdit2
                                size={15}
                                className="transition-transform group-hover/edit:scale-110"
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>

        {/* =================================================
            PAGINATION
        ================================================= */}

        <div className="border-t border-[#b8902e]/10 bg-[#fffdfa] px-4 py-4 sm:px-5">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-[#8b8171]">
              Showing{" "}
              <span className="font-bold text-[#4a4436]">
                {startEntry}
              </span>{" "}
              to{" "}
              <span className="font-bold text-[#4a4436]">
                {endEntry}
              </span>{" "}
              of{" "}
              <span className="font-bold text-[#4a4436]">
                {filteredCategories.length}
              </span>{" "}
              entries
            </p>

            <div className="flex items-center gap-1.5">
              {/* PREVIOUS */}

              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  handlePageChange(
                    currentPage - 1
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#b8902e]/15 bg-white text-[#8f6d1d] transition-all hover:border-[#b8902e]/30 hover:bg-[#faf8f3] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <FiChevronLeft
                  size={17}
                />
              </button>

              {/* PAGE NUMBERS */}

              {paginationPages.map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() =>
                      handlePageChange(
                        page
                      )
                    }
                    className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold transition-all ${
                      currentPage === page
                        ? "bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-white shadow-md shadow-[#b8902e]/20"
                        : "border border-transparent text-[#786f60] hover:border-[#b8902e]/20 hover:bg-[#faf8f3] hover:text-[#8f6d1d]"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              {/* NEXT */}

              <button
                type="button"
                disabled={
                  currentPage ===
                    totalPages ||
                  totalPages === 0
                }
                onClick={() =>
                  handlePageChange(
                    currentPage + 1
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#b8902e]/15 bg-white text-[#8f6d1d] transition-all hover:border-[#b8902e]/30 hover:bg-[#faf8f3] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <FiChevronRight
                  size={17}
                />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* =================================================
          VIEW TAX CATEGORY MODAL
      ================================================= */}

      <GlobalModal
        isOpen={viewModalOpen}
        onClose={() =>
          setViewModalOpen(false)
        }
      >
        {viewTaxCategory && (
          <div className="relative w-full max-w-[500px] overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
            {/* TOP ACCENT */}

            <div className="h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-[#b8902e]/10 px-5 py-4">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#b8902e]" />

                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#b8902e]">
                    Tax Management
                  </span>
                </div>

                <h2 className="text-lg font-bold text-[#2a2620]">
                  Tax Category Details
                </h2>

                <p className="mt-1 text-xs text-[#a89a7d]">
                  View tax category information
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setViewModalOpen(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] text-[#8f6d1d] transition hover:border-[#b8902e]/30 hover:bg-[#b8902e]/10"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* CONTENT */}

            <div className="max-h-[75vh] overflow-y-auto p-5">
              <div className="space-y-3">
                {/* TAX NAME */}

                <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#a89a7d]">
                    Tax Name
                  </p>

                  <p className="text-sm font-bold text-[#2a2620]">
                    {viewTaxCategory.name}
                  </p>
                </div>

                {/* TAX RATE */}

                <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#a89a7d]">
                    Tax Rate
                  </p>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b8902e]/20 bg-white px-3 py-1.5 text-sm font-bold text-[#8f6d1d]">
                    <FiPercent
                      size={14}
                    />

                    {
                      viewTaxCategory.rate_formatted
                    }
                  </span>
                </div>

                {/* CREATED */}

                <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#a89a7d]">
                    Created At
                  </p>

                  <p className="text-xs font-semibold text-[#4a4436]">
                    {viewTaxCategory.created_at
                      ? new Date(
                          viewTaxCategory.created_at
                        ).toLocaleString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "—"}
                  </p>
                </div>

                {/* UPDATED */}

                <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#a89a7d]">
                    Updated At
                  </p>

                  <p className="text-xs font-semibold text-[#4a4436]">
                    {viewTaxCategory.updated_at
                      ? new Date(
                          viewTaxCategory.updated_at
                        ).toLocaleString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* FOOTER */}

            <div className="flex justify-end gap-3 border-t border-[#b8902e]/10 bg-[#fffdfa] px-5 py-4">
              <button
                type="button"
                onClick={() =>
                  setViewModalOpen(false)
                }
                className="rounded-xl border border-[#b8902e]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#786f60] transition hover:border-[#b8902e]/30 hover:bg-[#faf8f3] hover:text-[#8f6d1d]"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewModalOpen(false);
                  handleEdit(
                    viewTaxCategory
                  );
                }}
                className="rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#b8902e]/20 transition hover:from-[#a8841c] hover:to-[#795b14]"
              >
                Edit Category
              </button>
            </div>
          </div>
        )}
      </GlobalModal>

      {/* =================================================
          ADD TAX CATEGORY MODAL
      ================================================= */}

      <AddTaxCategoryModal
        open={addModalOpen}
        loading={addLoading}
        onClose={() =>
          setAddModalOpen(false)
        }
        onSubmit={
          handleAddTaxCategory
        }
      />

      {/* =================================================
          EDIT TAX CATEGORY MODAL
      ================================================= */}

      <GlobalModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          resetEditForm();
        }}
        closeOnOverlayClick={true}
      >
        <div className="relative w-full max-w-[500px] overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
          {/* TOP ACCENT */}

          <div className="h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

          {/* HEADER */}

          <div className="flex items-center justify-between border-b border-[#b8902e]/10 px-5 py-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#b8902e]" />

                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#b8902e]">
                  Tax Management
                </span>
              </div>

              <h2 className="text-lg font-bold text-[#2a2620]">
                Edit Tax Category
              </h2>

              <p className="mt-1 text-xs text-[#a89a7d]">
                Update tax category information
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditModalOpen(false);
                resetEditForm();
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] text-[#8f6d1d] transition hover:border-[#b8902e]/30 hover:bg-[#b8902e]/10"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* FORM */}

          <div className="max-h-[calc(100vh-155px)] overflow-y-auto px-5 py-5">
            <form
              id="edit-tax-category-form"
              onSubmit={
                handleUpdateTaxCategory
              }
              className="space-y-5"
            >
              {/* TAX NAME */}

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6b6152]">
                  Tax Name{" "}
                  <span className="text-[#b46055]">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  value={editName}
                  onChange={(e) =>
                    setEditName(
                      e.target.value
                    )
                  }
                  placeholder="e.g. GST, VAT, Sales Tax"
                  className="h-12 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 text-sm text-[#2a2620] outline-none transition-all placeholder:text-[#a89a7d] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
                />
              </div>

              {/* TAX RATE */}

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6b6152]">
                  Tax Rate (%){" "}
                  <span className="text-[#b46055]">
                    *
                  </span>
                </label>

                <div className="relative">
                  <input
                    type="number"
                    value={editRate}
                    onChange={(e) =>
                      setEditRate(
                        e.target.value
                      )
                    }
                    placeholder="e.g. 18"
                    min="0"
                    max="100"
                    step="0.01"
                    className="h-12 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] pl-4 pr-12 text-sm text-[#2a2620] outline-none transition-all placeholder:text-[#a89a7d] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
                  />

                  <div className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#a8841c]">
                    <FiPercent
                      size={17}
                    />
                  </div>
                </div>

                <p className="mt-1.5 text-xs text-[#a89a7d]">
                  Enter a percentage between 0 and
                  100.
                </p>
              </div>

              {/* QUICK GST */}

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6b6152]">
                  Quick GST Rates
                </label>

                <div className="flex flex-wrap gap-2">
                  {[
                    "0",
                    "5",
                    "12",
                    "18",
                    "28",
                  ].map((gstRate) => {
                    const isSelected =
                      editRate === gstRate;

                    return (
                      <button
                        key={gstRate}
                        type="button"
                        onClick={() =>
                          setEditRate(
                            gstRate
                          )
                        }
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                          isSelected
                            ? "border border-[#b8902e] bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] text-white shadow-md shadow-[#b8902e]/20"
                            : "border border-[#b8902e]/15 bg-[#faf8f3] text-[#786f60] hover:border-[#b8902e]/30 hover:bg-[#b8902e]/10 hover:text-[#8f6d1d]"
                        }`}
                      >
                        {gstRate}%
                      </button>
                    );
                  })}
                </div>
              </div>
            </form>
          </div>

          {/* FOOTER */}

          <div className="flex items-center justify-end gap-3 border-t border-[#b8902e]/10 bg-[#fffdfa] px-5 py-4">
            <button
              type="button"
              onClick={() => {
                setEditModalOpen(false);
                resetEditForm();
              }}
              disabled={editLoading}
              className="h-11 rounded-xl border border-[#b8902e]/20 bg-white px-6 text-sm font-semibold text-[#786f60] transition hover:border-[#b8902e]/30 hover:bg-[#faf8f3] hover:text-[#8f6d1d] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="edit-tax-category-form"
              disabled={editLoading}
              className="h-11 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-7 text-sm font-bold text-white shadow-md shadow-[#b8902e]/20 transition hover:from-[#a8841c] hover:to-[#795b14] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {editLoading
                ? "Updating..."
                : "Update Category"}
            </button>
          </div>
        </div>
      </GlobalModal>
    </motion.div>
  );
};

export default Taxcategories;