import React, {
  ChangeEvent,
  FC,
  useEffect,
  useMemo,
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

// =====================================================
// HELPERS
// =====================================================

const formatModuleName = (
  module: string
): string => {
  return module
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
};

const formatActionName = (
  action?: string
): string => {
  if (!action) {
    return "-";
  }

  return action
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
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

const generateSlug = (
  name: string
): string => {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// =====================================================
// DELETE MODAL
// =====================================================

interface DeleteRoleModalProps {
  open: boolean;
  loading: boolean;
  target: DeleteTarget | null;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteRoleModal: FC<
  DeleteRoleModalProps
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
              <FiTrash2 size={21} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#b46055]">
                    Confirmation
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-[#29251f]">
                    Delete Role
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faf8f3] text-[#8f6d1d] disabled:opacity-40"
                >
                  <FiX size={17} />
                </button>
              </div>

              <p className="mt-2 text-sm leading-6 text-[#786f60]">
                Are you sure you want to delete this
                role? This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#a89a7d]">
              Selected Role
            </p>

            <p className="mt-1.5 text-base font-bold text-[#29251f]">
              {target.name}
            </p>

            <p className="mt-1 text-[10px] text-[#a19583]">
              Role ID #{target.id}
            </p>
          </div>

          <div className="mt-6 flex justify-end gap-2">
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
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <FiTrash2 size={15} />
              )}

              {loading
                ? "Deleting..."
                : "Delete Role"}
            </button>
          </div>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// ROLE MODAL
// =====================================================

interface RoleModalProps {
  open: boolean;
  loading: boolean;
  editingRole: Role | null;
  permissions: Permission[];
  form: RoleFormState;
  setForm: React.Dispatch<
    React.SetStateAction<RoleFormState>
  >;
  onClose: () => void;
  onSubmit: () => void;
}

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
  const [
    selectedModule,
    setSelectedModule,
  ] = useState("");

  // ===================================================
  // MODULE LIST
  // ===================================================

  const moduleList = useMemo(() => {
    return Array.from(
      new Set(
        permissions
          .map(
            (permission) =>
              permission.module
          )
          .filter(Boolean)
      )
    ).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [permissions]);

  // ===================================================
  // MODULE PERMISSIONS
  // ===================================================

  const currentModulePermissions =
    useMemo(() => {
      if (!selectedModule) {
        return [];
      }

      return permissions.filter(
        (permission) =>
          permission.module ===
          selectedModule
      );
    }, [
      permissions,
      selectedModule,
    ]);

  const selectedCountInModule =
    currentModulePermissions.filter(
      (permission) =>
        form.permissions.includes(
          permission.id
        )
    ).length;

  const allCurrentModuleSelected =
    currentModulePermissions.length >
      0 &&
    selectedCountInModule ===
      currentModulePermissions.length;

  // ===================================================
  // AUTO SELECT MODULE
  // ===================================================

  useEffect(() => {
    if (!open) {
      return;
    }

    if (moduleList.length === 0) {
      setSelectedModule("");
      return;
    }

    if (
      editingRole &&
      editingRole.permissions &&
      editingRole.permissions.length
    ) {
      const existingModule =
        moduleList.find((module) =>
          editingRole.permissions?.some(
            (permission) =>
              permission.module ===
              module
          )
        );

      setSelectedModule(
        existingModule ||
          moduleList[0]
      );

      return;
    }

    setSelectedModule(
      moduleList[0]
    );
  }, [
    open,
    editingRole,
    moduleList,
  ]);

  // ===================================================
  // TOGGLE PERMISSION
  // ===================================================

  const togglePermission = (
    permissionId: number
  ) => {
    setForm((previous) => ({
      ...previous,
      permissions:
        previous.permissions.includes(
          permissionId
        )
          ? previous.permissions.filter(
              (id) =>
                id !== permissionId
            )
          : [
              ...previous.permissions,
              permissionId,
            ],
    }));
  };

  // ===================================================
  // SELECT ALL
  // ===================================================

  const toggleCurrentModule =
    () => {
      if (!selectedModule) {
        return;
      }

      const moduleIds =
        currentModulePermissions.map(
          (permission) =>
            permission.id
        );

      setForm((previous) => ({
        ...previous,
        permissions:
          allCurrentModuleSelected
            ? previous.permissions.filter(
                (id) =>
                  !moduleIds.includes(
                    id
                  )
              )
            : Array.from(
                new Set([
                  ...previous.permissions,
                  ...moduleIds,
                ])
              ),
      }));
    };

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
      <div className="w-full max-w-[700px] overflow-hidden rounded-[22px] border border-[#b8902e]/15 bg-white shadow-[0_25px_70px_rgba(40,32,15,0.18)]">
        {/* TOP ACCENT */}

        <div className="h-[3px] bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]" />

        {/* HEADER */}

        <div className="flex items-start justify-between gap-4 border-b border-[#b8902e]/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
              <FiShield size={20} />
            </div>

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#9a741b]">
                Access Control
              </p>

              <h2 className="mt-1 text-[21px] font-bold text-[#29251f]">
                {editingRole
                  ? "Edit Role"
                  : "Create Role"}
              </h2>

              <p className="mt-0.5 text-xs text-[#a19583]">
                {editingRole
                  ? "Update role details and permissions."
                  : "Create a role and assign required permissions."}
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

        <div className="max-h-[68vh] overflow-y-auto bg-[#faf8f3] p-5">
          <div className="space-y-4">
            {/* ROLE DETAILS */}

            <div className="rounded-2xl border border-[#b8902e]/10 bg-white p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
                  <FiShield size={16} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#29251f]">
                    Role Information
                  </h3>

                  <p className="mt-0.5 text-[10px] text-[#a19583]">
                    Enter the basic information for this role.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* NAME */}

                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#786f60]">
                    Role Name *
                  </label>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(
                      event: ChangeEvent<HTMLInputElement>
                    ) => {
                      const value =
                        event.target.value;

                      setForm((previous) => ({
                        ...previous,
                        name: value,
                        slug:
                          !previous.slug ||
                          previous.slug ===
                            generateSlug(
                              previous.name
                            )
                            ? generateSlug(
                                value
                              )
                            : previous.slug,
                      }));
                    }}
                    placeholder="Order Manager"
                    className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 text-sm text-[#29251f] outline-none placeholder:text-[#aaa08e] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/10"
                  />
                </div>

                {/* SLUG */}

                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#786f60]">
                    Role Slug *
                  </label>

                  <input
                    type="text"
                    value={form.slug}
                    onChange={(
                      event: ChangeEvent<HTMLInputElement>
                    ) =>
                      setForm((previous) => ({
                        ...previous,
                        slug:
                          event.target.value,
                      }))
                    }
                    placeholder="order-manager"
                    className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 font-mono text-sm text-[#29251f] outline-none placeholder:text-[#aaa08e] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/10"
                  />
                </div>
              </div>

              {/* DESCRIPTION */}

              <div className="mt-4">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#786f60]">
                  Description
                </label>

                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      description:
                        event.target.value,
                    }))
                  }
                  placeholder="Role for managing orders"
                  className="w-full resize-none rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 py-3 text-sm text-[#29251f] outline-none placeholder:text-[#aaa08e] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/10"
                />
              </div>
            </div>

            {/* PERMISSIONS */}

            <div className="overflow-hidden rounded-2xl border border-[#b8902e]/10 bg-white">
              {/* HEADER */}

              <div className="border-b border-[#b8902e]/10 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
                      <FiKey size={16} />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[#29251f]">
                        Role Permissions
                      </h3>

                      <p className="mt-0.5 text-[10px] text-[#a19583]">
                        Select a module first, then assign its permissions.
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-[#faf4df] px-3 py-1.5 text-[10px] font-bold text-[#8f6d1d]">
                    {form.permissions.length} Selected
                  </span>
                </div>
              </div>

              {/* MODULE DROPDOWN */}

              <div className="px-5 pt-4">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#786f60]">
                  Select Module
                </label>

                <div className="relative">
                  <FiLayers
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b8902e]"
                  />

                  <select
                    value={selectedModule}
                    onChange={(event) =>
                      setSelectedModule(
                        event.target.value
                      )
                    }
                    className="h-12 w-full appearance-none rounded-xl border border-[#d8d0c0] bg-[#faf8f3] pl-11 pr-11 text-sm font-semibold text-[#29251f] outline-none transition focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/10"
                  >
                    <option value="">
                      Select a module...
                    </option>

                    {moduleList.map(
                      (module) => {
                        const modulePermissions =
                          permissions.filter(
                            (permission) =>
                              permission.module ===
                              module
                          );

                        const selectedCount =
                          modulePermissions.filter(
                            (permission) =>
                              form.permissions.includes(
                                permission.id
                              )
                          ).length;

                        return (
                          <option
                            key={module}
                            value={module}
                          >
                            {formatModuleName(
                              module
                            )}{" "}
                            —{" "}
                            {
                              selectedCount
                            }
                            /
                            {
                              modulePermissions.length
                            }{" "}
                            selected
                          </option>
                        );
                      }
                    )}
                  </select>

                  <FiChevronDown
                    size={17}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#8f6d1d]"
                  />
                </div>
              </div>

              {/* EMPTY */}

              {!selectedModule ? (
                <div className="p-5">
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#d8d0c0] bg-[#faf8f3] px-5 py-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#b8902e] shadow-sm">
                      <FiLayers size={20} />
                    </div>

                    <p className="mt-4 text-sm font-bold text-[#29251f]">
                      Select a module
                    </p>

                    <p className="mt-1 max-w-[340px] text-[11px] leading-5 text-[#a19583]">
                      Choose a module from the dropdown
                      above to view all available permissions.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 border-t border-[#eee7d9]">
                  {/* MODULE HEADER */}

                  <div className="flex items-center justify-between gap-3 bg-[#faf8f3] px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf4df] text-[#b8902e]">
                        <FiLayers size={14} />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-[#29251f]">
                          {formatModuleName(
                            selectedModule
                          )}
                        </p>

                        <p className="mt-0.5 text-[9px] text-[#a19583]">
                          {
                            currentModulePermissions.length
                          }{" "}
                          permissions available
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={
                        toggleCurrentModule
                      }
                      className="rounded-lg border border-[#b8902e]/20 bg-white px-3 py-2 text-[10px] font-bold text-[#8f6d1d] transition hover:bg-[#faf4df]"
                    >
                      {allCurrentModuleSelected
                        ? "Unselect All"
                        : "Select All"}
                    </button>
                  </div>

                  {/* CHECKBOX LIST */}

                  <div className="max-h-[300px] overflow-y-auto p-4">
                    <div className="space-y-2">
                      {currentModulePermissions.map(
                        (permission) => {
                          const checked =
                            form.permissions.includes(
                              permission.id
                            );

                          return (
                            <label
                              key={
                                permission.id
                              }
                              className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-3.5 transition ${
                                checked
                                  ? "border-[#b8902e]/35 bg-[#fffaf0]"
                                  : "border-[#dfd8ca] bg-white hover:border-[#b8902e]/25 hover:bg-[#fcfaf5]"
                              }`}
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                {/* CHECKBOX */}

                                <div
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                    checked
                                      ? "border-[#b8902e] bg-[#b8902e] text-white"
                                      : "border-[#d0c7b8] bg-white text-transparent"
                                  }`}
                                >
                                  {checked && (
                                    <FiCheck
                                      size={
                                        12
                                      }
                                    />
                                  )}
                                </div>

                                {/* TEXT */}

                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-[#29251f]">
                                    {
                                      permission.name
                                    }
                                  </p>

                                  <p className="mt-1 truncate font-mono text-[10px] text-[#a19583]">
                                    {
                                      permission.slug
                                    }
                                  </p>
                                </div>
                              </div>

                              {/* ACTION */}

                              <span
                                className={`shrink-0 rounded-full px-3 py-1.5 text-[9px] font-bold ${
                                  checked
                                    ? "bg-[#b8902e]/10 text-[#8f6d1d]"
                                    : "bg-[#f6f3ed] text-[#8f8068]"
                                }`}
                              >
                                {formatActionName(
                                  permission.action
                                )}
                              </span>

                              <input
                                type="checkbox"
                                checked={
                                  checked
                                }
                                onChange={() =>
                                  togglePermission(
                                    permission.id
                                  )
                                }
                                className="sr-only"
                              />
                            </label>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SUMMARY */}

              <div className="border-t border-[#eee7d9] bg-[#fffdf8] px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#a89a7d]">
                    Selected Permissions
                  </span>

                  {form.permissions.length >
                  0 ? (
                    <span className="rounded-full bg-[#faf4df] px-3 py-1 text-[9px] font-bold text-[#8f6d1d]">
                      {form.permissions.length} permissions selected
                    </span>
                  ) : (
                    <span className="text-[9px] text-[#aaa08e]">
                      None selected
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}

        <div className="flex justify-end gap-2 border-t border-[#b8902e]/10 bg-white px-6 py-4">
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
            onClick={onSubmit}
            disabled={loading}
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-6 text-sm font-bold text-white shadow-sm hover:from-[#a98227] hover:to-[#7e6017] disabled:opacity-50"
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
              ? editingRole
                ? "Updating..."
                : "Creating..."
              : editingRole
              ? "Update Role"
              : "Create Role"}
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const RoleManagement: FC = () => {
  const [roles, setRoles] = useState<Role[]>(
    []
  );

  const [permissions, setPermissions] =
    useState<Permission[]>([]);

  const [permissionGroups, setPermissionGroups] =
    useState<PermissionGroups>({});

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [
    permissionFilter,
    setPermissionFilter,
  ] = useState<
    "all" | "assigned" | "empty"
  >("all");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    roleModalOpen,
    setRoleModalOpen,
  ] = useState(false);

  const [
    editingRole,
    setEditingRole,
  ] = useState<Role | null>(
    null
  );

  const [
    deleteModalOpen,
    setDeleteModalOpen,
  ] = useState(false);

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState<DeleteTarget | null>(
    null
  );

  const [
    roleForm,
    setRoleForm,
  ] = useState<RoleFormState>({
    name: "",
    slug: "",
    description: "",
    permissions: [],
  });

  const ITEMS_PER_PAGE = 10;

  // ===================================================
  // FETCH ALL
  // ===================================================

  const fetchAll = async () => {
    try {
      setLoading(true);

      const [
        rolesResponse,
        permissionsResponse,
      ] = await Promise.all([
        adminManagementApi.getRoles(),
        adminManagementApi.getPermissions(),
      ]);

      // =================================================
      // ROLES RESPONSE NORMALIZATION
      // =================================================

      const rawRoles =
        rolesResponse.data;

      const rolesData =
        Array.isArray(rawRoles)
          ? rawRoles
          : rawRoles &&
            typeof rawRoles ===
              "object" &&
            "data" in rawRoles &&
            Array.isArray(
              rawRoles.data
            )
          ? rawRoles.data
          : [];

      // =================================================
      // PERMISSIONS RESPONSE
      //
      // IMPORTANT:
      //
      // API:
      // {
      //   success: true,
      //   data: {
      //      product: [...],
      //      category: [...],
      //      ...
      //   }
      // }
      //
      // Therefore:
      // permissionsResponse.data.data
      // =================================================

      const permissionResponseData =
        permissionsResponse.data;

      const groups: PermissionGroups =
        permissionResponseData?.data ||
        {};

      setPermissionGroups(groups);

      // =================================================
      // FLATTEN PERMISSIONS
      // =================================================

      const flattenedPermissions =
        Object.values(groups).flat();

      setPermissions(
        flattenedPermissions
      );

      setRoles(rolesData);
    } catch (error: any) {
      console.error(
        "Role management fetch error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to load roles and permissions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ===================================================
  // MODULE COUNT
  // ===================================================

  const moduleCount = useMemo(() => {
    return Object.keys(
      permissionGroups
    ).length;
  }, [permissionGroups]);

  // ===================================================
  // ROLE FILTER
  // ===================================================

  const filteredRoles = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return roles.filter((role) => {
      const permissionCount =
        role.permissions?.length ||
        0;

      const matchesSearch =
        !query ||
        [
          role.name,
          role.slug,
          role.description || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesPermission =
        permissionFilter === "all"
          ? true
          : permissionFilter ===
            "assigned"
          ? permissionCount > 0
          : permissionCount === 0;

      return (
        matchesSearch &&
        matchesPermission
      );
    });
  }, [
    roles,
    search,
    permissionFilter,
  ]);

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredRoles.length /
        ITEMS_PER_PAGE
    )
  );

  const startIndex =
    (currentPage - 1) *
    ITEMS_PER_PAGE;

  const paginatedRoles =
    filteredRoles.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );

  const startEntry =
    filteredRoles.length === 0
      ? 0
      : startIndex + 1;

  const endEntry = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredRoles.length
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    permissionFilter,
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

  const paginationPages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1
      );
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5];
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

  const openCreateRole = () => {
    setEditingRole(null);

    setRoleForm({
      name: "",
      slug: "",
      description: "",
      permissions: [],
    });

    setRoleModalOpen(true);
  };

  // ===================================================
  // EDIT
  // ===================================================

  const openEditRole = (
    role: Role
  ) => {
    setEditingRole(role);

    setRoleForm({
      name: role.name || "",
      slug: role.slug || "",
      description:
        role.description || "",
      permissions:
        role.permissions?.map(
          (permission) =>
            permission.id
        ) || [],
    });

    setRoleModalOpen(true);
  };

  // ===================================================
  // SUBMIT
  // ===================================================

  const handleSubmitRole = async () => {
    if (!roleForm.name.trim()) {
      toast.error(
        "Please enter role name."
      );
      return;
    }

    const slug =
      roleForm.slug.trim() ||
      generateSlug(
        roleForm.name
      );

    try {
      setActionLoading(true);

      const payload: RolePayload = {
        name: roleForm.name.trim(),
        slug,
        description:
          roleForm.description.trim(),
        permissions:
          roleForm.permissions,
      };

      if (editingRole) {
        const response =
          await adminManagementApi.updateRole(
            editingRole.id,
            payload
          );

        toast.success(
          response.data?.message ||
            "Role updated successfully."
        );
      } else {
        const response =
          await adminManagementApi.createRole(
            payload
          );

        toast.success(
          response.data?.message ||
            "Role created successfully."
        );
      }

      setRoleModalOpen(false);
      setEditingRole(null);

      setRoleForm({
        name: "",
        slug: "",
        description: "",
        permissions: [],
      });

      await fetchAll();
    } catch (error: any) {
      console.error(
        "Save role error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to save role."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ===================================================
  // DELETE
  // ===================================================

  const openDeleteRole = (
    role: Role
  ) => {
    setDeleteTarget({
      id: role.id,
      name: role.name,
    });

    setDeleteModalOpen(true);
  };

  const handleDeleteRole = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      setDeleteLoading(true);

      const response =
        await adminManagementApi.deleteRole(
          deleteTarget.id
        );

      toast.success(
        response.data?.message ||
          "Role deleted successfully."
      );

      setDeleteModalOpen(false);
      setDeleteTarget(null);

      await fetchAll();
    } catch (error: any) {
      console.error(
        "Delete role error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to delete role."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (
    loading &&
    roles.length === 0
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
            Loading roles...
          </p>

          <p className="mt-1 text-xs text-[#a19583]">
            Fetching roles and permissions.
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
        className="min-h-screen bg-[#faf8f3] p-4 sm:p-5 lg:p-6"
      >
        {/* HEADER */}

        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#b8902e]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9a741b]">
                Access Control
              </span>
            </div>

            <h1 className="font-serif text-[30px] font-bold tracking-tight text-[#29251f] sm:text-[34px]">
              Role Management
            </h1>

            <p className="mt-1.5 text-sm text-[#8d8372]">
              Create roles and manage module-based permissions
              for admin access.
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
              onClick={openCreateRole}
              className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-6 text-sm font-bold text-white shadow-md shadow-[#b8902e]/15 transition hover:from-[#a98227] hover:to-[#7e6017]"
            >
              <FiPlus size={17} />
              Add Role
            </button>
          </div>
        </div>

        {/* MAIN TABLE */}

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

          {/* SEARCH / FILTER */}

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
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search role, slug or description..."
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
                    key: "empty" as const,
                    label: "No Permissions",
                  },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      setPermissionFilter(
                        item.key
                      )
                    }
                    className={`rounded-xl px-5 py-2.5 text-xs font-bold transition ${
                      permissionFilter ===
                      item.key
                        ? "bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] text-white shadow-md"
                        : "border border-[#b8902e]/15 bg-[#faf8f3] text-[#786f60] hover:bg-[#f2ead8]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* DIRECTORY HEADER */}

          <div className="flex flex-col justify-between gap-3 border-b border-[#b8902e]/10 px-5 py-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
                <FiShield size={18} />
              </div>

              <div>
                <h2 className="text-base font-bold text-[#29251f]">
                  Roles Directory
                </h2>

                <p className="mt-1 text-xs text-[#a19583]">
                  {filteredRoles.length} role
                  {filteredRoles.length ===
                  1
                    ? ""
                    : "s"}{" "}
                  found
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <span className="rounded-lg bg-[#faf8f3] px-3 py-2 text-[10px] font-bold text-[#8f6d1d]">
                {moduleCount} Modules
              </span>

              <span className="rounded-lg bg-[#faf4df] px-3 py-2 text-[10px] font-bold text-[#8f6d1d]">
                {permissions.length} Permissions
              </span>
            </div>
          </div>

          {/* DESKTOP */}

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1050px] border-collapse">
              <thead>
                <tr className="bg-[#2f2a22]">
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    S.No.
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    Role
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    Slug
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    Description
                  </th>

                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    Permissions
                  </th>

                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    Updated
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
                      colSpan={7}
                      className="px-5 py-16 text-center"
                    >
                      <FiRefreshCw
                        size={26}
                        className="mx-auto animate-spin text-[#b8902e]"
                      />

                      <p className="mt-4 text-sm font-bold text-[#29251f]">
                        Loading roles...
                      </p>
                    </td>
                  </tr>
                ) : paginatedRoles.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-16 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#b8902e]">
                          <FiShield
                            size={25}
                          />
                        </div>

                        <p className="mt-4 text-sm font-bold text-[#29251f]">
                          No roles found
                        </p>

                        <p className="mt-1 text-xs text-[#a19583]">
                          Try another search or
                          create a new role.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRoles.map(
                    (
                      role,
                      index
                    ) => {
                      const permissionCount =
                        role.permissions
                          ?.length ||
                        0;

                      return (
                        <tr
                          key={role.id}
                          className="border-b border-[#b8902e]/10 transition hover:bg-[#fcfaf5]"
                        >
                          <td className="px-5 py-4">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-xs font-bold text-[#8f6d1d]">
                              {startIndex +
                                index +
                                1}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-white">
                                <FiShield
                                  size={16}
                                />
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-[#29251f]">
                                  {
                                    role.name
                                  }
                                </p>

                               
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-md bg-[#faf8f3] px-2.5 py-1.5 font-mono text-[10px] text-[#8f6d1d]">
                              {
                                role.slug
                              }
                            </span>
                          </td>

                          <td className="max-w-[300px] px-5 py-4">
                            <p className="line-clamp-2 text-xs leading-5 text-[#786f60]">
                              {role.description ||
                                "No description provided."}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${
                                permissionCount >
                                0
                                  ? "border-[#b8902e]/20 bg-[#f8f3e5] text-[#806319]"
                                  : "border-[#d8d1c4] bg-[#f6f4ef] text-[#786f60]"
                              }`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />

                              {
                                permissionCount
                              }{" "}
                              permission
                              {permissionCount ===
                              1
                                ? ""
                                : "s"}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-center">
                            <span className="text-[10px] font-semibold text-[#786f60]">
                              {formatDate(
                                role.updated_at
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditRole(
                                    role
                                  )
                                }
                                title="Edit Role"
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] text-[#8f6d1d] transition hover:bg-[#b8902e] hover:text-white"
                              >
                                <FiEdit2
                                  size={14}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openDeleteRole(
                                    role
                                  )
                                }
                                title="Delete Role"
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#c98d83]/20 bg-[#fff8f6] text-[#b46055] transition hover:bg-[#b46055] hover:text-white"
                              >
                                <FiTrash2
                                  size={14}
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
            {paginatedRoles.length >
            0 ? (
              paginatedRoles.map(
                (
                  role,
                  index
                ) => {
                  const permissionCount =
                    role.permissions
                      ?.length ||
                    0;

                  return (
                    <div
                      key={role.id}
                      className="border-b border-[#b8902e]/10 p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-white">
                            <FiShield
                              size={17}
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[#29251f]">
                              {
                                role.name
                              }
                            </p>

                            <p className="mt-1 truncate font-mono text-[10px] text-[#8f6d1d]">
                              {
                                role.slug
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

                      <div className="mt-4 rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3.5">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-[#a89a7d]">
                          Description
                        </p>

                        <p className="mt-1.5 text-xs leading-5 text-[#786f60]">
                          {role.description ||
                            "No description provided."}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="rounded-full bg-[#f8f3e5] px-3 py-1.5 text-[9px] font-bold text-[#806319]">
                          {permissionCount}{" "}
                          permissions
                        </span>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEditRole(
                                role
                              )
                            }
                            className="flex h-9 items-center gap-1.5 rounded-lg border border-[#b8902e]/15 bg-[#faf8f3] px-3 text-[10px] font-bold text-[#8f6d1d]"
                          >
                            <FiEdit2
                              size={13}
                            />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openDeleteRole(
                                role
                              )
                            }
                            className="flex h-9 items-center gap-1.5 rounded-lg border border-[#c98d83]/20 bg-[#fff8f6] px-3 text-[10px] font-bold text-[#b46055]"
                          >
                            <FiTrash2
                              size={13}
                            />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
              )
            ) : (
              <div className="flex flex-col items-center py-16 text-center">
                <FiShield
                  size={26}
                  className="text-[#b8902e]"
                />

                <p className="mt-4 text-sm font-bold text-[#29251f]">
                  No roles found
                </p>
              </div>
            )}
          </div>

          {/* PAGINATION */}

          {filteredRoles.length >
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
                    filteredRoles.length
                  }
                </span>{" "}
                roles
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
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#b8902e]/15 bg-white text-[#8f6d1d] disabled:opacity-30"
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
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#b8902e]/15 bg-white text-[#8f6d1d] disabled:opacity-30"
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

      {/* ===================================================
          CREATE / EDIT MODAL
      =================================================== */}

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
        onSubmit={handleSubmitRole}
      />

      {/* ===================================================
          DELETE MODAL
      =================================================== */}

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
        onConfirm={
          handleDeleteRole
        }
      />
    </>
  );
};

export default RoleManagement;