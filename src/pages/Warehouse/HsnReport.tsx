"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  RefreshCw,
  Download,
  FileText,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  Loader2,
  ShieldAlert,
  Receipt,
  Wallet,
  Package,
  CreditCard,
  FileSpreadsheet,
} from "lucide-react";

import { toast } from "react-hot-toast";
import ExcelJS from "exceljs";

import hsnReportApi, {
  HsnReportItem,
  HsnReportMeta,
} from "../../api/endpoints/report/hsnReport";

import { usePermissions } from "../../pages/permissions/usePermissions";
import logoApi from "../../api/endpoints/logoApi";
import PermissionLoadingState from "@/components/common/PermissionLoadingState";

/* ================= THEME ================= */

const THEME = {
  primary: "#2D6FE8",
  primaryDark: "#1E40AF",
  primarySoft: "#EAF3FF",
  background: "#F4F8FD",
  border: "#DCE6F2",
  green: "#15803D",
  greenSoft: "#DCFCE7",
  orange: "#C2410C",
  orangeSoft: "#FFEDD5",
  purple: "#6D28D9",
  purpleSoft: "#EDE9FE",
  red: "#C23B32",
  redSoft: "#FEE2E2",
};

const DEFAULT_LOGO_URL =
  "https://www.markupdesigns.net/indikonnect/storage/logos/MmVFOudCiVU3Y8C0sf2gEEXna5jSKroCDj8xYMo0.png";

const PER_PAGE = 100;

/* ================= TYPES ================= */

type RegistrationType = "registered" | "unregistered";

interface HsnReportRow extends HsnReportItem {
  registrationType: RegistrationType;
}

type HsnSummary = {
  records: number;
  uniqueHsn: number;
  quantity: number;
  totalValue: number;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  totalTax: number;
};

type ExportRow = (string | number)[];

/* ================= HELPERS ================= */

