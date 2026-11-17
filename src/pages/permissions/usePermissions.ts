
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

export type PermissionsGrouped = Record<string, string[]>;

export interface PermissionsData {
  admin: AdminDetails | null;
  permissions_grouped: PermissionsGrouped;
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

  permissionsGrouped: PermissionsGrouped;
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
// NORMALIZATION HELPERS
// =====================================================

/**
 * Normalizes permission values.
 *
 * Examples:
 *
 * sales_product_report  -> sales product report
 * sales-product-report  -> sales product report
 * send_link             -> send link
 * send-link             -> send link
 * SALES.VIEW            -> sales.view
 * download\r\n          -> download
 *
 * Dots are intentionally preserved.
 */
const normalize = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ")
    .replace(/\s*\.\s*/g, ".")
    .trim();

/**
 * Module names use the same normalization.
 */
const normalizeModule = (value: unknown): string =>
  normalize(value);

/**
 * Permission actions use the same normalization.
 */
const normalizeAction = (value: unknown): string =>
  normalize(value);

/**
 * Normalizes role names.
 */
const getRoleSlug = (role: AdminRole): string =>
  normalize(role?.slug || role?.name || "");

/**
 * Splits a permission into module and action.
 *
 * Example:
 *
 * sales.view
 * =>
 * {
 *   module: "sales",
 *   action: "view"
 * }
 */
const splitSlug = (
  slug: string
): { module: string; action: string } => {
  const separatorIndex = slug.indexOf(".");

  if (separatorIndex === -1) {
    return {
      module: slug,
      action: "",
    };
  }

  return {
    module: slug.slice(0, separatorIndex),
    action: slug.slice(separatorIndex + 1),
  };
};

// =====================================================
// PERMISSION NORMALIZATION
// =====================================================

/**
 * Converts the backend permissions_grouped response
 * into a normalized permission object.
 *
 * Example API:
 *
 * {
 *   "sales_product_report": [
 *     "sales.view",
 *     "sales.download",
 *     "download"
 *   ],
 *
 *   "sales_category_report": [
 *     "download"
 *   ]
 * }
 *
 * Normalized:
 *
 * {
 *   "sales product report": [
 *     "sales.view",
 *     "sales.download",
 *     "download"
 *   ],
 *
 *   "sales category report": [
 *     "download"
 *   ]
 * }
 */
const normalizePermissionsGrouped = (
  source: unknown
): PermissionsGrouped => {
  if (
    !source ||
    typeof source !== "object" ||
    Array.isArray(source)
  ) {
    return {};
  }

  const normalized: PermissionsGrouped = {};

  Object.entries(source as Record<string, unknown>).forEach(
    ([module, actions]) => {
      const normalizedModule = normalizeModule(module);

      if (
        !normalizedModule ||
        !Array.isArray(actions)
      ) {
        return;
      }

      const normalizedActions = actions
        .map(normalizeAction)
        .filter(Boolean);

      normalized[normalizedModule] = [
        ...new Set([
          ...(normalized[normalizedModule] ?? []),
          ...normalizedActions,
        ]),
      ];
    }
  );

  return normalized;
};

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

// =====================================================
// EXTERNAL STORE SUBSCRIPTION
// =====================================================

const subscribe = (
  listener: () => void
): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = (): PermissionsSnapshot => snapshot;

const getServerSnapshot = (): PermissionsSnapshot =>
  initialSnapshot;

// =====================================================
// PUBLISH STORE
// =====================================================

const publish = (
  next: Partial<PermissionsSnapshot>
): void => {
  snapshot = {
    ...snapshot,
    ...next,
  };

  listeners.forEach((listener) => listener());
};

// =====================================================
// FETCH ADMIN PERMISSIONS
// =====================================================

const fetchPermissions = (
  force = false
): Promise<void> => {
  // Prevent duplicate simultaneous API requests.
  if (requestPromise) {
    return requestPromise;
  }

  // Don't fetch again unless explicitly requested.
  if (hasCompletedInitialRequest && !force) {
    return Promise.resolve();
  }

  publish({
    loading: true,
    error: null,
  });

  const currentRequest = (async () => {
    try {
      const response = await adminApi.me();

      /**
       * Supports Axios response:
       *
       * response.data.success
       *
       * And direct API response:
       *
       * response.success
       */
      const responseBody = response?.data ?? response;

      if (responseBody?.success === true) {
        const responseData = responseBody?.data ?? {};

        const nextData: PermissionsData = {
          admin: responseData?.admin ?? null,

          permissions_grouped:
            normalizePermissionsGrouped(
              responseData?.permissions_grouped
            ),

          roles: Array.isArray(responseData?.roles)
            ? responseData.roles
            : [],

          warehouse_assignments: Array.isArray(
            responseData?.warehouse_assignments
          )
            ? responseData.warehouse_assignments
            : [],

          has_warehouse_access: Boolean(
            responseData?.has_warehouse_access
          ),
        };

        publish({
          data: nextData,
          error: null,
        });
      } else {
        publish({
          data: null,
          error:
            responseBody?.message ||
            "Failed to fetch admin permissions",
        });
      }
    } catch (err: any) {
      console.error(
        "Failed to fetch admin permissions:",
        err
      );

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

      publish({
        loading: false,
      });
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
    getServerSnapshot
  );

  // ===================================================
  // INITIAL FETCH
  // ===================================================

  useEffect(() => {
    void fetchPermissions();
  }, []);

  const { data, loading, error } = state;

  // ===================================================
  // ROLES
  // ===================================================

  const roles = useMemo<AdminRole[]>(
    () =>
      Array.isArray(data?.roles)
        ? data.roles
        : [],
    [data]
  );

  const roleSlugs = useMemo<string[]>(() => {
    return [
      ...new Set(
        roles
          .map(getRoleSlug)
          .filter(Boolean)
      ),
    ];
  }, [roles]);

  const primaryRole = useMemo<string | null>(() => {
    if (!roles.length) {
      return null;
    }

    const primary =
      roles.find(
        (role) => role?.is_primary === true
      ) || roles[0];

    return getRoleSlug(primary) || null;
  }, [roles]);

  // ===================================================
  // NORMALIZED PERMISSIONS
  // ===================================================

  const permissionsGrouped = useMemo<PermissionsGrouped>(
    () => {
      return normalizePermissionsGrouped(
        data?.permissions_grouped
      );
    },
    [data]
  );

  // ===================================================
  // ALL PERMISSION SLUGS
  // ===================================================

  /**
   * Converts grouped permissions into full slugs.
   *
   * Example:
   *
   * sales_product_report: ["sales.view"]
   *
   * becomes:
   *
   * sales product report.sales.view
   */
  const allSlugs = useMemo<string[]>(() => {
    const slugs: string[] = [];

    Object.entries(permissionsGrouped).forEach(
      ([module, actions]) => {
        if (!Array.isArray(actions)) {
          return;
        }

        actions.forEach((action) => {
          const normalizedModule =
            normalizeModule(module);

          const normalizedAction =
            normalizeAction(action);

          if (
            normalizedModule &&
            normalizedAction
          ) {
            slugs.push(
              `${normalizedModule}.${normalizedAction}`
            );
          }
        });
      }
    );

    return [...new Set(slugs)];
  }, [permissionsGrouped]);

  // ===================================================
  // SUPER ADMIN
  // ===================================================

  const isSuperAdmin = useMemo<boolean>(
    () =>
      roleSlugs.includes(
        normalize(ROLES.SUPER_ADMIN)
      ),
    [roleSlugs]
  );

  // ===================================================
  // GLOBAL PERMISSION CHECK
  // ===================================================

  /**
   * Checks a complete permission slug.
   *
   * Supported:
   *
   * hasPermission("sales.view")
   * hasPermission("return_refund.view")
   * hasPermission("correction.send_link")
   *
   * Also supports nested API permissions:
   *
   * API:
   * return_refund_report: ["return_refund.view"]
   *
   * Check:
   * hasPermission("return_refund.view")
   *
   * IMPORTANT:
   * A bare action like "download" is NOT treated
   * as a global permission. Use can(module, action)
   * for module-specific bare actions.
   */
  const hasPermission = useCallback(
    (slug: string): boolean => {
      if (isSuperAdmin) {
        return true;
      }

      const normalizedSlug = normalize(slug);

      if (!normalizedSlug) {
        return false;
      }

      // Global wildcard.
      if (
        allSlugs.includes("*.*") ||
        allSlugs.includes("*")
      ) {
        return true;
      }

      // Exact match.
      if (allSlugs.includes(normalizedSlug)) {
        return true;
      }

      // Bare action is not a global permission.
      if (!normalizedSlug.includes(".")) {
        return false;
      }

      const { module } = splitSlug(normalizedSlug);

      // Module-level wildcard.
      if (
        permissionsGrouped[module]?.includes("*")
      ) {
        return true;
      }

      /**
       * Nested permission support.
       *
       * Stored:
       * return refund report.return refund.view
       *
       * Requested:
       * return refund.view
       *
       * This matches without granting unrelated
       * bare actions such as "download".
       */
      return allSlugs.some((stored) =>
        stored.endsWith(`.${normalizedSlug}`)
      );
    },
    [
      allSlugs,
      isSuperAdmin,
      permissionsGrouped,
    ]
  );

  // ===================================================
  // ANY PERMISSION
  // ===================================================

  const hasAnyPermission = useCallback(
    (slugs: string[]): boolean => {
      if (isSuperAdmin) {
        return true;
      }

      if (
        !Array.isArray(slugs) ||
        slugs.length === 0
      ) {
        return false;
      }

      return slugs.some((slug) =>
        hasPermission(slug)
      );
    },
    [hasPermission, isSuperAdmin]
  );

  // ===================================================
  // ALL PERMISSIONS
  // ===================================================

  const hasAllPermissions = useCallback(
    (slugs: string[]): boolean => {
      if (isSuperAdmin) {
        return true;
      }

      if (
        !Array.isArray(slugs) ||
        slugs.length === 0
      ) {
        return false;
      }

      return slugs.every((slug) =>
        hasPermission(slug)
      );
    },
    [hasPermission, isSuperAdmin]
  );

  // ===================================================
  // MODULE + ACTION PERMISSION CHECK
  // ===================================================

  /**
   * Checks a permission inside its specific module.
   *
   * Examples:
   *
   * can("sales_category_report", "download")
   * can("sales_product_report", "sales.view")
   * can("sales_product_report", "sales.download")
   * can("delivery_report", "delivery.view")
   *
   * This avoids accidental permission sharing
   * between different modules.
   */
  const can = useCallback(
    (
      module: string,
      action: string
    ): boolean => {
      if (isSuperAdmin) {
        return true;
      }

      const normalizedModule =
        normalizeModule(module);

      const normalizedAction =
        normalizeAction(action);

      if (
        !normalizedModule ||
        !normalizedAction
      ) {
        return false;
      }

      const actions =
        permissionsGrouped[normalizedModule];

      // No permission group for this module.
      if (!Array.isArray(actions)) {
        // Preserve support for legacy nested slugs.
        return hasPermission(
          `${normalizedModule}.${normalizedAction}`
        );
      }

      // Module wildcard.
      if (actions.includes("*")) {
        return true;
      }

      // Exact action match.
      if (actions.includes(normalizedAction)) {
        return true;
      }

      /**
       * Supports nested action names.
       *
       * Example:
       *
       * API action: return_refund.view
       * Requested: view
       */
      const hasNestedAction = actions.some(
        (storedAction) =>
          storedAction.endsWith(`.${normalizedAction}`)
      );

      if (hasNestedAction) {
        return true;
      }

      return false;
    },
    [
      hasPermission,
      isSuperAdmin,
      permissionsGrouped,
    ]
  );

  // ===================================================
  // MODULE ACCESS
  // ===================================================

  /**
   * Checks whether the admin has any permission
   * inside the requested module.
   */
  const hasModuleAccess = useCallback(
    (module: string): boolean => {
      if (isSuperAdmin) {
        return true;
      }

      const normalizedModule =
        normalizeModule(module);

      if (!normalizedModule) {
        return false;
      }

      const actions =
        permissionsGrouped[normalizedModule];

      if (
        Array.isArray(actions) &&
        actions.length > 0
      ) {
        return true;
      }

      // Module-level wildcard.
      if (
        actions?.includes("*")
      ) {
        return true;
      }

      // Fallback for nested permission slugs.
      return allSlugs.some((slug) =>
        slug.startsWith(`${normalizedModule}.`)
      );
    },
    [
      allSlugs,
      isSuperAdmin,
      permissionsGrouped,
    ]
  );

  // ===================================================
  // ROLE CHECK
  // ===================================================

  const hasRole = useCallback(
    (role: string): boolean => {
      const normalizedRole = normalize(role);

      return Boolean(
        normalizedRole &&
        roleSlugs.includes(normalizedRole)
      );
    },
    [roleSlugs]
  );

  // ===================================================
  // ANY ROLE CHECK
  // ===================================================

  const hasAnyRole = useCallback(
    (rolesToCheck: string[]): boolean => {
      if (
        !Array.isArray(rolesToCheck) ||
        rolesToCheck.length === 0
      ) {
        return false;
      }

      return rolesToCheck.some((role) =>
        hasRole(role)
      );
    },
    [hasRole]
  );

  // ===================================================
  // WAREHOUSE ASSIGNMENTS
  // ===================================================

  const warehouseAssignments =
    useMemo<WarehouseAssignment[]>(
      () =>
        Array.isArray(data?.warehouse_assignments)
          ? data.warehouse_assignments
          : [],
      [data]
    );

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
        warehouseAssignments.length > 0
      );
    }, [
      data,
      isSuperAdmin,
      warehouseAssignments,
    ]);

  // ===================================================
  // REFETCH
  // ===================================================

  const refetch = useCallback(
    () => fetchPermissions(true),
    []
  );

  // ===================================================
  // RETURN
  // ===================================================

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
