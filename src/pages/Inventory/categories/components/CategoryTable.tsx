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

interface CategoryTableProps {
  categories: Category[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalEntries: number;
  startEntry: number;
  endEntry: number;
  onPageChange: (page: number) => void;
  onView: (category: Category) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

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
  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const ITEMS_PER_PAGE = 10;

  // =====================================================
  // STATUS CLASS
  // =====================================================

  const getStatusClass = (
    status: Category["status"]
  ) => {
    if (status === "active") {
      return "border-[#b8902e]/25 bg-[#f8f3e5] text-[#8f6d1d]";
    }

    if (status === "draft") {
      return "border-[#d9a441]/30 bg-[#fff8e8] text-[#a06f13]";
    }

    return "border-[#d8d1c4] bg-[#f6f4ef] text-[#857b6c]";
  };

  // =====================================================
  // VIEW
  // =====================================================

  const handleViewClick = (
    category: Category
  ) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
    onView(category);
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
  };

  // =====================================================
  // PAGINATION
  // =====================================================

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

  return (
    <>
      {/* =================================================
          CATEGORY TABLE
      ================================================= */}

      <div className="overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-sm">
        {/* Top Gold Accent */}

        <div className="h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px] border-collapse">
            {/* =================================================
                TABLE HEADER
            ================================================= */}

            <thead>
              <tr className="bg-[#2f2a22] text-left">
                <th className="w-[80px] px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#f3dfab]">
                  S.No.
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#f3dfab]">
                  Image
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#f3dfab]">
                  Category Name
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#f3dfab]">
                  Description
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#f3dfab]">
                  Products
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#f3dfab]">
                  Status
                </th>

                <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-[#f3dfab]">
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
                  <td
                    colSpan={7}
                    className="px-5 py-16 text-center"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-4 flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-[#b8902e]/10">
                        <FiLayers
                          size={22}
                          className="text-[#b8902e]"
                        />
                      </div>

                      <p className="text-sm font-semibold text-[#4a4436]">
                        Loading categories...
                      </p>

                      <p className="mt-1 text-xs text-[#a89a7d]">
                        Please wait while we fetch
                        your categories.
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
                    colSpan={7}
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
                        No categories found
                      </p>

                      <p className="mt-1 max-w-sm text-xs text-[#a89a7d]">
                        There are no categories matching
                        your current search.
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
                    (currentPage - 1) *
                      ITEMS_PER_PAGE +
                    index +
                    1;

                  const description =
                    item.description
                      ? item.description
                          .split(" ")
                          .slice(0, 7)
                          .join(" ") +
                        (item.description.split(
                          " "
                        ).length > 7
                          ? "..."
                          : "")
                      : "No description available";

                  return (
                    <tr
                      key={item.id}
                      className="group border-b border-[#b8902e]/10 bg-white transition-all duration-200 hover:bg-[#faf8f3]"
                    >
                      {/* =================================================
                          S.NO
                      ================================================= */}

                      <td className="px-5 py-4">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-xs font-bold text-[#8f6d1d]">
                          {serialNumber}
                        </span>
                      </td>

                      {/* =================================================
                          IMAGE
                      ================================================= */}

                      <td className="px-5 py-4">
                        {item.image ? (
                          <div className="h-[58px] w-[58px] overflow-hidden rounded-xl border border-[#b8902e]/20 bg-[#faf8f3] p-0.5 transition-all group-hover:border-[#b8902e]/40">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="h-full w-full rounded-[9px] object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-[58px] w-[58px] items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] text-[#b8902e]">
                            <FiImage size={21} />
                          </div>
                        )}
                      </td>

                      {/* =================================================
                          CATEGORY NAME
                      ================================================= */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#d4af52]" />

                          <span className="text-sm font-bold text-[#2a2620]">
                            {item.title}
                          </span>
                        </div>
                      </td>

                      {/* =================================================
                          DESCRIPTION
                      ================================================= */}

                      <td className="px-5 py-4">
                        <p
                          className="max-w-[270px] truncate text-xs leading-5 text-[#786f60]"
                          title={
                            item.description ||
                            ""
                          }
                        >
                          {description}
                        </p>
                      </td>

                      {/* =================================================
                          PRODUCTS
                      ================================================= */}

                      <td className="px-5 py-4">
                        <span className="inline-flex min-w-[42px] items-center justify-center rounded-full border border-[#b8902e]/20 bg-[#faf8f3] px-3 py-1.5 text-xs font-bold text-[#8f6d1d]">
                          {item.products_count ??
                            0}
                        </span>
                      </td>

                      {/* =================================================
                          STATUS
                      ================================================= */}

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${getStatusClass(
                            item.status
                          )}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              item.status ===
                              "active"
                                ? "bg-[#b8902e]"
                                : item.status ===
                                  "draft"
                                ? "bg-[#d9a441]"
                                : "bg-[#a89a7d]"
                            }`}
                          />

                          {item.status}
                        </span>
                      </td>

                      {/* =================================================
                          ACTIONS
                      ================================================= */}

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {/* VIEW */}

                          <button
                            type="button"
                            title="View Details"
                            onClick={() =>
                              handleViewClick(
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
                            title="Edit Category"
                            onClick={() =>
                              onEdit(item)
                            }
                            className="group/edit flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/20 bg-[#faf8f3] text-[#8f6d1d] transition-all duration-200 hover:border-[#8f6d1d] hover:bg-[#8f6d1d] hover:text-white hover:shadow-md hover:shadow-[#8f6d1d]/20"
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
                            onClick={() =>
                              onDelete(item)
                            }
                            className="group/delete flex h-9 w-9 items-center justify-center rounded-xl border border-[#c98d83]/20 bg-[#fff8f6] text-[#b46055] transition-all duration-200 hover:border-[#b46055] hover:bg-[#b46055] hover:text-white hover:shadow-md hover:shadow-[#b46055]/15"
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

        <div className="border-t border-[#b8902e]/10 bg-[#fffdfa] px-4 py-4 sm:px-5">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            {/* Entry Information */}

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
                {totalEntries}
              </span>{" "}
              entries
            </p>

            {/* Pagination */}

            <div className="flex items-center gap-1.5">
              {/* Previous */}

              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  onPageChange(
                    currentPage - 1
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#b8902e]/15 bg-white text-[#8f6d1d] transition-all hover:border-[#b8902e]/30 hover:bg-[#faf8f3] disabled:cursor-not-allowed disabled:opacity-30"
                title="Previous page"
              >
                <FiChevronLeft size={17} />
              </button>

              {/* Page Numbers */}

              {paginationPages.map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() =>
                      onPageChange(page)
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

              {/* Next */}

              <button
                type="button"
                disabled={
                  currentPage ===
                    totalPages ||
                  totalPages === 0
                }
                onClick={() =>
                  onPageChange(
                    currentPage + 1
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#b8902e]/15 bg-white text-[#8f6d1d] transition-all hover:border-[#b8902e]/30 hover:bg-[#faf8f3] disabled:cursor-not-allowed disabled:opacity-30"
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
      >
        {selectedCategory && (
          <div className="relative w-full max-w-[560px] overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
            {/* =================================================
                MODAL ACCENT
            ================================================= */}

            <div className="h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="flex items-center justify-between border-b border-[#b8902e]/10 px-5 py-4">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#b8902e]" />

                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#b8902e]">
                    Category
                  </span>
                </div>

                <h2 className="text-lg font-bold text-[#2a2620]">
                  Category Details
                </h2>

                <p className="mt-1 text-xs text-[#a89a7d]">
                  View category information
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] text-[#8f6d1d] transition hover:border-[#b8902e]/30 hover:bg-[#b8902e]/10"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* =================================================
                MODAL CONTENT
            ================================================= */}

            <div className="max-h-[75vh] overflow-y-auto p-5">
              {/* IMAGE */}

              <div className="mb-5">
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#a89a7d]">
                  Category Image
                </label>

                {selectedCategory.image ? (
                  <div className="h-[180px] overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-[#faf8f3] p-1">
                    <img
                      src={
                        selectedCategory.image
                      }
                      alt={
                        selectedCategory.title
                      }
                      className="h-full w-full rounded-xl object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-[180px] items-center justify-center rounded-2xl border border-[#b8902e]/15 bg-[#faf8f3] text-[#b8902e]">
                    <FiImage size={38} />
                  </div>
                )}
              </div>

              {/* INFO GRID */}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* NAME */}

                <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#a89a7d]">
                    Category Name
                  </p>

                  <p className="text-sm font-bold text-[#2a2620]">
                    {selectedCategory.title}
                  </p>
                </div>

                {/* PRODUCTS */}

                <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#a89a7d]">
                    Products
                  </p>

                  <span className="inline-flex rounded-full border border-[#b8902e]/20 bg-white px-3 py-1.5 text-xs font-bold text-[#8f6d1d]">
                    {selectedCategory.products_count ??
                      0}{" "}
                    Products
                  </span>
                </div>

                {/* STATUS */}

                <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#a89a7d]">
                    Status
                  </p>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${getStatusClass(
                      selectedCategory.status
                    )}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        selectedCategory.status ===
                        "active"
                          ? "bg-[#b8902e]"
                          : selectedCategory.status ===
                            "draft"
                          ? "bg-[#d9a441]"
                          : "bg-[#a89a7d]"
                      }`}
                    />

                    {selectedCategory.status}
                  </span>
                </div>

                {/* CREATED */}

                <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#a89a7d]">
                    Created At
                  </p>

                  <p className="text-xs font-semibold text-[#4a4436]">
                    {selectedCategory.created_at
                      ? new Date(
                          selectedCategory.created_at
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

              {/* DESCRIPTION */}

              <div className="mt-3 rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#a89a7d]">
                  Description
                </p>

                <p className="max-h-[120px] overflow-y-auto text-sm leading-6 text-[#6b6152]">
                  {selectedCategory.description ||
                    "No description provided."}
                </p>
              </div>

              {/* UPDATED */}

              <div className="mt-4 border-t border-[#b8902e]/10 pt-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#a89a7d]">
                  Updated At
                </p>

                <p className="text-xs font-semibold text-[#4a4436]">
                  {selectedCategory.updated_at
                    ? new Date(
                        selectedCategory.updated_at
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

            {/* =================================================
                MODAL FOOTER
            ================================================= */}

            <div className="flex justify-end gap-3 border-t border-[#b8902e]/10 bg-[#fffdfa] px-5 py-4">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-[#b8902e]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#786f60] transition hover:border-[#b8902e]/30 hover:bg-[#faf8f3] hover:text-[#8f6d1d]"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  closeModal();
                  onEdit(
                    selectedCategory
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
    </>
  );
};

export default CategoryTable;