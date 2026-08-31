import React, { useEffect, useMemo, useState } from "react";
import {
  FiPlus,
  FiSearch,
  FiLayers,
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

interface CategoryPayload {
  title: string;
  description: string;
  status: "active" | "inactive";
  image?: File | string | null;
  parentCategory?: string | number | null;
}

// =====================================================
// Animation Variants
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
// Categories
// =====================================================

const Addcategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(
    []
  );

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

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

  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);

  // ===================================================
  // DELETE MODAL
  // ===================================================

  const [deleteModalOpen, setDeleteModalOpen] =
    useState(false);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  // ===================================================
  // GET CATEGORIES
  // ===================================================

  const fetchCategories = async () => {
    try {
      setLoading(true);

      const response = await categoryApi.getAll();

      setCategories(
        response.data?.data || []
      );
    } catch (error: any) {
      console.error(
        "Get categories error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to fetch categories."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // INITIAL FETCH
  // ===================================================

  useEffect(() => {
    fetchCategories();
  }, []);

  // ===================================================
  // SEARCH
  // ===================================================

  const filteredCategories = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return categories;
    }

    return categories.filter((item) =>
      [
        item.title,
        item.description,
        item.status,
        item.parentCategory || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [categories, search]);

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
  // ADD CATEGORY
  // ===================================================

  const handleAddCategory = async (
    payload: CategoryPayload
  ) => {
    try {
      setAddLoading(true);

      const formData = new FormData();

      Object.entries(payload).forEach(
        ([key, value]) => {
          if (
            value !== undefined &&
            value !== null
          ) {
            if (
              key === "image" &&
              value instanceof File
            ) {
              formData.append(
                "image",
                value
              );
            } else if (
              typeof value === "string" ||
              typeof value === "number" ||
              typeof value === "boolean"
            ) {
              formData.append(
                key,
                String(value)
              );
            }
          }
        }
      );

      const response =
        await categoryApi.add(
          formData
        );

      await fetchCategories();

      setAddModalOpen(false);

      toast.success(
        response?.data?.message ||
          "Category added successfully."
      );
    } catch (error: any) {
      console.error(
        "Add category error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to add category."
      );
    } finally {
      setAddLoading(false);
    }
  };

  // ===================================================
  // EDIT OPEN
  // ===================================================

  const handleEdit = (
    category: Category
  ) => {
    setSelectedCategory(category);
    setEditModalOpen(true);
  };

  // ===================================================
  // UPDATE CATEGORY
  // ===================================================

  const handleUpdateCategory =
    async (
      payload: CategoryPayload
    ) => {
      if (!selectedCategory) return;

      try {
        setEditLoading(true);

        const formData = new FormData();

        Object.entries(payload).forEach(
          ([key, value]) => {
            if (
              value !== undefined &&
              value !== null
            ) {
              if (
                key === "image" &&
                value instanceof File
              ) {
                formData.append(
                  "image",
                  value
                );
              } else if (
                typeof value ===
                  "string" ||
                typeof value ===
                  "number" ||
                typeof value ===
                  "boolean"
              ) {
                formData.append(
                  key,
                  String(value)
                );
              }
            }
          }
        );

        const response =
          await categoryApi.update(
            selectedCategory.id,
            formData
          );

        await fetchCategories();

        setEditModalOpen(false);
        setSelectedCategory(null);

        toast.success(
          response?.data?.message ||
            "Category updated successfully."
        );
      } catch (error: any) {
        console.error(
          "Update category error:",
          error
        );

        toast.error(
          error?.response?.data?.message ||
            "Unable to update category."
        );
      } finally {
        setEditLoading(false);
      }
    };

  // ===================================================
  // DELETE OPEN
  // ===================================================

  const handleDelete = (
    category: Category
  ) => {
    setSelectedCategory(category);
    setDeleteModalOpen(true);
  };

  // ===================================================
  // DELETE CATEGORY
  // ===================================================

  const handleConfirmDelete =
    async () => {
      if (!selectedCategory) return;

      try {
        setDeleteLoading(true);

        const response =
          await categoryApi.delete(
            selectedCategory.id
          );

        await fetchCategories();

        setDeleteModalOpen(false);
        setSelectedCategory(null);

        toast.success(
          response?.data?.message ||
            "Category deleted successfully."
        );
      } catch (error: any) {
        console.error(
          "Delete category error:",
          error
        );

        toast.error(
          error?.response?.data?.message ||
            "Unable to delete category."
        );
      } finally {
        setDeleteLoading(false);
      }
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
          HEADER
      ================================================= */}

      <motion.div
        variants={itemVariants}
        className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center"
      >
        <div>
          <div className="mb-1 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#b8902e]" />

            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b8902e]">
              Catalog Management
            </span>
          </div>

          <h1 className="font-serif text-[28px] font-bold tracking-tight text-[#2a2620] sm:text-[30px]">
            Categories
          </h1>

          <p className="mt-1 text-sm text-[#786f60]">
            Manage your product categories,
            hierarchy, and classification.
          </p>
        </div>

        {/* Total Categories */}

        <div className="hidden rounded-xl border border-[#b8902e]/15 bg-white px-4 py-2.5 shadow-sm sm:block">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#a89a7d]">
            Total Categories
          </div>

          <div className="mt-0.5 text-lg font-bold text-[#2a2620]">
            {categories.length}
          </div>
        </div>
      </motion.div>

      {/* =================================================
          SEARCH + ADD
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
              placeholder="Search categories..."
              className="h-[48px] w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] pl-11 pr-4 text-sm text-[#2a2620] outline-none transition-all placeholder:text-[#a89a7d] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
            />
          </div>

          {/* Add Category */}

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
              Add Category
            </span>
          </motion.button>
        </div>
      </motion.div>

      {/* =================================================
          CATEGORY TABLE
      ================================================= */}

      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-sm"
      >
        {/* Accent */}

        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

        <div>
          <CategoryTable
            categories={
              paginatedCategories
            }
            loading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            totalEntries={
              filteredCategories.length
            }
            startEntry={startEntry}
            endEntry={endEntry}
            onPageChange={
              handlePageChange
            }
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </motion.div>

      {/* =================================================
          ADD CATEGORY MODAL
      ================================================= */}

      <GlobalModal
        isOpen={addModalOpen}
        onClose={() =>
          setAddModalOpen(false)
        }
        closeOnOverlayClick={true}
      >
        <AddCategoryModal
          open={addModalOpen}
          loading={addLoading}
          onClose={() =>
            setAddModalOpen(false)
          }
          onSubmit={
            handleAddCategory
          }
        />
      </GlobalModal>

      {/* =================================================
          EDIT CATEGORY MODAL
      ================================================= */}

      <GlobalModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedCategory(null);
        }}
        closeOnOverlayClick={true}
      >
        <EditCategoryModal
          open={editModalOpen}
          loading={editLoading}
          category={selectedCategory}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedCategory(null);
          }}
          onSubmit={
            handleUpdateCategory
          }
        />
      </GlobalModal>

      {/* =================================================
          DELETE CATEGORY MODAL
      ================================================= */}

      <GlobalModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedCategory(null);
        }}
        closeOnOverlayClick={true}
      >
        <DeleteCategoryModal
          open={deleteModalOpen}
          loading={deleteLoading}
          categoryName={
            selectedCategory?.title || ""
          }
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedCategory(null);
          }}
          onConfirm={
            handleConfirmDelete
          }
        />
      </GlobalModal>
    </motion.div>
  );
};

export default Addcategories;