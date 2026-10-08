import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiSearch,
  FiRefreshCw,
  FiMail,
  FiTrash2,
  FiCopy,
  FiCheck,
  FiX,
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiCalendar,
  FiGlobe,
  FiClock,
  FiShield,
  FiActivity,
  FiChevronRight,
  FiHash,
  FiAlertCircle,
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

import GlobalModal from "@/components/common/GlobalModal";

import subscriberApi, {
  Subscriber,
} from "../../api/endpoints/subscribers";

// ✅ PERMISSIONS
import { usePermissions } from "../../pages/permissions/usePermissions";

// =====================================================
// TYPES
// =====================================================

type SubscriberFilter =
  | "all"
  | "active"
  | "inactive";

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
      type: "spring" as const,
      stiffness: 100,
      damping: 14,
    },
  },
};

// =====================================================
// HELPERS
// =====================================================

const formatDate = (
  value?: string | null,
) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
};

const formatDateOnly = (
  value?: string | null,
) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
};

const formatTime = (
  value?: string | null,
) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
};

const getInitials = (
  email: string,
) => {
  const name =
    email?.split("@")[0]?.trim() ||
    "U";

  const cleanName =
    name.replace(
      /[^a-zA-Z]/g,
      "",
    );

  return (
    cleanName
      .slice(0, 2)
      .toUpperCase() || "U"
  );
};

// =====================================================
// STATUS BADGE — NAVY THEME
// =====================================================

