import React, {
  useEffect,
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
} from "react-icons/fi";

import { FaRupeeSign } from "react-icons/fa";

import { categoryApi } from "../../../../api/endpoints/category";

import { taxApi } from "../../../../api/endpoints/taxApi";

import attributesApi, {
  AttributeMaster,
} from "../../../../api/endpoints/attributes";

import brandsApi from "../../../../api/endpoints/brands";

import { subcategoryApi } from "../../../../api/endpoints/subcategory";

interface SelectOption {
  id: number;
  name: string;
}

interface AddProductModalProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (
    formData: FormData
  ) => void;
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
  subcategory_id?: string;
  brand_id?: string;
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
// NUMERIC INPUT HELPERS
// (used instead of type="number" so the mouse-wheel / spinner
//  arrows can never change the value, while still keeping the
//  field numeric-only)
// ============================================================

// Allows digits and a single decimal point (for prices / %)
const isValidDecimalInput = (
  value: string
): boolean => {
  return /^\d*\.?\d*$/.test(
    value
  );
};

// Allows digits only (for quantities / thresholds)
const isValidIntegerInput = (
  value: string
): boolean => {
  return /^\d*$/.test(
    value
  );
};

// ============================================================
// HELPERS
// ============================================================

const getProductObject = (
  editData: any
) => {
  if (!editData) {
    return null;
  }

  /*
   * Supports:
   *
   * editData
   * editData.data
   * editData.data.data
   * editData.product
   */

  return (
    editData?.data?.data ??
    editData?.data ??
    editData?.product ??
    editData
  );
};

const getValue = (
  obj: any,
  ...keys: string[]
) => {
  if (!obj) {
    return "";
  }

  for (const key of keys) {
    if (
      obj[key] !== undefined &&
      obj[key] !== null
    ) {
      return obj[key];
    }
  }

  return "";
};

// ============================================================
// SPECIFICATION
// ============================================================

const parseSpecification = (
  spec:
    | string
    | Record<string, any>
): SpecItem[] => {
  try {
    const parsed =
      typeof spec === "string"
        ? JSON.parse(spec)
        : spec;

    if (
      !parsed ||
      typeof parsed !== "object"
    ) {
      return [
        {
          key: "",
          value: "",
        },
      ];
    }

    const result =
      Object.entries(parsed).map(
        ([key, value]) => ({
          key,
          value: String(
            value ?? ""
          ),
        })
      );

    return result.length > 0
      ? result
      : [
          {
            key: "",
            value: "",
          },
        ];
  } catch {
    return [
      {
        key: "",
        value: "",
      },
    ];
  }
};

// ============================================================
// VARIANT ATTRIBUTES
// ============================================================

const parseVariantAttributes = (
  attributes:
    | Record<
        string,
        string | string[]
      >
    | string
): AttributeItem[] => {
  try {
    if (
      typeof attributes ===
      "string"
    ) {
      const parsed =
        JSON.parse(attributes);

      const result: AttributeItem[] =
        [];

      Object.entries(
        parsed
      ).forEach(
        ([key, value]) => {
          let values: string[] =
            [];

          if (
            Array.isArray(value)
          ) {
            values =
              value.map(
                (v) =>
                  String(
                    v
                  ).trim()
              );
          } else {
            values =
              String(
                value
              )
                .split(",")
                .map(
                  (v) =>
                    v.trim()
                );
          }

          values.forEach(
            (val) => {
              if (val) {
                result.push({
                  key,
                  value: val,
                });
              }
            }
          );
        }
      );

      return result;
    }

    if (
      typeof attributes ===
        "object" &&
      attributes !== null
    ) {
      const result: AttributeItem[] =
        [];

      Object.entries(
        attributes
      ).forEach(
        ([key, value]) => {
          let values: string[] =
            [];

          if (
            Array.isArray(value)
          ) {
            values =
              value.map(
                (v) =>
                  String(
                    v
                  ).trim()
              );
          } else {
            values =
              String(
                value
              )
                .split(",")
                .map(
                  (v) =>
                    v.trim()
                );
          }

          values.forEach(
            (val) => {
              if (val) {
                result.push({
                  key,
                  value: val,
                });
              }
            }
          );
        }
      );

      return result;
    }
  } catch (error) {
    console.error(
      "Error parsing variant attributes:",
      error
    );
  }

  return [];
};

// ============================================================
// ATTRIBUTE COMBINATIONS
// ============================================================

const getAttributeCombinations = (
  attributes: Record<
    string,
    any[]
  >
): Array<Record<string, any>> => {
  const keys =
    Object.keys(
      attributes
    );

  if (keys.length === 0) {
    return [{}];
  }

  const result: Array<
    Record<string, any>
  > = [];

  const generateCombinations =
    (
      index: number,
      current: Record<
        string,
        any
      >
    ) => {
      if (
        index ===
        keys.length
      ) {
        result.push({
          ...current,
        });

        return;
      }

      const key =
        keys[index];

      const values =
        attributes[key] ||
        [];

      if (
        values.length === 0
      ) {
        generateCombinations(
          index + 1,
          {
            ...current,
            [key]: "",
          }
        );
      } else {
        values.forEach(
          (
            value: any
          ) => {
            generateCombinations(
              index + 1,
              {
                ...current,
                [key]: value,
              }
            );
          }
        );
      }
    };

  generateCombinations(
    0,
    {}
  );

  return result;
};

// ============================================================
// GENERATE VARIANTS
// ============================================================

const generateVariantsFromProduct = (
  rawProduct: any
): VariantFormData[] => {
  const product =
    getProductObject(
      rawProduct
    );

  if (!product) {
    return [];
  }

  const variants: VariantFormData[] =
    [];

  // ==========================================================
  // EXISTING VARIANTS
  // ==========================================================

  if (
    product.variants &&
    Array.isArray(
      product.variants
    ) &&
    product.variants
      .length > 0
  ) {
    return product.variants.map(
      (
        variant: any,
        index: number
      ) => ({
        id: `variant-${Date.now()}-${index}`,

        sku:
          variant.sku ||
          "",

        attributes:
          parseVariantAttributes(
            variant.attributes ||
              {}
          ),

        retail_mrp: String(
          getValue(
            variant,
            "retail_mrp",
            "retail_price"
          ) ?? ""
        ),

        retail_discount_type:
          getValue(
            variant,
            "retail_discount_type"
          ) ||
          "percentage",

        retail_discount_value:
          String(
            getValue(
              variant,
              "retail_discount_value",
              "retail_discount_percentage"
            ) ?? ""
          ),

        distributor_mrp:
          String(
            getValue(
              variant,
              "distributor_mrp",
              "distributor_price"
            ) ?? ""
          ),

        distributor_discount_type:
          getValue(
            variant,
            "distributor_discount_type"
          ) ||
          "percentage",

        distributor_discount_value:
          String(
            getValue(
              variant,
              "distributor_discount_value",
              "distributor_discount_percentage"
            ) ?? ""
          ),

        stock_quantity:
          String(
            variant.stock_quantity ??
              ""
          ),

        low_stock_threshold:
          String(
            variant.low_stock_threshold ??
              ""
          ),

        sort_order:
          variant.sort_order ??
          index + 1,

        is_active:
          variant.is_active ===
            true ||
          variant.is_active ===
            1 ||
          variant.is_active ===
            "1"
            ? 1
            : 0,

        images: (
          variant.images ||
          []
        ).map(
          (
            img: any,
            imgIndex: number
          ) => ({
            id:
              Date.now() +
              imgIndex +
              1000,

            preview:
              img.image_url ||
              img.image ||
              "",

            sort_order:
              img.sort_order ??
              imgIndex + 1,

            is_primary:
              img.is_primary ===
                true ||
              img.is_primary ===
                1 ||
              img.is_primary ===
                "1"
                ? 1
                : 0,

            existing_id:
              img.id,

            is_existing: true,
          })
        ),

        existing_id:
          variant.id,

        is_existing: true,
      })
    );
  }

  // ==========================================================
  // VARIANTS SUMMARY
  // ==========================================================

  if (
    product.variants_summary &&
    product
      .variants_summary
      .attributes
  ) {
    const attributes =
      product
        .variants_summary
        .attributes;

    const attributeKeys =
      Object.keys(
        attributes
      );

    if (
      attributeKeys.length >
      0
    ) {
      const combinations =
        getAttributeCombinations(
          attributes
        );

      combinations.forEach(
        (
          combo,
          index
        ) => {
          const attributeItems: AttributeItem[] =
            [];

          Object.entries(
            combo
          ).forEach(
            ([
              key,
              value,
            ]) => {
              if (
                value &&
                String(
                  value
                ).trim()
              ) {
                attributeItems.push(
                  {
                    key,
                    value:
                      String(
                        value
                      ),
                  }
                );
              }
            }
          );

          const skuSuffix =
            attributeItems
              .map(
                (attr) =>
                  String(
                    attr.value
                  )
                    .replace(
                      /\s+/g,
                      "-"
                    )
                    .substring(
                      0,
                      10
                    )
              )
              .join("-");

          const retailMrp =
            getValue(
              product,
              "retail_mrp"
            ) ||
            product
              .variants_summary
              ?.min_retail_mrp ||
            0;

          const retailDiscount =
            getValue(
              product,
              "retail_discount_value",
              "retail_discount_percentage"
            );

          const distributorMrp =
            getValue(
              product,
              "distributor_mrp"
            ) ||
            product
              .variants_summary
              ?.min_distributor_mrp ||
            0;

          const distributorDiscount =
            getValue(
              product,
              "distributor_discount_value",
              "distributor_discount_percentage"
            );

          const stockQty =
            product.stock_quantity ??
            0;

          variants.push({
            id: `variant-${Date.now()}-${index}`,

            sku: `${
              product.product_code ||
              "PROD"
            }-${skuSuffix}`,

            attributes:
              attributeItems,

            retail_mrp:
              String(
                retailMrp
              ),

            retail_discount_type:
              getValue(
                product,
                "retail_discount_type"
              ) ||
              "percentage",

            retail_discount_value:
              retailDiscount !==
                null &&
              retailDiscount !==
                undefined
                ? String(
                    retailDiscount
                  )
                : "0",

            distributor_mrp:
              String(
                distributorMrp
              ),

            distributor_discount_type:
              getValue(
                product,
                "distributor_discount_type"
              ) ||
              "percentage",

            distributor_discount_value:
              distributorDiscount !==
                null &&
              distributorDiscount !==
                undefined
                ? String(
                    distributorDiscount
                  )
                : "0",

            stock_quantity:
              String(
                stockQty
              ),

            low_stock_threshold:
              String(
                product.low_stock_threshold ||
                  "10"
              ),

            sort_order:
              index + 1,

            is_active: 1,

            images: [],

            is_existing: false,
          });
        }
      );
    }
  }

  return variants;
};

