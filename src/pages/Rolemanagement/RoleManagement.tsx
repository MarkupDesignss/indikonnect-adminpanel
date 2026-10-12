import React, {
  ChangeEvent,
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FiCheck,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiKey,
  FiLayers,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import GlobalModal from "@/components/common/GlobalModal";
import adminManagementApi, {
  Permission,
  Role,
  RolePayload,
  PermissionGroups,
} from "@/api/endpoints/rolemanagement";
import { usePermissions } from "../../pages/permissions/usePermissions";

// =====================================================
// BLUE + YELLOW THEME
// =====================================================

const PRIMARY = "#2D6FE8";
const PRIMARY_DARK = "#1D4FB8";
const PRIMARY_LIGHT = "#4F8FF7";
const LIGHT_BLUE = "#EAF3FF";
const SOFT_BLUE = "#DCEBFF";
const PAGE_BG = "#F4F8FD";
const SOFT_SURFACE = "#F8FBFF";

const YELLOW = "#FACC15";
const LIGHT_YELLOW = "#FEF9C3";
const YELLOW_TEXT = "#A16207";

const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#4B5563";
const MUTED = "#6B7280";
const BORDER = "#DCE6F2";
const WHITE = "#FFFFFF";
const DANGER = "#C23B32";
const DANGER_BG = "#FEF2F2";

const PRIMARY_GRADIENT = `linear-gradient(135deg, ${PRIMARY_LIGHT}, ${PRIMARY}, ${PRIMARY_DARK})`;

// =====================================================
// PERMISSION KEYS
// =====================================================

const VIEW_PERMISSION_KEYS = [
  "role.view",
  "roles.view",
  "Role.view",
  "Roles.view",
  "role_management.view",
  "Role Management.view",
];

const CREATE_PERMISSION_KEYS = [
  "role.create",
  "roles.create",
  "Role.create",
  "Roles.create",
  "role_management.create",
  "Role Management.create",
];

const UPDATE_PERMISSION_KEYS = [
  "role.update",
  "roles.update",
  "Role.update",
  "Roles.update",
  "role_management.update",
  "Role Management.update",
  "role.edit",
  "roles.edit",
  "Role.edit",
  "Roles.edit",
];

const DELETE_PERMISSION_KEYS = [
  "role.delete",
  "roles.delete",
  "Role.delete",
  "Roles.delete",
  "role_management.delete",
  "Role Management.delete",
];

const PERMISSION_VIEW_KEYS = [
  "permission.view",
  "permissions.view",
  "Permission.view",
  "Permissions.view",
];

// =====================================================
// TYPES
// =====================================================

interface RoleFormState {
  name: string;
  slug: string;
  description: string;
  permissions: number[];
}

interface DeleteTarget {
  id: number;
  name: string;
}

interface DeleteRoleModalProps {
  open: boolean;
  loading: boolean;
  target: DeleteTarget | null;
  onClose: () => void;
  onConfirm: () => void;
}

interface RoleModalProps {
  open: boolean;
  loading: boolean;
  editingRole: Role | null;
  permissions: Permission[];
  form: RoleFormState;
  setForm: React.Dispatch<React.SetStateAction<RoleFormState>>;
  onClose: () => void;
  onSubmit: () => void;
}

// =====================================================
// HELPERS
// =====================================================

const formatModuleName = (module: string): string =>
  module
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatActionName = (action?: string): string => {
  if (!action) return "—";
  return action
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
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

const generateSlug = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// =====================================================
// DELETE ROLE MODAL
// =====================================================

const DeleteRoleModal: FC<DeleteRoleModalProps> = ({
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
      <div className="w-full max-w-[450px] overflow-hidden rounded-[22px] border bg-white shadow-2xl" style={{ borderColor: BORDER }}>
        <div className="h-1" style={{ background: `linear-gradient(to right, ${YELLOW}, ${PRIMARY}, ${DANGER})` }} />
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: DANGER_BG, color: DANGER }}>
              <FiTrash2 size={21} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: DANGER }}>Confirmation</p>
                  <h2 className="mt-1 text-xl font-bold" style={{ color: TEXT_PRIMARY }}>Delete Role</h2>
                </div>
                <button type="button" onClick={onClose} disabled={loading} aria-label="Close delete dialog" className="flex h-9 w-9 items-center justify-center rounded-xl transition disabled:opacity-40" style={{ backgroundColor: PAGE_BG, color: PRIMARY }}>
                  <FiX size={17} />
                </button>
              </div>
              <p className="mt-2 text-sm leading-6" style={{ color: TEXT_SECONDARY }}>
                Are you sure you want to delete this role? This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border p-4" style={{ borderColor: BORDER, backgroundColor: PAGE_BG }}>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: MUTED }}>Selected Role</p>
            <p className="mt-1.5 text-base font-bold" style={{ color: TEXT_PRIMARY }}>{target.name}</p>
            <p className="mt-1 text-[10px]" style={{ color: MUTED }}>Role ID #{target.id}</p>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={loading} className="h-10 rounded-xl border bg-white px-5 text-sm font-bold transition disabled:opacity-50" style={{ borderColor: BORDER, color: TEXT_SECONDARY }}>
              Cancel
            </button>
            <button type="button" onClick={onConfirm} disabled={loading} className="flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-50" style={{ background: `linear-gradient(135deg, ${DANGER}, #A62F27)` }}>
              {loading ? <FiRefreshCw size={15} className="animate-spin" /> : <FiTrash2 size={15} />}
              {loading ? "Deleting..." : "Delete Role"}
            </button>
          </div>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// CREATE / EDIT ROLE MODAL
