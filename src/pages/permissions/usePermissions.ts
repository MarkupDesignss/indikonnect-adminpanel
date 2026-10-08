import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi } from "../../api/endpoints/Auth";

export const ROLES = {
  SUPER_ADMIN: "super-admin",
  ADMIN: "admin",
  FINANCE: "finance",
  FINANCE_MANAGER: "finance-manager",
  SALES: "sales",
  SALES_MANAGER: "sales-manager",
  SALES_EXECUTIVE: "sales-executive",
  WAREHOUSE: "warehouse",
  WAREHOUSE_MANAGER: "warehouse-manager",
  WAREHOUSE_EXECUTIVE: "warehouse-executive",
} as const;

export interface AdminDetails {
  id: number;
  name: string;
  email: string;
  profile_image?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AdminRole {
  id?: number;
  name?: string;
  slug?: string;
  is_primary?: boolean;
  pivot?: {
    admin_id?: number;
    role_id?: number;
  };
}

export interface WarehouseAssignment {
  id?: number;
  warehouse_id?: number;
  warehouse?: {
    id?: number;
    name?: string;
    code?: string;
  };
  is_primary?: boolean;
}

export interface PermissionsData {
  admin: AdminDetails | null;
  permissions_grouped: Record<string, string[]>;
  roles: AdminRole[];
  warehouse_assignments: WarehouseAssignment[];
  has_warehouse_access: boolean;
}

interface UsePermissionsReturn {
  data: PermissionsData | null;
  loading: boolean;
  error: string | null;

  admin: AdminDetails | null;
  roles: AdminRole[];
  roleSlugs: string[];
  primaryRole: string | null;

  permissionsGrouped: Record<string, string[]>;
  allSlugs: string[];

  hasPermission: (slug: string) => boolean;
  hasAnyPermission: (slugs: string[]) => boolean;
  hasAllPermissions: (slugs: string[]) => boolean;

  can: (module: string, action: string) => boolean;
  hasModuleAccess: (module: string) => boolean;

  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;

  isSuperAdmin: boolean;

  hasWarehouseAccess: boolean;
  warehouseAssignments: WarehouseAssignment[];

