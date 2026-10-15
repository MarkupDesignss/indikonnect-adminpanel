import { RouterProvider } from "react-router-dom";
import { adminRouter } from "./routes/index";
import { financeRouter } from "./routes/financeRoutes";
import { warehouseRouter } from "./routes/WarehouseRoutes";

function App() {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  // ── Finance Portal ──
  const isFinance =
    hostname === "finance.indiekonnect.com" ||
    hostname === "finance.localhost" ||
    hostname.startsWith("finance.") ||
    pathname.startsWith("/indiekonnect-finance");

  // ── Warehouse Portal ──
  const isWarehouse =
    hostname === "warehouse.indiekonnect.com" ||
    hostname === "warehouse.localhost" ||
    hostname.startsWith("warehouse.") ||
    pathname.startsWith("/indiekonnect-warehouse");

  // ── Admin Portal (default + subfolder path) ──
  const isAdmin =
    hostname === "admin.indiekonnect.com" ||
    hostname === "admin.localhost" ||
    hostname.startsWith("admin.") ||
    pathname.startsWith("/indiekonnect-admin") ||
    (!isFinance && !isWarehouse);

  // ── Router Selection ──
  let router = adminRouter;
  let portalKey = "admin";

  if (isFinance) {
    router = financeRouter;
    portalKey = "finance";
  } else if (isWarehouse) {
    router = warehouseRouter;
    portalKey = "warehouse";
  } else if (isAdmin) {
    router = adminRouter;
    portalKey = "admin";
  }

  // ✅ FIX: key lagao — portal change hone par router remount hoga
  // Note: pathname ko key mein nahi daal sakte warna infinite remount hoga
  return <RouterProvider router={router} key={portalKey} />;
}

export default App;