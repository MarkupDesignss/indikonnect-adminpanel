import React, { useEffect, useMemo, useState } from "react";
import { FiPlus, FiSearch } from "react-icons/fi";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { useLocation } from "react-router-dom";

import GlobalModal from "@/components/common/GlobalModal";
import ProductTable from "./components/ProductTable";
import AddProductModal from "./components/AddProductModal";
import ViewProductModal from "./components/ViewProductModal";

import { productApi } from "../../../api/endpoints/product";
import trendingProductsApi from "../../../api/endpoints/today";

import {
  Product,
  SelectOption,
} from "@/types/product";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: {
    y: 18,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 14,
    },
  },
};

const Products: React.FC = () => {
  const location = useLocation();

  // ===================================================
  // STATE
  // ===================================================

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [taxCategories, setTaxCategories] = useState<SelectOption[]>([]);
  const [brands, setBrands] = useState<SelectOption[]>([]);

  const [loading, setLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(false);

  const [trendingLoadingId, setTrendingLoadingId] = useState<number | null>(
    null
  );

  const [publishLoadingId, setPublishLoadingId] = useState<number | null>(
    null
  );

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [highlightedProductId, setHighlightedProductId] = useState<
    number | null
  >(null);

  const ITEMS_PER_PAGE = 10;

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    null
  );

  // ===================================================
  // GET PRODUCT FROM HEADER NAVIGATION STATE
  // ===================================================

  const productFromHeader = location.state?.product as Product | undefined;

  // ===================================================
  // FETCH PRODUCTS
  // IMPORTANT:
  // ADMIN MUST SHOW BOTH:
  // is_published = true
  // is_published = false
  // ===================================================

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const response = await productApi.getProducts();

      const productData = response.data?.data ?? [];

      /*
       * IMPORTANT:
       * Do NOT filter by is_published here.
       *
       * Admin needs both published and unpublished products
       * so that unpublished products can be published again.
       */

      setProducts(productData);
    } catch (error: any) {
      console.error("Fetch products error:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to fetch products."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // FETCH PRODUCT DETAILS
  // ===================================================

  const fetchProductDetails = async (productId: number) => {
    try {
      setFetchingProduct(true);

      const response = await productApi.getProductById(productId);

      return response.data?.data;
    } catch (error: any) {
      console.error("Fetch product details error:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to fetch product details."
      );

      return null;
    } finally {
      setFetchingProduct(false);
    }
  };

  // ===================================================
  // FETCH CATEGORIES
  // ===================================================

  const fetchCategories = async () => {
    try {
      const response = await productApi.getCategories();

      const data = response.data?.data || [];

      setCategories(
        data.map((item: any) => ({
          value: item.id,
          label: item.name,
        }))
      );
    } catch (error) {
      console.error("Fetch categories error:", error);
    }
  };

  // ===================================================
  // FETCH TAX CATEGORIES
  // ===================================================

  const fetchTaxCategories = async () => {
    try {
      const response = await productApi.getTaxCategories();

      const data = response.data?.data || [];

      setTaxCategories(
        data.map((item: any) => ({
          value: item.id,
          label: item.name,
        }))
      );
    } catch (error) {
      console.error("Fetch tax categories error:", error);
    }
  };

  // ===================================================
  // FETCH BRANDS
  // ===================================================

  const fetchBrands = async () => {
    try {
      const response = await productApi.getBrands();

      const data = response.data?.data || [];

      setBrands(
        data.map((item: any) => ({
          value: item.id,
          label: item.name,
        }))
      );
    } catch (error) {
      console.error("Fetch brands error:", error);
    }
  };

  // ===================================================
  // INITIAL FETCH
  // ===================================================

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchTaxCategories();
    fetchBrands();
  }, []);

  // ===================================================
  // HANDLE PRODUCT FROM HEADER
  // ===================================================

  useEffect(() => {
    if (productFromHeader) {
      if (productFromHeader.name) {
        setSearch(productFromHeader.name);
      } else if (productFromHeader.id) {
        setSearch(String(productFromHeader.id));
      }

      setHighlightedProductId(productFromHeader.id);

      window.history.replaceState({}, document.title);
    }
  }, [productFromHeader]);

  // ===================================================
  // SEARCH
  // IMPORTANT:
  // BOTH PUBLISHED + UNPUBLISHED PRODUCTS ARE INCLUDED
  // ===================================================

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    /*
     * No search => return ALL admin products.
     * Published and unpublished both remain visible.
     */
    if (!query) {
      return products;
    }

    return products.filter((product: any) => {
      // Product ID
      if (
        !isNaN(Number(query)) &&
        product.id === Number(query)
      ) {
        return true;
      }

      // Name
      if (product.name?.toLowerCase().includes(query)) {
        return true;
      }

      // Product Code
      if (
        product.product_code
          ?.toLowerCase()
          .includes(query)
      ) {
        return true;
      }

      // Slug
      if (
        product.slug
          ?.toLowerCase()
          .includes(query)
      ) {
        return true;
      }

      // Description
      if (
        product.description
          ?.toLowerCase()
          .includes(query)
      ) {
        return true;
      }

      // SKU
      if (
        product.sku
          ?.toLowerCase()
          .includes(query)
      ) {
        return true;
      }

      // Category
      if (
        product.category?.name
          ?.toLowerCase()
          .includes(query)
      ) {
        return true;
      }

      // Brand
      if (
        product.brand?.name
          ?.toLowerCase()
          .includes(query)
      ) {
        return true;
      }

      // Price
      if (
        product.price
          ?.toString()
          .includes(query)
      ) {
        return true;
      }

      // Existing status field
      if (
        product.status
          ?.toLowerCase()
          .includes(query)
      ) {
        return true;
      }

      // ===================================================
      // PUBLISHED STATUS SEARCH
      // true  => published
      // false => unpublished
      // ===================================================

      const isPublished =
        product.is_published === true ||
        product.is_published === 1 ||
        product.is_published === "1" ||
        product.is_published === "true";

      if (
        query === "published" &&
        isPublished
      ) {
        return true;
      }

      if (
        query === "unpublished" &&
        !isPublished
      ) {
        return true;
      }

      if (
        query === "active" &&
        isPublished
      ) {
        return true;
      }

      if (
        query === "inactive" &&
        !isPublished
      ) {
        return true;
      }

      // Search by raw is_published value
      if (
        String(product.is_published)
          .toLowerCase()
          .includes(query)
      ) {
        return true;
      }

      return false;
    });
  }, [products, search]);

  // ===================================================
  // PUBLISHED / UNPUBLISHED COUNTS
  // ===================================================

  const publishedCount = useMemo(() => {
    return products.filter((product: any) => {
      return (
        product.is_published === true ||
        product.is_published === 1 ||
        product.is_published === "1" ||
        product.is_published === "true"
      );
    }).length;
  }, [products]);

  const unpublishedCount = useMemo(() => {
    return products.length - publishedCount;
  }, [products, publishedCount]);

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.ceil(
    filteredProducts.length / ITEMS_PER_PAGE
  );

  const startIndex =
    (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedProducts =
    filteredProducts.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );

  const startEntry =
    filteredProducts.length === 0
      ? 0
      : startIndex + 1;

  const endEntry = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredProducts.length
  );

  // ===================================================
  // ADD PRODUCT
  // ===================================================

  const handleAddProduct = async (
    formData: FormData
  ) => {
    try {
      setAddLoading(true);

      const response =
        await productApi.createProduct(formData);

      await fetchProducts();

      setAddModalOpen(false);
      setCurrentPage(1);

      toast.success(
        response.data?.message ||
          "Product added successfully."
      );
    } catch (error: any) {
      console.error("Add product error:", error);

      if (error?.response?.data?.errors) {
        const errors =
          error.response.data.errors;

        const errorMessages = Object.values(errors)
          .flat()
          .join(", ");

        toast.error(errorMessages);
      } else {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to add product."
        );
      }
    } finally {
      setAddLoading(false);
    }
  };

  // ===================================================
  // EDIT PRODUCT
  // ===================================================

  const handleEditProduct = async (
    formData: FormData
  ) => {
    if (!selectedProduct) {
      return;
    }

    try {
      setEditLoading(true);

      const response =
        await productApi.updateProduct(
          selectedProduct.id,
          formData
        );

      await fetchProducts();

      setEditModalOpen(false);
      setSelectedProduct(null);

      toast.success(
        response.data?.message ||
          "Product updated successfully."
      );
    } catch (error: any) {
      console.error(
        "Update product error:",
        error
      );

      if (error?.response?.data?.errors) {
        const errors =
          error.response.data.errors;

        const errorMessages = Object.values(errors)
          .flat()
          .join(", ");

        toast.error(errorMessages);
      } else {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to update product."
        );
      }
    } finally {
      setEditLoading(false);
    }
  };

  // ===================================================
  // TRENDING TOGGLE
  // ===================================================

  const handleTrendingToggle = async (
    product: Product,
    checked: boolean
  ) => {
    try {
      setTrendingLoadingId(product.id);

      const response =
        await trendingProductsApi.updateTrendingStatus(
          product.id,
          {
            is_trending: checked ? 1 : 0,
          }
        );

      await fetchProducts();

      toast.success(
        response.data?.message ||
          (checked
            ? "Product added to trending."
            : "Product removed from trending.")
      );
    } catch (error: any) {
      console.error(
        "Trending status update error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to update trending status."
      );
    } finally {
      setTrendingLoadingId(null);
    }
  };

  // ===================================================
  // PUBLISH / UNPUBLISH TOGGLE
  // ===================================================

  const handlePublishToggle = async (
    product: Product,
    isPublished: boolean
  ) => {
    try {
      setPublishLoadingId(product.id);

      const response =
        await productApi.publishProduct(
          product.id,
          {
            is_published: isPublished ? 1 : 0,
          }
        );

      await fetchProducts();

      toast.success(
        response.data?.message ||
          (isPublished
            ? "Product published successfully."
            : "Product unpublished successfully.")
      );
    } catch (error: any) {
      console.error(
        "Publish status update error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to update product publish status."
      );
    } finally {
      setPublishLoadingId(null);
    }
  };

  // ===================================================
  // HANDLE EDIT
  // ===================================================

  const handleEdit = async (
    product: Product
  ) => {
    try {
      const fullProduct =
        await fetchProductDetails(product.id);

      if (fullProduct) {
        setSelectedProduct(fullProduct);
        setEditModalOpen(true);
      } else {
        setSelectedProduct(product);
        setEditModalOpen(true);
      }
    } catch (error) {
      console.error(
        "Error fetching product details:",
        error
      );

      setSelectedProduct(product);
      setEditModalOpen(true);
    }
  };

  // ===================================================
  // HANDLE VIEW
  // ===================================================

  const handleView = (
    product: Product
  ) => {
    setSelectedProduct(product);
    setViewModalOpen(true);
  };

  // ===================================================
  // HANDLE PAGE CHANGE
  // ===================================================

  const handlePageChange = (
    page: number
  ) => {
    if (
      page < 1 ||
      page > totalPages
    ) {
      return;
    }

    setCurrentPage(page);
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <motion.div
      className="min-h-screen bg-[#faf8f3] p-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* HEADER */}
      <motion.div
        variants={itemVariants}
        className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center"
      >
        <div>
          <div className="mb-1 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#b8902e]" />

            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b8902e]">
              Catalog Management
            </span>
          </div>

          <h1 className="font-serif text-[28px] font-bold tracking-tight text-[#2a2620] sm:text-[30px]">
            Products
          </h1>

          <p className="mt-1 text-sm text-[#786f60]">
            Manage your products, pricing,
            inventory, and product information.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* TOTAL */}
          <div className="rounded-xl border border-[#b8902e]/15 bg-white px-4 py-2.5 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#a89a7d]">
              Total Products
            </div>

            <div className="mt-0.5 text-lg font-bold text-[#2a2620]">
              {products.length}
            </div>
          </div>

          {/* PUBLISHED */}
          <div className="rounded-xl border border-emerald-200 bg-white px-4 py-2.5 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
              Published
            </div>

            <div className="mt-0.5 text-lg font-bold text-emerald-700">
              {publishedCount}
            </div>
          </div>

          {/* UNPUBLISHED */}
          <div className="rounded-xl border border-red-200 bg-white px-4 py-2.5 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-red-500">
              Unpublished
            </div>

            <div className="mt-0.5 text-lg font-bold text-red-600">
              {unpublishedCount}
            </div>
          </div>
        </div>
      </motion.div>

      {/* SEARCH */}
      <motion.div
        variants={itemVariants}
        className="relative mb-6 overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white p-4 shadow-sm sm:p-5"
      >
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#d4af52] via-[#c49b3a] to-[#8a6c1f]" />

        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full border border-[#d4af52]/20" />

        <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full border border-[#b8902e]/15" />

        <div className="pointer-events-none absolute right-7 top-7 h-3 w-3 rounded-full bg-[#d4af52]/30" />

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-[560px]">
            <FiSearch
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a8841c]"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
                setHighlightedProductId(null);
              }}
              placeholder="Search by ID, name, code, slug, SKU, price, status..."
              className="h-[48px] w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] pl-11 pr-4 text-sm text-[#2a2620] outline-none transition-all placeholder:text-[#a89a7d] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
            />

            {search && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#a89a7d]">
                {filteredProducts.length} result
                {filteredProducts.length !== 1
                  ? "s"
                  : ""}
              </div>
            )}
          </div>

          <motion.button
            type="button"
            onClick={() =>
              setAddModalOpen(true)
            }
            whileHover={{
              y: -2,
              boxShadow:
                "0 8px 20px rgba(140,105,25,0.20)",
            }}
            whileTap={{
              scale: 0.97,
            }}
            className="flex h-[46px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-5 text-sm font-bold text-white shadow-md shadow-[#b8902e]/20 transition-all hover:from-[#a8841c] hover:to-[#795b14]"
          >
            <FiPlus size={19} />

            <span>Add Product</span>
          </motion.button>
        </div>
      </motion.div>

      {/* TABLE */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-sm"
      >
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

        <div>
          <ProductTable
            /*
             * VERY IMPORTANT:
             * paginatedProducts contains BOTH:
             *
             * is_published = true
             * is_published = false
             *
             * Nothing is removed here.
             */
            products={paginatedProducts}
            loading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            totalEntries={filteredProducts.length}
            startEntry={startEntry}
            endEntry={endEntry}
            onPageChange={handlePageChange}
            onEdit={handleEdit}
            onView={handleView}
            onTrendingToggle={handleTrendingToggle}
            trendingLoadingId={trendingLoadingId}
            highlightedProductId={highlightedProductId}
            onPublishToggle={handlePublishToggle}
            publishLoadingId={publishLoadingId}
          />
        </div>
      </motion.div>

      {/* ADD PRODUCT MODAL */}
      <GlobalModal
        isOpen={addModalOpen}
        onClose={() =>
          setAddModalOpen(false)
        }
        closeOnOverlayClick={true}
      >
        <AddProductModal
          open={addModalOpen}
          loading={addLoading}
          onClose={() =>
            setAddModalOpen(false)
          }
          onSubmit={handleAddProduct}
          isEdit={false}
        />
      </GlobalModal>

      {/* EDIT PRODUCT MODAL */}
      <GlobalModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedProduct(null);
        }}
        closeOnOverlayClick={true}
      >
        <AddProductModal
          open={editModalOpen}
          loading={editLoading}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedProduct(null);
          }}
          onSubmit={handleEditProduct}
          editData={selectedProduct}
          isEdit={true}
        />
      </GlobalModal>

      {/* VIEW PRODUCT MODAL */}
      <GlobalModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedProduct(null);
        }}
        closeOnOverlayClick={true}
      >
        <ViewProductModal
          open={viewModalOpen}
          product={selectedProduct}
          categories={categories}
          taxCategories={taxCategories}
          brands={brands}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedProduct(null);
          }}
        />
      </GlobalModal>
    </motion.div>
  );
};

export default Products;