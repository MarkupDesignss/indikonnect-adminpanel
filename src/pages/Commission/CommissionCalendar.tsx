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
    FiClock,
    FiTrendingUp,
    FiCheck,
    FiFileText,
    FiChevronLeft,
    FiChevronRight,
    FiEye,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import commissionApi from "../../api/endpoints/commissionApi";
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

interface CommissionRow {
    ba_id: string;
    distributor_name: string;
    email: string;
    week: number;
    year: number;
    gross_commission: number;
    tds_amount: number;
    net_commission: number;
    bank_holder_name: string;
    bank_account_number: string;
    bank_ifsc: string;
}

interface CommissionResponse {
    success: boolean;
    message: string;
    currency?: {
        base: string;
        display: string;
        exchange_rate: number;
    };
    filters?: { week: number; year: number };
    week_range?: { start: string; end: string };
    summary?: {
        total_distributors: number;
        total_eligible: number;
        failed_count: number;
    };
    data?: CommissionRow[];
    failed?: any[];
}

// =====================================================
// ANIMATION VARIANTS
// =====================================================
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.045 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 100, damping: 15 },
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

const formatNumber = (value: number) =>
    Number(value || 0).toLocaleString("en-IN");

const buildWeekOptions = (calendar: any): CommissionWeekOption[] => {
    if (!calendar?.months?.length) return [];
    const map = new Map<number, CommissionWeekOption>();
    calendar.months.forEach((month: any) => {
        month.weeks?.forEach((week: any) => {
            if (!map.has(week.week_no)) {
                map.set(week.week_no, {
                    week_no: week.week_no,
                    start_date: week.start_date,
                    end_date: week.end_date,
                    label: `Week ${week.week_no}`,
                });
            }
        });
    });
    return Array.from(map.values()).sort((a, b) => a.week_no - b.week_no);
};

