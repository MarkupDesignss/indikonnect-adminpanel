
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FiCalendar,
  FiRefreshCw,
  FiSearch,
  FiAlertCircle,
  FiLayers,
  FiDownload,
  FiChevronDown,
  FiTrendingUp,
  FiCheck,
  FiFileText,
  FiX,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import commissionApi, {
  type CommissionCalendarResponse,
  type CommissionExportRow,
} from "../../api/endpoints/commissionApi";
import logoApi from "../../api/endpoints/logoApi";
import { usePermissions } from "../../pages/permissions/usePermissions";
import PermissionLoadingState from "@/components/common/PermissionLoadingState";

// =====================================================
// DEFAULT LOGO
// =====================================================

const DEFAULT_LOGO_URL =
  "https://www.markupdesigns.net/indikonnect/storage/logos/MmVFOudCiVU3Y8C0sf2gEEXna5jSKroCDj8xYMo0.png";

// =====================================================
// PERMISSION KEYS
// =====================================================

const VIEW_PERMISSION_KEYS = [
  "finance.commission-export",
  "finance.commission_export",
  "finance.commissionExport",
  "finance.commission-export.view",
];

const EXPORT_PERMISSION_KEYS = [
  "finance.commission-export",
  "finance.commission_export",
  "finance.commissionExport",
];

// =====================================================
// TYPES
// =====================================================

interface CommissionWeekOption {
  week_no: number;
  start_date: string;
  end_date: string;
  label: string;
}

interface AppliedCommissionFilters {
  year: number;
  week: number | null;
  fromDate: string;
  toDate: string;
}

type CommissionResponse = CommissionCalendarResponse;

// =====================================================
// ANIMATION VARIANTS
// =====================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.045 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

// =====================================================
// HELPERS
// =====================================================

const formatDate = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatNumber = (
  value: number | string | null | undefined,
) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

const buildWeekOptions = (calendar: any): CommissionWeekOption[] => {
  if (!calendar?.months?.length) return [];

  const map = new Map<number, CommissionWeekOption>();

  calendar.months.forEach((month: any) => {
    month.weeks?.forEach((week: any) => {
      const weekNo = Number(week.week_no);

      if (!Number.isFinite(weekNo)) return;

      if (!map.has(weekNo)) {
        map.set(weekNo, {
          week_no: weekNo,
          start_date: week.start_date,
          end_date: week.end_date,
          label: `Week ${weekNo}`,
        });
      }
    });
  });

  return Array.from(map.values()).sort(
    (a, b) => a.week_no - b.week_no,
  );
};

const getRowPeriodLabel = (row: CommissionExportRow) => {
  if (row.week != null) return `W${row.week}`;

  const labels =
    row.breakdown?.map((item) => item.label).filter(Boolean) ?? [];

  return labels.length ? labels.join(" + ") : "—";
};

const rowMatchesSearch = (
  row: CommissionExportRow,
  query: string,
) => {
  if (!query) return true;

  const breakdownText = (row.breakdown ?? [])
    .map(
      (item) =>
        `${item.label} ${item.start} ${item.end} ${item.type}`,
    )
    .join(" ");

  return [
    row.ba_id,
    row.distributor_name,
    row.email,
    row.bank_ifsc,
    row.bank_holder_name,
    row.gst_in,
    row.pan_number,
    String(row.week ?? ""),
    String(row.year ?? ""),
    breakdownText,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(query);
};

// =====================================================
// CSV EXPORT
// =====================================================

const exportToCsv = (
  rows: CommissionExportRow[],
  filename: string,
) => {
  if (!rows.length) {
    toast.error("No data available to export.");
    return;
  }

  const headers = [
    "BA ID",
    "Distributor Name",
    "Email",
    "Period",
    "Year",
    "Gross Commission",
    "TDS Rate (%)",
    "TDS Amount",
    "Net Commission",
    "GSTIN",
    "PAN Number",
    "PAN Verified",
    "Bank Holder Name",
    "Bank Account Number",
    "Bank IFSC",
  ];

  const escapeCsv = (value: unknown) => {
    const text =
      value === null || value === undefined ? "" : String(value);

    const safe = /^[=+@\- \t\r]/.test(text)
      ? `'${text}`
      : text;

    return `"${safe.replace(/"/g, '""')}"`;
  };

  const csvRows = rows.map((row) => {
    const breakdown = (row.breakdown ?? [])
      .map(
        (item) =>
          `${item.label}: ${item.start} - ${item.end}; Gross ${item.gross_commission}; TDS ${item.tds_amount}; Net ${item.net_commission}`,
      )
      .join(" | ");

    return [
      row.ba_id,
      row.distributor_name,
      row.email,
      getRowPeriodLabel(row),
      row.year ?? "",
      row.gross_commission,
      row.tds_rate_percent ?? "",
      row.tds_amount,
      row.net_commission,
      row.gst_in ?? "",
      row.pan_number ?? "",
      row.pan_verified === true
        ? "Yes"
        : row.pan_verified === false
          ? "No"
          : "",
      row.bank_holder_name,
      row.bank_account_number,
      row.bank_ifsc,
      breakdown,
    ]
      .map(escapeCsv)
      .join(",");
  });

  const csv = `\uFEFF${[
    headers.map(escapeCsv).join(","),
    ...csvRows,
  ].join("\r\n")}`;

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => URL.revokeObjectURL(url), 0);

  toast.success("CSV downloaded successfully.");
};

