import React, {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiChevronDown,
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

import {
  categoryApi,
  Category,
} from "../../api/endpoints/category";

import {
  subcategoryApi,
  Subcategory,
} from "../../api/endpoints/subcategory";

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
  categories: Category[]
) => {
  if (
    categoryId === null ||
    categoryId === undefined ||
    categoryId === ""
  ) {
    return "—";
  }

  const category = categories.find(
    (item) =>
      String(item.id) === String(categoryId)
  );

  return category?.title || "Unknown Category";
};

const getSubcategoryImage = (
  subcategory: Subcategory
) => {
  return (
    subcategory.image_url ||
    subcategory.image ||
    ""
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
  onSubmit: (
    payload: SubcategoryPayload
  ) => void;
}

const SubcategoryFormModal: React.FC<
  SubcategoryFormModalProps
> = ({
  open,
  loading,
  mode,
  subcategory,
  categories,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState("");

  const [categoryId, setCategoryId] =
    useState("");

  const [slug, setSlug] = useState("");

  const [status, setStatus] =
    useState<boolean>(true);

  const [image, setImage] =
    useState<File | null>(null);

  const [preview, setPreview] =
    useState("");

  const [imageKey, setImageKey] =
    useState(0);

  // ===================================================
  // INITIALIZE
  // ===================================================

  useEffect(() => {
    if (!open) {
      return;
    }

    if (
      mode === "edit" &&
      subcategory
    ) {
      setName(
        subcategory.name || ""
      );

      setSlug(
        subcategory.slug || ""
      );

      setCategoryId(
        subcategory.category_id
          ? String(
              subcategory.category_id
            )
          : ""
      );

      setStatus(
        Boolean(subcategory.status)
      );

      setPreview(
        getSubcategoryImage(
          subcategory
        )
      );
    } else {
      setName("");
      setSlug("");
      setCategoryId("");
      setStatus(true);
      setPreview("");
    }

    setImage(null);

    setImageKey(
      (prev) => prev + 1
    );
  }, [
    open,
    mode,
    subcategory,
  ]);

  // ===================================================
  // NAME CHANGE - Auto generate slug only in add mode
  // ===================================================

  const handleNameChange = (
    value: string
  ) => {
    setName(value);

    // Only auto-generate slug in add mode
    if (mode === "add") {
      setSlug(
        createSlug(value)
      );
    }
  };

  // ===================================================
  // IMAGE
  // ===================================================

  const handleImageChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith("image/")
    ) {
      toast.error(
        "Please select a valid image."
      );
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      toast.error(
        "Image size should be less than 5MB."
      );
      return;
    }

    setImage(file);

    const url =
      URL.createObjectURL(file);

    setPreview(url);
  };

  // ===================================================
  // REMOVE IMAGE
  // ===================================================

  const removeImage = () => {
    setImage(null);

    if (
      mode === "edit" &&
      subcategory
    ) {
      setPreview(
        getSubcategoryImage(
          subcategory
        )
      );
    } else {
      setPreview("");
    }

    setImageKey(
      (prev) => prev + 1
    );
  };

  // ===================================================
  // SUBMIT
  // ===================================================

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error(
        "Please enter sub category name."
      );
      return;
    }

    if (!categoryId) {
      toast.error(
        "Please select a parent category."
      );
      return;
    }

    const finalSlug =
      slug.trim() ||
      createSlug(name);

    if (!finalSlug) {
      toast.error(
        "Please enter a valid sub category name."
      );
      return;
    }

    onSubmit({
      category_id:
        Number(categoryId),

      name: name.trim(),

      slug: finalSlug,

      status,

      ...(image
        ? {
            image,
          }
        : {}),
    });
  };

  if (!open) {
    return null;
  }

  return (
    <div className="w-full max-w-[590px] overflow-hidden rounded-[20px] border border-[#b8902e]/15 bg-white shadow-2xl">
      {/* TOP */}

      <div className="h-[3px] w-full bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]" />

      {/* HEADER */}

      <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#b8902e]">
            <FiLayers size={18} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {mode === "add"
                ? "Add Sub Category"
                : "Update Sub Category"}
            </h2>

            <p className="mt-0.5 text-xs text-gray-500">
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
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
        >
          <FiX size={18} />
        </button>
      </div>

      {/* BODY */}

      <div className="max-h-[72vh] overflow-y-auto bg-[#faf8f3] px-5 py-5">
        <div className="space-y-4">
          {/* NAME */}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              Sub Category Name
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <input
              type="text"
              value={name}
              disabled={loading}
              onChange={(e) =>
                handleNameChange(
                  e.target.value
                )
              }
              placeholder="Enter sub category"
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/10 disabled:bg-gray-100"
            />
          </div>

          {/* CATEGORY */}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              Parent Category
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <div className="relative">
              <FiLayers
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b8902e]"
              />

              <select
                value={categoryId}
                disabled={loading}
                onChange={(e) =>
                  setCategoryId(
                    e.target.value
                  )
                }
                className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-sm text-gray-900 outline-none transition focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/10 disabled:bg-gray-100"
              >
                <option value="">
                  Select Parent Category
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={
                        category.id
                      }
                      value={
                        category.id
                      }
                    >
                      {category.title}
                    </option>
                  )
                )}
              </select>

              <FiChevronDown
                size={16}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8f6d1d]"
              />
            </div>
          </div>

          {/* SLUG - READ ONLY / DISABLED */}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              Slug
              <span className="ml-1 text-red-500">
                *
              </span>
              {mode === "add" && (
                <span className="ml-2 text-[10px] font-normal text-gray-400">
                  (Auto-generated from name)
                </span>
              )}
              {mode === "edit" && (
                <span className="ml-2 text-[10px] font-normal text-gray-400">
                  (Read-only)
                </span>
              )}
            </label>

            <input
              type="text"
              value={slug}
              disabled={true} // Always disabled - read only
              onChange={(e) =>
                setSlug(
                  createSlug(
                    e.target.value
                  )
                )
              }
              placeholder=""
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-100 px-4 text-sm text-gray-600 outline-none cursor-not-allowed"
            />
          </div>

          {/* STATUS */}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              Status
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  setStatus(true)
                }
                className={`h-11 rounded-xl border text-sm font-semibold capitalize transition ${
                  status
                    ? "border-[#b8902e] bg-[#f8f3e5] text-[#806319]"
                    : "border-gray-200 bg-white text-gray-500 hover:border-[#b8902e]/30"
                }`}
              >
                Active
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  setStatus(false)
                }
                className={`h-11 rounded-xl border text-sm font-semibold capitalize transition ${
                  !status
                    ? "border-[#b8902e] bg-[#f8f3e5] text-[#806319]"
                    : "border-gray-200 bg-white text-gray-500 hover:border-[#b8902e]/30"
                }`}
              >
                Inactive
              </button>
            </div>
          </div>

          {/* IMAGE */}

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-700">
                Sub Category Image
              </label>

              <span className="text-[10px] text-gray-400">
                Max 5MB
              </span>
            </div>

            <input
              key={imageKey}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={
                handleImageChange
              }
              disabled={loading}
              className="hidden"
              id="subcategory-image"
            />

            {!preview ? (
              <label
                htmlFor="subcategory-image"
                className="flex cursor-pointer items-center justify-center gap-4 rounded-xl border border-dashed border-gray-300 bg-white px-5 py-7 transition hover:border-[#b8902e] hover:bg-[#b8902e]/5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#b8902e]">
                  <FiImage size={19} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    Upload Image
                  </p>

                  <p className="mt-0.5 text-[10px] text-gray-400">
                    PNG, JPG, JPEG or WEBP
                  </p>
                </div>
              </label>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white p-3">
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-[#faf8f3]">
                    <img
                      src={preview}
                      alt={
                        name ||
                        "Sub category"
                      }
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-800">
                      {image?.name ||
                        "Current image"}
                    </p>

                    <p className="mt-0.5 text-[10px] text-gray-400">
                      {image
                        ? "New image selected"
                        : "Current uploaded image"}
                    </p>

                    <label
                      htmlFor="subcategory-image"
                      className="mt-2 inline-block cursor-pointer text-xs font-semibold text-[#8f6d1d]"
                    >
                      Change Image
                    </label>
                  </div>

                  {image && (
                    <button
                      type="button"
                      onClick={
                        removeImage
                      }
                      disabled={
                        loading
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"
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

      {/* FOOTER */}

      <div className="flex justify-end gap-2 border-t border-gray-100 bg-white px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="flex min-w-[145px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading && (
            <FiRefreshCw
              size={14}
              className="animate-spin"
            />
          )}

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

const SubCategories: React.FC =
  () => {
    const [
      subcategories,
      setSubcategories,
    ] = useState<Subcategory[]>(
      []
    );

    const [
      categories,
      setCategories,
    ] = useState<Category[]>(
      []
    );

    const [loading, setLoading] =
      useState(false);

    const [
      categoryLoading,
      setCategoryLoading,
    ] = useState(false);

    const [
      saveLoading,
      setSaveLoading,
    ] = useState(false);

    const [search, setSearch] =
      useState("");

    const [
      parentFilter,
      setParentFilter,
    ] = useState("");

    const [addOpen, setAddOpen] =
      useState(false);

    const [editOpen, setEditOpen] =
      useState(false);

    const [
      selectedSubcategory,
      setSelectedSubcategory,
    ] =
      useState<Subcategory | null>(
        null
      );

    // ===================================================
    // FETCH SUBCATEGORIES
    // ===================================================

    const fetchSubcategories =
      async () => {
        try {
          setLoading(true);

          const response =
            await subcategoryApi.getAll();

          const responseData =
            response.data?.data;

          setSubcategories(
            responseData?.data || []
          );
        } catch (error: any) {
          console.error(
            "Fetch subcategories error:",
            error
          );

          toast.error(
            error?.response?.data
              ?.message ||
              "Unable to fetch sub categories."
          );
        } finally {
          setLoading(false);
        }
      };

    // ===================================================
    // FETCH CATEGORIES
    // ===================================================

    const fetchCategories =
      async () => {
        try {
          setCategoryLoading(
            true
          );

          const response =
            await categoryApi.getAll();

          setCategories(
            response.data?.data || []
          );
        } catch (error: any) {
          console.error(
            "Fetch categories error:",
            error
          );

          toast.error(
            error?.response?.data
              ?.message ||
              "Unable to fetch categories."
          );
        } finally {
          setCategoryLoading(
            false
          );
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

    const filteredSubCategories =
      useMemo(() => {
        const query = search
          .trim()
          .toLowerCase();

        return subcategories.filter(
          (subcategory) => {
            const categoryTitle =
              getCategoryTitle(
                subcategory.category_id,
                categories
              );

            const matchesSearch =
              !query ||
              [
                subcategory.name,
                subcategory.slug,
                categoryTitle,
                String(
                  subcategory.id
                ),
              ]
                .join(" ")
                .toLowerCase()
                .includes(query);

            const matchesParent =
              !parentFilter ||
              String(
                subcategory.category_id
              ) ===
                String(parentFilter);

            return (
              matchesSearch &&
              matchesParent
            );
          }
        );
      }, [
        subcategories,
        categories,
        search,
        parentFilter,
      ]);

    // ===================================================
    // ADD
    // ===================================================

    const handleAdd = async (
      payload: SubcategoryPayload
    ) => {
      try {
        setSaveLoading(true);

        const formData =
          new FormData();

        formData.append(
          "category_id",
          String(
            payload.category_id
          )
        );

        formData.append(
          "name",
          payload.name
        );

        formData.append(
          "slug",
          payload.slug
        );

        formData.append(
          "status",
          payload.status
            ? "1"
            : "0"
        );

        if (
          payload.image instanceof
          File
        ) {
          formData.append(
            "image",
            payload.image
          );
        }

        const response =
          await subcategoryApi.add(
            formData
          );

        await fetchSubcategories();

        setAddOpen(false);

        toast.success(
          response.data?.message ||
            "Sub category created successfully."
        );
      } catch (error: any) {
        console.error(
          "Create sub category error:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            "Unable to create sub category."
        );
      } finally {
        setSaveLoading(false);
      }
    };

    // ===================================================
    // EDIT OPEN
    // ===================================================

    const openEdit = (
      subcategory: Subcategory
    ) => {
      setSelectedSubcategory(
        subcategory
      );

      setEditOpen(true);
    };

    // ===================================================
    // UPDATE
    // ===================================================

    const handleUpdate =
      async (
        payload: SubcategoryPayload
      ) => {
        if (
          !selectedSubcategory
        ) {
          return;
        }

        try {
          setSaveLoading(true);

          const formData =
            new FormData();

          formData.append(
            "category_id",
            String(
              payload.category_id
            )
          );

          formData.append(
            "name",
            payload.name
          );

          formData.append(
            "slug",
            payload.slug
          );

          formData.append(
            "status",
            payload.status
              ? "1"
              : "0"
          );

          if (
            payload.image instanceof
            File
          ) {
            formData.append(
              "image",
              payload.image
            );
          }

          const response =
            await subcategoryApi.update(
              selectedSubcategory.id,
              formData
            );

          await fetchSubcategories();

          setEditOpen(false);

          setSelectedSubcategory(
            null
          );

          toast.success(
            response.data?.message ||
              "Sub category updated successfully."
          );
        } catch (error: any) {
          console.error(
            "Update sub category error:",
            error
          );

          toast.error(
            error?.response?.data
              ?.message ||
              "Unable to update sub category."
          );
        } finally {
          setSaveLoading(false);
        }
      };

    // ===================================================
    // LOADING
    // ===================================================

    if (
      loading &&
      subcategories.length === 0
    ) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#faf8f3]">
          <div className="text-center">
            <FiRefreshCw
              size={28}
              className="mx-auto animate-spin text-[#b8902e]"
            />

            <p className="mt-4 text-sm font-semibold text-[#2a2620]">
              Loading sub categories...
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
          variants={
            containerVariants
          }
          initial="hidden"
          animate="visible"
          className="min-h-screen bg-[#faf8f3] p-4"
        >
          {/* HEADER */}

          <motion.div
            variants={
              itemVariants
            }
            className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center"
          >
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#b8902e]" />

                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b8902e]">
                  Catalog Management
                </span>
              </div>

              <h1 className="font-serif text-[28px] font-bold tracking-tight text-[#2a2620] sm:text-[30px]">
                Sub Categories
              </h1>

              <p className="mt-1 text-sm text-[#786f60]">
                Manage product sub categories and
                their parent categories.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* REFRESH */}

              <button
                type="button"
                onClick={() => {
                  fetchSubcategories();
                  fetchCategories();
                }}
                disabled={
                  loading ||
                  categoryLoading
                }
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#b8902e]/20 bg-white px-4 text-sm font-semibold text-[#8f6d1d] shadow-sm transition hover:bg-[#faf8f3] disabled:opacity-50"
              >
                <FiRefreshCw
                  size={16}
                  className={
                    loading ||
                    categoryLoading
                      ? "animate-spin"
                      : ""
                  }
                />

                <span className="hidden sm:inline">
                  Refresh
                </span>
              </button>

              {/* ADD */}

              <button
                type="button"
                onClick={() =>
                  setAddOpen(true)
                }
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-5 text-sm font-bold text-white shadow-md shadow-[#b8902e]/15 transition hover:from-[#a8841c] hover:to-[#795b14]"
              >
                <FiPlus
                  size={17}
                />

                Add Sub Category
              </button>
            </div>
          </motion.div>

          {/* FILTER CARD */}

          <motion.div
            variants={
              itemVariants
            }
            className="relative mb-6 overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]" />

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* SEARCH */}

              <div className="relative w-full lg:max-w-[530px]">
                <FiSearch
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a8841c]"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search sub category or parent category..."
                  className="h-11 w-full rounded-xl border border-gray-200 bg-[#faf8f3] pl-11 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/10"
                />
              </div>

              {/* PARENT FILTER */}

              <div className="relative w-full lg:w-[260px]">
                <FiLayers
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b8902e]"
                />

                <select
                  value={
                    parentFilter
                  }
                  onChange={(e) =>
                    setParentFilter(
                      e.target.value
                    )
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-[#faf8f3] pl-10 pr-10 text-sm font-medium text-gray-800 outline-none focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/10"
                >
                  <option value="">
                    All Parent Categories
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={
                          category.id
                        }
                        value={
                          category.id
                        }
                      >
                        {category.title}
                      </option>
                    )
                  )}
                </select>

                <FiChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8f6d1d]"
                />
              </div>
            </div>
          </motion.div>

          {/* MAIN CARD */}

          <motion.div
            variants={
              itemVariants
            }
            className="relative overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-sm"
          >
            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

           

            {/* TABLE */}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse">
                <thead>
                  <tr className="bg-[#2f2a22]">
                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                      S.No.
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                      Sub Category
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                      Parent Category
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                      Slug
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                      Status
                    </th>

                    <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-16 text-center"
                      >
                        <FiRefreshCw
                          size={23}
                          className="mx-auto animate-spin text-[#b8902e]"
                        />

                        <p className="mt-3 text-sm font-semibold text-[#2a2620]">
                          Loading sub categories...
                        </p>
                      </td>
                    </tr>
                  ) : filteredSubCategories.length ===
                    0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-16 text-center"
                      >
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#b8902e]">
                          <FiLayers
                            size={24}
                          />
                        </div>

                        <p className="mt-4 text-sm font-bold text-[#2a2620]">
                          No sub categories found
                        </p>

                        <p className="mt-1 text-xs text-[#a89a7d]">
                          Create a sub category or change
                          the selected filter.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredSubCategories.map(
                      (
                        subcategory,
                        index
                      ) => {
                        const parentTitle =
                          getCategoryTitle(
                            subcategory.category_id,
                            categories
                          );

                        const image =
                          getSubcategoryImage(
                            subcategory
                          );

                        return (
                          <motion.tr
                            key={
                              subcategory.id
                            }
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
                            className="border-b border-[#b8902e]/10 transition hover:bg-[#fcfaf5]"
                          >
                            {/* S.NO */}

                            <td className="px-5 py-4">
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-xs font-bold text-[#8f6d1d]">
                                {index +
                                  1}
                              </span>
                            </td>

                            {/* SUB CATEGORY */}

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#b8902e]/10 bg-[#faf8f3]">
                                  {image ? (
                                    <img
                                      src={
                                        image
                                      }
                                      alt={
                                        subcategory.name
                                      }
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <FiLayers
                                      size={
                                        17
                                      }
                                      className="text-[#b8902e]"
                                    />
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-[#2a2620]">
                                    {
                                      subcategory.name
                                    }
                                  </p>

                                 
                                </div>
                              </div>
                            </td>

                            {/* PARENT */}

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-[#b8902e]">
                                  <FiLayers
                                    size={
                                      13
                                    }
                                  />
                                </span>

                                <span className="rounded-full border border-[#b8902e]/15 bg-[#fffaf0] px-3 py-1.5 text-[10px] font-bold text-[#8f6d1d]">
                                  {
                                    parentTitle
                                  }
                                </span>
                              </div>
                            </td>

                            {/* SLUG */}

                            <td className="px-5 py-4">
                              <span className="rounded-lg bg-[#faf8f3] px-3 py-1.5 text-xs font-medium text-gray-600">
                                {
                                  subcategory.slug
                                }
                              </span>
                            </td>

                            {/* STATUS */}

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${
                                  subcategory.status
                                    ? "border-[#b8902e]/25 bg-[#f8f3e5] text-[#806319]"
                                    : "border-gray-200 bg-gray-100 text-gray-500"
                                }`}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />

                                {subcategory.status
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </td>

                            {/* ACTIONS */}

                            <td className="px-5 py-4">
                              <div className="flex justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEdit(
                                      subcategory
                                    )
                                  }
                                  title="Edit"
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] text-[#8f6d1d] transition hover:bg-[#b8902e] hover:text-white"
                                >
                                  <FiEdit2
                                    size={
                                      14
                                    }
                                  />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      }
                    )
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
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
          closeOnOverlayClick={
            !saveLoading
          }
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

              setSelectedSubcategory(
                null
              );
            }
          }}
          closeOnOverlayClick={
            !saveLoading
          }
        >
          <SubcategoryFormModal
            open={editOpen}
            loading={saveLoading}
            mode="edit"
            subcategory={
              selectedSubcategory
            }
            categories={categories}
            onClose={() => {
              if (!saveLoading) {
                setEditOpen(false);

                setSelectedSubcategory(
                  null
                );
              }
            }}
            onSubmit={
              handleUpdate
            }
          />
        </GlobalModal>
      </>
    );
  };

export default SubCategories;