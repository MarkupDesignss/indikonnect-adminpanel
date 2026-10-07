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

  // ── Finance Portal ──
  if (
    hostname === "finance.indiekonnect.com" ||
    hostname === "finance.localhost" ||
    hostname.startsWith("finance.") ||
    pathname.startsWith("/indiekonnect-finance")
  ) {
    return "finance";
  }

  // ── Warehouse Portal ──
  if (
    hostname === "warehouse.indiekonnect.com" ||
    hostname === "warehouse.localhost" ||
    hostname.startsWith("warehouse.") ||
    pathname.startsWith("/indiekonnect-warehouse")
  ) {
    return "warehouse";
  }

  // ── Admin (default) ──
  return "admin";
};

// =====================================================
// GET PORTAL NAME (Display label)
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
      return "Admin Portal";
  }
};

// =====================================================
// GET PORTAL BASE PATH (For router basename)
// =====================================================
export const getPortalBasePath = (): string => {
  const pathname = window.location.pathname;
  if (pathname.startsWith("/indiekonnect-admin")) return "/indiekonnect-admin";
  if (pathname.startsWith("/indiekonnect-finance")) return "/indiekonnect-finance";
  if (pathname.startsWith("/indiekonnect-warehouse")) return "/indiekonnect-warehouse";

  return "/";
};

// =====================================================
// GET PORTAL URL (For redirects / cross-portal links)
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

  return `https://${portal}.indiekonnect.com`;
};

// =====================================================
// GET PORTAL LOGIN URL (For logout redirect)
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

  return `https://${portal}.indiekonnect.com/login`;
};

// =====================================================
// PORTAL CONFIG (Branding)
// =====================================================
export const getPortalConfig = () => {
  const portal = getPortalType();

  const configs = {
    admin: {
      name: "Admin Portal",
      primaryColor: "#4F46E5",
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