// =====================================================
// ACCESS DENIED STATE
// =====================================================

const AccessDeniedState: React.FC = () => (
  <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#F4F8FD] p-6 font-poppins">
    <div className="w-full max-w-md rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#C23B32]">
        <FiFileText size={24} />
      </div>

      <h2 className="mt-5 text-lg font-bold text-[#111827]">
        Access Denied
      </h2>

      <p className="mt-2 text-sm leading-6 text-[#6B7280]">
        You do not have permission to view commission data.
      </p>
    </div>
  </div>
);

// =====================================================
// CUSTOM WEEK DROPDOWN
// =====================================================

const WeekDropdown: React.FC<{
  options: CommissionWeekOption[];
  value: number | null;
  onChange: (val: number | null) => void;
  disabled?: boolean;
}> = ({
  options,
  value,
  onChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
  }, []);

  const filteredOptions = useMemo(() => {
    if (!search) return options;

    const query = search.toLowerCase();

    return options.filter(
      (option) =>
        option.week_no.toString().includes(query) ||
        formatDate(option.start_date)
          .toLowerCase()
          .includes(query) ||
        formatDate(option.end_date)
          .toLowerCase()
          .includes(query),
    );
  }, [options, search]);

  const selectedOption = options.find(
    (option) => option.week_no === value,
  );

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((previous) => !previous)}
        className="flex h-9 w-full items-center justify-between rounded-lg border border-[#D6E2F0] bg-white px-2.5 text-[11px] font-bold text-[#111827] outline-none transition hover:border-[#2D6FE8]/40 focus:border-[#2D6FE8] focus:ring-2 focus:ring-[#2D6FE8]/15 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="flex items-center gap-1.5 truncate">
          <FiLayers
            size={13}
            className="shrink-0 text-[#6B7280]"
          />

          <span className="truncate">
            {value == null
              ? "All Weeks"
              : selectedOption?.label ?? `Week ${value}`}
          </span>
        </span>

        <FiChevronDown
          size={14}
          className={`shrink-0 text-[#6B7280] transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-[260px] overflow-hidden rounded-xl border border-[#DCE6F2] bg-white shadow-xl"
          >
            <div className="border-b border-[#DCE6F2] p-2">
              <div className="relative">
                <FiSearch
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
                />

                <input
                  type="text"
                  placeholder="Search week or date..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  className="h-8 w-full rounded-lg bg-[#F4F8FD] pl-8 pr-3 text-xs text-[#111827] outline-none focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/15"
                  onClick={(event) => event.stopPropagation()}
                />
              </div>
            </div>

            <div className="max-h-[260px] overflow-y-auto p-1 custom-scrollbar">
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setIsOpen(false);
                  setSearch("");
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${
                  value == null
                    ? "bg-[#EAF3FF] font-bold text-[#2D6FE8]"
                    : "text-[#111827] hover:bg-[#F4F8FD]"
                }`}
              >
                All Weeks
                {value == null && <FiCheck size={14} />}
              </button>

              {filteredOptions.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-[#6B7280]">
                  No weeks found.
                </p>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.week_no}
                    type="button"
                    onClick={() => {
                      onChange(option.week_no);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${
                      value === option.week_no
                        ? "bg-[#EAF3FF] font-bold text-[#2D6FE8]"
                        : "text-[#111827] hover:bg-[#F4F8FD]"
                    }`}
                  >
                    <span className="flex flex-col">
                      <span>{option.label}</span>

                      <span className="text-[10px] font-normal text-[#6B7280]">
                        {formatDate(option.start_date)} –{" "}
                        {formatDate(option.end_date)}
                      </span>
                    </span>

                    {value === option.week_no && (
                      <FiCheck size={14} className="shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const CommissionView: React.FC = () => {
  const currentYear = new Date().getFullYear();

  // ===================================================
  // PERMISSIONS
  // ===================================================

  const {
    hasPermission,
    hasModuleAccess,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  const hasAnyPermission = useCallback(
    (keys: string[]) =>
      keys.some((key) => hasPermission(key)),
    [hasPermission],
  );

  const canViewCommission = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("finance") ||
      hasModuleAccess("Finance") ||
      hasAnyPermission(VIEW_PERMISSION_KEYS),
    [
      isSuperAdmin,
      hasModuleAccess,
      hasAnyPermission,
    ],
  );

  const canExportCommission = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("finance") ||
      hasModuleAccess("Finance") ||
      hasAnyPermission(EXPORT_PERMISSION_KEYS),
    [
      isSuperAdmin,
      hasModuleAccess,
      hasAnyPermission,
    ],
  );

  // ===================================================
  // LOGO STATE
  // ===================================================

  const [logoUrl, setLogoUrl] = useState<string | null>(
    DEFAULT_LOGO_URL,
  );

  const [logoLoading, setLogoLoading] = useState(true);

  // ===================================================
  // FILTER STATES
  // ===================================================

  const [selectedYear, setSelectedYear] =
    useState(currentYear);

  const [selectedWeek, setSelectedWeek] =
    useState<number | null>(null);

  const [draftFromDate, setDraftFromDate] = useState("");
  const [draftToDate, setDraftToDate] = useState("");

  // Last applied filters.
  const [appliedFilters, setAppliedFilters] =
    useState<AppliedCommissionFilters | null>(null);

  // ===================================================
  // WEEK OPTIONS
  // ===================================================

  const [weekOptions, setWeekOptions] = useState<
    CommissionWeekOption[]
  >([]);

  const [weekOptionsLoading, setWeekOptionsLoading] =
    useState(false);

  const weekRequestIdRef = useRef(0);

  // ===================================================
  // COMMISSION DATA
  // ===================================================

  const [search, setSearch] = useState("");

  const [data, setData] =
    useState<CommissionResponse | null>(null);

  // No commission GET request on initial page load.
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const requestIdRef = useRef(0);

  // ===================================================
  // LOGO FETCH
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
            typeof value === "string" &&
            /^https?:\/\//i.test(value.trim()),
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
  // FETCH ALL WEEK OPTIONS
  // ===================================================

  const fetchWeekOptions = useCallback(async () => {
    if (!canViewCommission) return;

    const requestId = ++weekRequestIdRef.current;

    try {
      setWeekOptionsLoading(true);

      /*
       * IMPORTANT:
       *
       * On page load and year change:
       * Send week = 0.
       *
       * API returns calendar containing all weeks.
       *
       * This request is only for dropdown options.
       * Commission table data is NOT loaded here.
       */

      const response = await commissionApi.getCalendar(
        0,
        selectedYear,
      );

      if (requestId !== weekRequestIdRef.current) return;

      if (
        response.data?.success &&
        response.data?.calendar
      ) {
        setWeekOptions(
          buildWeekOptions(response.data.calendar),
        );
      } else {
        setWeekOptions([]);
      }
    } catch (error) {
      if (requestId !== weekRequestIdRef.current) return;

      console.error("Week options API error:", error);
      setWeekOptions([]);
    } finally {
      if (requestId === weekRequestIdRef.current) {
        setWeekOptionsLoading(false);
      }
    }
  }, [selectedYear, canViewCommission]);

  // ===================================================
  // LOAD WEEK OPTIONS ON PAGE LOAD / YEAR CHANGE
  // ===================================================

  useEffect(() => {
    if (permissionsLoading) return;

    if (canViewCommission) {
      void fetchWeekOptions();
    }

    return () => {
      weekRequestIdRef.current += 1;
    };
  }, [
    permissionsLoading,
    canViewCommission,
    fetchWeekOptions,
  ]);

  // ===================================================
  // FETCH COMMISSION DATA
  // ===================================================

  const fetchCommission = useCallback(
    async (
      filters: AppliedCommissionFilters,
      isRefresh = false,
    ) => {
      if (!canViewCommission) return;

      const requestId = ++requestIdRef.current;

      /*
       * API WEEK LOGIC:
       *
       * 1. If From Date or To Date exists:
       *    week = null (omit week query parameter).
       *
       * 2. If a specific week is selected:
       *    Send that week number.
       *
       * 3. If All Weeks is selected:
       *    Send week = 0.
       */

      const hasDateFilter = Boolean(
        filters.fromDate || filters.toDate,
      );

      const apiWeek: number | null = hasDateFilter
        ? null
        : filters.week ?? 0;

      try {
        setErrorMessage("");

        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
          setData(null);
        }

        const response = await commissionApi.getCalendar(
          apiWeek,
          filters.year,
          filters.fromDate || undefined,
          filters.toDate || undefined,
        );

        if (requestId !== requestIdRef.current) return;

        if (response.data?.success) {
          setData(response.data);

          // Update week options from the latest calendar
          // only when the returned calendar is available.
          if (response.data?.calendar) {
            setWeekOptions(
              buildWeekOptions(response.data.calendar),
            );
          }
        } else {
          const message =
            response.data?.message ||
            "Unable to fetch commission data.";

          setErrorMessage(message);
          toast.error(message);
        }
      } catch (error: any) {
        if (requestId !== requestIdRef.current) return;

        console.error("Commission API error:", error);

        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Unable to fetch commission data.";

        setErrorMessage(message);
        toast.error(message);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [canViewCommission],
  );

  // ===================================================
  // FILTER DERIVED STATES
  // ===================================================

  const hasAppliedFilters = appliedFilters !== null;

  const hasPendingChanges = Boolean(
    appliedFilters &&
    (
      selectedYear !== appliedFilters.year ||
      selectedWeek !== appliedFilters.week ||
      draftFromDate !== appliedFilters.fromDate ||
      draftToDate !== appliedFilters.toDate
    )
  );

  const canReset = Boolean(
    hasAppliedFilters ||
    selectedYear !== currentYear ||
    selectedWeek !== null ||
    draftFromDate ||
    draftToDate ||
    search,
  );

  // ===================================================
  // YEAR CHANGE
  // ===================================================

  const handleYearChange = (value: string) => {
    const nextYear = Number(value);

    if (
      !Number.isInteger(nextYear) ||
      nextYear === selectedYear
    ) {
      return;
    }

    setSelectedYear(nextYear);

    setSelectedWeek(null);

    setDraftFromDate("");
    setDraftToDate("");

    setWeekOptions([]);

    // Only the week-options API will run for this year.
    // Commission records will wait for Apply Filter.
  };

  // ===================================================
  // WEEK CHANGE
  // ===================================================

  const handleWeekChange = (value: number | null) => {
    setSelectedWeek(value);
  };

  // ===================================================
  // DATE CHANGE
  // ===================================================

  const handleFromDateChange = (value: string) => {
    if (
      value &&
      draftToDate &&
      value > draftToDate
    ) {
      toast.error(
        "From date cannot be later than To date.",
      );
      return;
    }

    setDraftFromDate(value);
  };

  const handleToDateChange = (value: string) => {
    if (
      value &&
      draftFromDate &&
      value < draftFromDate
    ) {
      toast.error(
        "To date cannot be earlier than From date.",
      );
      return;
    }

    setDraftToDate(value);
  };

  // ===================================================
  // APPLY FILTER
  // ===================================================

  const handleApplyFilter = () => {
    if (!canViewCommission) {
      toast.error(
        "You do not have permission to view commission data.",
      );
      return;
    }

    if (loading || refreshing) return;

    if (
      draftFromDate &&
      draftToDate &&
      draftFromDate > draftToDate
    ) {
      toast.error(
        "From date cannot be later than To date.",
      );
      return;
    }

    const filters: AppliedCommissionFilters = {
      year: selectedYear,

      // Keep the selected week in UI state.
      // fetchCommission omits it whenever dates exist.
      week: selectedWeek,

      fromDate: draftFromDate,
      toDate: draftToDate,
    };

    setAppliedFilters(filters);

    // Commission GET API is called only here.
    void fetchCommission(filters);
  };

  // ===================================================
  // RESET FILTER
  // ===================================================

  const handleReset = () => {
    // Invalidate any previous pending commission request.
    requestIdRef.current += 1;

    setSelectedYear(currentYear);
    setSelectedWeek(null);

    setDraftFromDate("");
    setDraftToDate("");

    setAppliedFilters(null);

    setSearch("");
    setData(null);
    setErrorMessage("");

    setLoading(false);
    setRefreshing(false);

    // No commission API call on Reset.
    // If the year changed, the week-options effect
    // will refresh the calendar with week=0.
  };

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = () => {
    if (!canViewCommission) {
      toast.error(
        "You do not have permission to view commission data.",
      );
      return;
    }

    if (!appliedFilters) {
      toast.error("Please apply filters first.");
      return;
    }

    if (loading || refreshing) return;

    // Refresh uses the last applied filters.
    // Date filters will continue to omit week.
    void fetchCommission(appliedFilters, true);
  };

  // ===================================================
  // CSV EXPORT
  // ===================================================

  const rows = useMemo(
    () => data?.data || [],
    [data],
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) =>
      rowMatchesSearch(row, query),
    );
  }, [rows, search]);

  const handleDownloadCsv = () => {
    if (!canExportCommission) {
      toast.error(
        "You do not have permission to export commission data.",
      );
      return;
    }

    if (!appliedFilters) {
      toast.error("Please apply filters first.");
      return;
    }

    if (!filteredRows.length) {
      toast.error("No data available to export.");
      return;
    }

    const filters = appliedFilters;

    const datePart =
      filters.fromDate || filters.toDate
        ? `${filters.fromDate || "start"}-to-${filters.toDate || "end"}`
        : "all-dates";

    const weekPart =
      filters.fromDate || filters.toDate
        ? "date-range"
        : filters.week == null
          ? "all-weeks"
          : `week-${filters.week}`;

    exportToCsv(
      filteredRows,
      `commission-${weekPart}-${filters.year}-${datePart}.csv`,
    );
  };

  // ===================================================
  // DISPLAY PERIOD
  // ===================================================

  const displayPeriod = useMemo(() => {
    if (!appliedFilters) return "Not Applied";

    if (
      appliedFilters.fromDate ||
      appliedFilters.toDate
    ) {
      return `${
        appliedFilters.fromDate
          ? formatDate(appliedFilters.fromDate)
          : "Start"
      } – ${
        appliedFilters.toDate
          ? formatDate(appliedFilters.toDate)
          : "Present"
      }`;
    }

    return appliedFilters.week == null
      ? "All Weeks"
      : `Week ${appliedFilters.week}`;
  }, [appliedFilters]);

  // ===================================================
  // YEAR OPTIONS
  // ===================================================

  const yearOptions = useMemo(
    () =>
      Array.from(
        { length: 7 },
        (_, index) => currentYear - 3 + index,
      ),
    [currentYear],
  );

  // ===================================================
  // PAGE LOADING
  // ===================================================

  const pageLoading =
    permissionsLoading || logoLoading;

  // ===================================================
  // RENDER GUARDS
  // ===================================================

  if (pageLoading) {
    return <PermissionLoadingState logoUrl={logoUrl} />;
  }

  if (!canViewCommission) {
    return <AccessDeniedState />;
  }

  // ===================================================
  // MAIN UI
  // ===================================================

  return (
    <motion.div
      className="min-h-screen p-4 font-poppins sm:p-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* HEADER */}

      <motion.div
        variants={itemVariants}
        className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2D6FE8]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#4F8FF7]" />

            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#2D6FE8]">
              Finance Management
            </span>
          </div>

          <h1 className="text-[20px] font-medium tracking-tight text-[#111827] sm:text-[22px]">
            Commission Data
          </h1>

          <p className="mt-0.5 text-sm text-[#111827]">
            Filter by week, year or custom date range, then
            export the results to CSV.
          </p>
        </div>

        <div className="flex shrink-0 flex-nowrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={
              loading ||
              refreshing ||
              !hasAppliedFilters
            }
            className="flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-[#D6E2F0] bg-white px-3.5 text-xs font-bold text-[#111827] shadow-sm transition hover:border-[#2D6FE8]/35 hover:bg-[#F4F8FD] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiRefreshCw
              size={14}
              className={`text-[#2D6FE8] ${
                loading || refreshing ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>

          {canExportCommission && (
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={loading || !filteredRows.length}
              className="flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#2D6FE8] px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiDownload size={14} />
              Export CSV
            </button>
          )}
        </div>
      </motion.div>

      {/* WEEK RANGE / SUMMARY BANNER */}

      {!loading && data?.week_range && appliedFilters && (
        <motion.div
          variants={itemVariants}
          className="mb-6 flex flex-col justify-between gap-3 rounded-2xl border border-[#2D6FE8]/25 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-5"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#2D6FE8]">
              <FiTrendingUp size={20} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#2D6FE8]">
                Selected Period
              </p>

              <h2 className="mt-0.5 text-base font-bold text-[#111827]">
                {displayPeriod} • {appliedFilters.year}
              </h2>

              <p className="mt-0.5 text-xs text-[#6B7280]">
                {formatDate(data.week_range.start)} –{" "}
                {formatDate(data.week_range.end)}
              </p>
            </div>
          </div>

          {data.summary && (
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wide text-[#6B7280]">
                  Distributors
                </span>

                <span className="font-bold text-[#111827]">
                  {formatNumber(
                    data.summary.total_distributors,
                  )}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wide text-[#6B7280]">
                  Gross
                </span>

                <span className="font-bold tabular-nums text-[#111827]">
                  ₹{formatNumber(data.summary.total_gross)}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wide text-[#6B7280]">
                  TDS
                </span>

                <span className="font-bold tabular-nums text-[#C23B32]">
                  ₹{formatNumber(data.summary.total_tds)}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wide text-[#6B7280]">
                  Net
                </span>

                <span className="font-bold tabular-nums text-[#168653]">
                  ₹{formatNumber(data.summary.total_net)}
                </span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* MAIN CONTENT AREA */}

      <motion.div
        variants={itemVariants}
        className="flex flex-col overflow-hidden rounded-2xl border border-[#DCE6F2] bg-white shadow-sm"
      >
        {/* SEARCH + FILTERS */}

        <div className="border-b border-[#DCE6F2] bg-white p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(180px,1fr)_88px_132px_132px_132px_108px_88px] lg:items-end lg:gap-2">
            {/* SEARCH */}

            <div className="relative w-full min-w-0">
              <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                Search
              </span>

              <FiSearch
                size={15}
                className="absolute left-3 top-[30px] -translate-y-1/2 text-[#6B7280]"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="BA ID, name, email..."
                className="h-9 w-full rounded-lg border border-[#D6E2F0] bg-[#F8FBFF] pl-9 pr-9 text-[11px] text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/15"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-[30px] -translate-y-1/2 text-[#6B7280] hover:text-[#111827]"
                  aria-label="Clear search"
                >
                  <FiX size={13} />
                </button>
              )}
            </div>

            {/* YEAR */}

            <div className="w-full min-w-0">
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                Year
              </label>

              <div className="relative">
                <FiCalendar
                  size={13}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B7280]"
                />

                <select
                  value={selectedYear}
                  onChange={(event) =>
                    handleYearChange(event.target.value)
                  }
                  className="h-9 w-full appearance-none rounded-lg border border-[#D6E2F0] bg-white pl-7 pr-5 text-[11px] font-bold text-[#111827] outline-none transition hover:border-[#2D6FE8]/40 focus:border-[#2D6FE8] focus:ring-2 focus:ring-[#2D6FE8]/15"
                  aria-label="Select year"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>

                <FiChevronDown
                  size={12}
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#6B7280]"
                />
              </div>
            </div>

            {/* WEEK */}

            <div className="w-full min-w-0">
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                Week
              </label>

              <WeekDropdown
                options={weekOptions}
                value={selectedWeek}
                onChange={handleWeekChange}
                disabled={
                  weekOptionsLoading ||
                  !weekOptions.length
                }
              />

              {weekOptionsLoading && (
                <p className="mt-1 text-[9px] text-[#6B7280]">
                  Loading weeks...
                </p>
              )}
            </div>

            {/* FROM DATE */}

            <div className="w-full min-w-0">
              <label
                htmlFor="commission-from-date"
                className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[#6B7280]"
              >
                From Date
              </label>

              <input
                id="commission-from-date"
                type="date"
                value={draftFromDate}
                max={draftToDate || undefined}
                onChange={(event) =>
                  handleFromDateChange(event.target.value)
                }
                className="h-9 w-full rounded-lg border border-[#D6E2F0] bg-white px-2 text-[10px] font-semibold text-[#111827] outline-none transition focus:border-[#2D6FE8] focus:ring-2 focus:ring-[#2D6FE8]/15"
              />
            </div>

            {/* TO DATE */}

            <div className="w-full min-w-0">
              <label
                htmlFor="commission-to-date"
                className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[#6B7280]"
              >
                To Date
              </label>

              <input
                id="commission-to-date"
                type="date"
                value={draftToDate}
                min={draftFromDate || undefined}
                onChange={(event) =>
                  handleToDateChange(event.target.value)
                }
                className="h-9 w-full rounded-lg border border-[#D6E2F0] bg-white px-2 text-[10px] font-semibold text-[#111827] outline-none transition focus:border-[#2D6FE8] focus:ring-2 focus:ring-[#2D6FE8]/15"
              />
            </div>

            {/* APPLY FILTER */}

            <button
              type="button"
              onClick={handleApplyFilter}
              disabled={loading || refreshing}
              className="flex h-9 w-full min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-[#2D6FE8] px-2 text-[11px] font-bold text-white shadow-sm transition hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <FiRefreshCw
                  size={13}
                  className="animate-spin"
                />
              ) : (
                <FiCheck size={13} />
              )}
              Apply Filter
            </button>

            {/* RESET */}

            <button
              type="button"
              onClick={handleReset}
              disabled={!canReset}
              className="flex h-9 w-full min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#D6E2F0] bg-white px-2 text-[11px] font-bold text-[#374151] shadow-sm transition hover:border-[#C23B32]/30 hover:bg-[#FEF2F2] hover:text-[#C23B32] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiX size={13} />
              Reset
            </button>
          </div>

          {/* FILTER NOTICE */}

          {hasAppliedFilters && hasPendingChanges && (
            <p className="mt-3 text-[10px] font-medium text-[#B7791F]">
              You have changed filters. Click Apply Filter to
              update commission data.
            </p>
          )}

          {!hasAppliedFilters && (
            <p className="mt-3 text-[10px] text-[#6B7280]">
              Select your filters and click Apply Filter to load
              commission data.
            </p>
          )}
        </div>

        {/* APPLIED DATE RANGE */}

        {appliedFilters &&
          (appliedFilters.fromDate || appliedFilters.toDate) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#DCE6F2] bg-[#F8FBFF] px-4 py-2.5">
              <span className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                Applied date range
              </span>

              <span className="inline-flex items-center gap-1.5 text-[10px]">
                <span className="font-bold text-[#6B7280]">
                  From Date:
                </span>

                <span className="rounded-md border border-[#2D6FE8]/20 bg-[#EAF3FF] px-2 py-1 font-bold text-[#2D6FE8]">
                  {appliedFilters.fromDate
                    ? formatDate(appliedFilters.fromDate)
                    : "Not set"}
                </span>
              </span>

              <span className="inline-flex items-center gap-1.5 text-[10px]">
                <span className="font-bold text-[#6B7280]">
                  To Date:
                </span>

                <span className="rounded-md border border-[#2D6FE8]/20 bg-[#EAF3FF] px-2 py-1 font-bold text-[#2D6FE8]">
                  {appliedFilters.toDate
                    ? formatDate(appliedFilters.toDate)
                    : "Not set"}
                </span>
              </span>
            </div>
          )}

        {/* TABLE CONTENT */}

        <div className="relative overflow-x-auto">
          {loading ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                <FiRefreshCw
                  size={24}
                  className="animate-spin"
                />
              </div>

              <p className="mt-4 text-sm font-bold text-[#111827]">
                Loading commission data...
              </p>
            </div>
          ) : !hasAppliedFilters ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                <FiLayers size={24} />
              </div>

              <p className="mt-4 text-sm font-bold text-[#111827]">
                Commission data not loaded
              </p>

              <p className="mt-1 max-w-md text-xs leading-5 text-[#6B7280]">
                Select Year, Week or Date Range above and click
                Apply Filter to view commission records.
              </p>
            </div>
          ) : errorMessage && !data ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center px-5 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FCEEEE] text-[#C23B32]">
                <FiAlertCircle size={25} />
              </div>

              <h2 className="mt-4 text-sm font-bold text-[#111827]">
                Unable to load commission data
              </h2>

              <p className="mt-1 max-w-lg text-xs text-[#6B7280]">
                {errorMessage}
              </p>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="mt-4 flex h-9 items-center gap-2 rounded-lg bg-[#2D6FE8] px-4 text-xs font-bold text-white transition hover:bg-[#1E40AF] disabled:opacity-50"
              >
                <FiRefreshCw
                  size={13}
                  className={refreshing ? "animate-spin" : ""}
                />
                Try Again
              </button>
            </div>
          ) : filteredRows.length > 0 ? (
            <table className="min-w-full whitespace-nowrap text-left text-xs">
              <thead className="bg-[#4F8FF7] text-[11px] tracking-wide text-white">
                <tr>
                  <th className="w-12 px-3 py-4 text-center font-semibold">
                    S.No
                  </th>

                  <th className="px-3 py-4 font-semibold">
                    BA ID
                  </th>

                  <th className="px-3 py-4 font-semibold">
                    Distributor
                  </th>

                  <th className="px-3 py-4 font-semibold">
                    Email
                  </th>

                  <th className="px-3 py-4 text-center font-semibold">
                    Period
                  </th>

                  <th className="px-3 py-4 text-right font-semibold">
                    Gross (₹)
                  </th>

                  <th className="px-3 py-4 text-right font-semibold">
                    TDS Rate
                  </th>

                  <th className="px-3 py-4 text-right font-semibold">
                    TDS (₹)
                  </th>

                  <th className="px-3 py-4 text-right font-semibold">
                    Net (₹)
                  </th>

                  <th className="px-3 py-4 font-semibold">
                    GSTIN
                  </th>

                  <th className="px-3 py-4 font-semibold">
                    PAN
                  </th>

                  <th className="px-3 py-4 text-center font-semibold">
                    PAN Verified
                  </th>

                  <th className="px-3 py-4 font-semibold">
                    Bank Holder
                  </th>

                  <th className="px-3 py-4 font-semibold">
                    Account
                  </th>

                  <th className="px-3 py-4 font-semibold">
                    IFSC
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E9EFF7]">
                {filteredRows.map((row, index) => (
                  <tr
                    key={`${row.ba_id}-${row.week ?? getRowPeriodLabel(row)}-${index}`}
                    className="transition hover:bg-[#F8FBFF]"
                  >
                    <td className="px-3 py-4 text-center font-bold text-[#6B7280]">
                      {index + 1}
                    </td>

                    <td className="px-3 py-4">
                      <span className="inline-flex rounded bg-[#EAF3FF] px-2 py-1 text-[11px] font-bold text-[#2D6FE8]">
                        {row.ba_id}
                      </span>
                    </td>

                    <td className="px-3 py-4 font-medium text-[#111827]">
                      {row.distributor_name}
                    </td>

                    <td className="px-3 py-4 text-[#6B7280]">
                      {row.email}
                    </td>

                    <td className="px-3 py-4 text-center">
                      <span className="inline-flex max-w-[180px] items-center justify-center rounded-full bg-[#F4F8FD] px-2.5 py-1 text-[10px] font-bold text-[#2D6FE8]">
                        {getRowPeriodLabel(row)}
                      </span>
                    </td>

                    <td className="px-3 py-4 text-right font-medium tabular-nums text-[#111827]">
                      {formatNumber(row.gross_commission)}
                    </td>

                    <td className="px-3 py-4 text-right tabular-nums text-[#111827]">
                      {row.tds_rate_percent != null
                        ? `${row.tds_rate_percent}%`
                        : "—"}
                    </td>

                    <td className="px-3 py-4 text-right font-medium tabular-nums text-[#C23B32]">
                      {formatNumber(row.tds_amount)}
                    </td>

                    <td className="px-3 py-4 text-right font-bold tabular-nums text-[#168653]">
                      {formatNumber(row.net_commission)}
                    </td>

                    <td className="px-3 py-4 font-mono text-[11px] text-[#111827]">
                      {row.gst_in || (
                        <span className="text-[#9CA3AF]">
                          —
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-4 font-mono text-[11px] text-[#111827]">
                      {row.pan_number || (
                        <span className="text-[#9CA3AF]">
                          —
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-4 text-center">
                      {row.pan_verified === true ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-bold text-[#15803D]">
                          <FiCheck size={10} />
                          Yes
                        </span>
                      ) : row.pan_verified === false ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#FEE2E2] px-2 py-0.5 text-[10px] font-bold text-[#C23B32]">
                          No
                        </span>
                      ) : (
                        <span className="text-[#9CA3AF]">
                          —
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-4 text-[#111827]">
                      {row.bank_holder_name}
                    </td>

                    <td className="px-3 py-4 font-mono text-[#111827]">
                      {row.bank_account_number}
                    </td>

                    <td className="px-3 py-4 font-mono text-[#6B7280]">
                      {row.bank_ifsc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-5 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F4F8FD] text-[#6B7280]">
                <FiSearch size={24} />
              </div>

              <p className="mt-4 text-sm font-bold text-[#111827]">
                No commission records found
              </p>

              <p className="mt-1 text-xs text-[#6B7280]">
                Try another week, year, date range, or search
                term.
              </p>
            </div>
          )}
        </div>

        {/* FOOTER */}

        {!loading && !errorMessage && hasAppliedFilters && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-[#DCE6F2] bg-white px-5 py-4 sm:flex-row">
            <p className="text-xs text-[#6B7280]">
              Showing{" "}
              <span className="font-bold text-[#111827]">
                {filteredRows.length ? 1 : 0}
              </span>{" "}
              to{" "}
              <span className="font-bold text-[#111827]">
                {filteredRows.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-[#111827]">
                {filteredRows.length}
              </span>{" "}
              entries
            </p>

            <span className="text-xs text-[#6B7280]">
              {filteredRows.length.toLocaleString("en-IN")}{" "}
              matching record
              {filteredRows.length === 1 ? "" : "s"}
            </span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default CommissionView;
