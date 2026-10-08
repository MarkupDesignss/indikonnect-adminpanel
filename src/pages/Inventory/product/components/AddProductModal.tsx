import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";

import {
  FiPlus,
  FiUploadCloud,
  FiX,
  FiTrash2,
  FiTag,
  FiPackage,
  FiGrid,
  FiAlignLeft,
  FiInfo,
  FiEdit2,
  FiLayers,
  FiAward,
  FiTruck,
  FiMove,
  FiCheck,
  FiChevronDown,
  FiImage,
  FiPercent,
} from "react-icons/fi";

import { FaRupeeSign } from "react-icons/fa";
import { toast } from "react-hot-toast";

import { categoryApi } from "../../../../api/endpoints/category";
import { taxApi } from "../../../../api/endpoints/taxApi";
import attributesApi, {
  AttributeMaster,
} from "../../../../api/endpoints/attributes";
import brandsApi from "../../../../api/endpoints/brands";
import { subcategoryApi } from "../../../../api/endpoints/subcategory";
import { productApi } from "../../../../api/endpoints/product";

// ✅ PERMISSIONS
import { usePermissions } from "../../../permissions/usePermissions";

/* =========================================================
   UPLOAD PROGRESS
========================================================= */

import UploadProgressBar from "./UploadProgressBar";
import type { UploadProgressMeta } from "../../../../api/endpoints/product";

/* =========================================================
   TYPES
========================================================= */

interface SelectOption {
  id: number;
  name: string;
}

interface AddProductModalProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  editData?: any;
  isEdit?: boolean;
  uploadProgress?: UploadProgressMeta | null;
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
  subcategory_id?: string;
  brand_id?: string;
  tax_category_id?: string;
  retail_mrp?: string;
  stock_quantity?: string;
  images?: string;
  shipping_charge?: string;
}

interface SpecItem {
  key: string;
  value: string;
}

/* =========================================================
   HELPERS
========================================================= */

const isValidDecimalInput = (value: string): boolean => {
  return /^\d*\.?\d*$/.test(value);
};

const isValidIntegerInput = (value: string): boolean => {
  return /^\d*$/.test(value);
};

const getProductObject = (editData: any) => {
  if (!editData) {
    return null;
  }

  return (
    editData?.data?.data?.data ??
    editData?.data?.data ??
    editData?.data ??
    editData?.product ??
    editData
  );
};

const getValue = (obj: any, ...keys: string[]) => {
  if (!obj) {
    return "";
  }

  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) {
      return obj[key];
    }
  }

  return "";
};

const normalizeId = (value: any): string => {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }

  return String(value).trim();
};

const formatINR = (n: number): string =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

/* =========================================================
   SPECIFICATION
========================================================= */

const parseSpecification = (spec: string | Record<string, any>): SpecItem[] => {
  try {
    const parsed = typeof spec === "string" ? JSON.parse(spec) : spec;

    if (!parsed || typeof parsed !== "object") {
      return [{ key: "", value: "" }];
    }

    const result = Object.entries(parsed).map(([key, value]) => ({
      key,
      value: String(value ?? ""),
    }));

    return result.length > 0 ? result : [{ key: "", value: "" }];
  } catch {
    return [{ key: "", value: "" }];
  }
};

/* =========================================================
   VARIANT ATTRIBUTES
========================================================= */

