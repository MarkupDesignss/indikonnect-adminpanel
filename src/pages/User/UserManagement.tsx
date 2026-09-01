import React, {
    useEffect,
    useMemo,
    useState,
    useRef,
  } from "react";
  import { useLocation } from "react-router-dom";
  
  import {
    FiSearch,
    FiRefreshCw,
    FiEye,
    FiCheck,
    FiX,
    FiUser,
    FiUsers,
    FiUserCheck,
    FiUserX,
    FiChevronLeft,
    FiChevronRight,
    FiMail,
    FiPhone,
    FiCalendar,
    FiMapPin,
    FiShield,
    FiCreditCard,
    FiBriefcase,
    FiCheckCircle,
    FiAlertCircle,
    FiChevronDown,
  } from "react-icons/fi";
  
  import { motion } from "framer-motion";
  import toast from "react-hot-toast";
  
  import GlobalModal from "@/components/common/GlobalModal";
  
  import userManagementApi, {
    RegisteredUser,
  } from "../../api/endpoints/user";
  
  // =====================================================
  // FILTER TYPE
  // =====================================================
  
  type UserFilter =
    | "all"
    | "customer"
    | "distributor"
    | "active"
    | "inactive";
  
  type DistributorStatusFilter =
    | "all"
    | "pending"
    | "active"
    | "rejected";
  
  // =====================================================
  // ANIMATION
  // =====================================================
  
  const containerVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };
  
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 15,
    },
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
  
    if (Number.isNaN(date.getTime())) {
      return value;
    }
  
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
  
    if (Number.isNaN(date.getTime())) {
      return value;
    }
  
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  
  const getUserName = (user: RegisteredUser) => {
    if (user.full_name?.trim()) {
      return user.full_name;
    }
  
    if (user.email) {
      return user.email.split("@")[0];
    }
  
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
  // STATUS BADGES
  // =====================================================
  
  const getActiveStatusClass = (active: boolean) => {
    return active
      ? "border-[#b8902e]/25 bg-[#f8f3e5] text-[#806319]"
      : "border-[#d5cbc1] bg-[#f6f3ef] text-[#7b6f61]";
  };
  
  const getDistributorStatusClass = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || "";
    
    switch (normalizedStatus) {
      case "active":
        return "border-[#b8902e]/25 bg-[#f8f3e5] text-[#806319]";
  
      case "pending":
        return "border-[#d9a441]/30 bg-[#fff8e8] text-[#a06f13]";
  
      case "rejected":
        return "border-[#c98d83]/25 bg-[#fff8f6] text-[#b46055]";
  
      default:
        return "border-[#d8d1c4] bg-[#f6f4ef] text-[#857b6c]";
    }
  };
  
  const getKycStatusClass = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || "";
    
    switch (normalizedStatus) {
      case "active":
      case "verified":
      case "approved":
        return "border-[#b8902e]/25 bg-[#f8f3e5] text-[#806319]";
  
      case "pending":
        return "border-[#d9a441]/30 bg-[#fff8e8] text-[#a06f13]";
  
      case "rejected":
        return "border-[#c98d83]/25 bg-[#fff8f6] text-[#b46055]";
  
      default:
        return "border-[#d8d1c4] bg-[#f6f4ef] text-[#857b6c]";
    }
  };
  
  const getKycDisplayLabel = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || "";
    
    if (normalizedStatus === "active" || normalizedStatus === "verified" || normalizedStatus === "approved") {
      return "Verified";
    }
    
    if (normalizedStatus === "pending") {
      return "Pending";
    }
    
    if (normalizedStatus === "rejected") {
      return "Rejected";
    }
    
    return status || "N/A";
  };
  
  // =====================================================
  // USER STATUS DROPDOWN (Active/Inactive)
  // =====================================================
  
  interface UserStatusDropdownProps {
    userId: number;
    isActive: boolean;
    onStatusChange: (userId: number, newStatus: boolean) => void;
    isLoading: boolean;
  }
  
  const UserStatusDropdown: React.FC<UserStatusDropdownProps> = ({
    userId,
    isActive,
    onStatusChange,
    isLoading,
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
  
    const statusOptions = [
      { value: true, label: "Active", color: "text-[#806319]" },
      { value: false, label: "Inactive", color: "text-[#7b6f61]" },
    ];
  
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
  
    const handleSelect = (value: boolean) => {
      if (value !== isActive) {
        onStatusChange(userId, value);
      }
      setIsOpen(false);
    };
  
    const getCurrentLabel = () => {
      return isActive ? "Active" : "Inactive";
    };
  
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
            isLoading ? "opacity-50 cursor-not-allowed" : "hover:border-[#b8902e]/40"
          } ${getActiveStatusClass(isActive)}`}
        >
          <span className={isActive ? "text-[#806319]" : "text-[#7b6f61]"}>
            {getCurrentLabel()}
          </span>
          <FiChevronDown
            size={14}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
  
        {isOpen && (
          <div className="absolute right-0 mt-1 w-36 rounded-xl border border-[#b8902e]/15 bg-white py-1 shadow-lg z-50">
            {statusOptions.map((option) => (
              <button
                key={String(option.value)}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full px-4 py-2 text-left text-xs font-bold transition hover:bg-[#faf8f3] ${
                  option.value === isActive
                    ? "bg-[#f8f3e5] cursor-default"
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
  // DISTRIBUTOR STATUS DROPDOWN (Only when KYC is pending)
  // =====================================================
  
  interface DistributorStatusDropdownProps {
    userId: number;
    currentStatus: string;
    kycStatus: string;
    onStatusChange: (userId: number, newStatus: string) => void;
    isLoading: boolean;
  }
  
  const DistributorStatusDropdown: React.FC<DistributorStatusDropdownProps> = ({
    userId,
    currentStatus,
    kycStatus,
    onStatusChange,
    isLoading,
  }) => {
    // All hooks must be called before any early return
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
  
    // Normalize KYC status for comparison
    const normalizedKycStatus = kycStatus?.toLowerCase() || "";
    
    // Check if KYC is pending
    const isKycPending = normalizedKycStatus === "pending";
  
    // Check if KYC is verified (active, verified, approved)
    const isKycVerified = normalizedKycStatus === "active" || 
                          normalizedKycStatus === "verified" || 
                          normalizedKycStatus === "approved";
    
    // Check if KYC is rejected
    const isKycRejected = normalizedKycStatus === "rejected";
  
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
  
    // If KYC is not pending, show static status badge
    if (!isKycPending) {
      let label = "N/A";
      let statusClass = "";
      
      if (isKycVerified) {
        label = "Verified";
        statusClass = "border-[#b8902e]/25 bg-[#f8f3e5] text-[#806319]";
      } else if (isKycRejected) {
        label = "Rejected";
        statusClass = "border-[#c98d83]/25 bg-[#fff8f6] text-[#b46055]";
      } else {
        label = kycStatus || "N/A";
        statusClass = "border-[#d8d1c4] bg-[#f6f4ef] text-[#857b6c]";
      }
  
      return (
        <span
          className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${statusClass}`}
        >
          {label}
        </span>
      );
    }
  
    // KYC is pending - show dropdown with Verify and Reject options
    const statusOptions = [
      { value: "active", label: "Verify & Activate", color: "text-[#806319]" },
      { value: "rejected", label: "Reject", color: "text-[#b46055]" },
    ];
  
    const handleSelect = (value: string) => {
      if (value !== currentStatus) {
        onStatusChange(userId, value);
      }
      setIsOpen(false);
    };
  
    const getCurrentLabel = () => {
      const option = statusOptions.find(opt => opt.value === currentStatus);
      return option ? option.label : "Pending";
    };
  
    const getCurrentColor = () => {
      const option = statusOptions.find(opt => opt.value === currentStatus);
      return option ? option.color : "text-[#a06f13]";
    };
  
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
            isLoading ? "opacity-50 cursor-not-allowed" : "hover:border-[#b8902e]/40"
          } ${getDistributorStatusClass(currentStatus)}`}
        >
          <span className={getCurrentColor()}>
            {getCurrentLabel()}
          </span>
          <FiChevronDown
            size={14}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
  
        {isOpen && (
          <div className="absolute right-0 mt-1 w-44 rounded-xl border border-[#b8902e]/15 bg-white py-1 shadow-lg z-50">
            <div className="px-3 py-1.5 border-b border-[#b8902e]/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#a06f13]">
                KYC Pending
              </span>
            </div>
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full px-4 py-2 text-left text-xs font-bold transition hover:bg-[#faf8f3] ${
                  option.value === currentStatus
                    ? "bg-[#f8f3e5] cursor-default"
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
  // STAT CARD
  // =====================================================
  
  interface StatCardProps {
    title: string;
    value: number;
    subtitle: string;
    icon: React.ReactNode;
    accent: string;
  }
  
  const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    subtitle,
    icon,
    accent,
  }) => {
    return (
      <motion.div
        variants={itemVariants}
        whileHover={{
          y: -4,
          boxShadow: "0 16px 30px -18px rgba(140,105,25,0.28)",
        }}
        className="relative min-h-[135px] overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white p-5 shadow-sm"
      >
        <div
          className={`absolute left-0 top-0 h-1 w-full ${accent}`}
        />
  
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full border border-[#d4af52]/20" />
  
        <div className="pointer-events-none absolute -right-3 -top-3 h-14 w-14 rounded-full border border-[#b8902e]/10" />
  
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#a89a7d]">
              {title}
            </p>
  
            <p className="mt-2 text-3xl font-bold text-[#2a2620]">
              {value.toLocaleString("en-IN")}
            </p>
  
            <p className="mt-1 text-xs text-[#786f60]">
              {subtitle}
            </p>
          </div>
  
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
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
  
  const InfoRow: React.FC<InfoRowProps> = ({
    label,
    value,
  }) => {
    return (
      <div className="flex items-start justify-between gap-4 border-b border-[#b8902e]/10 py-3 last:border-b-0">
        <span className="text-xs text-[#a89a7d]">
          {label}
        </span>
  
        <span className="max-w-[62%] text-right text-sm font-semibold text-[#2a2620]">
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
    onUserStatusChange?: (userId: number, newStatus: boolean) => void;
    onDistributorStatusChange?: (userId: number, newStatus: string) => void;
    isLoading?: boolean;
    isDistributorLoading?: boolean;
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
  }) => {
    if (!open) return null;
  
    const kycStatus = user?.business_profile?.kyc_status?.toLowerCase() || "";
  
    return (
      <GlobalModal
        isOpen={open}
        onClose={onClose}
        closeOnOverlayClick={false}
      >
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
          <div className="h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />
  
          {/* HEADER */}
  
          <div className="flex items-start justify-between gap-4 border-b border-[#b8902e]/10 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-sm font-bold text-white">
                {user
                  ? getInitials(user)
                  : <FiUser size={19} />}
              </div>
  
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#b8902e]">
                  User Management
                </p>
  
                <h2 className="mt-0.5 text-xl font-bold text-[#2a2620]">
                  {user
                    ? getUserName(user)
                    : "User Details"}
                </h2>
  
                {user && (
                  <p className="mt-1 text-xs text-[#a89a7d]">
                    User ID #{user.id}
                  </p>
                )}
              </div>
            </div>
  
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] text-[#8f6d1d] transition hover:bg-[#b8902e]/10"
            >
              <FiX size={18} />
            </button>
          </div>
  
          {/* BODY */}
  
          <div className="max-h-[calc(95vh-150px)] overflow-y-auto p-5 sm:p-6">
            {loading ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#b8902e]/10 text-[#b8902e]">
                  <FiRefreshCw
                    size={25}
                    className="animate-spin"
                  />
                </div>
  
                <p className="mt-4 text-sm font-bold text-[#2a2620]">
                  Loading user details...
                </p>
  
                <p className="mt-1 text-xs text-[#a89a7d]">
                  Please wait while we fetch the complete profile.
                </p>
              </div>
            ) : !user ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff8f6] text-[#b46055]">
                  <FiAlertCircle size={25} />
                </div>
  
                <p className="mt-4 text-sm font-bold text-[#b46055]">
                  User details not found.
                </p>
              </div>
            ) : (
              <>
                {/* TOP SUMMARY */}
  
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                      Account Type
                    </p>
  
                    <p className="mt-2 text-lg font-bold text-[#2a2620]">
                      {getAccountLabel(user.account_type)}
                    </p>
                  </div>
  
                  <div className="rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                      User Status
                    </p>
  
                    <div className="mt-2">
                      {onUserStatusChange ? (
                        <UserStatusDropdown
                          userId={user.id}
                          isActive={user.is_active}
                          onStatusChange={onUserStatusChange}
                          isLoading={isLoading}
                        />
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${getActiveStatusClass(
                            user.is_active
                          )}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              user.is_active
                                ? "bg-[#b8902e]"
                                : "bg-[#82776a]"
                            }`}
                          />
  
                          {user.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      )}
                    </div>
                  </div>
  
                  <div className="rounded-2xl border border-[#b8902e]/20 bg-gradient-to-br from-[#fffaf0] to-[#f8f1df] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#a06f13]">
                      KYC Status
                    </p>
  
                    <div className="mt-2">
                      {user.account_type === "distributor" && onDistributorStatusChange ? (
                        <DistributorStatusDropdown
                          userId={user.id}
                          currentStatus={user.distributor_status || "pending"}
                          kycStatus={kycStatus}
                          onStatusChange={onDistributorStatusChange}
                          isLoading={isDistributorLoading}
                        />
                      ) : (
                        <span
                          className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${getKycStatusClass(
                            kycStatus
                          )}`}
                        >
                          {getKycDisplayLabel(kycStatus)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
  
                {/* PERSONAL */}
  
                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                        <FiUser size={17} />
                      </div>
  
                      <h3 className="text-sm font-bold text-[#2a2620]">
                        Personal Information
                      </h3>
                    </div>
  
                    <InfoRow
                      label="Full Name"
                      value={getUserName(user)}
                    />
  
                    <InfoRow
                      label="Email"
                      value={user.email}
                    />
  
                    <InfoRow
                      label="Phone"
                      value={user.phone || "N/A"}
                    />
  
                    <InfoRow
                      label="Country"
                      value={user.country || "N/A"}
                    />
  
                    <InfoRow
                      label="Date of Birth"
                      value={formatDateOnly(user.date_of_birth)}
                    />
                  </div>
  
                  {/* ACCOUNT */}
  
                  <div className="rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                        <FiShield size={17} />
                      </div>
  
                      <h3 className="text-sm font-bold text-[#2a2620]">
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
  
                <div className="mt-5 rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                      <FiCheckCircle size={17} />
                    </div>
  
                    <h3 className="text-sm font-bold text-[#2a2620]">
                      Verification
                    </h3>
                  </div>
  
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-[#b8902e]/10 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#a89a7d]">
                          Phone
                        </span>
  
                        <span
                          className={`text-[10px] font-bold ${
                            user.phone_verified
                              ? "text-[#806319]"
                              : "text-[#b46055]"
                          }`}
                        >
                          {user.phone_verified
                            ? "Verified"
                            : "Not Verified"}
                        </span>
                      </div>
  
                      {user.phone_verified_at && (
                        <p className="mt-2 text-[10px] text-[#a89a7d]">
                          {formatDate(user.phone_verified_at)}
                        </p>
                      )}
                    </div>
  
                    <div className="rounded-xl border border-[#b8902e]/10 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#a89a7d]">
                          Email
                        </span>
  
                        <span
                          className={`text-[10px] font-bold ${
                            user.email_verified_at
                              ? "text-[#806319]"
                              : "text-[#b46055]"
                          }`}
                        >
                          {user.email_verified_at
                            ? "Verified"
                            : "Not Verified"}
                        </span>
                      </div>
  
                      {user.email_verified_at && (
                        <p className="mt-2 text-[10px] text-[#a89a7d]">
                          {formatDate(user.email_verified_at)}
                        </p>
                      )}
                    </div>
  
                    <div className="rounded-xl border border-[#b8902e]/10 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#a89a7d]">
                          Terms
                        </span>
  
                        <span
                          className={`text-[10px] font-bold ${
                            user.terms_condition
                              ? "text-[#806319]"
                              : "text-[#b46055]"
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
                  <div className="mt-5 rounded-2xl border border-[#b8902e]/15 bg-gradient-to-br from-[#fffdfa] to-[#faf8f3] p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                        <FiBriefcase size={17} />
                      </div>
  
                      <div>
                        <h3 className="text-sm font-bold text-[#2a2620]">
                          Distributor Information
                        </h3>
  
                        <p className="mt-0.5 text-xs text-[#a89a7d]">
                          Distributor registration and KYC information.
                        </p>
                      </div>
                    </div>
  
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-xl border border-[#b8902e]/10 bg-white p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                          Distributor ID
                        </p>
  
                        <p className="mt-1 text-sm font-bold text-[#2a2620]">
                          {user.distributor_id || "Not Assigned"}
                        </p>
                      </div>
  
                      <div className="rounded-xl border border-[#b8902e]/10 bg-white p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                          Sponsor ID
                        </p>
  
                        <p className="mt-1 truncate text-sm font-bold text-[#2a2620]">
                          {user.sponsor_id || "Not Assigned"}
                        </p>
                      </div>
  
                      <div className="rounded-xl border border-[#b8902e]/10 bg-white p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                          Placement
                        </p>
  
                        <p className="mt-1 text-sm font-bold capitalize text-[#2a2620]">
                          {user.placement_leg || "Not Assigned"}
                        </p>
                      </div>
  
                      <div className="rounded-xl border border-[#b8902e]/10 bg-white p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                          Registration
                        </p>
  
                        <p className="mt-1 text-sm font-bold text-[#2a2620]">
                          Step {user.registration_step}
                        </p>
                      </div>
                    </div>
  
                    <div className="mt-4 rounded-xl border border-[#b8902e]/10 bg-white p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                        KYC Status
                      </p>
                      <div className="mt-2">
                        {onDistributorStatusChange ? (
                          <DistributorStatusDropdown
                            userId={user.id}
                            currentStatus={user.distributor_status || "pending"}
                            kycStatus={kycStatus}
                            onStatusChange={onDistributorStatusChange}
                            isLoading={isDistributorLoading}
                          />
                        ) : (
                          <span
                            className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${getKycStatusClass(
                              kycStatus
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
  
                {user.business_profile && (
                  <div className="mt-5 rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                        <FiCreditCard size={17} />
                      </div>
  
                      <div>
                        <h3 className="text-sm font-bold text-[#2a2620]">
                          KYC & Banking
                        </h3>
  
                        <p className="mt-0.5 text-xs text-[#a89a7d]">
                          Verification status and masked account information.
                        </p>
                      </div>
                    </div>
  
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-xl border border-[#b8902e]/10 bg-white p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                          KYC Status
                        </p>
  
                        <p className="mt-1 text-sm font-bold capitalize text-[#2a2620]">
                          {getKycDisplayLabel(user.business_profile.kyc_status)}
                        </p>
                      </div>
  
                      <div className="rounded-xl border border-[#b8902e]/10 bg-white p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                          Aadhaar
                        </p>
  
                        <p className="mt-1 text-sm font-bold text-[#2a2620]">
                          {user.aadhaar_last4
                            ? `XXXX XXXX ${user.aadhaar_last4}`
                            : "Not Available"}
                        </p>
  
                        <p
                          className={`mt-1 text-[10px] font-bold ${
                            user.business_profile.aadhaar_verified
                              ? "text-[#806319]"
                              : "text-[#b46055]"
                          }`}
                        >
                          {user.business_profile.aadhaar_verified
                            ? "Verified"
                            : "Not Verified"}
                        </p>
                      </div>
  
                      <div className="rounded-xl border border-[#b8902e]/10 bg-white p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                          PAN
                        </p>
  
                        <p className="mt-1 text-sm font-bold text-[#2a2620]">
                          {user.pan_last4
                            ? `XXXXXX${user.pan_last4}`
                            : "Not Available"}
                        </p>
  
                        <p
                          className={`mt-1 text-[10px] font-bold ${
                            user.business_profile.pan_verified
                              ? "text-[#806319]"
                              : "text-[#b46055]"
                          }`}
                        >
                          {user.business_profile.pan_verified
                            ? "Verified"
                            : "Not Verified"}
                        </p>
                      </div>
  
                      <div className="rounded-xl border border-[#b8902e]/10 bg-white p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                          Bank Account
                        </p>
  
                        <p className="mt-1 text-sm font-bold text-[#2a2620]">
                          {user.account_last4
                            ? `XXXX${user.account_last4}`
                            : "Not Available"}
                        </p>
  
                        <p
                          className={`mt-1 text-[10px] font-bold ${
                            user.business_profile.bank_verified
                              ? "text-[#806319]"
                              : "text-[#b46055]"
                          }`}
                        >
                          {user.business_profile.bank_verified
                            ? "Verified"
                            : "Not Verified"}
                        </p>
                      </div>
                    </div>
  
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-[#b8902e]/10 bg-white p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                          Bank Name
                        </p>
  
                        <p className="mt-1 text-sm font-semibold text-[#2a2620]">
                          {user.business_profile.bank_name || "N/A"}
                        </p>
                      </div>
  
                      <div className="rounded-xl border border-[#b8902e]/10 bg-white p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                          Account Holder
                        </p>
  
                        <p className="mt-1 text-sm font-semibold text-[#2a2620]">
                          {user.business_profile.bank_holder_name || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
  
                {/* CONSENTS */}
  
                <div className="mt-5 rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                      <FiCheckCircle size={17} />
                    </div>
  
                    <h3 className="text-sm font-bold text-[#2a2620]">
                      Registration Consents
                    </h3>
                  </div>
  
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      {
                        label: "Terms",
                        value: user.accept_terms,
                      },
                      {
                        label: "Agreement",
                        value: user.accept_agreement,
                      },
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
                        className="flex items-center justify-between rounded-xl border border-[#b8902e]/10 bg-white p-3"
                      >
                        <span className="text-xs text-[#786f60]">
                          {item.label}
                        </span>
  
                        <span
                          className={`text-[10px] font-bold ${
                            item.value
                              ? "text-[#806319]"
                              : "text-[#b46055]"
                          }`}
                        >
                          {item.value
                            ? "Accepted"
                            : "Not Accepted"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
  
          {/* FOOTER */}
  
          <div className="flex justify-end border-t border-[#b8902e]/10 bg-[#fffdfa] px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#b8902e]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#786f60] transition hover:bg-[#faf8f3] hover:text-[#8f6d1d]"
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
    const kycReviewId = location.state?.kycReviewId;
  
    const [users, setUsers] = useState<RegisteredUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState<UserFilter>("all");
    const [distributorStatusFilter, setDistributorStatusFilter] = useState<DistributorStatusFilter>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState<RegisteredUser | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [statusLoadingId, setStatusLoadingId] = useState<number | null>(null);
    const [distributorLoadingId, setDistributorLoadingId] = useState<number | null>(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
  
    const ITEMS_PER_PAGE = 10;
  
    // =================================================
    // FETCH USERS
    // =================================================
  
    const fetchUsers = async () => {
      try {
        setLoading(true);
  
        const response = await userManagementApi.getRegisteredUsers();
  
        if (response.data.success) {
          const userData = response.data.data || [];
          setUsers(userData);
  
          // If there's a kycReviewId, find and search for that user
          if (kycReviewId && isInitialLoad && userData.length > 0) {
            // Try to find the user by ID (convert to string for comparison)
            const targetUser = userData.find(
              (user: RegisteredUser) => String(user.id) === String(kycReviewId)
            );
  
            if (targetUser) {
              // Set search to the user's name or email to filter
              const searchTerm = targetUser.full_name || targetUser.email || String(targetUser.id);
              setSearch(searchTerm);
              
              // Also open the detail modal for the user
              handleView(targetUser.id);
            } else {
              // If user not found, try searching by ID as a fallback
              setSearch(String(kycReviewId));
              toast.info(`Looking for user with ID: ${kycReviewId}`);
            }
            
            setIsInitialLoad(false);
          }
        } else {
          toast.error(
            response.data.message || "Unable to fetch users."
          );
        }
      } catch (error: any) {
        console.error("Fetch users error:", error);
  
        toast.error(
          error?.response?.data?.message || "Unable to fetch users."
        );
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      fetchUsers();
    }, []);
  
    // =================================================
    // STATS
    // =================================================
  
    const stats = useMemo(() => {
      const total = users.length;
  
      const active = users.filter((user) => user.is_active).length;
  
      const inactive = users.filter((user) => !user.is_active).length;
  
      const distributors = users.filter(
        (user) => user.account_type === "distributor"
      ).length;
  
      const distributorActive = users.filter(
        (user) =>
          user.account_type === "distributor" &&
          user.distributor_status?.toLowerCase() === "active"
      ).length;
  
      const distributorPending = users.filter(
        (user) =>
          user.account_type === "distributor" &&
          user.distributor_status?.toLowerCase() === "pending"
      ).length;
  
      const distributorRejected = users.filter(
        (user) =>
          user.account_type === "distributor" &&
          user.distributor_status?.toLowerCase() === "rejected"
      ).length;
  
      return {
        total,
        active,
        inactive,
        distributors,
        distributorActive,
        distributorPending,
        distributorRejected,
      };
    }, [users]);
  
    // =================================================
    // FILTER
    // =================================================
  
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
  
        if (!searchMatch) {
          return false;
        }
  
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
            break;
        }
  
        if (distributorStatusFilter !== "all") {
          if (user.account_type !== "distributor") {
            return false;
          }
          const status = user.distributor_status?.toLowerCase() || "pending";
          return status === distributorStatusFilter;
        }
  
        return true;
      });
    }, [users, search, activeFilter, distributorStatusFilter]);
  
    // =================================================
    // PAGINATION
    // =================================================
  
    const totalPages = Math.max(
      1,
      Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
    );
  
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  
    const paginatedUsers = filteredUsers.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  
    const startEntry = filteredUsers.length === 0 ? 0 : startIndex + 1;
  
    const endEntry = Math.min(
      startIndex + ITEMS_PER_PAGE,
      filteredUsers.length
    );
  
    useEffect(() => {
      if (currentPage > totalPages) {
        setCurrentPage(totalPages);
      }
    }, [currentPage, totalPages]);
  
    // =================================================
    // FILTER HANDLER
    // =================================================
  
    const handleFilter = (filter: UserFilter) => {
      setActiveFilter(filter);
      setCurrentPage(1);
    };
  
    const handleDistributorStatusFilter = (filter: DistributorStatusFilter) => {
      setDistributorStatusFilter(filter);
      setCurrentPage(1);
    };
  
    // =================================================
    // SEARCH
    // =================================================
  
    const handleSearch = (value: string) => {
      setSearch(value);
      setCurrentPage(1);
    };
  
    // =================================================
    // VIEW USER
    // =================================================
  
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
            response.data.message || "Unable to fetch user details."
          );
        }
      } catch (error: any) {
        console.error("View user error:", error);
  
        toast.error(
          error?.response?.data?.message || "Unable to fetch user details."
        );
      } finally {
        setDetailLoading(false);
      }
    };
  
    // =================================================
    // USER ACTIVE / INACTIVE - DROPDOWN
    // =================================================
  
    const handleToggleUserStatus = async (
      userId: number,
      nextStatus: boolean
    ) => {
      try {
        setStatusLoadingId(userId);
  
        const response = await userManagementApi.updateUserStatus(
          userId,
          nextStatus
        );
  
        if (response.data.success) {
          setUsers((prev) =>
            prev.map((item) =>
              item.id === userId
                ? {
                    ...item,
                    is_active: nextStatus,
                  }
                : item
            )
          );
  
          setSelectedUser((current) =>
            current?.id === userId
              ? {
                  ...current,
                  is_active: nextStatus,
                }
              : current
          );
  
          toast.success(
            response.data.message ||
              `User ${nextStatus ? "activated" : "deactivated"} successfully.`
          );
        } else {
          toast.error(
            response.data.message || "Unable to update user status."
          );
        }
      } catch (error: any) {
        console.error("User status error:", error);
  
        toast.error(
          error?.response?.data?.message || "Unable to update user status."
        );
      } finally {
        setStatusLoadingId(null);
      }
    };
  
    const handleUpdateDistributorStatus = async (userId: number, newStatus: string) => {
        try {
          setDistributorLoadingId(userId);
      
          // Map "active" to "verified" before sending the payload
          const payloadStatus = newStatus === "active" ? "verified" : newStatus;
      
          const response = await userManagementApi.updateDistributorStatus(
            userId,
            payloadStatus
          );
      
          if (response.data.success) {
            setUsers((prev) =>
              prev.map((item) =>
                item.id === userId
                  ? {
                      ...item,
                      distributor_status: newStatus,
                      business_profile: item.business_profile
                        ? {
                            ...item.business_profile,
                            kyc_status: newStatus,
                          }
                        : null,
                    }
                  : item
              )
            );
      
            setSelectedUser((current) =>
              current?.id === userId
                ? {
                    ...current,
                    distributor_status: newStatus,
                    business_profile: current.business_profile
                      ? {
                          ...current.business_profile,
                          kyc_status: newStatus,
                        }
                      : null,
                }
                : current
            );
      
            const displayStatus = newStatus === "active" ? "Verified" : newStatus;
            toast.success(
              response.data.message ||
                `KYC status updated to ${displayStatus} successfully.`
            );
          } else {
            toast.error(
              response.data.message || "Unable to update KYC status."
            );
          }
        } catch (error: any) {
          console.error("Update KYC status error:", error);
      
          toast.error(
            error?.response?.data?.message || "Unable to update KYC status."
          );
        } finally {
          setDistributorLoadingId(null);
        }
      };
  
    // =================================================
    // PAGINATION PAGES
    // =================================================
  
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
  
    // =================================================
    // RENDER
    // =================================================
  
    return (
      <>
        <motion.div
          className="min-h-screen bg-[#faf8f3] p-4"
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
                <div className="h-2 w-2 rounded-full bg-[#b8902e]" />
  
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b8902e]">
                  User Management
                </span>
              </div>
  
              <h1 className="font-serif text-[28px] font-bold tracking-tight text-[#2a2620] sm:text-[30px]">
                Registered Users
              </h1>
  
              <p className="mt-1 text-sm text-[#786f60]">
                Manage customers, distributors, account status,
                and registration details.
              </p>
            </div>
  
            <button
              type="button"
              onClick={fetchUsers}
              disabled={loading}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#b8902e]/20 bg-white px-4 text-sm font-bold text-[#8f6d1d] shadow-sm transition hover:border-[#b8902e]/35 hover:bg-[#faf8f3] disabled:opacity-50"
            >
              <FiRefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
  
              Refresh
            </button>
          </motion.div>
  
          {/* STATS */}
  
          <motion.div
            variants={containerVariants}
            className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-7"
          >
            <StatCard
              title="Total Users"
              value={stats.total}
              subtitle="All registered users"
              icon={<FiUsers size={21} />}
              accent="bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]"
            />
  
            <StatCard
              title="Active Users"
              value={stats.active}
              subtitle="Currently active"
              icon={<FiUserCheck size={21} />}
              accent="bg-gradient-to-r from-[#e8c97a] to-[#b8902e]"
            />
  
            <StatCard
              title="Inactive Users"
              value={stats.inactive}
              subtitle="Currently inactive"
              icon={<FiUserX size={21} />}
              accent="bg-gradient-to-r from-[#c9a84c] to-[#8a6c1f]"
            />
  
            <StatCard
              title="Distributors"
              value={stats.distributors}
              subtitle="Registered distributors"
              icon={<FiBriefcase size={21} />}
              accent="bg-gradient-to-r from-[#d4af52] to-[#806319]"
            />
  
            <StatCard
              title="Dist. Active"
              value={stats.distributorActive}
              subtitle="Active distributors"
              icon={<FiCheckCircle size={21} />}
              accent="bg-gradient-to-r from-[#b8902e] to-[#806319]"
            />
  
            <StatCard
              title="Dist. Pending"
              value={stats.distributorPending}
              subtitle="Pending approval"
              icon={<FiAlertCircle size={21} />}
              accent="bg-gradient-to-r from-[#d9a441] to-[#a06f13]"
            />
  
            <StatCard
              title="Dist. Rejected"
              value={stats.distributorRejected}
              subtitle="Rejected distributors"
              icon={<FiX size={21} />}
              accent="bg-gradient-to-r from-[#c98d83] to-[#b46055]"
            />
          </motion.div>
  
          {/* MAIN CARD */}
  
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-sm"
          >
            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />
  
            {/* TOOLBAR */}
  
            <div className="border-b border-[#b8902e]/10 p-4 sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                {/* SEARCH */}
  
                <div className="relative w-full xl:max-w-[520px]">
                  <FiSearch
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a8841c]"
                  />
  
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search name, email, phone, ID..."
                    className="h-12 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] pl-11 pr-10 text-sm text-[#2a2620] outline-none transition placeholder:text-[#a89a7d] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
                  />
  
                  {search && (
                    <button
                      type="button"
                      onClick={() => handleSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a89a7d] hover:text-[#8f6d1d]"
                    >
                      <FiX size={16} />
                    </button>
                  )}
                </div>
  
                {/* FILTERS */}
  
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      key: "all" as UserFilter,
                      label: "All",
                    },
                    {
                      key: "customer" as UserFilter,
                      label: "Customers",
                    },
                    {
                      key: "distributor" as UserFilter,
                      label: "Distributors",
                    },
                    {
                      key: "active" as UserFilter,
                      label: "Active",
                    },
                    {
                      key: "inactive" as UserFilter,
                      label: "Inactive",
                    },
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => handleFilter(filter.key)}
                      className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                        activeFilter === filter.key
                          ? "bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] text-white shadow-md shadow-[#b8902e]/20"
                          : "border border-[#b8902e]/15 bg-[#faf8f3] text-[#786f60] hover:border-[#b8902e]/30 hover:bg-[#b8902e]/10 hover:text-[#8f6d1d]"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
  
              {/* Distributor Status Filter Row */}
  
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#b8902e]/10 pt-4">
                <span className="text-xs font-bold text-[#a89a7d] uppercase tracking-wider">
                  Distributor Status:
                </span>
  
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "all" as DistributorStatusFilter, label: "All" },
                    { key: "pending" as DistributorStatusFilter, label: "Pending", color: "text-[#a06f13]" },
                    { key: "active" as DistributorStatusFilter, label: "Active", color: "text-[#806319]" },
                    { key: "rejected" as DistributorStatusFilter, label: "Rejected", color: "text-[#b46055]" },
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => handleDistributorStatusFilter(filter.key)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                        distributorStatusFilter === filter.key
                          ? "bg-[#b8902e] text-white shadow-md shadow-[#b8902e]/20"
                          : "border border-[#b8902e]/15 bg-[#faf8f3] text-[#786f60] hover:border-[#b8902e]/30 hover:bg-[#b8902e]/10"
                      } ${distributorStatusFilter === filter.key ? "" : filter.color || ""}`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
  
            {/* DESKTOP TABLE */}
  
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1350px] border-collapse">
                <thead>
                  <tr className="bg-[#2f2a22]">
                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                      S.No.
                    </th>
  
                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                      User
                    </th>
  
                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                      Contact
                    </th>
  
                    <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                      Account Type
                    </th>
  
                    <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                      User Status
                    </th>
  
                    <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                      KYC Status
                    </th>
  
                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                      Registered
                    </th>
  
                    <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                      Actions
                    </th>
                  </tr>
                </thead>
  
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b8902e]/10 text-[#b8902e]">
                            <FiRefreshCw
                              size={22}
                              className="animate-spin"
                            />
                          </div>
  
                          <p className="mt-4 text-sm font-bold text-[#2a2620]">
                            Loading users...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#b8902e]">
                            <FiUsers size={24} />
                          </div>
  
                          <p className="mt-4 text-sm font-bold text-[#2a2620]">
                            No users found
                          </p>
  
                          <p className="mt-1 text-xs text-[#a89a7d]">
                            Try another search or filter.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user, index) => {
                      const statusLoading = statusLoadingId === user.id;
                      const distributorLoading = distributorLoadingId === user.id;
                      const isDistributor = user.account_type === "distributor";
                      const distributorStatus = user.distributor_status || "pending";
                      const kycStatus = user.business_profile?.kyc_status?.toLowerCase() || "";
  
                      return (
                        <tr
                          key={user.id}
                          className="border-b border-[#b8902e]/10 bg-white transition hover:bg-[#faf8f3]"
                        >
                          <td className="px-5 py-4">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-xs font-bold text-[#8f6d1d]">
                              {startIndex + index + 1}
                            </span>
                          </td>
  
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-xs font-bold text-white">
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
                                <p className="truncate text-sm font-bold text-[#2a2620]">
                                  {getUserName(user)}
                                </p>
                              </div>
                            </div>
                          </td>
  
                          <td className="px-5 py-4">
                            <div className="max-w-[220px]">
                              <p className="truncate text-xs font-semibold text-[#4a4436]">
                                {user.email}
                              </p>
  
                              <div className="mt-1 flex items-center gap-1.5">
                                <span className="text-xs text-[#a89a7d]">
                                  {user.phone || "No phone"}
                                </span>
  
                                {user.phone_verified ? (
                                  <FiCheckCircle
                                    size={12}
                                    className="text-[#b8902e]"
                                  />
                                ) : null}
                              </div>
                            </div>
                          </td>
  
                          <td className="px-5 py-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${
                                isDistributor
                                  ? "border-[#b8902e]/25 bg-[#fffaf0] text-[#8f6d1d]"
                                  : "border-[#d8d1c4] bg-[#f6f4ef] text-[#786f60]"
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
                                  onStatusChange={handleUpdateDistributorStatus}
                                  isLoading={distributorLoading}
                                />
                              </div>
                            ) : (
                              <span className="text-xs text-[#b1a58e]">
                                —
                              </span>
                            )}
                          </td>
  
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <FiCalendar
                                size={13}
                                className="text-[#b8902e]"
                              />
  
                              <span className="text-xs font-semibold text-[#4a4436]">
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
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/20 bg-[#faf8f3] text-[#8f6d1d] transition hover:border-[#b8902e] hover:bg-[#b8902e] hover:text-white"
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
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user, index) => {
                  const statusLoading = statusLoadingId === user.id;
                  const distributorLoading = distributorLoadingId === user.id;
                  const isDistributor = user.account_type === "distributor";
                  const distributorStatus = user.distributor_status || "pending";
                  const kycStatus = user.business_profile?.kyc_status?.toLowerCase() || "";
  
                  return (
                    <div
                      key={user.id}
                      className="border-b border-[#b8902e]/10 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-xs font-bold text-white">
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
                            <p className="truncate text-sm font-bold text-[#2a2620]">
                              {getUserName(user)}
                            </p>
  
                            <p className="mt-1 truncate text-xs text-[#a89a7d]">
                              {user.email}
                            </p>
                          </div>
                        </div>
  
                        <span className="text-[10px] font-bold text-[#a89a7d]">
                          #{startIndex + index + 1}
                        </span>
                      </div>
  
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                            Type
                          </p>
  
                          <p className="mt-1 text-xs font-bold capitalize text-[#2a2620]">
                            {user.account_type}
                          </p>
                        </div>
  
                        <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                            Phone
                          </p>
  
                          <p className="mt-1 truncate text-xs font-bold text-[#2a2620]">
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
                        />
  
                        {isDistributor && (
                          <DistributorStatusDropdown
                            userId={user.id}
                            currentStatus={distributorStatus}
                            kycStatus={kycStatus}
                            onStatusChange={handleUpdateDistributorStatus}
                            isLoading={distributorLoading}
                          />
                        )}
                      </div>
  
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleView(user.id)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#b8902e]/20 bg-[#faf8f3] px-4 py-2.5 text-xs font-bold text-[#8f6d1d]"
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
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#b8902e]">
                    <FiUsers size={24} />
                  </div>
  
                  <p className="mt-4 text-sm font-bold text-[#2a2620]">
                    No users found
                  </p>
  
                  <p className="mt-1 text-xs text-[#a89a7d]">
                    Try another search or filter.
                  </p>
                </div>
              )}
            </div>
  
            {/* PAGINATION */}
  
            {filteredUsers.length > 0 && (
              <div className="border-t border-[#b8902e]/10 bg-[#fffdfa] px-4 py-4 sm:px-5">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <p className="text-xs text-[#8b8171]">
                    Showing{" "}
                    <span className="font-bold text-[#4a4436]">
                      {startEntry}
                    </span>{" "}
                    to{" "}
                    <span className="font-bold text-[#4a4436]">
                      {endEntry}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-[#4a4436]">
                      {filteredUsers.length}
                    </span>{" "}
                    entries
                  </p>
  
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => page - 1)}
                      disabled={currentPage === 1}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#b8902e]/15 bg-white text-[#8f6d1d] disabled:cursor-not-allowed disabled:opacity-30"
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
                            ? "bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-white shadow-md shadow-[#b8902e]/20"
                            : "text-[#786f60] hover:bg-[#faf8f3] hover:text-[#8f6d1d]"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
  
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => page + 1)}
                      disabled={currentPage === totalPages}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#b8902e]/15 bg-white text-[#8f6d1d] disabled:cursor-not-allowed disabled:opacity-30"
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
        />
      </>
    );
  };
  
  export default UserManagement;