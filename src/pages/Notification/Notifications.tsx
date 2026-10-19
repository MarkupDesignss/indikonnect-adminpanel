import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiTrash2,
  FiSearch,
  FiX,
  FiPackage,
  FiTruck,
  FiCreditCard,
  FiUser,
  FiAlertCircle,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiMessageSquare,
  FiSettings,
  FiInfo,
  FiAlertTriangle,
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { notificationApi } from "../../api/endpoints/notification";
import logoApi from "../../api/endpoints/logoApi";

// Permissions
import { usePermissions } from "../../pages/permissions/usePermissions";

// =====================================================
// DEFAULT LOADER LOGO
// =====================================================

const DEFAULT_LOGO_URL =
  "https://www.markupdesigns.net/indikonnect/storage/logos/MmVFOudCiVU3Y8C0sf2gEEXna5jSKroCDj8xYMo0.png";

// =====================================================
// TYPES
// =====================================================

export type NotificationType =
  | "order"
  | "payment"
  | "delivery"
  | "user"
  | "message"
  | "alert"
  | "system"
  | "general";

export interface Notification {
  id: number;
  title: string;
  message: string;
  type?: NotificationType | string;
  is_read?: boolean;
  read_at?: string | null;
  created_at: string;
  updated_at?: string;
  data?: Record<string, any> | null;
}

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
  hidden: { opacity: 0, y: 12 },
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

// =====================================================
// LOGO LOADER
// Content area only — sidebar/navbar remain visible
// =====================================================

interface PermissionLoadingStateProps {
  logoUrl: string | null;
}