const StatusBadge: React.FC<{
  active: boolean;
}> = ({ active }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${
      active
        ? "border-[#1E3A8A]/25 bg-[#EAF1FF] text-[#1E3A8A]"
        : "border-[#D8E2F0] bg-[#F3F6FB] text-[#4A5778]"
    }`}
  >
    <span
      className={`h-1.5 w-1.5 rounded-full ${
        active
          ? "bg-[#1E3A8A]"
          : "bg-[#8C97B2]"
      }`}
    />

    {active ? "Active" : "Inactive"}
  </span>
);

// =====================================================
// ✅ PERMISSION LOADING
// =====================================================

const PermissionLoading: React.FC =
  () => {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8FF] p-4 font-poppins">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#1E3A8A] shadow-sm">
            <FiRefreshCw
              size={23}
              className="animate-spin"
            />
          </div>

          <p className="mt-4 text-sm font-bold text-[#0F1B3D]">
            Checking permissions...
          </p>

          <p className="mt-1 text-[10px] text-[#8C97B2]">
            Verifying subscriber management
            access.
          </p>
        </div>
      </div>
    );
  };

// =====================================================
// ✅ ACCESS DENIED
// =====================================================

const AccessDenied: React.FC =
  () => {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8FF] p-4 font-poppins">
        <div className="max-w-md rounded-2xl border border-[#E3E9F5] bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBEAEA] text-[#C23B32]">
            <FiAlertCircle
              size={26}
            />
          </div>

          <h2 className="text-lg font-bold text-[#0F1B3D]">
            Access Denied
          </h2>

          <p className="mt-2 text-sm text-[#6B7896]">
            You don't have permission
            to access the Subscriber
            Management module.
          </p>

          <div className="mt-5 rounded-xl border border-[#C23B32]/15 bg-[#FBEAEA] px-4 py-3 text-[10px] font-semibold text-[#C23B32]">
            Contact your administrator
            to request access.
          </div>
        </div>
      </div>
    );
  };

// =====================================================
// DELETE MODAL — NAVY THEME
// =====================================================

interface DeleteModalProps {
  open: boolean;
  loading: boolean;
  email: string;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteSubscriberModal: React.FC<
  DeleteModalProps
> = ({
  open,
  loading,
  email,
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={
        !loading
      }
    >
      <div className="w-full max-w-[470px] overflow-hidden rounded-2xl border border-[#E3E9F5] bg-white shadow-2xl font-poppins">
        <div className="h-1 w-full bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1E3A8A]" />

        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FBEAEA] text-[#C23B32]">
              <FiTrash2 size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#0F1B3D]">
                Delete Subscriber
              </h2>

              <p className="mt-1 text-sm leading-6 text-[#8C97B2]">
                This subscriber will be
                permanently removed from
                the subscriber list.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-[#E3E9F5] bg-[#F5F8FF] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
              Subscriber Email
            </p>

            <p className="mt-1 break-all text-sm font-semibold text-[#0F1B3D]">
              {email}
            </p>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-[#1E3A8A]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#4A5778] transition hover:bg-[#F5F8FF] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C23B32] to-[#A62F27] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(194,59,50,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-8px_rgba(194,59,50,0.7)] disabled:opacity-50"
            >
              {loading ? (
                <FiRefreshCw
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <FiTrash2 size={15} />
              )}

              {loading
                ? "Deleting..."
                : "Delete Subscriber"}
            </button>
          </div>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// INFO CARD — NAVY THEME
// =====================================================

interface InfoCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  customValue?: React.ReactNode;
  copyable?: boolean;
  onCopy?: () => void;
  mono?: boolean;
}

const InfoCard: React.FC<
  InfoCardProps
> = ({
  label,
  value,
  icon,
  customValue,
  copyable,
  onCopy,
  mono,
}) => (
  <div className="rounded-xl border border-[#1E3A8A]/10 bg-[#F5F8FF] p-4">
    <div className="mb-2 flex items-center gap-2 text-[#1E3A8A]">
      {icon}

      <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
        {label}
      </p>
    </div>

    {customValue ? (
      customValue
    ) : (
      <div className="flex items-center justify-between gap-2">
        <p
          className={`min-w-0 truncate text-sm font-bold text-[#0F1B3D] ${
            mono ? "font-mono" : ""
          }`}
          title={value}
        >
          {value}
        </p>

        {copyable &&
          onCopy && (
            <button
              type="button"
              onClick={onCopy}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#1E3A8A]/15 bg-white text-[#1E3A8A] transition hover:bg-[#1E3A8A] hover:text-white"
              title="Copy"
            >
              <FiCopy
                size={12}
              />
            </button>
          )}
      </div>
    )}
  </div>
);

// =====================================================
// DETAIL ROW — NAVY THEME
// =====================================================

const DetailRow: React.FC<{
  label: string;
  value: string;
}> = ({
  label,
  value,
}) => (
  <div className="flex items-start justify-between gap-4 border-b border-[#1E3A8A]/10 pb-3 last:border-0 last:pb-0">
    <span className="text-xs text-[#8C97B2]">
      {label}
    </span>

    <span className="text-right text-xs font-bold text-[#3A4668]">
      {value}
    </span>
  </div>
);

// =====================================================
// TIMELINE ITEM — NAVY THEME
// =====================================================

const TimelineItem: React.FC<{
  icon: React.ReactNode;
  title: string;
  date: string;
  description: string;
  active?: boolean;
}> = ({
  icon,
  title,
  date,
  description,
  active,
}) => (
  <div className="flex gap-3">
    <div className="flex flex-col items-center">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full ${
          active
            ? "bg-[#1E3A8A] text-white shadow-[0_4px_10px_-4px_rgba(30,58,138,0.5)]"
            : "bg-[#EAF1FF] text-[#4A5778]"
        }`}
      >
        {icon}
      </div>

      <div className="mt-1 h-full w-px bg-[#1E3A8A]/10" />
    </div>

    <div className="pb-4">
      <p className="text-sm font-bold text-[#0F1B3D]">
        {title}
      </p>

      <p className="mt-0.5 text-xs font-semibold text-[#2563EB]">
        {date}
      </p>

      <p className="mt-1 text-xs leading-5 text-[#8C97B2]">
        {description}
      </p>
    </div>
  </div>
);

// =====================================================
// SUBSCRIBER DETAIL — NAVY THEME
// =====================================================

interface SubscriberDetailProps {
  subscriber: Subscriber;
  onDelete: (
    subscriber: Subscriber,
  ) => void;
  canDelete?: boolean;
}

const SubscriberDetail: React.FC<
  SubscriberDetailProps