const exportToCsv = (rows: CommissionRow[], filename: string) => {
    if (!rows.length) {
        toast.error("No data available to export.");
        return;
    }

    const headers = [
        "BA ID",
        "Distributor Name",
        "Email",
        "Week",
        "Year",
        "Gross Commission",
        "TDS Amount",
        "Net Commission",
        "Bank Holder Name",
        "Bank Account Number",
        "Bank IFSC",
    ];

    const escape = (val: any) => {
        const str = val === null || val === undefined ? "" : String(val);
        return `"${str.replace(/"/g, '""')}"`;
    };

    const csv = [
        headers.map(escape).join(","),
        ...rows.map((r) =>
            [
                r.ba_id,
                r.distributor_name,
                r.email,
                r.week,
                r.year,
                r.gross_commission,
                r.tds_amount,
                r.net_commission,
                r.bank_holder_name,
                r.bank_account_number,
                r.bank_ifsc,
            ]
                .map(escape)
                .join(","),
        ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
    value: number;
    onChange: (val: number) => void;
    disabled?: boolean;
}> = ({ options, value, onChange, disabled = false }) => {
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
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = useMemo(() => {
        if (!search) return options;
        const q = search.toLowerCase();
        return options.filter(
            (o) =>
                o.week_no.toString().includes(q) ||
                formatDate(o.start_date).toLowerCase().includes(q) ||
                formatDate(o.end_date).toLowerCase().includes(q),
        );
    }, [options, search]);

    const selectedOption = options.find((o) => o.week_no === value);

    return (
        <div className="relative w-full sm:w-[190px]" ref={dropdownRef}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-10 w-full items-center justify-between rounded-xl border border-[#D6E2F0] bg-white px-3 text-xs font-bold text-[#111827] outline-none transition hover:border-[#2D6FE8]/40 focus:border-[#2D6FE8] focus:ring-2 focus:ring-[#2D6FE8]/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <div className="flex items-center gap-1.5 truncate">
                    <FiLayers size={13} className="shrink-0 text-[#6B7280]" />
                    <span className="truncate">
                        {value === 0
                            ? "All Weeks"
                            : selectedOption
                                ? `${selectedOption.label}`
                                : "Week"}
                    </span>
                </div>
                <FiChevronDown
                    size={14}
                    className={`shrink-0 text-[#6B7280] transition-transform ${isOpen ? "rotate-180" : ""}`}
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
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-8 w-full rounded-lg bg-[#F4F8FD] pl-8 pr-3 text-xs text-[#111827] outline-none focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/15"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                        <div className="max-h-[260px] overflow-y-auto p-1 custom-scrollbar">
                            <button
                                type="button"
                                onClick={() => {
                                    onChange(0);
                                    setIsOpen(false);
                                    setSearch("");
                                }}
                                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${value === 0
                                        ? "bg-[#EAF3FF] font-bold text-[#2D6FE8]"
                                        : "text-[#111827] hover:bg-[#F4F8FD]"
                                    }`}
                            >
                                All Weeks
                                {value === 0 && <FiCheck size={14} />}
                            </button>
                            {filteredOptions.length === 0 ? (
                                <p className="px-3 py-4 text-center text-xs text-[#6B7280]">
                                    No weeks found.
                                </p>
                            ) : (
                                filteredOptions.map((opt) => (
                                    <button
                                        key={opt.week_no}
                                        type="button"
                                        onClick={() => {
                                            onChange(opt.week_no);
                                            setIsOpen(false);
                                            setSearch("");
                                        }}
                                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${value === opt.week_no
                                                ? "bg-[#EAF3FF] font-bold text-[#2D6FE8]"
                                                : "text-[#111827] hover:bg-[#F4F8FD]"
                                            }`}
                                    >
                                        <div className="flex flex-col">
                                            <span>{opt.label}</span>
                                            <span className="text-[10px] font-normal text-[#6B7280]">
                                                {formatDate(opt.start_date)} – {formatDate(opt.end_date)}
                                            </span>
                                        </div>
                                        {value === opt.week_no && (
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
        (keys: string[]) => keys.some((key) => hasPermission(key)),
        [hasPermission],
    );

    const canViewCommission = useMemo(
        () =>
            isSuperAdmin ||
            hasModuleAccess("finance") ||
            hasModuleAccess("Finance") ||
            hasAnyPermission(VIEW_PERMISSION_KEYS),
        [isSuperAdmin, hasModuleAccess, hasAnyPermission],
    );

    const canExportCommission = useMemo(
        () =>
            isSuperAdmin ||
            hasModuleAccess("finance") ||
            hasModuleAccess("Finance") ||
            hasAnyPermission(EXPORT_PERMISSION_KEYS),
        [isSuperAdmin, hasModuleAccess, hasAnyPermission],
    );

    // ===================================================
    // LOGO STATE
    // ===================================================
    const [logoUrl, setLogoUrl] = useState<string | null>(DEFAULT_LOGO_URL);
    const [logoLoading, setLogoLoading] = useState(true);

    // ===================================================
    // STATE
    // ===================================================
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedWeek, setSelectedWeek] = useState<number>(0);
    const [weekOptions, setWeekOptions] = useState<CommissionWeekOption[]>([]);
    const [search, setSearch] = useState("");
    const [data, setData] = useState<CommissionResponse | null>(null);
    const [loading, setLoading] = useState(true);
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
    // FETCH WEEK OPTIONS
    // ===================================================
    const fetchWeekOptions = useCallback(async () => {
        if (!canViewCommission) return;
        try {
            const response = await commissionApi.getCalendar(0, selectedYear);
            if (response.data?.success && response.data?.calendar) {
                setWeekOptions(buildWeekOptions(response.data.calendar));
            } else {
                setWeekOptions([]);
            }
        } catch (error: any) {
            console.error("Week options API error:", error);
            setWeekOptions([]);
        }
    }, [selectedYear, canViewCommission]);

    // ===================================================
    // FETCH COMMISSION DATA
    // ===================================================
    const fetchCommission = useCallback(
        async (isRefresh = false) => {
            if (!canViewCommission) return;
            const requestId = ++requestIdRef.current;
            try {
                setErrorMessage("");
                if (isRefresh) setRefreshing(true);
                else setLoading(true);

                const response = await commissionApi.getCalendar(
                    selectedWeek,
                    selectedYear,
                );

                if (requestId !== requestIdRef.current) return;

                if (response.data?.success) {
                    setData(response.data);
                } else {
                    const message =
                        response.data?.message || "Unable to fetch commission data.";
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
        [selectedWeek, selectedYear, canViewCommission],
    );

    // ===================================================
    // EFFECTS
    // ===================================================
    useEffect(() => {
        if (permissionsLoading) return;
        if (canViewCommission) {
            void fetchWeekOptions();
        }
    }, [selectedYear, permissionsLoading, canViewCommission, fetchWeekOptions]);

    useEffect(() => {
        if (permissionsLoading) return;
        if (canViewCommission) {
            void fetchCommission();
        } else {
            setLoading(false);
        }
        return () => {
            requestIdRef.current += 1;
        };
    }, [fetchCommission, permissionsLoading, canViewCommission]);

    // ===================================================
    // COMBINED INITIAL LOADING
    // ===================================================
    const pageLoading = permissionsLoading || logoLoading;

    const rows = useMemo(() => data?.data || [], [data]);

    const filteredRows = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return rows;
        return rows.filter((row) =>
            [
                row.ba_id,
                row.distributor_name,
                row.email,
                row.bank_ifsc,
                row.bank_holder_name,
                String(row.week),
            ]
                .join(" ")
                .toLowerCase()
                .includes(query),
        );
    }, [rows, search]);

    const yearOptions = useMemo(
        () => Array.from({ length: 7 }, (_, i) => currentYear - 3 + i),
        [currentYear],
    );

    const handleYearChange = (value: string) => {
        const nextYear = Number(value);
        if (Number.isInteger(nextYear) && nextYear !== selectedYear) {
            setSelectedYear(nextYear);
            setSelectedWeek(0);
            setSearch("");
            setData(null);
            setWeekOptions([]);
        }
    };

    const handleWeekChange = (value: number) => {
        setSelectedWeek(value);
        setData(null);
    };

    const handleRefresh = () => {
        if (!canViewCommission) {
            toast.error("You do not have permission to view commission data.");
            return;
        }
        void fetchCommission(true);
    };

    const handleDownloadCsv = () => {
        if (!canExportCommission) {
            toast.error("You do not have permission to export commission data.");
            return;
        }
        const weekPart = selectedWeek === 0 ? "all-weeks" : `week-${selectedWeek}`;
        exportToCsv(filteredRows, `commission-${weekPart}-${selectedYear}.csv`);
    };

    // ===================================================
    // RENDER GUARDS
    // ===================================================
    if (pageLoading) {
        return <PermissionLoadingState logoUrl={logoUrl} />;
    }

    if (!canViewCommission) {
        return <AccessDeniedState />;
    }

    return (
        <motion.div
            className="min-h-screen p-4 font-poppins sm:p-6 "
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* HEADER — title left, refresh right */}
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
                        Filter by week and year, then export the results to CSV.
                    </p>
                </div>

                {/* REFRESH BUTTON — right side of header */}
                <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={loading || refreshing}
                    className="flex h-10 items-center justify-center gap-1.5 self-start rounded-xl border border-[#D6E2F0] bg-white px-4 text-xs font-bold text-[#111827] shadow-sm transition hover:border-[#2D6FE8]/35 hover:bg-[#F4F8FD] disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
                >
                    <FiRefreshCw
                        size={14}
                        className={`text-[#2D6FE8] ${loading || refreshing ? "animate-spin" : ""}`}
                    />
                    Refresh
                </button>
            </motion.div>

            {/* WEEK RANGE BANNER (If needed) */}
            {!loading && data?.week_range && (
                <motion.div
                    variants={itemVariants}
                    className="mb-6 flex flex-col justify-between gap-3 rounded-2xl border border-[#2D6FE8]/25 bg-white p-4 sm:flex-row sm:items-center sm:p-5 shadow-sm"
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
                                {selectedWeek === 0 ? "All Weeks" : `Week ${selectedWeek}`} •{" "}
                                {selectedYear}
                            </h2>
                            <p className="mt-0.5 text-xs text-[#6B7280]">
                                {formatDate(data.week_range.start)} –{" "}
                                {formatDate(data.week_range.end)}
                            </p>
                        </div>
                    </div>
                 
                </motion.div>
            )}

            {/* MAIN CONTENT AREA (Search + Table + Footer merged into one Card look) */}
            <motion.div
                variants={itemVariants}
                className="flex flex-col rounded-2xl border border-[#DCE6F2] bg-white shadow-sm overflow-hidden"
            >
                {/* SEARCH + YEAR + WEEK + EXPORT */}
                <div className="flex flex-col gap-3 border-b border-[#DCE6F2] p-4 lg:flex-row lg:items-center lg:justify-between bg-white">
                    {/* SEARCH INPUT - LEFT */}
                    <div className="relative w-full lg:max-w-[380px]">
                        <FiSearch
                            size={17}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280]"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search BA ID, name, email, IFSC..."
                            className="h-10 w-full rounded-xl border border-[#D6E2F0] bg-[#F8FBFF] pl-10 pr-10 text-sm text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/15"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6B7280] hover:text-[#111827]"
                                aria-label="Clear search"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* CONTROLS - RIGHT */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* YEAR SELECT */}
                        <div className="relative w-[110px]">
                            <FiCalendar
                                size={14}
                                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B7280]"
                            />
                            <select
                                value={selectedYear}
                                onChange={(event) => handleYearChange(event.target.value)}
                                className="h-10 w-full appearance-none rounded-xl border border-[#D6E2F0] bg-white pl-8 pr-7 text-xs font-bold text-[#111827] outline-none transition hover:border-[#2D6FE8]/40 focus:border-[#2D6FE8] focus:ring-2 focus:ring-[#2D6FE8]/15"
                                aria-label="Select year"
                            >
                                {yearOptions.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                            <FiChevronDown
                                size={13}
                                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280]"
                            />
                        </div>

                        {/* CUSTOM WEEK DROPDOWN */}
                        <WeekDropdown
                            options={weekOptions}
                            value={selectedWeek}
                            onChange={handleWeekChange}
                            disabled={!canViewCommission}
                        />

                        {/* EXPORT CSV BUTTON */}
                        {canExportCommission && (
                            <button
                                type="button"
                                onClick={handleDownloadCsv}
                                disabled={loading || !filteredRows.length}
                                className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#2D6FE8] px-3.5 text-xs font-bold text-white shadow-md shadow-[#2D6FE8]/20 transition hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <FiDownload size={14} />
                                Export CSV
                            </button>
                        )}
                    </div>
                </div>

                {/* TABLE CONTENT */}
                <div className="relative overflow-x-auto">
                    {loading ? (
                        <div className="flex min-h-[300px] flex-col items-center justify-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                                <FiRefreshCw size={24} className="animate-spin" />
                            </div>
                            <p className="mt-4 text-sm font-bold text-[#111827]">
                                Loading commission data...
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
                            <p className="mt-1 max-w-lg text-xs text-[#6B7280]">{errorMessage}</p>
                        </div>
                    ) : filteredRows.length > 0 ? (
                        <table className="min-w-full text-left text-xs whitespace-nowrap">
                            <thead className="bg-[#4F8FF7] text-[11px] tracking-wide text-white">
                                <tr>
                                    <th className="px-5 py-4 font-semibold text-center w-16">S.No</th>
                                    <th className="px-5 py-4 font-semibold">BA ID</th>
                                    <th className="px-5 py-4 font-semibold">Distributor</th>
                                    <th className="px-5 py-4 font-semibold">Email</th>
                                    <th className="px-5 py-4 font-semibold text-center">Week</th>
                                    <th className="px-5 py-4 font-semibold text-right">Gross (₹)</th>
                                    <th className="px-5 py-4 font-semibold text-right">TDS (₹)</th>
                                    <th className="px-5 py-4 font-semibold text-right">Net (₹)</th>
                                    <th className="px-5 py-4 font-semibold">Bank Holder</th>
                                    <th className="px-5 py-4 font-semibold">Account</th>
                                    <th className="px-5 py-4 font-semibold">IFSC</th>
                                    <th className="px-5 py-4 font-semibold text-center w-20">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E9EFF7]">
                                {filteredRows.map((row, index) => (
                                    <tr
                                        key={`${row.ba_id}-${row.week}-${index}`}
                                        className="transition hover:bg-[#F8FBFF]"
                                    >
                                        <td className="px-5 py-4 text-center font-bold text-[#6B7280]">
                                            {index + 1}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex rounded bg-[#EAF3FF] px-2 py-1 text-[11px] font-bold text-[#2D6FE8]">
                                                {row.ba_id}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 font-medium text-[#111827]">
                                            {row.distributor_name}
                                        </td>
                                        <td className="px-5 py-4 text-[#6B7280]">
                                            {row.email}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className="inline-flex items-center justify-center rounded-full bg-[#F4F8FD] px-2.5 py-1 text-[10px] font-bold text-[#2D6FE8]">
                                                W{row.week}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right font-medium tabular-nums text-[#111827]">
                                            {formatNumber(row.gross_commission)}
                                        </td>
                                        <td className="px-5 py-4 text-right font-medium tabular-nums text-[#C23B32]">
                                            {formatNumber(row.tds_amount)}
                                        </td>
                                        <td className="px-5 py-4 text-right font-bold tabular-nums text-[#168653]">
                                            {formatNumber(row.net_commission)}
                                        </td>
                                        <td className="px-5 py-4 text-[#111827]">
                                            {row.bank_holder_name}
                                        </td>
                                        <td className="px-5 py-4 font-mono text-[#6B7280]">
                                            •••• {String(row.bank_account_number).slice(-4)}
                                        </td>
                                        <td className="px-5 py-4 font-mono text-[#6B7280]">
                                            {row.bank_ifsc}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <button className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#DCE6F2] text-[#4F8FF7] hover:bg-[#EAF3FF]">
                                                <FiEye size={14} />
                                            </button>
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
                                Try another week, year, or search term.
                            </p>
                        </div>
                    )}
                </div>

                {/* FOOTER (Showing X of Y & Pagination) */}
                {!loading && !errorMessage && (
                    <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#DCE6F2] bg-white px-5 py-4 gap-4">
                        <p className="text-xs text-[#6B7280]">
                            Showing <span className="font-bold text-[#111827]">{filteredRows.length === 0 ? 0 : 1}</span> to <span className="font-bold text-[#111827]">{filteredRows.length}</span> of <span className="font-bold text-[#111827]">{filteredRows.length}</span> entries
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button className="flex h-7 w-7 items-center justify-center rounded border border-[#DCE6F2] text-[#6B7280] hover:bg-[#F4F8FD] disabled:opacity-50" disabled>
                                <FiChevronLeft size={14} />
                            </button>
                            <button className="flex h-7 w-7 items-center justify-center rounded bg-[#4F8FF7] text-xs font-bold text-white">
                                1
                            </button>
                            <button className="flex h-7 w-7 items-center justify-center rounded border border-[#DCE6F2] text-[#6B7280] hover:bg-[#F4F8FD] disabled:opacity-50" disabled>
                                <FiChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default CommissionView;