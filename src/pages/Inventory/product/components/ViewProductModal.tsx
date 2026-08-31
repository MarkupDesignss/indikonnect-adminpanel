import React, { useEffect, useState } from "react";
import { FiX, FiImage, FiTag, FiPackage, FiBox, FiEye, FiCalendar } from "react-icons/fi";
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
        const category = categories.find(c => Number(c.id) === id);
        return category ? category.name : 'N/A';
    };

    const getTaxCategoryName = (id: number) => {
        const tax = taxCategories.find(t => Number(t.id) === id);
        return tax ? tax.name : 'N/A';
    };

    const getStatusClass = (status: boolean) => {
        return status
            ? "bg-green-100 text-green-800 border-green-300"
            : "bg-yellow-100 text-yellow-800 border-yellow-300";
    };

    const formatCurrency = (amount: number) => {
        if (!amount && amount !== 0) return '₹0.00';
        return `₹${Number(amount).toFixed(2)}`;
    };

    const formatDate = (date: string) => {
        if (!date) return 'N/A';
        try {
            return new Date(date).toLocaleString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch {
            return 'N/A';
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
                            <h2 id="modal-title" className="font-semibold text-xl text-gray-900">
                                Product Details
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
                                    <h3 className="font-semibold text-gray-900">Product Images</h3>
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                    {productData.images.map((img: any, index: number) => (
                                        <div key={img.id || index} className="relative rounded-lg border border-gray-200 overflow-hidden bg-gray-50 aspect-square">
                                            <img
                                                src={img.image_url || 'https://via.placeholder.com/150x150?text=No+Image'}
                                                alt={`Product ${index + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150x150?text=No+Image';
                                                }}
                                            />
                                            {img.is_primary && (
                                                <span className="absolute top-2 left-2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                                                    Primary
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
                                <h3 className="font-semibold text-gray-900">Basic Information</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Product Name</label>
                                    <p className="text-sm font-medium text-gray-900 mt-1">{productData.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU / Product Code</label>
                                    <p className="text-sm font-medium text-gray-900 mt-1">{productData.product_code || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Slug</label>
                                    <p className="text-sm font-medium text-gray-900 mt-1 break-all">{productData.slug || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</label>
                                    <span className={`inline-flex mt-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusClass(productData.is_published)}`}>
                                        {productData.is_published ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Categories */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <FiTag className="text-gray-500" size={18} />
                                <h3 className="font-semibold text-gray-900">Categories</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</label>
                                    <p className="text-sm font-medium text-gray-900 mt-1">
                                        {productData.category?.name || getCategoryName(productData.category_id)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tax Category</label>
                                    <p className="text-sm font-medium text-gray-900 mt-1">
                                        {productData.tax_category?.name || getTaxCategoryName(productData.tax_category_id)}
                                        {productData.tax_category?.rate && (
                                            <span className="ml-2 text-xs text-gray-500">({productData.tax_category.rate}%)</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Specification & Pricing - Side by side */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Specification */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <FiBox className="text-gray-500" size={18} />
                                    <h3 className="font-semibold text-gray-900">Specification</h3>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 min-h-[120px]">
                                    {typeof specData === 'object' && specData !== null ? (
                                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                            {Object.entries(specData).map(([key, value]) => (
                                                <div key={key} className="flex justify-between py-1 border-b border-gray-200 last:border-0">
                                                    <span className="text-xs font-medium text-gray-500">{key}</span>
                                                    <span className="text-sm text-gray-700 text-right ml-4">{String(value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                            {productData.specification || 'No specification provided'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Pricing */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <RiMoneyRupeeCircleLine className="text-gray-500" size={18} />
                                    <h3 className="font-semibold text-gray-900">Pricing</h3>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-sm text-gray-600">Retail Price</span>
                                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(productData.retail_price)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-sm text-gray-600">Retail MRP</span>
                                        <span className="text-sm font-semibold text-gray-400 line-through">{formatCurrency(productData.retail_mrp)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-sm text-gray-600">Distributor Price</span>
                                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(productData.distributor_price)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-gray-600">Distributor MRP</span>
                                        <span className="text-sm font-semibold text-gray-400 line-through">{formatCurrency(productData.distributor_mrp)}</span>
                                    </div>
                                    {productData.is_deal_of_the_day && productData.is_active_deal && (
                                        <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                                            <span className="text-xs font-semibold text-red-600">🔥 Deal of the Day</span>
                                            {productData.deal_of_the_day_ends_at && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    Ends: {formatDate(productData.deal_of_the_day_ends_at)}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Description - Full width below */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <FiEye className="text-gray-500" size={18} />
                                <h3 className="font-semibold text-gray-900">Description</h3>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {productData.description || 'No description provided'}
                                </p>
                            </div>
                        </div>

                        {/* Inventory */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <FiBox className="text-gray-500" size={18} />
                                <h3 className="font-semibold text-gray-900">Inventory</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock Quantity</label>
                                    <p className="text-sm font-semibold text-gray-900 mt-1">
                                        {productData.stock_quantity || '0'}
                                        {productData.stock_quantity <= productData.low_stock_threshold && productData.stock_quantity > 0 && (
                                            <span className="ml-2 text-xs text-orange-600 font-normal">(Low Stock)</span>
                                        )}
                                        {productData.stock_quantity === 0 && (
                                            <span className="ml-2 text-xs text-red-600 font-normal">(Out of Stock)</span>
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Low Stock Threshold</label>
                                    <p className="text-sm font-semibold text-gray-900 mt-1">{productData.low_stock_threshold || '10'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock Status</label>
                                    <p className="mt-1">
                                        <span className={`inline-flex text-sm font-semibold px-2 py-1 rounded-full ${
                                            productData.stock_status === 'active' 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                            {productData.stock_status || 'N/A'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        {(productData.is_trending || productData.is_wishlisted) && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <FiTag className="text-gray-500" size={18} />
                                    <h3 className="font-semibold text-gray-900">Additional Information</h3>
                                </div>
                                <div className="flex flex-wrap gap-2 bg-gray-50 rounded-lg p-4">
                                    {productData.is_trending && (
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                            🔥 Trending
                                            {productData.trending_sort_order > 0 && ` (#${productData.trending_sort_order})`}
                                        </span>
                                    )}
                                    {productData.is_wishlisted && (
                                        <span className="px-3 py-1 bg-pink-100 text-pink-700 text-xs font-semibold rounded-full">
                                            ❤️ Wishlisted
                                        </span>
                                    )}
                                    {productData.is_deal_of_the_day && (
                                        <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                                            🎯 Deal of the Day
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                  
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