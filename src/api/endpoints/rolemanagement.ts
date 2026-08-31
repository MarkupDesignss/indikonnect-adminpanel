import apiClient from "../client";

// =====================================================
// TYPES
// =====================================================

export interface AdminMember {
id: number;
name: string;
email: string;
created_at: string | null;
updated_at: string | null;
roles: Role[];
}

export interface Permission {
id: number;
name: string;
slug: string;
module: string;
action: string;
created_at: string | null;
updated_at: string | null;
}

export interface Role {
id: number;
name: string;
slug: string;
description?: string | null;
permissions?: Permission[];
created_at?: string | null;
updated_at?: string | null;
}

export interface CreateAdminPayload {
name: string;
email: string;
password: string;
roles: number[];
}

export interface UpdateAdminPayload {
name: string;
password?: string;
roles: number[];
}

export interface PermissionPayload {
name: string;
slug: string;
module: string;
action: string;
}

export interface RolePayload {
name: string;
slug: string;
description: string;
permissions: number[];
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

interface SuccessResponse<T = unknown> {
success?: boolean;
message?: string;
data?: T;
}

// =====================================================
// ADMIN API
// =====================================================

export const adminManagementApi = {
// GET /api/admin/get
getAdmins: () =>
apiClient.get<AdminMember[]>("/admin/get"),

// POST /api/admin/create
createAdmin: (payload: CreateAdminPayload) =>
apiClient.post<SuccessResponse<AdminMember>>(
"/admin/create",
payload
),

// PUT /api/admin/update/:id
updateAdmin: (
id: number,
payload: UpdateAdminPayload
) =>
apiClient.put<SuccessResponse<AdminMember>>(
`/admin/update/${id}`,
payload
),

// DELETE /api/admin/delete/:id
deleteAdmin: (id: number) =>
apiClient.delete<SuccessResponse>(
`/admin/delete/${id}`
),

// GET /api/admin/permissions
getPermissions: () =>
apiClient.get<Permission[]>(
"/admin/permissions"
),

// POST /api/admin/permissions
createPermission: (
payload: PermissionPayload
) =>
apiClient.post<SuccessResponse<Permission>>(
"/admin/permissions",
payload
),

// PUT /api/admin/permissions/:id
updatePermission: (
id: number,
payload: PermissionPayload
) =>
apiClient.put<SuccessResponse<Permission>>(
`/admin/permissions/${id}`,
payload
),

// DELETE /api/admin/permissions/:id
deletePermission: (id: number) =>
apiClient.delete<SuccessResponse>(
`/admin/permissions/${id}`
),

// GET /api/admin/roles
getRoles: () =>
apiClient.get<Role[]>(
"/admin/roles"
),

// POST /api/admin/roles
createRole: (
payload: RolePayload
) =>
apiClient.post<SuccessResponse<Role>>(
"/admin/roles",
payload
),

// PUT /api/admin/roles/:id
updateRole: (
id: number,
payload: RolePayload
) =>
apiClient.put<SuccessResponse<Role>>(
`/admin/roles/${id}`,
payload
),

// DELETE /api/admin/roles/:id
deleteRole: (id: number) =>
apiClient.delete<SuccessResponse>(
`/admin/roles/${id}`
),
};

export default adminManagementApi;
