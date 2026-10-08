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
  FiRefreshCw,
  FiAlertCircle,
} from "react-icons/fi";

import { motion } from "framer-motion";

import { toast } from "react-hot-toast";

import GlobalModal from "@/components/common/GlobalModal";

import AddTaxCategoryModal from "./components/AddTaxCategoryModal";

import { taxApi } from "../../../api/endpoints/taxApi";

// =====================================================
// PERMISSIONS
// =====================================================

import { usePermissions } from "../../permissions/usePermissions";

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
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: {
    y: 12,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 16,
    },
  },
};

// =====================================================
// DATE HELPER
// =====================================================

const formatDate = (value?: string | null) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// =====================================================
// PERMISSION LOADING STATE
// =====================================================

const PermissionLoadingState: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F8FD] p-6 font-poppins">
      <div className="w-full max-w-md rounded-2xl border border-[#D6E2F0] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
          <FiRefreshCw
            size={24}
            className="animate-spin"
          />
        </div>

        <h2 className="mt-5 text-base font-bold text-[#111827]">
          Checking permissions...
        </h2>

        <p className="mt-2 text-sm text-[#6B7280]">
          Please wait while we verify your access.
        </p>
      </div>
    </div>
  );
};

// =====================================================
// TAX CATEGORIES
// =====================================================

