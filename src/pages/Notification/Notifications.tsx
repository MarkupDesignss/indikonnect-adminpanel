import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiTrash2,
  FiSearch,
  FiX,
  FiMail,
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
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { notificationApi } from "../../api/endpoints/notification";
import GlobalModal from "@/components/common/GlobalModal";

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
// THEME
// =====================================================

const GOLD_GRADIENT =
  "bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]";

const DARK_GOLD_GRADIENT =
  "bg-gradient-to-r from-[#b8902e] to-[#8f6d1d]";

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
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 15,
    },
  },
};

// =====================================================
// HELPERS
// =====================================================

const getNotificationIcon = (
  type?: string
) => {
  const normalizedType = type?.toLowerCase() || "";

  if (normalizedType.includes("order") || normalizedType === "order_confirmed") {
    return <FiPackage size={18} />;
  }

  if (normalizedType.includes("payment")) {
    return <FiCreditCard size={18} />;
  }

  if (normalizedType.includes("delivery")) {
    return <FiTruck size={18} />;
  }

  if (normalizedType.includes("user") || normalizedType.includes("kyc") || normalizedType.includes("distributor")) {
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

const getNotificationLabel = (
  type?: string
) => {
  if (!type) return "Notification";

  const normalizedType = type.toLowerCase();

  if (normalizedType === "order_confirmed") return "Order Confirmed";
  if (normalizedType === "return_pending") return "Return Request";
  if (normalizedType === "return_approved") return "Return Approved";
  if (normalizedType === "return_received") return "Return Received";
  if (normalizedType === "new_distributor_registration") return "Distributor Registration";
  if (normalizedType === "kyc_review") return "KYC Review";

  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
};

const getIconClasses = (
  type?: string
) => {
  const normalizedType = type?.toLowerCase() || "";

  if (normalizedType.includes("payment") || normalizedType === "order_confirmed") {
    return "bg-[#fffaf0] text-[#8f6d1d] border-[#d4af52]/20";
  }

  if (normalizedType.includes("delivery") || normalizedType.includes("return")) {
    return "bg-[#f8f3e5] text-[#806319] border-[#b8902e]/20";
  }

  if (normalizedType.includes("user") || normalizedType.includes("distributor") || normalizedType.includes("kyc")) {
    return "bg-[#faf8f3] text-[#a8841c] border-[#d4af52]/20";
  }

  if (normalizedType.includes("alert")) {
    return "bg-[#fff8e8] text-[#a06f13] border-[#d9a441]/25";
  }

  if (normalizedType.includes("message")) {
    return "bg-[#faf8f3] text-[#8f6d1d] border-[#b8902e]/20";
  }

  return "bg-[#faf8f3] text-[#b8902e] border-[#b8902e]/20";
};

const formatDate = (
  date?: string | null
) => {
  if (!date) return "—";

  try {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  } catch {
    return date;
  }
};

const getRelativeTime = (
  date?: string | null
) => {
  if (!date) return "";

  try {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    const now = new Date();
    const diff = now.getTime() - parsed.getTime();

    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
      return `${days}d ago`;
    }

    return formatDate(date);
  } catch {
    return "";
  }
};

// =====================================================
// STAT CARD
// =====================================================

interface NotificationStatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  accent: string;
}

const NotificationStatCard: React.FC<
  NotificationStatCardProps