// =====================================================

const RoleModal: FC<RoleModalProps> = ({
  open,
  loading,
  editingRole,
  permissions,
  form,
  setForm,
  onClose,
  onSubmit,
}) => {
  const [selectedModule, setSelectedModule] = useState("");

  const moduleList = useMemo(
    () =>
      Array.from(new Set(permissions.map((permission) => permission.module).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [permissions]
  );

  const currentModulePermissions = useMemo(
    () => (selectedModule ? permissions.filter((permission) => permission.module === selectedModule) : []),
    [permissions, selectedModule]
  );

  const selectedCountInModule = currentModulePermissions.filter((permission) => form.permissions.includes(permission.id)).length;
  const allCurrentModuleSelected = currentModulePermissions.length > 0 && selectedCountInModule === currentModulePermissions.length;

  useEffect(() => {
    if (!open) return;
    if (moduleList.length === 0) {
      setSelectedModule("");
      return;
    }

    if (editingRole?.permissions?.length) {
      const existingModule = moduleList.find((module) =>
        editingRole.permissions?.some((permission) => permission.module === module)
      );
      setSelectedModule(existingModule || moduleList[0]);
      return;
    }
    setSelectedModule(moduleList[0]);
  }, [open, editingRole, moduleList]);

  const togglePermission = (permissionId: number) => {
    setForm((previous) => ({
      ...previous,
      permissions: previous.permissions.includes(permissionId)
        ? previous.permissions.filter((id) => id !== permissionId)
        : [...previous.permissions, permissionId],
    }));
  };

  const toggleCurrentModule = () => {
    if (!selectedModule) return;
    const moduleIds = currentModulePermissions.map((permission) => permission.id);
    setForm((previous) => ({
      ...previous,
      permissions: allCurrentModuleSelected
        ? previous.permissions.filter((id) => !moduleIds.includes(id))
        : Array.from(new Set([...previous.permissions, ...moduleIds])),
    }));
  };

  if (!open) return null;

  return (
    <GlobalModal
      isOpen={open}
      onClose={() => {
        if (!loading) onClose();
      }}
      closeOnOverlayClick={!loading}
    >
      <div className="w-full max-w-[700px] overflow-hidden rounded-[22px] border bg-white shadow-[0_25px_70px_rgba(45,111,232,0.18)]" style={{ borderColor: BORDER }}>
        <div className="h-1" style={{ background: `linear-gradient(to right, ${YELLOW}, ${PRIMARY_LIGHT}, ${PRIMARY_DARK})` }} />

        {/* Modal header */}
        <div className="flex items-start justify-between gap-4 border-b px-5 py-5 sm:px-6" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: LIGHT_BLUE, color: PRIMARY }}>
              <FiShield size={20} />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: PRIMARY }}>Access Control</p>
              <h2 className="mt-1 text-[21px] font-bold" style={{ color: TEXT_PRIMARY }}>{editingRole ? "Edit Role" : "Create Role"}</h2>
              <p className="mt-0.5 text-xs" style={{ color: MUTED }}>
                {editingRole ? "Update role details and permissions." : "Create a role and assign required permissions."}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={loading} aria-label="Close role dialog" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition disabled:opacity-40" style={{ backgroundColor: PAGE_BG, color: PRIMARY }}>
            <FiX size={18} />
          </button>
        </div>

        {/* Modal body */}
        <div className="max-h-[68vh] overflow-y-auto p-4 sm:p-5" style={{ backgroundColor: PAGE_BG }}>
          <div className="space-y-4">
            <section className="rounded-2xl border bg-white p-4 sm:p-5" style={{ borderColor: BORDER }}>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: LIGHT_BLUE, color: PRIMARY }}><FiShield size={16} /></div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: TEXT_PRIMARY }}>Role Information</h3>
                  <p className="mt-0.5 text-[10px]" style={{ color: MUTED }}>Enter the basic information for this role.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>Role Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    disabled={loading}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      const value = event.target.value;
                      setForm((previous) => ({
                        ...previous,
                        name: value,
                        slug: !previous.slug || previous.slug === generateSlug(previous.name) ? generateSlug(value) : previous.slug,
                      }));
                    }}
                    placeholder="Order Manager"
                    className="h-11 w-full rounded-xl px-4 text-sm outline-none placeholder:text-[#9CA3AF] disabled:opacity-60"
                    style={{ border: `1px solid ${BORDER}`, backgroundColor: loading ? "#EEF3FA" : PAGE_BG, color: TEXT_PRIMARY }}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>Role Slug *</label>
                  <input
                    type="text"
                    value={form.slug}
                    disabled={loading}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setForm((previous) => ({ ...previous, slug: event.target.value }))}
                    placeholder="order-manager"
                    className="h-11 w-full rounded-xl px-4 font-mono text-sm outline-none placeholder:text-[#9CA3AF] disabled:opacity-60"
                    style={{ border: `1px solid ${BORDER}`, backgroundColor: loading ? "#EEF3FA" : PAGE_BG, color: TEXT_PRIMARY }}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  disabled={loading}
                  onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))}
                  placeholder="Role for managing orders"
                  className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none placeholder:text-[#9CA3AF] disabled:opacity-60"
                  style={{ border: `1px solid ${BORDER}`, backgroundColor: loading ? "#EEF3FA" : PAGE_BG, color: TEXT_PRIMARY }}
                />
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: BORDER }}>
              <div className="border-b px-4 py-4 sm:px-5" style={{ borderColor: BORDER }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: LIGHT_BLUE, color: PRIMARY }}><FiKey size={16} /></div>
                    <div>
                      <h3 className="text-sm font-bold" style={{ color: TEXT_PRIMARY }}>Role Permissions</h3>
                      <p className="mt-0.5 text-[10px]" style={{ color: MUTED }}>Select a module, then assign its permissions.</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold" style={{ backgroundColor: LIGHT_YELLOW, color: YELLOW_TEXT, border: `1px solid ${YELLOW}` }}>
                    {form.permissions.length} Selected
                  </span>
                </div>
              </div>

              <div className="px-4 pt-4 sm:px-5">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>Select Module</label>
                <div className="relative">
                  <FiLayers size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: PRIMARY }} />
                  <select
                    value={selectedModule}
                    onChange={(event) => setSelectedModule(event.target.value)}
                    disabled={loading}
                    className="h-12 w-full appearance-none rounded-xl pl-11 pr-11 text-sm font-semibold outline-none disabled:opacity-60"
                    style={{ border: `1px solid ${BORDER}`, backgroundColor: loading ? "#EEF3FA" : PAGE_BG, color: TEXT_PRIMARY }}
                  >
                    <option value="">Select a module...</option>
                    {moduleList.map((module) => {
                      const modulePermissions = permissions.filter((permission) => permission.module === module);
                      const selectedCount = modulePermissions.filter((permission) => form.permissions.includes(permission.id)).length;
                      return <option key={module} value={module}>{formatModuleName(module)} — {selectedCount}/{modulePermissions.length} selected</option>;
                    })}
                  </select>
                  <FiChevronDown size={17} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" style={{ color: PRIMARY }} />
                </div>
              </div>

              {!selectedModule ? (
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-5 py-10 text-center" style={{ borderColor: BORDER, backgroundColor: SOFT_SURFACE }}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm" style={{ color: PRIMARY }}><FiLayers size={20} /></div>
                    <p className="mt-4 text-sm font-bold" style={{ color: TEXT_PRIMARY }}>Select a module</p>
                    <p className="mt-1 max-w-[340px] text-[11px] leading-5" style={{ color: MUTED }}>Choose a module from the dropdown above to view its available permissions.</p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 border-t" style={{ borderColor: BORDER }}>
                  <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5" style={{ backgroundColor: SOFT_SURFACE }}>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: LIGHT_BLUE, color: PRIMARY }}><FiLayers size={14} /></div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold" style={{ color: TEXT_PRIMARY }}>{formatModuleName(selectedModule)}</p>
                        <p className="mt-0.5 text-[9px]" style={{ color: MUTED }}>{currentModulePermissions.length} permissions available</p>
                      </div>
                    </div>
                    <button type="button" onClick={toggleCurrentModule} disabled={loading} className="shrink-0 rounded-lg border bg-white px-3 py-2 text-[10px] font-bold transition disabled:opacity-50" style={{ borderColor: allCurrentModuleSelected ? YELLOW : BORDER, color: TEXT_PRIMARY, boxShadow: allCurrentModuleSelected ? `inset 0 -2px 0 ${YELLOW}` : "none" }}>
                      {allCurrentModuleSelected ? "Unselect All" : "Select All"}
                    </button>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto p-3 sm:p-4">
                    {currentModulePermissions.length === 0 ? (
                      <p className="rounded-xl border border-dashed p-6 text-center text-xs" style={{ borderColor: BORDER, color: MUTED }}>No permissions found for this module.</p>
                    ) : (
                      <div className="space-y-2">
                        {currentModulePermissions.map((permission) => {
                          const checked = form.permissions.includes(permission.id);
                          return (
                            <label
                              key={permission.id}
                              className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-3 transition sm:px-4"
                              style={{ borderColor: checked ? PRIMARY_LIGHT : BORDER, backgroundColor: checked ? LIGHT_BLUE : WHITE, boxShadow: checked ? `inset 3px 0 0 ${YELLOW}` : "none" }}
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border" style={{ borderColor: checked ? PRIMARY : BORDER, backgroundColor: checked ? PRIMARY : WHITE, color: WHITE }}>
                                  {checked && <FiCheck size={12} />}
                                </span>
                                <span className="min-w-0">
                                  <span className="block break-words text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>{permission.name}</span>
                                  <span className="mt-1 block break-all font-mono text-[10px]" style={{ color: MUTED }}>{permission.slug}</span>
                                </span>
                              </div>
                              <span className="shrink-0 rounded-full px-2.5 py-1.5 text-[9px] font-bold" style={{ backgroundColor: checked ? LIGHT_YELLOW : PAGE_BG, color: checked ? YELLOW_TEXT : TEXT_SECONDARY }}>
                                {formatActionName(permission.action)}
                              </span>
                              <input type="checkbox" checked={checked} onChange={() => togglePermission(permission.id)} className="sr-only" disabled={loading} />
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t px-4 py-3 sm:px-5" style={{ borderColor: BORDER, backgroundColor: SOFT_SURFACE }}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>Selected Permissions</span>
                  {form.permissions.length > 0 ? (
                    <span className="rounded-full px-3 py-1 text-[9px] font-bold" style={{ backgroundColor: LIGHT_YELLOW, color: YELLOW_TEXT }}>{form.permissions.length} permissions selected</span>
                  ) : (
                    <span className="text-[9px]" style={{ color: MUTED }}>None selected</span>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Modal footer */}
        <div className="flex justify-end gap-2 border-t bg-white px-4 py-4 sm:px-6" style={{ borderColor: BORDER }}>
          <button type="button" onClick={onClose} disabled={loading} className="h-10 rounded-xl border bg-white px-5 text-sm font-bold transition disabled:opacity-50" style={{ borderColor: BORDER, color: TEXT_SECONDARY }}>Cancel</button>
          <button type="button" onClick={onSubmit} disabled={loading} className="flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 disabled:opacity-50 sm:px-6" style={{ background: PRIMARY_GRADIENT, boxShadow: `0 5px 0 ${YELLOW}` }}>
            {loading ? <FiRefreshCw size={14} className="animate-spin" /> : <FiCheck size={14} />}
            {loading ? (editingRole ? "Updating..." : "Creating...") : (editingRole ? "Update Role" : "Create Role")}
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// MAIN ROLE MANAGEMENT COMPONENT
// =====================================================

const RoleManagement: FC = () => {
  const {
    hasPermission,
    hasModuleAccess,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  const hasAnyPermission = useCallback(
    (permissionKeys: string[]) => permissionKeys.some((permission) => hasPermission(permission)),
    [hasPermission]
  );

  const canViewRoles = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("Role Management") ||
      hasModuleAccess("Role") ||
      hasModuleAccess("Roles") ||
      hasModuleAccess("role_management") ||
      hasModuleAccess("role") ||
      hasModuleAccess("roles") ||
      hasAnyPermission(VIEW_PERMISSION_KEYS),
    [isSuperAdmin, hasModuleAccess, hasAnyPermission]
  );

  const canCreateRole = useMemo(
    () => isSuperAdmin || hasAnyPermission(CREATE_PERMISSION_KEYS),
    [isSuperAdmin, hasAnyPermission]
  );
  const canUpdateRole = useMemo(
    () => isSuperAdmin || hasAnyPermission(UPDATE_PERMISSION_KEYS),
    [isSuperAdmin, hasAnyPermission]
  );
  const canDeleteRole = useMemo(
    () => isSuperAdmin || hasAnyPermission(DELETE_PERMISSION_KEYS),
    [isSuperAdmin, hasAnyPermission]
  );
  const canViewPermissions = useMemo(
    () => isSuperAdmin || hasAnyPermission(PERMISSION_VIEW_KEYS) || canViewRoles,
    [isSuperAdmin, hasAnyPermission, canViewRoles]
  );

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroups>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [permissionFilter, setPermissionFilter] = useState<"all" | "assigned" | "empty">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [roleForm, setRoleForm] = useState<RoleFormState>({ name: "", slug: "", description: "", permissions: [] });

  const ITEMS_PER_PAGE = 10;
  const fetchInFlightRef = useRef<Promise<void> | null>(null);
  const hasInitialFetchRef = useRef(false);

  const fetchAll = useCallback(async (force = false) => {
    if (!canViewRoles) return;
    if (fetchInFlightRef.current) return fetchInFlightRef.current;
    if (!force && hasInitialFetchRef.current) return;

    const requestPromise = (async () => {
      try {
        setLoading(true);
        const rolesRequest = adminManagementApi.getRoles();
        const responses = canViewPermissions
          ? await Promise.all([rolesRequest, adminManagementApi.getPermissions()])
          : [await rolesRequest];

        const rolesResponse = responses[0];
        const rawRoles = rolesResponse?.data;
        const rolesData: Role[] = Array.isArray(rawRoles)
          ? rawRoles
          : rawRoles && typeof rawRoles === "object" && "data" in rawRoles && Array.isArray((rawRoles as { data?: unknown }).data)
            ? (rawRoles as { data: Role[] }).data
            : [];
        setRoles(rolesData);

        if (canViewPermissions && responses[1]) {
          const permissionResponse = responses[1] as { data?: { data?: PermissionGroups } };
          const groups: PermissionGroups = permissionResponse.data?.data || {};
          setPermissionGroups(groups);
          setPermissions(Object.values(groups).flat());
        } else {
          setPermissionGroups({});
          setPermissions([]);
        }
        hasInitialFetchRef.current = true;
      } catch (error: any) {
        console.error("Role management fetch error:", error);
        toast.error(error?.response?.data?.message || "Unable to load roles and permissions.");
      } finally {
        setLoading(false);
      }
    })();

    fetchInFlightRef.current = requestPromise;
    try {
      await requestPromise;
    } finally {
      fetchInFlightRef.current = null;
    }
  }, [canViewRoles, canViewPermissions]);

  useEffect(() => {
    if (!permissionsLoading && canViewRoles && !hasInitialFetchRef.current) {
      void fetchAll();
    }
  }, [permissionsLoading, canViewRoles, fetchAll]);

  const moduleCount = useMemo(() => Object.keys(permissionGroups).length, [permissionGroups]);

  const filteredRoles = useMemo(() => {
    const query = search.trim().toLowerCase();
    return roles.filter((role) => {
      const permissionCount = role.permissions?.length || 0;
      const matchesSearch = !query || [role.name, role.slug, role.description || ""].join(" ").toLowerCase().includes(query);
      const matchesPermission = permissionFilter === "all"
        ? true
        : permissionFilter === "assigned"
          ? permissionCount > 0
          : permissionCount === 0;
      return matchesSearch && matchesPermission;
    });
  }, [roles, search, permissionFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRoles = filteredRoles.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const startEntry = filteredRoles.length === 0 ? 0 : startIndex + 1;
  const endEntry = Math.min(startIndex + ITEMS_PER_PAGE, filteredRoles.length);

  useEffect(() => setCurrentPage(1), [search, permissionFilter]);
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginationPages = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, 5];
    if (currentPage >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
  }, [currentPage, totalPages]);

  const resetRoleForm = () => setRoleForm({ name: "", slug: "", description: "", permissions: [] });

  const openCreateRole = () => {
    if (!canCreateRole) {
      toast.error("You do not have permission to create roles.");
      return;
    }
    if (!canViewPermissions) {
      toast.error("You do not have permission to view role permissions.");
      return;
    }
    setEditingRole(null);
    resetRoleForm();
    setRoleModalOpen(true);
  };

  const openEditRole = (role: Role) => {
    if (!canUpdateRole) {
      toast.error("You do not have permission to update roles.");
      return;
    }
    if (!canViewPermissions) {
      toast.error("You do not have permission to view role permissions.");
      return;
    }
    setEditingRole(role);
    setRoleForm({
      name: role.name || "",
      slug: role.slug || "",
      description: role.description || "",
      permissions: role.permissions?.map((permission) => permission.id) || [],
    });
    setRoleModalOpen(true);
  };

  const handleSubmitRole = async () => {
    const hasSavePermission = editingRole ? canUpdateRole : canCreateRole;
    if (!hasSavePermission) {
      toast.error(editingRole ? "You do not have permission to update roles." : "You do not have permission to create roles.");
      return;
    }
    if (!roleForm.name.trim()) {
      toast.error("Please enter role name.");
      return;
    }
    if (!canViewPermissions) {
      toast.error("You do not have permission to manage role permissions.");
      return;
    }

    const slug = roleForm.slug.trim() || generateSlug(roleForm.name);
    try {
      setActionLoading(true);
      const payload: RolePayload = {
        name: roleForm.name.trim(),
        slug,
        description: roleForm.description.trim(),
        permissions: roleForm.permissions,
      };
      if (editingRole) {
        const response = await adminManagementApi.updateRole(editingRole.id, payload);
        toast.success(response.data?.message || "Role updated successfully.");
      } else {
        const response = await adminManagementApi.createRole(payload);
        toast.success(response.data?.message || "Role created successfully.");
      }
      setRoleModalOpen(false);
      setEditingRole(null);
      resetRoleForm();
      await fetchAll(true);
    } catch (error: any) {
      console.error("Save role error:", error);
      toast.error(error?.response?.data?.message || "Unable to save role.");
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteRole = (role: Role) => {
    if (!canDeleteRole) {
      toast.error("You do not have permission to delete roles.");
      return;
    }
    setDeleteTarget({ id: role.id, name: role.name });
    setDeleteModalOpen(true);
  };

  const handleDeleteRole = async () => {
    if (!deleteTarget) return;
    if (!canDeleteRole) {
      toast.error("You do not have permission to delete roles.");
      return;
    }
    try {
      setDeleteLoading(true);
      const response = await adminManagementApi.deleteRole(deleteTarget.id);
      toast.success(response.data?.message || "Role deleted successfully.");
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      await fetchAll(true);
    } catch (error: any) {
      console.error("Delete role error:", error);
      toast.error(error?.response?.data?.message || "Unable to delete role.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Permission verification loader
  if (permissionsLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center p-6" style={{ backgroundColor: PAGE_BG }}>
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm" style={{ color: PRIMARY }}><FiRefreshCw size={23} className="animate-spin" /></div>
          <p className="mt-4 text-sm font-bold" style={{ color: TEXT_PRIMARY }}>Checking permissions...</p>
          <p className="mt-1 text-[10px]" style={{ color: MUTED }}>Verifying role management access.</p>
        </div>
      </div>
    );
  }

  if (!canViewRoles) {
    return (
      <div className="flex min-h-[500px] items-center justify-center p-6" style={{ backgroundColor: PAGE_BG }}>
        <div className="max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm" style={{ borderColor: BORDER }}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: LIGHT_YELLOW, color: YELLOW_TEXT }}><FiShield size={24} /></div>
          <h2 className="mt-4 text-lg font-bold" style={{ color: TEXT_PRIMARY }}>Access Denied</h2>
          <p className="mt-2 text-sm leading-6" style={{ color: TEXT_SECONDARY }}>You do not have permission to view role management.</p>
        </div>
      </div>
    );
  }

  if (loading && roles.length === 0) {
    return (
      <div className="flex min-h-[500px] items-center justify-center p-6" style={{ backgroundColor: PAGE_BG }}>
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm" style={{ color: PRIMARY }}><FiRefreshCw size={23} className="animate-spin" /></div>
          <p className="mt-4 text-sm font-bold" style={{ color: TEXT_PRIMARY }}>Loading roles...</p>
          <p className="mt-1 text-[10px]" style={{ color: MUTED }}>Fetching roles and permissions.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-white p-4 sm:p-5 lg:p-6">
        {/* Page heading */}
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: YELLOW, boxShadow: `0 0 0 3px ${LIGHT_YELLOW}` }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: PRIMARY }}>Access Control</span>
            </div>
            <h1 className="text-[20px] font-medium tracking-tight text-[#111827] sm:text-[22px]">Role Management</h1>
            <p className="mt-0.5 text-sm text-[#111827]">Create roles and manage module-based permissions for admin access.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => void fetchAll(true)} disabled={loading} className="flex h-11 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-bold  transition hover:bg-[#F8FBFF] disabled:opacity-50 sm:px-5" style={{ borderColor: BORDER, color: PRIMARY }}>
              <FiRefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            {canCreateRole && (
              <button type="button" onClick={openCreateRole} className="flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 sm:px-6" style={{ background: PRIMARY_GRADIENT }}>
                <FiPlus size={17} /> Add Role
              </button>
            )}
          </div>
        </div>

        {/* Main directory */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[22px] border bg-white shadow-[0_8px_30px_rgba(45,111,232,0.06)]" style={{ borderColor: BORDER }}>
  
          {/* Search and filter */}
          <div className="border-b p-4 sm:p-5" style={{ borderColor: BORDER }}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full xl:max-w-[500px]">
                <FiSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: PRIMARY }} />
                <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search role, slug or description..." className="h-12 w-full rounded-xl pl-11 pr-4 text-sm outline-none placeholder:text-[#9CA3AF] focus:ring-2 focus:ring-[#DCEBFF]" style={{ border: `1px solid ${BORDER}`, backgroundColor: PAGE_BG, color: TEXT_PRIMARY }} />
              </div>
              <div className="flex flex-wrap gap-2">
                {([
                  { key: "all", label: "All" },
                  { key: "assigned", label: "Assigned" },
                  { key: "empty", label: "No Permissions" },
                ] as const).map((item) => {
                  const active = permissionFilter === item.key;
                  return (
                    <button key={item.key} type="button" onClick={() => setPermissionFilter(item.key)} className="rounded-xl px-4 py-2.5 text-xs font-bold transition sm:px-5" style={{ background: active ? PRIMARY_GRADIENT : PAGE_BG, color: active ? WHITE : TEXT_SECONDARY, border: active ? `1px solid ${PRIMARY}` : `1px solid ${BORDER}`}}>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

     

          {/* Desktop table */}
          <div className="hidden overflow-x-auto lg:block rounded-2xl">
            <table className="w-full min-w-[1050px] border-collapse">
              <thead>
                <tr style={{ backgroundColor: PRIMARY }}>
                  {(["S.No.", "Role", "Slug", "Description", "Permissions", "Updated", "Actions"] as const).map((heading, index) => (
                    <th key={heading} className={`px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-white ${index === 4 || index === 5 || index === 6 ? "text-center" : "text-left"}`}>
                      {heading}{index === 0 && <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ backgroundColor: YELLOW }} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedRoles.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: LIGHT_BLUE, color: PRIMARY }}><FiShield size={25} /></div>
                      <p className="mt-4 text-sm font-bold" style={{ color: TEXT_PRIMARY }}>No roles found</p>
                      <p className="mt-1 text-xs" style={{ color: MUTED }}>Try another search or create a new role.</p>
                    </div>
                  </td></tr>
                ) : paginatedRoles.map((role, index) => {
                  const permissionCount = role.permissions?.length || 0;
                  return (
                    <tr key={role.id} className="border-b transition hover:bg-[#F8FBFF]" style={{ borderColor: "#EDF2F8" }}>
                      <td className="px-5 py-4"><span className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold" style={{ backgroundColor: LIGHT_BLUE, color: PRIMARY }}>{startIndex + index + 1}</span></td>
                      <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: PRIMARY_GRADIENT }}><FiShield size={16} /></div><p className="max-w-[180px] truncate text-sm font-bold" style={{ color: TEXT_PRIMARY }}>{role.name}</p></div></td>
                      <td className="px-5 py-4"><span className="rounded-md px-2.5 py-1.5 font-mono text-[10px]" style={{ backgroundColor: PAGE_BG, color: PRIMARY }}>{role.slug}</span></td>
                      <td className="max-w-[300px] px-5 py-4"><p className="line-clamp-2 text-xs leading-5" style={{ color: TEXT_SECONDARY }}>{role.description || "No description provided."}</p></td>
                      <td className="px-5 py-4 text-center"><span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold" style={{ borderColor: permissionCount > 0 ? "#C9DDFB" : BORDER, backgroundColor: permissionCount > 0 ? LIGHT_BLUE : PAGE_BG, color: permissionCount > 0 ? PRIMARY : TEXT_SECONDARY }}><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: permissionCount > 0 ? YELLOW : MUTED }} />{permissionCount} permission{permissionCount === 1 ? "" : "s"}</span></td>
                      <td className="px-5 py-4 text-center"><span className="text-[10px] font-semibold" style={{ color: TEXT_SECONDARY }}>{formatDate(role.updated_at)}</span></td>
                      <td className="px-5 py-4"><div className="flex items-center justify-center gap-2">
                        {canUpdateRole && <button type="button" onClick={() => openEditRole(role)} title="Edit Role" aria-label={`Edit ${role.name}`} className="flex h-9 w-9 items-center justify-center rounded-xl border transition hover:bg-[#EAF3FF]" style={{ borderColor: BORDER, backgroundColor: WHITE, color: PRIMARY }}><FiEdit2 size={14} /></button>}
                        {canDeleteRole && <button type="button" onClick={() => openDeleteRole(role)} title="Delete Role" aria-label={`Delete ${role.name}`} className="flex h-9 w-9 items-center justify-center rounded-xl border transition hover:bg-[#FEE2E2]" style={{ borderColor: "#F3C9C6", backgroundColor: DANGER_BG, color: DANGER }}><FiTrash2 size={14} /></button>}
                        {!canUpdateRole && !canDeleteRole && <span className="rounded-lg border px-3 py-2 text-[9px] font-semibold" style={{ borderColor: BORDER, backgroundColor: SOFT_SURFACE, color: MUTED }}>View Only</span>}
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile and tablet role cards */}
          <div className="block lg:hidden">
            {paginatedRoles.length > 0 ? paginatedRoles.map((role, index) => {
              const permissionCount = role.permissions?.length || 0;
              return (
                <div key={role.id} className="border-b p-4 sm:p-5" style={{ borderColor: "#EDF2F8" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: PRIMARY_GRADIENT }}><FiShield size={17} /></div>
                      <div className="min-w-0"><p className="truncate text-sm font-bold" style={{ color: TEXT_PRIMARY }}>{role.name}</p><p className="mt-1 truncate font-mono text-[10px]" style={{ color: PRIMARY }}>{role.slug}</p></div>
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: MUTED }}>#{startIndex + index + 1}</span>
                  </div>
                  <div className="mt-4 rounded-xl border p-3.5" style={{ borderColor: BORDER, backgroundColor: PAGE_BG }}>
                    <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>Description</p>
                    <p className="mt-1.5 text-xs leading-5" style={{ color: TEXT_SECONDARY }}>{role.description || "No description provided."}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full px-3 py-1.5 text-[9px] font-bold" style={{ backgroundColor: LIGHT_BLUE, color: PRIMARY }}>{permissionCount} permissions</span>
                      <span className="rounded-full px-3 py-1.5 text-[9px] font-bold" style={{ backgroundColor: LIGHT_YELLOW, color: YELLOW_TEXT }}>{formatDate(role.updated_at)}</span>
                    </div>
                    <div className="flex gap-2">
                      {canUpdateRole && <button type="button" onClick={() => openEditRole(role)} className="flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[10px] font-bold" style={{ borderColor: BORDER, backgroundColor: WHITE, color: PRIMARY }}><FiEdit2 size={13} /> Edit</button>}
                      {canDeleteRole && <button type="button" onClick={() => openDeleteRole(role)} className="flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[10px] font-bold" style={{ borderColor: "#F3C9C6", backgroundColor: DANGER_BG, color: DANGER }}><FiTrash2 size={13} /> Delete</button>}
                      {!canUpdateRole && !canDeleteRole && <span className="self-center text-[10px] font-semibold" style={{ color: MUTED }}>View only</span>}
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="flex flex-col items-center py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: LIGHT_BLUE, color: PRIMARY }}><FiShield size={24} /></div>
                <p className="mt-4 text-sm font-bold" style={{ color: TEXT_PRIMARY }}>No roles found</p>
                <p className="mt-1 text-xs" style={{ color: MUTED }}>Try changing your search or filter.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredRoles.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-4 border-t px-4 py-4 sm:flex-row sm:px-5" style={{ borderColor: BORDER, backgroundColor: SOFT_SURFACE }}>
              <p className="text-xs" style={{ color: MUTED }}>Showing <span className="font-bold" style={{ color: TEXT_SECONDARY }}>{startEntry}</span> to <span className="font-bold" style={{ color: TEXT_SECONDARY }}>{endEntry}</span> of <span className="font-bold" style={{ color: TEXT_SECONDARY }}>{filteredRoles.length}</span> roles</p>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} aria-label="Previous page" className="flex h-9 w-9 items-center justify-center rounded-lg border bg-white transition hover:bg-[#EAF3FF] disabled:opacity-30" style={{ borderColor: BORDER, color: PRIMARY }}><FiChevronLeft size={16} /></button>
                {paginationPages.map((page) => (
                  <button key={page} type="button" onClick={() => setCurrentPage(page)} aria-current={currentPage === page ? "page" : undefined} className="flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-xs font-bold" style={{ background: currentPage === page ? PRIMARY_GRADIENT : WHITE, color: currentPage === page ? WHITE : TEXT_SECONDARY, border: currentPage === page ? `1px solid ${PRIMARY}` : `1px solid ${BORDER}`, boxShadow: currentPage === page ? `inset 0 -2px 0 ${YELLOW}` : "none" }}>{page}</button>
                ))}
                <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} aria-label="Next page" className="flex h-9 w-9 items-center justify-center rounded-lg border bg-white transition hover:bg-[#EAF3FF] disabled:opacity-30" style={{ borderColor: BORDER, color: PRIMARY }}><FiChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      <RoleModal
        open={roleModalOpen}
        loading={actionLoading}
        editingRole={editingRole}
        permissions={permissions}
        form={roleForm}
        setForm={setRoleForm}
        onClose={() => {
          if (!actionLoading) {
            setRoleModalOpen(false);
            setEditingRole(null);
          }
        }}
        onSubmit={() => void handleSubmitRole()}
      />

      <DeleteRoleModal
        open={deleteModalOpen}
        loading={deleteLoading}
        target={deleteTarget}
        onClose={() => {
          if (!deleteLoading) {
            setDeleteModalOpen(false);
            setDeleteTarget(null);
          }
        }}
        onConfirm={() => void handleDeleteRole()}
      />
    </>
  );
};

export default RoleManagement;
