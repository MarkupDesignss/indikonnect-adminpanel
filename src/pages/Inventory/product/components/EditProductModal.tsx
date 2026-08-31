import React, { useEffect, useState } from "react";
import {
  FiPlus,
  FiUploadCloud,
  FiX,
  FiTrash2,
  FiTag,
  FiPackage,
  FiDollarSign,
  FiGrid,
  FiAlignLeft,
  FiInfo,
  FiEdit2,
} from "react-icons/fi";

// API imports
import { categoryApi } from "../../../../api/endpoints/category";
import { taxApi } from "../../../../api/endpoints/taxApi";
import { FaRupeeSign } from "react-icons/fa";

interface SelectOption {
  id: number;
  name: string;
}

interface ProductImagePayload {
  file: File;
  sort_order: number;
  is_primary: number;
}

interface VariantImagePayload {
  file: File;
  sort_order: number;
  is_primary: number;
}

interface VariantPayload {
  sku: string;
  attributes: Record<string, string>;
  retail_mrp: number;
  retail_discount_type: string;
  retail_discount_value: number;
  distributor_mrp: number;
  distributor_discount_type: string;
  distributor_discount_value: number;
  stock_quantity: number;
  low_stock_threshold: number;
  sort_order: number;
  is_active: number;
  images: VariantImagePayload[];
}

// Updated to accept FormData instead of ProductPayload
interface EditProductModalProps {
  open: boolean;
  loading: boolean;
  product: any; // Product data from API
  categories: SelectOption[];
  taxCategories: SelectOption[];
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}

interface ImageItem {
  id: number;
  file: File | null;
  preview: string;
  sort_order: number;
  is_primary: number;
  is_existing?: boolean;
  existing_id?: number;
}

interface VariantImageItem {
  id: number;
  file: File | null;
  preview: string;
  sort_order: number;
  is_primary: number;
  is_existing?: boolean;
  existing_id?: number;
}

interface VariantFormData {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  retail_mrp: string;
  retail_discount_type: string;
  retail_discount_value: string;
  distributor_mrp: string;
  distributor_discount_type: string;
  distributor_discount_value: string;
  stock_quantity: string;
  low_stock_threshold: string;
  sort_order: number;
  is_active: number;
  images: VariantImageItem[];
  is_existing?: boolean;
  existing_id?: number;
}

interface FormErrors {
  product_code?: string;
  name?: string;
  category_id?: string;
  tax_category_id?: string;
  retail_mrp?: string;
  stock_quantity?: string;
  images?: string;
}

interface SpecItem {
  key: string;
  value: string;
}

