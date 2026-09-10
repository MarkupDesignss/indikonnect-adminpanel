import React, { ChangeEvent, FC, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

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

const getInitials = (name?: string | null): string => {
  if (!name) return "AD";

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const formatDate = (value?: string | null): string => {
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

// =====================================================
// ADMIN FORM MODAL
// =====================================================

interface AdminFormModalProps {
  open: boolean;
  loading: boolean;
  editingAdmin: AdminMember | null;
  roles: Role[];
  form: AdminFormState;
  setForm: React.Dispatch<React.SetStateAction<AdminFormState>>;
  onClose: () => void;
  onSubmit: () => void;
}

const AdminFormModal: FC<AdminFormModalProps> = ({
  open,
  loading,
  editingAdmin,
  roles,
  form,
  setForm,
  onClose,
  onSubmit,
}) => {
  const selectedRole = roles.find((role) => role.id === form.role_id);

  if (!open) return null;

  return (
    <GlobalModal
      isOpen={open}
      onClose={() => {
        if (!loading) onClose();
      }}
      closeOnOverlayClick={!loading}
    >
      <div className="w-full max-w-[620px] overflow-hidden rounded-[22px] border border-[#E5EAE5] bg-white shadow-[0_25px_70px_rgba(22,63,32,0.18)]">
        {/* ACCENT */}
        <div className="h-[3px] bg-gradient-to-r from-[#4C8A57] via-[#163F20] to-[#0F3219]" />

        {/* HEADER */}
        <div className="flex items-start justify-between gap-4 border-b border-[#163F20]/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
              <FiUsers size={20} />
            </div>

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#4C8A57]">
                Admin Access
              </p>

              <h2 className="mt-1 text-[21px] font-bold text-[#202721]">
                {editingAdmin ? "Edit Admin" : "Create Admin"}
              </h2>

              <p className="mt-0.5 text-xs text-[#9AA29C]">
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
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F7F5] text-[#163F20] transition hover:bg-[#EAF3EA] disabled:opacity-40"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="max-h-[70vh] overflow-y-auto bg-[#F5F7F5] p-5">
          <div className="space-y-4">
            {/* BASIC INFORMATION */}
            <div className="rounded-2xl border border-[#163F20]/10 bg-white p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                  <FiUsers size={16} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#202721]">
                    Administrator Information
                  </h3>

                  <p className="mt-0.5 text-[10px] text-[#9AA29C]">
                    Enter the admin account details.
                  </p>
                </div>
              </div>

              {/* NAME */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#59645C]">
                  Full Name *
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setForm((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  placeholder="John Admin"
                  className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] px-4 text-sm text-[#202721] outline-none placeholder:text-[#9AA29C] transition focus:border-[#163F20] focus:bg-white focus:ring-2 focus:ring-[#163F20]/10"
                />
              </div>

              {/* EMAIL */}
              <div className="mt-4">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#59645C]">
                  Email *
                </label>

                <div className="relative">
                  <FiMail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#163F20]"
                  />

                  <input
                    type="email"
                    value={form.email}
                    disabled={!!editingAdmin}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setForm((previous) => ({
                        ...previous,
                        email: event.target.value,
                      }))
                    }
                    placeholder="admin@example.com"
                    className={`h-11 w-full rounded-xl border border-[#D8E2D8] pl-10 pr-4 text-sm text-[#202721] outline-none transition focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/10 ${
                      editingAdmin
                        ? "bg-[#EAF3EA]"
                        : "bg-[#F5F7F5] focus:bg-white"
                    }`}
                  />
                </div>

                {editingAdmin && (
                  <p className="mt-1.5 text-[10px] text-[#9AA29C]">
                    Email cannot be changed while editing an admin.
                  </p>
                )}
              </div>

              {/* PASSWORD */}
              <div className="mt-4">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#59645C]">
                  {editingAdmin ? "New Password" : "Password *"}
                </label>

                <div className="relative">
                  <FiLock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#163F20]"
                  />

                  <input
                    type="password"
                    value={form.password}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setForm((previous) => ({
                        ...previous,
                        password: event.target.value,
                      }))
                    }
                    placeholder={
                      editingAdmin
                        ? "Leave blank to keep current password"
                        : "Admin@12345"
                    }
                    className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] pl-10 pr-4 text-sm text-[#202721] outline-none placeholder:text-[#9AA29C] transition focus:border-[#163F20] focus:bg-white focus:ring-2 focus:ring-[#163F20]/10"
                  />
                </div>
              </div>
            </div>

            {/* ROLE */}
            <div className="rounded-2xl border border-[#163F20]/10 bg-white p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                    <FiShield size={16} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#202721]">
                      Assign Role
                    </h3>

                    <p className="mt-0.5 text-[10px] text-[#9AA29C]">
                      Select one role for this administrator.
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-[#EAF3EA] px-3 py-1.5 text-[9px] font-bold text-[#163F20]">
                  {roles.length} Roles
                </span>
              </div>

              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#59645C]">
                Select Role *
              </label>

              <div className="relative">
                <FiShield
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#163F20]"
                />

                <select
                  value={form.role_id ?? ""}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    setForm((previous) => ({
                      ...previous,
                      role_id: event.target.value
                        ? Number(event.target.value)
                        : null,
                    }))
                  }
                  className="h-12 w-full appearance-none rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] pl-10 pr-10 text-sm font-semibold text-[#202721] outline-none transition focus:border-[#163F20] focus:bg-white focus:ring-2 focus:ring-[#163F20]/10"
                >
                  <option value="">Select a role</option>

                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>

                <svg
                  className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#163F20]"
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
                <div className="mt-4 rounded-xl border border-[#163F20]/15 bg-[#EAF3EA] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#163F20]">
                        Selected Role
                      </p>

                      <p className="mt-1 text-sm font-bold text-[#202721]">
                        {selectedRole.name}
                      </p>

                      <p className="mt-1 font-mono text-[10px] text-[#9AA29C]">
                        {selectedRole.slug}
                      </p>
                    </div>

                    <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-bold text-[#163F20]">
                      {selectedRole.permissions?.length || 0} Permissions
                    </span>
                  </div>

                  {selectedRole.description && (
                    <p className="mt-3 text-xs leading-5 text-[#59645C]">
                      {selectedRole.description}
                    </p>
                  )}

                  {/* PERMISSIONS */}
                  {selectedRole.permissions &&
                    selectedRole.permissions.length > 0 && (
                      <div className="mt-3 border-t border-[#163F20]/10 pt-3">
                        <div className="flex flex-wrap gap-1.5">
                          {selectedRole.permissions.map((permission) => (
                            <span
                              key={permission.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#163F20]/15 bg-white px-2.5 py-1.5 text-[9px] font-semibold text-[#3F4A41]"
                            >
                              <FiCheck size={10} className="text-[#163F20]" />
                              {permission.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 border-t border-[#163F20]/10 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-10 rounded-xl border border-[#163F20]/15 bg-white px-5 text-sm font-bold text-[#59645C] transition hover:bg-[#F5F7F5] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-[#4C8A57] via-[#163F20] to-[#0F3219] px-6 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(22,63,32,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(22,63,32,0.7)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <FiRefreshCw size={14} className="animate-spin" />
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

const DeleteAdminModal: FC<DeleteModalProps> = ({
  open,
  loading,
  target,
  onClose,
  onConfirm,
}) => {
  if (!open || !target) return null;

  return (
    <GlobalModal isOpen={open} onClose={onClose} closeOnOverlayClick={!loading}>
      <div className="w-full max-w-[450px] overflow-hidden rounded-[22px] border border-[#E5EAE5] bg-white shadow-2xl">
        <div className="h-[3px] bg-gradient-to-r from-[#4C8A57] to-[#C23B32]" />

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FBEAEA] text-[#C23B32]">
              <FiTrash2 size={22} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#C23B32]">
                    Confirmation
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-[#202721]">
                    Delete Admin
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F7F5] text-[#163F20] disabled:opacity-40"
                >
                  <FiX size={16} />
                </button>
              </div>

              <p className="mt-2 text-sm leading-6 text-[#59645C]">
                Are you sure you want to delete this administrator? This action
                cannot be undone.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] p-4">
            <p className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
              Selected Admin
            </p>

            <p className="mt-1.5 text-base font-bold text-[#202721]">
              {target.name}
            </p>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-10 rounded-xl border border-[#163F20]/15 bg-white px-5 text-sm font-bold text-[#59645C] hover:bg-[#F5F7F5] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-[#C23B32] to-[#A62F27] px-5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(194,59,50,0.6)] transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? (
                <FiRefreshCw size={14} className="animate-spin" />
              ) : (
                <FiTrash2 size={14} />
              )}

              {loading ? "Deleting..." : "Delete Admin"}
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
  const location = useLocation();
  const adminFromHeader = location.state?.admin as AdminMember | undefined;

  const [admins, setAdmins] = useState<AdminMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "assigned" | "unassigned"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminMember | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [adminForm, setAdminForm] = useState<AdminFormState>({
    name: "",
    email: "",
    password: "",
    role_id: null,
  });
  const [highlightedAdminId, setHighlightedAdminId] = useState<number | null>(
    null,
  );
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const ITEMS_PER_PAGE = 10;

  // ===================================================
  // FETCH
  // ===================================================

  const fetchAll = async () => {
    try {
      setLoading(true);

      const [adminsResponse, rolesResponse] = await Promise.all([
        adminManagementApi.getAdmins(),
        adminManagementApi.getRoles(),
      ]);

      // ADMIN NORMALIZATION
      const adminsRaw = adminsResponse.data;
      const adminsData = Array.isArray(adminsRaw)
        ? adminsRaw
        : adminsRaw &&
            typeof adminsRaw === "object" &&
            "data" in adminsRaw &&
            Array.isArray(adminsRaw.data)
          ? adminsRaw.data
          : [];

      // ROLE NORMALIZATION
      const rolesRaw = rolesResponse.data;
      const rolesData = Array.isArray(rolesRaw)
        ? rolesRaw
        : rolesRaw &&
            typeof rolesRaw === "object" &&
            "data" in rolesRaw &&
            Array.isArray(rolesRaw.data)
          ? rolesRaw.data
          : [];

      setAdmins(adminsData as AdminMember[]);
      setRoles(rolesData as Role[]);

      // Handle admin from header
      if (adminFromHeader && isInitialLoad && adminsData.length > 0) {
        const targetAdmin = adminsData.find(
          (admin: AdminMember) =>
            String(admin.id) === String(adminFromHeader.id),
        );

        if (targetAdmin) {
          const searchTerm =
            targetAdmin.name || targetAdmin.email || String(targetAdmin.id);
          setSearch(searchTerm);
          setHighlightedAdminId(targetAdmin.id);

          openEditAdmin(targetAdmin);
        } else {
          setSearch(String(adminFromHeader.id));
          toast.info(`Looking for admin with ID: ${adminFromHeader.id}`);
        }

        setIsInitialLoad(false);
      }
    } catch (error: any) {
      console.error("Admin management fetch error:", error);
      toast.error(
        error?.response?.data?.message ||
          "Unable to load admin management data.",
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

  const filteredAdmins = useMemo(() => {
    const query = search.trim().toLowerCase();

    return admins.filter((admin) => {
      const matchesSearch =
        !query ||
        [
          admin.name,
          admin.email,
          String(admin.id),
          ...(admin.roles || []).map((role) => role.name),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const hasRole = (admin.roles?.length || 0) > 0;

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "assigned"
            ? hasRole
            : !hasRole;

      return matchesSearch && matchesStatus;
    });
  }, [admins, search, statusFilter]);

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAdmins.length / ITEMS_PER_PAGE),
  );

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedAdmins = filteredAdmins.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );
  const startEntry = filteredAdmins.length === 0 ? 0 : startIndex + 1;
  const endEntry = Math.min(startIndex + ITEMS_PER_PAGE, filteredAdmins.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginationPages = useMemo(() => {
    if (totalPages <= 5)
      return Array.from({ length: totalPages }, (_, index) => index + 1);

    if (currentPage <= 3) return [1, 2, 3, 4, 5];

    if (currentPage >= totalPages - 2)
      return [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];

    return [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
    ];
  }, [currentPage, totalPages]);

  // ===================================================
  // CREATE / EDIT
  // ===================================================

  const openCreateAdmin = () => {
    setEditingAdmin(null);

    setAdminForm({
      name: "",
      email: "",
      password: "",
      role_id: roles.length > 0 ? roles[0].id : null,
    });

    setModalOpen(true);
  };

  const openEditAdmin = (admin: AdminMember) => {
    setEditingAdmin(admin);

    setAdminForm({
      name: admin.name || "",
      email: admin.email || "",
      password: "",
      role_id: admin.roles?.[0]?.id || null,
    });

    setModalOpen(true);
  };

  // ===================================================
  // SUBMIT
  // ===================================================

  const submitAdmin = async () => {
    if (!adminForm.name.trim()) {
      toast.error("Please enter admin name.");
      return;
    }

    if (!adminForm.email.trim()) {
      toast.error("Please enter email.");
      return;
    }

    if (!editingAdmin && !adminForm.password) {
      toast.error("Please enter password.");
      return;
    }

    if (!adminForm.role_id) {
      toast.error("Please select a role.");
      return;
    }

    try {
      setActionLoading(true);

      if (!editingAdmin) {
        const payload = {
          name: adminForm.name.trim(),
          email: adminForm.email.trim(),
          password: adminForm.password,
          roles: [adminForm.role_id],
        };

        const response = await adminManagementApi.createAdmin(payload);

        toast.success(response.data?.message || "Admin created successfully.");
      }

      if (editingAdmin) {
        const payload = {
          name: adminForm.name.trim(),
          password: adminForm.password || undefined,
          roles: [adminForm.role_id],
        };

        const response = await adminManagementApi.updateAdmin(
          editingAdmin.id,
          payload,
        );

        toast.success(response.data?.message || "Admin updated successfully.");
      }

      setModalOpen(false);
      setEditingAdmin(null);
      setAdminForm({ name: "", email: "", password: "", role_id: null });

      await fetchAll();
    } catch (error: any) {
      console.error("Save admin error:", error);
      toast.error(error?.response?.data?.message || "Unable to save admin.");
    } finally {
      setActionLoading(false);
    }
  };

  // ===================================================
  // DELETE
  // ===================================================

  const openDeleteAdmin = (admin: AdminMember) => {
    setDeleteTarget({ id: admin.id, name: admin.name });
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleteLoading(true);

      const response = await adminManagementApi.deleteAdmin(deleteTarget.id);

      toast.success(response.data?.message || "Admin deleted successfully.");

      setDeleteModalOpen(false);
      setDeleteTarget(null);
      await fetchAll();
    } catch (error: any) {
      console.error("Delete admin error:", error);
      toast.error(error?.response?.data?.message || "Unable to delete admin.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ===================================================
  // SEARCH
  // ===================================================

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
    setHighlightedAdminId(null);
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (loading && admins.length === 0) {
    return (
      <div className="flex min-h-[420px] items-center justify-center bg-[#F5F7F5]">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#163F20]">
            <FiRefreshCw size={23} className="animate-spin" />
          </div>

          <p className="mt-4 text-base font-bold text-[#202721]">
            Loading admins...
          </p>

          <p className="mt-1 text-xs text-[#9AA29C]">
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-[#F5F7F5] p-4 sm:p-5 lg:p-6"
      >
        {/* HEADER */}
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#163F20]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4C8A57]">
                User Management
              </span>
            </div>

            <h1 className="text-[30px] font-bold tracking-tight text-[#202721] sm:text-[34px]">
              Admin Management
            </h1>

            <p className="mt-1.5 text-sm text-[#59645C]">
              Manage administrators and assign roles from one place.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchAll}
              disabled={loading}
              className="flex h-11 items-center gap-2 rounded-xl border border-[#163F20]/20 bg-white px-5 text-sm font-bold text-[#163F20] shadow-sm transition hover:bg-[#EAF3EA] disabled:opacity-50"
            >
              <FiRefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreateAdmin}
              className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-br from-[#4C8A57] via-[#163F20] to-[#0F3219] px-6 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(22,63,32,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(22,63,32,0.7)]"
            >
              <FiPlus size={17} />
              Add Admin
            </button>
          </div>
        </div>

        {/* MAIN CARD */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[22px] border border-[#E5EAE5] bg-white shadow-[0_8px_30px_rgba(22,63,32,0.06)]"
        >
          <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#8FC199] via-[#163F20] to-[#0F3219]" />

          {/* TOOLBAR */}
          <div className="border-b border-[#163F20]/10 p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full xl:max-w-[500px]">
                <FiSearch
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#163F20]"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => handleSearch(event.target.value)}
                  placeholder="Search name, email, ID or role..."
                  className="h-12 w-full rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] pl-11 pr-4 text-sm text-[#202721] outline-none placeholder:text-[#9AA29C] focus:border-[#163F20] focus:bg-white focus:ring-2 focus:ring-[#163F20]/10"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { key: "all" as const, label: "All" },
                  { key: "assigned" as const, label: "Assigned" },
                  { key: "unassigned" as const, label: "No Role" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setStatusFilter(item.key);
                      setCurrentPage(1);
                      setHighlightedAdminId(null);
                    }}
                    className={`rounded-xl px-5 py-2.5 text-xs font-bold transition ${
                      statusFilter === item.key
                        ? "bg-gradient-to-r from-[#4C8A57] to-[#163F20] text-white shadow-[0_6px_14px_-6px_rgba(22,63,32,0.5)]"
                        : "border border-[#163F20]/15 bg-[#F5F7F5] text-[#59645C] hover:bg-[#EAF3EA] hover:text-[#163F20]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* TABLE HEADER */}
          <div className="flex flex-col justify-between gap-3 border-b border-[#163F20]/10 px-5 py-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                <FiUsers size={18} />
              </div>

              <div>
                <h2 className="text-base font-bold text-[#202721]">
                  Admin Directory
                </h2>

                <p className="mt-1 text-xs text-[#9AA29C]">
                  {filteredAdmins.length} administrator
                  {filteredAdmins.length === 1 ? "" : "s"} found
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <span className="rounded-lg bg-[#F5F7F5] px-3 py-2 text-[10px] font-bold text-[#163F20]">
                {admins.length} Total
              </span>

              <span className="rounded-lg bg-[#EAF3EA] px-3 py-2 text-[10px] font-bold text-[#163F20]">
                {roles.length} Roles
              </span>
            </div>
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1050px] border-collapse">
              <thead>
                <tr className="bg-[#163F20]">
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF3EA]">
                    S.No.
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF3EA]">
                    Administrator
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF3EA]">
                    Email
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF3EA]">
                    Role
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF3EA]">
                    Created
                  </th>
                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#EAF3EA]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <FiRefreshCw
                        size={26}
                        className="mx-auto animate-spin text-[#163F20]"
                      />

                      <p className="mt-4 text-sm font-bold text-[#202721]">
                        Loading administrators...
                      </p>
                    </td>
                  </tr>
                ) : paginatedAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#163F20]">
                          <FiUsers size={25} />
                        </div>

                        <p className="mt-4 text-sm font-bold text-[#202721]">
                          No administrators found
                        </p>

                        <p className="mt-1 text-xs text-[#9AA29C]">
                          Try another search or add a new admin.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedAdmins.map((admin, index) => {
                    const adminRole = admin.roles?.[0] || null;
                    const isHighlighted = highlightedAdminId === admin.id;

                    return (
                      <tr
                        key={admin.id}
                        className={`border-b border-[#163F20]/10 transition-all duration-300 ${
                          isHighlighted
                            ? "bg-[#EAF3EA] border-l-4 border-l-[#163F20] shadow-inner"
                            : "bg-white hover:bg-[#FAFBFA]"
                        }`}
                      >
                        <td className="px-5 py-4">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF3EA] text-xs font-bold text-[#163F20]">
                            {startIndex + index + 1}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] text-xs font-bold text-white">
                              {getInitials(admin.name)}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-[#202721]">
                                {admin.name}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <FiMail size={14} className="text-[#163F20]" />
                            <span className="text-xs font-semibold text-[#3F4A41]">
                              {admin.email}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          {adminRole ? (
                            <div>
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#163F20]/20 bg-[#EAF3EA] px-3 py-1.5 text-[10px] font-bold text-[#163F20]">
                                <FiShield size={11} />
                                {adminRole.name}
                              </span>

                              <p className="mt-1 font-mono text-[9px] text-[#9AA29C]">
                                {adminRole.slug}
                              </p>
                            </div>
                          ) : (
                            <span className="inline-flex rounded-full border border-[#D8E2D8] bg-[#F3F6F3] px-3 py-1.5 text-[10px] font-bold text-[#59645C]">
                              No Role
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-[10px] font-semibold text-[#59645C]">
                            {formatDate(admin.created_at)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditAdmin(admin)}
                              title="Edit Admin"
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#163F20]/15 bg-[#F5F7F5] text-[#163F20] transition hover:bg-[#163F20] hover:text-white"
                            >
                              <FiEdit2 size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => openDeleteAdmin(admin)}
                              title="Delete Admin"
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#C23B32]/20 bg-[#FBEAEA] text-[#C23B32] transition hover:bg-[#C23B32] hover:text-white"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE */}
          <div className="block lg:hidden">
            {paginatedAdmins.length > 0 ? (
              paginatedAdmins.map((admin, index) => {
                const adminRole = admin.roles?.[0] || null;
                const isHighlighted = highlightedAdminId === admin.id;

                return (
                  <div
                    key={admin.id}
                    className={`border-b border-[#163F20]/10 p-5 transition-all duration-300 ${
                      isHighlighted
                        ? "bg-[#EAF3EA] border-l-4 border-l-[#163F20]"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] text-xs font-bold text-white">
                          {getInitials(admin.name)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#202721]">
                            {admin.name}
                          </p>

                          <p className="mt-1 truncate text-xs text-[#59645C]">
                            {admin.email}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-[#9AA29C]">
                        #{startIndex + index + 1}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                          Role
                        </p>

                        <p className="mt-1.5 text-xs font-bold text-[#202721]">
                          {adminRole?.name || "No Role"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                          Created
                        </p>

                        <p className="mt-1.5 text-xs font-bold text-[#202721]">
                          {formatDate(admin.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditAdmin(admin)}
                        className="flex h-9 items-center gap-1.5 rounded-lg border border-[#163F20]/15 bg-[#F5F7F5] px-3 text-xs font-bold text-[#163F20]"
                      >
                        <FiEdit2 size={13} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => openDeleteAdmin(admin)}
                        className="flex h-9 items-center gap-1.5 rounded-lg border border-[#C23B32]/20 bg-[#FBEAEA] px-3 text-xs font-bold text-[#C23B32]"
                      >
                        <FiTrash2 size={13} />
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center py-16 text-center">
                <FiUsers size={27} className="text-[#163F20]" />

                <p className="mt-4 text-sm font-bold text-[#202721]">
                  No administrators found
                </p>
              </div>
            )}
          </div>

          {/* PAGINATION */}
          {filteredAdmins.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-[#163F20]/10 bg-[#FAFBFA] px-5 py-4 sm:flex-row">
              <p className="text-xs text-[#89918B]">
                Showing{" "}
                <span className="font-bold text-[#3F4A41]">{startEntry}</span>{" "}
                to <span className="font-bold text-[#3F4A41]">{endEntry}</span>{" "}
                of{" "}
                <span className="font-bold text-[#3F4A41]">
                  {filteredAdmins.length}
                </span>{" "}
                entries
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={currentPage === 1}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#163F20]/15 bg-white text-[#163F20] transition hover:bg-[#EAF3EA] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <FiChevronLeft size={16} />
                </button>

                {paginationPages.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-xs font-bold ${
                      currentPage === page
                        ? "bg-gradient-to-br from-[#4C8A57] to-[#163F20] text-white shadow-[0_6px_14px_-6px_rgba(22,63,32,0.5)]"
                        : "text-[#59645C] hover:bg-[#F5F7F5] hover:text-[#163F20]"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#163F20]/15 bg-white text-[#163F20] transition hover:bg-[#EAF3EA] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <FiChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* CREATE / EDIT MODAL */}
      <AdminFormModal
        open={modalOpen}
        loading={actionLoading}
        editingAdmin={editingAdmin}
        roles={roles}
        form={adminForm}
        setForm={setAdminForm}
        onClose={() => {
          if (!actionLoading) {
            setModalOpen(false);
            setEditingAdmin(null);
          }
        }}
        onSubmit={submitAdmin}
      />

      {/* DELETE MODAL */}
      <DeleteAdminModal
        open={deleteModalOpen}
        loading={deleteLoading}
        target={deleteTarget}
        onClose={() => {
          if (!deleteLoading) {
            setDeleteModalOpen(false);
            setDeleteTarget(null);
          }
        }}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default AdminManagement;
