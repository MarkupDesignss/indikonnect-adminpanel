"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  Truck,
} from "lucide-react";
import { toast } from "react-hot-toast";

import financeReportApi, {
  FinanceReportItem,
} from "../../api/endpoints/report/financeReport";
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
const HSN_MISSING_LABEL = "HSN not provided";

/* ================= API ITEM TYPES ================= */

type LineCourier = {
  courier_company?: string | null;
  courier_tracking_number?: string | null;
};

type FinanceReportLineItem = FinanceReportItem & {
  order_reference?: string | null;
  billing_state?: string | null;
  delivery_state?: string | null;
  customer_gstin?: string | null;
  product_name?: string | null;
  product_code?: string | null;
  product_slug?: string | null;
  hsn_code?: string | null;
  item_reference_id?: string | null;
  order_line_id?: string | number | null;
  quantity?: number | string | null;
  unit_price_without_gst?: number | string | null;
  line_total_without_gst?: number | string | null;
  line_tax_rate?: number | string | null;
  line_gst_amount?: number | string | null;
  line_shipping_charge_without_gst?: number | string | null;
  line_shipping_gst?: number | string | null;
  line_couriers?: LineCourier[] | null;
  confirmed_at?: string | null;
  dispatched_at?: string | null;
  shipping_date?: string | null;
  delivered_at?: string | null;
  courier_company?: string | null;
  courier_tracking_number?: string | null;
  is_refunded?: string | boolean | number | null;
  refund_status?: string | null;
  refunded_items?: number | string | null;
  product_subtotal?: number | string | null;
  shipping_charge_without_gst?: number | string | null;
  subtotal?: number | string | null;
  product_gst?: number | string | null;
  shipping_gst?: number | string | null;
  total_gst?: number | string | null;
  discount_amount?: number | string | null;
  order_amount?: number | string | null;
  net_order_amount?: number | string | null;
  products?: Array<{
    name?: string | null;
    product_code?: string | null;
    hsn_code?: string | null;
    quantity?: number | string | null;
  }>;
  tax_breakdown?: {
    cgst?: number | string | null;
    sgst?: number | string | null;
    igst?: number | string | null;
  } | null;
};

const asLineItem = (item: FinanceReportItem): FinanceReportLineItem =>
  item as FinanceReportLineItem;

/* ================= HELPERS ================= */

