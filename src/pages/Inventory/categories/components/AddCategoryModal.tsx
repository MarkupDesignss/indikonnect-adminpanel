import React, { useEffect, useState } from "react";
import {
  FiUploadCloud,
  FiX,
} from "react-icons/fi";

import {
  CategoryPayload,
  CategoryStatus,
} from "@/types/category";

interface AddCategoryModalProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: CategoryPayload) => void;
}

const AddCategoryModal: React.FC<
  AddCategoryModalProps
> = ({
  open,
  loading,
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
    if (!open) {
      setTitle("");
      setDescription("");
      setStatus("active");
      setImage(null);
      setPreview("");
    }
  }, [open]);

  if (!open) return null;

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
      
      {/* Modal Container - Centered with scrolling */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div 
          className="relative w-full max-w-[620px] max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Fixed */}
          <div className="flex-shrink-0 flex items-center justify-between border-b border-gray-200 px-6 py-5 bg-white rounded-t-2xl">
            <div>
              <h2 className="text-xl font-bold text-[#071A33]">
                Add Category
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Create a new product category.
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
          <div className="flex-1 overflow-y-auto px-6 py-6">
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
                  placeholder="Enter category title"
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
                  placeholder="Enter category description"
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
                    <div className="relative h-[150px] w-full">
                      <img
                        src={preview}
                        alt="Preview"
                        className="h-full w-full object-contain"
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

                      <span className="mt-1 text-xs text-gray-400">
                        PNG, JPG, JPEG or WEBP
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
          <div className="flex-shrink-0 flex justify-end gap-3 border-t border-gray-200 px-6 py-4 bg-white rounded-b-2xl">
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
                ? "Adding..."
                : "Add Category"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddCategoryModal;
