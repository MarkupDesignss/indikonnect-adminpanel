import React, { useEffect, useMemo, useState } from "react";

import {
  FiSearch,
  FiRefreshCw,
  FiEye,
  FiX,
  FiUser,
  FiUsers,
  FiSend,
  FiCheckCircle,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiClock,
  FiLink,
  FiDownload,
  FiShield,
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

import GlobalModal from "@/components/common/GlobalModal";
import correctionRequestsApi, {
  CorrectionRequest,
} from "../../api/endpoints/correctionRequests";

import { usePermissions } from "../../pages/permissions/usePermissions";
import logoApi from "../../api/endpoints/logoApi";
import PermissionLoadingState from "@/components/common/PermissionLoadingState";

const DEFAULT_LOGO_URL =
  "https://www.markupdesigns.net/indikonnect/storage/logos/MmVFOudCiVU3Y8C0sf2gEEXna5jSKroCDj8xYMo0.png";

type CorrectionFilter = "all" | "pending" | "completed" | "expired";

// =====================================================
// ANIMATION
// =====================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 14,
    },
  },
};

// =====================================================
// HELPERS
// =====================================================

const formatDate = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value.replace(" ", "T"));

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateOnly = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value.replace(" ", "T"));

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getReasonLabel = (reason?: string | null) => {
  if (!reason) return "—";

  switch (reason.toLowerCase()) {
    case "both_wrong_at_signup":
      return "Name & DOB Wrong";

    case "wrong_name_at_signup":
      return "Name Wrong";

    case "wrong_dob_at_signup":
      return "DOB Wrong";

    default:
      return reason
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
  }
};

const getInitials = (name?: string | null) => {
  if (!name) return "NA";

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "NA";

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const isExpired = (tokenExpiresAt?: string | null) => {
  if (!tokenExpiresAt) return false;

  const date = new Date(tokenExpiresAt.replace(" ", "T"));

  if (Number.isNaN(date.getTime())) return false;

  return date.getTime() < Date.now();
};

// ✅ NEW: Check if request is completed (send link should be hidden)
const isCompleted = (status?: string | null) =>
  status?.toLowerCase() === "completed";

// =====================================================
// STATUS BADGE
// =====================================================

const getStatusClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return "border-[#2D6FE8]/25 bg-[#EAF3FF] text-[#2D6FE8]";

    case "pending":
      return "border-[#F2C94C]/45 bg-[#FFF7D6] text-[#A16207]";

    case "expired":
      return "border-[#C23B32]/25 bg-[#EEF5FF] text-[#C23B32]";

    default:
      return "border-[#D6E2F0] bg-[#F3F4F6] text-[#6B7280]";
  }
};

