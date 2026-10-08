import React, { useEffect, useState } from "react";

import {
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiEye,
  FiImage,
  FiPackage,
  FiTrash2,
  FiX,
  FiZoomIn,
} from "react-icons/fi";

import { Product } from "@/types/product";

import GlobalModal from "@/components/common/GlobalModal";

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

  // Trending
  onTrendingToggle: (
    product: Product,
    checked: boolean,
  ) => void;

  trendingLoadingId: number | null;

  // Publish / Unpublish
  onPublishToggle: (
    product: Product,
    isPublished: boolean,
  ) => void;

  publishLoadingId: number | null;

  onDelete?: (product: Product) => void;

  // Permission props
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canPublish?: boolean;
  canToggleTrending?: boolean;
}

// =====================================================
// PUBLISH STATUS
// =====================================================

const getPublishStatusClass = (
  published: boolean,
) => {
  return published
    ? "border-[#2D6FE8]/25 bg-[#EAF3FF] text-[#2D6FE8]"
    : "border-[#D6E2F0] bg-[#F3F6FB] text-[#6B7280]";
};

// =====================================================
// STOCK STATUS
// =====================================================

const getStockClass = (
  isLowStock: boolean,
  stock: number,
) => {
  if (stock <= 0) {
    return "border-[#C23B32]/20 bg-[#FEF2F2] text-[#C23B32]";
  }

  if (isLowStock) {
    return "border-[#FACC15]/45 bg-[#FEF9C3] text-[#A16207]";
  }

  return "border-[#2D6FE8]/20 bg-[#EAF3FF] text-[#2D6FE8]";
};

