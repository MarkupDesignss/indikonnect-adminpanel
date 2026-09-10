import React, { useState } from "react";

import {
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiEye,
  FiImage,
  FiTrash2,
  FiX,
  FiLayers,
} from "react-icons/fi";

import { Category } from "@/types/category";

import GlobalModal from "@/components/common/GlobalModal";

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

interface CategoryTableProps {
  categories: Category[];
  loading: boolean;

  currentPage: number;
  totalPages: number;
  totalEntries: number;
  startEntry: number;
  endEntry: number;

  onPageChange: (page: number) => void;

  /**
   * Optional because the parent page may not pass onView.
   */
  onView?: (category: Category) => void;

  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

// =====================================================
// STATUS CLASS
// =====================================================

const getStatusClass = (status: Category["status"]) => {
  if (status === "active") {
    return "border-[#163F20]/20 bg-[#EAF3EA] text-[#163F20]";
  }

  if (status === "draft") {
    return "border-[#D8E2D8] bg-[#F3F6F3] text-[#59645C]";
  }

  if (status === "inactive") {
    return "border-[#C23B32]/20 bg-[#FBEAEA] text-[#C23B32]";
  }

  return "border-[#D8E2D8] bg-[#F3F6F3] text-[#59645C]";
};

// =====================================================
// STATUS DOT
// =====================================================

const getStatusDotClass = (status: Category["status"]) => {
  if (status === "active") {
    return "bg-[#163F20]";
  }

  if (status === "draft") {
    return "bg-[#59645C]";
  }

  if (status === "inactive") {
    return "bg-[#C23B32]";
  }

  return "bg-[#9AA29C]";
};

// =====================================================
// DATE FORMATTER
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
// DESCRIPTION HELPER
// =====================================================

const getShortDescription = (description?: string | null) => {
  if (!description) {
    return "No description available";
  }

  const words = description.trim().split(/\s+/);

  if (words.length <= 7) {
    return description;
  }

  return `${words.slice(0, 7).join(" ")}...`;
};

// =====================================================
// COMPONENT
// =====================================================

const CategoryTable: React.FC<CategoryTableProps> = ({
  categories,
  loading,
  currentPage,
  totalPages,
  totalEntries,
  startEntry,
  endEntry,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);

  const ITEMS_PER_PAGE = 10;

  // ===================================================
  // VIEW
  // ===================================================

  const handleViewClick = (category: Category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);

    onView?.(category);
  };

