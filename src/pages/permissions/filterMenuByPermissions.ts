// src/utils/filterMenuByPermissions.ts

import type { MenuItem } from "../../config/menu";

interface PermissionCheckers {
  hasPermission: (slug: string) => boolean;
  hasAnyPermission: (slugs: string[]) => boolean;
  hasAllPermissions: (slugs: string[]) => boolean;
  hasModuleAccess: (module: string) => boolean;
  isSuperAdmin: boolean;
}

export function filterMenuByPermissions(
  items: MenuItem[],
  checkers: PermissionCheckers,
): MenuItem[] {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasModuleAccess,
    isSuperAdmin,
  } = checkers;

  if (isSuperAdmin) {
    return items;
  }

  const canAccess = (item: MenuItem): boolean => {
    const hasConstraint =
      item.permission ||
      (item.anyOf && item.anyOf.length > 0) ||
      (item.allOf && item.allOf.length > 0) ||
      item.module;

    if (!hasConstraint) {
      return true;
    }

    if (item.allOf && item.allOf.length > 0) {
      if (!hasAllPermissions(item.allOf)) {
        return false;
      }
    }

    if (item.anyOf && item.anyOf.length > 0) {
      if (hasAnyPermission(item.anyOf)) {
        return true;
      }
    }

    if (item.permission) {
      if (hasPermission(item.permission)) {
        return true;
      }
    }

    if (item.module) {
      if (hasModuleAccess(item.module)) {
        return true;
      }
    }

    return false;
  };

  const filtered: MenuItem[] = [];

  for (const item of items) {
    if (item.children && item.children.length > 0) {
      const filteredChildren = filterMenuByPermissions(
        item.children,
        checkers,
      );

      if (filteredChildren.length > 0) {
        filtered.push({
          ...item,
          children: filteredChildren,
        });
      }
      continue;
    }

    if (canAccess(item)) {
      filtered.push(item);
    }
  }

  return filtered;
}