> = ({
  subscriber,
  onDelete,
  canDelete = false,
}) => {
  const [copied, setCopied] =
    useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        subscriber.email,
      );

      setCopied(true);

      toast.success(
        "Email copied successfully.",
      );

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      toast.error(
        "Unable to copy email.",
      );
    }
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#E3E9F5] bg-white shadow-sm">
      {/* HEADER */}
      <div className="relative border-b border-[#1E3A8A]/10 bg-white p-5 sm:p-6">
        <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1E3A8A]" />

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] text-sm font-bold text-white shadow-[0_10px_22px_-10px_rgba(30,58,138,0.5)]">
              {getInitials(
                subscriber.email,
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-bold text-[#0F1B3D] sm:text-xl">
                  {subscriber.email}
                </h2>

                <StatusBadge
                  active={
                    subscriber.is_active
                  }
                />
              </div>

              <p className="mt-1 text-xs text-[#8C97B2]">
                Subscriber #
                {subscriber.id}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={
                handleCopy
              }
              className="flex items-center gap-2 rounded-xl border border-[#1E3A8A]/20 bg-[#EAF1FF] px-4 py-2.5 text-xs font-bold text-[#1E3A8A] transition hover:border-[#1E3A8A]/35 hover:bg-[#DBEAFE]"
            >
              {copied ? (
                <FiCheck size={15} />
              ) : (
                <FiCopy size={15} />
              )}

              {copied
                ? "Copied"
                : "Copy Email"}
            </button>

            {/* ✅ DELETE — permission based */}
            {canDelete && (
              <button
                type="button"
                onClick={() =>
                  onDelete(
                    subscriber,
                  )
                }
                className="flex items-center gap-2 rounded-xl border border-[#C23B32]/25 bg-[#FBEAEA] px-4 py-2.5 text-xs font-bold text-[#C23B32] transition hover:border-transparent hover:bg-[#C23B32] hover:text-white"
              >
                <FiTrash2 size={15} />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto bg-[#F5F8FF] p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          {/* MAIN */}
          <div className="space-y-5 xl:col-span-2">
            {/* OVERVIEW */}
            <div className="relative overflow-hidden rounded-2xl border border-[#E3E9F5] bg-white p-5 shadow-sm sm:p-6">
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#60A5FA] to-[#2563EB]" />

              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#0F1B3D]">
                    Subscriber Overview
                  </h3>

                  <p className="mt-1 text-xs text-[#8C97B2]">
                    Subscription and account information
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
                  <FiMail
                    size={17}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoCard
                  label="Email Address"
                  value={
                    subscriber.email
                  }
                  icon={
                    <FiMail
                      size={15}
                    />
                  }
                  copyable
                  onCopy={
                    handleCopy
                  }
                />

                <InfoCard
                  label="Subscription Status"
                  value={
                    subscriber.is_active
                      ? "Active Subscriber"
                      : "Inactive Subscriber"
                  }
                  icon={
                    <FiActivity
                      size={15}
                    />
                  }
                  customValue={
                    <StatusBadge
                      active={
                        subscriber.is_active
                      }
                    />
                  }
                />

                <InfoCard
                  label="Subscriber ID"
                  value={`#${subscriber.id}`}
                  icon={
                    <FiHash
                      size={15}
                    />
                  }
                />

                <InfoCard
                  label="IP Address"
                  value={
                    subscriber.ip_address
                  }
                  icon={
                    <FiGlobe
                      size={15}
                    />
                  }
                  mono
                />
              </div>
            </div>

            {/* TIMELINE */}
            <div className="relative overflow-hidden rounded-2xl border border-[#E3E9F5] bg-white p-5 shadow-sm sm:p-6">
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#3B82F6] to-[#1E3A8A]" />

              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
                  <FiCalendar
                    size={17}
                  />
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#0F1B3D]">
                    Subscription Timeline
                  </h3>

                  <p className="mt-1 text-xs text-[#8C97B2]">
                    Important subscriber activity dates
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <TimelineItem
                  icon={
                    <FiCheck
                      size={14}
                    />
                  }
                  title="Subscribed"
                  date={formatDate(
                    subscriber.subscribed_at,
                  )}
                  description="Subscriber joined the newsletter."
                  active
                />

                <TimelineItem
                  icon={
                    <FiClock
                      size={14}
                    />
                  }
                  title="Created"
                  date={formatDate(
                    subscriber.created_at,
                  )}
                  description="Subscriber record was created."
                  active
                />

                <TimelineItem
                  icon={
                    <FiActivity
                      size={14}
                    />
                  }
                  title="Last Updated"
                  date={formatDate(
                    subscriber.updated_at,
                  )}
                  description="Subscriber record was last updated."
                  active
                />
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-5">
            {/* STATUS */}
            <div className="relative overflow-hidden rounded-2xl border border-[#E3E9F5] bg-white p-5 shadow-sm">
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#60A5FA] to-[#2563EB]" />

              <h4 className="mb-4 border-b border-[#1E3A8A]/10 pb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8C97B2]">
                Current Status
              </h4>

              <div className="rounded-2xl bg-[#F5F8FF] p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      subscriber.is_active
                        ? "bg-[#EAF1FF] text-[#1E3A8A]"
                        : "bg-[#F3F6FB] text-[#4A5778]"
                    }`}
                  >
                    {subscriber.is_active ? (
                      <FiUserCheck
                        size={19}
                      />
                    ) : (
                      <FiUserX
                        size={19}
                      />
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
                      Newsletter Access
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#0F1B3D]">
                      {subscriber.is_active
                        ? "Active"
                        : "Inactive"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* DETAILS */}
            <div className="relative overflow-hidden rounded-2xl border border-[#E3E9F5] bg-white p-5 shadow-sm">
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#3B82F6] to-[#1E3A8A]" />

              <h4 className="mb-4 border-b border-[#1E3A8A]/10 pb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8C97B2]">
                Record Details
              </h4>

              <div className="space-y-3">
                <DetailRow
                  label="Subscriber ID"
                  value={`#${subscriber.id}`}
                />

                <DetailRow
                  label="Subscribed Date"
                  value={formatDateOnly(
                    subscriber.subscribed_at,
                  )}
                />

                <DetailRow
                  label="Subscribed Time"
                  value={formatTime(
                    subscriber.subscribed_at,
                  )}
                />

                <DetailRow
                  label="Created At"
                  value={formatDateOnly(
                    subscriber.created_at,
                  )}
                />

                <DetailRow
                  label="Updated At"
                  value={formatDateOnly(
                    subscriber.updated_at,
                  )}
                />
              </div>
            </div>

            {/* PRIVACY */}
            <div className="relative overflow-hidden rounded-2xl border border-[#E3E9F5] bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
                  <FiShield
                    size={17}
                  />
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#0F1B3D]">
                    Subscriber Information
                  </h4>

                  <p className="mt-1 text-xs leading-5 text-[#8C97B2]">
                    The subscriber's email
                    and subscription
                    details are stored for
                    newsletter communication
                    and management.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="border-t border-[#1E3A8A]/10 bg-white px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="h-2 w-2 rounded-full bg-[#1E3A8A]" />

            <span className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">
              Subscriber #
              {subscriber.id}
            </span>
          </div>

          <span className="text-[10px] text-[#8C97B2]">
            Last updated{" "}
            {formatDate(
              subscriber.updated_at,
            )}
          </span>
        </div>
      </div>
    </section>
  );
};

// =====================================================
// SUBSCRIBER LIST SIDEBAR — NAVY THEME
// =====================================================

interface SubscriberSidebarProps {
  subscribers: Subscriber[];
  selectedId: number | null;
  onSelect: (
    subscriber: Subscriber,
  ) => void;
  filter: SubscriberFilter;
  setFilter: (
    filter: SubscriberFilter,
  ) => void;
  search: string;
  setSearch: (
    value: string,
  ) => void;
  loading: boolean;
}

const SubscriberSidebar: React.FC<
  SubscriberSidebarProps
> = ({
  subscribers,
  selectedId,
  onSelect,
  filter,
  setFilter,
  search,
  setSearch,
  loading,
}) => (
  <aside className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#E3E9F5] bg-white shadow-sm lg:w-[380px] xl:w-[410px]">
    {/* HEADER */}
    <div className="relative border-b border-[#1E3A8A]/10 p-4 sm:p-5">
      <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1E3A8A]" />

      {/* TITLE */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-[#0F1B3D]">
            Subscribers

            <span className="inline-flex items-center justify-center rounded-full bg-[#EAF1FF] px-2.5 py-0.5 text-xs font-semibold text-[#1E3A8A]">
              {subscribers.length}
            </span>
          </h3>

          <p className="mt-1 text-xs text-[#8C97B2]">
            Manage newsletter subscribers
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
          <FiUsers size={17} />
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {[
          {
            key: "all" as SubscriberFilter,
            label: "All",
          },
          {
            key: "active" as SubscriberFilter,
            label: "Active",
          },
          {
            key: "inactive" as SubscriberFilter,
            label: "Inactive",
          },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() =>
              setFilter(
                item.key,
              )
            }
            className={`whitespace-nowrap rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-wide transition ${
              filter === item.key
                ? "bg-gradient-to-r from-[#1E40AF] to-[#1E3A8A] text-white shadow-[0_6px_14px_-6px_rgba(30,58,138,0.5)]"
                : "border border-[#1E3A8A]/15 bg-[#F5F8FF] text-[#4A5778] hover:border-[#1E3A8A]/30 hover:bg-[#EAF1FF] hover:text-[#1E3A8A]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* SEARCH */}
      <div className="relative mt-4">
        <FiSearch
          size={17}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1E3A8A]"
        />

        <input
          type="text"
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value,
            )
          }
          placeholder="Search subscriber email..."
          className="h-11 w-full rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] pl-10 pr-3 text-xs text-[#0F1B3D] outline-none transition placeholder:text-[#8C97B2] focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/15"
        />

        {search && (
          <button
            type="button"
            onClick={() =>
              setSearch("")
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C97B2] hover:text-[#1E3A8A]"
          >
            <FiX size={15} />
          </button>
        )}
      </div>
    </div>

    {/* LIST HEADER */}
    <div className="border-b border-[#1E3A8A]/10 bg-[#FAFBFF] px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#8C97B2]">
          Subscriber List
        </span>

        <span className="rounded-full bg-[#EAF1FF] px-2.5 py-1 text-[10px] font-bold text-[#1E3A8A]">
          {subscribers.length}
        </span>
      </div>
    </div>

    {/* LIST */}
    <div className="flex-1 overflow-y-auto">
      {loading ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
            <FiRefreshCw
              size={21}
              className="animate-spin"
            />
          </div>

          <p className="mt-4 text-sm font-bold text-[#0F1B3D]">
            Loading subscribers...
          </p>
        </div>
      ) : subscribers.length ===
        0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
            <FiMail size={23} />
          </div>

          <p className="mt-4 text-sm font-bold text-[#0F1B3D]">
            No subscribers found
          </p>

          <p className="mt-1 text-xs text-[#8C97B2]">
            Try another search or filter.
          </p>
        </div>
      ) : (
        subscribers.map(
          (subscriber) => {
            const selected =
              subscriber.id ===
              selectedId;

            return (
              <motion.div
                key={
                  subscriber.id
                }
                whileHover={{
                  x: 2,
                }}
                onClick={() =>
                  onSelect(
                    subscriber,
                  )
                }
                className={`relative cursor-pointer border-b border-[#1E3A8A]/10 p-4 transition-all ${
                  selected
                    ? "bg-[#EAF1FF]/50"
                    : "bg-white hover:bg-[#FAFBFF]"
                }`}
              >
                {selected && (
                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-[#3B82F6] to-[#1E3A8A]" />
                )}

                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold text-white ${
                      selected
                        ? "bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A]"
                        : "bg-gradient-to-br from-[#60A5FA] to-[#2563EB]"
                    }`}
                  >
                    {getInitials(
                      subscriber.email,
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`truncate text-sm ${
                          selected
                            ? "font-bold text-[#0F1B3D]"
                            : "font-semibold text-[#3A4668]"
                        }`}
                      >
                        {
                          subscriber.email
                        }
                      </p>

                      <FiChevronRight
                        size={15}
                        className={`mt-0.5 shrink-0 ${
                          selected
                            ? "text-[#1E3A8A]"
                            : "text-[#C5C8B8]"
                        }`}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-[#8C97B2]">
                        #
                        {
                          subscriber.id
                        }
                      </span>

                      <StatusBadge
                        active={
                          subscriber.is_active
                        }
                      />
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <FiCalendar
                        size={12}
                        className="text-[#1E3A8A]"
                      />

                      <span className="text-[10px] text-[#8C97B2]">
                        {formatDateOnly(
                          subscriber.subscribed_at,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          },
        )
      )}
    </div>

    {/* FOOTER */}
    <div className="border-t border-[#1E3A8A]/10 bg-[#FAFBFF] px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#8C97B2]">
          Showing{" "}
          {subscribers.length}{" "}
          subscriber
          {subscribers.length ===
          1
            ? ""
            : "s"}
        </span>

        <span className="flex items-center gap-1 text-[10px] font-bold text-[#1E3A8A]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#1E3A8A]" />
          Live
        </span>
      </div>
    </div>
  </aside>
);

// =====================================================
// MAIN
// =====================================================

const Subscribers: React.FC =
  () => {
    // ===================================================
    // ✅ PERMISSIONS
    // ===================================================

    const {
      hasPermission,
      hasModuleAccess,
      isSuperAdmin,
      loading:
        permissionsLoading,
    } = usePermissions();

    const canViewSubscribers =
      useMemo(
        () =>
          isSuperAdmin ||
          hasModuleAccess(
            "subscriber",
          ) ||
          hasPermission(
            "subscriber.view",
          ),
        [
          isSuperAdmin,
          hasModuleAccess,
          hasPermission,
        ],
      );

    const canDeleteSubscriber =
      useMemo(
        () =>
          isSuperAdmin ||
          hasPermission(
            "subscriber.delete",
          ),
        [
          isSuperAdmin,
          hasPermission,
        ],
      );

    // ===================================================
    // STATE
    // ===================================================

    const [
      subscribers,
      setSubscribers,
    ] = useState<
      Subscriber[]
    >([]);

    const [loading, setLoading] =
      useState(false);

    const [search, setSearch] =
      useState("");

    const [filter, setFilter] =
      useState<SubscriberFilter>(
        "all",
      );

    const [
      selectedId,
      setSelectedId,
    ] =
      useState<number | null>(
        null,
      );

    const [
      deleteOpen,
      setDeleteOpen,
    ] = useState(false);

    const [
      deleteLoading,
      setDeleteLoading,
    ] = useState(false);

    const [
      selectedDeleteSubscriber,
      setSelectedDeleteSubscriber,
    ] =
      useState<Subscriber | null>(
        null,
      );

    // ===================================================
    // GET SUBSCRIBERS
    // ===================================================

    const fetchSubscribers =
      async () => {
        try {
          setLoading(true);

          const response =
            await subscriberApi.getAll();

          if (
            response.data
              .success
          ) {
            const data =
              response.data
                .data || [];

            setSubscribers(
              data,
            );

            setSelectedId(
              (current) =>
                current ??
                data[0]
                  ?.id ??
                null,
            );
          } else {
            toast.error(
              response.data
                .message ||
                "Unable to fetch subscribers.",
            );
          }
        } catch (error: any) {
          console.error(
            "Fetch subscribers error:",
            error,
          );

          toast.error(
            error?.response
              ?.data?.message ||
              "Unable to fetch subscribers.",
          );
        } finally {
          setLoading(false);
        }
      };

    // ===================================================
    // ✅ FETCH ONLY AFTER PERMISSIONS FINISH
    // ===================================================

    useEffect(() => {
      if (
        permissionsLoading
      ) {
        return;
      }

      if (
        canViewSubscribers
      ) {
        fetchSubscribers();
      }
    }, [
      permissionsLoading,
      canViewSubscribers,
    ]);

    // ===================================================
    // FILTERED LIST
    // ===================================================

    const filteredSubscribers =
      useMemo(() => {
        const query =
          search
            .trim()
            .toLowerCase();

        return subscribers.filter(
          (subscriber) => {
            const matchesSearch =
              !query ||
              [
                subscriber.email,
                subscriber.ip_address,
                String(
                  subscriber.id,
                ),
              ]
                .join(" ")
                .toLowerCase()
                .includes(query);

            if (
              !matchesSearch
            ) {
              return false;
            }

            if (
              filter ===
              "active"
            ) {
              return subscriber.is_active;
            }

            if (
              filter ===
              "inactive"
            ) {
              return !subscriber.is_active;
            }

            return true;
          },
        );
      }, [
        subscribers,
        search,
        filter,
      ]);

    // ===================================================
    // KEEP SELECTION VALID
    // ===================================================

    useEffect(() => {
      if (
        filteredSubscribers.length ===
        0
      ) {
        setSelectedId(
          null,
        );
        return;
      }

      const currentExists =
        filteredSubscribers.some(
          (item) =>
            item.id ===
            selectedId,
        );

      if (!currentExists) {
        setSelectedId(
          filteredSubscribers[0]
            .id,
        );
      }
    }, [
      filteredSubscribers,
      selectedId,
    ]);

    const selectedSubscriber =
      subscribers.find(
        (subscriber) =>
          subscriber.id ===
          selectedId,
      ) ||
      filteredSubscribers[0] ||
      null;

    // ===================================================
    // STATS
    // ===================================================

    const stats = useMemo(() => {
      const total =
        subscribers.length;

      const active =
        subscribers.filter(
          (s) =>
            s.is_active,
        ).length;

      return {
        total,
        active,
      };
    }, [subscribers]);

    // ===================================================
    // DELETE
    // ===================================================

    const openDeleteModal = (
      subscriber: Subscriber,
    ) => {
      setSelectedDeleteSubscriber(
        subscriber,
      );

      setDeleteOpen(
        true,
      );
    };

    const closeDeleteModal =
      () => {
        if (
          deleteLoading
        ) {
          return;
        }

        setDeleteOpen(
          false,
        );

        setSelectedDeleteSubscriber(
          null,
        );
      };

    const handleDelete =
      async () => {
        if (
          !selectedDeleteSubscriber
        ) {
          return;
        }

        try {
          setDeleteLoading(
            true,
          );

          const response =
            await subscriberApi.delete(
              selectedDeleteSubscriber.email,
            );

          if (
            response.data
              .success
          ) {
            const deletedId =
              selectedDeleteSubscriber.id;

            setSubscribers(
              (prev) =>
                prev.filter(
                  (item) =>
                    item.id !==
                    deletedId,
                ),
            );

            if (
              selectedId ===
              deletedId
            ) {
              setSelectedId(
                null,
              );
            }

            toast.success(
              response.data
                .message ||
                "Subscriber deleted successfully.",
            );

            setDeleteOpen(
              false,
            );

            setSelectedDeleteSubscriber(
              null,
            );
          } else {
            toast.error(
              response.data
                .message ||
                "Unable to delete subscriber.",
            );
          }
        } catch (error: any) {
          console.error(
            "Delete subscriber error:",
            error,
          );

          toast.error(
            error?.response
              ?.data?.message ||
              "Unable to delete subscriber.",
          );
        } finally {
          setDeleteLoading(
            false,
          );
        }
      };

    // ===================================================
    // ✅ PERMISSION LOADING
    // ===================================================

    if (
      permissionsLoading
    ) {
      return (
        <PermissionLoading />
      );
    }

    // ===================================================
    // ✅ ACCESS DENIED
    // ===================================================

    if (
      !canViewSubscribers
    ) {
      return (
        <AccessDenied />
      );
    }

    // ===================================================
    // UI
    // ===================================================

    return (
      <>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={
            containerVariants
          }
          className="min-h-screen bg-[#F5F8FF] p-4 font-poppins"
        >
          {/* MASTER DETAIL */}
          <motion.div
            variants={
              itemVariants
            }
            className="flex min-h-[680px] flex-col gap-5 lg:flex-row"
          >
            <SubscriberSidebar
              subscribers={
                filteredSubscribers
              }
              selectedId={
                selectedId
              }
              onSelect={(
                subscriber,
              ) =>
                setSelectedId(
                  subscriber.id,
                )
              }
              filter={filter}
              setFilter={
                setFilter
              }
              search={search}
              setSearch={
                setSearch
              }
              loading={loading}
            />

            {selectedSubscriber ? (
              <SubscriberDetail
                subscriber={
                  selectedSubscriber
                }
                onDelete={
                  openDeleteModal
                }
                canDelete={
                  canDeleteSubscriber
                }
              />
            ) : (
              <section className="flex min-h-[500px] flex-1 items-center justify-center rounded-2xl border border-[#E3E9F5] bg-white shadow-sm">
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
                    <FiMail
                      size={27}
                    />
                  </div>

                  <h3 className="mt-4 text-base font-bold text-[#0F1B3D]">
                    No subscriber
                    selected
                  </h3>

                  <p className="mt-1 text-xs text-[#8C97B2]">
                    Select a subscriber
                    from the list to view
                    details.
                  </p>
                </div>
              </section>
            )}
          </motion.div>
        </motion.div>

        {/* DELETE MODAL — permission based */}
        {canDeleteSubscriber && (
          <DeleteSubscriberModal
            open={deleteOpen}
            loading={
              deleteLoading
            }
            email={
              selectedDeleteSubscriber?.email ||
              ""
            }
            onClose={
              closeDeleteModal
            }
            onConfirm={
              handleDelete
            }
          />
        )}
      </>
    );
  };

export default Subscribers;