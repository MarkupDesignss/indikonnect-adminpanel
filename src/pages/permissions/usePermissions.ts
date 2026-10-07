// src/hooks/usePermissions.ts

import { useCallback, useEffect, useMemo, useState } from "react";
import adminApi from "../../api/endpoints/Auth";

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

export type RoleSlug = (typeof ROLES)[keyof typeof ROLES];

export interface AdminRole {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
}

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  city: string;
  state: string;
  is_active: boolean;
  is_default: boolean;
}

export interface WarehouseRole {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
}

export interface WarehouseAssignment {
  id: number;

  warehouse: Warehouse | null;

  role: WarehouseRole | null;

  role_id: number;
  role_slug: string;

  is_primary: boolean;
  is_active: boolean;
  is_current: boolean;

  assigned_from: string | null;
  assigned_until: string | null;

  notes: string | null;

  assigned_by: number;

  created_at: string;
  updated_at: string;
}

/* ============================================================
   ADMIN DETAILS
   ============================================================ */

export interface AdminDetails {
  id: number;
  name: string;
  email: string;
  profile_image?: string | null;
  warehouse_name?: string | null;
  warehouse_code?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/* ============================================================
   PERMISSIONS DATA
   ============================================================ */

export interface PermissionsData {
  admin: AdminDetails | null;

  permissions_grouped: Record<string, string[]>;

  roles: AdminRole[];

  warehouse_assignments: WarehouseAssignment[];

  has_warehouse_access: boolean;
}

/* ============================================================
   API RESPONSE
   ============================================================ */

export interface PermissionsResponse {
  success: boolean;

  data: PermissionsData;

  message?: string;
}

/* ============================================================
   ROLE BASED FALLBACK PERMISSIONS
   ------------------------------------------------------------
   ⚠️ Ye fallback use NAHI hoga (hasPermission me).
   Sirf reference ke liye rakha hai.
   ============================================================ */

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.SUPER_ADMIN]: ["*"],

  [ROLES.ADMIN]: [
    "product.create",
    "product.view",
    "product.update",
    "product.details",

    "category.create",
    "category.view",
    "category.update",
    "category.details",

    "attribute.create",
    "attribute.view",
    "attribute.update",
    "attribute.delete",
    "attribute.details",

    "order.view",
    "order.details",
    "order.dispatch",
    "order.shipped",
    "order.delivered",
  ],

  [ROLES.FINANCE]: [
    "payout.view",
    "payout.details",
    "payout.release",
    "payout.hold",

    "return_refund.view",
    "return_refund.details",
    "return_refund.approve",
    "return_refund.reject",
  ],

  [ROLES.FINANCE_MANAGER]: [
    "payout.view",
    "payout.details",
    "payout.release",
    "payout.hold",
    "payout.notify",
    "payout.export",

    "return_refund.view",
    "return_refund.details",
    "return_refund.approve",
    "return_refund.reject",
    "return_refund.received",
    "return_refund.completed",
  ],

  [ROLES.SALES]: [
    "order.view",
    "order.details",
  ],

  [ROLES.SALES_MANAGER]: [
    "order.view",
    "order.details",
    "order.dispatch",
    "order.shipped",
    "order.delivered",
  ],

  [ROLES.SALES_EXECUTIVE]: [
    "order.view",
    "order.details",
  ],

  [ROLES.WAREHOUSE]: [
    "stock.view",
    "stock.update",
  ],

  [ROLES.WAREHOUSE_MANAGER]: [
    "stock.view",
    "stock.update",

    "product.view",
    "product.details",

    "category.view",
    "category.details",

    "attribute.view",
    "attribute.details",
  ],

  [ROLES.WAREHOUSE_EXECUTIVE]: [
    "stock.view",
    "stock.update",
  ],
};

export const WAREHOUSE_ROLE_ACCESS: Record<
  string,
  {
    view: boolean;
    update: boolean;
    transfer: boolean;
    dispatch: boolean;
  }