const numberValue = (
  value: number | string | null | undefined,
): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const money = (
  value: number | string | null | undefined,
) =>
  `₹${numberValue(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatNumber = (
  value: number | string | null | undefined,
) =>
  numberValue(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

const formatRate = (
  value: number | string | null | undefined,
) => `${formatNumber(value)}%`;

const valueOrDash = (value: unknown) =>
  value === null || value === undefined || value === ""
    ? "—"
    : String(value);

const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";

  const parsed = new Date(value.replace(" ", "T"));

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateInput = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;

const getTotalTax = (item: HsnReportItem) =>
  roundMoney(
    numberValue(item.integrated_tax_amount) +
      numberValue(item.central_tax_amount) +
      numberValue(item.state_ut_tax_amount) +
      numberValue(item.cess_amount),
  );

const getHsnRows = (
  data: {
    registered: HsnReportItem[];
    unregistered: HsnReportItem[];
  },
): HsnReportRow[] => [
  ...(Array.isArray(data.registered)
    ? data.registered.map((item) => ({
        ...item,
        registrationType: "registered" as const,
      }))
    : []),

  ...(Array.isArray(data.unregistered)
    ? data.unregistered.map((item) => ({
        ...item,
        registrationType: "unregistered" as const,
      }))
    : []),
];

const summarizeHsn = (items: HsnReportRow[]): HsnSummary => {
  const sum = (
    selector: (item: HsnReportRow) => number,
  ) =>
    roundMoney(
      items.reduce((total, item) => total + selector(item), 0),
    );

  return {
    records: items.length,

    uniqueHsn: new Set(
      items.map((item) => String(item.hsn || "").trim()).filter(Boolean),
    ).size,

    quantity: sum((item) => numberValue(item.total_quantity)),

    totalValue: sum((item) => numberValue(item.total_value)),

    taxableValue: sum((item) => numberValue(item.taxable_value)),

    igst: sum((item) => numberValue(item.integrated_tax_amount)),

    cgst: sum((item) => numberValue(item.central_tax_amount)),

    sgst: sum((item) => numberValue(item.state_ut_tax_amount)),

    cess: sum((item) => numberValue(item.cess_amount)),

    totalTax: sum((item) => getTotalTax(item)),
  };
};

/* ================= EXCEL / CSV MAPPING ================= */

const HSN_HEADERS = [
  "Registration Type",
  "Item Name",
  "HSN Code",
  "UQC",
  "Total Quantity",
  "Rate (%)",
  "Taxable Value",
  "Integrated Tax (IGST)",
  "Central Tax (CGST)",
  "State / UT Tax (SGST)",
  "Cess Amount",
  "Total Tax",
  "Total Value",
];

const buildHsnExportRows = (
  items: HsnReportRow[],
): ExportRow[] =>
  items.map((item) => [
    item.registrationType === "registered"
      ? "Registered"
      : "Unregistered",

    item.item_name || "",
    item.hsn || "",
    item.uqc || "",

    numberValue(item.total_quantity),
    numberValue(item.rate),
    numberValue(item.taxable_value),

    numberValue(item.integrated_tax_amount),
    numberValue(item.central_tax_amount),
    numberValue(item.state_ut_tax_amount),
    numberValue(item.cess_amount),

    getTotalTax(item),
    numberValue(item.total_value),
  ]);

const HSN_MONEY_COLUMNS = [
  "Taxable Value",
  "Integrated Tax (IGST)",
  "Central Tax (CGST)",
  "State / UT Tax (SGST)",
  "Cess Amount",
  "Total Tax",
  "Total Value",
];

const HSN_TOTAL_COLUMNS = [
  "Total Quantity",
  "Taxable Value",
  "Integrated Tax (IGST)",
  "Central Tax (CGST)",
  "State / UT Tax (SGST)",
  "Cess Amount",
  "Total Tax",
  "Total Value",
];

const csvCell = (value: unknown): string => {
  let text = value == null ? "" : String(value);

  // Prevent spreadsheet formula execution for text values.
  if (
    typeof value === "string" &&
    /^\s*[=+@-]/.test(text)
  ) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
};

const downloadBlob = (
  blob: Blob,
  filename: string,
) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
};

/* ================= SUMMARY CARD ================= */

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  bg,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-600">
          {title}
        </p>

        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ background: bg, color }}
        >
          <Icon size={18} />
        </div>
      </div>

      <h3 className="mt-2 break-words text-xl font-bold tracking-tight text-slate-900 tabular-nums sm:text-2xl">
        {value}
      </h3>

      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        {subtitle}
      </p>
    </div>
  );
}

/* ================= REGISTRATION BADGE ================= */

function RegistrationBadge({
  type,
}: {
  type: RegistrationType;
}) {
  const registered = type === "registered";

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold"
      style={{
        background: registered
          ? THEME.greenSoft
          : THEME.purpleSoft,
        color: registered
          ? THEME.green
          : THEME.purple,
      }}
    >
      {registered ? "Registered" : "Unregistered"}
    </span>
  );
}

/* ================= TAX DETAILS ================= */

function TaxBreakdownDetails({
  item,
}: {
  item: HsnReportItem;
}) {
  const taxItems = [
    ["IGST", item.integrated_tax_amount],
    ["CGST", item.central_tax_amount],
    ["SGST / UTGST", item.state_ut_tax_amount],
    ["Cess", item.cess_amount],
  ] as const;

  return (
    <div className="min-w-0 space-y-1.5">
      {taxItems.map(([label, amount]) => (
        <div
          key={label}
          className="flex items-center justify-between gap-2"
        >
          <span className="text-xs text-gray-500">
            {label}
          </span>

          <span className="break-words text-right text-xs font-semibold text-gray-700">
            {money(amount)}
          </span>
        </div>
      ))}

      <div className="flex items-center justify-between gap-2 border-t border-[#E8EEF6] pt-1.5">
        <span className="text-xs font-bold text-gray-700">
          Total Tax
        </span>

        <span className="break-words text-right text-xs font-bold text-[#1E40AF]">
          {money(getTotalTax(item))}
        </span>
      </div>
    </div>
  );
}

/* ================= MAIN COMPONENT ================= */

const HsnReport = () => {
    
    const {
        hasPermission,
        isSuperAdmin,
        loading: permissionsLoading,
      } = usePermissions();
      

  /* ================= PERMISSIONS ================= */

  const canViewReport = useMemo(() => {
    if (isSuperAdmin) return true;
  
    return hasPermission("hsn-report.view");
  }, [isSuperAdmin, hasPermission]);
  
  const canExport = useMemo(() => {
    if (isSuperAdmin) return true;
  
    return hasPermission("hsn-report.export");
  }, [isSuperAdmin, hasPermission]);
  /* ================= LOGO ================= */

  const [logoUrl, setLogoUrl] = useState<string | null>(
    DEFAULT_LOGO_URL,
  );

  const [logoLoading, setLogoLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadLogo = async () => {
      try {
        const response: any = await logoApi.getLogo();

        const candidates = [
          response?.data?.data?.logo,
          response?.data?.logo,
          response?.data?.data?.data?.logo,
          response?.data?.data?.logo_url,
          response?.data?.logo_url,
          response?.logo,
        ];

        const found = candidates.find(
          (value) =>
            typeof value === "string" &&
            /^https?:\/\//i.test(value.trim()),
        );

        if (!cancelled && found) {
          setLogoUrl(found.trim());
        }
      } catch (error) {
        console.error("Logo API error:", error);
      } finally {
        if (!cancelled) {
          setLogoLoading(false);
        }
      }
    };

    void loadLogo();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ================= REPORT STATE ================= */

  const [reports, setReports] = useState<HsnReportRow[]>([]);

  const [meta, setMeta] = useState<HsnReportMeta | null>(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [exporting, setExporting] = useState(false);

  const [exportingCsv, setExportingCsv] = useState(false);

  const [search, setSearch] = useState("");

  const [gstFilter, setGstFilter] = useState<
    "all" | "registered" | "unregistered"
  >("all");

  const [fromDate, setFromDate] = useState("");

  const [toDate, setToDate] = useState("");

  const [appliedDates, setAppliedDates] = useState({
    fromDate: "",
    toDate: "",
  });

  const [currentPage, setCurrentPage] = useState(1);

  /* ================= FETCH REPORT ================= */

  const fetchReports = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const response = await hsnReportApi.getAll({
          from_date: appliedDates.fromDate || undefined,
          to_date: appliedDates.toDate || undefined,
        });

        if (response.success) {
          const registered = Array.isArray(
            response.data?.registered,
          )
            ? response.data.registered
            : [];

          const unregistered = Array.isArray(
            response.data?.unregistered,
          )
            ? response.data.unregistered
            : [];

          setReports(
            getHsnRows({
              registered,
              unregistered,
            }),
          );

          setMeta(response.meta ?? null);
        } else {
          setReports([]);
          setMeta(null);

          toast.error(
            response.message || "Unable to fetch HSN report",
          );
        }
      } catch (error: any) {
        console.error("HSN report error:", error);

        toast.error(
          error?.response?.data?.message ||
            "Failed to fetch HSN report",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [appliedDates],
  );

  useEffect(() => {
    if (permissionsLoading) return;

    if (!canViewReport) {
      setLoading(false);
      return;
    }

    void fetchReports(true);
  }, [permissionsLoading, canViewReport, fetchReports]);

  /* ================= SEARCH & FILTER ================= */

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reports.filter((item) => {
      const searchable = [
        item.item_name,
        item.hsn,
        item.uqc,
        item.rate,
        item.total_quantity,
        item.registrationType,
      ];

      const matchesSearch =
        !query ||
        searchable.some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(query),
        );

      const matchesRegistration =
        gstFilter === "all" ||
        item.registrationType === gstFilter;

      return matchesSearch && matchesRegistration;
    });
  }, [reports, search, gstFilter]);

  /* ================= PAGINATION ================= */

  const totalRecords = filteredReports.length;

  const lastPage = Math.max(
    1,
    Math.ceil(totalRecords / PER_PAGE),
  );

  const displayPage = Math.min(currentPage, lastPage);

  useEffect(() => {
    if (currentPage > lastPage) {
      setCurrentPage(lastPage);
    }
  }, [currentPage, lastPage]);

  const pageReports = useMemo(
    () =>
      filteredReports.slice(
        (displayPage - 1) * PER_PAGE,
        displayPage * PER_PAGE,
      ),
    [filteredReports, displayPage],
  );

  const startRecord =
    totalRecords === 0
      ? 0
      : (displayPage - 1) * PER_PAGE + 1;

  const endRecord = Math.min(
    displayPage * PER_PAGE,
    totalRecords,
  );

  /* ================= SUMMARY ================= */

  const summary = useMemo(
    () => summarizeHsn(filteredReports),
    [filteredReports],
  );

  const pageSummary = useMemo(
    () => summarizeHsn(pageReports),
    [pageReports],
  );

  const registeredSummary = useMemo(
    () =>
      summarizeHsn(
        filteredReports.filter(
          (item) => item.registrationType === "registered",
        ),
      ),
    [filteredReports],
  );

  const unregisteredSummary = useMemo(
    () =>
      summarizeHsn(
        filteredReports.filter(
          (item) => item.registrationType === "unregistered",
        ),
      ),
    [filteredReports],
  );

  /* ================= APPLY / CLEAR FILTERS ================= */

  const applyFilters = () => {
    if (fromDate && toDate && fromDate > toDate) {
      toast.error("From date cannot be greater than To date");
      return;
    }

    setCurrentPage(1);

    setAppliedDates({
      fromDate,
      toDate,
    });
  };

  const clearFilters = () => {
    setSearch("");
    setGstFilter("all");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);

    setAppliedDates({
      fromDate: "",
      toDate: "",
    });
  };

  /* ================= EXCEL EXPORT ================= */

  const exportExcel = async () => {
    if (!canExport) {
      toast.error(
        "You don't have permission to export this report.",
      );
      return;
    }

    if (exporting || exportingCsv) return;

    setExporting(true);

    try {
      const exportItems = filteredReports;

      if (!exportItems.length) {
        toast.error("No HSN records available to export");
        return;
      }

      const rows = buildHsnExportRows(exportItems);

      const workbook = new ExcelJS.Workbook();

      workbook.creator = "IndieKonnect";
      workbook.created = new Date();

      const sheet = workbook.addWorksheet("HSN Report", {
        views: [
          {
            state: "frozen",
            xSplit: 2,
            ySplit: 1,
            showGridLines: false,
          },
        ],
        properties: {
          defaultRowHeight: 25,
        },
      });

      const widths = [
        19,
        34,
        16,
        18,
        17,
        13,
        21,
        24,
        23,
        24,
        17,
        19,
        21,
      ];

      sheet.columns = HSN_HEADERS.map((heading, index) => ({
        header: heading,
        key: `column_${index}`,
        width: widths[index] || 18,
      }));

      const header = sheet.getRow(1);
      header.height = 40;

      header.eachCell((cell) => {
        cell.font = {
          name: "Calibri",
          size: 11,
          bold: true,
          color: {
            argb: "FFFFFFFF",
          },
        };

        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: "FF173B63",
          },
        };

        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };

        cell.border = {
          top: {
            style: "thin",
            color: { argb: "FF9FB5CA" },
          },
          bottom: {
            style: "thin",
            color: { argb: "FF9FB5CA" },
          },
          left: {
            style: "thin",
            color: { argb: "FF9FB5CA" },
          },
          right: {
            style: "thin",
            color: { argb: "FF9FB5CA" },
          },
        };
      });

      rows.forEach((values, index) => {
        const row = sheet.addRow(values);

        row.height = 28;

        HSN_HEADERS.forEach((heading, columnIndex) => {
          const cell = row.getCell(columnIndex + 1);

          cell.font = {
            name: "Calibri",
            size: 11,
            color: {
              argb: "FF253C52",
            },
          };

          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: {
              argb:
                index % 2 === 0
                  ? "FFFFFFFF"
                  : "FFF2F6FA",
            },
          };

          cell.alignment = {
            vertical: "middle",
            horizontal:
              columnIndex >= 4 ? "right" : "left",
            wrapText: true,
            indent: 1,
          };

          cell.border = {
            top: {
              style: "thin",
              color: { argb: "FFD3DFEB" },
            },
            bottom: {
              style: "thin",
              color: { argb: "FFD3DFEB" },
            },
            left: {
              style: "thin",
              color: { argb: "FFD3DFEB" },
            },
            right: {
              style: "thin",
              color: { argb: "FFD3DFEB" },
            },
          };

          if (columnIndex === 2 || columnIndex === 3) {
            cell.numFmt = "@";
          } else if (columnIndex === 4) {
            cell.numFmt = "#,##0.##";
          } else if (columnIndex === 5) {
            cell.numFmt = '0.##"%"';
          } else if (
            HSN_MONEY_COLUMNS.includes(heading)
          ) {
            cell.numFmt = "#,##0.00;[Red](#,##0.00);0.00";
          }
        });
      });

      const lastDataRow = rows.length + 1;

      sheet.autoFilter = {
        from: {
          row: 1,
          column: 1,
        },
        to: {
          row: lastDataRow,
          column: HSN_HEADERS.length,
        },
      };

      /* GRAND TOTAL */

      const totals = summarizeHsn(exportItems);

      const footer = sheet.addRow([]);

      footer.height = 38;

      footer.getCell(1).value = "GRAND TOTAL";

      const totalMap: Record<string, number> = {
        "Total Quantity": totals.quantity,
        "Taxable Value": totals.taxableValue,
        "Integrated Tax (IGST)": totals.igst,
        "Central Tax (CGST)": totals.cgst,
        "State / UT Tax (SGST)": totals.sgst,
        "Cess Amount": totals.cess,
        "Total Tax": totals.totalTax,
        "Total Value": totals.totalValue,
      };

      HSN_HEADERS.forEach((heading, index) => {
        const cell = footer.getCell(index + 1);

        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: "FFDCEEFF",
          },
        };

        cell.font = {
          name: "Calibri",
          size: 12,
          bold: true,
          color: {
            argb: "FF173B63",
          },
        };

        cell.alignment = {
          horizontal: index >= 4 ? "right" : "left",
          vertical: "middle",
          indent: 1,
        };

        cell.border = {
          top: {
            style: "thin",
            color: { argb: "FF9FB5CA" },
          },
          bottom: {
            style: "thin",
            color: { argb: "FF9FB5CA" },
          },
        };

        if (heading in totalMap) {
          cell.value = totalMap[heading];
          cell.numFmt =
            heading === "Total Quantity"
              ? "#,##0.##"
              : "#,##0.00";
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([new Uint8Array(buffer)], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      downloadBlob(
        blob,
        `hsn-report-${formatDateInput(new Date())}.xlsx`,
      );

      toast.success("HSN Report exported successfully");
    } catch (error) {
      console.error("HSN Excel export error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to export HSN Report",
      );
    } finally {
      setExporting(false);
    }
  };

  /* ================= CSV EXPORT ================= */

  const exportCsv = async () => {
    if (!canExport) {
      toast.error(
        "You don't have permission to export this report.",
      );
      return;
    }

    if (exporting || exportingCsv) return;

    setExportingCsv(true);

    try {
      const exportItems = filteredReports;

      if (!exportItems.length) {
        toast.error("No HSN records available to export");
        return;
      }

      const rows = buildHsnExportRows(exportItems);

      const csv = [HSN_HEADERS, ...rows]
        .map((row) => row.map(csvCell).join(","))
        .join("\r\n");

      const blob = new Blob(["\uFEFF", csv], {
        type: "text/csv;charset=utf-8;",
      });

      downloadBlob(
        blob,
        `hsn-report-${formatDateInput(new Date())}.csv`,
      );

      toast.success("HSN Report CSV exported successfully");
    } catch (error) {
      console.error("HSN CSV export error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to export HSN CSV",
      );
    } finally {
      setExportingCsv(false);
    }
  };

  /* ================= LOADING / PERMISSION ================= */

  const pageLoading = permissionsLoading || logoLoading;

  if (pageLoading) {
    return <PermissionLoadingState logoUrl={logoUrl} />;
  }

  if (!canViewReport) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#F4F8FD] p-4">
        <div className="max-w-md rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-lg">
          <ShieldAlert
            size={28}
            className="mx-auto mb-4 text-[#C23B32]"
          />

          <h2 className="text-lg font-bold text-gray-900">
            Access Denied
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            You don't have permission to view the HSN Report.
          </p>
        </div>
      </div>
    );
  }

  /* ================= MAIN UI ================= */

  return (
    <div
      className="min-h-screen space-y-5 p-3 sm:p-5 lg:p-6"
      style={{
        background: THEME.background,
      }}
    >
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#2D6FE8]">
            <span>Reports</span>
            <ChevronRight size={13} />
            <span>HSN Report</span>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
            HSN Report
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            HSN-wise summary of registered and unregistered sales,
            taxable values and GST amounts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchReports(false)}
            disabled={refreshing || loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#DCE6F2] bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw
              size={15}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>

          {canExport && (
            <button
              type="button"
              onClick={() => void exportCsv()}
              disabled={
                exporting ||
                exportingCsv ||
                loading ||
                refreshing
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#DCE6F2] bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exportingCsv ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <FileText size={16} />
              )}

              {exportingCsv ? "Exporting CSV..." : "Export CSV"}
            </button>
          )}

          {canExport && (
            <button
              type="button"
              onClick={() => void exportExcel()}
              disabled={
                exporting ||
                exportingCsv ||
                loading ||
                refreshing
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2D6FE8] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exporting ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Download size={16} />
              )}

              {exporting ? "Exporting..." : "Export Excel"}
            </button>
          )}
        </div>
      </div>

      {/* API META */}

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#DCE6F2] bg-white p-3 shadow-sm">
        <span className="text-xs font-semibold text-slate-600">
          Supplier State:
        </span>

        <span className="rounded-full bg-[#EAF3FF] px-3 py-1 text-xs font-semibold text-[#1E40AF]">
          {valueOrDash(meta?.supplier_state)}
        </span>

        <span className="ml-1 text-xs font-semibold text-slate-600">
          Included Order Statuses:
        </span>

        {meta?.statuses?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {meta.statuses.map((status) => (
              <span
                key={status}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold capitalize text-slate-600"
              >
                {status.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-slate-400">
            —
          </span>
        )}
      </div>

      {/* EXECUTIVE SUMMARY */}

      <section
        className="space-y-3"
        aria-label="HSN financial summary"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              HSN Sales Overview
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              All matching HSN records · INR
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
            {summary.records.toLocaleString("en-IN")} records
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="min-w-0 rounded-xl border border-[#BBDCFB] bg-[#EAF3FF] p-4 text-[#173B63] shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-[#315B86]">
                Total Value
              </p>

              <div className="rounded-lg bg-[#D5E9FF] p-2">
                <Wallet size={18} />
              </div>
            </div>

            <p className="mt-2 break-words text-2xl font-bold tracking-tight tabular-nums">
              {money(summary.totalValue)}
            </p>

            <p className="mt-1 text-xs text-[#315B86]">
              Total invoice value including tax
            </p>
          </div>

          <SummaryCard
            title="Taxable Value"
            value={money(summary.taxableValue)}
            subtitle="Total taxable value before GST"
            icon={Receipt}
            color="#2D6FE8"
            bg="#EAF3FF"
          />

          <SummaryCard
            title="Total Tax"
            value={money(summary.totalTax)}
            subtitle="IGST + CGST + SGST + Cess"
            icon={CreditCard}
            color="#6D28D9"
            bg="#EDE9FE"
          />

          <SummaryCard
            title="Total Quantity"
            value={formatNumber(summary.quantity)}
            subtitle={`${summary.uniqueHsn} unique HSN codes`}
            icon={Package}
            color="#15803D"
            bg="#DCFCE7"
          />
        </div>

        {/* REGISTRATION BREAKDOWN */}

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Registered Sales
              </h3>

              <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                {registeredSummary.records} Records
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-500">
                  Total Value
                </p>

                <p className="mt-1 break-words text-sm font-bold text-slate-900">
                  {money(registeredSummary.totalValue)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Taxable Value
                </p>

                <p className="mt-1 break-words text-sm font-bold text-slate-900">
                  {money(registeredSummary.taxableValue)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Total Tax
                </p>

                <p className="mt-1 break-words text-sm font-bold text-slate-900">
                  {money(registeredSummary.totalTax)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Quantity
                </p>

                <p className="mt-1 text-sm font-bold text-slate-900">
                  {formatNumber(registeredSummary.quantity)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Unregistered Sales
              </h3>

              <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700">
                {unregisteredSummary.records} Records
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-500">
                  Total Value
                </p>

                <p className="mt-1 break-words text-sm font-bold text-slate-900">
                  {money(unregisteredSummary.totalValue)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Taxable Value
                </p>

                <p className="mt-1 break-words text-sm font-bold text-slate-900">
                  {money(unregisteredSummary.taxableValue)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Total Tax
                </p>

                <p className="mt-1 break-words text-sm font-bold text-slate-900">
                  {money(unregisteredSummary.totalTax)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Quantity
                </p>

                <p className="mt-1 text-sm font-bold text-slate-900">
                  {formatNumber(unregisteredSummary.quantity)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* GST BREAKDOWN */}

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">
            GST Breakdown
          </h3>

          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["IGST", summary.igst],
              ["CGST", summary.cgst],
              ["SGST / UTGST", summary.sgst],
              ["Cess", summary.cess],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <p className="text-xs text-slate-500">
                  {label}
                </p>

                <p className="mt-1 break-words text-sm font-bold text-slate-900 tabular-nums">
                  {money(value as number)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEARCH & FILTERS */}

      <div className="rounded-xl border border-[#DCE6F2] bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Filter
            size={17}
            className="text-[#2D6FE8]"
          />

          <h2 className="text-sm font-bold text-gray-800">
            Search & Filters
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_1fr_1fr_1fr_auto]">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search item name, HSN, UQC..."
              className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white pl-9 pr-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-[#2D6FE8] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            aria-label="GST registration filter"
            value={gstFilter}
            onChange={(event) => {
              setGstFilter(
                event.target.value as
                  | "all"
                  | "registered"
                  | "unregistered",
              );

              setCurrentPage(1);
            }}
            className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#2D6FE8]"
          >
            <option value="all">All GST Types</option>
            <option value="registered">Registered</option>
            <option value="unregistered">Unregistered</option>
          </select>

          <div className="relative">
            <CalendarDays
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="date"
              value={fromDate}
              onChange={(event) =>
                setFromDate(event.target.value)
              }
              className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white pl-9 pr-2 text-sm text-gray-700 outline-none focus:border-[#2D6FE8]"
            />
          </div>

          <div className="relative">
            <CalendarDays
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="date"
              value={toDate}
              onChange={(event) =>
                setToDate(event.target.value)
              }
              className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white pl-9 pr-2 text-sm text-gray-700 outline-none focus:border-[#2D6FE8]"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={applyFilters}
              disabled={loading || refreshing}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#2D6FE8] px-4 text-sm font-semibold text-white hover:bg-[#1E40AF] disabled:opacity-60"
            >
              <Filter size={15} />
              Apply
            </button>

            <button
              type="button"
              onClick={clearFilters}
              title="Clear filters"
              className="flex h-10 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white px-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-red-500"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* HSN RECORDS */}

      <div className="overflow-hidden rounded-xl border border-[#DCE6F2] bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-[#DCE6F2] p-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              HSN Records
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              HSN-wise item quantity, taxable value and GST details.
            </p>
          </div>

          <span className="w-fit rounded-full bg-[#EAF3FF] px-3 py-1.5 text-xs font-semibold text-[#1E40AF]">
            {filteredReports.length} Item Rows
          </span>
        </div>

        {loading ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center">
            <Loader2
              size={32}
              className="animate-spin text-[#2D6FE8]"
            />

            <p className="mt-3 text-sm font-medium text-gray-500">
              Loading HSN report...
            </p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
              <FileSpreadsheet size={25} />
            </div>

            <h3 className="mt-4 text-base font-bold text-gray-800">
              No HSN Records Found
            </h3>

            <p className="mt-1 max-w-sm text-sm text-gray-500">
              No records match your search or selected filters.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 rounded-lg bg-[#2D6FE8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E40AF]"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}

            <div className="hidden w-full overflow-x-auto xl:block">
              <table className="w-full min-w-[1450px] border-collapse text-left">
                <thead>
                  <tr className="bg-[#F7FAFE]">
                    {[
                      "Registration",
                      "Item Name",
                      "HSN Code",
                      "UQC",
                      "Quantity",
                      "GST Rate",
                      "Taxable Value",
                      "IGST",
                      "CGST",
                      "SGST / UTGST",
                      "Cess",
                      "Total Tax",
                      "Total Value",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="whitespace-normal break-words border-b border-[#DCE6F2] px-3 py-3 text-xs font-bold uppercase tracking-wide text-gray-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {pageReports.map((item, index) => (
                    <tr
                      key={`${item.registrationType}-${item.hsn}-${item.item_name}-${index}`}
                      className="border-b border-gray-100 transition last:border-0 hover:bg-[#F8FBFF]"
                    >
                      <td className="px-3 py-3 align-top">
                        <RegistrationBadge
                          type={item.registrationType}
                        />
                      </td>

                      <td className="max-w-[220px] px-3 py-3 align-top">
                        <p className="break-words text-xs font-semibold text-gray-800">
                          {valueOrDash(item.item_name)}
                        </p>
                      </td>

                      <td className="px-3 py-3 align-top">
                        <span className="break-all text-xs font-semibold text-[#2D6FE8]">
                          {valueOrDash(item.hsn)}
                        </span>
                      </td>

                      <td className="px-3 py-3 align-top">
                        <span className="text-xs text-gray-600">
                          {valueOrDash(item.uqc)}
                        </span>
                      </td>

                      <td className="px-3 py-3 align-top">
                        <p className="text-xs font-bold text-gray-900">
                          {formatNumber(item.total_quantity)}
                        </p>
                      </td>

                      <td className="px-3 py-3 align-top">
                        <span className="text-xs font-semibold text-gray-700">
                          {formatRate(item.rate)}
                        </span>
                      </td>

                      <td className="px-3 py-3 align-top">
                        <span className="text-xs font-semibold text-gray-800">
                          {money(item.taxable_value)}
                        </span>
                      </td>

                      <td className="px-3 py-3 align-top">
                        <span className="text-xs text-gray-700">
                          {money(item.integrated_tax_amount)}
                        </span>
                      </td>

                      <td className="px-3 py-3 align-top">
                        <span className="text-xs text-gray-700">
                          {money(item.central_tax_amount)}
                        </span>
                      </td>

                      <td className="px-3 py-3 align-top">
                        <span className="text-xs text-gray-700">
                          {money(item.state_ut_tax_amount)}
                        </span>
                      </td>

                      <td className="px-3 py-3 align-top">
                        <span className="text-xs text-gray-700">
                          {money(item.cess_amount)}
                        </span>
                      </td>

                      <td className="px-3 py-3 align-top">
                        <span className="text-xs font-bold text-[#1E40AF]">
                          {money(getTotalTax(item))}
                        </span>
                      </td>

                      <td className="px-3 py-3 align-top">
                        <span className="text-xs font-bold text-gray-900">
                          {money(item.total_value)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE / TABLET CARDS */}

            <div className="space-y-3 p-3 xl:hidden">
              {pageReports.map((item, index) => (
                <div
                  key={`${item.registrationType}-${item.hsn}-${item.item_name}-${index}`}
                  className="overflow-hidden rounded-xl border border-[#DCE6F2] bg-white"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Item Name
                        </p>

                        <p className="mt-1 break-words text-sm font-bold text-gray-900">
                          {valueOrDash(item.item_name)}
                        </p>
                      </div>

                      <RegistrationBadge
                        type={item.registrationType}
                      />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-[#F7FAFE] p-3">
                      <div>
                        <p className="text-xs text-gray-400">
                          HSN Code
                        </p>

                        <p className="mt-1 break-all text-xs font-bold text-[#2D6FE8]">
                          {valueOrDash(item.hsn)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400">
                          UQC
                        </p>

                        <p className="mt-1 break-words text-xs font-semibold text-gray-800">
                          {valueOrDash(item.uqc)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400">
                          Total Quantity
                        </p>

                        <p className="mt-1 text-xs font-bold text-gray-800">
                          {formatNumber(item.total_quantity)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400">
                          GST Rate
                        </p>

                        <p className="mt-1 text-xs font-bold text-gray-800">
                          {formatRate(item.rate)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Taxable Value
                        </p>

                        <p className="mt-1 break-words text-sm font-bold text-gray-800">
                          {money(item.taxable_value)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Total Value
                        </p>

                        <p className="mt-1 break-words text-sm font-bold text-[#1E40AF]">
                          {money(item.total_value)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg border border-[#DCE6F2] bg-[#F7FAFE] p-3">
                      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-600">
                        GST Tax Breakdown
                      </p>

                      <TaxBreakdownDetails item={item} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CURRENT PAGE TOTALS */}

            <div className="border-t border-slate-200 bg-[#F1F6FB] px-4 py-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Current Page Totals
                </h3>

                <span className="text-xs text-slate-500">
                  {pageReports.length} visible HSN records
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 xl:grid-cols-6">
                {[
                  [
                    "Quantity",
                    formatNumber(pageSummary.quantity),
                  ],
                  [
                    "Taxable Value",
                    money(pageSummary.taxableValue),
                  ],
                  [
                    "IGST",
                    money(pageSummary.igst),
                  ],
                  [
                    "CGST",
                    money(pageSummary.cgst),
                  ],
                  [
                    "SGST / UTGST",
                    money(pageSummary.sgst),
                  ],
                  [
                    "Total Value",
                    money(pageSummary.totalValue),
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <p className="text-xs text-slate-500">
                      {label}
                    </p>

                    <p
                      className={`mt-1 break-words text-sm font-bold tabular-nums ${
                        label === "Total Value"
                          ? "text-[#1E40AF]"
                          : "text-slate-900"
                      }`}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* PAGINATION */}

            <div className="flex flex-col justify-between gap-3 border-t border-[#DCE6F2] px-4 py-3 sm:flex-row sm:items-center">
              <p className="text-xs text-gray-500">
                Showing HSN rows{" "}
                <span className="font-semibold text-gray-800">
                  {startRecord}–{endRecord}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-800">
                  {totalRecords}
                </span>

                <span className="ml-1 text-gray-400">
                  ({pageReports.length} rows on this page)
                </span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={displayPage <= 1 || loading}
                  onClick={() =>
                    setCurrentPage(
                      Math.max(1, displayPage - 1),
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE6F2] text-gray-600 hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="min-w-[85px] text-center text-xs font-semibold text-gray-700">
                  Page {displayPage} of {lastPage}
                </span>

                <button
                  type="button"
                  disabled={
                    displayPage >= lastPage || loading
                  }
                  onClick={() =>
                    setCurrentPage(
                      Math.min(lastPage, displayPage + 1),
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE6F2] text-gray-600 hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HsnReport;