// ============================================================
// ATTRIBUTE SELECTOR
// ============================================================

const AttributeSelector: React.FC<{
  variantId: string;
  selectedAttributes: AttributeItem[];
  availableAttributes: AttributeMaster[];

  onAddAttribute: (
    variantId: string,
    key: string,
    value: string
  ) => void;

  onRemoveAttribute: (
    variantId: string,
    key: string,
    value: string
  ) => void;
}> = ({
  variantId,
  selectedAttributes,
  availableAttributes,
  onAddAttribute,
  onRemoveAttribute,
}) => {
  const [
    selectedKey,
    setSelectedKey,
  ] = useState("");

  const [
    selectedValue,
    setSelectedValue,
  ] = useState("");

  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const handleAdd = () => {
    if (
      selectedKey &&
      selectedValue
    ) {
      onAddAttribute(
        variantId,
        selectedKey,
        selectedValue
      );

      setSelectedKey("");
      setSelectedValue("");
      setIsOpen(false);
    }
  };

  const getValuesForAttribute =
    (key: string) => {
      const attribute =
        availableAttributes.find(
          (attr) =>
            attr.attribute_key ===
            key
        );

      return (
        attribute?.values ||
        []
      );
    };

  const isAttributeValueSelected =
    (
      key: string,
      value: string
    ) => {
      return selectedAttributes.some(
        (attr) =>
          attr.key === key &&
          attr.value ===
            value
      );
    };

  const getAvailableValuesForAttribute =
    (key: string) => {
      const allValues =
        getValuesForAttribute(
          key
        );

      return allValues.filter(
        (val) =>
          !isAttributeValueSelected(
            key,
            val.value
          )
      );
    };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {selectedAttributes.map(
          (
            attr,
            index
          ) => (
            <span
              key={`${attr.key}-${attr.value}-${index}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium"
            >
              <span className="font-semibold text-blue-700">
                {
                  attr.key
                }:
              </span>

              <span className="text-blue-600">
                {
                  attr.value
                }
              </span>

              <button
                type="button"
                onClick={() =>
                  onRemoveAttribute(
                    variantId,
                    attr.key,
                    attr.value
                  )
                }
                className="ml-0.5 text-red-500 transition-colors hover:text-red-700"
              >
                <FiX size={12} />
              </button>
            </span>
          )
        )}

        {selectedAttributes.length ===
          0 && (
          <span className="text-xs text-gray-400">
            No attributes selected
          </span>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() =>
            setIsOpen(
              !isOpen
            )
          }
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
        >
          <FiPlus size={14} />
          Add Attribute
        </button>

        {isOpen && (
          <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
            <div className="space-y-3">

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Select Attribute
                </label>

                <select
                  value={
                    selectedKey
                  }
                  onChange={(
                    e
                  ) => {
                    setSelectedKey(
                      e.target
                        .value
                    );

                    setSelectedValue(
                      ""
                    );
                  }}
                  className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
                >
                  <option value="">
                    Choose attribute...
                  </option>

                  {availableAttributes.map(
                    (attr) => (
                      <option
                        key={
                          attr.id
                        }
                        value={
                          attr.attribute_key
                        }
                      >
                        {
                          attr.attribute_key
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              {selectedKey && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    Select Value
                  </label>

                  <select
                    value={
                      selectedValue
                    }
                    onChange={(
                      e
                    ) =>
                      setSelectedValue(
                        e.target.value
                      )
                    }
                    className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
                  >
                    <option value="">
                      Choose value...
                    </option>

                    {getAvailableValuesForAttribute(
                      selectedKey
                    ).map(
                      (
                        val
                      ) => (
                        <option
                          key={
                            val.id
                          }
                          value={
                            val.value
                          }
                        >
                          {
                            val.value
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(
                      false
                    );

                    setSelectedKey(
                      ""
                    );

                    setSelectedValue(
                      ""
                    );
                  }}
                  className="h-8 flex-1 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    handleAdd
                  }
                  disabled={
                    !selectedKey ||
                    !selectedValue
                  }
                  className="h-8 flex-1 rounded-lg bg-black text-xs font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
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

const AddProductModal: React.FC<
  AddProductModalProps
> = ({
  open,
  loading,
  onClose,
  onSubmit,
  editData,
  isEdit = false,
}) => {
  const [categories, setCategories] =
    useState<SelectOption[]>(
      []
    );

  const [
    subcategories,
    setSubcategories,
  ] = useState<
    SelectOption[]
  >([]);

  const [brands, setBrands] =
    useState<SelectOption[]>(
      []
    );

  const [
    taxCategories,
    setTaxCategories,
  ] = useState<
    SelectOption[]
  >([]);

  const [
    attributeMasters,
    setAttributeMasters,
  ] = useState<
    AttributeMaster[]
  >([]);

  const [
    fetchingOptions,
    setFetchingOptions,
  ] = useState(false);

  const [
    productCode,
    setProductCode,
  ] = useState("");

  const [name, setName] =
    useState("");

  const [slug, setSlug] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    specification,
    setSpecification,
  ] = useState<SpecItem[]>(
    [
      {
        key: "",
        value: "",
      },
    ]
  );

  const [
    categoryId,
    setCategoryId,
  ] = useState("");

  const [
    subcategoryId,
    setSubcategoryId,
  ] = useState("");

  const [brandId, setBrandId] =
    useState("");

  const [
    taxCategoryId,
    setTaxCategoryId,
  ] = useState("");

  const [
    retailMrp,
    setRetailMrp,
  ] = useState("");

  const [
    retailDiscountValue,
    setRetailDiscountValue,
  ] = useState("");

  const [
    distributorMrp,
    setDistributorMrp,
  ] = useState("");

  const [
    distributorDiscountValue,
    setDistributorDiscountValue,
  ] = useState("");

  const [
    stockQuantity,
    setStockQuantity,
  ] = useState("");

  const [
    lowStockThreshold,
    setLowStockThreshold,
  ] = useState("10");

  const [
    isPublished,
    setIsPublished,
  ] = useState(true);

  const [images, setImages] =
    useState<ImageItem[]>(
      []
    );

  const [
    variants,
    setVariants,
  ] = useState<
    VariantFormData[]
  >([]);

  const [
    errors,
    setErrors,
  ] = useState<FormErrors>(
    {}
  );

  // ============================================================
  // FETCH OPTIONS
  // ============================================================

  const fetchOptions = async () => {
    try {
      setFetchingOptions(true);

      // CATEGORY

      const categoriesRes =
        await categoryApi.getAll();

      const formattedCategories =
        categoriesRes.data?.data?.map(
          (cat: any) => ({
            id: cat.id,
            name:
              cat.title ||
              cat.name,
          })
        ) || [];

      setCategories(
        formattedCategories
      );

      // SUBCATEGORY

      const subcategoriesRes =
        await subcategoryApi.getAll();

      let subcategoriesData: any[] =
        [];

      if (
        subcategoriesRes?.data?.data
          ?.data
      ) {
        subcategoriesData =
          subcategoriesRes.data.data.data;
      } else if (
        Array.isArray(
          subcategoriesRes?.data?.data
        )
      ) {
        subcategoriesData =
          subcategoriesRes.data.data;
      } else if (
        Array.isArray(
          subcategoriesRes?.data
        )
      ) {
        subcategoriesData =
          subcategoriesRes.data;
      }

      const formattedSubcategories =
        subcategoriesData.map(
          (sub: any) => ({
            id: Number(
              sub.id
            ),
            name: sub.name,
          })
        );

      setSubcategories(
        formattedSubcategories
      );

      // BRANDS

      const brandsRes =
        await brandsApi.getAll();

      const brandsData =
        brandsRes.data?.data ||
        [];

      const formattedBrands =
        brandsData.map(
          (brand: any) => ({
            id: brand.id,
            name:
              brand.title ||
              brand.name,
          })
        );

      setBrands(
        formattedBrands
      );

      // TAX

      const taxRes =
        await taxApi.getAll();

      const formattedTaxCategories =
        taxRes.data?.data?.map(
          (tax: any) => ({
            id: tax.id,
            name: tax.name,
          })
        ) || [];

      setTaxCategories(
        formattedTaxCategories
      );

      // ATTRIBUTES

      const attributesRes =
        await attributesApi.getAll();

      if (
        attributesRes.data?.success
      ) {
        setAttributeMasters(
          attributesRes.data.data ||
            []
        );
      }
    } catch (error: any) {
      console.error(
        "Fetch options error:",
        error
      );

      setCategories([]);
      setSubcategories([]);
      setBrands([]);
      setTaxCategories([]);
      setAttributeMasters([]);
    } finally {
      setFetchingOptions(false);
    }
  };

  // ============================================================
  // FETCH WHEN OPEN
  // ============================================================

  useEffect(() => {
    if (open) {
      fetchOptions();
    }
  }, [open]);

  // ============================================================
  // LOAD EDIT DATA
  // ============================================================

  useEffect(() => {
    if (
      !open ||
      !isEdit ||
      !editData
    ) {
      return;
    }

    /*
     * Normalize product.
     */

    const product =
      getProductObject(
        editData
      );

    if (!product) {
      return;
    }

    console.log(
      "EDIT MODAL PRODUCT:",
      product
    );

    // ==========================================================
    // BASIC INFORMATION
    // ==========================================================

    setProductCode(
      String(
        product?.product_code ??
          product?.sku ??
          ""
      )
    );

    setName(
      String(
        product?.name ??
          ""
      )
    );

    setSlug(
      String(
        product?.slug ??
          ""
      )
    );

    setDescription(
      String(
        product?.description ??
          ""
      )
    );

    // ==========================================================
    // SPECIFICATION
    // ==========================================================

    if (
      product?.specification
    ) {
      setSpecification(
        parseSpecification(
          product.specification
        )
      );
    } else {
      setSpecification([
        {
          key: "",
          value: "",
        },
      ]);
    }

    // ==========================================================
    // CATEGORY
    // ==========================================================

    const editCategoryId =
      product?.category_id ??
      product?.category?.id ??
      "";

    setCategoryId(
      editCategoryId !==
        null &&
        editCategoryId !==
          undefined
        ? String(
            editCategoryId
          )
        : ""
    );

    // ==========================================================
    // SUBCATEGORY
    // ==========================================================

    const editSubcategoryId =
      product?.subcategory_id ??
      product?.[
        "subcategory_id "
      ] ??
      product?.subcategory
        ?.id ??
      "";

    setSubcategoryId(
      editSubcategoryId !==
        null &&
        editSubcategoryId !==
          undefined
        ? String(
            editSubcategoryId
          )
        : ""
    );

    // ==========================================================
    // BRAND
    // ==========================================================

    const editBrandId =
      product?.brand_id ??
      product?.brand?.id ??
      "";

    setBrandId(
      editBrandId !== null &&
        editBrandId !==
          undefined
        ? String(
            editBrandId
          )
        : ""
    );

    // ==========================================================
    // TAX
    // ==========================================================

    const editTaxCategoryId =
      product?.tax_category_id ??
      product?.tax_category
        ?.id ??
      "";

    setTaxCategoryId(
      editTaxCategoryId !==
        null &&
        editTaxCategoryId !==
          undefined
        ? String(
            editTaxCategoryId
          )
        : ""
    );

    // ==========================================================
    // PRICING - IMPORTANT
    // ==========================================================

    const editRetailMrp =
      product?.retail_mrp;

    const editRetailDiscount =
      product?.retail_discount_value ??
      product?.retail_discount_percentage ??
      "";

    const editDistributorMrp =
      product?.distributor_mrp;

    const editDistributorDiscount =
      product?.distributor_discount_value ??
      product?.distributor_discount_percentage ??
      "";

    console.log(
      "EDIT RETAIL MRP:",
      editRetailMrp
    );

    console.log(
      "EDIT RETAIL DISCOUNT:",
      editRetailDiscount
    );

    console.log(
      "EDIT DISTRIBUTOR MRP:",
      editDistributorMrp
    );

    console.log(
      "EDIT DISTRIBUTOR DISCOUNT:",
      editDistributorDiscount
    );

    /*
     * Do NOT use:
     *
     * value || ""
     *
     * because 0 can be lost.
     */

    setRetailMrp(
      editRetailMrp !==
        null &&
        editRetailMrp !==
          undefined
        ? String(
            editRetailMrp
          )
        : ""
    );

    setRetailDiscountValue(
      editRetailDiscount !==
        null &&
        editRetailDiscount !==
          undefined
        ? String(
            editRetailDiscount
          )
        : ""
    );

    setDistributorMrp(
      editDistributorMrp !==
        null &&
        editDistributorMrp !==
          undefined
        ? String(
            editDistributorMrp
          )
        : ""
    );

    setDistributorDiscountValue(
      editDistributorDiscount !==
        null &&
        editDistributorDiscount !==
          undefined
        ? String(
            editDistributorDiscount
          )
        : ""
    );

    // ==========================================================
    // INVENTORY
    // ==========================================================

    setStockQuantity(
      product?.stock_quantity !==
        null &&
        product?.stock_quantity !==
          undefined
        ? String(
            product.stock_quantity
          )
        : ""
    );

    setLowStockThreshold(
      product?.low_stock_threshold !==
        null &&
        product?.low_stock_threshold !==
          undefined
        ? String(
            product.low_stock_threshold
          )
        : "10"
    );

    // ==========================================================
    // PUBLISHED
    // ==========================================================

    setIsPublished(
      product?.is_published ===
        true ||
        product?.is_published ===
          1 ||
        product?.is_published ===
          "1" ||
        product?.is_published ===
          "true"
    );

    // ==========================================================
    // PRODUCT IMAGES
    // ==========================================================

    if (
      Array.isArray(
        product?.images
      )
    ) {
      const existingImages: ImageItem[] =
        product.images.map(
          (
            img: any,
            index: number
          ) => ({
            id:
              Date.now() +
              index,

            preview:
              img?.image_url ||
              img?.image ||
              "",

            sort_order:
              img?.sort_order ??
              index + 1,

            is_primary:
              img?.is_primary ===
                true ||
              img?.is_primary ===
                1 ||
              img?.is_primary ===
                "1"
                ? 1
                : 0,

            existing_id:
              img?.id,

            is_existing:
              true,
          })
        );

      setImages(
        existingImages
      );
    } else {
      setImages([]);
    }

    // ==========================================================
    // VARIANTS
    // ==========================================================

    setVariants(
      generateVariantsFromProduct(
        product
      )
    );
  }, [
    open,
    isEdit,
    editData,
  ]);

  // ============================================================
  // RESET FORM
  // ============================================================

  useEffect(() => {
    if (open) {
      return;
    }

    setProductCode("");
    setName("");
    setSlug("");
    setDescription("");

    setSpecification([
      {
        key: "",
        value: "",
      },
    ]);

    setCategoryId("");
    setSubcategoryId("");
    setBrandId("");
    setTaxCategoryId("");

    setRetailMrp("");
    setRetailDiscountValue("");
    setDistributorMrp("");
    setDistributorDiscountValue("");

    setStockQuantity("");
    setLowStockThreshold(
      "10"
    );

    setIsPublished(true);

    setImages([]);
    setVariants([]);
    setErrors({});
  }, [open]);

  if (!open) {
    return null;
  }

  // ============================================================
  // FORM HANDLERS
  // ============================================================

  const handleNameChange = (
    value: string
  ) => {
    setName(value);

    setSlug(
      value
        .toLowerCase()
        .trim()
        .replace(
          /[^a-z0-9]+/g,
          "-"
        )
        .replace(
          /^-+|-+$/g,
          ""
        )
    );

    setErrors(
      (prev) => ({
        ...prev,
        name: undefined,
      })
    );
  };

  // ============================================================
  // CATEGORY
  // ============================================================

  const handleCategoryChange =
    (
      value: string
    ) => {
      setCategoryId(
        value
      );

      setErrors(
        (prev) => ({
          ...prev,
          category_id:
            undefined,
        })
      );

      if (!value) {
        setSubcategoryId(
          ""
        );
      }
    };

  // ============================================================
  // SUBCATEGORY
  // ============================================================

  const handleSubcategoryChange =
    (
      value: string
    ) => {
      setSubcategoryId(
        value
      );

      setErrors(
        (prev) => ({
          ...prev,
          subcategory_id:
            undefined,
        })
      );
    };

  // ============================================================
  // SPECIFICATION
  // ============================================================

  const addSpecificationField =
    () => {
      setSpecification([
        ...specification,
        {
          key: "",
          value: "",
        },
      ]);
    };

  const removeSpecificationField =
    (
      index: number
    ) => {
      if (
        specification.length <=
        1
      ) {
        return;
      }

      setSpecification(
        specification.filter(
          (_, i) =>
            i !== index
        )
      );
    };

  const updateSpecification =
    (
      index: number,
      field:
        | "key"
        | "value",
      value: string
    ) => {
      const newSpec = [
        ...specification,
      ];

      newSpec[index][field] =
        value;

      setSpecification(
        newSpec
      );
    };

  // ============================================================
  // PRODUCT IMAGES
  // ============================================================

  const handleImages = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files =
      e.target.files;

    if (!files) {
      return;
    }

    const newImages: ImageItem[] =
      Array.from(files).map(
        (
          file,
          index
        ) => ({
          id:
            Date.now() +
            index,

          file,

          preview:
            URL.createObjectURL(
              file
            ),

          sort_order:
            images.length +
            index +
            1,

          is_primary:
            images.length ===
              0 &&
            index === 0
              ? 1
              : 0,

          is_existing: false,
        })
      );

    setImages(
      (prev) => [
        ...prev,
        ...newImages,
      ]
    );

    setErrors(
      (prev) => ({
        ...prev,
        images:
          undefined,
      })
    );

    e.target.value = "";
  };

  const removeImage = (
    id: number
  ) => {
    setImages(
      (prev) => {
        const filtered =
          prev.filter(
            (item) =>
              item.id !== id
          );

        if (
          filtered.length >
            0 &&
          !filtered.some(
            (item) =>
              item.is_primary ===
              1
          )
        ) {
          filtered[0].is_primary =
            1;
        }

        return filtered.map(
          (
            item,
            index
          ) => ({
            ...item,
            sort_order:
              index + 1,
          })
        );
      }
    );
  };

  const setPrimaryImage =
    (
      id: number
    ) => {
      setImages(
        (prev) =>
          prev.map(
            (
              item
            ) => ({
              ...item,

              is_primary:
                item.id ===
                id
                  ? 1
                  : 0,
            })
          )
      );
    };

  // ============================================================
  // VARIANTS
  // ============================================================

  const addVariant = () => {
    const newVariant: VariantFormData =
      {
        id: `variant-${Date.now()}`,

        sku: "",

        attributes: [],

        retail_mrp: "",

        retail_discount_type:
          "percentage",

        retail_discount_value:
          "",

        distributor_mrp:
          "",

        distributor_discount_type:
          "percentage",

        distributor_discount_value:
          "",

        stock_quantity:
          "",

        low_stock_threshold:
          "",

        sort_order:
          variants.length + 1,

        is_active: 1,

        images: [],

        is_existing:
          false,
      };

    setVariants([
      ...variants,
      newVariant,
    ]);
  };

  const removeVariant = (
    id: string
  ) => {
    setVariants(
      variants.filter(
        (v) =>
          v.id !== id
      )
    );
  };

  const updateVariant = (
    id: string,
    field:
      | keyof VariantFormData,
    value: any
  ) => {
    setVariants(
      variants.map(
        (v) => {
          if (
            v.id === id
          ) {
            return {
              ...v,
              [field]:
                value,
            };
          }

          return v;
        }
      )
    );
  };

  const updateVariantAttribute =
    (
      id: string,
      key: string,
      value: string
    ) => {
      setVariants(
        variants.map(
          (v) => {
            if (
              v.id ===
              id
            ) {
              const exists =
                v.attributes.some(
                  (
                    attr
                  ) =>
                    attr.key ===
                      key &&
                    attr.value ===
                      value
                );

              if (
                exists
              ) {
                return v;
              }

              return {
                ...v,

                attributes:
                  [
                    ...v.attributes,
                    {
                      key,
                      value,
                    },
                  ],
              };
            }

            return v;
          }
        )
      );
    };

  const removeVariantAttribute =
    (
      id: string,
      key: string,
      value: string
    ) => {
      setVariants(
        variants.map(
          (v) => {
            if (
              v.id ===
              id
            ) {
              return {
                ...v,

                attributes:
                  v.attributes.filter(
                    (
                      attr
                    ) =>
                      !(
                        attr.key ===
                          key &&
                        attr.value ===
                          value
                      )
                  ),
              };
            }

            return v;
          }
        )
      );
    };

  const handleVariantImages =
    (
      variantId: string,
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const files =
        e.target.files;

      if (!files) {
        return;
      }

      const variant =
        variants.find(
          (v) =>
            v.id ===
            variantId
        );

      if (!variant) {
        return;
      }

      const newImages: VariantImageItem[] =
        Array.from(
          files
        ).map(
          (
            file,
            index
          ) => ({
            id:
              Date.now() +
              index,

            file,

            preview:
              URL.createObjectURL(
                file
              ),

            sort_order:
              variant
                .images
                .length +
              index +
              1,

            is_primary:
              variant
                  .images
                  .length ===
                0 &&
              index ===
                0
                ? 1
                : 0,

            is_existing:
              false,
          })
        );

      updateVariant(
        variantId,
        "images",
        [
          ...variant.images,
          ...newImages,
        ]
      );

      e.target.value = "";
    };

  const removeVariantImage =
    (
      variantId: string,
      imageId: number
    ) => {
      const variant =
        variants.find(
          (v) =>
            v.id ===
            variantId
        );

      if (!variant) {
        return;
      }

      const filtered =
        variant.images.filter(
          (img) =>
            img.id !==
            imageId
        );

      if (
        filtered.length >
          0 &&
        !filtered.some(
          (img) =>
            img.is_primary ===
            1
        )
      ) {
        filtered[0].is_primary =
          1;
      }

      updateVariant(
        variantId,
        "images",
        filtered.map(
          (
            img,
            index
          ) => ({
            ...img,
            sort_order:
              index + 1,
          })
        )
      );
    };

  const setPrimaryVariantImage =
    (
      variantId: string,
      imageId: number
    ) => {
      const variant =
        variants.find(
          (v) =>
            v.id ===
            variantId
        );

      if (!variant) {
        return;
      }

      updateVariant(
        variantId,
        "images",
        variant.images.map(
          (
            img
          ) => ({
            ...img,

            is_primary:
              img.id ===
              imageId
                ? 1
                : 0,
          })
        )
      );
    };

  // ============================================================
  // VALIDATE
  // ============================================================

  const validate =
    (): boolean => {
      const newErrors: FormErrors =
        {};

      if (
        !productCode.trim()
      ) {
        newErrors.product_code =
          "Product code is required";
      }

      if (!name.trim()) {
        newErrors.name =
          "Product name is required";
      }

      if (!categoryId) {
        newErrors.category_id =
          "Please select a category";
      }

      if (!subcategoryId) {
        newErrors.subcategory_id =
          "Please select a subcategory";
      }

      if (!brandId) {
        newErrors.brand_id =
          "Please select a brand";
      }

      if (!taxCategoryId) {
        newErrors.tax_category_id =
          "Please select a tax category";
      }

      if (
        !retailMrp ||
        Number(
          retailMrp
        ) <= 0
      ) {
        newErrors.retail_mrp =
          "Please enter a valid retail MRP";
      }

      if (
        !stockQuantity ||
        Number(
          stockQuantity
        ) < 0
      ) {
        newErrors.stock_quantity =
          "Please enter a valid stock quantity";
      }

      if (
        images.length ===
        0
      ) {
        newErrors.images =
          "At least one product image is required";
      }

      setErrors(
        newErrors
      );

      return (
        Object.keys(
          newErrors
        ).length === 0
      );
    };

  // ============================================================
  // BUILD FORM DATA
  // ============================================================

  const buildFormData =
    (): FormData => {
      const formData =
        new FormData();

      const specObject: Record<
        string,
        string
      > = {};

      specification.forEach(
        (item) => {
          if (
            item.key.trim() &&
            item.value.trim()
          ) {
            specObject[
              item.key.trim()
            ] =
              item.value.trim();
          }
        }
      );

      formData.append(
        "product_code",
        productCode
      );

      formData.append(
        "name",
        name
      );

      formData.append(
        "slug",
        slug
      );

      formData.append(
        "description",
        description
      );

      formData.append(
        "specification",
        JSON.stringify(
          specObject
        )
      );

      formData.append(
        "category_id",
        String(
          categoryId
        )
      );

      formData.append(
        "subcategory_id",
        String(
          subcategoryId
        )
      );

      formData.append(
        "brand_id",
        String(
          brandId
        )
      );

      formData.append(
        "tax_category_id",
        String(
          taxCategoryId
        )
      );

      formData.append(
        "stock_quantity",
        String(
          stockQuantity ||
            0
        )
      );

      formData.append(
        "low_stock_threshold",
        String(
          lowStockThreshold ||
            0
        )
      );

      formData.append(
        "is_published",
        String(
          isPublished
            ? 1
            : 0
        )
      );

      formData.append(
        "is_trending",
        "0"
      );

      formData.append(
        "trending_sort_order",
        "0"
      );

      formData.append(
        "sale_type",
        "today_best"
      );

      // ======================================================
      // RETAIL PRICING
      // ======================================================

      formData.append(
        "retail_mrp",
        String(
          retailMrp ||
            0
        )
      );

      formData.append(
        "retail_discount_type",
        "percentage"
      );

      formData.append(
        "retail_discount_value",
        String(
          retailDiscountValue ||
            0
        )
      );

      // ======================================================
      // DISTRIBUTOR PRICING
      // ======================================================

      formData.append(
        "distributor_mrp",
        String(
          distributorMrp ||
            0
        )
      );

      formData.append(
        "distributor_discount_type",
        "percentage"
      );

      formData.append(
        "distributor_discount_value",
        String(
          distributorDiscountValue ||
            0
        )
      );

      // ======================================================
      // EXISTING PRODUCT IMAGES
      // ======================================================

      if (
        isEdit &&
        editData
      ) {
        const existingImageIds =
          images
            .filter(
              (img) =>
                img.is_existing &&
                img.existing_id
            )
            .map(
              (img) =>
                img.existing_id
            );

        if (
          existingImageIds.length >
          0
        ) {
          formData.append(
            "existing_image_ids",
            JSON.stringify(
              existingImageIds
            )
          );
        }
      }

      // ======================================================
      // NEW PRODUCT IMAGES
      // ======================================================

      const newImages =
        images.filter(
          (img) =>
            !img.is_existing
        );

      newImages.forEach(
        (
          item,
          index
        ) => {
          if (item.file) {
            formData.append(
              `product_images[${index}][image]`,
              item.file
            );

            formData.append(
              `product_images[${index}][sort_order]`,
              String(
                item.sort_order
              )
            );

            formData.append(
              `product_images[${index}][is_primary]`,
              String(
                item.is_primary
              )
            );
          }
        }
      );

      // ======================================================
      // VARIANTS
      // ======================================================

      variants.forEach(
        (
          variant,
          vIndex
        ) => {
          if (
            isEdit &&
            variant.is_existing &&
            variant.existing_id
          ) {
            formData.append(
              `variants[${vIndex}][id]`,
              String(
                variant.existing_id
              )
            );
          }

          formData.append(
            `variants[${vIndex}][sku]`,
            variant.sku
          );

          const attributesObject: Record<
            string,
            string
          > = {};

          variant.attributes.forEach(
            (attr) => {
              if (
                attributesObject[
                  attr.key
                ]
              ) {
                attributesObject[
                  attr.key
                ] =
                  attributesObject[
                    attr.key
                  ] +
                  "," +
                  attr.value;
              } else {
                attributesObject[
                  attr.key
                ] =
                  attr.value;
              }
            }
          );

          formData.append(
            `variants[${vIndex}][attributes]`,
            JSON.stringify(
              attributesObject
            )
          );

          formData.append(
            `variants[${vIndex}][retail_mrp]`,
            String(
              variant.retail_mrp ||
                0
            )
          );

          formData.append(
            `variants[${vIndex}][retail_discount_type]`,
            variant.retail_discount_type ||
              "percentage"
          );

          formData.append(
            `variants[${vIndex}][retail_discount_value]`,
            String(
              variant.retail_discount_value ||
                0
            )
          );

          formData.append(
            `variants[${vIndex}][distributor_mrp]`,
            String(
              variant.distributor_mrp ||
                0
            )
          );

          formData.append(
            `variants[${vIndex}][distributor_discount_type]`,
            variant.distributor_discount_type ||
              "percentage"
          );

          formData.append(
            `variants[${vIndex}][distributor_discount_value]`,
            String(
              variant.distributor_discount_value ||
                0
            )
          );

          formData.append(
            `variants[${vIndex}][stock_quantity]`,
            String(
              variant.stock_quantity ||
                0
            )
          );

          formData.append(
            `variants[${vIndex}][low_stock_threshold]`,
            String(
              variant.low_stock_threshold ||
                0
            )
          );

          formData.append(
            `variants[${vIndex}][sort_order]`,
            String(
              variant.sort_order
            )
          );

          formData.append(
            `variants[${vIndex}][is_active]`,
            String(
              variant.is_active
            )
          );

          // VARIANT IMAGES

          const newVariantImages =
            variant.images.filter(
              (img) =>
                !img.is_existing
            );

          newVariantImages.forEach(
            (
              img,
              imgIndex
            ) => {
              if (
                img.file
              ) {
                formData.append(
                  `variants[${vIndex}][images][${imgIndex}][image]`,
                  img.file
                );

                formData.append(
                  `variants[${vIndex}][images][${imgIndex}][sort_order]`,
                  String(
                    img.sort_order
                  )
                );

                formData.append(
                  `variants[${vIndex}][images][${imgIndex}][is_primary]`,
                  String(
                    img.is_primary
                  )
                );
              }
            }
          );

          if (
            isEdit
          ) {
            const existingVariantImageIds =
              variant.images
                .filter(
                  (img) =>
                    img.is_existing &&
                    img.existing_id
                )
                .map(
                  (img) =>
                    img.existing_id
                );

            if (
              existingVariantImageIds.length >
              0
            ) {
              formData.append(
                `variants[${vIndex}][existing_image_ids]`,
                JSON.stringify(
                  existingVariantImageIds
                )
              );
            }
          }
        }
      );

      return formData;
    };

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!validate()) {
      const firstError =
        document.querySelector(
          ".error-message"
        );

      if (firstError) {
        firstError.scrollIntoView(
          {
            behavior:
              "smooth",
            block: "center",
          }
        );
      }

      return;
    }

    const formData =
      buildFormData();

    /*
     * Debug FormData
     */

    console.log(
      "SUBMIT FORM DATA:"
    );

    for (const [
      key,
      value,
    ] of formData.entries()) {
      console.log(
        key,
        value
      );
    }

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
          className="relative flex max-h-[90vh] w-full max-w-[1200px] flex-col rounded-2xl bg-white shadow-2xl"
          onClick={(e) =>
            e.stopPropagation()
          }
        >
          {/* HEADER */}

          <div className="flex flex-shrink-0 items-center justify-between rounded-t-2xl border-b border-gray-200 bg-white px-6 py-5">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                {isEdit ? (
                  <FiEdit2
                    className="text-yellow-500"
                    size={24}
                  />
                ) : (
                  <FiPlus
                    className="text-yellow-500"
                    size={24}
                  />
                )}

                {isEdit
                  ? "Edit Product"
                  : "Add New Product"}
              </h2>

              <p className="mt-0.5 text-sm text-gray-500">
                {isEdit
                  ? `Editing: ${
                      getProductObject(
                        editData
                      )?.name ||
                      "Product"
                    }`
                  : "Fill in the product details, pricing, variants and images"}
              </p>
            </div>

            <button
              type="button"
              onClick={
                onClose
              }
              className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
            >
              <FiX size={21} />
            </button>
          </div>

          {/* BODY */}

          <div className="flex-1 overflow-y-auto p-6">
            <form
              onSubmit={
                handleSubmit
              }
              id="product-form"
            >
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">

                {/* =================================================
                    LEFT
                ================================================= */}

                <div className="space-y-6">

                  {/* BASIC INFORMATION */}

                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <FiInfo
                        className="text-yellow-500"
                        size={20}
                      />

                      <h3 className="text-lg font-bold text-gray-900">
                        Basic Information
                      </h3>
                    </div>

                    <div className="space-y-4">

                      {/* PRODUCT NAME */}

                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                          Product Name{" "}
                          <span className="text-red-500">
                            *
                          </span>
                        </label>

                        <input
                          type="text"
                          value={
                            name
                          }
                          onChange={(
                            e
                          ) =>
                            handleNameChange(
                              e.target
                                .value
                            )
                          }
                          placeholder="e.g. SoundMax Pro 5G Smartphone"
                          className={`h-12 w-full rounded-lg border ${
                            errors.name
                              ? "border-red-500"
                              : "border-gray-300"
                          } px-4 text-sm outline-none transition-all focus:border-black focus:ring-2 focus:ring-black/10`}
                        />

                        {errors.name && (
                          <p className="error-message mt-1 flex items-center gap-1 text-sm text-red-500">
                            <FiInfo size={14} />
                            {
                              errors.name
                            }
                          </p>
                        )}
                      </div>

                      {/* PRODUCT CODE */}

                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                          SKU / Product Code{" "}
                          <span className="text-red-500">
                            *
                          </span>
                        </label>

                        <input
                          type="text"
                          value={
                            productCode
                          }
                          onChange={(
                            e
                          ) =>
                            setProductCode(
                              e.target
                                .value
                            )
                          }
                          placeholder="e.g. SMP5G-BLACK-128"
                          className={`h-12 w-full rounded-lg border ${
                            errors.product_code
                              ? "border-red-500"
                              : "border-gray-300"
                          } px-4 text-sm outline-none transition-all focus:border-black focus:ring-2 focus:ring-black/10`}
                        />

                        {errors.product_code && (
                          <p className="error-message mt-1 flex items-center gap-1 text-sm text-red-500">
                            <FiInfo size={14} />
                            {
                              errors.product_code
                            }
                          </p>
                        )}
                      </div>

                      {/* SLUG */}

                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                          Slug
                        </label>

                        <input
                          type="text"
                          value={
                            slug
                          }
                          readOnly
                          className="h-12 w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-50 px-4 text-sm text-gray-600 outline-none"
                        />

                        <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                          <FiInfo size={12} />
                          Auto-generated from product name
                        </p>
                      </div>

                      {/* CATEGORY / SUBCATEGORY / BRAND / TAX */}

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                        {/* CATEGORY */}

                        <div>
                          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Category{" "}
                            <span className="text-red-500">
                              *
                            </span>
                          </label>

                          <div className="relative">
                            <select
                              value={
                                categoryId
                              }
                              onChange={(
                                e
                              ) =>
                                handleCategoryChange(
                                  e.target.value
                                )
                              }
                              className={`h-12 w-full appearance-none rounded-lg border ${
                                errors.category_id
                                  ? "border-red-500"
                                  : "border-gray-300"
                              } bg-white px-4 pr-10 text-sm outline-none transition-all focus:border-black focus:ring-2 focus:ring-black/10`}
                            >
                              <option value="">
                                Select category...
                              </option>

                              {categories.map(
                                (
                                  category
                                ) => (
                                  <option
                                    key={
                                      category.id
                                    }
                                    value={String(
                                      category.id
                                    )}
                                  >
                                    {
                                      category.name
                                    }
                                  </option>
                                )
                              )}
                            </select>

                            <FiTag
                              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                              size={18}
                            />
                          </div>

                          {errors.category_id && (
                            <p className="error-message mt-1 flex items-center gap-1 text-sm text-red-500">
                              <FiInfo size={14} />
                              {
                                errors.category_id
                              }
                            </p>
                          )}
                        </div>

                        {/* SUBCATEGORY */}

                        <div>
                          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Sub Category{" "}
                            <span className="text-red-500">
                              *
                            </span>
                          </label>

                          <div className="relative">
                            <select
                              value={
                                subcategoryId
                              }
                              onChange={(
                                e
                              ) =>
                                handleSubcategoryChange(
                                  e.target.value
                                )
                              }
                              className={`h-12 w-full appearance-none rounded-lg border ${
                                errors.subcategory_id
                                  ? "border-red-500"
                                  : "border-gray-300"
                              } bg-white px-4 pr-10 text-sm outline-none transition-all focus:border-black focus:ring-2 focus:ring-black/10`}
                            >
                              <option value="">
                                Select subcategory...
                              </option>

                              {subcategories.map(
                                (
                                  subcategory
                                ) => (
                                  <option
                                    key={
                                      subcategory.id
                                    }
                                    value={String(
                                      subcategory.id
                                    )}
                                  >
                                    {
                                      subcategory.name
                                    }
                                  </option>
                                )
                              )}
                            </select>

                            <FiLayers
                              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                              size={18}
                            />
                          </div>

                          {errors.subcategory_id && (
                            <p className="error-message mt-1 flex items-center gap-1 text-sm text-red-500">
                              <FiInfo size={14} />
                              {
                                errors.subcategory_id
                              }
                            </p>
                          )}
                        </div>

                        {/* BRAND */}

                        <div>
                          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Brand{" "}
                            <span className="text-red-500">
                              *
                            </span>
                          </label>

                          <div className="relative">
                            <select
                              value={
                                brandId
                              }
                              onChange={(
                                e
                              ) => {
                                setBrandId(
                                  e.target
                                    .value
                                );

                                setErrors(
                                  (
                                    prev
                                  ) => ({
                                    ...prev,
                                    brand_id:
                                      undefined,
                                  })
                                );
                              }}
                              className={`h-12 w-full appearance-none rounded-lg border ${
                                errors.brand_id
                                  ? "border-red-500"
                                  : "border-gray-300"
                              } bg-white px-4 pr-10 text-sm outline-none transition-all focus:border-black focus:ring-2 focus:ring-black/10`}
                            >
                              <option value="">
                                Select brand...
                              </option>

                              {brands.map(
                                (
                                  brand
                                ) => (
                                  <option
                                    key={
                                      brand.id
                                    }
                                    value={String(
                                      brand.id
                                    )}
                                  >
                                    {
                                      brand.name
                                    }
                                  </option>
                                )
                              )}
                            </select>

                            <FiAward
                              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                              size={18}
                            />
                          </div>

                          {errors.brand_id && (
                            <p className="error-message mt-1 flex items-center gap-1 text-sm text-red-500">
                              <FiInfo size={14} />
                              {
                                errors.brand_id
                              }
                            </p>
                          )}
                        </div>

                        {/* TAX */}

                        <div>
                          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Tax Category{" "}
                            <span className="text-red-500">
                              *
                            </span>
                          </label>

                          <div className="relative">
                            <select
                              value={
                                taxCategoryId
                              }
                              onChange={(
                                e
                              ) => {
                                setTaxCategoryId(
                                  e.target
                                    .value
                                );

                                setErrors(
                                  (
                                    prev
                                  ) => ({
                                    ...prev,
                                    tax_category_id:
                                      undefined,
                                  })
                                );
                              }}
                              className={`h-12 w-full appearance-none rounded-lg border ${
                                errors.tax_category_id
                                  ? "border-red-500"
                                  : "border-gray-300"
                              } bg-white px-4 pr-10 text-sm outline-none transition-all focus:border-black focus:ring-2 focus:ring-black/10`}
                            >
                              <option value="">
                                Select tax...
                              </option>

                              {taxCategories.map(
                                (
                                  tax
                                ) => (
                                  <option
                                    key={
                                      tax.id
                                    }
                                    value={String(
                                      tax.id
                                    )}
                                  >
                                    {
                                      tax.name
                                    }
                                  </option>
                                )
                              )}
                            </select>

                            <FiTag
                              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                              size={18}
                            />
                          </div>

                          {errors.tax_category_id && (
                            <p className="error-message mt-1 flex items-center gap-1 text-sm text-red-500">
                              <FiInfo size={14} />
                              {
                                errors.tax_category_id
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DESCRIPTION / SPECIFICATION */}

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                    {/* DESCRIPTION */}

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="mb-4 flex items-center gap-2">
                        <FiAlignLeft
                          className="text-yellow-500"
                          size={20}
                        />

                        <h3 className="text-lg font-bold text-gray-900">
                          Description
                        </h3>
                      </div>

                      <textarea
                        rows={6}
                        value={
                          description
                        }
                        onChange={(
                          e
                        ) =>
                          setDescription(
                            e.target
                              .value
                          )
                        }
                        placeholder="Enter product description..."
                        className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-black focus:ring-2 focus:ring-black/10"
                      />
                    </div>

                    {/* SPECIFICATION */}

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FiGrid
                            className="text-yellow-500"
                            size={20}
                          />

                          <h3 className="text-lg font-bold text-gray-900">
                            Specification
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={
                            addSpecificationField
                          }
                          className="flex items-center gap-1 rounded-lg bg-black px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
                        >
                          <FiPlus size={14} />
                          Add Field
                        </button>
                      </div>

                      <div className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
                        {specification.map(
                          (
                            item,
                            index
                          ) => (
                            <div
                              key={
                                index
                              }
                              className="flex items-start gap-2"
                            >
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={
                                    item.key
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    updateSpecification(
                                      index,
                                      "key",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Key (e.g., Display)"
                                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition-all focus:border-black focus:ring-2 focus:ring-black/10"
                                />
                              </div>

                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={
                                    item.value
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    updateSpecification(
                                      index,
                                      "value",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Value (e.g., 6.7-inch AMOLED)"
                                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition-all focus:border-black focus:ring-2 focus:ring-black/10"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeSpecificationField(
                                    index
                                  )
                                }
                                disabled={
                                  specification.length <=
                                  1
                                }
                                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border ${
                                  specification.length <=
                                  1
                                    ? "cursor-not-allowed border-gray-200 text-gray-300"
                                    : "border-red-200 text-red-500 hover:border-red-300 hover:bg-red-50"
                                } transition-colors`}
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* PRODUCT IMAGES */}

                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FiUploadCloud
                          className="text-yellow-500"
                          size={20}
                        />

                        <h3 className="text-lg font-bold text-gray-900">
                          Product Images
                        </h3>

                        <span className="text-sm text-red-500">
                          *
                        </span>
                      </div>

                      <label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-black px-4 text-sm font-semibold text-white transition-colors hover:bg-gray-800">
                        <FiPlus size={16} />

                        Add Images

                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={
                            handleImages
                          }
                        />
                      </label>
                    </div>

                    {errors.images && (
                      <p className="error-message mb-3 flex items-center gap-1 text-sm text-red-500">
                        <FiInfo size={14} />
                        {
                          errors.images
                        }
                      </p>
                    )}

                    {images.length ===
                    0 ? (
                      <label className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:bg-gray-100">
                        <FiUploadCloud
                          size={40}
                          className="text-gray-400"
                        />

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
                          onChange={
                            handleImages
                          }
                        />
                      </label>
                    ) : (
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {images.map(
                          (
                            item
                          ) => (
                            <div
                              key={
                                item.id
                              }
                              className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
                            >
                              <img
                                src={
                                  item.preview
                                }
                                alt="Product"
                                className="h-[140px] w-full object-cover"
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  setPrimaryImage(
                                    item.id
                                  )
                                }
                                className={`absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-colors ${
                                  item.is_primary
                                    ? "bg-black text-white"
                                    : "bg-white/90 text-gray-600 hover:bg-white"
                                }`}
                              >
                                {item.is_primary
                                  ? "★ Primary"
                                  : "Set Primary"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  removeImage(
                                    item.id
                                  )
                                }
                                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-red-500 shadow transition-colors hover:bg-red-500 hover:text-white"
                              >
                                <FiX size={14} />
                              </button>

                              <div className="flex items-center justify-between border-t border-gray-100 px-3 py-1.5 text-xs text-gray-500">
                                <span>
                                  #
                                  {
                                    item.sort_order
                                  }
                                </span>

                                {item.is_primary && (
                                  <span className="font-semibold text-black">
                                    Primary
                                  </span>
                                )}

                                {item.is_existing && (
                                  <span className="text-[10px] text-blue-500">
                                    Existing
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* VARIANTS */}

                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FiPackage
                          className="text-yellow-500"
                          size={20}
                        />

                        <h3 className="text-lg font-bold text-gray-900">
                          Variants
                        </h3>

                        <span className="text-xs text-gray-400">
                          (
                          {
                            variants.length
                          }{" "}
                          variant
                          {variants.length !==
                          1
                            ? "s"
                            : ""}
                          )
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={
                          addVariant
                        }
                        className="flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-black px-4 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
                      >
                        <FiPlus size={16} />
                        Add Variant
                      </button>
                    </div>

                    {variants.length ===
                    0 ? (
                      <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-10 text-center text-sm text-gray-400">
                        No variants added. Click "Add Variant" to create one.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {variants.map(
                          (
                            variant,
                            index
                          ) => (
                            <div
                              key={
                                variant.id
                              }
                              className="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100"
                            >
                              <div className="mb-3 flex items-center justify-between">
                                <h4 className="flex items-center gap-2 font-bold text-gray-900">
                                  <FiPackage
                                    className="text-yellow-500"
                                    size={16}
                                  />

                                  Variant #
                                  {
                                    index +
                                      1
                                  }

                                  {variant.is_existing && (
                                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-500">
                                      Existing
                                    </span>
                                  )}
                                </h4>

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeVariant(
                                      variant.id
                                    )
                                  }
                                  className="rounded-lg p-1 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                                >
                                  <FiTrash2 size={18} />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

                                {/* SKU */}

                                <div>
                                  <label className="text-xs font-semibold text-gray-600">
                                    SKU
                                  </label>

                                  <input
                                    type="text"
                                    value={
                                      variant.sku
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      updateVariant(
                                        variant.id,
                                        "sku",
                                        e.target
                                          .value
                                      )
                                    }
                                    placeholder="e.g. SMP5G-BLACK-128"
                                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition-all focus:border-black focus:ring-2 focus:ring-black/10"
                                  />
                                </div>

                                {/* ATTRIBUTE */}

                                <div>
                                  <label className="text-xs font-semibold text-gray-600">
                                    Attributes
                                  </label>

                                  <AttributeSelector
                                    variantId={
                                      variant.id
                                    }
                                    selectedAttributes={
                                      variant.attributes
                                    }
                                    availableAttributes={
                                      attributeMasters
                                    }
                                    onAddAttribute={
                                      updateVariantAttribute
                                    }
                                    onRemoveAttribute={
                                      removeVariantAttribute
                                    }
                                  />
                                </div>

                                {/* RETAIL MRP */}

                                <div>
                                  <label className="text-xs font-semibold text-gray-600">
                                    Retail MRP
                                  </label>

                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">
                                      ₹
                                    </span>

                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={
                                        variant.retail_mrp
                                      }
                                      onChange={(
                                        e
                                      ) => {
                                        const val =
                                          e.target
                                            .value;

                                        if (
                                          isValidDecimalInput(
                                            val
                                          )
                                        ) {
                                          updateVariant(
                                            variant.id,
                                            "retail_mrp",
                                            val
                                          );
                                        }
                                      }}
                                      placeholder="100000"
                                      className="h-10 w-full rounded-lg border border-gray-300 pl-7 pr-3 text-sm outline-none transition-all focus:border-black focus:ring-2 focus:ring-black/10"
                                    />
                                  </div>
                                </div>

                                {/* RETAIL DISCOUNT */}

                                <div>
                                  <label className="text-xs font-semibold text-gray-600">
                                    Discount (%)
                                  </label>

                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={
                                      variant.retail_discount_value
                                    }
                                    onChange={(
                                      e
                                    ) => {
                                      const val =
                                        e.target
                                          .value;

                                      if (
                                        isValidDecimalInput(
                                          val
                                        )
                                      ) {
                                        updateVariant(
                                          variant.id,
                                          "retail_discount_value",
                                          val
                                        );
                                      }
                                    }}
                                    placeholder="40"
                                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition-all focus:border-black focus:ring-2 focus:ring-black/10"
                                  />
                                </div>

                                {/* DISTRIBUTOR MRP */}

                                <div>
                                  <label className="text-xs font-semibold text-gray-600">
                                    Distributor MRP
                                  </label>

                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">
                                      ₹
                                    </span>

                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={
                                        variant.distributor_mrp
                                      }
                                      onChange={(
                                        e
                                      ) => {
                                        const val =
                                          e.target
                                            .value;

                                        if (
                                          isValidDecimalInput(
                                            val
                                          )
                                        ) {
                                          updateVariant(
                                            variant.id,
                                            "distributor_mrp",
                                            val
                                          );
                                        }
                                      }}
                                      placeholder="90000"
                                      className="h-10 w-full rounded-lg border border-gray-300 pl-7 pr-3 text-sm outline-none transition-all focus:border-black focus:ring-2 focus:ring-black/10"
                                    />
                                  </div>
                                </div>

                                {/* DISTRIBUTOR DISCOUNT */}

                                <div>
                                  <label className="text-xs font-semibold text-gray-600">
                                    Distributor Discount (%)
                                  </label>

                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={
                                      variant.distributor_discount_value
                                    }
                                    onChange={(
                                      e
                                    ) => {
                                      const val =
                                        e.target
                                          .value;

                                      if (
                                        isValidDecimalInput(
                                          val
                                        )
                                      ) {
                                        updateVariant(
                                          variant.id,
                                          "distributor_discount_value",
                                          val
                                        );
                                      }
                                    }}
                                    placeholder="35"
                                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition-all focus:border-black focus:ring-2 focus:ring-black/10"
                                  />
                                </div>

                                {/* STOCK */}

                                <div>
                                  <label className="text-xs font-semibold text-gray-600">
                                    Stock
                                  </label>

                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={
                                      variant.stock_quantity
                                    }
                                    onChange={(
                                      e
                                    ) => {
                                      const val =
                                        e.target
                                          .value;

                                      if (
                                        isValidIntegerInput(
                                          val
                                        )
                                      ) {
                                        updateVariant(
                                          variant.id,
                                          "stock_quantity",
                                          val
                                        );
                                      }
                                    }}
                                    placeholder="20"
                                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition-all focus:border-black focus:ring-2 focus:ring-black/10"
                                  />
                                </div>

                                {/* LOW STOCK */}

                                <div>
                                  <label className="text-xs font-semibold text-gray-600">
                                    Low Stock Alert
                                  </label>

                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={
                                      variant.low_stock_threshold
                                    }
                                    onChange={(
                                      e
                                    ) => {
                                      const val =
                                        e.target
                                          .value;

                                      if (
                                        isValidIntegerInput(
                                          val
                                        )
                                      ) {
                                        updateVariant(
                                          variant.id,
                                          "low_stock_threshold",
                                          val
                                        );
                                      }
                                    }}
                                    placeholder="5"
                                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition-all focus:border-black focus:ring-2 focus:ring-black/10"
                                  />
                                </div>

                                {/* STATUS */}

                                <div>
                                  <label className="text-xs font-semibold text-gray-600">
                                    Status
                                  </label>

                                  <select
                                    value={
                                      variant.is_active
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      updateVariant(
                                        variant.id,
                                        "is_active",
                                        Number(
                                          e.target.value
                                        )
                                      )
                                    }
                                    className="h-10 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition-all focus:border-black focus:ring-2 focus:ring-black/10"
                                  >
                                    <option value={1}>
                                      Active
                                    </option>

                                    <option value={0}>
                                      Inactive
                                    </option>
                                  </select>
                                </div>
                              </div>

                              {/* VARIANT IMAGES */}

                              <div className="mt-3 border-t border-gray-200 pt-3">
                                <div className="mb-2 flex items-center justify-between">
                                  <label className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                                    <FiUploadCloud size={14} />
                                    Variant Images
                                  </label>

                                  <label className="flex cursor-pointer items-center gap-1 rounded-lg bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-300">
                                    <FiPlus size={12} />
                                    Add Images

                                    <input
                                      type="file"
                                      multiple
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(
                                        e
                                      ) =>
                                        handleVariantImages(
                                          variant.id,
                                          e
                                        )
                                      }
                                    />
                                  </label>
                                </div>

                                {variant.images
                                  .length >
                                  0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {variant.images.map(
                                      (
                                        img
                                      ) => (
                                        <div
                                          key={
                                            img.id
                                          }
                                          className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200 shadow-sm"
                                        >
                                          <img
                                            src={
                                              img.preview
                                            }
                                            alt="Variant"
                                            className="h-full w-full object-cover"
                                          />

                                          <button
                                            type="button"
                                            onClick={() =>
                                              setPrimaryVariantImage(
                                                variant.id,
                                                img.id
                                              )
                                            }
                                            className={`absolute left-1 top-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold transition-colors ${
                                              img.is_primary
                                                ? "bg-black text-white"
                                                : "bg-white/90 text-gray-600 hover:bg-white"
                                            }`}
                                          >
                                            {img.is_primary
                                              ? "P"
                                              : "Set"}
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              removeVariantImage(
                                                variant.id,
                                                img.id
                                              )
                                            }
                                            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-red-500 transition-colors hover:bg-red-500 hover:text-white"
                                          >
                                            <FiX size={10} />
                                          </button>

                                          {img.is_existing && (
                                            <span className="absolute bottom-0 left-0 right-0 bg-blue-500 text-center text-[6px] text-white">
                                              Existing
                                            </span>
                                          )}
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* =================================================
                    RIGHT
                ================================================= */}

                <div className="space-y-6">

                  {/* PRICING */}

                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <FaRupeeSign
                        className="text-yellow-500"
                        size={20}
                      />

                      <h3 className="text-lg font-bold text-gray-900">
                        Pricing
                      </h3>
                    </div>

                    <div className="space-y-4">

                      {/* RETAIL MRP */}

                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                          Retail MRP{" "}
                          <span className="text-red-500">
                            *
                          </span>
                        </label>

                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-500">
                            ₹
                          </span>

                          <input
                            type="text"
                            inputMode="decimal"
                            value={
                              retailMrp
                            }
                            onChange={(
                              e
                            ) => {
                              const val =
                                e.target
                                  .value;

                              if (
                                isValidDecimalInput(
                                  val
                                )
                              ) {
                                setRetailMrp(
                                  val
                                );

                                setErrors(
                                  (
                                    prev
                                  ) => ({
                                    ...prev,
                                    retail_mrp:
                                      undefined,
                                  })
                                );
                              }
                            }}
                            placeholder="100000"
                            className={`h-12 w-full rounded-lg border ${
                              errors.retail_mrp
                                ? "border-red-500"
                                : "border-gray-300"
                            } pl-8 pr-4 text-sm outline-none transition-all focus:border-black focus:ring-2 focus:ring-black/10`}
                          />
                        </div>

                        {errors.retail_mrp && (
                          <p className="error-message mt-1 flex items-center gap-1 text-sm text-red-500">
                            <FiInfo size={14} />
                            {
                              errors.retail_mrp
                            }
                          </p>
                        )}
                      </div>

                      {/* RETAIL DISCOUNT */}

                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                          Discount (%)
                        </label>

                        <div className="relative">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={
                              retailDiscountValue
                            }
                            onChange={(
                              e
                            ) => {
                              const val =
                                e.target
                                  .value;

                              if (
                                isValidDecimalInput(
                                  val
                                )
                              ) {
                                setRetailDiscountValue(
                                  val
                                );
                              }
                            }}
                            placeholder="40"
                            className="h-12 w-full rounded-lg border border-gray-300 px-4 pr-12 text-sm outline-none transition-all focus:border-black focus:ring-2 focus:ring-black/10"
                          />

                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                            %
                          </span>
                        </div>
                      </div>

                      {/* DISTRIBUTOR MRP */}

                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                          Distributor MRP
                        </label>

                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-500">
                            ₹
                          </span>

                          <input
                            type="text"
                            inputMode="decimal"
                            value={
                              distributorMrp
                            }
                            onChange={(
                              e
                            ) => {
                              const val =
                                e.target
                                  .value;

                              if (
                                isValidDecimalInput(
                                  val
                                )
                              ) {
                                setDistributorMrp(
                                  val
                                );
                              }
                            }}
                            placeholder="90000"
                            className="h-12 w-full rounded-lg border border-gray-300 pl-8 pr-4 text-sm outline-none transition-all focus:border-black focus:ring-2 focus:ring-black/10"
                          />
                        </div>
                      </div>

                      {/* DISTRIBUTOR DISCOUNT */}

                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                          Distributor Discount (%)
                        </label>

                        <div className="relative">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={
                              distributorDiscountValue
                            }
                            onChange={(
                              e
                            ) => {
                              const val =
                                e.target
                                  .value;

                              if (
                                isValidDecimalInput(
                                  val
                                )
                              ) {
                                setDistributorDiscountValue(
                                  val
                                );
                              }
                            }}
                            placeholder="35"
                            className="h-12 w-full rounded-lg border border-gray-300 px-4 pr-12 text-sm outline-none transition-all focus:border-black focus:ring-2 focus:ring-black/10"
                          />

                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* INVENTORY */}

                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <FiPackage
                        className="text-yellow-500"
                        size={20}
                      />

                      <h3 className="text-lg font-bold text-gray-900">
                        Inventory
                      </h3>
                    </div>

                    <div className="space-y-4">

                      {/* STOCK */}

                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                          Stock Quantity{" "}
                          <span className="text-red-500">
                            *
                          </span>
                        </label>

                        <input
                          type="text"
                          inputMode="numeric"
                          value={
                            stockQuantity
                          }
                          onChange={(
                            e
                          ) => {
                            const val =
                              e.target
                                .value;

                            if (
                              isValidIntegerInput(
                                val
                              )
                            ) {
                              setStockQuantity(
                                val
                              );

                              setErrors(
                                (
                                  prev
                                ) => ({
                                  ...prev,
                                  stock_quantity:
                                    undefined,
                                })
                              );
                            }
                          }}
                          placeholder="100"
                          className={`h-12 w-full rounded-lg border ${
                            errors.stock_quantity
                              ? "border-red-500"
                              : "border-gray-300"
                          } px-4 text-sm outline-none transition-all focus:border-black focus:ring-2 focus:ring-black/10`}
                        />

                        {errors.stock_quantity && (
                          <p className="error-message mt-1 flex items-center gap-1 text-sm text-red-500">
                            <FiInfo size={14} />
                            {
                              errors.stock_quantity
                            }
                          </p>
                        )}
                      </div>

                      {/* LOW STOCK */}

                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                          Low Stock Threshold
                        </label>

                        <input
                          type="text"
                          inputMode="numeric"
                          value={
                            lowStockThreshold
                          }
                          onChange={(
                            e
                          ) => {
                            const val =
                              e.target
                                .value;

                            if (
                              isValidIntegerInput(
                                val
                              )
                            ) {
                              setLowStockThreshold(
                                val
                              );
                            }
                          }}
                          placeholder="10"
                          className="h-12 w-full rounded-lg border border-gray-300 px-4 text-sm outline-none transition-all focus:border-black focus:ring-2 focus:ring-black/10"
                        />

                        <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                          <FiInfo size={12} />
                          You'll be notified when stock falls below this number
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* PUBLISHING */}

                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <FiTag
                        className="text-yellow-500"
                        size={20}
                      />

                      <h3 className="text-lg font-bold text-gray-900">
                        Publishing
                      </h3>
                    </div>

                    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50">
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
                        checked={
                          isPublished
                        }
                        onChange={(
                          e
                        ) =>
                          setIsPublished(
                            e.target
                              .checked
                          )
                        }
                        className="h-5 w-5 cursor-pointer rounded border-gray-300 accent-black"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* FOOTER */}

          <div className="flex flex-shrink-0 justify-end gap-3 rounded-b-2xl border-t border-gray-200 bg-white px-6 py-4">
            <button
              type="button"
              onClick={
                onClose
              }
              className="h-11 rounded-lg border border-gray-300 px-7 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                fetchingOptions
              }
              onClick={
                handleSubmit
              }
              className="flex h-11 items-center gap-2 rounded-lg bg-black px-8 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800 disabled:opacity-50"
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

                  {isEdit
                    ? "Updating..."
                    : "Adding..."}
                </>
              ) : fetchingOptions ? (
                "Loading..."
              ) : isEdit ? (
                "Update Product"
              ) : (
                "Add Product"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddProductModal;