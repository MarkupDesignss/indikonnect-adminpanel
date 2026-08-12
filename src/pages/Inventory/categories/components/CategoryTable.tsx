import React from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiImage,
  FiTrash2,
} from "react-icons/fi";

import { Category } from "@/types/category";

interface CategoryTableProps {
  categories: Category[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalEntries: number;
  startEntry: number;
  endEntry: number;
  onPageChange: (page: number) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

const CategoryTable: React.FC<
  CategoryTableProps
> = ({
  categories,
  loading,
  currentPage,
  totalPages,
  totalEntries,
  startEntry,
  endEntry,
  onPageChange,
  onEdit,
  onDelete,
}) => {
  const getStatusClass = (
    status: Category["status"]
  ) => {
    if (status === "active") {
      return "bg-[#E9FBF6] text-[#00A87A] border-[#B9F0E0]";
    }

    if (status === "draft") {
      return "bg-[#FFF7E7] text-[#F39A00] border-[#FFE2A8]";
    }

    return "bg-[#F4F4F4] text-[#666666] border-[#E2E2E2]";
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[#DDE3EC] bg-white shadow-[0_2px_5px_rgba(0,0,0,0.03)]">

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[950px] border-collapse">

          {/* Header */}
          <thead>
            <tr className="bg-black text-left text-white">

              <th className="px-5 py-4 text-sm font-bold">
                Banner
              </th>

              <th className="px-5 py-4 text-sm font-bold">
                Category Name
              </th>

              <th className="px-5 py-4 text-sm font-bold">
                Parent Category
              </th>

              <th className="px-5 py-4 text-sm font-bold">
                Sort Order
              </th>

              <th className="px-5 py-4 text-sm font-bold">
                Status
              </th>

              <th className="px-5 py-4 text-right text-sm font-bold">
                Actions
              </th>

            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-14 text-center text-sm text-gray-500"
                >
                  Loading categories...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-14 text-center text-sm text-gray-500"
                >
                  No categories found.
                </td>
              </tr>
            ) : (
              categories.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[#DDE3EC] bg-[#F9FBFD] transition hover:bg-white"
                >

                  {/* Banner */}
                  <td className="px-5 py-4">
                    {item.image ? (
                      <div className="h-[50px] w-[50px] overflow-hidden rounded-lg border border-[#DCE2EA] bg-white">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-[50px] w-[50px] items-center justify-center rounded-lg bg-[#E3ECFA] text-[#718096]">
                        <FiImage size={21} />
                      </div>
                    )}
                  </td>

                  {/* Category Name */}
                  <td className="px-5 py-4">
                    <span className="text-[15px] font-semibold text-[#071A33]">
                      {item.title}
                    </span>
                  </td>

                  {/* Parent Category */}
                  <td className="px-5 py-4">
                    {item.parentCategory ? (
                      <span className="text-sm text-[#253B59]">
                        {item.parentCategory}
                      </span>
                    ) : (
                      <span className="inline-flex rounded-sm border border-[#D4E0F2] bg-[#EAF1FC] px-3 py-1 text-xs italic text-[#253B59]">
                        None (Root)
                      </span>
                    )}
                  </td>

                  {/* Sort Order */}
                  <td className="px-5 py-4">
                    <span className="text-sm font-medium text-[#172B4D]">
                      {item.sortOrder}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">

                      {/* Edit */}
                      <button
                        type="button"
                        title="Edit"
                        onClick={() =>
                          onEdit(item)
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-[#D7DEE8] bg-white text-[#34495E] transition hover:border-black hover:bg-black hover:text-white"
                      >
                        <FiEdit2 size={16} />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        title="Delete"
                        onClick={() =>
                          onDelete(item)
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-[#F2D1D1] bg-white text-red-500 transition hover:bg-red-500 hover:text-white"
                      >
                        <FiTrash2 size={16} />
                      </button>

                    </div>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex flex-col items-center justify-between gap-4 px-5 py-5 sm:flex-row">

        <p className="text-sm text-[#253B59]">
          Showing{" "}
          <span className="font-medium">
            {startEntry}
          </span>{" "}
          to{" "}
          <span className="font-medium">
            {endEntry}
          </span>{" "}
          of{" "}
          <span className="font-medium">
            {totalEntries}
          </span>{" "}
          entries
        </p>

        <div className="flex items-center gap-1">

          {/* Previous */}
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() =>
              onPageChange(currentPage - 1)
            }
            className="flex h-10 w-10 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiChevronLeft size={20} />
          </button>

          {/* Pages */}
          {Array.from(
            { length: totalPages },
            (_, index) => index + 1
          )
            .slice(0, 5)
            .map((page) => (
              <button
                key={page}
                type="button"
                onClick={() =>
                  onPageChange(page)
                }
                className={`flex h-10 min-w-10 items-center justify-center rounded-md px-3 text-sm font-medium ${
                  currentPage === page
                    ? "bg-black text-white"
                    : "text-[#172B4D] hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}

          {/* Next */}
          <button
            type="button"
            disabled={
              currentPage === totalPages ||
              totalPages === 0
            }
            onClick={() =>
              onPageChange(currentPage + 1)
            }
            className="flex h-10 w-10 items-center justify-center rounded-md text-[#23405F] hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiChevronRight size={20} />
          </button>

        </div>
      </div>
    </div>
  );
};

export default CategoryTable;
