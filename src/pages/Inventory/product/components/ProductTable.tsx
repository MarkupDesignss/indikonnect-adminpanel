import React, { useEffect, useState } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiEye,
  FiImage,
  FiPackage,
  FiStar,
  FiTrash2,
  FiTrendingUp,
  FiTag,
  FiX,
  FiZoomIn,
} from "react-icons/fi";

import type { Product } from "@/types/product";
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
  onTrendingToggle: (product: Product, checked: boolean) => void;
  trendingLoadingId: number | null;
  onDealToggle: (product: Product, checked: boolean) => void;
  dealLoadingId: number | null;
  onBestSellerToggle: (product: Product, checked: boolean) => void;
  bestSellerLoadingId: number | null;
  onPublishToggle: (product: Product, isPublished: boolean) => void;
  publishLoadingId: number | null;
  onSetPrimaryImage?: (product: Product, imageId: number) => void;
  setPrimaryLoadingId?: number | null;
  onDelete?: (product: Product) => void;
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canPublish?: boolean;
  canToggleTrending?: boolean;
  canToggleDeal?: boolean;
  canToggleBestSeller?: boolean;
  canSetPrimaryImage?: boolean;
  highlightedProductId?: number | null;
}

const ITEMS_PER_PAGE = 10;
type FlagValue = boolean | number | string | null | undefined;

const isEnabled = (value: FlagValue): boolean =>
  value === true || value === 1 || value === "1" || (typeof value === "string" && value.toLowerCase() === "true");

const getProductFlag = (product: Product, key: string): boolean =>
  isEnabled((product as any)?.[key] as FlagValue);

const isPrimaryImage = (image: { is_primary?: FlagValue }) => isEnabled(image?.is_primary);

const isPrimaryProduct = (product: Product): boolean => {
  const productFlag = (product as Product & { is_primary?: FlagValue }).is_primary;
  if (productFlag !== undefined && productFlag !== null) return isEnabled(productFlag);
  return (product.images ?? []).some(isPrimaryImage);
};

const publishClass = (published: boolean) =>
  published
    ? "border-[#2D6FE8]/25 bg-[#EAF3FF] text-[#2D6FE8]"
    : "border-[#D6E2F0] bg-[#F3F6FB] text-[#6B7280]";

const stockClass = (stock: number, threshold: number) => {
  if (stock <= 0) return "border-red-200 bg-red-50 text-red-600";
  if (stock <= threshold) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-blue-100 bg-blue-50 text-blue-700";
};

const resetBodyScrollLock = () => {
  if (typeof document === "undefined") return;
  document.body.style.overflow = "";
  document.body.style.overflowY = "";
  document.body.style.paddingRight = "";
  document.documentElement.style.overflow = "";
};

interface SlimSwitchProps {
  checked: boolean;
  disabled?: boolean;
  loading?: boolean;
  title: string;
  onChange: (checked: boolean) => void;
  activeColor?: "blue" | "teal" | "yellow";
}

