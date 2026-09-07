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
    FiTrash2,
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
  
  interface CategoryWithParent extends Category {
    parentCategory?: string | number | null;
    parent_category_id?: string | number | null;
    parent_id?: string | number | null;
    parent?: {
      id?: string | number | null;
      title?: string;
    } | null;
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
  
  const getParentId = (
    category: CategoryWithParent
  ): string | number | null => {
    return (
      category.parentCategory ??
      category.parent_category_id ??
      category.parent_id ??
      category.parent?.id ??
      null
    );
  };
  
  const getImageUrl = (
    value?: string | null
  ) => {
    return value || "";
  };
  
  const getParentTitle = (
    category: CategoryWithParent,
    categories: Category[]
  ) => {
    const parentId = getParentId(category);
  
    if (
      parentId === null ||
      parentId === undefined ||
      parentId === ""
    ) {
      return "—";
    }
  
    const parent = categories.find(
      (item) =>
        String(item.id) ===
        String(parentId)
    );
  
    return parent?.title || "Parent Category";
  };
  
  // =====================================================
  // ADD / EDIT MODAL
  // =====================================================
  
  interface CategoryFormModalProps {
    open: boolean;
    loading: boolean;
    mode: "add" | "edit";
    category: Category | null;
    categories: Category[];
    onClose: () => void;
    onSubmit: (
      payload: CategoryPayload
    ) => void;
  }
  
  const CategoryFormModal: React.FC<
    CategoryFormModalProps
  > = ({
    open,
    loading,
    mode,
    category,
    categories,
    onClose,
    onSubmit,
  }) => {
    const [title, setTitle] =
      useState("");
  
    const [description, setDescription] =
      useState("");
  
    const [status, setStatus] =
      useState<
        "active" | "inactive"
      >("active");
  
    const [parentCategory, setParentCategory] =
      useState("");
  
    const [image, setImage] =
      useState<File | null>(null);
  
    const [preview, setPreview] =
      useState("");
  
    const [imageKey, setImageKey] =
      useState(0);
  
    useEffect(() => {
      if (!open) return;
  
      if (
        mode === "edit" &&
        category
      ) {
        const item =
          category as CategoryWithParent;
  
        setTitle(
          category.title || ""
        );
  
        setDescription(
          category.description || ""
        );
  
        setStatus(
          category.status ===
            "inactive"
            ? "inactive"
            : "active"
        );
  
        const parentId =
          getParentId(item);
  
        setParentCategory(
          parentId !== null &&
            parentId !== undefined
            ? String(parentId)
            : ""
        );
  
        const existingImage =
          (category as Category & {
            image?: string;
          }).image || "";
  
        setPreview(
          getImageUrl(existingImage)
        );
      } else {
        setTitle("");
        setDescription("");
        setStatus("active");
        setParentCategory("");
        setPreview("");
      }
  
      setImage(null);
      setImageKey((prev) => prev + 1);
    }, [
      open,
      mode,
      category,
    ]);
  
    const handleImageChange = (
      e: ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        e.target.files?.[0];
  
      if (!file) return;
  
      if (
        !file.type.startsWith(
          "image/"
        )
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
  
    const removeImage = () => {
      setImage(null);
  
      if (
        mode === "edit" &&
        category
      ) {
        const existingImage =
          (category as Category & {
            image?: string;
          }).image || "";
  
        setPreview(
          getImageUrl(existingImage)
        );
      } else {
        setPreview("");
      }
  
      setImageKey(
        (prev) => prev + 1
      );
    };
  
    const handleSubmit = () => {
      if (!title.trim()) {
        toast.error(
          "Please enter sub category name."
        );
        return;
      }
  
      if (!parentCategory) {
        toast.error(
          "Please select a parent category."
        );
        return;
      }
  
      onSubmit({
        title: title.trim(),
        description:
          description.trim(),
        status,
        parentCategory:
          Number(parentCategory),
        ...(image
          ? { image }
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
            onClick={
              onClose
            }
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
                value={title}
                disabled={loading}
                onChange={(e) =>
                  setTitle(
                    e.target.value
                  )
                }
                placeholder="e.g. Gold Rings"
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/10 disabled:bg-gray-100"
              />
            </div>
  
            {/* PARENT */}
  
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
                  value={
                    parentCategory
                  }
                  disabled={loading}
                  onChange={(e) =>
                    setParentCategory(
                      e.target.value
                    )
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-sm text-gray-900 outline-none transition focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/10 disabled:bg-gray-100"
                >
                  <option value="">
                    Select Parent Category
                  </option>
  
                  {categories
                    .filter(
                      (item) =>
                        !getParentId(
                          item as CategoryWithParent
                        ) ||
                        String(
                          getParentId(
                            item as CategoryWithParent
                          )
                        ) !==
                          String(
                            category?.id
                          )
                    )
                    .map(
                      (item) => (
                        <option
                          key={
                            item.id
                          }
                          value={
                            item.id
                          }
                        >
                          {item.title}
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
  
            {/* DESCRIPTION */}
  
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Description
              </label>
  
              <textarea
                rows={3}
                value={
                  description
                }
                disabled={loading}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                placeholder="Enter sub category description..."
                className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/10 disabled:bg-gray-100"
              />
            </div>
  
            {/* STATUS */}
  
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Status
              </label>
  
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    "active",
                    "inactive",
                  ] as const
                ).map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      disabled={
                        loading
                      }
                      onClick={() =>
                        setStatus(
                          item
                        )
                      }
                      className={`h-11 rounded-xl border text-sm font-semibold capitalize transition ${
                        status ===
                        item
                          ? "border-[#b8902e] bg-[#f8f3e5] text-[#806319]"
                          : "border-gray-200 bg-white text-gray-500 hover:border-[#b8902e]/30"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
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
                          title ||
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
            onClick={
              onClose
            }
            disabled={loading}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
  
          <button
            type="button"
            onClick={
              handleSubmit
            }
            disabled={
              loading
            }
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
  // DELETE MODAL
  // =====================================================
  
  interface DeleteModalProps {
    open: boolean;
    loading: boolean;
    category: Category | null;
    parentTitle: string;
    onClose: () => void;
    onConfirm: () => void;
  }
  
  const DeleteModal: React.FC<
    DeleteModalProps
  > = ({
    open,
    loading,
    category,
    parentTitle,
    onClose,
    onConfirm,
  }) => {
    if (!open) return null;
  
    return (
      <GlobalModal
        isOpen={open}
        onClose={onClose}
        closeOnOverlayClick={
          !loading
        }
      >
        <div className="w-full max-w-[420px] overflow-hidden rounded-[20px] border border-red-100 bg-white shadow-2xl">
  
          <div className="h-[3px] bg-gradient-to-r from-[#e8a59b] via-[#c96d61] to-[#a64d43]" />
  
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fff4f2] text-red-500">
                <FiTrash2
                  size={19}
                />
              </div>
  
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-gray-900">
                  Delete Sub Category?
                </h2>
  
                <p className="mt-1.5 text-xs leading-5 text-gray-500">
                  This action will permanently
                  remove the selected sub category.
                </p>
              </div>
  
              <button
                type="button"
                onClick={
                  onClose
                }
                disabled={
                  loading
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <FiX size={17} />
              </button>
            </div>
  
            <div className="mt-5 rounded-xl border border-gray-200 bg-[#faf8f3] p-3.5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                Sub Category
              </p>
  
              <p className="mt-1 text-sm font-semibold text-gray-800">
                {category?.title ||
                  "Selected sub category"}
              </p>
  
              <p className="mt-1 text-xs text-gray-500">
                Parent:{" "}
                <span className="font-semibold text-[#8f6d1d]">
                  {parentTitle}
                </span>
              </p>
            </div>
  
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={
                  onClose
                }
                disabled={
                  loading
                }
                className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
  
              <button
                type="button"
                onClick={
                  onConfirm
                }
                disabled={
                  loading
                }
                className="flex min-w-[125px] items-center justify-center gap-2 rounded-xl bg-[#b46055] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#994a40] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <FiRefreshCw
                      size={14}
                      className="animate-spin"
                    />
                    Deleting...
                  </>
                ) : (
                  <>
                    <FiTrash2
                      size={14}
                    />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </GlobalModal>
    );
  };
  
  // =====================================================
  // MAIN PAGE
  // =====================================================
  
  const SubCategories: React.FC =
    () => {
      const [categories, setCategories] =
        useState<Category[]>([]);
  
      const [loading, setLoading] =
        useState(false);
  
      const [saveLoading, setSaveLoading] =
        useState(false);
  
      const [deleteLoading, setDeleteLoading] =
        useState(false);
  
      const [search, setSearch] =
        useState("");
  
      const [parentFilter, setParentFilter] =
        useState("");
  
      const [addOpen, setAddOpen] =
        useState(false);
  
      const [editOpen, setEditOpen] =
        useState(false);
  
      const [deleteOpen, setDeleteOpen] =
        useState(false);
  
      const [selectedCategory, setSelectedCategory] =
        useState<Category | null>(
          null
        );
  
      // ===================================================
      // FETCH
      // ===================================================
  
      const fetchCategories =
        async () => {
          try {
            setLoading(true);
  
            const response =
              await categoryApi.getAll();
  
            setCategories(
              response.data?.data ||
                []
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
            setLoading(false);
          }
        };
  
      useEffect(() => {
        fetchCategories();
      }, []);
  
      // ===================================================
      // MAIN CATEGORIES
      // ===================================================
  
      const parentCategories =
        useMemo(() => {
          return categories.filter(
            (category) =>
              !getParentId(
                category as CategoryWithParent
              )
          );
        }, [categories]);
  
      // ===================================================
      // SUB CATEGORIES
      // ===================================================
  
      const subCategories =
        useMemo(() => {
          return categories.filter(
            (category) =>
              Boolean(
                getParentId(
                  category as CategoryWithParent
                )
              )
          );
        }, [categories]);
  
      // ===================================================
      // FILTER
      // ===================================================
  
      const filteredSubCategories =
        useMemo(() => {
          const query =
            search
              .trim()
              .toLowerCase();
  
          return subCategories.filter(
            (category) => {
              const parentTitle =
                getParentTitle(
                  category as CategoryWithParent,
                  categories
                );
  
              const matchesSearch =
                !query ||
                [
                  category.title,
                  category.description ||
                    "",
                  parentTitle,
                  category.status,
                  String(
                    category.id
                  ),
                ]
                  .join(" ")
                  .toLowerCase()
                  .includes(
                    query
                  );
  
              const categoryParentId =
                getParentId(
                  category as CategoryWithParent
                );
  
              const matchesParent =
                !parentFilter ||
                String(
                  categoryParentId
                ) ===
                  String(
                    parentFilter
                  );
  
              return (
                matchesSearch &&
                matchesParent
              );
            }
          );
        }, [
          subCategories,
          categories,
          search,
          parentFilter,
        ]);
  
      // ===================================================
      // ADD
      // ===================================================
  
      const handleAdd =
        async (
          payload: CategoryPayload
        ) => {
          try {
            setSaveLoading(true);
  
            const formData =
              new FormData();
  
            formData.append(
              "title",
              payload.title
            );
  
            formData.append(
              "description",
              payload.description
            );
  
            formData.append(
              "status",
              payload.status
            );
  
            if (
              payload.parentCategory
            ) {
              formData.append(
                "parentCategory",
                String(
                  payload.parentCategory
                )
              );
            }
  
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
              await categoryApi.add(
                formData
              );
  
            await fetchCategories();
  
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
      // EDIT
      // ===================================================
  
      const openEdit = (
        category: Category
      ) => {
        setSelectedCategory(
          category
        );
  
        setEditOpen(true);
      };
  
      const handleUpdate =
        async (
          payload: CategoryPayload
        ) => {
          if (
            !selectedCategory
          ) {
            return;
          }
  
          try {
            setSaveLoading(true);
  
            const formData =
              new FormData();
  
            formData.append(
              "title",
              payload.title
            );
  
            formData.append(
              "description",
              payload.description
            );
  
            formData.append(
              "status",
              payload.status
            );
  
            if (
              payload.parentCategory
            ) {
              formData.append(
                "parentCategory",
                String(
                  payload.parentCategory
                )
              );
            }
  
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
              await categoryApi.update(
                selectedCategory.id,
                formData
              );
  
            await fetchCategories();
  
            setEditOpen(false);
  
            setSelectedCategory(
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
      // DELETE
      // ===================================================
  
      const openDelete = (
        category: Category
      ) => {
        setSelectedCategory(
          category
        );
  
        setDeleteOpen(true);
      };
  
      const handleDelete =
        async () => {
          if (
            !selectedCategory
          ) {
            return;
          }
  
          try {
            setDeleteLoading(
              true
            );
  
            const response =
              await categoryApi.delete(
                selectedCategory.id
              );
  
            await fetchCategories();
  
            setDeleteOpen(false);
  
            setSelectedCategory(
              null
            );
  
            toast.success(
              response.data?.message ||
                "Sub category deleted successfully."
            );
          } catch (error: any) {
            console.error(
              "Delete sub category error:",
              error
            );
  
            toast.error(
              error?.response?.data
                ?.message ||
                "Unable to delete sub category."
            );
          } finally {
            setDeleteLoading(
              false
            );
          }
        };
  
      // ===================================================
      // LOADING
      // ===================================================
  
      if (
        loading &&
        categories.length ===
          0
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
                <button
                  type="button"
                  onClick={
                    fetchCategories
                  }
                  disabled={
                    loading
                  }
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#b8902e]/20 bg-white px-4 text-sm font-semibold text-[#8f6d1d] shadow-sm transition hover:bg-[#faf8f3] disabled:opacity-50"
                >
                  <FiRefreshCw
                    size={16}
                    className={
                      loading
                        ? "animate-spin"
                        : ""
                    }
                  />
  
                  <span className="hidden sm:inline">
                    Refresh
                  </span>
                </button>
  
                <button
                  type="button"
                  onClick={() =>
                    setAddOpen(
                      true
                    )
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
                    value={
                      search
                    }
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
  
                    {parentCategories.map(
                      (
                        parent
                      ) => (
                        <option
                          key={
                            parent.id
                          }
                          value={
                            parent.id
                          }
                        >
                          {parent.title}
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
  
              {/* CARD HEADER */}
  
              <div className="flex flex-col justify-between gap-3 border-b border-[#b8902e]/10 px-5 pb-4 pt-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                    <FiLayers
                      size={18}
                    />
                  </div>
  
                  <div>
                    <h2 className="text-base font-bold text-[#2a2620]">
                      Sub Category Directory
                    </h2>
  
                    <p className="mt-0.5 text-xs text-[#a89a7d]">
                      {
                        filteredSubCategories.length
                      }{" "}
                      sub categor
                      {filteredSubCategories.length ===
                      1
                        ? "y"
                        : "ies"}{" "}
                      found
                    </p>
                  </div>
                </div>
  
                <span className="rounded-lg bg-[#faf8f3] px-3 py-2 text-xs font-semibold text-[#8f6d1d]">
                  {parentFilter
                    ? "Filtered by Parent"
                    : "All Sub Categories"}
                </span>
              </div>
  
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
                          colSpan={5}
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
                          colSpan={5}
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
                          category,
                          index
                        ) => {
                          const parentTitle =
                            getParentTitle(
                              category as CategoryWithParent,
                              categories
                            );
  
                          const image =
                            (
                              category as Category & {
                                image?: string;
                              }
                            )
                              .image;
  
                          return (
                            <motion.tr
                              key={
                                category.id
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
                                        src={getImageUrl(
                                          image
                                        )}
                                        alt={
                                          category.title
                                        }
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <FiLayers
                                        size={17}
                                        className="text-[#b8902e]"
                                      />
                                    )}
                                  </div>
  
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-[#2a2620]">
                                      {
                                        category.title
                                      }
                                    </p>
  
                                    <p className="mt-1 text-[10px] text-[#a89a7d]">
                                      Category #
                                      {
                                        category.id
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
                                      size={13}
                                    />
                                  </span>
  
                                  <span className="rounded-full border border-[#b8902e]/15 bg-[#fffaf0] px-3 py-1.5 text-[10px] font-bold text-[#8f6d1d]">
                                    {
                                      parentTitle
                                    }
                                  </span>
                                </div>
                              </td>
  
                              {/* STATUS */}
  
                              <td className="px-5 py-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${
                                    category.status ===
                                    "active"
                                      ? "border-[#b8902e]/25 bg-[#f8f3e5] text-[#806319]"
                                      : "border-gray-200 bg-gray-100 text-gray-500"
                                  }`}
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
  
                                  {category.status ===
                                  "active"
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
                                        category
                                      )
                                    }
                                    title="Edit"
                                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] text-[#8f6d1d] transition hover:bg-[#b8902e] hover:text-white"
                                  >
                                    <FiEdit2
                                      size={14}
                                    />
                                  </button>
  
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openDelete(
                                        category
                                      )
                                    }
                                    title="Delete"
                                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#c98d83]/20 bg-[#fff8f6] text-[#b46055] transition hover:bg-[#b46055] hover:text-white"
                                  >
                                    <FiTrash2
                                      size={14}
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
  
          {/* ADD MODAL */}
  
          <GlobalModal
            isOpen={
              addOpen
            }
            onClose={() => {
              if (
                !saveLoading
              ) {
                setAddOpen(
                  false
                );
              }
            }}
            closeOnOverlayClick={
              !saveLoading
            }
          >
            <CategoryFormModal
              open={
                addOpen
              }
              loading={
                saveLoading
              }
              mode="add"
              category={null}
              categories={
                parentCategories
              }
              onClose={() =>
                setAddOpen(
                  false
                )
              }
              onSubmit={
                handleAdd
              }
            />
          </GlobalModal>
  
          {/* EDIT MODAL */}
  
          <GlobalModal
            isOpen={
              editOpen
            }
            onClose={() => {
              if (
                !saveLoading
              ) {
                setEditOpen(
                  false
                );
                setSelectedCategory(
                  null
                );
              }
            }}
            closeOnOverlayClick={
              !saveLoading
            }
          >
            <CategoryFormModal
              open={
                editOpen
              }
              loading={
                saveLoading
              }
              mode="edit"
              category={
                selectedCategory
              }
              categories={
                parentCategories
              }
              onClose={() => {
                setEditOpen(
                  false
                );
                setSelectedCategory(
                  null
                );
              }}
              onSubmit={
                handleUpdate
              }
            />
          </GlobalModal>
  
          {/* DELETE */}
  
          <DeleteModal
            open={
              deleteOpen
            }
            loading={
              deleteLoading
            }
            category={
              selectedCategory
            }
            parentTitle={
              selectedCategory
                ? getParentTitle(
                    selectedCategory as CategoryWithParent,
                    categories
                  )
                : "—"
            }
            onClose={() => {
              if (
                !deleteLoading
              ) {
                setDeleteOpen(
                  false
                );
                setSelectedCategory(
                  null
                );
              }
            }}
            onConfirm={
              handleDelete
            }
          />
        </>
      );
    };
  
  export default SubCategories;