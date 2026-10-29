// src/hooks/usePermissions.ts  (or wherever it lives)
import {
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
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
  SUPPORT: "support",
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

interface PermissionsSnapshot {
  data: PermissionsData | null;
  loading: boolean;
  error: string | null;
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

const normalize = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const getRoleSlug = (role: AdminRole): string =>
  normalize(role?.slug || role?.name || "");

// =====================================================
// SHARED /ME STORE
// =====================================================

const initialSnapshot: PermissionsSnapshot = {
  data: null,
  loading: true,
  error: null,
};

let snapshot: PermissionsSnapshot = initialSnapshot;
let requestPromise: Promise<void> | null = null;
let hasCompletedInitialRequest = false;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = (): PermissionsSnapshot => snapshot;
const getServerSnapshot = (): PermissionsSnapshot => initialSnapshot;

const publish = (next: Partial<PermissionsSnapshot>) => {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((listener) => listener());
};

const fetchPermissions = (force = false): Promise<void> => {
  if (requestPromise) {
    return requestPromise;
  }

  if (hasCompletedInitialRequest && !force) {
    return Promise.resolve();
  }

  publish({ loading: true, error: null });

  const currentRequest = (async () => {
    try {
      const response = await adminApi.me();

      if (response?.data?.success) {
        const responseData = response?.data?.data ?? {};
        const grouped = responseData?.permissions_grouped;

        const nextData: PermissionsData = {
          admin: responseData?.admin ?? null,
          permissions_grouped:
            grouped && typeof grouped === "object" && !Array.isArray(grouped)
              ? grouped
              : {},
          roles: Array.isArray(responseData?.roles)
            ? responseData.roles
            : [],
          warehouse_assignments: Array.isArray(
            responseData?.warehouse_assignments,
          )
            ? responseData.warehouse_assignments
            : [],
          has_warehouse_access: Boolean(
            responseData?.has_warehouse_access,
          ),
        };

        publish({ data: nextData, error: null });
      } else {
        publish({
          data: null,
          error:
            response?.data?.message ||
            "Failed to fetch admin permissions",
        });
      }
    } catch (err: any) {
      console.error("Failed to fetch admin permissions:", err);
      publish({
        data: null,
        error:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch admin permissions",
      });
    } finally {
      hasCompletedInitialRequest = true;
      requestPromise = null;
      publish({ loading: false });
    }
  })();

  requestPromise = currentRequest;
  return currentRequest;
};

// =====================================================
// HOOK
// =====================================================

export const usePermissions = (): UsePermissionsReturn => {
  const state = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    void fetchPermissions();
  }, []);

  const { data, loading, error } = state;

  const roles = useMemo<AdminRole[]>(
    () => (Array.isArray(data?.roles) ? data.roles : []),
    [data],
  );

  const roleSlugs = useMemo<string[]>(() => {
    return [...new Set(roles.map(getRoleSlug).filter(Boolean))];
  }, [roles]);

  const primaryRole = useMemo<string | null>(() => {
    if (!roles.length) return null;
    const primary = roles.find((role) => role?.is_primary === true) || roles[0];
    return getRoleSlug(primary) || null;
  }, [roles]);

  const permissionsGrouped = useMemo<Record<string, string[]>>(() => {
    const source = data?.permissions_grouped;
    if (!source || typeof source !== "object") return {};

    const normalized: Record<string, string[]> = {};
    Object.entries(source).forEach(([module, actions]) => {
      const normalizedModule = normalize(module);
      if (!normalizedModule || !Array.isArray(actions)) return;

      normalized[normalizedModule] = [
        ...new Set(actions.map(normalize).filter(Boolean)),
      ];
    });
    return normalized;
  }, [data]);

  const allSlugs = useMemo<string[]>(() => {
    const slugs: string[] = [];
    Object.entries(permissionsGrouped).forEach(([module, actions]) => {
      if (!Array.isArray(actions)) return;
      actions.forEach((action) => {
        const normalizedModule = normalize(module);
        const normalizedAction = normalize(action);
        if (normalizedModule && normalizedAction) {
          slugs.push(`${normalizedModule}.${normalizedAction}`);
        }
      });
    });
    return [...new Set(slugs)];
  }, [permissionsGrouped]);

  const isSuperAdmin = useMemo<boolean>(
    () => roleSlugs.includes(normalize(ROLES.SUPER_ADMIN)),
    [roleSlugs],
  );

  const hasPermission = useCallback(
    (slug: string): boolean => {
      if (isSuperAdmin) return true;

      const normalizedSlug = normalize(slug);
      if (!normalizedSlug) return false;
      if (allSlugs.includes(normalizedSlug)) return true;
      if (allSlugs.includes("*")) return true;

      const [module] = normalizedSlug.split(".");
      return Boolean(module && allSlugs.includes(`${module}.*`));
    },
    [allSlugs, isSuperAdmin],
  );

  const hasAnyPermission = useCallback(
    (slugs: string[]): boolean => {
      if (isSuperAdmin) return true;
      if (!Array.isArray(slugs) || slugs.length === 0) return false;
      return slugs.some((slug) => hasPermission(slug));
    },
    [hasPermission, isSuperAdmin],
  );

  const hasAllPermissions = useCallback(
    (slugs: string[]): boolean => {
      if (isSuperAdmin) return true;
      if (!Array.isArray(slugs) || slugs.length === 0) return false;
      return slugs.every((slug) => hasPermission(slug));
    },
    [hasPermission, isSuperAdmin],
  );

  const can = useCallback(
    (module: string, action: string): boolean => {
      const normalizedModule = normalize(module);
      const normalizedAction = normalize(action);
      if (!normalizedModule || !normalizedAction) return false;
      return hasPermission(`${normalizedModule}.${normalizedAction}`);
    },
    [hasPermission],
  );

  const hasModuleAccess = useCallback(
    (module: string): boolean => {
      if (isSuperAdmin) return true;

      const normalizedModule = normalize(module);
      if (!normalizedModule) return false;

      const actions = permissionsGrouped[normalizedModule];
      if (Array.isArray(actions) && actions.length > 0) return true;
      if (allSlugs.includes(`${normalizedModule}.*`)) return true;

      return allSlugs.some((slug) =>
        slug.startsWith(`${normalizedModule}.`),
      );
    },
    [allSlugs, isSuperAdmin, permissionsGrouped],
  );

  const hasRole = useCallback(
    (role: string): boolean => {
      const normalizedRole = normalize(role);
      return Boolean(normalizedRole && roleSlugs.includes(normalizedRole));
    },
    [roleSlugs],
  );

  const hasAnyRole = useCallback(
    (rolesToCheck: string[]): boolean => {
      if (!Array.isArray(rolesToCheck) || rolesToCheck.length === 0) {
        return false;
      }
      return rolesToCheck.some((role) => hasRole(role));
    },
    [hasRole],
  );

  const warehouseAssignments = useMemo<WarehouseAssignment[]>(
    () =>
      Array.isArray(data?.warehouse_assignments)
        ? data.warehouse_assignments
        : [],
    [data],
  );

  const hasWarehouseAccess = useMemo<boolean>(() => {
    if (isSuperAdmin) return true;
    return Boolean(
      data?.has_warehouse_access || warehouseAssignments.length > 0,
    );
  }, [data, isSuperAdmin, warehouseAssignments]);

  const refetch = useCallback(() => fetchPermissions(true), []);

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
    refetch,
  };
};

export default usePermissions;