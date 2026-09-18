import React, { useEffect, useMemo, useState } from "react";

import {
  FiSearch,
  FiRefreshCw,
  FiMail,
  FiPhone,
  FiTrash2,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiX,
  FiUser,
  FiChevronRight,
  FiSquare,
  FiCheckSquare,
  FiMessageSquare,
  FiSend,
  FiInbox,
  FiAlertTriangle,
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

import GlobalModal from "@/components/common/GlobalModal";

import contactApi, { Contact } from "../../api/endpoints/contact";

// =====================================================
// TYPES
// =====================================================

type ContactFilter = "all" | "unread" | "read";

type ContactWithAccountType = Contact & {
  account_type?: string | null;
};

// =====================================================
// ANIMATIONS
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

const getInitials = (name?: string | null) => {
  if (!name?.trim()) return "U";

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return (parts[0][0] + parts[1][0]).toUpperCase();
};

// =====================================================
// ACCOUNT TYPE HELPERS
// =====================================================

const getAccountType = (contact: Contact): "customer" | "distributor" => {
  const accountType = String(
    (contact as ContactWithAccountType).account_type || "",
  )
    .trim()
    .toLowerCase();

  return accountType === "distributor" ? "distributor" : "customer";
};

const getAccountTypeLabel = (contact: Contact) => {
  return getAccountType(contact) === "distributor"
    ? "Distributor"
    : "Customer";
};

const getAccountTypeLowerLabel = (contact: Contact) => {
  return getAccountType(contact) === "distributor"
    ? "distributor"
    : "customer";
};

const getEnquiryLabel = (contact: Contact) => {
  return `${getAccountTypeLabel(contact)} enquiry`;
};

const getContactDescription = (contact: Contact) => {
  return `Details submitted by the ${getAccountTypeLowerLabel(contact)}`;
};

const getCallLabel = (contact: Contact) => {
  return `Call ${getAccountTypeLabel(contact)}`;
};

// =====================================================
// STATUS BADGE
// =====================================================

const ReadStatusBadge: React.FC<{ isRead: boolean }> = ({ isRead }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${
      isRead
        ? "border-[#D8E2D8] bg-[#F3F6F3] text-[#59645C]"
        : "border-[#163F20]/25 bg-[#EAF3EA] text-[#163F20]"
    }`}
  >
    <span
      className={`h-1.5 w-1.5 rounded-full ${
        isRead ? "bg-[#89918B]" : "bg-[#163F20]"
      }`}
    />

    {isRead ? "Read" : "Unread"}
  </span>
);

// =====================================================
// STAT CARD
// =====================================================

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
}) => (
  <motion.div
    variants={itemVariants}
    whileHover={{
      y: -3,
      boxShadow: "0 14px 30px -18px rgba(22,63,32,0.28)",
    }}
    className="relative min-h-[130px] overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white p-5 shadow-sm"
  >
    <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-[#4C8A57] via-[#163F20] to-[#0F3219]" />

    <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full border border-[#163F20]/10" />

    <div className="relative flex items-start justify-between gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
          {title}
        </p>

        <p className="mt-2 text-3xl font-bold text-[#202721]">
          {value.toLocaleString("en-IN")}
        </p>

        <p className="mt-1 text-xs text-[#89918B]">{subtitle}</p>
      </div>

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
        {icon}
      </div>
    </div>
  </motion.div>
);

// =====================================================
// DELETE CONFIRMATION
// =====================================================

interface DeleteModalProps {
  open: boolean;
  loading: boolean;
  count: number;
  name?: string;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteContactModal: React.FC<DeleteModalProps> = ({
  open,
  loading,
  count,
  name,
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  const isBulk = count > 1;

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={!loading}
    >
      <div className="w-full max-w-[470px] overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-[#4C8A57] to-[#0F3219]" />

        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FBEAEA] text-[#C23B32]">
              <FiAlertTriangle size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#202721]">
                {isBulk ? "Delete Contacts" : "Delete Contact"}
              </h2>

              <p className="mt-1 text-sm leading-6 text-[#89918B]">
                {isBulk
                  ? `Are you sure you want to delete ${count} selected contacts? This action cannot be undone.`
                  : "Are you sure you want to permanently delete this contact? This action cannot be undone."}
              </p>
            </div>
          </div>

          {!isBulk && name && (
            <div className="mt-5 rounded-xl border border-[#E5EAE5] bg-[#F5F7F5] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                Selected Contact
              </p>

              <p className="mt-1 text-sm font-semibold text-[#202721]">
                {name}
              </p>
            </div>
          )}

          {isBulk && (
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-[#E5EAE5] bg-[#F5F7F5] p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF3EA] text-[#163F20]">
                <FiTrash2 size={16} />
              </div>

              <div>
                <p className="text-xs font-bold text-[#202721]">
                  {count} contacts selected
                </p>

                <p className="mt-0.5 text-[11px] text-[#9AA29C]">
                  All selected records will be removed.
                </p>
              </div>
            </div>
          )}

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
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C23B32] to-[#A62F27] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(194,59,50,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-8px_rgba(194,59,50,0.7)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <FiRefreshCw size={15} className="animate-spin" />
              ) : (
                <FiTrash2 size={15} />
              )}

              {loading
                ? "Deleting..."
                : isBulk
                  ? "Delete Selected"
                  : "Delete Contact"}
            </button>
          </div>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// CONTACT SIDEBAR
// =====================================================

interface ContactSidebarProps {
  contacts: Contact[];
  selectedId: number | null;
  selectedIds: number[];
  search: string;
  filter: ContactFilter;
  loading: boolean;
  onSelect: (contact: Contact) => void;
  onToggleSelect: (id: number) => void;
  onToggleAll: () => void;
  onSearch: (value: string) => void;
  onFilter: (filter: ContactFilter) => void;
}

const ContactSidebar: React.FC<ContactSidebarProps> = ({
  contacts,
  selectedId,
  selectedIds,
  search,
  filter,
  loading,
  onSelect,
  onToggleSelect,
  onToggleAll,
  onSearch,
  onFilter,
}) => {
  const allSelected =
    contacts.length > 0 &&
    contacts.every((contact) => selectedIds.includes(contact.id));

  return (
    <aside className="flex h-[680px] w-full flex-col overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white shadow-sm lg:h-[720px] lg:w-[390px] xl:w-[410px]">
      {/* HEADER */}
      <div className="relative border-b border-[#163F20]/10 p-4 sm:p-5">
        <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-[#4C8A57] via-[#163F20] to-[#0F3219]" />

        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold text-[#202721]">
              Contact Messages

              <span className="inline-flex items-center justify-center rounded-full bg-[#EAF3EA] px-2.5 py-0.5 text-xs font-semibold text-[#163F20]">
                {contacts.length}
              </span>
            </h3>

            <p className="mt-1 text-xs text-[#9AA29C]">
              Review customer & distributor enquiries
            </p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
            <FiMessageSquare size={17} />
          </div>
        </div>

        {/* FILTERS */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {[
            { key: "all" as ContactFilter, label: "All" },
            { key: "unread" as ContactFilter, label: "Unread" },
            { key: "read" as ContactFilter, label: "Read" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onFilter(item.key)}
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
        <div className="relative">
          <FiSearch
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#163F20]"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search name, email or phone..."
            className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] pl-10 pr-3 text-xs text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#163F20] focus:bg-white focus:ring-2 focus:ring-[#163F20]/15"
          />

          {search && (
            <button
              type="button"
              onClick={() => onSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA29C] hover:text-[#163F20]"
            >
              <FiX size={15} />
            </button>
          )}
        </div>
      </div>

      {/* BULK TOOLBAR */}
      <div className="border-b border-[#163F20]/10 bg-[#FAFBFA] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onToggleAll}
            disabled={contacts.length === 0}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-[#163F20] transition hover:text-[#0F3219] disabled:opacity-40"
          >
            {allSelected ? (
              <FiCheckSquare size={15} />
            ) : (
              <FiSquare size={15} />
            )}

            {allSelected ? "Deselect All" : "Select All"}
          </button>

          <span className="rounded-full bg-[#EAF3EA] px-2.5 py-1 text-[10px] font-bold text-[#163F20]">
            {selectedIds.length > 0
              ? `${selectedIds.length} selected`
              : `${contacts.length} messages`}
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
              Loading contacts...
            </p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#163F20]">
              <FiInbox size={24} />
            </div>

            <p className="mt-4 text-sm font-bold text-[#202721]">
              No contacts found
            </p>

            <p className="mt-1 text-xs text-[#9AA29C]">
              Try another search or filter.
            </p>
          </div>
        ) : (
          contacts.map((contact) => {
            const selected = contact.id === selectedId;
            const checked = selectedIds.includes(contact.id);

            return (
              <motion.div
                key={contact.id}
                whileHover={{ x: 2 }}
                onClick={() => onSelect(contact)}
                className={`relative cursor-pointer border-b border-[#163F20]/10 p-4 transition-all ${
                  selected ? "bg-[#EAF3EA]/50" : "bg-white hover:bg-[#FAFBFA]"
                }`}
              >
                {selected && (
                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-[#4C8A57] to-[#0F3219]" />
                )}

                <div className="flex items-start gap-3">
                  {/* CHECKBOX */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelect(contact.id);
                    }}
                    className="mt-1 shrink-0 text-[#9AA29C] transition hover:text-[#163F20]"
                    title={checked ? "Deselect" : "Select"}
                  >
                    {checked ? (
                      <FiCheckSquare
                        size={17}
                        className="text-[#163F20]"
                      />
                    ) : (
                      <FiSquare size={17} />
                    )}
                  </button>

                  {/* AVATAR */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold text-white ${
                      contact.is_read
                        ? "bg-gradient-to-br from-[#A7B0A9] to-[#7A847D]"
                        : "bg-gradient-to-br from-[#4C8A57] to-[#163F20]"
                    }`}
                  >
                    {getInitials(contact.name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className={`truncate text-sm ${
                          !contact.is_read
                            ? "font-bold text-[#202721]"
                            : "font-semibold text-[#3F4A41]"
                        }`}
                      >
                        {contact.name || "Unknown User"}
                      </h4>

                      <FiChevronRight
                        size={15}
                        className={`mt-0.5 shrink-0 ${
                          selected ? "text-[#163F20]" : "text-[#C5BBA8]"
                        }`}
                      />
                    </div>

                    <p className="mt-0.5 truncate text-[10px] text-[#89918B]">
                      {contact.email}
                    </p>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-[#9AA29C]">
                        {formatDateOnly(contact.created_at)}
                      </span>

                      <ReadStatusBadge isRead={contact.is_read} />
                    </div>

                    <p
                      className={`mt-2 line-clamp-2 text-xs leading-5 ${
                        !contact.is_read
                          ? "font-medium text-[#3F4A41]"
                          : "text-[#89918B]"
                      }`}
                    >
                      {contact.message}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </aside>
  );
};

// =====================================================
// DETAIL INFO BOX
// =====================================================

const DetailBox: React.FC<{
  label: string;
  value: string;
  icon: React.ReactNode;
}> = ({ label, value, icon }) => (
  <div className="rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] p-4">
    <div className="mb-2 flex items-center gap-2">
      <span className="text-[#163F20]">{icon}</span>

      <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
        {label}
      </p>
    </div>

    <p className="break-words text-sm font-bold text-[#202721]">
      {value || "—"}
    </p>
  </div>
);

// =====================================================
// DETAIL PANE
// =====================================================

interface ContactDetailProps {
  contact: Contact;
  onDelete: (contact: Contact) => void;
  onMarkRead: (contact: Contact) => void;
  markReadLoading: boolean;
}

const ContactDetailPane: React.FC<ContactDetailProps> = ({
  contact,
  onDelete,
  onMarkRead,
  markReadLoading,
}) => {
  const accountTypeLabel = getAccountTypeLabel(contact);
  const enquiryLabel = getEnquiryLabel(contact);
  const contactDescription = getContactDescription(contact);
  const callLabel = getCallLabel(contact);

  return (
    <section className="flex min-h-[680px] flex-1 flex-col overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white shadow-sm lg:min-h-[720px]">
      {/* HEADER */}
      <div className="relative border-b border-[#163F20]/10 bg-white p-5 sm:p-6">
        <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-[#4C8A57] via-[#163F20] to-[#0F3219]" />

        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] text-sm font-bold text-white shadow-[0_10px_22px_-10px_rgba(22,63,32,0.5)]">
              {getInitials(contact.name)}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-bold text-[#202721] sm:text-xl">
                  {contact.name || "Unknown User"}
                </h2>

                <ReadStatusBadge isRead={contact.is_read} />
              </div>

              <p className="mt-1 truncate text-xs text-[#9AA29C]">
                {contact.email}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!contact.is_read && (
              <button
                type="button"
                onClick={() => onMarkRead(contact)}
                disabled={markReadLoading}
                className="flex items-center gap-2 rounded-xl border border-[#163F20]/20 bg-[#EAF3EA] px-4 py-2.5 text-xs font-bold text-[#163F20] transition hover:border-[#163F20]/35 hover:bg-[#D5E5D6] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {markReadLoading ? (
                  <FiRefreshCw size={15} className="animate-spin" />
                ) : (
                  <FiCheckCircle size={15} />
                )}

                {markReadLoading ? "Marking..." : "Mark as Read"}
              </button>
            )}

            <button
              type="button"
              onClick={() => onDelete(contact)}
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
          {/* LEFT MAIN */}
          <div className="space-y-5 xl:col-span-2">
            {/* MESSAGE */}
            <div className="relative overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white p-5 shadow-sm sm:p-6">
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#8FC199] to-[#163F20]" />

              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                    <FiMessageSquare size={18} />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#202721]">
                      Message
                    </h3>

                    <p className="mt-1 text-xs text-[#9AA29C]">
                      {enquiryLabel}
                    </p>
                  </div>
                </div>

                <ReadStatusBadge isRead={contact.is_read} />
              </div>

              <div className="rounded-xl border border-[#163F20]/10 bg-[#FAFBFA] p-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-[#3F4A41]">
                  {contact.message || "No message provided."}
                </p>
              </div>
            </div>

            {/* CONTACT INFORMATION */}
            <div className="relative overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white p-5 shadow-sm sm:p-6">
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#4C8A57] to-[#0F3219]" />

              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                  <FiUser size={17} />
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#202721]">
                    Contact Information
                  </h3>

                  <p className="mt-1 text-xs text-[#9AA29C]">
                    {contactDescription}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailBox
                  label="Full Name"
                  value={contact.name || "Unknown User"}
                  icon={<FiUser size={15} />}
                />

                <DetailBox
                  label="Email Address"
                  value={contact.email}
                  icon={<FiMail size={15} />}
                />

                <DetailBox
                  label="Phone Number"
                  value={contact.phone || "Not provided"}
                  icon={<FiPhone size={15} />}
                />

                <DetailBox
                  label="Account Type"
                  value={accountTypeLabel}
                  icon={<FiUser size={15} />}
                />
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-5">
            {/* STATUS */}
            <div className="relative overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white p-5 shadow-sm">
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#8FC199] to-[#163F20]" />

              <h4 className="mb-4 border-b border-[#163F20]/10 pb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
                Message Status
              </h4>

              <div className="rounded-xl bg-[#F5F7F5] p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      contact.is_read
                        ? "bg-[#F3F6F3] text-[#59645C]"
                        : "bg-[#EAF3EA] text-[#163F20]"
                    }`}
                  >
                    {contact.is_read ? (
                      <FiCheckCircle size={19} />
                    ) : (
                      <FiClock size={19} />
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                      Current Status
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#202721]">
                      {contact.is_read ? "Read" : "Unread"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* TIMING */}
            <div className="relative overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white p-5 shadow-sm">
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#4C8A57] to-[#0F3219]" />

              <h4 className="mb-4 border-b border-[#163F20]/10 pb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
                Message Timeline
              </h4>

              <div className="space-y-4">
                <TimelineRow
                  icon={<FiSend size={13} />}
                  title="Message Received"
                  value={formatDate(contact.created_at)}
                />

                <TimelineRow
                  icon={<FiClock size={13} />}
                  title="Received Time"
                  value={formatTime(contact.created_at)}
                />

                <TimelineRow
                  icon={<FiCheck size={13} />}
                  title="Last Updated"
                  value={formatDate(contact.updated_at)}
                />

                {contact.read_at && (
                  <TimelineRow
                    icon={<FiCheck size={13} />}
                    title="Read At"
                    value={formatDate(contact.read_at)}
                  />
                )}
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="relative overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white p-5 shadow-sm">
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#8FC199] to-[#163F20]" />

              <h4 className="mb-4 border-b border-[#163F20]/10 pb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
                Quick Actions
              </h4>

              <div className="space-y-2">
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-3 rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] px-4 py-3 text-xs font-bold text-[#3F4A41] transition hover:border-[#163F20]/25 hover:bg-[#EAF3EA]"
                >
                  <FiMail size={16} className="text-[#163F20]" />

                  Send Email

                  <FiChevronRight
                    size={15}
                    className="ml-auto text-[#9AA29C]"
                  />
                </a>

                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-3 rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] px-4 py-3 text-xs font-bold text-[#3F4A41] transition hover:border-[#163F20]/25 hover:bg-[#EAF3EA]"
                  >
                    <FiPhone size={16} className="text-[#163F20]" />

                    {callLabel}

                    <FiChevronRight
                      size={15}
                      className="ml-auto text-[#9AA29C]"
                    />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="border-t border-[#163F20]/10 bg-white px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#9AA29C]">
            Received {formatDate(contact.created_at)}
          </span>
        </div>
      </div>
    </section>
  );
};

// =====================================================
// TIMELINE ROW
// =====================================================

const TimelineRow: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string;
}> = ({ icon, title, value }) => (
  <div className="flex gap-3">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EAF3EA] text-[#163F20]">
      {icon}
    </div>

    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
        {title}
      </p>

      <p className="mt-1 text-xs font-bold text-[#3F4A41]">{value}</p>
    </div>
  </div>
);

// =====================================================
// MAIN PAGE
// =====================================================

const ContactPage: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ContactFilter>("all");

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  const [markReadLoading, setMarkReadLoading] = useState(false);

  // ===================================================
  // GET CONTACTS
  // ===================================================

  const fetchContacts = async () => {
    try {
      setLoading(true);

      const response = await contactApi.getAll();

      if (response.data.success) {
        const data = response.data.data?.data || [];

        setContacts(data);

        setSelectedId((current) => current ?? data[0]?.id ?? null);
      } else {
        toast.error("Unable to fetch contacts.");
      }
    } catch (error: any) {
      console.error("Fetch contacts error:", error);

      toast.error(
        error?.response?.data?.message || "Unable to fetch contacts.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // ===================================================
  // FILTER
  // ===================================================

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return contacts.filter((contact) => {
      const matchesSearch =
        !query ||
        [
          contact.name,
          contact.email,
          contact.phone,
          contact.message,
          (contact as ContactWithAccountType).account_type,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      if (!matchesSearch) return false;

      if (filter === "unread") return !contact.is_read;

      if (filter === "read") return contact.is_read;

      return true;
    });
  }, [contacts, search, filter]);

  // ===================================================
  // KEEP SELECTED
  // ===================================================

  useEffect(() => {
    if (filteredContacts.length === 0) {
      setSelectedId(null);
      return;
    }

    const exists = filteredContacts.some(
      (contact) => contact.id === selectedId,
    );

    if (!exists) {
      setSelectedId(filteredContacts[0].id);
    }
  }, [filteredContacts, selectedId]);

  const selectedContact =
    contacts.find((contact) => contact.id === selectedId) ||
    filteredContacts[0] ||
    null;

  // ===================================================
  // STATS
  // ===================================================

  const stats = useMemo(() => {
    const total = contacts.length;
    const unread = contacts.filter((c) => !c.is_read).length;
    const read = contacts.filter((c) => c.is_read).length;

    return { total, unread, read };
  }, [contacts]);

  // ===================================================
  // CHECKBOX
  // ===================================================

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredContacts.map((c) => c.id);

    const everySelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedIds.includes(id));

    if (everySelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !visibleIds.includes(id)),
      );
    } else {
      setSelectedIds((prev) =>
        Array.from(new Set([...prev, ...visibleIds])),
      );
    }
  };

  // ===================================================
  // DELETE SINGLE / BULK
  // ===================================================

  const openDeleteSingle = (contact: Contact) => {
    setDeleteTarget(contact);
    setIsBulkDelete(false);
    setDeleteOpen(true);
  };

  const openDeleteBulk = () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one contact.");
      return;
    }

    setDeleteTarget(null);
    setIsBulkDelete(true);
    setDeleteOpen(true);
  };

  const closeDelete = () => {
    if (deleteLoading) return;

    setDeleteOpen(false);
    setDeleteTarget(null);
    setIsBulkDelete(false);
  };

  // ===================================================
  // DELETE API
  // ===================================================

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);

      if (isBulkDelete) {
        const response = await contactApi.bulkDelete(selectedIds);

        if (response.data.success) {
          const idsToDelete = [...selectedIds];

          setContacts((prev) =>
            prev.filter(
              (contact) => !idsToDelete.includes(contact.id),
            ),
          );

          setSelectedIds([]);

          if (selectedId && idsToDelete.includes(selectedId)) {
            setSelectedId(null);
          }

          toast.success(
            response.data.message ||
              "Contacts deleted successfully.",
          );

          closeDelete();
        } else {
          toast.error(
            response.data.message ||
              "Unable to delete contacts.",
          );
        }
      } else {
        if (!deleteTarget) return;

        const response = await contactApi.delete(deleteTarget.id);

        if (response.data.success) {
          const deletedId = deleteTarget.id;

          setContacts((prev) =>
            prev.filter((contact) => contact.id !== deletedId),
          );

          setSelectedIds((prev) =>
            prev.filter((id) => id !== deletedId),
          );

          if (selectedId === deletedId) {
            setSelectedId(null);
          }

          toast.success(
            response.data.message ||
              "Contact deleted successfully.",
          );

          closeDelete();
        } else {
          toast.error(
            response.data.message ||
              "Unable to delete contact.",
          );
        }
      }
    } catch (error: any) {
      console.error("Delete contact error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Unable to delete contact.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // ===================================================
  // MARK READ API
  // ===================================================

  const handleMarkRead = async (contact: Contact) => {
    if (contact.is_read) return;

    try {
      setMarkReadLoading(true);

      const response = await contactApi.markAsRead(contact.id);

      if (response.data.success) {
        const apiContact = response.data.data;

        setContacts((prev) =>
          prev.map((item) =>
            item.id === contact.id
              ? {
                  ...item,
                  is_read: true,
                  read_at:
                    apiContact?.read_at ||
                    new Date().toISOString(),
                  updated_at:
                    apiContact?.updated_at ||
                    item.updated_at,
                }
              : item,
          ),
        );

        toast.success(
          response.data.message ||
            "Contact marked as read.",
        );
      } else {
        toast.error(
          response.data.message ||
            "Unable to mark contact as read.",
        );
      }
    } catch (error: any) {
      console.error(
        "Mark contact as read error:",
        error,
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to mark contact as read.",
      );
    } finally {
      setMarkReadLoading(false);
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
        {/* BULK ACTION */}
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#163F20]/15 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                <FiCheckSquare size={17} />
              </div>

              <div>
                <p className="text-sm font-bold text-[#202721]">
                  {selectedIds.length} contacts selected
                </p>

                <p className="mt-0.5 text-xs text-[#9AA29C]">
                  Bulk actions are available for the selected messages.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openDeleteBulk}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C23B32] to-[#A62F27] px-5 text-xs font-bold text-white shadow-[0_8px_18px_-8px_rgba(194,59,50,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-8px_rgba(194,59,50,0.7)]"
            >
              <FiTrash2 size={15} />
              Delete Selected
            </button>
          </motion.div>
        )}

        {/* MASTER DETAIL */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col gap-5 lg:flex-row"
        >
          <ContactSidebar
            contacts={filteredContacts}
            selectedId={selectedId}
            selectedIds={selectedIds}
            search={search}
            filter={filter}
            loading={loading}
            onSelect={(contact) => setSelectedId(contact.id)}
            onToggleSelect={toggleSelect}
            onToggleAll={toggleSelectAll}
            onSearch={(value) => setSearch(value)}
            onFilter={(value) => {
              setFilter(value);
              setSelectedIds([]);
            }}
          />

          {selectedContact ? (
            <ContactDetailPane
              contact={selectedContact}
              onDelete={openDeleteSingle}
              onMarkRead={handleMarkRead}
              markReadLoading={markReadLoading}
            />
          ) : (
            <section className="flex min-h-[680px] flex-1 items-center justify-center rounded-2xl border border-[#E5EAE5] bg-white shadow-sm">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#163F20]">
                  <FiMessageSquare size={27} />
                </div>

                <h3 className="mt-4 text-base font-bold text-[#202721]">
                  No contact selected
                </h3>

                <p className="mt-1 text-xs text-[#9AA29C]">
                  Select a contact from the list to view the complete
                  message.
                </p>
              </div>
            </section>
          )}
        </motion.div>
      </motion.div>

      {/* DELETE MODAL */}
      <DeleteContactModal
        open={deleteOpen}
        loading={deleteLoading}
        count={isBulkDelete ? selectedIds.length : 1}
        name={deleteTarget?.name || ""}
        onClose={closeDelete}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default ContactPage;