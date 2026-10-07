// src/hooks/useMenuItems.ts

import { useMemo } from "react";
import { menuItems, type MenuItem } from "../../config/menu";
import { filterMenuByPermissions } from "./filterMenuByPermissions";
import usePermissions from "./usePermissions";

export const useMenuItems = (): MenuItem[] => {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasModuleAccess,
    isSuperAdmin,
    loading,
  } = usePermissions();

  return useMemo(() => {
    // Loading ke time full menu (flicker avoid karne ke liye)
    if (loading) {
      return menuItems;
    }

    return filterMenuByPermissions(menuItems, {
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasModuleAccess,
      isSuperAdmin,
    });
  }, [
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasModuleAccess,
    isSuperAdmin,
  ]);
};

export default useMenuItems;