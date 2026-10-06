// =====================================================
// GET PORTAL NAME (based on hostname)
// =====================================================
export const getPortalName = (): string => {
    const hostname = window.location.hostname;
  
    // Finance Portal
    if (
      hostname === "finance.indiekonnect.com" ||
      hostname === "finance.localhost" ||
      hostname.startsWith("finance.")
    ) {
      return "Finance Portal";
    }
  
    // Warehouse Portal
    if (
      hostname === "warehouse.indiekonnect.com" ||
      hostname === "warehouse.localhost" ||
      hostname.startsWith("warehouse.")
    ) {
      return "Warehouse Portal";
    }
  
    // Admin Portal (default)
    return "Admin Portal";
  };