import React, { useEffect, useMemo, useState } from "react";

import {
  FiAlertTriangle,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiHash,
  FiList,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiSettings,
  FiTrash2,
  FiX,
  FiTag,
  FiAlertCircle,
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

import GlobalModal from "@/components/common/GlobalModal";

import attributesApi, {
  AttributeMaster,
  AttributeValue,
  UpdateAttributePayload,
  CreateAttributePayload,
} from "../../api/endpoints/attributes";

// =====================================================
// PERMISSIONS
// =====================================================

import { usePermissions } from "../permissions/usePermissions";

// =====================================================
// ANIMATION
// =====================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 18,
    },
  },
};

// =====================================================
// HELPERS
// =====================================================

const formatDate = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getInitials = (value: string) => {
  const clean = value
    ?.trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase(),
    )
    .join("");

  return clean || "AT";
};

// =====================================================
// PERMISSION LOADING STATE
// =====================================================

const PermissionLoadingState: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F8FD] p-6 font-poppins">
      <div className="w-full max-w-md rounded-2xl border border-[#D6E2F0] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
          <FiRefreshCw
            size={24}
            className="animate-spin"
          />
        </div>

        <h2 className="mt-5 text-base font-bold text-[#111827]">
          Checking permissions...
        </h2>

        <p className="mt-2 text-sm text-[#6B7280]">
          Please wait while we verify your access.
        </p>
      </div>
    </div>
  );
};

// =====================================================
// DELETE MODAL
// =====================================================

interface DeleteModalProps {
  open: boolean;
  title: string;
  description: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteModal: React.FC<
  DeleteModalProps
> = ({
  open,
  title,
  description,
  loading,
  onClose,
  onConfirm,
}) => {
    if (!open) return null;

    return (
      <GlobalModal
        isOpen={open}
        onClose={onClose}
        closeOnOverlayClick={!loading}
      >
        <div className="w-full max-w-[460px] overflow-hidden rounded-[20px] border border-[#DCE6F2] bg-white font-poppins shadow-2xl">
          <div className="h-[3px] w-full bg-gradient-to-r from-[#EF4444] to-[#C23B32]" />

          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FEF2F2] text-[#C23B32]">
                <FiAlertTriangle size={21} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-[#111827]">
                  {title}
                </h2>

                <p className="mt-1 text-sm leading-6 text-[#6B7280]">
                  {description}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-[#DCE6F2] bg-white px-5 py-2.5 text-sm font-medium text-[#111827] transition hover:border-[#2D6FE8]/20 hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#C23B32] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#A32E26] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <FiRefreshCw
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <FiTrash2 size={15} />
                )}

                {loading
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </GlobalModal>
    );
  };

// =====================================================
// EDIT ATTRIBUTE MODAL
// =====================================================

interface EditAttributeModalProps {
  open: boolean;
  loading: boolean;
  attribute: AttributeMaster | null;
  onClose: () => void;
  onSubmit: (
    payload: UpdateAttributePayload,
  ) => void;
}

const EditAttributeModal: React.FC<
  EditAttributeModalProps
> = ({
  open,
  loading,
  attribute,
  onClose,
  onSubmit,
}) => {
    const [attributeKey, setAttributeKey] =
      useState("");

    useEffect(() => {
      if (!open || !attribute) return;

      setAttributeKey(
        attribute.attribute_key || "",
      );
    }, [open, attribute]);

    if (!open || !attribute) {
      return null;
    }

    const handleSubmit = (
      event: React.FormEvent,
    ) => {
      event.preventDefault();

      if (!attributeKey.trim()) {
        toast.error(
          "Attribute key is required.",
        );
        return;
      }

      onSubmit({
        attribute_key:
          attributeKey.trim(),
        is_required: false,
        sort_order: 0,
      });
    };

    return (
      <GlobalModal
        isOpen={open}
        onClose={() => {
          if (!loading) onClose();
        }}
        closeOnOverlayClick={!loading}
      >
        <div className="w-full max-w-[500px] overflow-hidden rounded-[20px] border border-[#DCE6F2] bg-white font-poppins shadow-2xl">
          <div className="h-[3px] w-full bg-gradient-to-r from-[#4F8FF7] via-[#2D6FE8] to-[#2D6FE8]" />

          <div className="flex items-start justify-between border-b border-[#DCE6F2] px-5 py-5">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2D6FE8]">
                  <FiEdit2 size={16} />
                </div>

                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#2D6FE8]">
                  Attribute Settings
                </span>
              </div>

              <h2 className="text-xl font-semibold text-[#111827]">
                Edit Attribute
              </h2>

              <p className="mt-1 text-xs text-[#6B7280]">
                Update the attribute name.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F8FD] text-[#111827] transition hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:opacity-50"
            >
              <FiX size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-5">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#111827]">
                Attribute Key
              </label>

              <input
                type="text"
                value={attributeKey}
                onChange={(event) =>
                  setAttributeKey(
                    event.target.value,
                  )
                }
                placeholder="color"
                className="h-11 w-full rounded-xl border border-[#D6E2F0] bg-[#F4F8FD] px-4 text-sm text-[#111827] outline-none transition focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/15"
              />
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-[#DCE6F2] bg-[#F8FBFF] px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-[#DCE6F2] bg-white px-5 py-2.5 text-sm font-medium text-[#111827] hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_14px_-6px_rgba(45,111,232,0.55)] transition hover:-translate-y-0.5 disabled:opacity-50"
              >
                {loading ? (
                  <FiRefreshCw
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <FiCheck size={15} />
                )}

                {loading
                  ? "Updating..."
                  : "Update Attribute"}
              </button>
            </div>
          </form>
        </div>
      </GlobalModal>
    );
  };

// =====================================================
// ADD VALUES MODAL
// =====================================================

interface AddValuesModalProps {
  open: boolean;
  loading: boolean;
  attribute: AttributeMaster | null;
  onClose: () => void;
  onSubmit: (values: string[]) => void;
}

const AddValuesModal: React.FC<
  AddValuesModalProps
> = ({
  open,
  loading,
  attribute,
  onClose,
  onSubmit,
}) => {
    const [valueText, setValueText] =
      useState("");

    useEffect(() => {
      if (!open) {
        setValueText("");
      }
    }, [open]);

    if (!open || !attribute) {
      return null;
    }

    const handleSubmit = (
      event: React.FormEvent,
    ) => {
      event.preventDefault();

      const values = valueText
        .split(/\n|,/)
        .map((item) => item.trim())
        .filter(Boolean);

      const uniqueValues = Array.from(
        new Set(
          values.map((value) =>
            value.toLowerCase(),
          ),
        ),
      ).map(
        (lowerValue) =>
          values.find(
            (value) =>
              value.toLowerCase() ===
              lowerValue,
          ) || lowerValue,
      );

      if (uniqueValues.length === 0) {
        toast.error(
          "Please enter at least one value.",
        );
        return;
      }

      onSubmit(uniqueValues);
    };

    return (
      <GlobalModal
        isOpen={open}
        onClose={() => {
          if (!loading) onClose();
        }}
        closeOnOverlayClick={!loading}
      >
        <div className="w-full max-w-[520px] overflow-hidden rounded-[20px] border border-[#DCE6F2] bg-white font-poppins shadow-2xl">
          <div className="h-[3px] w-full bg-gradient-to-r from-[#4F8FF7] via-[#2D6FE8] to-[#2D6FE8]" />

          <div className="flex items-start justify-between border-b border-[#DCE6F2] px-5 py-5">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2D6FE8]">
                  <FiPlus size={17} />
                </div>

                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#2D6FE8]">
                  Attribute Values
                </span>
              </div>

              <h2 className="text-xl font-semibold text-[#111827]">
                Add Values
              </h2>

              <p className="mt-1 text-xs text-[#6B7280]">
                Add values for{" "}
                <span className="font-semibold text-[#2D6FE8]">
                  {attribute.attribute_key}
                </span>
                .
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F8FD] text-[#111827] transition hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:opacity-50"
            >
              <FiX size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-5">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#111827]">
                Values
              </label>

              <textarea
                value={valueText}
                onChange={(event) =>
                  setValueText(
                    event.target.value,
                  )
                }
                rows={5}
                className="w-full resize-none rounded-xl border border-[#D6E2F0] bg-[#F4F8FD] px-4 py-3 font-mono text-sm leading-6 text-[#111827] outline-none placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/15"
              />

              <p className="mt-2 text-[10px] leading-5 text-[#6B7280]">
                Enter one value per line or
                separate values with commas.
                Duplicate values are automatically
                removed.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-[#DCE6F2] bg-[#F8FBFF] px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-[#DCE6F2] bg-white px-5 py-2.5 text-sm font-medium text-[#111827] hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_14px_-6px_rgba(45,111,232,0.55)] transition hover:-translate-y-0.5 disabled:opacity-50"
              >
                {loading ? (
                  <FiRefreshCw
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <FiPlus size={15} />
                )}

                {loading
                  ? "Adding..."
                  : "Add Values"}
              </button>
            </div>
          </form>
        </div>
      </GlobalModal>
    );
  };

// =====================================================
// EDIT VALUE MODAL
// =====================================================

interface EditValueModalProps {
  open: boolean;
  loading: boolean;
  valueItem: AttributeValue | null;
  onClose: () => void;
  onSubmit: (
    value: string,
    sortOrder: number,
  ) => void;
}

const EditValueModal: React.FC<
  EditValueModalProps
> = ({
  open,
  loading,
  valueItem,
  onClose,
  onSubmit,
}) => {
    const [value, setValue] = useState("");
    const [sortOrder, setSortOrder] =
      useState(0);

    useEffect(() => {
      if (!open || !valueItem) return;

      setValue(valueItem.value || "");
      setSortOrder(
        Number(valueItem.sort_order) || 0,
      );
    }, [open, valueItem]);

    if (!open || !valueItem) {
      return null;
    }

    const handleSubmit = (
      event: React.FormEvent,
    ) => {
      event.preventDefault();

      if (!value.trim()) {
        toast.error("Value is required.");
        return;
      }

      onSubmit(
        value.trim(),
        Number(sortOrder) || 0,
      );
    };

    return (
      <GlobalModal
        isOpen={open}
        onClose={() => {
          if (!loading) onClose();
        }}
        closeOnOverlayClick={!loading}
      >
        <div className="w-full max-w-[450px] overflow-hidden rounded-[20px] border border-[#DCE6F2] bg-white font-poppins shadow-2xl">
          <div className="h-[3px] w-full bg-gradient-to-r from-[#4F8FF7] via-[#2D6FE8] to-[#2D6FE8]" />

          <div className="flex items-start justify-between border-b border-[#DCE6F2] px-5 py-5">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2D6FE8]">
                  <FiEdit2 size={16} />
                </div>

                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#2D6FE8]">
                  Value Settings
                </span>
              </div>

              <h2 className="text-xl font-semibold text-[#111827]">
                Edit Value
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F8FD] text-[#111827] transition hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:opacity-50"
            >
              <FiX size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-5 p-5">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#111827]">
                  Value
                </label>

                <input
                  type="text"
                  value={value}
                  onChange={(event) =>
                    setValue(
                      event.target.value,
                    )
                  }
                  placeholder="Black"
                  className="h-11 w-full rounded-xl border border-[#D6E2F0] bg-[#F4F8FD] px-4 text-sm text-[#111827] outline-none focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/15"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-[#DCE6F2] bg-[#F8FBFF] px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-[#DCE6F2] bg-white px-5 py-2.5 text-sm font-medium text-[#111827] hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_14px_-6px_rgba(45,111,232,0.55)] transition hover:-translate-y-0.5 disabled:opacity-50"
              >
                {loading ? (
                  <FiRefreshCw
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <FiCheck size={15} />
                )}

                {loading
                  ? "Updating..."
                  : "Update Value"}
              </button>
            </div>
          </form>
        </div>
      </GlobalModal>
    );
  };

// =====================================================
// ADD ATTRIBUTE MODAL
// =====================================================

interface AddAttributeModalProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (
    payload: CreateAttributePayload,
  ) => void;
}

const AddAttributeModal: React.FC<
  AddAttributeModalProps
> = ({
  open,
  loading,
  onClose,
  onSubmit,
}) => {
    const [attributeKey, setAttributeKey] =
      useState("");

    useEffect(() => {
      if (!open) {
        setAttributeKey("");
      }
    }, [open]);

    if (!open) return null;

    const handleSubmit = (
      event: React.FormEvent,
    ) => {
      event.preventDefault();

      if (!attributeKey.trim()) {
        toast.error(
          "Attribute key is required.",
        );
        return;
      }

      onSubmit({
        attribute_key:
          attributeKey.trim(),
        is_required: false,
        sort_order: 0,
      });
    };

    const suggestions = [
      "Color",
      "Size",
      "Material",
      "Style",
      "Pattern",
      "Fit",
      "Length",
      "Weight",
    ];

    return (
      <GlobalModal
        isOpen={open}
        onClose={() => {
          if (!loading) onClose();
        }}
        closeOnOverlayClick={!loading}
      >
        <div className="w-full max-w-[500px] overflow-hidden rounded-[20px] border border-[#DCE6F2] bg-white font-poppins shadow-2xl">
          <div className="h-[3px] w-full bg-gradient-to-r from-[#4F8FF7] via-[#2D6FE8] to-[#2D6FE8]" />

          <div className="flex items-start justify-between border-b border-[#DCE6F2] px-6 py-5">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2D6FE8]">
                  <FiPlus size={17} />
                </div>

                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#2D6FE8]">
                  New Attribute
                </span>
              </div>

              <h2 className="text-xl font-semibold text-[#111827]">
                Create New Attribute
              </h2>

              <p className="mt-1 text-xs text-[#6B7280]">
                Define a new product attribute
                to organize your inventory.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F8FD] text-[#111827] transition hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:opacity-50"
            >
              <FiX size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#111827]">
                  Attribute Key{" "}
                  <span className="text-[#C23B32]">
                    *
                  </span>
                </label>

                <span className="text-[9px] text-[#6B7280]">
                  {attributeKey.length}/50
                </span>
              </div>

              <div className="relative">
                <FiTag
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D6FE8]"
                />

                <input
                  type="text"
                  value={attributeKey}
                  onChange={(event) =>
                    setAttributeKey(
                      event.target.value,
                    )
                  }
                  placeholder="Enter attribute name (e.g., color, size)"
                  maxLength={50}
                  className="h-11 w-full rounded-xl border border-[#D6E2F0] bg-[#F4F8FD] pl-10 pr-4 text-sm text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/15"
                />
              </div>

              {/* QUICK SUGGESTIONS */}

              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="mr-1.5 text-[9px] text-[#6B7280]">
                  Suggestions:
                </span>

                {suggestions.map(
                  (suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() =>
                        setAttributeKey(
                          suggestion,
                        )
                      }
                      className="rounded-lg border border-[#DCE6F2] bg-[#F4F8FD] px-2.5 py-1 text-[9px] font-medium text-[#111827] transition hover:border-[#2D6FE8] hover:bg-[#2D6FE8] hover:text-white"
                    >
                      {suggestion}
                    </button>
                  ),
                )}
              </div>

              {/* PREVIEW */}

              <div className="mt-5 rounded-xl border border-[#DCE6F2] bg-[#F8FBFF] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <FiTag
                    size={14}
                    className="text-[#2D6FE8]"
                  />

                  <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#111827]">
                    Preview
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EAF3FF] text-sm font-bold text-[#2D6FE8]">
                    {attributeKey
                      ? getInitials(
                        attributeKey,
                      )
                      : "?"}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#111827]">
                      {attributeKey ||
                        "Attribute Name"}
                    </p>

                    <p className="mt-0.5 text-[9px] text-[#6B7280]">
                      No values configured
                      yet
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-[#DCE6F2] bg-[#F8FBFF] px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-[#DCE6F2] bg-white px-5 py-2.5 text-sm font-medium text-[#111827] transition hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_6px_14px_-6px_rgba(45,111,232,0.55)] transition hover:-translate-y-0.5 disabled:opacity-50"
              >
                {loading ? (
                  <FiRefreshCw
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <FiPlus size={16} />
                )}

                {loading
                  ? "Creating..."
                  : "Create Attribute"}
              </button>
            </div>
          </form>
        </div>
      </GlobalModal>
    );
  };

// =====================================================
// MAIN PAGE
// =====================================================

const AttributesManagement: React.FC =
  () => {
    // ===================================================
    // PERMISSIONS
    // ===================================================

    const {
      hasPermission,
      hasModuleAccess,
      isSuperAdmin,
      loading: permissionsLoading,
    } = usePermissions();

    const canViewAttributes = useMemo(
      () =>
        isSuperAdmin ||
        hasModuleAccess("attribute") ||
        hasPermission("attribute.view"),
      [
        isSuperAdmin,
        hasModuleAccess,
        hasPermission,
      ],
    );

    const canCreateAttribute = useMemo(
      () =>
        isSuperAdmin ||
        hasPermission(
          "attribute.create",
        ),
      [isSuperAdmin, hasPermission],
    );

    const canUpdateAttribute = useMemo(
      () =>
        isSuperAdmin ||
        hasPermission(
          "attribute.update",
        ) ||
        hasPermission(
          "attribute.edit",
        ),
      [isSuperAdmin, hasPermission],
    );

    const canDeleteAttribute = useMemo(
      () =>
        isSuperAdmin ||
        hasPermission(
          "attribute.delete",
        ),
      [isSuperAdmin, hasPermission],
    );

    // ===================================================
    // STATE
    // ===================================================

    const [attributes, setAttributes] =
      useState<AttributeMaster[]>([]);

    const [selectedId, setSelectedId] =
      useState<number | null>(null);

    const [loading, setLoading] =
      useState(false);

    const [actionLoading, setActionLoading] =
      useState(false);

    const [search, setSearch] =
      useState("");

    const [valueSearch, setValueSearch] =
      useState("");

    const [currentPage, setCurrentPage] =
      useState(1);

    const [
      valueCurrentPage,
      setValueCurrentPage,
    ] = useState(1);

    const [
      editAttributeOpen,
      setEditAttributeOpen,
    ] = useState(false);

    const [
      addValuesOpen,
      setAddValuesOpen,
    ] = useState(false);

    const [
      editValueOpen,
      setEditValueOpen,
    ] = useState(false);

    const [
      deleteAttributeOpen,
      setDeleteAttributeOpen,
    ] = useState(false);

    const [
      deleteValueOpen,
      setDeleteValueOpen,
    ] = useState(false);

    const [
      addAttributeOpen,
      setAddAttributeOpen,
    ] = useState(false);

    const [
      selectedAttribute,
      setSelectedAttribute,
    ] =
      useState<AttributeMaster | null>(
        null,
      );

    const [
      selectedValue,
      setSelectedValue,
    ] =
      useState<AttributeValue | null>(
        null,
      );

    const [
      deleteLoading,
      setDeleteLoading,
    ] = useState(false);

    const ATTRIBUTE_ITEMS = 8;
    const VALUE_ITEMS = 8;

    // =================================================
    // GET ATTRIBUTES
    // =================================================

    const fetchAttributes = async (
      keepSelection = true,
    ) => {
      try {
        setLoading(true);

        const response =
          await attributesApi.getAll();

        if (response.data.success) {
          const data =
            response.data.data || [];

          setAttributes(data);

          if (keepSelection) {
            setSelectedId(
              (current) => {
                if (
                  current &&
                  data.some(
                    (item) =>
                      item.id ===
                      current,
                  )
                ) {
                  return current;
                }

                return (
                  data[0]?.id ?? null
                );
              },
            );
          }
        } else {
          toast.error(
            response.data.message ||
            "Unable to fetch attributes.",
          );
        }
      } catch (error: any) {
        console.error(
          "Fetch attributes error:",
          error,
        );

        toast.error(
          error?.response?.data
            ?.message ||
          "Unable to fetch attributes.",
        );
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      if (
        !permissionsLoading &&
        canViewAttributes
      ) {
        fetchAttributes();
      }
    }, [
      permissionsLoading,
      canViewAttributes,
    ]);

    // =================================================
    // SELECTED ATTRIBUTE
    // =================================================

    const selectedAttributeData =
      useMemo(
        () =>
          attributes.find(
            (item) =>
              item.id ===
              selectedId,
          ) || null,
        [
          attributes,
          selectedId,
        ],
      );

    // =================================================
    // FILTER ATTRIBUTES
    // =================================================

    const filteredAttributes =
      useMemo(() => {
        const query = search
          .trim()
          .toLowerCase();

        return attributes.filter(
          (item) =>
            !query ||
            [item.attribute_key]
              .join(" ")
              .toLowerCase()
              .includes(query),
        );
      }, [attributes, search]);

    // =================================================
    // ATTRIBUTE PAGINATION
    // =================================================

    const attributeTotalPages =
      Math.max(
        1,
        Math.ceil(
          filteredAttributes.length /
          ATTRIBUTE_ITEMS,
        ),
      );

    const attributeStart =
      (currentPage - 1) *
      ATTRIBUTE_ITEMS;

    const visibleAttributes =
      filteredAttributes.slice(
        attributeStart,
        attributeStart +
        ATTRIBUTE_ITEMS,
      );

    useEffect(() => {
      if (
        currentPage >
        attributeTotalPages
      ) {
        setCurrentPage(
          attributeTotalPages,
        );
      }
    }, [
      currentPage,
      attributeTotalPages,
    ]);

    // =================================================
    // FILTER VALUES
    // =================================================

    const filteredValues =
      useMemo(() => {
        if (!selectedAttributeData) {
          return [];
        }

        const query = valueSearch
          .trim()
          .toLowerCase();

        return (
          selectedAttributeData.values ||
          []
        ).filter(
          (item) =>
            !query ||
            [item.value]
              .join(" ")
              .toLowerCase()
              .includes(query),
        );
      }, [
        selectedAttributeData,
        valueSearch,
      ]);

    // =================================================
    // VALUE PAGINATION
    // =================================================

    const valueTotalPages =
      Math.max(
        1,
        Math.ceil(
          filteredValues.length /
          VALUE_ITEMS,
        ),
      );

    const valueStart =
      (valueCurrentPage - 1) *
      VALUE_ITEMS;

    const visibleValues =
      filteredValues.slice(
        valueStart,
        valueStart + VALUE_ITEMS,
      );

    useEffect(() => {
      setValueCurrentPage(1);
    }, [selectedId, valueSearch]);

    useEffect(() => {
      if (
        valueCurrentPage >
        valueTotalPages
      ) {
        setValueCurrentPage(
          valueTotalPages,
        );
      }
    }, [
      valueCurrentPage,
      valueTotalPages,
    ]);

    // =================================================
    // ADD ATTRIBUTE
    // =================================================

    const handleAddAttribute = async (
      payload: CreateAttributePayload,
    ) => {
      try {
        setActionLoading(true);

        const response =
          await attributesApi.create(
            payload,
          );

        if (response.data.success) {
          toast.success(
            response.data.message ||
            "Attribute created successfully.",
          );

          setAddAttributeOpen(false);

          await fetchAttributes(
            false,
          );
        } else {
          toast.error(
            response.data.message ||
            "Unable to create attribute.",
          );
        }
      } catch (error: any) {
        console.error(
          "Create attribute error:",
          error,
        );

        toast.error(
          error?.response?.data
            ?.message ||
          "Unable to create attribute.",
        );
      } finally {
        setActionLoading(false);
      }
    };

    // =================================================
    // EDIT ATTRIBUTE
    // =================================================

    const handleUpdateAttribute =
      async (
        payload: UpdateAttributePayload,
      ) => {
        if (!selectedAttributeData) {
          return;
        }

        try {
          setActionLoading(true);

          const response =
            await attributesApi.update(
              selectedAttributeData.id,
              payload,
            );

          if (response.data.success) {
            toast.success(
              response.data.message ||
              "Attribute updated successfully.",
            );

            setEditAttributeOpen(
              false,
            );

            await fetchAttributes();
          } else {
            toast.error(
              response.data.message ||
              "Unable to update attribute.",
            );
          }
        } catch (error: any) {
          console.error(
            "Update attribute error:",
            error,
          );

          toast.error(
            error?.response?.data
              ?.message ||
            "Unable to update attribute.",
          );
        } finally {
          setActionLoading(false);
        }
      };

    // =================================================
    // DELETE ATTRIBUTE
    // =================================================

    const handleDeleteAttribute =
      async () => {
        if (!selectedAttributeData) {
          return;
        }

        try {
          setDeleteLoading(true);

          const response =
            await attributesApi.delete(
              selectedAttributeData.id,
            );

          if (response.data.success) {
            toast.success(
              response.data.message ||
              "Attribute deleted successfully.",
            );

            setDeleteAttributeOpen(
              false,
            );

            setSelectedId(null);
            setSelectedAttribute(null);

            await fetchAttributes(
              false,
            );
          } else {
            toast.error(
              response.data.message ||
              "Unable to delete attribute.",
            );
          }
        } catch (error: any) {
          console.error(
            "Delete attribute error:",
            error,
          );

          toast.error(
            error?.response?.data
              ?.message ||
            "Unable to delete attribute.",
          );
        } finally {
          setDeleteLoading(false);
        }
      };

    // =================================================
    // ADD VALUES
    // =================================================

    const handleAddValues = async (
      values: string[],
    ) => {
      if (!selectedAttributeData) {
        return;
      }

      try {
        setActionLoading(true);

        const response =
          await attributesApi.addValues(
            selectedAttributeData.id,
            {
              values,
            },
          );

        if (response.data.success) {
          toast.success(
            response.data.message ||
            "Values added successfully.",
          );

          setAddValuesOpen(false);

          await fetchAttributes();
        } else {
          toast.error(
            response.data.message ||
            "Unable to add values.",
          );
        }
      } catch (error: any) {
        console.error(
          "Add values error:",
          error,
        );

        toast.error(
          error?.response?.data
            ?.message ||
          "Unable to add values.",
        );
      } finally {
        setActionLoading(false);
      }
    };

    // =================================================
    // UPDATE VALUE
    // =================================================

    const handleUpdateValue = async (
      value: string,
      sortOrder: number,
    ) => {
      if (
        !selectedAttributeData ||
        !selectedValue
      ) {
        return;
      }

      try {
        setActionLoading(true);

        const response =
          await attributesApi.updateValue(
            selectedAttributeData.id,
            selectedValue.id,
            {
              value,
              sort_order: sortOrder,
            },
          );

        if (response.data.success) {
          toast.success(
            response.data.message ||
            "Value updated successfully.",
          );

          setEditValueOpen(false);
          setSelectedValue(null);

          await fetchAttributes();
        } else {
          toast.error(
            response.data.message ||
            "Unable to update value.",
          );
        }
      } catch (error: any) {
        console.error(
          "Update value error:",
          error,
        );

        toast.error(
          error?.response?.data
            ?.message ||
          "Unable to update value.",
        );
      } finally {
        setActionLoading(false);
      }
    };

    // =================================================
    // DELETE VALUE
    // =================================================

    const handleDeleteValue =
      async () => {
        if (
          !selectedAttributeData ||
          !selectedValue
        ) {
          return;
        }

        try {
          setDeleteLoading(true);

          const response =
            await attributesApi.deleteValue(
              selectedAttributeData.id,
              selectedValue.id,
            );

          if (response.data.success) {
            toast.success(
              response.data.message ||
              "Value deleted successfully.",
            );

            setDeleteValueOpen(false);
            setSelectedValue(null);

            await fetchAttributes();
          } else {
            toast.error(
              response.data.message ||
              "Unable to delete value.",
            );
          }
        } catch (error: any) {
          console.error(
            "Delete value error:",
            error,
          );

          toast.error(
            error?.response?.data
              ?.message ||
            "Unable to delete value.",
          );
        } finally {
          setDeleteLoading(false);
        }
      };

    // =================================================
    // PAGINATION HELPERS
    // =================================================

    const attributePages =
      Array.from(
        {
          length:
            attributeTotalPages,
        },
        (_, index) =>
          index + 1,
      ).slice(
        Math.max(
          0,
          currentPage - 3,
        ),
        Math.max(
          5,
          currentPage + 2,
        ),
      );

    const valuePages = Array.from(
      {
        length:
          valueTotalPages,
      },
      (_, index) =>
        index + 1,
    ).slice(
      Math.max(
        0,
        valueCurrentPage - 3,
      ),
      Math.max(
        5,
        valueCurrentPage + 2,
      ),
    );

    // ===================================================
    // LOADING STATE
    // ===================================================

    if (permissionsLoading) {
      return <PermissionLoadingState />;
    }

    // ===================================================
    // ACCESS DENIED
    // ===================================================

    if (!canViewAttributes) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#F4F8FD] p-4 font-poppins">
          <div className="max-w-md rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#C23B32]">
              <FiAlertCircle size={26} />
            </div>

            <h2 className="text-lg font-bold text-[#111827]">
              Access Denied
            </h2>

            <p className="mt-2 text-sm text-[#6B7280]">
              You don't have permission
              to access this section.
            </p>
          </div>
        </div>
      );
    }

    // =================================================
    // UI
    // =================================================

    return (
      <>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="min-h-screen bg-white p-4 font-poppins sm:p-5 lg:p-6"
        >
          {/* HEADER */}

          <motion.div
            variants={itemVariants}
            className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
          >
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2D6FE8]" />

                <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]" />

                <span className="h-1.5 w-1.5 rounded-full bg-[#4F8FF7]" />

                <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#2D6FE8]">
                  Product Configuration
                </span>
              </div>

              <h1 className="text-[20px] font-medium tracking-tight text-[#111827] sm:text-[22px]">
                Attributes
              </h1>


              <p className="mt-0.5 text-sm text-[#111827]">
                Manage product attributes and
                their selectable values from one
                place.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* ADD ATTRIBUTE */}

              {canCreateAttribute && (
                <button
                  type="button"
                  onClick={() =>
                    setAddAttributeOpen(
                      true,
                    )
                  }
                  className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-4 text-xs font-semibold text-white  transition hover:-translate-y-0.5"
                >
                  <FiPlus size={16} />
                  Add Attribute
                </button>
              )}

              {/* REFRESH */}

              <button
                type="button"
                onClick={() =>
                  fetchAttributes()
                }
                disabled={loading}
                className="flex h-10 items-center justify-center gap-2 self-start rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] px-4 text-xs font-semibold text-[#111827] transition hover:border-[#2D6FE8]/30 hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiRefreshCw
                  size={15}
                  className={
                    loading
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh
              </button>
            </div>
          </motion.div>

          {/* MAIN MASTER DETAIL */}

          <motion.div
            variants={itemVariants}
            className="overflow-hidden rounded-[18px] border border-[#DCE6F2] bg-white shadow-[0_10px_35px_-24px_rgba(42,65,104,0.35)]"
          >
            <div className="grid min-h-[650px] grid-cols-1 xl:grid-cols-[360px_1fr]">
              {/* LEFT: ATTRIBUTE LIST */}

              <aside className="border-b border-[#DCE6F2] bg-[#F8FBFF] xl:border-b-0 xl:border-r">
                <div className="border-b border-[#DCE6F2] p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-[#111827]">
                        Attributes
                      </h2>

                      <p className="mt-1 text-[10px] text-[#6B7280]">
                        Select an attribute to
                        manage its values.
                      </p>
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2D6FE8]">
                      <FiSettings size={16} />
                    </div>
                  </div>

                  <div className="relative">
                    <FiSearch
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D6FE8]"
                    />

                    <input
                      type="text"
                      value={search}
                      onChange={(event) => {
                        setSearch(
                          event.target.value,
                        );
                        setCurrentPage(1);
                      }}
                      placeholder="Search attributes..."
                      className="h-11 w-full rounded-xl border border-[#D6E2F0] bg-white pl-10 pr-4 text-xs text-[#111827] outline-none placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:ring-2 focus:ring-[#2D6FE8]/15"
                    />
                  </div>
                </div>

                <div className="max-h-[550px] overflow-y-auto">
                  {visibleAttributes.length ===
                    0 ? (
                    <div className="flex flex-col items-center px-5 py-14 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#2D6FE8]">
                        <FiList
                          size={21}
                        />
                      </div>

                      <p className="mt-4 text-sm font-semibold text-[#111827]">
                        No attributes found
                      </p>

                      <p className="mt-1 text-[10px] text-[#6B7280]">
                        Try another search.
                      </p>
                    </div>
                  ) : (
                    visibleAttributes.map(
                      (attribute) => {
                        const selected =
                          attribute.id ===
                          selectedId;

                        return (
                          <button
                            type="button"
                            key={
                              attribute.id
                            }
                            onClick={() => {
                              setSelectedId(
                                attribute.id,
                              );
                              setValueSearch(
                                "",
                              );
                              setValueCurrentPage(
                                1,
                              );
                            }}
                            className={`w-full border-b border-[#DCE6F2] px-4 py-4 text-left transition sm:px-5 ${selected
                                ? "border-l-4 border-l-[#2D6FE8] bg-white"
                                : "hover:bg-white"
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold transition ${selected
                                    ? "bg-[#2D6FE8] text-white"
                                    : "bg-[#EAF3FF] text-[#2D6FE8]"
                                  }`}
                              >
                                {getInitials(
                                  attribute.attribute_key,
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="truncate text-sm font-semibold text-[#111827]">
                                    {
                                      attribute.attribute_key
                                    }
                                  </p>

                                  <span className="shrink-0 rounded-lg bg-[#EAF3FF] px-2 py-1 text-[9px] font-bold text-[#2D6FE8]">
                                    {attribute.values
                                      ?.length ||
                                      0}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      },
                    )
                  )}
                </div>

                {/* LEFT PAGINATION */}

                {filteredAttributes.length >
                  0 && (
                    <div className="border-t border-[#DCE6F2] px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-[#6B7280]">
                          {
                            filteredAttributes.length
                          }{" "}
                          total
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setCurrentPage(
                                (page) =>
                                  Math.max(
                                    1,
                                    page -
                                    1,
                                  ),
                              )
                            }
                            disabled={
                              currentPage ===
                              1
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[#111827] transition hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:opacity-30"
                          >
                            <FiChevronLeft
                              size={13}
                            />
                          </button>

                          {attributePages
                            .slice(0, 5)
                            .map(
                              (page) => (
                                <button
                                  type="button"
                                  key={page}
                                  onClick={() =>
                                    setCurrentPage(
                                      page,
                                    )
                                  }
                                  className={`flex h-7 min-w-7 items-center justify-center rounded-lg px-2 text-[9px] font-bold transition ${page ===
                                      currentPage
                                      ? "bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-white"
                                      : "text-[#111827] hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"
                                    }`}
                                >
                                  {
                                    page
                                  }
                                </button>
                              ),
                            )}

                          <button
                            type="button"
                            onClick={() =>
                              setCurrentPage(
                                (page) =>
                                  Math.min(
                                    attributeTotalPages,
                                    page +
                                    1,
                                  ),
                              )
                            }
                            disabled={
                              currentPage ===
                              attributeTotalPages
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[#111827] transition hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:opacity-30"
                          >
                            <FiChevronRight
                              size={13}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
              </aside>

              {/* RIGHT: VALUES */}

              <section className="min-w-0 bg-white">
                {!selectedAttributeData ? (
                  <div className="flex min-h-[650px] flex-col items-center justify-center px-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                      <FiList
                        size={27}
                      />
                    </div>

                    <h3 className="mt-5 text-lg font-semibold text-[#111827]">
                      Select an Attribute
                    </h3>

                    <p className="mt-1 max-w-sm text-xs leading-5 text-[#6B7280]">
                      Select an attribute from
                      the left side to manage
                      its values.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* DETAIL HEADER */}

                    <div className="border-b border-[#DCE6F2] p-5 sm:p-6">
                      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-sm font-bold text-white">
                            {getInitials(
                              selectedAttributeData.attribute_key,
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="truncate text-xl font-semibold text-[#111827]">
                                {
                                  selectedAttributeData.attribute_key
                                }
                              </h2>
                            </div>

                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-[#6B7280]">
                              <span>
                                {selectedAttributeData.values
                                  ?.length ||
                                  0}{" "}
                                values
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {/* EDIT */}

                          {canUpdateAttribute && (
                            <button
                              type="button"
                              onClick={() =>
                                setEditAttributeOpen(
                                  true,
                                )
                              }
                              className="flex h-9 items-center gap-2 rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] px-3.5 text-[10px] font-semibold text-[#111827] transition hover:border-[#2D6FE8]/30 hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"
                            >
                              <FiEdit2
                                size={14}
                              />
                              Edit
                            </button>
                          )}

                          {/* DELETE */}

                          {canDeleteAttribute && (
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteAttributeOpen(
                                  true,
                                )
                              }
                              className="flex h-9 items-center gap-2 rounded-xl border border-[#C23B32]/20 bg-[#FEF2F2] px-3.5 text-[10px] font-semibold text-[#C23B32] transition hover:bg-[#FDE8E8]"
                            >
                              <FiTrash2
                                size={14}
                              />
                              Delete
                            </button>
                          )}

                          {/* ADD VALUES */}

                          {canUpdateAttribute && (
                            <button
                              type="button"
                              onClick={() =>
                                setAddValuesOpen(
                                  true,
                                )
                              }
                              className="flex h-9 items-center gap-2 rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-4 text-[10px] font-semibold text-white shadow-[0_6px_14px_-6px_rgba(45,111,232,0.55)] transition hover:-translate-y-0.5"
                            >
                              <FiPlus
                                size={14}
                              />
                              Add Values
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* VALUE TOOLBAR */}

                    <div className="border-b border-[#DCE6F2] p-4 sm:p-5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="relative w-full md:max-w-[400px]">
                          <FiSearch
                            size={16}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D6FE8]"
                          />

                          <input
                            type="text"
                            value={
                              valueSearch
                            }
                            onChange={(
                              event,
                            ) =>
                              setValueSearch(
                                event
                                  .target
                                  .value,
                              )
                            }
                            placeholder="Search values..."
                            className="h-10 w-full rounded-xl border border-[#D6E2F0] bg-[#F4F8FD] pl-10 pr-4 text-xs text-[#111827] outline-none placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/15"
                          />
                        </div>

                        <div className="rounded-lg bg-[#EAF3FF] px-3 py-2 text-[10px] font-semibold text-[#2D6FE8]">
                          {
                            filteredValues.length
                          }{" "}
                          value
                          {filteredValues.length !==
                            1
                            ? "s"
                            : ""}
                        </div>
                      </div>
                    </div>

                    {/* VALUES */}

                    <div className="p-4 sm:p-5">
                      {visibleValues.length ===
                        0 ? (
                        <div className="flex min-h-[350px] flex-col items-center justify-center text-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                            <FiHash
                              size={24}
                            />
                          </div>

                          <p className="mt-4 text-sm font-semibold text-[#111827]">
                            No values found
                          </p>

                          <p className="mt-1 max-w-sm text-[10px] text-[#6B7280]">
                            Add values to this
                            attribute using
                            the Add Values
                            button.
                          </p>

                          {canUpdateAttribute && (
                            <button
                              type="button"
                              onClick={() =>
                                setAddValuesOpen(
                                  true,
                                )
                              }
                              className="mt-4 flex h-9 items-center gap-2 rounded-lg bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-4 text-[10px] font-semibold text-white shadow-[0_6px_14px_-6px_rgba(45,111,232,0.55)] transition hover:-translate-y-0.5"
                            >
                              <FiPlus
                                size={14}
                              />
                              Add Values
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[650px] border-collapse">
                            <thead>
                              <tr className="bg-[#4F8FF7]">
                                <th className="w-[80px] px-4 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-white">
                                  S.No.
                                </th>

                                <th className="px-4 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-white">
                                  Value
                                </th>

                                <th className="w-[170px] px-4 py-3.5 text-center text-[9px] font-bold uppercase tracking-[0.12em] text-white">
                                  Updated
                                </th>

                                {(canUpdateAttribute ||
                                  canDeleteAttribute) && (
                                    <th className="w-[130px] px-4 py-3.5 text-center text-[9px] font-bold uppercase tracking-[0.12em] text-white">
                                      Actions
                                    </th>
                                  )}
                              </tr>
                            </thead>

                            <tbody>
                              {visibleValues.map(
                                (
                                  value,
                                  index,
                                ) => (
                                  <motion.tr
                                    key={
                                      value.id
                                    }
                                    initial={{
                                      opacity: 0,
                                      y: 5,
                                    }}
                                    animate={{
                                      opacity: 1,
                                      y: 0,
                                    }}
                                    transition={{
                                      delay:
                                        index *
                                        0.03,
                                    }}
                                    className="border-b border-[#2D6FE8]/10 bg-white transition hover:bg-[#F4F8FD]"
                                  >
                                    <td className="px-4 py-4">
                                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF3FF] text-xs font-bold text-[#2D6FE8]">
                                        {valueStart +
                                          index +
                                          1}
                                      </span>
                                    </td>

                                    <td className="px-4 py-4">
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2D6FE8]">
                                          <FiHash
                                            size={14}
                                          />
                                        </div>

                                        <div>
                                          <p className="text-sm font-semibold text-[#111827]">
                                            {
                                              value.value
                                            }
                                          </p>
                                        </div>
                                      </div>
                                    </td>

                                    <td className="px-4 py-4 text-center">
                                      <span className="text-[10px] font-semibold text-[#111827]">
                                        {formatDate(
                                          value.updated_at,
                                        )}
                                      </span>
                                    </td>

                                    {(canUpdateAttribute ||
                                      canDeleteAttribute) && (
                                        <td className="px-4 py-4">
                                          <div className="flex items-center justify-center gap-1.5">
                                            {canUpdateAttribute && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setSelectedValue(
                                                    value,
                                                  );
                                                  setEditValueOpen(
                                                    true,
                                                  );
                                                }}
                                                title="Edit value"
                                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE6F2] bg-[#F4F8FD] text-[#111827] transition hover:border-[#2D6FE8] hover:bg-[#2D6FE8] hover:text-white"
                                              >
                                                <FiEdit2
                                                  size={13}
                                                />
                                              </button>
                                            )}

                                            {canDeleteAttribute && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setSelectedValue(
                                                    value,
                                                  );
                                                  setDeleteValueOpen(
                                                    true,
                                                  );
                                                }}
                                                title="Delete value"
                                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#C23B32]/20 bg-[#FEF2F2] text-[#C23B32] transition hover:bg-[#C23B32] hover:text-white"
                                              >
                                                <FiTrash2
                                                  size={13}
                                                />
                                              </button>
                                            )}
                                          </div>
                                        </td>
                                      )}
                                  </motion.tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* VALUE PAGINATION */}

                      {filteredValues.length >
                        0 && (
                          <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-[#DCE6F2] pt-4 sm:flex-row">
                            <p className="text-[10px] text-[#6B7280]">
                              Showing{" "}
                              <span className="font-bold text-[#111827]">
                                {valueStart +
                                  1}
                              </span>{" "}
                              to{" "}
                              <span className="font-bold text-[#111827]">
                                {Math.min(
                                  valueStart +
                                  VALUE_ITEMS,
                                  filteredValues.length,
                                )}
                              </span>{" "}
                              of{" "}
                              <span className="font-bold text-[#111827]">
                                {
                                  filteredValues.length
                                }
                              </span>
                            </p>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setValueCurrentPage(
                                    (page) =>
                                      Math.max(
                                        1,
                                        page -
                                        1,
                                      ),
                                  )
                                }
                                disabled={
                                  valueCurrentPage ===
                                  1
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#111827] transition hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:opacity-30"
                              >
                                <FiChevronLeft
                                  size={14}
                                />
                              </button>

                              {valuePages
                                .slice(
                                  0,
                                  5,
                                )
                                .map(
                                  (
                                    page,
                                  ) => (
                                    <button
                                      type="button"
                                      key={
                                        page
                                      }
                                      onClick={() =>
                                        setValueCurrentPage(
                                          page,
                                        )
                                      }
                                      className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[9px] font-bold transition ${valueCurrentPage ===
                                          page
                                          ? "bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-white"
                                          : "text-[#111827] hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"
                                        }`}
                                    >
                                      {
                                        page
                                      }
                                    </button>
                                  ),
                                )}

                              <button
                                type="button"
                                onClick={() =>
                                  setValueCurrentPage(
                                    (page) =>
                                      Math.min(
                                        valueTotalPages,
                                        page +
                                        1,
                                      ),
                                  )
                                }
                                disabled={
                                  valueCurrentPage ===
                                  valueTotalPages
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#111827] transition hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:opacity-30"
                              >
                                <FiChevronRight
                                  size={14}
                                />
                              </button>
                            </div>
                          </div>
                        )}
                    </div>

                    {/* FOOTER INFO */}

                    <div className="border-t border-[#DCE6F2] bg-[#F8FBFF] px-5 py-4 sm:px-6">
                      <div className="flex flex-col justify-between gap-2 text-[10px] sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2 text-[#6B7280]">
                          <FiSettings
                            size={12}
                            className="text-[#2D6FE8]"
                          />

                          <span>
                            Last updated{" "}
                            {formatDate(
                              selectedAttributeData.updated_at,
                            )}
                          </span>
                        </div>

                        <span className="rounded-lg bg-white px-3 py-1.5 font-bold text-[#111827]">
                          {
                            selectedAttributeData.values
                              ?.length ||
                            0
                          }{" "}
                          configured
                          values
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </section>
            </div>
          </motion.div>

          <div className="h-5" />
        </motion.div>

        {/* =================================================
            MODALS
        ================================================= */}

        {canCreateAttribute && (
          <AddAttributeModal
            open={addAttributeOpen}
            loading={actionLoading}
            onClose={() => {
              if (!actionLoading) {
                setAddAttributeOpen(
                  false,
                );
              }
            }}
            onSubmit={
              handleAddAttribute
            }
          />
        )}

        {canUpdateAttribute && (
          <EditAttributeModal
            open={editAttributeOpen}
            loading={actionLoading}
            attribute={
              selectedAttributeData
            }
            onClose={() => {
              if (!actionLoading) {
                setEditAttributeOpen(
                  false,
                );
              }
            }}
            onSubmit={
              handleUpdateAttribute
            }
          />
        )}

        {canUpdateAttribute && (
          <AddValuesModal
            open={addValuesOpen}
            loading={actionLoading}
            attribute={
              selectedAttributeData
            }
            onClose={() => {
              if (!actionLoading) {
                setAddValuesOpen(
                  false,
                );
              }
            }}
            onSubmit={handleAddValues}
          />
        )}

        {canUpdateAttribute && (
          <EditValueModal
            open={editValueOpen}
            loading={actionLoading}
            valueItem={selectedValue}
            onClose={() => {
              if (!actionLoading) {
                setEditValueOpen(
                  false,
                );
                setSelectedValue(null);
              }
            }}
            onSubmit={
              handleUpdateValue
            }
          />
        )}

        {canDeleteAttribute && (
          <>
            <DeleteModal
              open={deleteAttributeOpen}
              loading={deleteLoading}
              title="Delete Attribute"
              description={`Are you sure you want to delete "${selectedAttributeData?.attribute_key ||
                "this attribute"
                }"? Its configured values may also be affected.`}
              onClose={() => {
                if (!deleteLoading) {
                  setDeleteAttributeOpen(
                    false,
                  );
                }
              }}
              onConfirm={
                handleDeleteAttribute
              }
            />

            <DeleteModal
              open={deleteValueOpen}
              loading={deleteLoading}
              title="Delete Attribute Value"
              description={`Are you sure you want to delete "${selectedValue?.value ||
                "this value"
                }"? This action cannot be undone.`}
              onClose={() => {
                if (!deleteLoading) {
                  setDeleteValueOpen(
                    false,
                  );
                  setSelectedValue(null);
                }
              }}
              onConfirm={
                handleDeleteValue
              }
            />
          </>
        )}
      </>
    );
  };

export default AttributesManagement;