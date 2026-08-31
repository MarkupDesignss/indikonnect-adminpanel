import React from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiEye,
  FiImage,
  FiPackage,
} from "react-icons/fi";

import { Product } from "@/types/product";

interface ProductTableProps {
  products: Product[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalEntries: number;
  startEntry: number;
  endEntry: number;
  onPageChange: (page: number) => void;
  onEdit: (product: Product) => void;
  onView: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({
  products,
  loading,
  currentPage,
  totalPages,
  totalEntries,
  startEntry,
  endEntry,
  onPageChange,
  onEdit,
  onView,
}) => {
  const ITEMS_PER_PAGE = 10;

  /*
   * Generate a better pagination range.
   * Keeps the current page visible when there are many pages.
   */
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

  const paginationPages = getPaginationPages();

  return (
    <div className="overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-sm">
      {/* =================================================
          TABLE TOP ACCENT
      ================================================= */}

      <div className="h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1250px] border-collapse">
          {/* =================================================
              TABLE HEADER
          ================================================= */}

          <thead>
            <tr className="bg-[#2f2a22] text-left">
              <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#f3dfab]">
                S.No
              </th>

              <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#f3dfab]">
                Image
              </th>

              <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#f3dfab]">
                Product
              </th>

              <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#f3dfab]">
                SKU
              </th>

              <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#f3dfab]">
                Category
              </th>

              <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#f3dfab]">
                Tax Category
              </th>

              <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#f3dfab]">
                Retail Price
              </th>

              <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#f3dfab]">
                Stock
              </th>

              <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#f3dfab]">
                Status
              </th>

              <th className="whitespace-nowrap px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-[#f3dfab]">
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
                  colSpan={10}
                  className="px-5 py-16 text-center"
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="mb-4 flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-[#b8902e]/10">
                      <FiPackage
                        size={22}
                        className="text-[#b8902e]"
                      />
                    </div>

                    <p className="text-sm font-semibold text-[#4a4436]">
                      Loading products...
                    </p>

                    <p className="mt-1 text-xs text-[#a89a7d]">
                      Please wait while we fetch your
                      product inventory.
                    </p>
                  </div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              /* =================================================
                  EMPTY
              ================================================= */

              <tr>
                <td
                  colSpan={10}
                  className="px-5 py-16 text-center"
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#b8902e]/15 bg-[#faf8f3]">
                      <FiPackage
                        size={24}
                        className="text-[#b8902e]"
                      />
                    </div>

                    <p className="text-sm font-semibold text-[#2a2620]">
                      No products found
                    </p>

                    <p className="mt-1 max-w-sm text-xs text-[#a89a7d]">
                      There are no products matching
                      your current search or filter.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              /* =================================================
                  PRODUCTS
              ================================================= */

              products.map((product, index) => {
                const serialNumber =
                  (currentPage - 1) *
                    ITEMS_PER_PAGE +
                  index +
                  1;

                // Primary image
                const primaryImage =
                  product.images?.find(
                    (image) =>
                      image.is_primary === true
                  ) ||
                  product.images?.[0];

                // Category
                const categoryName =
                  product.category?.name || "-";

                // Tax category
                const taxCategoryName =
                  product.tax_category?.name ||
                  "-";

                // Stock
                const stock =
                  Number(
                    product.stock_quantity || 0
                  );

                const lowStockThreshold =
                  Number(
                    product.low_stock_threshold ||
                      0
                  );

                const isLowStock =
                  stock <= lowStockThreshold;

                // Published
                const isActive =
                  product.is_published === true;

                return (
                  <tr
                    key={product.id}
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
                      {primaryImage ? (
                        <div className="relative h-[58px] w-[58px] overflow-hidden rounded-xl border border-[#b8902e]/20 bg-[#faf8f3] p-0.5 transition-all duration-200 group-hover:border-[#b8902e]/40">
                          <img
                            src={
                              primaryImage.image_url
                            }
                            alt={product.name}
                            className="h-full w-full rounded-[9px] object-cover"
                            onError={(e) => {
                              const target =
                                e.target as HTMLImageElement;

                              target.style.display =
                                "none";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="flex h-[58px] w-[58px] items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] text-[#b8902e]">
                          <FiImage size={21} />
                        </div>
                      )}
                    </td>

                    {/* =================================================
                        PRODUCT
                    ================================================= */}

                    <td className="px-5 py-4">
                      <div className="max-w-[230px]">
                        <p className="truncate text-sm font-bold text-[#2a2620]">
                          {product.name}
                        </p>

                        <p className="mt-1 truncate text-xs leading-5 text-[#a89a7d]">
                          {product.description ||
                            "No description available"}
                        </p>
                      </div>
                    </td>

                    {/* =================================================
                        SKU
                    ================================================= */}

                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-lg border border-[#b8902e]/15 bg-[#faf8f3] px-3 py-1.5 text-xs font-semibold tracking-wide text-[#786f60]">
                        {product.product_code ||
                          "-"}
                      </span>
                    </td>

                    {/* =================================================
                        CATEGORY
                    ================================================= */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#d4af52]" />

                        <span className="text-sm font-medium text-[#4a4436]">
                          {categoryName}
                        </span>
                      </div>
                    </td>

                    {/* =================================================
                        TAX CATEGORY
                    ================================================= */}

                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-[#6b6152]">
                        {taxCategoryName}
                      </span>
                    </td>

                    {/* =================================================
                        RETAIL PRICE
                    ================================================= */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-semibold text-[#a8841c]">
                          ₹
                        </span>

                        <span className="text-sm font-bold text-[#2a2620]">
                          {Number(
                            product.retail_price ||
                              0
                          ).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </td>

                    {/* =================================================
                        STOCK
                    ================================================= */}

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex min-w-[55px] items-center justify-center rounded-full border px-3 py-1.5 text-xs font-bold ${
                          isLowStock
                            ? "border-[#d9a441]/30 bg-[#fff8e8] text-[#a06f13]"
                            : "border-[#b8902e]/20 bg-[#faf8f3] text-[#8f6d1d]"
                        }`}
                      >
                        {stock}
                      </span>
                    </td>

                    {/* =================================================
                        STATUS
                    ================================================= */}

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${
                          isActive
                            ? "border-[#b8902e]/25 bg-[#f8f3e5] text-[#8f6d1d]"
                            : "border-[#d8d1c4] bg-[#f6f4ef] text-[#857b6c]"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isActive
                              ? "bg-[#b8902e]"
                              : "bg-[#a89a7d]"
                          }`}
                        />

                        {isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    {/* =================================================
                        ACTIONS
                    ================================================= */}

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {/* View */}

                        <button
                          type="button"
                          onClick={() =>
                            onView(product)
                          }
                          className="group/view flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/20 bg-[#faf8f3] text-[#8f6d1d] transition-all duration-200 hover:border-[#b8902e] hover:bg-[#b8902e] hover:text-white hover:shadow-md hover:shadow-[#b8902e]/20"
                          title="View Product"
                        >
                          <FiEye
                            size={16}
                            className="transition-transform group-hover/view:scale-110"
                          />
                        </button>

                        {/* Edit */}

                        <button
                          type="button"
                          onClick={() =>
                            onEdit(product)
                          }
                          className="group/edit flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/20 bg-[#faf8f3] text-[#8f6d1d] transition-all duration-200 hover:border-[#8f6d1d] hover:bg-[#8f6d1d] hover:text-white hover:shadow-md hover:shadow-[#8f6d1d]/20"
                          title="Edit Product"
                        >
                          <FiEdit2
                            size={15}
                            className="transition-transform group-hover/edit:scale-110"
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

          <div className="text-center sm:text-left">
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
          </div>

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

            {/* Pages */}

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
                currentPage === totalPages ||
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
  );
};

export default ProductTable;