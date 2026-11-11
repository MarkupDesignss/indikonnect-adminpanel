import React, { useEffect, useState } from "react";
import {
    FiX,
    FiImage,
    FiTag,
    FiPackage,
    FiBox,
    FiEye,
    FiTrendingUp,
    FiActivity,
    FiLayers,
    FiRefreshCw,
    FiShoppingCart,
    FiRotateCcw,
    FiXCircle,
    FiCheckCircle,
    FiAlertTriangle,
    FiClock,
    FiHeart,
    FiTarget,
    FiStar,
} from "react-icons/fi";
import { SelectOption } from "@/types/product";
import { RiMoneyRupeeCircleLine } from "react-icons/ri";

interface ViewProductModalProps {
    open: boolean;
    product: any;
    categories: SelectOption[];
    taxCategories: SelectOption[];
    onClose: () => void;
}

const ViewProductModal: React.FC<ViewProductModalProps> = ({
    open,
    product,
    categories,
    taxCategories,
    onClose,
}) => {
    const [productData, setProductData] = useState<any>(null);

    useEffect(() => {
        if (product && open) {
            setProductData(product);
        }
    }, [product, open]);

    if (!open || !productData) return null;

    // Helper functions
    const getCategoryName = (id: number) => {
        const category = categories.find((c) => Number(c.id) === id);
        return category ? category.name : "N/A";
    };

    const getTaxCategoryName = (id: number) => {
        const tax = taxCategories.find((t) => Number(t.id) === id);
        return tax ? tax.name : "N/A";
    };

    const getStatusClass = (status: boolean) => {
        return status
            ? "bg-green-100 text-green-800 border-green-300"
            : "bg-yellow-100 text-yellow-800 border-yellow-300";
    };

    const formatCurrency = (amount: number | string) => {
        if (amount === null || amount === undefined || amount === "") return "₹0.00";
        const num = Number(amount);
        if (Number.isNaN(num)) return "₹0.00";
        return `₹${num.toFixed(2)}`;
    };

    const formatDate = (date: string) => {
        if (!date) return "N/A";
        try {
            return new Date(date).toLocaleString("en-IN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
        } catch {
            return "N/A";
        }
    };

    // Parse specification if it's a JSON string
    const parseSpecification = (spec: string) => {
        if (!spec) return null;
        try {
            return JSON.parse(spec);
        } catch {
            return spec;
        }
    };

    const specData = parseSpecification(productData.specification);

    // Stock helpers
    const stockMovement = productData.stock_movement || {};

    const getStockStatusConfig = (status: string) => {
        const normalized = String(status || "").toLowerCase();
        if (normalized === "active") {
            return {
                label: "Active",
                className: "bg-green-100 text-green-700 border-green-200",
                icon: <FiCheckCircle size={14} />,
            };
        }
        if (normalized === "low_stock") {
            return {
                label: "Low Stock",
                className: "bg-orange-100 text-orange-700 border-orange-200",
                icon: <FiAlertTriangle size={14} />,
            };
        }
        if (normalized === "out_of_stock") {
            return {
                label: "Out of Stock",
                className: "bg-red-100 text-red-700 border-red-200",
                icon: <FiXCircle size={14} />,
            };
        }
        return {
            label: status || "N/A",
            className: "bg-gray-100 text-gray-700 border-gray-200",
            icon: <FiActivity size={14} />,
        };
    };

    const stockStatusConfig = getStockStatusConfig(productData.stock_status);

    const getStockLevelClass = () => {
        const qty = Number(productData.stock_quantity) || 0;
        const threshold = Number(productData.low_stock_threshold) || 0;
        if (qty === 0) return "text-red-600";
        if (threshold > 0 && qty <= threshold) return "text-orange-600";
        return "text-green-600";
    };

    const getSaleTypeLabel = (type: string) => {
        if (!type) return "N/A";
        return type
            .split("_")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
    };

    // ===================================================
    // BOOLEAN NORMALIZER
    // ===================================================

    const toBool = (value: any): boolean => {
        return (
            value === true ||
            value === 1 ||
            value === "1" ||
            value === "true" ||
            value === "TRUE"
        );
    };

    const isPublished = toBool(productData.is_published);
    const isTrending = toBool(productData.is_trending);
    const isWishlisted = toBool(productData.is_wishlisted);
    const isDealOfTheDay = toBool(productData.is_deal_of_the_day);
    const isActiveDeal = toBool(productData.is_active_deal);

    // ===================================================
    // PRODUCT TYPE
    // ===================================================
    const productType = String(productData.product_type || "single").toLowerCase();
    const isCombo = productType === "combo";

    // ===================================================
    // COMBO PRODUCTS
    // ===================================================
    const comboProducts: any[] = Array.isArray(productData.combo_products)
        ? productData.combo_products
        : [];

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
                <div
                    className="relative w-full max-w-4xl my-8 bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                >
                    {/* Header - Fixed */}
                    <div className="flex-shrink-0 flex items-center justify-between border-b border-gray-200 px-6 py-5 bg-white rounded-t-2xl">
                        <div>
                            <h2
                                id="modal-title"
                                className="font-semibold text-xl text-gray-900 flex items-center gap-2"
                            >
                                Product Details
                                <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                        isCombo
                                            ? "bg-purple-100 text-purple-700 border border-purple-300"
                                            : "bg-slate-100 text-slate-600 border border-slate-300"
                                    }`}
                                >
                                    {isCombo ? (
                                        <>
                                            <FiLayers size={11} /> Combo
                                        </>
                                    ) : (
                                        <>
                                            <FiPackage size={11} /> Individual
                                        </>
                                    )}
                                </span>
                            </h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                View complete product information
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors duration-200"
                            aria-label="Close modal"
                        >
                            <FiX size={21} className="text-gray-600" />
                        </button>
                    </div>

                    {/* Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Product Images */}
                        {productData.images && productData.images.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <FiImage className="text-gray-500" size={18} />
                                    <h3 className="font-semibold text-gray-900">
                                        Product Images
                                    </h3>
                                    <span className="ml-auto text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                        {productData.images.length} image
                                        {productData.images.length !== 1 ? "s" : ""}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                    {productData.images.map((img: any, index: number) => (
                                        <div
                                            key={img.id || index}
                                            className="relative rounded-lg border border-gray-200 overflow-hidden bg-gray-50 aspect-square"
                                        >
                                            <img
                                                src={
                                                    img.image_url ||
                                                    "https://via.placeholder.com/150x150?text=No+Image"
                                                }
                                                alt={`Product ${index + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src =
                                                        "https://via.placeholder.com/150x150?text=No+Image";
                                                }}
                                            />
                                            {img.is_primary && (
                                                <span className="absolute top-2 left-2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                                                    Primary
                                                </span>
                                            )}
                                            {img.sort_order !== undefined && (
                                                <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                                                    #{img.sort_order}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Basic Information */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <FiPackage className="text-gray-500" size={18} />
                                <h3 className="font-semibold text-gray-900">
                                    Basic Information
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Product Name
                                    </label>
                                    <p className="text-sm font-medium text-gray-900 mt-1">
                                        {productData.name || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        SKU / Product Code
                                    </label>
                                    <p className="text-sm font-medium text-gray-900 mt-1">
                                        {productData.product_code || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Slug
                                    </label>
                                    <p className="text-sm font-medium text-gray-900 mt-1 break-all">
                                        {productData.slug || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Status
                                    </label>
                                    <span
                                        className={`inline-flex mt-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusClass(
                                            isPublished,
                                        )}`}
                                    >
                                        {isPublished ? "Published" : "Draft"}
                                    </span>
                                </div>

                                {/* ✅ Product Type */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Product Type
                                    </label>
                                    <div className="mt-1">
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                                                isCombo
                                                    ? "bg-purple-100 text-purple-700 border-purple-300"
                                                    : "bg-slate-100 text-slate-700 border-slate-300"
                                            }`}
                                        >
                                            {isCombo ? (
                                                <>
                                                    <FiLayers size={12} /> Combo
                                                </>
                                            ) : (
                                                <>
                                                    <FiPackage size={12} /> Individual
                                                </>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Brand
                                    </label>
                                    <p className="text-sm font-medium text-gray-900 mt-1">
                                        {productData.brand_name || productData.brand?.name || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Ignite Product ID
                                    </label>
                                    <p className="text-sm font-medium text-gray-900 mt-1">
                                        {productData.ignite_product_id ?? "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Commission Value
                                    </label>
                                    <p className="text-sm font-medium text-gray-900 mt-1">
                                        {productData.commission_value
                                            ? formatCurrency(productData.commission_value)
                                            : "N/A"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Categories */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <FiTag className="text-gray-500" size={18} />
                                <h3 className="font-semibold text-gray-900">
                                    Categories
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Category
                                    </label>
                                    <p className="text-sm font-medium text-gray-900 mt-1">
                                        {productData.category?.name ||
                                            getCategoryName(productData.category_id)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Subcategory
                                    </label>
                                    <p className="text-sm font-medium text-gray-900 mt-1">
                                        {productData.subcategory?.name || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Tax Category
                                    </label>
                                    <p className="text-sm font-medium text-gray-900 mt-1">
                                        {productData.tax_category?.name ||
                                            (productData.tax_category_id
                                                ? getTaxCategoryName(productData.tax_category_id)
                                                : "N/A")}
                                        {productData.tax_category?.rate && (
                                            <span className="ml-2 text-xs text-gray-500">
                                                ({productData.tax_category.rate}%)
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ============================================ */}
                        {/* ✅ COMBO PRODUCTS SECTION */}
                        {/* ============================================ */}
                        {isCombo && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <FiLayers className="text-purple-600" size={18} />
                                    <h3 className="font-semibold text-gray-900">
                                        Combo Products
                                    </h3>
                                    <span className="ml-auto text-xs font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                                        {comboProducts.length} product
                                        {comboProducts.length !== 1 ? "s" : ""}
                                    </span>
                                </div>

                                {comboProducts.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                                        No combo products added.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {comboProducts.map((cp: any, idx: number) => {
                                            const primaryImage =
                                                cp?.images?.find((i: any) => i.is_primary)?.image_url ||
                                                cp?.images?.[0]?.image_url ||
                                                "https://via.placeholder.com/80x80?text=No+Image";

                                            const isMandatory = toBool(cp.is_mandatory);

                                            return (
                                                <div
                                                    key={cp.id || idx}
                                                    className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm hover:shadow-md transition-shadow"
                                                >
                                                    <div className="flex gap-3">
                                                        {/* Index */}
                                                        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-purple-50 text-[11px] font-bold text-purple-700">
                                                            {idx + 1}
                                                        </span>

                                                        {/* Image */}
                                                        <img
                                                            src={primaryImage}
                                                            alt={cp.name}
                                                            className="h-16 w-16 flex-shrink-0 rounded-lg border border-gray-200 object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src =
                                                                    "https://via.placeholder.com/80x80?text=No+Image";
                                                            }}
                                                        />

                                                        {/* Details */}
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <p className="truncate text-sm font-semibold text-gray-900">
                                                                    {cp.name || `Product #${cp.id}`}
                                                                </p>
                                                                {isMandatory && (
                                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 border border-amber-300">
                                                                        <FiStar size={9} /> Mandatory
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <p className="mt-0.5 truncate text-xs text-gray-500">
                                                                SKU:{" "}
                                                                <span className="font-medium text-gray-700">
                                                                    {cp.product_code || "N/A"}
                                                                </span>
                                                            </p>

                                                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
                                                                {cp.category?.name && (
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <FiTag size={10} />
                                                                        {cp.category.name}
                                                                    </span>
                                                                )}
                                                                {cp.subcategory?.name && (
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <FiLayers size={10} />
                                                                        {cp.subcategory.name}
                                                                    </span>
                                                                )}
                                                                {cp.brand?.name && (
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <FiPackage size={10} />
                                                                        {cp.brand.name}
                                                                    </span>
                                                                )}
                                                                {cp.tax_category?.name && (
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <FiActivity size={10} />
                                                                        {cp.tax_category.name}
                                                                        {cp.tax_category?.rate && (
                                                                            <span className="text-gray-400">
                                                                                ({cp.tax_category.rate}%)
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Pricing row */}
                                                            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                                                                <div className="rounded-md bg-gray-50 px-2 py-1.5">
                                                                    <p className="text-gray-500">
                                                                        Retail Price
                                                                    </p>
                                                                    <p className="font-semibold text-gray-900">
                                                                        {formatCurrency(cp.retail_price)}
                                                                    </p>
                                                                </div>
                                                                <div className="rounded-md bg-gray-50 px-2 py-1.5">
                                                                    <p className="text-gray-500">
                                                                        Retail MRP
                                                                    </p>
                                                                    <p className="font-semibold text-gray-400 line-through">
                                                                        {formatCurrency(cp.retail_mrp)}
                                                                    </p>
                                                                </div>
                                                                <div className="rounded-md bg-gray-50 px-2 py-1.5">
                                                                    <p className="text-gray-500">
                                                                        Distributor Price
                                                                    </p>
                                                                    <p className="font-semibold text-gray-900">
                                                                        {formatCurrency(cp.distributor_price)}
                                                                    </p>
                                                                </div>
                                                                <div className="rounded-md bg-gray-50 px-2 py-1.5">
                                                                    <p className="text-gray-500">
                                                                        Commission
                                                                    </p>
                                                                    <p className="font-semibold text-emerald-700">
                                                                        {formatCurrency(cp.commission_value)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Specification & Pricing - Side by side */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Specification */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <FiBox className="text-gray-500" size={18} />
                                    <h3 className="font-semibold text-gray-900">
                                        Specification
                                    </h3>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 min-h-[120px]">
                                    {typeof specData === "object" &&
                                        specData !== null &&
                                        Object.keys(specData).length > 0 ? (
                                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                            {Object.entries(specData).map(([key, value]) => (
                                                <div
                                                    key={key}
                                                    className="flex justify-between py-1 border-b border-gray-200 last:border-0"
                                                >
                                                    <span className="text-xs font-medium text-gray-500">
                                                        {key}
                                                    </span>
                                                    <span className="text-sm text-gray-700 text-right ml-4">
                                                        {String(value)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                            {productData.specification &&
                                                productData.specification !== "{}"
                                                ? productData.specification
                                                : "No specification provided"}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Pricing */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <RiMoneyRupeeCircleLine
                                        className="text-gray-500"
                                        size={18}
                                    />
                                    <h3 className="font-semibold text-gray-900">Pricing</h3>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-sm text-gray-600">
                                            Retail Price
                                        </span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {formatCurrency(productData.retail_price)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-sm text-gray-600">
                                            Retail MRP
                                        </span>
                                        <span className="text-sm font-semibold text-gray-400 line-through">
                                            {formatCurrency(productData.retail_mrp)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-sm text-gray-600">
                                            Distributor Price
                                        </span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {formatCurrency(productData.distributor_price)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-sm text-gray-600">
                                            Distributor MRP
                                        </span>
                                        <span className="text-sm font-semibold text-gray-400 line-through">
                                            {formatCurrency(productData.distributor_mrp)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-sm text-gray-600">
                                            Effective Price
                                        </span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {formatCurrency(productData.effective_price)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-sm text-gray-600">
                                            Effective MRP
                                        </span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {formatCurrency(productData.effective_mrp)}
                                        </span>
                                    </div>
                                    {productData.retail_discount_percentage > 0 && (
                                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                            <span className="text-sm text-gray-600">
                                                Discount
                                            </span>
                                            <span className="text-sm font-semibold text-green-600">
                                                {productData.retail_discount_percentage}%
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-sm text-gray-600">Price For</span>
                                        <span className="text-sm font-semibold text-gray-900 capitalize">
                                            {productData.price_for || "N/A"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-gray-600">Sale Type</span>
                                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                            <FiTrendingUp size={12} />
                                            {getSaleTypeLabel(productData.sale_type)}
                                        </span>
                                    </div>

                                    {isDealOfTheDay && (
                                        <div
                                            className={`mt-2 p-3 rounded-lg border ${
                                                isActiveDeal
                                                    ? "bg-green-50 border-green-300"
                                                    : "bg-gray-50 border-gray-300"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-800">
                                                    <FiTarget size={13} />
                                                    Deal of the Day
                                                </span>
                                                <span
                                                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                                        isActiveDeal
                                                            ? "bg-green-600 text-white"
                                                            : "bg-gray-400 text-white"
                                                    }`}
                                                >
                                                    {isActiveDeal ? "Active" : "Inactive"}
                                                </span>
                                            </div>

                                            {productData.deal_of_the_day_starts_at && (
                                                <p className="text-xs text-gray-600 mt-1">
                                                    <span className="font-semibold">
                                                        Starts:
                                                    </span>{" "}
                                                    {formatDate(
                                                        productData.deal_of_the_day_starts_at,
                                                    )}
                                                </p>
                                            )}
                                            {productData.deal_of_the_day_ends_at && (
                                                <p className="text-xs text-gray-600 mt-1">
                                                    <span className="font-semibold">
                                                        Ends:
                                                    </span>{" "}
                                                    {formatDate(
                                                        productData.deal_of_the_day_ends_at,
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* STOCK & INVENTORY */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <FiLayers className="text-gray-500" size={18} />
                                <h3 className="font-semibold text-gray-900">
                                    Stock & Inventory
                                </h3>
                                <span
                                    className={`ml-auto inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${stockStatusConfig.className}`}
                                >
                                    {stockStatusConfig.icon}
                                    {stockStatusConfig.label}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                        <FiBox size={12} />
                                        Current Stock
                                    </div>
                                    <p
                                        className={`mt-1.5 text-xl font-bold ${getStockLevelClass()}`}
                                    >
                                        {productData.stock_quantity ?? 0}
                                    </p>
                                    {Number(productData.stock_quantity) === 0 && (
                                        <span className="text-[10px] font-semibold text-red-600">
                                            Out of Stock
                                        </span>
                                    )}
                                    {Number(productData.stock_quantity) > 0 &&
                                        Number(productData.stock_quantity) <=
                                        Number(productData.low_stock_threshold) && (
                                            <span className="text-[10px] font-semibold text-orange-600">
                                                Low Stock
                                            </span>
                                        )}
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                        <FiActivity size={12} />
                                        Initial Stock
                                    </div>
                                    <p className="mt-1.5 text-xl font-bold text-gray-900">
                                        {productData.initial_stock ?? 0}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                        <FiRefreshCw size={12} />
                                        Restock
                                    </div>
                                    <p className="mt-1.5 text-xl font-bold text-gray-900">
                                        {productData.restock ?? 0}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                        <FiAlertTriangle size={12} />
                                        Low Stock Threshold
                                    </div>
                                    <p className="mt-1.5 text-xl font-bold text-gray-900">
                                        {productData.low_stock_threshold ?? 0}
                                    </p>
                                </div>
                            </div>

                            {stockMovement &&
                                Object.keys(stockMovement).length > 0 && (
                                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <FiActivity
                                                className="text-gray-500"
                                                size={15}
                                            />
                                            <h4 className="text-sm font-semibold text-gray-800">
                                                Stock Movement
                                            </h4>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            <div className="rounded-lg bg-white border border-gray-200 p-3">
                                                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                                    <FiActivity size={11} />
                                                    Initial Stock
                                                </div>
                                                <p className="mt-1 text-base font-bold text-gray-900">
                                                    {stockMovement.initial_stock ?? 0}
                                                </p>
                                            </div>
                                            <div className="rounded-lg bg-white border border-gray-200 p-3">
                                                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                                    <FiRefreshCw size={11} />
                                                    Restock
                                                </div>
                                                <p className="mt-1 text-base font-bold text-gray-900">
                                                    {stockMovement.restock ?? 0}
                                                </p>
                                            </div>
                                            <div className="rounded-lg bg-white border border-gray-200 p-3">
                                                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                                    <FiClock size={11} />
                                                    Reserved Stock
                                                </div>
                                                <p className="mt-1 text-base font-bold text-gray-900">
                                                    {stockMovement.reserved_stock ?? 0}
                                                </p>
                                            </div>
                                            <div className="rounded-lg bg-white border border-gray-200 p-3">
                                                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                                    <FiShoppingCart size={11} />
                                                    Stock Sold
                                                </div>
                                                <p className="mt-1 text-base font-bold text-gray-900">
                                                    {stockMovement.stock_sold ?? 0}
                                                </p>
                                            </div>
                                            <div className="rounded-lg bg-white border border-gray-200 p-3">
                                                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                                    <FiRotateCcw size={11} />
                                                    Customer Returns
                                                </div>
                                                <p className="mt-1 text-base font-bold text-gray-900">
                                                    {stockMovement.customer_returns ?? 0}
                                                </p>
                                            </div>
                                            <div className="rounded-lg bg-white border border-gray-200 p-3">
                                                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                                    <FiXCircle size={11} />
                                                    Cancelled Orders
                                                </div>
                                                <p className="mt-1 text-base font-bold text-gray-900">
                                                    {stockMovement.cancelled_orders ?? 0}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 p-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <FiCheckCircle
                                                    className="text-blue-600"
                                                    size={16}
                                                />
                                                <span className="text-sm font-semibold text-blue-800">
                                                    Available Stock
                                                </span>
                                            </div>
                                            <span className="text-lg font-bold text-blue-700">
                                                {stockMovement.available_stock ?? 0}
                                            </span>
                                        </div>
                                    </div>
                                )}
                        </div>

                        {/* Reviews Summary */}
                        {productData.reviews_summary && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <FiEye className="text-gray-500" size={18} />
                                    <h3 className="font-semibold text-gray-900">
                                        Reviews Summary
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Average Rating
                                        </label>
                                        <p className="text-sm font-medium text-gray-900 mt-1">
                                            {productData.reviews_summary.average_rating ?? 0}{" "}
                                            / 5
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Total Reviews
                                        </label>
                                        <p className="text-sm font-medium text-gray-900 mt-1">
                                            {productData.reviews_summary.total_reviews ?? 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <FiEye className="text-gray-500" size={18} />
                                <h3 className="font-semibold text-gray-900">Description</h3>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {productData.description || "No description provided"}
                                </p>
                            </div>
                        </div>

                        {/* Variants */}
                        {productData.variants && productData.variants.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <FiLayers className="text-gray-500" size={18} />
                                    <h3 className="font-semibold text-gray-900">
                                        Variants
                                    </h3>
                                    <span className="ml-auto text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                        {productData.variants.length} variant
                                        {productData.variants.length !== 1 ? "s" : ""}
                                    </span>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                    {productData.variants.map(
                                        (variant: any, index: number) => (
                                            <div
                                                key={variant.id || index}
                                                className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {variant.image && (
                                                        <img
                                                            src={variant.image}
                                                            alt={variant.name}
                                                            className="h-9 w-9 rounded-md border border-gray-200 object-cover flex-shrink-0"
                                                        />
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-gray-800 truncate">
                                                            {variant.name || `Variant #${index + 1}`}
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            SKU: {variant.product_code || "N/A"}
                                                            {variant.hax_color && (
                                                                <>
                                                                    {" · "}
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <span
                                                                            className="h-2.5 w-2.5 rounded-full border border-gray-300 inline-block"
                                                                            style={{
                                                                                backgroundColor: variant.hax_color,
                                                                            }}
                                                                        />
                                                                        {variant.hax_color}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ADDITIONAL INFORMATION */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <FiTag className="text-gray-500" size={18} />
                                <h3 className="font-semibold text-gray-900">
                                    Additional Information
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center justify-between rounded-lg bg-white border border-gray-200 px-3 py-2.5">
                                    <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <FiTrendingUp size={15} className="text-gray-500" />
                                        Trending
                                    </span>
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                                            isTrending
                                                ? "bg-blue-100 text-blue-700 border border-blue-300"
                                                : "bg-gray-100 text-gray-500 border border-gray-300"
                                        }`}
                                    >
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full ${
                                                isTrending
                                                    ? "bg-blue-600"
                                                    : "bg-gray-400"
                                            }`}
                                        />
                                        {isTrending ? "ON" : "OFF"}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between rounded-lg bg-white border border-gray-200 px-3 py-2.5">
                                    <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <FiHeart size={15} className="text-gray-500" />
                                        Wishlisted
                                    </span>
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                                            isWishlisted
                                                ? "bg-pink-100 text-pink-700 border border-pink-300"
                                                : "bg-gray-100 text-gray-500 border border-gray-300"
                                        }`}
                                    >
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full ${
                                                isWishlisted
                                                    ? "bg-pink-600"
                                                    : "bg-gray-400"
                                            }`}
                                        />
                                        {isWishlisted ? "ON" : "OFF"}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between rounded-lg bg-white border border-gray-200 px-3 py-2.5">
                                    <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <FiTarget size={15} className="text-gray-500" />
                                        Deal of the Day
                                    </span>
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                                            isDealOfTheDay
                                                ? "bg-red-100 text-red-700 border border-red-300"
                                                : "bg-gray-100 text-gray-500 border border-gray-300"
                                        }`}
                                    >
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full ${
                                                isDealOfTheDay
                                                    ? "bg-red-600"
                                                    : "bg-gray-400"
                                            }`}
                                        />
                                        {isDealOfTheDay ? "ON" : "OFF"}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between rounded-lg bg-white border border-gray-200 px-3 py-2.5">
                                    <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <FiCheckCircle size={15} className="text-gray-500" />
                                        Active Deal
                                    </span>
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                                            isActiveDeal
                                                ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                                                : "bg-gray-100 text-gray-500 border border-gray-300"
                                        }`}
                                    >
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full ${
                                                isActiveDeal
                                                    ? "bg-emerald-600"
                                                    : "bg-gray-400"
                                            }`}
                                        />
                                        {isActiveDeal ? "ON" : "OFF"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer - Fixed */}
                    <div className="flex-shrink-0 flex justify-end rounded-b-2xl border-t border-gray-200 bg-white px-6 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-lg bg-gray-900 text-sm font-medium text-white hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ViewProductModal;