const getStatusLabel = (status: string) => {
  if (!status) return "N/A";

  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

// =====================================================
// CSV HELPERS
// =====================================================

const csvEscape = (value: unknown) => {
  if (value === null || value === undefined) return '""';

  let s = String(value);

  s = s.replace(/\r?\n|\r/g, " ");
  s = s.replace(/"/g, '""');

  return `"${s}"`;
};

const getDateStamp = () => {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(now.getDate()).padStart(2, "0")}`;
};

const buildCsvRows = (requests: CorrectionRequest[]) =>
  requests.map((r, index) => ({
    "S.No.": index + 1,
    "Request ID": r.id,
    "User ID": r.user_id,
    "Full Name": r.full_name || "",
    Email: r.email || "",
    Reason: getReasonLabel(r.reason),
    Status: getStatusLabel(r.status),
    "Token Expires At": formatDate(r.token_expires_at),
    "Token Used At": formatDate(r.token_used_at),
    "Created At": formatDate(r.created_at),
    "Updated At": formatDate(r.updated_at),
    "Account Type": r.user?.account_type || "",
    "Distributor ID": r.user?.distributor_id || "",
    "Sponsor ID": r.user?.sponsor_id || "",
    "User Registered": r.user?.is_registered ? "Yes" : "No",
    "User Active": r.user?.is_active ? "Yes" : "No",
    "User DOB": formatDateOnly(r.user?.date_of_birth),
  }));

const downloadCsv = (
  requests: CorrectionRequest[],
  filename: string,
) => {
  if (!requests.length) {
    toast.error("No requests available for CSV export.");
    return;
  }

  const rows = buildCsvRows(requests);

  if (!rows.length) {
    toast.error("No data available for CSV export.");
    return;
  }

  const headers = Object.keys(rows[0]);

  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) =>
      headers
        .map((header) => csvEscape(row[header as keyof typeof row]))
        .join(","),
    ),
  ];

  const csvContent = "\uFEFF" + lines.join("\r\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => URL.revokeObjectURL(url), 500);

  toast.success(
    `${requests.length} request${
      requests.length === 1 ? "" : "s"
    } exported successfully.`,
  );
};

// =====================================================
// STAT CARD
// =====================================================

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  accent: string;
  tileClass?: string;
  tileIconClass?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accent,
  tileClass = "bg-[#EAF3FF]",
  tileIconClass = "text-[#111827]",
}) => (
  <motion.div
    variants={itemVariants}
    whileHover={{
      y: -4,
      boxShadow: "0 16px 30px -18px rgba(30,58,138,0.28)",
    }}
    className="relative min-h-[135px] overflow-hidden rounded-2xl border border-[#DCE6F2] bg-white p-5 shadow-sm"
  >
    <div className={`absolute left-0 top-0 h-1 w-full ${accent}`} />

    <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full border border-[#2D6FE8]/10" />

    <div className="pointer-events-none absolute -right-3 -top-3 h-14 w-14 rounded-full border border-[#2D6FE8]/10" />

    <div className="relative z-10 flex items-start justify-between gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#111827]">
          {title}
        </p>

        <p className="mt-2 text-2xl font-semibold text-[#111827]">
          {value.toLocaleString("en-IN")}
        </p>

        <p className="mt-1 text-xs text-[#111827]">{subtitle}</p>
      </div>

      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${tileClass} ${tileIconClass}`}
      >
        {icon}
      </div>
    </div>
  </motion.div>
);

// =====================================================
// INFO ROW
// =====================================================

const InfoRow: React.FC<{
  label: string;
  value: React.ReactNode;
}> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 border-b border-[#2D6FE8]/10 py-3 last:border-b-0">
    <span className="text-xs text-[#111827]">{label}</span>

    <span className="max-w-[62%] text-right text-sm font-semibold text-[#111827]">
      {value}
    </span>
  </div>
);

// =====================================================
// DETAIL MODAL
// =====================================================

interface DetailModalProps {
  open: boolean;
  request: CorrectionRequest | null;
  onClose: () => void;
  onSendLink: (id: number) => void;
  sendingLink: boolean;
  canSendLink: boolean;
}

