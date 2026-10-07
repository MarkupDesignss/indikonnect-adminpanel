// src/hooks/usePortalInfo.ts

import { useMemo } from "react";
import {
  getPortalType,
  type PortalType,
} from "../../utils/getPortalName";
import usePermissions from "./usePermissions";

interface PortalInfo {
  urlPortal: PortalType;
  portalName: string;
  isWarehousePortal: boolean;
  isFinancePortal: boolean;
  isAdminPortal: boolean;
  warehouseName: string | null;
  warehouseCode: string | null;
}

export const usePortalInfo = (): PortalInfo => {
  const { admin, hasWarehouseAccess } = usePermissions();

  const urlPortal = useMemo<PortalType>(() => {
    return getPortalType();
  }, []);

  const warehouseName = useMemo<string | null>(() => {
    return admin?.warehouse_name ?? null;
  }, [admin]);

  const warehouseCode = useMemo<string | null>(() => {
    return admin?.warehouse_code ?? null;
  }, [admin]);

  const portalName = useMemo<string>(() => {
    if (urlPortal === "warehouse") {
      return "Warehouse Portal";
    }

    if (urlPortal === "finance") {
      return "Finance Portal";
    }

    if (hasWarehouseAccess) {
      return "Warehouse Portal";
    }

    return "Admin Portal";
  }, [urlPortal, hasWarehouseAccess]);

  const isWarehousePortal = useMemo<boolean>(() => {
    return portalName === "Warehouse Portal";
  }, [portalName]);

  const isFinancePortal = useMemo<boolean>(() => {
    return portalName === "Finance Portal";
  }, [portalName]);

  const isAdminPortal = useMemo<boolean>(() => {
    return portalName === "Admin Portal";
  }, [portalName]);

  return {
    urlPortal,
    portalName,
    isWarehousePortal,
    isFinancePortal,
    isAdminPortal,
    warehouseName,
    warehouseCode,
  };
};

export default usePortalInfo;