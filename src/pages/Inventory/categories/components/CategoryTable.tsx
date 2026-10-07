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

  onView?: (category: Category) => void;

  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;

  onStatusToggle: (
    category: Category,
    nextStatus: "active" | "inactive"
  ) => void;

  statusLoadingId: number | null;

  // ✅ Permission props
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canToggleStatus?: boolean;
}

// =====================================================
// STATUS CLASS — NAVY / YELLOW THEME
// =====================================================

const getStatusClass = (status: Category["status"]) => {
  if (status === "active") {
    return "border-[#1E3A8A]/25 bg-[#EAF1FF] text-[#1E3A8A]";
  }

  if (status === "draft") {
    return "border-[#D8E2F0] bg-[#F3F6FB] text-[#4A5778]";
  }

  if (status === "inactive") {
    return "border-[#C23B32]/25 bg-[#FBEAEA] text-[#C23B32]";
  }

  return "border-[#D8E2F0] bg-[#F3F6FB] text-[#4A5778]";
};

// =====================================================
// STATUS DOT — NAVY / YELLOW THEME
// =====================================================

const getStatusDotClass = (status: Category["status"]) => {
  if (status === "active") {
    return "bg-[#1E3A8A]";
  }

  if (status === "draft") {
    return "bg-[#4A5778]";
  }

  if (status === "inactive") {
    return "bg-[#C23B32]";
  }

  return "bg-[#8C97B2]";
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
  onStatusToggle,
  statusLoadingId,

  // ✅ Permission props (defaults)
  canView = true,
  canEdit = false,
  canDelete = false,
  canToggleStatus = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);

  const ITEMS_PER_PAGE = 10;

  // ===================================================
  // ✅ CHECK IF ANY ACTION IS AVAILABLE
  // ===================================================

  const hasAnyAction = canView || canEdit || canDelete;

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
      return Array.from({ length: totalPages }, (_, index) => index + 1);
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

      <div className="overflow-hidden bg-white font-poppins">
        {/* TOP ACCENT */}

        <div className="h-[3px] w-full bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1E3A8A]" />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px] border-collapse">
            {/* =================================================
                TABLE HEADER
            ================================================= */}

            <thead>
              <tr className="bg-[#1E3A8A]">
                <th className="w-[80px] px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                  S.No.
                </th>

                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                  Image
                </th>

                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                  Category Name
                </th>

                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                  Description
                </th>

                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                  Products
                </th>

                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                  Status
                </th>

                {hasAnyAction && (
                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                    Actions
                  </th>
                )}
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
                  <td
                    colSpan={hasAnyAction ? 7 : 6}
                    className="px-5 py-16 text-center"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-4 flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
                        <FiLayers size={22} />
                      </div>

                      <p className="text-sm font-bold text-[#0F1B3D]">
                        Loading categories...
                      </p>

                      <p className="mt-1 text-xs text-[#8C97B2]">
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
                  <td
                    colSpan={hasAnyAction ? 7 : 6}
                    className="px-5 py-16 text-center"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#1E3A8A]/10 bg-[#EAF1FF] text-[#1E3A8A]">
                        <FiLayers size={24} />
                      </div>

                      <p className="text-sm font-bold text-[#0F1B3D]">
                        No categories found
                      </p>

                      <p className="mt-1 max-w-sm text-xs text-[#8C97B2]">
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

                  const normalizedStatus = String(item.status).toLowerCase();
                  const isActive = normalizedStatus === "active";
                  const isStatusLoading = statusLoadingId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className="group border-b border-[#1E3A8A]/10 bg-white transition-all duration-200 hover:bg-[#FAFBFF]"
                    >
                      {/* S.NO */}

                      <td className="px-5 py-4">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF1FF] text-xs font-bold text-[#1E3A8A]">
                          {serialNumber}
                        </span>
                      </td>

                      {/* IMAGE */}

                      <td className="px-5 py-4">
                        {item.image ? (
                          <div className="h-[58px] w-[58px] overflow-hidden rounded-xl border border-[#1E3A8A]/15 bg-[#F5F8FF] p-0.5 transition-all group-hover:border-[#1E3A8A]/30">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="h-full w-full rounded-[9px] object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-[58px] w-[58px] items-center justify-center rounded-xl border border-[#1E3A8A]/10 bg-[#F5F8FF] text-[#1E3A8A]">
                            <FiImage size={21} />
                          </div>
                        )}
                      </td>

                      {/* CATEGORY NAME */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#1E3A8A]" />

                          <span className="text-sm font-bold text-[#0F1B3D]">
                            {item.title}
                          </span>
                        </div>
                      </td>

                      {/* DESCRIPTION */}

                      <td className="px-5 py-4">
                        <p
                          className="max-w-[270px] truncate text-xs leading-5 text-[#4A5778]"
                          title={item.description || ""}
                        >
                          {description}
                        </p>
                      </td>

                      {/* PRODUCTS */}

                      <td className="px-5 py-4">
                        <span className="inline-flex min-w-[42px] items-center justify-center rounded-lg border border-[#1E3A8A]/10 bg-[#F5F8FF] px-3 py-1.5 text-xs font-bold text-[#1E3A8A]">
                          {item.products_count ?? 0}
                        </span>
                      </td>

                      {/* STATUS DROPDOWN — permission based */}

                      <td className="px-5 py-4">
                        {canToggleStatus ? (
                          <div className="relative inline-block">
                            <select
                              value={isActive ? "active" : "inactive"}
                              disabled={isStatusLoading}
                              onChange={(e) =>
                                onStatusToggle(
                                  item,
                                  e.target.value as "active" | "inactive",
                                )
                              }
                              className={`h-8 cursor-pointer appearance-none rounded-full border pl-3 pr-8 text-[10px] font-bold uppercase tracking-wider outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                isActive
                                  ? "border-[#1E3A8A]/25 bg-[#EAF1FF] text-[#1E3A8A]"
                                  : "border-[#C23B32]/25 bg-[#FBEAEA] text-[#C23B32]"
                              }`}
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>

                            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
                              {isStatusLoading ? (
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              ) : (
                                <svg
                                  width="10"
                                  height="10"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="6 9 12 15 18 9" />
                                </svg>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${getStatusClass(
                              item.status,
                            )}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${getStatusDotClass(
                                item.status,
                              )}`}
                            />
                            {item.status}
                          </span>
                        )}
                      </td>

                      {/* ACTIONS — permission based */}

                      {hasAnyAction && (
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-1.5">
                            {/* VIEW */}

                            {canView && (
                              <button
                                type="button"
                                title="View Details"
                                onClick={() => handleViewClick(item)}
                                className="group/view flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E3A8A]/15 bg-[#F5F8FF] text-[#1E3A8A] transition-all duration-200 hover:border-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white"
                              >
                                <FiEye
                                  size={15}
                                  className="transition-transform group-hover/view:scale-110"
                                />
                              </button>
                            )}

                            {/* EDIT */}

                            {canEdit && (
                              <button
                                type="button"
                                title="Edit Category"
                                onClick={() => onEdit(item)}
                                className="group/edit flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E3A8A]/15 bg-white text-[#1E3A8A] transition-all duration-200 hover:border-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white"
                              >
                                <FiEdit2
                                  size={15}
                                  className="transition-transform group-hover/edit:scale-110"
                                />
                              </button>
                            )}

                            {/* DELETE */}

                            {canDelete && (
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
                            )}
                          </div>
                        </td>
                      )}
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

        <div className="border-t border-[#1E3A8A]/10 bg-[#FAFBFF] px-4 py-4 sm:px-5">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-[#8C97B2]">
              Showing{" "}
              <span className="font-bold text-[#3A4668]">{startEntry}</span> to{" "}
              <span className="font-bold text-[#3A4668]">{endEntry}</span> of{" "}
              <span className="font-bold text-[#3A4668]">{totalEntries}</span>{" "}
              entries
            </p>

            <div className="flex items-center gap-1.5">
              {/* PREVIOUS */}

              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1E3A8A]/15 bg-white text-[#1E3A8A] transition-all hover:border-[#1E3A8A]/30 hover:bg-[#EAF1FF] disabled:cursor-not-allowed disabled:opacity-30"
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
                  className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold transition-all ${
                    currentPage === page
                      ? "bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] text-white shadow-[0_6px_14px_-6px_rgba(30,58,138,0.5)]"
                      : "border border-transparent text-[#4A5778] hover:border-[#1E3A8A]/15 hover:bg-[#F5F8FF] hover:text-[#1E3A8A]"
                  }`}
                >
                  {page}
                </button>
              ))}

              {/* NEXT */}

              <button
                type="button"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => onPageChange(currentPage + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1E3A8A]/15 bg-white text-[#1E3A8A] transition-all hover:border-[#1E3A8A]/30 hover:bg-[#EAF1FF] disabled:cursor-not-allowed disabled:opacity-30"
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
          <div className="flex min-h-full w-full items-center justify-center p-4 font-poppins">
            <div className="relative w-full max-w-[480px] overflow-hidden rounded-[20px] border border-[#E3E9F5] bg-white shadow-2xl">
              {/* MODAL ACCENT */}

              <div className="h-[3px] w-full bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1E3A8A]" />

              {/* MODAL HEADER */}

              <div className="flex items-center justify-between border-b border-[#1E3A8A]/10 px-4 py-3">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1E3A8A]" />

                    <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#2563EB]">
                      Category
                    </span>
                  </div>

                  <h2 className="text-[16px] font-bold text-[#0F1B3D]">
                    Category Details
                  </h2>

                  <p className="mt-0.5 text-[11px] text-[#8C97B2]">
                    View category information
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F8FF] text-[#1E3A8A] transition hover:bg-[#EAF1FF]"
                >
                  <FiX size={16} />
                </button>
              </div>

              {/* MODAL CONTENT */}

              <div className="max-h-[62vh] overflow-y-auto bg-white p-4">
                {/* IMAGE */}

                <div className="mb-3">
                  <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.14em] text-[#8C97B2]">
                    Category Image
                  </label>

                  {selectedCategory.image ? (
                    <div className="h-[110px] overflow-hidden rounded-xl border border-[#1E3A8A]/10 bg-[#F5F8FF] p-1">
                      <img
                        src={selectedCategory.image}
                        alt={selectedCategory.title}
                        className="h-full w-full rounded-lg object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-[110px] items-center justify-center rounded-xl border border-[#1E3A8A]/10 bg-[#F5F8FF] text-[#1E3A8A]">
                      <FiImage size={28} />
                    </div>
                  )}
                </div>

                {/* INFO GRID */}

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {/* NAME */}

                  <div className="rounded-lg border border-[#1E3A8A]/10 bg-[#FAFBFF] p-3">
                    <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#8C97B2]">
                      Category Name
                    </p>

                    <p className="text-[13px] font-bold text-[#0F1B3D]">
                      {selectedCategory.title}
                    </p>
                  </div>

                  {/* PRODUCTS */}

                  <div className="rounded-lg border border-[#1E3A8A]/10 bg-[#FAFBFF] p-3">
                    <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#8C97B2]">
                      Products
                    </p>

                    <span className="inline-flex rounded-md border border-[#1E3A8A]/15 bg-[#EAF1FF] px-2.5 py-1 text-[11px] font-bold text-[#1E3A8A]">
                      {selectedCategory.products_count ?? 0} Products
                    </span>
                  </div>

                  {/* STATUS */}

                  <div className="rounded-lg border border-[#1E3A8A]/10 bg-[#FAFBFF] p-3">
                    <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#8C97B2]">
                      Status
                    </p>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${getStatusClass(
                        selectedCategory.status,
                      )}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${getStatusDotClass(
                          selectedCategory.status,
                        )}`}
                      />

                      {selectedCategory.status}
                    </span>
                  </div>

                  {/* CREATED */}

                  <div className="rounded-lg border border-[#1E3A8A]/10 bg-[#FAFBFF] p-3">
                    <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#8C97B2]">
                      Created At
                    </p>

                    <p className="text-[11px] font-semibold text-[#4A5778]">
                      {formatDate(selectedCategory.created_at)}
                    </p>
                  </div>
                </div>

                {/* DESCRIPTION */}

                <div className="mt-2 rounded-lg border border-[#1E3A8A]/10 bg-[#FAFBFF] p-3">
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#8C97B2]">
                    Description
                  </p>

                  <p className="max-h-[70px] overflow-y-auto text-[12px] leading-5 text-[#4A5778]">
                    {selectedCategory.description ||
                      "No description provided."}
                  </p>
                </div>

                {/* UPDATED */}

                <div className="mt-3 border-t border-[#1E3A8A]/10 pt-3">
                  <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#8C97B2]">
                    Updated At
                  </p>

                  <p className="text-[11px] font-semibold text-[#4A5778]">
                    {formatDate(selectedCategory.updated_at)}
                  </p>
                </div>
              </div>

              {/* MODAL FOOTER */}

              <div className="flex justify-end gap-2 border-t border-[#1E3A8A]/10 bg-[#FAFBFF] px-4 py-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-[#1E3A8A]/15 bg-white px-4 py-2 text-[12px] font-bold text-[#4A5778] transition hover:bg-[#F5F8FF] hover:text-[#1E3A8A]"
                >
                  Close
                </button>

                {/* ✅ Edit button — permission based */}

                {canEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      closeModal();
                      onEdit(selectedCategory);
                    }}
                    className="rounded-lg bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] px-4 py-2 text-[12px] font-bold text-white shadow-[0_6px_14px_-6px_rgba(30,58,138,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_18px_-8px_rgba(30,58,138,0.7)]"
                  >
                    Edit Category
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </GlobalModal>
    </>
  );
};

export default CategoryTable;