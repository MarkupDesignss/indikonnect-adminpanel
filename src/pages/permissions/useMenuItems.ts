// src/hooks/useMenuItems.ts

import { useMemo } from "react";

import {
  menuItems,
  type MenuItem,
} from "../../config/menu";

import { filterMenuByPermissions } from "./filterMenuByPermissions";
import usePermissions from "./usePermissions";

// Stable empty array: loading ke time full menu kabhi return nahi hoga.
const EMPTY_MENU: MenuItem[] = [];

interface MenuItemsState {
  menuItems: MenuItem[];
  loading: boolean;
}

export const useMenuItemsState = (): MenuItemsState => {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasModuleAccess,
    isSuperAdmin,
    loading,
  } = usePermissions();

  const visibleMenuItems = useMemo(() => {
    // Permissions load hone tak menu items render mat karo.
    if (loading) {
      return EMPTY_MENU;
    }

    // Permissions resolve hone ke baad sirf authorized menu return karo.
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

  return {
    menuItems: visibleMenuItems,
    loading,
  };
};

// Existing components ke liye backward-compatible hook.
export const useMenuItems = (): MenuItem[] => {
  const { menuItems: visibleMenuItems } = useMenuItemsState();

  return visibleMenuItems;
};

export default useMenuItems;