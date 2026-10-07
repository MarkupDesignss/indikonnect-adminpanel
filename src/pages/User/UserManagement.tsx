import React, { useEffect, useMemo, useState, useRef } from "react";
import { useLocation } from "react-router-dom";

import {
  FiSearch,
  FiRefreshCw,
  FiEye,
  FiX,
  FiUser,
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiShield,
  FiCreditCard,
  FiBriefcase,
  FiCheckCircle,
  FiAlertCircle,
  FiChevronDown,
  FiDownload,
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

import GlobalModal from "@/components/common/GlobalModal";
import CreateDistributorModal from "./CreateDistributorModal";
import userManagementApi, {
  RegisteredUser,
} from "../../api/endpoints/user";

// =====================================================
// ✅ PERMISSIONS
// =====================================================

import { usePermissions } from "../../pages/permissions/usePermissions";

// =====================================================
// FILTER TYPE
// =====================================================

type UserFilter =
  | "all"
  | "customer"
  | "distributor"
  | "active"
  | "inactive";

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
// TYPES
// =====================================================

interface KycProfileLike {
  id?: number | null;
  gst_in?: string | null;
  company_name?: string | null;
  user_id?: number | null;

  aadhaar_verified?: boolean | null;
  aadhaar_verified_at?: string | null;
  aadhaar_consent?: boolean | null;

  pan_verified?: boolean | null;
  pan_verified_at?: string | null;

  bank_verified?: boolean | null;
  bank_holder_name?: string | null;
  bank_name?: string | null;
  bank_ifsc?: string | null;
  account_type?: string | null;

  title?: string | null;
  type_of_entity?: string | null;
  branch_name?: string | null;

  kyc_status?: string | null;
  application_status?: string | null;

  location_consent?: boolean | null;
  location_consent_at?: string | null;

  latitude?: string | null;
  longitude?: string | null;

  pincode?: string | null;
  city?: string | null;
  state?: string | null;

  registration_completed?: boolean | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  withdrawn_at?: string | null;
  reviewed_by?: number | null;
  rejection_reason?: string | null;
  terms_accepted_at?: string | null;

  created_at?: string | null;
  updated_at?: string | null;

  [key: string]: any;
}

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

const getUserName = (user: RegisteredUser) => {
  if (user.full_name?.trim()) return user.full_name;

  if (user.email) return user.email.split("@")[0];

  return "Unknown User";
};

const getInitials = (user: RegisteredUser) => {
  const name = getUserName(user);

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const getAccountLabel = (accountType: string) => {
  return accountType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// =====================================================
// KYC PROFILE
// =====================================================

const getKycProfile = (
  user: RegisteredUser,
): KycProfileLike | null => {
  const userWithProfiles = user as RegisteredUser & {
    distributor_profile?: KycProfileLike | null;
  };

  const businessProfile = (
    user as RegisteredUser & {
      business_profile?: KycProfileLike | null;
    }
  ).business_profile;

  const distributorProfile =
    userWithProfiles.distributor_profile;

  return businessProfile || distributorProfile || null;
};

const getEffectiveKycStatus = (
  user: RegisteredUser,
): string => {
  const profile = getKycProfile(user);

  if (profile?.kyc_status) {
    return String(profile.kyc_status).toLowerCase();
  }

  if (user.distributor_status) {
    return user.distributor_status.toLowerCase();
  }

  return "pending";
};

// =====================================================
// ✅ STATUS BADGES — NAVY / YELLOW / BLUE THEME
// =====================================================

const getActiveStatusClass = (active: boolean) => {
  return active
    ? "border-[#1E3A8A]/25 bg-[#EAF1FF] text-[#1E3A8A]"
    : "border-[#D8E2F0] bg-[#F3F6FB] text-[#4A5778]";
};

const getDistributorStatusClass = (status: string) => {
  const normalizedStatus = status?.toLowerCase() || "";

  switch (normalizedStatus) {
    case "active":
    case "verified":
    case "approved":
      return "border-[#1E3A8A]/25 bg-[#EAF1FF] text-[#1E3A8A]";

    case "pending":
      return "border-[#FACC15]/40 bg-[#FEF9C3] text-[#8A6D16]";

    case "rejected":
      return "border-[#C23B32]/25 bg-[#FBEAEA] text-[#C23B32]";

    default:
      return "border-[#D8E2F0] bg-[#F3F6FB] text-[#4A5778]";
  }
};

const getKycStatusClass = (status: string) => {
  const normalizedStatus = status?.toLowerCase() || "";

  switch (normalizedStatus) {
    case "active":
    case "verified":
    case "approved":
      return "border-[#1E3A8A]/25 bg-[#EAF1FF] text-[#1E3A8A]";

    case "pending":
      return "border-[#FACC15]/40 bg-[#FEF9C3] text-[#8A6D16]";

    case "rejected":
      return "border-[#C23B32]/25 bg-[#FBEAEA] text-[#C23B32]";

    default:
      return "border-[#D8E2F0] bg-[#F3F6FB] text-[#4A5778]";
  }
};

const getKycDisplayLabel = (status: string) => {
  const normalizedStatus = status?.toLowerCase() || "";

  if (
    normalizedStatus === "active" ||
    normalizedStatus === "verified" ||
    normalizedStatus === "approved"
  ) {
    return "Verified";
  }

  if (normalizedStatus === "pending") return "Pending";

  if (normalizedStatus === "rejected") return "Rejected";

  return status || "N/A";
};

// =====================================================
// CSV HELPERS
// =====================================================

const csvEscape = (value: unknown) => {
  if (value === null || value === undefined) {
    return '""';
  }

  let stringValue = String(value);

  stringValue = stringValue.replace(/\r?\n|\r/g, " ");
  stringValue = stringValue.replace(/"/g, '""');

  return `"${stringValue}"`;
};

const getCsvBoolean = (
  value?: boolean | number | null,
) => {
  return value === true || value === 1 ? "Yes" : "No";
};

const getDateStamp = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getExportRows = (
  users: RegisteredUser[],
) => {
  return users.map((user, index) => {
    const profile = getKycProfile(user);
    const kycStatus = getEffectiveKycStatus(user);

    return {
      "S.No.": index + 1,
      "User ID": user.id ?? "",
      "Full Name": getUserName(user),
      Email: user.email ?? "",
      Phone: user.phone ?? "",
      Country: user.country ?? "",
      "Date of Birth": formatDateOnly(user.date_of_birth),
      "Account Type": getAccountLabel(user.account_type || ""),
      "User Status": user.is_active ? "Active" : "Inactive",
      "KYC Status": getKycDisplayLabel(kycStatus),
      "Distributor Status": user.distributor_status || "",
      "Distributor ID": user.distributor_id || "",
      "Sponsor ID": user.sponsor_id || "",
      "Placement Leg": user.placement_leg || "",
      "Registration Step": user.registration_step ?? "",
      "Is Registered": getCsvBoolean(user.is_registered),
      "Phone Verified": getCsvBoolean(user.phone_verified),
      "Phone Verified At": formatDate(user.phone_verified_at),
      "Email Verified": user.email_verified_at ? "Yes" : "No",
      "Email Verified At": formatDate(user.email_verified_at),
      "Activation Date": formatDate(user.activation_date),
      "Registration Completed At": formatDate(user.registration_completed_at),
      Terms: getCsvBoolean(user.terms_condition),
      "Terms Accepted": getCsvBoolean(user.accept_terms),
      Agreement: getCsvBoolean(user.accept_agreement),
      "Code of Conduct": getCsvBoolean(user.accept_code_of_conduct),
      "Location Consent": getCsvBoolean(user.location_consent_given),
      "Aadhaar Last 4": user.aadhaar_last4 || "",
      "Aadhaar Verified": getCsvBoolean(profile?.aadhaar_verified),
      "PAN Last 4": user.pan_last4 || "",
      "PAN Verified": getCsvBoolean(profile?.pan_verified),
      "Bank Account Last 4": user.account_last4 || "",
      "Bank Verified": getCsvBoolean(profile?.bank_verified),
      "Bank Name": profile?.bank_name || "",
      "Bank Holder Name": profile?.bank_holder_name || "",
      "KYC Account Type": profile?.account_type || "",
      "Entity Type": profile?.type_of_entity || "",
      "Company Name": profile?.company_name || "",
      "Application Status": profile?.application_status || "",
      "Registration Completed": getCsvBoolean(profile?.registration_completed),
      "Submitted At": formatDate(profile?.submitted_at),
      "Reviewed At": formatDate(profile?.reviewed_at),
      "Rejection Reason": profile?.rejection_reason || "",
      Created: formatDate(user.created_at),
      Updated: formatDate(user.updated_at),
    };
  });
};

const downloadUsersCsv = (
  users: RegisteredUser[],
  filename: string,
) => {
  if (!users.length) {
    toast.error("No users available for CSV export.");
    return;
  }

  const rows = getExportRows(users);

  if (!rows.length) {
    toast.error("No data available for CSV export.");
    return;
  }

  const headers = Object.keys(rows[0]);

  const csvLines = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) =>
      headers
        .map((header) =>
          csvEscape(row[header as keyof typeof row]),
        )
        .join(","),
    ),
  ];

  const csvContent = "\uFEFF" + csvLines.join("\r\n");

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

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 500);

  toast.success(
    `${users.length} user${users.length === 1 ? "" : "s"} exported successfully.`,
  );
};