/** Small, thin toggle used in the table and mobile product cards. */
const SlimSwitch: React.FC<SlimSwitchProps> = ({
  checked,
  disabled = false,
  loading = false,
  title,
  onChange,
  activeColor = "blue",
}) => {
  const activeTrack =
    activeColor === "teal"
      ? "border-teal-600 bg-teal-500"
      : activeColor === "yellow"
        ? "border-amber-500 bg-amber-400"
        : "border-[#2D6FE8] bg-[#3B82F6]";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={title}
      title={title}
      disabled={disabled || loading}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border p-[2px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#2D6FE8]/20 disabled:cursor-not-allowed disabled:opacity-60 ${checked ? activeTrack : "border-[#D6E2F0] bg-[#EEF2F9]"
        }`}
    >
      <span
        className={`block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "translate-x-[16px]" : "translate-x-0"
          }`}
      />
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/65">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#2D6FE8]/25 border-t-[#2D6FE8]" />
        </span>
      )}
    </button>
  );
};

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
  onTrendingToggle,
  trendingLoadingId,
  onDealToggle,
  dealLoadingId,
  onBestSellerToggle,
  bestSellerLoadingId,
  onPublishToggle,
  publishLoadingId,
  onSetPrimaryImage,
  setPrimaryLoadingId = null,
  onDelete,
  canView = true,
  canEdit = false,
  canDelete = false,
  canPublish = false,
  canToggleTrending = false,
  canToggleDeal = false,
  canToggleBestSeller = false,
  canSetPrimaryImage = false,
  highlightedProductId = null,
}) => {
  const [zoomedImage, setZoomedImage] = useState<{ url: string; name: string } | null>(null);
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const hasAnyAction = canView || canEdit || canDelete;

  const paginationPages = safeTotalPages <= 5
    ? Array.from({ length: safeTotalPages }, (_, i) => i + 1)
    : currentPage <= 3
      ? [1, 2, 3, 4, 5]
      : currentPage >= safeTotalPages - 2
        ? [safeTotalPages - 4, safeTotalPages - 3, safeTotalPages - 2, safeTotalPages - 1, safeTotalPages]
        : [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomedImage(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (zoomedImage) document.body.style.overflow = "hidden";
    else resetBodyScrollLock();
    return () => resetBodyScrollLock();
  }, [zoomedImage]);

  const openZoom = (url?: string, name?: string) => {
    if (url) setZoomedImage({ url, name: name || "Product image" });
  };

  const renderActions = (product: Product, compact = false) => (
    <div className={`flex items-center ${compact ? "gap-1.5" : "justify-center gap-1"}`}>
      {canView && (
        <button type="button" onClick={() => onView(product)} title="View product" className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-[#2D6FE8] transition hover:bg-[#2D6FE8] hover:text-white">
          <FiEye size={14} />
        </button>
      )}
      {canEdit && (
        <button type="button" onClick={() => onEdit(product)} title="Edit product" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-[#2D6FE8] hover:bg-[#2D6FE8] hover:text-white">
          <FiEdit2 size={14} />
        </button>
      )}
      {canDelete && (
        <button type="button" onClick={() => onDelete?.(product)} title="Delete product" className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white">
          <FiTrash2 size={14} />
        </button>
      )}
    </div>
  );

  const renderLoadingOrEmpty = () => (
    <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#2D6FE8]">
        {loading ? <FiPackage className="animate-pulse" size={22} /> : <FiPackage size={22} />}
      </div>
      <p className="text-sm font-semibold text-slate-900">{loading ? "Loading products..." : "No products found"}</p>
      <p className="mt-1 max-w-sm text-xs text-slate-500">{loading ? "Please wait while we fetch your product inventory." : "There are no products matching your current search or filter."}</p>
    </div>
  );
  return (
    <>
      {/* Same table on desktop, tablet and mobile.
          Narrow screens par horizontal scroll aayega. */}
      <div className="w-full max-w-full overflow-x-auto overscroll-x-contain bg-white">
        <table className="w-full min-w-[1120px] table-fixed border-collapse">
          <colgroup>
            <col style={{ width: "4%" }} />
            <col style={{ width: "6%" }} />
            <col style={{ width: "17%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "6%" }} />
            <col style={{ width: "10%" }} />

            {canToggleTrending && <col style={{ width: "7%" }} />}

            <col style={{ width: "7%" }} />

            {canToggleBestSeller && <col style={{ width: "8%" }} />}

            {canToggleDeal && <col style={{ width: "8%" }} />}

            {hasAnyAction && <col style={{ width: "10%" }} />}
          </colgroup>

          <thead>
            <tr className="bg-[#4F8FF7] text-left">
              {[
                "S.No",
                "Image",
                "Product",
                "SKU",
                "Retail Price",
                "Stock",
                "Status",
              ].map((title) => (
                <th
                  key={title}
                  className="whitespace-nowrap px-3 py-3.5 text-[11px] font-bold uppercase tracking-wide text-white"
                >
                  {title}
                </th>
              ))}

              {canToggleTrending && (
                <th className="whitespace-nowrap px-2 py-3.5 text-center text-[10px] font-bold uppercase tracking-wide text-white">
                  Trending
                </th>
              )}

              <th className="whitespace-nowrap px-2 py-3.5 text-center text-[10px] font-bold uppercase tracking-wide text-white">
                Primary
              </th>

              {canToggleBestSeller && (
                <th className="whitespace-nowrap px-2 py-3.5 text-center text-[10px] font-bold uppercase tracking-wide text-white">
                  Best Seller
                </th>
              )}

              {canToggleDeal && (
                <th className="whitespace-nowrap px-2 py-3.5 text-center text-[10px] font-bold uppercase tracking-wide text-white">
                  Deal of Day
                </th>
              )}

              {hasAnyAction && (
                <th className="whitespace-nowrap px-2 py-3.5 text-center text-[10px] font-bold uppercase tracking-wide text-white">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {loading || products.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    8 +
                    Number(canToggleTrending) +
                    Number(canToggleBestSeller) +
                    Number(canToggleDeal) +
                    Number(hasAnyAction)
                  }
                >
                  {renderLoadingOrEmpty()}
                </td>
              </tr>
            ) : (
              products.map((product, index) => {
                const rowNumber =
                  (currentPage - 1) * ITEMS_PER_PAGE + index + 1;

                const images = product.images ?? [];
                const image =
                  images.find(isPrimaryImage) ?? images[0];

                const primaryImage = image;
                const isPrimary = isPrimaryProduct(product);
                const isPrimaryLoading =
                  setPrimaryLoadingId === product.id;

                const stock = Number(product.stock_quantity || 0);
                const threshold = Number(
                  product.low_stock_threshold || 0
                );

                const published = getProductFlag(
                  product,
                  "is_published"
                );

                const publishing =
                  publishLoadingId === product.id;

                const isHighlighted =
                  highlightedProductId === product.id;

                return (
                  <tr
                    key={product.id}
                    className={`border-b border-[#DCE6F2] transition-colors hover:bg-[#F7FAFF] ${isHighlighted ? "bg-amber-50" : "bg-white"
                      }`}
                  >
                    {/* S.No */}
                    <td className="px-3 py-3.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-[11px] font-bold text-[#2D6FE8]">
                        {rowNumber}
                      </span>
                    </td>

                    {/* Product Image */}
                    <td className="px-3 py-3.5">
                      {image ? (
                        <button
                          type="button"
                          onClick={() =>
                            openZoom(image.image_url, product.name)
                          }
                          title="Zoom product image"
                          className="group relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                        >
                          <img
                            src={image.image_url}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />

                          <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white transition group-hover:bg-black/35">
                            <FiZoomIn
                              className="opacity-0 group-hover:opacity-100"
                              size={16}
                            />
                          </span>
                        </button>
                      ) : (
                        <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400">
                          <FiImage size={19} />
                        </span>
                      )}
                    </td>

                    {/* Product Name & Description */}
                    <td className="px-3 py-3.5">
                      <p
                        className="truncate text-[12px] font-semibold text-slate-900"
                        title={product.name}
                      >
                        {product.name}
                      </p>

                      <p
                        className="mt-1 truncate text-[11px] leading-4 text-slate-500"
                        title={product.description || ""}
                      >
                        {product.description || "No description"}
                      </p>
                    </td>

                    {/* SKU */}
                    <td className="px-3 py-3.5">
                      <span
                        className="block truncate rounded-md bg-slate-50 px-2 py-1.5 font-mono text-[11px] text-slate-700"
                        title={product.product_code || "-"}
                      >
                        {product.product_code || "-"}
                      </span>
                    </td>

                    {/* Retail Price */}
                    <td className="whitespace-nowrap px-3 py-3.5">
                      <span className="text-[12px] font-bold text-slate-900">
                        ₹
                        {Number(
                          product.retail_price || 0
                        ).toLocaleString("en-IN")}
                      </span>
                    </td>

                    {/* Stock */}
                    <td className="px-3 py-3.5">
                      <span
                        className={`inline-flex min-w-10 justify-center whitespace-nowrap rounded-full border px-2 py-1.5 text-[11px] font-semibold ${stockClass(
                          stock,
                          threshold
                        )}`}
                      >
                        {stock <= 0 ? "Out" : stock}
                      </span>
                    </td>

                    {/* Publishing Status */}
                    <td className="px-3 py-3.5">
                      {canPublish ? (
                        <select
                          value={
                            published ? "published" : "unpublished"
                          }
                          disabled={publishing}
                          onChange={(event) =>
                            onPublishToggle(
                              product,
                              event.target.value === "published"
                            )
                          }
                          className={`h-8 w-full rounded-full border px-2 text-[10px] font-bold outline-none disabled:opacity-60 ${publishClass(
                            published
                          )}`}
                        >
                          <option value="published">
                            Published
                          </option>
                          <option value="unpublished">
                            Unpublished
                          </option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full border px-2 py-1.5 text-[10px] font-bold ${publishClass(
                            published
                          )}`}
                        >
                          {published ? "Published" : "Unpublished"}
                        </span>
                      )}
                    </td>

                    {/* Trending */}
                    {canToggleTrending && (
                      <td className="px-2 py-3.5">
                        <div className="flex justify-center">
                          <SlimSwitch
                            checked={getProductFlag(
                              product,
                              "is_trending"
                            )}
                            loading={
                              trendingLoadingId === product.id
                            }
                            title="Toggle Trending"
                            onChange={(checked) =>
                              onTrendingToggle(product, checked)
                            }
                          />
                        </div>
                      </td>
                    )}

                    {/* Primary Image */}
                    <td className="px-2 py-3.5">
                      <div className="flex justify-center">
                        {canSetPrimaryImage &&
                          onSetPrimaryImage &&
                          primaryImage ? (
                          <button
                            type="button"
                            disabled={isPrimary || isPrimaryLoading}
                            onClick={() =>
                              onSetPrimaryImage(
                                product,
                                primaryImage.id
                              )
                            }
                            title={
                              isPrimary
                                ? "Primary image selected"
                                : "Set primary image"
                            }
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-default ${isPrimary
                                ? "border-amber-300 bg-amber-50 text-amber-500"
                                : "border-slate-200 bg-slate-50 text-slate-400 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-500"
                              }`}
                          >
                            {isPrimaryLoading ? (
                              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-300 border-t-amber-600" />
                            ) : (
                              <FiStar
                                className={
                                  isPrimary ? "fill-current" : ""
                                }
                                size={17}
                              />
                            )}
                          </button>
                        ) : (
                          <span
                            title={
                              isPrimary
                                ? "Primary image"
                                : "Not primary"
                            }
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border ${isPrimary
                                ? "border-amber-300 bg-amber-50 text-amber-500"
                                : "border-slate-200 bg-slate-50 text-slate-400"
                              }`}
                          >
                            <FiStar
                              className={
                                isPrimary ? "fill-current" : ""
                              }
                              size={17}
                            />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Best Seller */}
                    {canToggleBestSeller && (
                      <td className="px-2 py-3.5">
                        <div className="flex items-center justify-center gap-2">
                         

                          <SlimSwitch
                            checked={getProductFlag(
                              product,
                              "is_best_seller"
                            )}
                            loading={
                              bestSellerLoadingId === product.id
                            }
                            title="Toggle Best Seller"
                            activeColor="yellow"
                            onChange={(checked) =>
                              onBestSellerToggle(product, checked)
                            }
                          />
                        </div>
                      </td>
                    )}

                    {/* Deal of the Day */}
                    {canToggleDeal && (
                      <td className="px-2 py-3.5">
                        <div className="flex justify-center">
                          <SlimSwitch
                            checked={getProductFlag(
                              product,
                              "is_deal_of_the_day"
                            )}
                            loading={dealLoadingId === product.id}
                            title="Toggle Deal of the Day"
                            activeColor="teal"
                            onChange={(checked) =>
                              onDealToggle(product, checked)
                            }
                          />
                        </div>
                      </td>
                    )}

                    {/* Actions */}
                    {hasAnyAction && (
                      <td className="px-2 py-3.5">
                        {renderActions(product)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalEntries > 0 && (
        <div className="border-t border-[#DCE6F2] bg-[#F8FBFF] px-3 py-3 sm:px-5">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-center text-[12px] text-slate-600 sm:text-left">
              Showing{" "}
              <span className="font-bold text-slate-900">
                {startEntry}
              </span>{" "}
              to{" "}
              <span className="font-bold text-slate-900">
                {endEntry}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-900">
                {totalEntries}
              </span>{" "}
              entries
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1 || loading}
                onClick={() => onPageChange(currentPage - 1)}
                aria-label="Previous page"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-35"
              >
                <FiChevronLeft size={17} />
              </button>

              {paginationPages.map((page) => (
                <button
                  key={page}
                  type="button"
                  disabled={loading}
                  onClick={() => onPageChange(page)}
                  className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[12px] font-bold ${currentPage === page
                      ? "bg-[#2D6FE8] text-white"
                      : "border border-transparent text-slate-700 hover:bg-blue-50"
                    }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage >= safeTotalPages || loading}
                onClick={() => onPageChange(currentPage + 1)}
                aria-label="Next page"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-35"
              >
                <FiChevronRight size={17} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      <GlobalModal
        isOpen={Boolean(zoomedImage)}
        onClose={() => setZoomedImage(null)}
        closeOnOverlayClick
        className="!max-h-[90vh] !max-w-[90vw] !bg-transparent !shadow-none"
      >
        {zoomedImage && (
          <div className="relative flex items-center justify-center">
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              aria-label="Close image preview"
              className="absolute -right-2 -top-12 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white"
            >
              <FiX size={20} />
            </button>

            <div className="absolute -top-11 left-0 max-w-[75%] rounded-lg bg-black/60 px-3 py-2">
              <p className="truncate text-xs font-semibold text-white">
                {zoomedImage.name}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="cursor-zoom-out"
            >
              <img
                src={zoomedImage.url}
                alt={zoomedImage.name}
                className="max-h-[78vh] max-w-[82vw] rounded-xl object-contain shadow-2xl"
              />
            </button>
          </div>
        )}
      </GlobalModal>
    </>
  );
};

export default ProductTable;
