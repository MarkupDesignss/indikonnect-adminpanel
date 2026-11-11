import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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
  FiSliders,
  FiMinus,
  FiTool,
  FiEye,
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import { toast } from "react-hot-toast";

import { categoryApi } from "../../../../api/endpoints/category";
import { taxApi } from "../../../../api/endpoints/taxApi";
import brandsApi from "../../../../api/endpoints/brands";
import {
  productApi,
  type UploadProgressMeta,
} from "../../../../api/endpoints/product";
import { usePermissions } from "../../../permissions/usePermissions";
import UploadProgressBar from "./UploadProgressBar";

/* =========================================================
   TYPES
========================================================= */

type ProductType = "single" | "combo";

interface SelectOption {
  id: number;
  name: string;
}

interface CategoryProductOption extends SelectOption {
  product_code?: string;
  image_url?: string;
  category_id?: number | string;
  category_name?: string;
}

interface VariantItem {
  product_id: number;
  hax_color: string;
  variantId?: number;
  productName?: string;
  productCode?: string;
  productImage?: string;
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
  service_charge?: string;
  reason_for_stock_adjustment?: string;
  manual_stock_adjustment?: string;
  combo_products?: string;
}

interface SpecItem {
  key: string;
  value: string;
  isDefault?: boolean;
}

type StockAdjustmentOperation = "add" | "subtract";

/* =========================================================
   HELPERS
========================================================= */

const isValidDecimalInput = (value: string): boolean =>
  /^\d*\.?\d*$/.test(value);

const isValidIntegerInput = (value: string): boolean => /^\d*$/.test(value);

const isValidHexColor = (value: string): boolean =>
  /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());

const getProductObject = (editData: any) => {
  if (!editData) return null;

  return (
    editData?.data?.data?.data ??
    editData?.data?.data ??
    editData?.data ??
    editData?.product ??
    editData
  );
};

const normalizeId = (value: any): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }
  return String(value).trim();
};

const formatINR = (amount: number): string =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);

const parseSpecification = (spec: string | Record<string, any>): SpecItem[] => {
  let parsed: any = {};
  try {
    parsed = typeof spec === "string" ? JSON.parse(spec) : spec;
  } catch {
    parsed = {};
  }

  if (!parsed || typeof parsed !== "object") {
    parsed = {};
  }

  const entries = Object.entries(parsed).map(([key, value]) => ({
    key,
    value: String(value ?? ""),
    isDefault: key.trim() === "Manufactured By" || key.trim() === "Marketed By",
  }));

  const hasManufacturedBy = entries.some(
    (e) => e.key.trim() === "Manufactured By",
  );
  const hasMarketedBy = entries.some((e) => e.key.trim() === "Marketed By");

  if (!hasManufacturedBy) {
    entries.unshift({ key: "Manufactured By", value: "", isDefault: true });
  }
  if (!hasMarketedBy) {
    entries.unshift({ key: "Marketed By", value: "", isDefault: true });
  }

  return entries.length ? entries : [{ key: "", value: "" }];
};

const getApiArray = (response: any): any[] => {
  const candidates = [
    response?.data?.data?.data,
    response?.data?.data,
    response?.data,
  ];

  return candidates.find(Array.isArray) || [];
};

const isElectronicsCategoryName = (name?: string | null): boolean => {
  if (!name) return false;
  const normalized = String(name).trim().toLowerCase();
  return normalized.includes("electronic");
};

/* =========================================================
   SMALL UI BUILDING BLOCKS (Soft UI)
========================================================= */

const inputCls = (hasError?: boolean, extra = "") =>
  `h-11 w-full rounded-xl border ${hasError
    ? "border-rose-400 bg-rose-50/50"
    : "border-slate-200 bg-slate-50/80 hover:border-slate-300"
  } px-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 ${extra}`;

const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

const softBtn =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 font-semibold text-blue-600 transition hover:bg-blue-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

const SectionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}> = ({ icon, title, subtitle, action, required, children }) => (
  <section className="overflow-visible rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
    <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
          {icon}
        </span>

        <div>
          <h3 className="text-[15px] font-bold leading-tight text-slate-800">
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
  <div className="min-w-0">
    <label
      className={`mb-1.5 flex items-center gap-1.5 font-semibold ${small ? "text-xs text-slate-600" : "text-[13px] text-slate-700"
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
  onChange: (value: string) => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  inputMode?: "decimal" | "numeric";
  hasError?: boolean;
  compact?: boolean;
  disabled?: boolean;
}> = ({
  value,
  onChange,
  placeholder,
  prefix,
  suffix,
  inputMode = "decimal",
  hasError,
  compact,
  disabled,
}) => (
    <div className="relative">
      {prefix && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-blue-500">
          {prefix}
        </span>
      )}

      <input
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`${inputCls(
          hasError,
          compact ? "!h-10" : "",
        )} ${prefix ? "!pl-8" : ""} ${suffix ? "!pr-10" : ""
          } disabled:cursor-not-allowed disabled:opacity-60`}
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
  onChange: (value: string) => void;
  placeholder: string;
  options: SelectOption[];
  icon: React.ReactNode;
  hasError?: boolean;
  disabled?: boolean;
}> = ({ value, onChange, placeholder, options, icon, hasError, disabled }) => (
  <div className="relative">
    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500">
      {icon}
    </span>

    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={`${inputCls(
        hasError,
      )} cursor-pointer appearance-none !pl-10 !pr-10 disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <option value="">{placeholder}</option>

      {value && !options.some((option) => String(option.id) === value) && (
        <option value={value}>Loading... (ID: {value})</option>
      )}

      {options.map((option) => (
        <option key={option.id} value={String(option.id)}>
          {option.name}
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
   PRODUCT TYPE DROPDOWN  (default: Individual)
========================================================= */

const ProductTypeDropdown: React.FC<{
  value: ProductType;
  onChange: (value: ProductType) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => (
  <div className="relative">
    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500">
      {value === "combo" ? <FiLayers size={16} /> : <FiPackage size={16} />}
    </span>

    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as ProductType)}
      className={`${inputCls(
        false,
      )} cursor-pointer appearance-none !pl-10 !pr-10 disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <option value="single">Individual</option>
      <option value="combo">Combo</option>
    </select>

    <FiChevronDown
      size={16}
      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
    />
  </div>
);

/* =========================================================
   CUSTOM VARIANT PRODUCT SELECT
========================================================= */

const VariantProductSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  products: CategoryProductOption[];
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
}> = ({ value, onChange, products, placeholder, disabled, loading }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selected = products.find((p) => String(p.id) === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`${inputCls(false)} flex cursor-pointer items-center gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {selected ? (
          <>
            {selected.image_url ? (
              <img
                src={selected.image_url}
                alt={selected.name}
                className="h-7 w-7 flex-shrink-0 rounded-md border border-slate-200 object-cover"
              />
            ) : (
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-slate-400">
                <FiImage size={13} />
              </span>
            )}

            <span className="truncate text-sm text-slate-800">
              {selected.name}
              {selected.product_code ? ` (${selected.product_code})` : ""}
            </span>
          </>
        ) : (
          <>
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-blue-500">
              <FiPackage size={13} />
            </span>

            <span className="truncate text-sm text-slate-400">
              {loading ? "Loading..." : placeholder}
            </span>
          </>
        )}

        <FiChevronDown
          size={16}
          className={`ml-auto flex-shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""
            }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 z-30 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl shadow-slate-200/50">
          {products.length === 0 ? (
            <div className="px-3.5 py-3 text-center text-xs text-slate-500">
              No products available
            </div>
          ) : (
            products.map((product) => {
              const isSelected = String(product.id) === value;

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => {
                    onChange(String(product.id));
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${isSelected ? "bg-blue-50" : "hover:bg-slate-50"
                    }`}
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-9 w-9 flex-shrink-0 rounded-lg border border-slate-200 object-cover shadow-sm"
                    />
                  ) : (
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-400 shadow-sm">
                      <FiImage size={14} />
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm ${isSelected
                          ? "font-bold text-blue-600"
                          : "font-medium text-slate-800"
                        }`}
                    >
                      {product.name}
                    </p>

                    {product.product_code && (
                      <p className="truncate text-xs text-slate-500">
                        SKU: {product.product_code}
                      </p>
                    )}
                  </div>

                  {isSelected && (
                    <FiCheck
                      size={15}
                      className="flex-shrink-0 text-blue-600"
                    />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

/* =========================================================
   COMBO PRODUCT MULTI-SELECT (ALL products, category shown below)
========================================================= */

const ComboProductPicker: React.FC<{
  products: CategoryProductOption[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  onSaveClose?: () => void;
  disabled?: boolean;
  loading?: boolean;
}> = ({ products, selectedIds, onToggle, onSaveClose, disabled, loading }) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.product_code ?? "").toLowerCase().includes(q) ||
        (p.category_name ?? "").toLowerCase().includes(q),
    );
  }, [products, search]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products by name or SKU..."
          className={inputCls(false, "!h-10")}
        />
      </div>

      {/* ✅ ~5 rows visible, then scroll */}
      <div className="max-h-[280px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/60 p-2">
        {loading ? (
          <p className="px-2 py-4 text-center text-xs text-slate-500">
            Loading products...
          </p>
        ) : filtered.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-slate-500">
            No products found
          </p>
        ) : (
          <ul className="space-y-1.5">
            {filtered.map((product) => {
              const isSelected = selectedIds.includes(product.id);

              return (
                <li key={product.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onToggle(product.id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition ${isSelected
                        ? "border-blue-300 bg-blue-50/70"
                        : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-10 w-10 flex-shrink-0 rounded-lg border border-slate-200 object-cover shadow-sm"
                      />
                    ) : (
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-400 shadow-sm">
                        <FiImage size={14} />
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm ${isSelected
                            ? "font-bold text-blue-600"
                            : "font-semibold text-slate-800"
                          }`}
                      >
                        {product.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {product.product_code
                          ? `SKU: ${product.product_code}`
                          : `ID: ${product.id}`}
                        {product.category_name && (
                          <>
                            {" · "}
                            <span className="text-slate-400">
                              {product.category_name}
                            </span>
                          </>
                        )}
                      </p>
                    </div>

                    <span
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition ${isSelected
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-300 bg-white text-transparent"
                        }`}
                    >
                      <FiCheck size={12} strokeWidth={3} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ✅ Footer: count on the LEFT, Save button on the RIGHT */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1 text-xs text-slate-500">
          <FiInfo size={12} />
          {selectedIds.length} product{selectedIds.length !== 1 ? "s" : ""}{" "}
          selected for combo
        </p>

        <button
          type="button"
          onClick={onSaveClose}
          disabled={disabled || selectedIds.length === 0}
          className={`${primaryBtn} h-9 px-4 text-xs`}
        >
          <FiCheck size={14} />
          Save
        </button>
      </div>
    </div>
  );
};
/* =========================================================
   COMBO SELECTED PRODUCTS PREVIEW (modal popup)
========================================================= */

const ComboSelectedModal: React.FC<{
  open: boolean;
  products: CategoryProductOption[];
  selectedIds: number[];
  onRemove: (id: number) => void;
  onClose: () => void;
  disabled?: boolean;
}> = ({ open, products, selectedIds, onRemove, onClose, disabled }) => {
  const selectedProducts = useMemo(
    () =>
      selectedIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is CategoryProductOption => !!p),
    [products, selectedIds],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <FiEye size={17} />
            </span>
            <div>
              <h3 className="text-[15px] font-bold text-slate-800">
                Selected combo products
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {selectedProducts.length} product
                {selectedProducts.length !== 1 ? "s" : ""} in this combo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {selectedProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-500">
              No products selected yet.
            </div>
          ) : (
            <ul className="space-y-2">
              {selectedProducts.map((product, idx) => (
                <li
                  key={product.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[11px] font-bold text-blue-600">
                      {idx + 1}
                    </span>

                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-10 w-10 flex-shrink-0 rounded-lg border border-slate-200 object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-400">
                        <FiImage size={14} />
                      </span>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {product.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {product.product_code
                          ? `SKU: ${product.product_code}`
                          : `ID: ${product.id}`}
                        {product.category_name && (
                          <>
                            {" · "}
                            <span className="text-slate-400">
                              {product.category_name}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onRemove(product.id)}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                    aria-label="Remove from combo"
                  >
                    <FiTrash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
};

/* =========================================================
   STOCK ADJUSTMENT FORM
========================================================= */

const StockAdjustmentForm: React.FC<{
  reason: string;
  onReasonChange: (value: string) => void;
  quantity: string;
  onQuantityChange: (value: string) => void;
  operation: StockAdjustmentOperation;
  onOperationChange: (value: StockAdjustmentOperation) => void;
  errors?: Pick<
    FormErrors,
    "reason_for_stock_adjustment" | "manual_stock_adjustment"
  >;
  currentStock?: string | number;
}> = ({
  reason,
  onReasonChange,
  quantity,
  onQuantityChange,
  operation,
  onOperationChange,
  errors,
  currentStock,
}) => {
    const qty = Number(quantity) || 0;
    const stock = Number(currentStock) || 0;
    const resultingStock = operation === "add" ? stock + qty : stock - qty;

    return (
      <SectionCard
        icon={<FiSliders size={19} />}
        title="Stock adjustment"
        subtitle="Manually adjust stock and log the reason"
      >
        <div className="space-y-4">
          <Field label="Operation" small>
            <div className="inline-flex w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 p-1">
              <button
                type="button"
                onClick={() => onOperationChange("add")}
                className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition ${operation === "add"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-slate-600 hover:bg-white"
                  }`}
              >
                <FiPlus size={13} />
                Add stock
              </button>

              <button
                type="button"
                onClick={() => onOperationChange("subtract")}
                className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition ${operation === "subtract"
                    ? "bg-rose-500 text-white shadow-sm"
                    : "text-slate-600 hover:bg-white"
                  }`}
              >
                <FiMinus size={13} />
                Subtract stock
              </button>
            </div>
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              label="Adjustment quantity"
              small
              error={errors?.manual_stock_adjustment}
            >
              <AdornedInput
                compact
                inputMode="numeric"
                value={quantity}
                placeholder="e.g. 10"
                hasError={!!errors?.manual_stock_adjustment}
                onChange={(value) => {
                  if (isValidIntegerInput(value)) {
                    onQuantityChange(value);
                  }
                }}
              />
            </Field>

            <Field
              label="Reason for adjustment"
              small
              error={errors?.reason_for_stock_adjustment}
            >
              <input
                value={reason}
                onChange={(event) => onReasonChange(event.target.value)}
                placeholder="Damaged goods, new shipment..."
                className={inputCls(
                  !!errors?.reason_for_stock_adjustment,
                  "!h-10",
                )}
              />
            </Field>
          </div>

          {qty > 0 && (
            <div
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs ${operation === "add"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
            >
              <FiInfo size={14} />
              <span>
                Stock will change from <b>{stock}</b> → <b>{resultingStock}</b>
              </span>
            </div>
          )}

          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-400">
            <FiInfo size={12} className="mt-0.5 flex-shrink-0" />
            Leave both fields empty to skip stock adjustment.
          </p>
        </div>
      </SectionCard>
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
  const {
    hasPermission,
    hasModuleAccess,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  const canSubmit = useMemo(() => {
    if (isSuperAdmin) return true;

    if (isEdit) {
      return (
        hasModuleAccess("product") ||
        hasPermission("product.update") ||
        hasPermission("product.edit") ||
        hasPermission("products.update") ||
        hasPermission("products.edit")
      );
    }

    return (
      hasModuleAccess("product") ||
      hasPermission("product.create") ||
      hasPermission("products.create") ||
      hasPermission("product.add") ||
      hasPermission("products.add") ||
      hasPermission("product.store")
    );
  }, [isSuperAdmin, hasModuleAccess, hasPermission, isEdit]);

  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [subcategories, setSubcategories] = useState<SelectOption[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<
    CategoryProductOption[]
  >([]);
  const [allProducts, setAllProducts] = useState<CategoryProductOption[]>([]);
  const [brands, setBrands] = useState<SelectOption[]>([]);
  const [taxCategories, setTaxCategories] = useState<SelectOption[]>([]);

  const [fetchingOptions, setFetchingOptions] = useState(false);
  const [fetchingSubcategories, setFetchingSubcategories] = useState(false);
  const [fetchingCategoryProducts, setFetchingCategoryProducts] =
    useState(false);
  const [fetchingAllProducts, setFetchingAllProducts] = useState(false);

  // ✅ product type & combo selection — default "single" (Individual)
  const [productType, setProductType] = useState<ProductType>("single");
  const [comboProductIds, setComboProductIds] = useState<number[]>([]);
  const [removedComboProductIds, setRemovedComboProductIds] = useState<
    number[]
  >([]);
  const [originalComboIds, setOriginalComboIds] = useState<number[]>([]);
  const [showComboPreview, setShowComboPreview] = useState(false);

  // ✅ collapse picker after Save
  const [showComboPicker, setShowComboPicker] = useState(true);

  const [productCode, setProductCode] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const DEFAULT_SPECS: SpecItem[] = [
    { key: "Manufactured By", value: "", isDefault: true },
    { key: "Marketed By", value: "", isDefault: true },
  ];
  const [specification, setSpecification] = useState<SpecItem[]>(DEFAULT_SPECS);

  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [taxCategoryId, setTaxCategoryId] = useState("");

  const [retailMrp, setRetailMrp] = useState("");
  const [retailDiscountValue, setRetailDiscountValue] = useState("");
  const [distributorMrp, setDistributorMrp] = useState("");
  const [distributorDiscountValue, setDistributorDiscountValue] = useState("");

  const [commissionValue, setCommissionValue] = useState("");
  const [blueCoin, setBlueCoin] = useState("");
  const [greenCoin, setGreenCoin] = useState("");
  const [shippingCharge, setShippingCharge] = useState("");
  const [serviceCharge, setServiceCharge] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("10");

  const [isPublished, setIsPublished] = useState(true);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  const [deletingImageIds, setDeletingImageIds] = useState<number[]>([]);
  const [arrangingImageIds, setArrangingImageIds] = useState<number[]>([]);
  const [hydratedEditKey, setHydratedEditKey] = useState<string | null>(null);

  const [variants, setVariants] = useState<VariantItem[]>([]);
  const [removedVariantIds, setRemovedVariantIds] = useState<number[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([]);

  const [variantProductId, setVariantProductId] = useState("");
  const [variantHexColor, setVariantHexColor] = useState("#28282B");

  // Custom Color Picker Open/Close State
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement | null>(null);

  const [stockAdjustmentReason, setStockAdjustmentReason] = useState("");
  const [stockAdjustmentQty, setStockAdjustmentQty] = useState("");
  const [stockAdjustmentOperation, setStockAdjustmentOperation] =
    useState<StockAdjustmentOperation>("add");

  const draggedImageIdRef = useRef<number | null>(null);
  const [dragOverImageId, setDragOverImageId] = useState<number | null>(null);
  const bodyScrollRef = useRef<HTMLDivElement | null>(null);

  const currentProduct = getProductObject(editData);
  const parentProductId = Number(currentProduct?.id || 0);

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const predefinedColors = [
    "#28282B",
    "#000000",
    "#FFFFFF",
    "#F3F4F6",
    "#EF4444",
    "#F87171",
    "#F59E0B",
    "#FBBF24",
    "#10B981",
    "#34D399",
    "#3B82F6",
    "#60A5FA",
    "#6366F1",
    "#818CF8",
    "#8B5CF6",
    "#A78BFA",
    "#EC4899",
    "#F472B6",
    "#14B8A6",
    "#2DD4BF",
  ];

  const isElectronicsCategory = useMemo(() => {
    if (!categoryId) return false;
    const selected = categories.find((cat) => String(cat.id) === categoryId);
    return isElectronicsCategoryName(selected?.name);
  }, [categoryId, categories]);

  const pricePreview = useMemo(() => {
    const calculate = (mrp: string, discount: string) => {
      const mrpValue = Number(mrp) || 0;
      const discountValue = Math.min(100, Math.max(0, Number(discount) || 0));

      const saved = (mrpValue * discountValue) / 100;

      return {
        mrp: mrpValue,
        discount: discountValue,
        final: mrpValue - saved,
        saved,
      };
    };

    return {
      retail: calculate(retailMrp, retailDiscountValue),
      distributor: calculate(distributorMrp, distributorDiscountValue),
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
      {
        label: "Tax category",
        // ✅ Tax category is optional for combo
        done: productType === "combo" ? true : !!taxCategoryId,
      },
      ...(productType === "combo"
        ? [{ label: "Combo products", done: comboProductIds.length > 0 }]
        : []),
      { label: "Retail MRP", done: Number(retailMrp) > 0 },
      { label: "Stock quantity", done: stockQuantity !== "" },
      { label: "Product image", done: images.length > 0 },
      ...(isElectronicsCategory
        ? [
          {
            label: "Service charge",
            done: serviceCharge !== "" && Number(serviceCharge) >= 0,
          },
        ]
        : []),
    ],
    [
      name,
      productCode,
      categoryId,
      subcategoryId,
      brandId,
      taxCategoryId,
      productType,
      comboProductIds.length,
      retailMrp,
      stockQuantity,
      images.length,
      isElectronicsCategory,
      serviceCharge,
    ],
  );

  const completedCount = checklist.filter((item) => item.done).length;

  const completionPercent = Math.round(
    (completedCount / checklist.length) * 100,
  );

  const revokeObjectUrls = useCallback((items: ImageItem[]) => {
    items.forEach((item) => {
      if (!item.is_existing && item.preview?.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(item.preview);
        } catch (error) {
          console.warn("Failed to revoke image URL", error);
        }
      }
    });
  }, []);

  const resetEverything = useCallback(() => {
    revokeObjectUrls(images);

    setProductCode("");
    setName("");
    setSlug("");
    setDescription("");

    setProductType("single");
    setComboProductIds([]);
    setRemovedComboProductIds([]);
    setOriginalComboIds([]);
    setShowComboPreview(false);
    setShowComboPicker(true);

    setSpecification([
      { key: "Manufactured By", value: "", isDefault: true },
      { key: "Marketed By", value: "", isDefault: true },
    ]);

    setCategoryId("");
    setSubcategoryId("");
    setBrandId("");
    setTaxCategoryId("");
    setRetailMrp("");
    setRetailDiscountValue("");
    setDistributorMrp("");
    setDistributorDiscountValue("");
    setCommissionValue("");
    setBlueCoin("");
    setGreenCoin("");
    setShippingCharge("");
    setServiceCharge("");
    setStockQuantity("");
    setLowStockThreshold("10");

    setIsPublished(true);
    setImages([]);
    setErrors({});
    setDeletingImageIds([]);
    setArrangingImageIds([]);
    setSubcategories([]);
    setCategoryProducts([]);
    setVariants([]);
    setRemovedVariantIds([]);
    setRemovedImageIds([]);

    setVariantProductId("");
    setVariantHexColor("#28282B");
    setShowColorPicker(false);

    setHydratedEditKey(null);

    setStockAdjustmentReason("");
    setStockAdjustmentQty("");
    setStockAdjustmentOperation("add");

    setDragOverImageId(null);
    draggedImageIdRef.current = null;
  }, [images, revokeObjectUrls]);

  const handleClose = useCallback(() => {
    if (loading) {
      const confirmed = window.confirm(
        "Processing is in progress. If you close now, progress will be lost. Do you want to close?",
      );

      if (!confirmed) return;
    }

    resetEverything();
    onClose();
  }, [loading, resetEverything, onClose]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const fetchOptions = async () => {
      setFetchingOptions(true);

      try {
        const [categoriesResponse, brandsResponse, taxesResponse] =
          await Promise.all([
            categoryApi.getAll(),
            brandsApi.getAll(),
            taxApi.getAll(),
          ]);

        if (cancelled) return;

        const categoryData = getApiArray(categoriesResponse);
        const brandData = getApiArray(brandsResponse);
        const taxData = getApiArray(taxesResponse);

        setCategories(
          categoryData.map((item: any) => ({
            id: Number(item.id),
            name: item.title || item.name || `Category ${item.id}`,
          })),
        );

        setBrands(
          brandData.map((item: any) => ({
            id: Number(item.id),
            name: item.title || item.name || `Brand ${item.id}`,
          })),
        );

        setTaxCategories(
          taxData.map((item: any) => ({
            id: Number(item.id),
            name: item.name || item.title || `Tax ${item.id}`,
          })),
        );
      } catch (error) {
        if (!cancelled) {
          console.error("Fetch product options error:", error);
          setCategories([]);
          setBrands([]);
          setTaxCategories([]);
          toast.error("Unable to load product options.");
        }
      } finally {
        if (!cancelled) {
          setFetchingOptions(false);
        }
      }
    };

    void fetchOptions();

    return () => {
      cancelled = true;
    };
  }, [open]);

  /* =========================================================
     FETCH ALL PRODUCTS (for Combo — not category filtered)
  ========================================================= */
  useEffect(() => {
    if (!open) {
      setAllProducts([]);
      return;
    }

    let cancelled = false;

    const fetchAllProducts = async () => {
      setFetchingAllProducts(true);

      try {
        // 🔁 try common product-list method names
        const api: any = productApi;
        let response: any = null;

        if (typeof api.getAll === "function") {
          response = await api.getAll();
        } else if (typeof api.getAllProducts === "function") {
          response = await api.getAllProducts();
        } else if (typeof api.list === "function") {
          response = await api.list();
        } else if (typeof api.getProducts === "function") {
          response = await api.getProducts();
        } else {
          throw new Error(
            "No product-list method found on productApi (expected getAll/getAllProducts/list/getProducts).",
          );
        }

        if (cancelled) return;

        const rows = getApiArray(response);

        setAllProducts(
          rows.map((item: any) => ({
            id: Number(item.id),
            name: item.name || item.title || `Product ${item.id}`,
            product_code: item.product_code || item.sku || "",
            image_url:
              item?.images?.[0]?.image_url ||
              item?.image_url ||
              item?.image ||
              "",
            category_id: item?.category_id ?? item?.category?.id ?? undefined,
            category_name:
              item?.category?.name ||
              item?.category?.title ||
              item?.category_name ||
              "",
          })),
        );
      } catch (error) {
        if (!cancelled) {
          console.error("Fetch all products error:", error);
          setAllProducts([]);
          toast.error("Unable to load all products for combo.");
        }
      } finally {
        if (!cancelled) {
          setFetchingAllProducts(false);
        }
      }
    };

    void fetchAllProducts();

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !categoryId) {
      setSubcategories([]);
      setCategoryProducts([]);
      setVariantProductId("");
      setFetchingSubcategories(false);
      setFetchingCategoryProducts(false);
      return;
    }

    let cancelled = false;

    const selectedCategoryId = Number(categoryId);

    setFetchingSubcategories(true);
    setFetchingCategoryProducts(true);

    const loadCategoryData = async () => {
      const [subcategoriesResult, productsResult] = await Promise.allSettled([
        productApi.getSubcategoriesByCategory(selectedCategoryId),
        productApi.getProductsByCategory(selectedCategoryId),
      ]);

      if (cancelled) return;

      if (subcategoriesResult.status === "fulfilled") {
        const rows = getApiArray(subcategoriesResult.value);

        setSubcategories(
          rows
            .filter(
              (item: any) =>
                item.status === undefined ||
                item.status === true ||
                item.status === 1 ||
                item.status === "active",
            )
            .map((item: any) => ({
              id: Number(item.id),
              name: item.name || item.title || `Subcategory ${item.id}`,
            })),
        );
      } else {
        console.error(
          "Subcategory-by-category API error:",
          subcategoriesResult.reason,
        );

        setSubcategories([]);

        toast.error("Unable to load subcategories for this category.");
      }

      if (productsResult.status === "fulfilled") {
        const rows = getApiArray(productsResult.value);

        setCategoryProducts(
          rows
            .filter((item: any) => Number(item.id) !== parentProductId)
            .map((item: any) => ({
              id: Number(item.id),
              name: item.name || item.title || `Product ${item.id}`,
              product_code: item.product_code || item.sku || "",
              image_url:
                item?.images?.[0]?.image_url ||
                item?.image_url ||
                item?.image ||
                "",
              category_id: item?.category_id ?? item?.category?.id ?? undefined,
              category_name:
                item?.category?.name ||
                item?.category?.title ||
                item?.category_name ||
                "",
            })),
        );

        setVariantProductId("");
      } else {
        console.error("Products-by-category API error:", productsResult.reason);

        setCategoryProducts([]);

        toast.error("Unable to load products for this category.");
      }

      setFetchingSubcategories(false);
      setFetchingCategoryProducts(false);
    };

    void loadCategoryData();

    return () => {
      cancelled = true;
    };
  }, [open, categoryId, parentProductId]);

  useEffect(() => {
    if (!open || !isEdit || !editData) return;

    const product = getProductObject(editData);

    if (!product) return;

    const productKey = `${product?.id ?? "new"}-${isEdit}`;

    if (hydratedEditKey === productKey) return;

    // ✅ product type
    const incomingType: ProductType =
      String(product?.product_type ?? "single").toLowerCase() === "combo"
        ? "combo"
        : "single";
    setProductType(incomingType);

    // ✅ hydrate combo product ids from possible shapes
    const incomingCombo: number[] = (() => {
      const raw =
        product?.combo_product_ids ??
        product?.combo_products ??
        product?.combo ??
        product?.comboProducts ??
        [];
      if (!Array.isArray(raw)) return [];
      return raw
        .map((p: any) => Number(p?.id ?? p))
        .filter((n: number) => Number.isFinite(n) && n > 0);
    })();

    setComboProductIds(incomingCombo);
    setOriginalComboIds(incomingCombo);
    setRemovedComboProductIds([]);

    setProductCode(String(product?.product_code ?? product?.sku ?? ""));

    setName(String(product?.name ?? ""));
    setSlug(String(product?.slug ?? ""));
    setDescription(String(product?.description ?? ""));

    setSpecification(
      product?.specification
        ? parseSpecification(product.specification)
        : [
          { key: "Manufactured By", value: "", isDefault: true },
          { key: "Marketed By", value: "", isDefault: true },
        ],
    );

    setCategoryId(normalizeId(product?.category_id ?? product?.category?.id));

    setSubcategoryId(
      normalizeId(
        product?.subcategory_id ??
        product?.["subcategory_id "] ??
        product?.sub_category_id ??
        product?.subcategory?.id ??
        product?.sub_category?.id,
      ),
    );

    setBrandId(normalizeId(product?.brand_id ?? product?.brand?.id));

    setTaxCategoryId(
      normalizeId(product?.tax_category_id ?? product?.tax_category?.id),
    );

    const retailDiscount =
      product?.retail_discount_value ??
      product?.retail_discount_percentage ??
      "";

    const distributorDiscount =
      product?.distributor_discount_value ??
      product?.distributor_discount_percentage ??
      "";

    setRetailMrp(
      product?.retail_mrp !== null && product?.retail_mrp !== undefined
        ? String(product.retail_mrp)
        : "",
    );

    setRetailDiscountValue(
      retailDiscount !== null && retailDiscount !== undefined
        ? String(retailDiscount)
        : "",
    );

    setDistributorMrp(
      product?.distributor_mrp !== null &&
        product?.distributor_mrp !== undefined
        ? String(product.distributor_mrp)
        : "",
    );

    setDistributorDiscountValue(
      distributorDiscount !== null && distributorDiscount !== undefined
        ? String(distributorDiscount)
        : "",
    );

    setCommissionValue(
      product?.commission_value !== null &&
        product?.commission_value !== undefined
        ? String(product.commission_value)
        : "",
    );

    setBlueCoin(product?.blue_coin != null ? String(product.blue_coin) : "");
    setGreenCoin(product?.green_coin != null ? String(product.green_coin) : "");

    setShippingCharge(
      product?.shipping_charge !== null &&
        product?.shipping_charge !== undefined
        ? String(product.shipping_charge)
        : "",
    );

    setServiceCharge(
      product?.service_charge !== null && product?.service_charge !== undefined
        ? String(product.service_charge)
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
      setImages(
        product.images.map((image: any, index: number) => ({
          id: Date.now() + index,
          preview: image?.image_url || image?.image || "",
          sort_order: image?.sort_order ?? index + 1,
          is_primary:
            image?.is_primary === true ||
              image?.is_primary === 1 ||
              image?.is_primary === "1"
              ? 1
              : 0,
          existing_id: image?.id,
          is_existing: true,
        })),
      );
    } else {
      setImages([]);
    }

    if (Array.isArray(product?.variants)) {
      setVariants(
        product.variants.map((v: any) => ({
          variantId: v?.id,
          product_id: Number(v?.product_id ?? v?.product?.id ?? 0),
          hax_color: String(v?.hax_color ?? v?.hex_color ?? "#000000"),
          productName: v?.name ?? v?.product?.name ?? undefined,
          productCode:
            v?.product_code ?? v?.product?.product_code ?? v?.sku ?? undefined,
          productImage:
            v?.image ??
            v?.product?.images?.[0]?.image_url ??
            v?.product?.image_url ??
            undefined,
        })),
      );
    } else {
      setVariants([]);
    }

    setRemovedVariantIds([]);
    setRemovedImageIds([]);
    setVariantProductId("");
    setVariantHexColor("#28282B");
    setShowComboPicker(true);

    setStockAdjustmentReason("");
    setStockAdjustmentQty("");
    setStockAdjustmentOperation("add");

    setHydratedEditKey(productKey);
  }, [open, isEdit, editData, hydratedEditKey]);

  useEffect(() => {
    if (open) return;

    revokeObjectUrls(images);
    setHydratedEditKey(null);

    setProductCode("");
    setName("");
    setSlug("");
    setDescription("");

    setProductType("single");
    setComboProductIds([]);
    setRemovedComboProductIds([]);
    setOriginalComboIds([]);
    setShowComboPreview(false);
    setShowComboPicker(true);

    setSpecification([
      { key: "Manufactured By", value: "", isDefault: true },
      { key: "Marketed By", value: "", isDefault: true },
    ]);

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
    setServiceCharge("");
    setStockQuantity("");
    setLowStockThreshold("10");

    setIsPublished(true);
    setImages([]);
    setErrors({});
    setSubcategories([]);
    setCategoryProducts([]);
    setAllProducts([]);
    setVariants([]);
    setRemovedVariantIds([]);
    setRemovedImageIds([]);

    setVariantProductId("");
    setVariantHexColor("#28282B");
    setShowColorPicker(false);

    setStockAdjustmentReason("");
    setStockAdjustmentQty("");
    setStockAdjustmentOperation("add");

    draggedImageIdRef.current = null;
    setDragOverImageId(null);
    setArrangingImageIds([]);
    setDeletingImageIds([]);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, handleClose]);

  if (!open) return null;

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(
      value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    );
    setErrors((previous) => ({
      ...previous,
      name: undefined,
    }));
  };

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    setSubcategoryId("");
    setVariantProductId("");
    setSubcategories([]);
    setCategoryProducts([]);
    setErrors((previous) => ({
      ...previous,
      category_id: undefined,
      subcategory_id: undefined,
    }));
  };

  const handleSubcategoryChange = (value: string) => {
    setSubcategoryId(value);
    setErrors((previous) => ({
      ...previous,
      subcategory_id: undefined,
    }));
  };

  // ✅ product type change handler
  const handleProductTypeChange = (next: ProductType) => {
    setProductType(next);
    setShowComboPicker(true);

    if (next === "combo") {
      // ✅ tax category is optional for combo — clear any old error
      setErrors((prev) => ({ ...prev, tax_category_id: undefined }));
    }

    // when switching to single, drop combo selections
    if (next === "single") {
      setComboProductIds([]);
      setShowComboPreview(false);

      // track removed combo ids on edit
      if (isEdit && originalComboIds.length) {
        setRemovedComboProductIds((prev) => {
          const merged = new Set<number>([...prev, ...originalComboIds]);
          return Array.from(merged);
        });
      }
    }
  };

  // ✅ combo toggle
  const handleToggleComboProduct = (id: number) => {
    if (!Number.isFinite(id) || id <= 0) return;

    setComboProductIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((x) => x !== id) : [...prev, id];

      // track removed ids on edit (originally in combo, now not selected)
      if (isEdit) {
        setRemovedComboProductIds((removedPrev) => {
          const removedSet = new Set<number>(removedPrev);
          originalComboIds.forEach((origId) => {
            if (origId && !next.includes(origId)) {
              removedSet.add(origId);
            } else if (origId && next.includes(origId)) {
              removedSet.delete(origId);
            }
          });
          return Array.from(removedSet);
        });
      }

      return next;
    });

    setErrors((prev) => ({ ...prev, combo_products: undefined }));
  };

  // ✅ Save handler for combo picker (collapses list)
  const handleSaveCombo = () => {
    if (comboProductIds.length === 0) return;
    setShowComboPicker(false);
    toast.success(
      `${comboProductIds.length} product${comboProductIds.length !== 1 ? "s" : ""
      } saved for combo`,
    );
  };

  const addSpecificationField = () =>
    setSpecification((previous) => [...previous, { key: "", value: "" }]);

  const removeSpecificationField = (index: number) => {
    if (specification[index]?.isDefault) return;
    if (specification.length <= 2) return;

    setSpecification((previous) =>
      previous.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  const updateSpecification = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    setSpecification((previous) =>
      previous.map((item, currentIndex) =>
        currentIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const addImageFiles = (files: FileList | File[]) => {
    const accepted = Array.from(files).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (!accepted.length) return;

    const newImages: ImageItem[] = accepted.map((file, index) => ({
      id: Date.now() + index + Math.random(),
      file,
      preview: URL.createObjectURL(file),
      sort_order: images.length + index + 1,
      is_primary: images.length === 0 && index === 0 ? 1 : 0,
      is_existing: false,
    }));

    setImages((previous) => [...previous, ...newImages]);
    setErrors((previous) => ({
      ...previous,
      images: undefined,
    }));
  };

  const handleImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      addImageFiles(event.target.files);
    }
    event.target.value = "";
  };

  const removeImage = async (id: number) => {
    const imageToRemove = images.find((item) => item.id === id);

    if (!imageToRemove) return;

    if (isEdit && imageToRemove.is_existing) {
      const existingImageId = Number(imageToRemove.existing_id);

      if (!existingImageId) {
        toast.error("Unable to delete image: invalid image details.");
        return;
      }

      if (deletingImageIds.includes(existingImageId)) return;

      try {
        setDeletingImageIds((previous) => [...previous, existingImageId]);

        setRemovedImageIds((previous) => [
          ...new Set([...previous, existingImageId]),
        ]);

        setImages((previous) => {
          let filtered = previous.filter((item) => item.id !== id);

          if (
            filtered.length &&
            !filtered.some((item) => item.is_primary === 1)
          ) {
            filtered = filtered.map((item, index) => ({
              ...item,
              is_primary: index === 0 ? 1 : 0,
            }));
          }

          return filtered.map((item, index) => ({
            ...item,
            sort_order: index + 1,
          }));
        });

        toast.success("Image will be removed on save");
      } finally {
        setDeletingImageIds((previous) =>
          previous.filter((imageId) => imageId !== existingImageId),
        );
      }

      return;
    }

    if (
      !imageToRemove.is_existing &&
      imageToRemove.preview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(imageToRemove.preview);
    }

    setImages((previous) => {
      let filtered = previous.filter((item) => item.id !== id);

      if (filtered.length && !filtered.some((item) => item.is_primary === 1)) {
        filtered = filtered.map((item, index) => ({
          ...item,
          is_primary: index === 0 ? 1 : 0,
        }));
      }

      return filtered.map((item, index) => ({
        ...item,
        sort_order: index + 1,
      }));
    });
  };

  const handleMakePrimary = async (image: ImageItem) => {
    const productId = Number(currentProduct?.id);
    const imageId = Number(image.existing_id);

    if (isEdit && image.is_existing && productId > 0 && imageId > 0) {
      try {
        await productApi.setPrimaryImage(productId, imageId);

        setImages((previous) =>
          previous.map((item) => ({
            ...item,
            is_primary: item.id === image.id ? 1 : 0,
          })),
        );

        toast.success("Primary image updated");
      } catch (error) {
        console.error("Set primary image API error:", error);
        toast.error("Unable to set primary image");
      }
      return;
    }

    setImages((previous) =>
      previous.map((item) => ({
        ...item,
        is_primary: item.id === image.id ? 1 : 0,
      })),
    );
  };

  const handleImageDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    imageId: number,
  ) => {
    if (loading) {
      event.preventDefault();
      return;
    }

    draggedImageIdRef.current = imageId;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(imageId));
  };

  const handleImageDrop = async (
    event: React.DragEvent<HTMLDivElement>,
    targetImageId: number,
  ) => {
    event.preventDefault();

    const sourceImageId = draggedImageIdRef.current;

    draggedImageIdRef.current = null;
    setDragOverImageId(null);

    if (sourceImageId === null || sourceImageId === targetImageId || loading) {
      return;
    }

    const source = images.find((image) => image.id === sourceImageId);
    const target = images.find((image) => image.id === targetImageId);

    if (!source || !target) return;

    const oldImages = [...images];

    const sourceIndex = images.findIndex((image) => image.id === sourceImageId);
    const targetIndex = images.findIndex((image) => image.id === targetImageId);

    const reordered = [...images];

    [reordered[sourceIndex], reordered[targetIndex]] = [
      reordered[targetIndex],
      reordered[sourceIndex],
    ];

    const nextImages = reordered.map((image, index) => ({
      ...image,
      sort_order: index + 1,
      is_primary: index === 0 ? 1 : 0,
    }));

    setImages(nextImages);

    const productId = Number(currentProduct?.id);
    const sourceExistingId = Number(source.existing_id);
    const targetExistingId = Number(target.existing_id);

    if (
      !isEdit ||
      productId <= 0 ||
      !source.is_existing ||
      !target.is_existing ||
      sourceExistingId <= 0 ||
      targetExistingId <= 0
    ) {
      return;
    }

    try {
      setArrangingImageIds((previous) => [
        ...new Set([...previous, sourceExistingId, targetExistingId]),
      ]);

      await productApi.moveProductImage(productId, {
        image_id_1: sourceExistingId,
        image_id_2: targetExistingId,
      });

      const firstExisting = nextImages.find(
        (image) => image.is_existing && image.existing_id,
      );

      if (firstExisting?.existing_id) {
        await productApi.setPrimaryImage(
          productId,
          Number(firstExisting.existing_id),
        );
      }

      toast.success("Image order updated");
    } catch (error) {
      console.error("Move product image API error:", error);
      setImages(oldImages);
      toast.error("Unable to arrange images");
    } finally {
      setArrangingImageIds((previous) =>
        previous.filter(
          (id) => id !== sourceExistingId && id !== targetExistingId,
        ),
      );
    }
  };

  const handleAddVariant = () => {
    if (!variantProductId) {
      toast.error("Please select a product for the variant.");
      return;
    }

    if (!isValidHexColor(variantHexColor)) {
      toast.error("Enter a valid hex color, for example #28282B.");
      return;
    }

    const productIdNum = Number(variantProductId);

    if (productIdNum === parentProductId) {
      toast.error("A product cannot be added as a variant of itself.");
      return;
    }

    if (variants.some((v) => v.product_id === productIdNum)) {
      toast.error("This product is already added as a variant.");
      return;
    }

    const selected = categoryProducts.find((p) => p.id === productIdNum);

    setVariants((previous) => [
      ...previous,
      {
        product_id: productIdNum,
        hax_color: variantHexColor.trim(),
        productName: selected?.name,
        productCode: selected?.product_code,
        productImage: selected?.image_url,
      },
    ]);

    setVariantProductId("");
    setVariantHexColor("#28282B");
    toast.success("Variant added. It will be saved with the product.");
  };

  const handleRemoveVariant = (index: number) => {
    const variant = variants[index];

    if (!variant) return;

    if (variant.variantId) {
      setRemovedVariantIds((previous) => [
        ...new Set([...previous, variant.variantId as number]),
      ]);
    }

    setVariants((previous) => previous.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!productCode.trim())
      nextErrors.product_code = "Product code is required";
    if (!name.trim()) nextErrors.name = "Product name is required";

    if (!categoryId) nextErrors.category_id = "Please select a category";
    if (!subcategoryId)
      nextErrors.subcategory_id = "Please select a subcategory";
    if (!brandId) nextErrors.brand_id = "Please select a brand";

    // ✅ Tax category is required only for Individual (not Combo)
    if (productType !== "combo" && !taxCategoryId) {
      nextErrors.tax_category_id = "Please select a tax category";
    }

    // ✅ combo validation
    if (productType === "combo" && comboProductIds.length === 0) {
      nextErrors.combo_products = "Please select at least one combo product";
    }

    if (!retailMrp || Number(retailMrp) <= 0) {
      nextErrors.retail_mrp = "Please enter a valid retail MRP";
    }

    if (!stockQuantity || Number(stockQuantity) < 0) {
      nextErrors.stock_quantity = "Please enter a valid stock quantity";
    }

    if (
      shippingCharge !== "" &&
      (Number.isNaN(Number(shippingCharge)) || Number(shippingCharge) < 0)
    ) {
      nextErrors.shipping_charge = "Please enter a valid shipping charge";
    }

    if (isElectronicsCategory) {
      if (!serviceCharge.trim()) {
        nextErrors.service_charge =
          "Service charge is required for Electronics products";
      } else if (
        Number.isNaN(Number(serviceCharge)) ||
        Number(serviceCharge) < 0
      ) {
        nextErrors.service_charge = "Please enter a valid service charge";
      }
    }

    if (images.length === 0) {
      nextErrors.images = "At least one product image is required";
    }

    if (isEdit) {
      const quantityFilled = stockAdjustmentQty.trim() !== "";
      const reasonFilled = stockAdjustmentReason.trim() !== "";

      if (quantityFilled && Number(stockAdjustmentQty) <= 0) {
        nextErrors.manual_stock_adjustment =
          "Adjustment quantity must be greater than 0";
      }

      if (quantityFilled && !reasonFilled) {
        nextErrors.reason_for_stock_adjustment =
          "Reason is required when adjusting stock";
      }

      if (reasonFilled && !quantityFilled) {
        nextErrors.manual_stock_adjustment =
          "Quantity is required when a reason is provided";
      }

      if (
        stockAdjustmentOperation === "subtract" &&
        quantityFilled &&
        Number(stockAdjustmentQty) > Number(stockQuantity || 0)
      ) {
        nextErrors.manual_stock_adjustment =
          "Adjustment quantity cannot exceed current stock";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

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

    // ✅ product type
    formData.append("product_type", productType);

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
    formData.append("blue_coin", String(Number(blueCoin || 0)));
    formData.append("green_coin", String(Number(greenCoin || 0)));
    formData.append("shipping_charge", String(shippingCharge || 0));

    if (isElectronicsCategory) {
      formData.append("service_charge", String(serviceCharge || 0));
    }

    // ✅ combo product ids (only when combo)
    if (productType === "combo" && comboProductIds.length) {
      comboProductIds.forEach((id, idx) => {
        formData.append(`combo_product_ids[${idx}]`, String(id));
      });
    }

    // ✅ remove combo ids (only on edit)
    if (isEdit && removedComboProductIds.length) {
      removedComboProductIds.forEach((id, idx) => {
        formData.append(`remove_combo_product_ids[${idx}]`, String(id));
      });
    }

    if (isEdit) {
      formData.append(
        "reason_for_stock_adjustment",
        stockAdjustmentReason.trim(),
      );
      formData.append(
        "manual_stock_adjustment",
        stockAdjustmentQty.trim() || "0",
      );
      formData.append(
        "manual_stock_adjustment_operation",
        stockAdjustmentOperation,
      );

      const existingImageIds = images
        .filter((image) => image.is_existing && image.existing_id)
        .map((image) => image.existing_id as number);

      if (existingImageIds.length) {
        existingImageIds.forEach((id, idx) => {
          formData.append(`existing_image_ids[${idx}]`, String(id));
        });
      }

      removedImageIds.forEach((id, idx) => {
        formData.append(`remove_images[${idx}]`, String(id));
      });
    }

    images
      .filter((image) => !image.is_existing)
      .forEach((image, index) => {
        if (!image.file) return;
        formData.append(`product_images[${index}][image]`, image.file);
        formData.append(
          `product_images[${index}][sort_order]`,
          String(image.sort_order),
        );
        formData.append(
          `product_images[${index}][is_primary]`,
          String(image.is_primary),
        );
      });

    variants.forEach((v, index) => {
      formData.append(`variants[${index}][product_id]`, String(v.product_id));
      formData.append(`variants[${index}][hax_color]`, v.hax_color);
    });

    if (isEdit) {
      removedVariantIds.forEach((id, index) => {
        formData.append(`remove_variants[${index}]`, String(id));
      });
    }

    return formData;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (permissionsLoading) {
      toast.error("Please wait while permissions are checked.");
      return;
    }

    if (!canSubmit) {
      toast.error(
        isEdit
          ? "You don't have permission to update products."
          : "You don't have permission to add products.",
      );
      return;
    }

    if (loading || fetchingOptions || arrangingImageIds.length > 0) {
      return;
    }

    if (!validate()) {
      document.querySelector(".error-message")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

    onSubmit(buildFormData());
  };

  const productName = currentProduct?.name || "Product";

  const availableCategoryProducts = useMemo(() => {
    const addedIds = new Set(variants.map((v) => v.product_id));
    return categoryProducts.filter((p) => !addedIds.has(p.id));
  }, [categoryProducts, variants]);

  // ✅ combo suggestions = ALL products (not category filtered)
  const comboProductSuggestions = useMemo(() => {
    if (parentProductId > 0) {
      return allProducts.filter((p) => p.id !== parentProductId);
    }
    return allProducts;
  }, [allProducts, parentProductId]);

  // ✅ tax category locked when combo
  const isTaxCategoryLocked = productType === "combo";

  // ✅ selected combo products resolved (for summary view)
  const selectedComboProducts = useMemo(
    () =>
      comboProductIds
        .map((id) => comboProductSuggestions.find((p) => p.id === id))
        .filter((p): p is CategoryProductOption => !!p),
    [comboProductIds, comboProductSuggestions],
  );

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center p-3 font-poppins sm:p-5">
        <div
          className="pointer-events-auto relative flex h-[92vh] w-full max-w-[1240px] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200"
          onClick={(event) => event.stopPropagation()}
        >
          {/* SLIM HEADER */}
          <div className="relative flex-shrink-0 border-b border-slate-100 bg-white px-6 py-3.5">
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  {isEdit ? <FiEdit2 size={18} /> : <FiPlus size={20} />}
                </span>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold leading-tight text-slate-800 sm:text-xl">
                      {isEdit ? "Edit product" : "Add new product"}
                    </h2>

                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {isEdit ? "Editing" : "Draft"}
                    </span>

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${productType === "combo"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-slate-100 text-slate-600"
                        }`}
                    >
                      {productType === "combo" ? "Combo" : "Individual"}
                    </span>
                  </div>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {isEdit
                      ? `Editing: ${productName}`
                      : "Fill in the product details, pricing and images"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-full bg-slate-50 py-1.5 pl-3 pr-4 sm:flex">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>

                  <span className="text-xs font-semibold text-slate-600">
                    {completionPercent}% complete
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Close"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* BODY */}
          <div
            ref={bodyScrollRef}
            className="flex-1 overflow-y-auto overscroll-contain bg-slate-50/50 p-4 sm:p-6"
          >
            <form onSubmit={handleSubmit} id="product-form">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
                {/* LEFT SIDE */}
                <div className="min-w-0 space-y-6">
                  <SectionCard
                    icon={<FiInfo size={19} />}
                    title="Basic information"
                    subtitle="Name, code and where this product lives in your catalog"
                  >
                    <div className="space-y-4">
                      <Field label="Product name" required error={errors.name}>
                        <input
                          type="text"
                          value={name}
                          onChange={(event) =>
                            handleNameChange(event.target.value)
                          }
                          placeholder="e.g. SoundMax Pro 5G Smartphone"
                          className={inputCls(
                            !!errors.name,
                            "!h-12 !text-[15px] font-medium",
                          )}
                        />
                      </Field>

                      {/* ✅ Product type dropdown, default Individual */}
                      <Field label="Product type" required small>
                        <ProductTypeDropdown
                          value={productType}
                          onChange={handleProductTypeChange}
                          disabled={loading}
                        />
                      </Field>

                      {/* ✅ COMBO PRODUCTS — right below product type, BEFORE SKU/Product code */}
                      {productType === "combo" && (
                        <div className="rounded-2xl border border-purple-200 bg-purple-50/30 p-4">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <div>
                              <h4 className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                                <FiLayers
                                  size={15}
                                  className="text-purple-600"
                                />
                                Combo products
                                <span className="text-rose-500">*</span>
                              </h4>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {comboProductIds.length > 0
                                  ? `${comboProductIds.length} product${comboProductIds.length !== 1 ? "s" : ""} selected`
                                  : "Pick products from any category to build the combo"}
                              </p>
                            </div>

                            {/* ✅ View selected button — appears only if >= 1 selected */}
                            {comboProductIds.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setShowComboPreview(true)}
                                className={`${softBtn} h-9 px-3 text-xs !bg-purple-100 !text-purple-700 hover:!bg-purple-200`}
                              >
                                <FiEye size={14} />
                                View selected ({comboProductIds.length})
                              </button>
                            )}
                          </div>

                          {errors.combo_products && (
                            <p className="error-message mb-3 flex items-center gap-1 text-xs font-medium text-rose-600">
                              <FiInfo size={13} /> {errors.combo_products}
                            </p>
                          )}

                          {/* ✅ Picker OR collapsed summary after Save */}
                          {showComboPicker ? (
                            <ComboProductPicker
                              products={comboProductSuggestions}
                              selectedIds={comboProductIds}
                              onToggle={handleToggleComboProduct}
                              onSaveClose={handleSaveCombo}
                              disabled={fetchingAllProducts || loading}
                              loading={fetchingAllProducts}
                            />
                          ) : (
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
                              <div className="min-w-0">
                                <p className="text-xs text-slate-600">
                                  <span className="font-semibold text-blue-600">
                                    {comboProductIds.length}
                                  </span>{" "}
                                  product
                                  {comboProductIds.length !== 1 ? "s" : ""}{" "}
                                  selected for combo
                                </p>
                                {selectedComboProducts.length > 0 && (
                                  <p className="mt-0.5 truncate text-[11px] text-slate-400">
                                    {selectedComboProducts
                                      .slice(0, 3)
                                      .map((p) => p.name)
                                      .join(", ")}
                                    {selectedComboProducts.length > 3
                                      ? ` +${selectedComboProducts.length - 3} more`
                                      : ""}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setShowComboPreview(true)}
                                  className={`${softBtn} h-8 px-3 text-xs`}
                                >
                                  <FiEye size={13} />
                                  View
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setShowComboPicker(true)}
                                  className={`${softBtn} h-8 px-3 text-xs`}
                                >
                                  <FiEdit2 size={13} />
                                  Edit selection
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* ✅ SKU / Product code above slug */}
                        <Field
                          label="SKU / Product code"
                          required
                          error={errors.product_code}
                        >
                          <input
                            type="text"
                            value={productCode}
                            onChange={(event) => {
                              setProductCode(event.target.value);
                              setErrors((prev) => ({
                                ...prev,
                                product_code: undefined,
                              }));
                            }}
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
                            placeholder={
                              fetchingOptions
                                ? "Loading categories..."
                                : "Select category..."
                            }
                            options={categories}
                            icon={<FiTag size={16} />}
                            hasError={!!errors.category_id}
                            disabled={fetchingOptions}
                          />
                        </Field>

                        <Field
                          label="Sub category"
                          required
                          error={errors.subcategory_id}
                          hint={
                            !categoryId ? "Select a category first" : undefined
                          }
                        >
                          <SelectBox
                            value={subcategoryId}
                            onChange={handleSubcategoryChange}
                            placeholder={
                              !categoryId
                                ? "Select category first"
                                : fetchingSubcategories
                                  ? "Loading subcategories..."
                                  : "Select subcategory..."
                            }
                            options={subcategories}
                            icon={<FiLayers size={16} />}
                            hasError={!!errors.subcategory_id}
                            disabled={!categoryId || fetchingSubcategories}
                          />
                        </Field>

                        <Field label="Brand" required error={errors.brand_id}>
                          <SelectBox
                            value={brandId}
                            onChange={(value) => {
                              setBrandId(value);
                              setErrors((prev) => ({
                                ...prev,
                                brand_id: undefined,
                              }));
                            }}
                            placeholder="Select brand..."
                            options={brands}
                            icon={<FiAward size={16} />}
                            hasError={!!errors.brand_id}
                            disabled={fetchingOptions}
                          />
                        </Field>

                        {/* ✅ Tax category — required only for Individual, optional (locked) for Combo */}
                        <Field
                          label="Tax category"
                          required={productType !== "combo"}
                          error={errors.tax_category_id}
                          hint={
                            isTaxCategoryLocked
                              ? "Optional for combo products"
                              : undefined
                          }
                        >
                          <SelectBox
                            value={taxCategoryId}
                            onChange={(value) => {
                              setTaxCategoryId(value);
                              setErrors((prev) => ({
                                ...prev,
                                tax_category_id: undefined,
                              }));
                            }}
                            placeholder="Select tax..."
                            options={taxCategories}
                            icon={<FiPercent size={16} />}
                            hasError={!!errors.tax_category_id}
                            disabled={fetchingOptions || isTaxCategoryLocked}
                          />
                        </Field>
                      </div>
                    </div>
                  </SectionCard>

                  {/* DESCRIPTION AND SPECIFICATION */}
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <SectionCard
                      icon={<FiAlignLeft size={19} />}
                      title="Description"
                      subtitle="What customers will read"
                    >
                      <textarea
                        rows={9}
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder="Enter product description..."
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3 text-sm leading-relaxed text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
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
                          <FiPlus size={14} /> Add field
                        </button>
                      }
                    >
                      <div className="max-h-[260px] space-y-2.5 overflow-y-auto pr-1">
                        {specification.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={item.key}
                              onChange={(event) =>
                                updateSpecification(
                                  index,
                                  "key",
                                  event.target.value,
                                )
                              }
                              placeholder="Key (e.g., Display)"
                              readOnly={item.isDefault}
                              className={inputCls(
                                false,
                                `!h-10 min-w-0 flex-1 ${item.isDefault ? "!bg-slate-100 cursor-not-allowed" : ""}`,
                              )}
                            />

                            <input
                              type="text"
                              value={item.value}
                              onChange={(event) =>
                                updateSpecification(
                                  index,
                                  "value",
                                  event.target.value,
                                )
                              }
                              placeholder="Value (e.g., 6.7-inch AMOLED)"
                              className={inputCls(
                                false,
                                "!h-10 min-w-0 flex-1",
                              )}
                            />

                            <button
                              type="button"
                              onClick={() => removeSpecificationField(index)}
                              disabled={
                                !!item.isDefault || specification.length <= 2
                              }
                              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
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
                      images.length
                        ? `${images.length} image${images.length !== 1 ? "s" : ""} · choose a cover image`
                        : "Upload at least one image"
                    }
                    action={
                      <label
                        className={`${primaryBtn} h-9 cursor-pointer px-3 text-xs`}
                      >
                        <FiPlus size={14} /> Add images
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
                      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 text-xs text-slate-600">
                        <FiMove size={14} className="text-blue-500" />
                        <span>
                          Drag and drop images to change their order, or choose
                          a cover image.
                        </span>
                      </div>
                    )}

                    {errors.images && (
                      <p className="error-message mb-3 flex items-center gap-1 text-xs font-medium text-rose-600">
                        <FiInfo size={13} /> {errors.images}
                      </p>
                    )}

                    {images.length === 0 ? (
                      <label className="group flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-4 text-center transition-all hover:border-blue-300 hover:bg-blue-50/50">
                        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-500 shadow-sm ring-1 ring-slate-100">
                          <FiUploadCloud size={26} />
                        </span>
                        <p className="mt-3 text-sm font-semibold text-slate-700">
                          Upload product images
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Drag & drop, or{" "}
                          <span className="font-semibold text-blue-600">
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
                      <div className="grid grid-cols-2 gap-3 rounded-2xl p-1 sm:grid-cols-3 xl:grid-cols-4">
                        {images.map((image, index) => {
                          const busy =
                            image.is_existing && image.existing_id
                              ? arrangingImageIds.includes(
                                Number(image.existing_id),
                              )
                              : false;

                          const deleting =
                            image.is_existing && image.existing_id
                              ? deletingImageIds.includes(
                                Number(image.existing_id),
                              )
                              : false;

                          return (
                            <div
                              key={image.id}
                              draggable={!loading && !busy}
                              onDragStart={(event) =>
                                handleImageDragStart(event, image.id)
                              }
                              onDragOver={(event) => {
                                event.preventDefault();
                                if (
                                  draggedImageIdRef.current &&
                                  draggedImageIdRef.current !== image.id
                                ) {
                                  setDragOverImageId(image.id);
                                }
                              }}
                              onDragLeave={() => setDragOverImageId(null)}
                              onDrop={(event) =>
                                void handleImageDrop(event, image.id)
                              }
                              onDragEnd={() => {
                                draggedImageIdRef.current = null;
                                setDragOverImageId(null);
                              }}
                              className={`group relative aspect-square cursor-grab overflow-hidden rounded-2xl border bg-slate-100 shadow-sm transition-all active:cursor-grabbing ${dragOverImageId === image.id
                                  ? "scale-[1.03] border-blue-500 ring-4 ring-blue-500/20"
                                  : "border-slate-200 hover:shadow-md"
                                } ${busy ? "opacity-70" : ""}`}
                            >
                              <img
                                src={image.preview}
                                alt="Product"
                                className="h-full w-full object-cover"
                                draggable={false}
                              />
                              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70" />

                              <span
                                className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold shadow ${image.is_primary
                                    ? "bg-blue-600 text-white"
                                    : "bg-white/90 text-slate-700"
                                  }`}
                              >
                                {image.is_primary ? "Cover" : `#${index + 1}`}
                              </span>

                              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1">
                                <button
                                  type="button"
                                  onClick={() => void handleMakePrimary(image)}
                                  disabled={
                                    !!image.is_primary || deleting || busy
                                  }
                                  className="rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-blue-600 shadow-sm disabled:opacity-50"
                                >
                                  {image.is_primary ? "Primary" : "Make cover"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => void removeImage(image.id)}
                                  disabled={deleting}
                                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-rose-600 shadow-sm transition-colors hover:bg-rose-600 hover:text-white disabled:opacity-50"
                                >
                                  <FiX size={14} />
                                </button>
                              </div>

                              {busy && (
                                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60">
                                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-500/20 border-t-blue-500" />
                                </div>
                              )}
                            </div>
                          );
                        })}

                        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-blue-300 hover:bg-blue-50/50">
                          <FiPlus size={22} className="text-blue-500" />
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
                  </SectionCard>

                  {/* VARIANTS (With Custom Color Picker) */}
                  <SectionCard
                    icon={<FiPackage size={19} />}
                    title="Product variants"
                    subtitle="Attach products as variants with hex colors"
                  >
                    {!categoryId ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        <p className="font-semibold">Select a category first</p>
                        <p className="mt-1 text-xs">
                          Products will appear here after a category is selected
                          above.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_140px_auto]">
                          <Field label="Variant product" small>
                            <VariantProductSelect
                              value={variantProductId}
                              onChange={setVariantProductId}
                              products={availableCategoryProducts}
                              placeholder={
                                fetchingCategoryProducts
                                  ? "Loading..."
                                  : availableCategoryProducts.length
                                    ? "Choose a product..."
                                    : "No products available"
                              }
                              disabled={
                                fetchingCategoryProducts ||
                                availableCategoryProducts.length === 0
                              }
                              loading={fetchingCategoryProducts}
                            />
                          </Field>

                          <Field label="Hex color" small>
                            <div
                              className="relative flex items-center gap-2"
                              ref={colorPickerRef}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setShowColorPicker((prev) => !prev)
                                }
                                className="h-10 w-10 flex-shrink-0 rounded-xl border border-slate-300 shadow-sm cursor-pointer transition-transform hover:scale-105"
                                style={{
                                  backgroundColor: isValidHexColor(
                                    variantHexColor,
                                  )
                                    ? variantHexColor
                                    : "#ffffff",
                                }}
                              />

                              {showColorPicker && (
                                <div className="absolute top-12 left-0 z-50 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/50">
                                  <div className="grid grid-cols-5 gap-1.5">
                                    {predefinedColors.map((color) => (
                                      <button
                                        key={color}
                                        type="button"
                                        onClick={() => {
                                          setVariantHexColor(color);
                                          setShowColorPicker(false);
                                        }}
                                        className="h-7 w-7 rounded-lg border border-slate-200 shadow-sm transition hover:scale-110"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}

                              <input
                                type="text"
                                value={variantHexColor}
                                onChange={(event) =>
                                  setVariantHexColor(event.target.value)
                                }
                                placeholder="#28282B"
                                maxLength={7}
                                className={inputCls(
                                  variantHexColor.length > 0 &&
                                  !isValidHexColor(variantHexColor),
                                  "!h-10",
                                )}
                              />
                            </div>
                          </Field>

                          <button
                            type="button"
                            onClick={handleAddVariant}
                            disabled={
                              !categoryId ||
                              fetchingCategoryProducts ||
                              !variantProductId
                            }
                            className={`${primaryBtn} h-10 px-4 text-sm`}
                          >
                            <FiPlus size={16} /> Add
                          </button>
                        </div>

                        {variantHexColor &&
                          !isValidHexColor(variantHexColor) && (
                            <p className="text-xs font-medium text-rose-600">
                              Use #RGB or #RRGGBB format.
                            </p>
                          )}

                        {variants.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-center text-xs text-slate-500">
                            No variants added yet. Pick a product and hex color,
                            then click{" "}
                            <span className="font-semibold text-blue-600">
                              Add
                            </span>
                            .
                          </div>
                        ) : (
                          <ul className="space-y-2">
                            {variants.map((variant, index) => (
                              <li
                                key={`${variant.product_id}-${index}`}
                                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm"
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  {variant.productImage ? (
                                    <img
                                      src={variant.productImage}
                                      alt={variant.productName || "Variant"}
                                      className="h-10 w-10 flex-shrink-0 rounded-lg border border-slate-200 object-cover shadow-sm"
                                    />
                                  ) : (
                                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-400 shadow-sm">
                                      <FiImage size={16} />
                                    </span>
                                  )}
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-800">
                                      {variant.productName ||
                                        `Product #${variant.product_id}`}
                                    </p>
                                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                                      <span className="truncate">
                                        {variant.productCode
                                          ? `SKU: ${variant.productCode}`
                                          : `ID: ${variant.product_id}`}
                                      </span>
                                      <span className="text-slate-300">·</span>
                                      <span className="inline-flex items-center gap-1">
                                        <span
                                          className="h-3 w-3 flex-shrink-0 rounded-full border border-slate-300 shadow-inner"
                                          style={{
                                            backgroundColor: isValidHexColor(
                                              variant.hax_color,
                                            )
                                              ? variant.hax_color
                                              : "#ffffff",
                                          }}
                                        />
                                        <span className="font-mono">
                                          {variant.hax_color}
                                        </span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVariant(index)}
                                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                                  aria-label="Remove variant"
                                >
                                  <FiTrash2 size={15} />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </SectionCard>
                </div>

                {/* RIGHT SIDE */}
                <aside className="min-w-0 space-y-6 lg:sticky lg:top-0 lg:self-start">
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-5 text-white shadow-lg shadow-blue-500/20">
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
                        <span className="rounded-full bg-emerald-400/20 px-2.5 py-1 font-semibold text-emerald-100 ring-1 ring-emerald-300/30">
                          {pricePreview.retail.discount}% off · save ₹
                          {formatINR(pricePreview.retail.saved)}
                        </span>
                      )}
                      {pricePreview.distributor.mrp > 0 && (
                        <span className="rounded-full bg-white/10 px-2.5 py-1 font-medium ring-1 ring-white/20">
                          Distributor ₹
                          {formatINR(pricePreview.distributor.final)}
                        </span>
                      )}
                      {pricePreview.retail.mrp === 0 && (
                        <span className="text-blue-200">
                          Enter MRP to preview final price
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
                            onChange={(value) => {
                              if (isValidDecimalInput(value)) {
                                setRetailMrp(value);
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
                            onChange={(value) => {
                              if (isValidDecimalInput(value))
                                setRetailDiscountValue(value);
                            }}
                          />
                        </Field>
                        <Field label="Distributor MRP">
                          <AdornedInput
                            prefix="₹"
                            value={distributorMrp}
                            placeholder="90000"
                            onChange={(value) => {
                              if (isValidDecimalInput(value))
                                setDistributorMrp(value);
                            }}
                          />
                        </Field>
                        <Field label="Distributor disc.">
                          <AdornedInput
                            suffix="%"
                            value={distributorDiscountValue}
                            placeholder="35"
                            onChange={(value) => {
                              if (isValidDecimalInput(value))
                                setDistributorDiscountValue(value);
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
                          onChange={(value) => {
                            if (isValidIntegerInput(value))
                              setCommissionValue(value);
                          }}
                        />
                      </Field>

                      {/* Admin-managed coin values — distinct visual colors */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 [&_input]:border-blue-200 [&_input]:bg-white [&_input]:focus:border-blue-500 [&_input]:focus:ring-blue-500/10">
                          <div className="mb-2 flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm ring-2 ring-blue-200">
                              <FiAward size={16} />
                            </span>
                            <span className="text-sm font-bold text-blue-800">Blue Coin</span>
                          </div>
                          <AdornedInput
                            inputMode="numeric"
                            value={blueCoin}
                            placeholder="Enter blue coin value"
                            onChange={(value) => {
                              if (isValidIntegerInput(value)) setBlueCoin(value);
                            }}
                          />
                          <p className="mt-1.5 text-xs text-blue-600">Enter the blue coin value</p>
                        </div>

                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 [&_input]:border-emerald-200 [&_input]:bg-white [&_input]:focus:border-emerald-500 [&_input]:focus:ring-emerald-500/10">
                          <div className="mb-2 flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-200">
                              <FiAward size={16} />
                            </span>
                            <span className="text-sm font-bold text-emerald-800">Green Coin</span>
                          </div>
                          <AdornedInput
                            inputMode="numeric"
                            value={greenCoin}
                            placeholder="Enter green coin value"
                            onChange={(value) => {
                              if (isValidIntegerInput(value)) setGreenCoin(value);
                            }}
                          />
                          <p className="mt-1.5 text-xs text-emerald-600">Enter the green coin value</p>
                        </div>
                      </div>

                      <Field
                        label="Shipping charge"
                        icon={<FiTruck size={14} className="text-blue-500" />}
                        error={errors.shipping_charge}
                        hint="Enter 0 for free shipping"
                      >
                        <AdornedInput
                          prefix="₹"
                          value={shippingCharge}
                          placeholder="0"
                          hasError={!!errors.shipping_charge}
                          onChange={(value) => {
                            if (isValidDecimalInput(value)) {
                              setShippingCharge(value);
                              setErrors((prev) => ({
                                ...prev,
                                shipping_charge: undefined,
                              }));
                            }
                          }}
                        />
                      </Field>

                      {isElectronicsCategory && (
                        <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                          <Field
                            label="Service Charge"
                            required
                            icon={
                              <FiTool size={14} className="text-blue-500" />
                            }
                            error={errors.service_charge}
                            hint="Only applicable for Electronics products"
                          >
                            <AdornedInput
                              prefix="₹"
                              value={serviceCharge}
                              placeholder="0"
                              hasError={!!errors.service_charge}
                              onChange={(value) => {
                                if (isValidDecimalInput(value)) {
                                  setServiceCharge(value);
                                  setErrors((prev) => ({
                                    ...prev,
                                    service_charge: undefined,
                                  }));
                                }
                              }}
                            />
                          </Field>
                        </div>
                      )}
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
                          onChange={(value) => {
                            if (isValidIntegerInput(value)) {
                              setStockQuantity(value);
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
                          onChange={(value) => {
                            if (isValidIntegerInput(value))
                              setLowStockThreshold(value);
                          }}
                        />
                      </Field>
                    </div>
                    <p className="mt-3 flex items-center gap-1 text-xs text-slate-400">
                      <FiInfo size={12} /> You'll be notified when stock falls
                      below this number
                    </p>
                  </SectionCard>

                  {isEdit && (
                    <StockAdjustmentForm
                      reason={stockAdjustmentReason}
                      onReasonChange={(value) => {
                        setStockAdjustmentReason(value);
                        setErrors((prev) => ({
                          ...prev,
                          reason_for_stock_adjustment: undefined,
                        }));
                      }}
                      quantity={stockAdjustmentQty}
                      onQuantityChange={(value) => {
                        setStockAdjustmentQty(value);
                        setErrors((prev) => ({
                          ...prev,
                          manual_stock_adjustment: undefined,
                        }));
                      }}
                      operation={stockAdjustmentOperation}
                      onOperationChange={setStockAdjustmentOperation}
                      errors={errors}
                      currentStock={stockQuantity}
                    />
                  )}

                  {/* PUBLISHING */}
                  <SectionCard
                    icon={<FiTag size={19} />}
                    title="Publishing"
                    subtitle="Control store visibility"
                  >
                    <div
                      className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-colors ${isPublished
                          ? "border-emerald-100 bg-emerald-50/50"
                          : "border-slate-200 bg-slate-50"
                        }`}
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-800">
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
                        onClick={() => setIsPublished((prev) => !prev)}
                        className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-colors ${isPublished ? "bg-emerald-500" : "bg-slate-300"
                          }`}
                      >
                        <span
                          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${isPublished ? "left-[22px]" : "left-0.5"
                            }`}
                        />
                      </button>
                    </div>
                  </SectionCard>

                  {/* BEFORE YOU SAVE */}
                  <SectionCard
                    icon={<FiCheck size={19} />}
                    title="Before you save"
                    subtitle={`${completedCount} of ${checklist.length} required items done`}
                  >
                    <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
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
                            className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full transition-colors ${item.done
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

          {/* FOOTER */}
          <div className="flex flex-shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
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
                <span className="font-semibold text-blue-600">
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
                  form="product-form"
                  disabled={
                    loading ||
                    fetchingOptions ||
                    arrangingImageIds.length > 0 ||
                    permissionsLoading ||
                    !canSubmit
                  }
                  className={`${primaryBtn} h-11 min-w-[160px] px-8 text-sm`}
                >
                  {permissionsLoading ? (
                    "Checking permissions..."
                  ) : loading ? (
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

            {!permissionsLoading && !canSubmit && (
              <p className="text-right text-xs text-rose-600">
                You don't have permission to {isEdit ? "update" : "add"}{" "}
                products.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Selected combo products popup */}
      <ComboSelectedModal
        open={showComboPreview}
        products={comboProductSuggestions}
        selectedIds={comboProductIds}
        onRemove={handleToggleComboProduct}
        onClose={() => setShowComboPreview(false)}
        disabled={loading}
      />
    </>
  );
};

export default AddProductModal;