// =====================================================
// ✅ USER STATUS DROPDOWN — NAVY / YELLOW THEME
// =====================================================

interface UserStatusDropdownProps {
  userId: number;
  isActive: boolean;
  onStatusChange: (
    userId: number,
    newStatus: boolean,
  ) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const UserStatusDropdown: React.FC<UserStatusDropdownProps> = ({
  userId,
  isActive,
  onStatusChange,
  isLoading,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const statusOptions = [
    {
      value: true,
      label: "Active",
      color: "text-[#1E3A8A]",
    },
    {
      value: false,
      label: "Inactive",
      color: "text-[#4A5778]",
    },
  ];

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
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (value: boolean) => {
    if (value !== isActive) {
      onStatusChange(userId, value);
    }
    setIsOpen(false);
  };

  const getCurrentLabel = () => (isActive ? "Active" : "Inactive");

  // ✅ Agar permission nahi — readonly badge
  if (disabled) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${getActiveStatusClass(
          isActive,
        )}`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            isActive ? "bg-[#1E3A8A]" : "bg-[#8C97B2]"
          }`}
        />
        {getCurrentLabel()}
      </span>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
          isLoading
            ? "cursor-not-allowed opacity-50"
            : "hover:border-[#1E3A8A]/40"
        } ${getActiveStatusClass(isActive)}`}
      >
        <span
          className={
            isActive ? "text-[#1E3A8A]" : "text-[#4A5778]"
          }
        >
          {getCurrentLabel()}
        </span>

        <FiChevronDown
          size={14}
          className={`transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1 w-36 rounded-xl border border-[#1E3A8A]/15 bg-white py-1 shadow-lg">
          {statusOptions.map((option) => (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full px-4 py-2 text-left text-xs font-bold transition hover:bg-[#F5F8FF] ${
                option.value === isActive
                  ? "cursor-default bg-[#EAF1FF]"
                  : ""
              } ${option.color}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// =====================================================
// ✅ DISTRIBUTOR STATUS DROPDOWN — NAVY / YELLOW THEME
// =====================================================

interface DistributorStatusDropdownProps {
  userId: number;
  currentStatus: string;
  kycStatus: string;
  onStatusChange: (
    userId: number,
    newStatus: string,
  ) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const DistributorStatusDropdown: React.FC<
  DistributorStatusDropdownProps
> = ({
  userId,
  currentStatus,
  kycStatus,
  onStatusChange,
  isLoading,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const effectiveStatus = (
    kycStatus ||
    currentStatus ||
    "pending"
  ).toLowerCase();

  const isKycPending = effectiveStatus === "pending";

  const isKycVerified =
    effectiveStatus === "active" ||
    effectiveStatus === "verified" ||
    effectiveStatus === "approved";

  const isKycRejected = effectiveStatus === "rejected";

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
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Non-pending ya disabled — badge only
  if (!isKycPending || disabled) {
    let label = "N/A";

    let statusClass =
      "border-[#D8E2F0] bg-[#F3F6FB] text-[#4A5778]";

    if (isKycVerified) {
      label = "Verified";
      statusClass =
        "border-[#1E3A8A]/25 bg-[#EAF1FF] text-[#1E3A8A]";
    } else if (isKycRejected) {
      label = "Rejected";
      statusClass =
        "border-[#C23B32]/25 bg-[#FBEAEA] text-[#C23B32]";
    } else {
      label = getKycDisplayLabel(effectiveStatus);
    }

    return (
      <span
        className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${statusClass}`}
      >
        {label}
      </span>
    );
  }

  const statusOptions = [
    {
      value: "active",
      label: "Verify & Activate",
      color: "text-[#1E3A8A]",
    },
    {
      value: "rejected",
      label: "Reject",
      color: "text-[#C23B32]",
    },
  ];

  const handleSelect = (value: string) => {
    if (value !== currentStatus) {
      onStatusChange(userId, value);
    }
    setIsOpen(false);
  };

  const getCurrentLabel = () => {
    const option = statusOptions.find(
      (opt) => opt.value === currentStatus,
    );
    return option ? option.label : "Pending";
  };

  const getCurrentColor = () => {
    const option = statusOptions.find(
      (opt) => opt.value === currentStatus,
    );
    return option ? option.color : "text-[#8A6D16]";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
          isLoading
            ? "cursor-not-allowed opacity-50"
            : "hover:border-[#1E3A8A]/40"
        } ${getDistributorStatusClass("pending")}`}
      >
        <span className={getCurrentColor()}>
          {getCurrentLabel()}
        </span>

        <FiChevronDown
          size={14}
          className={`transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1 w-44 rounded-xl border border-[#1E3A8A]/15 bg-white py-1 shadow-lg">
          <div className="border-b border-[#1E3A8A]/10 px-3 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A6D16]">
              KYC Pending
            </span>
          </div>

          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full px-4 py-2 text-left text-xs font-bold transition hover:bg-[#F5F8FF] ${
                option.value === currentStatus
                  ? "cursor-default bg-[#EAF1FF]"
                  : ""
              } ${option.color}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// =====================================================
// STAT CARD — NAVY / YELLOW THEME
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
  tileClass = "bg-[#EAF1FF]",
  tileIconClass = "text-[#1E3A8A]",
}) => {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{
        y: -4,
        boxShadow: "0 16px 30px -18px rgba(30,58,138,0.28)",
      }}
      className="relative min-h-[135px] overflow-hidden rounded-2xl border border-[#E3E9F5] bg-white p-5 shadow-sm"
    >
      <div className={`absolute left-0 top-0 h-1 w-full ${accent}`} />

      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full border border-[#1E3A8A]/10" />

      <div className="pointer-events-none absolute -right-3 -top-3 h-14 w-14 rounded-full border border-[#1E3A8A]/10" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#8C97B2]">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-[#0F1B3D]">
            {value.toLocaleString("en-IN")}
          </p>

          <p className="mt-1 text-xs text-[#8C97B2]">{subtitle}</p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${tileClass} ${tileIconClass}`}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

// =====================================================
// INFO ROW
// =====================================================

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#1E3A8A]/10 py-3 last:border-b-0">
      <span className="text-xs text-[#8C97B2]">{label}</span>
      <span className="max-w-[62%] text-right text-sm font-semibold text-[#0F1B3D]">
        {value}
      </span>
    </div>
  );
};

// =====================================================
// USER DETAIL MODAL
// =====================================================

interface UserDetailModalProps {
  open: boolean;
  loading: boolean;
  user: RegisteredUser | null;
  onClose: () => void;
  onUserStatusChange?: (
    userId: number,
    newStatus: boolean,
  ) => void;
  onDistributorStatusChange?: (
    userId: number,
    newStatus: string,
  ) => void;
  isLoading?: boolean;
  isDistributorLoading?: boolean;
  canChangeUserStatus?: boolean;
  canChangeDistributorStatus?: boolean;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({
  open,
  loading,
  user,
  onClose,
  onUserStatusChange,
  onDistributorStatusChange,
  isLoading = false,
  isDistributorLoading = false,
  canChangeUserStatus = false,
  canChangeDistributorStatus = false,
}) => {
  if (!open) return null;

  const kycStatus = user ? getEffectiveKycStatus(user) : "";
  const kycProfile = user ? getKycProfile(user) : null;

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={false}
    >
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#E3E9F5] bg-white shadow-2xl">
        {/* NAVY → YELLOW top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#FACC15]" />

        {/* HEADER */}
        <div className="flex items-start justify-between gap-4 border-b border-[#1E3A8A]/10 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] text-sm font-bold text-white">
              {user ? getInitials(user) : <FiUser size={19} />}
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1E3A8A]">
                User Management
              </p>

              <h2 className="mt-0.5 text-xl font-bold text-[#0F1B3D]">
                {user ? getUserName(user) : "User Details"}
              </h2>

              {user && (
                <p className="mt-1 text-xs text-[#8C97B2]">
                  User ID #{user.id}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E3A8A]/15 bg-[#F5F8FF] text-[#1E3A8A] transition hover:bg-[#EAF1FF]"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="max-h-[calc(95vh-150px)] overflow-y-auto p-5 sm:p-6">
          {loading ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
                <FiRefreshCw size={25} className="animate-spin" />
              </div>

              <p className="mt-4 text-sm font-bold text-[#0F1B3D]">
                Loading user details...
              </p>

              <p className="mt-1 text-xs text-[#8C97B2]">
                Please wait while we fetch the complete profile.
              </p>
            </div>
          ) : !user ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBEAEA] text-[#C23B32]">
                <FiAlertCircle size={25} />
              </div>

              <p className="mt-4 text-sm font-bold text-[#C23B32]">
                User details not found.
              </p>
            </div>
          ) : (
            <>
              {/* TOP SUMMARY */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-[#E3E9F5] bg-[#F5F8FF] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                    Account Type
                  </p>
                  <p className="mt-2 text-lg font-bold text-[#0F1B3D]">
                    {getAccountLabel(user.account_type)}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#E3E9F5] bg-[#F5F8FF] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                    User Status
                  </p>
                  <div className="mt-2">
                    {onUserStatusChange && canChangeUserStatus ? (
                      <UserStatusDropdown
                        userId={user.id}
                        isActive={user.is_active}
                        onStatusChange={onUserStatusChange}
                        isLoading={isLoading}
                      />
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${getActiveStatusClass(
                          user.is_active,
                        )}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            user.is_active
                              ? "bg-[#1E3A8A]"
                              : "bg-[#8C97B2]"
                          }`}
                        />
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#1E3A8A]/20 bg-gradient-to-br from-[#F5F8FF] to-[#EAF1FF] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#1E3A8A]">
                    KYC Status
                  </p>
                  <div className="mt-2">
                    {user.account_type === "distributor" &&
                    onDistributorStatusChange &&
                    canChangeDistributorStatus ? (
                      <DistributorStatusDropdown
                        userId={user.id}
                        currentStatus={
                          user.distributor_status || "pending"
                        }
                        kycStatus={kycStatus}
                        onStatusChange={onDistributorStatusChange}
                        isLoading={isDistributorLoading}
                      />
                    ) : (
                      <span
                        className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${getKycStatusClass(
                          kycStatus,
                        )}`}
                      >
                        {getKycDisplayLabel(kycStatus)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* PERSONAL + ACCOUNT */}
              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-[#E3E9F5] bg-[#F5F8FF] p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
                      <FiUser size={17} />
                    </div>
                    <h3 className="text-sm font-bold text-[#0F1B3D]">
                      Personal Information
                    </h3>
                  </div>

                  <InfoRow label="Full Name" value={getUserName(user)} />
                  <InfoRow label="Email" value={user.email} />
                  <InfoRow label="Phone" value={user.phone || "N/A"} />
                  <InfoRow label="Country" value={user.country || "N/A"} />
                  <InfoRow
                    label="Date of Birth"
                    value={formatDateOnly(user.date_of_birth)}
                  />
                </div>

                <div className="rounded-2xl border border-[#E3E9F5] bg-[#F5F8FF] p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
                      <FiShield size={17} />
                    </div>
                    <h3 className="text-sm font-bold text-[#0F1B3D]">
                      Account Information
                    </h3>
                  </div>

                  <InfoRow
                    label="Registered"
                    value={user.is_registered ? "Yes" : "No"}
                  />
                  <InfoRow
                    label="Registration Step"
                    value={user.registration_step}
                  />
                  <InfoRow
                    label="Created At"
                    value={formatDate(user.created_at)}
                  />
                  <InfoRow
                    label="Updated At"
                    value={formatDate(user.updated_at)}
                  />
                  <InfoRow
                    label="Activation Date"
                    value={formatDate(user.activation_date)}
                  />
                </div>
              </div>

              {/* VERIFICATION */}
              <div className="mt-5 rounded-2xl border border-[#E3E9F5] bg-[#F5F8FF] p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
                    <FiCheckCircle size={17} />
                  </div>
                  <h3 className="text-sm font-bold text-[#0F1B3D]">
                    Verification
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-[#E3E9F5] bg-white p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8C97B2]">Phone</span>
                      <span
                        className={`text-[10px] font-bold ${
                          user.phone_verified
                            ? "text-[#1E3A8A]"
                            : "text-[#C23B32]"
                        }`}
                      >
                        {user.phone_verified
                          ? "Verified"
                          : "Not Verified"}
                      </span>
                    </div>
                    {user.phone_verified_at && (
                      <p className="mt-2 text-[10px] text-[#8C97B2]">
                        {formatDate(user.phone_verified_at)}
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-[#E3E9F5] bg-white p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8C97B2]">Email</span>
                      <span
                        className={`text-[10px] font-bold ${
                          user.email_verified_at
                            ? "text-[#1E3A8A]"
                            : "text-[#C23B32]"
                        }`}
                      >
                        {user.email_verified_at
                          ? "Verified"
                          : "Not Verified"}
                      </span>
                    </div>
                    {user.email_verified_at && (
                      <p className="mt-2 text-[10px] text-[#8C97B2]">
                        {formatDate(user.email_verified_at)}
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-[#E3E9F5] bg-white p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8C97B2]">Terms</span>
                      <span
                        className={`text-[10px] font-bold ${
                          user.terms_condition
                            ? "text-[#1E3A8A]"
                            : "text-[#C23B32]"
                        }`}
                      >
                        {user.terms_condition
                          ? "Accepted"
                          : "Not Accepted"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* DISTRIBUTOR */}
              {user.account_type === "distributor" && (
                <div className="mt-5 rounded-2xl border border-[#1E3A8A]/20 bg-gradient-to-br from-[#FBFDFF] to-[#F5F8FF] p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
                      <FiBriefcase size={17} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0F1B3D]">
                        Distributor Information
                      </h3>
                      <p className="mt-0.5 text-xs text-[#8C97B2]">
                        Distributor registration and KYC information.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-[#E3E9F5] bg-white p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                        Distributor ID
                      </p>
                      <p className="mt-1 text-sm font-bold text-[#0F1B3D]">
                        {user.distributor_id || "Not Assigned"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#E3E9F5] bg-white p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                        Sponsor ID
                      </p>
                      <p className="mt-1 truncate text-sm font-bold text-[#0F1B3D]">
                        {user.sponsor_id || "Not Assigned"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#E3E9F5] bg-white p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                        Placement
                      </p>
                      <p className="mt-1 text-sm font-bold capitalize text-[#0F1B3D]">
                        {user.placement_leg || "Not Assigned"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#E3E9F5] bg-white p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                        Registration
                      </p>
                      <p className="mt-1 text-sm font-bold text-[#0F1B3D]">
                        Step {user.registration_step}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-[#E3E9F5] bg-white p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                      KYC Status
                    </p>
                    <div className="mt-2">
                      {onDistributorStatusChange &&
                      canChangeDistributorStatus ? (
                        <DistributorStatusDropdown
                          userId={user.id}
                          currentStatus={
                            user.distributor_status || "pending"
                          }
                          kycStatus={kycStatus}
                          onStatusChange={onDistributorStatusChange}
                          isLoading={isDistributorLoading}
                        />
                      ) : (
                        <span
                          className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${getKycStatusClass(
                            kycStatus,
                          )}`}
                        >
                          {getKycDisplayLabel(kycStatus)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* KYC */}
              {kycProfile && (
                <div className="mt-5 rounded-2xl border border-[#E3E9F5] bg-[#F5F8FF] p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
                      <FiCreditCard size={17} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0F1B3D]">
                        KYC & Banking
                      </h3>
                      <p className="mt-0.5 text-xs text-[#8C97B2]">
                        Verification status and masked account information.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-[#E3E9F5] bg-white p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                        KYC Status
                      </p>
                      <p className="mt-1 text-sm font-bold capitalize text-[#0F1B3D]">
                        {getKycDisplayLabel(
                          kycProfile.kyc_status || kycStatus,
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#E3E9F5] bg-white p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                        Aadhaar
                      </p>
                      <p className="mt-1 text-sm font-bold text-[#0F1B3D]">
                        {user.aadhaar_last4
                          ? `XXXX XXXX ${user.aadhaar_last4}`
                          : "Not Available"}
                      </p>
                      <p
                        className={`mt-1 text-[10px] font-bold ${
                          kycProfile.aadhaar_verified
                            ? "text-[#1E3A8A]"
                            : "text-[#C23B32]"
                        }`}
                      >
                        {kycProfile.aadhaar_verified
                          ? "Verified"
                          : "Not Verified"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#E3E9F5] bg-white p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                        PAN
                      </p>
                      <p className="mt-1 text-sm font-bold text-[#0F1B3D]">
                        {user.pan_last4
                          ? `XXXXXX${user.pan_last4}`
                          : "Not Available"}
                      </p>
                      <p
                        className={`mt-1 text-[10px] font-bold ${
                          kycProfile.pan_verified
                            ? "text-[#1E3A8A]"
                            : "text-[#C23B32]"
                        }`}
                      >
                        {kycProfile.pan_verified
                          ? "Verified"
                          : "Not Verified"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#E3E9F5] bg-white p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                        Bank Account
                      </p>
                      <p className="mt-1 text-sm font-bold text-[#0F1B3D]">
                        {user.account_last4
                          ? `XXXX${user.account_last4}`
                          : "Not Available"}
                      </p>
                      <p
                        className={`mt-1 text-[10px] font-bold ${
                          kycProfile.bank_verified
                            ? "text-[#1E3A8A]"
                            : "text-[#C23B32]"
                        }`}
                      >
                        {kycProfile.bank_verified
                          ? "Verified"
                          : "Not Verified"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-[#E3E9F5] bg-white p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                        Bank Name
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#0F1B3D]">
                        {kycProfile.bank_name || "N/A"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#E3E9F5] bg-white p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                        Account Holder
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#0F1B3D]">
                        {kycProfile.bank_holder_name || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* CONSENTS */}
              <div className="mt-5 rounded-2xl border border-[#E3E9F5] bg-[#F5F8FF] p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
                    <FiCheckCircle size={17} />
                  </div>
                  <h3 className="text-sm font-bold text-[#0F1B3D]">
                    Registration Consents
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "Terms", value: user.accept_terms },
                    { label: "Agreement", value: user.accept_agreement },
                    {
                      label: "Code of Conduct",
                      value: user.accept_code_of_conduct,
                    },
                    {
                      label: "Location Consent",
                      value: user.location_consent_given,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-xl border border-[#E3E9F5] bg-white p-3"
                    >
                      <span className="text-xs text-[#8C97B2]">
                        {item.label}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          item.value
                            ? "text-[#1E3A8A]"
                            : "text-[#C23B32]"
                        }`}
                      >
                        {item.value ? "Accepted" : "Not Accepted"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex justify-end border-t border-[#1E3A8A]/10 bg-[#FBFDFF] px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#1E3A8A]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#4A5778] transition hover:bg-[#F5F8FF] hover:text-[#1E3A8A]"
          >
            Close
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// MAIN PAGE
// =====================================================

const UserManagement: React.FC = () => {
  const location = useLocation();

  // ===================================================
  // ✅ PERMISSIONS
  // ===================================================

  const {
    hasPermission,
    hasModuleAccess,
    isSuperAdmin,
  } = usePermissions();

  const canViewUsers = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("user") ||
      hasPermission("user.view"),
    [isSuperAdmin, hasModuleAccess, hasPermission],
  );

  const canCreateUser = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("user.create") ||
      hasPermission("admin_member.create"),
    [isSuperAdmin, hasPermission],
  );

  const canChangeUserStatus = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("user.change_status") ||
      hasPermission("user.active") ||
      hasPermission("user.inactive"),
    [isSuperAdmin, hasPermission],
  );

  const canChangeDistributorStatus = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("user.details") ||
      hasPermission("user.change_status") ||
      hasPermission("admin_member.edit"),
    [isSuperAdmin, hasPermission],
  );

  const canExport = useMemo(
    () => isSuperAdmin || hasModuleAccess("user"),
    [isSuperAdmin, hasModuleAccess],
  );

  // ===================================================
  // LOCATION STATE
  // ===================================================

  const kycUserName = location.state?.kycUserName as
    | string
    | undefined;

  const userFromHeader = location.state?.user as
    | RegisteredUser
    | undefined;

  const adminFromHeader = location.state?.admin as
    | RegisteredUser
    | undefined;

  const personFromHeader = userFromHeader || adminFromHeader;

  // ===================================================
  // STATE
  // ===================================================

  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<UserFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] =
    useState<RegisteredUser | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState<number | null>(
    null,
  );
  const [distributorLoadingId, setDistributorLoadingId] = useState<
    number | null
  >(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [highlightedUserId, setHighlightedUserId] = useState<
    number | null
  >(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const ITEMS_PER_PAGE = 10;

  // ===================================================
  // FETCH USERS
  // ===================================================

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const response = await userManagementApi.getRegisteredUsers();

      if (response.data.success) {
        const userData = response.data.data || [];

        setUsers(userData);

        // PRIORITY 1: KYC USER
        if (kycUserName && isInitialLoad && userData.length > 0) {
          const searchTerm = kycUserName.trim().toLowerCase();

          const targetUser = userData.find(
            (user: RegisteredUser) => {
              const fullName = (user.full_name || "").toLowerCase();
              const email = (user.email || "").toLowerCase();

              return (
                fullName.includes(searchTerm) ||
                email.includes(searchTerm) ||
                fullName === searchTerm
              );
            },
          );

          if (targetUser) {
            const term =
              targetUser.full_name ||
              targetUser.email ||
              String(targetUser.id);

            setSearch(term);
            setHighlightedUserId(targetUser.id);
            await handleView(targetUser.id);

            toast.success(
              `Found KYC review for ${getUserName(targetUser)}`,
            );
          } else {
            setSearch(kycUserName);
            toast.info(`Searching for user: ${kycUserName}`);
          }

          setIsInitialLoad(false);
          return;
        }

        // PRIORITY 2: HEADER USER
        if (personFromHeader && isInitialLoad && userData.length > 0) {
          const targetUser = userData.find(
            (user: RegisteredUser) =>
              String(user.id) === String(personFromHeader.id),
          );

          if (targetUser) {
            const term =
              targetUser.full_name ||
              targetUser.email ||
              String(targetUser.id);

            setSearch(term);
            setHighlightedUserId(targetUser.id);
            await handleView(targetUser.id);
          } else {
            setSearch(String(personFromHeader.id));
            toast.info(
              `Looking for user with ID: ${personFromHeader.id}`,
            );
          }

          setIsInitialLoad(false);
        }
      } else {
        toast.error(response.data.message || "Unable to fetch users.");
      }
    } catch (error: any) {
      console.error("Fetch users error:", error);
      toast.error(
        error?.response?.data?.message || "Unable to fetch users.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ===================================================
  // STATS
  // ===================================================

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((user) => user.is_active).length;
    const inactive = users.filter((user) => !user.is_active).length;
    const distributors = users.filter(
      (user) => user.account_type === "distributor",
    ).length;
    const customers = users.filter(
      (user) => user.account_type === "customer",
    ).length;

    return { total, active, inactive, distributors, customers };
  }, [users]);

  // ===================================================
  // FILTER
  // ===================================================

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const searchMatch =
        !query ||
        [
          user.full_name || "",
          user.email,
          user.phone || "",
          user.country || "",
          user.account_type || "",
          user.distributor_id || "",
          user.sponsor_id || "",
          String(user.id),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      if (!searchMatch) return false;

      switch (activeFilter) {
        case "customer":
          return user.account_type === "customer";
        case "distributor":
          return user.account_type === "distributor";
        case "active":
          return user.is_active;
        case "inactive":
          return !user.is_active;
        default:
          return true;
      }
    });
  }, [users, search, activeFilter]);

  // ===================================================
  // CSV EXPORT
  // ===================================================

  const tabExportUsers = useMemo(() => {
    switch (activeFilter) {
      case "customer":
        return users.filter((user) => user.account_type === "customer");
      case "distributor":
        return users.filter(
          (user) => user.account_type === "distributor",
        );
      case "active":
        return users.filter((user) => user.is_active);
      case "inactive":
        return users.filter((user) => !user.is_active);
      case "all":
      default:
        return users;
    }
  }, [users, activeFilter]);

  const getExportTabLabel = () => {
    switch (activeFilter) {
      case "customer":
        return "customers";
      case "distributor":
        return "distributors";
      case "active":
        return "active";
      case "inactive":
        return "inactive";
      case "all":
      default:
        return "all";
    }
  };

  const getExportButtonLabel = () => {
    switch (activeFilter) {
      case "customer":
        return "Download csv Customers";
      case "distributor":
        return "Download csv Distributors";
      case "active":
        return "Download csv Active";
      case "inactive":
        return "Download csv Inactive";
      case "all":
      default:
        return "Download csv All";
    }
  };

  const handleExportAll = () => {
    const exportUsers = tabExportUsers;
    const exportLabel = getExportTabLabel();

    if (!exportUsers.length) {
      toast.error(
        `No ${exportLabel} users available for CSV export.`,
      );
      return;
    }

    const dateStamp = getDateStamp();
    downloadUsersCsv(
      exportUsers,
      `registered-users-${exportLabel}-${dateStamp}.csv`,
    );
  };

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / ITEMS_PER_PAGE),
  );

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const startEntry =
    filteredUsers.length === 0 ? 0 : startIndex + 1;

  const endEntry = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredUsers.length,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // ===================================================
  // HANDLERS
  // ===================================================

  const handleFilter = (filter: UserFilter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
    setHighlightedUserId(null);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
    setHighlightedUserId(null);
  };

  const handleView = async (id: number) => {
    try {
      setDetailOpen(true);
      setDetailLoading(true);
      setSelectedUser(null);

      const response = await userManagementApi.getUserById(id);

      if (response.data.success) {
        const detail = response.data.data?.[0] || null;
        setSelectedUser(detail);
      } else {
        toast.error(
          response.data.message || "Unable to fetch user details.",
        );
      }
    } catch (error: any) {
      console.error("View user error:", error);
      toast.error(
        error?.response?.data?.message ||
          "Unable to fetch user details.",
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleUserStatus = async (
    userId: number,
    nextStatus: boolean,
  ) => {
    try {
      setStatusLoadingId(userId);

      const response = await userManagementApi.updateUserStatus(
        userId,
        nextStatus,
      );

      if (response.data.success) {
        setUsers((prev) =>
          prev.map((item) =>
            item.id === userId
              ? { ...item, is_active: nextStatus }
              : item,
          ),
        );

        setSelectedUser((current) =>
          current?.id === userId
            ? { ...current, is_active: nextStatus }
            : current,
        );

        toast.success(
          response.data.message ||
            `User ${
              nextStatus ? "activated" : "deactivated"
            } successfully.`,
        );
      } else {
        toast.error(
          response.data.message || "Unable to update user status.",
        );
      }
    } catch (error: any) {
      console.error("User status error:", error);
      toast.error(
        error?.response?.data?.message ||
          "Unable to update user status.",
      );
    } finally {
      setStatusLoadingId(null);
    }
  };

  const handleUpdateDistributorStatus = async (
    userId: number,
    newStatus: string,
  ) => {
    try {
      setDistributorLoadingId(userId);

      const payloadStatus =
        newStatus === "active" ? "verified" : newStatus;

      const response =
        await userManagementApi.updateDistributorStatus(
          userId,
          payloadStatus,
        );

      if (response.data.success) {
        setUsers((prev) =>
          prev.map((item) => {
            if (item.id !== userId) return item;

            const existingBusinessProfile = (
              item as RegisteredUser & {
                business_profile?: KycProfileLike | null;
              }
            ).business_profile;

            const existingDistributorProfile = (
              item as RegisteredUser & {
                distributor_profile?: KycProfileLike | null;
              }
            ).distributor_profile;

            const updatedProfile = {
              ...(existingBusinessProfile ||
                existingDistributorProfile ||
                {}),
              kyc_status: newStatus,
            };

            return {
              ...item,
              distributor_status: newStatus,
              business_profile: existingBusinessProfile
                ? updatedProfile
                : (item as any).business_profile,
              distributor_profile: existingDistributorProfile
                ? updatedProfile
                : (item as any).distributor_profile,
            };
          }),
        );

        setSelectedUser((current) => {
          if (!current || current.id !== userId) return current;

          const existingBusinessProfile = (
            current as RegisteredUser & {
              business_profile?: KycProfileLike | null;
            }
          ).business_profile;

          const existingDistributorProfile = (
            current as RegisteredUser & {
              distributor_profile?: KycProfileLike | null;
            }
          ).distributor_profile;

          const updatedProfile = {
            ...(existingBusinessProfile ||
              existingDistributorProfile ||
              {}),
            kyc_status: newStatus,
          };

          return {
            ...current,
            distributor_status: newStatus,
            business_profile: existingBusinessProfile
              ? updatedProfile
              : (current as any).business_profile,
            distributor_profile: existingDistributorProfile
              ? updatedProfile
              : (current as any).distributor_profile,
          };
        });

        const displayStatus =
          newStatus === "active" ? "Verified" : newStatus;

        toast.success(
          response.data.message ||
            `KYC status updated to ${displayStatus} successfully.`,
        );
      } else {
        toast.error(
          response.data.message || "Unable to update KYC status.",
        );
      }
    } catch (error: any) {
      console.error("Update KYC status error:", error);
      toast.error(
        error?.response?.data?.message ||
          "Unable to update KYC status.",
      );
    } finally {
      setDistributorLoadingId(null);
    }
  };

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
  // ✅ ACCESS DENIED
  // ===================================================

  if (!canViewUsers && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8FF] font-poppins p-4">
        <div className="max-w-md rounded-2xl border border-[#E3E9F5] bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBEAEA] text-[#C23B32]">
            <FiAlertCircle size={26} />
          </div>
          <h2 className="text-lg font-bold text-[#0F1B3D]">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-[#6B7896]">
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
        className="min-h-screen bg-[#F5F8FF] p-4 font-poppins"
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
              <div className="h-2 w-2 rounded-full bg-[#1E3A8A]" />
              <div className="h-2 w-2 rounded-full bg-[#FACC15]" />
              <div className="h-2 w-2 rounded-full bg-[#2563EB]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1E3A8A]">
                User Management
              </span>
            </div>

            <h1 className="text-[28px] font-bold tracking-tight text-[#0F1B3D] sm:text-[30px]">
              Registered Users
            </h1>

            <p className="mt-1 text-sm text-[#8C97B2]">
              Manage customers, distributors, account status, and registration details.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* EXPORT — sirf tab dikhao jab permission ho */}
            {canExport && (
              <button
                type="button"
                onClick={handleExportAll}
                disabled={tabExportUsers.length === 0}
                title={`Download ${getExportTabLabel()} users`}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#1E3A8A]/20 bg-[#EAF1FF] px-4 text-sm font-bold text-[#1E3A8A] shadow-sm transition hover:border-[#1E3A8A]/35 hover:bg-[#DBEAFE] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiDownload size={16} />
                {getExportButtonLabel()}
              </button>
            )}

            {/* CREATE DISTRIBUTOR — sirf tab dikhao jab permission ho */}
            {canCreateUser && (
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1E40AF] to-[#1E3A8A] px-5 text-sm font-bold text-white shadow-md shadow-[#1E3A8A]/20 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <FiBriefcase size={16} />
                Create Distributor
              </button>
            )}

            {/* REFRESH */}
            <button
              type="button"
              onClick={fetchUsers}
              disabled={loading}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#1E3A8A]/20 bg-white px-4 text-sm font-bold text-[#1E3A8A] shadow-sm transition hover:border-[#1E3A8A]/35 hover:bg-[#F5F8FF] disabled:opacity-50"
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
            title="Total Users"
            value={stats.total}
            subtitle="All registered users"
            icon={<FiUsers size={21} />}
            accent="bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1E3A8A]"
            tileClass="bg-[#EAF1FF]"
            tileIconClass="text-[#1E3A8A]"
          />

          <StatCard
            title="Active Users"
            value={stats.active}
            subtitle="Currently active"
            icon={<FiUserCheck size={21} />}
            accent="bg-gradient-to-r from-[#FDE047] to-[#FACC15]"
            tileClass="bg-[#FEF9C3]"
            tileIconClass="text-[#1E293B]"
          />

          <StatCard
            title="Inactive Users"
            value={stats.inactive}
            subtitle="Currently inactive"
            icon={<FiUserX size={21} />}
            accent="bg-gradient-to-r from-[#8C97B2] to-[#4A5778]"
            tileClass="bg-[#F3F6FB]"
            tileIconClass="text-[#4A5778]"
          />

          <StatCard
            title="Distributors"
            value={stats.distributors}
            subtitle="Registered distributors"
            icon={<FiBriefcase size={21} />}
            accent="bg-gradient-to-r from-[#60A5FA] to-[#2563EB]"
            tileClass="bg-[#DBEAFE]"
            tileIconClass="text-[#1E40AF]"
          />
        </motion.div>

        {/* MAIN CARD */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-[#E3E9F5] bg-white shadow-sm"
        >
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#1E40AF] via-[#2563EB] to-[#FACC15]" />

          {/* TOOLBAR */}
          <div className="border-b border-[#1E3A8A]/10 p-4 sm:p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              {/* SEARCH */}
              <div className="relative w-full xl:w-[320px] xl:shrink-0">
                <FiSearch
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1E3A8A]"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search name, email, phone, ID..."
                  className="h-12 w-full rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] pl-11 pr-10 text-sm text-[#0F1B3D] outline-none transition placeholder:text-[#8C97B2] focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/15"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => handleSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C97B2] hover:text-[#1E3A8A]"
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>

              {/* FILTER TABS */}
              <div className="flex flex-1 items-center gap-1 overflow-x-auto rounded-xl border border-[#1E3A8A]/10 bg-[#F5F8FF] p-1">
                {[
                  { key: "all" as UserFilter, label: "All", count: stats.total },
                  {
                    key: "customer" as UserFilter,
                    label: "Customers",
                    count: stats.customers,
                  },
                  {
                    key: "distributor" as UserFilter,
                    label: "Distributors",
                    count: stats.distributors,
                  },
                  {
                    key: "active" as UserFilter,
                    label: "Active",
                    count: stats.active,
                  },
                  {
                    key: "inactive" as UserFilter,
                    label: "Inactive",
                    count: stats.inactive,
                  },
                ].map((tab) => {
                  const isActive = activeFilter === tab.key;

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => handleFilter(tab.key)}
                      className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-[#1E40AF] to-[#1E3A8A] text-white shadow-md shadow-[#1E3A8A]/20"
                          : "text-[#4A5778] hover:bg-white hover:text-[#1E3A8A]"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`inline-flex min-w-[24px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-[#EAF1FF] text-[#1E3A8A]"
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
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1350px] border-collapse">
              <thead>
                <tr className="bg-[#1E3A8A]">
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    S.No.
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    User
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    Contact
                  </th>
                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    Account Type
                  </th>
                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    User Status
                  </th>
                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    KYC Status
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    Registered
                  </th>
                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
                          <FiRefreshCw size={22} className="animate-spin" />
                        </div>
                        <p className="mt-4 text-sm font-bold text-[#0F1B3D]">
                          Loading users...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F8FF] text-[#1E3A8A]">
                          <FiUsers size={24} />
                        </div>
                        <p className="mt-4 text-sm font-bold text-[#0F1B3D]">
                          No users found
                        </p>
                        <p className="mt-1 text-xs text-[#8C97B2]">
                          Try another search or filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user, index) => {
                    const statusLoading = statusLoadingId === user.id;
                    const distributorLoading =
                      distributorLoadingId === user.id;
                    const isDistributor =
                      user.account_type === "distributor";
                    const distributorStatus =
                      user.distributor_status || "pending";
                    const kycStatus = getEffectiveKycStatus(user);
                    const isHighlighted =
                      highlightedUserId === user.id;

                    return (
                      <tr
                        key={user.id}
                        className={`border-b border-[#1E3A8A]/10 transition-all duration-300 ${
                          isHighlighted
                            ? "border-l-4 border-l-[#1E3A8A] bg-[#EAF1FF]/70 shadow-inner"
                            : "bg-white hover:bg-[#F5F8FF]"
                        }`}
                      >
                        <td className="px-5 py-4">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F8FF] text-xs font-bold text-[#1E3A8A]">
                            {startIndex + index + 1}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] text-xs font-bold text-white">
                              {user.profile_picture ? (
                                <img
                                  src={user.profile_picture}
                                  alt={getUserName(user)}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                getInitials(user)
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-[#0F1B3D]">
                                {getUserName(user)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="max-w-[220px]">
                            <p className="truncate text-xs font-semibold text-[#3A4668]">
                              {user.email}
                            </p>
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className="text-xs text-[#8C97B2]">
                                {user.phone || "No phone"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${
                              isDistributor
                                ? "border-[#1E3A8A]/25 bg-[#EAF1FF] text-[#1E3A8A]"
                                : "border-[#D8E2F0] bg-[#F3F6FB] text-[#4A5778]"
                            }`}
                          >
                            {isDistributor ? (
                              <FiBriefcase size={12} />
                            ) : (
                              <FiUser size={12} />
                            )}
                            {getAccountLabel(user.account_type)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <div className="flex justify-center">
                            <UserStatusDropdown
                              userId={user.id}
                              isActive={user.is_active}
                              onStatusChange={handleToggleUserStatus}
                              isLoading={statusLoading}
                              disabled={!canChangeUserStatus}
                            />
                          </div>
                        </td>

                        <td className="px-5 py-4 text-center">
                          {isDistributor ? (
                            <div className="flex justify-center">
                              <DistributorStatusDropdown
                                userId={user.id}
                                currentStatus={distributorStatus}
                                kycStatus={kycStatus}
                                onStatusChange={
                                  handleUpdateDistributorStatus
                                }
                                isLoading={distributorLoading}
                                disabled={!canChangeDistributorStatus}
                              />
                            </div>
                          ) : (
                            <span className="text-xs text-[#8C97B2]">—</span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <FiCalendar size={13} className="text-[#1E3A8A]" />
                            <span className="text-xs font-semibold text-[#3A4668]">
                              {formatDateOnly(user.created_at)}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={() => handleView(user.id)}
                              title="View User Details"
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E3A8A]/20 bg-[#F5F8FF] text-[#1E3A8A] transition hover:border-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white"
                            >
                              <FiEye size={15} />
                            </button>
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
            {loading ? (
              <div className="flex flex-col items-center px-5 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
                  <FiRefreshCw size={24} className="animate-spin" />
                </div>
                <p className="mt-4 text-sm font-bold text-[#0F1B3D]">
                  Loading users...
                </p>
              </div>
            ) : paginatedUsers.length > 0 ? (
              paginatedUsers.map((user, index) => {
                const statusLoading = statusLoadingId === user.id;
                const distributorLoading =
                  distributorLoadingId === user.id;
                const isDistributor =
                  user.account_type === "distributor";
                const distributorStatus =
                  user.distributor_status || "pending";
                const kycStatus = getEffectiveKycStatus(user);
                const isHighlighted = highlightedUserId === user.id;

                return (
                  <div
                    key={user.id}
                    className={`border-b border-[#1E3A8A]/10 p-4 transition-all duration-300 ${
                      isHighlighted
                        ? "border-l-4 border-l-[#1E3A8A] bg-[#EAF1FF]/70"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] text-xs font-bold text-white">
                          {user.profile_picture ? (
                            <img
                              src={user.profile_picture}
                              alt={getUserName(user)}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            getInitials(user)
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#0F1B3D]">
                            {getUserName(user)}
                          </p>
                          <p className="mt-1 truncate text-xs text-[#8C97B2]">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-[#8C97B2]">
                        #{startIndex + index + 1}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-[#1E3A8A]/10 bg-[#F5F8FF] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                          Type
                        </p>
                        <p className="mt-1 text-xs font-bold capitalize text-[#0F1B3D]">
                          {user.account_type}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#1E3A8A]/10 bg-[#F5F8FF] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                          Phone
                        </p>
                        <p className="mt-1 truncate text-xs font-bold text-[#0F1B3D]">
                          {user.phone || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <UserStatusDropdown
                        userId={user.id}
                        isActive={user.is_active}
                        onStatusChange={handleToggleUserStatus}
                        isLoading={statusLoading}
                        disabled={!canChangeUserStatus}
                      />

                      {isDistributor && (
                        <DistributorStatusDropdown
                          userId={user.id}
                          currentStatus={distributorStatus}
                          kycStatus={kycStatus}
                          onStatusChange={handleUpdateDistributorStatus}
                          isLoading={distributorLoading}
                          disabled={!canChangeDistributorStatus}
                        />
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleView(user.id)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#1E3A8A]/20 bg-[#F5F8FF] px-4 py-2.5 text-xs font-bold text-[#1E3A8A]"
                      >
                        <FiEye size={14} />
                        View
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center px-5 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F8FF] text-[#1E3A8A]">
                  <FiUsers size={24} />
                </div>
                <p className="mt-4 text-sm font-bold text-[#0F1B3D]">
                  No users found
                </p>
                <p className="mt-1 text-xs text-[#8C97B2]">
                  Try another search or filter.
                </p>
              </div>
            )}
          </div>

          {/* PAGINATION */}
          {filteredUsers.length > 0 && (
            <div className="border-t border-[#1E3A8A]/10 bg-[#FBFDFF] px-4 py-4 sm:px-5">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-xs text-[#8C97B2]">
                  Showing{" "}
                  <span className="font-bold text-[#3A4668]">
                    {startEntry}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-[#3A4668]">
                    {endEntry}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-[#3A4668]">
                    {filteredUsers.length}
                  </span>{" "}
                  entries
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => page - 1)
                    }
                    disabled={currentPage === 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1E3A8A]/15 bg-white text-[#1E3A8A] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronLeft size={17} />
                  </button>

                  {paginationPages.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold ${
                        currentPage === page
                          ? "bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] text-white shadow-md shadow-[#1E3A8A]/20"
                          : "text-[#4A5778] hover:bg-[#F5F8FF] hover:text-[#1E3A8A]"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => page + 1)
                    }
                    disabled={currentPage === totalPages}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1E3A8A]/15 bg-white text-[#1E3A8A] disabled:cursor-not-allowed disabled:opacity-30"
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
      <UserDetailModal
        open={detailOpen}
        loading={detailLoading}
        user={selectedUser}
        onClose={() => {
          setDetailOpen(false);
          setSelectedUser(null);
        }}
        onUserStatusChange={handleToggleUserStatus}
        onDistributorStatusChange={handleUpdateDistributorStatus}
        isLoading={statusLoadingId !== null}
        isDistributorLoading={distributorLoadingId !== null}
        canChangeUserStatus={canChangeUserStatus}
        canChangeDistributorStatus={canChangeDistributorStatus}
      />

      {/* CREATE DISTRIBUTOR MODAL */}
      {canCreateUser && (
        <CreateDistributorModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            fetchUsers();
          }}
        />
      )}
    </>
  );
};

export default UserManagement;