const Taxcategories: React.FC = () => {
  // ===================================================
  // PERMISSIONS
  // ===================================================

  const {
    hasPermission,
    hasModuleAccess,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  const canViewTaxCategories = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("tax_category") ||
      hasModuleAccess("tax") ||
      hasPermission("tax_category.view") ||
      hasPermission("tax.view"),
    [
      isSuperAdmin,
      hasModuleAccess,
      hasPermission,
    ],
  );

  const canCreateTaxCategory = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("tax_category.create") ||
      hasPermission("tax.create"),
    [isSuperAdmin, hasPermission],
  );

  const canUpdateTaxCategory = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("tax_category.update") ||
      hasPermission("tax_category.edit") ||
      hasPermission("tax.update"),
    [isSuperAdmin, hasPermission],
  );

  // ===================================================
  // STATE
  // ===================================================

  const [taxCategories, setTaxCategories] =
    useState<TaxCategory[]>([]);

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
        error,
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to fetch tax categories.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // INITIAL FETCH
  // ===================================================

  useEffect(() => {
    if (
      !permissionsLoading &&
      canViewTaxCategories
    ) {
      fetchTaxCategories();
    }
  }, [
    permissionsLoading,
    canViewTaxCategories,
  ]);

  // ===================================================
  // SEARCH
  // ===================================================

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

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
        .includes(query),
    );
  }, [taxCategories, search]);

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.ceil(
    filteredCategories.length /
      ITEMS_PER_PAGE,
  );

  const safeTotalPages = Math.max(
    totalPages,
    1,
  );

  const startIndex =
    (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedCategories =
    filteredCategories.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE,
    );

  const startEntry =
    filteredCategories.length === 0
      ? 0
      : startIndex + 1;

  const endEntry = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredCategories.length,
  );

  // ===================================================
  // KEEP CURRENT PAGE VALID
  // ===================================================

  useEffect(() => {
    if (currentPage > safeTotalPages) {
      setCurrentPage(safeTotalPages);
    }
  }, [
    currentPage,
    safeTotalPages,
  ]);

  // ===================================================
  // SEARCH HANDLER
  // ===================================================

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  // ===================================================
  // ADD TAX CATEGORY
  // ===================================================

  const handleAddTaxCategory = async (
    payload: TaxCategoryPayload,
  ) => {
    try {
      setAddLoading(true);

      const response = await taxApi.add({
        name: payload.name,
        rate: parseFloat(payload.rate),
      });

      await fetchTaxCategories();

      setAddModalOpen(false);
      setCurrentPage(1);

      toast.success(
        response?.data?.message ||
          "Tax category added successfully.",
      );
    } catch (error: any) {
      console.error(
        "Add tax category error:",
        error,
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to add tax category.",
      );
    } finally {
      setAddLoading(false);
    }
  };

  // ===================================================
  // EDIT OPEN
  // ===================================================

  const handleEdit = (
    category: TaxCategory,
  ) => {
    setSelectedTaxCategory(category);
    setEditName(category.name);
    setEditRate(String(category.rate));
    setEditModalOpen(true);
  };

  // ===================================================
  // UPDATE TAX CATEGORY
  // ===================================================

  const handleUpdateTaxCategory = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    if (!selectedTaxCategory) {
      return;
    }

    if (!editName.trim()) {
      toast.error(
        "Please enter tax category name",
      );
      return;
    }

    if (
      !editRate.trim() ||
      isNaN(Number(editRate))
    ) {
      toast.error(
        "Please enter a valid tax rate",
      );
      return;
    }

    const rateNum = Number(editRate);

    if (
      rateNum < 0 ||
      rateNum > 100
    ) {
      toast.error(
        "Tax rate must be between 0 and 100",
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
          },
        );

      await fetchTaxCategories();

      setEditModalOpen(false);
      resetEditForm();

      toast.success(
        response?.data?.message ||
          "Tax category updated successfully.",
      );
    } catch (error: any) {
      console.error(
        "Update tax category error:",
        error,
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to update tax category.",
      );
    } finally {
      setEditLoading(false);
    }
  };

  // ===================================================
  // VIEW
  // ===================================================

  const handleView = (
    category: TaxCategory,
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
    page: number,
  ) => {
    if (page < 1) {
      return;
    }

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

  const paginationPages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1,
      );
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5];
    }

    if (
      currentPage >=
      totalPages - 2
    ) {
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
  }, [currentPage, totalPages]);

  // ===================================================
  // LOADING STATE
  // ===================================================

  if (permissionsLoading) {
    return <PermissionLoadingState />;
  }

  // ===================================================
  // ACCESS DENIED
  // ===================================================

  if (!canViewTaxCategories) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F8FD] p-4 font-poppins">
        <div className="max-w-md rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#C23B32]">
            <FiAlertCircle size={26} />
          </div>

          <h2 className="text-lg font-bold text-[#111827]">
            Access Denied
          </h2>

          <p className="mt-2 text-sm text-[#6B7280]">
            You don't have permission to
            access this section.
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <motion.div
      className="min-h-screen bg-white p-4 font-poppins sm:p-5 lg:p-6"
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
          <div className="mb-1.5 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2D6FE8]" />

            <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]" />

            <span className="h-1.5 w-1.5 rounded-full bg-[#4F8FF7]" />

            <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#2D6FE8]">
              Tax Management
            </span>
          </div>

          <h1 className="text-[20px] font-medium tracking-tight text-[#111827] sm:text-[22px]">
            Tax Categories
          </h1>

          <p className="mt-0.5 text-sm text-[#111827]">
            Manage tax categories, rates, and
            applicable tax information.
          </p>
        </div>

        {/* TOTAL */}

        <div className="rounded-xl border border-[#DCE6F2] bg-white px-4 py-2.5 shadow-sm">
          <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
            Total Tax Categories
          </div>

          <div className="mt-0.5 text-lg font-bold text-[#111827]">
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
        className="relative mb-5 overflow-hidden rounded-[18px] border border-[#DCE6F2] bg-white p-4  sm:p-5"
      >
   

        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full border border-[#2D6FE8]/10" />

        <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full border border-[#2D6FE8]/10" />

        <div className="pointer-events-none absolute right-8 top-8 h-3 w-3 rounded-full bg-[#FACC15]/30" />

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* SEARCH */}

          <div className="relative w-full lg:max-w-[560px]">
            <FiSearch
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#111827]"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                handleSearch(
                  e.target.value,
                )
              }
              placeholder="Search tax categories..."
              className="h-11 w-full rounded-xl border border-[#D6E2F0] bg-[#F4F8FD] pl-10 pr-4 text-xs text-[#111827] outline-none transition-all placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/15"
            />
          </div>

          {/* ACTIONS */}

          <div className="flex items-center gap-2">
            {/* REFRESH */}

            <motion.button
              type="button"
              onClick={() => {
                fetchTaxCategories();
                setCurrentPage(1);
              }}
              disabled={loading}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] px-4 text-xs font-bold text-[#111827] shadow-sm transition hover:border-[#2D6FE8]/30 hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiRefreshCw
                size={14}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              <span className="hidden sm:inline">
                Refresh
              </span>
            </motion.button>

            {/* ADD */}

            {canCreateTaxCategory && (
              <motion.button
                type="button"
                onClick={() =>
                  setAddModalOpen(true)
                }
                whileHover={{ y: -2 }}
                whileTap={{
                  scale: 0.97,
                }}
                className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-5 text-xs font-bold text-white  transition hover:shadow-[0_12px_22px_-8px_rgba(45,111,232,0.7)]"
              >
                <FiPlus size={15} />

                Add Tax Category
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* =================================================
          TABLE CARD
      ================================================= */}

      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-[18px] border border-[#DCE6F2] bg-white shadow-[0_10px_35px_-24px_rgba(42,65,104,0.35)]"
      >
   
        {/* TABLE */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse">
            <thead>
              <tr className="bg-[#4F8FF7] text-left">
                <th className="w-[80px] px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                  S.No.
                </th>

                <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                  Tax Name
                </th>

                <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                  Rate
                </th>

                <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                  Created At
                </th>

                {(canViewTaxCategories ||
                  canUpdateTaxCategory) && (
                  <th className="px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {/* LOADING */}

              {loading ? (
                <tr>
                  <td
                    colSpan={
                      canViewTaxCategories ||
                      canUpdateTaxCategory
                        ? 5
                        : 4
                    }
                    className="px-5 py-16 text-center"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                        <FiPercent size={22} />
                      </div>

                      <p className="mt-4 text-sm font-bold text-[#111827]">
                        Loading tax categories...
                      </p>

                      <p className="mt-1 text-xs text-[#6B7280]">
                        Please wait while we fetch your tax information.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : paginatedCategories.length ===
                0 ? (
                /* EMPTY */

                <tr>
                  <td
                    colSpan={
                      canViewTaxCategories ||
                      canUpdateTaxCategory
                        ? 5
                        : 4
                    }
                    className="px-5 py-16 text-center"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2D6FE8]/10 bg-[#EAF3FF] text-[#2D6FE8]">
                        <FiLayers
                          size={24}
                        />
                      </div>

                      <p className="mt-4 text-sm font-bold text-[#111827]">
                        No tax categories
                        found
                      </p>

                      <p className="mt-1 max-w-sm text-xs text-[#6B7280]">
                        There are no tax
                        categories matching
                        your current search.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                /* ROWS */

                paginatedCategories.map(
                  (item, index) => {
                    const serialNumber =
                      startIndex +
                      index +
                      1;

                    return (
                      <motion.tr
                        key={item.id}
                        initial={{
                          opacity: 0,
                          y: 5,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          delay:
                            index *
                            0.03,
                        }}
                        className="group border-b border-[#2D6FE8]/10 bg-white transition-all duration-200 hover:bg-[#F4F8FD]"
                      >
                        {/* S.NO */}

                        <td className="px-4 py-4">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF3FF] text-xs font-bold text-[#2D6FE8]">
                            {
                              serialNumber
                            }
                          </span>
                        </td>

                        {/* TAX NAME */}

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#2D6FE8]" />

                            <span className="text-sm font-bold text-[#111827]">
                              {
                                item.name
                              }
                            </span>
                          </div>
                        </td>

                        {/* RATE */}

                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#2D6FE8]/15 bg-[#EAF3FF] px-3 py-1.5 text-xs font-bold text-[#2D6FE8]">
                            <FiPercent
                              size={12}
                            />

                            {
                              item.rate_formatted
                            }
                          </span>
                        </td>

                        {/* CREATED */}

                        <td className="px-4 py-4">
                          <span className="text-xs font-medium text-[#111827]">
                            {formatDate(
                              item.created_at,
                            )}
                          </span>
                        </td>

                        {/* ACTIONS */}

                        {(canViewTaxCategories ||
                          canUpdateTaxCategory) && (
                          <td className="px-4 py-4">
                            <div className="flex justify-center gap-1.5">
                              {/* VIEW */}

                              {canViewTaxCategories && (
                                <button
                                  type="button"
                                  title="View Details"
                                  onClick={() =>
                                    handleView(
                                      item,
                                    )
                                  }
                                  className="group/view flex h-9 w-9 items-center justify-center rounded-xl border border-[#2D6FE8]/15 bg-[#EAF3FF] text-[#2D6FE8] transition-all duration-200 hover:border-[#2D6FE8] hover:bg-[#2D6FE8] hover:text-white"
                                >
                                  <FiEye
                                    size={15}
                                    className="transition-transform group-hover/view:scale-110"
                                  />
                                </button>
                              )}

                              {/* EDIT */}

                              {canUpdateTaxCategory && (
                                <button
                                  type="button"
                                  title="Edit Tax Category"
                                  onClick={() =>
                                    handleEdit(
                                      item,
                                    )
                                  }
                                  className="group/edit flex h-9 w-9 items-center justify-center rounded-xl border border-[#DCE6F2] bg-white text-[#111827] transition-all duration-200 hover:border-[#2D6FE8] hover:bg-[#2D6FE8] hover:text-white"
                                >
                                  <FiEdit2
                                    size={15}
                                    className="transition-transform group-hover/edit:scale-110"
                                  />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    );
                  },
                )
              )}
            </tbody>
          </table>
        </div>

        {/* =================================================
            PAGINATION
        ================================================= */}

        {filteredCategories.length > 0 && (
          <div className="border-t border-[#DCE6F2] bg-[#F8FBFF] px-4 py-4 sm:px-5">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-xs text-[#6B7280]">
                Showing{" "}
                <span className="font-bold text-[#111827]">
                  {startEntry}
                </span>{" "}
                to{" "}
                <span className="font-bold text-[#111827]">
                  {endEntry}
                </span>{" "}
                of{" "}
                <span className="font-bold text-[#111827]">
                  {
                    filteredCategories.length
                  }
                </span>{" "}
                entries
              </p>

              <div className="flex items-center gap-1.5">
                {/* PREVIOUS */}

                <button
                  type="button"
                  disabled={
                    currentPage === 1
                  }
                  onClick={() =>
                    handlePageChange(
                      currentPage - 1,
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#111827] transition hover:border-[#2D6FE8]/30 hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:cursor-not-allowed disabled:opacity-30"
                  title="Previous page"
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
                          page,
                        )
                      }
                      className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold transition-all ${
                        currentPage ===
                        page
                          ? "bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-white shadow-[0_6px_14px_-6px_rgba(45,111,232,0.55)]"
                          : "border border-transparent text-[#111827] hover:border-[#2D6FE8]/15 hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"
                      }`}
                    >
                      {page}
                    </button>
                  ),
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
                      currentPage + 1,
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#111827] transition hover:border-[#2D6FE8]/30 hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:cursor-not-allowed disabled:opacity-30"
                  title="Next page"
                >
                  <FiChevronRight
                    size={17}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* =================================================
          VIEW MODAL
      ================================================= */}

      {canViewTaxCategories && (
        <GlobalModal
          isOpen={viewModalOpen}
          onClose={() =>
            setViewModalOpen(false)
          }
          closeOnOverlayClick
        >
          {viewTaxCategory && (
            <div className="relative w-full max-w-[500px] overflow-hidden rounded-[20px] border border-[#DCE6F2] bg-white font-poppins shadow-2xl">
   
              <div className="flex items-start justify-between gap-4 border-b border-[#DCE6F2] px-5 py-5">
                <div>
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2D6FE8]" />

                    <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#2D6FE8]">
                      Tax Management
                    </span>
                  </div>

                  <h2 className="text-[20px] font-bold text-[#111827]">
                    Tax Category Details
                  </h2>

                  <p className="mt-1 text-xs text-[#6B7280]">
                    View tax category
                    information
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setViewModalOpen(
                      false,
                    )
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F8FD] text-[#111827] transition hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* CONTENT */}

              <div className="max-h-[75vh] overflow-y-auto bg-white p-5">
                <div className="space-y-3">
                  {/* TAX NAME */}

                  <div className="rounded-xl border border-[#DCE6F2] bg-[#F8FBFF] p-4">
                    <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
                      Tax Name
                    </p>

                    <p className="text-sm font-bold text-[#111827]">
                      {
                        viewTaxCategory.name
                      }
                    </p>
                  </div>

                  {/* TAX RATE */}

                  <div className="rounded-xl border border-[#DCE6F2] bg-[#F8FBFF] p-4">
                    <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
                      Tax Rate
                    </p>

                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#2D6FE8]/15 bg-[#EAF3FF] px-3 py-1.5 text-sm font-bold text-[#2D6FE8]">
                      <FiPercent
                        size={14}
                      />

                      {
                        viewTaxCategory.rate_formatted
                      }
                    </span>
                  </div>

                  {/* CREATED */}

                  <div className="rounded-xl border border-[#DCE6F2] bg-[#F8FBFF] p-4">
                    <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
                      Created At
                    </p>

                    <p className="text-xs font-semibold text-[#111827]">
                      {formatDate(
                        viewTaxCategory.created_at,
                      )}
                    </p>
                  </div>

                  {/* UPDATED */}

                  <div className="rounded-xl border border-[#DCE6F2] bg-[#F8FBFF] p-4">
                    <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
                      Updated At
                    </p>

                    <p className="text-xs font-semibold text-[#111827]">
                      {formatDate(
                        viewTaxCategory.updated_at,
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* FOOTER */}

              <div className="flex justify-end gap-2 border-t border-[#DCE6F2] bg-[#F8FBFF] px-5 py-4">
                <button
                  type="button"
                  onClick={() =>
                    setViewModalOpen(
                      false,
                    )
                  }
                  className="rounded-xl border border-[#DCE6F2] bg-white px-5 py-2.5 text-sm font-bold text-[#111827] transition hover:border-[#2D6FE8]/20 hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"
                >
                  Close
                </button>

                {canUpdateTaxCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setViewModalOpen(
                        false,
                      );
                      handleEdit(
                        viewTaxCategory,
                      );
                    }}
                    className="rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(45,111,232,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(45,111,232,0.7)]"
                  >
                    Edit Category
                  </button>
                )}
              </div>
            </div>
          )}
        </GlobalModal>
      )}

      {/* =================================================
          ADD MODAL
      ================================================= */}

      {canCreateTaxCategory && (
        <AddTaxCategoryModal
          open={addModalOpen}
          loading={addLoading}
          onClose={() => {
            if (!addLoading) {
              setAddModalOpen(false);
            }
          }}
          onSubmit={handleAddTaxCategory}
        />
      )}

      {/* =================================================
          EDIT MODAL
      ================================================= */}

      {canUpdateTaxCategory && (
        <GlobalModal
          isOpen={editModalOpen}
          onClose={() => {
            if (!editLoading) {
              setEditModalOpen(false);
              resetEditForm();
            }
          }}
          closeOnOverlayClick={
            !editLoading
          }
        >
          <div className="relative w-full max-w-[500px] overflow-hidden rounded-[20px] border border-[#DCE6F2] bg-white font-poppins shadow-2xl">
            {/* ACCENT */}

            <div className="h-[3px] w-full bg-gradient-to-r from-[#4F8FF7] via-[#2D6FE8] to-[#2D6FE8]" />

            {/* HEADER */}

            <div className="flex items-start justify-between gap-4 border-b border-[#DCE6F2] px-5 py-5">
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2D6FE8]" />

                  <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#2D6FE8]">
                    Tax Management
                  </span>
                </div>

                <h2 className="text-[20px] font-bold text-[#111827]">
                  Edit Tax Category
                </h2>

                <p className="mt-1 text-xs text-[#6B7280]">
                  Update tax category
                  information
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!editLoading) {
                    setEditModalOpen(
                      false,
                    );
                    resetEditForm();
                  }
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F8FD] text-[#111827] transition hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* FORM */}

            <div className="max-h-[calc(100vh-155px)] overflow-y-auto bg-[#F8FBFF] px-5 py-5">
              <form
                id="edit-tax-category-form"
                onSubmit={
                  handleUpdateTaxCategory
                }
                className="space-y-5"
              >
                {/* TAX NAME */}

                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#111827]">
                    Tax Name{" "}
                    <span className="text-[#C23B32]">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={editName}
                    onChange={(e) =>
                      setEditName(
                        e.target.value,
                      )
                    }
                    placeholder="e.g. GST, VAT, Sales Tax"
                    className="h-11 w-full rounded-xl border border-[#D6E2F0] bg-white px-4 text-sm text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:ring-2 focus:ring-[#2D6FE8]/15"
                  />
                </div>

                {/* TAX RATE */}

                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#111827]">
                    Tax Rate (%){" "}
                    <span className="text-[#C23B32]">
                      *
                    </span>
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      value={editRate}
                      onChange={(e) =>
                        setEditRate(
                          e.target.value,
                        )
                      }
                      placeholder="e.g. 18"
                      min="0"
                      max="100"
                      step="0.01"
                      className="h-11 w-full rounded-xl border border-[#D6E2F0] bg-white pl-4 pr-12 text-sm text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:ring-2 focus:ring-[#2D6FE8]/15"
                    />

                    <div className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2D6FE8]">
                      <FiPercent size={16} />
                    </div>
                  </div>

                  <p className="mt-1.5 text-[9px] text-[#6B7280]">
                    Enter a percentage
                    between 0 and 100.
                  </p>
                </div>

                {/* QUICK GST */}

                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#111827]">
                    Quick GST Rates
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {[
                      "0",
                      "5",
                      "12",
                      "18",
                      "28",
                    ].map(
                      (gstRate) => {
                        const isSelected =
                          editRate ===
                          gstRate;

                        return (
                          <button
                            key={gstRate}
                            type="button"
                            onClick={() =>
                              setEditRate(
                                gstRate,
                              )
                            }
                            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                              isSelected
                                ? "bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-white shadow-[0_6px_14px_-6px_rgba(45,111,232,0.55)]"
                                : "border border-[#DCE6F2] bg-white text-[#111827] hover:border-[#2D6FE8]/30 hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"
                            }`}
                          >
                            {gstRate}%
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* FOOTER */}

            <div className="flex items-center justify-end gap-2 border-t border-[#DCE6F2] bg-[#F8FBFF] px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  if (!editLoading) {
                    setEditModalOpen(
                      false,
                    );
                    resetEditForm();
                  }
                }}
                disabled={editLoading}
                className="h-10 rounded-xl border border-[#DCE6F2] bg-white px-5 text-sm font-bold text-[#111827] transition hover:border-[#2D6FE8]/20 hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="edit-tax-category-form"
                disabled={editLoading}
                className="flex h-10 min-w-[150px] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-6 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(45,111,232,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(45,111,232,0.7)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {editLoading && (
                  <FiRefreshCw
                    size={14}
                    className="animate-spin"
                  />
                )}

                {editLoading
                  ? "Updating..."
                  : "Update Category"}
              </button>
            </div>
          </div>
        </GlobalModal>
      )}
    </motion.div>
  );
};

export default Taxcategories;