
import React, { useEffect, useState } from "react";

import {
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiEye,
  FiImage,
  FiPackage,
  FiX,
  FiZoomIn,
} from "react-icons/fi";

import { Product } from "@/types/product";

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
    checked: boolean
  ) => void;

  trendingLoadingId: number | null;

  // Publish / Unpublish
  onPublishToggle: (
    product: Product,
    isPublished: boolean
  ) => void;

  publishLoadingId: number | null;

  onDelete?: (product: Product) => void;
}

// =====================================================
// STATUS HELPERS
// =====================================================

const getPublishStatusClass = (
  published: boolean
) => {
  return published
    ? "border-[#163F20]/20 bg-[#EAF3EA] text-[#163F20]"
    : "border-[#C23B32]/20 bg-[#FBEAEA] text-[#C23B32]";
};

const getStockClass = (
  isLowStock: boolean,
  stock: number
) => {
  if (stock <= 0) {
    return "border-[#C23B32]/20 bg-[#FBEAEA] text-[#C23B32]";
  }

  if (isLowStock) {
    return "border-[#A06F13]/20 bg-[#FFF6E8] text-[#A06F13]";
  }

  return "border-[#163F20]/15 bg-[#EAF3EA] text-[#163F20]";
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
}) => {
  const ITEMS_PER_PAGE = 10;

  // ===================================================
  // IMAGE ZOOM STATE
  // ===================================================

  const [
    zoomedImage,
    setZoomedImage,
  ] = useState<{
    url: string;
    name: string;
  } | null>(null);

  // ===================================================
  // PAGINATION
  // ===================================================

  const getPaginationPages = () => {
    if (totalPages <= 5) {
      return Array.from(
        {
          length: totalPages,
        },
        (_, index) =>
          index + 1
      );
    }

    if (currentPage <= 3) {
      return [
        1,
        2,
        3,
        4,
        5,
      ];
    }

    if (
      currentPage >=
      totalPages - 2
    ) {
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
    productName: string
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
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        handleCloseZoom();
      }
    };

    document.addEventListener(
      "keydown",
      handleEsc
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEsc
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
          TABLE CARD
      ================================================= */}

      <div className="overflow-hidden bg-white">
        {/* TOP ACCENT */}

        <div className="h-[3px] w-full bg-gradient-to-r from-[#8FC199] via-[#163F20] to-[#0F3219]" />

        {/* =================================================
            TABLE
        ================================================= */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse">
            {/* =================================================
                TABLE HEADER
            ================================================= */}

            <thead>
              <tr className="bg-[#163F20] text-left">
                {/* S.NO */}

                <th className="whitespace-nowrap px-5 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                  S.No
                </th>

                {/* IMAGE */}

                <th className="whitespace-nowrap px-5 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                  Image
                </th>

                {/* PRODUCT */}

                <th className="whitespace-nowrap px-5 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                  Product
                </th>

                {/* SKU */}

                <th className="whitespace-nowrap px-5 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                  SKU
                </th>

                {/* RETAIL PRICE */}

                <th className="whitespace-nowrap px-5 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                  Retail Price
                </th>

                {/* STOCK */}

                <th className="whitespace-nowrap px-5 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                  Stock
                </th>

                {/* STATUS */}

                <th className="whitespace-nowrap px-5 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                  Status
                </th>

                {/* TRENDING */}

                <th className="whitespace-nowrap px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                  Trending
                </th>

                {/* ACTIONS */}

                <th className="whitespace-nowrap px-5 py-4 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
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
                    colSpan={9}
                    className="px-5 py-16 text-center"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-4 flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#163F20]">
                        <FiPackage
                          size={22}
                        />
                      </div>

                      <p className="text-sm font-bold text-[#202721]">
                        Loading products...
                      </p>

                      <p className="mt-1 text-xs text-[#9AA29C]">
                        Please wait while we fetch
                        your product inventory.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : products.length ===
                0 ? (
                /* =================================================
                   EMPTY
                ================================================= */

                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-16 text-center"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#163F20]/10 bg-[#EAF3EA] text-[#163F20]">
                        <FiPackage
                          size={24}
                        />
                      </div>

                      <p className="text-sm font-bold text-[#202721]">
                        No products found
                      </p>

                      <p className="mt-1 max-w-sm text-xs text-[#9AA29C]">
                        There are no products
                        matching your current
                        search or filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                /* =================================================
                   PRODUCTS
                ================================================= */

                products.map(
                  (product, index) => {
                    // =================================================
                    // SERIAL NUMBER
                    // =================================================

                    const serialNumber =
                      (currentPage - 1) *
                        ITEMS_PER_PAGE +
                      index +
                      1;

                    // =================================================
                    // PRIMARY IMAGE
                    // =================================================

                    const primaryImage =
                      product.images?.find(
                        (image) =>
                          image.is_primary ===
                          true
                      ) ||
                      product.images?.[0];

                    // =================================================
                    // STOCK
                    // =================================================

                    const stock =
                      Number(
                        product.stock_quantity ||
                          0
                      );

                    const lowStockThreshold =
                      Number(
                        product.low_stock_threshold ||
                          0
                      );

                    const isLowStock =
                      stock <=
                      lowStockThreshold;

                    // =================================================
                    // PUBLISH STATUS
                    // =================================================

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
                        rawPublished
                      ) === 1;

                    const isPublishLoading =
                      publishLoadingId ===
                      product.id;

                    // =================================================
                    // TRENDING
                    // =================================================

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
                        rawTrending
                      ) === 1;

                    const isTrendingLoading =
                      trendingLoadingId ===
                      product.id;

                    return (
                      <tr
                        key={
                          product.id
                        }
                        className="group border-b border-[#163F20]/10 bg-white transition-all duration-200 hover:bg-[#FAFBFA]"
                      >
                        {/* =================================================
                            S.NO
                        ================================================= */}

                        <td className="px-5 py-4">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF3EA] text-xs font-bold text-[#163F20]">
                            {
                              serialNumber
                            }
                          </span>
                        </td>

                        {/* =================================================
                            IMAGE
                        ================================================= */}

                        <td className="px-5 py-4">
                          {primaryImage ? (
                            <div
                              className="relative h-[58px] w-[58px] cursor-pointer overflow-hidden rounded-xl border border-[#163F20]/15 bg-[#F5F7F5] p-0.5 transition-all duration-200 group-hover:border-[#163F20]/35 group-hover:shadow-lg"
                              onClick={() =>
                                handleImageClick(
                                  primaryImage.image_url,
                                  product.name
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
                                  event
                                ) => {
                                  const target =
                                    event.target as HTMLImageElement;

                                  target.style.display =
                                    "none";
                                }}
                              />

                              {/* ZOOM OVERLAY */}

                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/30">
                                <FiZoomIn
                                  size={18}
                                  className="scale-0 text-white opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex h-[58px] w-[58px] items-center justify-center rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] text-[#163F20]">
                              <FiImage
                                size={21}
                              />
                            </div>
                          )}
                        </td>

                        {/* =================================================
                            PRODUCT
                        ================================================= */}

                        <td className="px-5 py-4">
                          <div className="max-w-[250px]">
                            <p className="truncate text-sm font-bold text-[#202721]">
                              {
                                product.name
                              }
                            </p>

                            <p className="mt-1 truncate text-[10px] leading-5 text-[#9AA29C]">
                              {product.description ||
                                "No description available"}
                            </p>
                          </div>
                        </td>

                        {/* =================================================
                            SKU
                        ================================================= */}

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-lg border border-[#163F20]/10 bg-[#F5F7F5] px-3 py-1.5 font-mono text-[10px] font-semibold tracking-wide text-[#59645C]">
                            {product.product_code ||
                              "-"}
                          </span>
                        </td>

                        {/* =================================================
                            RETAIL PRICE
                        ================================================= */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] font-bold text-[#163F20]">
                              ₹
                            </span>

                            <span className="text-sm font-bold text-[#202721]">
                              {Number(
                                product.retail_price ||
                                  0
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </span>
                          </div>
                        </td>

                        {/* =================================================
                            STOCK
                        ================================================= */}

                        <td className="px-5 py-4">
                          <span
                            className={`inline - flex min - w - [55px] items - center justify - center rounded - full border px - 3 py - 1.5 text - [10px] font - bold ${
  getStockClass(
    isLowStock,
    stock
  )
} `}
                          >
                            {stock <= 0
                              ? "Out"
                              : stock}
                          </span>
                        </td>

                        {/* =================================================
                            PUBLISH STATUS
                        ================================================= */}

                        <td className="px-5 py-4">
                          <div className="relative">
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
                                event
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
                                    nextPublished
                                  );
                                }
                              }}
                              className={`h - 9 min - w - [112px] max - w - [112px] appearance - none rounded - full border px - 3 pr - 7 text - [10px] font - bold outline - none transition - all duration - 200 disabled: cursor - not - allowed disabled: opacity - 60 ${
  getPublishStatusClass(
    isPublished
  )
} focus: border - [#163F20] focus: ring - 2 focus: ring - [#163F20] / 10`}
                            >
                              <option value="published">
                                Published
                              </option>

                              <option value="unpublished">
                                Unpublished
                              </option>
                            </select>

                            {/* ARROW / LOADER */}

                            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
                              {isPublishLoading ? (
                                <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              ) : (
                                <svg
                                  width="11"
                                  height="11"
                                  viewBox="0 0 12 12"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M3 4.5L6 7.5L9 4.5"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </span>
                          </div>
                        </td>

                        {/* =================================================
                            TRENDING
                        ================================================= */}

                        <td className="px-5 py-4">
                          <div className="flex justify-center">
                            <label
                              className={`relative inline - flex items - center ${
  isTrendingLoading
    ? "cursor-wait"
    : "cursor-pointer"
} `}
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
                                  event
                                ) =>
                                  onTrendingToggle(
                                    product,
                                    event
                                      .target
                                      .checked
                                  )
                                }
                                className="peer sr-only"
                              />

                              {/* TOGGLE */}

                              <div
                                className={`relative h - 7 w - 12 rounded - full border transition - all duration - 200 ${
  isTrending
    ? "border-[#163F20] bg-gradient-to-r from-[#4C8A57] to-[#163F20]"
    : "border-[#D8E2D8] bg-[#EEF2EE]"
} peer - focus: outline - none peer - focus: ring - 2 peer - focus: ring - [#163F20] / 20`}
                              >
                                <span
                                  className={`absolute top - [3px] h - 5 w - 5 rounded - full bg - white shadow - sm transition - all duration - 200 ${
  isTrending
    ? "left-[23px]"
    : "left-[3px]"
} `}
                                />
                              </div>

                              {/* LOADING */}

                              {isTrendingLoading && (
                                <span className="absolute inset-0 flex items-center justify-center">
                                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#163F20]/25 border-t-[#163F20]" />
                                </span>
                              )}
                            </label>
                          </div>
                        </td>

                        {/* =================================================
                            ACTIONS
                        ================================================= */}

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-1.5">
                            {/* VIEW */}

                            <button
                              type="button"
                              onClick={() =>
                                onView(
                                  product
                                )
                              }
                              className="group/view flex h-9 w-9 items-center justify-center rounded-xl border border-[#163F20]/15 bg-[#F5F7F5] text-[#163F20] transition-all duration-200 hover:border-[#163F20] hover:bg-[#163F20] hover:text-white"
                              title="View Product"
                            >
                              <FiEye
                                size={15}
                                className="transition-transform group-hover/view:scale-110"
                              />
                            </button>

                            {/* EDIT */}

                            <button
                              type="button"
                              onClick={() =>
                                onEdit(
                                  product
                                )
                              }
                              className="group/edit flex h-9 w-9 items-center justify-center rounded-xl border border-[#163F20]/15 bg-white text-[#163F20] transition-all duration-200 hover:border-[#163F20] hover:bg-[#163F20] hover:text-white"
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
                  }
                )
              )}
            </tbody>
          </table>
        </div>

        {/* =================================================
            PAGINATION
        ================================================= */}

        {totalEntries > 0 && (
          <div className="border-t border-[#163F20]/10 bg-[#FAFBFA] px-4 py-4 sm:px-5">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              {/* ENTRY INFO */}

              <div className="text-center sm:text-left">
                <p className="text-xs text-[#89918B]">
                  Showing{" "}
                  <span className="font-bold text-[#3F4A41]">
                    {startEntry}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-[#3F4A41]">
                    {endEntry}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-[#3F4A41]">
                    {totalEntries}
                  </span>{" "}
                  entries
                </p>
              </div>

              {/* PAGINATION */}

              <div className="flex items-center gap-1.5">
                {/* PREVIOUS */}

                <button
                  type="button"
                  disabled={
                    currentPage ===
                    1
                  }
                  onClick={() =>
                    onPageChange(
                      currentPage - 1
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#163F20]/15 bg-white text-[#163F20] transition hover:border-[#163F20]/30 hover:bg-[#EAF3EA] disabled:cursor-not-allowed disabled:opacity-30"
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
                        onPageChange(
                          page
                        )
                      }
                      className={`flex h - 9 min - w - 9 items - center justify - center rounded - lg px - 3 text - xs font - bold transition - all ${
  currentPage ===
    page
    ? "bg-gradient-to-br from-[#4C8A57] to-[#163F20] text-white shadow-[0_6px_14px_-6px_rgba(22,63,32,0.5)]"
    : "border border-transparent text-[#59645C] hover:border-[#163F20]/15 hover:bg-[#F5F7F5] hover:text-[#163F20]"
} `}
                    >
                      {page}
                    </button>
                  )
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
                      currentPage + 1
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#163F20]/15 bg-white text-[#163F20] transition hover:border-[#163F20]/30 hover:bg-[#EAF3EA] disabled:cursor-not-allowed disabled:opacity-30"
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
          <div className="relative flex items-center justify-center">
            {/* CLOSE BUTTON */}

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
                alt={
                  zoomedImage.name
                }
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
              Click anywhere to close • ESC to
              exit
            </div>
          </div>
        )}
      </GlobalModal>
    </>
  );
};

export default ProductTable;