const money = (value: number | string | null | undefined) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const numberValue = (value: number | string | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const valueOrDash = (value: unknown) =>
  value === null || value === undefined || value === "" ? "—" : String(value);

const trimmedValue = (value: unknown) =>
  typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();

const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";

  // API date formats: DD-MM-YYYY and DD-MM-YYYY HH:mm.
  const match = value.match(/^(\d{2})-(\d{2})-(\d{4})(.*)$/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}${match[4] || ""}`;

  const parsed = new Date(value.replace(" ", "T"));
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const formatDateInput = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const escapeCsv = (value: unknown) => {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

const getProductName = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  if (row.product_name?.trim()) return row.product_name.trim();

  if (Array.isArray(row.products) && row.products.length > 0) {
    return row.products
      .map((product) => product.name?.trim() || product.product_code?.trim() || "Product")
      .join(" | ");
  }

  return item.product_names || "";
};

const getProductCode = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  if (row.product_code?.trim()) return row.product_code.trim();

  if (Array.isArray(row.products) && row.products.length > 0) {
    return row.products
      .map((product) => product.product_code?.trim() || "")
      .filter(Boolean)
      .join(" | ");
  }

  return "";
};

/**
 * Never use product_code as a fallback for HSN. HSN is a numeric 4, 6 or 8
 * digit classification code. In the supplied response, The Signature Desk
 * has hsn_code="XHB4" (same as product_code), which is not a valid HSN format;
 * suppress it instead of exporting the product code as a verified HSN.
 * The actual HSN must be corrected in the product master/API response.
 */
const isValidHsn = (value: string) => /^\d{4}(?:\d{2}){0,2}$/.test(value);

const getHsnCode = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  const directHsn = trimmedValue(row.hsn_code);

  if (directHsn && isValidHsn(directHsn)) return directHsn;

  if (Array.isArray(row.products) && row.products.length > 0) {
    const validHsnCodes = row.products
      .map((product) => trimmedValue(product.hsn_code))
      .filter((hsn) => Boolean(hsn) && isValidHsn(hsn));

    return validHsnCodes.join(" | ");
  }

  return "";
};

const getQuantity = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  if (row.quantity !== null && row.quantity !== undefined && row.quantity !== "") {
    return numberValue(row.quantity);
  }

  if (Array.isArray(row.products) && row.products.length > 0) {
    return row.products.reduce((sum, product) => sum + numberValue(product.quantity), 0);
  }

  return 0;
};

const getCouriers = (item: FinanceReportItem): LineCourier[] => {
  const row = asLineItem(item);
  if (Array.isArray(row.line_couriers) && row.line_couriers.length > 0) {
    return row.line_couriers;
  }

  if (row.courier_company || row.courier_tracking_number) {
    return [
      {
        courier_company: row.courier_company,
        courier_tracking_number: row.courier_tracking_number,
      },
    ];
  }

  return [];
};

const getPlaceOfSupply = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  return trimmedValue(row.delivery_state) || trimmedValue(row.billing_state);
};

const getGstinNumber = (item: FinanceReportItem) => {
  const gstin = trimmedValue(asLineItem(item).customer_gstin);
  return gstin || "URP";
};

const getGstPercentage = (item: FinanceReportItem) => {
  const rate = asLineItem(item).line_tax_rate;
  if (rate === null || rate === undefined || rate === "") return "";
  return `${numberValue(rate)}%`;
};

const getLineSubtotal = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  return numberValue(row.line_total_without_gst ?? row.unit_price_without_gst);
};

const getLineGst = (item: FinanceReportItem) =>
  numberValue(asLineItem(item).line_gst_amount);

const getLineShipping = (item: FinanceReportItem) =>
  numberValue(asLineItem(item).line_shipping_charge_without_gst);

const getLineShippingGst = (item: FinanceReportItem) =>
  numberValue(asLineItem(item).line_shipping_gst);

/**
 * Item Total = product line value before GST + product GST + shipping before
 * GST + shipping GST. It is a line-level amount, not the invoice total.
 */
const getLineGross = (item: FinanceReportItem) =>
  getLineSubtotal(item) + getLineGst(item) + getLineShipping(item) + getLineShippingGst(item);

/**
 * CGST / SGST / IGST are taken from the API's invoice-level tax_breakdown.
 * The frontend does not recalculate the tax type from state names because the
 * supplier's GST registration state is not present in this response. The API
 * must determine intra-state vs inter-state supply using the supplier GSTIN
 * and place-of-supply data.
 */
const getTaxBreakdown = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  const tax = row.tax_breakdown;
  const cgst = numberValue(tax?.cgst);
  const sgst = numberValue(tax?.sgst);
  const igst = numberValue(tax?.igst);
  const splitTotal = cgst + sgst + igst;
  const apiTotal =
    row.total_gst === null || row.total_gst === undefined || row.total_gst === ""
      ? splitTotal
      : numberValue(row.total_gst);

  return {
    cgst,
    sgst,
    igst,
    total: apiTotal,
    difference: Number((apiTotal - splitTotal).toFixed(2)),
  };
};

const getInvoiceKey = (item: FinanceReportItem, index: number) => {
  const row = asLineItem(item);
  return String(row.order_reference || item.invoice_number || `missing-invoice-${index}`);
};

/** Invoice-level values repeat on every line. Keep one representative row. */
const getUniqueInvoiceRows = (items: FinanceReportItem[]) => {
  const unique = new Map<string, FinanceReportItem>();
  items.forEach((item, index) => {
    const key = getInvoiceKey(item, index);
    if (!unique.has(key)) unique.set(key, item);
  });
  return Array.from(unique.values());
};

const isRefunded = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  return (
    String(row.is_refunded).toLowerCase() === "true" ||
    String(row.is_refunded).toLowerCase() === "yes" ||
    Number(row.refunded_items || 0) > 0
  );
};

const statusStyle = (status: string | null | undefined) => {
  const value = (status || "").toLowerCase();
  if (value.includes("deliver") || value === "completed" || value === "paid") {
    return { bg: THEME.greenSoft, color: THEME.green };
  }
  if (value.includes("ship") || value.includes("partial")) {
    return { bg: THEME.purpleSoft, color: THEME.purple };
  }
  if (value.includes("refund") || value.includes("cancel")) {
    return { bg: THEME.redSoft, color: THEME.red };
  }
  if (value.includes("dispatch") || value.includes("confirm")) {
    return { bg: THEME.primarySoft, color: THEME.primaryDark };
  }
  return { bg: THEME.orangeSoft, color: THEME.orange };
};

/* ================= SMALL COMPONENTS ================= */

function StatusBadge({ status }: { status: string | null | undefined }) {
  const style = statusStyle(status);
  return (
    <span
      className="inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize"
      style={{ background: style.bg, color: style.color }}
    >
      {valueOrDash(status)}
    </span>
  );
}

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
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[#DCE6F2] bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ background: bg, color }}
      >
        <Icon size={17} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-medium uppercase tracking-wide text-gray-500">
          {title}
        </p>
        <h3 className="mt-0.5 truncate text-sm font-bold text-gray-900 sm:text-base">
          {value}
        </h3>
        <p className="mt-0.5 truncate text-[9px] text-gray-400">{subtitle}</p>
      </div>
    </div>
  );
}

function CourierDetails({ item }: { item: FinanceReportItem }) {
  const couriers = getCouriers(item);
  if (!couriers.length) return <span className="text-[10px] text-gray-400">Not assigned</span>;

  return (
    <div className="min-w-0 max-w-full space-y-2">
      {couriers.map((courier, index) => (
        <div key={`${courier.courier_company || "courier"}-${courier.courier_tracking_number || index}-${index}`}>
          <p className="flex items-center gap-1 text-[11px] font-semibold text-gray-800">
            <Truck size={12} className="shrink-0 text-[#2D6FE8]" />
            <span>{valueOrDash(courier.courier_company)}</span>
          </p>
          <p className="mt-0.5 break-all pl-[17px] text-[10px] text-gray-500">
            Tracking: {valueOrDash(courier.courier_tracking_number)}
          </p>
        </div>
      ))}
    </div>
  );
}

function ProductDetails({ item }: { item: FinanceReportItem }) {
  const row = asLineItem(item);
  const hsn = getHsnCode(item);

  return (
    <div className="min-w-0 w-full max-w-full">
      <p className="line-clamp-2 text-xs font-semibold text-gray-800">
        {valueOrDash(getProductName(item))}
      </p>
      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-gray-500">
        <span>Code: {valueOrDash(getProductCode(item))}</span>
       
        <span>GST: {getGstPercentage(item) || "—"}</span>
      </div>
      {row.item_reference_id && (
        <p className="mt-1 break-all text-[9px] text-gray-400">Item Ref: {row.item_reference_id}</p>
      )}
    </div>
  );
}

function TaxBreakdownDetails({ item }: { item: FinanceReportItem }) {
  const tax = getTaxBreakdown(item);
  return (
    <div className="min-w-0 space-y-1.5">
      {[
        ["CGST", tax.cgst],
        ["SGST", tax.sgst],
        ["IGST", tax.igst],
      ].map(([label, amount]) => (
        <div key={String(label)} className="flex items-center justify-between gap-1">
          <span className="text-[9px] text-gray-500">{label}</span>
          <span className="break-words text-right text-[9px] font-semibold text-gray-700">
            {money(Number(amount))}
          </span>
        </div>
      ))}
      <div className="flex items-center justify-between gap-1 border-t border-[#E8EEF6] pt-1.5">
        <span className="text-[9px] font-bold text-gray-700">Total Tax</span>
        <span className="break-words text-right text-[9px] font-bold text-[#1E40AF]">
          {money(tax.total)}
        </span>
      </div>
     
    </div>
  );
}

/* ================= MAIN COMPONENT ================= */

const FinanceReport = () => {
  const {
    hasPermission,
    hasModuleAccess,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  const canViewReport = useMemo(() => {
    if (isSuperAdmin) return true;
    return (
      hasModuleAccess("finance_sales_report") ||
      hasPermission("finance_sales_report.view")
    );
  }, [isSuperAdmin, hasModuleAccess, hasPermission]);

  const canExport = useMemo(() => {
    if (isSuperAdmin) return true;
    return hasPermission("finance_sales_report.download");
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
          (value) => typeof value === "string" && /^https?:\/\//i.test(value.trim()),
        );
        if (!cancelled && found) setLogoUrl(found.trim());
      } catch (error) {
        console.error("Logo API error:", error);
      } finally {
        if (!cancelled) setLogoLoading(false);
      }
    };

    void loadLogo();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ================= REPORT STATE ================= */

  const [reports, setReports] = useState<FinanceReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedDates, setAppliedDates] = useState({ fromDate: "", toDate: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  /* ================= FETCH REPORT ================= */

  const fetchReports = useCallback(
    async (showLoader = true, page = currentPage) => {
      try {
        if (showLoader) setLoading(true);
        else setRefreshing(true);

        const response = await financeReportApi.getAll({
          page,
          per_page: PER_PAGE,
          from_date: appliedDates.fromDate || undefined,
          to_date: appliedDates.toDate || undefined,
        });

        if (response.success) {
          const data = Array.isArray(response.data) ? response.data : [];
          setReports(data);
          setTotalRecords(response.meta?.total ?? data.length);
          setLastPage(response.meta?.last_page ?? 1);
        } else {
          setReports([]);
          setTotalRecords(0);
          setLastPage(1);
          toast.error(response.message || "Unable to fetch finance report");
        }
      } catch (error: any) {
        console.error("Finance report error:", error);
        toast.error(error?.response?.data?.message || "Failed to fetch finance report");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentPage, appliedDates],
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
      const row = asLineItem(item);
      const couriers = getCouriers(item);
      const searchable = [
        item.invoice_number,
        row.order_reference,
        item.customer_name,
        item.customer_mobile,
        item.customer_email,
        row.customer_gstin,
        row.billing_state,
        row.delivery_state,
        item.user_name,
        item.product_names,
        row.product_name,
        row.product_code,
        row.product_slug,
        row.hsn_code,
        row.item_reference_id,
        row.order_line_id,
        item.order_status,
        item.order_date,
        item.payment_gateway,
        item.gateway_transaction_id,
        ...couriers.flatMap((courier) => [courier.courier_company, courier.courier_tracking_number]),
      ];

      const matchesSearch =
        !query || searchable.some((value) => String(value ?? "").toLowerCase().includes(query));
      const matchesStatus =
        statusFilter === "all" || (item.order_status || "").toLowerCase() === statusFilter;
      const matchesAccount =
        accountFilter === "all" || (item.account_type || "").toLowerCase() === accountFilter;

      return matchesSearch && matchesStatus && matchesAccount;
    });
  }, [reports, search, statusFilter, accountFilter]);

  /* ================= SUMMARY ================= */

  const summary = useMemo(() => {
    const uniqueInvoices = getUniqueInvoiceRows(reports);
    return {
      sales: uniqueInvoices.reduce((sum, item) => sum + numberValue(asLineItem(item).net_order_amount), 0),
      gst: uniqueInvoices.reduce((sum, item) => sum + numberValue(asLineItem(item).total_gst), 0),
      invoices: totalRecords,
      items: reports.reduce((sum, item) => sum + getQuantity(item), 0),
      refunded: uniqueInvoices.filter(isRefunded).length,
    };
  }, [reports, totalRecords]);

  /* ================= APPLY / CLEAR FILTERS ================= */

  const applyFilters = () => {
    if (fromDate && toDate && fromDate > toDate) {
      toast.error("From date cannot be greater than To date");
      return;
    }
    setCurrentPage(1);
    setAppliedDates({ fromDate, toDate });
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setAccountFilter("all");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
    setAppliedDates({ fromDate: "", toDate: "" });
  };

  /* ================= CSV EXPORT ================= */

  const exportCSV = () => {
    if (!canExport) {
      toast.error("You don't have permission to export this report.");
      return;
    }
    if (!filteredReports.length) {
      toast.error("No finance records available to export");
      return;
    }

    // API invoice-level fields are repeated for each product line. Export those
    // invoice-level values only once per order to prevent inflated GST/sales totals.
    const invoiceMeta = new Map<string, { invoiceNumber: string; invoiceDate: string }>();
    filteredReports.forEach((item, index) => {
      const key = getInvoiceKey(item, index);
      const current = invoiceMeta.get(key) || { invoiceNumber: "", invoiceDate: "" };
      if (!current.invoiceNumber && item.invoice_number) current.invoiceNumber = String(item.invoice_number);
      if (!current.invoiceDate && item.invoice_date) current.invoiceDate = String(item.invoice_date);
      invoiceMeta.set(key, current);
    });

    const seenInvoiceKeys = new Set<string>();
    const headers = [
      "Invoice Number",
      "Invoice Date",
      "Order Reference",
      "Customer Name",
      "Customer Mobile",
      "Customer Email",
      "Account Type",
      "GSTIN Number",
      "State (Place of Supply)",
      "Product Name",
      "Product Code",
      "HSN Code",
      "GST Percentage",
      "Item Reference",
      "Quantity",
      "Unit Price Without GST",
      "Product Total Without GST",
      "Product GST",
      "Shipping Charges Without GST",
      "Shipping GST",
      "Item Total (Product + GST + Shipping + Shipping GST)",
      "Invoice Product Subtotal",
      "Invoice Shipping Charges Without GST",
      "Invoice Product GST",
      "Invoice Shipping GST",
      "Invoice Total GST",
      "CGST",
      "SGST",
      "IGST",
      "Discount Amount",
      "Invoice Value (Net)",
      "Payment Gateway",
      "Gateway Transaction ID",
      "Order Status",
      "Order Date",
      "Courier Company",
      "Tracking Number",
    ];

    const rows = filteredReports.map((item, index) => {
      const row = asLineItem(item);
      const key = getInvoiceKey(item, index);
      const firstInvoiceRow = !seenInvoiceKeys.has(key);
      seenInvoiceKeys.add(key);
      const tax = getTaxBreakdown(item);
      const couriers = getCouriers(item);
      const meta = invoiceMeta.get(key);
      const invoiceOnly = (value: unknown) => (firstInvoiceRow ? value : "");

      const values: unknown[] = [
        meta?.invoiceNumber || item.invoice_number,
        meta?.invoiceDate || item.invoice_date,
        row.order_reference,
        item.customer_name,
        item.customer_mobile,
        item.customer_email,
        item.account_type,
        getGstinNumber(item),
        getPlaceOfSupply(item),
        getProductName(item),
        getProductCode(item),
        // Blank when the API repeats the product code in its HSN field.
        getHsnCode(item),
        getGstPercentage(item),
        row.item_reference_id,
        getQuantity(item),
        row.unit_price_without_gst,
        row.line_total_without_gst,
        getLineGst(item),
        getLineShipping(item),
        getLineShippingGst(item),
        getLineGross(item),
        invoiceOnly(row.product_subtotal),
        invoiceOnly(row.shipping_charge_without_gst),
        invoiceOnly(row.product_gst),
        invoiceOnly(row.shipping_gst),
        invoiceOnly(row.total_gst),
        invoiceOnly(tax.cgst),
        invoiceOnly(tax.sgst),
        invoiceOnly(tax.igst),
        invoiceOnly(row.discount_amount),
        invoiceOnly(row.net_order_amount),
        item.payment_gateway,
        item.gateway_transaction_id,
        item.order_status,
        item.order_date,
        couriers.map((courier) => courier.courier_company || "").join(" | "),
        couriers.map((courier) => courier.courier_tracking_number || "").join(" | "),
      ];

      return values.map(escapeCsv).join(",");
    });

    const csv = [headers.map(escapeCsv).join(","), ...rows].join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `finance-report-gst-compliance-${formatDateInput(new Date())}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    toast.success("GST compliance finance report exported successfully");
  };

  /* ================= PAGINATION ================= */

  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1;
  const endRecord = Math.min(currentPage * PER_PAGE, totalRecords);
  const pageLoading = permissionsLoading || logoLoading;

  if (pageLoading) return <PermissionLoadingState logoUrl={logoUrl} />;

  if (!canViewReport) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#F4F8FD] p-4">
        <div className="max-w-md rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-lg">
          <ShieldAlert size={28} className="mx-auto mb-4 text-[#C23B32]" />
          <h2 className="text-lg font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-sm text-gray-500">
            You don't have permission to view the Finance Sales Report.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-5 p-3 sm:p-5 lg:p-6" style={{ background: THEME.background }}>
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#2D6FE8]">
            <span>Reports</span>
            <ChevronRight size={13} />
            <span>Finance Sales Report</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">Finance Sales Report</h1>
          <p className="mt-1 text-sm text-gray-500">
            Product-wise sales, GST, place of supply, HSN and courier details.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchReports(false, currentPage)}
            disabled={refreshing || loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#DCE6F2] bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          {canExport && (
            <button
              type="button"
              onClick={exportCSV}
              disabled={!filteredReports.length}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2D6FE8] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={16} />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        <SummaryCard title="Total Invoices" value={summary.invoices.toLocaleString("en-IN")} subtitle="Unique invoice records" icon={Receipt} color="#2D6FE8" bg="#EAF3FF" />
        <SummaryCard title="Net Order Amount" value={money(summary.sales)} subtitle="Loaded invoices counted once" icon={Wallet} color="#15803D" bg="#DCFCE7" />
        <SummaryCard title="Total GST" value={money(summary.gst)} subtitle="Loaded invoices counted once" icon={CreditCard} color="#6D28D9" bg="#EDE9FE" />
        <SummaryCard title="Total Items" value={summary.items.toLocaleString("en-IN")} subtitle="Sum of product-line quantities" icon={Package} color="#C2410C" bg="#FFEDD5" />
        <SummaryCard title="Refunded Orders" value={summary.refunded.toLocaleString("en-IN")} subtitle="Unique refunded invoices" icon={RefreshCw} color="#C23B32" bg="#FEE2E2" />
      </div>

      {/* FILTERS */}
      <div className="rounded-xl border border-[#DCE6F2] bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={17} className="text-[#2D6FE8]" />
          <h2 className="text-sm font-bold text-gray-800">Search & Filters</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_1fr_1fr_1fr_1fr_auto]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search invoice, order, product, HSN, GSTIN, state, courier..."
              className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white pl-9 pr-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-[#2D6FE8] focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#2D6FE8]">
            <option value="all">All Statuses</option>
            <option value="dispatched">Dispatched</option>
            <option value="shipped">Shipped</option>
            <option value="partial_shipped">Partial Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="partial_delivered">Partial Delivered</option>
          </select>
          <select value={accountFilter} onChange={(event) => setAccountFilter(event.target.value)} className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#2D6FE8]">
            <option value="all">All Account Types</option>
            <option value="customer">Customer</option>
            <option value="distributor">Distributor</option>
          </select>
          <div className="relative">
            <CalendarDays size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white pl-9 pr-2 text-sm text-gray-700 outline-none focus:border-[#2D6FE8]" />
          </div>
          <div className="relative">
            <CalendarDays size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white pl-9 pr-2 text-sm text-gray-700 outline-none focus:border-[#2D6FE8]" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={applyFilters} disabled={loading} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#2D6FE8] px-4 text-sm font-semibold text-white hover:bg-[#1E40AF] disabled:opacity-60">
              <Filter size={15} /> Apply
            </button>
            <button type="button" onClick={clearFilters} title="Clear filters" className="flex h-10 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white px-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-red-500">
              <X size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* FINANCE RECORDS */}
      <div className="overflow-hidden rounded-xl border border-[#DCE6F2] bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-[#DCE6F2] p-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-gray-900">Finance Reports</h2>
            <p className="mt-1 text-xs text-gray-500">
              Each row is a product/order line. Invoice-level totals and GST split are exported once per order.
            </p>
          </div>
          <span className="w-fit rounded-full bg-[#EAF3FF] px-3 py-1.5 text-xs font-semibold text-[#1E40AF]">
            {filteredReports.length} Item Rows
          </span>
        </div>

        {loading ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center">
            <Loader2 size={32} className="animate-spin text-[#2D6FE8]" />
            <p className="mt-3 text-sm font-medium text-gray-500">Loading finance report...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]"><FileText size={25} /></div>
            <h3 className="mt-4 text-base font-bold text-gray-800">No Finance Records Found</h3>
            <p className="mt-1 max-w-sm text-sm text-gray-500">No records match your search or selected filters.</p>
            <button type="button" onClick={clearFilters} className="mt-4 rounded-lg bg-[#2D6FE8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E40AF]">Clear Filters</button>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden w-full overflow-hidden xl:block">
              <table className="w-full table-fixed border-collapse text-left">
                <colgroup>
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "8%" }} />
                </colgroup>
                <thead>
                  <tr className="bg-[#F7FAFE]">
                    {["Invoice / Date", "Customer / GSTIN", "Product / GST %", "Qty / Unit Price", "Shipping", "Item Total / GST", "GST Breakdown", "Payment", "Order"].map((heading) => (
                      <th key={heading} className="whitespace-normal break-words border-b border-[#DCE6F2] px-2.5 py-3 text-[9px] font-bold uppercase tracking-wide text-gray-500">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((item, index) => {
                    const row = asLineItem(item);
                    return (
                      <tr key={`${item.invoice_number || "invoice"}-${row.order_line_id ?? row.item_reference_id ?? index}-${index}`} className="border-b border-gray-100 transition last:border-0 hover:bg-[#F8FBFF]">
                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <p className="break-words text-[11px] font-bold text-gray-900">{valueOrDash(item.invoice_number)}</p>
                          <p className="mt-1 break-words text-[9px] text-gray-500">{formatDate(item.invoice_date)}</p>
                          {row.order_reference && <p className="mt-1 break-all text-[9px] font-medium text-[#2D6FE8]">{row.order_reference}</p>}
                        </td>
                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <p className="break-words text-[10px] font-semibold text-gray-800">{valueOrDash(item.customer_name)}</p>
                          <p className="mt-1 break-all text-[9px] font-medium text-[#2D6FE8]">Mobile: {valueOrDash(item.customer_mobile)}</p>
                          <p className="mt-1 break-all text-[9px] text-gray-500">{valueOrDash(item.customer_email)}</p>
                          <p className="mt-1 break-words text-[9px] text-gray-600">GSTIN: {getGstinNumber(item)}</p>
                          <p className="mt-1 break-words text-[9px] text-gray-600">State: {valueOrDash(getPlaceOfSupply(item))}</p>
                          <p className="mt-1 break-words text-[9px] capitalize text-gray-400">{valueOrDash(item.account_type)}</p>
                        </td>
                        <td className="min-w-0 px-2.5 py-3 align-top"><ProductDetails item={item} /></td>
                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <p className="break-words text-[10px] font-bold text-gray-900">{getQuantity(item)} Qty</p>
                          <p className="mt-1 break-words text-[9px] text-gray-600">Unit: {money(row.unit_price_without_gst)}</p>
                          <p className="mt-1 break-words text-[9px] text-gray-500">Line: {money(row.line_total_without_gst)}</p>
                        </td>
                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <p className="text-[9px] text-gray-500">Without GST</p>
                          <p className="mt-0.5 break-words text-[10px] font-semibold text-gray-800">{money(getLineShipping(item))}</p>
                          <p className="mt-1 text-[9px] text-gray-500">Shipping GST</p>
                          <p className="mt-0.5 break-words text-[10px] font-semibold text-gray-800">{money(getLineShippingGst(item))}</p>
                          <div className="mt-2"><CourierDetails item={item} /></div>
                        </td>
                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <p className="break-words text-[10px] font-bold text-gray-900">{money(getLineGross(item))}</p>
                          <p className="mt-1 break-words text-[9px] text-gray-500">Product GST: {money(getLineGst(item))}</p>
                          <p className="mt-1 break-words text-[9px] text-gray-400">Invoice: {money(row.net_order_amount)}</p>
                        </td>
                        <td className="min-w-0 px-2.5 py-3 align-top"><TaxBreakdownDetails item={item} /></td>
                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <p className="break-words text-[10px] font-semibold text-gray-800">{valueOrDash(item.payment_gateway)}</p>
                          <p className="mt-1 break-all text-[9px] text-gray-500">{valueOrDash(item.gateway_transaction_id)}</p>
                        </td>
                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <StatusBadge status={item.order_status} />
                          <p className="mt-1 break-words text-[9px] text-gray-400">{formatDate(item.order_date)}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE / TABLET CARDS */}
            <div className="space-y-3 p-3 xl:hidden">
              {filteredReports.map((item, index) => {
                const row = asLineItem(item);
                const tax = getTaxBreakdown(item);
                const hsn = getHsnCode(item);
                return (
                  <div key={`${item.invoice_number || "invoice"}-${row.order_line_id ?? row.item_reference_id ?? index}-${index}`} className="overflow-hidden rounded-xl border border-[#DCE6F2] bg-white">
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Invoice Number</p>
                          <p className="mt-1 break-all text-sm font-bold text-gray-900">{valueOrDash(item.invoice_number)}</p>
                          <p className="mt-1 text-xs text-gray-500">{formatDate(item.invoice_date)}</p>
                          {row.order_reference && <p className="mt-1 break-all text-[9px] font-medium text-[#2D6FE8]">{row.order_reference}</p>}
                        </div>
                        <StatusBadge status={item.order_status} />
                      </div>

                      <div className="mt-4 rounded-lg bg-[#F7FAFE] p-3">
                        <p className="text-sm font-semibold text-gray-800">{valueOrDash(item.customer_name)}</p>
                        <p className="mt-1 break-all text-xs font-medium text-[#2D6FE8]">Mobile: {valueOrDash(item.customer_mobile)}</p>
                        <p className="mt-1 break-all text-xs text-gray-500">{valueOrDash(item.customer_email)}</p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                          <p className="break-all text-gray-600">GSTIN: <span className="font-semibold">{getGstinNumber(item)}</span></p>
                          <p className="break-words text-gray-600">State: <span className="font-semibold">{valueOrDash(getPlaceOfSupply(item))}</span></p>
                          <p className="capitalize text-gray-500">{valueOrDash(item.account_type)}</p>
                        </div>
                      </div>

                      <div className="mt-3 rounded-lg border border-[#E8EEF6] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">Product Item</p>
                          <span className="rounded-full bg-[#EAF3FF] px-2 py-1 text-[10px] font-semibold text-[#1E40AF]">Qty: {getQuantity(item)}</span>
                        </div>
                        <p className="mt-1 break-words text-sm font-semibold text-gray-800">{valueOrDash(getProductName(item))}</p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-500">
                          <span>Code: {valueOrDash(getProductCode(item))}</span>
                          
                          <span>GST: {getGstPercentage(item) || "—"}</span>
                        </div>
                        {row.item_reference_id && <p className="mt-1 break-all text-[9px] text-gray-400">Item Ref: {row.item_reference_id}</p>}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="min-w-0">
                          <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">Product Total (excl. GST)</p>
                          <p className="mt-1 break-words text-xs font-semibold text-gray-800">{money(getLineSubtotal(item))}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">Product GST</p>
                          <p className="mt-1 break-words text-xs font-semibold text-gray-800">{money(getLineGst(item))}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">Shipping (excl. GST)</p>
                          <p className="mt-1 break-words text-xs font-semibold text-gray-800">{money(getLineShipping(item))}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">Shipping GST</p>
                          <p className="mt-1 break-words text-xs font-semibold text-gray-800">{money(getLineShippingGst(item))}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">Unit Price (excl. GST)</p>
                          <p className="mt-1 break-words text-xs font-semibold text-gray-700">{money(row.unit_price_without_gst)}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">Payment Gateway</p>
                          <p className="mt-1 break-words text-xs font-semibold text-gray-700">{valueOrDash(item.payment_gateway)}</p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-lg border border-[#DCE6F2] bg-[#F7FAFE] p-3">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-600">GST Tax Breakdown</p>
                          <span className="rounded-full bg-[#EAF3FF] px-2.5 py-1 text-[9px] font-semibold text-[#1E40AF]">Invoice-level</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {[["CGST", tax.cgst], ["SGST", tax.sgst], ["IGST", tax.igst], ["Total Tax", tax.total]].map(([label, amount]) => (
                            <div key={String(label)} className="rounded-lg border border-[#E8EEF6] bg-white p-2.5">
                              <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
                              <p className="mt-1 break-words text-xs font-bold text-gray-800">{money(Number(amount))}</p>
                            </div>
                          ))}
                        </div>
                      
                      </div>

                      <div className="mt-3 border-t border-[#E8EEF6] pt-3">
                        <p className="mb-2 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-gray-400"><Truck size={12} /> Courier & Tracking</p>
                        <CourierDetails item={item} />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#E8EEF6] pt-3">
                        <div className="min-w-0">
                          <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">Order Date</p>
                          <p className="mt-1 break-words text-[10px] text-gray-500">{formatDate(item.order_date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">Item Total</p>
                          <p className="mt-1 break-words text-xs font-bold text-gray-800">{money(getLineGross(item))}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">Invoice Value</p>
                          <p className="mt-1 break-words text-xs font-bold text-gray-800">{money(row.net_order_amount)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PAGINATION */}
            <div className="flex flex-col justify-between gap-3 border-t border-[#DCE6F2] px-4 py-3 sm:flex-row sm:items-center">
              <p className="text-xs text-gray-500">
                Showing invoices <span className="font-semibold text-gray-800">{startRecord}–{endRecord}</span> of <span className="font-semibold text-gray-800">{totalRecords}</span>
                <span className="ml-1 text-gray-400">({filteredReports.length} product rows on this page)</span>
              </p>
              <div className="flex items-center gap-2">
                <button type="button" disabled={currentPage <= 1 || loading} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE6F2] text-gray-600 hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous page"><ChevronLeft size={16} /></button>
                <span className="min-w-[85px] text-center text-xs font-semibold text-gray-700">Page {currentPage} of {lastPage}</span>
                <button type="button" disabled={currentPage >= lastPage || loading} onClick={() => setCurrentPage((page) => Math.min(lastPage, page + 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE6F2] text-gray-600 hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next page"><ChevronRight size={16} /></button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FinanceReport;
