"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
  Loader2,
  ShieldAlert,
  Wallet,
  Package,
  CreditCard,
  Truck,
  MapPin,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "react-hot-toast";
import ExcelJS from "exceljs";
import statewiseReportApi, {
  StatewiseReportItem,
  StatewiseReportMeta,
  StatewiseReportGrandTotal,
} from "../../api/endpoints/report/statewiseReport";
import { usePermissions } from "../permissions/usePermissions";
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

type ReportDateRange = { from?: string; to?: string };

/* ================= TYPES ================= */
type StatewiseSummary = {
  records: number;
  states: number;
  productHeads: number;
  quantity: number;
  listPrice: number;
  taxableValue: number;
  shippingBase: number;
  shippingTotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
};

/* ================= HELPERS ================= */
const numberValue = (value: number | string | null | undefined): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};
const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;
const money = (value: number | string | null | undefined) =>
  `₹${numberValue(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
const formatNumber = (value: number | string | null | undefined) =>
  numberValue(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
const formatPercentage = (value: number | string | null | undefined) =>
  `${formatNumber(value)}%`;
const valueOrDash = (value: unknown) =>
  value === null || value === undefined || value === "" ? "—" : String(value);
const trimmedValue = (value: unknown) =>
  typeof value === "string"
    ? value.trim()
    : value == null
      ? ""
      : String(value).trim();
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
const getTotalTax = (item: StatewiseReportItem) =>
  roundMoney(
    numberValue(item.cgst) + numberValue(item.sgst) + numberValue(item.igst),
  );

/* ================= SUMMARY CALCULATION ================= */
const summarizeStatewise = (items: StatewiseReportItem[]): StatewiseSummary => {
  const sum = (selector: (item: StatewiseReportItem) => number) =>
    roundMoney(items.reduce((total, item) => total + selector(item), 0));
  return {
    records: items.length,
    states: new Set(
      items.map((item) => trimmedValue(item.customer_state)).filter(Boolean),
    ).size,
    productHeads: new Set(
      items.map((item) => trimmedValue(item.product_head)).filter(Boolean),
    ).size,
    quantity: sum((item) => numberValue(item.total_quantity)),
    listPrice: sum((item) => numberValue(item.sum_list_price)),
    taxableValue: sum((item) => numberValue(item.taxable_value)),
    shippingBase: sum((item) => numberValue(item.shipping_without_gst)),
    shippingTotal: sum((item) => numberValue(item.sum_shipping_charges)),
    cgst: sum((item) => numberValue(item.cgst)),
    sgst: sum((item) => numberValue(item.sgst)),
    igst: sum((item) => numberValue(item.igst)),
    totalTax: sum((item) => getTotalTax(item)),
  };
};

/* ================= BACKEND GRAND TOTAL ================= */
const getBackendSummary = (
  total: StatewiseReportGrandTotal,
  recordCount: number,
  items: StatewiseReportItem[],
): StatewiseSummary => {
  const base = summarizeStatewise(items);
  return {
    ...base,
    records: recordCount,
    quantity: numberValue(total.total_quantity),
    listPrice: numberValue(total.sum_list_price),
    taxableValue: numberValue(total.taxable_value),
    shippingBase: numberValue(total.shipping_without_gst),
    shippingTotal: numberValue(total.sum_shipping_charges),
    cgst: numberValue(total.cgst),
    sgst: numberValue(total.sgst),
    igst: numberValue(total.igst),
    totalTax: roundMoney(
      numberValue(total.cgst) +
        numberValue(total.sgst) +
        numberValue(total.igst),
    ),
  };
};

/* ================= EXCEL / CSV HEADERS ================= */
const STATEWISE_HEADERS = [
  "Customer State",
  "Tax Percentage",
  "Product Head",
  "Total Quantity",
  "Sum List Price",
  "Taxable Value",
  "Shipping Without GST",
  "Sum Shipping Charges",
  "CGST",
  "SGST",
  "IGST",
  "Total Tax",
];
const STATEWISE_WIDTHS = [24, 17, 30, 17, 21, 21, 25, 23, 18, 18, 18, 20];
const STATEWISE_MONEY_HEADERS = [
  "Sum List Price",
  "Taxable Value",
  "Shipping Without GST",
  "Sum Shipping Charges",
  "CGST",
  "SGST",
  "IGST",
  "Total Tax",
];

type ExportRow = (string | number)[];
const buildStatewiseExportRows = (items: StatewiseReportItem[]): ExportRow[] =>
  items.map((item) => [
    item.customer_state || "",
    numberValue(item.tax_percentage),
    item.product_head || "",
    numberValue(item.total_quantity),
    numberValue(item.sum_list_price),
    numberValue(item.taxable_value),
    numberValue(item.shipping_without_gst),
    numberValue(item.sum_shipping_charges),
    numberValue(item.cgst),
    numberValue(item.sgst),
    numberValue(item.igst),
    getTotalTax(item),
  ]);
const buildGrandTotalExportRow = (summary: StatewiseSummary): ExportRow => [
  "GRAND TOTAL",
  "",
  "",
  summary.quantity,
  summary.listPrice,
  summary.taxableValue,
  summary.shippingBase,
  summary.shippingTotal,
  summary.cgst,
  summary.sgst,
  summary.igst,
  summary.totalTax,
];
const csvCell = (value: unknown): string => {
  let text = value == null ? "" : String(value);
  // Prevent spreadsheet formula execution for text fields.
  if (typeof value === "string" && /^\s*[=+@-]/.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replace(/"/g, '""')}"`;
};
const downloadBlob = (blob: Blob, filename: string) => {
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

/* ================= SMALL COMPONENTS ================= */
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
        <p className="text-xs font-semibold text-slate-600">{title}</p>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: bg,
            color,
          }}
        >
          <Icon size={18} />
        </div>
      </div>
      <h3 className="mt-2 break-words text-xl font-bold tracking-tight text-slate-900 tabular-nums sm:text-2xl">
        {value}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{subtitle}</p>
    </div>
  );
}
function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#EAF3FF] px-2.5 py-1 text-[10px] font-semibold capitalize text-[#1E40AF]">
      {status.replace(/_/g, " ")}
    </span>
  );
}
function TaxBreakdownDetails({ item }: { item: StatewiseReportItem }) {
  const values = [
    ["CGST", item.cgst],
    ["SGST", item.sgst],
    ["IGST", item.igst],
  ] as const;
  return (
    <div className="min-w-0 space-y-1.5">
      {values.map(([label, amount]) => (
        <div key={label} className="flex items-center justify-between gap-2">
          <span className="text-xs text-gray-500">{label}</span>
          <span className="break-words text-right text-xs font-semibold text-gray-700">
            {money(amount)}
          </span>
        </div>
      ))}
      <div className="flex items-center justify-between gap-2 border-t border-[#E8EEF6] pt-1.5">
        <span className="text-xs font-bold text-gray-700">Total Tax</span>
        <span className="break-words text-right text-xs font-bold text-[#1E40AF]">
          {money(getTotalTax(item))}
        </span>
      </div>
    </div>
  );
}