const CorrectionDetailModal: React.FC<DetailModalProps> = ({
  open,
  request,
  onClose,
  onSendLink,
  sendingLink,
  canSendLink,
}) => {
  if (!open) return null;

  const nestedUser = request?.user || null;

  const tokenExpired = request
    ? isExpired(request.token_expires_at)
    : false;

  // ✅ Hide send link when request is completed
  const showSendLink =
    request && canSendLink && !isCompleted(request.status);

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={false}
    >
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-[#DCE6F2] bg-white shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-[#2D6FE8] via-[#5A95F6] to-[#5A95F6]" />

        {/* HEADER */}
        <div className="flex items-start justify-between gap-4 border-b border-[#2D6FE8]/10 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-sm font-bold text-white">
              {request ? (
                getInitials(request.full_name)
              ) : (
                <FiUser size={19} />
              )}
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#111827]">
                Correction Request
              </p>

              <h2 className="mt-0.5 truncate text-xl font-bold text-[#111827]">
                {request?.full_name || "Request Details"}
              </h2>

              {request && (
                <p className="mt-1 text-xs text-[#111827]">
                  Request #{request.id} • User ID #{request.user_id}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close request details"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#2D6FE8]/15 bg-[#F4F8FD] text-[#111827] transition hover:bg-[#EAF3FF]"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="max-h-[calc(95vh-150px)] overflow-y-auto p-5 sm:p-6">
          {!request ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF5FF] text-[#C23B32]">
                <FiAlertCircle size={25} />
              </div>

              <p className="mt-4 text-sm font-bold text-[#C23B32]">
                Request not found.
              </p>
            </div>
          ) : (
            <>
              {/* SUMMARY CARDS */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-[#DCE6F2] bg-[#F4F8FD] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#111827]">
                    Reason
                  </p>

                  <p className="mt-2 text-sm font-bold text-[#111827]">
                    {getReasonLabel(request.reason)}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#DCE6F2] bg-[#F4F8FD] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#111827]">
                    Status
                  </p>

                  <div className="mt-2">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusClass(
                        request.status,
                      )}`}
                    >
                      {getStatusLabel(request.status)}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#2D6FE8]/20 bg-gradient-to-br from-[#F4F8FD] to-[#EAF3FF] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#111827]">
                    Token
                  </p>

                  <p className="mt-2 text-xs font-bold text-[#111827]">
                    {tokenExpired ? (
                      <span className="text-[#C23B32]">Expired</span>
                    ) : request.token_used_at ? (
                      <span className="text-[#2D6FE8]">Used</span>
                    ) : (
                      <span className="text-[#A16207]">Active</span>
                    )}
                  </p>

                  <p className="mt-1 text-[10px] text-[#111827]">
                    Expires: {formatDate(request.token_expires_at)}
                  </p>
                </div>
              </div>

              {/* REQUEST DETAILS */}
              <div className="mt-5 rounded-2xl border border-[#DCE6F2] bg-[#F4F8FD] p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#111827]">
                    <FiLink size={17} />
                  </div>

                  <h3 className="text-sm font-bold text-[#111827]">
                    Request Information
                  </h3>
                </div>

                <InfoRow
                  label="Full Name (at signup)"
                  value={request.full_name || "—"}
                />

                <InfoRow
                  label="Email"
                  value={request.email || "—"}
                />

                <InfoRow
                  label="Date of Birth (at signup)"
                  value={formatDateOnly(request.date_of_birth)}
                />

                <InfoRow
                  label="Created At"
                  value={formatDate(request.created_at)}
                />

                <InfoRow
                  label="Updated At"
                  value={formatDate(request.updated_at)}
                />

                <InfoRow
                  label="Token Used At"
                  value={formatDate(request.token_used_at)}
                />

                <InfoRow
                  label="Token Expires At"
                  value={formatDate(request.token_expires_at)}
                />
              </div>

              {/* NESTED USER */}
              {nestedUser ? (
                <div className="mt-5 rounded-2xl border border-[#DCE6F2] bg-[#F4F8FD] p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#111827]">
                      <FiUser size={17} />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[#111827]">
                        Linked User
                      </h3>

                      <p className="mt-0.5 text-xs text-[#111827]">
                        User details at time of request.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-[#DCE6F2] bg-white p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#111827]">
                        Full Name
                      </p>

                      <p className="mt-1 truncate text-sm font-bold text-[#111827]">
                        {nestedUser.full_name || "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#DCE6F2] bg-white p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#111827]">
                        Email
                      </p>

                      <p className="mt-1 truncate text-sm font-bold text-[#111827]">
                        {nestedUser.email || "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#DCE6F2] bg-white p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#111827]">
                        Phone
                      </p>

                      <p className="mt-1 text-sm font-bold text-[#111827]">
                        {nestedUser.phone || "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#DCE6F2] bg-white p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#111827]">
                        Account Type
                      </p>

                      <p className="mt-1 text-sm font-bold capitalize text-[#111827]">
                        {nestedUser.account_type || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-[#DCE6F2] bg-white p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#111827]">
                        Distributor ID
                      </p>

                      <p className="mt-1 truncate text-sm font-bold text-[#111827]">
                        {nestedUser.distributor_id || "Not Assigned"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#DCE6F2] bg-white p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#111827]">
                        Sponsor ID
                      </p>

                      <p className="mt-1 truncate text-sm font-bold text-[#111827]">
                        {nestedUser.sponsor_id || "Not Assigned"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#DCE6F2] bg-white p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#111827]">
                        User Status
                      </p>

                      <p className="mt-1 text-sm font-bold text-[#111827]">
                        {nestedUser.is_active ? "Active" : "Inactive"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-[#C23B32]/20 bg-[#EEF5FF] p-4">
                  <div className="flex items-center gap-2">
                    <FiAlertCircle size={16} className="text-[#C23B32]" />

                    <p className="text-xs font-bold text-[#C23B32]">
                      Linked user record not available for this request.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 border-t border-[#DCE6F2] bg-[#F8FBFF] px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#2D6FE8]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#111827] transition hover:bg-[#F4F8FD]"
          >
            Close
          </button>

          {/* ✅ Send Link hidden when completed */}
          {showSendLink && (
            <button
              type="button"
              onClick={() => onSendLink(request!.id)}
              disabled={sendingLink}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#2D6FE8]/20 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiSend
                size={15}
                className={sendingLink ? "animate-pulse" : ""}
              />

              {sendingLink ? "Sending..." : "Send Link"}
            </button>
          )}
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// MAIN PAGE
// =====================================================

const CorrectionRequests: React.FC = () => {
  const {
    hasPermission,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  // ===================================================
  // CORRECTION MODULE PERMISSIONS
  // API:
  // correction: ["send link", "View"]
  //
  // usePermissions normalizes these actions to:
  // correction.send link
  // correction.view
  // ===================================================

  const canViewRequests = useMemo(
    () => isSuperAdmin || hasPermission("correction.view"),
    [isSuperAdmin, hasPermission],
  );

  const canSendLink = useMemo(
    () => isSuperAdmin || hasPermission("correction.send link"),
    [isSuperAdmin, hasPermission],
  );

  const canExport = useMemo(
    () => isSuperAdmin || hasPermission("correction.view"),
    [isSuperAdmin, hasPermission],
  );

  // ===================================================
  // LOGO
  // ===================================================

  const [logoUrl, setLogoUrl] = useState<string | null>(DEFAULT_LOGO_URL);
  const [logoLoading, setLogoLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchLogo = async () => {
      try {
        const response: any = await logoApi.getLogo();

        const possible: unknown[] = [
          response?.data?.data?.logo,
          response?.data?.logo,
          response?.data?.data?.data?.logo,
          response?.data?.data?.logo_url,
          response?.data?.logo_url,
          response?.logo,
        ];

        const resolved = possible.find(
          (value): value is string =>
            typeof value === "string" &&
            /^https?:\/\//i.test(value.trim()),
        );

        if (!cancelled && resolved) {
          setLogoUrl(resolved.trim());
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
  // STATE
  // ===================================================

  const [requests, setRequests] = useState<CorrectionRequest[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<CorrectionFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [detailOpen, setDetailOpen] = useState(false);

  const [selectedRequest, setSelectedRequest] =
    useState<CorrectionRequest | null>(null);

  const [sendingLinkId, setSendingLinkId] = useState<number | null>(null);

  const ITEMS_PER_PAGE = 10;

  // ===================================================
  // FETCH REQUESTS
  // ===================================================

  const fetchRequests = async (isInitial = false) => {
    try {
      setLoading(true);

      const response = await correctionRequestsApi.getRequests();

      if (response.data.status) {
        setRequests(response.data.data || []);
      } else {
        toast.error(
          response.data.message || "Unable to fetch correction requests.",
        );
      }
    } catch (error: any) {
      console.error("Fetch correction requests error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Unable to fetch correction requests.",
      );
    } finally {
      setLoading(false);

      if (isInitial) {
        setInitialLoading(false);
      }
    }
  };

  useEffect(() => {
    if (permissionsLoading) return;

    if (canViewRequests) {
      void fetchRequests(true);
    } else {
      setInitialLoading(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionsLoading, canViewRequests]);

  const pageLoading = permissionsLoading || logoLoading || initialLoading;

  // ===================================================
  // STATS
  // ===================================================

  const stats = useMemo(() => {
    const total = requests.length;

    const pending = requests.filter(
      (request) => request.status?.toLowerCase() === "pending",
    ).length;

    const completed = requests.filter(
      (request) => request.status?.toLowerCase() === "completed",
    ).length;

    const expired = requests.filter(
      (request) => request.status?.toLowerCase() === "expired",
    ).length;

    return {
      total,
      pending,
      completed,
      expired,
    };
  }, [requests]);

  // ===================================================
  // FILTER
  // ===================================================

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((request) => {
      const searchMatch =
        !query ||
        [
          request.full_name || "",
          request.email || "",
          request.reason || "",
          request.status || "",
          request.user?.phone || "",
          request.user?.distributor_id || "",
          String(request.id),
          String(request.user_id),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      if (!searchMatch) return false;

      switch (activeFilter) {
        case "pending":
        case "completed":
        case "expired":
          return request.status?.toLowerCase() === activeFilter;

        case "all":
        default:
          return true;
      }
    });
  }, [requests, search, activeFilter]);

  // ===================================================
  // EXPORT
  // ===================================================

  const tabExportRequests = useMemo(() => {
    switch (activeFilter) {
      case "pending":
      case "completed":
      case "expired":
        return requests.filter(
          (request) => request.status?.toLowerCase() === activeFilter,
        );

      case "all":
      default:
        return requests;
    }
  }, [requests, activeFilter]);

  const handleExport = () => {
    if (!canExport) {
      toast.error("You don't have permission to export correction requests.");
      return;
    }

    if (!tabExportRequests.length) {
      toast.error(`No ${activeFilter} requests to export.`);
      return;
    }

    downloadCsv(
      tabExportRequests,
      `correction-requests-${activeFilter}-${getDateStamp()}.csv`,
    );
  };

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRequests.length / ITEMS_PER_PAGE),
  );

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedRequests = filteredRequests.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const startEntry =
    filteredRequests.length === 0 ? 0 : startIndex + 1;

  const endEntry = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredRequests.length,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginationPages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5];
    }

    if (currentPage >= totalPages - 2) {
      return [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
    ];
  }, [currentPage, totalPages]);

  // ===================================================
  // HANDLERS
  // ===================================================

  const handleFilter = (filter: CorrectionFilter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleView = (request: CorrectionRequest) => {
    setSelectedRequest(request);
    setDetailOpen(true);
  };

  const handleSendLink = async (id: number) => {
    if (!canSendLink) {
      toast.error("You don't have permission to send correction links.");
      return;
    }

    // ✅ Extra safety: block send link for completed requests
    const target = requests.find((r) => r.id === id);
    if (target && isCompleted(target.status)) {
      toast.error("This request is already completed.");
      return;
    }

    try {
      setSendingLinkId(id);

      const response = await correctionRequestsApi.sendLink(id);

      if (response.data.status) {
        toast.success(
          response.data.message || "Correction link sent successfully.",
        );

        // Refresh list to update token expiry or request status.
        void fetchRequests(false);
      } else {
        toast.error(response.data.message || "Unable to send link.");
      }
    } catch (error: any) {
      console.error("Send link error:", error);

      toast.error(
        error?.response?.data?.message || "Unable to send link.",
      );
    } finally {
      setSendingLinkId(null);
    }
  };

  // ===================================================
  // GUARDS
  // ===================================================

  if (pageLoading) {
    return <PermissionLoadingState logoUrl={logoUrl} />;
  }

  if (!canViewRequests) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#F4F8FD] p-4 font-poppins">
        <div className="max-w-md rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF5FF] text-[#C23B32]">
            <FiAlertCircle size={26} />
          </div>

          <h2 className="text-lg font-bold text-[#111827]">
            Access Denied
          </h2>

          <p className="mt-2 text-sm text-[#111827]">
            You don't have permission to access this section.
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <>
      <motion.div
        className="min-h-screen bg-white p-4 font-poppins sm:p-5"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* HEADER */}
        <motion.div
          variants={itemVariants}
          className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center"
        >
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2D6FE8]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#4F8FF7]" />

              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#111827]">
                Correction Management
              </span>
            </div>

            <h1 className="text-[20px] font-medium tracking-tight text-[#111827] sm:text-[22px]">
              Correction Requests
            </h1>

            <p className="mt-0.5 text-sm text-[#111827]">
              Manage signup correction requests and resend correction links.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* EXPORT: correction.view permission */}
            {canExport && (
              <button
                type="button"
                onClick={handleExport}
                disabled={tabExportRequests.length === 0}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#2D6FE8]/20 bg-[#EAF3FF] px-4 text-sm font-bold text-[#111827] shadow-sm transition hover:border-[#2D6FE8]/35 hover:bg-[#DFECFF] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiDownload size={16} />
                Download CSV
              </button>
            )}

            <button
              type="button"
              onClick={() => void fetchRequests(false)}
              disabled={loading}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#2D6FE8]/20 bg-white px-4 text-sm font-bold text-[#111827] shadow-sm transition hover:border-[#2D6FE8]/35 hover:bg-[#F4F8FD] disabled:opacity-50"
            >
              <FiRefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* STATS */}
        <motion.div
          variants={containerVariants}
          className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <StatCard
            title="Total Requests"
            value={stats.total}
            subtitle="All correction requests"
            icon={<FiUsers size={21} />}
            accent="bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1E3A8A]"
            tileClass="bg-[#EAF1FF]"
            tileIconClass="text-[#1E3A8A]"
          />

          <StatCard
            title="Pending"
            value={stats.pending}
            subtitle="Awaiting user action"
            icon={<FiClock size={21} />}
            accent="bg-gradient-to-r from-[#FDE047] to-[#FACC15]"
            tileClass="bg-[#FEF9C3]"
            tileIconClass="text-[#1E293B]"
          />

          <StatCard
            title="Completed"
            value={stats.completed}
            subtitle="User corrected"
            icon={<FiCheckCircle size={21} />}
            accent="bg-gradient-to-r from-[#60A5FA] to-[#2563EB]"
            tileClass="bg-[#DBEAFE]"
            tileIconClass="text-[#1E40AF]"
          />

          <StatCard
            title="Expired"
            value={stats.expired}
            subtitle="Link expired"
            icon={<FiAlertCircle size={21} />}
            accent="bg-gradient-to-r from-[#8C97B2] to-[#4A5778]"
            tileClass="bg-[#F3F6FB]"
            tileIconClass="text-[#4A5778]"
          />
        </motion.div>

        {/* MAIN CARD */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-[18px] border border-[#DCE6F2] bg-white shadow-[0_10px_35px_-24px_rgba(42,65,104,0.35)]"
        >
          {/* TOOLBAR */}
          <div className="border-b border-[#DCE6F2] bg-white p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* SEARCH */}
              <div className="relative w-full lg:w-[480px] lg:shrink-0">
                <FiSearch
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#111827]"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => handleSearch(event.target.value)}
                  placeholder="Search name, email, ID, reason..."
                  className="h-11 w-full rounded-lg border border-[#D6E2F0] bg-[#F4F8FD] pl-10 pr-9 text-sm text-[#111827] outline-none transition placeholder:text-[#111827] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/15"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => handleSearch("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#111827]"
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>

              {/* FILTER TABS */}
              <div className="flex w-full items-center justify-start gap-1 overflow-x-auto rounded-lg border border-[#DCE6F2] bg-[#F2F7FC] p-1 lg:w-auto lg:justify-end">
                {[
                  {
                    key: "all" as CorrectionFilter,
                    label: "All",
                    count: stats.total,
                  },
                  {
                    key: "pending" as CorrectionFilter,
                    label: "Pending",
                    count: stats.pending,
                  },
                  {
                    key: "completed" as CorrectionFilter,
                    label: "Completed",
                    count: stats.completed,
                  },
                  {
                    key: "expired" as CorrectionFilter,
                    label: "Expired",
                    count: stats.expired,
                  },
                ].map((tab) => {
                  const active = activeFilter === tab.key;

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => handleFilter(tab.key)}
                      className={`flex shrink-0 items-center gap-2 rounded-md px-3.5 py-2 text-xs font-bold transition-all ${
                        active
                          ? "bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] text-white shadow-md shadow-[#2D6FE8]/20"
                          : "text-[#111827] hover:bg-white"
                      }`}
                    >
                      <span>{tab.label}</span>

                      <span
                        className={`inline-flex min-w-[22px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                          active
                            ? "bg-white/20 text-white"
                            : "bg-[#EAF3FF] text-[#111827]"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden overflow-x-auto rounded-2xl lg:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#4F8FF7] shadow-sm">
                  <th className="rounded-tl-xl px-3 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-white">
                    S.No.
                  </th>

                  <th className="px-3 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-white">
                    User
                  </th>

                  <th className="px-3 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-white">
                    Reason
                  </th>

                  <th className="px-3 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-white">
                    Status
                  </th>

                  <th className="px-3 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-white">
                    Token Expires
                  </th>

                  <th className="px-3 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-white">
                    Created
                  </th>

                  <th className="rounded-tr-xl px-3 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-white">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {initialLoading ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#111827]">
                          <FiRefreshCw size={22} className="animate-spin" />
                        </div>

                        <p className="mt-4 text-sm font-bold text-[#111827]">
                          Loading requests...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F4F8FD] text-[#111827]">
                          <FiUsers size={24} />
                        </div>

                        <p className="mt-4 text-sm font-bold text-[#111827]">
                          No correction requests found
                        </p>

                        <p className="mt-1 text-xs text-[#111827]">
                          Try another search or filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRequests.map((req, index) => {
                    const sending = sendingLinkId === req.id;

                    // ✅ Hide send link when completed
                    const showSendLink = canSendLink && !isCompleted(req.status);

                    return (
                      <tr
                        key={req.id}
                        className="border-b border-[#2D6FE8]/10 bg-white transition hover:bg-[#F4F8FD]"
                      >
                        <td className="px-3 py-4">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F4F8FD] text-xs font-bold text-[#111827]">
                            {startIndex + index + 1}
                          </span>
                        </td>

                        <td className="px-3 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-xs font-bold text-white">
                              {getInitials(req.full_name)}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-[#111827]">
                                {req.full_name || "—"}
                              </p>

                              <p className="truncate text-xs text-[#111827]">
                                {req.email || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2D6FE8]/25 bg-[#EAF3FF] px-3 py-1.5 text-[10px] font-bold text-[#111827]">
                            <FiShield size={12} />
                            {getReasonLabel(req.reason)}
                          </span>
                        </td>

                        <td className="px-3 py-4 text-center">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusClass(
                              req.status,
                            )}`}
                          >
                            {getStatusLabel(req.status)}
                          </span>
                        </td>

                        <td className="px-3 py-4">
                          <div className="flex items-center gap-2">
                            <FiCalendar
                              size={13}
                              className="shrink-0 text-[#111827]"
                            />

                            <span className="text-xs font-semibold text-[#111827]">
                              {formatDate(req.token_expires_at)}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-4">
                          <span className="text-xs font-semibold text-[#111827]">
                            {formatDate(req.created_at)}
                          </span>
                        </td>

                        <td className="px-3 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleView(req)}
                              title="View Details"
                              aria-label={`View request ${req.id}`}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2D6FE8]/20 bg-[#F4F8FD] text-[#111827] transition hover:border-[#2D6FE8] hover:bg-[#2D6FE8] hover:text-white"
                            >
                              <FiEye size={15} />
                            </button>

                            {/* ✅ SEND LINK: hidden for completed requests */}
                            {showSendLink && (
                              <button
                                type="button"
                                onClick={() => void handleSendLink(req.id)}
                                disabled={sending}
                                title="Send correction link"
                                aria-label={`Send correction link for request ${req.id}`}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2D6FE8]/20 bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <FiSend
                                  size={15}
                                  className={sending ? "animate-pulse" : ""}
                                />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE */}
          <div className="block lg:hidden">
            {initialLoading ? (
              <div className="flex flex-col items-center px-5 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#111827]">
                  <FiRefreshCw size={24} className="animate-spin" />
                </div>

                <p className="mt-4 text-sm font-bold text-[#111827]">
                  Loading requests...
                </p>
              </div>
            ) : paginatedRequests.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F4F8FD] text-[#111827]">
                  <FiUsers size={24} />
                </div>

                <p className="mt-4 text-sm font-bold text-[#111827]">
                  No correction requests found
                </p>

                <p className="mt-1 text-xs text-[#111827]">
                  Try another search or filter.
                </p>
              </div>
            ) : (
              paginatedRequests.map((req, index) => {
                const sending = sendingLinkId === req.id;

                // ✅ Hide send link when completed
                const showSendLink = canSendLink && !isCompleted(req.status);

                return (
                  <div
                    key={req.id}
                    className="border-b border-[#2D6FE8]/10 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-xs font-bold text-white">
                          {getInitials(req.full_name)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#111827]">
                            {req.full_name || "—"}
                          </p>

                          <p className="mt-1 truncate text-xs text-[#111827]">
                            {req.email || "—"}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-[#111827]">
                        #{startIndex + index + 1}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-[#2D6FE8]/10 bg-[#F4F8FD] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#111827]">
                          Reason
                        </p>

                        <p className="mt-1 text-xs font-bold text-[#111827]">
                          {getReasonLabel(req.reason)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#2D6FE8]/10 bg-[#F4F8FD] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#111827]">
                          Status
                        </p>

                        <p className="mt-1">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${getStatusClass(
                              req.status,
                            )}`}
                          >
                            {getStatusLabel(req.status)}
                          </span>
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#2D6FE8]/10 bg-[#F4F8FD] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#111827]">
                          Expires
                        </p>

                        <p className="mt-1 truncate text-xs font-bold text-[#111827]">
                          {formatDate(req.token_expires_at)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#2D6FE8]/10 bg-[#F4F8FD] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#111827]">
                          Created
                        </p>

                        <p className="mt-1 truncate text-xs font-bold text-[#111827]">
                          {formatDate(req.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleView(req)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#2D6FE8]/20 bg-[#F4F8FD] px-4 py-2.5 text-xs font-bold text-[#111827]"
                      >
                        <FiEye size={14} />
                        View
                      </button>

                      {/* ✅ SEND LINK: hidden for completed requests */}
                      {showSendLink && (
                        <button
                          type="button"
                          onClick={() => void handleSendLink(req.id)}
                          disabled={sending}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <FiSend
                            size={14}
                            className={sending ? "animate-pulse" : ""}
                          />
                          {sending ? "Sending..." : "Send Link"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* PAGINATION */}
          {!pageLoading && filteredRequests.length > 0 && (
            <div className="border-t border-[#DCE6F2] bg-[#F8FBFF] px-4 py-4 sm:px-5">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-xs text-[#111827]">
                  Showing{" "}
                  <span className="font-bold">{startEntry}</span> to{" "}
                  <span className="font-bold">{endEntry}</span> of{" "}
                  <span className="font-bold">
                    {filteredRequests.length}
                  </span>{" "}
                  entries
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => page - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2D6FE8]/15 bg-white text-[#111827] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronLeft size={17} />
                  </button>

                  {paginationPages.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      aria-current={currentPage === page ? "page" : undefined}
                      className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold ${
                        currentPage === page
                          ? "bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-white shadow-md shadow-[#2D6FE8]/20"
                          : "text-[#111827] hover:bg-[#F4F8FD]"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => page + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2D6FE8]/15 bg-white text-[#111827] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronRight size={17} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* DETAIL MODAL */}
      <CorrectionDetailModal
        open={detailOpen}
        request={selectedRequest}
        onClose={() => {
          setDetailOpen(false);
          setSelectedRequest(null);
        }}
        onSendLink={handleSendLink}
        sendingLink={
          selectedRequest ? sendingLinkId === selectedRequest.id : false
        }
        canSendLink={canSendLink}
      />
    </>
  );
};

export default CorrectionRequests;