  // ===================================================
  // CLOSE MODAL
  // ===================================================

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
  };

  // ===================================================
  // PAGINATION
  // ===================================================

  const getPaginationPages = () => {
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
  };

  const paginationPages = getPaginationPages();

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <>
      {/* =================================================
          CATEGORY TABLE
      ================================================= */}

      <div className="overflow-hidden bg-white">
        {/* TOP ACCENT */}

        <div className="h-[3px] w-full bg-gradient-to-r from-[#8FC199] via-[#163F20] to-[#0F3219]" />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px] border-collapse">
            {/* =================================================
                TABLE HEADER
            ================================================= */}

            <thead>
              <tr className="bg-[#163F20]">
                <th className="w-[80px] px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                  S.No.
                </th>

                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                  Image
                </th>

                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                  Category Name
                </th>

                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                  Description
                </th>

                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                  Products
                </th>

                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                  Status
                </th>

                <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                  Actions
                </th>
              </tr>
            </thead>

            {/* =================================================
                TABLE BODY
            ================================================= */}

            <tbody>
              {/* =================================================
                  LOADING
              ================================================= */}

              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-4 flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#163F20]">
                        <FiLayers size={22} />
                      </div>

                      <p className="text-sm font-bold text-[#202721]">
                        Loading categories...
                      </p>

                      <p className="mt-1 text-xs text-[#9AA29C]">
                        Please wait while we fetch your categories.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                /* =================================================
                     EMPTY
                  ================================================= */

                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#163F20]/10 bg-[#EAF3EA] text-[#163F20]">
                        <FiLayers size={24} />
                      </div>

                      <p className="text-sm font-bold text-[#202721]">
                        No categories found
                      </p>

                      <p className="mt-1 max-w-sm text-xs text-[#9AA29C]">
                        There are no categories matching your current search.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                /* =================================================
                     CATEGORY ROWS
                  ================================================= */

                categories.map((item, index) => {
                  const serialNumber =
                    (currentPage - 1) * ITEMS_PER_PAGE + index + 1;

                  const description = getShortDescription(item.description);

                  return (
                    <tr
                      key={item.id}
                      className="group border-b border-[#163F20]/10 bg-white transition-all duration-200 hover:bg-[#FAFBFA]"
                    >
                      {/* =================================================
                            S.NO
                        ================================================= */}

                      <td className="px-5 py-4">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF3EA] text-xs font-bold text-[#163F20]">
                          {serialNumber}
                        </span>
                      </td>

                      {/* =================================================
                            IMAGE
                        ================================================= */}

                      <td className="px-5 py-4">
                        {item.image ? (
                          <div className="h-[58px] w-[58px] overflow-hidden rounded-xl border border-[#163F20]/15 bg-[#F5F7F5] p-0.5 transition-all group-hover:border-[#163F20]/30">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="h-full w-full rounded-[9px] object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-[58px] w-[58px] items-center justify-center rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] text-[#163F20]">
                            <FiImage size={21} />
                          </div>
                        )}
                      </td>

                      {/* =================================================
                            CATEGORY NAME
                        ================================================= */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#163F20]" />

                          <span className="text-sm font-bold text-[#202721]">
                            {item.title}
                          </span>
                        </div>
                      </td>

                      {/* =================================================
                            DESCRIPTION
                        ================================================= */}

                      <td className="px-5 py-4">
                        <p
                          className="max-w-[270px] truncate text-xs leading-5 text-[#59645C]"
                          title={item.description || ""}
                        >
                          {description}
                        </p>
                      </td>

                      {/* =================================================
                            PRODUCTS
                        ================================================= */}

                      <td className="px-5 py-4">
                        <span className="inline-flex min-w-[42px] items-center justify-center rounded-lg border border-[#163F20]/10 bg-[#F5F7F5] px-3 py-1.5 text-xs font-bold text-[#163F20]">
                          {item.products_count ?? 0}
                        </span>
                      </td>

                      {/* =================================================
                            STATUS
                        ================================================= */}

                      <td className="px-5 py-4">
                        <span
                          className={`inline - flex items - center gap - 1.5 rounded - full border px - 3 py - 1.5 text - [9px] font - bold uppercase tracking - wide ${getStatusClass(
                            item.status,
                          )} `}
                        >
                          <span
                            className={`h - 1.5 w - 1.5 rounded - full ${getStatusDotClass(
                              item.status,
                            )} `}
                          />

                          {item.status}
                        </span>
                      </td>

                      {/* =================================================
                            ACTIONS
                        ================================================= */}

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1.5">
                          {/* VIEW */}

                          <button
                            type="button"
                            title="View Details"
                            onClick={() => handleViewClick(item)}
                            className="group/view flex h-9 w-9 items-center justify-center rounded-xl border border-[#163F20]/15 bg-[#F5F7F5] text-[#163F20] transition-all duration-200 hover:border-[#163F20] hover:bg-[#163F20] hover:text-white"
                          >
                            <FiEye
                              size={15}
                              className="transition-transform group-hover/view:scale-110"
                            />
                          </button>

                          {/* EDIT */}

                          <button
                            type="button"
                            title="Edit Category"
                            onClick={() => onEdit(item)}
                            className="group/edit flex h-9 w-9 items-center justify-center rounded-xl border border-[#163F20]/15 bg-white text-[#163F20] transition-all duration-200 hover:border-[#163F20] hover:bg-[#163F20] hover:text-white"
                          >
                            <FiEdit2
                              size={15}
                              className="transition-transform group-hover/edit:scale-110"
                            />
                          </button>

                          {/* DELETE */}

                          <button
                            type="button"
                            title="Delete Category"
                            onClick={() => onDelete(item)}
                            className="group/delete flex h-9 w-9 items-center justify-center rounded-xl border border-[#C23B32]/20 bg-[#FBEAEA] text-[#C23B32] transition-all duration-200 hover:border-[#C23B32] hover:bg-[#C23B32] hover:text-white"
                          >
                            <FiTrash2
                              size={15}
                              className="transition-transform group-hover/delete:scale-110"
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* =================================================
            PAGINATION
        ================================================= */}

        <div className="border-t border-[#163F20]/10 bg-[#FAFBFA] px-4 py-4 sm:px-5">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            {/* ENTRY INFORMATION */}

            <p className="text-xs text-[#89918B]">
              Showing{" "}
              <span className="font-bold text-[#3F4A41]">{startEntry}</span> to{" "}
              <span className="font-bold text-[#3F4A41]">{endEntry}</span> of{" "}
              <span className="font-bold text-[#3F4A41]">{totalEntries}</span>{" "}
              entries
            </p>

            {/* PAGINATION */}

            <div className="flex items-center gap-1.5">
              {/* PREVIOUS */}

              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#163F20]/15 bg-white text-[#163F20] transition-all hover:border-[#163F20]/30 hover:bg-[#EAF3EA] disabled:cursor-not-allowed disabled:opacity-30"
                title="Previous page"
              >
                <FiChevronLeft size={17} />
              </button>

              {/* PAGE NUMBERS */}

              {paginationPages.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => onPageChange(page)}
                  className={`flex h - 9 min - w - 9 items - center justify - center rounded - lg px - 3 text - xs font - bold transition - all ${
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
                onClick={() => onPageChange(currentPage + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#163F20]/15 bg-white text-[#163F20] transition-all hover:border-[#163F20]/30 hover:bg-[#EAF3EA] disabled:cursor-not-allowed disabled:opacity-30"
                title="Next page"
              >
                <FiChevronRight size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          CATEGORY DETAIL MODAL
      ================================================= */}

      <GlobalModal
        isOpen={isModalOpen}
        onClose={closeModal}
        closeOnOverlayClick
      >
        {selectedCategory && (
          <div className="relative w-full max-w-[560px] overflow-hidden rounded-[22px] border border-[#E5EAE5] bg-white shadow-2xl">
            {/* =================================================
                MODAL ACCENT
            ================================================= */}

            <div className="h-[3px] w-full bg-gradient-to-r from-[#8FC199] via-[#163F20] to-[#0F3219]" />

            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="flex items-center justify-between border-b border-[#163F20]/10 px-5 py-5">
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#163F20]" />

                  <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#4C8A57]">
                    Category
                  </span>
                </div>

                <h2 className="text-[20px] font-bold text-[#202721]">
                  Category Details
                </h2>

                <p className="mt-1 text-xs text-[#9AA29C]">
                  View category information
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F7F5] text-[#163F20] transition hover:bg-[#EAF3EA]"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* =================================================
                MODAL CONTENT
            ================================================= */}

            <div className="max-h-[75vh] overflow-y-auto bg-white p-5">
              {/* IMAGE */}

              <div className="mb-5">
                <label className="mb-2 block text-[9px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
                  Category Image
                </label>

                {selectedCategory.image ? (
                  <div className="h-[180px] overflow-hidden rounded-2xl border border-[#163F20]/10 bg-[#F5F7F5] p-1">
                    <img
                      src={selectedCategory.image}
                      alt={selectedCategory.title}
                      className="h-full w-full rounded-xl object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-[180px] items-center justify-center rounded-2xl border border-[#163F20]/10 bg-[#F5F7F5] text-[#163F20]">
                    <FiImage size={38} />
                  </div>
                )}
              </div>

              {/* INFO GRID */}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* NAME */}

                <div className="rounded-xl border border-[#163F20]/10 bg-[#FAFBFA] p-4">
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#9AA29C]">
                    Category Name
                  </p>

                  <p className="text-sm font-bold text-[#202721]">
                    {selectedCategory.title}
                  </p>
                </div>

                {/* PRODUCTS */}

                <div className="rounded-xl border border-[#163F20]/10 bg-[#FAFBFA] p-4">
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#9AA29C]">
                    Products
                  </p>

                  <span className="inline-flex rounded-lg border border-[#163F20]/15 bg-[#EAF3EA] px-3 py-1.5 text-xs font-bold text-[#163F20]">
                    {selectedCategory.products_count ?? 0} Products
                  </span>
                </div>

                {/* STATUS */}

                <div className="rounded-xl border border-[#163F20]/10 bg-[#FAFBFA] p-4">
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#9AA29C]">
                    Status
                  </p>

                  <span
                    className={`inline - flex items - center gap - 1.5 rounded - full border px - 3 py - 1.5 text - [9px] font - bold uppercase tracking - wide ${getStatusClass(
                      selectedCategory.status,
                    )} `}
                  >
                    <span
                      className={`h - 1.5 w - 1.5 rounded - full ${getStatusDotClass(
                        selectedCategory.status,
                      )} `}
                    />

                    {selectedCategory.status}
                  </span>
                </div>

                {/* CREATED */}

                <div className="rounded-xl border border-[#163F20]/10 bg-[#FAFBFA] p-4">
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#9AA29C]">
                    Created At
                  </p>

                  <p className="text-xs font-semibold text-[#59645C]">
                    {formatDate(selectedCategory.created_at)}
                  </p>
                </div>
              </div>

              {/* DESCRIPTION */}

              <div className="mt-3 rounded-xl border border-[#163F20]/10 bg-[#FAFBFA] p-4">
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[#9AA29C]">
                  Description
                </p>

                <p className="max-h-[120px] overflow-y-auto text-sm leading-6 text-[#59645C]">
                  {selectedCategory.description || "No description provided."}
                </p>
              </div>

              {/* UPDATED */}

              <div className="mt-4 border-t border-[#163F20]/10 pt-4">
                <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#9AA29C]">
                  Updated At
                </p>

                <p className="text-xs font-semibold text-[#59645C]">
                  {formatDate(selectedCategory.updated_at)}
                </p>
              </div>
            </div>

            {/* =================================================
                MODAL FOOTER
            ================================================= */}

            <div className="flex justify-end gap-2 border-t border-[#163F20]/10 bg-[#FAFBFA] px-5 py-4">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-[#163F20]/15 bg-white px-5 py-2.5 text-sm font-bold text-[#59645C] transition hover:bg-[#F5F7F5] hover:text-[#163F20]"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  closeModal();
                  onEdit(selectedCategory);
                }}
                className="rounded-xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(22,63,32,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(22,63,32,0.7)]"
              >
                Edit Category
              </button>
            </div>
          </div>
        )}
      </GlobalModal>
    </>
  );
};

export default CategoryTable;
