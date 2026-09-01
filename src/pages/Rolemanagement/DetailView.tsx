import React from 'react';
import { FiShield, FiKey, FiUsers, FiEdit2, FiTrash2, FiMail, FiClock } from 'react-icons/fi';

// ============================================
// TYPES
// ============================================

interface Permission {
  id: number;
  name: string;
  slug: string;
  module: string;
  action: string;
  created_at?: string;
  updated_at?: string;
}

interface Role {
  id: number;
  name: string;
  slug: string;
  description?: string;
  permissions?: Permission[];
  created_at?: string;
  updated_at?: string;
}

interface Admin {
  id: number;
  name: string;
  email: string;
  roles?: Role[];
  created_at?: string;
  updated_at?: string;
}

interface DetailViewProps {
  type: 'role' | 'admin';
  data: Role | Admin;
  permissions?: Permission[];
  onEdit: () => void;
  onDelete: () => void;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatDate = (value?: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getInitials = (name?: string | null): string => {
  if (!name) return 'AD';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

// ============================================
// SUB-COMPONENTS
// ============================================

interface InfoCardProps {
  label: string;
  value: string;
  mono?: boolean;
}

const InfoCard: React.FC<InfoCardProps> = ({ label, value, mono = false }) => (
  <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
    <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">{label}</p>
    <p className={`mt-1.5 break-words text-sm font-bold text-[#2a2620] ${mono ? 'font-mono' : ''}`}>{value}</p>
  </div>
);

interface InfoRowProps {
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 border-b border-[#b8902e]/10 pb-3 last:border-0 last:pb-0">
    <span className="text-xs text-[#a89a7d]">{label}</span>
    <span className="max-w-[65%] text-right text-xs font-bold text-[#4a4436]">{value}</span>
  </div>
);

// ============================================
// ROLE DETAIL VIEW
// ============================================

const RoleDetailView: React.FC<{
  role: Role;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ role, onEdit, onDelete }) => {
  // ✅ FIX: Ensure permissions is always an array
  const permissions = Array.isArray(role.permissions) ? role.permissions : [];

  return (
    <div className="space-y-6">
      {/* Role Header */}
      <div className="rounded-2xl border border-[#b8902e]/10 bg-white p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf4df] text-[#b8902e]">
              <FiShield size={25} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#2a2620]">{role.name}</h2>
              <p className="mt-1 font-mono text-xs text-[#8f6d1d]">{role.slug}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="flex h-10 items-center gap-2 rounded-xl border border-[#b8902e]/20 px-4 text-xs font-bold text-[#8f6d1d] hover:bg-[#faf8f3]"
            >
              <FiEdit2 size={14} /> Edit
            </button>
            <button
              onClick={onDelete}
              className="flex h-10 items-center gap-2 rounded-xl border border-[#c98d83]/20 bg-[#fff8f6] px-4 text-xs font-bold text-[#b46055] hover:bg-[#b46055] hover:text-white"
            >
              <FiTrash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Role Info */}
      <div className="rounded-2xl border border-[#b8902e]/10 bg-white p-5">
        <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a89a7d]">
          Role Information
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InfoCard label="Role Name" value={role.name} />
          <InfoCard label="Slug" value={role.slug} mono />
          <InfoCard label="Created At" value={formatDate(role.created_at)} />
          <InfoCard label="Updated At" value={formatDate(role.updated_at)} />
        </div>
        <div className="mt-4 rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">Description</p>
          <p className="mt-1.5 text-sm leading-6 text-[#4a4436]">
            {role.description || 'No description provided.'}
          </p>
        </div>
      </div>

      {/* Permissions */}
      <div className="rounded-2xl border border-[#b8902e]/10 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiKey size={16} className="text-[#b8902e]" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#a89a7d]">
              Assigned Permissions
            </h3>
          </div>
          <span className="rounded-lg bg-[#faf8f3] px-3 py-1 text-[10px] font-bold text-[#8f6d1d]">
            {permissions.length}
          </span>
        </div>

        {permissions.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {permissions.map((permission) => (
              <div
                key={permission.id}
                className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#2a2620]">{permission.name}</p>
                    <p className="mt-1 font-mono text-[10px] text-[#8f6d1d]">{permission.slug}</p>
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
};

// ============================================
// ADMIN DETAIL VIEW
// ============================================

const AdminDetailView: React.FC<{
  admin: Admin;
  permissions?: Permission[];
  onEdit: () => void;
  onDelete: () => void;
}> = ({ admin, permissions = [], onEdit, onDelete }) => {
  // ✅ FIX: Ensure permissions is always an array
  const safePermissions = Array.isArray(permissions) ? permissions : [];
  const roles = Array.isArray(admin.roles) ? admin.roles : [];

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="rounded-2xl border border-[#b8902e]/10 bg-white p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-xl font-bold text-white">
              {getInitials(admin.name)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-[#2a2620]">{admin.name}</h2>
                <span className="rounded-full border border-[#b8902e]/20 bg-[#faf4df] px-3 py-1 text-[10px] font-bold text-[#806319]">
                  Administrator
                </span>
              </div>
              <p className="mt-1 text-sm text-[#786f60]">{admin.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="flex h-10 items-center gap-2 rounded-xl border border-[#b8902e]/20 bg-white px-4 text-xs font-bold text-[#8f6d1d] hover:bg-[#faf8f3]"
            >
              <FiEdit2 size={14} /> Edit
            </button>
            <button
              onClick={onDelete}
              className="flex h-10 items-center gap-2 rounded-xl border border-[#c98d83]/20 bg-[#fff8f6] px-4 text-xs font-bold text-[#b46055] hover:bg-[#b46055] hover:text-white"
            >
              <FiTrash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Admin Info */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-[#b8902e]/10 bg-white p-5">
          <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a89a7d]">
            Admin Information
          </h3>
          <div className="space-y-3">
            <InfoRow label="Admin ID" value={`#${admin.id}`} />
            <InfoRow label="Name" value={admin.name} />
            <InfoRow label="Email" value={admin.email} />
            <InfoRow label="Created" value={formatDate(admin.created_at)} />
            <InfoRow label="Updated" value={formatDate(admin.updated_at)} />
          </div>
        </div>

        <div className="rounded-2xl border border-[#b8902e]/10 bg-white p-5">
          <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a89a7d]">
            Assigned Role & Permissions
          </h3>
          {roles.length > 0 ? (
            <div className="space-y-4">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3"
                >
                  <div className="flex items-center gap-2">
                    <FiShield size={14} className="text-[#b8902e]" />
                    <p className="text-sm font-bold text-[#2a2620]">{role.name}</p>
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-[#8f6d1d]">{role.slug}</p>

                  {/* Show permissions for this role */}
                  {safePermissions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-[#a89a7d]">
                        Permissions
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {safePermissions.map((perm) => (
                          <span
                            key={perm.id}
                            className="rounded-md bg-white px-2 py-0.5 text-[9px] font-medium text-[#2a2620] border border-[#b8902e]/15"
                          >
                            {perm.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-[#faf8f3] p-5 text-center text-xs text-[#a89a7d]">
              No role assigned.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN DETAIL VIEW COMPONENT
// ============================================

const DetailView: React.FC<DetailViewProps> = ({
  type,
  data,
  permissions = [],
  onEdit,
  onDelete,
}) => {
  // ✅ FIX: Ensure permissions is always an array
  const safePermissions = Array.isArray(permissions) ? permissions : [];

  if (type === 'role') {
    return (
      <RoleDetailView
        role={data as Role}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
  }

  if (type === 'admin') {
    return (
      <AdminDetailView
        admin={data as Admin}
        permissions={safePermissions}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
  }

  return null;
};

export default DetailView;