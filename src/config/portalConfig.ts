export const getPortalLoginUrl = (): string => {
    const pathname = window.location.pathname;
    const origin = window.location.origin;
  
    if (pathname.startsWith("/indiekonnect-finance")) {
      return `${origin}/indiekonnect-finance/login`;
    }
  
    if (pathname.startsWith("/indiekonnect-warehouse")) {
      return `${origin}/indiekonnect-warehouse/login`;
    }
  
    if (pathname.startsWith("/indiekonnect-admin")) {
      return `${origin}/indiekonnect-admin/login`;
    }
  
    // fallback
    return `${origin}/indiekonnect-admin/login`;
  };

  export const getPortalName = (): string => {
    const pathname = window.location.pathname;
  
    if (pathname.startsWith("/indiekonnect-finance")) {
      return "Finance Portal";
    }
  
    if (pathname.startsWith("/indiekonnect-warehouse")) {
      return "Warehouse Portal";
    }
  
    return "Admin Portal";
  };