const parseVariantAttributes = (
  attributes: Record<string, string | string[]> | string,
): AttributeItem[] => {
  try {
    if (typeof attributes === "string") {
      const parsed = JSON.parse(attributes);

      const result: AttributeItem[] = [];

      Object.entries(parsed).forEach(([key, value]) => {
        let values: string[] = [];

        if (Array.isArray(value)) {
          values = value.map((v) => String(v).trim());
        } else {
          values = String(value)
            .split(",")
            .map((v) => v.trim());
        }

        values.forEach((val) => {
          if (val) {
            result.push({ key, value: val });
          }
        });
      });

      return result;
    }

    if (typeof attributes === "object" && attributes !== null) {
      const result: AttributeItem[] = [];

      Object.entries(attributes).forEach(([key, value]) => {
        let values: string[] = [];

        if (Array.isArray(value)) {
          values = value.map((v) => String(v).trim());
        } else {
          values = String(value)
            .split(",")
            .map((v) => v.trim());
        }

        values.forEach((val) => {
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

/* =========================================================
   ATTRIBUTE COMBINATIONS
========================================================= */

const getAttributeCombinations = (
  attributes: Record<string, any[]>,
): Array<Record<string, any>> => {
  const keys = Object.keys(attributes);

  if (keys.length === 0) {
    return [{}];
  }

  const result: Array<Record<string, any>> = [];

  const generateCombinations = (
    index: number,
    current: Record<string, any>,
  ) => {
    if (index === keys.length) {
      result.push({ ...current });
      return;
    }

    const key = keys[index];
    const values = attributes[key] || [];

    if (values.length === 0) {
      generateCombinations(index + 1, {
        ...current,
        [key]: "",
      });
    } else {
      values.forEach((value: any) => {
        generateCombinations(index + 1, {
          ...current,
          [key]: value,
        });
      });
    }
  };

  generateCombinations(0, {});

  return result;
};

/* =========================================================
   GENERATE VARIANTS
========================================================= */

const generateVariantsFromProduct = (rawProduct: any): VariantFormData[] => {
  const product = getProductObject(rawProduct);

  if (!product) {
    return [];
  }

  const variants: VariantFormData[] = [];

  if (
    product.variants &&
    Array.isArray(product.variants) &&
    product.variants.length > 0
  ) {
    return product.variants.map((variant: any, index: number) => ({
      id: `variant-${Date.now()}-${index}`,

      sku: variant.sku || "",

      attributes: parseVariantAttributes(variant.attributes || {}),

      retail_mrp: String(getValue(variant, "retail_mrp", "retail_price") ?? ""),

      retail_discount_type:
        getValue(variant, "retail_discount_type") || "percentage",

      retail_discount_value: String(
        getValue(
          variant,
          "retail_discount_value",
          "retail_discount_percentage",
        ) ?? "",
      ),

      distributor_mrp: String(
        getValue(variant, "distributor_mrp", "distributor_price") ?? "",
      ),

      distributor_discount_type:
        getValue(variant, "distributor_discount_type") || "percentage",

      distributor_discount_value: String(
        getValue(
          variant,
          "distributor_discount_value",
          "distributor_discount_percentage",
        ) ?? "",
      ),

      stock_quantity: String(variant.stock_quantity ?? ""),

      low_stock_threshold: String(variant.low_stock_threshold ?? ""),

      sort_order: variant.sort_order ?? index + 1,

      is_active:
        variant.is_active === true ||
        variant.is_active === 1 ||
        variant.is_active === "1"
          ? 1
          : 0,

      images: (variant.images || []).map((img: any, imgIndex: number) => ({
        id: Date.now() + imgIndex + 1000,

        preview: img.image_url || img.image || "",

        sort_order: img.sort_order ?? imgIndex + 1,

        is_primary:
          img.is_primary === true ||
          img.is_primary === 1 ||
          img.is_primary === "1"
            ? 1
            : 0,

        existing_id: img.id,

        is_existing: true,
      })),

      existing_id: variant.id,

      is_existing: true,
    }));
  }

  if (product.variants_summary && product.variants_summary.attributes) {
    const attributes = product.variants_summary.attributes;

    const attributeKeys = Object.keys(attributes);

    if (attributeKeys.length > 0) {
      const combinations = getAttributeCombinations(attributes);

      combinations.forEach((combo, index) => {
        const attributeItems: AttributeItem[] = [];

        Object.entries(combo).forEach(([key, value]) => {
          if (value && String(value).trim()) {
            attributeItems.push({
              key,
              value: String(value),
            });
          }
        });

        const skuSuffix = attributeItems
          .map((attr) => String(attr.value).replace(/\s+/g, "-").substring(0, 10))
          .join("-");

        const retailMrp =
          getValue(product, "retail_mrp") ||
          product.variants_summary?.min_retail_mrp ||
          0;

        const retailDiscount = getValue(
          product,
          "retail_discount_value",
          "retail_discount_percentage",
        );

        const distributorMrp =
          getValue(product, "distributor_mrp") ||
          product.variants_summary?.min_distributor_mrp ||
          0;

        const distributorDiscount = getValue(
          product,
          "distributor_discount_value",
          "distributor_discount_percentage",
        );

        const stockQty = product.stock_quantity ?? 0;

        variants.push({
          id: `variant-${Date.now()}-${index}`,

          sku: `${product.product_code || "PROD"}-${skuSuffix}`,

          attributes: attributeItems,

          retail_mrp: String(retailMrp),

          retail_discount_type:
            getValue(product, "retail_discount_type") || "percentage",

          retail_discount_value:
            retailDiscount !== null && retailDiscount !== undefined
              ? String(retailDiscount)
              : "0",

          distributor_mrp: String(distributorMrp),

          distributor_discount_type:
            getValue(product, "distributor_discount_type") || "percentage",

          distributor_discount_value:
            distributorDiscount !== null && distributorDiscount !== undefined
              ? String(distributorDiscount)
              : "0",

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

/* =========================================================
   SMALL UI BUILDING BLOCKS
========================================================= */

const inputCls = (hasError?: boolean, extra = "") =>
  `h-11 w-full rounded-xl border ${
    hasError
      ? "border-rose-400 bg-rose-50/50"
      : "border-slate-200 bg-slate-50/80 hover:border-slate-300"
  } px-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#1E3A8A] focus:bg-white focus:ring-4 focus:ring-[#1E3A8A]/10 ${extra}`;

const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1E3A8A] font-semibold text-white shadow-[0_8px_18px_-8px_rgba(30,58,138,0.6)] transition hover:shadow-[0_12px_24px_-8px_rgba(30,58,138,0.75)] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

const softBtn =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#EAF1FF] font-semibold text-[#1E3A8A] transition hover:bg-[#DBE8FF] active:scale-[0.98]";

const SectionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}> = ({ icon, title, subtitle, action, required, children }) => (
  <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,27,61,0.04),0_12px_32px_-12px_rgba(30,58,138,0.12)]">
    <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#EAF1FF] to-[#DBE8FF] text-[#1E3A8A] ring-1 ring-[#1E3A8A]/10">
          {icon}
        </span>

        <div>
          <h3 className="text-[15px] font-bold leading-tight text-[#0F1B3D]">
            {title}
            {required && <span className="ml-1 text-rose-500">*</span>}
          </h3>

          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>

      {action}
    </header>

    <div className="p-5">{children}</div>
  </section>
);

const Field: React.FC<{
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  small?: boolean;
  children: React.ReactNode;
}> = ({ label, required, error, hint, icon, small, children }) => (
  <div>
    <label
      className={`mb-1.5 flex items-center gap-1.5 font-semibold ${
        small ? "text-xs text-slate-600" : "text-[13px] text-[#0F1B3D]"
      }`}
    >
      {icon}
      {label}
      {required && <span className="text-rose-500">*</span>}
    </label>

    {children}

    {error && (
      <p className="error-message mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600">
        <FiInfo size={13} />
        {error}
      </p>
    )}

    {!error && hint && (
      <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-400">
        <FiInfo size={12} />
        {hint}
      </p>
    )}
  </div>
);

const AdornedInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  inputMode?: "decimal" | "numeric";
  hasError?: boolean;
  compact?: boolean;
}> = ({
  value,
  onChange,
  placeholder,
  prefix,
  suffix,
  inputMode = "decimal",
  hasError,
  compact,
}) => (
  <div className="relative">
    {prefix && (
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#2563EB]">
        {prefix}
      </span>
    )}

    <input
      type="text"
      inputMode={inputMode}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${inputCls(hasError, compact ? "!h-10" : "")} ${
        prefix ? "!pl-8" : ""
      } ${suffix ? "!pr-10" : ""}`}
    />

    {suffix && (
      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
        {suffix}
      </span>
    )}
  </div>
);

const SelectBox: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: SelectOption[];
  icon: React.ReactNode;
  hasError?: boolean;
}> = ({ value, onChange, placeholder, options, icon, hasError }) => (
  <div className="relative">
    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2563EB]">
      {icon}
    </span>

    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputCls(hasError)} cursor-pointer appearance-none !pl-10 !pr-10`}
    >
      <option value="">{placeholder}</option>

      {value && !options.some((o) => String(o.id) === value) && (
        <option value={value}>Loading... (ID: {value})</option>
      )}

      {options.map((o) => (
        <option key={o.id} value={String(o.id)}>
          {o.name}
        </option>
      ))}
    </select>

    <FiChevronDown
      size={16}
      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
    />
  </div>
);

/* =========================================================
   ATTRIBUTE SELECTOR
========================================================= */

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
  const [selectedKey, setSelectedKey] = useState("");

  const [selectedValue, setSelectedValue] = useState("");

  const [isOpen, setIsOpen] = useState(false);

  const handleAdd = () => {
    if (selectedKey && selectedValue) {
      onAddAttribute(variantId, selectedKey, selectedValue);

      setSelectedKey("");
      setSelectedValue("");
      setIsOpen(false);
    }
  };

  const getValuesForAttribute = (key: string) => {
    const attribute = availableAttributes.find(
      (attr) => attr.attribute_key === key,
    );

    return attribute?.values || [];
  };

  const isAttributeValueSelected = (key: string, value: string) => {
    return selectedAttributes.some(
      (attr) => attr.key === key && attr.value === value,
    );
  };

  const getAvailableValuesForAttribute = (key: string) => {
    const allValues = getValuesForAttribute(key);

    return allValues.filter(
      (val) => !isAttributeValueSelected(key, val.value),
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {selectedAttributes.map((attr, index) => (
          <span
            key={`${attr.key}-${attr.value}-${index}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#2563EB]/20 bg-white py-1 pl-3 pr-1.5 text-xs font-medium shadow-sm"
          >
            <span className="font-semibold text-[#1E3A8A]">{attr.key}:</span>

            <span className="text-[#2563EB]">{attr.value}</span>

            <button
              type="button"
              onClick={() => onRemoveAttribute(variantId, attr.key, attr.value)}
              className="flex h-4 w-4 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-rose-100 hover:text-rose-600"
            >
              <FiX size={11} />
            </button>
          </span>
        ))}

        {selectedAttributes.length === 0 && (
          <span className="text-xs text-slate-400">No attributes selected</span>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#2563EB]/40 px-2.5 py-1 text-xs font-semibold text-[#2563EB] transition-colors hover:bg-[#EAF1FF]"
          >
            <FiPlus size={12} />
            Add
          </button>

          {isOpen && (
            <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-2xl ring-1 ring-black/5">
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#0F1B3D]">
                    Attribute
                  </label>

                  <select
                    value={selectedKey}
                    onChange={(e) => {
                      setSelectedKey(e.target.value);
                      setSelectedValue("");
                    }}
                    className={inputCls(false, "!h-9")}
                  >
                    <option value="">Choose attribute...</option>

                    {availableAttributes.map((attr) => (
                      <option key={attr.id} value={attr.attribute_key}>
                        {attr.attribute_key}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedKey && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#0F1B3D]">
                      Value
                    </label>

                    <select
                      value={selectedValue}
                      onChange={(e) => setSelectedValue(e.target.value)}
                      className={inputCls(false, "!h-9")}
                    >
                      <option value="">Choose value...</option>

                      {getAvailableValuesForAttribute(selectedKey).map(
                        (val) => (
                          <option key={val.id} value={val.value}>
                            {val.value}
                          </option>
                        ),
                      )}
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
                    className="h-9 flex-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={!selectedKey || !selectedValue}
                    className={`${primaryBtn} h-9 flex-1 text-xs`}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const AddProductModal: React.FC<AddProductModalProps> = ({
  open,
  loading,
  onClose,
  onSubmit,
  editData,
  isEdit = false,
  uploadProgress,
}) => {
  // ===================================================
  // ✅ PERMISSIONS (safety check)
  // ===================================================

  const { hasPermission, isSuperAdmin } = usePermissions();

  const canSubmit = useMemo(() => {
    if (isSuperAdmin) return true;
    if (isEdit) {
      return hasPermission("product.update") || hasPermission("product.edit");
    }
    return hasPermission("product.create");
  }, [isSuperAdmin, hasPermission, isEdit]);

  // ===================================================
  // STATE
  // ===================================================

  const [categories, setCategories] = useState<SelectOption[]>([]);

  const [subcategories, setSubcategories] = useState<SelectOption[]>([]);

  const [brands, setBrands] = useState<SelectOption[]>([]);

  const [taxCategories, setTaxCategories] = useState<SelectOption[]>([]);

  const [attributeMasters, setAttributeMasters] = useState<AttributeMaster[]>(
    [],
  );

  const [fetchingOptions, setFetchingOptions] = useState(false);

  const [productCode, setProductCode] = useState("");

  const [name, setName] = useState("");

  const [slug, setSlug] = useState("");

  const [description, setDescription] = useState("");

  const [specification, setSpecification] = useState<SpecItem[]>([
    { key: "", value: "" },
  ]);

  const [categoryId, setCategoryId] = useState("");

  const [subcategoryId, setSubcategoryId] = useState("");

  const [brandId, setBrandId] = useState("");

  const [taxCategoryId, setTaxCategoryId] = useState("");

  const [retailMrp, setRetailMrp] = useState("");

  const [retailDiscountValue, setRetailDiscountValue] = useState("");

  const [distributorMrp, setDistributorMrp] = useState("");

  const [distributorDiscountValue, setDistributorDiscountValue] = useState("");

  const [commissionValue, setCommissionValue] = useState("");

  const [shippingCharge, setShippingCharge] = useState("");

  const [stockQuantity, setStockQuantity] = useState("");

  const [lowStockThreshold, setLowStockThreshold] = useState("10");

  const [isPublished, setIsPublished] = useState(true);

  const [images, setImages] = useState<ImageItem[]>([]);

  const [variants, setVariants] = useState<VariantFormData[]>([]);

  const [errors, setErrors] = useState<FormErrors>({});

  const [deletingImageIds, setDeletingImageIds] = useState<number[]>([]);

  const [hydratedEditKey, setHydratedEditKey] = useState<string | null>(null);

  /* IMAGE ARRANGE STATE */

  const draggedImageIdRef = useRef<number | null>(null);

  const [dragOverImageId, setDragOverImageId] = useState<number | null>(null);

  const [arrangingImageIds, setArrangingImageIds] = useState<number[]>([]);

  /* DRAG & DROP UPLOAD STATE */

  const [isDragging, setIsDragging] = useState(false);

  const dragCounterRef = useRef(0);

  /* =========================================================
     ✨ UI-ONLY DERIVED VALUES (price preview + checklist)
  ========================================================= */

  const pricePreview = useMemo(() => {
    const calc = (mrp: string, disc: string) => {
      const m = Number(mrp) || 0;
      const d = Math.min(100, Math.max(0, Number(disc) || 0));
      return {
        mrp: m,
        discount: d,
        final: m - (m * d) / 100,
        saved: (m * d) / 100,
      };
    };

    return {
      retail: calc(retailMrp, retailDiscountValue),
      distributor: calc(distributorMrp, distributorDiscountValue),
    };
  }, [
    retailMrp,
    retailDiscountValue,
    distributorMrp,
    distributorDiscountValue,
  ]);

  const checklist = useMemo(
    () => [
      { label: "Product name", done: !!name.trim() },
      { label: "Product code", done: !!productCode.trim() },
      { label: "Category", done: !!categoryId },
      { label: "Sub category", done: !!subcategoryId },
      { label: "Brand", done: !!brandId },
      { label: "Tax category", done: !!taxCategoryId },
      { label: "Retail MRP", done: Number(retailMrp) > 0 },
      { label: "Stock quantity", done: stockQuantity !== "" },
      { label: "Product image", done: images.length > 0 },
    ],
    [
      name,
      productCode,
      categoryId,
      subcategoryId,
      brandId,
      taxCategoryId,
      retailMrp,
      stockQuantity,
      images.length,
    ],
  );

  const completedCount = checklist.filter((c) => c.done).length;

  const completionPercent = Math.round(
    (completedCount / checklist.length) * 100,
  );

  /* =========================================================
     ✅ AUTO-SCROLL (image drag karte waqt modal body scroll ho)
  ========================================================= */

  const bodyScrollRef = useRef<HTMLDivElement | null>(null);

  const autoScrollCleanupRef = useRef<(() => void) | null>(null);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollCleanupRef.current) {
      autoScrollCleanupRef.current();
      autoScrollCleanupRef.current = null;
    }
  }, []);

  const startAutoScroll = useCallback(() => {
    stopAutoScroll();

    const EDGE = 110;
    const MAX_SPEED = 22;

    let pointerY: number | null = null;
    let rafId = 0;

    const onDragOver = (e: DragEvent) => {
      pointerY = e.clientY;
    };

    const tick = () => {
      const el = bodyScrollRef.current;

      if (el && pointerY !== null) {
        const rect = el.getBoundingClientRect();

        if (pointerY < rect.top + EDGE) {
          const ratio = Math.min(1, (rect.top + EDGE - pointerY) / EDGE);
          el.scrollTop -= Math.ceil(ratio * MAX_SPEED);
        } else if (pointerY > rect.bottom - EDGE) {
          const ratio = Math.min(1, (pointerY - (rect.bottom - EDGE)) / EDGE);
          el.scrollTop += Math.ceil(ratio * MAX_SPEED);
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    const onFinish = () => stopAutoScroll();

    window.addEventListener("dragover", onDragOver, true);
    window.addEventListener("dragend", onFinish, true);
    window.addEventListener("drop", onFinish, true);

    rafId = requestAnimationFrame(tick);

    autoScrollCleanupRef.current = () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("dragover", onDragOver, true);
      window.removeEventListener("dragend", onFinish, true);
      window.removeEventListener("drop", onFinish, true);
    };
  }, [stopAutoScroll]);

  useEffect(() => {
    return () => {
      stopAutoScroll();
    };
  }, [stopAutoScroll]);

  useEffect(() => {
    if (!open) {
      stopAutoScroll();
    }
  }, [open, stopAutoScroll]);

  /* =========================================================
     ✅ CLEANUP OBJECT URLs
  ========================================================= */

  const revokeAllObjectUrls = useCallback(
    (imageList: ImageItem[], variantList: VariantFormData[]) => {
      imageList.forEach((img) => {
        if (!img.is_existing && img.preview && img.preview.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(img.preview);
          } catch (err) {
            console.warn("Failed to revoke product image URL:", err);
          }
        }
      });

      variantList.forEach((variant) => {
        variant.images.forEach((img) => {
          if (
            !img.is_existing &&
            img.preview &&
            img.preview.startsWith("blob:")
          ) {
            try {
              URL.revokeObjectURL(img.preview);
            } catch (err) {
              console.warn("Failed to revoke variant image URL:", err);
            }
          }
        });
      });
    },
    [],
  );

  /* =========================================================
     ✅ FULL RESET
  ========================================================= */

  const resetEverything = useCallback(() => {
    revokeAllObjectUrls(images, variants);

    stopAutoScroll();

    setProductCode("");
    setName("");
    setSlug("");
    setDescription("");

    setSpecification([{ key: "", value: "" }]);

    setCategoryId("");
    setSubcategoryId("");
    setBrandId("");
    setTaxCategoryId("");

    setRetailMrp("");
    setRetailDiscountValue("");
    setDistributorMrp("");
    setDistributorDiscountValue("");

    setCommissionValue("");
    setShippingCharge("");

    setStockQuantity("");
    setLowStockThreshold("10");

    setIsPublished(true);

    setImages([]);
    setVariants([]);
    setErrors({});
    setIsDragging(false);

    setDeletingImageIds([]);
    setHydratedEditKey(null);

    dragCounterRef.current = 0;

    draggedImageIdRef.current = null;

    setDragOverImageId(null);
    setArrangingImageIds([]);
  }, [images, variants, revokeAllObjectUrls, stopAutoScroll]);

  /* =========================================================
     ✅ HANDLE CLOSE (confirm if uploading)
  ========================================================= */

  const handleClose = useCallback(() => {
    if (loading) {
      const confirmed = window.confirm(
        "Upload/processing is in progress. If you close now, all progress will be lost. Do you want to close?",
      );

      if (!confirmed) {
        return;
      }
    }

    resetEverything();

    onClose();
  }, [loading, resetEverything, onClose]);

  /* =========================================================
     FETCH OPTIONS
  ========================================================= */

  const fetchOptions = async () => {
    try {
      setFetchingOptions(true);

      const categoriesRes = await categoryApi.getAll();

      const formattedCategories =
        categoriesRes.data?.data?.map((cat: any) => ({
          id: cat.id,
          name: cat.title || cat.name,
        })) || [];

      setCategories(formattedCategories);

      const subcategoriesRes = await subcategoryApi.getAll();

      let subcategoriesData: any[] = [];

      if (subcategoriesRes?.data?.data?.data) {
        subcategoriesData = subcategoriesRes.data.data.data;
      } else if (Array.isArray(subcategoriesRes?.data?.data)) {
        subcategoriesData = subcategoriesRes.data.data;
      } else if (Array.isArray(subcategoriesRes?.data)) {
        subcategoriesData = subcategoriesRes.data;
      }

      const formattedSubcategories = subcategoriesData.map((sub: any) => ({
        id: Number(sub.id),
        name: sub.name,
      }));

      setSubcategories(formattedSubcategories);

      const brandsRes = await brandsApi.getAll();

      const brandsData = brandsRes.data?.data || [];

      const formattedBrands = brandsData.map((brand: any) => ({
        id: brand.id,
        name: brand.title || brand.name,
      }));

      setBrands(formattedBrands);

      const taxRes = await taxApi.getAll();

      const formattedTaxCategories =
        taxRes.data?.data?.map((tax: any) => ({
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
      setSubcategories([]);
      setBrands([]);
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

  /* =========================================================
     LOAD EDIT DATA
  ========================================================= */

  useEffect(() => {
    if (!open || !isEdit || !editData) {
      return;
    }

    const product = getProductObject(editData);

    if (!product) {
      return;
    }

    const productKey = `${product?.id ?? "new"}-${isEdit}`;

    if (hydratedEditKey === productKey) {
      return;
    }

    setProductCode(String(product?.product_code ?? product?.sku ?? ""));

    setName(String(product?.name ?? ""));

    setSlug(String(product?.slug ?? ""));

    setDescription(String(product?.description ?? ""));

    if (product?.specification) {
      setSpecification(parseSpecification(product.specification));
    } else {
      setSpecification([{ key: "", value: "" }]);
    }

    const editCategoryId = normalizeId(
      product?.category_id ?? product?.category?.id,
    );

    setCategoryId(editCategoryId);

    const editSubcategoryId = normalizeId(
      product?.subcategory_id ??
        product?.["subcategory_id "] ??
        product?.subcategory?.id,
    );

    setSubcategoryId(editSubcategoryId);

    const editBrandId = normalizeId(product?.brand_id ?? product?.brand?.id);

    setBrandId(editBrandId);

    const editTaxCategoryId = normalizeId(
      product?.tax_category_id ?? product?.tax_category?.id,
    );

    setTaxCategoryId(editTaxCategoryId);

    const editRetailMrp = product?.retail_mrp;

    const editRetailDiscount =
      product?.retail_discount_value ??
      product?.retail_discount_percentage ??
      "";

    const editDistributorMrp = product?.distributor_mrp;

    const editDistributorDiscount =
      product?.distributor_discount_value ??
      product?.distributor_discount_percentage ??
      "";

    setRetailMrp(
      editRetailMrp !== null && editRetailMrp !== undefined
        ? String(editRetailMrp)
        : "",
    );

    setRetailDiscountValue(
      editRetailDiscount !== null && editRetailDiscount !== undefined
        ? String(editRetailDiscount)
        : "",
    );

    setDistributorMrp(
      editDistributorMrp !== null && editDistributorMrp !== undefined
        ? String(editDistributorMrp)
        : "",
    );

    setDistributorDiscountValue(
      editDistributorDiscount !== null && editDistributorDiscount !== undefined
        ? String(editDistributorDiscount)
        : "",
    );

    const editCommissionValue = product?.commission_value;

    setCommissionValue(
      editCommissionValue !== null && editCommissionValue !== undefined
        ? String(editCommissionValue)
        : "",
    );

    const editShippingCharge = product?.shipping_charge;

    setShippingCharge(
      editShippingCharge !== null && editShippingCharge !== undefined
        ? String(editShippingCharge)
        : "",
    );

    setStockQuantity(
      product?.stock_quantity !== null && product?.stock_quantity !== undefined
        ? String(product.stock_quantity)
        : "",
    );

    setLowStockThreshold(
      product?.low_stock_threshold !== null &&
        product?.low_stock_threshold !== undefined
        ? String(product.low_stock_threshold)
        : "10",
    );

    setIsPublished(
      product?.is_published === true ||
        product?.is_published === 1 ||
        product?.is_published === "1" ||
        product?.is_published === "true",
    );

    if (Array.isArray(product?.images)) {
      const existingImages: ImageItem[] = product.images.map(
        (img: any, index: number) => ({
          id: Date.now() + index,

          preview: img?.image_url || img?.image || "",

          sort_order: img?.sort_order ?? index + 1,

          is_primary:
            img?.is_primary === true ||
            img?.is_primary === 1 ||
            img?.is_primary === "1"
              ? 1
              : 0,

          existing_id: img?.id,

          is_existing: true,
        }),
      );

      setImages(existingImages);
    } else {
      setImages([]);
    }

    setVariants(generateVariantsFromProduct(product));

    setHydratedEditKey(productKey);
  }, [open, isEdit, editData, hydratedEditKey]);

  useEffect(() => {
    if (!open) {
      setHydratedEditKey(null);
      setDragOverImageId(null);
      draggedImageIdRef.current = null;
      setArrangingImageIds([]);
    }
  }, [open]);

  /* =========================================================
     RESET FORM ON CLOSE (fallback)
  ========================================================= */

  useEffect(() => {
    if (open) {
      return;
    }

    setProductCode("");
    setName("");
    setSlug("");
    setDescription("");

    setSpecification([{ key: "", value: "" }]);

    setCategoryId("");
    setSubcategoryId("");
    setBrandId("");
    setTaxCategoryId("");

    setRetailMrp("");
    setRetailDiscountValue("");
    setDistributorMrp("");
    setDistributorDiscountValue("");

    setCommissionValue("");
    setShippingCharge("");

    setStockQuantity("");
    setLowStockThreshold("10");

    setIsPublished(true);

    setImages([]);
    setVariants([]);
    setErrors({});
    setIsDragging(false);

    dragCounterRef.current = 0;

    draggedImageIdRef.current = null;

    setDragOverImageId(null);
    setArrangingImageIds([]);
  }, [open]);

  /* =========================================================
     ✅ BODY SCROLL LOCK + ESC KEY HANDLER
  ========================================================= */

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleEscKey);

    return () => {
      document.body.style.overflow = previousOverflow;

      window.removeEventListener("keydown", handleEscKey);
    };
  }, [open, handleClose]);

  if (!open) {
    return null;
  }

  /* =========================================================
     FORM HANDLERS
  ========================================================= */

  const handleNameChange = (value: string) => {
    setName(value);

    setSlug(
      value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    );

    setErrors((prev) => ({
      ...prev,
      name: undefined,
    }));
  };

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);

    setErrors((prev) => ({
      ...prev,
      category_id: undefined,
    }));

    if (!value) {
      setSubcategoryId("");
    }
  };

  const handleSubcategoryChange = (value: string) => {
    setSubcategoryId(value);

    setErrors((prev) => ({
      ...prev,
      subcategory_id: undefined,
    }));
  };

  const addSpecificationField = () => {
    setSpecification([...specification, { key: "", value: "" }]);
  };

  const removeSpecificationField = (index: number) => {
    if (specification.length <= 1) {
      return;
    }

    setSpecification(specification.filter((_, i) => i !== index));
  };

  const updateSpecification = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    setSpecification((prev) => {
      const newSpec = [...prev];

      newSpec[index] = {
        ...newSpec[index],
        [field]: value,
      };

      return newSpec;
    });
  };

  /* ADD IMAGE FILES */

  const addImageFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (fileArray.length === 0) {
      return;
    }

    const newImages: ImageItem[] = fileArray.map((file, index) => ({
      id: Date.now() + index + Math.random(),

      file,

      preview: URL.createObjectURL(file),

      sort_order: images.length + index + 1,

      is_primary: images.length === 0 && index === 0 ? 1 : 0,

      is_existing: false,
    }));

    setImages((prev) => [...prev, ...newImages]);

    setErrors((prev) => ({
      ...prev,
      images: undefined,
    }));
  };

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (!files) {
      return;
    }

    addImageFiles(files);

    e.target.value = "";
  };

  /* FILE DRAG / DROP */

  const handleDragEnter = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    dragCounterRef.current += 1;

    if (e.dataTransfer?.types?.includes("Files")) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    dragCounterRef.current -= 1;

    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    dragCounterRef.current = 0;
    setIsDragging(false);

    const files = e.dataTransfer?.files;

    if (files && files.length > 0) {
      addImageFiles(files);
    }
  };

  /* PRODUCT IMAGE DELETE */

  const removeImage = async (id: number) => {
    const imageToRemove = images.find((item) => item.id === id);

    if (!imageToRemove) {
      return;
    }

    if (isEdit && imageToRemove.is_existing) {
      const product = getProductObject(editData);

      const productId = Number(product?.id);

      const existingImageId = Number(imageToRemove.existing_id);

      if (
        !Number.isFinite(productId) ||
        productId <= 0 ||
        !Number.isFinite(existingImageId) ||
        existingImageId <= 0
      ) {
        console.error(
          "Unable to delete existing product image: invalid product/image id",
          {
            productId,
            existingImageId,
          },
        );

        return;
      }

      if (deletingImageIds.includes(existingImageId)) {
        return;
      }

      try {
        setDeletingImageIds((prev) => [...prev, existingImageId]);

        await productApi.deleteImages(productId, [existingImageId]);

        setImages((prev) => {
          let filtered = prev.filter((item) => item.id !== id);

          if (
            filtered.length > 0 &&
            !filtered.some((item) => item.is_primary === 1)
          ) {
            filtered = filtered.map((item, idx) => ({
              ...item,
              is_primary: idx === 0 ? 1 : item.is_primary,
            }));
          }

          return filtered.map((item, index) => ({
            ...item,
            sort_order: index + 1,
          }));
        });

        toast.success("Image deleted successfully");
      } catch (error) {
        console.error("Delete product image API error:", error);

        toast.error("Unable to delete image");
      } finally {
        setDeletingImageIds((prev) =>
          prev.filter((imageId) => imageId !== existingImageId),
        );
      }

      return;
    }

    setImages((prev) => {
      let filtered = prev.filter((item) => item.id !== id);

      if (
        filtered.length > 0 &&
        !filtered.some((item) => item.is_primary === 1)
      ) {
        filtered = filtered.map((item, idx) => ({
          ...item,
          is_primary: idx === 0 ? 1 : item.is_primary,
        }));
      }

      return filtered.map((item, index) => ({
        ...item,
        sort_order: index + 1,
      }));
    });
  };

  /* IMAGE ARRANGE / MOVE */

  const reorderImageItems = (sourceId: number, targetId: number) => {
    const sourceIndex = images.findIndex((item) => item.id === sourceId);

    const targetIndex = images.findIndex((item) => item.id === targetId);

    if (
      sourceIndex === -1 ||
      targetIndex === -1 ||
      sourceIndex === targetIndex
    ) {
      return images;
    }

    const newImages = [...images];

    [newImages[sourceIndex], newImages[targetIndex]] = [
      newImages[targetIndex],
      newImages[sourceIndex],
    ];

    return newImages.map((item, index) => ({
      ...item,
      sort_order: index + 1,
    }));
  };

  const handleImageDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    imageId: number,
  ) => {
    if (loading) {
      e.preventDefault();
      return;
    }

    draggedImageIdRef.current = imageId;

    setDragOverImageId(null);

    e.dataTransfer.effectAllowed = "move";

    e.dataTransfer.setData("text/plain", String(imageId));

    startAutoScroll();
  };

  const handleImageDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    imageId: number,
  ) => {
    if (loading) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const draggedId = draggedImageIdRef.current;

    if (draggedId === null || draggedId === imageId) {
      return;
    }

    e.dataTransfer.dropEffect = "move";

    setDragOverImageId(imageId);
  };

  const handleImageDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setDragOverImageId(null);
  };

  const handleImageDragEnd = () => {
    draggedImageIdRef.current = null;

    setDragOverImageId(null);

    stopAutoScroll();
  };

  const handleImageDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    targetImageId: number,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    stopAutoScroll();

    if (loading) {
      handleImageDragEnd();
      return;
    }

    const sourceImageId = draggedImageIdRef.current;

    setDragOverImageId(null);

    if (sourceImageId === null || sourceImageId === targetImageId) {
      handleImageDragEnd();
      return;
    }

    const sourceImage = images.find((item) => item.id === sourceImageId);

    const targetImage = images.find((item) => item.id === targetImageId);

    if (!sourceImage || !targetImage) {
      handleImageDragEnd();
      return;
    }

    const product = getProductObject(editData);

    const productId = Number(product?.id);

    const sourceExistingId = Number(sourceImage.existing_id);

    const targetExistingId = Number(targetImage.existing_id);

    const previousImages = [...images];

    const reorderedImages = reorderImageItems(sourceImageId, targetImageId);

    setImages(reorderedImages);

    draggedImageIdRef.current = null;

    const canCallMoveApi =
      isEdit &&
      Number.isFinite(productId) &&
      productId > 0 &&
      sourceImage.is_existing &&
      targetImage.is_existing &&
      Number.isFinite(sourceExistingId) &&
      sourceExistingId > 0 &&
      Number.isFinite(targetExistingId) &&
      targetExistingId > 0;

    if (!canCallMoveApi) {
      return;
    }

    try {
      setArrangingImageIds((prev) =>
        Array.from(new Set([...prev, sourceExistingId, targetExistingId])),
      );

      await productApi.moveProductImage(productId, {
        image_id_1: sourceExistingId,
        image_id_2: targetExistingId,
      });

      toast.success("Image order updated");
    } catch (error) {
      console.error("Move product image API error:", error);

      setImages(previousImages);

      toast.error("Unable to arrange images");
    } finally {
      setArrangingImageIds((prev) =>
        prev.filter((id) => id !== sourceExistingId && id !== targetExistingId),
      );
    }
  };

  /* VARIANTS */

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

  const updateVariant = (
    id: string,
    field: keyof VariantFormData,
    value: any,
  ) => {
    setVariants(
      variants.map((v) => {
        if (v.id === id) {
          return {
            ...v,
            [field]: value,
          };
        }

        return v;
      }),
    );
  };

  const updateVariantAttribute = (id: string, key: string, value: string) => {
    setVariants(
      variants.map((v) => {
        if (v.id === id) {
          const exists = v.attributes.some(
            (attr) => attr.key === key && attr.value === value,
          );

          if (exists) {
            return v;
          }

          return {
            ...v,
            attributes: [...v.attributes, { key, value }],
          };
        }

        return v;
      }),
    );
  };

  const removeVariantAttribute = (id: string, key: string, value: string) => {
    setVariants(
      variants.map((v) => {
        if (v.id === id) {
          return {
            ...v,
            attributes: v.attributes.filter(
              (attr) => !(attr.key === key && attr.value === value),
            ),
          };
        }

        return v;
      }),
    );
  };

  const handleVariantImages = (
    variantId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;

    if (!files) {
      return;
    }

    const variant = variants.find((v) => v.id === variantId);

    if (!variant) {
      return;
    }

    const fileArray = Array.from(files).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (fileArray.length === 0) {
      e.target.value = "";
      return;
    }

    const newImages: VariantImageItem[] = fileArray.map((file, index) => ({
      id: Date.now() + index + Math.random(),

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

    if (!variant) {
      return;
    }

    let filtered = variant.images.filter((img) => img.id !== imageId);

    if (filtered.length > 0 && !filtered.some((img) => img.is_primary === 1)) {
      filtered = filtered.map((img, idx) => ({
        ...img,
        is_primary: idx === 0 ? 1 : img.is_primary,
      }));
    }

    updateVariant(
      variantId,
      "images",
      filtered.map((img, index) => ({
        ...img,
        sort_order: index + 1,
      })),
    );
  };

  /* VALIDATE */

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

    if (!subcategoryId) {
      newErrors.subcategory_id = "Please select a subcategory";
    }

    if (!brandId) {
      newErrors.brand_id = "Please select a brand";
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

    if (
      shippingCharge !== "" &&
      (Number.isNaN(Number(shippingCharge)) || Number(shippingCharge) < 0)
    ) {
      newErrors.shipping_charge = "Please enter a valid shipping charge";
    }

    if (images.length === 0) {
      newErrors.images = "At least one product image is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  /* BUILD FORM DATA */

  const buildFormData = (): FormData => {
    const formData = new FormData();

    const specObject: Record<string, string> = {};

    specification.forEach((item) => {
      if (item.key.trim() && item.value.trim()) {
        specObject[item.key.trim()] = item.value.trim();
      }
    });

    formData.append("product_code", productCode);

    formData.append("name", name);

    formData.append("slug", slug);

    formData.append("description", description);

    formData.append("specification", JSON.stringify(specObject));

    formData.append("category_id", String(categoryId));

    formData.append("subcategory_id", String(subcategoryId));

    formData.append("brand_id", String(brandId));

    formData.append("tax_category_id", String(taxCategoryId));

    formData.append("stock_quantity", String(stockQuantity || 0));

    formData.append("low_stock_threshold", String(lowStockThreshold || 0));

    formData.append("is_published", String(isPublished ? 1 : 0));

    formData.append("is_trending", "0");

    formData.append("trending_sort_order", "0");

    formData.append("sale_type", "today_best");

    formData.append("retail_mrp", String(retailMrp || 0));

    formData.append("retail_discount_type", "percentage");

    formData.append("retail_discount_value", String(retailDiscountValue || 0));

    formData.append("distributor_mrp", String(distributorMrp || 0));

    formData.append("distributor_discount_type", "percentage");

    formData.append(
      "distributor_discount_value",
      String(distributorDiscountValue || 0),
    );

    formData.append("commission_value", String(Number(commissionValue || 0)));

    formData.append("shipping_charge", String(shippingCharge || 0));

    if (isEdit && editData) {
      const existingImageIds = images
        .filter((img) => img.is_existing && img.existing_id)
        .map((img) => img.existing_id);

      if (existingImageIds.length > 0) {
        formData.append("existing_image_ids", JSON.stringify(existingImageIds));
      }
    }

    const newImages = images.filter((img) => !img.is_existing);

    newImages.forEach((item, index) => {
      if (item.file) {
        formData.append(`product_images[${index}][image]`, item.file);

        formData.append(
          `product_images[${index}][sort_order]`,
          String(item.sort_order),
        );

        formData.append(
          `product_images[${index}][is_primary]`,
          String(item.is_primary),
        );
      }
    });

    variants.forEach((variant, vIndex) => {
      if (isEdit && variant.is_existing && variant.existing_id) {
        formData.append(`variants[${vIndex}][id]`, String(variant.existing_id));
      }

      formData.append(`variants[${vIndex}][sku]`, variant.sku);

      const attributesObject: Record<string, string> = {};

      variant.attributes.forEach((attr) => {
        if (attributesObject[attr.key]) {
          attributesObject[attr.key] =
            attributesObject[attr.key] + "," + attr.value;
        } else {
          attributesObject[attr.key] = attr.value;
        }
      });

      formData.append(
        `variants[${vIndex}][attributes]`,
        JSON.stringify(attributesObject),
      );

      formData.append(
        `variants[${vIndex}][retail_mrp]`,
        String(variant.retail_mrp || 0),
      );

      formData.append(
        `variants[${vIndex}][retail_discount_type]`,
        variant.retail_discount_type || "percentage",
      );

      formData.append(
        `variants[${vIndex}][retail_discount_value]`,
        String(variant.retail_discount_value || 0),
      );

      formData.append(
        `variants[${vIndex}][distributor_mrp]`,
        String(variant.distributor_mrp || 0),
      );

      formData.append(
        `variants[${vIndex}][distributor_discount_type]`,
        variant.distributor_discount_type || "percentage",
      );

      formData.append(
        `variants[${vIndex}][distributor_discount_value]`,
        String(variant.distributor_discount_value || 0),
      );

      formData.append(
        `variants[${vIndex}][stock_quantity]`,
        String(variant.stock_quantity || 0),
      );

      formData.append(
        `variants[${vIndex}][low_stock_threshold]`,
        String(variant.low_stock_threshold || 0),
      );

      formData.append(
        `variants[${vIndex}][sort_order]`,
        String(variant.sort_order),
      );

      formData.append(
        `variants[${vIndex}][is_active]`,
        String(variant.is_active),
      );

      const newVariantImages = variant.images.filter(
        (img) => !img.is_existing,
      );

      newVariantImages.forEach((img, imgIndex) => {
        if (img.file) {
          formData.append(
            `variants[${vIndex}][images][${imgIndex}][image]`,
            img.file,
          );

          formData.append(
            `variants[${vIndex}][images][${imgIndex}][sort_order]`,
            String(img.sort_order),
          );

          formData.append(
            `variants[${vIndex}][images][${imgIndex}][is_primary]`,
            String(img.is_primary),
          );
        }
      });

      if (isEdit) {
        const existingVariantImageIds = variant.images
          .filter((img) => img.is_existing && img.existing_id)
          .map((img) => img.existing_id);

        if (existingVariantImageIds.length > 0) {
          formData.append(
            `variants[${vIndex}][existing_image_ids]`,
            JSON.stringify(existingVariantImageIds),
          );
        }
      }
    });

    return formData;
  };

  /* SUBMIT */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      const firstError = document.querySelector(".error-message");

      if (firstError) {
        firstError.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }

      return;
    }

    const formData = buildFormData();

    console.log("SUBMIT FORM DATA:");

    for (const [key, value] of formData.entries()) {
      console.log(key, value);
    }

    onSubmit(formData);
  };

  /* =========================================================
     RENDER
  ========================================================= */

  const productName = getProductObject(editData)?.name || "Product";

  return (
    <>
      {/* BACKDROP */}
      <div
        className="fixed inset-0 z-[100] bg-[#0B1330]/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center p-3 font-poppins sm:p-5">
        <div
          className="pointer-events-auto relative flex h-[92vh] w-full max-w-[1240px] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_-20px_rgba(11,19,48,0.6)] ring-1 ring-white/20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* =====================================================
              HEADER
          ===================================================== */}

          <div className="relative flex-shrink-0 overflow-hidden bg-gradient-to-br from-[#0F1B3D] via-[#1E3A8A] to-[#2563EB] px-6 py-5 text-white">
            <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-[#60A5FA]/20 blur-3xl" />

            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
                  {isEdit ? <FiEdit2 size={22} /> : <FiPlus size={24} />}
                </span>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold leading-tight sm:text-2xl">
                      {isEdit ? "Edit product" : "Add new product"}
                    </h2>

                    <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-white/25">
                      {isEdit ? "Editing" : "Draft"}
                    </span>
                  </div>

                  <p className="mt-0.5 text-sm text-blue-100/90">
                    {isEdit
                      ? `Editing: ${productName}`
                      : "Fill in the product details, pricing, variants and images"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-full bg-white/10 py-1.5 pl-3 pr-4 ring-1 ring-white/20 backdrop-blur sm:flex">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#7DD3FC] to-white transition-all duration-500"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>

                  <span className="text-xs font-semibold">
                    {completionPercent}% complete
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Close"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* =====================================================
              BODY
          ===================================================== */}

          <div
            ref={bodyScrollRef}
            className="flex-1 overflow-y-auto overscroll-contain bg-[#F4F7FD] p-4 sm:p-6"
          >
            <form onSubmit={handleSubmit} id="product-form">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
                {/* =================================================
                    LEFT SIDE
                ================================================= */}

                <div className="min-w-0 space-y-6">
                  {/* BASIC INFORMATION */}

                  <SectionCard
                    icon={<FiInfo size={19} />}
                    title="Basic information"
                    subtitle="Name, code and where this product lives in your catalog"
                  >
                    <div className="space-y-4">
                      <Field
                        label="Product name"
                        required
                        error={errors.name}
                      >
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => handleNameChange(e.target.value)}
                          placeholder="e.g. SoundMax Pro 5G Smartphone"
                          className={inputCls(!!errors.name, "!h-12 !text-[15px] font-medium")}
                        />
                      </Field>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field
                          label="SKU / Product code"
                          required
                          error={errors.product_code}
                        >
                          <input
                            type="text"
                            value={productCode}
                            onChange={(e) => setProductCode(e.target.value)}
                            placeholder="e.g. SMP5G-BLACK-128"
                            className={inputCls(!!errors.product_code)}
                          />
                        </Field>

                        <Field
                          label="Slug"
                          hint="Auto-generated from product name"
                        >
                          <input
                            type="text"
                            value={slug}
                            readOnly
                            placeholder="product-slug"
                            className={inputCls(
                              false,
                              "cursor-not-allowed !bg-slate-100 font-mono !text-xs !text-slate-500",
                            )}
                          />
                        </Field>
                      </div>

                      <div className="h-px bg-slate-100" />

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field
                          label="Category"
                          required
                          error={errors.category_id}
                        >
                          <SelectBox
                            value={categoryId}
                            onChange={handleCategoryChange}
                            placeholder="Select category..."
                            options={categories}
                            icon={<FiTag size={16} />}
                            hasError={!!errors.category_id}
                          />
                        </Field>

                        <Field
                          label="Sub category"
                          required
                          error={errors.subcategory_id}
                        >
                          <SelectBox
                            value={subcategoryId}
                            onChange={handleSubcategoryChange}
                            placeholder="Select subcategory..."
                            options={subcategories}
                            icon={<FiLayers size={16} />}
                            hasError={!!errors.subcategory_id}
                          />
                        </Field>

                        <Field
                          label="Brand"
                          required
                          error={errors.brand_id}
                        >
                          <SelectBox
                            value={brandId}
                            onChange={(v) => {
                              setBrandId(v);

                              setErrors((prev) => ({
                                ...prev,
                                brand_id: undefined,
                              }));
                            }}
                            placeholder="Select brand..."
                            options={brands}
                            icon={<FiAward size={16} />}
                            hasError={!!errors.brand_id}
                          />
                        </Field>

                        <Field
                          label="Tax category"
                          required
                          error={errors.tax_category_id}
                        >
                          <SelectBox
                            value={taxCategoryId}
                            onChange={(v) => {
                              setTaxCategoryId(v);

                              setErrors((prev) => ({
                                ...prev,
                                tax_category_id: undefined,
                              }));
                            }}
                            placeholder="Select tax..."
                            options={taxCategories}
                            icon={<FiPercent size={16} />}
                            hasError={!!errors.tax_category_id}
                          />
                        </Field>
                      </div>
                    </div>
                  </SectionCard>

                  {/* DESCRIPTION / SPECIFICATION */}

                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <SectionCard
                      icon={<FiAlignLeft size={19} />}
                      title="Description"
                      subtitle="What customers will read"
                    >
                      <textarea
                        rows={9}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter product description..."
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3 text-sm leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#1E3A8A] focus:bg-white focus:ring-4 focus:ring-[#1E3A8A]/10"
                      />
                    </SectionCard>

                    <SectionCard
                      icon={<FiGrid size={19} />}
                      title="Specification"
                      subtitle="Key–value details"
                      action={
                        <button
                          type="button"
                          onClick={addSpecificationField}
                          className={`${softBtn} h-9 px-3 text-xs`}
                        >
                          <FiPlus size={14} />
                          Add field
                        </button>
                      }
                    >
                      <div className="max-h-[260px] space-y-2.5 overflow-y-auto pr-1">
                        {specification.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={item.key}
                              onChange={(e) =>
                                updateSpecification(index, "key", e.target.value)
                              }
                              placeholder="Key (e.g., Display)"
                              className={inputCls(false, "!h-10 flex-1 min-w-0")}
                            />

                            <input
                              type="text"
                              value={item.value}
                              onChange={(e) =>
                                updateSpecification(
                                  index,
                                  "value",
                                  e.target.value,
                                )
                              }
                              placeholder="Value (e.g., 6.7-inch AMOLED)"
                              className={inputCls(false, "!h-10 flex-1 min-w-0")}
                            />

                            <button
                              type="button"
                              onClick={() => removeSpecificationField(index)}
                              disabled={specification.length <= 1}
                              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  </div>

                  {/* PRODUCT IMAGES */}

                  <SectionCard
                    icon={<FiImage size={19} />}
                    title="Product images"
                    required
                    subtitle={
                      images.length > 0
                        ? `${images.length} image${images.length !== 1 ? "s" : ""} · first image is the cover`
                        : "Upload at least one image"
                    }
                    action={
                      <label className={`${primaryBtn} h-10 cursor-pointer px-4 text-sm`}>
                        <FiPlus size={16} />
                        Add images
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={handleImages}
                        />
                      </label>
                    }
                  >
                    {images.length > 1 && (
                      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-[#2563EB]/15 bg-[#EAF1FF]/60 px-3.5 py-2.5 text-xs text-slate-600">
                        <FiMove size={14} className="text-[#2563EB]" />

                        <span>Drag and drop images to arrange their order.</span>

                        {isEdit && (
                          <span className="font-semibold text-[#1E3A8A]">
                            Existing images are updated instantly.
                          </span>
                        )}
                      </div>
                    )}

                    {errors.images && (
                      <p className="error-message mb-3 flex items-center gap-1 text-xs font-medium text-rose-600">
                        <FiInfo size={13} />
                        {errors.images}
                      </p>
                    )}

                    <div
                      onDragEnter={handleDragEnter}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className="relative"
                    >
                      {images.length === 0 ? (
                        <label
                          className={`group flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 text-center transition-all ${
                            isDragging
                              ? "scale-[1.01] border-[#1E3A8A] bg-[#EAF1FF]"
                              : errors.images
                                ? "border-rose-300 bg-rose-50/40"
                                : "border-slate-300 bg-slate-50/70 hover:border-[#2563EB] hover:bg-[#EAF1FF]/60"
                          }`}
                        >
                          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#2563EB] shadow-md ring-1 ring-slate-200 transition group-hover:-translate-y-0.5">
                            <FiUploadCloud size={26} />
                          </span>

                          <p className="mt-3 text-sm font-semibold text-[#0F1B3D]">
                            {isDragging
                              ? "Drop images here"
                              : "Upload product images"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Drag & drop, or{" "}
                            <span className="font-semibold text-[#2563EB]">
                              browse files
                            </span>{" "}
                            to select multiple images
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
                        <div
                          className={`grid grid-cols-2 gap-3 rounded-2xl border-2 border-transparent p-1 transition-colors sm:grid-cols-3 xl:grid-cols-4 ${
                            isDragging
                              ? "border-dashed !border-[#1E3A8A] bg-[#EAF1FF]"
                              : ""
                          }`}
                        >
                          {images.map((item, index) => {
                            const isArranging =
                              item.is_existing && item.existing_id
                                ? arrangingImageIds.includes(
                                    Number(item.existing_id),
                                  )
                                : false;

                            return (
                              <div
                                key={item.id}
                                draggable={!loading && !isArranging}
                                onDragStart={(e) =>
                                  handleImageDragStart(e, item.id)
                                }
                                onDragOver={(e) =>
                                  handleImageDragOver(e, item.id)
                                }
                                onDragLeave={handleImageDragLeave}
                                onDrop={(e) => handleImageDrop(e, item.id)}
                                onDragEnd={handleImageDragEnd}
                                className={`group relative aspect-square cursor-grab overflow-hidden rounded-2xl border bg-slate-100 shadow-sm transition-all active:cursor-grabbing ${
                                  dragOverImageId === item.id
                                    ? "scale-[1.03] border-[#1E3A8A] ring-4 ring-[#2563EB]/25"
                                    : "border-slate-200"
                                } ${
                                  isArranging
                                    ? "opacity-70"
                                    : "hover:-translate-y-0.5 hover:shadow-lg"
                                }`}
                              >
                                <img
                                  src={item.preview}
                                  alt="Product"
                                  className="h-full w-full object-cover"
                                  draggable={false}
                                />

                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 opacity-60 transition-opacity group-hover:opacity-100" />

                                {/* ORDER / COVER BADGE */}
                                <span
                                  className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold shadow ${
                                    index === 0
                                      ? "bg-[#1E3A8A] text-white"
                                      : "bg-white/90 text-slate-700"
                                  }`}
                                >
                                  {index === 0 ? "Cover" : `#${index + 1}`}
                                </span>

                                {/* DRAG HANDLE */}
                                <div className="absolute bottom-2 left-2 flex h-7 items-center gap-1 rounded-full bg-black/55 px-2 text-[10px] font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                                  <FiMove size={12} />
                                  Drag
                                </div>

                               

                                {/* ARRANGE LOADER */}
                                {isArranging && (
                                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#1E3A8A]/20 border-t-[#1E3A8A]" />
                                  </div>
                                )}

                                {/* DELETE */}
                                <button
                                  type="button"
                                  onClick={() => removeImage(item.id)}
                                  disabled={
                                    item.is_existing &&
                                    !!item.existing_id &&
                                    deletingImageIds.includes(
                                      Number(item.existing_id),
                                    )
                                  }
                                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-rose-600 shadow transition-colors hover:bg-rose-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <FiX size={14} />
                                </button>
                              </div>
                            );
                          })}

                          {/* ADD MORE */}
                          <label
                            className={`flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors ${
                              isDragging
                                ? "border-[#1E3A8A] bg-[#EAF1FF]"
                                : "border-slate-300 bg-slate-50 hover:border-[#2563EB] hover:bg-[#EAF1FF]/60"
                            }`}
                          >
                            <FiPlus size={22} className="text-[#2563EB]" />

                            <span className="mt-1 text-xs font-semibold text-slate-600">
                              Add more
                            </span>

                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              className="hidden"
                              onChange={handleImages}
                            />
                          </label>
                        </div>
                      )}

                      {/* FILE DROP OVERLAY */}
                      {isDragging && (
                        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-[#1E3A8A] bg-[#EAF1FF]/85 backdrop-blur-[1px]">
                          <div className="flex flex-col items-center text-[#1E3A8A]">
                            <FiUploadCloud size={36} />

                            <span className="mt-1 text-sm font-bold">
                              Drop to upload
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </SectionCard>

                  {/* VARIANTS */}

                  <SectionCard
                    icon={<FiPackage size={19} />}
                    title="Variants"
                    subtitle={`${variants.length} variant${variants.length !== 1 ? "s" : ""} · size, color, storage and more`}
                    action={
                      <button
                        type="button"
                        onClick={addVariant}
                        className={`${primaryBtn} h-10 px-4 text-sm`}
                      >
                        <FiPlus size={16} />
                        Add variant
                      </button>
                    }
                  >
                    {variants.length === 0 ? (
                      <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 px-4 py-10 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#2563EB] shadow ring-1 ring-slate-200">
                          <FiPackage size={22} />
                        </span>

                        <p className="mt-3 text-sm font-semibold text-[#0F1B3D]">
                          No variants yet
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Add a variant if this product comes in different
                          options.
                        </p>

                        <button
                          type="button"
                          onClick={addVariant}
                          className={`${softBtn} mt-4 h-9 px-4 text-xs`}
                        >
                          <FiPlus size={14} />
                          Add variant
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {variants.map((variant, index) => (
                          <div
                            key={variant.id}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                          >
                            {/* VARIANT HEADER */}
                            <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-[#EAF1FF] to-[#F4F7FD] px-4 py-3">
                              <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E3A8A] text-sm font-bold text-white">
                                  {index + 1}
                                </span>

                                <div>
                                  <h4 className="text-sm font-bold text-[#0F1B3D]">
                                    Variant {index + 1}
                                  </h4>

                                  <p className="text-xs text-slate-500">
                                    {variant.sku || "No SKU yet"}
                                  </p>
                                </div>

                                {variant.is_existing && (
                                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[#2563EB] ring-1 ring-[#2563EB]/20">
                                    Existing
                                  </span>
                                )}

                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                    variant.is_active
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-slate-200 text-slate-600"
                                  }`}
                                >
                                  {variant.is_active ? "Active" : "Inactive"}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeVariant(variant.id)}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                aria-label="Remove variant"
                              >
                                <FiTrash2 size={17} />
                              </button>
                            </div>

                            <div className="p-4">
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Field label="SKU" small>
                                  <input
                                    type="text"
                                    value={variant.sku}
                                    onChange={(e) =>
                                      updateVariant(
                                        variant.id,
                                        "sku",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="e.g. SMP5G-BLACK-128"
                                    className={inputCls(false, "!h-10")}
                                  />
                                </Field>

                                <Field label="Attributes" small>
                                  <AttributeSelector
                                    variantId={variant.id}
                                    selectedAttributes={variant.attributes}
                                    availableAttributes={attributeMasters}
                                    onAddAttribute={updateVariantAttribute}
                                    onRemoveAttribute={removeVariantAttribute}
                                  />
                                </Field>
                              </div>

                              <div className="my-4 h-px bg-slate-100" />

                              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                <Field label="Retail MRP" small>
                                  <AdornedInput
                                    compact
                                    prefix="₹"
                                    value={variant.retail_mrp}
                                    placeholder="100000"
                                    onChange={(val) => {
                                      if (isValidDecimalInput(val)) {
                                        updateVariant(
                                          variant.id,
                                          "retail_mrp",
                                          val,
                                        );
                                      }
                                    }}
                                  />
                                </Field>

                                <Field label="Discount" small>
                                  <AdornedInput
                                    compact
                                    suffix="%"
                                    value={variant.retail_discount_value}
                                    placeholder="40"
                                    onChange={(val) => {
                                      if (isValidDecimalInput(val)) {
                                        updateVariant(
                                          variant.id,
                                          "retail_discount_value",
                                          val,
                                        );
                                      }
                                    }}
                                  />
                                </Field>

                                <Field label="Distributor MRP" small>
                                  <AdornedInput
                                    compact
                                    prefix="₹"
                                    value={variant.distributor_mrp}
                                    placeholder="90000"
                                    onChange={(val) => {
                                      if (isValidDecimalInput(val)) {
                                        updateVariant(
                                          variant.id,
                                          "distributor_mrp",
                                          val,
                                        );
                                      }
                                    }}
                                  />
                                </Field>

                                <Field label="Distributor discount" small>
                                  <AdornedInput
                                    compact
                                    suffix="%"
                                    value={variant.distributor_discount_value}
                                    placeholder="35"
                                    onChange={(val) => {
                                      if (isValidDecimalInput(val)) {
                                        updateVariant(
                                          variant.id,
                                          "distributor_discount_value",
                                          val,
                                        );
                                      }
                                    }}
                                  />
                                </Field>

                                <Field label="Stock" small>
                                  <AdornedInput
                                    compact
                                    inputMode="numeric"
                                    value={variant.stock_quantity}
                                    placeholder="20"
                                    onChange={(val) => {
                                      if (isValidIntegerInput(val)) {
                                        updateVariant(
                                          variant.id,
                                          "stock_quantity",
                                          val,
                                        );
                                      }
                                    }}
                                  />
                                </Field>

                                <Field label="Low stock alert" small>
                                  <AdornedInput
                                    compact
                                    inputMode="numeric"
                                    value={variant.low_stock_threshold}
                                    placeholder="5"
                                    onChange={(val) => {
                                      if (isValidIntegerInput(val)) {
                                        updateVariant(
                                          variant.id,
                                          "low_stock_threshold",
                                          val,
                                        );
                                      }
                                    }}
                                  />
                                </Field>

                                <Field label="Status" small>
                                  <div className="relative">
                                    <select
                                      value={variant.is_active}
                                      onChange={(e) =>
                                        updateVariant(
                                          variant.id,
                                          "is_active",
                                          Number(e.target.value),
                                        )
                                      }
                                      className={inputCls(
                                        false,
                                        "!h-10 cursor-pointer appearance-none !pr-9",
                                      )}
                                    >
                                      <option value={1}>Active</option>

                                      <option value={0}>Inactive</option>
                                    </select>

                                    <FiChevronDown
                                      size={15}
                                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                  </div>
                                </Field>
                              </div>

                              {/* VARIANT IMAGES */}
                              <div className="mt-4 rounded-xl bg-slate-50 p-3">
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                                    <FiImage size={14} />
                                    Variant images
                                    <span className="font-normal text-slate-400">
                                      ({variant.images.length})
                                    </span>
                                  </span>

                                  <label
                                    className={`${softBtn} h-8 cursor-pointer px-3 text-xs`}
                                  >
                                    <FiPlus size={12} />
                                    Add images
                                    <input
                                      type="file"
                                      multiple
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) =>
                                        handleVariantImages(variant.id, e)
                                      }
                                    />
                                  </label>
                                </div>

                                {variant.images.length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-2.5">
                                    {variant.images.map((img) => (
                                      <div
                                        key={img.id}
                                        className="group relative h-[72px] w-[72px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                                      >
                                        <img
                                          src={img.preview}
                                          alt="Variant"
                                          className="h-full w-full object-cover"
                                          draggable={false}
                                        />

                                        <span
                                          className={`absolute left-1 top-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                                            img.is_primary
                                              ? "bg-[#1E3A8A] text-white"
                                              : "bg-white/90 text-slate-600"
                                          }`}
                                        >
                                          {img.is_primary ? "Main" : "Img"}
                                        </span>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeVariantImage(
                                              variant.id,
                                              img.id,
                                            )
                                          }
                                          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/95 text-rose-600 opacity-0 shadow transition group-hover:opacity-100 hover:bg-rose-600 hover:text-white"
                                        >
                                          <FiX size={11} />
                                        </button>

                                        {img.is_existing && (
                                          <span className="absolute bottom-0 left-0 right-0 bg-[#1E3A8A]/90 py-0.5 text-center text-[8px] font-medium text-white">
                                            Saved
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </SectionCard>
                </div>

                {/* =================================================
                    RIGHT SIDE
                ================================================= */}

                <aside className="min-w-0 space-y-6 lg:sticky lg:top-0 lg:self-start">
                  {/* LIVE PRICE PREVIEW */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F1B3D] via-[#1E3A8A] to-[#2563EB] p-5 text-white shadow-[0_20px_40px_-16px_rgba(30,58,138,0.6)]">
                    <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

                    <p className="relative text-xs font-medium text-blue-100">
                      Customer pays (retail)
                    </p>

                    <div className="relative mt-1 flex items-end gap-2">
                      <span className="text-3xl font-bold tracking-tight">
                        ₹{formatINR(pricePreview.retail.final)}
                      </span>

                      {pricePreview.retail.discount > 0 &&
                        pricePreview.retail.mrp > 0 && (
                          <span className="mb-1 text-sm text-blue-200 line-through">
                            ₹{formatINR(pricePreview.retail.mrp)}
                          </span>
                        )}
                    </div>

                    <div className="relative mt-3 flex flex-wrap items-center gap-2 text-xs">
                      {pricePreview.retail.discount > 0 && (
                        <span className="rounded-full bg-emerald-400/20 px-2.5 py-1 font-semibold text-emerald-200 ring-1 ring-emerald-300/30">
                          {pricePreview.retail.discount}% off · save ₹
                          {formatINR(pricePreview.retail.saved)}
                        </span>
                      )}

                      {pricePreview.distributor.mrp > 0 && (
                        <span className="rounded-full bg-white/10 px-2.5 py-1 font-medium ring-1 ring-white/20">
                          Distributor ₹{formatINR(pricePreview.distributor.final)}
                        </span>
                      )}

                      {pricePreview.retail.mrp === 0 && (
                        <span className="text-blue-200">
                          Enter MRP to preview the final price
                        </span>
                      )}
                    </div>
                  </div>

                  {/* PRICING */}
                  <SectionCard
                    icon={<FaRupeeSign size={17} />}
                    title="Pricing"
                    subtitle="Retail, distributor and shipping"
                  >
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <Field
                          label="Retail MRP"
                          required
                          error={errors.retail_mrp}
                        >
                          <AdornedInput
                            prefix="₹"
                            value={retailMrp}
                            placeholder="100000"
                            hasError={!!errors.retail_mrp}
                            onChange={(val) => {
                              if (isValidDecimalInput(val)) {
                                setRetailMrp(val);

                                setErrors((prev) => ({
                                  ...prev,
                                  retail_mrp: undefined,
                                }));
                              }
                            }}
                          />
                        </Field>

                        <Field label="Discount">
                          <AdornedInput
                            suffix="%"
                            value={retailDiscountValue}
                            placeholder="40"
                            onChange={(val) => {
                              if (isValidDecimalInput(val)) {
                                setRetailDiscountValue(val);
                              }
                            }}
                          />
                        </Field>

                        <Field label="Distributor MRP">
                          <AdornedInput
                            prefix="₹"
                            value={distributorMrp}
                            placeholder="90000"
                            onChange={(val) => {
                              if (isValidDecimalInput(val)) {
                                setDistributorMrp(val);
                              }
                            }}
                          />
                        </Field>

                        <Field label="Distributor disc.">
                          <AdornedInput
                            suffix="%"
                            value={distributorDiscountValue}
                            placeholder="35"
                            onChange={(val) => {
                              if (isValidDecimalInput(val)) {
                                setDistributorDiscountValue(val);
                              }
                            }}
                          />
                        </Field>
                      </div>

                      <div className="h-px bg-slate-100" />

                      <Field label="Commission value">
                        <AdornedInput
                          inputMode="numeric"
                          value={commissionValue}
                          placeholder="0"
                          onChange={(val) => {
                            if (isValidIntegerInput(val)) {
                              setCommissionValue(val);
                            }
                          }}
                        />
                      </Field>

                      <Field
                        label="Shipping charge"
                        icon={<FiTruck size={14} className="text-[#2563EB]" />}
                        error={errors.shipping_charge}
                        hint="Enter 0 for free shipping"
                      >
                        <AdornedInput
                          prefix="₹"
                          value={shippingCharge}
                          placeholder="0"
                          hasError={!!errors.shipping_charge}
                          onChange={(val) => {
                            if (isValidDecimalInput(val)) {
                              setShippingCharge(val);

                              setErrors((prev) => ({
                                ...prev,
                                shipping_charge: undefined,
                              }));
                            }
                          }}
                        />
                      </Field>
                    </div>
                  </SectionCard>

                  {/* INVENTORY */}
                  <SectionCard
                    icon={<FiPackage size={19} />}
                    title="Inventory"
                    subtitle="Stock and alerts"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <Field
                        label="Stock quantity"
                        required
                        error={errors.stock_quantity}
                      >
                        <AdornedInput
                          inputMode="numeric"
                          value={stockQuantity}
                          placeholder="100"
                          hasError={!!errors.stock_quantity}
                          onChange={(val) => {
                            if (isValidIntegerInput(val)) {
                              setStockQuantity(val);

                              setErrors((prev) => ({
                                ...prev,
                                stock_quantity: undefined,
                              }));
                            }
                          }}
                        />
                      </Field>

                      <Field label="Low stock at">
                        <AdornedInput
                          inputMode="numeric"
                          value={lowStockThreshold}
                          placeholder="10"
                          onChange={(val) => {
                            if (isValidIntegerInput(val)) {
                              setLowStockThreshold(val);
                            }
                          }}
                        />
                      </Field>
                    </div>

                    <p className="mt-3 flex items-center gap-1 text-xs text-slate-400">
                      <FiInfo size={12} />
                      You'll be notified when stock falls below this number
                    </p>
                  </SectionCard>

                  {/* PUBLISHING */}
                  <SectionCard
                    icon={<FiTag size={19} />}
                    title="Publishing"
                    subtitle="Control store visibility"
                  >
                    <div
                      className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-colors ${
                        isPublished
                          ? "border-emerald-200 bg-emerald-50/70"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-bold text-[#0F1B3D]">
                          {isPublished ? "Published" : "Hidden"}
                        </p>

                        <p className="text-xs text-slate-500">
                          {isPublished
                            ? "Visible to customers"
                            : "Not visible to customers"}
                        </p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={isPublished}
                        onClick={() => setIsPublished(!isPublished)}
                        className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-colors ${
                          isPublished ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                            isPublished ? "left-[22px]" : "left-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  </SectionCard>

                  {/* CHECKLIST */}
                  <SectionCard
                    icon={<FiCheck size={19} />}
                    title="Before you save"
                    subtitle={`${completedCount} of ${checklist.length} required items done`}
                  >
                    <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#1E3A8A] transition-all duration-500"
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>

                    <ul className="grid grid-cols-2 gap-x-3 gap-y-2">
                      {checklist.map((item) => (
                        <li
                          key={item.label}
                          className="flex items-center gap-2 text-xs"
                        >
                          <span
                            className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
                              item.done
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-200 text-transparent"
                            }`}
                          >
                            <FiCheck size={10} strokeWidth={3} />
                          </span>

                          <span
                            className={
                              item.done
                                ? "font-medium text-slate-700"
                                : "text-slate-400"
                            }
                          >
                            {item.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </SectionCard>
                </aside>
              </div>
            </form>
          </div>

          {/* =====================================================
              FOOTER
          ===================================================== */}

          <div className="flex flex-shrink-0 flex-col gap-3 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
            {loading && uploadProgress && (
              <UploadProgressBar
                percent={uploadProgress.percent}
                loaded={uploadProgress.loaded}
                total={uploadProgress.total}
                bytesPerSecond={uploadProgress.bytesPerSecond}
                estimatedRemainingMs={uploadProgress.estimatedRemainingMs}
                label={
                  isEdit
                    ? "Updating product & images…"
                    : "Uploading product & images…"
                }
              />
            )}

            <div className="flex items-center justify-between gap-3">
              <p className="hidden text-xs text-slate-500 sm:block">
                <span className="font-semibold text-[#1E3A8A]">
                  {completedCount}/{checklist.length}
                </span>{" "}
                required items complete · press{" "}
                <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-slate-600">
                  Esc
                </kbd>{" "}
                to close
              </p>

              <div className="ml-auto flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    fetchingOptions ||
                    arrangingImageIds.length > 0 ||
                    !canSubmit
                  }
                  onClick={handleSubmit}
                  className={`${primaryBtn} h-11 min-w-[160px] px-8 text-sm`}
                >
                  {loading ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />

                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>

                      {isEdit ? "Updating..." : "Adding..."}
                    </>
                  ) : fetchingOptions ? (
                    "Loading..."
                  ) : isEdit ? (
                    "Update product"
                  ) : (
                    "Add product"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddProductModal;