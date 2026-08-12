import React, { useEffect, useState } from "react";
import { FiX, FiImage, FiTag, FiPackage, FiBox, FiEye, FiCalendar, } from "react-icons/fi";
import { SelectOption } from "@/types/product";
import { RiMoneyRupeeCircleLine } from "react-icons/ri";

interface ViewProductModalProps {
    open: boolean;
    product: any;
    categories: SelectOption[];
    taxCategories: SelectOption[];
    brands: SelectOption[];
    onClose: () => void;
}

const ViewProductModal: React.FC<ViewProductModalProps> = ({
    open,
    product,
    categories,
    taxCategories,
    brands,
    onClose,
}) => {
    const [productData, setProductData] = useState<any>(null);

    useEffect(() => {
        if (product && open) {
            setProductData(product);
        }
    }, [product, open]);

    if (!open || !productData) return null;

    // Get category name
    const getCategoryName = (id: number) => {
        const category = categories.find(c => Number(c.id) === id);
        return category ? category.name : 'N/A';
    };

    // Get tax category name
    const getTaxCategoryName = (id: number) => {
        const tax = taxCategories.find(t => Number(t.id) === id);
        return tax ? tax.name : 'N/A';
    };

    // Get brand name
    const getBrandName = (id: number) => {
        const brand = brands.find(b => Number(b.id) === id);
        return brand ? brand.name : 'N/A';
    };

    const getStatusClass = (status: number) => {
        return status === 1
            ? "bg-green-100 text-green-800 border-green-300"
            : "bg-gray-100 text-gray-800 border-gray-300";
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
                <div
                    className="relative w-full max-w-3xl my-8 bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header - Fixed */}
                    <div className="flex-shrink-0 flex items-center justify-between border-b border-[#DDE3EC] px-6 py-5 bg-white rounded-t-2xl">
                        <div>
                            <h2 className="font-lato text-2xl font-bold text-[#071A33]">
                                Product Details
                            </h2>
                            <p className="font-arimo mt-1 text-sm text-gray-500">
                                View complete product information
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <FiX size={21} />
                        </button>
                    </div>

                    {/* Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Product Images */}
                        {productData.product_images && productData.product_images.length > 0 && (
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <FiImage className="text-gray-500" size={18} />
                                    <h3 className="font-lato font-semibold text-[#071A33]">Product Images</h3>
                                </div>
                                <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5">
                                    {productData.product_images.map((img: any, index: number) => (
                                        <div key={index} className="relative rounded-lg border border-[#DDE3EC] overflow-hidden">
                                            <img
                                                src={img.image_url || img.url || 'https://via.placeholder.com/150x150?text=No+Image'}
                                                alt={`Product ${index + 1}`}
                                                className="h-24 w-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150x150?text=No+Image';
                                                }}
                                            />
                                            {img.is_primary === 1 && (
                                                <span className="absolute top-1 left-1 bg-black text-white text-[10px] px-2 py-0.5 rounded-full">
                                                    Primary
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Basic Information */}
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <FiPackage className="text-gray-500" size={18} />
                                <h3 className="font-lato font-semibold text-[#071A33]">Basic Information</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F7F9FC] rounded-lg p-4">
                                <div>
                                    <label className="font-arimo text-xs font-semibold text-gray-500 uppercase">Product Name</label>
                                    <p className="font-arimo text-sm font-medium text-[#071A33] mt-1">{productData.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="font-arimo text-xs font-semibold text-gray-500 uppercase">SKU / Product Code</label>
                                    <p className="font-arimo text-sm font-medium text-[#071A33] mt-1">{productData.product_code || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="font-arimo text-xs font-semibold text-gray-500 uppercase">Slug</label>
                                    <p className="font-arimo text-sm font-medium text-[#071A33] mt-1">{productData.slug || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="font-arimo text-xs font-semibold text-gray-500 uppercase">Status</label>
                                    <span className={`inline-flex mt-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusClass(productData.is_published)}`}>
                                        {productData.is_published === 1 ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Categories */}
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <FiTag className="text-gray-500" size={18} />
                                <h3 className="font-lato font-semibold text-[#071A33]">Categories</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#F7F9FC] rounded-lg p-4">
                                <div>
                                    <label className="font-arimo text-xs font-semibold text-gray-500 uppercase">Category</label>
                                    <p className="font-arimo text-sm font-medium text-[#071A33] mt-1">{getCategoryName(productData.category_id)}</p>
                                </div>
                                <div>
                                    <label className="font-arimo text-xs font-semibold text-gray-500 uppercase">Tax Category</label>
                                    <p className="font-arimo text-sm font-medium text-[#071A33] mt-1">{getTaxCategoryName(productData.tax_category_id)}</p>
                                </div>
                                <div>
                                    <label className="font-arimo text-xs font-semibold text-gray-500 uppercase">Brand</label>
                                    <p className="font-arimo text-sm font-medium text-[#071A33] mt-1">{getBrandName(productData.brand_id)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Description & Specification */}
                        <div className="mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <FiEye className="text-gray-500" size={18} />
                                        <h3 className="font-lato font-semibold text-[#071A33]">Description</h3>
                                    </div>
                                    <div className="bg-[#F7F9FC] rounded-lg p-4 min-h-[100px]">
                                        <p className="font-arimo text-sm text-[#071A33]">{productData.description || 'No description provided'}</p>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <FiBox className="text-gray-500" size={18} />
                                        <h3 className="font-lato font-semibold text-[#071A33]">Specification</h3>
                                    </div>
                                    <div className="bg-[#F7F9FC] rounded-lg p-4 min-h-[100px]">
                                        <p className="font-arimo text-sm text-[#071A33]">{productData.specification || 'No specification provided'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pricing & Inventory */}
                        <div className="mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <RiMoneyRupeeCircleLine
                                            className="text-gray-500"
                                            size={18}
                                        />
                                        <h3 className="font-lato font-semibold text-[#071A33]">Pricing</h3>
                                    </div>
                                    <div className="bg-[#F7F9FC] rounded-lg p-4">
                                        <div className="flex justify-between py-2 border-b border-[#DDE3EC]">
                                            <span className="font-arimo text-sm text-gray-600">Retail Price (MSRP)</span>
                                            <span className="font-arimo text-sm font-semibold text-[#071A33]">₹{productData.retail_price || '0.00'}</span>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <span className="font-arimo text-sm text-gray-600">Distributor Price</span>
                                            <span className="font-arimo text-sm font-semibold text-[#071A33]">₹{productData.distributor_price || '0.00'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <FiBox className="text-gray-500" size={18} />
                                        <h3 className="font-lato font-semibold text-[#071A33]">Inventory</h3>
                                    </div>
                                    <div className="bg-[#F7F9FC] rounded-lg p-4">
                                        <div className="flex justify-between py-2 border-b border-[#DDE3EC]">
                                            <span className="font-arimo text-sm text-gray-600">Stock Quantity</span>
                                            <span className="font-arimo text-sm font-semibold text-[#071A33]">{productData.stock_quantity || '0'}</span>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <span className="font-arimo text-sm text-gray-600">Low Stock Threshold</span>
                                            <span className="font-arimo text-sm font-semibold text-[#071A33]">{productData.low_stock_threshold || '10'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Timestamps */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <FiCalendar className="text-gray-500" size={18} />
                                <h3 className="font-lato font-semibold text-[#071A33]">Timestamps</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F7F9FC] rounded-lg p-4">
                                <div>
                                    <label className="font-arimo text-xs font-semibold text-gray-500 uppercase">Created At</label>
                                    <p className="font-arimo text-sm font-medium text-[#071A33] mt-1">
                                        {productData.created_at ? new Date(productData.created_at).toLocaleString() : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="font-arimo text-xs font-semibold text-gray-500 uppercase">Updated At</label>
                                    <p className="font-arimo text-sm font-medium text-[#071A33] mt-1">
                                        {productData.updated_at ? new Date(productData.updated_at).toLocaleString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer - Fixed */}
                    <div className="flex-shrink-0 flex justify-end rounded-b-2xl border-t border-[#DDE3EC] bg-white px-6 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="font-arimo h-11 rounded-lg bg-black px-8 text-sm font-semibold text-white hover:bg-[#181818] transition-colors"
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
