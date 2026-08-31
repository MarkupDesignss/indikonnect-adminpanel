import React, { useEffect, useState } from "react";
import { FiX, FiPercent } from "react-icons/fi";
import GlobalModal from "@/components/common/GlobalModal";

interface TaxCategoryPayload {
  name: string;
  rate: string;
}

interface AddTaxCategoryModalProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: TaxCategoryPayload) => void;
}

const AddTaxCategoryModal: React.FC<AddTaxCategoryModalProps> = ({
  open,
  loading,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");

  useEffect(() => {
    if (!open) {
      setName("");
      setRate("");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter tax category name");
      return;
    }

    if (!rate.trim() || isNaN(Number(rate))) {
      alert("Please enter a valid tax rate");
      return;
    }

    const rateNum = Number(rate);
    if (rateNum < 0 || rateNum > 100) {
      alert("Tax rate must be between 0 and 100");
      return;
    }

    onSubmit({
      name: name.trim(),
      rate: rate.trim(),
    });
  };

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={true}
      maxWidth="max-w-[500px]"
    >
      <div className="relative w-full overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E7EF] bg-white px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-[#071A33]">
              Add Tax Category
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Create a new tax category for GST.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-6 py-6">
          <form id="add-tax-category-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Tax Name */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#172B4D]">
                Tax Category Name{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., GST, VAT, Sales Tax"
                className="h-12 w-full rounded-lg border border-[#D8DEE8] px-4 text-sm outline-none focus:border-black transition-colors"
                required
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Enter the name of the tax category.
              </p>
            </div>

            {/* Tax Rate */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#172B4D]">
                Tax Rate (%){" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="e.g., 18"
                  min="0"
                  max="100"
                  step="0.01"
                  className="h-12 w-full rounded-lg border border-[#D8DEE8] pl-4 pr-12 text-sm outline-none focus:border-black transition-colors"
                  required
                />
                <div className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center bg-[#F7F9FC] rounded-r-lg border-l border-[#D8DEE8]">
                  <FiPercent className="text-gray-500" size={18} />
                </div>
              </div>
              <div className="mt-1.5 flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  Enter percentage value (0-100)
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Example: 18%
                </span>
              </div>
            </div>

            {/* Quick GST Rates */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#172B4D]">
                Quick GST Rates
              </label>
              <div className="flex flex-wrap gap-2">
                {["0", "5", "12", "18", "28"].map((gstRate) => (
                  <button
                    key={gstRate}
                    type="button"
                    onClick={() => setRate(gstRate)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      rate === gstRate
                        ? "border-black bg-black text-white"
                        : "border-[#D8DEE8] bg-white text-[#172B4D] hover:border-black hover:bg-gray-50"
                    }`}
                  >
                    {gstRate}%
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#E2E7EF] bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-11 rounded-lg border border-[#D7DEE8] bg-white px-6 text-sm font-semibold text-[#34495E] transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-tax-category-form"
            disabled={loading}
            className="h-11 rounded-lg bg-black px-7 text-sm font-semibold text-white transition hover:bg-[#181818] disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </>
            ) : (
              "Add Tax Category"
            )}
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};

export default AddTaxCategoryModal;