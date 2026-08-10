import React, { useEffect, useState } from "react";
import {
  FiUploadCloud,
  FiX,
} from "react-icons/fi";

import {
  Category,
  CategoryPayload,
  CategoryStatus,
} from "@/types/category";

interface EditCategoryModalProps {
  open: boolean;
  loading: boolean;
  category: Category | null;
  onClose: () => void;
  onSubmit: (payload: CategoryPayload) => void;
}

const EditCategoryModal: React.FC<
  EditCategoryModalProps
> = ({
  open,
  loading,
  category,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");

  const [status, setStatus] =
    useState<CategoryStatus>("active");

  const [image, setImage] = useState<File | null>(
    null
  );

  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (category && open) {
      setTitle(category.title);
      setDescription(category.description || "");
      setStatus(category.status);
      setPreview(category.image || "");
      setImage(null);
    }
  }, [category, open]);

  if (!open || !category) return null;

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter category title");
      return;
    }

    onSubmit({
      title,
      description,
      image,
      status,
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
        <div 
          className="relative w-full max-w-[620px] my-8 bg-white rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Fixed */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 px-6 py-5 bg-white rounded-t-2xl">
            <div>
              <h2 className="text-xl font-bold text-[#071A33]">
                Edit Category
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Update category information.
              </p>
            </div>

            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Title */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#172B4D]">
                  Title{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  className="h-12 w-full rounded-lg border border-[#D8DEE8] px-4 text-sm outline-none focus:border-black"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#172B4D]">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  rows={4}
                  className="w-full resize-none rounded-lg border border-[#D8DEE8] px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>

              {/* Image */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#172B4D]">
                  Banner / Image
                </label>

                <label className="group flex min-h-[150px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#D8DEE8] bg-[#FAFBFC] hover:border-black transition-colors">
                  {preview ? (
                    <div className="h-[150px] w-full flex items-center justify-center p-4">
                      <img
                        src={preview}
                        alt={title}
                        className="max-h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-8">
                      <FiUploadCloud
                        size={30}
                        className="text-gray-400"
                      />

                      <span className="mt-2 text-sm font-semibold">
                        Upload Image
                      </span>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>

              {/* Status */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#172B4D]">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value as CategoryStatus
                    )
                  }
                  className="h-12 w-full rounded-lg border border-[#D8DEE8] bg-white px-4 text-sm outline-none focus:border-black"
                >
                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>

                  <option value="draft">
                    Draft
                  </option>
                </select>
              </div>
            </form>
          </div>

          {/* Footer - Fixed */}
          <div className="sticky bottom-0 z-10 flex justify-end gap-3 border-t border-gray-200 px-6 py-4 bg-white rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-lg border border-gray-300 px-6 text-sm font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              onClick={handleSubmit}
              className="h-11 rounded-lg bg-black px-7 text-sm font-semibold text-white disabled:opacity-50 hover:bg-[#181818] transition-colors"
            >
              {loading
                ? "Updating..."
                : "Update Category"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditCategoryModal;
