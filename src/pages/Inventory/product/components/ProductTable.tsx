import React from "react";

import {
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiEye,
  FiImage,
} from "react-icons/fi";

import {
  Product,
} from "@/types/product";

interface ProductTableProps {
  products: Product[];

  loading: boolean;

  currentPage: number;

  totalPages: number;

  totalEntries: number;

  startEntry: number;

  endEntry: number;

  categories: {
    id: number;
    name: string;
  }[];

  brands: {
    id: number;
    name: string;
  }[];

  onPageChange: (
    page: number
  ) => void;

  onEdit: (
    product: Product
  ) => void;

  onView: (
    product: Product
  ) => void;

  onDelete?: (
    product: Product
  ) => void;
}

const ProductTable: React.FC<
  ProductTableProps
> = ({
  products,
  loading,
  currentPage,
  totalPages,
  totalEntries,
  startEntry,
  endEntry,
  categories,
  brands,
  onPageChange,
  onEdit,
  onView,
}) => {
  const getCategoryName = (
    id: number
  ) => {
    return (
      categories.find(
        (item) =>
          item.id === id
      )?.name || "-"
    );
  };

  const getBrandName = (
    id: number
  ) => {
    return (
      brands.find(
        (item) =>
          item.id === id
      )?.name || "-"
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[#DDE3EC] bg-white">

      <div className="overflow-x-auto">

        <table className="w-full min-w-[1200px] border-collapse">

          <thead>
            <tr className="bg-black text-left text-white">

              <th className="px-5 py-4 text-sm font-bold">
                Image
              </th>

              <th className="px-5 py-4 text-sm font-bold">
                Product
              </th>

              <th className="px-5 py-4 text-sm font-bold">
                SKU
              </th>

              <th className="px-5 py-4 text-sm font-bold">
                Brand
              </th>

              <th className="px-5 py-4 text-sm font-bold">
                Category
              </th>

              <th className="px-5 py-4 text-sm font-bold">
                Retail Price
              </th>

              <th className="px-5 py-4 text-sm font-bold">
                Stock
              </th>

              <th className="px-5 py-4 text-sm font-bold">
                Status
              </th>

              <th className="px-5 py-4 text-right text-sm font-bold">
                Actions
              </th>

            </tr>
          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-5 py-14 text-center text-sm text-gray-500"
                >
                  Loading products...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-5 py-14 text-center text-sm text-gray-500"
                >
                  No products found.
                </td>
              </tr>
            ) : (
              products.map(
                (product) => {
                  const primaryImage =
                    product.product_images.find(
                      (image) =>
                        image.is_primary ===
                        1
                    ) ||
                    product.product_images[0];

                  return (
                    <tr
                      key={
                        product.id
                      }
                      className="border-b border-[#DDE3EC] bg-[#F9FBFD] hover:bg-white"
                    >

                      {/* Image */}

                      <td className="px-5 py-4">

                        {primaryImage ? (
                          <div className="h-[55px] w-[55px] overflow-hidden rounded-lg border border-[#DDE3EC] bg-white">

                            <img
                              src={
                                primaryImage.image
                              }
                              alt={
                                product.name
                              }
                              className="h-full w-full object-cover"
                            />

                          </div>
                        ) : (
                          <div className="flex h-[55px] w-[55px] items-center justify-center rounded-lg bg-[#EAF1FC] text-gray-500">
                            <FiImage
                              size={22}
                            />
                          </div>
                        )}

                      </td>

                      {/* Product */}

                      <td className="px-5 py-4">

                        <div>
                          <p className="font-lato text-sm font-bold text-[#071A33]">
                            {
                              product.name
                            }
                          </p>

                          <p className="font-arimo mt-1 max-w-[220px] truncate text-xs text-gray-500">
                            {
                              product.description
                            }
                          </p>
                        </div>

                      </td>

                      {/* SKU */}

                      <td className="px-5 py-4">

                        <span className="font-arimo text-sm text-[#253B59]">
                          {
                            product.product_code
                          }
                        </span>

                      </td>

                      {/* Brand */}

                      <td className="px-5 py-4">

                        <span className="font-arimo text-sm text-[#253B59]">
                          {getBrandName(
                            product.brand_id
                          )}
                        </span>

                      </td>

                      {/* Category */}

                      <td className="px-5 py-4">

                        <span className="font-arimo text-sm text-[#253B59]">
                          {getCategoryName(
                            product.category_id
                          )}
                        </span>

                      </td>

                      {/* Price */}

                      <td className="px-5 py-4">

                        <span className="font-lato text-sm font-bold text-[#071A33]">
                          ₹
                          {product.retail_price.toLocaleString()}
                        </span>

                      </td>

                      {/* Stock */}

                      <td className="px-5 py-4">

                        <span
                          className={`font-arimo inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                            product.stock_quantity <=
                            product.low_stock_threshold
                              ? "border-red-200 bg-red-50 text-red-500"
                              : "border-green-200 bg-green-50 text-green-600"
                          }`}
                        >
                          {
                            product.stock_quantity
                          }
                        </span>

                      </td>

                      {/* Status */}

                      <td className="px-5 py-4">

                        <span
                          className={`font-arimo inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                            product.status ===
                            "active"
                              ? "border-green-200 bg-green-50 text-green-600"
                              : product.status ===
                                "draft"
                              ? "border-yellow-200 bg-yellow-50 text-yellow-600"
                              : "border-gray-200 bg-gray-50 text-gray-500"
                          }`}
                        >
                          {
                            product.status
                          }
                        </span>

                      </td>

                      {/* Actions */}

                      <td className="px-5 py-4">

                        <div className="flex justify-end gap-2">

                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() =>
                              onView(
                                product
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-md border border-[#D7DEE8] bg-white text-[#34495E] transition hover:border-blue-500 hover:bg-blue-500 hover:text-white"
                            title="View Product"
                          >
                            <FiEye
                              size={16}
                            />
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() =>
                              onEdit(
                                product
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-md border border-[#D7DEE8] bg-white text-[#34495E] transition hover:border-black hover:bg-black hover:text-white"
                            title="Edit Product"
                          >
                            <FiEdit2
                              size={16}
                            />
                          </button>

                        

                        </div>

                      </td>

                    </tr>
                  );
                }
              )
            )}

          </tbody>

        </table>

      </div>

      {/* Pagination */}

      <div className="flex flex-col items-center justify-between gap-4 px-5 py-5 sm:flex-row">

        <p className="font-arimo text-sm text-[#253B59]">
          Showing{" "}
          <span className="font-semibold">
            {startEntry}
          </span>{" "}
          to{" "}
          <span className="font-semibold">
            {endEntry}
          </span>{" "}
          of{" "}
          <span className="font-semibold">
            {totalEntries}
          </span>{" "}
          entries
        </p>

        <div className="flex items-center gap-1">

          <button
            type="button"
            disabled={
              currentPage === 1
            }
            onClick={() =>
              onPageChange(
                currentPage - 1
              )
            }
            className="flex h-10 w-10 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 disabled:opacity-40"
          >
            <FiChevronLeft
              size={20}
            />
          </button>

          {Array.from(
            {
              length:
                totalPages,
            },
            (_, index) =>
              index + 1
          )
            .slice(0, 5)
            .map((page) => (
              <button
                key={page}
                type="button"
                onClick={() =>
                  onPageChange(
                    page
                  )
                }
                className={`font-arimo flex h-10 min-w-10 items-center justify-center rounded-md px-3 text-sm font-semibold ${
                  currentPage ===
                  page
                    ? "bg-black text-white"
                    : "text-[#172B4D] hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}

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
            className="flex h-10 w-10 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-40"
          >
            <FiChevronRight
              size={20}
            />
          </button>

        </div>

      </div>

    </div>
  );
};

export default ProductTable;
