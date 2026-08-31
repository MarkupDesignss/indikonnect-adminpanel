import React, {
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import {
    FiPlus,
    FiSearch,
    FiUsers,
    FiShield,
    FiKey,
    FiEdit2,
    FiTrash2,
    FiX,
    FiCheck,
    FiRefreshCw,
    FiAlertTriangle,
    FiMail,
    FiLock,
    FiChevronRight,
  } from "react-icons/fi";
  
  import { motion } from "framer-motion";
  import toast from "react-hot-toast";
  
  import GlobalModal from "@/components/common/GlobalModal";
  
  import adminManagementApi, {
    AdminMember,
    Permission,
    Role,
    PermissionPayload,
    RolePayload,
  } from "../../api/endpoints/rolemanagement";
  
  // =====================================================
  // TYPES
  // =====================================================
  
  type SectionType =
    | "admins"
    | "roles"
    | "permissions";
  
  type DeleteTarget = {
    type: SectionType;
    id: number;
    name: string;
  };
  
  // =====================================================
  // ANIMATION
  // =====================================================
  
  const containerVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };
  
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 12,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 110,
        damping: 14,
      },
    },
  };
  
  // =====================================================
  // HELPERS
  // =====================================================
  
  const formatDate = (
    value?: string | null
  ) => {
    if (!value) {
      return "—";
    }
  
    const date = new Date(value);
  
    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }
  
    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };
  
  const getInitials = (
    name?: string | null
  ) => {
    const value =
      name?.trim() || "Admin";
  
    const parts =
      value.split(
        /\s+/
      );
  
    if (
      parts.length === 1
    ) {
      return parts[0]
        .slice(0, 2)
        .toUpperCase();
    }
  
    return (
      parts[0][0] +
      parts[1][0]
    ).toUpperCase();
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
  
  const DeleteModal: React.FC<
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
  
    const label =
      target.type ===
        "admins"
        ? "Admin"
        : target.type ===
          "roles"
          ? "Role"
          : "Permission";
  
    return (
      <GlobalModal
        isOpen={open}
        onClose={onClose}
        closeOnOverlayClick={!loading}
      >
        <div className="w-full max-w-[470px] overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
          <div className="h-1 bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]" />
  
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff8f6] text-[#b46055]">
                <FiAlertTriangle
                  size={23}
                />
              </div>
  
              <div>
                <h2 className="text-lg font-bold text-[#2a2620]">
                  Delete {label}
                </h2>
  
                <p className="mt-1 text-sm leading-6 text-[#786f60]">
                  Are you sure you want to delete this{" "}
                  {label.toLowerCase()}? This action cannot be undone.
                </p>
              </div>
            </div>
  
            <div className="mt-5 rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                Selected {label}
              </p>
  
              <p className="mt-1 break-all text-sm font-bold text-[#2a2620]">
                {target.name}
              </p>
            </div>
  
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-[#b8902e]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#786f60] hover:bg-[#faf8f3] disabled:opacity-50"
              >
                Cancel
              </button>
  
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#b46055] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#96483f] disabled:opacity-50"
              >
                {loading ? (
                  <FiRefreshCw
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <FiTrash2
                    size={15}
                  />
                )}
  
                {loading
                  ? "Deleting..."
                  : `Delete ${label}`}
              </button>
            </div>
          </div>
        </div>
      </GlobalModal>
    );
  };
  
  // =====================================================
  // ADMIN FORM
  // =====================================================
  
  interface AdminFormProps {
    editing: boolean;
    form: {
      name: string;
      email: string;
      password: string;
      roles: number[];
    };
    roles: Role[];
    loading: boolean;
    onChange: (
      key:
        | "name"
        | "email"
        | "password",
      value: string
    ) => void;
    onRoleToggle: (
      id: number
    ) => void;
    onSubmit: () => void;
    onClose: () => void;
  }
  
  const AdminForm: React.FC<
    AdminFormProps
  > = ({
    editing,
    form,
    roles,
    loading,
    onChange,
    onRoleToggle,
    onSubmit,
    onClose,
  }) => (
    <div className="w-full max-w-[620px] overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
      <div className="h-1 bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]" />
  
      <div className="flex items-center justify-between border-b border-[#b8902e]/10 px-5 py-4 sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
              <FiUsers
                size={17}
              />
            </div>
  
            <h2 className="text-lg font-bold text-[#2a2620]">
              {editing
                ? "Edit Admin"
                : "Create Admin"}
            </h2>
          </div>
  
          <p className="mt-1 text-xs text-[#a89a7d]">
            {editing
              ? "Update administrator information and access."
              : "Create an administrator and assign roles."}
          </p>
        </div>
  
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#a89a7d] hover:bg-[#faf8f3]"
        >
          <FiX size={18} />
        </button>
      </div>
  
      <div className="max-h-[75vh] overflow-y-auto bg-[#faf8f3] p-5 sm:p-6">
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#786f60]">
              Full Name *
            </label>
  
            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                onChange(
                  "name",
                  e.target.value
                )
              }
              placeholder="John Admin"
              className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-white px-4 text-sm text-[#2a2620] outline-none focus:border-[#b8902e]"
            />
          </div>
  
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#786f60]">
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
                onChange={(e) =>
                  onChange(
                    "email",
                    e.target.value
                  )
                }
                disabled={editing}
                placeholder="admin@example.com"
                className={`h-11 w-full rounded-xl border border-[#d8d0c0] px-10 pr-4 text-sm text-[#2a2620] outline-none focus:border-[#b8902e] ${
                  editing
                    ? "bg-[#f4efe2]"
                    : "bg-white"
                }`}
              />
            </div>
  
            {editing && (
              <p className="mt-1.5 text-[10px] text-[#a89a7d]">
                Email is kept unchanged while editing.
              </p>
            )}
          </div>
  
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#786f60]">
              {editing
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
                onChange={(e) =>
                  onChange(
                    "password",
                    e.target.value
                  )
                }
                placeholder={
                  editing
                    ? "Leave blank to keep current password"
                    : "Enter password"
                }
                className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-white px-10 pr-4 text-sm text-[#2a2620] outline-none focus:border-[#b8902e]"
              />
            </div>
          </div>
  
          <div className="rounded-2xl border border-[#b8902e]/10 bg-white p-4">
            <div className="mb-4 flex items-center gap-2">
              <FiShield
                size={16}
                className="text-[#b8902e]"
              />
  
              <div>
                <h3 className="text-sm font-bold text-[#2a2620]">
                  Assign Roles
                </h3>
  
                <p className="text-[11px] text-[#a89a7d]">
                  Select the access roles for this admin.
                </p>
              </div>
            </div>
  
            {roles.length === 0 ? (
              <div className="rounded-xl bg-[#faf8f3] p-4 text-center text-xs text-[#a89a7d]">
                No roles available.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {roles.map(
                  (role) => {
                    const checked =
                      form.roles.includes(
                        role.id
                      );
  
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() =>
                          onRoleToggle(
                            role.id
                          )
                        }
                        className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${
                          checked
                            ? "border-[#b8902e]/40 bg-[#faf4df]"
                            : "border-[#e1d9ca] bg-white hover:bg-[#faf8f3]"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-bold text-[#2a2620]">
                            {role.name}
                          </p>
  
                          <p className="mt-0.5 text-[10px] text-[#a89a7d]">
                            {role.slug}
                          </p>
                        </div>
  
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-lg border ${
                            checked
                              ? "border-[#b8902e] bg-[#b8902e] text-white"
                              : "border-[#d7cfbf] text-transparent"
                          }`}
                        >
                          <FiCheck
                            size={13}
                          />
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </div>
      </div>
  
      <div className="flex justify-end gap-2 border-t border-[#b8902e]/10 bg-white px-5 py-4 sm:px-6">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="rounded-xl border border-[#b8902e]/20 px-5 py-2.5 text-sm font-semibold text-[#786f60] hover:bg-[#faf8f3]"
        >
          Cancel
        </button>
  
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading && (
            <FiRefreshCw
              size={14}
              className="animate-spin"
            />
          )}
  
          {loading
            ? editing
              ? "Updating..."
              : "Creating..."
            : editing
              ? "Update Admin"
              : "Create Admin"}
        </button>
      </div>
    </div>
  );
  
  // =====================================================
  // ROLE FORM
  // =====================================================
  
  interface RoleFormProps {
    editing: boolean;
    form: RolePayload;
    permissions: Permission[];
    loading: boolean;
    onChange: (
      key:
        | "name"
        | "slug"
        | "description",
      value: string
    ) => void;
    onPermissionToggle: (
      id: number
    ) => void;
    onSubmit: () => void;
    onClose: () => void;
  }
  
  const RoleForm: React.FC<
    RoleFormProps
  > = ({
    editing,
    form,
    permissions,
    loading,
    onChange,
    onPermissionToggle,
    onSubmit,
    onClose,
  }) => (
    <div className="w-full max-w-[680px] overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
      <div className="h-1 bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]" />
  
      <div className="flex items-center justify-between border-b border-[#b8902e]/10 px-5 py-4 sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
              <FiShield
                size={17}
              />
            </div>
  
            <h2 className="text-lg font-bold text-[#2a2620]">
              {editing
                ? "Edit Role"
                : "Create Role"}
            </h2>
          </div>
  
          <p className="mt-1 text-xs text-[#a89a7d]">
            Create a role and define the permissions it can access.
          </p>
        </div>
  
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#a89a7d] hover:bg-[#faf8f3]"
        >
          <FiX size={18} />
        </button>
      </div>
  
      <div className="max-h-[78vh] overflow-y-auto bg-[#faf8f3] p-5 sm:p-6">
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#786f60]">
                Role Name *
              </label>
  
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  onChange(
                    "name",
                    e.target.value
                  )
                }
                placeholder="Order Manager"
                className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-white px-4 text-sm text-[#2a2620] outline-none focus:border-[#b8902e]"
              />
            </div>
  
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#786f60]">
                Role Slug *
              </label>
  
              <input
                type="text"
                value={form.slug}
                onChange={(e) =>
                  onChange(
                    "slug",
                    e.target.value
                  )
                }
                placeholder="order-manager"
                className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-white px-4 text-sm font-mono text-[#2a2620] outline-none focus:border-[#b8902e]"
              />
            </div>
          </div>
  
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#786f60]">
              Description
            </label>
  
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                onChange(
                  "description",
                  e.target.value
                )
              }
              placeholder="Role for managing orders"
              className="w-full resize-none rounded-xl border border-[#d8d0c0] bg-white px-4 py-3 text-sm text-[#2a2620] outline-none focus:border-[#b8902e]"
            />
          </div>
  
          <div className="rounded-2xl border border-[#b8902e]/10 bg-white p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FiKey
                  size={16}
                  className="text-[#b8902e]"
                />
  
                <div>
                  <h3 className="text-sm font-bold text-[#2a2620]">
                    Permissions
                  </h3>
  
                  <p className="text-[11px] text-[#a89a7d]">
                    Select permissions for this role.
                  </p>
                </div>
              </div>
  
              <span className="rounded-lg bg-[#faf8f3] px-3 py-1.5 text-[10px] font-bold text-[#8f6d1d]">
                {form.permissions.length} selected
              </span>
            </div>
  
            {permissions.length === 0 ? (
              <div className="rounded-xl bg-[#faf8f3] p-4 text-center text-xs text-[#a89a7d]">
                No permissions found.
              </div>
            ) : (
              <div className="space-y-2">
                {permissions.map(
                  (permission) => {
                    const checked =
                      form.permissions.includes(
                        permission.id
                      );
  
                    return (
                      <button
                        type="button"
                        key={permission.id}
                        onClick={() =>
                          onPermissionToggle(
                            permission.id
                          )
                        }
                        className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${
                          checked
                            ? "border-[#b8902e]/35 bg-[#faf4df]"
                            : "border-[#e1d9ca] bg-white hover:bg-[#faf8f3]"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#2a2620]">
                            {permission.name}
                          </p>
  
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            <span className="rounded-md bg-[#faf8f3] px-2 py-0.5 font-mono text-[9px] text-[#8f6d1d]">
                              {permission.slug}
                            </span>
  
                            <span className="rounded-md bg-[#f4efe2] px-2 py-0.5 text-[9px] font-semibold capitalize text-[#786f60]">
                              {permission.module}
                            </span>
  
                            <span className="rounded-md bg-[#f4efe2] px-2 py-0.5 text-[9px] font-semibold capitalize text-[#786f60]">
                              {permission.action}
                            </span>
                          </div>
                        </div>
  
                        <div
                          className={`ml-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${
                            checked
                              ? "border-[#b8902e] bg-[#b8902e] text-white"
                              : "border-[#d7cfbf] text-transparent"
                          }`}
                        >
                          <FiCheck
                            size={13}
                          />
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </div>
      </div>
  
      <div className="flex justify-end gap-2 border-t border-[#b8902e]/10 bg-white px-5 py-4 sm:px-6">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="rounded-xl border border-[#b8902e]/20 px-5 py-2.5 text-sm font-semibold text-[#786f60] hover:bg-[#faf8f3]"
        >
          Cancel
        </button>
  
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading && (
            <FiRefreshCw
              size={14}
              className="animate-spin"
            />
          )}
  
          {loading
            ? editing
              ? "Updating..."
              : "Creating..."
            : editing
              ? "Update Role"
              : "Create Role"}
        </button>
      </div>
    </div>
  );
  
  // =====================================================
  // PERMISSION FORM
  // =====================================================
  
  interface PermissionFormProps {
    editing: boolean;
    form: PermissionPayload;
    loading: boolean;
    onChange: (
      key:
        | "name"
        | "slug"
        | "module"
        | "action",
      value: string
    ) => void;
    onSubmit: () => void;
    onClose: () => void;
  }
  
  const PermissionForm: React.FC<
    PermissionFormProps
  > = ({
    editing,
    form,
    loading,
    onChange,
    onSubmit,
    onClose,
  }) => {
    const moduleOptions = [
      "product",
      "order",
      "category",
      "tax",
      "user",
      "admin",
      "role",
      "permission",
      "dashboard",
      "return",
      "coupon",
      "support",
      "analytics",
      "inventory",
    ];
  
    const actionOptions = [
      "view",
      "create",
      "update",
      "delete",
      "manage",
      "approve",
      "reject",
      "dispatch",
    ];
  
    return (
      <div className="w-full max-w-[560px] overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
        <div className="h-1 bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]" />
  
        <div className="flex items-center justify-between border-b border-[#b8902e]/10 px-5 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
                <FiKey
                  size={17}
                />
              </div>
  
              <h2 className="text-lg font-bold text-[#2a2620]">
                {editing
                  ? "Edit Permission"
                  : "Create Permission"}
              </h2>
            </div>
  
            <p className="mt-1 text-xs text-[#a89a7d]">
              Define a permission using module and action.
            </p>
          </div>
  
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#a89a7d] hover:bg-[#faf8f3]"
          >
            <FiX size={18} />
          </button>
        </div>
  
        <div className="bg-[#faf8f3] p-5 sm:p-6">
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#786f60]">
                Permission Name *
              </label>
  
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  onChange(
                    "name",
                    e.target.value
                  )
                }
                placeholder="View Product"
                className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-white px-4 text-sm text-[#2a2620] outline-none focus:border-[#b8902e]"
              />
            </div>
  
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#786f60]">
                Slug *
              </label>
  
              <input
                type="text"
                value={form.slug}
                onChange={(e) =>
                  onChange(
                    "slug",
                    e.target.value
                  )
                }
                placeholder="product.view"
                className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-white px-4 text-sm font-mono text-[#2a2620] outline-none focus:border-[#b8902e]"
              />
            </div>
  
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#786f60]">
                  Module *
                </label>
  
                <select
                  value={form.module}
                  onChange={(e) =>
                    onChange(
                      "module",
                      e.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-white px-4 text-sm capitalize text-[#2a2620] outline-none focus:border-[#b8902e]"
                >
                  <option value="">
                    Select module
                  </option>
  
                  {moduleOptions.map(
                    (module) => (
                      <option
                        key={module}
                        value={module}
                      >
                        {module}
                      </option>
                    )
                  )}
                </select>
              </div>
  
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#786f60]">
                  Action *
                </label>
  
                <select
                  value={form.action}
                  onChange={(e) =>
                    onChange(
                      "action",
                      e.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-white px-4 text-sm capitalize text-[#2a2620] outline-none focus:border-[#b8902e]"
                >
                  <option value="">
                    Select action
                  </option>
  
                  {actionOptions.map(
                    (action) => (
                      <option
                        key={action}
                        value={action}
                      >
                        {action}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
  
            <div className="rounded-xl border border-[#b8902e]/10 bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                Permission Preview
              </p>
  
              <p className="mt-2 font-mono text-sm font-bold text-[#8f6d1d]">
                {form.slug ||
                  `${form.module || "module"}.${form.action || "action"}`}
              </p>
            </div>
          </div>
        </div>
  
        <div className="flex justify-end gap-2 border-t border-[#b8902e]/10 bg-white px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-[#b8902e]/20 px-5 py-2.5 text-sm font-semibold text-[#786f60] hover:bg-[#faf8f3]"
          >
            Cancel
          </button>
  
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading && (
              <FiRefreshCw
                size={14}
                className="animate-spin"
              />
            )}
  
            {loading
              ? editing
                ? "Updating..."
                : "Creating..."
              : editing
                ? "Update Permission"
                : "Create Permission"}
          </button>
        </div>
      </div>
    );
  };
  
  // =====================================================
  // ADMIN DETAIL
  // =====================================================
  
  const AdminDetail: React.FC<{
    admin: AdminMember;
    onEdit: () => void;
    onDelete: () => void;
  }> = ({
    admin,
    onEdit,
    onDelete,
  }) => (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#b8902e]/10 bg-white p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-xl font-bold text-white">
              {getInitials(admin.name)}
            </div>
  
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-[#2a2620]">
                  {admin.name}
                </h2>
  
                <span className="rounded-full border border-[#b8902e]/20 bg-[#faf4df] px-3 py-1 text-[10px] font-bold text-[#806319]">
                  Administrator
                </span>
              </div>
  
              <p className="mt-1 text-sm text-[#786f60]">
                {admin.email}
              </p>
            </div>
          </div>
  
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="flex h-10 items-center gap-2 rounded-xl border border-[#b8902e]/20 bg-white px-4 text-xs font-bold text-[#8f6d1d] hover:bg-[#faf8f3]"
            >
              <FiEdit2
                size={14}
              />
              Edit
            </button>
  
            <button
              type="button"
              onClick={onDelete}
              className="flex h-10 items-center gap-2 rounded-xl border border-[#c98d83]/20 bg-[#fff8f6] px-4 text-xs font-bold text-[#b46055] hover:bg-[#b46055] hover:text-white"
            >
              <FiTrash2
                size={14}
              />
              Delete
            </button>
          </div>
        </div>
      </div>
  
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-[#b8902e]/10 bg-white p-5">
          <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a89a7d]">
            Admin Information
          </h3>
  
          <div className="space-y-3">
            <InfoRow
              label="Admin ID"
              value={`#${admin.id}`}
            />
  
            <InfoRow
              label="Name"
              value={admin.name}
            />
  
            <InfoRow
              label="Email"
              value={admin.email}
            />
  
            <InfoRow
              label="Created"
              value={formatDate(admin.created_at)}
            />
  
            <InfoRow
              label="Updated"
              value={formatDate(admin.updated_at)}
            />
          </div>
        </div>
  
        <div className="rounded-2xl border border-[#b8902e]/10 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#a89a7d]">
              Assigned Roles
            </h3>
  
            <span className="rounded-lg bg-[#faf8f3] px-3 py-1 text-[10px] font-bold text-[#8f6d1d]">
              {admin.roles?.length || 0}
            </span>
          </div>
  
          {admin.roles && admin.roles.length > 0 ? (
            <div className="space-y-2">
              {admin.roles.map((role) => (
                <div
                  key={role.id}
                  className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3"
                >
                  <p className="text-sm font-bold text-[#2a2620]">
                    {role.name}
                  </p>
  
                  <p className="mt-1 font-mono text-[10px] text-[#8f6d1d]">
                    {role.slug}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-[#faf8f3] p-5 text-center text-xs text-[#a89a7d]">
              No roles assigned.
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  // =====================================================
  // ROLE DETAIL
  // =====================================================
  
  const RoleDetail: React.FC<{
    role: Role;
    onEdit: () => void;
    onDelete: () => void;
  }> = ({
    role,
    onEdit,
    onDelete,
  }) => (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#b8902e]/10 bg-white p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf4df] text-[#b8902e]">
              <FiShield
                size={25}
              />
            </div>
  
            <div>
              <h2 className="text-xl font-bold text-[#2a2620]">
                {role.name}
              </h2>
  
              <p className="mt-1 font-mono text-xs text-[#8f6d1d]">
                {role.slug}
              </p>
            </div>
          </div>
  
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="flex h-10 items-center gap-2 rounded-xl border border-[#b8902e]/20 px-4 text-xs font-bold text-[#8f6d1d] hover:bg-[#faf8f3]"
            >
              <FiEdit2
                size={14}
              />
              Edit
            </button>
  
            <button
              type="button"
              onClick={onDelete}
              className="flex h-10 items-center gap-2 rounded-xl border border-[#c98d83]/20 bg-[#fff8f6] px-4 text-xs font-bold text-[#b46055] hover:bg-[#b46055] hover:text-white"
            >
              <FiTrash2
                size={14}
              />
              Delete
            </button>
          </div>
        </div>
      </div>
  
      <div className="rounded-2xl border border-[#b8902e]/10 bg-white p-5">
        <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a89a7d]">
          Role Information
        </h3>
  
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InfoCard
            label="Role Name"
            value={role.name}
          />
  
          <InfoCard
            label="Slug"
            value={role.slug}
          />
  
          <InfoCard
            label="Created At"
            value={formatDate(role.created_at)}
          />
  
          <InfoCard
            label="Updated At"
            value={formatDate(role.updated_at)}
          />
        </div>
  
        <div className="mt-4 rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
            Description
          </p>
  
          <p className="mt-1.5 text-sm leading-6 text-[#4a4436]">
            {role.description || "No description provided."}
          </p>
        </div>
      </div>
  
      <div className="rounded-2xl border border-[#b8902e]/10 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiKey
              size={16}
              className="text-[#b8902e]"
            />
  
            <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#a89a7d]">
              Assigned Permissions
            </h3>
          </div>
  
          <span className="rounded-lg bg-[#faf8f3] px-3 py-1 text-[10px] font-bold text-[#8f6d1d]">
            {role.permissions?.length || 0}
          </span>
        </div>
  
        {role.permissions && role.permissions.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {role.permissions.map((permission) => (
              <div
                key={permission.id}
                className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#2a2620]">
                      {permission.name}
                    </p>
  
                    <p className="mt-1 font-mono text-[10px] text-[#8f6d1d]">
                      {permission.slug}
                    </p>
                  </div>
  
                  <span className="rounded-lg bg-[#f4efe2] px-2 py-1 text-[9px] font-bold capitalize text-[#786f60]">
                    {permission.action}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-[#faf8f3] p-5 text-center text-xs text-[#a89a7d]">
            No permissions assigned.
          </div>
        )}
      </div>
    </div>
  );
  
  // =====================================================
  // PERMISSION DETAIL
  // =====================================================
  
  const PermissionDetail: React.FC<{
    permission: Permission;
    onEdit: () => void;
    onDelete: () => void;
  }> = ({
    permission,
    onEdit,
    onDelete,
  }) => (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#b8902e]/10 bg-white p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf4df] text-[#b8902e]">
              <FiKey
                size={25}
              />
            </div>
  
            <div>
              <h2 className="text-xl font-bold text-[#2a2620]">
                {permission.name}
              </h2>
  
              <p className="mt-1 font-mono text-xs text-[#8f6d1d]">
                {permission.slug}
              </p>
            </div>
          </div>
  
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="flex h-10 items-center gap-2 rounded-xl border border-[#b8902e]/20 px-4 text-xs font-bold text-[#8f6d1d] hover:bg-[#faf8f3]"
            >
              <FiEdit2
                size={14}
              />
              Edit
            </button>
  
            <button
              type="button"
              onClick={onDelete}
              className="flex h-10 items-center gap-2 rounded-xl border border-[#c98d83]/20 bg-[#fff8f6] px-4 text-xs font-bold text-[#b46055] hover:bg-[#b46055] hover:text-white"
            >
              <FiTrash2
                size={14}
              />
              Delete
            </button>
          </div>
        </div>
      </div>
  
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <InfoCard
          label="Permission Name"
          value={permission.name}
        />
  
        <InfoCard
          label="Slug"
          value={permission.slug}
          mono
        />
  
        <InfoCard
          label="Module"
          value={permission.module}
        />
  
        <InfoCard
          label="Action"
          value={permission.action}
        />
      </div>
  
      <div className="rounded-2xl border border-[#b8902e]/10 bg-white p-5">
        <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a89a7d]">
          Timeline
        </h3>
  
        <div className="space-y-3">
          <InfoRow
            label="Created At"
            value={formatDate(permission.created_at)}
          />
  
          <InfoRow
            label="Updated At"
            value={formatDate(permission.updated_at)}
          />
        </div>
      </div>
    </div>
  );
  
  // =====================================================
  // INFO COMPONENTS
  // =====================================================
  
  const InfoRow: React.FC<{
    label: string;
    value: string;
  }> = ({
    label,
    value,
  }) => (
    <div className="flex items-start justify-between gap-4 border-b border-[#b8902e]/10 pb-3 last:border-0 last:pb-0">
      <span className="text-xs text-[#a89a7d]">
        {label}
      </span>
  
      <span className="max-w-[65%] text-right text-xs font-bold text-[#4a4436]">
        {value}
      </span>
    </div>
  );
  
  const InfoCard: React.FC<{
    label: string;
    value: string;
    mono?: boolean;
  }> = ({
    label,
    value,
    mono = false,
  }) => (
    <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
        {label}
      </p>
  
      <p
        className={`mt-1.5 break-words text-sm font-bold text-[#2a2620] ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
  
  // =====================================================
  // MAIN PAGE
  // =====================================================
  
  const RoleManagement: React.FC = () => {
    const [activeSection, setActiveSection] = useState<SectionType>("admins");
  
    const [admins, setAdmins] = useState<AdminMember[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
  
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
  
    const [search, setSearch] = useState("");
  
    const [selectedAdminId, setSelectedAdminId] = useState<number | null>(null);
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
    const [selectedPermissionId, setSelectedPermissionId] = useState<number | null>(null);
  
    const [adminModalOpen, setAdminModalOpen] = useState(false);
    const [roleModalOpen, setRoleModalOpen] = useState(false);
    const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  
    const [editingAdmin, setEditingAdmin] = useState<AdminMember | null>(null);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
  
    // =================================================
    // FORMS
    // =================================================
  
    const [adminForm, setAdminForm] = useState({
      name: "",
      email: "",
      password: "",
      roles: [] as number[],
    });
  
    const [roleForm, setRoleForm] = useState<RolePayload>({
      name: "",
      slug: "",
      description: "",
      permissions: [],
    });
  
    const [permissionForm, setPermissionForm] = useState<PermissionPayload>({
      name: "",
      slug: "",
      module: "",
      action: "",
    });
  
    // =================================================
    // FETCH ALL
    // =================================================
  
    const fetchAll = async () => {
      try {
        setLoading(true);
  
        const [
          adminsResponse,
          rolesResponse,
          permissionsResponse,
        ] = await Promise.all([
          adminManagementApi.getAdmins(),
          adminManagementApi.getRoles(),
          adminManagementApi.getPermissions(),
        ]);
  
        const adminData = Array.isArray(adminsResponse.data)
          ? adminsResponse.data
          : [];
  
        const roleData = Array.isArray(rolesResponse.data)
          ? rolesResponse.data
          : [];
  
        const permissionData = Array.isArray(permissionsResponse.data)
          ? permissionsResponse.data
          : [];
  
        setAdmins(adminData);
        setRoles(roleData);
        setPermissions(permissionData);
  
        // Set initial selections only if we have data and no selection
        if (adminData.length > 0 && !selectedAdminId && activeSection === "admins") {
          setSelectedAdminId(adminData[0].id);
        }
  
        if (roleData.length > 0 && !selectedRoleId && activeSection === "roles") {
          setSelectedRoleId(roleData[0].id);
        }
  
        if (permissionData.length > 0 && !selectedPermissionId && activeSection === "permissions") {
          setSelectedPermissionId(permissionData[0].id);
        }
      } catch (error: any) {
        console.error("Role management fetch error:", error);
  
        toast.error(
          error?.response?.data?.message ||
          "Unable to load role management data."
        );
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      fetchAll();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  
    // =================================================
    // SELECTED DATA
    // =================================================
  
    const selectedAdmin = admins.find((item) => item.id === selectedAdminId) || null;
    const selectedRole = roles.find((item) => item.id === selectedRoleId) || null;
    const selectedPermission = permissions.find((item) => item.id === selectedPermissionId) || null;
  
    // =================================================
    // FILTER LIST
    // =================================================
  
    const filteredAdmins = useMemo(() => {
      const query = search.trim().toLowerCase();
  
      if (!query) {
        return admins;
      }
  
      return admins.filter((item) =>
        [item.name, item.email, String(item.id)]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    }, [admins, search]);
  
    const filteredRoles = useMemo(() => {
      const query = search.trim().toLowerCase();
  
      if (!query) {
        return roles;
      }
  
      return roles.filter((item) =>
        [item.name, item.slug, item.description || ""]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    }, [roles, search]);
  
    const filteredPermissions = useMemo(() => {
      const query = search.trim().toLowerCase();
  
      if (!query) {
        return permissions;
      }
  
      return permissions.filter((item) =>
        [item.name, item.slug, item.module, item.action]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    }, [permissions, search]);
  
    // =================================================
    // SECTION CHANGE
    // =================================================
  
    const handleSectionChange = (section: SectionType) => {
      setActiveSection(section);
      setSearch("");
  
      if (section === "admins") {
        setSelectedAdminId(filteredAdmins[0]?.id || admins[0]?.id || null);
      }
  
      if (section === "roles") {
        setSelectedRoleId(filteredRoles[0]?.id || roles[0]?.id || null);
      }
  
      if (section === "permissions") {
        setSelectedPermissionId(filteredPermissions[0]?.id || permissions[0]?.id || null);
      }
    };
  
    // =================================================
    // OPEN ADMIN CREATE
    // =================================================
  
    const openCreateAdmin = () => {
      setEditingAdmin(null);
      setAdminForm({
        name: "",
        email: "",
        password: "",
        roles: [],
      });
      setAdminModalOpen(true);
    };
  
    // =================================================
    // OPEN ADMIN EDIT
    // =================================================
  
    const openEditAdmin = (admin: AdminMember) => {
      setEditingAdmin(admin);
      setAdminForm({
        name: admin.name || "",
        email: admin.email || "",
        password: "",
        roles: admin.roles?.map((role) => role.id) || [],
      });
      setAdminModalOpen(true);
    };
  
    // =================================================
    // ADMIN CHANGE
    // =================================================
  
    const handleAdminChange = (
      key: "name" | "email" | "password",
      value: string
    ) => {
      setAdminForm((prev) => ({
        ...prev,
        [key]: value,
      }));
    };
  
    const toggleAdminRole = (id: number) => {
      setAdminForm((prev) => ({
        ...prev,
        roles: prev.roles.includes(id)
          ? prev.roles.filter((item) => item !== id)
          : [...prev.roles, id],
      }));
    };
  
    // =================================================
    // CREATE / UPDATE ADMIN
    // =================================================
  
    const submitAdmin = async () => {
      if (!adminForm.name.trim()) {
        toast.error("Please enter admin name.");
        return;
      }
  
      if (!adminForm.email.trim()) {
        toast.error("Please enter admin email.");
        return;
      }
  
      if (!editingAdmin && !adminForm.password) {
        toast.error("Please enter password.");
        return;
      }
  
      try {
        setActionLoading(true);
  
        if (editingAdmin) {
          const payload: {
            name: string;
            password?: string;
            roles: number[];
          } = {
            name: adminForm.name.trim(),
            roles: adminForm.roles,
          };
  
          if (adminForm.password.trim()) {
            payload.password = adminForm.password;
          }
  
          const response = await adminManagementApi.updateAdmin(
            editingAdmin.id,
            payload
          );
  
          toast.success(
            response.data?.message || "Admin updated successfully."
          );
        } else {
          const response = await adminManagementApi.createAdmin({
            name: adminForm.name.trim(),
            email: adminForm.email.trim(),
            password: adminForm.password,
            roles: adminForm.roles,
          });
  
          toast.success(
            response.data?.message || "Admin created successfully."
          );
        }
  
        setAdminModalOpen(false);
        setEditingAdmin(null);
        await fetchAll();
      } catch (error: any) {
        console.error("Admin save error:", error);
        toast.error(
          error?.response?.data?.message || "Unable to save admin."
        );
      } finally {
        setActionLoading(false);
      }
    };
  
    // =================================================
    // OPEN ROLE CREATE
    // =================================================
  
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
  
    // =================================================
    // OPEN ROLE EDIT
    // =================================================
  
    const openEditRole = (role: Role) => {
      setEditingRole(role);
      setRoleForm({
        name: role.name || "",
        slug: role.slug || "",
        description: role.description || "",
        permissions: role.permissions?.map((permission) => permission.id) || [],
      });
      setRoleModalOpen(true);
    };
  
    const handleRoleChange = (
      key: "name" | "slug" | "description",
      value: string
    ) => {
      setRoleForm((prev) => ({
        ...prev,
        [key]: value,
      }));
    };
  
    const toggleRolePermission = (id: number) => {
      setRoleForm((prev) => ({
        ...prev,
        permissions: prev.permissions.includes(id)
          ? prev.permissions.filter((item) => item !== id)
          : [...prev.permissions, id],
      }));
    };
  
    // =================================================
    // CREATE / UPDATE ROLE
    // =================================================
  
    const submitRole = async () => {
      if (!roleForm.name.trim()) {
        toast.error("Please enter role name.");
        return;
      }
  
      if (!roleForm.slug.trim()) {
        toast.error("Please enter role slug.");
        return;
      }
  
      try {
        setActionLoading(true);
  
        const payload: RolePayload = {
          name: roleForm.name.trim(),
          slug: roleForm.slug.trim().toLowerCase(),
          description: roleForm.description.trim(),
          permissions: roleForm.permissions,
        };
  
        if (editingRole) {
          const response = await adminManagementApi.updateRole(
            editingRole.id,
            payload
          );
  
          toast.success(
            response.data?.message || "Role updated successfully."
          );
        } else {
          const response = await adminManagementApi.createRole(payload);
  
          toast.success(
            response.data?.message || "Role created successfully."
          );
        }
  
        setRoleModalOpen(false);
        setEditingRole(null);
        await fetchAll();
      } catch (error: any) {
        console.error("Role save error:", error);
        toast.error(
          error?.response?.data?.message || "Unable to save role."
        );
      } finally {
        setActionLoading(false);
      }
    };
  
    // =================================================
    // OPEN PERMISSION CREATE
    // =================================================
  
    const openCreatePermission = () => {
      setEditingPermission(null);
      setPermissionForm({
        name: "",
        slug: "",
        module: "",
        action: "",
      });
      setPermissionModalOpen(true);
    };
  
    // =================================================
    // OPEN PERMISSION EDIT
    // =================================================
  
    const openEditPermission = (permission: Permission) => {
      setEditingPermission(permission);
      setPermissionForm({
        name: permission.name || "",
        slug: permission.slug || "",
        module: permission.module || "",
        action: permission.action || "",
      });
      setPermissionModalOpen(true);
    };
  
    const handlePermissionChange = (
      key: "name" | "slug" | "module" | "action",
      value: string
    ) => {
      setPermissionForm((prev) => ({
        ...prev,
        [key]: value,
      }));
    };
  
    // =================================================
    // CREATE / UPDATE PERMISSION
    // =================================================
  
    const submitPermission = async () => {
      if (!permissionForm.name.trim()) {
        toast.error("Please enter permission name.");
        return;
      }
  
      if (!permissionForm.module) {
        toast.error("Please select module.");
        return;
      }
  
      if (!permissionForm.action) {
        toast.error("Please select action.");
        return;
      }
  
      const generatedSlug =
        permissionForm.slug.trim() ||
        `${permissionForm.module}.${permissionForm.action}`;
  
      try {
        setActionLoading(true);
  
        const payload: PermissionPayload = {
          name: permissionForm.name.trim(),
          slug: generatedSlug.toLowerCase(),
          module: permissionForm.module,
          action: permissionForm.action,
        };
  
        if (editingPermission) {
          const response = await adminManagementApi.updatePermission(
            editingPermission.id,
            payload
          );
  
          toast.success(
            response.data?.message || "Permission updated successfully."
          );
        } else {
          const response = await adminManagementApi.createPermission(payload);
  
          toast.success(
            response.data?.message || "Permission created successfully."
          );
        }
  
        setPermissionModalOpen(false);
        setEditingPermission(null);
        await fetchAll();
      } catch (error: any) {
        console.error("Permission save error:", error);
        toast.error(
          error?.response?.data?.message || "Unable to save permission."
        );
      } finally {
        setActionLoading(false);
      }
    };
  
    // =================================================
    // DELETE OPEN
    // =================================================
  
    const openDelete = (type: SectionType, id: number, name: string) => {
      setDeleteTarget({ type, id, name });
      setDeleteModalOpen(true);
    };
  
    // =================================================
    // DELETE
    // =================================================
  
    const handleDelete = async () => {
      if (!deleteTarget) {
        return;
      }
  
      try {
        setDeleteLoading(true);
  
        if (deleteTarget.type === "admins") {
          await adminManagementApi.deleteAdmin(deleteTarget.id);
          setAdmins((prev) => prev.filter((item) => item.id !== deleteTarget.id));
          setSelectedAdminId(null);
        }
  
        if (deleteTarget.type === "roles") {
          await adminManagementApi.deleteRole(deleteTarget.id);
          setRoles((prev) => prev.filter((item) => item.id !== deleteTarget.id));
          setSelectedRoleId(null);
        }
  
        if (deleteTarget.type === "permissions") {
          await adminManagementApi.deletePermission(deleteTarget.id);
          setPermissions((prev) => prev.filter((item) => item.id !== deleteTarget.id));
          setSelectedPermissionId(null);
        }
  
        toast.success(
          `${deleteTarget.type === "admins"
            ? "Admin"
            : deleteTarget.type === "roles"
              ? "Role"
              : "Permission"
          } deleted successfully.`
        );
  
        setDeleteModalOpen(false);
        setDeleteTarget(null);
        await fetchAll();
      } catch (error: any) {
        console.error("Delete error:", error);
        toast.error(
          error?.response?.data?.message || "Unable to delete."
        );
      } finally {
        setDeleteLoading(false);
      }
    };
  
    // =================================================
    // CURRENT LIST
    // =================================================
  
    const currentCount =
      activeSection === "admins"
        ? filteredAdmins.length
        : activeSection === "roles"
          ? filteredRoles.length
          : filteredPermissions.length;
  
    // =================================================
    // LOADING
    // =================================================
  
    if (loading && admins.length === 0 && roles.length === 0 && permissions.length === 0) {
      return (
        <div className="flex min-h-[500px] items-center justify-center bg-[#faf8f3]">
          <div className="flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#b8902e] shadow-sm">
              <FiRefreshCw
                size={24}
                className="animate-spin"
              />
            </div>
  
            <p className="mt-4 text-sm font-bold text-[#2a2620]">
              Loading role management...
            </p>
  
            <p className="mt-1 text-xs text-[#a89a7d]">
              Please wait while access data is loaded.
            </p>
          </div>
        </div>
      );
    }
  
    // =================================================
    // RENDER
    // =================================================
  
    return (
      <>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="min-h-screen bg-[#faf8f3] p-4"
        >
          {/* HEADER */}
  
          <motion.div
            variants={itemVariants}
            className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center"
          >
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#b8902e]" />
  
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#b8902e]">
                  Access Control
                </span>
              </div>
  
              <h1 className="font-serif text-[28px] font-bold tracking-tight text-[#2a2620] sm:text-[30px]">
                Role Management
              </h1>
  
              <p className="mt-1 text-sm text-[#786f60]">
                Manage administrators, roles and permissions from one place.
              </p>
            </div>
  
            <button
              type="button"
              onClick={
                activeSection === "admins"
                  ? openCreateAdmin
                  : activeSection === "roles"
                    ? openCreateRole
                    : openCreatePermission
              }
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-5 text-sm font-bold text-white shadow-md shadow-[#b8902e]/15 transition hover:from-[#a8841c] hover:to-[#7c5d12]"
            >
              <FiPlus size={18} />
  
              {activeSection === "admins"
                ? "Add Admin"
                : activeSection === "roles"
                  ? "Add Role"
                  : "Add Permission"}
            </button>
          </motion.div>
  
          {/* TOP SECTION SWITCHER */}
  
          <motion.div
            variants={itemVariants}
            className="mb-5 overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-2 p-2">
              {[
                {
                  key: "admins" as SectionType,
                  label: "Administrators",
                  icon: <FiUsers size={15} />,
                  count: admins.length,
                },
                {
                  key: "roles" as SectionType,
                  label: "Roles",
                  icon: <FiShield size={15} />,
                  count: roles.length,
                },
                {
                  key: "permissions" as SectionType,
                  label: "Permissions",
                  icon: <FiKey size={15} />,
                  count: permissions.length,
                },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleSectionChange(item.key)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition ${
                    activeSection === item.key
                      ? "bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] text-white shadow-md shadow-[#b8902e]/15"
                      : "text-[#786f60] hover:bg-[#faf8f3] hover:text-[#8f6d1d]"
                  }`}
                >
                  {item.icon}
                  {item.label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] ${
                      activeSection === item.key
                        ? "bg-white/20 text-white"
                        : "bg-[#faf8f3] text-[#8f6d1d]"
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              ))}
  
              <div className="ml-auto hidden items-center gap-2 pr-2 sm:flex">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#b8902e]" />
  
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#8f6d1d]">
                  Access Control Active
                </span>
              </div>
            </div>
          </motion.div>
  
          {/* MASTER DETAIL */}
  
          <motion.div
            variants={itemVariants}
            className="flex min-h-[650px] flex-col gap-4 lg:flex-row"
          >
            {/* LEFT MASTER SIDEBAR */}
  
            <aside className="flex w-full flex-col overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-sm lg:w-[36%]">
              {/* SEARCH */}
  
              <div className="border-b border-[#b8902e]/10 p-4">
                <div className="mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#a89a7d]">
                    {activeSection === "admins"
                      ? "Admin Directory"
                      : activeSection === "roles"
                        ? "Role Directory"
                        : "Permission Directory"}
                  </p>
  
                  <p className="mt-1 text-xs text-[#786f60]">
                    {currentCount} item{currentCount === 1 ? "" : "s"} found
                  </p>
                </div>
  
                <div className="relative">
                  <FiSearch
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b8902e]"
                  />
  
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={
                      activeSection === "admins"
                        ? "Search admin..."
                        : activeSection === "roles"
                          ? "Search role..."
                          : "Search permission..."
                    }
                    className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] pl-10 pr-4 text-sm text-[#2a2620] outline-none placeholder:text-[#a89a7d] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/10"
                  />
                </div>
              </div>
  
              {/* LIST */}
  
              <div className="flex-1 overflow-y-auto">
                {activeSection === "admins" && (
                  <>
                    {filteredAdmins.length > 0 ? (
                      filteredAdmins.map((admin) => {
                        const selected = admin.id === selectedAdminId;
  
                        return (
                          <button
                            type="button"
                            key={admin.id}
                            onClick={() => setSelectedAdminId(admin.id)}
                            className={`w-full border-b border-[#b8902e]/10 p-4 text-left transition ${
                              selected
                                ? "border-l-4 border-l-[#b8902e] bg-[#faf4df]"
                                : "hover:bg-[#faf8f3]"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-xs font-bold text-white">
                                {getInitials(admin.name)}
                              </div>
  
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <h4 className="truncate text-sm font-bold text-[#2a2620]">
                                    {admin.name}
                                  </h4>
  
                                  <FiChevronRight
                                    size={15}
                                    className={selected ? "text-[#b8902e]" : "text-[#c7bfae]"}
                                  />
                                </div>
  
                                <p className="mt-1 truncate text-xs text-[#786f60]">
                                  {admin.email}
                                </p>
  
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="rounded-full bg-[#f8f3e5] px-2 py-1 text-[9px] font-bold text-[#806319]">
                                    {admin.roles?.length || 0} role
                                    {admin.roles?.length === 1 ? "" : "s"}
                                  </span>
  
                                  <span className="text-[9px] text-[#a89a7d]">
                                    #{admin.id}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <EmptyList
                        icon={<FiUsers size={22} />}
                        title="No admins found"
                        subtitle="Try another search."
                      />
                    )}
                  </>
                )}
  
                {activeSection === "roles" && (
                  <>
                    {filteredRoles.length > 0 ? (
                      filteredRoles.map((role) => {
                        const selected = role.id === selectedRoleId;
  
                        return (
                          <button
                            type="button"
                            key={role.id}
                            onClick={() => setSelectedRoleId(role.id)}
                            className={`w-full border-b border-[#b8902e]/10 p-4 text-left transition ${
                              selected
                                ? "border-l-4 border-l-[#b8902e] bg-[#faf4df]"
                                : "hover:bg-[#faf8f3]"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#faf4df] text-[#b8902e]">
                                <FiShield size={18} />
                              </div>
  
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <h4 className="truncate text-sm font-bold text-[#2a2620]">
                                    {role.name}
                                  </h4>
  
                                  <FiChevronRight
                                    size={15}
                                    className={selected ? "text-[#b8902e]" : "text-[#c7bfae]"}
                                  />
                                </div>
  
                                <p className="mt-1 truncate font-mono text-[10px] text-[#8f6d1d]">
                                  {role.slug}
                                </p>
  
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="rounded-full bg-[#f8f3e5] px-2 py-1 text-[9px] font-bold text-[#806319]">
                                    {role.permissions?.length || 0} permission
                                    {role.permissions?.length === 1 ? "" : "s"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <EmptyList
                        icon={<FiShield size={22} />}
                        title="No roles found"
                        subtitle="Create a role to get started."
                      />
                    )}
                  </>
                )}
  
                {activeSection === "permissions" && (
                  <>
                    {filteredPermissions.length > 0 ? (
                      filteredPermissions.map((permission) => {
                        const selected = permission.id === selectedPermissionId;
  
                        return (
                          <button
                            type="button"
                            key={permission.id}
                            onClick={() => setSelectedPermissionId(permission.id)}
                            className={`w-full border-b border-[#b8902e]/10 p-4 text-left transition ${
                              selected
                                ? "border-l-4 border-l-[#b8902e] bg-[#faf4df]"
                                : "hover:bg-[#faf8f3]"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#faf4df] text-[#b8902e]">
                                <FiKey size={18} />
                              </div>
  
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <h4 className="truncate text-sm font-bold text-[#2a2620]">
                                    {permission.name}
                                  </h4>
  
                                  <FiChevronRight
                                    size={15}
                                    className={selected ? "text-[#b8902e]" : "text-[#c7bfae]"}
                                  />
                                </div>
  
                                <p className="mt-1 truncate font-mono text-[10px] text-[#8f6d1d]">
                                  {permission.slug}
                                </p>
  
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  <span className="rounded-md bg-[#f4efe2] px-2 py-1 text-[9px] font-semibold capitalize text-[#786f60]">
                                    {permission.module}
                                  </span>
  
                                  <span className="rounded-md bg-[#f4efe2] px-2 py-1 text-[9px] font-semibold capitalize text-[#786f60]">
                                    {permission.action}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <EmptyList
                        icon={<FiKey size={22} />}
                        title="No permissions found"
                        subtitle="Create a permission to get started."
                      />
                    )}
                  </>
                )}
              </div>
            </aside>
  
            {/* RIGHT DETAIL */}
  
            <section className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-[#faf8f3] shadow-sm">
              <div className="flex h-full flex-col">
                {/* DETAIL TOP */}
  
                <div className="border-b border-[#b8902e]/10 bg-white px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b8902e]">
                        Selected
                      </p>
  
                      <h2 className="mt-1 text-lg font-bold text-[#2a2620]">
                        {activeSection === "admins"
                          ? selectedAdmin?.name || "Admin Details"
                          : activeSection === "roles"
                            ? selectedRole?.name || "Role Details"
                            : selectedPermission?.name || "Permission Details"}
                      </h2>
                    </div>
  
                    <button
                      type="button"
                      onClick={fetchAll}
                      className="flex h-9 items-center gap-2 rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] px-3 text-[10px] font-bold text-[#8f6d1d] hover:bg-[#f4efe2]"
                    >
                      <FiRefreshCw
                        size={13}
                        className={loading ? "animate-spin" : ""}
                      />
                      Refresh
                    </button>
                  </div>
                </div>
  
                {/* DETAIL BODY */}
  
                <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                  {activeSection === "admins" && selectedAdmin ? (
                    <AdminDetail
                      admin={selectedAdmin}
                      onEdit={() => openEditAdmin(selectedAdmin)}
                      onDelete={() =>
                        openDelete(
                          "admins",
                          selectedAdmin.id,
                          selectedAdmin.name
                        )
                      }
                    />
                  ) : activeSection === "roles" && selectedRole ? (
                    <RoleDetail
                      role={selectedRole}
                      onEdit={() => openEditRole(selectedRole)}
                      onDelete={() =>
                        openDelete(
                          "roles",
                          selectedRole.id,
                          selectedRole.name
                        )
                      }
                    />
                  ) : activeSection === "permissions" && selectedPermission ? (
                    <PermissionDetail
                      permission={selectedPermission}
                      onEdit={() => openEditPermission(selectedPermission)}
                      onDelete={() =>
                        openDelete(
                          "permissions",
                          selectedPermission.id,
                          selectedPermission.name
                        )
                      }
                    />
                  ) : (
                    <div className="flex min-h-[450px] flex-col items-center justify-center text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#b8902e] shadow-sm">
                        {activeSection === "admins" ? (
                          <FiUsers size={26} />
                        ) : activeSection === "roles" ? (
                          <FiShield size={26} />
                        ) : (
                          <FiKey size={26} />
                        )}
                      </div>
  
                      <h3 className="mt-5 text-base font-bold text-[#2a2620]">
                        Nothing selected
                      </h3>
  
                      <p className="mt-1 max-w-[300px] text-xs leading-5 text-[#a89a7d]">
                        Select an item from the left panel to view its complete details.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </motion.div>
        </motion.div>
  
        {/* =================================================
            ADMIN MODAL
        ================================================= */}
  
        <GlobalModal
          isOpen={adminModalOpen}
          onClose={() => {
            if (!actionLoading) {
              setAdminModalOpen(false);
              setEditingAdmin(null);
            }
          }}
          closeOnOverlayClick={!actionLoading}
        >
          <AdminForm
            editing={!!editingAdmin}
            form={adminForm}
            roles={roles}
            loading={actionLoading}
            onChange={handleAdminChange}
            onRoleToggle={toggleAdminRole}
            onSubmit={submitAdmin}
            onClose={() => {
              setAdminModalOpen(false);
              setEditingAdmin(null);
            }}
          />
        </GlobalModal>
  
        {/* =================================================
            ROLE MODAL
        ================================================= */}
  
        <GlobalModal
          isOpen={roleModalOpen}
          onClose={() => {
            if (!actionLoading) {
              setRoleModalOpen(false);
              setEditingRole(null);
            }
          }}
          closeOnOverlayClick={!actionLoading}
        >
          <RoleForm
            editing={!!editingRole}
            form={roleForm}
            permissions={permissions}
            loading={actionLoading}
            onChange={handleRoleChange}
            onPermissionToggle={toggleRolePermission}
            onSubmit={submitRole}
            onClose={() => {
              setRoleModalOpen(false);
              setEditingRole(null);
            }}
          />
        </GlobalModal>
  
        {/* =================================================
            PERMISSION MODAL
        ================================================= */}
  
        <GlobalModal
          isOpen={permissionModalOpen}
          onClose={() => {
            if (!actionLoading) {
              setPermissionModalOpen(false);
              setEditingPermission(null);
            }
          }}
          closeOnOverlayClick={!actionLoading}
        >
          <PermissionForm
            editing={!!editingPermission}
            form={permissionForm}
            loading={actionLoading}
            onChange={handlePermissionChange}
            onSubmit={submitPermission}
            onClose={() => {
              setPermissionModalOpen(false);
              setEditingPermission(null);
            }}
          />
        </GlobalModal>
  
        {/* =================================================
            DELETE MODAL
        ================================================= */}
  
        <DeleteModal
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
  
  // =====================================================
  // EMPTY LIST
  // =====================================================
  
  const EmptyList: React.FC<{
    icon: React.ReactNode;
    title: string;
    subtitle: string;
  }> = ({
    icon,
    title,
    subtitle,
  }) => (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#b8902e]">
        {icon}
      </div>
  
      <p className="mt-4 text-sm font-bold text-[#2a2620]">
        {title}
      </p>
  
      <p className="mt-1 text-xs text-[#a89a7d]">
        {subtitle}
      </p>
    </div>
  );
  
  export default RoleManagement;