import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiPlus,
  FiSearch,
} from "react-icons/fi";

import CategoryTable from "./CategoryTable";
import AddCategoryModal from "./AddCategoryModal";
import EditCategoryModal from "./EditCategoryModal";
import DeleteCategoryModal from "./DeleteCategoryModal";
import AddTaxCategoryModal from "./AddTaxCategoryModal";

import {
  addCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/services/categoryApi";

import {
  Category,
  CategoryPayload,
} from "@/types/category";

const Addcategories: React.FC = () => {

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] =
    useState(1);

  const ITEMS_PER_PAGE = 10;

  /* Add modal */
  const [addModalOpen, setAddModalOpen] =
    useState(false);

  const [addLoading, setAddLoading] =
    useState(false);

  /* Edit modal */
  const [editModalOpen, setEditModalOpen] =
    useState(false);

  const [editLoading, setEditLoading] =
    useState(false);

  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);

  /* Delete modal */
  const [deleteModalOpen, setDeleteModalOpen] =
    useState(false);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  /* Tax Category modal */
  const [taxModalOpen, setTaxModalOpen] =
    useState(false);

  const [taxLoading, setTaxLoading] =
    useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);

      const data = await getCategories();

      setCategories(data);
    } catch (error) {
      console.error(
        "Get categories error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);


  const filteredCategories = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return categories;
    }

    return categories.filter((item) =>
      [
        item.title,
        item.description,
        item.status,
        item.parentCategory || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [categories, search]);


  const totalPages = Math.ceil(
    filteredCategories.length /
      ITEMS_PER_PAGE
  );

  const startIndex =
    (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedCategories =
    filteredCategories.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );

  const startEntry =
    filteredCategories.length === 0
      ? 0
      : startIndex + 1;

  const endEntry = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredCategories.length
  );

 
  const handleSearch = (
    value: string
  ) => {
    setSearch(value);
    setCurrentPage(1);
  };

 
  const handleAddCategory = async (
    payload: CategoryPayload
  ) => {
    try {
      setAddLoading(true);
      await addCategory(payload);
      await fetchCategories();
      setAddModalOpen(false);
      alert(
        "Category added successfully."
      );
    } catch (error) {
      console.error(error);

      alert("Unable to add category.");
    } finally {
      setAddLoading(false);
    }
  };
 
  const handleEdit = (
    category: Category
  ) => {
    setSelectedCategory(category);
    setEditModalOpen(true);
  };


  const handleUpdateCategory = async (
    payload: CategoryPayload
  ) => {
    if (!selectedCategory) return;

    try {
      setEditLoading(true);

      await updateCategory(
        selectedCategory.id,
        payload
      );

      await fetchCategories();

      setEditModalOpen(false);
      setSelectedCategory(null);

      alert(
        "Category updated successfully."
      );
    } catch (error) {
      console.error(error);

      alert("Unable to update category.");
    } finally {
      setEditLoading(false);
    }
  };


  const handleDelete = (
    category: Category
  ) => {
    setSelectedCategory(category);
    setDeleteModalOpen(true);
  };

 
  const handleConfirmDelete = async () => {
    if (!selectedCategory) return;

    try {
      setDeleteLoading(true);
      await deleteCategory(
        selectedCategory.id
      );

      await fetchCategories();

      setDeleteModalOpen(false);
      setSelectedCategory(null);

      alert(
        "Category deleted successfully."
      );
    } catch (error) {
      console.error(error);

      alert("Unable to delete category.");
    } finally {
      setDeleteLoading(false);
    }
  };

 
  const handlePageChange = (
    page: number
  ) => {
    if (page < 1) return;

    if (page > totalPages) return;

    setCurrentPage(page);
  };

  // Handle Tax Category submission
  const handleAddTaxCategory = async (payload: { name: string; rate: string }) => {
    try {
      setTaxLoading(true);
      // Call your API here
      // await addTaxCategory(payload);
      console.log("Tax Category Payload:", payload);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTaxModalOpen(false);
      alert(`Tax Category "${payload.name}" with ${payload.rate}% added successfully.`);
    } catch (error) {
      console.error(error);
      alert("Unable to add tax category.");
    } finally {
      setTaxLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] px-5 py-8 md:px-8 lg:px-9">
      <div className="mb-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-start">

        <div>
          <h1 className="text-[38px] font-bold leading-none tracking-[-1px] text-[#071A33]">
            Categories
          </h1>

          <p className="mt-3 text-[16px] text-[#253B59]">
            Manage product classification hierarchy.
          </p>
        </div>

  
      </div>

      <div className="mb-10 rounded-xl border border-[#DDE3EC] bg-white p-5 shadow-[0_2px_5px_rgba(0,0,0,0.03)]">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          {/* Search */}
          <div className="relative w-full lg:max-w-[560px]">

            <FiSearch
              size={23}
              className="absolute left-5 top-1/2 -translate-y-1/2 text-[#23405F]"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                handleSearch(
                  e.target.value
                )
              }
              placeholder="Search categories..."
              className="h-[48px] w-full rounded-md border border-[#BEC6D2] bg-white pl-[51px] pr-4 text-[15px] text-[#172B4D] outline-none placeholder:text-[#60728B] focus:border-black"
            />

          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {/* Add Category Button */}
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="flex h-[43px] items-center gap-2 rounded-md bg-black px-5 text-sm font-semibold text-white transition hover:bg-[#181818]"
            >
              <FiPlus size={19} />
              Add Category
            </button>

            {/* Add Tax Category Button */}
            <button
              type="button"
              onClick={() => setTaxModalOpen(true)}
              className="flex h-[43px] items-center gap-2 rounded-md bg-black px-5 text-sm font-semibold text-white transition hover:bg-[#181818]"
            >
              <FiPlus size={19} />
              Add Tax Category
            </button>
          </div>

        </div>
      </div>

      <CategoryTable
        categories={paginatedCategories}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        totalEntries={
          filteredCategories.length
        }
        startEntry={startEntry}
        endEntry={endEntry}
        onPageChange={handlePageChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <AddCategoryModal
        open={addModalOpen}
        loading={addLoading}
        onClose={() =>
          setAddModalOpen(false)
        }
        onSubmit={handleAddCategory}
      />

     <EditCategoryModal
        open={editModalOpen}
        loading={editLoading}
        category={selectedCategory}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedCategory(null);
        }}
        onSubmit={handleUpdateCategory}
      />

      <DeleteCategoryModal
        open={deleteModalOpen}
        loading={deleteLoading}
        categoryName={
          selectedCategory?.title || ""
        }
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedCategory(null);
        }}
        onConfirm={
          handleConfirmDelete
        }
      />

      <AddTaxCategoryModal
        open={taxModalOpen}
        loading={taxLoading}
        onClose={() => setTaxModalOpen(false)}
        onSubmit={handleAddTaxCategory}
      />

    </div>
  );
};

export default Addcategories;
