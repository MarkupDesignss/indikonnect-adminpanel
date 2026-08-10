import React from "react";
import {
  FiTrash2,
  FiX,
} from "react-icons/fi";

interface DeleteCategoryModalProps {
  open: boolean;
  loading: boolean;
  categoryName: string;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteCategoryModal: React.FC<
  DeleteCategoryModalProps
> = ({
  open,
  loading,
  categoryName,
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-y-auto">
        <div 
          className="relative w-full max-w-[430px] my-8 bg-white rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 z-10"
          >
            <FiX size={18} />
          </button>

          {/* Content */}
          <div className="p-8">
            {/* Icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
              <FiTrash2 size={25} />
            </div>

            <h2 className="mt-5 text-center text-xl font-bold text-[#071A33]">
              Delete Category?
            </h2>

            <p className="mt-3 text-center text-sm leading-6 text-gray-500">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-700">
                "{categoryName}"
              </span>
              ?
              <br />
              This action cannot be undone.
            </p>

            {/* Buttons */}
            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="h-11 flex-1 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="h-11 flex-1 rounded-lg bg-red-500 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeleteCategoryModal;