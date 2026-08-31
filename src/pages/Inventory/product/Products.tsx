import React, { useEffect, useMemo, useState } from "react";
import { FiPlus, FiSearch, FiPackage } from "react-icons/fi";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

import GlobalModal from "@/components/common/GlobalModal";
import ProductTable from "./components/ProductTable";
import AddProductModal from "./components/AddProductModal";
import ViewProductModal from "./components/ViewProductModal";

import { productApi } from "../../../api/endpoints/product";

import {
  Product,
  SelectOption,
} from "@/types/product";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { y: 18, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 110, damping: 14 },
  },
};

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [taxCategories, setTaxCategories] = useState<SelectOption[]>([]);
  const [brands, setBrands] = useState<SelectOption[]>([]);

  const [loading, setLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(false);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productApi.getProducts();
      setProducts(response.data?.data ?? []);
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

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) =>
      [product.name, product.product_code, product.slug, product.description]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [products, search]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const startEntry = filteredProducts.length === 0 ? 0 : startIndex + 1;
  const endEntry = Math.min(startIndex + ITEMS_PER_PAGE, filteredProducts.length);

  const handleAddProduct = async (formData: FormData) => {
    try {
      setAddLoading(true);
      const response = await productApi.createProduct(formData);
      await fetchProducts();
      setAddModalOpen(false);
      setCurrentPage(1);
      toast.success(response.data?.message || "Product added successfully.");
    } catch (error: any) {
      console.error("Add product error:", error);
      if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).flat().join(", ");
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

  const handleEditProduct = async (formData: FormData) => {
    if (!selectedProduct) return;

    try {
      setEditLoading(true);
      const response = await productApi.updateProduct(selectedProduct.id, formData);
      await fetchProducts();
      setEditModalOpen(false);
      setSelectedProduct(null);
      toast.success(response.data?.message || "Product updated successfully.");
    } catch (error: any) {
      console.error("Update product error:", error);
      if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).flat().join(", ");
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

  const handleDeleteImage = async (productId: number, imageId: number) => {
    try {
      const response = await productApi.deleteImages(productId, [imageId]);
      await fetchProducts();
      toast.success(response.data?.message || "Image deleted successfully.");
    } catch (error: any) {
      console.error("Delete image error:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to delete image."
      );
    }
  };

  const handleAddDeal = async (
    productId: number,
    dealData: { starts_at: string; ends_at: string; sale_type: string }
  ) => {
    try {
      const response = await productApi.addDeal(productId, dealData);
      await fetchProducts();
      toast.success(response.data?.message || "Deal added successfully.");
    } catch (error: any) {
      console.error("Add deal error:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to add deal."
      );
    }
  };

  const handleGetDeals = async () => {
    try {
      const response = await productApi.getDeals();
      return response.data?.data ?? [];
    } catch (error: any) {
      console.error("Get deals error:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to fetch deals."
      );
      return [];
    }
  };

  const handleRemoveDeal = async (productId: number) => {
    try {
      const response = await productApi.removeDeal(productId);
      await fetchProducts();
      toast.success(response.data?.message || "Deal removed successfully.");
    } catch (error: any) {
      console.error("Remove deal error:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to remove deal."
      );
    }
  };

  // ===================================================
  // EDIT - Fetch full product details
  // ===================================================

  const handleEdit = async (product: Product) => {
    console.log("Edit clicked for product:", product);
    try {
      // Fetch full product details including variants
      const fullProduct = await fetchProductDetails(product.id);
      
      if (fullProduct) {
        console.log("Full product loaded:", fullProduct);
        setSelectedProduct(fullProduct);
        setEditModalOpen(true);
      } else {
        // Fallback to the list product if full fetch fails
        setSelectedProduct(product);
        setEditModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
      // Fallback to the list product
      setSelectedProduct(product);
      setEditModalOpen(true);
    }
  };

  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setViewModalOpen(true);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <motion.div
      className="min-h-screen bg-[#faf8f3] p-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
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
            Manage your products, pricing, inventory, and product information.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-xl border border-[#b8902e]/15 bg-white px-4 py-2.5 shadow-sm sm:block">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#a89a7d]">
              Total Products
            </div>
            <div className="mt-0.5 text-lg font-bold text-[#2a2620]">
              {products.length}
            </div>
          </div>
        </div>
      </motion.div>

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
              }}
              placeholder="Search by product name, code, slug..."
              className="h-[48px] w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] pl-11 pr-4 text-sm text-[#2a2620] outline-none transition-all placeholder:text-[#a89a7d] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
            />
          </div>

          <motion.button
            type="button"
            onClick={() => setAddModalOpen(true)}
            whileHover={{ y: -2, boxShadow: "0 8px 20px rgba(140,105,25,0.20)" }}
            whileTap={{ scale: 0.97 }}
            className="flex h-[46px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-5 text-sm font-bold text-white shadow-md shadow-[#b8902e]/20 transition-all hover:from-[#a8841c] hover:to-[#795b14]"
          >
            <FiPlus size={19} />
            <span>Add Product</span>
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-sm"
      >
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />
        <div className="">
          <ProductTable
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
          />
        </div>
      </motion.div>

      {/* ADD PRODUCT MODAL */}
      <GlobalModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        closeOnOverlayClick={true}
      >
        <AddProductModal
          open={addModalOpen}
          loading={addLoading}
          onClose={() => setAddModalOpen(false)}
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