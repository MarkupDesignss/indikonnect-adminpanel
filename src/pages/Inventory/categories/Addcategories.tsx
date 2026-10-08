
import React, { useEffect, useMemo, useState } from "react";

import {
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiAlertCircle,
} from "react-icons/fi";

import { motion } from "framer-motion";

import { toast } from "react-hot-toast";

import CategoryTable from "./components/CategoryTable";
import AddCategoryModal from "./components/AddCategoryModal";
import EditCategoryModal from "./components/EditCategoryModal";
import DeleteCategoryModal from "./components/DeleteCategoryModal";

import GlobalModal from "@/components/common/GlobalModal";

import {
  categoryApi,
  Category,
} from "../../../api/endpoints/category";

import { usePermissions } from "../../permissions/usePermissions";

// =====================================================
// TYPES
// =====================================================

interface CategoryPayload {
  title: string;
  description: string;
  status: "active" | "inactive";
  image?: File | string | null;
  parentCategory?: string | number | null;
}

// =====================================================
// ANIMATION
// =====================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { y: 12, opacity: 0 },
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
// PERMISSION LOADING STATE
// =====================================================

const PermissionLoadingState: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F8FD] p-6 font-poppins">
      <div className="w-full max-w-md rounded-2xl border border-[#D6E2F0] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
          <FiRefreshCw size={24} className="animate-spin" />
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
// COMPONENT
// =====================================================