> = {
  [ROLES.SUPER_ADMIN]: {
    view: true,
    update: true,
    transfer: true,
    dispatch: true,
  },

  [ROLES.WAREHOUSE]: {
    view: true,
    update: false,
    transfer: false,
    dispatch: false,
  },

  [ROLES.WAREHOUSE_MANAGER]: {
    view: true,
    update: true,
    transfer: true,
    dispatch: true,
  },

  [ROLES.WAREHOUSE_EXECUTIVE]: {
    view: true,
    update: true,
    transfer: false,
    dispatch: false,
  },
};

export const usePermissions = () => {
  const [data, setData] = useState<PermissionsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminApi.me();

      if (response.data.success) {
        setData(response.data.data);
      } else {
        setData(null);

        setError(
          response.data.message ||
            "Failed to fetch admin permissions",
        );
      }
    } catch (err: any) {
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

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const admin = useMemo(() => {
    return data?.admin ?? null;
  }, [data]);

  const roles = useMemo<AdminRole[]>(() => {
    return data?.roles ?? [];
  }, [data]);

  const roleSlugs = useMemo<string[]>(() => {
    const roleSet = new Set<string>();

    roles.forEach((role) => {
      if (role.slug) {
        roleSet.add(role.slug);
      }
    });

    data?.warehouse_assignments?.forEach((assignment) => {
      if (assignment.role_slug) {
        roleSet.add(assignment.role_slug);
      }

      if (assignment.role?.slug) {
        roleSet.add(assignment.role.slug);
      }
    });

    return Array.from(roleSet);
  }, [roles, data]);

  const primaryRole = useMemo<string | null>(() => {
    const primaryAssignment =
      data?.warehouse_assignments?.find(
        (assignment) => assignment.is_primary === true,
      );

    if (primaryAssignment?.role_slug) {
      return primaryAssignment.role_slug;
    }

    if (primaryAssignment?.role?.slug) {
      return primaryAssignment.role.slug;
    }

    if (roles.length > 0) {
      return roles[0]?.slug ?? null;
    }

    return roleSlugs[0] ?? null;
  }, [data, roles, roleSlugs]);

  const permissionsGrouped = useMemo(() => {
    return data?.permissions_grouped ?? {};
  }, [data]);

  const allSlugs = useMemo<string[]>(() => {
    const slugs: string[] = [];

    Object.entries(permissionsGrouped).forEach(
      ([module, actions]) => {
        actions.forEach((action) => {
          slugs.push(`${module}.${action}`);
        });
      },
    );

    return slugs;
  }, [permissionsGrouped]);

  /* ============================================================
     ✅ hasPermission — sirf API permissions valid
     ============================================================ */

  const hasPermission = useCallback(
    (slug: string): boolean => {
      if (roleSlugs.includes(ROLES.SUPER_ADMIN)) {
        return true;
      }

      if (allSlugs.includes(slug)) {
        return true;
      }

      if (allSlugs.includes("*")) {
        return true;
      }

      return false;
    },
    [roleSlugs, allSlugs],
  );

  const hasAnyPermission = useCallback(
    (slugs: string[]): boolean => {
      return slugs.some((slug) => hasPermission(slug));
    },
    [hasPermission],
  );

  const hasAllPermissions = useCallback(
    (slugs: string[]): boolean => {
      return slugs.every((slug) => hasPermission(slug));
    },
    [hasPermission],
  );

  /* ============================================================
     ✅ hasModuleAccess — sirf API modules valid
     ============================================================ */

  const hasModuleAccess = useCallback(
    (module: string): boolean => {
      if (roleSlugs.includes(ROLES.SUPER_ADMIN)) {
        return true;
      }

      const actions = permissionsGrouped[module];

      if (Array.isArray(actions) && actions.length > 0) {
        return true;
      }

      return false;
    },
    [permissionsGrouped, roleSlugs],
  );

  const can = useCallback(
    (module: string, action: string): boolean => {
      return hasPermission(`${module}.${action}`);
    },
    [hasPermission],
  );

  const hasRole = useCallback(
    (roleSlug: string): boolean => {
      return roleSlugs.includes(roleSlug);
    },
    [roleSlugs],
  );

  const isSuperAdmin = useMemo(() => {
    return roleSlugs.includes(ROLES.SUPER_ADMIN);
  }, [roleSlugs]);

  const isFinance = useMemo(() => {
    return (
      hasRole(ROLES.FINANCE) ||
      hasRole(ROLES.FINANCE_MANAGER) ||
      hasModuleAccess("payout") ||
      hasModuleAccess("return_refund")
    );
  }, [hasRole, hasModuleAccess]);

  const isSales = useMemo(() => {
    return (
      hasRole(ROLES.SALES) ||
      hasRole(ROLES.SALES_MANAGER) ||
      hasRole(ROLES.SALES_EXECUTIVE) ||
      hasModuleAccess("sales")
    );
  }, [hasRole, hasModuleAccess]);

  const isWarehouse = useMemo(() => {
    return (
      data?.has_warehouse_access === true ||
      data?.warehouse_assignments?.some(
        (assignment) => assignment.is_active === true,
      ) === true ||
      hasRole(ROLES.WAREHOUSE) ||
      hasRole(ROLES.WAREHOUSE_MANAGER) ||
      hasRole(ROLES.WAREHOUSE_EXECUTIVE) ||
      hasModuleAccess("warehouse") ||
      hasModuleAccess("stock")
    );
  }, [data, hasRole, hasModuleAccess]);

  const hasWarehouseAccess = useMemo(() => {
    return (
      data?.has_warehouse_access === true ||
      data?.warehouse_assignments?.some(
        (assignment) => assignment.is_active === true,
      ) === true
    );
  }, [data]);

  const warehouseAssignments = useMemo(() => {
    return data?.warehouse_assignments ?? [];
  }, [data]);

  const getWarehousesByRole = useCallback(
    (roleSlug: string): WarehouseAssignment[] => {
      return warehouseAssignments.filter(
        (assignment) =>
          assignment.role_slug === roleSlug ||
          assignment.role?.slug === roleSlug,
      );
    },
    [warehouseAssignments],
  );

  const hasWarehouseId = useCallback(
    (warehouseId: number): boolean => {
      return warehouseAssignments.some(
        (assignment) =>
          assignment.warehouse?.id === warehouseId &&
          assignment.is_active === true,
      );
    },
    [warehouseAssignments],
  );

  const accessibleWarehouses = useMemo(() => {
    const map = new Map<number, Warehouse>();

    warehouseAssignments.forEach((assignment) => {
      if (
        assignment.is_active === true &&
        assignment.warehouse
      ) {
        map.set(assignment.warehouse.id, assignment.warehouse);
      }
    });

    return Array.from(map.values());
  }, [warehouseAssignments]);

  const currentWarehouse = useMemo(() => {
    const current = warehouseAssignments.find(
      (assignment) =>
        assignment.is_current === true &&
        assignment.is_active === true,
    );

    return current?.warehouse ?? null;
  }, [warehouseAssignments]);

  const primaryWarehouse = useMemo(() => {
    const primary = warehouseAssignments.find(
      (assignment) =>
        assignment.is_primary === true &&
        assignment.is_active === true,
    );

    return primary?.warehouse ?? null;
  }, [warehouseAssignments]);

  const canInWarehouse = useCallback(
    (
      action: "view" | "update" | "transfer" | "dispatch",
    ): boolean => {
      if (isSuperAdmin) {
        return true;
      }

      if (hasPermission(`warehouse.${action}`)) {
        return true;
      }

      return false;
    },
    [isSuperAdmin, hasPermission],
  );

  return {
    data,
    admin,
    loading,
    error,
    refetch: fetchAll,

    roles,
    roleSlugs,
    primaryRole,
    hasRole,
    isSuperAdmin,
    isFinance,
    isSales,
    isWarehouse,

    permissionsGrouped,
    allSlugs,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasModuleAccess,
    can,

    hasWarehouseAccess,
    warehouseAssignments,
    accessibleWarehouses,
    currentWarehouse,
    primaryWarehouse,
    getWarehousesByRole,
    hasWarehouseId,
    canInWarehouse,
  };
};

export default usePermissions;