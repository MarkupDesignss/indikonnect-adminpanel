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
  } from "react-icons/fi";
  
  import { motion } from "framer-motion";
  
  import { toast } from "react-hot-toast";
  
  import GlobalModal from "@/components/common/GlobalModal";
  
  import warehousesApi, {
    Warehouse,
    WarehouseCreatePayload,
  } from "../../api/endpoints/warehouse";
  
  
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
  // COMPONENT
  // =====================================================
  
  const Addwarehouse: React.FC = () => {
    // ===================================================
    // LIST
    // ===================================================
  
    const [warehouses, setWarehouses] = useState<Warehouse[]>(
      []
    );
  
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
  
    const [form, setForm] =
      useState<WarehouseForm>(INITIAL_FORM);
  
    // ===================================================
    // GET WAREHOUSES
    // ===================================================
  
    const fetchWarehouses = async (
      page: number = currentPage
    ) => {
      try {
        setLoading(true);
  
        const response = await warehousesApi.getAll(
          page,
          ITEMS_PER_PAGE
        );
  
        const pagination = response?.data?.data;
  
        const list = pagination?.data || [];
  
        setWarehouses(list);
  
        setCurrentPage(
          pagination?.current_page || page
        );
  
        setTotalPages(
          Math.max(pagination?.last_page || 1, 1)
        );
  
        setTotalEntries(
          pagination?.total || 0
        );
  
        setStartEntry(
          pagination?.from || 0
        );
  
        setEndEntry(
          pagination?.to || 0
        );
      } catch (error: any) {
        console.error(
          "Get warehouses error:",
          error
        );
  
        toast.error(
          error?.response?.data?.message ||
            "Unable to fetch warehouses."
        );
      } finally {
        setLoading(false);
      }
    };
  
    // ===================================================
    // INITIAL FETCH
    // ===================================================
  
    useEffect(() => {
      fetchWarehouses(1);
    }, []);
  
    // ===================================================
    // COUNTS
    // ===================================================
  
    const activeCount = useMemo(() => {
      return warehouses.filter(
        (item) => Boolean(item.is_active)
      ).length;
    }, [warehouses]);
  
    const inactiveCount = useMemo(() => {
      return warehouses.filter(
        (item) => !Boolean(item.is_active)
      ).length;
    }, [warehouses]);
  
    // ===================================================
    // SEARCH
    // ===================================================
  
    const filteredWarehouses = useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();
  
      if (!query) {
        return warehouses;
      }
  
      return warehouses.filter(
        (item) =>
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
            .includes(query)
      );
    }, [warehouses, search]);
  
    // ===================================================
    // CHANGE FORM
    // ===================================================
  
    const updateField = <
      K extends keyof WarehouseForm
    >(
      field: K,
      value: WarehouseForm[K]
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
  
    const openEditModal = (
      warehouse: Warehouse
    ) => {
      setSelectedWarehouse(warehouse);
  
      setForm({
        name: warehouse.name || "",
        code: warehouse.code || "",
  
        address_line_1:
          warehouse.address_line_1 || "",
        address_line_2:
          warehouse.address_line_2 || "",
  
        city: warehouse.city || "",
        state: warehouse.state || "",
        pincode: warehouse.pincode || "",
        country: warehouse.country || "India",
  
        contact_person:
          warehouse.contact_person || "",
        contact_number:
          warehouse.contact_number || "",
        contact_email:
          warehouse.contact_email || "",
  
        is_active: Boolean(
          warehouse.is_active
        ),
  
        total_capacity:
          Number(
            warehouse.total_capacity || 0
          ),
  
        opening_time:
          normalizeTime(
            warehouse.opening_time
          ),
  
        closing_time:
          normalizeTime(
            warehouse.closing_time
          ),
      });
  
      setEditModalOpen(true);
    };
  
    // ===================================================
    // VALIDATION
    // ===================================================
  
    const validateForm = () => {
      if (!form.name.trim()) {
        toast.error(
          "Warehouse name is required."
        );
        return false;
      }
  
      if (!form.code.trim()) {
        toast.error(
          "Warehouse code is required."
        );
        return false;
      }
  
      if (!form.address_line_1.trim()) {
        toast.error(
          "Address Line 1 is required."
        );
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
        toast.error(
          "Pincode must contain 6 digits."
        );
        return false;
      }
  
      if (!form.contact_person.trim()) {
        toast.error(
          "Contact person is required."
        );
        return false;
      }
  
      if (
        !/^\d{10}$/.test(
          form.contact_number
        )
      ) {
        toast.error(
          "Contact number must contain 10 digits."
        );
        return false;
      }
  
      if (
        form.contact_email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          form.contact_email
        )
      ) {
        toast.error(
          "Please enter a valid email address."
        );
        return false;
      }
  
      if (
        Number(form.total_capacity) < 0
      ) {
        toast.error(
          "Capacity cannot be negative."
        );
        return false;
      }
  
      if (!form.opening_time) {
        toast.error(
          "Opening time is required."
        );
        return false;
      }
  
      if (!form.closing_time) {
        toast.error(
          "Closing time is required."
        );
        return false;
      }
  
      return true;
    };
  
    // ===================================================
    // BUILD PAYLOAD
    // ===================================================
  
    const buildPayload =
      (): WarehouseCreatePayload => {
        return {
          name: form.name.trim(),
          code: form.code.trim(),
  
          address_line_1:
            form.address_line_1.trim(),
  
          address_line_2:
            form.address_line_2.trim(),
  
          city: form.city.trim(),
  
          state: form.state.trim(),
  
          pincode: form.pincode.trim(),
  
          country:
            form.country.trim() || "India",
  
          contact_person:
            form.contact_person.trim(),
  
          contact_number:
            form.contact_number.trim(),
  
          contact_email:
            form.contact_email.trim(),
  
          is_active:
            Boolean(form.is_active),
  
          total_capacity:
            Number(form.total_capacity) || 0,
  
          opening_time:
            normalizeTime(
              form.opening_time
            ),
  
          closing_time:
            normalizeTime(
              form.closing_time
            ),
        };
      };
  
    // ===================================================
    // CREATE
    // ===================================================
  
    const handleCreateWarehouse =
      async () => {
        if (!validateForm()) {
          return;
        }
  
        try {
          setAddLoading(true);
  
          const response =
            await warehousesApi.create(
              buildPayload()
            );
  
          toast.success(
            response?.data?.message ||
              "Warehouse created successfully."
          );
  
          setAddModalOpen(false);
  
          resetForm();
  
          await fetchWarehouses(
            currentPage
          );
        } catch (error: any) {
          console.error(
            "Create warehouse error:",
            error
          );
  
          toast.error(
            error?.response?.data?.message ||
              "Unable to create warehouse."
          );
        } finally {
          setAddLoading(false);
        }
      };
  
    // ===================================================
    // UPDATE
    // PUT /warehouses/:id
    // ===================================================
  
    const handleUpdateWarehouse =
      async () => {
        if (!selectedWarehouse) {
          return;
        }
  
        if (!validateForm()) {
          return;
        }
  
        try {
          setEditLoading(true);
  
          const response =
            await warehousesApi.update(
              selectedWarehouse.id,
              buildPayload()
            );
  
          toast.success(
            response?.data?.message ||
              "Warehouse updated successfully."
          );
  
          setEditModalOpen(false);
  
          setSelectedWarehouse(null);
  
          resetForm();
  
          await fetchWarehouses(
            currentPage
          );
        } catch (error: any) {
          console.error(
            "Update warehouse error:",
            error
          );
  
          toast.error(
            error?.response?.data?.message ||
              "Unable to update warehouse."
          );
        } finally {
          setEditLoading(false);
        }
      };
  
    // ===================================================
    // PAGE CHANGE
    // ===================================================
  
    const handlePageChange = (
      page: number
    ) => {
      if (
        page < 1 ||
        page > totalPages ||
        page === currentPage
      ) {
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
  
      const start = Math.max(
        1,
        currentPage - 2
      );
  
      const end = Math.min(
        totalPages,
        currentPage + 2
      );
  
      for (
        let page = start;
        page <= end;
        page++
      ) {
        pages.push(page);
      }
  
      return pages;
    }, [
      currentPage,
      totalPages,
    ]);
  
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
    // INPUT COMPONENT
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
      onChange: (
        value: string
      ) => void;
      placeholder?: string;
      type?: string;
      required?: boolean;
    }) => {
      return (
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#59645C]">
            {label}
  
            {required && (
              <span className="ml-1 text-[#C23B32]">
                *
              </span>
            )}
          </label>
  
          <input
            type={type}
            value={value}
            placeholder={placeholder}
            onChange={(event) =>
              onChange(
                event.target.value
              )
            }
            className="h-9 w-full rounded-lg border border-[#D8E2D8] bg-[#F5F7F5] px-3 text-xs text-[#202721] outline-none transition-all placeholder:text-[#9AA29C] focus:border-[#163F20] focus:bg-white focus:ring-2 focus:ring-[#163F20]/10"
          />
        </div>
      );
    };
  
    // ===================================================
    // TOGGLE
    // ===================================================
  
    const ToggleField = ({
      label,
      checked,
      onChange,
      description,
    }: {
      label: string;
      checked: boolean;
      onChange: (
        checked: boolean
      ) => void;
      description: string;
    }) => {
      return (
        <button
          type="button"
          onClick={() =>
            onChange(!checked)
          }
          className="flex w-full items-center justify-between rounded-lg border border-[#D8E2D8] bg-[#F5F7F5] px-3 py-2.5 text-left transition hover:border-[#163F20]/30 hover:bg-[#EAF3EA]"
        >
          <div className="pr-4">
            <div className="text-xs font-bold text-[#202721]">
              {label}
            </div>
  
            <div className="mt-0.5 text-[10px] leading-4 text-[#9AA29C]">
              {description}
            </div>
          </div>
  
          <div
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              checked
                ? "bg-[#163F20]"
                : "bg-[#C9D1CA]"
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                checked
                  ? "left-6"
                  : "left-1"
              }`}
            />
          </div>
        </button>
      );
    };
  
    // ===================================================
    // FORM
    // ===================================================
  
    const renderWarehouseForm = (
      editMode: boolean
    ) => {
      const submitting = editMode
        ? editLoading
        : addLoading;
  
      return (
        <div className="w-full max-w-[880px] overflow-hidden rounded-[22px] bg-white shadow-2xl">
          {/* MODAL HEADER */}
  
          <div className="relative border-b border-[#E5EAE5] px-5 py-3.5">
            <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#8FC199] via-[#163F20] to-[#0F3219]" />
  
            <div className="flex items-start justify-between gap-4 pt-1">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#163F20]" />
  
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#4C8A57]">
                    Inventory Management
                  </span>
                </div>
  
                <h2 className="text-[18px] font-bold tracking-tight text-[#202721]">
                  {editMode
                    ? "Edit Warehouse"
                    : "Create Warehouse"}
                </h2>
  
                <p className="mt-0.5 text-[10px] leading-4 text-[#59645C]">
                  {editMode
                    ? "Update warehouse details, capacity and operating settings."
                    : "Add a new warehouse with complete location and contact details."}
                </p>
              </div>
  
              <button
                type="button"
                disabled={submitting}
                onClick={
                  editMode
                    ? closeEditModal
                    : closeAddModal
                }
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F7F5] text-[#59645C] transition hover:bg-[#EAF3EA] hover:text-[#163F20] disabled:cursor-not-allowed disabled:opacity-50"
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
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#EAF3EA] text-[#163F20]">
                  <FiDatabase size={12} />
                </div>
  
                <div>
                  <div className="text-[11px] font-bold text-[#202721]">
                    Basic Information
                  </div>
  
                  <div className="text-[9px] text-[#9AA29C]">
                    Warehouse name and unique code
                  </div>
                </div>
              </div>
  
              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                <InputField
                  label="Warehouse Name"
                  required
                  value={form.name}
                  onChange={(value) =>
                    updateField(
                      "name",
                      value
                    )
                  }
                  placeholder="Noida Main Warehouse"
                />
  
                <InputField
                  label="Warehouse Code"
                  required
                  value={form.code}
                  onChange={(value) =>
                    updateField(
                      "code",
                      value.toUpperCase()
                    )
                  }
                  placeholder="WH-NOI-001"
                />
              </div>
            </div>
  
            {/* ADDRESS */}
  
            <div className="mb-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#EAF3EA] text-[#163F20]">
                  <FiMapPin size={12} />
                </div>
  
                <div>
                  <div className="text-[11px] font-bold text-[#202721]">
                    Address
                  </div>
  
                  <div className="text-[9px] text-[#9AA29C]">
                    Complete warehouse location
                  </div>
                </div>
              </div>
  
              <div className="grid grid-cols-1 gap-2.5">
                <InputField
                  label="Address Line 1"
                  required
                  value={
                    form.address_line_1
                  }
                  onChange={(value) =>
                    updateField(
                      "address_line_1",
                      value
                    )
                  }
                  placeholder="Plot No. 25, Sector 63"
                />
  
                <InputField
                  label="Address Line 2"
                  value={
                    form.address_line_2
                  }
                  onChange={(value) =>
                    updateField(
                      "address_line_2",
                      value
                    )
                  }
                  placeholder="Near Fortis Hospital"
                />
  
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  <InputField
                    label="City"
                    required
                    value={form.city}
                    onChange={(value) =>
                      updateField(
                        "city",
                        value
                      )
                    }
                    placeholder="Noida"
                  />
  
                  <InputField
                    label="State"
                    required
                    value={form.state}
                    onChange={(value) =>
                      updateField(
                        "state",
                        value
                      )
                    }
                    placeholder="Uttar Pradesh"
                  />
  
                  <InputField
                    label="Pincode"
                    required
                    value={form.pincode}
                    onChange={(value) =>
                      updateField(
                        "pincode",
                        value
                          .replace(
                            /\D/g,
                            ""
                          )
                          .slice(
                            0,
                            6
                          )
                      )
                    }
                    placeholder="201301"
                  />
  
                  <InputField
                    label="Country"
                    required
                    value={
                      form.country
                    }
                    onChange={(value) =>
                      updateField(
                        "country",
                        value
                      )
                    }
                    placeholder="India"
                  />
                </div>
              </div>
            </div>
  
            {/* CONTACT */}
  
            <div className="mb-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#EAF3EA] text-[#163F20]">
                  <FiPhone size={12} />
                </div>
  
                <div>
                  <div className="text-[11px] font-bold text-[#202721]">
                    Contact Details
                  </div>
  
                  <div className="text-[9px] text-[#9AA29C]">
                    Primary warehouse contact
                  </div>
                </div>
              </div>
  
              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
                <InputField
                  label="Contact Person"
                  required
                  value={
                    form.contact_person
                  }
                  onChange={(value) =>
                    updateField(
                      "contact_person",
                      value
                    )
                  }
                  placeholder="Rahul Sharma"
                />
  
                <InputField
                  label="Contact Number"
                  required
                  value={
                    form.contact_number
                  }
                  onChange={(value) =>
                    updateField(
                      "contact_number",
                      value
                        .replace(
                          /\D/g,
                          ""
                        )
                        .slice(
                          0,
                          10
                        )
                    )
                  }
                  placeholder="9876543210"
                />
  
                <div>
                  <InputField
                    label="Contact Email"
                    value={
                      form.contact_email
                    }
                    onChange={(value) =>
                      updateField(
                        "contact_email",
                        value
                      )
                    }
                    placeholder="rahul@company.com"
                    type="email"
                  />
                </div>
              </div>
            </div>
  
            {/* OPERATING DETAILS */}
  
            <div className="mb-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#EAF3EA] text-[#163F20]">
                  <FiClock size={12} />
                </div>
  
                <div>
                  <div className="text-[11px] font-bold text-[#202721]">
                    Operating Details
                  </div>
  
                  <div className="text-[9px] text-[#9AA29C]">
                    Capacity and business hours
                  </div>
                </div>
              </div>
  
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <InputField
                  label="Total Capacity"
                  value={
                    form.total_capacity
                  }
                  onChange={(value) =>
                    updateField(
                      "total_capacity",
                      Number(
                        value.replace(
                          /\D/g,
                          ""
                        )
                      ) || 0
                    )
                  }
                  placeholder="10000"
                  type="number"
                />
  
                <InputField
                  label="Opening Time"
                  value={
                    form.opening_time
                  }
                  onChange={(value) =>
                    updateField(
                      "opening_time",
                      value
                    )
                  }
                  type="time"
                />
  
                <InputField
                  label="Closing Time"
                  value={
                    form.closing_time
                  }
                  onChange={(value) =>
                    updateField(
                      "closing_time",
                      value
                    )
                  }
                  type="time"
                />
              </div>
            </div>
  
            {/* SETTINGS */}
  
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#EAF3EA] text-[#163F20]">
                  <FiDatabase size={12} />
                </div>
  
                <div>
                  <div className="text-[11px] font-bold text-[#202721]">
                    Warehouse Settings
                  </div>
  
                  <div className="text-[9px] text-[#9AA29C]">
                    Active configuration
                  </div>
                </div>
              </div>
  
              <div className="grid grid-cols-1 gap-2.5">
                <ToggleField
                  label="Active Warehouse"
                  checked={
                    form.is_active
                  }
                  onChange={(value) =>
                    updateField(
                      "is_active",
                      value
                    )
                  }
                  description="Warehouse can be used for inventory operations."
                />
              </div>
            </div>
          </div>
  
          {/* FOOTER */}
  
          <div className="flex flex-col-reverse gap-2 border-t border-[#E5EAE5] bg-[#FCFDFC] px-5 py-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={submitting}
              onClick={
                editMode
                  ? closeEditModal
                  : closeAddModal
              }
              className="h-9 rounded-lg border border-[#D8E2D8] bg-white px-5 text-xs font-bold text-[#59645C] transition hover:bg-[#F5F7F5] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
  
            <button
              type="button"
              disabled={submitting}
              onClick={
                editMode
                  ? handleUpdateWarehouse
                  : handleCreateWarehouse
              }
              className="flex h-9 items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#4C8A57] to-[#163F20] px-6 text-xs font-bold text-white shadow-[0_8px_18px_-8px_rgba(22,63,32,0.55)] transition hover:shadow-[0_10px_22px_-8px_rgba(22,63,32,0.65)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && (
                <FiRefreshCw
                  size={13}
                  className="animate-spin"
                />
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
    // RENDER
    // ===================================================
  
    return (
      <motion.div
        className="min-h-screen bg-[#F5F7F5] p-4 sm:p-5 lg:p-6"
        variants={
          containerVariants
        }
        initial="hidden"
        animate="visible"
      >
        {/* =================================================
            HEADER
        ================================================= */}
  
        <motion.div
          variants={itemVariants}
          className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center"
        >
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#163F20]" />
  
              <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#4C8A57]">
                Inventory Management
              </span>
            </div>
  
            <h1 className="text-[28px] font-bold tracking-tight text-[#202721] sm:text-[32px]">
              Warehouses
            </h1>
  
            <p className="mt-1.5 max-w-2xl text-xs leading-5 text-[#59645C]">
              Manage your warehouse locations,
              capacity, contacts and operating
              settings from one place.
            </p>
          </div>
  
          {/* SUMMARY */}
  
          <div className="flex flex-wrap items-center gap-2.5">
            {/* TOTAL */}
  
            <div className="rounded-xl border border-[#163F20]/10 bg-white px-4 py-2.5 shadow-sm">
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#9AA29C]">
                Total Warehouses
              </div>
  
              <div className="mt-0.5 text-lg font-bold text-[#202721]">
                {totalEntries}
              </div>
            </div>
  
            {/* ACTIVE */}
  
            <div className="rounded-xl border border-[#163F20]/10 bg-white px-4 py-2.5 shadow-sm">
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#4C8A57]">
                Active
              </div>
  
              <div className="mt-0.5 text-lg font-bold text-[#163F20]">
                {activeCount}
              </div>
            </div>
  
            {/* INACTIVE */}
  
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
  
        {/* =================================================
            SEARCH / ACTION
        ================================================= */}
  
        <motion.div
          variants={itemVariants}
          className="relative mb-5 overflow-hidden rounded-[22px] border border-[#E5EAE5] bg-white p-4 shadow-[0_8px_30px_rgba(22,63,32,0.06)] sm:p-5"
        >
          {/* TOP LINE */}
  
          <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#8FC199] via-[#163F20] to-[#0F3219]" />
  
          {/* DECORATION */}
  
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full border border-[#163F20]/10" />
  
          <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full border border-[#163F20]/10" />
  
          <div className="pointer-events-none absolute right-8 top-8 h-3 w-3 rounded-full bg-[#163F20]/10" />
  
          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* SEARCH */}
  
            <div className="relative w-full lg:max-w-[560px]">
              <FiSearch
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#163F20]"
              />
  
              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search warehouses, codes, cities or contacts..."
                className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] pl-10 pr-4 text-xs text-[#202721] outline-none transition-all placeholder:text-[#9AA29C] focus:border-[#163F20] focus:bg-white focus:ring-2 focus:ring-[#163F20]/10"
              />
            </div>
  
            {/* BUTTONS */}
  
            <div className="flex items-center gap-2">
              {/* REFRESH */}
  
              <motion.button
                type="button"
                disabled={loading}
                onClick={() =>
                  fetchWarehouses(
                    currentPage
                  )
                }
                whileHover={{
                  y: -1,
                }}
                whileTap={{
                  scale: 0.97,
                }}
                className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#163F20]/15 bg-[#F5F7F5] px-4 text-xs font-bold text-[#163F20] shadow-sm transition hover:bg-[#EAF3EA] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiRefreshCw
                  size={14}
                  className={
                    loading
                      ? "animate-spin"
                      : ""
                  }
                />
  
                Refresh
              </motion.button>
  
              {/* ADD */}
  
              <motion.button
                type="button"
                onClick={
                  openCreateModal
                }
                whileHover={{
                  y: -2,
                  boxShadow:
                    "0 10px 22px rgba(22,63,32,0.18)",
                }}
                whileTap={{
                  scale: 0.97,
                }}
                className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] px-5 text-xs font-bold text-white shadow-[0_8px_18px_-8px_rgba(22,63,32,0.55)] transition"
              >
                <FiPlus size={15} />
  
                <span>
                  Add Warehouse
                </span>
              </motion.button>
            </div>
          </div>
        </motion.div>
  
        {/* =================================================
            TABLE
        ================================================= */}
  
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-[22px] border border-[#E5EAE5] bg-white shadow-[0_8px_30px_rgba(22,63,32,0.06)]"
        >
          {/* TOP LINE */}
  
          <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#8FC199] via-[#163F20] to-[#0F3219]" />
  
          <div className="overflow-x-auto pt-[3px]">
            <table className="min-w-[1180px] w-full">
              {/* HEAD */}
  
              <thead>
                <tr className="border-b border-[#E5EAE5] bg-[#FCFDFC]">
                  <th className="px-5 py-4 text-left text-[9px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
                    Warehouse
                  </th>
  
                  <th className="px-4 py-4 text-left text-[9px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
                    Location
                  </th>
  
                  <th className="px-4 py-4 text-left text-[9px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
                    Contact
                  </th>
  
                  <th className="px-4 py-4 text-left text-[9px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
                    Capacity
                  </th>
  
                  <th className="px-4 py-4 text-left text-[9px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
                    Working Hours
                  </th>
  
                  <th className="px-4 py-4 text-left text-[9px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
                    Status
                  </th>
  
                  <th className="px-5 py-4 text-right text-[9px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
                    Action
                  </th>
                </tr>
              </thead>
  
              {/* BODY */}
  
              <tbody>
                {/* LOADING */}
  
                {loading ? (
                  Array.from({
                    length: 6,
                  }).map((_, index) => (
                    <tr
                      key={index}
                      className="border-b border-[#EEF2EE]"
                    >
                      {Array.from({
                        length: 7,
                      }).map(
                        (
                          __,
                          cellIndex
                        ) => (
                          <td
                            key={
                              cellIndex
                            }
                            className="px-4 py-4"
                          >
                            <div className="h-10 animate-pulse rounded-lg bg-[#F0F3F0]" />
                          </td>
                        )
                      )}
                    </tr>
                  ))
                ) : filteredWarehouses.length ===
                  0 ? (
                  /* EMPTY */
  
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-14 text-center"
                    >
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF3EA] text-[#163F20]">
                        <FiDatabase
                          size={19}
                        />
                      </div>
  
                      <div className="mt-3 text-sm font-bold text-[#202721]">
                        No warehouses
                        found
                      </div>
  
                      <div className="mt-1 text-xs text-[#9AA29C]">
                        {search
                          ? "Try another search term."
                          : "Create your first warehouse to get started."}
                      </div>
                    </td>
                  </tr>
                ) : (
                  /* DATA */
  
                  filteredWarehouses.map(
                    (
                      warehouse
                    ) => (
                      <motion.tr
                        key={
                          warehouse.id
                        }
                        initial={{
                          opacity: 0,
                        }}
                        animate={{
                          opacity: 1,
                        }}
                        className="border-b border-[#EEF2EE] transition hover:bg-[#FCFDFC]"
                      >
                        {/* WAREHOUSE */}
  
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                              <FiDatabase
                                size={16}
                              />
                            </div>
  
                            <div className="min-w-0">
                              <div className="truncate text-xs font-bold text-[#202721]">
                                {
                                  warehouse.name
                                }
                              </div>
  
                              <div className="mt-1 flex items-center gap-1.5">
                                <span className="rounded-md bg-[#F5F7F5] px-2 py-0.5 text-[9px] font-bold text-[#59645C]">
                                  {
                                    warehouse.code
                                  }
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
                              className="mt-0.5 shrink-0 text-[#163F20]"
                            />
  
                            <div>
                              <div className="text-xs font-semibold text-[#202721]">
                                {
                                  warehouse.city
                                }
                                ,{" "}
                                {
                                  warehouse.state
                                }
                              </div>
  
                              <div className="mt-0.5 max-w-[220px] text-[10px] leading-4 text-[#9AA29C]">
                                {
                                  warehouse.address_line_1
                                }
                              </div>
  
                              {warehouse.address_line_2 && (
                                <div className="text-[10px] leading-4 text-[#9AA29C]">
                                  {
                                    warehouse.address_line_2
                                  }
                                </div>
                              )}
  
                              <div className="mt-1 text-[9px] font-semibold text-[#59645C]">
                                PIN:{" "}
                                {
                                  warehouse.pincode
                                }
                              </div>
                            </div>
                          </div>
                        </td>
  
                        {/* CONTACT */}
  
                        <td className="px-4 py-4">
                          <div className="text-xs font-semibold text-[#202721]">
                            {
                              warehouse.contact_person
                            }
                          </div>
  
                          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#59645C]">
                            <FiPhone
                              size={11}
                              className="text-[#163F20]"
                            />
  
                            {
                              warehouse.contact_number
                            }
                          </div>
  
                          {warehouse.contact_email && (
                            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#9AA29C]">
                              <FiMail
                                size={11}
                                className="text-[#163F20]"
                              />
  
                              <span className="max-w-[170px] truncate">
                                {
                                  warehouse.contact_email
                                }
                              </span>
                            </div>
                          )}
                        </td>
  
                        {/* CAPACITY */}
  
                        <td className="px-4 py-4">
                          <div className="text-xs font-bold text-[#202721]">
                            {Number(
                              warehouse.total_capacity ||
                                0
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </div>
  
                          <div className="mt-1 text-[9px] uppercase tracking-[0.1em] text-[#9AA29C]">
                            Units
                          </div>
                        </td>
  
                        {/* HOURS */}
  
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F7F5] text-[#163F20]">
                              <FiClock
                                size={13}
                              />
                            </div>
  
                            <div>
                              <div className="text-xs font-semibold text-[#202721]">
                                {normalizeTime(
                                  warehouse.opening_time
                                )}
                                {" - "}
                                {normalizeTime(
                                  warehouse.closing_time
                                )}
                              </div>
  
                              <div className="mt-0.5 text-[9px] text-[#9AA29C]">
                                Operating
                                Hours
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
                                  ? "bg-[#EAF3EA] text-[#163F20]"
                                  : "bg-[#FCEAEA] text-[#C23B32]"
                              }`}
                            >
                              {warehouse.is_active
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </div>
                        </td>
  
                        {/* ACTION */}
  
                        <td className="px-5 py-4 text-right">
                          <motion.button
                            type="button"
                            whileHover={{
                              y: -1,
                            }}
                            whileTap={{
                              scale: 0.96,
                            }}
                            onClick={() =>
                              openEditModal(
                                warehouse
                              )
                            }
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#163F20]/15 bg-[#F5F7F5] px-3 text-[10px] font-bold text-[#163F20] transition hover:border-[#163F20]/25 hover:bg-[#EAF3EA]"
                          >
                            <FiEdit2
                              size={12}
                            />
  
                            Edit
                          </motion.button>
                        </td>
                      </motion.tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
  
          {/* =================================================
              PAGINATION
          ================================================= */}
  
          <div className="flex flex-col gap-3 border-t border-[#E5EAE5] bg-[#FCFDFC] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="text-[10px] text-[#9AA29C]">
              Showing{" "}
              <span className="font-bold text-[#59645C]">
                {startEntry}
              </span>{" "}
              to{" "}
              <span className="font-bold text-[#59645C]">
                {endEntry}
              </span>{" "}
              of{" "}
              <span className="font-bold text-[#59645C]">
                {totalEntries}
              </span>{" "}
              warehouses
            </div>
  
            <div className="flex items-center gap-1.5">
              {/* PREVIOUS */}
  
              <button
                type="button"
                disabled={
                  currentPage <= 1 ||
                  loading
                }
                onClick={() =>
                  handlePageChange(
                    currentPage - 1
                  )
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E2D8] bg-white text-[#59645C] transition hover:border-[#163F20]/20 hover:bg-[#EAF3EA] hover:text-[#163F20] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiChevronLeft
                  size={14}
                />
              </button>
  
              {/* PAGE NUMBERS */}
  
              {pageNumbers.map(
                (page) => (
                  <button
                    type="button"
                    key={page}
                    disabled={loading}
                    onClick={() =>
                      handlePageChange(
                        page
                      )
                    }
                    className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[10px] font-bold transition ${
                      page ===
                      currentPage
                        ? "bg-[#163F20] text-white shadow-sm"
                        : "border border-[#D8E2D8] bg-white text-[#59645C] hover:bg-[#EAF3EA] hover:text-[#163F20]"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {page}
                  </button>
                )
              )}
  
              {/* NEXT */}
  
              <button
                type="button"
                disabled={
                  currentPage >=
                    totalPages ||
                  loading
                }
                onClick={() =>
                  handlePageChange(
                    currentPage + 1
                  )
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E2D8] bg-white text-[#59645C] transition hover:border-[#163F20]/20 hover:bg-[#EAF3EA] hover:text-[#163F20] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiChevronRight
                  size={14}
                />
              </button>
            </div>
          </div>
        </motion.div>
  
        {/* =================================================
            CREATE MODAL
        ================================================= */}
  
        <GlobalModal
          isOpen={addModalOpen}
          onClose={closeAddModal}
          closeOnOverlayClick={
            !addLoading
          }
        >
          {renderWarehouseForm(false)}
        </GlobalModal>
  
        {/* =================================================
            EDIT MODAL
        ================================================= */}
  
        <GlobalModal
          isOpen={editModalOpen}
          onClose={closeEditModal}
          closeOnOverlayClick={
            !editLoading
          }
        >
          {renderWarehouseForm(true)}
        </GlobalModal>
  
        <div className="h-5" />
      </motion.div>
    );
  };
  
  export default Addwarehouse;