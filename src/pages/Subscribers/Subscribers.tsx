import React, { useEffect, useMemo, useState } from "react";

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
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

import GlobalModal from "@/components/common/GlobalModal";

import subscriberApi, { Subscriber } from "../../api/endpoints/subscribers";

// =====================================================
// TYPES
// =====================================================

type SubscriberFilter = "all" | "active" | "inactive";

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
    transition: { type: "spring", stiffness: 100, damping: 14 },
  },
};

// =====================================================
// HELPERS
// =====================================================

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getInitials = (email: string) => {
  const name = email?.split("@")[0]?.trim() || "U";
  const cleanName = name.replace(/[^a-zA-Z]/g, "");
  return cleanName.slice(0, 2).toUpperCase() || "U";
};

// =====================================================
// STATUS BADGE
// =====================================================

const StatusBadge: React.FC<{ active: boolean }> = ({ active }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${
      active
        ? "border-[#163F20]/25 bg-[#EAF3EA] text-[#163F20]"
        : "border-[#D8E2D8] bg-[#F3F6F3] text-[#59645C]"
    }`}
  >
    <span
      className={`h-1.5 w-1.5 rounded-full ${
        active ? "bg-[#163F20]" : "bg-[#89918B]"
      }`}
    />
    {active ? "Active" : "Inactive"}
  </span>
);

// =====================================================
// DELETE MODAL
// =====================================================

interface DeleteModalProps {
  open: boolean;
  loading: boolean;
  email: string;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteSubscriberModal: React.FC<DeleteModalProps> = ({
  open,
  loading,
  email,
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <GlobalModal isOpen={open} onClose={onClose} closeOnOverlayClick={!loading}>
      <div className="w-full max-w-[470px] overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-[#4C8A57] via-[#163F20] to-[#0F3219]" />

        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FBEAEA] text-[#C23B32]">
              <FiTrash2 size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#202721]">
                Delete Subscriber
              </h2>

              <p className="mt-1 text-sm leading-6 text-[#89918B]">
                This subscriber will be permanently removed from the subscriber
                list.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-[#E5EAE5] bg-[#F5F7F5] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
              Subscriber Email
            </p>

            <p className="mt-1 break-all text-sm font-semibold text-[#202721]">
              {email}
            </p>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-[#163F20]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#59645C] transition hover:bg-[#F5F7F5] disabled:opacity-50"
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
                <FiRefreshCw size={15} className="animate-spin" />
              ) : (
                <FiTrash2 size={15} />
              )}
              {loading ? "Deleting..." : "Delete Subscriber"}
            </button>
          </div>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// INFO CARD
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

const InfoCard: React.FC<InfoCardProps> = ({
  label,
  value,
  icon,
  customValue,
  copyable,
  onCopy,
  mono,
}) => (
  <div className="rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] p-4">
    <div className="mb-2 flex items-center gap-2 text-[#163F20]">
      {icon}
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
        {label}
      </p>
    </div>

    {customValue ? (
      customValue
    ) : (
      <div className="flex items-center justify-between gap-2">
        <p
          className={`min-w-0 truncate text-sm font-bold text-[#202721] ${
            mono ? "font-mono" : ""
          }`}
          title={value}
        >
          {value}
        </p>

        {copyable && onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#163F20]/15 bg-white text-[#163F20] transition hover:bg-[#163F20] hover:text-white"
            title="Copy"
          >
            <FiCopy size={12} />
          </button>
        )}
      </div>
    )}
  </div>
);

// =====================================================
// DETAIL ROW
// =====================================================

const DetailRow: React.FC<{
  label: string;
  value: string;
}> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 border-b border-[#163F20]/10 pb-3 last:border-0 last:pb-0">
    <span className="text-xs text-[#9AA29C]">{label}</span>

    <span className="text-right text-xs font-bold text-[#3F4A41]">{value}</span>
  </div>
);

// =====================================================
// TIMELINE ITEM
// =====================================================

const TimelineItem: React.FC<{
  icon: React.ReactNode;
  title: string;
  date: string;
  description: string;
  active?: boolean;
}> = ({ icon, title, date, description, active }) => (
  <div className="flex gap-3">
    <div className="flex flex-col items-center">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full ${
          active
            ? "bg-[#163F20] text-white shadow-[0_4px_10px_-4px_rgba(22,63,32,0.5)]"
            : "bg-[#EAF3EA] text-[#59645C]"
        }`}
      >
        {icon}
      </div>

      <div className="mt-1 h-full w-px bg-[#163F20]/10" />
    </div>

    <div className="pb-4">
      <p className="text-sm font-bold text-[#202721]">{title}</p>
      <p className="mt-0.5 text-xs font-semibold text-[#4C8A57]">{date}</p>
      <p className="mt-1 text-xs leading-5 text-[#9AA29C]">{description}</p>
    </div>
  </div>
);

