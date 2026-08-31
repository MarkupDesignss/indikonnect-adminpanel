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
  FiChevronDown,
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import { categoryApi } from "../../../../api/endpoints/category";
import { taxApi } from "../../../../api/endpoints/taxApi";
import attributesApi, { AttributeMaster } from "../../../../api/endpoints/attributes";

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

interface AddProductModalProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  editData?: any;
  isEdit?: boolean;
}

interface ImageItem {
  id: number;
  file?: File;
  preview: string;
  sort_order: number;
  is_primary: number;
  existing_id?: number;
  is_existing?: boolean;
}

interface VariantImageItem {
  id: number;
  file?: File;
  preview: string;
  sort_order: number;
  is_primary: number;
  existing_id?: number;
  is_existing?: boolean;
}

interface AttributeItem {
  key: string;
  value: string;
}

interface VariantFormData {
  id: string;
  sku: string;
  attributes: AttributeItem[];
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
  existing_id?: number;
  is_existing?: boolean;
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

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const parseSpecification = (spec: string): SpecItem[] => {
  try {
    const parsed = JSON.parse(spec);
    return Object.entries(parsed).map(([key, value]) => ({
      key,
      value: String(value),
    }));
  } catch {
    return [{ key: "", value: "" }];
  }
};

const parseVariantAttributes = (attributes: Record<string, string> | string): AttributeItem[] => {
  try {
    if (typeof attributes === 'string') {
      const parsed = JSON.parse(attributes);
      const result: AttributeItem[] = [];
      Object.entries(parsed).forEach(([key, value]) => {
        let values: string[] = [];
        if (Array.isArray(value)) {
          values = value.map(v => String(v).trim());
        } else {
          values = String(value).split(',').map(v => v.trim());
        }
        values.forEach(val => {
          if (val) {
            result.push({ key, value: val });
          }
        });
      });
      return result;
    }
    if (typeof attributes === 'object' && attributes !== null) {
      const result: AttributeItem[] = [];
      Object.entries(attributes).forEach(([key, value]) => {
        let values: string[] = [];
        if (Array.isArray(value)) {
          values = value.map(v => String(v).trim());
        } else {
          values = String(value).split(',').map(v => v.trim());
        }
        values.forEach(val => {
          if (val) {
            result.push({ key, value: val });
          }
        });
      });
      return result;
    }
  } catch (error) {
    console.error("Error parsing variant attributes:", error);
  }
  return [];
};

// Generate attribute combinations from variants_summary
const getAttributeCombinations = (attributes: Record<string, any[]>): Array<Record<string, any>> => {
  const keys = Object.keys(attributes);
  if (keys.length === 0) return [{}];
  
  const result: Array<Record<string, any>> = [];
  
  const generateCombinations = (index: number, current: Record<string, any>) => {
    if (index === keys.length) {
      result.push({ ...current });
      return;
    }
    
    const key = keys[index];
    const values = attributes[key] || [];
    
    if (values.length === 0) {
      generateCombinations(index + 1, { ...current, [key]: '' });
    } else {
      values.forEach((value: any) => {
        generateCombinations(index + 1, { ...current, [key]: value });
      });
    }
  };
  
  generateCombinations(0, {});
  return result;
};

// Generate variants from product data (supports both variants array and variants_summary)
const generateVariantsFromProduct = (product: any): VariantFormData[] => {
  const variants: VariantFormData[] = [];
  
  // If product has actual variants, use them
  if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants.map((variant: any, index: number) => ({
      id: `variant-${Date.now()}-${index}`,
      sku: variant.sku || "",
      attributes: parseVariantAttributes(variant.attributes || {}),
      retail_mrp: String(variant.retail_mrp || ""),
      retail_discount_type: variant.retail_discount_type || "percentage",
      retail_discount_value: String(variant.retail_discount_value || ""),
      distributor_mrp: String(variant.distributor_mrp || ""),
      distributor_discount_type: variant.distributor_discount_type || "percentage",
      distributor_discount_value: String(variant.distributor_discount_value || ""),
      stock_quantity: String(variant.stock_quantity || ""),
      low_stock_threshold: String(variant.low_stock_threshold || ""),
      sort_order: variant.sort_order || index + 1,
      is_active: variant.is_active ? 1 : 0,
      images: (variant.images || []).map((img: any, imgIndex: number) => ({
        id: Date.now() + imgIndex + 1000,
        preview: img.image_url || img.image,
        sort_order: img.sort_order || imgIndex + 1,
        is_primary: img.is_primary ? 1 : 0,
        existing_id: img.id,
        is_existing: true,
      })),
      existing_id: variant.id,
      is_existing: true,
    }));
  }
  
