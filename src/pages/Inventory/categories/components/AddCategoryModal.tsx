import React, { useEffect, useState } from "react";
import { FiUploadCloud, FiX } from "react-icons/fi";
import { toast } from 'react-toastify';

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

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  open,
  loading,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<CategoryStatus>("active");
  const [image, setImage] = useState<File | null>(null);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload PNG, JPG, JPEG, or WEBP image');
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
    toast.success(`Image "${file.name}" uploaded successfully`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter category title');
      return;
    }

    if (title.trim().length < 3) {
      toast.warning('Category title must be at least 3 characters long');
      return;
    }

    if (title.trim().length > 50) {
      toast.warning('Category title must be less than 50 characters');
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      image,
      status,
    });

    toast.success(`Category "${title.trim()}" added successfully!`, {
      autoClose: 3000,
    });
  };

  return (
    <>
      {/* BACKDROP */}
      <div
        className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* MODAL */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center overflow-y-auto p-3 sm:p-4">
        <div
          className="relative my-3 flex w-full max-w-[560px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="flex shrink-0 items-center justify-between border-b border-[#E2E7EF] bg-white px-5 py-4">
            <div>
              <h2 className="text-lg font-bold text-[#071A33]">
                Add Category
              </h2>

              <p className="mt-0.5 text-xs text-[#718096]">
                Create a new product category
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* CONTENT */}
          <div className="max-h-[calc(100vh-155px)] flex-1 overflow-y-auto px-5 py-4">
            <form
              id="add-category-form"
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* TITLE */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#172B4D]">
                  Title{" "}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter category title"
                  className="h-10 w-full rounded-lg border border-[#D8DEE8] px-3 text-sm text-[#071A33] outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#172B4D]">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Enter category description"
                  className="w-full resize-none rounded-lg border border-[#D8DEE8] px-3 py-2.5 text-sm text-[#071A33] outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* IMAGE */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#172B4D]">
                  Banner / Image
                </label>

                <label className="group flex h-[125px] cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#CBD5E1] bg-[#FAFBFC] transition hover:border-black hover:bg-[#F8F8F8]">
                  {preview ? (
                    <div className="relative flex h-full w-full items-center justify-center p-2">
                      <img
                        src={preview}
                        alt="Preview"
                        className="h-full w-full rounded-md object-contain"
                      />

                      {/* HOVER TEXT */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/10">
                        <span className="rounded-md bg-black/80 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
                          Change Image
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F0F3F7]">
                        <FiUploadCloud
                          size={20}
                          className="text-[#718096]"
                        />
                      </div>

                      <span className="mt-2 text-xs font-semibold text-[#253B59]">
                        Upload Image
                      </span>

                      <span className="mt-0.5 text-[11px] text-gray-400">
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

              {/* STATUS */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#172B4D]">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CategoryStatus)}
                  className="h-10 w-full rounded-lg border border-[#D8DEE8] bg-white px-3 text-sm text-[#071A33] outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </form>
          </div>

          {/* FOOTER */}
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#E2E7EF] bg-white px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-9 rounded-lg border border-[#D7DEE8] bg-white px-5 text-xs font-semibold text-[#34495E] transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="add-category-form"
              disabled={loading}
              className="h-9 rounded-lg bg-black px-5 text-xs font-semibold text-white transition hover:bg-[#181818] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Category"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddCategoryModal;