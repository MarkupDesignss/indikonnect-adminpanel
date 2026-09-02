import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { router } from "./routes";
import "./index.css";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <RouterProvider router={router} />

    <Toaster
      position="top-right"
      reverseOrder={false}
      toastOptions={{
        duration: 3000,
        style: {
          borderRadius: "12px",
          padding: "12px 16px",
          fontSize: "14px",
          fontWeight: "600",
        },
      }}
    />
  </React.StrictMode>
);