  // If product has variants_summary with attributes, generate variant combinations
  if (product.variants_summary && product.variants_summary.attributes) {
    const attributes = product.variants_summary.attributes;
    const attributeKeys = Object.keys(attributes);
    
    if (attributeKeys.length > 0) {
      // Get all combinations of attributes
      const combinations = getAttributeCombinations(attributes);
      
      // Create a variant for each combination
      combinations.forEach((combo, index) => {
        const attributeItems: AttributeItem[] = [];
        Object.entries(combo).forEach(([key, value]) => {
          if (value && String(value).trim()) {
            attributeItems.push({ key, value: String(value) });
          }
        });
        
        // Generate SKU from product code and attributes
        const skuSuffix = attributeItems.map(attr => 
          String(attr.value).replace(/\s+/g, '-').substring(0, 10)
        ).join('-');
        
        // Calculate prices - use product level pricing or generate from summary
        const retailMrp = product.retail_mrp || product.variants_summary?.min_retail_mrp || 0;
        const retailDiscount = product.retail_discount_value || 0;
        const distributorMrp = product.distributor_mrp || product.variants_summary?.min_distributor_mrp || 0;
        const distributorDiscount = product.distributor_discount_value || 0;
        const stockQty = product.stock_quantity || 0;
        
        variants.push({
          id: `variant-${Date.now()}-${index}`,
          sku: `${product.product_code || 'PROD'}-${skuSuffix}`,
          attributes: attributeItems,
          retail_mrp: String(retailMrp),
          retail_discount_type: "percentage",
          retail_discount_value: String(retailDiscount),
          distributor_mrp: String(distributorMrp),
          distributor_discount_type: "percentage",
          distributor_discount_value: String(distributorDiscount),
          stock_quantity: String(stockQty),
          low_stock_threshold: String(product.low_stock_threshold || "10"),
          sort_order: index + 1,
          is_active: 1,
          images: [],
          is_existing: false,
        });
      });
    }
  }
  
  return variants;
};

// ============================================================
// ATTRIBUTE SELECTOR COMPONENT
// ============================================================

