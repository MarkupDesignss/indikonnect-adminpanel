import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { usePermissions } from "./usePermissions";

export interface PortalInfo {
  portalName: string;
  warehouseName: string | null;
  warehouseCode: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Derives portal details from the shared usePermissions cache.
 * It intentionally does not call adminApi.me() itself.
 */
export const usePortalInfo = (): PortalInfo => {
  const { pathname } = useLocation();
  const {
    admin,
    roles,
    roleSlugs,
    warehouseAssignments,
    loading,
    error,
  } = usePermissions();

  const portalName = useMemo(() => {
    const route = pathname.toLowerCase();
    const assignedRoles = (roleSlugs || []).map((role) =>
      String(role).toLowerCase(),
    );
    const roleText = [
      ...(Array.isArray(roles)
        ? roles.flatMap((role: any) =>
            typeof role === "string"
              ? [role]
              : role && typeof role === "object"
                ? [role.name, role.slug, role.role, role.key, role.title].filter(Boolean)
                : [],
          )
        : []),
      ...assignedRoles,
    ]
      .join(" ")
      .toLowerCase();

    // Explicit finance/warehouse portal routes take precedence.
    if (route.startsWith("/indiekonnect-finance")) return "Finance Portal";
    if (route.startsWith("/indiekonnect-warehouse")) return "Warehouse Portal";

    // In the admin app, the assigned role differentiates the portal label.
    if (roleText.includes("support")) return "Support Portal";
    if (roleText.includes("sales")) return "Sales Portal";
    if (roleText.includes("finance")) return "Finance Portal";
    if (roleText.includes("warehouse")) return "Warehouse Portal";
    if (route.startsWith("/indiekonnect-admin")) return "Admin Portal";
    return "Admin Portal";
  }, [pathname, roleSlugs, roles]);

  const warehouseName = useMemo(() => {
    if (admin?.warehouse_name) return admin.warehouse_name;
    const assignment =
      warehouseAssignments.find((item) => item?.is_primary) ||
      warehouseAssignments[0];
    return assignment?.warehouse?.name ?? null;
  }, [admin, warehouseAssignments]);

  const warehouseCode = useMemo(() => {
    if (admin?.warehouse_code) return admin.warehouse_code;
    const assignment =
      warehouseAssignments.find((item) => item?.is_primary) ||
      warehouseAssignments[0];
    return assignment?.warehouse?.code ?? null;
  }, [admin, warehouseAssignments]);

  return {
    portalName,
    warehouseName: warehouseName || null,
    warehouseCode: warehouseCode || null,
    loading,
    error,
  };
};

export default usePortalInfo;