const PermissionLoadingState: React.FC<PermissionLoadingStateProps> = ({
  logoUrl,
}) => {
  const [displayLogo, setDisplayLogo] = useState(
    logoUrl || DEFAULT_LOGO_URL,
  );

  useEffect(() => {
    setDisplayLogo(logoUrl || DEFAULT_LOGO_URL);
  }, [logoUrl]);

  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center overflow-hidden rounded-xl bg-[#F4F8FD] p-6 font-poppins">
      <motion.img
        key={displayLogo}
        src={displayLogo}
        alt="IndieKonnect Logo"
        referrerPolicy="no-referrer"
        className="block max-h-[120px] max-w-[240px] object-contain"
        initial={{
          opacity: 0.6,
          scale: 0.96,
        }}
        animate={{
          opacity: [0.8, 1, 0.8],
          scale: [0.98, 1, 0.98],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        onError={() => {
          if (displayLogo !== DEFAULT_LOGO_URL) {
            setDisplayLogo(DEFAULT_LOGO_URL);
          }
        }}
      />
    </div>
  );
};

// =====================================================
// ACCESS DENIED
// Content area only — sidebar/navbar remain visible
// =====================================================

const AccessDenied: React.FC = () => (
  <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#F4F8FD] p-4 font-poppins">
    <div className="max-w-md rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-lg">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#C23B32]">
        <FiAlertTriangle size={26} />
      </div>

      <h2 className="text-lg font-bold text-[#111827]">
        Access Denied
      </h2>

      <p className="mt-2 text-sm text-[#6B7280]">
        You don't have permission to access this section.
      </p>

      <div className="mt-5 rounded-xl border border-[#C23B32]/15 bg-[#FEF2F2] px-4 py-3 text-[10px] font-semibold text-[#C23B32]">
        Contact your administrator to request access.
      </div>
    </div>
  </div>
);

// =====================================================
// HELPERS — BLUE THEME
// =====================================================

const getNotificationIcon = (type?: string) => {
  const normalizedType = type?.toLowerCase() || "";

  if (
    normalizedType.includes("order") ||
    normalizedType === "order_confirmed"
  ) {
    return <FiPackage size={18} />;
  }

  if (normalizedType.includes("payment")) {
    return <FiCreditCard size={18} />;
  }

  if (normalizedType.includes("delivery")) {
    return <FiTruck size={18} />;
  }

  if (
    normalizedType.includes("user") ||
    normalizedType.includes("kyc") ||
    normalizedType.includes("distributor")
  ) {
    return <FiUser size={18} />;
  }

  if (normalizedType.includes("message")) {
    return <FiMessageSquare size={18} />;
  }

  if (normalizedType.includes("alert")) {
    return <FiAlertCircle size={18} />;
  }

  if (normalizedType.includes("system")) {
    return <FiSettings size={18} />;
  }

  if (normalizedType.includes("return")) {
    return <FiTruck size={18} />;
  }

  return <FiBell size={18} />;
};

const getNotificationLabel = (type?: string) => {
  if (!type) return "Notification";

  const normalizedType = type.toLowerCase();

  if (normalizedType === "order_confirmed") {
    return "Order Confirmed";
  }

  if (normalizedType === "return_pending") {
    return "Return Request";
  }

  if (normalizedType === "return_approved") {
    return "Return Approved";
  }

  if (normalizedType === "return_received") {
    return "Return Received";
  }

  if (normalizedType === "new_distributor_registration") {
    return "Distributor Registration";
  }

  if (normalizedType === "kyc_review") {
    return "KYC Review";
  }

  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getIconClasses = (type?: string) => {
  const normalizedType = type?.toLowerCase() || "";

  if (
    normalizedType.includes("payment") ||
    normalizedType === "order_confirmed"
  ) {
    return "bg-[#EAF3FF] text-[#2D6FE8] border-[#2D6FE8]/20";
  }

  if (
    normalizedType.includes("delivery") ||
    normalizedType.includes("return")
  ) {
    return "bg-[#EAF3FF] text-[#2D6FE8] border-[#4F8FF7]/25";
  }

  if (
    normalizedType.includes("user") ||
    normalizedType.includes("distributor") ||
    normalizedType.includes("kyc")
  ) {
    return "bg-[#EAF3FF] text-[#2D6FE8] border-[#2D6FE8]/15";
  }

  if (normalizedType.includes("alert")) {
    return "bg-[#FEF9C3] text-[#A16207] border-[#FACC15]/30";
  }

  if (normalizedType.includes("message")) {
    return "bg-[#EAF3FF] text-[#2D6FE8] border-[#2D6FE8]/20";
  }

  return "bg-[#EAF3FF] text-[#2D6FE8] border-[#2D6FE8]/20";
};

const formatDate = (date?: string | null) => {
  if (!date) return "—";

  try {
    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return date;
  }
};

const getRelativeTime = (date?: string | null) => {
  if (!date) return "";

  try {
    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "";

    const now = new Date();
    const diff = now.getTime() - parsed.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);

    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);

    if (days < 7) return `${days}d ago`;

    return formatDate(date);
  } catch {
    return "";
  }
};

// =====================================================
// DELETE CONFIRM MODAL — BLUE THEME
// =====================================================

interface DeleteConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  open,
  title,
  message,
  loading,
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/45 px-4 font-poppins backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-[450px] overflow-hidden rounded-[22px] border border-[#DCE6F2] bg-white shadow-2xl"
      >
        <div className="h-[3px] w-full bg-gradient-to-r from-[#2D6FE8] to-[#C23B32]" />

        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#C23B32]">
              <FiTrash2 size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#111827]">
                {title}
              </h2>

              <p className="mt-1 text-sm leading-6 text-[#6B7280]">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#DCE6F2] bg-[#F8FBFF] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-[#DCE6F2] bg-white px-5 py-2.5 text-sm font-bold text-[#6B7280] transition hover:bg-[#F4F8FD] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#C23B32] to-[#A62F27] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(194,59,50,0.55)] transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            {loading ? (
              <FiRefreshCw size={14} className="animate-spin" />
            ) : (
              <FiTrash2 size={14} />
            )}

            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// =====================================================
// NOTIFICATION CARD — BLUE THEME
// =====================================================

