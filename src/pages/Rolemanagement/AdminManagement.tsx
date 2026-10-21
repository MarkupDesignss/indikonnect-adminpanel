import React, {
  ChangeEvent,
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
  FiShieldOff,
  FiAlertCircle,
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

import GlobalModal from "@/components/common/GlobalModal";

import adminManagementApi, {
  AdminMember,
  Role,
} from "@/api/endpoints/rolemanagement";

import { usePermissions } from "../../pages/permissions/usePermissions";
import logoApi from "@/api/endpoints/logoApi";
import PermissionLoadingState from "@/components/common/PermissionLoadingState";

const DEFAULT_LOGO_URL =
  "https://www.markupdesigns.net/indikonnect/storage/logos/MmVFOudCiVU3Y8C0sf2gEEXna5jSKroCDj8xYMo0.png";

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
  canSubmit: boolean;
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
  canSubmit,
}) => {
  const selectedRole = roles.find((role) => role.id === form.role_id);

  if (!open) return null;

  const inputBase =
    "w-full rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] text-sm text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/10 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <GlobalModal
      isOpen={open}
      onClose={() => {
        if (!loading) onClose();
      }}
      closeOnOverlayClick={!loading}
    >
      <div className="w-full max-w-[620px] overflow-hidden rounded-[22px] border border-[#DCE6F2] bg-white font-poppins shadow-[0_25px_70px_rgba(45,111,232,0.18)]">
        <div className="h-[3px] bg-gradient-to-r from-[#4F8FF7] via-[#2D6FE8] to-[#2D6FE8]" />

        {/* HEADER */}
        <div className="flex items-start justify-between gap-4 border-b border-[#DCE6F2] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#2D6FE8]">
              <FiUsers size={20} />
            </div>

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#2D6FE8]">
                Admin Access
              </p>

              <h2 className="mt-1 text-[21px] font-bold text-[#111827]">
                {editingAdmin ? "Edit Admin" : "Create Admin"}
              </h2>

              <p className="mt-0.5 text-xs text-[#6B7280]">
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
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F8FD] text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:opacity-40"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="max-h-[70vh] overflow-y-auto bg-[#F8FBFF] p-5">
          <div className="space-y-4">
            {/* BASIC INFORMATION */}
            <div className="rounded-2xl border border-[#DCE6F2] bg-white p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#2D6FE8]">
                  <FiUsers size={16} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#111827]">
                    Administrator Information
                  </h3>
                  <p className="mt-0.5 text-[10px] text-[#6B7280]">
                    Enter the admin account details.
                  </p>
                </div>
              </div>

              {/* NAME */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
                  Full Name *
                </label>

                <input
                  type="text"
                  value={form.name}
                  disabled={loading || !canSubmit}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setForm((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  placeholder="John Admin"
                  className={`${inputBase} h-11 px-4`}
                />
              </div>

              {/* EMAIL */}
              <div className="mt-4">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
                  Email *
                </label>

                <div className="relative">
                  <FiMail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D6FE8]"
                  />

                  <input
                    type="email"
                    value={form.email}
                    disabled={!!editingAdmin || loading || !canSubmit}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setForm((previous) => ({
                        ...previous,
                        email: event.target.value,
                      }))
                    }
                    placeholder="admin@example.com"
                    className={`${inputBase} h-11 pl-10 pr-4 ${
                      editingAdmin ? "bg-[#EAF3FF]" : ""
                    }`}
                  />
                </div>

                {editingAdmin && (
                  <p className="mt-1.5 text-[10px] text-[#6B7280]">
                    Email cannot be changed while editing an admin.
                  </p>
                )}
              </div>

              {/* PASSWORD */}
              <div className="mt-4">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
                  {editingAdmin ? "New Password" : "Password *"}
                </label>

                <div className="relative">
                  <FiLock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D6FE8]"
                  />

                  <input
                    type="password"
                    value={form.password}
                    disabled={loading || !canSubmit}
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
                    className={`${inputBase} h-11 pl-10 pr-4`}
                  />
                </div>
              </div>
            </div>

            {/* ROLE */}
            <div className="rounded-2xl border border-[#DCE6F2] bg-white p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#2D6FE8]">
                    <FiShield size={16} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#111827]">
                      Assign Role
                    </h3>
                    <p className="mt-0.5 text-[10px] text-[#6B7280]">
                      Select one role for this administrator.
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-[#EAF3FF] px-3 py-1.5 text-[9px] font-bold text-[#2D6FE8]">
                  {roles.length} Roles
                </span>
              </div>

              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
                Select Role *
              </label>

              <div className="relative">
                <FiShield
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D6FE8]"
                />

                <select
                  value={form.role_id ?? ""}
                  disabled={loading || !canSubmit}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    setForm((previous) => ({
                      ...previous,
                      role_id: event.target.value
                        ? Number(event.target.value)
                        : null,
                    }))
                  }
                  className={`${inputBase} h-12 appearance-none pl-10 pr-10 font-semibold`}
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>

                <svg
                  className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2D6FE8]"
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

              {selectedRole && (
                <div className="mt-4 rounded-xl border border-[#2D6FE8]/25 bg-[#EAF3FF] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#2D6FE8]">
                        Selected Role
                      </p>

                      <p className="mt-1 text-sm font-bold text-[#111827]">
                        {selectedRole.name}
                      </p>

                      <p className="mt-1 font-mono text-[10px] text-[#6B7280]">
                        {selectedRole.slug}
                      </p>
                    </div>

                    <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-bold text-[#2D6FE8]">
                      {selectedRole.permissions?.length || 0} Permissions
                    </span>
                  </div>

                  {selectedRole.description && (
                    <p className="mt-3 text-xs leading-5 text-[#6B7280]">
                      {selectedRole.description}
                    </p>
                  )}

                  {selectedRole.permissions &&
                    selectedRole.permissions.length > 0 && (
                      <div className="mt-3 border-t border-[#2D6FE8]/15 pt-3">
                        <div className="flex flex-wrap gap-1.5">
                          {selectedRole.permissions.map((permission) => (
                            <span
                              key={permission.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#DCE6F2] bg-white px-2.5 py-1.5 text-[9px] font-bold text-[#6B7280]"
                            >
                              <FiCheck size={10} className="text-[#2D6FE8]" />
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
        <div className="flex justify-end gap-2 border-t border-[#DCE6F2] bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-10 rounded-xl border border-[#DCE6F2] bg-white px-5 text-sm font-bold text-[#6B7280] transition hover:bg-[#F4F8FD] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || !canSubmit}
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-6 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(45,111,232,0.6)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
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
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={!loading}
    >
      <div className="w-full max-w-[450px] overflow-hidden rounded-[22px] border border-[#DCE6F2] bg-white font-poppins shadow-2xl">
        <div className="h-[3px] bg-gradient-to-r from-[#2D6FE8] to-[#C23B32]" />

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#C23B32]">
              <FiTrash2 size={22} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#C23B32]">
                    Confirmation
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-[#111827]">
                    Delete Admin
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F4F8FD] text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:opacity-40"
                >
                  <FiX size={16} />
                </button>
              </div>

              <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                Are you sure you want to delete this administrator? This action
                cannot be undone.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] p-4">
            <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
              Selected Admin
            </p>
            <p className="mt-1.5 text-base font-bold text-[#111827]">
              {target.name}
            </p>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-10 rounded-xl border border-[#DCE6F2] bg-white px-5 text-sm font-bold text-[#6B7280] transition hover:bg-[#F4F8FD] disabled:opacity-50"
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
// ACCESS DENIED
// =====================================================
const AccessDenied: FC = () => (
  <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#F4F8FD] p-6 font-poppins">
    <div className="w-full max-w-[460px] rounded-[24px] border border-[#DCE6F2] bg-white p-8 text-center shadow-[0_15px_50px_rgba(45,111,232,0.08)]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#C23B32]">
        <FiShieldOff size={28} />
      </div>

      <h2 className="mt-5 text-xl font-bold text-[#111827]">Access Denied</h2>

      <p className="mt-2 text-sm leading-6 text-[#6B7280]">
        You don't have permission to access the Admin Management module.
      </p>

      <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-[#F0D1CE] bg-[#FEF2F2] px-4 py-3 text-xs font-bold text-[#C23B32]">
        <FiAlertCircle size={14} />
        Contact your administrator to request access.
      </div>
    </div>
  </div>
);


const AdminManagement: FC = () => {
  const location = useLocation();
  const adminFromHeader = location.state?.admin as AdminMember | undefined;

  // ===================================================
  // PERMISSIONS
  // ===================================================
  const {
    hasPermission,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  const canViewAdmins = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("admin_member.view") ||
      hasPermission("admin_member.details"),
    [isSuperAdmin, hasPermission],
  );

  const canCreateAdmin = useMemo(
    () => isSuperAdmin || hasPermission("admin_member.create"),
    [isSuperAdmin, hasPermission],
  );

  const canUpdateAdmin = useMemo(
    () => isSuperAdmin || hasPermission("admin_member.edit"),
    [isSuperAdmin, hasPermission],
  );

  const canDeleteAdmin = useMemo(
    () => isSuperAdmin || hasPermission("admin_member.delete"),
    [isSuperAdmin, hasPermission],
  );

  const canViewRoles = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("role.view") ||
      hasPermission("roles.view"),
    [isSuperAdmin, hasPermission],
  );

  // ===================================================
  // ✅ LOGO STATE (same pattern as Orders / ReturnRefund / CreditNotes / Payment)
  // ===================================================

  const [logoUrl, setLogoUrl] = useState<string | null>(DEFAULT_LOGO_URL);
  const [logoLoading, setLogoLoading] = useState(true);

  // ===================================================
  // STATES
  // ===================================================
  const [admins, setAdmins] = useState<AdminMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  // ✅ first load only — subsequent fetches don't block page
  const [initialAdminsLoading, setInitialAdminsLoading] = useState(true);
  const [loading, setLoading] = useState(false);

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
  // FETCH PROTECTION
  // ===================================================
  const fetchInFlightRef = useRef<Promise<void> | null>(null);
  const hasInitialFetchRef = useRef(false);

  // ===================================================
  // LOGO FETCH (same as Orders / ReturnRefund / CreditNotes / Payment)
  // ===================================================

  useEffect(() => {
    let cancelled = false;

    const fetchLogo = async () => {
      try {
        const response: any = await logoApi.getLogo();

        const possibleLogos: unknown[] = [
          response?.data?.data?.logo,
          response?.data?.logo,
          response?.data?.data?.data?.logo,
          response?.data?.data?.logo_url,
          response?.data?.logo_url,
          response?.logo,
        ];

        const resolvedLogo = possibleLogos.find(
          (value): value is string =>
            typeof value === "string" && /^https?:\/\//i.test(value.trim()),
        );

        if (!cancelled && resolvedLogo) {
          setLogoUrl(resolvedLogo.trim());
        }
      } catch (error) {
        console.error("Logo API error:", error);
      } finally {
        if (!cancelled) {
          setLogoLoading(false);
        }
      }
    };

    void fetchLogo();

    return () => {
      cancelled = true;
    };
  }, []);

  // ===================================================
  // OPEN EDIT
  // ===================================================
  const openEditAdmin = useCallback(
    (admin: AdminMember) => {
      if (!canUpdateAdmin) {
        toast.error("You do not have permission to update admins.");
        return;
      }
      if (!canViewRoles) {
        toast.error("You do not have permission to view roles.");
        return;
      }

      setEditingAdmin(admin);
      setAdminForm({
        name: admin.name || "",
        email: admin.email || "",
        password: "",
        role_id: admin.roles?.[0]?.id || null,
      });
      setModalOpen(true);
    },
    [canUpdateAdmin, canViewRoles],
  );

  // ===================================================
  // FETCH
  // isInitialLoad = true ONLY FOR THE FIRST LOAD
  // ===================================================
  const fetchAll = useCallback(
    async (force = false, isInitialLoadParam = false) => {
      if (!canViewAdmins) {
        setLoading(false);
        if (isInitialLoadParam) setInitialAdminsLoading(false);
        return;
      }

      if (fetchInFlightRef.current) return fetchInFlightRef.current;
      if (!force && hasInitialFetchRef.current) return;

      const requestPromise = (async () => {
        try {
          setLoading(true);

          const requests: Promise<any>[] = [adminManagementApi.getAdmins()];

          if (canViewRoles) {
            requests.push(adminManagementApi.getRoles());
          }

          const responses = await Promise.all(requests);
          const adminsResponse = responses[0];
          const adminsRaw = adminsResponse.data;

          const adminsData = Array.isArray(adminsRaw)
            ? adminsRaw
            : adminsRaw &&
                typeof adminsRaw === "object" &&
                "data" in adminsRaw &&
                Array.isArray((adminsRaw as { data?: unknown }).data)
              ? (adminsRaw as { data: AdminMember[] }).data
              : [];

          let rolesData: Role[] = [];

          if (canViewRoles && responses[1]) {
            const rolesRaw = responses[1].data;

            rolesData = Array.isArray(rolesRaw)
              ? rolesRaw
              : rolesRaw &&
                  typeof rolesRaw === "object" &&
                  "data" in rolesRaw &&
                  Array.isArray((rolesRaw as { data?: unknown }).data)
                ? (rolesRaw as { data: Role[] }).data
                : [];
          }

          setAdmins(adminsData as AdminMember[]);
          setRoles(rolesData as Role[]);

          if (adminFromHeader && isInitialLoad && adminsData.length > 0) {
            const targetAdmin = adminsData.find(
              (admin: AdminMember) =>
                String(admin.id) === String(adminFromHeader.id),
            );

            if (targetAdmin) {
              const searchTerm =
                targetAdmin.name ||
                targetAdmin.email ||
                String(targetAdmin.id);
              setSearch(searchTerm);
              setHighlightedAdminId(targetAdmin.id);

              if (canUpdateAdmin && canViewRoles) {
                openEditAdmin(targetAdmin);
              }
            } else {
              setSearch(String(adminFromHeader.id));
              toast.info(`Looking for admin with ID: ${adminFromHeader.id}`);
            }

            setIsInitialLoad(false);
          }

          hasInitialFetchRef.current = true;
        } catch (error: any) {
          console.error("Admin management fetch error:", error);
          toast.error(
            error?.response?.data?.message ||
              "Unable to load admin management data.",
          );
        } finally {
          setLoading(false);

          if (isInitialLoadParam) {
            setInitialAdminsLoading(false);
          }
        }
      })();

      fetchInFlightRef.current = requestPromise;

      try {
        await requestPromise;
      } finally {
        fetchInFlightRef.current = null;
      }
    },
    [
      canViewAdmins,
      canViewRoles,
      adminFromHeader,
      isInitialLoad,
      canUpdateAdmin,
      openEditAdmin,
    ],
  );

  // ===================================================
  // INITIAL FETCH
  // WAIT FOR PERMISSIONS BEFORE REQUESTING ADMINS
  // ===================================================
  useEffect(() => {
    if (permissionsLoading) return;

    if (canViewAdmins && !hasInitialFetchRef.current) {
      void fetchAll(false, true);
    } else if (!canViewAdmins) {
      setLoading(false);
      setInitialAdminsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionsLoading, canViewAdmins, fetchAll]);

  // ===================================================
  // COMBINED INITIAL LOADING
  // ===================================================

  const pageLoading =
    permissionsLoading ||
    logoLoading ||
    initialAdminsLoading;

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
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    if (currentPage <= 3) return [1, 2, 3, 4, 5];
    if (currentPage >= totalPages - 2) {
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
  }, [currentPage, totalPages]);

  // ===================================================
  // CREATE
  // ===================================================
  const openCreateAdmin = () => {
    if (!canCreateAdmin) {
      toast.error("You do not have permission to create admins.");
      return;
    }
    if (!canViewRoles) {
      toast.error("You do not have permission to view roles.");
      return;
    }

    setEditingAdmin(null);
    setAdminForm({
      name: "",
      email: "",
      password: "",
      role_id: roles.length > 0 ? roles[0].id : null,
    });
    setModalOpen(true);
  };

  // ===================================================
  // SUBMIT
  // ===================================================
  const submitAdmin = async () => {
    const canSubmit = editingAdmin ? canUpdateAdmin : canCreateAdmin;

    if (!canSubmit) {
      toast.error(
        editingAdmin
          ? "You do not have permission to update admins."
          : "You do not have permission to create admins.",
      );
      return;
    }
    if (!canViewRoles) {
      toast.error("You do not have permission to view roles.");
      return;
    }
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
      } else {
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
      await fetchAll(true);
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
    if (!canDeleteAdmin) {
      toast.error("You do not have permission to delete admins.");
      return;
    }
    setDeleteTarget({ id: admin.id, name: admin.name });
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (!canDeleteAdmin) {
      toast.error("You do not have permission to delete admins.");
      return;
    }

    try {
      setDeleteLoading(true);
      const response = await adminManagementApi.deleteAdmin(deleteTarget.id);
      toast.success(response.data?.message || "Admin deleted successfully.");
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      await fetchAll(true);
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


  if (pageLoading) {
    return <PermissionLoadingState logoUrl={logoUrl} />;
  }

  // ===================================================
  // ACCESS DENIED
  // ===================================================

  if (!canViewAdmins) return <AccessDenied />;

  // ===================================================
  // UI
  // ===================================================
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-white p-4 font-poppins sm:p-5 lg:p-5"
      >
        {/* HEADER */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2D6FE8]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#4F8FF7]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#2D6FE8]">
                User Management
              </span>
            </div>

            <h1 className="text-[20px] font-medium tracking-tight text-[#111827] sm:text-[22px]">
              Admin Management
            </h1>

            <p className="mt-0.5 text-sm text-[#111827]">
              Manage administrators and assign roles from one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start">
            <button
              type="button"
              onClick={() => fetchAll(true)}
              disabled={loading}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#2D6FE8]/20 bg-white px-4 text-sm font-bold text-[#2D6FE8] transition hover:border-[#4F8FF7]/40 hover:bg-[#EAF3FF] disabled:opacity-50"
            >
              <FiRefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            {canCreateAdmin && (
              <button
                type="button"
                onClick={openCreateAdmin}
                disabled={!canViewRoles}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#2D6FE8]/20 bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiPlus size={17} />
                Add Admin
              </button>
            )}
          </div>
        </div>

        {/* MAIN CARD */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mt-6 overflow-hidden rounded-[22px] border border-[#DCE6F2] bg-white shadow-[0_8px_30px_rgba(45,111,232,0.06)]"
        >
    
          {/* TOOLBAR */}
          <div className="border-b border-[#DCE6F2] p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full xl:max-w-[500px]">
                <FiSearch
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2D6FE8]"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => handleSearch(event.target.value)}
                  placeholder="Search name, email, ID or role..."
                  className="h-11 w-full rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] pl-11 pr-4 text-sm text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#4F8FF7]/10"
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
                        ? "bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] text-white shadow-[0_6px_14px_-6px_rgba(45,111,232,0.5)]"
                        : "border border-[#DCE6F2] bg-[#F4F8FD] text-[#6B7280] hover:border-[#4F8FF7]/30 hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

    
          {/* DESKTOP TABLE */}
          <div className="hidden lg:block">
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-[6%]" />
                <col className="w-[22%]" />
                <col className="w-[22%]" />
                <col className="w-[18%]" />
                <col className="w-[14%]" />
                <col className="w-[18%]" />
              </colgroup>

              <thead>
                <tr className="bg-[#4F8FF7]">
                  <th className="rounded-tl-2xl px-3 py-4 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-white">
                    S.No.
                  </th>
                  <th className="px-3 py-4 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-white">
                    Administrator
                  </th>
                  <th className="px-3 py-4 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-white">
                    Email
                  </th>
                  <th className="px-3 py-4 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-white">
                    Role
                  </th>
                  <th className="px-3 py-4 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-white">
                    Created
                  </th>
                  <th className="rounded-tr-2xl px-3 py-4 text-center text-[9px] font-bold uppercase tracking-[0.1em] text-white">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {/* ✅ initialAdminsLoading par full spinner — refresh/CRUD par nahi */}
                {initialAdminsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                          <FiRefreshCw size={22} className="animate-spin" />
                        </div>
                        <p className="mt-4 text-sm font-bold text-[#111827]">
                          Loading admins...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : loading && admins.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                          <FiRefreshCw size={22} className="animate-spin" />
                        </div>
                        <p className="mt-4 text-sm font-bold text-[#111827]">
                          Loading admins...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                          <FiUsers size={25} />
                        </div>
                        <p className="mt-4 text-sm font-bold text-[#111827]">
                          No administrators found
                        </p>
                        <p className="mt-1 text-xs text-[#6B7280]">
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
                      <motion.tr
                        key={admin.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`border-b border-[#DCE6F2] transition ${
                          isHighlighted ? "bg-[#EAF3FF]" : "bg-white hover:bg-[#F8FBFF]"
                        }`}
                      >
                        <td className="px-3 py-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EAF3FF] text-[11px] font-bold text-[#2D6FE8]">
                            {startIndex + index + 1}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-[10px] font-bold text-white">
                              {getInitials(admin.name)}
                            </div>
                            <p
                              className="truncate text-xs font-bold text-[#111827]"
                              title={admin.name}
                            >
                              {admin.name}
                            </p>
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <FiMail size={13} className="shrink-0 text-[#2D6FE8]" />
                            <span
                              className="truncate text-[11px] font-semibold text-[#6B7280]"
                              title={admin.email}
                            >
                              {admin.email}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          {adminRole ? (
                            <div>
                              <span className="inline-flex items-center gap-1 rounded-full border border-[#2D6FE8]/25 bg-[#EAF3FF] px-2.5 py-1 text-[10px] font-bold text-[#2D6FE8]">
                                <FiShield size={10} />
                                {adminRole.name}
                              </span>
                              <p className="mt-1 truncate font-mono text-[9px] text-[#6B7280]">
                                {adminRole.slug}
                              </p>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#DCE6F2] bg-[#F4F8FD] px-2.5 py-1 text-[10px] font-bold text-[#6B7280]">
                              <FiShieldOff size={10} />
                              No Role
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-3">
                          <span className="text-[10px] font-semibold text-[#6B7280]">
                            {formatDate(admin.created_at)}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            {canUpdateAdmin && (
                              <button
                                type="button"
                                onClick={() => openEditAdmin(admin)}
                                title="Edit Admin"
                                disabled={!canViewRoles}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2D6FE8]/15 bg-white text-[#2D6FE8] transition hover:bg-[#2D6FE8] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <FiEdit2 size={14} />
                              </button>
                            )}

                            {canDeleteAdmin && (
                              <button
                                type="button"
                                onClick={() => openDeleteAdmin(admin)}
                                title="Delete Admin"
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#C23B32]/20 bg-[#FEF2F2] text-[#C23B32] transition hover:border-transparent hover:bg-[#C23B32] hover:text-white"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            )}

                            {!canUpdateAdmin && !canDeleteAdmin && (
                              <span className="rounded-lg border border-[#DCE6F2] bg-[#F4F8FD] px-2.5 py-1.5 text-[9px] font-bold text-[#6B7280]">
                                View Only
                              </span>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE */}
          <div className="block lg:hidden">
            {/* ✅ initialAdminsLoading par full spinner — refresh/CRUD par nahi */}
            {initialAdminsLoading ? (
              <div className="flex flex-col items-center py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                  <FiRefreshCw size={22} className="animate-spin" />
                </div>
                <p className="mt-4 text-sm font-bold text-[#111827]">
                  Loading admins...
                </p>
              </div>
            ) : loading && admins.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                  <FiRefreshCw size={22} className="animate-spin" />
                </div>
                <p className="mt-4 text-sm font-bold text-[#111827]">
                  Loading admins...
                </p>
              </div>
            ) : paginatedAdmins.length > 0 ? (
              paginatedAdmins.map((admin, index) => {
                const adminRole = admin.roles?.[0] || null;
                const isHighlighted = highlightedAdminId === admin.id;

                return (
                  <div
                    key={admin.id}
                    className={`border-b border-[#DCE6F2] p-4 ${
                      isHighlighted ? "bg-[#EAF3FF]" : "bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-[11px] font-bold text-white">
                          {getInitials(admin.name)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#111827]">
                            {admin.name}
                          </p>
                          <p className="mt-1 truncate text-xs text-[#6B7280]">
                            {admin.email}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-[#6B7280]">
                        #{startIndex + index + 1}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-[#DCE6F2] bg-[#F8FBFF] p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                          Role
                        </p>
                        <p className="mt-1.5 text-xs font-bold text-[#111827]">
                          {adminRole?.name || "No Role"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#DCE6F2] bg-[#F8FBFF] p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                          Created
                        </p>
                        <p className="mt-1.5 text-xs font-bold text-[#111827]">
                          {formatDate(admin.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                      {canUpdateAdmin && (
                        <button
                          type="button"
                          onClick={() => openEditAdmin(admin)}
                          disabled={!canViewRoles}
                          className="flex h-9 items-center gap-1.5 rounded-lg border border-[#2D6FE8]/15 bg-white px-3 text-xs font-bold text-[#2D6FE8] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <FiEdit2 size={13} />
                          Edit
                        </button>
                      )}

                      {canDeleteAdmin && (
                        <button
                          type="button"
                          onClick={() => openDeleteAdmin(admin)}
                          className="flex h-9 items-center gap-1.5 rounded-lg border border-[#C23B32]/20 bg-[#FEF2F2] px-3 text-xs font-bold text-[#C23B32]"
                        >
                          <FiTrash2 size={13} />
                          Delete
                        </button>
                      )}

                      {!canUpdateAdmin && !canDeleteAdmin && (
                        <span className="rounded-lg border border-[#DCE6F2] bg-[#F4F8FD] px-3 py-2 text-[9px] font-bold text-[#6B7280]">
                          View Only
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                  <FiUsers size={25} />
                </div>
                <p className="mt-4 text-sm font-bold text-[#111827]">
                  No administrators found
                </p>
              </div>
            )}
          </div>

          {/* PAGINATION */}
          {!pageLoading && filteredAdmins.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-[#DCE6F2] bg-[#F8FBFF] px-4 py-4 sm:flex-row sm:px-5">
              <p className="text-xs text-[#6B7280]">
                Showing{" "}
                <span className="font-bold text-[#111827]">{startEntry}</span>{" "}
                to{" "}
                <span className="font-bold text-[#111827]">{endEntry}</span> of{" "}
                <span className="font-bold text-[#111827]">
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
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-30"
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
                        ? "bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-white shadow-[0_6px_14px_-6px_rgba(45,111,232,0.5)]"
                        : "border border-[#DCE6F2] bg-white text-[#6B7280] hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"
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
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-30"
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
        canSubmit={
          editingAdmin
            ? canUpdateAdmin && canViewRoles
            : canCreateAdmin && canViewRoles
        }
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