  refetch: () => Promise<void>;
}

/**
 * Normalize permission/role/module strings.
 */
const normalize = (value: unknown): string => {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
};

/**
 * Convert different role object formats into a slug.
 */
const getRoleSlug = (role: AdminRole): string => {
  return normalize(role?.slug || role?.name || "");
};

export const usePermissions = (): UsePermissionsReturn => {
  const [data, setData] = useState<PermissionsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch current admin details + permissions.
   */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminApi.me();

      if (response?.data?.success) {
        const responseData = response.data.data;

        setData({
          admin: responseData?.admin ?? null,
          permissions_grouped:
            responseData?.permissions_grouped &&
            typeof responseData.permissions_grouped === "object"
              ? responseData.permissions_grouped
              : {},
          roles: Array.isArray(responseData?.roles)
            ? responseData.roles
            : [],
          warehouse_assignments: Array.isArray(
            responseData?.warehouse_assignments,
          )
            ? responseData.warehouse_assignments
            : [],
          has_warehouse_access:
            Boolean(responseData?.has_warehouse_access),
        });
      } else {
        setData(null);

        setError(
          response?.data?.message ||
            "Failed to fetch admin permissions",
        );
      }
    } catch (err: any) {
      console.error("Failed to fetch admin permissions:", err);

      setData(null);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch admin permissions",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch permissions on mount.
   */
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /**
   * Admin roles.
   */
  const roles = useMemo<AdminRole[]>(() => {
    return Array.isArray(data?.roles) ? data.roles : [];
  }, [data]);

  /**
   * Role slugs.
   */
  const roleSlugs = useMemo<string[]>(() => {
    return roles
      .map(getRoleSlug)
      .filter(Boolean);
  }, [roles]);

  /**
   * Primary role.
   */
  const primaryRole = useMemo<string | null>(() => {
    if (!roles.length) {
      return null;
    }

    const primary =
      roles.find((role) => role?.is_primary === true) ||
      roles.find(
        (role) =>
          normalize(role?.pivot?.admin_id) !== "" &&
          role?.is_primary === true,
      ) ||
      roles[0];

    return getRoleSlug(primary) || null;
  }, [roles]);

  /**
   * Permissions grouped by module.
   *
   * Example backend:
   *
   * {
   *   "admin": [
   *     "create",
   *     "edit",
   *     "view",
   *     "details",
   *     "delete"
   *   ]
   * }
   */
  const permissionsGrouped = useMemo<
    Record<string, string[]>
  >(() => {
    if (
      !data?.permissions_grouped ||
      typeof data.permissions_grouped !== "object"
    ) {
      return {};
    }

    const normalized: Record<string, string[]> = {};

    Object.entries(data.permissions_grouped).forEach(
      ([module, actions]) => {
        const normalizedModule = normalize(module);

        if (!normalizedModule) {
          return;
        }

        if (!Array.isArray(actions)) {
          return;
        }

        normalized[normalizedModule] = actions
          .map((action) => normalize(action))
          .filter(Boolean);
      },
    );

    return normalized;
  }, [data]);

  /**
   * Convert grouped permissions into permission slugs.
   *
   * Example:
   *
   * admin: ["create", "edit", "view", "delete"]
   *
   * becomes:
   *
   * [
   *   "admin.create",
   *   "admin.edit",
   *   "admin.view",
   *   "admin.delete"
   * ]
   */
  const allSlugs = useMemo<string[]>(() => {
    const slugs: string[] = [];

    Object.entries(permissionsGrouped).forEach(
      ([module, actions]) => {
        if (!Array.isArray(actions)) {
          return;
        }

        actions.forEach((action) => {
          const normalizedModule = normalize(module);
          const normalizedAction = normalize(action);

          if (!normalizedModule || !normalizedAction) {
            return;
          }

          slugs.push(
            `${normalizedModule}.${normalizedAction}`,
          );
        });
      },
    );

    return [...new Set(slugs)];
  }, [permissionsGrouped]);

  /**
   * Check if current admin is super admin.
   */
  const isSuperAdmin = useMemo<boolean>(() => {
    return roleSlugs.some(
      (role) =>
        normalize(role) === normalize(ROLES.SUPER_ADMIN),
    );
  }, [roleSlugs]);

  /**
   * Check one permission.
   *
   * Examples:
   *
   * hasPermission("admin.view")
   * hasPermission("admin.create")
   * hasPermission("admin.edit")
   * hasPermission("admin.delete")
   */
  const hasPermission = useCallback(
    (slug: string): boolean => {
      /**
       * Super admin has complete access.
       */
      if (isSuperAdmin) {
        return true;
      }

      const normalizedSlug = normalize(slug);

      if (!normalizedSlug) {
        return false;
      }

      /**
       * Direct permission match.
       */
      if (allSlugs.includes(normalizedSlug)) {
        return true;
      }

      /**
       * Wildcard permission.
       */
      if (allSlugs.includes("*")) {
        return true;
      }

      /**
       * Module wildcard.
       *
       * Example:
       * admin.*
       */
      const [module] = normalizedSlug.split(".");

      if (
        module &&
        allSlugs.includes(`${module}.*`)
      ) {
        return true;
      }

      return false;
    },
    [allSlugs, isSuperAdmin],
  );

  /**
   * Check any permission.
   */
  const hasAnyPermission = useCallback(
    (slugs: string[]): boolean => {
      if (isSuperAdmin) {
        return true;
      }

      if (!Array.isArray(slugs) || slugs.length === 0) {
        return false;
      }

      return slugs.some((slug) =>
        hasPermission(slug),
      );
    },
    [hasPermission, isSuperAdmin],
  );

  /**
   * Check all permissions.
   */
  const hasAllPermissions = useCallback(
    (slugs: string[]): boolean => {
      if (isSuperAdmin) {
        return true;
      }

      if (!Array.isArray(slugs) || slugs.length === 0) {
        return false;
      }

      return slugs.every((slug) =>
        hasPermission(slug),
      );
    },
    [hasPermission, isSuperAdmin],
  );

  /**
   * Check module + action.
   *
   * Example:
   *
   * can("admin", "view")
   * can("admin", "create")
   * can("admin", "edit")
   * can("admin", "delete")
   */
  const can = useCallback(
    (module: string, action: string): boolean => {
      const normalizedModule = normalize(module);
      const normalizedAction = normalize(action);

      if (!normalizedModule || !normalizedAction) {
        return false;
      }

      return hasPermission(
        `${normalizedModule}.${normalizedAction}`,
      );
    },
    [hasPermission],
  );

  /**
   * Check module access.
   *
   * Example:
   *
   * hasModuleAccess("admin")
   * hasModuleAccess("Admin Management")
   */
  const hasModuleAccess = useCallback(
    (module: string): boolean => {
      if (isSuperAdmin) {
        return true;
      }

      const normalizedModule = normalize(module);

      if (!normalizedModule) {
        return false;
      }

      /**
       * Exact module match.
       */
      const actions =
        permissionsGrouped[normalizedModule];

      if (
        Array.isArray(actions) &&
        actions.length > 0
      ) {
        return true;
      }

      /**
       * Module wildcard.
       */
      if (
        allSlugs.includes(
          `${normalizedModule}.*`,
        )
      ) {
        return true;
      }

      /**
       * Check if any permission starts with module.
       */
      return allSlugs.some(
        (slug) =>
          slug.startsWith(
            `${normalizedModule}.`,
          ),
      );
    },
    [
      allSlugs,
      isSuperAdmin,
      permissionsGrouped,
    ],
  );

  /**
   * Check one role.
   */
  const hasRole = useCallback(
    (role: string): boolean => {
      const normalizedRole = normalize(role);

      if (!normalizedRole) {
        return false;
      }

      return roleSlugs.includes(normalizedRole);
    },
    [roleSlugs],
  );

  /**
   * Check any role.
   */
  const hasAnyRole = useCallback(
    (rolesToCheck: string[]): boolean => {
      if (
        !Array.isArray(rolesToCheck) ||
        rolesToCheck.length === 0
      ) {
        return false;
      }

      return rolesToCheck.some((role) =>
        hasRole(role),
      );
    },
    [hasRole],
  );

  /**
   * Warehouse assignments.
   */
  const warehouseAssignments = useMemo<
    WarehouseAssignment[]
  >(() => {
    return Array.isArray(
      data?.warehouse_assignments,
    )
      ? data.warehouse_assignments
      : [];
  }, [data]);

  /**
   * Warehouse access.
   */
  const hasWarehouseAccess = useMemo<boolean>(() => {
    if (isSuperAdmin) {
      return true;
    }

    return Boolean(
      data?.has_warehouse_access ||
        warehouseAssignments.length > 0,
    );
  }, [
    data,
    isSuperAdmin,
    warehouseAssignments,
  ]);

  return {
    data,
    loading,
    error,

    admin: data?.admin ?? null,

    roles,
    roleSlugs,
    primaryRole,

    permissionsGrouped,
    allSlugs,

    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    can,
    hasModuleAccess,

    hasRole,
    hasAnyRole,

    isSuperAdmin,

    hasWarehouseAccess,
    warehouseAssignments,

    refetch: fetchAll,
  };
};

export default usePermissions;