const Addcategories: React.FC = () => {
  // ===================================================
  // PERMISSIONS
  // ===================================================

  const {
    hasPermission,
    hasModuleAccess,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  const canViewCategories = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("category") ||
      hasPermission("category.view"),
    [isSuperAdmin, hasModuleAccess, hasPermission],
  );

  const canCreateCategory = useMemo(
    () => isSuperAdmin || hasPermission("category.create"),
    [isSuperAdmin, hasPermission],
  );

  const canUpdateCategory = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("category.update") ||
      hasPermission("category.edit"),
    [isSuperAdmin, hasPermission],
  );

  const canDeleteCategory = useMemo(
    () => isSuperAdmin || hasPermission("category.delete"),
    [isSuperAdmin, hasPermission],
  );

  // ===================================================
  // CATEGORIES
  // ===================================================

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  // ===================================================
  // ADD MODAL
  // ===================================================

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  // ===================================================
  // EDIT MODAL
  // ===================================================

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);

  // ===================================================
  // DELETE MODAL
  // ===================================================

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ===================================================
  // STATUS LOADING
  // ===================================================

  const [statusLoadingId, setStatusLoadingId] = useState<number | null>(
    null,
  );

  // ===================================================
  // GET CATEGORIES
  // ===================================================

  const fetchCategories = async () => {
    try {
      setLoading(true);

      const response = await categoryApi.getAll();

      setCategories(response.data?.data || []);
    } catch (error: any) {
      console.error("Get categories error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Unable to fetch categories.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // INITIAL FETCH
  // ===================================================

  useEffect(() => {
    if (!permissionsLoading && canViewCategories) {
      fetchCategories();
    }
  }, [permissionsLoading, canViewCategories]);

  // ===================================================
  // STATUS COUNTS
  // ===================================================

  const activeCount = useMemo(() => {
    return categories.filter(
      (item: any) =>
        String(item.status).toLowerCase() === "active",
    ).length;
  }, [categories]);

  const inactiveCount = useMemo(() => {
    return categories.filter(
      (item: any) =>
        String(item.status).toLowerCase() === "inactive",
    ).length;
  }, [categories]);

  // ===================================================
  // SEARCH
  // ===================================================

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return categories;

    return categories.filter((item: any) =>
      [
        item.title,
        item.description,
        item.status,
        item.parentCategory || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [categories, search]);

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.ceil(
    filteredCategories.length / ITEMS_PER_PAGE,
  );

  const safeTotalPages = Math.max(totalPages, 1);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedCategories = filteredCategories.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const startEntry =
    filteredCategories.length === 0 ? 0 : startIndex + 1;

  const endEntry = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredCategories.length,
  );

  // ===================================================
  // KEEP PAGE VALID
  // ===================================================

  useEffect(() => {
    if (currentPage > safeTotalPages) {
      setCurrentPage(safeTotalPages);
    }
  }, [currentPage, safeTotalPages]);

  // ===================================================
  // SEARCH HANDLER
  // ===================================================

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  // ===================================================
  // FORM DATA BUILDER
  // ===================================================

  const buildFormData = (
    payload: Partial<CategoryPayload>,
  ) => {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === "image" && value instanceof File) {
          formData.append("image", value);
        } else if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
        ) {
          formData.append(key, String(value));
        }
      }
    });

    return formData;
  };

  // ===================================================
  // ADD CATEGORY
  // ===================================================

  const handleAddCategory = async (
    payload: CategoryPayload,
  ) => {
    try {
      setAddLoading(true);

      const formData = buildFormData(payload);

      const response = await categoryApi.add(formData);

      await fetchCategories();

      setAddModalOpen(false);

      toast.success(
        response?.data?.message ||
          "Category added successfully.",
      );
    } catch (error: any) {
      console.error("Add category error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Unable to add category.",
      );
    } finally {
      setAddLoading(false);
    }
  };

  // ===================================================
  // EDIT OPEN
  // ===================================================

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setEditModalOpen(true);
  };

  // ===================================================
  // UPDATE CATEGORY
  // ===================================================

  const handleUpdateCategory = async (
    payload: CategoryPayload,
  ) => {
    if (!selectedCategory) return;

    try {
      setEditLoading(true);

      const formData = buildFormData(payload);

      const response = await categoryApi.update(
        selectedCategory.id,
        formData,
      );

      await fetchCategories();

      setEditModalOpen(false);
      setSelectedCategory(null);

      toast.success(
        response?.data?.message ||
          "Category updated successfully.",
      );
    } catch (error: any) {
      console.error("Update category error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Unable to update category.",
      );
    } finally {
      setEditLoading(false);
    }
  };

  // ===================================================
  // STATUS CHANGE
  // ===================================================

  const handleStatusToggle = async (
    category: Category,
    nextStatus: "active" | "inactive",
  ) => {
    if (
      String(category.status).toLowerCase() ===
      nextStatus
    ) {
      return;
    }

    try {
      setStatusLoadingId(category.id);

      const formData = new FormData();

      formData.append("status", nextStatus);

      const response = await categoryApi.update(
        category.id,
        formData,
      );

      await fetchCategories();

      toast.success(
        response?.data?.message ||
          (nextStatus === "active"
            ? "Category activated successfully."
            : "Category deactivated successfully."),
      );
    } catch (error: any) {
      console.error(
        "Category status update error:",
        error,
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to update category status.",
      );
    } finally {
      setStatusLoadingId(null);
    }
  };

  // ===================================================
  // DELETE OPEN
  // ===================================================

  const handleDelete = (category: Category) => {
    setSelectedCategory(category);
    setDeleteModalOpen(true);
  };

  // ===================================================
  // DELETE CATEGORY
  // ===================================================

  const handleConfirmDelete = async () => {
    if (!selectedCategory) return;

    try {
      setDeleteLoading(true);

      const response = await categoryApi.delete(
        selectedCategory.id,
      );

      await fetchCategories();

      setDeleteModalOpen(false);
      setSelectedCategory(null);

      toast.success(
        response?.data?.message ||
          "Category deleted successfully.",
      );
    } catch (error: any) {
      console.error("Delete category error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Unable to delete category.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // ===================================================
  // PAGE CHANGE
  // ===================================================

  const handlePageChange = (page: number) => {
    if (page < 1) return;

    if (totalPages > 0 && page > totalPages) return;

    setCurrentPage(page);
  };

  // ===================================================
  // LOADING STATE
  // ===================================================

  if (permissionsLoading) {
    return <PermissionLoadingState />;
  }

  // ===================================================
  // ACCESS DENIED
  // ===================================================

  if (!canViewCategories) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F8FD] p-4 font-poppins">
        <div className="max-w-md rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF5FF] text-[#C23B32]">
            <FiAlertCircle size={26} />
          </div>

          <h2 className="text-lg font-bold text-[#111827]">
            Access Denied
          </h2>

          <p className="mt-2 text-sm text-[#6B7280]">
            You don't have permission to access this section.
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
          HEADER
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
              Catalog Management
            </span>
          </div>

          <h1 className="text-[20px] font-medium tracking-tight text-[#111827] sm:text-[22px]">
            Categories
          </h1>

          <p className="mt-0.5 text-sm text-[#111827]">
            Manage your product categories, hierarchy, and
            classification from one place.
          </p>
        </div>

        {/* STATUS SUMMARY */}

        <div className="flex flex-wrap items-center gap-2.5">
          {/* TOTAL */}
          <div className="rounded-xl border border-[#DCE6F2] bg-white px-4 py-2.5 shadow-sm">
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
              Total Categories
            </div>

            <div className="mt-0.5 text-lg font-bold text-[#111827]">
              {categories.length}
            </div>
          </div>

          {/* ACTIVE */}
          <div className="rounded-xl border border-[#2D6FE8]/15 bg-white px-4 py-2.5 shadow-sm">
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#2D6FE8]">
              Active
            </div>

            <div className="mt-0.5 text-lg font-bold text-[#111827]">
              {activeCount}
            </div>
          </div>

          {/* INACTIVE */}
          <div className="rounded-xl border border-[#D6E2F0] bg-white px-4 py-2.5 shadow-sm">
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
              Inactive
            </div>

            <div className="mt-0.5 text-lg font-bold text-[#111827]">
              {inactiveCount}
            </div>
          </div>
        </div>
      </motion.div>

      {/* =================================================
          SEARCH + ACTIONS
      ================================================= */}

      <motion.div
        variants={itemVariants}
        className="relative mb-5 overflow-hidden rounded-[18px] border border-[#DCE6F2] bg-white p-4 shadow-[0_10px_35px_-24px_rgba(42,65,104,0.35)] sm:p-5"
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
                handleSearch(e.target.value)
              }
              placeholder="Search categories..."
              className="h-11 w-full rounded-xl border border-[#D6E2F0] bg-[#F4F8FD] pl-10 pr-4 text-xs text-[#111827] outline-none transition-all placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/15"
            />
          </div>

          {/* ACTIONS */}

          <div className="flex items-center gap-2">
            {/* REFRESH */}

            <motion.button
              type="button"
              onClick={fetchCategories}
              disabled={loading}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#2D6FE8]/15 bg-[#F4F8FD] px-4 text-xs font-bold text-[#111827] shadow-sm transition hover:border-[#2D6FE8]/30 hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiRefreshCw
                size={14}
                className={
                  loading ? "animate-spin" : ""
                }
              />

              Refresh
            </motion.button>

            {/* ADD CATEGORY */}

            {canCreateCategory && (
              <motion.button
                type="button"
                onClick={() =>
                  setAddModalOpen(true)
                }
                whileHover={{
                  y: -2,
                  boxShadow:
                    "0 10px 22px rgba(45,111,232,0.18)",
                }}
                whileTap={{ scale: 0.97 }}
                className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-5 text-xs font-bold text-white transition"
              >
                <FiPlus size={15} />

                <span>Add Category</span>
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* =================================================
          CATEGORY TABLE
      ================================================= */}

      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-[18px] border border-[#DCE6F2] bg-white "
      >
  
 
          <CategoryTable
            categories={paginatedCategories}
            loading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            totalEntries={filteredCategories.length}
            startEntry={startEntry}
            endEntry={endEntry}
            onPageChange={handlePageChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusToggle={handleStatusToggle}
            statusLoadingId={statusLoadingId}
            canEdit={canUpdateCategory}
            canDelete={canDeleteCategory}
            canToggleStatus={canUpdateCategory}
          />
      
      </motion.div>

      {/* =================================================
          ADD CATEGORY MODAL
      ================================================= */}

      {canCreateCategory && (
        <GlobalModal
          isOpen={addModalOpen}
          onClose={() =>
            !addLoading &&
            setAddModalOpen(false)
          }
          closeOnOverlayClick={!addLoading}
        >
          <AddCategoryModal
            open={addModalOpen}
            loading={addLoading}
            onClose={() => {
              if (!addLoading) {
                setAddModalOpen(false);
              }
            }}
            onSubmit={handleAddCategory}
          />
        </GlobalModal>
      )}

      {/* =================================================
          EDIT CATEGORY MODAL
      ================================================= */}

      {canUpdateCategory && (
        <GlobalModal
          isOpen={editModalOpen}
          onClose={() => {
            if (!editLoading) {
              setEditModalOpen(false);
              setSelectedCategory(null);
            }
          }}
          closeOnOverlayClick={!editLoading}
        >
          <EditCategoryModal
            open={editModalOpen}
            loading={editLoading}
            category={selectedCategory}
            onClose={() => {
              if (!editLoading) {
                setEditModalOpen(false);
                setSelectedCategory(null);
              }
            }}
            onSubmit={handleUpdateCategory}
          />
        </GlobalModal>
      )}

      {/* =================================================
          DELETE CATEGORY MODAL
      ================================================= */}

      {canDeleteCategory && (
        <GlobalModal
          isOpen={deleteModalOpen}
          onClose={() => {
            if (!deleteLoading) {
              setDeleteModalOpen(false);
              setSelectedCategory(null);
            }
          }}
          closeOnOverlayClick={!deleteLoading}
        >
          <DeleteCategoryModal
            open={deleteModalOpen}
            loading={deleteLoading}
            categoryName={
              selectedCategory?.title || ""
            }
            onClose={() => {
              if (!deleteLoading) {
                setDeleteModalOpen(false);
                setSelectedCategory(null);
              }
            }}
            onConfirm={handleConfirmDelete}
          />
        </GlobalModal>
      )}

      <div className="h-5" />
    </motion.div>
  );
};

export default Addcategories;
