import React, {
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import {
    FiPlus,
    FiSearch,
  } from "react-icons/fi";
  
  import ProductTable from "./components/ProductTable";
  import AddProductModal from "./components/AddProductModal";
  import EditProductModal from "./components/EditProductModal";
  import ViewProductModal from "./components/ViewProductModal";
  
  import {
    addProduct,
    getBrands,
    getCategories,
    getProducts,
    getTaxCategories,
    updateProduct,
  } from "@/services/productApi";
  
  import {
    Product,
    ProductPayload,
    SelectOption,
  } from "@/types/product";
  
  const Products: React.FC = () => {

    const [products, setProducts] =
      useState<Product[]>([]);
  
    const [categories, setCategories] =
      useState<SelectOption[]>([]);
  
    const [taxCategories, setTaxCategories] =
      useState<SelectOption[]>([]);
  
    const [brands, setBrands] =
      useState<SelectOption[]>([]);
  

    const [loading, setLoading] =
      useState(false);
  
    const [addLoading, setAddLoading] =
      useState(false);
  
    const [editLoading, setEditLoading] =
      useState(false);
  

    const [search, setSearch] =
      useState("");
  
  
    const [currentPage, setCurrentPage] =
      useState(1);
  
    const ITEMS_PER_PAGE = 10;
  

    const [addModalOpen, setAddModalOpen] =
      useState(false);
  
    const [editModalOpen, setEditModalOpen] =
      useState(false);

    const [viewModalOpen, setViewModalOpen] =
      useState(false);

    const [selectedProduct, setSelectedProduct] =
      useState<Product | null>(null);
  
    const fetchProducts = async () => {
      try {
        setLoading(true);
  
        const data =
          await getProducts();
  
        setProducts(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
  
    const fetchOptions = async () => {
      try {
        const [
          categoryData,
          taxData,
          brandData,
        ] = await Promise.all([
          getCategories(),
          getTaxCategories(),
          getBrands(),
        ]);
  
        setCategories(
          categoryData
        );
  
        setTaxCategories(
          taxData
        );
  
        setBrands(brandData);
      } catch (error) {
        console.error(error);
      }
    };
  
    useEffect(() => {
      fetchProducts();
      fetchOptions();
    }, []);
  

    const filteredProducts =
      useMemo(() => {
        const query =
          search
            .trim()
            .toLowerCase();
  
        if (!query) {
          return products;
        }
  
        return products.filter(
          (product) =>
            [
              product.name,
              product.product_code,
              product.slug,
              product.description,
              product.specification,
            ]
              .join(" ")
              .toLowerCase()
              .includes(query)
        );
      }, [
        products,
        search,
      ]);
  
 
    const totalPages =
      Math.ceil(
        filteredProducts.length /
          ITEMS_PER_PAGE
      );
  
    const startIndex =
      (currentPage - 1) *
      ITEMS_PER_PAGE;
  
    const paginatedProducts =
      filteredProducts.slice(
        startIndex,
        startIndex +
          ITEMS_PER_PAGE
      );
  
    const startEntry =
      filteredProducts.length ===
      0
        ? 0
        : startIndex + 1;
  
    const endEntry =
      Math.min(
        startIndex +
          ITEMS_PER_PAGE,
        filteredProducts.length
      );
  

    const handleAddProduct = async (
      payload: ProductPayload
    ) => {
      try {
        setAddLoading(true);
  
        await addProduct(
          payload
        );
  
        await fetchProducts();
  
        setAddModalOpen(false);
  
        setCurrentPage(1);
  
        alert(
          "Product added successfully."
        );
      } catch (error) {
        console.error(error);
  
        alert(
          "Unable to add product."
        );
      } finally {
        setAddLoading(false);
      }
    };
  
    const handleEditProduct = async (
      payload: ProductPayload
    ) => {
      if (!selectedProduct) return;
  
      try {
        setEditLoading(true);
  
        await updateProduct(
          selectedProduct.id,
          payload
        );
  
        await fetchProducts();
  
        setEditModalOpen(false);
        setSelectedProduct(null);
  
        alert(
          "Product updated successfully."
        );
      } catch (error) {
        console.error(error);
  
        alert(
          "Unable to update product."
        );
      } finally {
        setEditLoading(false);
      }
    };

    const handleEdit = (
      product: Product
    ) => {
      setSelectedProduct(product);
      setEditModalOpen(true);
    };

    const handleView = (
      product: Product
    ) => {
      setSelectedProduct(product);
      setViewModalOpen(true);
    };

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
  
    return (
      <div className="min-h-screen bg-[#F7F9FC] px-5 py-8 md:px-8 lg:px-9">
  

        <div className="mb-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
  
          <div>
            <h1 className="font-lato text-[38px] font-bold leading-none tracking-[-1px] text-[#071A33]">
              Products
            </h1>
  
            <p className="font-arimo mt-3 text-[16px] text-[#253B59]">
              Manage your products,
              pricing and inventory.
            </p>
          </div>
        </div>
  
        <div className="mb-10 rounded-xl border border-[#DDE3EC] bg-white p-5">
  
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
  
            <div className="relative w-full lg:max-w-[560px]">
  
              <FiSearch
                size={23}
                className="absolute left-5 top-1/2 -translate-y-1/2 text-[#23405F]"
              />
  
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(
                    e.target.value
                  );
  
                  setCurrentPage(
                    1
                  );
                }}
                placeholder="Search products..."
                className="font-arimo h-[48px] w-full rounded-md border border-[#BEC6D2] pl-[51px] pr-4 text-[15px] outline-none placeholder:text-[#60728B] focus:border-black"
              />
  
            </div>
  
            {/* Add Product Button */}
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="font-lato flex h-[43px] items-center gap-2 self-end rounded-md bg-black px-5 text-sm font-bold text-white hover:bg-[#181818] lg:self-auto"
            >
              <FiPlus size={19} />
              Add Product
            </button>
  
          </div>
  
        </div>
  
    
        <ProductTable
          products={
            paginatedProducts
          }
          loading={loading}
          currentPage={
            currentPage
          }
          totalPages={
            totalPages
          }
          totalEntries={
            filteredProducts.length
          }
          startEntry={
            startEntry
          }
          endEntry={
            endEntry
          }
          categories={
            categories
          }
          brands={brands}
          onPageChange={
            handlePageChange
          }
          onEdit={handleEdit}
          onView={handleView}
        />
 
        <AddProductModal
          open={addModalOpen}
          loading={addLoading}
          categories={
            categories
          }
          taxCategories={
            taxCategories
          }
          brands={brands}
          onClose={() =>
            setAddModalOpen(
              false
            )
          }
          onSubmit={
            handleAddProduct
          }
        />
  
        <EditProductModal
          open={editModalOpen}
          loading={editLoading}
          product={selectedProduct}
          categories={categories}
          taxCategories={taxCategories}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedProduct(null);
          }}
          onSubmit={handleEditProduct}
        />

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
  
      </div>
    );
  };
  
  export default Products;