> = ({
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
        boxShadow:
          "0 16px 30px -18px rgba(140,105,25,0.28)",
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
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#a89a7d]">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-[#2a2620]">
            {value.toLocaleString(
              "en-IN"
            )}
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
// DELETE CONFIRM MODAL
// =====================================================

interface DeleteConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<
  DeleteConfirmModalProps
> = ({
  open,
  title,
  message,
  loading,
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#2f2a22]/45 px-4 backdrop-blur-sm">
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.95,
          y: 10,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        className="w-full max-w-[440px] overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl"
      >
        <div className="h-1 w-full bg-gradient-to-r from-[#d4af52] to-[#b46055]" />

        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fff0ed] text-[#b46055]">
              <FiTrash2 size={20} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#2a2620]">
                {title}
              </h2>

              <p className="mt-1 text-sm leading-6 text-[#786f60]">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#b8902e]/10 bg-[#fffdfa] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-[#b8902e]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#786f60] transition hover:bg-[#faf8f3] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-[#b46055] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#9d4f47] disabled:opacity-50"
          >
            {loading ? (
              <FiRefreshCw
                size={14}
                className="animate-spin"
              />
            ) : (
              <FiTrash2 size={14} />
            )}

            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// =====================================================
// NOTIFICATION CARD
// =====================================================

interface NotificationCardProps {
  notification: Notification;
  onRead: (
    notification: Notification
  ) => void;
  onDelete: (
    notification: Notification
  ) => void;
  readLoadingId: number | null;
}

const NotificationCard: React.FC<
  NotificationCardProps
> = ({
  notification,
  onRead,
  onDelete,
  readLoadingId,
}) => {
  const isUnread = !notification.is_read;

  return (
    <motion.div
      variants={itemVariants}
      layout
      className={`group relative overflow-hidden border-b border-[#b8902e]/10 p-4 transition-all duration-300 sm:p-5 ${
        isUnread
          ? "bg-[#fffdf7]"
          : "bg-white hover:bg-[#faf8f3]"
      }`}
    >
      {/* Unread indicator */}

      {isUnread && (
        <div className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-[#d4af52] to-[#8f6d1d]" />
      )}

      <div className="flex items-start gap-4">
        {/* ICON */}

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${getIconClasses(
            notification.type
          )}`}
        >
          {getNotificationIcon(
            notification.type
          )}
        </div>

        {/* CONTENT */}

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className={`text-sm ${
                    isUnread
                      ? "font-bold text-[#2a2620]"
                      : "font-semibold text-[#4a4436]"
                  }`}
                >
                  {notification.title}
                </h3>

                {isUnread && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#b8902e]/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[#8f6d1d]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#b8902e]" />
                    New
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-[#a89a7d]">
                {getNotificationLabel(
                  notification.type
                )}
              </p>
            </div>

            {/* TIME */}

            <div className="shrink-0">
              <span className="text-[11px] text-[#a89a7d]">
                {getRelativeTime(
                  notification.created_at
                )}
              </span>
            </div>
          </div>

          {/* MESSAGE */}

          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#786f60]">
            {notification.message}
          </p>

          {/* FULL DATE */}

          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[#b1a58e]">
            <FiInfo size={11} />

            {formatDate(
              notification.created_at
            )}
          </div>

          {/* ACTIONS */}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {isUnread && (
              <button
                type="button"
                onClick={() =>
                  onRead(
                    notification
                  )
                }
                disabled={
                  readLoadingId ===
                  notification.id
                }
                className="flex items-center gap-1.5 rounded-lg border border-[#b8902e]/20 bg-[#faf8f3] px-3 py-2 text-[11px] font-bold text-[#8f6d1d] transition hover:border-[#b8902e]/35 hover:bg-[#b8902e]/10 disabled:opacity-50"
              >
                {readLoadingId ===
                  notification.id ? (
                  <FiRefreshCw
                    size={13}
                    className="animate-spin"
                  />
                ) : (
                  <FiCheck
                    size={13}
                  />
                )}

                Mark as Read
              </button>
            )}

            {!isUnread && (
              <span className="flex items-center gap-1.5 rounded-lg bg-[#f8f3e5] px-3 py-2 text-[11px] font-semibold text-[#8f6d1d]">
                <FiCheckCircle
                  size={13}
                />

                Read
              </span>
            )}

            <button
              type="button"
              onClick={() =>
                onDelete(
                  notification
                )
              }
              className="flex items-center gap-1.5 rounded-lg border border-[#c98d83]/20 bg-[#fff8f6] px-3 py-2 text-[11px] font-bold text-[#b46055] transition hover:border-[#b46055]/40 hover:bg-[#b46055]/10"
            >
              <FiTrash2 size={13} />

              Delete
            </button>
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
  const [
    notifications,
    setNotifications,
  ] = useState<Notification[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    activeFilter,
    setActiveFilter,
  ] = useState<
    "all" | "unread" | "read"
  >("all");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    readLoadingId,
    setReadLoadingId,
  ] = useState<number | null>(
    null
  );

  const [
    markAllLoading,
    setMarkAllLoading,
  ] = useState(false);

  const [
    deleteLoadingId,
    setDeleteLoadingId,
  ] = useState<number | null>(
    null
  );

  const [
    deleteAllLoading,
    setDeleteAllLoading,
  ] = useState(false);

  const [
    deleteModalOpen,
    setDeleteModalOpen,
  ] = useState(false);

  const [
    deleteAllModalOpen,
    setDeleteAllModalOpen,
  ] = useState(false);

  const [
    selectedNotification,
    setSelectedNotification,
  ] =
    useState<Notification | null>(
      null
    );

  const ITEMS_PER_PAGE = 10;

  // ===================================================
  // FETCH ALL NOTIFICATIONS
  // ===================================================

  const fetchNotifications =
    async () => {
      try {
        setLoading(true);

        const response =
          await notificationApi.getAll();

        /*
         * Supports common response formats:
         *
         * response.data.data
         * response.data.data.data
         */

        const responseData =
          response.data;

        let list: Notification[] =
          [];

        let rawData: any[] = [];

        if (
          Array.isArray(
            responseData?.data
          )
        ) {
          rawData = responseData.data;
        } else if (
          Array.isArray(
            responseData?.data
              ?.data
          )
        ) {
          rawData = responseData.data.data;
        }

        // Transform API response to match frontend Notification interface
        list = rawData.map((item: any) => ({
          id: item.id,
          title: item.title || "Notification",
          message: item.message || "",
          // Map 'read' field from API (0/1) to 'is_read' (boolean)
          is_read: item.read === 1,
          type: item.type || "general",
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at,
          read_at: item.read === 1 ? item.updated_at || null : null,
          data: item.extra_data || null,
        }));

        setNotifications(list || []);
      } catch (error: any) {
        console.error(
          "Get notifications error:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            error?.message ||
            "Unable to fetch notifications."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // ===================================================
  // COUNTS
  // ===================================================

  const counts = useMemo(() => {
    const total =
      notifications.length;

    const unread =
      notifications.filter(
        (item) =>
          !item.is_read
      ).length;

    const read =
      notifications.filter(
        (item) =>
          item.is_read
      ).length;

    return {
      total,
      unread,
      read,
    };
  }, [notifications]);

  // ===================================================
  // FILTER
  // ===================================================

  const filteredNotifications =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return notifications.filter(
        (notification) => {
          const matchesSearch =
            !query ||
            [
              notification.title,
              notification.message,
              notification.type ||
                "",
            ]
              .join(" ")
              .toLowerCase()
              .includes(query);

          let matchesFilter =
            true;

          if (
            activeFilter ===
            "unread"
          ) {
            matchesFilter =
              !notification.is_read;
          }

          if (
            activeFilter ===
            "read"
          ) {
            matchesFilter =
              !!notification.is_read;
          }

          return (
            matchesSearch &&
            matchesFilter
          );
        }
      );
    }, [
      notifications,
      search,
      activeFilter,
    ]);

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredNotifications.length /
          ITEMS_PER_PAGE
      )
    );

  const startIndex =
    (currentPage - 1) *
    ITEMS_PER_PAGE;

  const paginatedNotifications =
    filteredNotifications.slice(
      startIndex,
      startIndex +
        ITEMS_PER_PAGE
    );

  const startEntry =
    filteredNotifications.length ===
    0
      ? 0
      : startIndex + 1;

  const endEntry = Math.min(
    startIndex +
      ITEMS_PER_PAGE,
    filteredNotifications.length
  );

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

  // ===================================================
  // SEARCH
  // ===================================================

  const handleSearch = (
    value: string
  ) => {
    setSearch(value);
    setCurrentPage(1);
  };

  // ===================================================
  // FILTER
  // ===================================================

  const handleFilter = (
    filter:
      | "all"
      | "unread"
      | "read"
  ) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  // ===================================================
  // SINGLE READ
  // ===================================================

  const handleMarkAsRead =
    async (
      notification: Notification
    ) => {
      if (notification.is_read)
        return;

      try {
        setReadLoadingId(
          notification.id
        );

        const response =
          await notificationApi.markAsRead(
            notification.id
          );

        const message =
          response?.data?.message ||
          "Notification marked as read.";

        setNotifications(
          (prev) =>
            prev.map((item) =>
              item.id ===
                notification.id
                ? {
                    ...item,
                    is_read: true,
                    read_at:
                      new Date().toISOString(),
                  }
                : item
            )
        );

        toast.success(message);
      } catch (error: any) {
        console.error(
          "Mark notification read error:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            "Unable to mark notification as read."
        );
      } finally {
        setReadLoadingId(
          null
        );
      }
    };

  // ===================================================
  // MARK ALL READ
  // ===================================================

  const handleMarkAllAsRead =
    async () => {
      if (counts.unread === 0) {
        toast.success(
          "All notifications are already read."
        );
        return;
      }

      try {
        setMarkAllLoading(true);

        const response =
          await notificationApi.markAllAsRead();

        setNotifications(
          (prev) =>
            prev.map((item) => ({
              ...item,
              is_read: true,
              read_at:
                item.read_at ||
                new Date().toISOString(),
            }))
        );

        toast.success(
          response?.data?.message ||
            "All notifications marked as read."
        );
      } catch (error: any) {
        console.error(
          "Mark all read error:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            "Unable to mark all notifications as read."
        );
      } finally {
        setMarkAllLoading(false);
      }
    };

  // ===================================================
  // OPEN DELETE MODAL
  // ===================================================

  const handleDeleteClick = (
    notification: Notification
  ) => {
    setSelectedNotification(
      notification
    );

    setDeleteModalOpen(
      true
    );
  };

  // ===================================================
  // DELETE SINGLE
  // ===================================================

  const handleDelete =
    async () => {
      if (
        !selectedNotification
      ) {
        return;
      }

      try {
        setDeleteLoadingId(
          selectedNotification.id
        );

        const response =
          await notificationApi.delete(
            selectedNotification.id
          );

        setNotifications(
          (prev) =>
            prev.filter(
              (item) =>
                item.id !==
                selectedNotification.id
            )
        );

        setDeleteModalOpen(
          false
        );

        toast.success(
          response?.data?.message ||
            "Notification deleted successfully."
        );

        setSelectedNotification(
          null
        );
      } catch (error: any) {
        console.error(
          "Delete notification error:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            "Unable to delete notification."
        );
      } finally {
        setDeleteLoadingId(
          null
        );
      }
    };

  // ===================================================
  // DELETE ALL
  // ===================================================

  const handleDeleteAll =
    async () => {
      try {
        setDeleteAllLoading(
          true
        );

        const response =
          await notificationApi.deleteAll();

        setNotifications([]);

        setDeleteAllModalOpen(
          false
        );

        setCurrentPage(1);

        toast.success(
          response?.data?.message ||
            "All notifications deleted successfully."
        );
      } catch (error: any) {
        console.error(
          "Delete all notifications error:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            "Unable to delete all notifications."
        );
      } finally {
        setDeleteAllLoading(
          false
        );
      }
    };

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh =
    async () => {
      await fetchNotifications();

      toast.success(
        "Notifications refreshed."
      );
    };

  // ===================================================
  // PAGINATION
  // ===================================================

  const handlePageChange = (
    page: number
  ) => {
    if (
      page < 1 ||
      page > totalPages
    ) {
      return;
    }

    setCurrentPage(page);
  };

  const paginationPages =
    useMemo(() => {
      if (totalPages <= 5) {
        return Array.from(
          {
            length: totalPages,
          },
          (_, index) =>
            index + 1
        );
      }

      if (currentPage <= 3) {
        return [
          1,
          2,
          3,
          4,
          5,
        ];
      }

      if (
        currentPage >=
        totalPages - 2
      ) {
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
    }, [
      currentPage,
      totalPages,
    ]);

  // ===================================================
  // LOADING
  // ===================================================

  if (
    loading &&
    notifications.length === 0
  ) {
    return (
      <div className="min-h-screen bg-[#faf8f3] p-4">
        <div className="mb-5">
          <div className="mb-1 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#b8902e]" />

            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b8902e]">
              Notifications
            </span>
          </div>

          <h1 className="font-serif text-[28px] font-bold text-[#2a2620]">
            Notification Center
          </h1>

          <p className="mt-1 text-sm text-[#786f60]">
            Stay updated with the latest activity.
          </p>
        </div>

        <div className="flex min-h-[350px] items-center justify-center rounded-2xl border border-[#b8902e]/15 bg-white shadow-sm">
          <div className="flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#b8902e]/10 text-[#b8902e]">
              <FiRefreshCw
                size={27}
                className="animate-spin"
              />
            </div>

            <p className="mt-4 text-sm font-bold text-[#2a2620]">
              Loading notifications...
            </p>

            <p className="mt-1 text-xs text-[#a89a7d]">
              Please wait while we fetch your latest
              notifications.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        className="min-h-screen bg-[#faf8f3] p-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <motion.div
          variants={itemVariants}
          className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center"
        >
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#b8902e]" />

              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b8902e]">
                Notifications
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-serif text-[28px] font-bold tracking-tight text-[#2a2620] sm:text-[30px]">
                Notification Center
              </h1>

              {counts.unread > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-[#b8902e] px-3 py-1.5 text-[10px] font-bold text-white shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />

                  {counts.unread} unread
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-[#786f60]">
              Keep track of orders, payments, users,
              and important admin activity.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={
                handleMarkAllAsRead
              }
              disabled={
                markAllLoading ||
                counts.unread === 0
              }
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#b8902e]/20 bg-white px-4 text-xs font-bold text-[#8f6d1d] shadow-sm transition hover:border-[#b8902e]/35 hover:bg-[#faf8f3] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {markAllLoading ? (
                <FiRefreshCw
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <FiCheckCircle
                  size={15}
                />
              )}

              Mark All as Read
            </button>

            <button
              type="button"
              onClick={
                handleRefresh
              }
              disabled={loading}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#b8902e]/20 bg-white px-4 text-xs font-bold text-[#8f6d1d] shadow-sm transition hover:border-[#b8902e]/35 hover:bg-[#faf8f3] disabled:opacity-50"
            >
              <FiRefreshCw
                size={15}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                setDeleteAllModalOpen(
                  true
                )
              }
              disabled={
                notifications.length ===
                0
              }
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#c98d83]/20 bg-[#fff8f6] px-4 text-xs font-bold text-[#b46055] transition hover:border-[#b46055]/40 hover:bg-[#b46055]/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiTrash2 size={15} />

              Delete All
            </button>
          </div>
        </motion.div>

        {/* =================================================
            MAIN NOTIFICATION CARD
        ================================================= */}

        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-sm"
        >
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

          {/* =================================================
              TOOLBAR
          ================================================= */}

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
                  onChange={(e) =>
                    handleSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search notifications..."
                  className="h-12 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] pl-11 pr-10 text-sm text-[#2a2620] outline-none transition-all placeholder:text-[#a89a7d] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() =>
                      handleSearch("")
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a89a7d] hover:text-[#8f6d1d]"
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>

              {/* FILTER */}

              <div className="flex flex-wrap gap-2">
                {[
                  {
                    key: "all" as const,
                    label: "All",
                  },
                  {
                    key: "unread" as const,
                    label: "Unread",
                  },
                  {
                    key: "read" as const,
                    label: "Read",
                  },
                ].map(
                  (filter) => (
                    <button
                      type="button"
                      key={
                        filter.key
                      }
                      onClick={() =>
                        handleFilter(
                          filter.key
                        )
                      }
                      className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                        activeFilter ===
                        filter.key
                          ? DARK_GOLD_GRADIENT +
                            " text-white shadow-md shadow-[#b8902e]/20"
                          : "border border-[#b8902e]/15 bg-[#faf8f3] text-[#786f60] hover:border-[#b8902e]/30 hover:bg-[#b8902e]/10 hover:text-[#8f6d1d]"
                      }`}
                    >
                      {filter.label}

                      {filter.key ===
                        "unread" &&
                        counts.unread >
                          0 && (
                          <span
                            className={`ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[9px] ${
                              activeFilter ===
                              "unread"
                                ? "bg-white/20 text-white"
                                : "bg-[#b8902e]/15 text-[#8f6d1d]"
                            }`}
                          >
                            {
                              counts.unread
                            }
                          </span>
                        )}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* =================================================
              NOTIFICATIONS LIST
          ================================================= */}

          {paginatedNotifications.length >
            0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {paginatedNotifications.map(
                (
                  notification
                ) => (
                  <NotificationCard
                    key={
                      notification.id
                    }
                    notification={
                      notification
                    }
                    onRead={
                      handleMarkAsRead
                    }
                    onDelete={
                      handleDeleteClick
                    }
                    readLoadingId={
                      readLoadingId
                    }
                  />
                )
              )}
            </motion.div>
          ) : (
            /* EMPTY */

            <div className="flex min-h-[350px] flex-col items-center justify-center px-5 py-16 text-center">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#b8902e]">
                  <FiBell size={27} />
                </div>

                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#b8902e] text-white">
                  <FiCheck size={11} />
                </div>
              </div>

              <h3 className="mt-5 text-base font-bold text-[#2a2620]">
                No notifications found
              </h3>

              <p className="mt-1 max-w-sm text-xs leading-5 text-[#a89a7d]">
                {search
                  ? "Try another search keyword."
                  : activeFilter ===
                    "unread"
                  ? "You don't have any unread notifications."
                  : activeFilter ===
                    "read"
                  ? "You don't have any read notifications."
                  : "You're all caught up. New notifications will appear here."}
              </p>

              {(search ||
                activeFilter !==
                  "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setActiveFilter(
                      "all"
                    );
                    setCurrentPage(
                      1
                    );
                  }}
                  className="mt-5 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#b8902e]/15"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* =================================================
              PAGINATION
          ================================================= */}

          {filteredNotifications.length >
            0 && (
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
                    {
                      filteredNotifications.length
                    }
                  </span>{" "}
                  entries
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      handlePageChange(
                        currentPage -
                          1
                      )
                    }
                    disabled={
                      currentPage ===
                      1
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#b8902e]/15 bg-white text-[#8f6d1d] transition hover:bg-[#faf8f3] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronLeft
                      size={17}
                    />
                  </button>
                  <GlobalModal />

                  {paginationPages.map(
                    (page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() =>
                          handlePageChange(
                            page
                          )
                        }
                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold transition-all ${
                          currentPage ===
                          page
                            ? "bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-white shadow-md shadow-[#b8902e]/20"
                            : "text-[#786f60] hover:bg-[#faf8f3] hover:text-[#8f6d1d]"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      handlePageChange(
                        currentPage +
                          1
                      )
                    }
                    disabled={
                      currentPage ===
                      totalPages
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#b8902e]/15 bg-white text-[#8f6d1d] transition hover:bg-[#faf8f3] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronRight
                      size={17}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* =================================================
          DELETE ONE MODAL
      ================================================= */}

      <DeleteConfirmModal
        open={
          deleteModalOpen
        }
        title="Delete Notification"
        message={`Are you sure you want to delete "${selectedNotification?.title || "this notification"
          }"? This action cannot be undone.`}
        loading={
          deleteLoadingId !==
          null
        }
        onClose={() => {
          if (
            deleteLoadingId !==
            null
          ) {
            return;
          }

          setDeleteModalOpen(
            false
          );

          setSelectedNotification(
            null
          );
        }}
        onConfirm={
          handleDelete
        }
      />

      {/* =================================================
          DELETE ALL MODAL
      ================================================= */}

      <DeleteConfirmModal
        open={
          deleteAllModalOpen
        }
        title="Delete All Notifications"
        message={`Are you sure you want to delete all ${notifications.length} notifications? This action cannot be undone.`}
        loading={
          deleteAllLoading
        }
        onClose={() => {
          if (
            deleteAllLoading
          ) {
            return;
          }

          setDeleteAllModalOpen(
            false
          );
        }}
        onConfirm={
          handleDeleteAll
        }
      />
    </>
  );
};

export default Notifications;