// =====================================================
// COMPONENT
// =====================================================

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
  onPageChange,
  onEdit,
  onView,
  onTrendingToggle,
  trendingLoadingId,
  onPublishToggle,
  publishLoadingId,

  canView = true,
  canEdit = false,
  canDelete = false,
  canPublish = false,
  canToggleTrending = false,
}) => {
  const ITEMS_PER_PAGE = 10;

  // ===================================================
  // ANY ACTION AVAILABLE
  // ===================================================

  const hasAnyAction =
    canView || canEdit || canDelete;

  // ===================================================
  // IMAGE ZOOM STATE
  // ===================================================

  const [zoomedImage, setZoomedImage] =
    useState<{
      url: string;
      name: string;
    } | null>(null);

  // ===================================================
  // PAGINATION
  // ===================================================

  const getPaginationPages = () => {
    if (totalPages <= 5) {
      return Array.from(
        { length: totalPages },
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

  const paginationPages =
    getPaginationPages();

  // ===================================================
  // IMAGE ZOOM
  // ===================================================

  const handleImageClick = (
    imageUrl: string,
    productName: string,
  ) => {
    setZoomedImage({
      url: imageUrl,
      name: productName,
    });
  };

  const handleCloseZoom = () => {
    setZoomedImage(null);
  };

  // ===================================================
  // ESCAPE KEY
  // ===================================================

  useEffect(() => {
    const handleEsc = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        handleCloseZoom();
      }
    };

    document.addEventListener(
      "keydown",
      handleEsc,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEsc,
      );
    };
  }, []);

  // ===================================================
  // PREVENT SCROLL WHEN ZOOMED
  // ===================================================

  useEffect(() => {
    if (zoomedImage) {
      document.body.style.overflow =
        "hidden";
    } else {
      document.body.style.overflow =
        "unset";
    }

    return () => {
      document.body.style.overflow =
        "unset";
    };
  }, [zoomedImage]);

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <>
      {/* =================================================
          TABLE
      ================================================= */}

      <div className="overflow-hidden bg-white font-poppins">
        {/* TOP ACCENT */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse">
            {/* =================================================
                HEADER
            ================================================= */}

            <thead>
              <tr className="bg-[#4F8FF7] text-left">
                <th className="whitespace-nowrap px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                  S.No
                </th>

                <th className="whitespace-nowrap px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                  Image
                </th>

                <th className="whitespace-nowrap px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                  Product
                </th>

                <th className="whitespace-nowrap px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                  SKU
                </th>

                <th className="whitespace-nowrap px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                  Retail Price
                </th>

                <th className="whitespace-nowrap px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                 Remaining Stock
                </th>

                <th className="whitespace-nowrap px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                  Status
                </th>

                {canToggleTrending && (
                  <th className="whitespace-nowrap px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                    Trending
                  </th>
                )}

                {hasAnyAction && (
                  <th className="whitespace-nowrap px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            {/* =================================================
                BODY
            ================================================= */}

            <tbody>
              {/* LOADING */}

              {loading ? (
                <tr>
                  <td
                    colSpan={
                      7 +
                      (canToggleTrending
                        ? 1
                        : 0) +
                      (hasAnyAction ? 1 : 0)
                    }
                    className="px-5 py-16 text-center"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-4 flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                        <FiPackage size={22} />
                      </div>

                      <p className="text-sm font-bold text-[#111827]">
                        Loading products...
                      </p>

                      <p className="mt-1 text-xs text-[#6B7280]">
                        Please wait while we fetch your product inventory.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : products.length ===
                0 ? (
                /* EMPTY */

                <tr>
                  <td
                    colSpan={
                      7 +
                      (canToggleTrending
                        ? 1
                        : 0) +
                      (hasAnyAction ? 1 : 0)
                    }
                    className="px-5 py-16 text-center"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2D6FE8]/10 bg-[#EAF3FF] text-[#2D6FE8]">
                        <FiPackage
                          size={24}
                        />
                      </div>

                      <p className="text-sm font-bold text-[#111827]">
                        No products found
                      </p>

                      <p className="mt-1 max-w-sm text-xs text-[#6B7280]">
                        There are no products matching your current search or
                        filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                /* PRODUCTS */

                products.map(
                  (product, index) => {
                    const serialNumber =
                      (currentPage -
                        1) *
                        ITEMS_PER_PAGE +
                      index +
                      1;

                    const primaryImage =
                      product.images?.find(
                        (image) =>
                          image.is_primary ===
                          true,
                      ) ||
                      product.images?.[0];

                    const stock = Number(
                      product.stock_quantity ||
                        0,
                    );

                    const lowStockThreshold =
                      Number(
                        product.low_stock_threshold ||
                          0,
                      );

                    const isLowStock =
                      stock <=
                      lowStockThreshold;

                    const rawPublished =
                      (
                        product as Product & {
                          is_published?:
                            | number
                            | boolean
                            | string;
                        }
                      ).is_published;

                    const isPublished =
                      rawPublished === true ||
                      rawPublished ===
                        "true" ||
                      Number(
                        rawPublished,
                      ) === 1;

                    const isPublishLoading =
                      publishLoadingId ===
                      product.id;

                    const rawTrending =
                      (
                        product as Product & {
                          is_trending?:
                            | number
                            | boolean
                            | string;
                        }
                      ).is_trending;

                    const isTrending =
                      rawTrending === true ||
                      rawTrending ===
                        "true" ||
                      Number(
                        rawTrending,
                      ) === 1;

                    const isTrendingLoading =
                      trendingLoadingId ===
                      product.id;

                    return (
                      <tr
                        key={product.id}
                        className="group border-b border-[#2D6FE8]/10 bg-white transition-all duration-200 hover:bg-[#F4F8FD]"
                      >
                        {/* S.NO */}

                        <td className="px-4 py-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF3FF] text-xs font-bold text-[#2D6FE8]">
                            {
                              serialNumber
                            }
                          </span>
                        </td>

                        {/* IMAGE */}

                        <td className="px-4 py-3">
                          {primaryImage ? (
                            <div
                              className="relative h-[48px] w-[48px] cursor-pointer overflow-hidden rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] p-0.5 transition-all duration-200 group-hover:border-[#2D6FE8]/35 group-hover:shadow-lg"
                              onClick={() =>
                                handleImageClick(
                                  primaryImage.image_url,
                                  product.name,
                                )
                              }
                              title="Click to zoom image"
                            >
                              <img
                                src={
                                  primaryImage.image_url
                                }
                                alt={
                                  product.name
                                }
                                className="h-full w-full rounded-[9px] object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(
                                  event,
                                ) => {
                                  const target =
                                    event.target as HTMLImageElement;

                                  target.style.display =
                                    "none";
                                }}
                              />

                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/30">
                                <FiZoomIn
                                  size={18}
                                  className="scale-0 text-white opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex h-[48px] w-[48px] items-center justify-center rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] text-[#2D6FE8]">
                              <FiImage
                                size={21}
                              />
                            </div>
                          )}
                        </td>

                        {/* PRODUCT */}

                        <td className="px-4 py-3">
                          <div className="max-w-[250px]">
                            <p className="truncate text-sm font-bold text-[#111827]">
                              {
                                product.name
                              }
                            </p>

                            <p className="mt-1 truncate text-[10px] leading-5 text-[#6B7280]">
                              {product.description ||
                                "No description available"}
                            </p>
                          </div>
                        </td>

                        {/* SKU */}

                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-lg border border-[#DCE6F2] bg-[#F4F8FD] px-3 py-1.5 font-mono text-[10px] font-semibold tracking-wide text-[#111827]">
                            {product.product_code ||
                              "-"}
                          </span>
                        </td>

                        {/* RETAIL PRICE */}

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] font-bold text-[#2D6FE8]">
                              ₹
                            </span>

                            <span className="text-sm font-bold text-[#111827]">
                              {Number(
                                product.retail_price ||
                                  0,
                              ).toLocaleString(
                                "en-IN",
                              )}
                            </span>
                          </div>
                        </td>

                        {/* STOCK */}

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex min-w-[55px] items-center justify-center rounded-full border px-3 py-1.5 text-[10px] font-bold ${getStockClass(
                              isLowStock,
                              stock,
                            )}`}
                          >
                            {stock <=
                            0
                              ? "Out"
                              : stock}
                          </span>
                        </td>

                        {/* STATUS */}

                        <td className="px-4 py-3">
                          {canPublish ? (
                            <div className="relative inline-block">
                              <select
                                value={
                                  isPublished
                                    ? "published"
                                    : "unpublished"
                                }
                                disabled={
                                  isPublishLoading
                                }
                                onChange={(
                                  event,
                                ) => {
                                  const nextPublished =
                                    event
                                      .target
                                      .value ===
                                    "published";

                                  if (
                                    nextPublished !==
                                    isPublished
                                  ) {
                                    onPublishToggle(
                                      product,
                                      nextPublished,
                                    );
                                  }
                                }}
                                className={`h-8 min-w-[130px] max-w-[130px] cursor-pointer appearance-none rounded-full border py-1.5 pl-3 pr-9 text-[10px] font-bold uppercase tracking-wide outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${getPublishStatusClass(
                                  isPublished,
                                )} focus:border-[#2D6FE8] focus:ring-2 focus:ring-[#2D6FE8]/10`}
                              >
                                <option value="published">
                                  Published
                                </option>

                                <option value="unpublished">
                                  Unpublished
                                </option>
                              </select>

                              <span className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center">
                                {isPublishLoading ? (
                                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/25 border-t-current" />
                                ) : (
                                  <FiChevronDown
                                    size={14}
                                    strokeWidth={
                                      2.5
                                    }
                                  />
                                )}
                              </span>
                            </div>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${getPublishStatusClass(
                                isPublished,
                              )}`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />

                              {isPublished
                                ? "Published"
                                : "Unpublished"}
                            </span>
                          )}
                        </td>

                        {/* TRENDING */}

                        {canToggleTrending && (
                          <td className="px-4 py-3">
                            <div className="flex justify-center">
                              <label
                                className={`relative inline-flex items-center ${
                                  isTrendingLoading
                                    ? "cursor-wait"
                                    : "cursor-pointer"
                                }`}
                                title={
                                  isTrending
                                    ? "Remove from Trending"
                                    : "Add to Trending"
                                }
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    isTrending
                                  }
                                  disabled={
                                    isTrendingLoading
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    onTrendingToggle(
                                      product,
                                      event
                                        .target
                                        .checked,
                                    )
                                  }
                                  className="peer sr-only"
                                />

                                <div
                                  className={`relative h-7 w-12 rounded-full border transition-all duration-200 ${
                                    isTrending
                                      ? "border-[#2D6FE8] bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8]"
                                      : "border-[#D6E2F0] bg-[#EEF2F9]"
                                  } peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#2D6FE8]/20`}
                                >
                                  <span
                                    className={`absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ${
                                      isTrending
                                        ? "left-[23px]"
                                        : "left-[3px]"
                                    }`}
                                  />
                                </div>

                                {isTrendingLoading && (
                                  <span className="absolute inset-0 flex items-center justify-center">
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#2D6FE8]/25 border-t-[#2D6FE8]" />
                                  </span>
                                )}
                              </label>
                            </div>
                          </td>
                        )}

                        {/* ACTIONS */}

                        {hasAnyAction && (
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1.5">
                              {/* VIEW */}

                              {canView && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onView(
                                      product,
                                    )
                                  }
                                  className="group/view flex h-9 w-9 items-center justify-center rounded-xl border border-[#2D6FE8]/15 bg-[#EAF3FF] text-[#2D6FE8] transition-all duration-200 hover:border-[#2D6FE8] hover:bg-[#2D6FE8] hover:text-white"
                                  title="View Product"
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
                                  onClick={() =>
                                    onEdit(
                                      product,
                                    )
                                  }
                                  className="group/edit flex h-9 w-9 items-center justify-center rounded-xl border border-[#DCE6F2] bg-white text-[#111827] transition-all duration-200 hover:border-[#2D6FE8] hover:bg-[#2D6FE8] hover:text-white"
                                  title="Edit Product"
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
                                  onClick={() =>
                                    onDelete?.(
                                      product,
                                    )
                                  }
                                  className="group/delete flex h-9 w-9 items-center justify-center rounded-xl border border-[#C23B32]/20 bg-[#FEF2F2] text-[#C23B32] transition-all duration-200 hover:border-[#C23B32] hover:bg-[#C23B32] hover:text-white"
                                  title="Delete Product"
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
                  },
                )
              )}
            </tbody>
          </table>
        </div>

        {/* =================================================
            PAGINATION
        ================================================= */}

        {totalEntries > 0 && (
          <div className="border-t border-[#DCE6F2] bg-[#F8FBFF] px-4 py-3 sm:px-5">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="text-center sm:text-left">
                <p className="text-xs text-[#6B7280]">
                  Showing{" "}
                  <span className="font-bold text-[#111827]">
                    {startEntry}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-[#111827]">
                    {endEntry}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-[#111827]">
                    {totalEntries}
                  </span>{" "}
                  entries
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {/* PREVIOUS */}

                <button
                  type="button"
                  disabled={
                    currentPage === 1
                  }
                  onClick={() =>
                    onPageChange(
                      currentPage - 1,
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#111827] transition hover:border-[#2D6FE8]/30 hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:cursor-not-allowed disabled:opacity-30"
                  title="Previous page"
                >
                  <FiChevronLeft
                    size={17}
                  />
                </button>

                {/* PAGE NUMBERS */}

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
                          ? "bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-white shadow-[0_6px_14px_-6px_rgba(45,111,232,0.55)]"
                          : "border border-transparent text-[#111827] hover:border-[#2D6FE8]/15 hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}

                {/* NEXT */}

                <button
                  type="button"
                  disabled={
                    currentPage ===
                      totalPages ||
                    totalPages === 0
                  }
                  onClick={() =>
                    onPageChange(
                      currentPage + 1,
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#111827] transition hover:border-[#2D6FE8]/30 hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:cursor-not-allowed disabled:opacity-30"
                  title="Next page"
                >
                  <FiChevronRight
                    size={17}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =================================================
          IMAGE ZOOM MODAL
      ================================================= */}

      <GlobalModal
        isOpen={!!zoomedImage}
        onClose={handleCloseZoom}
        closeOnOverlayClick
        className="!max-h-[90vh] !max-w-[90vw] !bg-transparent !shadow-none"
      >
        {zoomedImage && (
          <div className="relative flex items-center justify-center font-poppins">
            {/* CLOSE */}

            <button
              type="button"
              onClick={
                handleCloseZoom
              }
              className="absolute -right-2 -top-12 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition hover:scale-110 hover:bg-black/70 sm:-right-4"
              aria-label="Close zoom"
            >
              <FiX size={22} />
            </button>

            {/* PRODUCT NAME */}

            <div className="absolute -top-12 left-0 max-w-[75%] rounded-lg bg-black/50 px-3 py-2 backdrop-blur-sm">
              <p className="truncate text-xs font-semibold text-white sm:text-sm">
                {zoomedImage.name}
              </p>
            </div>

            {/* IMAGE */}

            <div
              className="relative max-h-[80vh] max-w-[85vw] cursor-zoom-out"
              onClick={
                handleCloseZoom
              }
            >
              <img
                src={zoomedImage.url}
                alt={zoomedImage.name}
                className="max-h-[78vh] max-w-[82vw] rounded-2xl object-contain shadow-2xl"
                onError={(event) => {
                  const target =
                    event.target as HTMLImageElement;

                  target.style.display =
                    "none";
                }}
              />
            </div>

            {/* HINT */}

            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-center text-[10px] text-white/60 sm:text-xs">
              Click anywhere to close •
              ESC to exit
            </div>
          </div>
        )}
      </GlobalModal>
    </>
  );
};

export default ProductTable;