// =====================================================
// SUBSCRIBER DETAIL
// =====================================================

interface SubscriberDetailProps {
  subscriber: Subscriber;
  onDelete: (subscriber: Subscriber) => void;
}

const SubscriberDetail: React.FC<SubscriberDetailProps> = ({
  subscriber,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(subscriber.email);
      setCopied(true);
      toast.success("Email copied successfully.");

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      toast.error("Unable to copy email.");
    }
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white shadow-sm">
      {/* HEADER */}
      <div className="relative border-b border-[#163F20]/10 bg-white p-5 sm:p-6">
        <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-[#4C8A57] via-[#163F20] to-[#0F3219]" />

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] text-sm font-bold text-white shadow-[0_10px_22px_-10px_rgba(22,63,32,0.5)]">
              {getInitials(subscriber.email)}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-bold text-[#202721] sm:text-xl">
                  {subscriber.email}
                </h2>

                <StatusBadge active={subscriber.is_active} />
              </div>

              <p className="mt-1 text-xs text-[#9AA29C]">
                Subscriber #{subscriber.id}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-2 rounded-xl border border-[#163F20]/20 bg-[#EAF3EA] px-4 py-2.5 text-xs font-bold text-[#163F20] transition hover:border-[#163F20]/35 hover:bg-[#D5E5D6]"
            >
              {copied ? <FiCheck size={15} /> : <FiCopy size={15} />}
              {copied ? "Copied" : "Copy Email"}
            </button>

            <button
              type="button"
              onClick={() => onDelete(subscriber)}
              className="flex items-center gap-2 rounded-xl border border-[#C23B32]/25 bg-[#FBEAEA] px-4 py-2.5 text-xs font-bold text-[#C23B32] transition hover:border-transparent hover:bg-[#C23B32] hover:text-white"
            >
              <FiTrash2 size={15} />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto bg-[#F5F7F5] p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          {/* MAIN */}
          <div className="space-y-5 xl:col-span-2">
            {/* OVERVIEW */}
            <div className="relative overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white p-5 shadow-sm sm:p-6">
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#8FC199] to-[#163F20]" />

              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#202721]">
                    Subscriber Overview
                  </h3>

                  <p className="mt-1 text-xs text-[#9AA29C]">
                    Subscription and account information
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                  <FiMail size={17} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoCard
                  label="Email Address"
                  value={subscriber.email}
                  icon={<FiMail size={15} />}
                  copyable
                  onCopy={handleCopy}
                />

                <InfoCard
                  label="Subscription Status"
                  value={
                    subscriber.is_active
                      ? "Active Subscriber"
                      : "Inactive Subscriber"
                  }
                  icon={<FiActivity size={15} />}
                  customValue={<StatusBadge active={subscriber.is_active} />}
                />

                <InfoCard
                  label="Subscriber ID"
                  value={`#${subscriber.id}`}
                  icon={<FiHash size={15} />}
                />

                <InfoCard
                  label="IP Address"
                  value={subscriber.ip_address}
                  icon={<FiGlobe size={15} />}
                  mono
                />
              </div>
            </div>

            {/* TIMELINE */}
            <div className="relative overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white p-5 shadow-sm sm:p-6">
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#4C8A57] to-[#0F3219]" />

              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                  <FiCalendar size={17} />
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#202721]">
                    Subscription Timeline
                  </h3>

                  <p className="mt-1 text-xs text-[#9AA29C]">
                    Important subscriber activity dates
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <TimelineItem
                  icon={<FiCheck size={14} />}
                  title="Subscribed"
                  date={formatDate(subscriber.subscribed_at)}
                  description="Subscriber joined the newsletter."
                  active
                />

                <TimelineItem
                  icon={<FiClock size={14} />}
                  title="Created"
                  date={formatDate(subscriber.created_at)}
                  description="Subscriber record was created."
                  active
                />

                <TimelineItem
                  icon={<FiActivity size={14} />}
                  title="Last Updated"
                  date={formatDate(subscriber.updated_at)}
                  description="Subscriber record was last updated."
                  active
                />
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-5">
            {/* STATUS */}
            <div className="relative overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white p-5 shadow-sm">
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#8FC199] to-[#163F20]" />

              <h4 className="mb-4 border-b border-[#163F20]/10 pb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
                Current Status
              </h4>

              <div className="rounded-2xl bg-[#F5F7F5] p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      subscriber.is_active
                        ? "bg-[#EAF3EA] text-[#163F20]"
                        : "bg-[#F3F6F3] text-[#59645C]"
                    }`}
                  >
                    {subscriber.is_active ? (
                      <FiUserCheck size={19} />
                    ) : (
                      <FiUserX size={19} />
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                      Newsletter Access
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#202721]">
                      {subscriber.is_active ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* DETAILS */}
            <div className="relative overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white p-5 shadow-sm">
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#4C8A57] to-[#0F3219]" />

              <h4 className="mb-4 border-b border-[#163F20]/10 pb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
                Record Details
              </h4>

              <div className="space-y-3">
                <DetailRow label="Subscriber ID" value={`#${subscriber.id}`} />
                <DetailRow
                  label="Subscribed Date"
                  value={formatDateOnly(subscriber.subscribed_at)}
                />
                <DetailRow
                  label="Subscribed Time"
                  value={formatTime(subscriber.subscribed_at)}
                />
                <DetailRow
                  label="Created At"
                  value={formatDateOnly(subscriber.created_at)}
                />
                <DetailRow
                  label="Updated At"
                  value={formatDateOnly(subscriber.updated_at)}
                />
              </div>
            </div>

            {/* PRIVACY */}
            <div className="relative overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                  <FiShield size={17} />
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#202721]">
                    Subscriber Information
                  </h4>

                  <p className="mt-1 text-xs leading-5 text-[#9AA29C]">
                    The subscriber's email and subscription details are stored
                    for newsletter communication and management.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="border-t border-[#163F20]/10 bg-white px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="h-2 w-2 rounded-full bg-[#163F20]" />

            <span className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
              Subscriber #{subscriber.id}
            </span>
          </div>

          <span className="text-[10px] text-[#9AA29C]">
            Last updated {formatDate(subscriber.updated_at)}
          </span>
        </div>
      </div>
    </section>
  );
};

// =====================================================
// SUBSCRIBER LIST SIDEBAR
// =====================================================

interface SubscriberSidebarProps {
  subscribers: Subscriber[];
  selectedId: number | null;
  onSelect: (subscriber: Subscriber) => void;
  filter: SubscriberFilter;
  setFilter: (filter: SubscriberFilter) => void;
  search: string;
  setSearch: (value: string) => void;
  loading: boolean;
}

const SubscriberSidebar: React.FC<SubscriberSidebarProps> = ({
  subscribers,
  selectedId,
  onSelect,
  filter,
  setFilter,
  search,
  setSearch,
  loading,
}) => (
  <aside className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white shadow-sm lg:w-[380px] xl:w-[410px]">
    {/* HEADER */}
    <div className="relative border-b border-[#163F20]/10 p-4 sm:p-5">
      <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-[#4C8A57] via-[#163F20] to-[#0F3219]" />

      {/* TITLE */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-[#202721]">
            Subscribers
            <span className="inline-flex items-center justify-center rounded-full bg-[#EAF3EA] px-2.5 py-0.5 text-xs font-semibold text-[#163F20]">
              {subscribers.length}
            </span>
          </h3>

          <p className="mt-1 text-xs text-[#9AA29C]">
            Manage newsletter subscribers
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
          <FiUsers size={17} />
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {[
          { key: "all" as SubscriberFilter, label: "All" },
          { key: "active" as SubscriberFilter, label: "Active" },
          { key: "inactive" as SubscriberFilter, label: "Inactive" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-wide transition ${
              filter === item.key
                ? "bg-gradient-to-r from-[#4C8A57] to-[#163F20] text-white shadow-[0_6px_14px_-6px_rgba(22,63,32,0.5)]"
                : "border border-[#163F20]/15 bg-[#F5F7F5] text-[#59645C] hover:border-[#163F20]/30 hover:bg-[#EAF3EA] hover:text-[#163F20]"
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
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#163F20]"
        />

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subscriber email..."
          className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] pl-10 pr-3 text-xs text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#163F20] focus:bg-white focus:ring-2 focus:ring-[#163F20]/15"
        />

        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA29C] hover:text-[#163F20]"
          >
            <FiX size={15} />
          </button>
        )}
      </div>
    </div>

    {/* LIST HEADER */}
    <div className="border-b border-[#163F20]/10 bg-[#FAFBFA] px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#9AA29C]">
          Subscriber List
        </span>

        <span className="rounded-full bg-[#EAF3EA] px-2.5 py-1 text-[10px] font-bold text-[#163F20]">
          {subscribers.length}
        </span>
      </div>
    </div>

    {/* LIST */}
    <div className="flex-1 overflow-y-auto">
      {loading ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#163F20]">
            <FiRefreshCw size={21} className="animate-spin" />
          </div>

          <p className="mt-4 text-sm font-bold text-[#202721]">
            Loading subscribers...
          </p>
        </div>
      ) : subscribers.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#163F20]">
            <FiMail size={23} />
          </div>

          <p className="mt-4 text-sm font-bold text-[#202721]">
            No subscribers found
          </p>

          <p className="mt-1 text-xs text-[#9AA29C]">
            Try another search or filter.
          </p>
        </div>
      ) : (
        subscribers.map((subscriber) => {
          const selected = subscriber.id === selectedId;

          return (
            <motion.div
              key={subscriber.id}
              whileHover={{ x: 2 }}
              onClick={() => onSelect(subscriber)}
              className={`relative cursor-pointer border-b border-[#163F20]/10 p-4 transition-all ${
                selected ? "bg-[#EAF3EA]/50" : "bg-white hover:bg-[#FAFBFA]"
              }`}
            >
              {selected && (
                <div className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-[#4C8A57] to-[#0F3219]" />
              )}

              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold text-white ${
                    selected
                      ? "bg-gradient-to-br from-[#4C8A57] to-[#163F20]"
                      : "bg-gradient-to-br from-[#8FC199] to-[#4C8A57]"
                  }`}
                >
                  {getInitials(subscriber.email)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`truncate text-sm ${
                        selected
                          ? "font-bold text-[#202721]"
                          : "font-semibold text-[#3F4A41]"
                      }`}
                    >
                      {subscriber.email}
                    </p>

                    <FiChevronRight
                      size={15}
                      className={`mt-0.5 shrink-0 ${
                        selected ? "text-[#163F20]" : "text-[#C5BBA8]"
                      }`}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-[#9AA29C]">
                      #{subscriber.id}
                    </span>

                    <StatusBadge active={subscriber.is_active} />
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <FiCalendar size={12} className="text-[#163F20]" />

                    <span className="text-[10px] text-[#9AA29C]">
                      {formatDateOnly(subscriber.subscribed_at)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })
      )}
    </div>

    {/* FOOTER */}
    <div className="border-t border-[#163F20]/10 bg-[#FAFBFA] px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#9AA29C]">
          Showing {subscribers.length} subscriber
          {subscribers.length === 1 ? "" : "s"}
        </span>

        <span className="flex items-center gap-1 text-[10px] font-bold text-[#163F20]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#163F20]" />
          Live
        </span>
      </div>
    </div>
  </aside>
);

// =====================================================
// MAIN
// =====================================================

const Subscribers: React.FC = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<SubscriberFilter>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedDeleteSubscriber, setSelectedDeleteSubscriber] =
    useState<Subscriber | null>(null);

  // ===================================================
  // GET SUBSCRIBERS
  // ===================================================

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const response = await subscriberApi.getAll();

      if (response.data.success) {
        const data = response.data.data || [];
        setSubscribers(data);
        setSelectedId((current) => current ?? data[0]?.id ?? null);
      } else {
        toast.error(response.data.message || "Unable to fetch subscribers.");
      }
    } catch (error: any) {
      console.error("Fetch subscribers error:", error);
      toast.error(
        error?.response?.data?.message || "Unable to fetch subscribers.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  // ===================================================
  // FILTERED LIST
  // ===================================================

  const filteredSubscribers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return subscribers.filter((subscriber) => {
      const matchesSearch =
        !query ||
        [subscriber.email, subscriber.ip_address, String(subscriber.id)]
          .join(" ")
          .toLowerCase()
          .includes(query);

      if (!matchesSearch) return false;
      if (filter === "active") return subscriber.is_active;
      if (filter === "inactive") return !subscriber.is_active;

      return true;
    });
  }, [subscribers, search, filter]);

  // ===================================================
  // KEEP SELECTION VALID
  // ===================================================

  useEffect(() => {
    if (filteredSubscribers.length === 0) {
      setSelectedId(null);
      return;
    }

    const currentExists = filteredSubscribers.some(
      (item) => item.id === selectedId,
    );

    if (!currentExists) {
      setSelectedId(filteredSubscribers[0].id);
    }
  }, [filteredSubscribers, selectedId]);

  const selectedSubscriber =
    subscribers.find((subscriber) => subscriber.id === selectedId) ||
    filteredSubscribers[0] ||
    null;

  // ===================================================
  // STATS
  // ===================================================

  const stats = useMemo(() => {
    const total = subscribers.length;
    const active = subscribers.filter((s) => s.is_active).length;

    return { total, active };
  }, [subscribers]);

  // ===================================================
  // DELETE
  // ===================================================

  const openDeleteModal = (subscriber: Subscriber) => {
    setSelectedDeleteSubscriber(subscriber);
    setDeleteOpen(true);
  };

  const closeDeleteModal = () => {
    if (deleteLoading) return;
    setDeleteOpen(false);
    setSelectedDeleteSubscriber(null);
  };

  const handleDelete = async () => {
    if (!selectedDeleteSubscriber) return;

    try {
      setDeleteLoading(true);

      const response = await subscriberApi.delete(
        selectedDeleteSubscriber.email,
      );

      if (response.data.success) {
        const deletedId = selectedDeleteSubscriber.id;

        setSubscribers((prev) => prev.filter((item) => item.id !== deletedId));

        if (selectedId === deletedId) {
          setSelectedId(null);
        }

        toast.success(
          response.data.message || "Subscriber deleted successfully.",
        );

        setDeleteOpen(false);
        setSelectedDeleteSubscriber(null);
      } else {
        toast.error(response.data.message || "Unable to delete subscriber.");
      }
    } catch (error: any) {
      console.error("Delete subscriber error:", error);
      toast.error(
        error?.response?.data?.message || "Unable to delete subscriber.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // ===================================================
  // UI
  // ===================================================

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="min-h-screen bg-[#F5F7F5] p-4"
      >
        {/* MASTER DETAIL */}
        <motion.div
          variants={itemVariants}
          className="flex min-h-[680px] flex-col gap-5 lg:flex-row"
        >
          <SubscriberSidebar
            subscribers={filteredSubscribers}
            selectedId={selectedId}
            onSelect={(subscriber) => setSelectedId(subscriber.id)}
            filter={filter}
            setFilter={setFilter}
            search={search}
            setSearch={setSearch}
            loading={loading}
          />

          {selectedSubscriber ? (
            <SubscriberDetail
              subscriber={selectedSubscriber}
              onDelete={openDeleteModal}
            />
          ) : (
            <section className="flex min-h-[500px] flex-1 items-center justify-center rounded-2xl border border-[#E5EAE5] bg-white shadow-sm">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#163F20]">
                  <FiMail size={27} />
                </div>

                <h3 className="mt-4 text-base font-bold text-[#202721]">
                  No subscriber selected
                </h3>

                <p className="mt-1 text-xs text-[#9AA29C]">
                  Select a subscriber from the list to view details.
                </p>
              </div>
            </section>
          )}
        </motion.div>
      </motion.div>

      {/* DELETE MODAL */}
      <DeleteSubscriberModal
        open={deleteOpen}
        loading={deleteLoading}
        email={selectedDeleteSubscriber?.email || ""}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default Subscribers;
