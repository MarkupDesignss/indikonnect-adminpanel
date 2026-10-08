import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { adminApi } from "../../api/endpoints/Auth";

// =====================================================
// ROLES
// =====================================================

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

// =====================================================
// TYPES
// =====================================================

export interface AdminDetails {
  id: number;
  name: string;
  email: string;
  profile_image?: string | null;
  warehouse_name?: string | null;
  warehouse_code?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AdminRole {
  id?: number;
  name?: string;
  slug?: string;
  description?: string;
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

// =====================================================
// HELPERS
// =====================================================

const normalize = (value: unknown): string => {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
};

const getRoleSlug = (role: AdminRole): string => {
  return normalize(role?.slug || role?.name || "");
};

// =====================================================
// HOOK
// =====================================================

export const usePermissions = (): UsePermissionsReturn => {
  const [data, setData] =
    useState<PermissionsData | null>(null);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [error, setError] =
    useState<string | null>(null);

  // ===================================================
  // FETCH CURRENT ADMIN PERMISSIONS
  // ===================================================

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminApi.me();

      if (response?.data?.success) {
        const responseData =
          response?.data?.data ?? {};

        const permissionsGrouped =
          responseData?.permissions_grouped;

        const roles =
          responseData?.roles;

        const warehouseAssignments =
          responseData?.warehouse_assignments;

        setData({
          admin:
            responseData?.admin ?? null,

          permissions_grouped:
            permissionsGrouped &&
            typeof permissionsGrouped ===
              "object"
              ? permissionsGrouped
              : {},

          roles:
            Array.isArray(roles)
              ? roles
              : [],

          warehouse_assignments:
            Array.isArray(
              warehouseAssignments,
            )
              ? warehouseAssignments
              : [],

          has_warehouse_access:
            Boolean(
              responseData?.has_warehouse_access,
            ),
        });
      } else {
        setData(null);

        setError(
          response?.data?.message ||
            "Failed to fetch admin permissions",
        );
      }
    } catch (err: any) {
      console.error(
        "Failed to fetch admin permissions:",
        err,
      );

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

  // ===================================================
  // FETCH ON MOUNT
  // ===================================================

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ===================================================
  // ROLES
  // ===================================================

  const roles = useMemo<AdminRole[]>(
    () => {
      return Array.isArray(data?.roles)
        ? data.roles
        : [];
    },
    [data],
  );

  // ===================================================
  // ROLE SLUGS
  // ===================================================

  const roleSlugs = useMemo<string[]>(
    () => {
      return [
        ...new Set(
          roles
            .map(getRoleSlug)
            .filter(Boolean),
        ),
      ];
    },
    [roles],
  );

  // ===================================================
  // PRIMARY ROLE
  // ===================================================

  const primaryRole = useMemo<
    string | null
  >(() => {
    if (!roles.length) {
      return null;
    }

    const primary =
      roles.find(
        (role) =>
          role?.is_primary === true,
      ) || roles[0];

    return getRoleSlug(primary) || null;
  }, [roles]);

  // ===================================================
  // NORMALIZE GROUPED PERMISSIONS
  //
  // API:
  //
  // warehouse_inventory:
  // [
  //   "view",
  //   "update"
  // ]
  //
  // becomes:
  //
  // warehouse_inventory:
  // [
  //   "view",
  //   "update"
  // ]
  // ===================================================

  const permissionsGrouped = useMemo<
    Record<string, string[]>
  >(() => {
    if (
      !data?.permissions_grouped ||
      typeof data.permissions_grouped !==
        "object"
    ) {
      return {};
    }

    const normalized: Record<
      string,
      string[]
    > = {};

    Object.entries(
      data.permissions_grouped,
    ).forEach(
      ([module, actions]) => {
        const normalizedModule =
          normalize(module);

        if (!normalizedModule) {
          return;
        }

        if (!Array.isArray(actions)) {
          return;
        }

        normalized[
          normalizedModule
        ] = [
          ...new Set(
            actions
              .map((action) =>
                normalize(action),
              )
              .filter(Boolean),
          ),
        ];
      },
    );

    return normalized;
  }, [data]);

  // ===================================================
  // ALL PERMISSION SLUGS
  //
  // Example:
  //
  // warehouse_inventory:
  // ["view", "update"]
  //
  // becomes:
  //
  // [
  //   "warehouse_inventory.view",
  //   "warehouse_inventory.update"
  // ]
  // ===================================================

  const allSlugs = useMemo<string[]>(
    () => {
      const slugs: string[] = [];

      Object.entries(
        permissionsGrouped,
      ).forEach(
        ([module, actions]) => {
          if (!Array.isArray(actions)) {
            return;
          }

          actions.forEach(
            (action) => {
              const normalizedModule =
                normalize(module);

              const normalizedAction =
                normalize(action);

              if (
                !normalizedModule ||
                !normalizedAction
              ) {
                return;
              }

              slugs.push(
                `${normalizedModule}.${normalizedAction}`,
              );
            },
          );
        },
      );

      return [
        ...new Set(slugs),
      ];
    },
    [permissionsGrouped],
  );

  // ===================================================
  // SUPER ADMIN
  // ===================================================

  const isSuperAdmin = useMemo<boolean>(
    () => {
      return roleSlugs.includes(
        normalize(
          ROLES.SUPER_ADMIN,
        ),
      );
    },
    [roleSlugs],
  );

  // ===================================================
  // HAS PERMISSION
  // ===================================================

  const hasPermission =
    useCallback(
      (slug: string): boolean => {
        if (isSuperAdmin) {
          return true;
        }

        const normalizedSlug =
          normalize(slug);

        if (!normalizedSlug) {
          return false;
        }

        // Exact permission
        if (
          allSlugs.includes(
            normalizedSlug,
          )
        ) {
          return true;
        }

        // Global wildcard
        if (
          allSlugs.includes("*")
        ) {
          return true;
        }

        // Module wildcard
        const [
          module,
        ] =
          normalizedSlug.split(
            ".",
          );

        if (
          module &&
          allSlugs.includes(
            `${module}.*`,
          )
        ) {
          return true;
        }

        return false;
      },
      [
        allSlugs,
        isSuperAdmin,
      ],
    );

  // ===================================================
  // ANY PERMISSION
  // ===================================================

  const hasAnyPermission =
    useCallback(
      (
        slugs: string[],
      ): boolean => {
        if (isSuperAdmin) {
          return true;
        }

        if (
          !Array.isArray(slugs) ||
          slugs.length === 0
        ) {
          return false;
        }

        return slugs.some(
          (slug) =>
            hasPermission(slug),
        );
      },
      [
        hasPermission,
        isSuperAdmin,
      ],
    );

  // ===================================================
  // ALL PERMISSIONS
  // ===================================================

  const hasAllPermissions =
    useCallback(
      (
        slugs: string[],
      ): boolean => {
        if (isSuperAdmin) {
          return true;
        }

        if (
          !Array.isArray(slugs) ||
          slugs.length === 0
        ) {
          return false;
        }

        return slugs.every(
          (slug) =>
            hasPermission(slug),
        );
      },
      [
        hasPermission,
        isSuperAdmin,
      ],
    );

  // ===================================================
  // MODULE + ACTION
  // ===================================================

  const can = useCallback(
    (
      module: string,
      action: string,
    ): boolean => {
      const normalizedModule =
        normalize(module);

      const normalizedAction =
        normalize(action);

      if (
        !normalizedModule ||
        !normalizedAction
      ) {
        return false;
      }

      return hasPermission(
        `${normalizedModule}.${normalizedAction}`,
      );
    },
    [hasPermission],
  );

  // ===================================================
  // MODULE ACCESS
  // ===================================================

  const hasModuleAccess =
    useCallback(
      (
        module: string,
      ): boolean => {
        if (isSuperAdmin) {
          return true;
        }

        const normalizedModule =
          normalize(module);

        if (!normalizedModule) {
          return false;
        }

        const actions =
          permissionsGrouped[
            normalizedModule
          ];

        // Module exists with permissions
        if (
          Array.isArray(actions) &&
          actions.length > 0
        ) {
          return true;
        }

        // Module wildcard
        if (
          allSlugs.includes(
            `${normalizedModule}.*`,
          )
        ) {
          return true;
        }

        // Any permission from module
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

  // ===================================================
  // HAS ROLE
  // ===================================================

  const hasRole = useCallback(
    (role: string): boolean => {
      const normalizedRole =
        normalize(role);

      if (!normalizedRole) {
        return false;
      }

      return roleSlugs.includes(
        normalizedRole,
      );
    },
    [roleSlugs],
  );

  // ===================================================
  // HAS ANY ROLE
  // ===================================================

  const hasAnyRole = useCallback(
    (
      rolesToCheck: string[],
    ): boolean => {
      if (
        !Array.isArray(
          rolesToCheck,
        ) ||
        rolesToCheck.length === 0
      ) {
        return false;
      }

      return rolesToCheck.some(
        (role) =>
          hasRole(role),
      );
    },
    [hasRole],
  );

  // ===================================================
  // WAREHOUSE ASSIGNMENTS
  // ===================================================

  const warehouseAssignments =
    useMemo<
      WarehouseAssignment[]
    >(() => {
      return Array.isArray(
        data?.warehouse_assignments,
      )
        ? data.warehouse_assignments
        : [];
    }, [data]);

  // ===================================================
  // WAREHOUSE ACCESS
  // ===================================================

  const hasWarehouseAccess =
    useMemo<boolean>(() => {
      if (isSuperAdmin) {
        return true;
      }

      return Boolean(
        data?.has_warehouse_access ||
          warehouseAssignments.length >
            0,
      );
    }, [
      data,
      isSuperAdmin,
      warehouseAssignments,
    ]);

  // ===================================================
  // RETURN
  // ===================================================

  return {
    data,

    loading,
    error,

    admin:
      data?.admin ?? null,

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