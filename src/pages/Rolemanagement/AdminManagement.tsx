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

// =====================================================
// THEME
// =====================================================

const PRIMARY = "#1E3A8A";
const DARK_PRIMARY = "#172554";
const BLUE = "#1E40AF";
const ACCENT = "#2563EB";

const LIGHT_BLUE = "#EAF1FF";
const SOFT_BLUE = "#DBEAFE";
const PAGE_BG = "#F5F8FF";

const TEXT_PRIMARY = "#0F1B3D";
const TEXT_SECONDARY = "#4A5778";
const MUTED = "#8C97B2";

const BORDER = "#D8E2F0";
const WHITE = "#FFFFFF";

const DANGER = "#C23B32";
const DANGER_BG = "#FBEAEA";

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
  name?: string | null,
): string => {
  if (!name) return "AD";

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
  value?: string | null,
): string => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
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
    },
  );
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
  canSubmit: boolean;
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
  canSubmit,
}) => {
  const selectedRole = roles.find(
    (role) =>
      role.id === form.role_id,
  );

  if (!open) return null;

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
      <div className="w-full max-w-[620px] overflow-hidden rounded-[22px] border bg-white shadow-[0_25px_70px_rgba(30,58,138,0.18)]">
        <div
          className="h-[3px]"
          style={{
            background:
              `linear-gradient(to right, ${ACCENT}, ${PRIMARY}, ${DARK_PRIMARY})`,
          }}
        />

        {/* HEADER */}
        <div
          className="flex items-start justify-between gap-4 border-b px-6 py-5"
          style={{
            borderColor:
              "rgba(30,58,138,0.10)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{
                backgroundColor:
                  LIGHT_BLUE,
                color: PRIMARY,
              }}
            >
              <FiUsers size={20} />
            </div>

            <div>
              <p
                className="text-[9px] font-bold uppercase tracking-[0.18em]"
                style={{
                  color: ACCENT,
                }}
              >
                Admin Access
              </p>

              <h2
                className="mt-1 text-[21px] font-bold"
                style={{
                  color:
                    TEXT_PRIMARY,
                }}
              >
                {editingAdmin
                  ? "Edit Admin"
                  : "Create Admin"}
              </h2>

              <p
                className="mt-0.5 text-xs"
                style={{
                  color: MUTED,
                }}
              >
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
            className="flex h-9 w-9 items-center justify-center rounded-xl transition disabled:opacity-40"
            style={{
              backgroundColor:
                PAGE_BG,
              color: PRIMARY,
            }}
          >
            <FiX size={18} />
          </button>
        </div>

        {/* BODY */}
        <div
          className="max-h-[70vh] overflow-y-auto p-5"
          style={{
            backgroundColor:
              PAGE_BG,
          }}
        >
          <div className="space-y-4">
            {/* BASIC INFORMATION */}
            <div
              className="rounded-2xl border bg-white p-5"
              style={{
                borderColor:
                  "rgba(30,58,138,0.10)",
              }}
            >
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor:
                      LIGHT_BLUE,
                    color: PRIMARY,
                  }}
                >
                  <FiUsers size={16} />
                </div>

                <div>
                  <h3
                    className="text-sm font-bold"
                    style={{
                      color:
                        TEXT_PRIMARY,
                    }}
                  >
                    Administrator Information
                  </h3>

                  <p
                    className="mt-0.5 text-[10px]"
                    style={{
                      color: MUTED,
                    }}
                  >
                    Enter the admin account
                    details.
                  </p>
                </div>
              </div>

              {/* NAME */}
              <div>
                <label
                  className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide"
                  style={{
                    color:
                      TEXT_SECONDARY,
                  }}
                >
                  Full Name *
                </label>

                <input
                  type="text"
                  value={form.name}
                  disabled={
                    loading ||
                    !canSubmit
                  }
                  onChange={(
                    event: ChangeEvent<HTMLInputElement>,
                  ) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        name: event
                          .target.value,
                      }),
                    )
                  }
                  placeholder="John Admin"
                  className="h-11 w-full rounded-xl px-4 text-sm outline-none placeholder:text-[#8C97B2] disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    border:
                      `1px solid ${BORDER}`,
                    backgroundColor:
                      loading ||
                      !canSubmit
                        ? "#EEF3FA"
                        : PAGE_BG,
                    color:
                      TEXT_PRIMARY,
                  }}
                />
              </div>

              {/* EMAIL */}
              <div className="mt-4">
                <label
                  className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide"
                  style={{
                    color:
                      TEXT_SECONDARY,
                  }}
                >
                  Email *
                </label>

                <div className="relative">
                  <FiMail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{
                      color: PRIMARY,
                    }}
                  />

                  <input
                    type="email"
                    value={form.email}
                    disabled={
                      !!editingAdmin ||
                      loading ||
                      !canSubmit
                    }
                    onChange={(
                      event: ChangeEvent<HTMLInputElement>,
                    ) =>
                      setForm(
                        (previous) => ({
                          ...previous,
                          email:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                    placeholder="admin@example.com"
                    className="h-11 w-full rounded-xl pl-10 pr-4 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-70 placeholder:text-[#8C97B2]"
                    style={{
                      border:
                        `1px solid ${BORDER}`,
                      backgroundColor:
                        editingAdmin ||
                        loading ||
                        !canSubmit
                          ? "#EAF1FF"
                          : PAGE_BG,
                      color:
                        TEXT_PRIMARY,
                    }}
                  />
                </div>

                {editingAdmin && (
                  <p
                    className="mt-1.5 text-[10px]"
                    style={{
                      color: MUTED,
                    }}
                  >
                    Email cannot be changed
                    while editing an admin.
                  </p>
                )}
              </div>

              {/* PASSWORD */}
              <div className="mt-4">
                <label
                  className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide"
                  style={{
                    color:
                      TEXT_SECONDARY,
                  }}
                >
                  {editingAdmin
                    ? "New Password"
                    : "Password *"}
                </label>

                <div className="relative">
                  <FiLock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{
                      color: PRIMARY,
                    }}
                  />

                  <input
                    type="password"
                    value={form.password}
                    disabled={
                      loading ||
                      !canSubmit
                    }
                    onChange={(
                      event: ChangeEvent<HTMLInputElement>,
                    ) =>
                      setForm(
                        (previous) => ({
                          ...previous,
                          password:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                    placeholder={
                      editingAdmin
                        ? "Leave blank to keep current password"
                        : "Admin@12345"
                    }
                    className="h-11 w-full rounded-xl pl-10 pr-4 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60 placeholder:text-[#8C97B2]"
                    style={{
                      border:
                        `1px solid ${BORDER}`,
                      backgroundColor:
                        loading ||
                        !canSubmit
                          ? "#EEF3FA"
                          : PAGE_BG,
                      color:
                        TEXT_PRIMARY,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ROLE */}
            <div
              className="rounded-2xl border bg-white p-5"
              style={{
                borderColor:
                  "rgba(30,58,138,0.10)",
              }}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor:
                        LIGHT_BLUE,
                      color: PRIMARY,
                    }}
                  >
                    <FiShield size={16} />
                  </div>

                  <div>
                    <h3
                      className="text-sm font-bold"
                      style={{
                        color:
                          TEXT_PRIMARY,
                      }}
                    >
                      Assign Role
                    </h3>

                    <p
                      className="mt-0.5 text-[10px]"
                      style={{
                        color: MUTED,
                      }}
                    >
                      Select one role for this
                      administrator.
                    </p>
                  </div>
                </div>

                <span
                  className="rounded-full px-3 py-1.5 text-[9px] font-bold"
                  style={{
                    backgroundColor:
                      LIGHT_BLUE,
                    color: PRIMARY,
                  }}
                >
                  {roles.length} Roles
                </span>
              </div>

              <label
                className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide"
                style={{
                  color:
                    TEXT_SECONDARY,
                }}
              >
                Select Role *
              </label>

              <div className="relative">
                <FiShield
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{
                    color: PRIMARY,
                  }}
                />

                <select
                  value={
                    form.role_id ??
                    ""
                  }
                  disabled={
                    loading ||
                    !canSubmit
                  }
                  onChange={(
                    event: ChangeEvent<HTMLSelectElement>,
                  ) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        role_id:
                          event
                            .target
                            .value
                            ? Number(
                                event
                                  .target
                                  .value,
                              )
                            : null,
                      }),
                    )
                  }
                  className="h-12 w-full appearance-none rounded-xl pl-10 pr-10 text-sm font-semibold outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    border:
                      `1px solid ${BORDER}`,
                    backgroundColor:
                      loading ||
                      !canSubmit
                        ? "#EEF3FA"
                        : PAGE_BG,
                    color:
                      TEXT_PRIMARY,
                  }}
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
                    ),
                  )}
                </select>

                <svg
                  className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  style={{
                    color: PRIMARY,
                  }}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              {selectedRole && (
                <div
                  className="mt-4 rounded-xl border p-4"
                  style={{
                    borderColor:
                      "#C9D9F4",
                    backgroundColor:
                      LIGHT_BLUE,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p
                        className="text-[9px] font-bold uppercase tracking-[0.15em]"
                        style={{
                          color: PRIMARY,
                        }}
                      >
                        Selected Role
                      </p>

                      <p
                        className="mt-1 text-sm font-bold"
                        style={{
                          color:
                            TEXT_PRIMARY,
                        }}
                      >
                        {
                          selectedRole.name
                        }
                      </p>

                      <p
                        className="mt-1 font-mono text-[10px]"
                        style={{
                          color: MUTED,
                        }}
                      >
                        {
                          selectedRole.slug
                        }
                      </p>
                    </div>

                    <span
                      className="rounded-full bg-white px-3 py-1.5 text-[9px] font-bold"
                      style={{
                        color: PRIMARY,
                      }}
                    >
                      {selectedRole
                        .permissions
                        ?.length || 0}{" "}
                      Permissions
                    </span>
                  </div>

                  {selectedRole.description && (
                    <p
                      className="mt-3 text-xs leading-5"
                      style={{
                        color:
                          TEXT_SECONDARY,
                      }}
                    >
                      {
                        selectedRole.description
                      }
                    </p>
                  )}

                  {selectedRole.permissions &&
                    selectedRole.permissions
                      .length > 0 && (
                      <div
                        className="mt-3 border-t pt-3"
                        style={{
                          borderColor:
                            "rgba(30,58,138,0.10)",
                        }}
                      >
                        <div className="flex flex-wrap gap-1.5">
                          {selectedRole.permissions.map(
                            (
                              permission,
                            ) => (
                              <span
                                key={
                                  permission.id
                                }
                                className="inline-flex items-center gap-1 rounded-lg border bg-white px-2.5 py-1.5 text-[9px] font-semibold"
                                style={{
                                  borderColor:
                                    BORDER,
                                  color:
                                    TEXT_SECONDARY,
                                }}
                              >
                                <FiCheck
                                  size={
                                    10
                                  }
                                  style={{
                                    color:
                                      PRIMARY,
                                  }}
                                />

                                {
                                  permission.name
                                }
                              </span>
                            ),
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
        <div
          className="flex justify-end gap-2 border-t bg-white px-6 py-4"
          style={{
            borderColor:
              "rgba(30,58,138,0.10)",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-10 rounded-xl border bg-white px-5 text-sm font-bold transition disabled:opacity-50"
            style={{
              borderColor:
                BORDER,
              color:
                TEXT_SECONDARY,
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={
              loading ||
              !canSubmit
            }
            className="flex h-10 items-center gap-2 rounded-xl px-6 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(30,58,138,0.6)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background:
                `linear-gradient(135deg, ${ACCENT}, ${PRIMARY}, ${DARK_PRIMARY})`,
            }}
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
      <div className="w-full max-w-[450px] overflow-hidden rounded-[22px] border bg-white shadow-2xl">
        <div
          className="h-[3px]"
          style={{
            background:
              `linear-gradient(to right, ${ACCENT}, ${DANGER})`,
          }}
        />

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
              style={{
                backgroundColor:
                  DANGER_BG,
                color: DANGER,
              }}
            >
              <FiTrash2 size={22} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p
                    className="text-[9px] font-bold uppercase tracking-[0.16em]"
                    style={{
                      color: DANGER,
                    }}
                  >
                    Confirmation
                  </p>

                  <h2
                    className="mt-1 text-xl font-bold"
                    style={{
                      color:
                        TEXT_PRIMARY,
                    }}
                  >
                    Delete Admin
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-40"
                  style={{
                    backgroundColor:
                      PAGE_BG,
                    color: PRIMARY,
                  }}
                >
                  <FiX size={16} />
                </button>
              </div>

              <p
                className="mt-2 text-sm leading-6"
                style={{
                  color:
                    TEXT_SECONDARY,
                }}
              >
                Are you sure you want to
                delete this administrator?
                This action cannot be undone.
              </p>
            </div>
          </div>

          <div
            className="mt-5 rounded-xl border p-4"
            style={{
              borderColor:
                "rgba(30,58,138,0.10)",
              backgroundColor:
                PAGE_BG,
            }}
          >
            <p
              className="text-[9px] font-bold uppercase tracking-wide"
              style={{
                color: MUTED,
              }}
            >
              Selected Admin
            </p>

            <p
              className="mt-1.5 text-base font-bold"
              style={{
                color:
                  TEXT_PRIMARY,
              }}
            >
              {target.name}
            </p>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-10 rounded-xl border bg-white px-5 text-sm font-bold transition disabled:opacity-50"
              style={{
                borderColor:
                  BORDER,
                color:
                  TEXT_SECONDARY,
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(194,59,50,0.6)] transition hover:-translate-y-0.5 disabled:opacity-50"
              style={{
                background:
                  `linear-gradient(135deg, ${DANGER}, #A62F27)`,
              }}
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
// ACCESS DENIED
// =====================================================

const AccessDenied: FC = () => {
  return (
    <div
      className="flex min-h-[500px] items-center justify-center p-6 font-poppins"
      style={{
        backgroundColor:
          PAGE_BG,
      }}
    >
      <div className="w-full max-w-[460px] rounded-[24px] border bg-white p-8 text-center shadow-[0_15px_50px_rgba(30,58,138,0.08)]">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{
            backgroundColor:
              DANGER_BG,
            color: DANGER,
          }}
        >
          <FiShieldOff size={28} />
        </div>

        <h2
          className="mt-5 text-xl font-bold"
          style={{
            color:
              TEXT_PRIMARY,
          }}
        >
          Access Denied
        </h2>

        <p
          className="mt-2 text-sm leading-6"
          style={{
            color:
              TEXT_SECONDARY,
          }}
        >
          You don't have permission to
          access the Admin Management
          module.
        </p>

        <div
          className="mt-5 flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold"
          style={{
            borderColor:
              "#F0D1CE",
            backgroundColor:
              DANGER_BG,
            color: DANGER,
          }}
        >
          <FiAlertCircle size={14} />

          Contact your administrator to
          request access.
        </div>
      </div>
    </div>
  );
};

// =====================================================
// MAIN
// =====================================================

const AdminManagement: FC = () => {
  const location = useLocation();

  const adminFromHeader =
    location.state
      ?.admin as
      | AdminMember
      | undefined;

  // ===================================================
  // PERMISSIONS
  // ===================================================

  const {
    hasPermission,
    isSuperAdmin,
    loading:
      permissionsLoading,
  } = usePermissions();

  /**
   * IMPORTANT:
   *
   * Backend permissions:
   *
   * admin:
   *   create
   *   edit
   *   view
   *   details
   *   delete
   *
   * Therefore frontend uses:
   *
   * admin.create
   * admin.edit
   * admin.view
   * admin.delete
   *
   * No module-access fallback is used here.
   */

  const canViewAdmins = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("admin_member.view") ||
      hasPermission("admin_member.details"),
    [isSuperAdmin, hasPermission],
  );
  
  const canCreateAdmin = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("admin_member.create"),
    [isSuperAdmin, hasPermission],
  );
  
  const canUpdateAdmin = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("admin_member.edit"),
    [isSuperAdmin, hasPermission],
  );
  
  const canDeleteAdmin = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("admin_member.delete"),
    [isSuperAdmin, hasPermission],
  );


  const canViewRoles = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission(
        "role.view",
      ) ||
      hasPermission(
        "roles.view",
      ),
    [
      isSuperAdmin,
      hasPermission,
    ],
  );

  // ===================================================
  // STATES
  // ===================================================

  const [admins, setAdmins] =
    useState<AdminMember[]>(
      [],
    );

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

  const [search, setSearch] =
    useState("");

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
      null,
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
      null,
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

  const [
    highlightedAdminId,
    setHighlightedAdminId,
  ] =
    useState<number | null>(
      null,
    );

  const [
    isInitialLoad,
    setIsInitialLoad,
  ] = useState(true);

  const ITEMS_PER_PAGE = 10;

  // ===================================================
  // FETCH PROTECTION
  // ===================================================

  const fetchInFlightRef =
    useRef<Promise<void> | null>(
      null,
    );

  const hasInitialFetchRef =
    useRef(false);

  // ===================================================
  // OPEN EDIT
  // ===================================================

  const openEditAdmin =
    useCallback(
      (
        admin: AdminMember,
      ) => {
        if (!canUpdateAdmin) {
          toast.error(
            "You do not have permission to update admins.",
          );
          return;
        }

        if (!canViewRoles) {
          toast.error(
            "You do not have permission to view roles.",
          );
          return;
        }

        setEditingAdmin(
          admin,
        );

        setAdminForm({
          name:
            admin.name || "",
          email:
            admin.email || "",
          password: "",
          role_id:
            admin.roles?.[0]
              ?.id || null,
        });

        setModalOpen(true);
      },
      [
        canUpdateAdmin,
        canViewRoles,
      ],
    );

  // ===================================================
  // FETCH
  // ===================================================

  const fetchAll =
    useCallback(
      async (
        force = false,
      ) => {
        if (!canViewAdmins) {
          setLoading(false);
          return;
        }

        if (
          fetchInFlightRef.current
        ) {
          return fetchInFlightRef.current;
        }

        if (
          !force &&
          hasInitialFetchRef.current
        ) {
          return;
        }

        const requestPromise =
          (async () => {
            try {
              setLoading(true);

              const requests: Promise<any>[] =
                [
                  adminManagementApi.getAdmins(),
                ];

              /**
               * Roles are only fetched if
               * current admin has role.view.
               */
              if (canViewRoles) {
                requests.push(
                  adminManagementApi.getRoles(),
                );
              }

              const responses =
                await Promise.all(
                  requests,
                );

              // =================================================
              // ADMINS
              // =================================================

              const adminsResponse =
                responses[0];

              const adminsRaw =
                adminsResponse.data;

              const adminsData =
                Array.isArray(
                  adminsRaw,
                )
                  ? adminsRaw
                  : adminsRaw &&
                      typeof adminsRaw ===
                        "object" &&
                      "data" in
                        adminsRaw &&
                      Array.isArray(
                        (
                          adminsRaw as {
                            data?: unknown;
                          }
                        ).data,
                      )
                    ? (
                        adminsRaw as {
                          data: AdminMember[];
                        }
                      ).data
                    : [];

              // =================================================
              // ROLES
              // =================================================

              let rolesData: Role[] =
                [];

              if (
                canViewRoles &&
                responses[1]
              ) {
                const rolesRaw =
                  responses[1].data;

                rolesData =
                  Array.isArray(
                    rolesRaw,
                  )
                    ? rolesRaw
                    : rolesRaw &&
                        typeof rolesRaw ===
                          "object" &&
                        "data" in
                          rolesRaw &&
                        Array.isArray(
                          (
                            rolesRaw as {
                              data?: unknown;
                            }
                          ).data,
                        )
                      ? (
                          rolesRaw as {
                            data: Role[];
                          }
                        ).data
                      : [];
              }

              setAdmins(
                adminsData as AdminMember[],
              );

              setRoles(
                rolesData as Role[],
              );

              // =================================================
              // HEADER ADMIN
              // =================================================

              if (
                adminFromHeader &&
                isInitialLoad &&
                adminsData.length > 0
              ) {
                const targetAdmin =
                  adminsData.find(
                    (
                      admin: AdminMember,
                    ) =>
                      String(
                        admin.id,
                      ) ===
                      String(
                        adminFromHeader.id,
                      ),
                  );

                if (
                  targetAdmin
                ) {
                  const searchTerm =
                    targetAdmin.name ||
                    targetAdmin.email ||
                    String(
                      targetAdmin.id,
                    );

                  setSearch(
                    searchTerm,
                  );

                  setHighlightedAdminId(
                    targetAdmin.id,
                  );

                  if (
                    canUpdateAdmin &&
                    canViewRoles
                  ) {
                    openEditAdmin(
                      targetAdmin,
                    );
                  }
                } else {
                  setSearch(
                    String(
                      adminFromHeader.id,
                    ),
                  );

                  toast.info(
                    `Looking for admin with ID: ${adminFromHeader.id}`,
                  );
                }

                setIsInitialLoad(
                  false,
                );
              }

              hasInitialFetchRef.current =
                true;
            } catch (error: any) {
              console.error(
                "Admin management fetch error:",
                error,
              );

              toast.error(
                error?.response
                  ?.data?.message ||
                  "Unable to load admin management data.",
              );
            } finally {
              setLoading(false);
            }
          })();

        fetchInFlightRef.current =
          requestPromise;

        try {
          await requestPromise;
        } finally {
          fetchInFlightRef.current =
            null;
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
  // ===================================================

  useEffect(() => {
    if (
      !permissionsLoading &&
      canViewAdmins &&
      !hasInitialFetchRef.current
    ) {
      fetchAll();
    }

    if (
      !permissionsLoading &&
      !canViewAdmins
    ) {
      setLoading(false);
    }
  }, [
    permissionsLoading,
    canViewAdmins,
    fetchAll,
  ]);

  // ===================================================
  // FILTER
  // ===================================================

  const filteredAdmins =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return admins.filter(
        (admin) => {
          const matchesSearch =
            !query ||
            [
              admin.name,
              admin.email,
              String(admin.id),
              ...(admin.roles ||
                []
              ).map(
                (role) =>
                  role.name,
              ),
            ]
              .join(" ")
              .toLowerCase()
              .includes(query);

          const hasRole =
            (admin.roles
              ?.length ||
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
        },
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
          ITEMS_PER_PAGE,
      ),
    );

  const startIndex =
    (currentPage - 1) *
    ITEMS_PER_PAGE;

  const paginatedAdmins =
    filteredAdmins.slice(
      startIndex,
      startIndex +
        ITEMS_PER_PAGE,
    );

  const startEntry =
    filteredAdmins.length === 0
      ? 0
      : startIndex + 1;

  const endEntry =
    Math.min(
      startIndex +
        ITEMS_PER_PAGE,
      filteredAdmins.length,
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
        totalPages,
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
            index + 1,
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
      if (!canCreateAdmin) {
        toast.error(
          "You do not have permission to create admins.",
        );
        return;
      }

      if (!canViewRoles) {
        toast.error(
          "You do not have permission to view roles.",
        );
        return;
      }

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
  // SUBMIT
  // ===================================================

  const submitAdmin =
    async () => {
      const canSubmit =
        editingAdmin
          ? canUpdateAdmin
          : canCreateAdmin;

      if (!canSubmit) {
        toast.error(
          editingAdmin
            ? "You do not have permission to update admins."
            : "You do not have permission to create admins.",
        );
        return;
      }

      if (!canViewRoles) {
        toast.error(
          "You do not have permission to view roles.",
        );
        return;
      }

      if (!adminForm.name.trim()) {
        toast.error(
          "Please enter admin name.",
        );
        return;
      }

      if (!adminForm.email.trim()) {
        toast.error(
          "Please enter email.",
        );
        return;
      }

      if (
        !editingAdmin &&
        !adminForm.password
      ) {
        toast.error(
          "Please enter password.",
        );
        return;
      }

      if (!adminForm.role_id) {
        toast.error(
          "Please select a role.",
        );
        return;
      }

      try {
        setActionLoading(true);

        if (!editingAdmin) {
          const payload = {
            name:
              adminForm.name.trim(),
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
              payload,
            );

          toast.success(
            response.data
              ?.message ||
              "Admin created successfully.",
          );
        } else {
          const payload = {
            name:
              adminForm.name.trim(),
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
              payload,
            );

          toast.success(
            response.data
              ?.message ||
              "Admin updated successfully.",
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

        await fetchAll(true);
      } catch (error: any) {
        console.error(
          "Save admin error:",
          error,
        );

        toast.error(
          error?.response
            ?.data?.message ||
            "Unable to save admin.",
        );
      } finally {
        setActionLoading(
          false,
        );
      }
    };

  // ===================================================
  // DELETE
  // ===================================================

  const openDeleteAdmin =
    (
      admin: AdminMember,
    ) => {
      if (!canDeleteAdmin) {
        toast.error(
          "You do not have permission to delete admins.",
        );
        return;
      }

      setDeleteTarget({
        id: admin.id,
        name: admin.name,
      });

      setDeleteModalOpen(
        true,
      );
    };

  const handleDelete =
    async () => {
      if (!deleteTarget) {
        return;
      }

      if (!canDeleteAdmin) {
        toast.error(
          "You do not have permission to delete admins.",
        );
        return;
      }

      try {
        setDeleteLoading(
          true,
        );

        const response =
          await adminManagementApi.deleteAdmin(
            deleteTarget.id,
          );

        toast.success(
          response.data
            ?.message ||
            "Admin deleted successfully.",
        );

        setDeleteModalOpen(
          false,
        );

        setDeleteTarget(
          null,
        );

        await fetchAll(true);
      } catch (error: any) {
        console.error(
          "Delete admin error:",
          error,
        );

        toast.error(
          error?.response
            ?.data?.message ||
            "Unable to delete admin.",
        );
      } finally {
        setDeleteLoading(
          false,
        );
      }
    };

  // ===================================================
  // SEARCH
  // ===================================================

  const handleSearch = (
    value: string,
  ) => {
    setSearch(value);
    setCurrentPage(1);
    setHighlightedAdminId(
      null,
    );
  };

  // ===================================================
  // PERMISSION LOADING
  // ===================================================

  if (permissionsLoading) {
    return (
      <div
        className="flex min-h-[500px] items-center justify-center p-6 font-poppins"
        style={{
          backgroundColor:
            PAGE_BG,
        }}
      >
        <div className="flex flex-col items-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm"
            style={{
              color: PRIMARY,
            }}
          >
            <FiRefreshCw
              size={23}
              className="animate-spin"
            />
          </div>

          <p
            className="mt-4 text-sm font-bold"
            style={{
              color:
                TEXT_PRIMARY,
            }}
          >
            Checking permissions...
          </p>

          <p
            className="mt-1 text-[10px]"
            style={{
              color: MUTED,
            }}
          >
            Verifying admin management access.
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // ACCESS DENIED
  // ===================================================

  if (!canViewAdmins) {
    return <AccessDenied />;
  }

  // ===================================================
  // DATA LOADING
  // ===================================================

  if (
    loading &&
    admins.length === 0
  ) {
    return (
      <div
        className="flex min-h-[500px] items-center justify-center p-6 font-poppins"
        style={{
          backgroundColor:
            PAGE_BG,
        }}
      >
        <div className="flex flex-col items-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm"
            style={{
              color: PRIMARY,
            }}
          >
            <FiRefreshCw
              size={23}
              className="animate-spin"
            />
          </div>

          <p
            className="mt-4 text-sm font-bold"
            style={{
              color:
                TEXT_PRIMARY,
            }}
          >
            Loading admins...
          </p>

          <p
            className="mt-1 text-[10px]"
            style={{
              color: MUTED,
            }}
          >
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
        className="min-h-screen p-4 font-poppins sm:p-5 lg:p-6"
        style={{
          backgroundColor:
            PAGE_BG,
        }}
      >
        {/* HEADER */}
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor:
                    PRIMARY,
                }}
              />

              <span
                className="text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{
                  color: ACCENT,
                }}
              >
                User Management
              </span>
            </div>

            <h1
              className="text-[30px] font-bold tracking-tight sm:text-[34px]"
              style={{
                color:
                  TEXT_PRIMARY,
              }}
            >
              Admin Management
            </h1>

            <p
              className="mt-1.5 text-sm"
              style={{
                color:
                  TEXT_SECONDARY,
              }}
            >
              Manage administrators and assign
              roles from one place.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* REFRESH */}
            <button
              type="button"
              onClick={() =>
                fetchAll(true)
              }
              disabled={loading}
              className="flex h-11 items-center gap-2 rounded-xl border bg-white px-5 text-sm font-bold shadow-sm transition disabled:opacity-50"
              style={{
                borderColor:
                  BORDER,
                color: PRIMARY,
              }}
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

            {/* CREATE */}
            {canCreateAdmin && (
              <button
                type="button"
                onClick={
                  openCreateAdmin
                }
                disabled={
                  !canViewRoles
                }
                className="flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(30,58,138,0.6)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background:
                    `linear-gradient(135deg, ${ACCENT}, ${PRIMARY}, ${DARK_PRIMARY})`,
                }}
              >
                <FiPlus size={17} />
                Add Admin
              </button>
            )}
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
          className="relative overflow-hidden rounded-[22px] border bg-white shadow-[0_8px_30px_rgba(30,58,138,0.06)]"
          style={{
            borderColor:
              "#E0E7F2",
          }}
        >
          <div
            className="absolute left-0 right-0 top-0 h-[3px]"
            style={{
              background:
                `linear-gradient(to right, #6EA0FF, ${PRIMARY}, ${DARK_PRIMARY})`,
            }}
          />

          {/* TOOLBAR */}
          <div
            className="border-b p-5"
            style={{
              borderColor:
                "rgba(30,58,138,0.10)",
            }}
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full xl:max-w-[500px]">
                <FiSearch
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{
                    color: PRIMARY,
                  }}
                />

                <input
                  type="text"
                  value={search}
                  onChange={(
                    event,
                  ) =>
                    handleSearch(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Search name, email, ID or role..."
                  className="h-12 w-full rounded-xl pl-11 pr-4 text-sm outline-none placeholder:text-[#8C97B2]"
                  style={{
                    border:
                      `1px solid ${BORDER}`,
                    backgroundColor:
                      PAGE_BG,
                    color:
                      TEXT_PRIMARY,
                  }}
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
                          item.key,
                        );

                        setCurrentPage(
                          1,
                        );

                        setHighlightedAdminId(
                          null,
                        );
                      }}
                      className="rounded-xl px-5 py-2.5 text-xs font-bold transition"
                      style={{
                        background:
                          statusFilter ===
                          item.key
                            ? `linear-gradient(135deg, ${ACCENT}, ${PRIMARY})`
                            : PAGE_BG,
                        color:
                          statusFilter ===
                          item.key
                            ? WHITE
                            : TEXT_SECONDARY,
                        border:
                          statusFilter ===
                          item.key
                            ? "none"
                            : `1px solid ${BORDER}`,
                        boxShadow:
                          statusFilter ===
                          item.key
                            ? "0 6px 14px -6px rgba(30,58,138,0.5)"
                            : "none",
                      }}
                    >
                      {
                        item.label
                      }
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* TABLE HEADER */}
          <div
            className="flex flex-col justify-between gap-3 border-b px-5 py-4 sm:flex-row sm:items-center"
            style={{
              borderColor:
                "rgba(30,58,138,0.10)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  backgroundColor:
                    LIGHT_BLUE,
                  color: PRIMARY,
                }}
              >
                <FiUsers size={18} />
              </div>

              <div>
                <h2
                  className="text-base font-bold"
                  style={{
                    color:
                      TEXT_PRIMARY,
                  }}
                >
                  Admin Directory
                </h2>

                <p
                  className="mt-1 text-xs"
                  style={{
                    color: MUTED,
                  }}
                >
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
              <span
                className="rounded-lg px-3 py-2 text-[10px] font-bold"
                style={{
                  backgroundColor:
                    PAGE_BG,
                  color: PRIMARY,
                }}
              >
                {admins.length} Total
              </span>

              <span
                className="rounded-lg px-3 py-2 text-[10px] font-bold"
                style={{
                  backgroundColor:
                    LIGHT_BLUE,
                  color: PRIMARY,
                }}
              >
                {roles.length} Roles
              </span>
            </div>
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1050px] border-collapse">
              <thead>
                <tr
                  style={{
                    backgroundColor:
                      PRIMARY,
                  }}
                >
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    S.No.
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    Administrator
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    Email
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    Role
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    Created
                  </th>

                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedAdmins.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className="flex h-14 w-14 items-center justify-center rounded-2xl"
                          style={{
                            backgroundColor:
                              LIGHT_BLUE,
                            color:
                              PRIMARY,
                          }}
                        >
                          <FiUsers
                            size={25}
                          />
                        </div>

                        <p
                          className="mt-4 text-sm font-bold"
                          style={{
                            color:
                              TEXT_PRIMARY,
                          }}
                        >
                          No administrators
                          found
                        </p>

                        <p
                          className="mt-1 text-xs"
                          style={{
                            color:
                              MUTED,
                          }}
                        >
                          Try another search
                          or add a new
                          admin.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedAdmins.map(
                    (
                      admin,
                      index,
                    ) => {
                      const adminRole =
                        admin.roles?.[0] ||
                        null;

                      const isHighlighted =
                        highlightedAdminId ===
                        admin.id;

                      return (
                        <tr
                          key={
                            admin.id
                          }
                          className="border-b transition-all duration-300"
                          style={{
                            borderColor:
                              "#EEF2F8",
                            backgroundColor:
                              isHighlighted
                                ? LIGHT_BLUE
                                : WHITE,
                            borderLeft:
                              isHighlighted
                                ? `4px solid ${PRIMARY}`
                                : undefined,
                          }}
                        >
                          <td className="px-5 py-4">
                            <span
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
                              style={{
                                backgroundColor:
                                  LIGHT_BLUE,
                                color:
                                  PRIMARY,
                              }}
                            >
                              {startIndex +
                                index +
                                1}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                                style={{
                                  background:
                                    `linear-gradient(135deg, ${ACCENT}, ${PRIMARY})`,
                                }}
                              >
                                {getInitials(
                                  admin.name,
                                )}
                              </div>

                              <div className="min-w-0">
                                <p
                                  className="truncate text-sm font-bold"
                                  style={{
                                    color:
                                      TEXT_PRIMARY,
                                  }}
                                >
                                  {
                                    admin.name
                                  }
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <FiMail
                                size={14}
                                style={{
                                  color:
                                    PRIMARY,
                                }}
                              />

                              <span
                                className="text-xs font-semibold"
                                style={{
                                  color:
                                    TEXT_SECONDARY,
                                }}
                              >
                                {
                                  admin.email
                                }
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            {adminRole ? (
                              <div>
                                <span
                                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold"
                                  style={{
                                    borderColor:
                                      "#C9D9F4",
                                    backgroundColor:
                                      LIGHT_BLUE,
                                    color:
                                      PRIMARY,
                                  }}
                                >
                                  <FiShield
                                    size={
                                      11
                                    }
                                  />

                                  {
                                    adminRole.name
                                  }
                                </span>

                                <p
                                  className="mt-1 font-mono text-[9px]"
                                  style={{
                                    color:
                                      MUTED,
                                  }}
                                >
                                  {
                                    adminRole.slug
                                  }
                                </p>
                              </div>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold"
                                style={{
                                  borderColor:
                                    BORDER,
                                  backgroundColor:
                                    "#F3F6FB",
                                  color:
                                    TEXT_SECONDARY,
                                }}
                              >
                                <FiShieldOff
                                  size={
                                    11
                                  }
                                />
                                No Role
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className="text-[10px] font-semibold"
                              style={{
                                color:
                                  TEXT_SECONDARY,
                              }}
                            >
                              {formatDate(
                                admin.created_at,
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              {canUpdateAdmin && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditAdmin(
                                      admin,
                                    )
                                  }
                                  title="Edit Admin"
                                  disabled={
                                    !canViewRoles
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#1E3A8A] hover:text-white"
                                  style={{
                                    borderColor:
                                      BORDER,
                                    backgroundColor:
                                      PAGE_BG,
                                    color:
                                      PRIMARY,
                                  }}
                                >
                                  <FiEdit2
                                    size={
                                      14
                                    }
                                  />
                                </button>
                              )}

                              {canDeleteAdmin && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openDeleteAdmin(
                                      admin,
                                    )
                                  }
                                  title="Delete Admin"
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border transition hover:border-transparent hover:bg-[#C23B32] hover:text-white"
                                  style={{
                                    borderColor:
                                      "rgba(194,59,50,0.20)",
                                    backgroundColor:
                                      DANGER_BG,
                                    color:
                                      DANGER,
                                  }}
                                >
                                  <FiTrash2
                                    size={
                                      14
                                    }
                                  />
                                </button>
                              )}

                              {!canUpdateAdmin &&
                                !canDeleteAdmin && (
                                  <span
                                    className="rounded-lg border px-3 py-2 text-[9px] font-semibold"
                                    style={{
                                      borderColor:
                                        BORDER,
                                      backgroundColor:
                                        "#F7F9FD",
                                      color:
                                        MUTED,
                                    }}
                                  >
                                    View Only
                                  </span>
                                )}
                            </div>
                          </td>
                        </tr>
                      );
                    },
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
                  index,
                ) => {
                  const adminRole =
                    admin.roles?.[0] ||
                    null;

                  const isHighlighted =
                    highlightedAdminId ===
                    admin.id;

                  return (
                    <div
                      key={
                        admin.id
                      }
                      className="border-b p-5 transition-all duration-300"
                      style={{
                        borderColor:
                          "#EEF2F8",
                        backgroundColor:
                          isHighlighted
                            ? LIGHT_BLUE
                            : WHITE,
                        borderLeft:
                          isHighlighted
                            ? `4px solid ${PRIMARY}`
                            : undefined,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                            style={{
                              background:
                                `linear-gradient(135deg, ${ACCENT}, ${PRIMARY})`,
                            }}
                          >
                            {getInitials(
                              admin.name,
                            )}
                          </div>

                          <div className="min-w-0">
                            <p
                              className="truncate text-sm font-bold"
                              style={{
                                color:
                                  TEXT_PRIMARY,
                              }}
                            >
                              {
                                admin.name
                              }
                            </p>

                            <p
                              className="mt-1 truncate text-xs"
                              style={{
                                color:
                                  TEXT_SECONDARY,
                              }}
                            >
                              {
                                admin.email
                              }
                            </p>
                          </div>
                        </div>

                        <span
                          className="text-[10px] font-bold"
                          style={{
                            color:
                              MUTED,
                          }}
                        >
                          #
                          {startIndex +
                            index +
                            1}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div
                          className="rounded-xl border p-3"
                          style={{
                            borderColor:
                              "rgba(30,58,138,0.10)",
                            backgroundColor:
                              PAGE_BG,
                          }}
                        >
                          <p
                            className="text-[9px] font-bold uppercase tracking-wide"
                            style={{
                              color:
                                MUTED,
                            }}
                          >
                            Role
                          </p>

                          <p
                            className="mt-1.5 text-xs font-bold"
                            style={{
                              color:
                                TEXT_PRIMARY,
                            }}
                          >
                            {adminRole
                              ?.name ||
                              "No Role"}
                          </p>
                        </div>

                        <div
                          className="rounded-xl border p-3"
                          style={{
                            borderColor:
                              "rgba(30,58,138,0.10)",
                            backgroundColor:
                              PAGE_BG,
                          }}
                        >
                          <p
                            className="text-[9px] font-bold uppercase tracking-wide"
                            style={{
                              color:
                                MUTED,
                            }}
                          >
                            Created
                          </p>

                          <p
                            className="mt-1.5 text-xs font-bold"
                            style={{
                              color:
                                TEXT_PRIMARY,
                            }}
                          >
                            {formatDate(
                              admin.created_at,
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end gap-2">
                        {canUpdateAdmin && (
                          <button
                            type="button"
                            onClick={() =>
                              openEditAdmin(
                                admin,
                              )
                            }
                            disabled={
                              !canViewRoles
                            }
                            className="flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
                            style={{
                              borderColor:
                                BORDER,
                              backgroundColor:
                                PAGE_BG,
                              color:
                                PRIMARY,
                            }}
                          >
                            <FiEdit2
                              size={
                                13
                              }
                            />
                            Edit
                          </button>
                        )}

                        {canDeleteAdmin && (
                          <button
                            type="button"
                            onClick={() =>
                              openDeleteAdmin(
                                admin,
                              )
                            }
                            className="flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold"
                            style={{
                              borderColor:
                                "rgba(194,59,50,0.20)",
                              backgroundColor:
                                DANGER_BG,
                              color:
                                DANGER,
                            }}
                          >
                            <FiTrash2
                              size={
                                13
                              }
                            />
                            Delete
                          </button>
                        )}

                        {!canUpdateAdmin &&
                          !canDeleteAdmin && (
                            <span
                              className="rounded-lg border px-3 py-2 text-[9px] font-semibold"
                              style={{
                                borderColor:
                                  BORDER,
                                backgroundColor:
                                  "#F7F9FD",
                                color:
                                  MUTED,
                              }}
                            >
                              View Only
                            </span>
                          )}
                      </div>
                    </div>
                  );
                },
              )
            ) : (
              <div className="flex flex-col items-center py-16 text-center">
                <FiUsers
                  size={27}
                  style={{
                    color: PRIMARY,
                  }}
                />

                <p
                  className="mt-4 text-sm font-bold"
                  style={{
                    color:
                      TEXT_PRIMARY,
                  }}
                >
                  No administrators found
                </p>
              </div>
            )}
          </div>

          {/* PAGINATION */}
          {filteredAdmins.length >
            0 && (
            <div
              className="flex flex-col items-center justify-between gap-4 border-t px-5 py-4 sm:flex-row"
              style={{
                borderColor:
                  "rgba(30,58,138,0.10)",
                backgroundColor:
                  "#FAFBFE",
              }}
            >
              <p
                className="text-xs"
                style={{
                  color: MUTED,
                }}
              >
                Showing{" "}
                <span
                  className="font-bold"
                  style={{
                    color:
                      TEXT_SECONDARY,
                  }}
                >
                  {startEntry}
                </span>{" "}
                to{" "}
                <span
                  className="font-bold"
                  style={{
                    color:
                      TEXT_SECONDARY,
                  }}
                >
                  {endEntry}
                </span>{" "}
                of{" "}
                <span
                  className="font-bold"
                  style={{
                    color:
                      TEXT_SECONDARY,
                  }}
                >
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
                          page - 1,
                        ),
                    )
                  }
                  disabled={
                    currentPage ===
                    1
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg border bg-white transition hover:bg-[#EAF1FF] disabled:cursor-not-allowed disabled:opacity-30"
                  style={{
                    borderColor:
                      BORDER,
                    color: PRIMARY,
                  }}
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
                          page,
                        )
                      }
                      className="flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-xs font-bold"
                      style={{
                        background:
                          currentPage ===
                          page
                            ? `linear-gradient(135deg, ${ACCENT}, ${PRIMARY})`
                            : WHITE,
                        color:
                          currentPage ===
                          page
                            ? WHITE
                            : TEXT_SECONDARY,
                        border:
                          currentPage ===
                          page
                            ? "none"
                            : `1px solid ${BORDER}`,
                        boxShadow:
                          currentPage ===
                          page
                            ? "0 6px 14px -6px rgba(30,58,138,0.5)"
                            : "none",
                      }}
                    >
                      {page}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.min(
                          totalPages,
                          page + 1,
                        ),
                    )
                  }
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg border bg-white transition hover:bg-[#EAF1FF] disabled:cursor-not-allowed disabled:opacity-30"
                  style={{
                    borderColor:
                      BORDER,
                    color: PRIMARY,
                  }}
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

      {/* CREATE / EDIT MODAL */}
      <AdminFormModal
        open={modalOpen}
        loading={actionLoading}
        editingAdmin={
          editingAdmin
        }
        roles={roles}
        form={adminForm}
        setForm={
          setAdminForm
        }
        canSubmit={
          editingAdmin
            ? canUpdateAdmin &&
              canViewRoles
            : canCreateAdmin &&
              canViewRoles
        }
        onClose={() => {
          if (!actionLoading) {
            setModalOpen(false);
            setEditingAdmin(
              null,
            );
          }
        }}
        onSubmit={
          submitAdmin
        }
      />

      {/* DELETE MODAL */}
      <DeleteAdminModal
        open={deleteModalOpen}
        loading={
          deleteLoading
        }
        target={
          deleteTarget
        }
        onClose={() => {
          if (!deleteLoading) {
            setDeleteModalOpen(
              false,
            );

            setDeleteTarget(
              null,
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