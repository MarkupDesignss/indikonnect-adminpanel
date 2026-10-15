
// src/config/portalConfig.ts

// =====================================================
// PORTAL TYPE
// =====================================================
export type PortalType = "admin" | "finance" | "warehouse";

// =====================================================
// GET PORTAL TYPE (hostname + pathname both)
// =====================================================
export const getPortalType = (): PortalType => {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  // Finance Portal
  if (
    hostname === "finance.indiekonnect.com" ||
    hostname === "finance.localhost" ||
    hostname.startsWith("finance.") ||
    pathname.startsWith("/indiekonnect-finance")
  ) {
    return "finance";
  }

  // Warehouse Portal
  if (
    hostname === "warehouse.indiekonnect.com" ||
    hostname === "warehouse.localhost" ||
    hostname.startsWith("warehouse.") ||
    pathname.startsWith("/indiekonnect-warehouse")
  ) {
    return "warehouse";
  }

  // Management Portal (default)
  return "admin";
};

// =====================================================
// GET PORTAL NAME
// =====================================================
export const getPortalName = (): string => {
  const portal = getPortalType();

  switch (portal) {
    case "finance":
      return "Finance Portal";

    case "warehouse":
      return "Warehouse Portal";

    case "admin":
    default:
      return "Management Portal";
  }
};

// =====================================================
// GET PORTAL BASE PATH
// =====================================================
export const getPortalBasePath = (): string => {
  const pathname = window.location.pathname;

  if (pathname.startsWith("/indiekonnect-admin")) {
    return "/indiekonnect-admin";
  }

  if (pathname.startsWith("/indiekonnect-finance")) {
    return "/indiekonnect-finance";
  }

  if (pathname.startsWith("/indiekonnect-warehouse")) {
    return "/indiekonnect-warehouse";
  }

  return "/";
};

// =====================================================
// GET PORTAL URL
// =====================================================
export const getPortalUrl = (portal: PortalType): string => {
  const hostname = window.location.hostname;
  const isLocal = hostname.includes("localhost");
  const protocol = window.location.protocol;

  if (isLocal) {
    const portMap: Record<PortalType, number> = {
      admin: 5173,
      warehouse: 5175,
      finance: 5176,
    };

    return `${protocol}//localhost:${portMap[portal]}/indiekonnect-${portal}`;
  }

  if (portal === "admin") {
    return "https://indiekonnect.com/indiekonnect-admin";
  }

  return `https://${portal}.indiekonnect.com`;
};

// =====================================================
// GET PORTAL LOGIN URL
// =====================================================
export const getPortalLoginUrl = (): string => {
  const portal = getPortalType();
  const hostname = window.location.hostname;
  const isLocal = hostname.includes("localhost");
  const protocol = window.location.protocol;

  if (isLocal) {
    const portMap: Record<PortalType, number> = {
      admin: 5173,
      warehouse: 5175,
      finance: 5176,
    };

    return `${protocol}//localhost:${portMap[portal]}/indiekonnect-${portal}/login`;
  }

  if (portal === "admin") {
    return "https://indiekonnect.com/indiekonnect-admin/login";
  }

  return `https://${portal}.indiekonnect.com/login`;
};

// =====================================================
// PORTAL CONFIG (BRANDING)
// =====================================================
export const getPortalConfig = () => {
  const portal = getPortalType();

  const configs: Record<
    PortalType,
    {
      name: string;
      primaryColor: string;
      logo: string;
    }
  > = {
    admin: {
      name: "Management Portal",
      primaryColor: "#2D6FE8",
      logo: "/assets/admin-logo.svg",
    },

    finance: {
      name: "Finance Portal",
      primaryColor: "#059669",
      logo: "/assets/finance-logo.svg",
    },

    warehouse: {
      name: "Warehouse Portal",
      primaryColor: "#EA580C",
      logo: "/assets/warehouse-logo.svg",
    },
  };

  return configs[portal];
};
