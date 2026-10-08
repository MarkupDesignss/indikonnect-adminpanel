import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiEdit2,
  FiMapPin,
  FiPhone,
  FiMail,
  FiClock,
  FiDatabase,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiAlertCircle,
} from "react-icons/fi";

import { motion } from "framer-motion";

import { toast } from "react-hot-toast";

import GlobalModal from "@/components/common/GlobalModal";

import warehousesApi, {
  Warehouse,
  WarehouseCreatePayload,
} from "../../api/endpoints/warehouse";

// ✅ PERMISSIONS
import { usePermissions } from "../permissions/usePermissions";

const containerVariants = {
  hidden: {
    opacity: 0,
  },

  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: {
    y: 12,
    opacity: 0,
  },

  visible: {
    y: 0,
    opacity: 1,

    transition: {
      type: "spring" as const,
      stiffness: 110,
      damping: 16,
    },
  },
};

// =====================================================
// FORM TYPE
// =====================================================

interface WarehouseForm {
  name: string;
  code: string;

  address_line_1: string;
  address_line_2: string;

  city: string;
  state: string;
  pincode: string;
  country: string;

  contact_person: string;
  contact_number: string;
  contact_email: string;

  is_active: boolean;

  total_capacity: number;

  opening_time: string;
  closing_time: string;
}

// =====================================================
// INITIAL FORM
// =====================================================

const INITIAL_FORM: WarehouseForm = {
  name: "",
  code: "",

  address_line_1: "",
  address_line_2: "",

  city: "",
  state: "",
  pincode: "",
  country: "India",

  contact_person: "",
  contact_number: "",
  contact_email: "",

  is_active: true,

  total_capacity: 0,

  opening_time: "09:00",
  closing_time: "18:00",
};

// =====================================================
// HELPERS
// =====================================================

const normalizeTime = (value?: string | null) => {
  if (!value) {
    return "";
  }

  return value.slice(0, 5);
};

// =====================================================
// PERMISSION LOADING STATE
// =====================================================

const PermissionLoadingState: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F8FF] p-6 font-poppins">
      <div className="w-full max-w-md rounded-2xl border border-[#D8E2F0] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
          <FiRefreshCw size={24} className="animate-spin" />
        </div>

        <h2 className="mt-5 text-base font-bold text-[#0F1B3D]">
          Checking permissions...
        </h2>

        <p className="mt-2 text-sm text-[#8C97B2]">
          Please wait while we verify your access.
        </p>
      </div>
    </div>
  );
};

// =====================================================
// COMPONENT
// =====================================================

const Addwarehouse: React.FC = () => {
  // ===================================================
  // ✅ PERMISSIONS
  // ===================================================

  const {
    hasPermission,
    hasModuleAccess,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  const canViewWarehouses = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("warehouse") ||
      hasPermission("warehouse.view"),
    [isSuperAdmin, hasModuleAccess, hasPermission],
  );

  const canCreateWarehouse = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("warehouse.create"),
    [isSuperAdmin, hasPermission],
  );

  const canUpdateWarehouse = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("warehouse.update") ||
      hasPermission("warehouse.edit"),
    [isSuperAdmin, hasPermission],
  );

  // ===================================================
  // LIST
  // ===================================================

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");

  // ===================================================
  // PAGINATION
  // ===================================================

  const ITEMS_PER_PAGE = 15;

  const [currentPage, setCurrentPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  const [totalEntries, setTotalEntries] = useState(0);

  const [startEntry, setStartEntry] = useState(0);

  const [endEntry, setEndEntry] = useState(0);

  // ===================================================
  // CREATE
  // ===================================================

  const [addModalOpen, setAddModalOpen] = useState(false);

  const [addLoading, setAddLoading] = useState(false);

  // ===================================================
  // EDIT
  // ===================================================

  const [editModalOpen, setEditModalOpen] = useState(false);

  const [editLoading, setEditLoading] = useState(false);

  const [selectedWarehouse, setSelectedWarehouse] =
    useState<Warehouse | null>(null);

  // ===================================================
  // FORM
  // ===================================================

  const [form, setForm] = useState<WarehouseForm>(INITIAL_FORM);

  // ===================================================
  // GET WAREHOUSES
  // ===================================================

  const fetchWarehouses = async (page: number = currentPage) => {
    try {
      setLoading(true);

      const response = await warehousesApi.getAll(page, ITEMS_PER_PAGE);

      const pagination = response?.data?.data;

      const list = pagination?.data || [];

      setWarehouses(list);

      setCurrentPage(pagination?.current_page || page);

      setTotalPages(Math.max(pagination?.last_page || 1, 1));

      setTotalEntries(pagination?.total || 0);

      setStartEntry(pagination?.from || 0);

      setEndEntry(pagination?.to || 0);
    } catch (error: any) {
      console.error("Get warehouses error:", error);

      toast.error(
        error?.response?.data?.message || "Unable to fetch warehouses.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // INITIAL FETCH
  // ===================================================

  useEffect(() => {
    if (!permissionsLoading && canViewWarehouses) {
      fetchWarehouses(1);
    }
  }, [permissionsLoading, canViewWarehouses]);

  // ===================================================
  // COUNTS
  // ===================================================

  const activeCount = useMemo(() => {
    return warehouses.filter((item) => Boolean(item.is_active)).length;
  }, [warehouses]);

  const inactiveCount = useMemo(() => {
    return warehouses.filter((item) => !Boolean(item.is_active)).length;
  }, [warehouses]);

  // ===================================================
  // SEARCH
  // ===================================================

  const filteredWarehouses = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return warehouses;
    }

    return warehouses.filter((item) =>
      [
        item.name,
        item.code,
        item.city,
        item.state,
        item.country,
        item.contact_person,
        item.contact_number,
        item.contact_email || "",
        item.address_line_1,
        item.address_line_2 || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [warehouses, search]);

  // ===================================================
  // CHANGE FORM
  // ===================================================

  const updateField = <K extends keyof WarehouseForm>(
    field: K,
    value: WarehouseForm[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // ===================================================
  // RESET
  // ===================================================

  const resetForm = () => {
    setForm(INITIAL_FORM);
  };

  // ===================================================
  // OPEN CREATE
  // ===================================================

  const openCreateModal = () => {
    resetForm();

    setAddModalOpen(true);
  };

  // ===================================================
  // OPEN EDIT
  // ===================================================

  const openEditModal = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);

    setForm({
      name: warehouse.name || "",
      code: warehouse.code || "",

      address_line_1: warehouse.address_line_1 || "",
      address_line_2: warehouse.address_line_2 || "",

      city: warehouse.city || "",
      state: warehouse.state || "",
      pincode: warehouse.pincode || "",
      country: warehouse.country || "India",

      contact_person: warehouse.contact_person || "",
      contact_number: warehouse.contact_number || "",
      contact_email: warehouse.contact_email || "",

      is_active: Boolean(warehouse.is_active),

      total_capacity: Number(warehouse.total_capacity || 0),

      opening_time: normalizeTime(warehouse.opening_time),

      closing_time: normalizeTime(warehouse.closing_time),
    });

    setEditModalOpen(true);
  };

  // ===================================================
  // VALIDATION
  // ===================================================

  const validateForm = () => {
    if (!form.name.trim()) {
      toast.error("Warehouse name is required.");
      return false;
    }

    if (!form.code.trim()) {
      toast.error("Warehouse code is required.");
      return false;
    }

    if (!form.address_line_1.trim()) {
      toast.error("Address Line 1 is required.");
      return false;
    }

    if (!form.city.trim()) {
      toast.error("City is required.");
      return false;
    }

    if (!form.state.trim()) {
      toast.error("State is required.");
      return false;
    }

    if (!/^\d{6}$/.test(form.pincode)) {
      toast.error("Pincode must contain 6 digits.");
      return false;
    }

    if (!form.contact_person.trim()) {
      toast.error("Contact person is required.");
      return false;
    }

    if (!/^\d{10}$/.test(form.contact_number)) {
      toast.error("Contact number must contain 10 digits.");
      return false;
    }

    if (
      form.contact_email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email)
    ) {
      toast.error("Please enter a valid email address.");
      return false;
    }

    if (Number(form.total_capacity) < 0) {
      toast.error("Capacity cannot be negative.");
      return false;
    }

    if (!form.opening_time) {
      toast.error("Opening time is required.");
      return false;
    }

    if (!form.closing_time) {
      toast.error("Closing time is required.");
      return false;
    }

    return true;
  };

  // ===================================================
  // BUILD PAYLOAD
  // ===================================================

  const buildPayload = (): WarehouseCreatePayload => {
    return {
      name: form.name.trim(),
      code: form.code.trim(),

      address_line_1: form.address_line_1.trim(),

      address_line_2: form.address_line_2.trim(),

      city: form.city.trim(),

      state: form.state.trim(),

      pincode: form.pincode.trim(),

      country: form.country.trim() || "India",

      contact_person: form.contact_person.trim(),

      contact_number: form.contact_number.trim(),

      contact_email: form.contact_email.trim(),

      is_active: Boolean(form.is_active),

      total_capacity: Number(form.total_capacity) || 0,

      opening_time: normalizeTime(form.opening_time),

      closing_time: normalizeTime(form.closing_time),
    };
  };

  // ===================================================
  // CREATE
  // ===================================================

  const handleCreateWarehouse = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setAddLoading(true);

      const response = await warehousesApi.create(buildPayload());

      toast.success(
        response?.data?.message || "Warehouse created successfully.",
      );

      setAddModalOpen(false);

      resetForm();

      await fetchWarehouses(currentPage);
    } catch (error: any) {
      console.error("Create warehouse error:", error);

      toast.error(
        error?.response?.data?.message || "Unable to create warehouse.",
      );
    } finally {
      setAddLoading(false);
    }
  };

  // ===================================================
  // UPDATE
  // ===================================================

  const handleUpdateWarehouse = async () => {
    if (!selectedWarehouse) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setEditLoading(true);

      const response = await warehousesApi.update(
        selectedWarehouse.id,
        buildPayload(),
      );

      toast.success(
        response?.data?.message || "Warehouse updated successfully.",
      );

      setEditModalOpen(false);

      setSelectedWarehouse(null);

      resetForm();

      await fetchWarehouses(currentPage);
    } catch (error: any) {
      console.error("Update warehouse error:", error);

      toast.error(
        error?.response?.data?.message || "Unable to update warehouse.",
      );
    } finally {
      setEditLoading(false);
    }
  };

  // ===================================================
  // PAGE CHANGE
  // ===================================================

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }

    setCurrentPage(page);

    fetchWarehouses(page);
  };

  // ===================================================
  // PAGE NUMBERS
  // ===================================================

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];

    const start = Math.max(1, currentPage - 2);

    const end = Math.min(totalPages, currentPage + 2);

    for (let page = start; page <= end; page++) {
      pages.push(page);
    }

    return pages;
  }, [currentPage, totalPages]);

  // ===================================================
  // CLOSE ADD
  // ===================================================

  const closeAddModal = () => {
    if (addLoading) {
      return;
    }

    setAddModalOpen(false);

    resetForm();
  };

  // ===================================================
  // CLOSE EDIT
  // ===================================================

  const closeEditModal = () => {
    if (editLoading) {
      return;
    }

    setEditModalOpen(false);

    setSelectedWarehouse(null);

    resetForm();
  };

  // ===================================================
  // INPUT COMPONENT — NAVY THEME
  // ===================================================

  const InputField = ({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    required = false,
  }: {
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    required?: boolean;
  }) => {
    return (
      <div>
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#4A5778]">
          {label}

          {required && <span className="ml-1 text-[#C23B32]">*</span>}
        </label>

        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-full rounded-lg border border-[#D8E2F0] bg-[#F5F8FF] px-3 text-xs text-[#0F1B3D] outline-none transition-all placeholder:text-[#8C97B2] focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/10"
        />
      </div>
    );
  };

  // ===================================================
  // TOGGLE — NAVY THEME
  // ===================================================

  const ToggleField = ({
    label,
    checked,
    onChange,
    description,
  }: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    description: string;
  }) => {
    return (
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="flex w-full items-center justify-between rounded-lg border border-[#D8E2F0] bg-[#F5F8FF] px-3 py-2.5 text-left transition hover:border-[#1E3A8A]/30 hover:bg-[#EAF1FF]"
      >
        <div className="pr-4">
          <div className="text-xs font-bold text-[#0F1B3D]">{label}</div>

          <div className="mt-0.5 text-[10px] leading-4 text-[#8C97B2]">
            {description}
          </div>
        </div>

        <div
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
            checked
              ? "bg-gradient-to-r from-[#1E40AF] to-[#1E3A8A]"
              : "bg-[#D8E2F0]"
          }`}
        >
          <span
            className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
              checked ? "left-6" : "left-1"
            }`}
          />
        </div>
      </button>
    );
  };

  // ===================================================
  // FORM — NAVY THEME
  // ===================================================

  const renderWarehouseForm = (editMode: boolean) => {
    const submitting = editMode ? editLoading : addLoading;

    return (
      <div className="w-full max-w-[880px] overflow-hidden rounded-[22px] bg-white shadow-2xl font-poppins">
        {/* MODAL HEADER */}

        <div className="relative border-b border-[#E3E9F5] px-5 py-3.5">
          <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1E3A8A]" />

          <div className="flex items-start justify-between gap-4 pt-1">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1E3A8A]" />

                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#2563EB]">
                  Inventory Management
                </span>
              </div>

              <h2 className="text-[18px] font-bold tracking-tight text-[#0F1B3D]">
                {editMode ? "Edit Warehouse" : "Create Warehouse"}
              </h2>

              <p className="mt-0.5 text-[10px] leading-4 text-[#4A5778]">
                {editMode
                  ? "Update warehouse details, capacity and operating settings."
                  : "Add a new warehouse with complete location and contact details."}
              </p>
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={editMode ? closeEditModal : closeAddModal}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F8FF] text-[#4A5778] transition hover:bg-[#EAF1FF] hover:text-[#1E3A8A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiX size={14} />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}

        <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-5 py-4">
          {/* BASIC INFORMATION */}

          <div className="mb-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#EAF1FF] text-[#1E3A8A]">
                <FiDatabase size={12} />
              </div>

              <div>
                <div className="text-[11px] font-bold text-[#0F1B3D]">
                  Basic Information
                </div>

                <div className="text-[9px] text-[#8C97B2]">
                  Warehouse name and unique code
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              <InputField
                label="Warehouse Name"
                required
                value={form.name}
                onChange={(value) => updateField("name", value)}
                placeholder="Noida Main Warehouse"
              />

              <InputField
                label="Warehouse Code"
                required
                value={form.code}
                onChange={(value) => updateField("code", value.toUpperCase())}
                placeholder="WH-NOI-001"
              />
            </div>
          </div>

          {/* ADDRESS */}

          <div className="mb-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#EAF1FF] text-[#1E3A8A]">
                <FiMapPin size={12} />
              </div>

              <div>
                <div className="text-[11px] font-bold text-[#0F1B3D]">
                  Address
                </div>

                <div className="text-[9px] text-[#8C97B2]">
                  Complete warehouse location
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <InputField
                label="Address Line 1"
                required
                value={form.address_line_1}
                onChange={(value) => updateField("address_line_1", value)}
                placeholder="Plot No. 25, Sector 63"
              />

              <InputField
                label="Address Line 2"
                value={form.address_line_2}
                onChange={(value) => updateField("address_line_2", value)}
                placeholder="Near Fortis Hospital"
              />

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                <InputField
                  label="City"
                  required
                  value={form.city}
                  onChange={(value) => updateField("city", value)}
                  placeholder="Noida"
                />

                <InputField
                  label="State"
                  required
                  value={form.state}
                  onChange={(value) => updateField("state", value)}
                  placeholder="Uttar Pradesh"
                />

                <InputField
                  label="Pincode"
                  required
                  value={form.pincode}
                  onChange={(value) =>
                    updateField(
                      "pincode",
                      value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                  placeholder="201301"
                />

                <InputField
                  label="Country"
                  required
                  value={form.country}
                  onChange={(value) => updateField("country", value)}
                  placeholder="India"
                />
              </div>
            </div>
          </div>

          {/* CONTACT */}

          <div className="mb-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#EAF1FF] text-[#1E3A8A]">
                <FiPhone size={12} />
              </div>

              <div>
                <div className="text-[11px] font-bold text-[#0F1B3D]">
                  Contact Details
                </div>

                <div className="text-[9px] text-[#8C97B2]">
                  Primary warehouse contact
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
              <InputField
                label="Contact Person"
                required
                value={form.contact_person}
                onChange={(value) => updateField("contact_person", value)}
                placeholder="Rahul Sharma"
              />

              <InputField
                label="Contact Number"
                required
                value={form.contact_number}
                onChange={(value) =>
                  updateField(
                    "contact_number",
                    value.replace(/\D/g, "").slice(0, 10),
                  )
                }
                placeholder="9876543210"
              />

              <div>
                <InputField
                  label="Contact Email"
                  value={form.contact_email}
                  onChange={(value) => updateField("contact_email", value)}
                  placeholder="rahul@company.com"
                  type="email"
                />
              </div>
            </div>
          </div>

          {/* OPERATING DETAILS */}

          <div className="mb-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#EAF1FF] text-[#1E3A8A]">
                <FiClock size={12} />
              </div>

              <div>
                <div className="text-[11px] font-bold text-[#0F1B3D]">
                  Operating Details
                </div>

                <div className="text-[9px] text-[#8C97B2]">
                  Capacity and business hours
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <InputField
                label="Total Capacity"
                value={form.total_capacity}
                onChange={(value) =>
                  updateField(
                    "total_capacity",
                    Number(value.replace(/\D/g, "")) || 0,
                  )
                }
                placeholder="10000"
                type="number"
              />

              <InputField
                label="Opening Time"
                value={form.opening_time}
                onChange={(value) => updateField("opening_time", value)}
                type="time"
              />

              <InputField
                label="Closing Time"
                value={form.closing_time}
                onChange={(value) => updateField("closing_time", value)}
                type="time"
              />
            </div>
          </div>

          {/* SETTINGS */}

          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#EAF1FF] text-[#1E3A8A]">
                <FiDatabase size={12} />
              </div>

              <div>
                <div className="text-[11px] font-bold text-[#0F1B3D]">
                  Warehouse Settings
                </div>

                <div className="text-[9px] text-[#8C97B2]">
                  Active configuration
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <ToggleField
                label="Active Warehouse"
                checked={form.is_active}
                onChange={(value) => updateField("is_active", value)}
                description="Warehouse can be used for inventory operations."
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}

        <div className="flex flex-col-reverse gap-2 border-t border-[#E3E9F5] bg-[#FAFBFF] px-5 py-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={submitting}
            onClick={editMode ? closeEditModal : closeAddModal}
            className="h-9 rounded-lg border border-[#D8E2F0] bg-white px-5 text-xs font-bold text-[#4A5778] transition hover:bg-[#F5F8FF] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={
              editMode ? handleUpdateWarehouse : handleCreateWarehouse
            }
            className="flex h-9 items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] px-6 text-xs font-bold text-white shadow-[0_8px_18px_-8px_rgba(30,58,138,0.55)] transition hover:shadow-[0_10px_22px_-8px_rgba(30,58,138,0.65)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && (
              <FiRefreshCw size={13} className="animate-spin" />
            )}

            {submitting
              ? editMode
                ? "Updating..."
                : "Creating..."
              : editMode
                ? "Update Warehouse"
                : "Create Warehouse"}
          </button>
        </div>
      </div>
    );
  };

  // ===================================================
  // ✅ LOADING STATE (only once, at top level)
  // ===================================================

  if (permissionsLoading) {
    return <PermissionLoadingState />;
  }

  // ===================================================
  // ✅ ACCESS DENIED
  // ===================================================

  if (!canViewWarehouses) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8FF] p-4 font-poppins">
        <div className="max-w-md rounded-2xl border border-[#E3E9F5] bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBEAEA] text-[#C23B32]">
            <FiAlertCircle size={26} />
          </div>
          <h2 className="text-lg font-bold text-[#0F1B3D]">Access Denied</h2>
          <p className="mt-2 text-sm text-[#6B7896]">
            You don't have permission to access this section.
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <motion.div
      className="min-h-screen bg-[#F5F8FF] p-4 font-poppins sm:p-5 lg:p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* HEADER */}

      <motion.div
        variants={itemVariants}
        className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center"
      >
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1E3A8A]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />

            <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#2563EB]">
              Inventory Management
            </span>
          </div>

          <h1 className="text-[28px] font-bold tracking-tight text-[#0F1B3D] sm:text-[32px]">
            Warehouses
          </h1>

          <p className="mt-1.5 max-w-2xl text-xs leading-5 text-[#4A5778]">
            Manage your warehouse locations, capacity, contacts and operating
            settings from one place.
          </p>
        </div>

        {/* SUMMARY */}

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="rounded-xl border border-[#1E3A8A]/10 bg-white px-4 py-2.5 shadow-sm">
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#8C97B2]">
              Total Warehouses
            </div>

            <div className="mt-0.5 text-lg font-bold text-[#0F1B3D]">
              {totalEntries}
            </div>
          </div>

          <div className="rounded-xl border border-[#1E3A8A]/10 bg-white px-4 py-2.5 shadow-sm">
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#2563EB]">
              Active
            </div>

            <div className="mt-0.5 text-lg font-bold text-[#1E3A8A]">
              {activeCount}
            </div>
          </div>

          <div className="rounded-xl border border-[#C23B32]/15 bg-white px-4 py-2.5 shadow-sm">
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#C23B32]">
              Inactive
            </div>

            <div className="mt-0.5 text-lg font-bold text-[#C23B32]">
              {inactiveCount}
            </div>
          </div>
        </div>
      </motion.div>

      {/* SEARCH / ACTION */}

      <motion.div
        variants={itemVariants}
        className="relative mb-5 overflow-hidden rounded-[22px] border border-[#E3E9F5] bg-white p-4 shadow-[0_8px_30px_rgba(30,58,138,0.06)] sm:p-5"
      >
        <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1E3A8A]" />

        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full border border-[#1E3A8A]/10" />

        <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full border border-[#1E3A8A]/10" />

        <div className="pointer-events-none absolute right-8 top-8 h-3 w-3 rounded-full bg-[#FACC15]/30" />

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-[560px]">
            <FiSearch
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1E3A8A]"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search warehouses, codes, cities or contacts..."
              className="h-11 w-full rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] pl-10 pr-4 text-xs text-[#0F1B3D] outline-none transition-all placeholder:text-[#8C97B2] focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/10"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* REFRESH */}

            <motion.button
              type="button"
              disabled={loading}
              onClick={() => fetchWarehouses(currentPage)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#1E3A8A]/15 bg-[#F5F8FF] px-4 text-xs font-bold text-[#1E3A8A] shadow-sm transition hover:bg-[#EAF1FF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiRefreshCw
                size={14}
                className={loading ? "animate-spin" : ""}
              />

              Refresh
            </motion.button>

            {/* ✅ ADD — permission based */}

            {canCreateWarehouse && (
              <motion.button
                type="button"
                onClick={openCreateModal}
                whileHover={{
                  y: -2,
                  boxShadow: "0 10px 22px rgba(30,58,138,0.18)",
                }}
                whileTap={{ scale: 0.97 }}
                className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] px-5 text-xs font-bold text-white shadow-[0_8px_18px_-8px_rgba(30,58,138,0.55)] transition"
              >
                <FiPlus size={15} />

                <span>Add Warehouse</span>
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* TABLE */}

      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-[22px] border border-[#E3E9F5] bg-white shadow-[0_8px_30px_rgba(30,58,138,0.06)]"
      >
        <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1E3A8A]" />

        <div className="overflow-x-auto pt-[3px]">
          <table className="min-w-[1180px] w-full">
            <thead>
              <tr className="border-b border-[#E3E9F5] bg-[#FAFBFF]">
                <th className="px-5 py-4 text-left text-[9px] font-bold uppercase tracking-[0.14em] text-[#8C97B2]">
                  Warehouse
                </th>

                <th className="px-4 py-4 text-left text-[9px] font-bold uppercase tracking-[0.14em] text-[#8C97B2]">
                  Location
                </th>

                <th className="px-4 py-4 text-left text-[9px] font-bold uppercase tracking-[0.14em] text-[#8C97B2]">
                  Contact
                </th>

                <th className="px-4 py-4 text-left text-[9px] font-bold uppercase tracking-[0.14em] text-[#8C97B2]">
                  Capacity
                </th>

                <th className="px-4 py-4 text-left text-[9px] font-bold uppercase tracking-[0.14em] text-[#8C97B2]">
                  Working Hours
                </th>

                <th className="px-4 py-4 text-left text-[9px] font-bold uppercase tracking-[0.14em] text-[#8C97B2]">
                  Status
                </th>

                {canUpdateWarehouse && (
                  <th className="px-5 py-4 text-right text-[9px] font-bold uppercase tracking-[0.14em] text-[#8C97B2]">
                    Action
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {/* LOADING */}

              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="border-b border-[#EEF2FA]">
                    {Array.from({
                      length: canUpdateWarehouse ? 7 : 6,
                    }).map((__, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-4">
                        <div className="h-10 animate-pulse rounded-lg bg-[#F0F3FA]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredWarehouses.length === 0 ? (
                /* EMPTY */

                <tr>
                  <td
                    colSpan={canUpdateWarehouse ? 7 : 6}
                    className="px-5 py-14 text-center"
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF1FF] text-[#1E3A8A]">
                      <FiDatabase size={19} />
                    </div>

                    <div className="mt-3 text-sm font-bold text-[#0F1B3D]">
                      No warehouses found
                    </div>

                    <div className="mt-1 text-xs text-[#8C97B2]">
                      {search
                        ? "Try another search term."
                        : "Create your first warehouse to get started."}
                    </div>
                  </td>
                </tr>
              ) : (
                /* DATA */

                filteredWarehouses.map((warehouse) => (
                  <motion.tr
                    key={warehouse.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-[#EEF2FA] transition hover:bg-[#FAFBFF]"
                  >
                    {/* WAREHOUSE */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
                          <FiDatabase size={16} />
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-[#0F1B3D]">
                            {warehouse.name}
                          </div>

                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="rounded-md bg-[#F5F8FF] px-2 py-0.5 text-[9px] font-bold text-[#4A5778]">
                              {warehouse.code}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* LOCATION */}

                    <td className="px-4 py-4">
                      <div className="flex items-start gap-2">
                        <FiMapPin
                          size={13}
                          className="mt-0.5 shrink-0 text-[#1E3A8A]"
                        />

                        <div>
                          <div className="text-xs font-semibold text-[#0F1B3D]">
                            {warehouse.city}, {warehouse.state}
                          </div>

                          <div className="mt-0.5 max-w-[220px] text-[10px] leading-4 text-[#8C97B2]">
                            {warehouse.address_line_1}
                          </div>

                          {warehouse.address_line_2 && (
                            <div className="text-[10px] leading-4 text-[#8C97B2]">
                              {warehouse.address_line_2}
                            </div>
                          )}

                          <div className="mt-1 text-[9px] font-semibold text-[#4A5778]">
                            PIN: {warehouse.pincode}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* CONTACT */}

                    <td className="px-4 py-4">
                      <div className="text-xs font-semibold text-[#0F1B3D]">
                        {warehouse.contact_person}
                      </div>

                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#4A5778]">
                        <FiPhone size={11} className="text-[#1E3A8A]" />

                        {warehouse.contact_number}
                      </div>

                      {warehouse.contact_email && (
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#8C97B2]">
                          <FiMail size={11} className="text-[#1E3A8A]" />

                          <span className="max-w-[170px] truncate">
                            {warehouse.contact_email}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* CAPACITY */}

                    <td className="px-4 py-4">
                      <div className="text-xs font-bold text-[#0F1B3D]">
                        {Number(warehouse.total_capacity || 0).toLocaleString(
                          "en-IN",
                        )}
                      </div>

                      <div className="mt-1 text-[9px] uppercase tracking-[0.1em] text-[#8C97B2]">
                        Units
                      </div>
                    </td>

                    {/* HOURS */}

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F8FF] text-[#1E3A8A]">
                          <FiClock size={13} />
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-[#0F1B3D]">
                            {normalizeTime(warehouse.opening_time)}
                            {" - "}
                            {normalizeTime(warehouse.closing_time)}
                          </div>

                          <div className="mt-0.5 text-[9px] text-[#8C97B2]">
                            Operating Hours
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* STATUS */}

                    <td className="px-4 py-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${
                            warehouse.is_active
                              ? "bg-[#EAF1FF] text-[#1E3A8A]"
                              : "bg-[#FBEAEA] text-[#C23B32]"
                          }`}
                        >
                          {warehouse.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>

                    {/* ACTION — permission based */}

                    {canUpdateWarehouse && (
                      <td className="px-5 py-4 text-right">
                        <motion.button
                          type="button"
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => openEditModal(warehouse)}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#1E3A8A]/15 bg-[#F5F8FF] px-3 text-[10px] font-bold text-[#1E3A8A] transition hover:border-[#1E3A8A]/25 hover:bg-[#EAF1FF]"
                        >
                          <FiEdit2 size={12} />

                          Edit
                        </motion.button>
                      </td>
                    )}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}

        <div className="flex flex-col gap-3 border-t border-[#E3E9F5] bg-[#FAFBFF] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="text-[10px] text-[#8C97B2]">
            Showing <span className="font-bold text-[#4A5778]">{startEntry}</span>{" "}
            to <span className="font-bold text-[#4A5778]">{endEntry}</span> of{" "}
            <span className="font-bold text-[#4A5778]">{totalEntries}</span>{" "}
            warehouses
          </div>

          <div className="flex items-center gap-1.5">
            {/* PREVIOUS */}

            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => handlePageChange(currentPage - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E2F0] bg-white text-[#4A5778] transition hover:border-[#1E3A8A]/20 hover:bg-[#EAF1FF] hover:text-[#1E3A8A] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiChevronLeft size={14} />
            </button>

            {/* PAGE NUMBERS */}

            {pageNumbers.map((page) => (
              <button
                type="button"
                key={page}
                disabled={loading}
                onClick={() => handlePageChange(page)}
                className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[10px] font-bold transition ${
                  page === currentPage
                    ? "bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] text-white shadow-sm"
                    : "border border-[#D8E2F0] bg-white text-[#4A5778] hover:bg-[#EAF1FF] hover:text-[#1E3A8A]"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {page}
              </button>
            ))}

            {/* NEXT */}

            <button
              type="button"
              disabled={currentPage >= totalPages || loading}
              onClick={() => handlePageChange(currentPage + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E2F0] bg-white text-[#4A5778] transition hover:border-[#1E3A8A]/20 hover:bg-[#EAF1FF] hover:text-[#1E3A8A] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiChevronRight size={14} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ✅ CREATE MODAL — permission based */}

      {canCreateWarehouse && (
        <GlobalModal
          isOpen={addModalOpen}
          onClose={closeAddModal}
          closeOnOverlayClick={!addLoading}
        >
          {renderWarehouseForm(false)}
        </GlobalModal>
      )}

      {/* ✅ EDIT MODAL — permission based */}

      {canUpdateWarehouse && (
        <GlobalModal
          isOpen={editModalOpen}
          onClose={closeEditModal}
          closeOnOverlayClick={!editLoading}
        >
          {renderWarehouseForm(true)}
        </GlobalModal>
      )}

      <div className="h-5" />
    </motion.div>
  );
};

export default Addwarehouse;