/* ================= MAIN COMPONENT ================= */
const StatewiseReport = () => {
  const {
    hasPermission,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();
  const canViewReport = useMemo(() => {
    if (isSuperAdmin) return true;
    return hasPermission("statewise-report.view");
  }, [isSuperAdmin, hasPermission]);
  const canExport = useMemo(() => {
    if (isSuperAdmin) return true;
    return hasPermission("statewise-report.export");
  }, [isSuperAdmin, hasPermission]);

  /* ================= LOGO ================= */
  const [logoUrl, setLogoUrl] = useState<string | null>(DEFAULT_LOGO_URL);
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
            typeof value === "string" && /^https?:\/\//i.test(value.trim()),
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
  const [reports, setReports] = useState<StatewiseReportItem[]>([]);
  const [grandTotal, setGrandTotal] =
    useState<StatewiseReportGrandTotal | null>(null);
  const [meta, setMeta] = useState<StatewiseReportMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedRange, setAppliedRange] = useState<ReportDateRange>({});
  const [reportError, setReportError] = useState("");
  const requestId = useRef(0);
  const busy = loading || refreshing;
  const controlsDisabled = busy || exporting || exportingCsv;
  const hasCustomRange = Boolean(appliedRange.from && appliedRange.to);

  /* ================= FETCH REPORT ================= */
  const fetchReports = useCallback(
    async (showLoader = true) => {
      const id = ++requestId.current;
      setLoading(showLoader);
      setRefreshing(!showLoader);
      setReportError("");
      setReports([]);
      setGrandTotal(null);
      setMeta(null);
      setCurrentPage(1);
      try {
        // The server must filter orders before aggregating the statewise rows.
        const params: ReportDateRange =
          appliedRange.from && appliedRange.to
            ? { from: appliedRange.from, to: appliedRange.to }
            : {};
        const response = await statewiseReportApi.getAll(params);
        if (id !== requestId.current) return;
        if (!response.success) {
          throw new Error(
            response.message || "Unable to fetch Statewise Report",
          );
        }
        setReports(Array.isArray(response.data) ? response.data : []);
        setGrandTotal(response.grand_total ?? null);
        setMeta(response.meta ?? null);
      } catch (error: any) {
        if (id !== requestId.current) return;
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to fetch Statewise Report";
        console.error("Statewise report error:", error);
        setReportError(message);
        toast.error(message);
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [appliedRange],
  );

  useEffect(() => {
    if (permissionsLoading) return;
    if (!canViewReport) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    void fetchReports(true);
    return () => {
      requestId.current += 1;
    };
  }, [permissionsLoading, canViewReport, fetchReports]);

  const applyDateRange = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (controlsDisabled) return;
    if (!fromDate || !toDate) {
      toast.error("Please select both From Date and To Date.");
      return;
    }
    if (fromDate > toDate) {
      toast.error("From Date cannot be after To Date.");
      return;
    }
    setLoading(true);
    setCurrentPage(1);
    setAppliedRange({ from: fromDate, to: toDate });
  };

  const resetDateRange = () => {
    if (controlsDisabled) return;
    setFromDate("");
    setToDate("");
    setLoading(true);
    setCurrentPage(1);
    setAppliedRange({});
  };

  // Prefer the actual period reported by the API; fall back to the requested range.
  const reportFrom = meta?.from || appliedRange.from;
  const reportTo = meta?.to || appliedRange.to;
  const reportPeriod =
    reportFrom && reportTo
      ? `${formatDate(reportFrom)} to ${formatDate(reportTo)}`
      : "API default period";
  const exportDateSuffix = hasCustomRange
    ? `${appliedRange.from}_to_${appliedRange.to}`
    : formatDateInput(new Date());

  /* ================= SEARCH & FILTER ================= */
  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reports.filter((item) => {
      const searchable = [
        item.customer_state,
        item.tax_percentage,
        item.product_head,
        item.total_quantity,
        item.taxable_value,
        item.sum_list_price,
        item.sum_shipping_charges,
      ];
      return (
        !query ||
        searchable.some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(query),
        )
      );
    });
  }, [reports, search]);

  /* ================= PAGINATION ================= */
  const totalRecords = filteredReports.length;
  const lastPage = Math.max(1, Math.ceil(totalRecords / PER_PAGE));
  const displayPage = Math.min(currentPage, lastPage);
  const pageReports = useMemo(
    () =>
      filteredReports.slice(
        (displayPage - 1) * PER_PAGE,
        displayPage * PER_PAGE,
      ),
    [filteredReports, displayPage],
  );
  const startRecord = totalRecords === 0 ? 0 : (displayPage - 1) * PER_PAGE + 1;
  const endRecord = Math.min(displayPage * PER_PAGE, totalRecords);

  /* ================= SUMMARY ================= */
  const summary = useMemo(() => {
    const calculated = summarizeStatewise(filteredReports);
    // Keep backend grand totals when all returned rows are visible.
    // Recalculate locally when the user searches for specific rows.
    if (!search.trim() && grandTotal) {
      return getBackendSummary(
        grandTotal,
        filteredReports.length,
        filteredReports,
      );
    }
    return calculated;
  }, [filteredReports, grandTotal, search]);
  const pageSummary = useMemo(
    () => summarizeStatewise(pageReports),
    [pageReports],
  );

  /* ================= CLEAR SEARCH ================= */
  const clearSearch = () => {
    setSearch("");
    setCurrentPage(1);
  };

  /* ================= EXPORT DATA ================= */
  const exportSummary = summary;
  const exportItems = filteredReports;

  /* ================= EXCEL EXPORT ================= */
  const exportExcel = async () => {
    if (!canExport) {
      toast.error("You don't have permission to export this report.");
      return;
    }
    if (controlsDisabled || reportError) return;
    setExporting(true);
    try {
      if (!exportItems.length) {
        toast.error("No Statewise records available to export");
        return;
      }
      const rows = buildStatewiseExportRows(exportItems);
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "IndieKonnect";
      workbook.created = new Date();
      workbook.calcProperties.fullCalcOnLoad = true;
      const sheet = workbook.addWorksheet("Statewise Report", {
        views: [
          {
            state: "frozen",
            xSplit: 2,
            ySplit: 5,
            showGridLines: false,
          },
        ],
        properties: {
          defaultRowHeight: 25,
        },
      });
      sheet.columns = STATEWISE_HEADERS.map((heading, index) => ({
        header: heading,
        key: `column_${index}`,
        width: STATEWISE_WIDTHS[index] || 18,
      }));
      const fill = (argb: string): ExcelJS.Fill => ({
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb,
        },
      });
      const gridBorder: Partial<ExcelJS.Borders> = {
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
      /* TITLE */
      sheet.mergeCells(1, 1, 1, STATEWISE_HEADERS.length);
      const title = sheet.getCell(1, 1);
      title.value = "INDIEKONNECT  /  STATEWISE REPORT";
      title.fill = fill("FF173B63");
      title.font = {
        name: "Calibri",
        size: 18,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      title.alignment = {
        vertical: "middle",
        horizontal: "left",
        indent: 1,
      };
      sheet.getRow(1).height = 38;
      /* REPORT PERIOD */
      sheet.mergeCells(2, 1, 2, STATEWISE_HEADERS.length);
      const period = sheet.getCell(2, 1);
      period.value = `Period: ${reportPeriod}  |  Supplier State: ${meta?.supplier_state || "—"}`;
      period.fill = fill("FFF0F7FF");
      period.font = {
        name: "Calibri",
        size: 11,
        color: { argb: "FF456580" },
      };
      period.alignment = {
        vertical: "middle",
        indent: 1,
      };
      sheet.getRow(2).height = 26;
      /* STATUS INFO */
      sheet.mergeCells(3, 1, 3, STATEWISE_HEADERS.length);
      const statusInfo = sheet.getCell(3, 1);
      statusInfo.value = `Included statuses: ${(meta?.statuses || []).join(", ")}`;
      statusInfo.fill = fill("FFFFFFFF");
      statusInfo.font = {
        name: "Calibri",
        size: 10,
        color: { argb: "FF456580" },
      };
      statusInfo.alignment = {
        vertical: "middle",
        indent: 1,
        wrapText: true,
      };
      sheet.getRow(3).height = 30;
      /* CALCULATION NOTE */
      sheet.mergeCells(4, 1, 4, STATEWISE_HEADERS.length);
      const note = sheet.getCell(4, 1);
      note.value =
        "GST Total = CGST + SGST + IGST. Values are taken from the Statewise Report API.";
      note.fill = fill("FFF5F8FC");
      note.font = {
        name: "Calibri",
        size: 10,
        italic: true,
        color: { argb: "FF456580" },
      };
      note.alignment = {
        vertical: "middle",
        indent: 1,
      };
      sheet.getRow(4).height = 24;
      /* HEADERS */
      const header = sheet.getRow(5);
      header.values = STATEWISE_HEADERS;
      header.height = 40;
      header.eachCell((cell) => {
        cell.font = {
          name: "Calibri",
          size: 11,
          bold: true,
          color: { argb: "FFFFFFFF" },
        };
        cell.fill = fill("FF24466A");
        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };
        cell.border = gridBorder;
      });
      /* DATA */
      rows.forEach((values, index) => {
        const row = sheet.addRow(values);
        row.height = 29;
        STATEWISE_HEADERS.forEach((heading, columnIndex) => {
          const cell = row.getCell(columnIndex + 1);
          cell.font = {
            name: "Calibri",
            size: 11,
            color: { argb: "FF253C52" },
          };
          cell.fill = fill(index % 2 === 0 ? "FFFFFFFF" : "FFF2F6FA");
          cell.alignment = {
            vertical: "middle",
            horizontal:
              columnIndex === 1 || columnIndex >= 3 ? "right" : "left",
            wrapText: true,
            indent: 1,
          };
          cell.border = gridBorder;
          if (columnIndex === 1) {
            cell.numFmt = '0.##"%"';
          } else if (heading === "Total Quantity") {
            cell.numFmt = "#,##0.##";
          } else if (STATEWISE_MONEY_HEADERS.includes(heading)) {
            cell.numFmt = "#,##0.00;[Red](#,##0.00);0.00";
          }
        });
      });
      /* GRAND TOTAL */
      const footer = sheet.addRow(buildGrandTotalExportRow(exportSummary));
      footer.height = 38;
      footer.eachCell((cell, columnNumber) => {
        const heading = STATEWISE_HEADERS[columnNumber - 1];
        cell.fill = fill("FFDCEEFF");
        cell.font = {
          name: "Calibri",
          size: 12,
          bold: true,
          color: { argb: "FF173B63" },
        };
        cell.alignment = {
          horizontal:
            columnNumber === 2 || columnNumber >= 4 ? "right" : "left",
          vertical: "middle",
          indent: 1,
        };
        cell.border = {
          top: {
            style: "medium",
            color: { argb: "FF9FB5CA" },
          },
          bottom: {
            style: "thin",
            color: { argb: "FF9FB5CA" },
          },
        };
        if (heading === "Tax Percentage") {
          cell.numFmt = '0.##"%"';
        } else if (heading === "Total Quantity") {
          cell.numFmt = "#,##0.##";
        } else if (STATEWISE_MONEY_HEADERS.includes(heading)) {
          cell.numFmt = "#,##0.00;[Red](#,##0.00);0.00";
        }
      });
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([new Uint8Array(buffer)], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      downloadBlob(blob, `statewise-report-${exportDateSuffix}.xlsx`);
      toast.success("Statewise Report exported successfully");
    } catch (error) {
      console.error("Statewise Excel export error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to export Statewise Report",
      );
    } finally {
      setExporting(false);
    }
  };

  /* ================= CSV EXPORT ================= */
  const exportCsv = async () => {
    if (!canExport) {
      toast.error("You don't have permission to export this report.");
      return;
    }
    if (controlsDisabled || reportError) return;
    setExportingCsv(true);
    try {
      if (!exportItems.length) {
        toast.error("No Statewise records available to export");
        return;
      }
      const rows = buildStatewiseExportRows(exportItems);
      const totalRow = buildGrandTotalExportRow(exportSummary);
      const csv = [
        ["INDIEKONNECT STATEWISE REPORT"],
        [`Period: ${reportPeriod}`],
        [`Supplier State: ${meta?.supplier_state || "—"}`],
        [],
        STATEWISE_HEADERS,
        ...rows,
        totalRow,
      ]
        .map((row) => row.map(csvCell).join(","))
        .join("\r\n");
      const blob = new Blob(["\uFEFF", csv], {
        type: "text/csv;charset=utf-8;",
      });
      downloadBlob(blob, `statewise-report-${exportDateSuffix}.csv`);
      toast.success("Statewise Report CSV exported successfully");
    } catch (error) {
      console.error("Statewise CSV export error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to export Statewise CSV",
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
          <ShieldAlert size={28} className="mx-auto mb-4 text-[#C23B32]" />
          <h2 className="text-lg font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-sm text-gray-500">
            You don't have permission to view the Statewise Report.
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
            <span>Statewise Report</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
            Statewise Report
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            State-wise product sales, taxable values, shipping charges and GST
            breakdown.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchReports(false)}
            disabled={controlsDisabled}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#DCE6F2] bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          {canExport && (
            <button
              type="button"
              onClick={() => void exportCsv()}
              disabled={controlsDisabled || Boolean(reportError)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#DCE6F2] bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exportingCsv ? (
                <Loader2 size={16} className="animate-spin" />
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
              disabled={controlsDisabled || Boolean(reportError)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2D6FE8] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {exporting ? "Exporting..." : "Export Excel"}
            </button>
          )}
        </div>
      </div>
      {/* CUSTOM DATE RANGE */}
      <form
        onSubmit={applyDateRange}
        className="rounded-xl border border-[#DCE6F2] bg-white p-4 shadow-sm"
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <CalendarDays size={17} className="text-[#2D6FE8]" />
            Custom Date Range
          </div>
          <span className="text-xs text-slate-500" aria-live="polite">
            {busy
              ? "Updating report..."
              : reportError
                ? "Report unavailable"
                : hasCustomRange
                  ? `Period: ${reportPeriod}`
                  : "API default period"}
          </span>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-48">
            <label
              htmlFor="statewise-from-date"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              From Date
            </label>
            <input
              id="statewise-from-date"
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) => setFromDate(event.target.value)}
              disabled={controlsDisabled}
              required
              className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#2D6FE8] focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
            />
          </div>
          <div className="w-full sm:w-48">
            <label
              htmlFor="statewise-to-date"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              To Date
            </label>
            <input
              id="statewise-to-date"
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => setToDate(event.target.value)}
              disabled={controlsDisabled}
              required
              className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#2D6FE8] focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled={controlsDisabled || !fromDate || !toDate}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2D6FE8] px-5 text-sm font-semibold text-white hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Search size={15} />
            )}
            Apply Filter
          </button>
          <button
            type="button"
            onClick={resetDateRange}
            disabled={
              controlsDisabled || (!fromDate && !toDate && !hasCustomRange)
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#DCE6F2] bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={15} /> Reset
          </button>
        </div>
        {(fromDate !== (appliedRange.from || "") ||
          toDate !== (appliedRange.to || "")) &&
          !busy && (
            <p className="mt-2 text-xs text-slate-500">
              Click Apply Filter to update the report and exports.
            </p>
          )}
      </form>
      {reportError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {reportError} — use Refresh to retry.
        </div>
      )}
      {/* API META */}
      <div className="rounded-xl border border-[#DCE6F2] bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-[#2D6FE8]" />
            <span className="text-xs font-semibold text-slate-600">
              Supplier State:
            </span>
            <span className="rounded-full bg-[#EAF3FF] px-3 py-1 text-xs font-semibold text-[#1E40AF]">
              {valueOrDash(meta?.supplier_state)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays size={14} className="text-slate-400" />
            <span className="text-xs text-slate-600">API Period:</span>
            <span className="text-xs font-semibold text-slate-700">
              {busy ? "Loading period..." : reportError ? "—" : reportPeriod}
            </span>
          </div>
        </div>
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="mb-2 text-xs font-semibold text-slate-600">
            Included Order Statuses
          </p>
          <div className="flex flex-wrap gap-1.5">
            {meta?.statuses?.length ? (
              meta.statuses.map((status) => (
                <StatusBadge key={status} status={status} />
              ))
            ) : (
              <span className="text-xs text-slate-400">—</span>
            )}
          </div>
        </div>
      </div>
      {/* FINANCIAL SUMMARY */}
      <section className="space-y-3" aria-label="Statewise financial summary">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Statewise Sales Overview
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              All matching records across the returned dataset · INR
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
            {summary.records} records
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="min-w-0 rounded-xl border border-[#BBDCFB] bg-[#EAF3FF] p-4 text-[#173B63] shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-[#315B86]">
                Taxable Value
              </p>
              <div className="rounded-lg bg-[#D5E9FF] p-2">
                <Wallet size={18} />
              </div>
            </div>
            <p className="mt-2 break-words text-2xl font-bold tracking-tight tabular-nums">
              {money(summary.taxableValue)}
            </p>
            <p className="mt-1 text-xs text-[#315B86]">Total taxable amount</p>
          </div>
          <SummaryCard
            title="Total GST"
            value={money(summary.totalTax)}
            subtitle="CGST + SGST + IGST"
            icon={CreditCard}
            color="#6D28D9"
            bg="#EDE9FE"
          />
          <SummaryCard
            title="Total Quantity"
            value={formatNumber(summary.quantity)}
            subtitle={`${summary.states} states · ${summary.productHeads} product heads`}
            icon={Package}
            color="#15803D"
            bg="#DCFCE7"
          />
          <SummaryCard
            title="Shipping Charges"
            value={money(summary.shippingTotal)}
            subtitle="Sum of shipping charges from API"
            icon={Truck}
            color="#C2410C"
            bg="#FFEDD5"
          />
        </div>
        {/* SALES BREAKDOWN */}
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">
              Sales Breakdown
            </h3>
            <div className="mt-3 space-y-2.5 text-xs">
              {[
                ["Sum List Price", summary.listPrice],
                ["Taxable Value", summary.taxableValue],
                ["Shipping Without GST", summary.shippingBase],
                ["Sum Shipping Charges", summary.shippingTotal],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-slate-500">{label}</span>
                  <span className="font-semibold text-slate-800 tabular-nums">
                    {money(value as number)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">GST Breakdown</h3>
            <div className="mt-3 space-y-2.5 text-xs">
              {[
                ["CGST", summary.cgst],
                ["SGST", summary.sgst],
                ["IGST", summary.igst],
                ["Total GST", summary.totalTax],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-slate-500">{label}</span>
                  <span className="font-semibold text-slate-800 tabular-nums">
                    {money(value as number)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Report Activity
              </h3>
              <Package size={17} className="text-slate-400" />
            </div>
            <div className="mt-3 divide-y divide-slate-100">
              {[
                ["Report Records", summary.records],
                ["Unique States", summary.states],
                ["Product Heads", summary.productHeads],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between gap-3 py-2 first:pt-0"
                >
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className="text-sm font-bold text-slate-900 tabular-nums">
                    {formatNumber(value as number)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          All financial values are taken from the Statewise Report API. Total
          GST is calculated as CGST + SGST + IGST. The API grand_total is used
          when no search is applied.
        </p>
      </section>
      {/* SEARCH */}
      <div className="rounded-xl border border-[#DCE6F2] bg-white p-3 shadow-sm">
        <div className="relative max-w-md">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            aria-label="Search Statewise Report"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search state, product head, tax percentage..."
            className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white pl-9 pr-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-[#2D6FE8] focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>
      {/* STATEWISE RECORDS */}
      <div className="overflow-hidden rounded-xl border border-[#DCE6F2] bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-[#DCE6F2] p-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Statewise Records
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              State, product category and GST percentage-wise sales details.
            </p>
          </div>
          <span className="w-fit rounded-full bg-[#EAF3FF] px-3 py-1.5 text-xs font-semibold text-[#1E40AF]">
            {filteredReports.length} Item Rows
          </span>
        </div>
        {busy ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center">
            <Loader2 size={32} className="animate-spin text-[#2D6FE8]" />
            <p className="mt-3 text-sm font-medium text-gray-500">
              Loading Statewise Report...
            </p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
              <FileSpreadsheet size={25} />
            </div>
            <h3 className="mt-4 text-base font-bold text-gray-800">
              No Statewise Records Found
            </h3>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              {search.trim()
                ? "No records match your search."
                : reportError
                  ? "Unable to load report. Please refresh and try again."
                  : hasCustomRange
                    ? "No Statewise records available for the selected date range."
                    : "No Statewise records available."}
            </p>
            {search.trim() && (
              <button
                type="button"
                onClick={clearSearch}
                className="mt-4 rounded-lg bg-[#2D6FE8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E40AF]"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden w-full overflow-x-auto xl:block">
              <table className="w-full min-w-[1500px] border-collapse text-left">
                <thead>
                  <tr className="bg-[#F7FAFE]">
                    {[
                      "Customer State",
                      "Tax %",
                      "Product Head",
                      "Quantity",
                      "Sum List Price",
                      "Taxable Value",
                      "Shipping (Excl. GST)",
                      "Shipping Charges",
                      "CGST",
                      "SGST",
                      "IGST",
                      "Total GST",
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
                      key={`${item.customer_state}-${item.product_head}-${item.tax_percentage}-${index}`}
                      className="border-b border-gray-100 transition last:border-0 hover:bg-[#F8FBFF]"
                    >
                      <td className="min-w-0 px-3 py-3 align-top">
                        <p className="break-words text-xs font-bold text-gray-900">
                          {valueOrDash(item.customer_state)}
                        </p>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className="text-xs font-semibold text-[#1E40AF]">
                          {formatPercentage(item.tax_percentage)}
                        </span>
                      </td>
                      <td className="min-w-0 px-3 py-3 align-top">
                        <p className="break-words text-xs font-semibold text-gray-800">
                          {valueOrDash(item.product_head)}
                        </p>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className="text-xs font-bold text-gray-900">
                          {formatNumber(item.total_quantity)}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className="text-xs text-gray-700">
                          {money(item.sum_list_price)}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className="text-xs font-bold text-gray-900">
                          {money(item.taxable_value)}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className="text-xs text-gray-700">
                          {money(item.shipping_without_gst)}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className="text-xs font-semibold text-gray-800">
                          {money(item.sum_shipping_charges)}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className="text-xs text-gray-700">
                          {money(item.cgst)}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className="text-xs text-gray-700">
                          {money(item.sgst)}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className="text-xs text-gray-700">
                          {money(item.igst)}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className="text-xs font-bold text-[#1E40AF]">
                          {money(getTotalTax(item))}
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
                  key={`${item.customer_state}-${item.product_head}-${item.tax_percentage}-${index}`}
                  className="overflow-hidden rounded-xl border border-[#DCE6F2] bg-white"
                >
                  <div className="p-4">
                    {/* STATE / PRODUCT */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Customer State
                        </p>
                        <p className="mt-1 break-words text-sm font-bold text-gray-900">
                          {valueOrDash(item.customer_state)}
                        </p>
                        <p className="mt-1 break-words text-xs font-medium text-gray-500">
                          Product Head: {valueOrDash(item.product_head)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#EAF3FF] px-2.5 py-1 text-xs font-semibold text-[#1E40AF]">
                        {formatPercentage(item.tax_percentage)}
                      </span>
                    </div>
                    {/* QUANTITY / LIST PRICE */}
                    <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-[#F7FAFE] p-3">
                      <div>
                        <p className="text-xs text-gray-400">Total Quantity</p>
                        <p className="mt-1 text-sm font-bold text-gray-800">
                          {formatNumber(item.total_quantity)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Sum List Price</p>
                        <p className="mt-1 break-words text-sm font-bold text-gray-800">
                          {money(item.sum_list_price)}
                        </p>
                      </div>
                    </div>
                    {/* TAXABLE / SHIPPING */}
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Taxable Value
                        </p>
                        <p className="mt-1 break-words text-sm font-bold text-gray-800">
                          {money(item.taxable_value)}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Shipping (Excl. GST)
                        </p>
                        <p className="mt-1 break-words text-sm font-bold text-gray-800">
                          {money(item.shipping_without_gst)}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Shipping Charges
                        </p>
                        <p className="mt-1 break-words text-sm font-bold text-gray-800">
                          {money(item.sum_shipping_charges)}
                        </p>
                      </div>
                    </div>
                    {/* GST BREAKDOWN */}
                    <div className="mt-4 rounded-lg border border-[#DCE6F2] bg-[#F7FAFE] p-3">
                      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-600">
                        GST Breakdown
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
                  {pageReports.length} visible rows
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 xl:grid-cols-6">
                {[
                  ["Quantity", formatNumber(pageSummary.quantity)],
                  ["List Price", money(pageSummary.listPrice)],
                  ["Taxable Value", money(pageSummary.taxableValue)],
                  ["Shipping", money(pageSummary.shippingTotal)],
                  ["Total GST", money(pageSummary.totalTax)],
                  ["IGST", money(pageSummary.igst)],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p
                      className={`mt-1 break-words text-sm font-bold tabular-nums ${
                        label === "Taxable Value"
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
                Showing rows{" "}
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
                  onClick={() => setCurrentPage(Math.max(1, displayPage - 1))}
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
                  disabled={displayPage >= lastPage || loading}
                  onClick={() =>
                    setCurrentPage(Math.min(lastPage, displayPage + 1))
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
export default StatewiseReport;
