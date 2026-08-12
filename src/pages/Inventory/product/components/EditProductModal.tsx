import React, {
    useEffect,
    useState,
  } from "react";
  
  import {
    FiPlus,
    FiUploadCloud,
    FiX,
  } from "react-icons/fi";
  
  import {
    ProductImagePayload,
    ProductPayload,
    SelectOption,
  } from "@/types/product";
  
  interface EditProductModalProps {
    open: boolean;
    loading: boolean;
    product: any; // Replace with your Product type
    categories: SelectOption[];
    taxCategories: SelectOption[];
    onClose: () => void;
    onSubmit: (payload: ProductPayload) => void;
  }
  
  interface ImageItem {
    id: number;
    file?: File;
    preview: string;
    sort_order: number;
    is_primary: number;
    isNew?: boolean;
  }
  
  const EditProductModal: React.FC<
    EditProductModalProps
  > = ({
    open,
    loading,
    product,
    categories,
    taxCategories,
    onClose,
    onSubmit,
  }) => {
    const [productCode, setProductCode] =
      useState("");
  
    const [name, setName] =
      useState("");
  
    const [slug, setSlug] =
      useState("");
  
    const [description, setDescription] =
      useState("");
  
    const [specification, setSpecification] =
      useState("");
  
    const [categoryId, setCategoryId] =
      useState("");
  
    const [taxCategoryId, setTaxCategoryId] =
      useState("");
  
    const [retailPrice, setRetailPrice] =
      useState("");
  
    const [distributorPrice, setDistributorPrice] =
      useState("");
  
    const [stockQuantity, setStockQuantity] =
      useState("");
  
    const [lowStockThreshold, setLowStockThreshold] =
      useState("10");
  
    const [isPublished, setIsPublished] =
      useState(true);
  
    const [images, setImages] = useState<
      ImageItem[]
    >([]);
  
    const [existingImages, setExistingImages] = useState<
      { id: number; image_url: string; sort_order: number; is_primary: number }[]
    >([]);
  
    useEffect(() => {
      if (product && open) {
        // Populate form with product data
        setProductCode(product.product_code || "");
        setName(product.name || "");
        setSlug(product.slug || "");
        setDescription(product.description || "");
        setSpecification(product.specification || "");
        setCategoryId(product.category_id?.toString() || "");
        setTaxCategoryId(product.tax_category_id?.toString() || "");
        setRetailPrice(product.retail_price?.toString() || "");
        setDistributorPrice(product.distributor_price?.toString() || "");
        setStockQuantity(product.stock_quantity?.toString() || "");
        setLowStockThreshold(product.low_stock_threshold?.toString() || "10");
        setIsPublished(product.is_published === 1);
  
        // Set existing images - check both possible field names
        const productImages = product.product_images || product.images || [];
        if (productImages && productImages.length > 0) {
          const formattedImages = productImages.map((img: any, index: number) => ({
            id: img.id || index,
            image_url: img.image_url || img.url || img.path || '',
            sort_order: img.sort_order || index + 1,
            is_primary: img.is_primary || (index === 0 ? 1 : 0),
          }));
          setExistingImages(formattedImages);
        } else {
          setExistingImages([]);
        }
      }
  
      if (!open) {
        setProductCode("");
        setName("");
        setSlug("");
        setDescription("");
        setSpecification("");
        setCategoryId("");
        setTaxCategoryId("");
        setRetailPrice("");
        setDistributorPrice("");
        setStockQuantity("");
        setLowStockThreshold("10");
        setIsPublished(true);
        setImages([]);
        setExistingImages([]);
      }
    }, [open, product]);
  
    if (!open) return null;
  
    /* =========================================================
       NAME → SLUG
    ========================================================= */
  
    const handleNameChange = (
      value: string
    ) => {
      setName(value);
  
      setSlug(
        value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    };
  
    /* =========================================================
       IMAGE UPLOAD
    ========================================================= */
  
    const handleImages = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const files = e.target.files;
  
      if (!files) return;
  
      const newImages: ImageItem[] =
        Array.from(files).map(
          (file, index) => ({
            id:
              Date.now() +
              index,
  
            file,
  
            preview:
              URL.createObjectURL(
                file
              ),
  
            sort_order:
              existingImages.length +
              images.length +
              index +
              1,
  
            is_primary:
              existingImages.length === 0 &&
              images.length === 0 &&
              index === 0
                ? 1
                : 0,
  
            isNew: true,
          })
        );
  
      setImages((prev) => [
        ...prev,
        ...newImages,
      ]);
  
      e.target.value = "";
    };
  
    /* =========================================================
       REMOVE IMAGE
    ========================================================= */
  
    const removeImage = (
      id: number,
      isNew?: boolean
    ) => {
      if (isNew) {
        // Remove from new images
        setImages((prev) => {
          const filtered =
            prev.filter(
              (item) =>
                item.id !== id
            );
  
          if (
            filtered.length > 0 &&
            !filtered.some(
              (item) =>
                item.is_primary === 1
            )
          ) {
            filtered[0].is_primary = 1;
          }
  
          return filtered.map(
            (item, index) => ({
              ...item,
              sort_order:
                index + 1,
            })
          );
        });
      } else {
        // Remove from existing images
        setExistingImages((prev) => {
          const filtered =
            prev.filter(
              (item) =>
                item.id !== id
            );
  
          if (
            filtered.length > 0 &&
            !filtered.some(
              (item) =>
                item.is_primary === 1
            )
          ) {
            filtered[0].is_primary = 1;
          }
  
          return filtered.map(
            (item, index) => ({
              ...item,
              sort_order:
                index + 1,
            })
          );
        });
      }
    };
  
    /* =========================================================
       PRIMARY IMAGE
    ========================================================= */
  
    const setPrimaryImage = (
      id: number,
      isNew?: boolean
    ) => {
      if (isNew) {
        setImages((prev) =>
          prev.map((item) => ({
            ...item,
            is_primary:
              item.id === id
                ? 1
                : 0,
          }))
        );
      } else {
        setExistingImages((prev) =>
          prev.map((item) => ({
            ...item,
            is_primary:
              item.id === id
                ? 1
                : 0,
          }))
        );
      }
    };
  
    /* =========================================================
       SUBMIT
    ========================================================= */
  
    const handleSubmit = (
      e: React.FormEvent
    ) => {
      e.preventDefault();
  
      if (!productCode.trim()) {
        alert(
          "Please enter product code."
        );
        return;
      }
  
      if (!name.trim()) {
        alert(
          "Please enter product name."
        );
        return;
      }
  
      if (!categoryId) {
        alert(
          "Please select category."
        );
        return;
      }
  
      if (!taxCategoryId) {
        alert(
          "Please select tax category."
        );
        return;
      }
  
      // Prepare images for submission
      const existingImagePayload = existingImages.map((item) => ({
        id: item.id,
        sort_order: item.sort_order,
        is_primary: item.is_primary,
      }));
  
      const newImagePayload: ProductImagePayload[] =
        images.map((item) => ({
          file: item.file!,
          sort_order:
            item.sort_order,
          is_primary:
            item.is_primary,
        }));
  
      const payload: ProductPayload =
        {
          product_code:
            productCode,
  
          name,
  
          slug,
  
          description,
  
          specification,
  
          category_id:
            Number(categoryId),
  
          tax_category_id:
            Number(taxCategoryId),

          brand_id:
            product?.brand_id || 1,
  
          retail_price:
            Number(retailPrice) || 0,
  
          distributor_price:
            Number(distributorPrice) || 0,
  
          stock_quantity:
            Number(stockQuantity) || 0,
  
          low_stock_threshold:
            Number(
              lowStockThreshold
            ) || 0,
  
          is_published:
            isPublished ? 1 : 0,
  
          product_images:
            newImagePayload,
  
          existing_images:
            existingImagePayload,
        };
  
      onSubmit(payload);
    };
  
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal Container */}
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="relative w-full max-w-[1100px] max-h-[90vh] bg-[#F7F9FC] rounded-2xl shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
  
            {/* =================================================
                HEADER - Fixed
            ================================================= */}
  
            <div className="flex-shrink-0 flex items-center justify-between rounded-t-2xl border-b border-[#DDE3EC] bg-white px-6 py-5">
  
              <div>
                <h2 className="font-lato text-2xl font-bold text-[#071A33]">
                  Edit Product
                </h2>
  
                <p className="font-arimo mt-1 text-sm text-gray-500">
                  Update product details,
                  pricing and images.
                </p>
              </div>
  
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100"
              >
                <FiX size={21} />
              </button>
            </div>
  
            {/* =================================================
                SCROLLABLE CONTENT
            ================================================= */}
  
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit}>
  
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_390px]">
  
                  {/* =================================================
                      LEFT
                  ================================================= */}
  
                  <div className="space-y-5">
  
                    {/* Basic Information */}
  
                    <section className="rounded-xl border border-[#DDE3EC] bg-white p-6">
  
                      <div className="mb-5 border-b border-[#DDE3EC] pb-4">
                        <h3 className="font-lato text-xl font-bold text-[#071A33]">
                          Basic Information
                        </h3>
                      </div>
  
                      {/* Product Name */}
  
                      <div className="mb-5">
                        <label className="font-arimo mb-2 block text-sm font-semibold text-[#172B4D]">
                          Product Name{" "}
                          <span className="text-red-500">
                            *
                          </span>
                        </label>
  
                        <input
                          type="text"
                          value={name}
                          onChange={(e) =>
                            handleNameChange(
                              e.target.value
                            )
                          }
                          placeholder="e.g. Premium Organic Cotton T-Shirt"
                          className="font-arimo h-[52px] w-full rounded-md border border-[#C8CDD5] bg-white px-4 text-[15px] outline-none placeholder:text-[#718096] focus:border-black"
                        />
                      </div>
  
                      {/* SKU */}
  
                      <div>
                        <label className="font-arimo mb-2 block text-sm font-semibold text-[#172B4D]">
                          SKU / Product Code{" "}
                          <span className="text-red-500">
                            *
                          </span>
                        </label>
  
                        <input
                          type="text"
                          value={productCode}
                          onChange={(e) =>
                            setProductCode(
                              e.target.value
                            )
                          }
                          placeholder="e.g. TS-ORG-001"
                          className="font-arimo h-[52px] w-full rounded-md border border-[#C8CDD5] px-4 text-[15px] outline-none focus:border-black"
                        />
                      </div>
  
                      {/* Category */}
  
                      <div className="mt-5">
                        <label className="font-arimo mb-2 block text-sm font-semibold text-[#172B4D]">
                          Category{" "}
                          <span className="text-red-500">
                            *
                          </span>
                        </label>
  
                        <select
                          value={categoryId}
                          onChange={(e) =>
                            setCategoryId(
                              e.target.value
                            )
                          }
                          className="font-arimo h-[52px] w-full rounded-md border border-[#C8CDD5] bg-white px-4 text-[15px] outline-none focus:border-black"
                        >
                          <option value="">
                            Select category...
                          </option>
  
                          {categories.map(
                            (category) => (
                              <option
                                key={
                                  category.id
                                }
                                value={
                                  category.id
                                }
                              >
                                {category.name}
                              </option>
                            )
                          )}
                        </select>
                      </div>
  
                      {/* Tax Category */}
  
                      <div className="mt-5">
                        <label className="font-arimo mb-2 block text-sm font-semibold text-[#172B4D]">
                          Tax Category{" "}
                          <span className="text-red-500">
                            *
                          </span>
                        </label>
  
                        <select
                          value={
                            taxCategoryId
                          }
                          onChange={(e) =>
                            setTaxCategoryId(
                              e.target.value
                            )
                          }
                          className="font-arimo h-[52px] w-full rounded-md border border-[#C8CDD5] bg-white px-4 text-[15px] outline-none focus:border-black"
                        >
                          <option value="">
                            Select tax category...
                          </option>
  
                          {taxCategories.map(
                            (tax) => (
                              <option
                                key={tax.id}
                                value={
                                  tax.id
                                }
                              >
                                {tax.name}
                              </option>
                            )
                          )}
                        </select>
                      </div>
  
                    </section>
  
                    {/* Description */}
  
                    <section className="rounded-xl border border-[#DDE3EC] bg-white p-6">
  
                      <div className="mb-5 border-b border-[#DDE3EC] pb-4">
                        <h3 className="font-lato text-xl font-bold text-[#071A33]">
                          Description
                        </h3>
                      </div>
  
                      <textarea
                        rows={5}
                        value={description}
                        onChange={(e) =>
                          setDescription(
                            e.target.value
                          )
                        }
                        placeholder="Enter product description..."
                        className="font-arimo w-full resize-none rounded-md border border-[#C8CDD5] px-4 py-3 text-[15px] outline-none placeholder:text-[#718096] focus:border-black"
                      />
  
                    </section>
  
                    {/* Specification */}
  
                    <section className="rounded-xl border border-[#DDE3EC] bg-white p-6">
  
                      <div className="mb-5 border-b border-[#DDE3EC] pb-4">
                        <h3 className="font-lato text-xl font-bold text-[#071A33]">
                          Specification
                        </h3>
                      </div>
  
                      <textarea
                        rows={5}
                        value={specification}
                        onChange={(e) =>
                          setSpecification(
                            e.target.value
                          )
                        }
                        placeholder="e.g. Analog, Stainless Steel, Water Resistant..."
                        className="font-arimo w-full resize-none rounded-md border border-[#C8CDD5] px-4 py-3 text-[15px] outline-none placeholder:text-[#718096] focus:border-black"
                      />
  
                    </section>
  
                    {/* Product Images */}
  
                    <section className="rounded-xl border border-[#DDE3EC] bg-white p-6">
  
                      <div className="mb-5 flex items-center justify-between border-b border-[#DDE3EC] pb-4">
  
                        <h3 className="font-lato text-xl font-bold text-[#071A33]">
                          Product Images
                        </h3>
  
                        <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md bg-black px-4 text-sm font-semibold text-white">
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
  
                      {/* Show existing images */}
                      {existingImages.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-gray-500 mb-2">
                            Existing Images
                          </p>
                          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                            {existingImages.map(
                              (item) => (
                                <div
                                  key={item.id}
                                  className="group relative overflow-hidden rounded-lg border border-[#DDE3EC] bg-white"
                                >
                                  {item.image_url ? (
                                    <img
                                      src={item.image_url}
                                      alt="Product"
                                      className="h-[150px] w-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150x150?text=No+Image';
                                      }}
                                    />
                                  ) : (
                                    <div className="h-[150px] w-full flex items-center justify-center bg-gray-100">
                                      <span className="text-gray-400 text-sm">No Image</span>
                                    </div>
                                  )}
  
                                  {/* Primary Button */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPrimaryImage(
                                        item.id,
                                        false
                                      )
                                    }
                                    className={`absolute left-2 top-2 rounded-full px-2 py-1 text-[10px] font-bold ${
                                      item.is_primary
                                        ? "bg-black text-white"
                                        : "bg-white text-gray-600"
                                    }`}
                                  >
                                    {item.is_primary
                                      ? "Primary"
                                      : "Set Primary"}
                                  </button>
  
                                  {/* Delete Button */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeImage(
                                        item.id,
                                        false
                                      )
                                    }
                                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-red-500 shadow hover:bg-red-500 hover:text-white transition-colors"
                                  >
                                    <FiX size={16} />
                                  </button>
  
                                  {/* Sort Order */}
                                  <div className="font-arimo flex items-center justify-between px-3 py-2 text-xs">
                                    <span>
                                      Image{" "}
                                      {
                                        item.sort_order
                                      }
                                    </span>
                                    <span>
                                      {item.is_primary
                                        ? "Primary"
                                        : ""}
                                    </span>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
  
                      {/* Show new images */}
                      {images.length > 0 && (
                        <div>
                          {existingImages.length > 0 && (
                            <p className="text-xs font-semibold text-green-500 mb-2">
                              New Images
                            </p>
                          )}
                          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                            {images.map(
                              (item) => (
                                <div
                                  key={item.id}
                                  className="group relative overflow-hidden rounded-lg border border-[#DDE3EC] bg-white"
                                >
                                  <img
                                    src={item.preview}
                                    alt="Product"
                                    className="h-[150px] w-full object-cover"
                                  />
  
                                  {/* Primary Button */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPrimaryImage(
                                        item.id,
                                        true
                                      )
                                    }
                                    className={`absolute left-2 top-2 rounded-full px-2 py-1 text-[10px] font-bold ${
                                      item.is_primary
                                        ? "bg-black text-white"
                                        : "bg-white text-gray-600"
                                    }`}
                                  >
                                    {item.is_primary
                                      ? "Primary"
                                      : "Set Primary"}
                                  </button>
  
                                  {/* Delete Button */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeImage(
                                        item.id,
                                        true
                                      )
                                    }
                                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-red-500 shadow hover:bg-red-500 hover:text-white transition-colors"
                                  >
                                    <FiX size={16} />
                                  </button>
  
                                  {/* Sort Order */}
                                  <div className="font-arimo flex items-center justify-between px-3 py-2 text-xs">
                                    <span>
                                      Image{" "}
                                      {
                                        item.sort_order
                                      }
                                    </span>
                                    <span>
                                      {item.is_primary
                                        ? "Primary"
                                        : ""}
                                    </span>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
  
                      {/* Empty state */}
                      {existingImages.length === 0 && images.length === 0 && (
                        <label className="flex min-h-[170px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#D5DBE5] bg-[#FAFBFC]">
  
                          <FiUploadCloud
                            size={32}
                            className="text-gray-400"
                          />
  
                          <p className="font-arimo mt-3 text-sm font-semibold text-[#172B4D]">
                            Upload Product Images
                          </p>
  
                          <p className="font-arimo mt-1 text-xs text-gray-400">
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
                      )}
  
                    </section>
  
                  </div>
  
                  {/* =================================================
                      RIGHT
                  ================================================= */}
  
                  <div className="space-y-5">
  
                    {/* Pricing */}
  
                    <section className="rounded-xl border border-[#DDE3EC] bg-white p-6">
  
                      <div className="mb-5 flex items-center gap-3 border-b border-[#DDE3EC] pb-4">
  
                        <span className="h-5 w-1 rounded-full bg-[#F7A900]" />
  
                        <h3 className="font-lato text-xl font-bold text-[#071A33]">
                          Pricing
                        </h3>
  
                      </div>
  
                      {/* Retail */}
  
                      <div className="mb-5">
                        <label className="font-arimo mb-2 block text-sm font-semibold text-[#172B4D]">
                          Retail Price (MSRP)
                        </label>
  
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                            ₹
                          </span>
  
                          <input
                            type="number"
                            min="0"
                            value={
                              retailPrice
                            }
                            onChange={(e) =>
                              setRetailPrice(
                                e.target.value
                              )
                            }
                            placeholder="0.00"
                            className="font-arimo h-[52px] w-full rounded-md border border-[#C8CDD5] pl-9 pr-4 text-[15px] outline-none focus:border-black"
                          />
                        </div>
                      </div>
  
                    </section>
  
                    {/* Distributor */}
  
                    <section className="rounded-xl border border-[#DDE3EC] bg-white p-6">
                      <div className="mb-5 flex items-center gap-3 border-b border-[#DDE3EC] pb-4">
  
                        <span className="h-5 w-1 rounded-full bg-[#F7A900]" />
  
                        <h3 className="font-lato text-xl font-bold text-[#071A33]">
                          Distributor Price
                        </h3>
  
                      </div>
  
                      <label className="font-arimo mb-2 block text-sm font-semibold text-[#172B4D]">
                        Distributor Pricing
                      </label>
  
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                          ₹
                        </span>
  
                        <input
                          type="number"
                          min="0"
                          value={
                            distributorPrice
                          }
                          onChange={(e) =>
                            setDistributorPrice(
                              e.target.value
                            )
                          }
                          placeholder="0.00"
                          className="font-arimo h-[52px] w-full rounded-md border border-[#C8CDD5] pl-9 pr-4 text-[15px] outline-none focus:border-black"
                        />
                      </div>
  
                    </section>
  
                    {/* Inventory */}
  
                    <section className="rounded-xl border border-[#DDE3EC] bg-white p-6">
  
                      <div className="mb-5 flex items-center gap-3 border-b border-[#DDE3EC] pb-4">
  
                        <span className="h-5 w-1 rounded-full bg-[#F7A900]" />
  
                        <h3 className="font-lato text-xl font-bold text-[#071A33]">
                          Inventory
                        </h3>
  
                      </div>
  
                      <div className="mb-5">
  
                        <label className="font-arimo mb-2 block text-sm font-semibold text-[#172B4D]">
                          Stock Quantity
                        </label>
  
                        <input
                          type="number"
                          min="0"
                          value={
                            stockQuantity
                          }
                          onChange={(e) =>
                            setStockQuantity(
                              e.target.value
                            )
                          }
                          placeholder="100"
                          className="font-arimo h-[52px] w-full rounded-md border border-[#C8CDD5] px-4 text-[15px] outline-none focus:border-black"
                        />
  
                      </div>
  
                      <div>
  
                        <label className="font-arimo mb-2 block text-sm font-semibold text-[#172B4D]">
                          Low Stock Threshold
                        </label>
  
                        <input
                          type="number"
                          min="0"
                          value={
                            lowStockThreshold
                          }
                          onChange={(e) =>
                            setLowStockThreshold(
                              e.target.value
                            )
                          }
                          placeholder="10"
                          className="font-arimo h-[52px] w-full rounded-md border border-[#C8CDD5] px-4 text-[15px] outline-none focus:border-black"
                        />
  
                      </div>
  
                    </section>
  
                    {/* Publishing */}
  
                    <section className="rounded-xl border border-[#DDE3EC] bg-white p-6">
  
                      <div className="mb-5 flex items-center gap-3 border-b border-[#DDE3EC] pb-4">
  
                        <span className="h-5 w-1 rounded-full bg-[#F7A900]" />
  
                        <h3 className="font-lato text-xl font-bold text-[#071A33]">
                          Publishing
                        </h3>
  
                      </div>
  
                      <label className="flex cursor-pointer items-center justify-between rounded-lg border border-[#DDE3EC] p-4">
  
                        <div>
                          <p className="font-lato text-sm font-bold text-[#172B4D]">
                            Publish Product
                          </p>
  
                          <p className="font-arimo mt-1 text-xs text-gray-500">
                            Product will be visible to customers.
                          </p>
                        </div>
  
                        <input
                          type="checkbox"
                          checked={
                            isPublished
                          }
                          onChange={(e) =>
                            setIsPublished(
                              e.target.checked
                            )
                          }
                          className="h-5 w-5 accent-black"
                        />
  
                      </label>
  
                    </section>
  
                  </div>
                </div>
              </form>
            </div>
  
            {/* =================================================
                FOOTER - Fixed at Bottom
            ================================================= */}
  
            <div className="flex-shrink-0 flex justify-end gap-3 rounded-b-2xl border-t border-[#DDE3EC] bg-white px-6 py-4">
  
              <button
                type="button"
                onClick={onClose}
                className="font-arimo h-11 rounded-lg border border-gray-300 px-7 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
  
              <button
                type="submit"
                disabled={loading}
                onClick={handleSubmit}
                className="font-arimo h-11 rounded-lg bg-black px-8 text-sm font-semibold text-white disabled:opacity-50 hover:bg-[#181818] transition-colors"
              >
                {loading
                  ? "Updating..."
                  : "Update Product"}
              </button>
  
            </div>
  
          </div>
        </div>
      </>
    );
  };
  
  export default EditProductModal;
