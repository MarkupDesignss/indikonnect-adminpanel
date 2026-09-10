import React, { ChangeEvent, useEffect, useMemo, useState } from "react";

import {
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiImage,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiX,
  FiLayers,
} from "react-icons/fi";

import { motion } from "framer-motion";

import toast from "react-hot-toast";

import GlobalModal from "@/components/common/GlobalModal";

import { categoryApi, Category } from "../../api/endpoints/category";

import { subcategoryApi, Subcategory } from "../../api/endpoints/subcategory";

// =====================================================
// THEME
// =====================================================

const GREEN = "#163F20";
const DARK_GREEN = "#0F3219";
const LIGHT_GREEN = "#EAF3EA";
const PAGE_BG = "#F5F7F5";
const TEXT_PRIMARY = "#202721";
const TEXT_SECONDARY = "#59645C";
const MUTED = "#9AA29C";
const BORDER = "#D8E2D8";
const RED = "#C23B32";

// =====================================================
// TYPES
// =====================================================

interface SubcategoryPayload {
  category_id: number;
  name: string;
  slug: string;
  status: boolean;
  image?: File | null;
}

// =====================================================
// ANIMATIONS
// =====================================================

const containerVariants = {
  hidden: {
    opacity: 0,
  },

  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 12,
  },

  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 15,
    },
  },
};

// =====================================================
// HELPERS
// =====================================================

const createSlug = (value: string) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const getCategoryTitle = (
  categoryId: number | string | null | undefined,
  categories: Category[],
) => {
  if (categoryId === null || categoryId === undefined || categoryId === "") {
    return "—";
  }

  const category = categories.find(
    (item) => String(item.id) === String(categoryId),
  );

  return category?.title || "Unknown Category";
};

const getSubcategoryImage = (subcategory: Subcategory) => {
  return subcategory.image_url || subcategory.image || "";
};

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
// STATUS BADGE
// =====================================================

const StatusBadge: React.FC<{
  active: boolean;
}> = ({ active }) => {
  return (
    <span
      className={`inline - flex items - center gap - 1.5 rounded - full border px - 3 py - 1.5 text - [9px] font - bold uppercase tracking - wide ${
        active
          ? "border-[#163F20]/20 bg-[#EAF3EA] text-[#163F20]"
          : "border-[#C23B32]/20 bg-[#FBEAEA] text-[#C23B32]"
      } `}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />

      {active ? "Active" : "Inactive"}
    </span>
  );
};

// =====================================================
// ADD / EDIT MODAL
// =====================================================

interface SubcategoryFormModalProps {
  open: boolean;
  loading: boolean;
  mode: "add" | "edit";
  subcategory: Subcategory | null;
  categories: Category[];
  onClose: () => void;
  onSubmit: (payload: SubcategoryPayload) => void;
}

const SubcategoryFormModal: React.FC<SubcategoryFormModalProps> = ({
  open,
  loading,
  mode,
  subcategory,
  categories,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<boolean>(true);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [imageKey, setImageKey] = useState(0);

  // ===================================================
  // INITIALIZE
  // ===================================================

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === "edit" && subcategory) {
      setName(subcategory.name || "");

      setSlug(subcategory.slug || "");

      setCategoryId(
        subcategory.category_id ? String(subcategory.category_id) : "",
      );

      setStatus(Boolean(subcategory.status));

      setPreview(getSubcategoryImage(subcategory));
    } else {
      setName("");
      setSlug("");
      setCategoryId("");
      setStatus(true);
      setPreview("");
    }

    setImage(null);

    setImageKey((prev) => prev + 1);
  }, [open, mode, subcategory]);

  // ===================================================
  // NAME CHANGE
  // ===================================================

  const handleNameChange = (value: string) => {
    setName(value);

    if (mode === "add") {
      setSlug(createSlug(value));
    }
  };

  // ===================================================
  // IMAGE
  // ===================================================

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB.");
      return;
    }

    setImage(file);

    const url = URL.createObjectURL(file);

    setPreview(url);
  };

  // ===================================================
  // REMOVE IMAGE
  // ===================================================

  const removeImage = () => {
    setImage(null);

    if (mode === "edit" && subcategory) {
      setPreview(getSubcategoryImage(subcategory));
    } else {
      setPreview("");
    }

    setImageKey((prev) => prev + 1);
  };

  // ===================================================
  // SUBMIT
  // ===================================================

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Please enter sub category name.");
      return;
    }

    if (!categoryId) {
      toast.error("Please select a parent category.");
      return;
    }

    const finalSlug = slug.trim() || createSlug(name);

    if (!finalSlug) {
      toast.error("Please enter a valid sub category name.");
      return;
    }

    onSubmit({
      category_id: Number(categoryId),
      name: name.trim(),
      slug: finalSlug,
      status,
      ...(image ? { image } : {}),
    });
  };

  if (!open) {
    return null;
  }

  return (
    <div className="w-full max-w-[590px] overflow-hidden rounded-[22px] border border-[#E5EAE5] bg-white shadow-2xl">
      {/* =================================================
          TOP ACCENT
      ================================================= */}

      <div className="h-[3px] w-full bg-gradient-to-r from-[#8FC199] via-[#163F20] to-[#0F3219]" />

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex items-start justify-between gap-4 border-b border-[#163F20]/10 bg-white px-5 py-5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
            <FiLayers size={18} />
          </div>

          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#4C8A57]">
              Catalog Management
            </p>

            <h2 className="mt-0.5 truncate text-[20px] font-bold text-[#202721]">
              {mode === "add" ? "Add Sub Category" : "Update Sub Category"}
            </h2>

            <p className="mt-1 text-[10px] text-[#9AA29C]">
              {mode === "add"
                ? "Create a sub category under a parent category."
                : "Update sub category details."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5F7F5] text-[#163F20] transition hover:bg-[#EAF3EA] disabled:opacity-50"
        >
          <FiX size={18} />
        </button>
      </div>

      {/* =================================================
          BODY
      ================================================= */}

      <div className="max-h-[72vh] overflow-y-auto bg-[#FAFBFA] px-5 py-5 sm:px-6">
        <div className="space-y-4">
          {/* NAME */}

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#59645C]">
              Sub Category Name
              <span className="ml-1 text-[#C23B32]">*</span>
            </label>

            <input
              type="text"
              value={name}
              disabled={loading}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter sub category"
              className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-white px-4 text-sm text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/10 disabled:cursor-not-allowed disabled:bg-[#F5F7F5]"
            />
          </div>

          {/* CATEGORY */}

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#59645C]">
              Parent Category
              <span className="ml-1 text-[#C23B32]">*</span>
            </label>

            <div className="relative">
              <FiLayers
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#163F20]"
              />

              <select
                value={categoryId}
                disabled={loading || categories.length === 0}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-[#D8E2D8] bg-white pl-10 pr-10 text-sm text-[#202721] outline-none transition focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/10 disabled:cursor-not-allowed disabled:bg-[#F5F7F5]"
              >
                <option value="">
                  {categories.length === 0
                    ? "No categories available"
                    : "Select Parent Category"}
                </option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>

              <FiChevronDown
                size={16}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#163F20]"
              />
            </div>
          </div>

          {/* SLUG */}

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#59645C]">
              Slug
              <span className="ml-1 text-[#C23B32]">*</span>
              {mode === "add" && (
                <span className="ml-2 text-[9px] font-normal normal-case tracking-normal text-[#9AA29C]">
                  Auto-generated from name
                </span>
              )}
              {mode === "edit" && (
                <span className="ml-2 text-[9px] font-normal normal-case tracking-normal text-[#9AA29C]">
                  Read-only
                </span>
              )}
            </label>

            <input
              type="text"
              value={slug}
              disabled
              className="h-11 w-full cursor-not-allowed rounded-xl border border-[#D8E2D8] bg-[#F0F2F0] px-4 font-mono text-xs text-[#59645C] outline-none"
            />
          </div>

          {/* STATUS */}

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#59645C]">
              Status
            </label>

            <div className="grid grid-cols-2 gap-2">
              {/* ACTIVE */}

              <button
                type="button"
                disabled={loading}
                onClick={() => setStatus(true)}
                className={`h - 11 rounded - xl border text - sm font - bold transition ${
                  status
                    ? "border-[#163F20]/30 bg-[#EAF3EA] text-[#163F20]"
                    : "border-[#D8E2D8] bg-white text-[#59645C] hover:border-[#163F20]/20 hover:bg-[#F5F7F5]"
                } `}
              >
                <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-current" />
                Active
              </button>

              {/* INACTIVE */}

              <button
                type="button"
                disabled={loading}
                onClick={() => setStatus(false)}
                className={`h - 11 rounded - xl border text - sm font - bold transition ${
                  !status
                    ? "border-[#C23B32]/25 bg-[#FBEAEA] text-[#C23B32]"
                    : "border-[#D8E2D8] bg-white text-[#59645C] hover:border-[#163F20]/20 hover:bg-[#F5F7F5]"
                } `}
              >
                <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-current" />
                Inactive
              </button>
            </div>
          </div>

          {/* IMAGE */}

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#59645C]">
                Sub Category Image
              </label>

              <span className="text-[9px] text-[#9AA29C]">Max 5MB</span>
            </div>

            <input
              key={imageKey}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleImageChange}
              disabled={loading}
              className="hidden"
              id="subcategory-image"
            />

            {!preview ? (
              <label
                htmlFor="subcategory-image"
                className="flex cursor-pointer items-center justify-center gap-4 rounded-xl border border-dashed border-[#163F20]/25 bg-white px-5 py-7 transition hover:border-[#163F20]/45 hover:bg-[#EAF3EA]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                  <FiImage size={19} />
                </div>

                <div>
                  <p className="text-sm font-bold text-[#202721]">
                    Upload Image
                  </p>

                  <p className="mt-0.5 text-[9px] text-[#9AA29C]">
                    PNG, JPG, JPEG or WEBP
                  </p>
                </div>
              </label>
            ) : (
              <div className="rounded-xl border border-[#163F20]/10 bg-white p-3">
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#163F20]/10 bg-[#F5F7F5]">
                    <img
                      src={preview}
                      alt={name || "Sub category"}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#202721]">
                      {image?.name || "Current image"}
                    </p>

                    <p className="mt-0.5 text-[9px] text-[#9AA29C]">
                      {image ? "New image selected" : "Current uploaded image"}
                    </p>

                    <label
                      htmlFor="subcategory-image"
                      className="mt-2 inline-block cursor-pointer text-xs font-bold text-[#163F20] hover:text-[#0F3219]"
                    >
                      Change Image
                    </label>
                  </div>

                  {image && (
                    <button
                      type="button"
                      onClick={removeImage}
                      disabled={loading}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FBEAEA] text-[#C23B32] transition hover:bg-[#C23B32] hover:text-white disabled:opacity-50"
                    >
                      <FiX size={16} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =================================================
          FOOTER
      ================================================= */}

      <div className="flex flex-col-reverse gap-2 border-t border-[#163F20]/10 bg-[#FAFBFA] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="rounded-xl border border-[#163F20]/15 bg-white px-5 py-2.5 text-sm font-bold text-[#59645C] transition hover:bg-[#F5F7F5] hover:text-[#163F20] disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="flex min-w-[155px] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(22,63,32,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(22,63,32,0.7)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <FiRefreshCw size={14} className="animate-spin" />}

          {loading
            ? mode === "add"
              ? "Creating..."
              : "Updating..."
            : mode === "add"
              ? "Create Sub Category"
              : "Update Sub Category"}
        </button>
      </div>
    </div>
  );
};

// =====================================================
// MAIN PAGE
// =====================================================

const SubCategories: React.FC = () => {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(false);

  const [categoryLoading, setCategoryLoading] = useState(false);

  const [saveLoading, setSaveLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [parentFilter, setParentFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  // ===================================================
  // MODALS
  // ===================================================

  const [addOpen, setAddOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);

  const [selectedSubcategory, setSelectedSubcategory] =
    useState<Subcategory | null>(null);

  // ===================================================
  // FETCH SUBCATEGORIES
  // ===================================================

  const fetchSubcategories = async () => {
    try {
      setLoading(true);

      const response = await subcategoryApi.getAll();

      const responseData = response.data?.data;

      setSubcategories(responseData?.data || []);
    } catch (error: any) {
      console.error("Fetch subcategories error:", error);

      toast.error(
        error?.response?.data?.message || "Unable to fetch sub categories.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // FETCH CATEGORIES
  // ===================================================

  const fetchCategories = async () => {
    try {
      setCategoryLoading(true);

      const response = await categoryApi.getAll();

      setCategories(response.data?.data || []);
    } catch (error: any) {
      console.error("Fetch categories error:", error);

      toast.error(
        error?.response?.data?.message || "Unable to fetch categories.",
      );
    } finally {
      setCategoryLoading(false);
    }
  };

  // ===================================================
  // INITIAL FETCH
  // ===================================================

  useEffect(() => {
    fetchSubcategories();
    fetchCategories();
  }, []);

  // ===================================================
  // FILTER
  // ===================================================

  const filteredSubCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return subcategories.filter((subcategory) => {
      const categoryTitle = getCategoryTitle(
        subcategory.category_id,
        categories,
      );

      const matchesSearch =
        !query ||
        [
          subcategory.name,
          subcategory.slug,
          categoryTitle,
          String(subcategory.id),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesParent =
        !parentFilter ||
        String(subcategory.category_id) === String(parentFilter);

      return matchesSearch && matchesParent;
    });
  }, [subcategories, categories, search, parentFilter]);

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.ceil(filteredSubCategories.length / ITEMS_PER_PAGE);

  const safeTotalPages = Math.max(totalPages, 1);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const visibleSubcategories = filteredSubCategories.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const startEntry = filteredSubCategories.length === 0 ? 0 : startIndex + 1;

  const endEntry = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredSubCategories.length,
  );

  // ===================================================
  // KEEP CURRENT PAGE VALID
  // ===================================================

  useEffect(() => {
    if (currentPage > safeTotalPages) {
      setCurrentPage(safeTotalPages);
    }
  }, [currentPage, safeTotalPages]);

  // ===================================================
  // PAGINATION PAGES
  // ===================================================

  const paginationPages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from(
        {
          length: totalPages,
        },
        (_, index) => index + 1,
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
  }, [currentPage, totalPages]);

  // ===================================================
  // ADD
  // ===================================================

  const handleAdd = async (payload: SubcategoryPayload) => {
    try {
      setSaveLoading(true);

      const formData = new FormData();

      formData.append("category_id", String(payload.category_id));

      formData.append("name", payload.name);

      formData.append("slug", payload.slug);

      formData.append("status", payload.status ? "1" : "0");

      if (payload.image instanceof File) {
        formData.append("image", payload.image);
      }

      const response = await subcategoryApi.add(formData);

      await fetchSubcategories();

      setCurrentPage(1);

      setAddOpen(false);

      toast.success(
        response.data?.message || "Sub category created successfully.",
      );
    } catch (error: any) {
      console.error("Create sub category error:", error);

      toast.error(
        error?.response?.data?.message || "Unable to create sub category.",
      );
    } finally {
      setSaveLoading(false);
    }
  };

  // ===================================================
  // EDIT OPEN
  // ===================================================

  const openEdit = (subcategory: Subcategory) => {
    setSelectedSubcategory(subcategory);

    setEditOpen(true);
  };

  // ===================================================
  // UPDATE
  // ===================================================

  const handleUpdate = async (payload: SubcategoryPayload) => {
    if (!selectedSubcategory) {
      return;
    }

    try {
      setSaveLoading(true);

      const formData = new FormData();

      formData.append("category_id", String(payload.category_id));

      formData.append("name", payload.name);

      formData.append("slug", payload.slug);

      formData.append("status", payload.status ? "1" : "0");

      if (payload.image instanceof File) {
        formData.append("image", payload.image);
      }

      const response = await subcategoryApi.update(
        selectedSubcategory.id,
        formData,
      );

      await fetchSubcategories();

      setEditOpen(false);

      setSelectedSubcategory(null);

      toast.success(
        response.data?.message || "Sub category updated successfully.",
      );
    } catch (error: any) {
      console.error("Update sub category error:", error);

      toast.error(
        error?.response?.data?.message || "Unable to update sub category.",
      );
    } finally {
      setSaveLoading(false);
    }
  };

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = async () => {
    await Promise.all([fetchSubcategories(), fetchCategories()]);

    setCurrentPage(1);
  };

  // ===================================================
  // LOADING SCREEN
  // ===================================================

  if (loading && subcategories.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F7F5]">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#163F20] shadow-sm">
            <FiRefreshCw size={23} className="animate-spin" />
          </div>

          <p className="mt-4 text-sm font-bold text-[#202721]">
            Loading sub categories...
          </p>

          <p className="mt-1 text-xs text-[#9AA29C]">
            Please wait while we fetch your sub categories.
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="min-h-screen bg-[#F5F7F5] p-4 sm:p-5 lg:p-6"
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
              <span className="h-1.5 w-1.5 rounded-full bg-[#163F20]" />

              <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#4C8A57]">
                Catalog Management
              </span>
            </div>

            <h1 className="text-[28px] font-bold tracking-tight text-[#202721] sm:text-[32px]">
              Sub Categories
            </h1>

            <p className="mt-1.5 max-w-2xl text-xs leading-5 text-[#59645C]">
              Manage product sub categories and their parent categories from one
              place.
            </p>
          </div>

          {/* HEADER ACTIONS */}

          <div className="flex items-center gap-2">
            {/* REFRESH */}

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || categoryLoading}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#163F20]/15 bg-white px-4 text-xs font-bold text-[#163F20] shadow-sm transition hover:bg-[#EAF3EA] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiRefreshCw
                size={14}
                className={loading || categoryLoading ? "animate-spin" : ""}
              />

              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* ADD */}

            <motion.button
              type="button"
              onClick={() => setAddOpen(true)}
              whileHover={{
                y: -2,
              }}
              whileTap={{
                scale: 0.97,
              }}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] px-5 text-xs font-bold text-white shadow-[0_8px_18px_-8px_rgba(22,63,32,0.55)] transition hover:shadow-[0_12px_22px_-8px_rgba(22,63,32,0.7)]"
            >
              <FiPlus size={15} />
              Add Sub Category
            </motion.button>
          </div>
        </motion.div>

        {/* =================================================
            FILTER CARD
        ================================================= */}

        <motion.div
          variants={itemVariants}
          className="relative mb-5 overflow-hidden rounded-[22px] border border-[#E5EAE5] bg-white p-4 shadow-[0_8px_30px_rgba(22,63,32,0.06)] sm:p-5"
        >
          {/* ACCENT */}

          <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#8FC199] via-[#163F20] to-[#0F3219]" />

          {/* DECORATIVE SHAPES */}

          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full border border-[#163F20]/10" />

          <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full border border-[#163F20]/10" />

          <div className="pointer-events-none absolute right-8 top-8 h-3 w-3 rounded-full bg-[#163F20]/10" />

          <div className="relative z-10 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* SEARCH */}

            <div className="relative w-full lg:max-w-[560px]">
              <FiSearch
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#163F20]"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search sub category, slug or parent category..."
                className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] pl-10 pr-4 text-xs text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#163F20] focus:bg-white focus:ring-2 focus:ring-[#163F20]/10"
              />
            </div>

            {/* PARENT FILTER */}

            <div className="relative w-full lg:w-[290px]">
              <FiLayers
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#163F20]"
              />

              <select
                value={parentFilter}
                onChange={(e) => {
                  setParentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={categoryLoading}
                className="h-11 w-full appearance-none rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] pl-10 pr-10 text-xs font-semibold text-[#202721] outline-none transition focus:border-[#163F20] focus:bg-white focus:ring-2 focus:ring-[#163F20]/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">All Parent Categories</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>

              <FiChevronDown
                size={15}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#163F20]"
              />
            </div>
          </div>
        </motion.div>

        {/* =================================================
            MAIN TABLE CARD
        ================================================= */}

        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-[22px] border border-[#E5EAE5] bg-white shadow-[0_8px_30px_rgba(22,63,32,0.06)]"
        >
          {/* ACCENT */}

          <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#8FC199] via-[#163F20] to-[#0F3219]" />

          <div className="overflow-x-auto pt-[3px]">
            <table className="w-full min-w-[950px] border-collapse">
              {/* =================================================
                  HEADER
              ================================================= */}

              <thead>
                <tr className="bg-[#163F20]">
                  <th className="w-[80px] px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                    S.No.
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                    Sub Category
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                    Parent Category
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                    Slug
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                    Status
                  </th>

                  <th className="w-[130px] px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* =================================================
                  BODY
              ================================================= */}

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#163F20]">
                          <FiRefreshCw size={23} className="animate-spin" />
                        </div>

                        <p className="mt-4 text-sm font-bold text-[#202721]">
                          Loading sub categories...
                        </p>

                        <p className="mt-1 text-xs text-[#9AA29C]">
                          Please wait while we fetch your sub categories.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : visibleSubcategories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#163F20]/10 bg-[#EAF3EA] text-[#163F20]">
                          <FiLayers size={24} />
                        </div>

                        <p className="mt-4 text-sm font-bold text-[#202721]">
                          No sub categories found
                        </p>

                        <p className="mt-1 max-w-sm text-xs text-[#9AA29C]">
                          Create a sub category or change the selected filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleSubcategories.map((subcategory, index) => {
                    const parentTitle = getCategoryTitle(
                      subcategory.category_id,
                      categories,
                    );

                    const image = getSubcategoryImage(subcategory);

                    const serialNumber = startIndex + index + 1;

                    return (
                      <motion.tr
                        key={subcategory.id}
                        initial={{
                          opacity: 0,
                          y: 5,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          delay: index * 0.03,
                        }}
                        className="group border-b border-[#163F20]/10 bg-white transition hover:bg-[#FAFBFA]"
                      >
                        {/* S.NO */}

                        <td className="px-5 py-4">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF3EA] text-xs font-bold text-[#163F20]">
                            {serialNumber}
                          </span>
                        </td>

                        {/* SUB CATEGORY */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] transition group-hover:border-[#163F20]/25">
                              {image ? (
                                <img
                                  src={image}
                                  alt={subcategory.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <FiLayers
                                  size={17}
                                  className="text-[#163F20]"
                                />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-[#202721]">
                                {subcategory.name}
                              </p>

                              <p className="mt-1 text-[9px] text-[#9AA29C]">
                                ID: {subcategory.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* PARENT CATEGORY */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF3EA] text-[#163F20]">
                              <FiLayers size={13} />
                            </span>

                            <span className="rounded-lg border border-[#163F20]/10 bg-[#F5F7F5] px-3 py-1.5 text-[10px] font-bold text-[#59645C]">
                              {parentTitle}
                            </span>
                          </div>
                        </td>

                        {/* SLUG */}

                        <td className="px-5 py-4">
                          <span className="rounded-lg bg-[#F5F7F5] px-3 py-1.5 font-mono text-[10px] font-semibold text-[#59645C]">
                            {subcategory.slug}
                          </span>
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">
                          <StatusBadge active={Boolean(subcategory.status)} />
                        </td>

                        {/* ACTIONS */}

                        <td className="px-5 py-4">
                          <div className="flex justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEdit(subcategory)}
                              title="Edit"
                              className="group/edit flex h-9 w-9 items-center justify-center rounded-xl border border-[#163F20]/15 bg-[#F5F7F5] text-[#163F20] transition-all duration-200 hover:border-[#163F20] hover:bg-[#163F20] hover:text-white"
                            >
                              <FiEdit2
                                size={15}
                                className="transition-transform group-hover/edit:scale-110"
                              />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* =================================================
              PAGINATION
          ================================================= */}

          {filteredSubCategories.length > 0 && (
            <div className="border-t border-[#163F20]/10 bg-[#FAFBFA] px-4 py-4 sm:px-5">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                {/* ENTRY INFO */}

                <p className="text-xs text-[#89918B]">
                  Showing{" "}
                  <span className="font-bold text-[#3F4A41]">{startEntry}</span>{" "}
                  to{" "}
                  <span className="font-bold text-[#3F4A41]">{endEntry}</span>{" "}
                  of{" "}
                  <span className="font-bold text-[#3F4A41]">
                    {filteredSubCategories.length}
                  </span>{" "}
                  sub categories
                </p>

                {/* PAGINATION */}

                <div className="flex items-center gap-1.5">
                  {/* PREVIOUS */}

                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((page) => page - 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#163F20]/15 bg-white text-[#163F20] transition hover:border-[#163F20]/30 hover:bg-[#EAF3EA] disabled:cursor-not-allowed disabled:opacity-30"
                    title="Previous page"
                  >
                    <FiChevronLeft size={17} />
                  </button>

                  {/* PAGE NUMBERS */}

                  {paginationPages.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`flex h - 9 min - w - 9 items - center justify - center rounded - lg px - 3 text - xs font - bold transition ${
                        currentPage === page
                          ? "bg-gradient-to-br from-[#4C8A57] to-[#163F20] text-white shadow-[0_6px_14px_-6px_rgba(22,63,32,0.5)]"
                          : "border border-transparent text-[#59645C] hover:border-[#163F20]/15 hover:bg-[#F5F7F5] hover:text-[#163F20]"
                      } `}
                    >
                      {page}
                    </button>
                  ))}

                  {/* NEXT */}

                  <button
                    type="button"
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage((page) => page + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#163F20]/15 bg-white text-[#163F20] transition hover:border-[#163F20]/30 hover:bg-[#EAF3EA] disabled:cursor-not-allowed disabled:opacity-30"
                    title="Next page"
                  >
                    <FiChevronRight size={17} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* BOTTOM SPACE */}

        <div className="h-5" />
      </motion.div>

      {/* =================================================
          ADD MODAL
      ================================================= */}

      <GlobalModal
        isOpen={addOpen}
        onClose={() => {
          if (!saveLoading) {
            setAddOpen(false);
          }
        }}
        closeOnOverlayClick={!saveLoading}
      >
        <SubcategoryFormModal
          open={addOpen}
          loading={saveLoading}
          mode="add"
          subcategory={null}
          categories={categories}
          onClose={() => {
            if (!saveLoading) {
              setAddOpen(false);
            }
          }}
          onSubmit={handleAdd}
        />
      </GlobalModal>

      {/* =================================================
          EDIT MODAL
      ================================================= */}

      <GlobalModal
        isOpen={editOpen}
        onClose={() => {
          if (!saveLoading) {
            setEditOpen(false);
            setSelectedSubcategory(null);
          }
        }}
        closeOnOverlayClick={!saveLoading}
      >
        <SubcategoryFormModal
          open={editOpen}
          loading={saveLoading}
          mode="edit"
          subcategory={selectedSubcategory}
          categories={categories}
          onClose={() => {
            if (!saveLoading) {
              setEditOpen(false);
              setSelectedSubcategory(null);
            }
          }}
          onSubmit={handleUpdate}
        />
      </GlobalModal>
    </>
  );
};

export default SubCategories;