const AttributeSelector: React.FC<{
  variantId: string;
  selectedAttributes: AttributeItem[];
  availableAttributes: AttributeMaster[];
  onAddAttribute: (variantId: string, key: string, value: string) => void;
  onRemoveAttribute: (variantId: string, key: string, value: string) => void;
}> = ({
  variantId,
  selectedAttributes,
  availableAttributes,
  onAddAttribute,
  onRemoveAttribute,
}) => {
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  const handleAdd = () => {
    if (selectedKey && selectedValue) {
      onAddAttribute(variantId, selectedKey, selectedValue);
      setSelectedKey("");
      setSelectedValue("");
      setIsOpen(false);
    }
  };

  const getAvailableKeys = () => availableAttributes;

  const getValuesForAttribute = (key: string) => {
    const attribute = availableAttributes.find(
      (attr) => attr.attribute_key === key
    );
    return attribute?.values || [];
  };

  const isAttributeValueSelected = (key: string, value: string) => {
    return selectedAttributes.some(attr => attr.key === key && attr.value === value);
  };

  const getAvailableValuesForAttribute = (key: string) => {
    const allValues = getValuesForAttribute(key);
    return allValues.filter(val => !isAttributeValueSelected(key, val.value));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {selectedAttributes.map((attr, index) => (
          <span
            key={`${attr.key}-${attr.value}-${index}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-medium"
          >
            <span className="font-semibold text-blue-700">{attr.key}:</span>
            <span className="text-blue-600">{attr.value}</span>
            <button
              type="button"
              onClick={() => onRemoveAttribute(variantId, attr.key, attr.value)}
              className="ml-0.5 text-red-500 hover:text-red-700 transition-colors"
            >
              <FiX size={12} />
            </button>
          </span>
        ))}
        {selectedAttributes.length === 0 && (
          <span className="text-xs text-gray-400">No attributes selected</span>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors px-2 py-1 hover:bg-blue-50 rounded-lg"
        >
          <FiPlus size={14} />
          Add Attribute
        </button>

        {isOpen && (
          <div className="absolute left-0 top-full mt-2 z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select Attribute
                </label>
                <select
                  value={selectedKey}
                  onChange={(e) => {
                    setSelectedKey(e.target.value);
                    setSelectedValue("");
                  }}
                  className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
                >
                  <option value="">Choose attribute...</option>
                  {getAvailableKeys().map((attr) => (
                    <option key={attr.id} value={attr.attribute_key}>
                      {attr.attribute_key}
                    </option>
                  ))}
                </select>
              </div>

              {selectedKey && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Select Value
                  </label>
                  <select
                    value={selectedValue}
                    onChange={(e) => setSelectedValue(e.target.value)}
                    className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
                  >
                    <option value="">Choose value...</option>
                    {getAvailableValuesForAttribute(selectedKey).map((val) => (
                      <option key={val.id} value={val.value}>
                        {val.value}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setSelectedKey("");
                    setSelectedValue("");
                  }}
                  className="flex-1 h-8 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!selectedKey || !selectedValue}
                  className="flex-1 h-8 rounded-lg bg-black text-xs font-semibold text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const AddProductModal: React.FC<AddProductModalProps> = ({
  open,
  loading,
  onClose,
  onSubmit,
  editData,
  isEdit = false,
}) => {
  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [taxCategories, setTaxCategories] = useState<SelectOption[]>([]);
  const [attributeMasters, setAttributeMasters] = useState<AttributeMaster[]>([]);
  const [fetchingOptions, setFetchingOptions] = useState(false);

  const [productCode, setProductCode] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [specification, setSpecification] = useState<SpecItem[]>([{ key: "", value: "" }]);
  const [categoryId, setCategoryId] = useState("");
  const [taxCategoryId, setTaxCategoryId] = useState("");
  
  const [retailMrp, setRetailMrp] = useState("");
  const [retailDiscountValue, setRetailDiscountValue] = useState("");
  const [distributorMrp, setDistributorMrp] = useState("");
  const [distributorDiscountValue, setDistributorDiscountValue] = useState("");
  
  const [stockQuantity, setStockQuantity] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("10");
  
  const [isPublished, setIsPublished] = useState(true);
  
  const [images, setImages] = useState<ImageItem[]>([]);
  const [variants, setVariants] = useState<VariantFormData[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  const fetchOptions = async () => {
    try {
      setFetchingOptions(true);
      
      const categoriesRes = await categoryApi.getAll();
      const formattedCategories = categoriesRes.data?.data?.map((cat: any) => ({
        id: cat.id,
        name: cat.title || cat.name,
      })) || [];
      setCategories(formattedCategories);

      const taxRes = await taxApi.getAll();
      const formattedTaxCategories = taxRes.data?.data?.map((tax: any) => ({
        id: tax.id,
        name: tax.name,
      })) || [];
      setTaxCategories(formattedTaxCategories);

      const attributesRes = await attributesApi.getAll();
      if (attributesRes.data?.success) {
        setAttributeMasters(attributesRes.data.data || []);
      }
      
    } catch (error: any) {
      console.error("Fetch options error:", error);
      setCategories([]);
      setTaxCategories([]);
      setAttributeMasters([]);
    } finally {
      setFetchingOptions(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchOptions();
    }
  }, [open]);

  // ============================================================
  // LOAD EDIT DATA
  // ============================================================

  useEffect(() => {
    if (open && isEdit && editData) {
      console.log("Loading edit data:", editData);
      
      // Basic Info
      setProductCode(editData.product_code || editData.sku || "");
      setName(editData.name || "");
      setSlug(editData.slug || "");
      setDescription(editData.description || "");
      
      // Specification
      if (editData.specification) {
        setSpecification(parseSpecification(editData.specification));
      }
      
      // Category & Tax
      setCategoryId(String(editData.category_id || ""));
      setTaxCategoryId(String(editData.tax_category_id || ""));
      
      // Pricing
      setRetailMrp(String(editData.retail_mrp || ""));
      setRetailDiscountValue(String(editData.retail_discount_value || ""));
      setDistributorMrp(String(editData.distributor_mrp || ""));
      setDistributorDiscountValue(String(editData.distributor_discount_value || ""));
      
      // Inventory
      setStockQuantity(String(editData.stock_quantity || ""));
      setLowStockThreshold(String(editData.low_stock_threshold || "10"));
      
      // Publishing
      setIsPublished(editData.is_published === true || editData.is_published === 1);
      
      // Images
      if (editData.images && Array.isArray(editData.images)) {
        const existingImages: ImageItem[] = editData.images.map((img: any, index: number) => ({
          id: Date.now() + index,
          preview: img.image_url || img.image,
          sort_order: img.sort_order || index + 1,
          is_primary: img.is_primary ? 1 : 0,
          existing_id: img.id,
          is_existing: true,
        }));
        setImages(existingImages);
      }
      
      // Variants - Use the helper function to generate from either variants or variants_summary
      const generatedVariants = generateVariantsFromProduct(editData);
      console.log("Generated variants:", generatedVariants);
      console.log("Variants summary:", editData.variants_summary);
      setVariants(generatedVariants);
    }
  }, [open, isEdit, editData]);

  // ============================================================
  // RESET FORM
  // ============================================================

  useEffect(() => {
    if (!open) {
      setProductCode("");
      setName("");
      setSlug("");
      setDescription("");
      setSpecification([{ key: "", value: "" }]);
      setCategoryId("");
      setTaxCategoryId("");
      setRetailMrp("");
      setRetailDiscountValue("");
      setDistributorMrp("");
      setDistributorDiscountValue("");
      setStockQuantity("");
      setLowStockThreshold("10");
      setIsPublished(true);
      setImages([]);
      setVariants([]);
      setErrors({});
    }
  }, [open]);

  if (!open) return null;

  // ============================================================
  // FORM HANDLERS
  // ============================================================

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

  const addVariant = () => {
    const newVariant: VariantFormData = {
      id: `variant-${Date.now()}`,
      sku: "",
      attributes: [],
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
          const exists = v.attributes.some(attr => attr.key === key && attr.value === value);
          if (exists) {
            return v;
          }
          return {
            ...v,
            attributes: [...v.attributes, { key, value }],
          };
        }
        return v;
      })
    );
  };

  const removeVariantAttribute = (id: string, key: string, value: string) => {
    setVariants(
      variants.map((v) => {
        if (v.id === id) {
          return {
            ...v,
            attributes: v.attributes.filter(attr => !(attr.key === key && attr.value === value)),
          };
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

    if (images.length === 0) {
      newErrors.images = "At least one product image is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildFormData = (): FormData => {
    const formData = new FormData();

    const specObject: Record<string, string> = {};
    specification.forEach(item => {
      if (item.key.trim() && item.value.trim()) {
        specObject[item.key.trim()] = item.value.trim();
      }
    });

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

    if (isEdit && editData) {
      const existingImageIds = images
        .filter(img => img.is_existing && img.existing_id)
        .map(img => img.existing_id);
      if (existingImageIds.length > 0) {
        formData.append('existing_image_ids', JSON.stringify(existingImageIds));
      }
      formData.append('_method', 'PUT');
    }

    const newImages = images.filter(img => !img.is_existing);
    newImages.forEach((item, index) => {
      if (item.file) {
        formData.append(`product_images[${index}][image]`, item.file);
        formData.append(`product_images[${index}][sort_order]`, String(item.sort_order));
        formData.append(`product_images[${index}][is_primary]`, String(item.is_primary));
      }
    });

    variants.forEach((variant, vIndex) => {
      if (isEdit && variant.is_existing && variant.existing_id) {
        formData.append(`variants[${vIndex}][id]`, String(variant.existing_id));
      }
      
      formData.append(`variants[${vIndex}][sku]`, variant.sku);
      
      const attributesObject: Record<string, string> = {};
      variant.attributes.forEach(attr => {
        if (attributesObject[attr.key]) {
          attributesObject[attr.key] = attributesObject[attr.key] + ',' + attr.value;
        } else {
          attributesObject[attr.key] = attr.value;
        }
      });
      formData.append(`variants[${vIndex}][attributes]`, JSON.stringify(attributesObject));
      
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

      const newVariantImages = variant.images.filter(img => !img.is_existing);
      newVariantImages.forEach((img, imgIndex) => {
        if (img.file) {
          formData.append(`variants[${vIndex}][images][${imgIndex}][image]`, img.file);
          formData.append(`variants[${vIndex}][images][${imgIndex}][sort_order]`, String(img.sort_order));
          formData.append(`variants[${vIndex}][images][${imgIndex}][is_primary]`, String(img.is_primary));
        }
      });

      if (isEdit) {
        const existingVariantImageIds = variant.images
          .filter(img => img.is_existing && img.existing_id)
          .map(img => img.existing_id);
        if (existingVariantImageIds.length > 0) {
          formData.append(`variants[${vIndex}][existing_image_ids]`, JSON.stringify(existingVariantImageIds));
        }
      }
    });

    return formData;
  };

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

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-[1200px] max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-shrink-0 flex items-center justify-between rounded-t-2xl border-b border-gray-200 bg-white px-6 py-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                {isEdit ? (
                  <FiEdit2 className="text-yellow-500" size={24} />
                ) : (
                  <FiPlus className="text-yellow-500" size={24} />
                )}
                {isEdit ? "Edit Product" : "Add New Product"}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {isEdit 
                  ? `Editing: ${editData?.name || 'Product'}` 
                  : "Fill in the product details, pricing, variants and images"}
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

          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} id="product-form">
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
                              {item.is_primary && (
                                <span className="text-black font-semibold">Primary</span>
                              )}
                              {item.is_existing && (
                                <span className="text-blue-500 text-[10px]">Existing</span>
                              )}
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
                        <span className="text-xs text-gray-400">
                          ({variants.length} variant{variants.length !== 1 ? 's' : ''})
                        </span>
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
                                  <span className="text-blue-500 text-xs bg-blue-50 px-2 py-0.5 rounded-full">
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
                                <AttributeSelector
                                  variantId={variant.id}
                                  selectedAttributes={variant.attributes}
                                  availableAttributes={attributeMasters}
                                  onAddAttribute={updateVariantAttribute}
                                  onRemoveAttribute={removeVariantAttribute}
                                />
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
                                        <span className="absolute bottom-0 left-0 right-0 text-[6px] bg-blue-500 text-white text-center">
                                          Existing
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
                  {isEdit ? "Updating..." : "Adding..."}
                </>
              ) : fetchingOptions ? (
                "Loading..."
              ) : (
                isEdit ? "Update Product" : "Add Product"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddProductModal;