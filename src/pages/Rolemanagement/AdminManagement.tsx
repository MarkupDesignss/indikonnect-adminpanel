import React, {
  ChangeEvent,
  FC,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation } from "react-router-dom"; // ✅ Added

import {
  FiPlus,
  FiSearch,
  FiUsers,
  FiMail,
  FiLock,
  FiEdit2,
  FiTrash2,
  FiRefreshCw,
  FiX,
  FiShield,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

import GlobalModal from "@/components/common/GlobalModal";

import adminManagementApi, {
  AdminMember,
  Role,
} from "@/api/endpoints/rolemanagement";

// =====================================================
// TYPES
// =====================================================

interface AdminFormState {
  name: string;
  email: string;
  password: string;
  role_id: number | null;
}

interface DeleteTarget {
  id: number;
  name: string;
}

// =====================================================
// HELPERS
// =====================================================

const getInitials = (
  name?: string | null
): string => {
  if (!name) {
    return "AD";
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[1][0]
  ).toUpperCase();
};

const formatDate = (
  value?: string | null
): string => {
  if (!value) {
    return "—";
  }

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

// =====================================================
// ADMIN FORM MODAL
// =====================================================

interface AdminFormModalProps {
  open: boolean;
  loading: boolean;
  editingAdmin: AdminMember | null;
  roles: Role[];
  form: AdminFormState;
  setForm: React.Dispatch<
    React.SetStateAction<AdminFormState>
  >;
  onClose: () => void;
  onSubmit: () => void;
}

const AdminFormModal: FC<
  AdminFormModalProps
> = ({
  open,
  loading,
  editingAdmin,
  roles,
  form,
  setForm,
  onClose,
  onSubmit,
}) => {
  const selectedRole = roles.find(
    (role) =>
      role.id === form.role_id
  );

  if (!open) {
    return null;
  }

  return (
    <GlobalModal
      isOpen={open}
      onClose={() => {
        if (!loading) {
          onClose();
        }
      }}
      closeOnOverlayClick={!loading}
    >
      <div className="w-full max-w-[620px] overflow-hidden rounded-[22px] border border-[#b8902e]/15 bg-white shadow-[0_25px_70px_rgba(40,32,15,0.18)]">
        {/* ACCENT */}

        <div className="h-[3px] bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]" />

        {/* HEADER */}

        <div className="flex items-start justify-between gap-4 border-b border-[#b8902e]/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
              <FiUsers size={20} />
            </div>

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#9a741b]">
                Admin Access
              </p>

              <h2 className="mt-1 text-[21px] font-bold text-[#29251f]">
                {editingAdmin
                  ? "Edit Admin"
                  : "Create Admin"}
              </h2>

              <p className="mt-0.5 text-xs text-[#a19583]">
                {editingAdmin
                  ? "Update administrator details and role."
                  : "Add a new administrator and assign a role."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faf8f3] text-[#8f6d1d] transition hover:bg-[#f2ead8] disabled:opacity-40"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* BODY */}

        <div className="max-h-[70vh] overflow-y-auto bg-[#faf8f3] p-5">
          <div className="space-y-4">
            {/* BASIC INFORMATION */}

            <div className="rounded-2xl border border-[#b8902e]/10 bg-white p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
                  <FiUsers size={16} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#29251f]">
                    Administrator Information
                  </h3>

                  <p className="mt-0.5 text-[10px] text-[#a19583]">
                    Enter the admin account details.
                  </p>
                </div>
              </div>

              {/* NAME */}

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#786f60]">
                  Full Name *
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(
                    event: ChangeEvent<HTMLInputElement>
                  ) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        name:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="John Admin"
                  className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 text-sm text-[#29251f] outline-none placeholder:text-[#aaa08e] transition focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/10"
                />
              </div>

              {/* EMAIL */}

              <div className="mt-4">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#786f60]">
                  Email *
                </label>

                <div className="relative">
                  <FiMail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b8902e]"
                  />

                  <input
                    type="email"
                    value={form.email}
                    disabled={
                      !!editingAdmin
                    }
                    onChange={(
                      event: ChangeEvent<HTMLInputElement>
                    ) =>
                      setForm(
                        (previous) => ({
                          ...previous,
                          email:
                            event.target
                              .value,
                        })
                      )
                    }
                    placeholder="admin@example.com"
                    className={`h-11 w-full rounded-xl border border-[#d8d0c0] pl-10 pr-4 text-sm text-[#29251f] outline-none transition focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/10 ${
                      editingAdmin
                        ? "bg-[#f2eee5]"
                        : "bg-[#faf8f3] focus:bg-white"
                    }`}
                  />
                </div>

                {editingAdmin && (
                  <p className="mt-1.5 text-[10px] text-[#a19583]">
                    Email cannot be changed while
                    editing an admin.
                  </p>
                )}
              </div>

              {/* PASSWORD */}

              <div className="mt-4">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#786f60]">
                  {editingAdmin
                    ? "New Password"
                    : "Password *"}
                </label>

                <div className="relative">
                  <FiLock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b8902e]"
                  />

                  <input
                    type="password"
                    value={form.password}
                    onChange={(
                      event: ChangeEvent<HTMLInputElement>
                    ) =>
                      setForm(
                        (previous) => ({
                          ...previous,
                          password:
                            event.target
                              .value,
                        })
                      )
                    }
                    placeholder={
                      editingAdmin
                        ? "Leave blank to keep current password"
                        : "Admin@12345"
                    }
                    className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] pl-10 pr-4 text-sm text-[#29251f] outline-none placeholder:text-[#aaa08e] transition focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/10"
                  />
                </div>
              </div>
            </div>

            {/* ROLE */}

            <div className="rounded-2xl border border-[#b8902e]/10 bg-white p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
                    <FiShield size={16} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#29251f]">
                      Assign Role
                    </h3>

                    <p className="mt-0.5 text-[10px] text-[#a19583]">
                      Select one role for this administrator.
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-[#faf4df] px-3 py-1.5 text-[9px] font-bold text-[#8f6d1d]">
                  {roles.length} Roles
                </span>
              </div>

              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#786f60]">
                Select Role *
              </label>

              <div className="relative">
                <FiShield
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b8902e]"
                />

                <select
                  value={
                    form.role_id ?? ""
                  }
                  onChange={(
                    event: ChangeEvent<HTMLSelectElement>
                  ) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        role_id:
                          event.target
                            .value
                            ? Number(
                                event
                                  .target
                                  .value
                              )
                            : null,
                      })
                    )
                  }
                  className="h-12 w-full appearance-none rounded-xl border border-[#d8d0c0] bg-[#faf8f3] pl-10 pr-10 text-sm font-semibold text-[#29251f] outline-none transition focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/10"
                >
                  <option value="">
                    Select a role
                  </option>

                  {roles.map(
                    (role) => (
                      <option
                        key={role.id}
                        value={role.id}
                      >
                        {role.name}
                      </option>
                    )
                  )}
                </select>

                <svg
                  className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f6d1d]"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              {/* SELECTED ROLE PREVIEW */}

              {selectedRole && (
                <div className="mt-4 rounded-xl border border-[#b8902e]/15 bg-[#fffaf0] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#9a741b]">
                        Selected Role
                      </p>

                      <p className="mt-1 text-sm font-bold text-[#29251f]">
                        {
                          selectedRole.name
                        }
                      </p>

                      <p className="mt-1 font-mono text-[10px] text-[#a19583]">
                        {
                          selectedRole.slug
                        }
                      </p>
                    </div>

                    <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-bold text-[#8f6d1d]">
                      {selectedRole.permissions
                        ?.length || 0}{" "}
                      Permissions
                    </span>
                  </div>

                  {selectedRole
                    .description && (
                    <p className="mt-3 text-xs leading-5 text-[#786f60]">
                      {
                        selectedRole.description
                      }
                    </p>
                  )}

                  {/* PERMISSIONS */}

                  {selectedRole.permissions &&
                    selectedRole.permissions.length >
                      0 && (
                      <div className="mt-3 border-t border-[#b8902e]/10 pt-3">
                        <div className="flex flex-wrap gap-1.5">
                          {selectedRole.permissions.map(
                            (
                              permission
                            ) => (
                              <span
                                key={
                                  permission.id
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-[#b8902e]/15 bg-white px-2.5 py-1.5 text-[9px] font-semibold text-[#4d463b]"
                              >
                                <FiCheck
                                  size={
                                    10
                                  }
                                  className="text-[#b8902e]"
                                />
                                {
                                  permission.name
                                }
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}

        <div className="flex justify-end gap-2 border-t border-[#b8902e]/10 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-10 rounded-xl border border-[#b8902e]/15 bg-white px-5 text-sm font-bold text-[#786f60] transition hover:bg-[#faf8f3] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-6 text-sm font-bold text-white transition hover:from-[#a98227] hover:to-[#7e6017] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <FiRefreshCw
                size={14}
                className="animate-spin"
              />
            ) : (
              <FiCheck size={14} />
            )}

            {loading
              ? editingAdmin
                ? "Updating..."
                : "Creating..."
              : editingAdmin
              ? "Update Admin"
              : "Create Admin"}
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// DELETE MODAL
// =====================================================

interface DeleteModalProps {
  open: boolean;
  loading: boolean;
  target: DeleteTarget | null;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteAdminModal: FC<
  DeleteModalProps
> = ({
  open,
  loading,
  target,
  onClose,
  onConfirm,
}) => {
  if (!open || !target) {
    return null;
  }

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={!loading}
    >
      <div className="w-full max-w-[450px] overflow-hidden rounded-[22px] border border-[#b8902e]/15 bg-white shadow-2xl">
        <div className="h-[3px] bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]" />

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff5f3] text-[#b46055]">
              <FiTrash2 size={22} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#b46055]">
                    Confirmation
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-[#29251f]">
                    Delete Admin
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-[#8f6d1d] disabled:opacity-40"
                >
                  <FiX size={16} />
                </button>
              </div>

              <p className="mt-2 text-sm leading-6 text-[#786f60]">
                Are you sure you want to delete this
                administrator? This action cannot be
                undone.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
            <p className="text-[9px] font-bold uppercase tracking-wide text-[#a89a7d]">
              Selected Admin
            </p>

            <p className="mt-1.5 text-base font-bold text-[#29251f]">
              {target.name}
            </p>

         
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-10 rounded-xl border border-[#b8902e]/15 bg-white px-5 text-sm font-bold text-[#786f60] hover:bg-[#faf8f3] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex h-10 items-center gap-2 rounded-xl bg-[#b46055] px-5 text-sm font-bold text-white hover:bg-[#96483f] disabled:opacity-50"
            >
              {loading ? (
                <FiRefreshCw
                  size={14}
                  className="animate-spin"
                />
              ) : (
                <FiTrash2 size={14} />
              )}

              {loading
                ? "Deleting..."
                : "Delete Admin"}
            </button>
          </div>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// MAIN
// =====================================================

const AdminManagement: FC = () => {
  const location = useLocation(); // ✅ Get location for state
  
  // ✅ Get admin from header navigation state
  const adminFromHeader = location.state?.admin as AdminMember | undefined;

  const [admins, setAdmins] =
    useState<AdminMember[]>([]);

  const [roles, setRoles] =
    useState<Role[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const [
    deleteLoading,
    setDeleteLoading,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    "all" | "assigned" | "unassigned"
  >("all");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    editingAdmin,
    setEditingAdmin,
  ] =
    useState<AdminMember | null>(
      null
    );

  const [
    deleteModalOpen,
    setDeleteModalOpen,
  ] = useState(false);

  const [
    deleteTarget,
    setDeleteTarget,
  ] =
    useState<DeleteTarget | null>(
      null
    );

  const [
    adminForm,
    setAdminForm,
  ] =
    useState<AdminFormState>({
      name: "",
      email: "",
      password: "",
      role_id: null,
    });

  const [highlightedAdminId, setHighlightedAdminId] = useState<number | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const ITEMS_PER_PAGE = 10;

  // ===================================================
  // FETCH
  // ===================================================

  const fetchAll = async () => {
    try {
      setLoading(true);

      const [
        adminsResponse,
        rolesResponse,
      ] = await Promise.all([
        adminManagementApi.getAdmins(),
        adminManagementApi.getRoles(),
      ]);

      // ADMIN RESPONSE NORMALIZATION

      const adminsRaw =
        adminsResponse.data;

      const adminsData =
        Array.isArray(adminsRaw)
          ? adminsRaw
          : adminsRaw &&
            typeof adminsRaw ===
              "object" &&
            "data" in adminsRaw &&
            Array.isArray(
              adminsRaw.data
            )
          ? adminsRaw.data
          : [];

      // ROLE RESPONSE NORMALIZATION

      const rolesRaw =
        rolesResponse.data;

      const rolesData =
        Array.isArray(rolesRaw)
          ? rolesRaw
          : rolesRaw &&
            typeof rolesRaw ===
              "object" &&
            "data" in rolesRaw &&
            Array.isArray(
              rolesRaw.data
            )
          ? rolesRaw.data
          : [];

      setAdmins(
        adminsData as AdminMember[]
      );

      setRoles(
        rolesData as Role[]
      );

      // ✅ Handle admin from header after data is loaded
      if (adminFromHeader && isInitialLoad && adminsData.length > 0) {
        const targetAdmin = adminsData.find(
          (admin: AdminMember) => String(admin.id) === String(adminFromHeader.id)
        );

        if (targetAdmin) {
          // Set search to the admin's name or email to filter
          const searchTerm = targetAdmin.name || targetAdmin.email || String(targetAdmin.id);
          setSearch(searchTerm);
          setHighlightedAdminId(targetAdmin.id);
          
          // Also open the edit modal for the admin
          openEditAdmin(targetAdmin);
        } else {
          // If admin not found, try searching by ID as a fallback
          setSearch(String(adminFromHeader.id));
          toast.info(`Looking for admin with ID: ${adminFromHeader.id}`);
        }
        
        setIsInitialLoad(false);
      }
    } catch (error: any) {
      console.error(
        "Admin management fetch error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to load admin management data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ===================================================
  // FILTER
  // ===================================================

  const filteredAdmins =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return admins.filter(
        (admin) => {
          const matchesSearch =
            !query ||
            [
              admin.name,
              admin.email,
              String(
                admin.id
              ),
              ...(admin.roles ||
                []
              ).map(
                (role) =>
                  role.name
              ),
            ]
              .join(" ")
              .toLowerCase()
              .includes(query);

          const hasRole =
            (admin.roles?.length ||
              0) > 0;

          const matchesStatus =
            statusFilter ===
              "all"
              ? true
              : statusFilter ===
                "assigned"
              ? hasRole
              : !hasRole;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      admins,
      search,
      statusFilter,
    ]);

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredAdmins.length /
          ITEMS_PER_PAGE
      )
    );

  const startIndex =
    (currentPage - 1) *
    ITEMS_PER_PAGE;

  const paginatedAdmins =
    filteredAdmins.slice(
      startIndex,
      startIndex +
        ITEMS_PER_PAGE
    );

  const startEntry =
    filteredAdmins.length ===
    0
      ? 0
      : startIndex + 1;

  const endEntry = Math.min(
    startIndex +
      ITEMS_PER_PAGE,
    filteredAdmins.length
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
  ]);

  useEffect(() => {
    if (
      currentPage > totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const paginationPages =
    useMemo(() => {
      if (totalPages <= 5) {
        return Array.from(
          {
            length:
              totalPages,
          },
          (_, index) =>
            index + 1
        );
      }

      if (currentPage <= 3) {
        return [
          1,
          2,
          3,
          4,
          5,
        ];
      }

      if (
        currentPage >=
        totalPages - 2
      ) {
        return [
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        ];
      }

      return [
        currentPage - 2,
        currentPage - 1,
        currentPage,
        currentPage + 1,
        currentPage + 2,
      ];
    }, [
      currentPage,
      totalPages,
    ]);

  // ===================================================
  // CREATE
  // ===================================================

  const openCreateAdmin =
    () => {
      setEditingAdmin(null);

      setAdminForm({
        name: "",
        email: "",
        password: "",
        role_id:
          roles.length > 0
            ? roles[0].id
            : null,
      });

      setModalOpen(true);
    };

  // ===================================================
  // EDIT
  // ===================================================

  const openEditAdmin = (
    admin: AdminMember
  ) => {
    setEditingAdmin(admin);

    setAdminForm({
      name: admin.name || "",
      email:
        admin.email || "",
      password: "",
      role_id:
        admin.roles?.[0]?.id ||
        null,
    });

    setModalOpen(true);
  };

  // ===================================================
  // SUBMIT
  // ===================================================

  const submitAdmin = async () => {
    if (
      !adminForm.name.trim()
    ) {
      toast.error(
        "Please enter admin name."
      );
      return;
    }

    if (
      !adminForm.email.trim()
    ) {
      toast.error(
        "Please enter email."
      );
      return;
    }

    if (
      !editingAdmin &&
      !adminForm.password
    ) {
      toast.error(
        "Please enter password."
      );
      return;
    }

    if (!adminForm.role_id) {
      toast.error(
        "Please select a role."
      );
      return;
    }

    try {
      setActionLoading(true);

      // CREATE PAYLOAD

      if (!editingAdmin) {
        const payload = {
          name: adminForm.name.trim(),
          email:
            adminForm.email.trim(),
          password:
            adminForm.password,
          roles: [
            adminForm.role_id,
          ],
        };

        const response =
          await adminManagementApi.createAdmin(
            payload
          );

        toast.success(
          response.data?.message ||
            "Admin created successfully."
        );
      }

      // UPDATE PAYLOAD

      if (editingAdmin) {
        const payload = {
          name: adminForm.name.trim(),
          password:
            adminForm.password ||
            undefined,
          roles: [
            adminForm.role_id,
          ],
        };

        const response =
          await adminManagementApi.updateAdmin(
            editingAdmin.id,
            payload
          );

        toast.success(
          response.data?.message ||
            "Admin updated successfully."
        );
      }

      setModalOpen(false);

      setEditingAdmin(null);

      setAdminForm({
        name: "",
        email: "",
        password: "",
        role_id: null,
      });

      await fetchAll();
    } catch (error: any) {
      console.error(
        "Save admin error:",
        error
      );

      toast.error(
        error?.response?.data
          ?.message ||
          "Unable to save admin."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ===================================================
  // DELETE
  // ===================================================

  const openDeleteAdmin = (
    admin: AdminMember
  ) => {
    setDeleteTarget({
      id: admin.id,
      name: admin.name,
    });

    setDeleteModalOpen(true);
  };

  const handleDelete =
    async () => {
      if (!deleteTarget) {
        return;
      }

      try {
        setDeleteLoading(true);

        const response =
          await adminManagementApi.deleteAdmin(
            deleteTarget.id
          );

        toast.success(
          response.data?.message ||
            "Admin deleted successfully."
        );

        setDeleteModalOpen(
          false
        );

        setDeleteTarget(null);

        await fetchAll();
      } catch (error: any) {
        console.error(
          "Delete admin error:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            "Unable to delete admin."
        );
      } finally {
        setDeleteLoading(false);
      }
    };

  // ===================================================
  // HANDLE SEARCH - Clear highlight on manual search
  // ===================================================

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
    setHighlightedAdminId(null); // ✅ Clear highlight on manual search
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (
    loading &&
    admins.length === 0
  ) {
    return (
      <div className="flex min-h-[420px] items-center justify-center bg-[#faf8f3]">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b8902e]/10 text-[#b8902e]">
            <FiRefreshCw
              size={23}
              className="animate-spin"
            />
          </div>

          <p className="mt-4 text-base font-bold text-[#29251f]">
            Loading admins...
          </p>

          <p className="mt-1 text-xs text-[#a19583]">
            Fetching administrators and roles.
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <>
      <motion.div
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        className="min-h-screen bg-[#faf8f3] p-4 sm:p-5 lg:p-6"
      >
        {/* HEADER */}

        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#b8902e]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9a741b]">
                User Management
              </span>
            </div>

            <h1 className="font-serif text-[30px] font-bold tracking-tight text-[#29251f] sm:text-[34px]">
              Admin Management
            </h1>

            <p className="mt-1.5 text-sm text-[#8d8372]">
              Manage administrators and assign roles from one place.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchAll}
              disabled={loading}
              className="flex h-11 items-center gap-2 rounded-xl border border-[#b8902e]/20 bg-white px-5 text-sm font-bold text-[#8f6d1d] shadow-sm transition hover:bg-[#faf8f3] disabled:opacity-50"
            >
              <FiRefreshCw
                size={16}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            <button
              type="button"
              onClick={
                openCreateAdmin
              }
              className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-6 text-sm font-bold text-white shadow-md shadow-[#b8902e]/15 transition hover:from-[#a98227] hover:to-[#7e6017]"
            >
              <FiPlus size={17} />
              Add Admin
            </button>
          </div>
        </div>

        {/* MAIN CARD */}

        <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="relative overflow-hidden rounded-[22px] border border-[#b8902e]/12 bg-white shadow-[0_8px_30px_rgba(70,55,20,0.045)]"
        >
          <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]" />

          {/* TOOLBAR */}

          <div className="border-b border-[#b8902e]/10 p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full xl:max-w-[500px]">
                <FiSearch
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a8841c]"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(
                    event
                  ) =>
                    handleSearch(
                      event.target
                        .value
                    )
                  }
                  placeholder="Search name, email, ID or role..."
                  className="h-12 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] pl-11 pr-4 text-sm text-[#29251f] outline-none placeholder:text-[#aaa08e] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/10"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  {
                    key: "all" as const,
                    label: "All",
                  },
                  {
                    key: "assigned" as const,
                    label: "Assigned",
                  },
                  {
                    key: "unassigned" as const,
                    label: "No Role",
                  },
                ].map(
                  (item) => (
                    <button
                      key={
                        item.key
                      }
                      type="button"
                      onClick={() => {
                        setStatusFilter(
                          item.key
                        );
                        setCurrentPage(1);
                        setHighlightedAdminId(null); // ✅ Clear highlight on filter change
                      }}
                      className={`rounded-xl px-5 py-2.5 text-xs font-bold transition ${
                        statusFilter ===
                        item.key
                          ? "bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] text-white shadow-md"
                          : "border border-[#b8902e]/15 bg-[#faf8f3] text-[#786f60] hover:bg-[#f2ead8]"
                      }`}
                    >
                      {
                        item.label
                      }
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* TABLE HEADER */}

          <div className="flex flex-col justify-between gap-3 border-b border-[#b8902e]/10 px-5 py-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
                <FiUsers
                  size={18}
                />
              </div>

              <div>
                <h2 className="text-base font-bold text-[#29251f]">
                  Admin Directory
                </h2>

                <p className="mt-1 text-xs text-[#a19583]">
                  {
                    filteredAdmins.length
                  }{" "}
                  administrator
                  {filteredAdmins.length ===
                  1
                    ? ""
                    : "s"}{" "}
                  found
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <span className="rounded-lg bg-[#faf8f3] px-3 py-2 text-[10px] font-bold text-[#8f6d1d]">
                {admins.length} Total
              </span>

              <span className="rounded-lg bg-[#faf4df] px-3 py-2 text-[10px] font-bold text-[#8f6d1d]">
                {roles.length} Roles
              </span>
            </div>
          </div>

          {/* DESKTOP TABLE */}

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1050px] border-collapse">
              <thead>
                <tr className="bg-[#2f2a22]">
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    S.No.
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    Administrator
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    Email
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    Role
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    Created
                  </th>

                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center"
                    >
                      <FiRefreshCw
                        size={26}
                        className="mx-auto animate-spin text-[#b8902e]"
                      />

                      <p className="mt-4 text-sm font-bold text-[#29251f]">
                        Loading administrators...
                      </p>
                    </td>
                  </tr>
                ) : paginatedAdmins.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#b8902e]">
                          <FiUsers
                            size={25}
                          />
                        </div>

                        <p className="mt-4 text-sm font-bold text-[#29251f]">
                          No administrators found
                        </p>

                        <p className="mt-1 text-xs text-[#a19583]">
                          Try another search or add a new admin.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedAdmins.map(
                    (
                      admin,
                      index
                    ) => {
                      const adminRole =
                        admin.roles?.[0] ||
                        null;
                      
                      const isHighlighted = highlightedAdminId === admin.id;

                      return (
                        <tr
                          key={admin.id}
                          className={`border-b border-[#b8902e]/10 transition-all duration-300 ${
                            isHighlighted 
                              ? 'bg-[#d4af52]/15 border-l-4 border-l-[#b8902e] shadow-inner' 
                              : 'bg-white hover:bg-[#fcfaf5]'
                          }`}
                        >
                          {/* S.NO */}

                          <td className="px-5 py-4">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-xs font-bold text-[#8f6d1d]">
                              {startIndex +
                                index +
                                1}
                            </span>
                          </td>

                          {/* ADMIN */}

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-xs font-bold text-white">
                                {getInitials(
                                  admin.name
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-[#29251f]">
                                  {
                                    admin.name
                                  }
                                </p>

                                
                              </div>
                            </div>
                          </td>

                          {/* EMAIL */}

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <FiMail
                                size={
                                  14
                                }
                                className="text-[#b8902e]"
                              />

                              <span className="text-xs font-semibold text-[#4d463b]">
                                {
                                  admin.email
                                }
                              </span>
                            </div>
                          </td>

                          {/* ROLE */}

                          <td className="px-5 py-4">
                            {adminRole ? (
                              <div>
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b8902e]/20 bg-[#f8f3e5] px-3 py-1.5 text-[10px] font-bold text-[#806319]">
                                  <FiShield
                                    size={
                                      11
                                    }
                                  />

                                  {
                                    adminRole.name
                                  }
                                </span>

                                <p className="mt-1 font-mono text-[9px] text-[#a19583]">
                                  {
                                    adminRole.slug
                                  }
                                </p>
                              </div>
                            ) : (
                              <span className="inline-flex rounded-full border border-[#d8d1c4] bg-[#f6f4ef] px-3 py-1.5 text-[10px] font-bold text-[#786f60]">
                                No Role
                              </span>
                            )}
                          </td>

                          {/* CREATED */}

                          <td className="px-5 py-4">
                            <span className="text-[10px] font-semibold text-[#786f60]">
                              {formatDate(
                                admin.created_at
                              )}
                            </span>
                          </td>

                          {/* ACTIONS */}

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditAdmin(
                                    admin
                                  )
                                }
                                title="Edit Admin"
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] text-[#8f6d1d] transition hover:bg-[#b8902e] hover:text-white"
                              >
                                <FiEdit2
                                  size={
                                    14
                                  }
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openDeleteAdmin(
                                    admin
                                  )
                                }
                                title="Delete Admin"
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#c98d83]/20 bg-[#fff8f6] text-[#b46055] transition hover:bg-[#b46055] hover:text-white"
                              >
                                <FiTrash2
                                  size={
                                    14
                                  }
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE */}

          <div className="block lg:hidden">
            {paginatedAdmins.length >
            0 ? (
              paginatedAdmins.map(
                (
                  admin,
                  index
                ) => {
                  const adminRole =
                    admin.roles?.[0] ||
                    null;
                  
                  const isHighlighted = highlightedAdminId === admin.id;

                  return (
                    <div
                      key={admin.id}
                      className={`border-b border-[#b8902e]/10 p-5 transition-all duration-300 ${
                        isHighlighted 
                          ? 'bg-[#d4af52]/15 border-l-4 border-l-[#b8902e]' 
                          : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-xs font-bold text-white">
                            {getInitials(
                              admin.name
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[#29251f]">
                              {
                                admin.name
                              }
                            </p>

                            <p className="mt-1 truncate text-xs text-[#786f60]">
                              {
                                admin.email
                              }
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold text-[#a19583]">
                          #
                          {startIndex +
                            index +
                            1}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-[#a89a7d]">
                            Role
                          </p>

                          <p className="mt-1.5 text-xs font-bold text-[#29251f]">
                            {adminRole?.name ||
                              "No Role"}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-[#a89a7d]">
                            Created
                          </p>

                          <p className="mt-1.5 text-xs font-bold text-[#29251f]">
                            {formatDate(
                              admin.created_at
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openEditAdmin(
                              admin
                            )
                          }
                          className="flex h-9 items-center gap-1.5 rounded-lg border border-[#b8902e]/15 bg-[#faf8f3] px-3 text-xs font-bold text-[#8f6d1d]"
                        >
                          <FiEdit2
                            size={
                              13
                            }
                          />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openDeleteAdmin(
                              admin
                            )
                          }
                          className="flex h-9 items-center gap-1.5 rounded-lg border border-[#c98d83]/20 bg-[#fff8f6] px-3 text-xs font-bold text-[#b46055]"
                        >
                          <FiTrash2
                            size={
                              13
                            }
                          />
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                }
              )
            ) : (
              <div className="flex flex-col items-center py-16 text-center">
                <FiUsers
                  size={27}
                  className="text-[#b8902e]"
                />

                <p className="mt-4 text-sm font-bold text-[#29251f]">
                  No administrators found
                </p>
              </div>
            )}
          </div>

          {/* PAGINATION */}

          {filteredAdmins.length >
            0 && (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-[#b8902e]/10 bg-[#fffdfa] px-5 py-4 sm:flex-row">
              <p className="text-xs text-[#8b8171]">
                Showing{" "}
                <span className="font-bold text-[#4a4436]">
                  {startEntry}
                </span>{" "}
                to{" "}
                <span className="font-bold text-[#4a4436]">
                  {endEntry}
                </span>{" "}
                of{" "}
                <span className="font-bold text-[#4a4436]">
                  {
                    filteredAdmins.length
                  }
                </span>{" "}
                entries
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.max(
                          1,
                          page - 1
                        )
                    )
                  }
                  disabled={
                    currentPage ===
                    1
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#b8902e]/15 bg-white text-[#8f6d1d] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <FiChevronLeft
                    size={16}
                  />
                </button>

                {paginationPages.map(
                  (page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() =>
                        setCurrentPage(
                          page
                        )
                      }
                      className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-xs font-bold ${
                        currentPage ===
                        page
                          ? "bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-white"
                          : "text-[#786f60] hover:bg-[#faf8f3]"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.min(
                          totalPages,
                          page + 1
                        )
                    )
                  }
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#b8902e]/15 bg-white text-[#8f6d1d] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <FiChevronRight
                    size={16}
                  />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* CREATE / EDIT */}

      <AdminFormModal
        open={modalOpen}
        loading={actionLoading}
        editingAdmin={
          editingAdmin
        }
        roles={roles}
        form={adminForm}
        setForm={setAdminForm}
        onClose={() => {
          if (!actionLoading) {
            setModalOpen(false);
            setEditingAdmin(
              null
            );
          }
        }}
        onSubmit={
          submitAdmin
        }
      />

      {/* DELETE */}

      <DeleteAdminModal
        open={
          deleteModalOpen
        }
        loading={
          deleteLoading
        }
        target={
          deleteTarget
        }
        onClose={() => {
          if (!deleteLoading) {
            setDeleteModalOpen(
              false
            );
            setDeleteTarget(
              null
            );
          }
        }}
        onConfirm={
          handleDelete
        }
      />
    </>
  );
};

export default AdminManagement;