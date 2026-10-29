import React, {
    FC,
    useCallback,
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import {
    FiActivity,
    FiAlertCircle,
    FiClock,
    FiDatabase,
    FiDownload,
    FiFileText,
    FiFilter,
    FiHardDrive,
    FiLock,
    FiRefreshCw, 
    FiSearch,
    FiShield,
    FiTable,
    FiX,
  } from "react-icons/fi";
  
  import { AnimatePresence, motion } from "framer-motion";
  import toast from "react-hot-toast";
  
  import igniteExportsApi, {
    IgniteExportFile,
  } from "../../api/endpoints/igniteExportsApi";
  
  import { usePermissions } from "../../pages/permissions/usePermissions";
  import logoApi from "../../api/endpoints/logoApi";
  import PermissionLoadingState from "@/components/common/PermissionLoadingState";
  
  const DEFAULT_LOGO_URL =
    "https://www.markupdesigns.net/indikonnect/storage/logos/MmVFOudCiVU3Y8C0sf2gEEXna5jSKroCDj8xYMo0.png";
  
  // =====================================================
  // ✅ PERMISSION SLUGS (normalized form used by usePermissions)
  // The /me response key is "Partner Data Exports"; usePermissions
  // lowercases + collapses whitespace → "partner data exports".
  // =====================================================
  
  const PARTNER_EXPORTS_MODULE = "Partner Data Exports";
  const PARTNER_EXPORTS_VIEW = "partner data exports.view";
  const PARTNER_EXPORTS_DOWNLOAD = "partner data exports.download";
  
  type FileFilter = "all" | "ledger" | "wd";
  
  type FileKind = "ledger" | "wd" | "csv";
  
  interface SummaryCardProps {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    delay?: number;
  }
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 110,
        damping: 15,
      },
    },
  };
  
  const getFileKind = (name: string): FileKind => {
    const normalized = name.toLowerCase();
  
    if (normalized.includes("_ledger")) return "ledger";
    if (normalized.includes("_wd")) return "wd";
  
    return "csv";
  };
  
  const formatFileSize = (bytes: number): string => {
    if (!Number.isFinite(bytes) || bytes < 0) return "—";
  
    if (bytes < 1024) {
      return `${bytes} B`;
    }
  
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
  
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };
  
  const formatDate = (value: string): string => {
    if (!value) return "—";
  
    const date = new Date(value.replace(" ", "T"));
  
    if (Number.isNaN(date.getTime())) {
      return value;
    }
  
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };
  
  const getWeekLabel = (name: string): string => {
    const match = name.match(/W\d{2}/i);
  
    return match ? match[0].toUpperCase() : "Export";
  };
  
  const getErrorMessage = async (
    error: unknown,
    fallback: string
  ): Promise<string> => {
    const err = error as {
      message?: string;
      response?: {
        data?: unknown;
      };
    };
  
    const responseData = err?.response?.data;
  
    // Some APIs return JSON errors as a Blob during CSV downloads.
    if (
      typeof Blob !== "undefined" &&
      responseData instanceof Blob
    ) {
      try {
        const text = await responseData.text();
        const parsed = JSON.parse(text);
  
        if (parsed?.message) {
          return parsed.message;
        }
      } catch {
        // Use the normal fallback for non-JSON responses.
      }
    }
  
    if (
      responseData &&
      typeof responseData === "object" &&
      "message" in responseData
    ) {
      const message = (
        responseData as { message?: unknown }
      ).message;
  
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }
  
    if (err?.message) {
      return err.message;
    }
  
    return fallback;
  };
  
  // =====================================================
  // SUMMARY CARD
  // =====================================================
  
  const SummaryCard: FC<SummaryCardProps> = ({
    title,
    value,
    subtitle,
    icon,
    iconBg,
    iconColor,
    delay = 0,
  }) => {
    return (
      <motion.div
        variants={itemVariants}
        transition={{ delay }}
        className="group relative overflow-hidden rounded-2xl border border-[#DCE6F2] bg-white p-4 shadow-[0_5px_20px_rgba(45,111,232,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(45,111,232,0.09)] sm:p-5"
      >
        <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-[#F4F8FD] transition-colors group-hover:bg-[#EAF3FF]" />
  
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#6B7280]">
              {title}
            </p>
  
            <h3 className="mt-2 text-2xl font-bold tracking-tight text-[#111827]">
              {value}
            </h3>
  
            <p className="mt-1 text-[11px] text-[#6B7280]">
              {subtitle}
            </p>
          </div>
  
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: iconBg,
              color: iconColor,
            }}
          >
            {icon}
          </div>
        </div>
      </motion.div>
    );
  };
  
  // =====================================================
  // FILE TYPE BADGE
  // =====================================================
  
  const FileTypeBadge: FC<{ kind: FileKind }> = ({ kind }) => {
    const config = {
      ledger: {
        label: "Ledger",
        className: "border-[#2D6FE8]/20 bg-[#EAF3FF] text-[#2D6FE8]",
      },
      wd: {
        label: "WD",
        className: "border-[#FACC15]/40 bg-[#FEF9C3] text-[#854D0E]",
      },
      csv: {
        label: "CSV",
        className: "border-[#DCE6F2] bg-[#F4F8FD] text-[#6B7280]",
      },
    }[kind];
  
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${config.className}`}
      >
        <FiFileText size={12} />
        {config.label}
      </span>
    );
  };
  
  // =====================================================
  // FILE CARD
  // =====================================================
  
  interface ExportFileCardProps {
    file: IgniteExportFile;
    downloading: string | null;
    onDownload: (file: IgniteExportFile) => void;
    canDownload: boolean;
  }
  
  const ExportFileCard: FC<ExportFileCardProps> = ({
    file,
    downloading,
    onDownload,
    canDownload,
  }) => {
    const kind = getFileKind(file.name);
    const isDownloading = downloading === file.name;
  
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#DCE6F2] bg-white p-4 shadow-[0_4px_18px_rgba(45,111,232,0.035)] transition-all duration-300 hover:border-[#A9C9FA] hover:shadow-[0_8px_25px_rgba(45,111,232,0.09)] sm:p-5"
      >
        <div className="absolute left-0 top-0 h-[3px] w-0 bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] transition-all duration-300 group-hover:w-full" />
  
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#2D6FE8] transition-colors group-hover:bg-[#DCEAFF]">
            <FiFileText size={21} />
          </div>
  
          <FileTypeBadge kind={kind} />
        </div>
  
        <div className="mt-4 min-w-0">
          <h3
            title={file.name}
            className="break-all text-sm font-bold leading-5 text-[#111827]"
          >
            {file.name}
          </h3>
  
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F4F8FD] px-2 py-1 text-[10px] font-semibold text-[#6B7280]">
              <FiActivity size={11} />
              {getWeekLabel(file.name)}
            </span>
  
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F4F8FD] px-2 py-1 text-[10px] font-semibold text-[#6B7280]">
              <FiHardDrive size={11} />
              {formatFileSize(file.size)}
            </span>
          </div>
        </div>
  
        <div className="mt-4 flex items-center gap-2 border-t border-[#DCE6F2] pt-3">
          <FiClock size={13} className="shrink-0 text-[#6B7280]" />
  
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              Last Modified
            </p>
  
            <p className="mt-0.5 text-[11px] font-medium text-[#6B7280]">
              {formatDate(file.modified_at)}
            </p>
          </div>
        </div>
  
        {/* ✅ DOWNLOAD BUTTON — gated by partner data exports.download */}
  
        {canDownload ? (
          <button
            type="button"
            onClick={() => onDownload(file)}
            disabled={Boolean(downloading)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] px-4 py-2.5 text-xs font-bold text-white shadow-[0_4px_12px_rgba(45,111,232,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(45,111,232,0.25)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDownloading ? (
              <FiRefreshCw size={14} className="animate-spin" />
            ) : (
              <FiDownload size={14} />
            )}
  
            {isDownloading ? "Preparing Download..." : "Download CSV"}
          </button>
        ) : (
          <div
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#DCE6F2] bg-[#F8FBFF] px-4 py-2.5 text-[11px] font-semibold text-[#6B7280]"
            title="You have view-only access to Partner Data Exports."
          >
            <FiLock size={13} />
            Download not permitted
          </div>
        )}
      </motion.div>
    );
  };
  
  // =====================================================
  // MAIN PAGE
  // =====================================================
  
  const IgniteExports: FC = () => {
    // ===================================================
    // ✅ PERMISSIONS — Partner Data Exports
    // ===================================================
  
    const {
      hasPermission,
      hasModuleAccess,
      isSuperAdmin,
      loading: permissionsLoading,
    } = usePermissions();
  
    const canViewExports = useMemo(
      () =>
        isSuperAdmin ||
        hasModuleAccess(PARTNER_EXPORTS_MODULE) ||
        hasPermission(PARTNER_EXPORTS_VIEW),
      [isSuperAdmin, hasModuleAccess, hasPermission],
    );
  
    const canDownloadExports = useMemo(
      () =>
        isSuperAdmin ||
        hasPermission(PARTNER_EXPORTS_DOWNLOAD),
      [isSuperAdmin, hasPermission],
    );
  
    // ===================================================
    // ✅ LOGO STATE
    // ===================================================
  
    const [logoUrl, setLogoUrl] = useState<string | null>(DEFAULT_LOGO_URL);
    const [logoLoading, setLogoLoading] = useState(true);
  
    // ===================================================
    // DATA STATE
    // ===================================================
  
    const [files, setFiles] = useState<IgniteExportFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [initialLoaded, setInitialLoaded] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [downloading, setDownloading] = useState<string | null>(null);
  
    const [searchTerm, setSearchTerm] = useState("");
    const [fileFilter, setFileFilter] = useState<FileFilter>("all");
    const [apiError, setApiError] = useState("");
  
    // ===================================================
    // FETCH LOGO
    // ===================================================
  
    useEffect(() => {
      let cancelled = false;
  
      const fetchLogo = async () => {
        try {
          const response: any = await logoApi.getLogo();
  
          const possibleLogos: unknown[] = [
            response?.data?.data?.logo,
            response?.data?.logo,
            response?.data?.data?.data?.logo,
            response?.data?.data?.logo_url,
            response?.data?.logo_url,
            response?.logo,
          ];
  
          const resolvedLogo = possibleLogos.find(
            (value): value is string =>
              typeof value === "string" && /^https?:\/\//i.test(value.trim()),
          );
  
          if (!cancelled && resolvedLogo) {
            setLogoUrl(resolvedLogo.trim());
          }
        } catch (error) {
          console.error("Logo API error:", error);
        } finally {
          if (!cancelled) {
            setLogoLoading(false);
          }
        }
      };
  
      void fetchLogo();
  
      return () => {
        cancelled = true;
      };
    }, []);
  
    // ===================================================
    // FETCH EXPORT FILES
    // ===================================================
  
    const fetchFiles = useCallback(async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
  
      setApiError("");
  
      try {
        const response = await igniteExportsApi.getAll();
  
        if (response.data?.success !== true) {
          throw new Error(
            response.data?.message || "Unable to fetch export files."
          );
        }
  
        const responseFiles = response.data?.data?.files;
  
        setFiles(Array.isArray(responseFiles) ? responseFiles : []);
      } catch (error: unknown) {
        const message = await getErrorMessage(
          error,
          "Unable to load Ignite export files."
        );
  
        setApiError(message);
  
        if (isRefresh) {
          toast.error(message);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setInitialLoaded(true);
      }
    }, []);
  
    // ===================================================
    // ✅ INITIAL FETCH (permission-aware)
    // ===================================================
  
    useEffect(() => {
      if (permissionsLoading) return;
  
      if (canViewExports && !initialLoaded) {
        void fetchFiles();
      } else if (!canViewExports) {
        setLoading(false);
        setInitialLoaded(true);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [permissionsLoading, canViewExports]);
  
    // ===================================================
    // ✅ COMBINED INITIAL LOADING
    // ===================================================
  
    const pageLoading =
      permissionsLoading ||
      logoLoading ||
      (loading && !initialLoaded);
  
    // ===================================================
    // DOWNLOAD CSV
    // ===================================================
  
    const handleDownload = useCallback(
      async (file: IgniteExportFile) => {
        if (downloading) return;
  
        // ✅ Extra guard — even if somehow called without the button.
        if (!canDownloadExports) {
          toast.error(
            "You don't have permission to download Partner Data Exports."
          );
          return;
        }
  
        setDownloading(file.name);
  
        try {
          const response = await igniteExportsApi.download(file.name);
  
          const blob = response.data;
  
          if (!(blob instanceof Blob)) {
            throw new Error("The server did not return a valid CSV file.");
          }
  
          if (blob.size === 0) {
            throw new Error("The downloaded file is empty.");
          }
  
          // If the server returned a JSON error as a Blob, show its message.
          const contentType = blob.type.toLowerCase();
  
          if (
            contentType.includes("application/json") ||
            contentType.includes("text/html")
          ) {
            const message = await getErrorMessage(
              {
                response: {
                  data: blob,
                },
              },
              "Unable to download this export file."
            );
  
            throw new Error(message);
          }
  
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
  
          link.href = blobUrl;
          link.download = file.name;
          link.style.display = "none";
  
          document.body.appendChild(link);
          link.click();
          link.remove();
  
          window.setTimeout(() => {
            window.URL.revokeObjectURL(blobUrl);
          }, 1000);
  
          toast.success(`${file.name} downloaded successfully.`);
        } catch (error: unknown) {
          const message = await getErrorMessage(
            error,
            "Unable to download the export file."
          );
  
          toast.error(message);
        } finally {
          setDownloading(null);
        }
      },
      [downloading, canDownloadExports]
    );
  
    // ===================================================
    // FILTER FILES
    // ===================================================
  
    const filteredFiles = useMemo(() => {
      const search = searchTerm.trim().toLowerCase();
  
      return files.filter((file) => {
        const matchesSearch =
          !search ||
          file.name.toLowerCase().includes(search) ||
          getWeekLabel(file.name).toLowerCase().includes(search);
  
        const kind = getFileKind(file.name);
  
        const matchesFilter =
          fileFilter === "all" || kind === fileFilter;
  
        return matchesSearch && matchesFilter;
      });
    }, [files, searchTerm, fileFilter]);
  
    // ===================================================
    // SUMMARY
    // ===================================================
  
    const summary = useMemo(() => {
      const ledgerCount = files.filter(
        (file) => getFileKind(file.name) === "ledger"
      ).length;
  
      const wdCount = files.filter(
        (file) => getFileKind(file.name) === "wd"
      ).length;
  
      const totalSize = files.reduce(
        (total, file) => total + (Number(file.size) || 0),
        0
      );
  
      return {
        total: files.length,
        ledger: ledgerCount,
        wd: wdCount,
        size: formatFileSize(totalSize),
      };
    }, [files]);
  
    // ===================================================
    // ✅ PERMISSION LOADING
    // ===================================================
  
    if (pageLoading) {
      return <PermissionLoadingState logoUrl={logoUrl} />;
    }
  
    // ===================================================
    // ✅ ACCESS DENIED
    // ===================================================
  
    if (!canViewExports) {
      return (
        <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#F4F8FD] font-poppins p-4">
          <div className="max-w-md rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF5FF] text-[#C23B32]">
              <FiAlertCircle size={26} />
            </div>
            <h2 className="text-lg font-bold text-[#111827]">
              Access Denied
            </h2>
            <p className="mt-2 text-sm text-[#111827]">
              You don't have permission to access Partner Data Exports.
            </p>
          </div>
        </div>
      );
    }
  
    // ===================================================
    // RENDER
    // ===================================================
  
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="min-h-screen bg-white p-4 font-poppins sm:p-5 lg:p-7"
      >
        {/* ============================================== */}
        {/* PAGE HEADER */}
        {/* ============================================== */}
  
        <motion.div
          variants={itemVariants}
          className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center"
        >
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2D6FE8]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#4F8FF7]" />
  
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#2D6FE8]">
                Ignite Management
              </span>
            </div>
  
            <h1 className="text-[20px] font-medium tracking-tight text-[#111827] sm:text-[22px]">
              Partner Data Exports
            </h1>
  
            <p className="mt-0.5 text-sm text-[#111827]">
              View and download weekly Ignite ledger and WD export files.
            </p>
          </div>
  
          <button
            type="button"
            onClick={() => void fetchFiles(true)}
            disabled={refreshing || loading}
            className="inline-flex w-full items-center justify-center gap-2 self-start rounded-xl border border-[#DCE6F2] bg-white px-4 py-2.5 text-xs font-bold text-[#2D6FE8] shadow-sm transition-all hover:border-[#2D6FE8]/40 hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto lg:self-center"
          >
            <FiRefreshCw
              size={14}
              className={refreshing ? "animate-spin" : ""}
            />
  
            {refreshing ? "Refreshing..." : "Refresh Files"}
          </button>
        </motion.div>
  
        {/* ============================================== */}
        {/* VIEW-ONLY NOTICE */}
        {/* ============================================== */}
  
        {!canDownloadExports && (
          <motion.div
            variants={itemVariants}
            className="mt-4 flex items-start gap-2 rounded-xl border border-[#FACC15]/50 bg-[#FEF9C3] px-4 py-3 text-xs text-[#854D0E]"
          >
            <FiShield className="mt-0.5 shrink-0" size={15} />
            <p className="min-w-0 flex-1 break-words">
              You have <strong>view-only</strong> access to Partner Data Exports.
              Downloading files requires the{" "}
              <code className="rounded bg-white/60 px-1 py-0.5 text-[10px]">
                download
              </code>{" "}
              permission. Contact your administrator if you need it.
            </p>
          </motion.div>
        )}
  
        {/* ============================================== */}
        {/* SUMMARY CARDS */}
        {/* ============================================== */}
  
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Export Files"
            value={loading ? "—" : summary.total}
            subtitle="Available CSV files"
            icon={<FiDatabase size={20} />}
            iconBg="#EAF3FF"
            iconColor="#2D6FE8"
          />
  
          <SummaryCard
            title="Ledger Files"
            value={loading ? "—" : summary.ledger}
            subtitle="Weekly ledger exports"
            icon={<FiTable size={20} />}
            iconBg="#EAF3FF"
            iconColor="#2D6FE8"
            delay={0.05}
          />
  
          <SummaryCard
            title="WD Files"
            value={loading ? "—" : summary.wd}
            subtitle="Weekly WD exports"
            icon={<FiFileText size={20} />}
            iconBg="#FEF9C3"
            iconColor="#854D0E"
            delay={0.1}
          />
  
          <SummaryCard
            title="Total File Size"
            value={loading ? "—" : summary.size}
            subtitle="Combined export size"
            icon={<FiHardDrive size={20} />}
            iconBg="#EAF3FF"
            iconColor="#2D6FE8"
            delay={0.15}
          />
        </div>
  
        {/* ============================================== */}
        {/* MAIN CONTENT */}
        {/* ============================================== */}
  
        <motion.section
          variants={itemVariants}
          className="mt-6 overflow-hidden rounded-[22px] border border-[#DCE6F2] bg-white shadow-[0_8px_30px_rgba(45,111,232,0.05)]"
        >
          {/* SECTION HEADER */}
  
          <div className="relative border-b border-[#DCE6F2] px-4 py-5 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#2D6FE8]">
                  <FiDatabase size={19} />
                </div>
  
                <div>
                  <h2 className="text-base font-bold text-[#111827]">
                    Export Files
                  </h2>
  
                  <p className="mt-0.5 text-[11px] text-[#6B7280]">
                    {loading
                      ? "Fetching export files..."
                      : `${filteredFiles.length} of ${files.length} files shown`}
                  </p>
                </div>
              </div>
  
              {/* SEARCH */}
  
              <div className="flex w-full flex-col gap-3 sm:flex-row xl:max-w-[540px]">
                <div className="relative min-w-0 flex-1">
                  <FiSearch
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280]"
                  />
  
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(event.target.value)
                    }
                    placeholder="Search filename or week..."
                    className="h-11 w-full rounded-xl border border-[#DCE6F2] bg-[#F8FBFF] pl-10 pr-9 text-xs text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/10"
                  />
  
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] transition hover:text-[#C23B32]"
                    >
                      <FiX size={15} />
                    </button>
                  )}
                </div>
  
                {/* FILE FILTER */}
  
                <div className="relative shrink-0">
                  <FiFilter
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#2D6FE8]"
                  />
  
                  <select
                    value={fileFilter}
                    onChange={(event) =>
                      setFileFilter(event.target.value as FileFilter)
                    }
                    aria-label="Filter export files"
                    className="h-11 w-full appearance-none rounded-xl border border-[#DCE6F2] bg-white pl-9 pr-9 text-xs font-semibold text-[#111827] outline-none transition focus:border-[#2D6FE8] focus:ring-2 focus:ring-[#2D6FE8]/10 sm:w-[150px]"
                  >
                    <option value="all">All Files</option>
                    <option value="ledger">Ledger Files</option>
                    <option value="wd">WD Files</option>
                  </select>
  
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]"
                    aria-hidden="true"
                  >
                    <path
                      d="m5 7.5 5 5 5-5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
  
          {/* CONTENT BODY */}
  
          <div className="bg-[#F8FBFF] p-4 sm:p-5 lg:p-6">
            {/* LOADING STATE */}
  
            {loading && !initialLoaded ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-[#DCE6F2] bg-white px-4 py-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                  <FiRefreshCw size={23} className="animate-spin" />
                </div>
  
                <p className="mt-4 text-sm font-bold text-[#111827]">
                  Loading export files...
                </p>
  
                <p className="mt-1 text-xs text-[#6B7280]">
                  Fetching the latest Ignite export information.
                </p>
  
                <div className="mt-5 h-1 w-40 overflow-hidden rounded-full bg-[#EAF3FF]">
                  <div className="h-full w-1/2 animate-pulse rounded-full bg-[#2D6FE8]" />
                </div>
              </div>
            ) : apiError && files.length === 0 ? (
              /* API ERROR */
  
              <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-red-100 bg-white px-5 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#C23B32]">
                  <FiAlertCircle size={23} />
                </div>
  
                <h3 className="mt-4 text-sm font-bold text-[#111827]">
                  Unable to Load Export Files
                </h3>
  
                <p className="mt-2 max-w-md break-words text-xs leading-5 text-[#6B7280]">
                  {apiError}
                </p>
  
                <button
                  type="button"
                  onClick={() => void fetchFiles(true)}
                  disabled={refreshing}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2D6FE8] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#245BC2] disabled:opacity-60"
                >
                  <FiRefreshCw
                    size={14}
                    className={refreshing ? "animate-spin" : ""}
                  />
                  Try Again
                </button>
              </div>
            ) : files.length === 0 ? (
              /* NO FILES */
  
              <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#DCE6F2] bg-white px-5 py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                  <FiDatabase size={25} />
                </div>
  
                <h3 className="mt-4 text-sm font-bold text-[#111827]">
                  No Export Files Found
                </h3>
  
                <p className="mt-1 max-w-sm text-xs leading-5 text-[#6B7280]">
                  Export files will appear here when they are available from
                  the Ignite exports API.
                </p>
  
                <button
                  type="button"
                  onClick={() => void fetchFiles(true)}
                  disabled={refreshing}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#DCE6F2] bg-white px-4 py-2.5 text-xs font-bold text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:opacity-60"
                >
                  <FiRefreshCw
                    size={13}
                    className={refreshing ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>
            ) : filteredFiles.length === 0 ? (
              /* NO FILTER MATCH */
  
              <div className="flex min-h-[230px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#DCE6F2] bg-white px-5 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                  <FiSearch size={22} />
                </div>
  
                <h3 className="mt-4 text-sm font-bold text-[#111827]">
                  No Matching Files
                </h3>
  
                <p className="mt-1 text-xs text-[#6B7280]">
                  Try another search term or select a different file type.
                </p>
  
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setFileFilter("all");
                  }}
                  className="mt-4 rounded-lg bg-[#EAF3FF] px-4 py-2 text-xs font-bold text-[#2D6FE8] transition hover:bg-[#DCEAFF]"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                {/* NON-BLOCKING REFRESH ERROR */}
  
                {apiError && (
                  <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-100 bg-[#FEF2F2] px-4 py-3 text-xs text-[#C23B32]">
                    <FiAlertCircle className="mt-0.5 shrink-0" size={15} />
  
                    <p className="min-w-0 flex-1 break-words">
                      {apiError}
                    </p>
  
                    <button
                      type="button"
                      onClick={() => setApiError("")}
                      aria-label="Dismiss error"
                      className="shrink-0"
                    >
                      <FiX size={15} />
                    </button>
                  </div>
                )}
  
                {/* RESPONSIVE FILE GRID */}
  
                <AnimatePresence mode="popLayout">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {filteredFiles.map((file) => (
                      <ExportFileCard
                        key={file.name}
                        file={file}
                        downloading={downloading}
                        onDownload={handleDownload}
                        canDownload={canDownloadExports}
                      />
                    ))}
                  </div>
                </AnimatePresence>
              </>
            )}
          </div>
  
          {/* FOOTER */}
  
          {!loading && files.length > 0 && (
            <div className="flex flex-col justify-between gap-2 border-t border-[#DCE6F2] bg-white px-4 py-4 sm:flex-row sm:items-center sm:px-6">
              <p className="text-[10px] leading-5 text-[#6B7280]">
                Showing{" "}
                <span className="font-bold text-[#111827]">
                  {filteredFiles.length}
                </span>{" "}
                of{" "}
                <span className="font-bold text-[#111827]">
                  {files.length}
                </span>{" "}
                export files
              </p>
  
              <div className="flex items-center gap-2 text-[10px] font-semibold text-[#6B7280]">
                <FiShield size={13} className="text-[#2D6FE8]" />
                Partner Data Exports
              </div>
            </div>
          )}
        </motion.section>
      </motion.div>
    );
  };
  
  export default IgniteExports;