// Attribute Popup Component
const AttributePopup: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string, value: string) => void;
}> = ({ isOpen, onClose, onSave }) => {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setKey("");
      setValue("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (key.trim() && value.trim()) {
      onSave(key.trim(), value.trim());
      onClose();
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FiEdit2 className="text-yellow-500" size={20} />
              Add Attribute
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Attribute Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="e.g. Color, Size, Storage"
                className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && value.trim() && handleSave()}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Attribute Value <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. Black, Large, 128GB"
                className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
                onKeyDown={(e) => e.key === 'Enter' && key.trim() && handleSave()}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!key.trim() || !value.trim()}
                className="flex-1 h-11 rounded-lg bg-black text-sm font-semibold text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Attribute
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const EditProductModal: React.FC<EditProductModalProps> = ({
  open,
  loading,
  product,
  categories: propCategories,
  taxCategories: propTaxCategories,
  onClose,
  onSubmit,
}) => {
  // ============================
  // API DATA STATE
  // ============================
  const [categories, setCategories] = useState<SelectOption[]>(propCategories || []);
  const [taxCategories, setTaxCategories] = useState<SelectOption[]>(propTaxCategories || []);
  const [fetchingOptions, setFetchingOptions] = useState(false);

  // ============================
  // FORM STATE
  // ============================
  const [productCode, setProductCode] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [specification, setSpecification] = useState<SpecItem[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [taxCategoryId, setTaxCategoryId] = useState("");
  
  // Pricing
  const [retailMrp, setRetailMrp] = useState("");
  const [retailDiscountValue, setRetailDiscountValue] = useState("");
  const [distributorMrp, setDistributorMrp] = useState("");
  const [distributorDiscountValue, setDistributorDiscountValue] = useState("");
  
  // Inventory
  const [stockQuantity, setStockQuantity] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("10");
  
  // Publishing
  const [isPublished, setIsPublished] = useState(true);
  
  // Images
  const [images, setImages] = useState<ImageItem[]>([]);
  
  // Variants
  const [variants, setVariants] = useState<VariantFormData[]>([]);
  
  // Errors
  const [errors, setErrors] = useState<FormErrors>({});

  // Attribute Popup
  const [attributePopup, setAttributePopup] = useState<{
    isOpen: boolean;
    variantId: string | null;
  }>({
    isOpen: false,
    variantId: null,
  });

  // ============================
  // FETCH OPTIONS
  // ============================
  const fetchOptions = async () => {
    try {
      setFetchingOptions(true);
      
      // Only fetch if not provided as props
      if (propCategories.length === 0) {
        const categoriesRes = await categoryApi.getAll();
        const formattedCategories = categoriesRes.data?.data?.map((cat: any) => ({
          id: cat.id,
          name: cat.title || cat.name,
        })) || [];
        setCategories(formattedCategories);
      }

      if (propTaxCategories.length === 0) {
        const taxRes = await taxApi.getAll();
        const formattedTaxCategories = taxRes.data?.data?.map((tax: any) => ({
          id: tax.id,
          name: tax.name,
        })) || [];
        setTaxCategories(formattedTaxCategories);
      }
      
    } catch (error: any) {
      console.error("Fetch options error:", error);
      setCategories(propCategories || []);
      setTaxCategories(propTaxCategories || []);
    } finally {
      setFetchingOptions(false);
    }
  };

  // ============================
  // LOAD OPTIONS ON OPEN
  // ============================
  useEffect(() => {
    if (open) {
      fetchOptions();
    }
  }, [open]);

  // ============================
  // POPULATE FORM WITH PRODUCT DATA
  // ============================
  useEffect(() => {
    if (open && product) {
      // Basic Info
      setProductCode(product.product_code || "");
      setName(product.name || "");
      setSlug(product.slug || "");
      setDescription(product.description || "");
      
      // Specification
      if (product.specification) {
        try {
          const specObj = typeof product.specification === 'string' 
            ? JSON.parse(product.specification) 
            : product.specification;
          
          const specArray = Object.entries(specObj).map(([key, value]) => ({
            key,
            value: value as string,
          }));
          setSpecification(specArray.length > 0 ? specArray : [{ key: "", value: "" }]);
        } catch {
          setSpecification([{ key: "", value: "" }]);
        }
      } else {
        setSpecification([{ key: "", value: "" }]);
      }
      
      // Category & Tax
      setCategoryId(product.category_id?.toString() || "");
      setTaxCategoryId(product.tax_category_id?.toString() || "");
      
      // Pricing
      setRetailMrp(product.retail_mrp?.toString() || "");
      setRetailDiscountValue(product.retail_discount_value?.toString() || "");
      setDistributorMrp(product.distributor_mrp?.toString() || "");
      setDistributorDiscountValue(product.distributor_discount_value?.toString() || "");
      
      // Inventory
      setStockQuantity(product.stock_quantity?.toString() || "");
      setLowStockThreshold(product.low_stock_threshold?.toString() || "10");
      
      // Publishing
      setIsPublished(product.is_published === 1);
      
      // Images
      if (product.images && product.images.length > 0) {
        const existingImages: ImageItem[] = product.images.map((img: any, index: number) => ({
          id: Date.now() + index,
          file: null,
          preview: img.image_url || img.url || "",
          sort_order: img.sort_order || index + 1,
          is_primary: img.is_primary || 0,
          is_existing: true,
          existing_id: img.id,
        }));
        setImages(existingImages);
      } else {
        setImages([]);
      }
      
      // Variants
      if (product.variants && product.variants.length > 0) {
        const existingVariants: VariantFormData[] = product.variants.map((variant: any, index: number) => {
          // Parse attributes
          let attributes = {};
          try {
            attributes = typeof variant.attributes === 'string' 
              ? JSON.parse(variant.attributes) 
              : variant.attributes || {};
          } catch {
            attributes = {};
          }
          
          // Parse variant images
          const variantImages: VariantImageItem[] = (variant.images || []).map((img: any, imgIndex: number) => ({
            id: Date.now() + index * 100 + imgIndex,
            file: null,
            preview: img.image_url || img.url || "",
            sort_order: img.sort_order || imgIndex + 1,
            is_primary: img.is_primary || 0,
            is_existing: true,
            existing_id: img.id,
          }));
          
          return {
            id: `variant-${Date.now()}-${index}`,
            sku: variant.sku || "",
            attributes,
            retail_mrp: variant.retail_mrp?.toString() || "",
            retail_discount_type: variant.retail_discount_type || "percentage",
            retail_discount_value: variant.retail_discount_value?.toString() || "",
            distributor_mrp: variant.distributor_mrp?.toString() || "",
            distributor_discount_type: variant.distributor_discount_type || "percentage",
            distributor_discount_value: variant.distributor_discount_value?.toString() || "",
            stock_quantity: variant.stock_quantity?.toString() || "",
            low_stock_threshold: variant.low_stock_threshold?.toString() || "",
            sort_order: variant.sort_order || index + 1,
            is_active: variant.is_active || 1,
            images: variantImages,
            is_existing: true,
            existing_id: variant.id,
          };
        });
        setVariants(existingVariants);
      } else {
        setVariants([]);
      }
    }
  }, [open, product]);

  // ============================
  // RESET FORM ON CLOSE
  // ============================
  useEffect(() => {
    if (!open) {
      setErrors({});
      setAttributePopup({ isOpen: false, variantId: null });
    }
  }, [open]);

  if (!open) return null;

  // ============================
  // NAME → SLUG
  // ============================
  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(
      value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    );
  };

  // ============================
  // SPECIFICATION FUNCTIONS
  // ============================
  const addSpecificationField = () => {
    setSpecification([...specification, { key: "", value: "" }]);
  };

  const removeSpecificationField = (index: number) => {
    if (specification.length <= 1) return;
    const newSpec = specification.filter((_, i) => i !== index);
    setSpecification(newSpec);
  };

  const updateSpecification = (index: number, field: 'key' | 'value', value: string) => {
    const newSpec = [...specification];
    newSpec[index][field] = value;
    setSpecification(newSpec);
  };

  // ============================
  // IMAGE UPLOAD
  // ============================
  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: ImageItem[] = Array.from(files).map((file, index) => ({
      id: Date.now() + index,
      file,
      preview: URL.createObjectURL(file),
      sort_order: images.length + index + 1,
      is_primary: images.length === 0 && index === 0 ? 1 : 0,
      is_existing: false,
    }));

    setImages((prev) => [...prev, ...newImages]);
    setErrors((prev) => ({ ...prev, images: undefined }));
    e.target.value = "";
  };

  const removeImage = (id: number) => {
    setImages((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      if (filtered.length > 0 && !filtered.some((item) => item.is_primary === 1)) {
        filtered[0].is_primary = 1;
      }
      return filtered.map((item, index) => ({
        ...item,
        sort_order: index + 1,
      }));
    });
  };

  const setPrimaryImage = (id: number) => {
    setImages((prev) =>
      prev.map((item) => ({
        ...item,
        is_primary: item.id === id ? 1 : 0,
      }))
    );
  };

  // ============================
  // VARIANT FUNCTIONS
  // ============================
  const addVariant = () => {
    const newVariant: VariantFormData = {
      id: `variant-${Date.now()}`,
      sku: "",
      attributes: {},
      retail_mrp: "",
      retail_discount_type: "percentage",
      retail_discount_value: "",
      distributor_mrp: "",
      distributor_discount_type: "percentage",
      distributor_discount_value: "",
      stock_quantity: "",
      low_stock_threshold: "",
      sort_order: variants.length + 1,
      is_active: 1,
      images: [],
      is_existing: false,
    };
    setVariants([...variants, newVariant]);
  };

  const removeVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  const updateVariant = (id: string, field: keyof VariantFormData, value: any) => {
    setVariants(
      variants.map((v) => {
        if (v.id === id) {
          return { ...v, [field]: value };
        }
        return v;
      })
    );
  };

  const updateVariantAttribute = (id: string, key: string, value: string) => {
    setVariants(
      variants.map((v) => {
        if (v.id === id) {
          return {
            ...v,
            attributes: { ...v.attributes, [key]: value },
          };
        }
        return v;
      })
    );
  };

  const removeVariantAttribute = (id: string, key: string) => {
    setVariants(
      variants.map((v) => {
        if (v.id === id) {
          const newAttributes = { ...v.attributes };
          delete newAttributes[key];
          return { ...v, attributes: newAttributes };
        }
        return v;
      })
    );
  };

  const handleVariantImages = (variantId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const variant = variants.find((v) => v.id === variantId);
    if (!variant) return;

    const newImages: VariantImageItem[] = Array.from(files).map((file, index) => ({
      id: Date.now() + index,
      file,
      preview: URL.createObjectURL(file),
      sort_order: variant.images.length + index + 1,
      is_primary: variant.images.length === 0 && index === 0 ? 1 : 0,
      is_existing: false,
    }));

    updateVariant(variantId, "images", [...variant.images, ...newImages]);
    e.target.value = "";
  };

  const removeVariantImage = (variantId: string, imageId: number) => {
    const variant = variants.find((v) => v.id === variantId);
    if (!variant) return;

    const filtered = variant.images.filter((img) => img.id !== imageId);
    if (filtered.length > 0 && !filtered.some((img) => img.is_primary === 1)) {
      filtered[0].is_primary = 1;
    }
    updateVariant(
      variantId,
      "images",
      filtered.map((img, index) => ({ ...img, sort_order: index + 1 }))
    );
  };

  const setPrimaryVariantImage = (variantId: string, imageId: number) => {
    const variant = variants.find((v) => v.id === variantId);
    if (!variant) return;

    updateVariant(
      variantId,
      "images",
      variant.images.map((img) => ({
        ...img,
        is_primary: img.id === imageId ? 1 : 0,
      }))
    );
  };

  const openAttributePopup = (variantId: string) => {
    setAttributePopup({ isOpen: true, variantId });
  };

  const closeAttributePopup = () => {
    setAttributePopup({ isOpen: false, variantId: null });
  };

  const handleAddAttribute = (key: string, value: string) => {
    if (attributePopup.variantId) {
      updateVariantAttribute(attributePopup.variantId, key, value);
    }
  };

  // ============================
  // VALIDATE
  // ============================
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!productCode.trim()) {
      newErrors.product_code = "Product code is required";
    }

    if (!name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (!categoryId) {
      newErrors.category_id = "Please select a category";
    }

    if (!taxCategoryId) {
      newErrors.tax_category_id = "Please select a tax category";
    }

    if (!retailMrp || Number(retailMrp) <= 0) {
      newErrors.retail_mrp = "Please enter a valid retail MRP";
    }

    if (!stockQuantity || Number(stockQuantity) < 0) {
      newErrors.stock_quantity = "Please enter a valid stock quantity";
    }

    // Check if at least one image is uploaded
    if (images.length === 0) {
      newErrors.images = "At least one product image is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================
  // BUILD FORM DATA
  // ============================
  const buildFormData = (): FormData => {
    const formData = new FormData();

    // Convert specification to JSON string
    const specObject: Record<string, string> = {};
    specification.forEach(item => {
      if (item.key.trim() && item.value.trim()) {
        specObject[item.key.trim()] = item.value.trim();
      }
    });

    // Append basic fields
    formData.append('product_code', productCode);
    formData.append('name', name);
    formData.append('slug', slug);
    formData.append('description', description);
    formData.append('specification', JSON.stringify(specObject));
    formData.append('category_id', String(categoryId));
    formData.append('tax_category_id', String(taxCategoryId));
    formData.append('stock_quantity', String(stockQuantity || 0));
    formData.append('low_stock_threshold', String(lowStockThreshold || 0));
    formData.append('is_published', String(isPublished ? 1 : 0));
    formData.append('is_trending', '0');
    formData.append('trending_sort_order', '0');
    formData.append('sale_type', 'today_best');
    formData.append('retail_mrp', String(retailMrp || 0));
    formData.append('retail_discount_type', 'percentage');
    formData.append('retail_discount_value', String(retailDiscountValue || 0));
    formData.append('distributor_mrp', String(distributorMrp || 0));
    formData.append('distributor_discount_type', 'percentage');
    formData.append('distributor_discount_value', String(distributorDiscountValue || 0));

    // Track existing image IDs to delete
    const existingImageIds = images
      .filter(img => img.is_existing && img.existing_id)
      .map(img => img.existing_id);
    formData.append('existing_image_ids', JSON.stringify(existingImageIds));

    // Append product images - new images only
    const newImages = images.filter(img => !img.is_existing);
    newImages.forEach((item, index) => {
      if (item.file) {
        formData.append(`product_images[${index}][image]`, item.file);
        formData.append(`product_images[${index}][sort_order]`, String(item.sort_order));
        formData.append(`product_images[${index}][is_primary]`, String(item.is_primary));
      }
    });

    // Track variant IDs to delete and update
    const existingVariantIds = variants
      .filter(v => v.is_existing && v.existing_id)
      .map(v => v.existing_id);
    formData.append('existing_variant_ids', JSON.stringify(existingVariantIds));

    // Append variants - all variants (existing will be updated, new will be created)
    variants.forEach((variant, vIndex) => {
      if (variant.is_existing && variant.existing_id) {
        formData.append(`variants[${vIndex}][id]`, String(variant.existing_id));
      }
      formData.append(`variants[${vIndex}][sku]`, variant.sku);
      formData.append(`variants[${vIndex}][attributes]`, JSON.stringify(variant.attributes));
      formData.append(`variants[${vIndex}][retail_mrp]`, String(variant.retail_mrp || 0));
      formData.append(`variants[${vIndex}][retail_discount_type]`, variant.retail_discount_type || 'percentage');
      formData.append(`variants[${vIndex}][retail_discount_value]`, String(variant.retail_discount_value || 0));
      formData.append(`variants[${vIndex}][distributor_mrp]`, String(variant.distributor_mrp || 0));
      formData.append(`variants[${vIndex}][distributor_discount_type]`, variant.distributor_discount_type || 'percentage');
      formData.append(`variants[${vIndex}][distributor_discount_value]`, String(variant.distributor_discount_value || 0));
      formData.append(`variants[${vIndex}][stock_quantity]`, String(variant.stock_quantity || 0));
      formData.append(`variants[${vIndex}][low_stock_threshold]`, String(variant.low_stock_threshold || 0));
      formData.append(`variants[${vIndex}][sort_order]`, String(variant.sort_order));
      formData.append(`variants[${vIndex}][is_active]`, String(variant.is_active));

      // Track existing variant image IDs to keep
      const existingVariantImageIds = variant.images
        .filter(img => img.is_existing && img.existing_id)
        .map(img => img.existing_id);
      formData.append(`variants[${vIndex}][existing_image_ids]`, JSON.stringify(existingVariantImageIds));

      // Append variant images - new images only
      const newVariantImages = variant.images.filter(img => !img.is_existing);
      newVariantImages.forEach((img, imgIndex) => {
        if (img.file) {
          formData.append(`variants[${vIndex}][images][${imgIndex}][image]`, img.file);
          formData.append(`variants[${vIndex}][images][${imgIndex}][sort_order]`, String(img.sort_order));
          formData.append(`variants[${vIndex}][images][${imgIndex}][is_primary]`, String(img.is_primary));
        }
      });
    });

    return formData;
  };

  // ============================
  // SUBMIT
  // ============================
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      const firstError = document.querySelector(".error-message");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    const formData = buildFormData();
    onSubmit(formData);
  };

  // ============================
  // RENDER
  // ============================
  return (
    <>
      {/* Attribute Popup */}
      <AttributePopup
        isOpen={attributePopup.isOpen}
        onClose={closeAttributePopup}
        onSave={handleAddAttribute}
      />

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-[1200px] max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="flex-shrink-0 flex items-center justify-between rounded-t-2xl border-b border-gray-200 bg-white px-6 py-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FiEdit2 className="text-yellow-500" size={24} />
                Edit Product
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Update product details, pricing, variants and images
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FiX size={21} />
            </button>
          </div>

          {/* SCROLLABLE CONTENT */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} id="edit-product-form">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
                {/* LEFT COLUMN */}
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <FiInfo className="text-yellow-500" size={20} />
                      <h3 className="text-lg font-bold text-gray-900">Basic Information</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Product Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => handleNameChange(e.target.value)}
                          placeholder="e.g. SoundMax Pro 5G Smartphone"
                          className={`w-full h-12 rounded-lg border ${
                            errors.name ? "border-red-500" : "border-gray-300"
                          } px-4 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all`}
                        />
                        {errors.name && (
                          <p className="error-message mt-1 text-sm text-red-500 flex items-center gap-1">
                            <FiInfo size={14} /> {errors.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          SKU / Product Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={productCode}
                          onChange={(e) => setProductCode(e.target.value)}
                          placeholder="e.g. SMP5G-BLACK-128"
                          className={`w-full h-12 rounded-lg border ${
                            errors.product_code ? "border-red-500" : "border-gray-300"
                          } px-4 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all`}
                        />
                        {errors.product_code && (
                          <p className="error-message mt-1 text-sm text-red-500 flex items-center gap-1">
                            <FiInfo size={14} /> {errors.product_code}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Slug
                        </label>
                        <input
                          type="text"
                          value={slug}
                          readOnly
                          className="w-full h-12 rounded-lg border border-gray-300 bg-gray-50 px-4 text-sm text-gray-600 outline-none cursor-not-allowed"
                        />
                        <p className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                          <FiInfo size={12} /> Auto-generated from product name
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Category <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <select
                              value={categoryId}
                              onChange={(e) => {
                                setCategoryId(e.target.value);
                                setErrors((prev) => ({ ...prev, category_id: undefined }));
                              }}
                              className={`w-full h-12 rounded-lg border ${
                                errors.category_id ? "border-red-500" : "border-gray-300"
                              } bg-white px-4 pr-10 text-sm outline-none appearance-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all cursor-pointer`}
                            >
                              <option value="">Select category...</option>
                              {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                            <FiTag className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                          </div>
                          {errors.category_id && (
                            <p className="error-message mt-1 text-sm text-red-500 flex items-center gap-1">
                              <FiInfo size={14} /> {errors.category_id}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Tax Category <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <select
                              value={taxCategoryId}
                              onChange={(e) => {
                                setTaxCategoryId(e.target.value);
                                setErrors((prev) => ({ ...prev, tax_category_id: undefined }));
                              }}
                              className={`w-full h-12 rounded-lg border ${
                                errors.tax_category_id ? "border-red-500" : "border-gray-300"
                              } bg-white px-4 pr-10 text-sm outline-none appearance-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all cursor-pointer`}
                            >
                              <option value="">Select tax...</option>
                              {taxCategories.map((tax) => (
                                <option key={tax.id} value={tax.id}>
                                  {tax.name}
                                </option>
                              ))}
                            </select>
                            <FiTag className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                          </div>
                          {errors.tax_category_id && (
                            <p className="error-message mt-1 text-sm text-red-500 flex items-center gap-1">
                              <FiInfo size={14} /> {errors.tax_category_id}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description & Specification */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Description */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <FiAlignLeft className="text-yellow-500" size={20} />
                        <h3 className="text-lg font-bold text-gray-900">Description</h3>
                      </div>
                      <textarea
                        rows={6}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter product description..."
                        className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
                      />
                    </div>

                    {/* Specification */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <FiGrid className="text-yellow-500" size={20} />
                          <h3 className="text-lg font-bold text-gray-900">Specification</h3>
                        </div>
                        <button
                          type="button"
                          onClick={addSpecificationField}
                          className="flex items-center gap-1 px-3 py-1.5 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          <FiPlus size={14} /> Add Field
                        </button>
                      </div>

                      <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                        {specification.map((item, index) => (
                          <div key={index} className="flex gap-2 items-start">
                            <div className="flex-1">
                              <input
                                type="text"
                                value={item.key}
                                onChange={(e) => updateSpecification(index, 'key', e.target.value)}
                                placeholder="Key (e.g., Display)"
                                className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
                              />
                            </div>
                            <div className="flex-1">
                              <input
                                type="text"
                                value={item.value}
                                onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                                placeholder="Value (e.g., 6.7-inch AMOLED)"
                                className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSpecificationField(index)}
                              className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg border ${
                                specification.length <= 1 
                                  ? 'border-gray-200 text-gray-300 cursor-not-allowed' 
                                  : 'border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300'
                              } transition-colors`}
                              disabled={specification.length <= 1}
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>

                      {specification.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <FiInfo size={12} /> 
                            {specification.filter(s => s.key.trim() && s.value.trim()).length} fields added
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Images */}
                  <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <FiUploadCloud className="text-yellow-500" size={20} />
                        <h3 className="text-lg font-bold text-gray-900">Product Images</h3>
                        <span className="text-red-500 text-sm">*</span>
                      </div>
                      <label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-black px-4 text-sm font-semibold text-white hover:bg-gray-800 transition-colors">
                        <FiPlus size={16} />
                        Add Images
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={handleImages}
                        />
                      </label>
                    </div>

                    {errors.images && (
                      <p className="error-message mb-3 text-sm text-red-500 flex items-center gap-1">
                        <FiInfo size={14} /> {errors.images}
                      </p>
                    )}

                    {images.length === 0 ? (
                      <label className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <FiUploadCloud size={40} className="text-gray-400" />
                        <p className="mt-2 text-sm font-semibold text-gray-700">
                          Upload Product Images
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          You can select multiple images
                        </p>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={handleImages}
                        />
                      </label>
                    ) : (
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {images.map((item) => (
                          <div
                            key={item.id}
                            className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all"
                          >
                            <img
                              src={item.preview}
                              alt="Product"
                              className="h-[140px] w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(item.id)}
                              className={`absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-colors ${
                                item.is_primary
                                  ? "bg-black text-white"
                                  : "bg-white/90 text-gray-600 hover:bg-white"
                              }`}
                            >
                              {item.is_primary ? "★ Primary" : "Set Primary"}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeImage(item.id)}
                              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-red-500 shadow hover:bg-red-500 hover:text-white transition-colors"
                            >
                              <FiX size={14} />
                            </button>
                            <div className="flex items-center justify-between px-3 py-1.5 text-xs text-gray-500 border-t border-gray-100">
                              <span>#{item.sort_order}</span>
                              <div className="flex items-center gap-1">
                                {item.is_existing && (
                                  <span className="text-blue-500 text-[8px] font-semibold">EXISTING</span>
                                )}
                                {item.is_primary && (
                                  <span className="text-black font-semibold">Primary</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Variants */}
                  <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <FiPackage className="text-yellow-500" size={20} />
                        <h3 className="text-lg font-bold text-gray-900">Variants</h3>
                      </div>
                      <button
                        type="button"
                        onClick={addVariant}
                        className="flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-black px-4 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
                      >
                        <FiPlus size={16} />
                        Add Variant
                      </button>
                    </div>

                    {variants.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                        No variants added. Click "Add Variant" to create one.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {variants.map((variant, index) => (
                          <div
                            key={variant.id}
                            className="rounded-lg border border-gray-200 bg-gray-50 p-4 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                <FiPackage className="text-yellow-500" size={16} />
                                Variant #{index + 1}
                                {variant.is_existing && (
                                  <span className="text-[10px] font-semibold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                                    Existing
                                  </span>
                                )}
                              </h4>
                              <button
                                type="button"
                                onClick={() => removeVariant(variant.id)}
                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <FiTrash2 size={18} />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-semibold text-gray-600">
                                  SKU
                                </label>
                                <input
                                  type="text"
                                  value={variant.sku}
                                  onChange={(e) =>
                                    updateVariant(variant.id, "sku", e.target.value)
                                  }
                                  placeholder="e.g. SMP5G-BLACK-128"
                                  className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
                                />
                              </div>

                              <div>
                                <label className="text-xs font-semibold text-gray-600">
                                  Attributes
                                </label>
                                <div className="flex flex-wrap gap-1 min-h-[40px] items-center p-1.5 bg-white rounded-lg border border-gray-300">
                                  {Object.entries(variant.attributes).length === 0 ? (
                                    <span className="text-xs text-gray-400 px-1">No attributes</span>
                                  ) : (
                                    Object.entries(variant.attributes).map(([key, value]) => (
                                      <span
                                        key={key}
                                        className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2.5 py-1 text-xs"
                                      >
                                        <span className="font-semibold">{key}:</span> {value}
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeVariantAttribute(variant.id, key)
                                          }
                                          className="text-red-500 hover:text-red-700 ml-0.5"
                                        >
                                          <FiX size={12} />
                                        </button>
                                      </span>
                                    ))
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => openAttributePopup(variant.id)}
                                    className="text-xs text-blue-500 hover:text-blue-700 font-medium px-2 py-1 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                                  >
                                    <FiPlus size={12} /> Add
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="text-xs font-semibold text-gray-600">
                                  Retail MRP
                                </label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                                    ₹
                                  </span>
                                  <input
                                    type="number"
                                    value={variant.retail_mrp}
                                    onChange={(e) =>
                                      updateVariant(variant.id, "retail_mrp", e.target.value)
                                    }
                                    placeholder="100000"
                                    className="w-full h-10 rounded-lg border border-gray-300 pl-7 pr-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-xs font-semibold text-gray-600">
                                  Discount (%)
                                </label>
                                <input
                                  type="number"
                                  value={variant.retail_discount_value}
                                  onChange={(e) =>
                                    updateVariant(
                                      variant.id,
                                      "retail_discount_value",
                                      e.target.value
                                    )
                                  }
                                  placeholder="40"
                                  className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
                                />
                              </div>

                              <div>
                                <label className="text-xs font-semibold text-gray-600">
                                  Distributor MRP
                                </label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                                    ₹
                                  </span>
                                  <input
                                    type="number"
                                    value={variant.distributor_mrp}
                                    onChange={(e) =>
                                      updateVariant(variant.id, "distributor_mrp", e.target.value)
                                    }
                                    placeholder="90000"
                                    className="w-full h-10 rounded-lg border border-gray-300 pl-7 pr-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-xs font-semibold text-gray-600">
                                  Distributor Discount (%)
                                </label>
                                <input
                                  type="number"
                                  value={variant.distributor_discount_value}
                                  onChange={(e) =>
                                    updateVariant(
                                      variant.id,
                                      "distributor_discount_value",
                                      e.target.value
                                    )
                                  }
                                  placeholder="35"
                                  className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
                                />
                              </div>

                              <div>
                                <label className="text-xs font-semibold text-gray-600">
                                  Stock
                                </label>
                                <input
                                  type="number"
                                  value={variant.stock_quantity}
                                  onChange={(e) =>
                                    updateVariant(variant.id, "stock_quantity", e.target.value)
                                  }
                                  placeholder="20"
                                  className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
                                />
                              </div>

                              <div>
                                <label className="text-xs font-semibold text-gray-600">
                                  Low Stock Alert
                                </label>
                                <input
                                  type="number"
                                  value={variant.low_stock_threshold}
                                  onChange={(e) =>
                                    updateVariant(
                                      variant.id,
                                      "low_stock_threshold",
                                      e.target.value
                                    )
                                  }
                                  placeholder="5"
                                  className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
                                />
                              </div>

                              <div>
                                <label className="text-xs font-semibold text-gray-600">
                                  Status
                                </label>
                                <select
                                  value={variant.is_active}
                                  onChange={(e) =>
                                    updateVariant(variant.id, "is_active", Number(e.target.value))
                                  }
                                  className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none appearance-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all cursor-pointer bg-white"
                                >
                                  <option value={1}>Active</option>
                                  <option value={0}>Inactive</option>
                                </select>
                              </div>
                            </div>

                            {/* Variant Images */}
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                                  <FiUploadCloud size={14} /> Variant Images
                                </label>
                                <label className="flex cursor-pointer items-center gap-1 rounded-lg bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-300 transition-colors">
                                  <FiPlus size={12} />
                                  Add Images
                                  <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleVariantImages(variant.id, e)}
                                  />
                                </label>
                              </div>

                              {variant.images.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {variant.images.map((img) => (
                                    <div key={img.id} className="relative w-16 h-16 rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                                      <img
                                        src={img.preview}
                                        alt="Variant"
                                        className="w-full h-full object-cover"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setPrimaryVariantImage(variant.id, img.id)}
                                        className={`absolute left-1 top-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold transition-colors ${
                                          img.is_primary
                                            ? "bg-black text-white"
                                            : "bg-white/90 text-gray-600 hover:bg-white"
                                        }`}
                                      >
                                        {img.is_primary ? "P" : "Set"}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => removeVariantImage(variant.id, img.id)}
                                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                                      >
                                        <FiX size={10} />
                                      </button>
                                      {img.is_existing && (
                                        <span className="absolute bottom-1 left-1 text-[6px] font-semibold text-blue-500 bg-blue-50 px-1 rounded">
                                          EX
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-6">
                  {/* Pricing */}
                  <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                    <FaRupeeSign className="text-yellow-500" size={20} />
                      <h3 className="text-lg font-bold text-gray-900">Pricing</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Retail MRP <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={retailMrp}
                            onChange={(e) => {
                              setRetailMrp(e.target.value);
                              setErrors((prev) => ({ ...prev, retail_mrp: undefined }));
                            }}
                            placeholder="100000"
                            className={`w-full h-12 rounded-lg border ${
                              errors.retail_mrp ? "border-red-500" : "border-gray-300"
                            } pl-8 pr-4 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all`}
                          />
                        </div>
                        {errors.retail_mrp && (
                          <p className="error-message mt-1 text-sm text-red-500 flex items-center gap-1">
                            <FiInfo size={14} /> {errors.retail_mrp}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Discount (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={retailDiscountValue}
                            onChange={(e) => setRetailDiscountValue(e.target.value)}
                            placeholder="40"
                            className="w-full h-12 rounded-lg border border-gray-300 px-4 pr-12 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                            %
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Distributor MRP
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={distributorMrp}
                            onChange={(e) => setDistributorMrp(e.target.value)}
                            placeholder="90000"
                            className="w-full h-12 rounded-lg border border-gray-300 pl-8 pr-4 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Distributor Discount (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={distributorDiscountValue}
                            onChange={(e) => setDistributorDiscountValue(e.target.value)}
                            placeholder="35"
                            className="w-full h-12 rounded-lg border border-gray-300 px-4 pr-12 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Inventory */}
                  <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <FiPackage className="text-yellow-500" size={20} />
                      <h3 className="text-lg font-bold text-gray-900">Inventory</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Stock Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={stockQuantity}
                          onChange={(e) => {
                            setStockQuantity(e.target.value);
                            setErrors((prev) => ({ ...prev, stock_quantity: undefined }));
                          }}
                          placeholder="100"
                          className={`w-full h-12 rounded-lg border ${
                            errors.stock_quantity ? "border-red-500" : "border-gray-300"
                          } px-4 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all`}
                        />
                        {errors.stock_quantity && (
                          <p className="error-message mt-1 text-sm text-red-500 flex items-center gap-1">
                            <FiInfo size={14} /> {errors.stock_quantity}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Low Stock Threshold
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={lowStockThreshold}
                          onChange={(e) => setLowStockThreshold(e.target.value)}
                          placeholder="10"
                          className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
                        />
                        <p className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                          <FiInfo size={12} /> You'll be notified when stock falls below this number
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Publishing */}
                  <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <FiTag className="text-yellow-500" size={20} />
                      <h3 className="text-lg font-bold text-gray-900">Publishing</h3>
                    </div>

                    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="text-sm font-bold text-gray-700">
                          Publish Product
                        </p>
                        <p className="text-xs text-gray-500">
                          Visible to customers
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={isPublished}
                        onChange={(e) => setIsPublished(e.target.checked)}
                        className="h-5 w-5 accent-black cursor-pointer rounded border-gray-300"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* FOOTER */}
          <div className="flex-shrink-0 flex justify-end gap-3 rounded-b-2xl border-t border-gray-200 bg-white px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-lg border border-gray-300 px-7 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || fetchingOptions}
              onClick={handleSubmit}
              className="h-11 rounded-lg bg-black px-8 text-sm font-semibold text-white disabled:opacity-50 hover:bg-gray-800 transition-colors shadow-sm flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : fetchingOptions ? (
                "Loading..."
              ) : (
                "Update Product"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditProductModal;