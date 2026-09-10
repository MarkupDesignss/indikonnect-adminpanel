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
// THEME (GREEN)
// =====================================================

const PAGE_BG = "#f5f7f5";
const GREEN = "#163F20";
const GREEN_DARK = "#0F3219";
const GREEN_SOFT = "#4C8A57";
const GREEN_LIGHT = "#EAF3EA";

// =====================================================
// ANIMATION (simplified)
// =====================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
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
  if (Number.isNaN(date.getTime())) return value;

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
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return clean || "AT";
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

const DeleteModal: React.FC<DeleteModalProps> = ({
  open,
  title,
  description,
  loading,
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <GlobalModal isOpen={open} onClose={onClose} closeOnOverlayClick={!loading}>
      <div className="w-full max-w-[460px] overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
              <FiAlertTriangle size={21} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                {description}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg bg-red-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <FiRefreshCw size={15} className="animate-spin" />
              ) : (
                <FiTrash2 size={15} />
              )}

              {loading ? "Deleting..." : "Delete"}
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
  onSubmit: (payload: UpdateAttributePayload) => void;
}

const EditAttributeModal: React.FC<EditAttributeModalProps> = ({
  open,
  loading,
  attribute,
  onClose,
  onSubmit,
}) => {
  const [attributeKey, setAttributeKey] = useState("");

  useEffect(() => {
    if (!open || !attribute) return;
    setAttributeKey(attribute.attribute_key || "");
  }, [open, attribute]);

  if (!open || !attribute) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!attributeKey.trim()) {
      toast.error("Attribute key is required.");
      return;
    }

    onSubmit({
      attribute_key: attributeKey.trim(),
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
      <div className="w-full max-w-[500px] overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-5">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF3EA] text-[#163F20]">
                <FiEdit2 size={16} />
              </div>

              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#4C8A57]">
                Attribute Settings
              </span>
            </div>

            <h2 className="text-xl font-semibold text-gray-900">
              Edit Attribute
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Update the attribute name.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5">
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-gray-600">
              Attribute Key
            </label>

            <input
              type="text"
              value={attributeKey}
              onChange={(event) => setAttributeKey(event.target.value)}
              placeholder="color"
              className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition focus:border-[#163F20] focus:bg-white"
            />
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#163F20] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0F3219] disabled:opacity-50"
            >
              {loading ? (
                <FiRefreshCw size={15} className="animate-spin" />
              ) : (
                <FiCheck size={15} />
              )}

              {loading ? "Updating..." : "Update Attribute"}
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

const AddValuesModal: React.FC<AddValuesModalProps> = ({
  open,
  loading,
  attribute,
  onClose,
  onSubmit,
}) => {
  const [valueText, setValueText] = useState("");

  useEffect(() => {
    if (!open) setValueText("");
  }, [open]);

  if (!open || !attribute) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const values = valueText
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);

    const uniqueValues = Array.from(
      new Set(values.map((value) => value.toLowerCase())),
    ).map(
      (lowerValue) =>
        values.find((value) => value.toLowerCase() === lowerValue) ||
        lowerValue,
    );

    if (uniqueValues.length === 0) {
      toast.error("Please enter at least one value.");
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
      <div className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-5">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF3EA] text-[#163F20]">
                <FiPlus size={17} />
              </div>

              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#4C8A57]">
                Attribute Values
              </span>
            </div>

            <h2 className="text-xl font-semibold text-gray-900">Add Values</h2>

            <p className="mt-1 text-xs text-gray-500">
              Add values for{" "}
              <span className="font-semibold text-[#163F20]">
                {attribute.attribute_key}
              </span>
              .
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5">
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-gray-600">
              Values
            </label>

            <textarea
              value={valueText}
              onChange={(event) => setValueText(event.target.value)}
              rows={5}
              className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-sm leading-6 text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#163F20] focus:bg-white"
            />

            <p className="mt-2 text-[10px] leading-5 text-gray-500">
              Enter one value per line or separate values with commas. Duplicate
              values are automatically removed.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#163F20] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0F3219] disabled:opacity-50"
            >
              {loading ? (
                <FiRefreshCw size={15} className="animate-spin" />
              ) : (
                <FiPlus size={15} />
              )}

              {loading ? "Adding..." : "Add Values"}
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
  onSubmit: (value: string, sortOrder: number) => void;
}

const EditValueModal: React.FC<EditValueModalProps> = ({
  open,
  loading,
  valueItem,
  onClose,
  onSubmit,
}) => {
  const [value, setValue] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  useEffect(() => {
    if (!open || !valueItem) return;

    setValue(valueItem.value || "");
    setSortOrder(Number(valueItem.sort_order) || 0);
  }, [open, valueItem]);

  if (!open || !valueItem) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!value.trim()) {
      toast.error("Value is required.");
      return;
    }

    onSubmit(value.trim(), Number(sortOrder) || 0);
  };

  return (
    <GlobalModal
      isOpen={open}
      onClose={() => {
        if (!loading) onClose();
      }}
      closeOnOverlayClick={!loading}
    >
      <div className="w-full max-w-[450px] overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-5">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF3EA] text-[#163F20]">
                <FiEdit2 size={16} />
              </div>

              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#4C8A57]">
                Value Settings
              </span>
            </div>

            <h2 className="text-xl font-semibold text-gray-900">Edit Value</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 p-5">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-gray-600">
                Value
              </label>

              <input
                type="text"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="Black"
                className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none focus:border-[#163F20] focus:bg-white"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#163F20] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0F3219] disabled:opacity-50"
            >
              {loading ? (
                <FiRefreshCw size={15} className="animate-spin" />
              ) : (
                <FiCheck size={15} />
              )}

              {loading ? "Updating..." : "Update Value"}
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
  onSubmit: (payload: CreateAttributePayload) => void;
}

const AddAttributeModal: React.FC<AddAttributeModalProps> = ({
  open,
  loading,
  onClose,
  onSubmit,
}) => {
  const [attributeKey, setAttributeKey] = useState("");

  useEffect(() => {
    if (!open) setAttributeKey("");
  }, [open]);

  if (!open) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!attributeKey.trim()) {
      toast.error("Attribute key is required.");
      return;
    }

    onSubmit({
      attribute_key: attributeKey.trim(),
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
      <div className="w-full max-w-[500px] overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF3EA] text-[#163F20]">
                <FiPlus size={17} />
              </div>

              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#4C8A57]">
                New Attribute
              </span>
            </div>

            <h2 className="text-xl font-semibold text-gray-900">
              Create New Attribute
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Define a new product attribute to organize your inventory.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-600">
                Attribute Key <span className="text-red-500">*</span>
              </label>
              <span className="text-[9px] text-gray-400">
                {attributeKey.length}/50
              </span>
            </div>

            <div className="relative">
              <FiTag
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={attributeKey}
                onChange={(event) => setAttributeKey(event.target.value)}
                placeholder="Enter attribute name (e.g., color, size)"
                maxLength={50}
                className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#163F20] focus:bg-white"
              />
            </div>

            {/* Quick Suggestions */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="mr-1.5 text-[9px] text-gray-500">
                Suggestions:
              </span>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setAttributeKey(suggestion)}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[9px] font-medium text-gray-600 transition hover:border-[#163F20] hover:bg-[#163F20] hover:text-white"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Preview Section */}
            <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <FiTag size={14} className="text-[#163F20]" />
                <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-600">
                  Preview
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EAF3EA] text-sm font-bold text-[#163F20]">
                  {attributeKey ? getInitials(attributeKey) : "?"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {attributeKey || "Attribute Name"}
                  </p>
                  <p className="mt-0.5 text-[9px] text-gray-400">
                    No values configured yet
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#163F20] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0F3219] disabled:opacity-50"
            >
              {loading ? (
                <FiRefreshCw size={15} className="animate-spin" />
              ) : (
                <FiPlus size={16} />
              )}

              {loading ? "Creating..." : "Create Attribute"}
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

const AttributesManagement: React.FC = () => {
  const [attributes, setAttributes] = useState<AttributeMaster[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [valueSearch, setValueSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [valueCurrentPage, setValueCurrentPage] = useState(1);

  const [editAttributeOpen, setEditAttributeOpen] = useState(false);
  const [addValuesOpen, setAddValuesOpen] = useState(false);
  const [editValueOpen, setEditValueOpen] = useState(false);
  const [deleteAttributeOpen, setDeleteAttributeOpen] = useState(false);
  const [deleteValueOpen, setDeleteValueOpen] = useState(false);
  const [addAttributeOpen, setAddAttributeOpen] = useState(false);

  const [selectedAttribute, setSelectedAttribute] =
    useState<AttributeMaster | null>(null);
  const [selectedValue, setSelectedValue] = useState<AttributeValue | null>(
    null,
  );
  const [deleteLoading, setDeleteLoading] = useState(false);

  const ATTRIBUTE_ITEMS = 8;
  const VALUE_ITEMS = 8;

  // =================================================
  // GET ATTRIBUTES
  // =================================================

  const fetchAttributes = async (keepSelection = true) => {
    try {
      setLoading(true);

      const response = await attributesApi.getAll();

      if (response.data.success) {
        const data = response.data.data || [];
        setAttributes(data);

        if (keepSelection) {
          setSelectedId((current) => {
            if (current && data.some((item) => item.id === current)) {
              return current;
            }
            return data[0]?.id ?? null;
          });
        }
      } else {
        toast.error(response.data.message || "Unable to fetch attributes.");
      }
    } catch (error: any) {
      console.error("Fetch attributes error:", error);
      toast.error(
        error?.response?.data?.message || "Unable to fetch attributes.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  // =================================================
  // SELECTED ATTRIBUTE
  // =================================================

  const selectedAttributeData = useMemo(
    () => attributes.find((item) => item.id === selectedId) || null,
    [attributes, selectedId],
  );

  // =================================================
  // FILTER ATTRIBUTES
  // =================================================

  const filteredAttributes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return attributes.filter(
      (item) =>
        !query || [item.attribute_key].join(" ").toLowerCase().includes(query),
    );
  }, [attributes, search]);

  // =================================================
  // ATTRIBUTE PAGINATION
  // =================================================

  const attributeTotalPages = Math.max(
    1,
    Math.ceil(filteredAttributes.length / ATTRIBUTE_ITEMS),
  );

  const attributeStart = (currentPage - 1) * ATTRIBUTE_ITEMS;

  const visibleAttributes = filteredAttributes.slice(
    attributeStart,
    attributeStart + ATTRIBUTE_ITEMS,
  );

  useEffect(() => {
    if (currentPage > attributeTotalPages) {
      setCurrentPage(attributeTotalPages);
    }
  }, [currentPage, attributeTotalPages]);

  // =================================================
  // FILTER VALUES
  // =================================================

  const filteredValues = useMemo(() => {
    if (!selectedAttributeData) return [];

    const query = valueSearch.trim().toLowerCase();

    return (selectedAttributeData.values || []).filter(
      (item) => !query || [item.value].join(" ").toLowerCase().includes(query),
    );
  }, [selectedAttributeData, valueSearch]);

  // =================================================
  // VALUE PAGINATION
  // =================================================

  const valueTotalPages = Math.max(
    1,
    Math.ceil(filteredValues.length / VALUE_ITEMS),
  );

  const valueStart = (valueCurrentPage - 1) * VALUE_ITEMS;

  const visibleValues = filteredValues.slice(
    valueStart,
    valueStart + VALUE_ITEMS,
  );

  useEffect(() => {
    setValueCurrentPage(1);
  }, [selectedId, valueSearch]);

  useEffect(() => {
    if (valueCurrentPage > valueTotalPages) {
      setValueCurrentPage(valueTotalPages);
    }
  }, [valueCurrentPage, valueTotalPages]);

  // =================================================
  // ADD ATTRIBUTE
  // =================================================

  const handleAddAttribute = async (payload: CreateAttributePayload) => {
    try {
      setActionLoading(true);

      const response = await attributesApi.create(payload);

      if (response.data.success) {
        toast.success(
          response.data.message || "Attribute created successfully.",
        );
        setAddAttributeOpen(false);
        await fetchAttributes(false);
      } else {
        toast.error(response.data.message || "Unable to create attribute.");
      }
    } catch (error: any) {
      console.error("Create attribute error:", error);
      toast.error(
        error?.response?.data?.message || "Unable to create attribute.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =================================================
  // EDIT ATTRIBUTE
  // =================================================

  const handleUpdateAttribute = async (payload: UpdateAttributePayload) => {
    if (!selectedAttributeData) return;

    try {
      setActionLoading(true);

      const response = await attributesApi.update(
        selectedAttributeData.id,
        payload,
      );

      if (response.data.success) {
        toast.success(
          response.data.message || "Attribute updated successfully.",
        );
        setEditAttributeOpen(false);
        await fetchAttributes();
      } else {
        toast.error(response.data.message || "Unable to update attribute.");
      }
    } catch (error: any) {
      console.error("Update attribute error:", error);
      toast.error(
        error?.response?.data?.message || "Unable to update attribute.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =================================================
  // DELETE ATTRIBUTE
  // =================================================

  const handleDeleteAttribute = async () => {
    if (!selectedAttributeData) return;

    try {
      setDeleteLoading(true);

      const response = await attributesApi.delete(selectedAttributeData.id);

      if (response.data.success) {
        toast.success(
          response.data.message || "Attribute deleted successfully.",
        );
        setDeleteAttributeOpen(false);
        setSelectedId(null);
        setSelectedAttribute(null);
        await fetchAttributes(false);
      } else {
        toast.error(response.data.message || "Unable to delete attribute.");
      }
    } catch (error: any) {
      console.error("Delete attribute error:", error);
      toast.error(
        error?.response?.data?.message || "Unable to delete attribute.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // =================================================
  // ADD VALUES
  // =================================================

  const handleAddValues = async (values: string[]) => {
    if (!selectedAttributeData) return;

    try {
      setActionLoading(true);

      const response = await attributesApi.addValues(selectedAttributeData.id, {
        values,
      });

      if (response.data.success) {
        toast.success(response.data.message || "Values added successfully.");
        setAddValuesOpen(false);
        await fetchAttributes();
      } else {
        toast.error(response.data.message || "Unable to add values.");
      }
    } catch (error: any) {
      console.error("Add values error:", error);
      toast.error(error?.response?.data?.message || "Unable to add values.");
    } finally {
      setActionLoading(false);
    }
  };

  // =================================================
  // UPDATE VALUE
  // =================================================

  const handleUpdateValue = async (value: string, sortOrder: number) => {
    if (!selectedAttributeData || !selectedValue) return;

    try {
      setActionLoading(true);

      const response = await attributesApi.updateValue(
        selectedAttributeData.id,
        selectedValue.id,
        { value, sort_order: sortOrder },
      );

      if (response.data.success) {
        toast.success(response.data.message || "Value updated successfully.");
        setEditValueOpen(false);
        setSelectedValue(null);
        await fetchAttributes();
      } else {
        toast.error(response.data.message || "Unable to update value.");
      }
    } catch (error: any) {
      console.error("Update value error:", error);
      toast.error(error?.response?.data?.message || "Unable to update value.");
    } finally {
      setActionLoading(false);
    }
  };

  // =================================================
  // DELETE VALUE
  // =================================================

  const handleDeleteValue = async () => {
    if (!selectedAttributeData || !selectedValue) return;

    try {
      setDeleteLoading(true);

      const response = await attributesApi.deleteValue(
        selectedAttributeData.id,
        selectedValue.id,
      );

      if (response.data.success) {
        toast.success(response.data.message || "Value deleted successfully.");
        setDeleteValueOpen(false);
        setSelectedValue(null);
        await fetchAttributes();
      } else {
        toast.error(response.data.message || "Unable to delete value.");
      }
    } catch (error: any) {
      console.error("Delete value error:", error);
      toast.error(error?.response?.data?.message || "Unable to delete value.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // =================================================
  // PAGINATION HELPERS
  // =================================================

  const attributePages = Array.from(
    { length: attributeTotalPages },
    (_, index) => index + 1,
  ).slice(Math.max(0, currentPage - 3), Math.max(5, currentPage + 2));

  const valuePages = Array.from(
    { length: valueTotalPages },
    (_, index) => index + 1,
  ).slice(Math.max(0, valueCurrentPage - 3), Math.max(5, valueCurrentPage + 2));

  // =================================================
  // UI
  // =================================================

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="min-h-screen bg-[#f5f7f5] p-4 sm:p-5 lg:p-6"
      >
        {/* HEADER */}
        <motion.div
          variants={itemVariants}
          className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
        >
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#163F20]" />

              <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#4C8A57]">
                Product Configuration
              </span>
            </div>

            <h1 className="text-[28px] font-semibold tracking-tight text-gray-900 sm:text-[32px]">
              Attributes
            </h1>

            <p className="mt-1.5 max-w-2xl text-xs leading-5 text-gray-500">
              Manage product attributes and their selectable values from one
              place.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAddAttributeOpen(true)}
              className="flex h-10 items-center gap-2 rounded-lg bg-[#163F20] px-4 text-xs font-semibold text-white transition hover:bg-[#0F3219]"
            >
              <FiPlus size={16} />
              Add Attribute
            </button>

            <button
              type="button"
              onClick={() => fetchAttributes()}
              disabled={loading}
              className="flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiRefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* MAIN MASTER DETAIL */}
        <motion.div
          variants={itemVariants}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
        >
          <div className="grid min-h-[650px] grid-cols-1 xl:grid-cols-[360px_1fr]">
            {/* LEFT: ATTRIBUTE LIST */}
            <aside className="border-b border-gray-100 bg-[#FAFBFA] xl:border-b-0 xl:border-r">
              <div className="border-b border-gray-100 p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      Attributes
                    </h2>

                    <p className="mt-1 text-[10px] text-gray-500">
                      Select an attribute to manage its values.
                    </p>
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#163F20]">
                    <FiSettings size={16} />
                  </div>
                </div>

                <div className="relative">
                  <FiSearch
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search attributes..."
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-xs text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#163F20]"
                  />
                </div>
              </div>

              <div className="max-h-[550px] overflow-y-auto">
                {visibleAttributes.length === 0 ? (
                  <div className="flex flex-col items-center px-5 py-14 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#163F20]">
                      <FiList size={21} />
                    </div>

                    <p className="mt-4 text-sm font-semibold text-gray-900">
                      No attributes found
                    </p>

                    <p className="mt-1 text-[10px] text-gray-500">
                      Try another search.
                    </p>
                  </div>
                ) : (
                  visibleAttributes.map((attribute) => {
                    const selected = attribute.id === selectedId;

                    return (
                      <button
                        type="button"
                        key={attribute.id}
                        onClick={() => {
                          setSelectedId(attribute.id);
                          setValueSearch("");
                          setValueCurrentPage(1);
                        }}
                        className={`w-full border-b border-gray-100 px-4 py-4 text-left transition sm:px-5 ${
                          selected
                            ? "border-l-4 border-l-[#163F20] bg-white"
                            : "hover:bg-white/70"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
                              selected
                                ? "bg-[#163F20] text-white"
                                : "bg-white text-[#163F20]"
                            }`}
                          >
                            {getInitials(attribute.attribute_key)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-semibold text-gray-900">
                                {attribute.attribute_key}
                              </p>

                              <span className="shrink-0 rounded-lg bg-gray-100 px-2 py-1 text-[9px] font-bold text-gray-600">
                                {attribute.values?.length || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* LEFT PAGINATION */}
              {filteredAttributes.length > 0 && (
                <div className="border-t border-gray-100 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-gray-500">
                      {filteredAttributes.length} total
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage((page) => Math.max(1, page - 1))
                        }
                        disabled={currentPage === 1}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-gray-600 disabled:opacity-30"
                      >
                        <FiChevronLeft size={13} />
                      </button>

                      {attributePages.slice(0, 5).map((page) => (
                        <button
                          type="button"
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`flex h-7 min-w-7 items-center justify-center rounded-lg px-2 text-[9px] font-bold ${
                            page === currentPage
                              ? "bg-[#163F20] text-white"
                              : "text-gray-600 hover:bg-white"
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage((page) =>
                            Math.min(attributeTotalPages, page + 1),
                          )
                        }
                        disabled={currentPage === attributeTotalPages}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-gray-600 disabled:opacity-30"
                      >
                        <FiChevronRight size={13} />
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
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#163F20]">
                    <FiList size={27} />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-gray-900">
                    Select an Attribute
                  </h3>

                  <p className="mt-1 max-w-sm text-xs leading-5 text-gray-500">
                    Select an attribute from the left side to manage its values.
                  </p>
                </div>
              ) : (
                <>
                  {/* DETAIL HEADER */}
                  <div className="border-b border-gray-100 p-5 sm:p-6">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#163F20] text-sm font-bold text-white">
                          {getInitials(selectedAttributeData.attribute_key)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-xl font-semibold text-gray-900">
                              {selectedAttributeData.attribute_key}
                            </h2>
                          </div>

                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-gray-500">
                            <span>
                              {selectedAttributeData.values?.length || 0} values
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setEditAttributeOpen(true)}
                          className="flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3.5 text-[10px] font-semibold text-gray-700 transition hover:bg-gray-100"
                        >
                          <FiEdit2 size={14} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteAttributeOpen(true)}
                          className="flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 text-[10px] font-semibold text-red-600 transition hover:bg-red-100"
                        >
                          <FiTrash2 size={14} />
                          Delete
                        </button>

                        <button
                          type="button"
                          onClick={() => setAddValuesOpen(true)}
                          className="flex h-9 items-center gap-2 rounded-lg bg-[#163F20] px-4 text-[10px] font-semibold text-white transition hover:bg-[#0F3219]"
                        >
                          <FiPlus size={14} />
                          Add Values
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* VALUE TOOLBAR */}
                  <div className="border-b border-gray-100 p-4 sm:p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="relative w-full md:max-w-[400px]">
                        <FiSearch
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                          type="text"
                          value={valueSearch}
                          onChange={(event) =>
                            setValueSearch(event.target.value)
                          }
                          placeholder="Search values..."
                          className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-xs text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#163F20] focus:bg-white"
                        />
                      </div>

                      <div className="rounded-lg bg-gray-100 px-3 py-2 text-[10px] font-semibold text-gray-600">
                        {filteredValues.length} value
                        {filteredValues.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>

                  {/* VALUES */}
                  <div className="p-4 sm:p-5">
                    {visibleValues.length === 0 ? (
                      <div className="flex min-h-[350px] flex-col items-center justify-center text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#163F20]">
                          <FiHash size={24} />
                        </div>

                        <p className="mt-4 text-sm font-semibold text-gray-900">
                          No values found
                        </p>

                        <p className="mt-1 max-w-sm text-[10px] text-gray-500">
                          Add values to this attribute using the Add Values
                          button.
                        </p>

                        <button
                          type="button"
                          onClick={() => setAddValuesOpen(true)}
                          className="mt-4 flex h-9 items-center gap-2 rounded-lg bg-[#163F20] px-4 text-[10px] font-semibold text-white hover:bg-[#0F3219]"
                        >
                          <FiPlus size={14} />
                          Add Values
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[650px] border-collapse">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="w-[80px] px-4 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-gray-600">
                                S.No.
                              </th>

                              <th className="px-4 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-gray-600">
                                Value
                              </th>

                              <th className="w-[170px] px-4 py-3.5 text-center text-[9px] font-bold uppercase tracking-[0.12em] text-gray-600">
                                Updated
                              </th>

                              <th className="w-[130px] px-4 py-3.5 text-center text-[9px] font-bold uppercase tracking-[0.12em] text-gray-600">
                                Actions
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {visibleValues.map((value, index) => (
                              <motion.tr
                                key={value.id}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className="border-b border-gray-100 bg-white transition hover:bg-gray-50"
                              >
                                <td className="px-4 py-4">
                                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-600">
                                    {valueStart + index + 1}
                                  </span>
                                </td>

                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EAF3EA] text-[#163F20]">
                                      <FiHash size={14} />
                                    </div>

                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">
                                        {value.value}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-4 py-4 text-center">
                                  <span className="text-[10px] font-semibold text-gray-600">
                                    {formatDate(value.updated_at)}
                                  </span>
                                </td>

                                <td className="px-4 py-4">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedValue(value);
                                        setEditValueOpen(true);
                                      }}
                                      title="Edit value"
                                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-600 transition hover:bg-gray-100"
                                    >
                                      <FiEdit2 size={13} />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedValue(value);
                                        setDeleteValueOpen(true);
                                      }}
                                      title="Delete value"
                                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                                    >
                                      <FiTrash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* VALUE PAGINATION */}
                    {filteredValues.length > 0 && (
                      <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-4 sm:flex-row">
                        <p className="text-[10px] text-gray-500">
                          Showing{" "}
                          <span className="font-bold text-gray-700">
                            {valueStart + 1}
                          </span>{" "}
                          to{" "}
                          <span className="font-bold text-gray-700">
                            {Math.min(
                              valueStart + VALUE_ITEMS,
                              filteredValues.length,
                            )}
                          </span>{" "}
                          of{" "}
                          <span className="font-bold text-gray-700">
                            {filteredValues.length}
                          </span>
                        </p>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setValueCurrentPage((page) =>
                                Math.max(1, page - 1),
                              )
                            }
                            disabled={valueCurrentPage === 1}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-30"
                          >
                            <FiChevronLeft size={14} />
                          </button>

                          {valuePages.slice(0, 5).map((page) => (
                            <button
                              type="button"
                              key={page}
                              onClick={() => setValueCurrentPage(page)}
                              className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[9px] font-bold ${
                                valueCurrentPage === page
                                  ? "bg-[#163F20] text-white"
                                  : "text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              {page}
                            </button>
                          ))}

                          <button
                            type="button"
                            onClick={() =>
                              setValueCurrentPage((page) =>
                                Math.min(valueTotalPages, page + 1),
                              )
                            }
                            disabled={valueCurrentPage === valueTotalPages}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-30"
                          >
                            <FiChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FOOTER INFO */}
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 sm:px-6">
                    <div className="flex flex-col justify-between gap-2 text-[10px] sm:flex-row sm:items-center">
                      <div className="flex items-center gap-2 text-gray-500">
                        <FiSettings size={12} className="text-[#163F20]" />

                        <span>
                          Last updated{" "}
                          {formatDate(selectedAttributeData.updated_at)}
                        </span>
                      </div>

                      <span className="rounded-lg bg-white px-3 py-1.5 font-bold text-gray-600">
                        {selectedAttributeData.values?.length || 0} configured
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

      {/* MODALS */}
      <AddAttributeModal
        open={addAttributeOpen}
        loading={actionLoading}
        onClose={() => {
          if (!actionLoading) setAddAttributeOpen(false);
        }}
        onSubmit={handleAddAttribute}
      />

      <EditAttributeModal
        open={editAttributeOpen}
        loading={actionLoading}
        attribute={selectedAttributeData}
        onClose={() => {
          if (!actionLoading) setEditAttributeOpen(false);
        }}
        onSubmit={handleUpdateAttribute}
      />

      <AddValuesModal
        open={addValuesOpen}
        loading={actionLoading}
        attribute={selectedAttributeData}
        onClose={() => {
          if (!actionLoading) setAddValuesOpen(false);
        }}
        onSubmit={handleAddValues}
      />

      <EditValueModal
        open={editValueOpen}
        loading={actionLoading}
        valueItem={selectedValue}
        onClose={() => {
          if (!actionLoading) {
            setEditValueOpen(false);
            setSelectedValue(null);
          }
        }}
        onSubmit={handleUpdateValue}
      />

      <DeleteModal
        open={deleteAttributeOpen}
        loading={deleteLoading}
        title="Delete Attribute"
        description={`Are you sure you want to delete "${selectedAttributeData?.attribute_key || "this attribute"}"? Its configured values may also be affected.`}
        onClose={() => {
          if (!deleteLoading) setDeleteAttributeOpen(false);
        }}
        onConfirm={handleDeleteAttribute}
      />

      <DeleteModal
        open={deleteValueOpen}
        loading={deleteLoading}
        title="Delete Attribute Value"
        description={`Are you sure you want to delete "${selectedValue?.value || "this value"}"? This action cannot be undone.`}
        onClose={() => {
          if (!deleteLoading) {
            setDeleteValueOpen(false);
            setSelectedValue(null);
          }
        }}
        onConfirm={handleDeleteValue}
      />
    </>
  );
};

export default AttributesManagement;