interface NotificationCardProps {
  notification: Notification;
  onRead: (notification: Notification) => void;
  onDelete: (notification: Notification) => void;
  readLoadingId: number | null;
  canMarkRead?: boolean;
  canDelete?: boolean;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onRead,
  onDelete,
  readLoadingId,
  canMarkRead = false,
  canDelete = false,
}) => {
  const isUnread = !notification.is_read;

  return (
    <motion.div
      variants={itemVariants}
      layout
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        isUnread
          ? "border-[#2D6FE8]/20 bg-gradient-to-br from-[#EAF3FF] via-white to-white shadow-[0_6px_20px_-8px_rgba(45,111,232,0.15)]"
          : "border-[#DCE6F2] bg-white hover:border-[#4F8FF7]/30 hover:shadow-[0_6px_20px_-8px_rgba(45,111,232,0.12)]"
      }`}
    >
      {isUnread && (
        <div className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-[#4F8FF7] to-[#2D6FE8]" />
      )}

      {isUnread && (
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full border border-[#2D6FE8]/10" />
      )}

      <div className="relative p-4 sm:p-5">
        <div className="flex items-start gap-4">
          {/* ICON */}
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${getIconClasses(
              notification.type,
            )}`}
          >
            {getNotificationIcon(notification.type)}
          </div>

          {/* CONTENT */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-[#111827]">
                    {notification.title}
                  </h3>

                  {isUnread && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      New
                    </span>
                  )}
                </div>

                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#2D6FE8]">
                  {getNotificationLabel(notification.type)}
                </p>
              </div>

              <div className="shrink-0">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                    isUnread
                      ? "border-[#2D6FE8]/25 bg-white text-[#2D6FE8]"
                      : "border-[#DCE6F2] bg-[#F4F8FD] text-[#6B7280]"
                  }`}
                >
                  {getRelativeTime(notification.created_at)}
                </span>
              </div>
            </div>

            {/* MESSAGE */}
            <div className="mt-3 rounded-xl border border-[#DCE6F2] bg-white/70 px-4 py-3 backdrop-blur-sm">
              <p className="max-w-3xl text-sm leading-6 text-[#6B7280]">
                {notification.message}
              </p>
            </div>

            {/* META */}
            <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-[#6B7280]">
              <FiInfo size={11} className="text-[#2D6FE8]" />
              {formatDate(notification.created_at)}
            </div>

            {/* ACTIONS */}
            {(canMarkRead || canDelete || !isUnread) && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#DCE6F2] pt-3">
                {canMarkRead && isUnread && (
                  <button
                    type="button"
                    onClick={() => onRead(notification)}
                    disabled={readLoadingId === notification.id}
                    className="flex items-center gap-1.5 rounded-lg border border-[#2D6FE8]/20 bg-[#EAF3FF] px-3 py-2 text-[11px] font-bold text-[#2D6FE8] transition hover:border-[#2D6FE8]/35 hover:bg-[#2D6FE8] hover:text-white disabled:opacity-50"
                  >
                    {readLoadingId === notification.id ? (
                      <FiRefreshCw
                        size={13}
                        className="animate-spin"
                      />
                    ) : (
                      <FiCheck size={13} />
                    )}

                    Mark as Read
                  </button>
                )}

                {!isUnread && (
                  <span className="flex items-center gap-1.5 rounded-lg bg-[#EAF3FF] px-3 py-2 text-[11px] font-bold text-[#2D6FE8]">
                    <FiCheckCircle size={13} />
                    Read
                  </span>
                )}

                {canDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(notification)}
                    className="flex items-center gap-1.5 rounded-lg border border-[#C23B32]/20 bg-[#FEF2F2] px-3 py-2 text-[11px] font-bold text-[#C23B32] transition hover:border-transparent hover:bg-[#C23B32] hover:text-white"
                  >
                    <FiTrash2 size={13} />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// =====================================================
// MAIN PAGE
// =====================================================

const Notifications: React.FC = () => {
  // ===================================================
  // PERMISSIONS
  // ===================================================

  const {
    hasPermission,
    hasModuleAccess,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  const canViewNotifications = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("notification") ||
      hasPermission("notification.view"),
    [isSuperAdmin, hasModuleAccess, hasPermission],
  );

  const canMarkRead = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("notification.mark_read") ||
      hasPermission("notification.update"),
    [isSuperAdmin, hasPermission],
  );

  const canDeleteNotification = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("notification.delete"),
    [isSuperAdmin, hasPermission],
  );

  // ===================================================
  // STATE
  // ===================================================

  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Normal API loading for refresh and other actions.
  const [loading, setLoading] = useState(false);

  // Initial notifications data loading.
  const [initialDataLoading, setInitialDataLoading] =
    useState(true);

  // Loader logo API loading.
  const [logoLoading, setLogoLoading] = useState(true);

  // Logo URL shown by the loader.
  const [loaderLogoUrl, setLoaderLogoUrl] = useState<string>(
    DEFAULT_LOGO_URL,
  );

  const [search, setSearch] = useState("");

  const [activeFilter, setActiveFilter] = useState<
    "all" | "unread" | "read"
  >("all");

  const [currentPage, setCurrentPage] = useState(1);

  const [readLoadingId, setReadLoadingId] = useState<number | null>(
    null,
  );

  const [markAllLoading, setMarkAllLoading] = useState(false);

  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(
    null,
  );

  const [deleteAllLoading, setDeleteAllLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);

  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);

  const ITEMS_PER_PAGE = 10;

  const fetchInFlightRef = useRef<Promise<void> | null>(null);

  // ===================================================
  // FETCH LOADER LOGO
  // Falls back to DEFAULT_LOGO_URL if the API fails.
  // ===================================================

  useEffect(() => {
    let isMounted = true;

    const fetchLoaderLogo = async () => {
      try {
        const response = await logoApi.getLogo();
        const responseData = response?.data as any;

        const receivedLogo =
          responseData?.data?.logo ||
          responseData?.logo ||
          responseData?.data?.data?.logo ||
          responseData?.data?.data?.data?.logo;

        if (
          isMounted &&
          typeof receivedLogo === "string" &&
          receivedLogo.trim()
        ) {
          setLoaderLogoUrl(receivedLogo.trim());
        }
      } catch (error) {
        console.error("Fetch loader logo error:", error);

        if (isMounted) {
          setLoaderLogoUrl(DEFAULT_LOGO_URL);
        }
      } finally {
        if (isMounted) {
          setLogoLoading(false);
        }
      }
    };

    void fetchLoaderLogo();

    return () => {
      isMounted = false;
    };
  }, []);

  // ===================================================
  // FETCH NOTIFICATIONS
  // isInitialLoad is true only for the first page load.
  // Refresh won't reopen the full content loader.
  // ===================================================

  const fetchNotifications = useCallback(
    async (isInitialLoad = false) => {
      if (!canViewNotifications) {
        if (isInitialLoad) {
          setInitialDataLoading(false);
        }

        return;
      }

      // Avoid duplicate requests if a fetch is already in progress.
      if (fetchInFlightRef.current) {
        try {
          await fetchInFlightRef.current;
        } finally {
          if (isInitialLoad) {
            setInitialDataLoading(false);
          }
        }

        return;
      }

      const request = (async () => {
        try {
          setLoading(true);

          const response = await notificationApi.getAll();
          const responseData = response.data;

          let rawData: any[] = [];

          if (Array.isArray(responseData?.data)) {
            rawData = responseData.data;
          } else if (Array.isArray(responseData?.data?.data)) {
            rawData = responseData.data.data;
          }

          const list: Notification[] = rawData.map((item: any) => ({
            id: item.id,
            title: item.title || "Notification",
            message: item.message || "",
            is_read: item.read === 1,
            type: item.type || "general",
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at,
            read_at:
              item.read === 1 ? item.updated_at || null : null,
            data: item.extra_data || null,
          }));

          setNotifications(list);
        } catch (error: any) {
          console.error("Get notifications error:", error);

          toast.error(
            error?.response?.data?.message ||
              error?.message ||
              "Unable to fetch notifications.",
          );
        } finally {
          setLoading(false);

          if (isInitialLoad) {
            setInitialDataLoading(false);
          }
        }
      })();

      fetchInFlightRef.current = request;

      try {
        await request;
      } finally {
        fetchInFlightRef.current = null;
      }
    },
    [canViewNotifications],
  );

  // ===================================================
  // INITIAL FETCH
  // Wait until permission checks finish before fetching.
  // ===================================================

  useEffect(() => {
    if (permissionsLoading) return;

    if (!canViewNotifications) {
      setInitialDataLoading(false);
      return;
    }

    void fetchNotifications(true);
  }, [
    permissionsLoading,
    canViewNotifications,
    fetchNotifications,
  ]);

  // ===================================================
  // COUNTS
  // ===================================================

  const counts = useMemo(() => {
    const total = notifications.length;

    const unread = notifications.filter(
      (item) => !item.is_read,
    ).length;

    const read = notifications.filter(
      (item) => item.is_read,
    ).length;

    return { total, unread, read };
  }, [notifications]);

  // ===================================================
  // FILTER
  // ===================================================

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notifications.filter((notification) => {
      const matchesSearch =
        !query ||
        [
          notification.title,
          notification.message,
          notification.type || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      let matchesFilter = true;

      if (activeFilter === "unread") {
        matchesFilter = !notification.is_read;
      }

      if (activeFilter === "read") {
        matchesFilter = !!notification.is_read;
      }

      return matchesSearch && matchesFilter;
    });
  }, [notifications, search, activeFilter]);

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE),
  );

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedNotifications = filteredNotifications.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const startEntry =
    filteredNotifications.length === 0 ? 0 : startIndex + 1;

  const endEntry = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredNotifications.length,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // ===================================================
  // HANDLERS
  // ===================================================

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleFilter = (filter: "all" | "unread" | "read") => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleMarkAsRead = async (
    notification: Notification,
  ) => {
    if (notification.is_read) return;

    try {
      setReadLoadingId(notification.id);

      const response = await notificationApi.markAsRead(
        notification.id,
      );

      const message =
        response?.data?.message ||
        "Notification marked as read.";

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                is_read: true,
                read_at: new Date().toISOString(),
              }
            : item,
        ),
      );

      toast.success(message);
    } catch (error: any) {
      console.error("Mark notification read error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Unable to mark notification as read.",
      );
    } finally {
      setReadLoadingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (counts.unread === 0) {
      toast.success("All notifications are already read.");
      return;
    }

    try {
      setMarkAllLoading(true);

      const response = await notificationApi.markAllAsRead();

      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          is_read: true,
          read_at: item.read_at || new Date().toISOString(),
        })),
      );

      toast.success(
        response?.data?.message ||
          "All notifications marked as read.",
      );
    } catch (error: any) {
      console.error("Mark all read error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Unable to mark all notifications as read.",
      );
    } finally {
      setMarkAllLoading(false);
    }
  };

  const handleDeleteClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedNotification) return;

    try {
      setDeleteLoadingId(selectedNotification.id);

      const response = await notificationApi.delete(
        selectedNotification.id,
      );

      setNotifications((previous) =>
        previous.filter(
          (item) => item.id !== selectedNotification.id,
        ),
      );

      setDeleteModalOpen(false);

      toast.success(
        response?.data?.message ||
          "Notification deleted successfully.",
      );

      setSelectedNotification(null);
    } catch (error: any) {
      console.error("Delete notification error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Unable to delete notification.",
      );
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleDeleteAll = async () => {
    try {
      setDeleteAllLoading(true);

      const response = await notificationApi.deleteAll();

      setNotifications([]);
      setDeleteAllModalOpen(false);
      setCurrentPage(1);

      toast.success(
        response?.data?.message ||
          "All notifications deleted successfully.",
      );
    } catch (error: any) {
      console.error("Delete all notifications error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Unable to delete all notifications.",
      );
    } finally {
      setDeleteAllLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchNotifications();
    toast.success("Notifications refreshed.");
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;

    setCurrentPage(page);
  };

  const paginationPages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1,
      );
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
  // COMBINED INITIAL LOADING STATE
  // ===================================================

  const pageLoading =
    permissionsLoading ||
    logoLoading ||
    initialDataLoading;

  if (pageLoading) {
    return (
      <PermissionLoadingState logoUrl={loaderLogoUrl} />
    );
  }

  if (!canViewNotifications) {
    return <AccessDenied />;
  }

  // Separate content-area spinner for a later fetch
  // when there are currently no notifications to show.
  if (loading && notifications.length === 0) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#F4F8FD] font-poppins">
        <div className="flex flex-col items-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#DCE6F2] border-t-[#2D6FE8]" />

          <p className="mt-3 text-sm text-[#6B7280]">
            Loading notifications...
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <>
      <motion.div
        className="min-h-screen bg-white p-4 font-poppins sm:p-5 lg:p-7"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* PAGE HEADER */}

        <motion.div
          variants={itemVariants}
          className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center"
        >
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2D6FE8]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#4F8FF7]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#2D6FE8]">
                Notifications
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[20px] font-medium tracking-tight text-[#111827] sm:text-[22px]">
                Notification Center
              </h1>

              {counts.unread > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] px-3 py-1.5 text-[10px] font-bold text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  {counts.unread} unread
                </span>
              )}
            </div>

            <p className="mt-0.5 text-sm text-[#111827]">
              Keep track of orders, payments, users, and important admin
              activity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start">
            {canMarkRead && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={markAllLoading || counts.unread === 0}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#2D6FE8]/20 bg-white px-4 text-sm font-bold text-[#2D6FE8] transition hover:border-[#4F8FF7]/40 hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {markAllLoading ? (
                  <FiRefreshCw
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <FiCheckCircle size={15} />
                )}

                Mark All Read
              </button>
            )}

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#2D6FE8]/20 bg-white px-4 text-sm font-bold text-[#2D6FE8] transition hover:border-[#4F8FF7]/40 hover:bg-[#EAF3FF] disabled:opacity-50"
            >
              <FiRefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />

              Refresh
            </button>

            {canDeleteNotification && (
              <button
                type="button"
                onClick={() => setDeleteAllModalOpen(true)}
                disabled={notifications.length === 0}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#C23B32]/20 bg-[#FEF2F2] px-4 text-sm font-bold text-[#C23B32] transition hover:border-transparent hover:bg-[#C23B32] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiTrash2 size={15} />
                Delete All
              </button>
            )}
          </div>
        </motion.div>

        {/* MAIN CARD */}

        <motion.div
          variants={itemVariants}
          className="relative mt-6 overflow-hidden rounded-[22px] border border-[#DCE6F2] bg-white shadow-[0_8px_30px_rgba(45,111,232,0.06)]"
        >
          {/* TOOLBAR */}

          <div className="border-b border-[#DCE6F2] p-4 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              {/* SEARCH */}

              <div className="relative w-full xl:max-w-[520px]">
                <FiSearch
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2D6FE8]"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    handleSearch(event.target.value)
                  }
                  placeholder="Search notifications..."
                  className="h-11 w-full rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] pl-11 pr-10 text-sm text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#4F8FF7]/10"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => handleSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#2D6FE8]"
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>

              {/* FILTERS */}

              <div className="flex flex-wrap gap-2">
                {[
                  {
                    key: "all" as const,
                    label: "All",
                    count: counts.total,
                  },
                  {
                    key: "unread" as const,
                    label: "Unread",
                    count: counts.unread,
                  },
                  {
                    key: "read" as const,
                    label: "Read",
                    count: counts.read,
                  },
                ].map((filter) => (
                  <button
                    type="button"
                    key={filter.key}
                    onClick={() => handleFilter(filter.key)}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                      activeFilter === filter.key
                        ? "bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] text-white shadow-[0_6px_14px_-6px_rgba(45,111,232,0.5)]"
                        : "border border-[#DCE6F2] bg-[#F4F8FD] text-[#6B7280] hover:border-[#4F8FF7]/30 hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"
                    }`}
                  >
                    {filter.label}

                    {filter.key === "unread" &&
                      filter.count > 0 && (
                        <span
                          className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[9px] ${
                            activeFilter === "unread"
                              ? "bg-white/25 text-white"
                              : "bg-[#2D6FE8] text-white"
                          }`}
                        >
                          {filter.count}
                        </span>
                      )}

                    {filter.key === "all" &&
                      filter.count > 0 && (
                        <span
                          className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[9px] ${
                            activeFilter === "all"
                              ? "bg-white/25 text-white"
                              : "bg-[#EAF3FF] text-[#2D6FE8]"
                          }`}
                        >
                          {filter.count}
                        </span>
                      )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* NOTIFICATIONS LIST */}

          {paginatedNotifications.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3 bg-[#F8FBFF] p-4 sm:p-5"
            >
              {paginatedNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onRead={handleMarkAsRead}
                  onDelete={handleDeleteClick}
                  readLoadingId={readLoadingId}
                  canMarkRead={canMarkRead}
                  canDelete={canDeleteNotification}
                />
              ))}
            </motion.div>
          ) : (
            /* EMPTY STATE */

            <div className="flex min-h-[350px] flex-col items-center justify-center px-5 py-16 text-center">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                  <FiBell size={27} />
                </div>

                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#2D6FE8] text-white">
                  <FiCheck size={11} />
                </div>
              </div>

              <h3 className="mt-5 text-base font-bold text-[#111827]">
                No notifications found
              </h3>

              <p className="mt-1 max-w-sm text-xs leading-5 text-[#6B7280]">
                {search
                  ? "Try another search keyword."
                  : activeFilter === "unread"
                    ? "You don't have any unread notifications."
                    : activeFilter === "read"
                      ? "You don't have any read notifications."
                      : "You're all caught up. New notifications will appear here."}
              </p>

              {(search || activeFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setActiveFilter("all");
                    setCurrentPage(1);
                  }}
                  className="mt-5 rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-5 py-2.5 text-xs font-bold text-white shadow-[0_8px_18px_-8px_rgba(45,111,232,0.5)] transition hover:-translate-y-0.5"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* PAGINATION */}

          {filteredNotifications.length > 0 && (
            <div className="border-t border-[#DCE6F2] bg-[#F8FBFF] px-4 py-4 sm:px-5">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-xs text-[#6B7280]">
                  Showing{" "}
                  <span className="font-bold text-[#111827]">
                    {startEntry}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-[#111827]">
                    {endEntry}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-[#111827]">
                    {filteredNotifications.length}
                  </span>{" "}
                  entries
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      handlePageChange(currentPage - 1)
                    }
                    disabled={currentPage === 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronLeft size={17} />
                  </button>

                  {paginationPages.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => handlePageChange(page)}
                      className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold transition-all ${
                        currentPage === page
                          ? "bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-white shadow-[0_6px_14px_-6px_rgba(45,111,232,0.5)]"
                          : "border border-[#DCE6F2] bg-white text-[#6B7280] hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      handlePageChange(currentPage + 1)
                    }
                    disabled={currentPage === totalPages}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronRight size={17} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* DELETE ONE MODAL */}

      {canDeleteNotification && (
        <DeleteConfirmModal
          open={deleteModalOpen}
          title="Delete Notification"
          message={`Are you sure you want to delete "${
            selectedNotification?.title || "this notification"
          }"? This action cannot be undone.`}
          loading={deleteLoadingId !== null}
          onClose={() => {
            if (deleteLoadingId !== null) return;

            setDeleteModalOpen(false);
            setSelectedNotification(null);
          }}
          onConfirm={handleDelete}
        />
      )}

      {/* DELETE ALL MODAL */}

      {canDeleteNotification && (
        <DeleteConfirmModal
          open={deleteAllModalOpen}
          title="Delete All Notifications"
          message={`Are you sure you want to delete all ${notifications.length} notifications? This action cannot be undone.`}
          loading={deleteAllLoading}
          onClose={() => {
            if (deleteAllLoading) return;

            setDeleteAllModalOpen(false);
          }}
          onConfirm={handleDeleteAll}
        />
      )}
    </>
  );
};

export default Notifications;