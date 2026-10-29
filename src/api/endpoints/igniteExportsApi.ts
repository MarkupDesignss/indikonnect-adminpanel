import apiClient from "../client";

// =====================================================
// TYPES
// =====================================================

export interface IgniteExportFile {
  name: string;
  size: number;
  modified_at: string;
}

export interface IgniteExportsResponse {
  success: boolean;
  message?: string;
  data: {
    files: IgniteExportFile[];
  };
}

// =====================================================
// API
// =====================================================

const igniteExportsApi = {
  // ===================================================
  // GET ALL EXPORT FILES
  // GET /admin/ignite/exports
  // ===================================================

  getAll: () => {
    return apiClient.get<IgniteExportsResponse>(
      "/admin/ignite/exports"
    );
  },

  // ===================================================
  // DOWNLOAD CSV FILE
  // GET /min/ignite/exports/download?name=filename.csv
  // ===================================================

  download: (fileName: string) => {
    return apiClient.get<Blob>(
      "/admin/ignite/exports/download",
      {
        params: {
          name: fileName,
        },
        responseType: "blob",
      }
    );
  },
};

export default igniteExportsApi;