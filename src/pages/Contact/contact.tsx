import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
import { usePermissions } from "../../pages/permissions/usePermissions";
import logoApi from "../../api/endpoints/logoApi";

const DEFAULT_LOGO_URL =
  "https://www.markupdesigns.net/indikonnect/storage/logos/MmVFOudCiVU3Y8C0sf2gEEXna5jSKroCDj8xYMo0.png";

const VIEW_PERMISSION_KEYS = [
  "contact.view",
  "contacts.view",
  "Contact.view",
  "Contacts.view",
  "contact_messages.view",
  "Contact Messages.view",
];

const UPDATE_PERMISSION_KEYS = [
  "contact.update",
  "contacts.update",
  "Contact.update",
  "Contacts.update",
  "contact.edit",
  "contacts.edit",
  "Contact.edit",
  "Contacts.edit",
  "contact_messages.update",
  "Contact Messages.update",
];

const DELETE_PERMISSION_KEYS = [
  "contact.delete",
  "contacts.delete",
  "Contact.delete",
  "Contacts.delete",
  "contact_messages.delete",
  "Contact Messages.delete",
];

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
    transition: { type: "spring" as const, stiffness: 110, damping: 15 },
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

const getAccountTypeLabel = (contact: Contact) =>
  getAccountType(contact) === "distributor" ? "Distributor" : "Customer";

const getAccountTypeLowerLabel = (contact: Contact) =>
  getAccountType(contact) === "distributor" ? "distributor" : "customer";

const getEnquiryLabel = (contact: Contact) =>
  `${getAccountTypeLabel(contact)} enquiry`;

const getContactDescription = (contact: Contact) =>
  `Details submitted by the ${getAccountTypeLowerLabel(contact)}`;

const getCallLabel = (contact: Contact) =>
  `Call ${getAccountTypeLabel(contact)}`;

// =====================================================
// ✅ PERMISSION / PAGE LOADING STATE (PULSING LOGO)
// Same pattern as Orders / ReturnRefund / CreditNotes / Payment / Products / ContentsManagement / ReelsManagement / FooterManagement / NotificationTemplates / FAQManagement / UserManagement / AdminManagement / ReviewsModeration
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
        className="block max-h-[120px] max-w-[240px] object-contain"
        referrerPolicy="no-referrer"
        initial={{ opacity: 0.5, scale: 0.96 }}
        animate={{
          opacity: [0.8, 1, 0.8],
          scale: [0.98, 1, 0.98],
        }}
        transition={{
          duration: 1.6,
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
// =====================================================
const AccessDeniedState: React.FC = () => (
  <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#F4F8FD] p-6 font-poppins">
    <div className="w-full max-w-md rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#C23B32]">
        <FiAlertTriangle size={24} />
      </div>
      <h2 className="mt-5 text-lg font-bold text-[#111827]">Access Denied</h2>
      <p className="mt-2 text-sm leading-6 text-[#6B7280]">
        You do not have permission to view contact messages.
      </p>
    </div>
  </div>
);

// =====================================================
// STATUS BADGE
// =====================================================
const ReadStatusBadge: React.FC<{ isRead: boolean }> = ({ isRead }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${
      isRead
        ? "border-[#DCE6F2] bg-[#F4F8FD] text-[#6B7280]"
        : "border-[#2D6FE8]/25 bg-[#EAF3FF] text-[#2D6FE8]"
    }`}
  >
    <span
      className={`h-1.5 w-1.5 rounded-full ${
        isRead ? "bg-[#6B7280]" : "bg-[#2D6FE8]"
      }`}
    />
    {isRead ? "Read" : "Unread"}
  </span>
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
    <GlobalModal isOpen={open} onClose={onClose} closeOnOverlayClick={!loading}>
      <div className="w-full max-w-[470px] overflow-hidden rounded-[22px] border border-[#DCE6F2] bg-white font-poppins shadow-2xl">
        <div className="h-[3px] w-full bg-gradient-to-r from-[#2D6FE8] to-[#C23B32]" />

        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#C23B32]">
              <FiAlertTriangle size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#111827]">
                {isBulk ? "Delete Contacts" : "Delete Contact"}
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#6B7280]">
                {isBulk
                  ? `Are you sure you want to delete ${count} selected contacts? This action cannot be undone.`
                  : "Are you sure you want to permanently delete this contact? This action cannot be undone."}
              </p>
            </div>
          </div>

          {!isBulk && name && (
            <div className="mt-5 rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">
                Selected Contact
              </p>
              <p className="mt-1 text-sm font-bold text-[#111827]">{name}</p>
            </div>
          )}

          {isBulk && (
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2D6FE8]">
                <FiTrash2 size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#111827]">
                  {count} contacts selected
                </p>
                <p className="mt-0.5 text-[11px] text-[#6B7280]">
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
  initialLoading: boolean;
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
  initialLoading,
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
    <aside className="flex h-[680px] w-full flex-col overflow-hidden rounded-[22px] border border-[#DCE6F2] bg-white shadow-sm lg:h-[720px] lg:w-[390px] xl:w-[410px]">
      {/* HEADER */}
      <div className="relative border-b border-[#DCE6F2] p-4 sm:p-5">
    
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold text-[#111827]">
              Contact Messages
              <span className="inline-flex items-center justify-center rounded-full bg-[#EAF3FF] px-2.5 py-0.5 text-xs font-bold text-[#2D6FE8]">
                {contacts.length}
              </span>
            </h3>
            <p className="mt-1 text-xs text-[#6B7280]">
              Review customer & distributor enquiries
            </p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#2D6FE8]">
            <FiMessageSquare size={17} />
          </div>
        </div>

        {/* FILTERS */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
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
                  ? "bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] text-white shadow-[0_6px_14px_-6px_rgba(45,111,232,0.5)]"
                  : "border border-[#DCE6F2] bg-[#F4F8FD] text-[#6B7280] hover:border-[#4F8FF7]/30 hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"
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
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D6FE8]"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search name, email or phone..."
            className="h-11 w-full rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] pl-10 pr-3 text-xs text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/10"
          />

          {search && (
            <button
              type="button"
              onClick={() => onSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#2D6FE8]"
            >
              <FiX size={15} />
            </button>
          )}
        </div>
      </div>

      {/* BULK TOOLBAR */}
      <div className="border-b border-[#DCE6F2] bg-[#F8FBFF] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onToggleAll}
            disabled={contacts.length === 0}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-[#2D6FE8] transition hover:text-[#2D6FE8]/80 disabled:opacity-40"
          >
            {allSelected ? (
              <FiCheckSquare size={15} />
            ) : (
              <FiSquare size={15} />
            )}
            {allSelected ? "Deselect All" : "Select All"}
          </button>

          <span className="rounded-full bg-[#EAF3FF] px-2.5 py-1 text-[10px] font-bold text-[#2D6FE8]">
            {selectedIds.length > 0
              ? `${selectedIds.length} selected`
              : `${contacts.length} messages`}
          </span>
        </div>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto">
        {/* ✅ initialLoading par full spinner — refresh/CRUD par nahi */}
        {initialLoading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
              <FiRefreshCw size={21} className="animate-spin" />
            </div>
            <p className="mt-4 text-sm font-bold text-[#111827]">
              Loading contacts...
            </p>
          </div>
        ) : loading && contacts.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
              <FiRefreshCw size={21} className="animate-spin" />
            </div>
            <p className="mt-4 text-sm font-bold text-[#111827]">
              Loading contacts...
            </p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
              <FiInbox size={24} />
            </div>
            <p className="mt-4 text-sm font-bold text-[#111827]">
              No contacts found
            </p>
            <p className="mt-1 text-xs text-[#6B7280]">
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
                className={`relative cursor-pointer border-b border-[#DCE6F2] p-4 transition-all ${
                  selected ? "bg-[#EAF3FF]/70" : "bg-white hover:bg-[#F8FBFF]"
                }`}
              >
                {selected && (
                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-[#4F8FF7] to-[#2D6FE8]" />
                )}

                <div className="flex items-start gap-3">
                  {/* CHECKBOX */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelect(contact.id);
                    }}
                    className="mt-1 shrink-0 text-[#6B7280] transition hover:text-[#2D6FE8]"
                    title={checked ? "Deselect" : "Select"}
                  >
                    {checked ? (
                      <FiCheckSquare size={17} className="text-[#2D6FE8]" />
                    ) : (
                      <FiSquare size={17} />
                    )}
                  </button>

                  {/* AVATAR */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold text-white ${
                      contact.is_read
                        ? "bg-gradient-to-br from-[#94A3B8] to-[#64748B]"
                        : "bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8]"
                    }`}
                  >
                    {getInitials(contact.name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className={`truncate text-sm ${
                          !contact.is_read
                            ? "font-bold text-[#111827]"
                            : "font-bold text-[#6B7280]"
                        }`}
                      >
                        {contact.name || "Unknown User"}
                      </h4>

                      <FiChevronRight
                        size={15}
                        className={`mt-0.5 shrink-0 ${
                          selected ? "text-[#2D6FE8]" : "text-[#6B7280]"
                        }`}
                      />
                    </div>

                    <p className="mt-0.5 truncate text-[10px] text-[#6B7280]">
                      {contact.email}
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
  <div className="rounded-xl border border-[#DCE6F2] bg-[#F8FBFF] p-4">
    <div className="mb-2 flex items-center gap-2">
      <span className="text-[#2D6FE8]">{icon}</span>
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">
        {label}
      </p>
    </div>
    <p className="break-words text-sm font-bold text-[#111827]">
      {value || "—"}
    </p>
  </div>
);

// =====================================================
// TIMELINE ROW
// =====================================================
const TimelineRow: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string;
}> = ({ icon, title, value }) => (
  <div className="flex gap-3">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-white shadow-[0_4px_10px_-4px_rgba(45,111,232,0.5)]">
      {icon}
    </div>

    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">
        {title}
      </p>
      <p className="mt-1 text-xs font-bold text-[#111827]">{value}</p>
    </div>
  </div>
);

// =====================================================
// DETAIL PANE
// =====================================================
interface ContactDetailProps {
  contact: Contact;
  onDelete?: (contact: Contact) => void;
  onMarkRead?: (contact: Contact) => void;
  markReadLoading: boolean;
  canDelete: boolean;
  canUpdate: boolean;
}

const ContactDetailPane: React.FC<ContactDetailProps> = ({
  contact,
  onDelete,
  onMarkRead,
  markReadLoading,
  canDelete,
  canUpdate,
}) => {
  const accountTypeLabel = getAccountTypeLabel(contact);
  const enquiryLabel = getEnquiryLabel(contact);
  const contactDescription = getContactDescription(contact);
  const callLabel = getCallLabel(contact);

  return (
    <section className="flex min-h-[680px] flex-1 flex-col overflow-hidden rounded-[22px] border border-[#DCE6F2] bg-white shadow-sm lg:min-h-[720px]">
      {/* HEADER */}
      <div className="relative border-b border-[#DCE6F2] bg-white p-5 sm:p-6">
      
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-sm font-bold text-white shadow-[0_10px_22px_-10px_rgba(45,111,232,0.5)]">
              {getInitials(contact.name)}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-bold text-[#111827] sm:text-xl">
                  {contact.name || "Unknown User"}
                </h2>
                <ReadStatusBadge isRead={contact.is_read} />
              </div>
              <p className="mt-1 truncate text-xs text-[#6B7280]">
                {contact.email}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {canUpdate && !contact.is_read && (
              <button
                type="button"
                onClick={() => onMarkRead?.(contact)}
                disabled={markReadLoading}
                className="flex items-center gap-2 rounded-xl border border-[#2D6FE8]/20 bg-[#EAF3FF] px-4 py-2.5 text-xs font-bold text-[#2D6FE8] transition hover:border-[#2D6FE8]/35 hover:bg-[#2D6FE8] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {markReadLoading ? (
                  <FiRefreshCw size={15} className="animate-spin" />
                ) : (
                  <FiCheckCircle size={15} />
                )}
                {markReadLoading ? "Marking..." : "Mark as Read"}
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete?.(contact)}
                className="flex items-center gap-2 rounded-xl border border-[#C23B32]/25 bg-[#FEF2F2] px-4 py-2.5 text-xs font-bold text-[#C23B32] transition hover:border-transparent hover:bg-[#C23B32] hover:text-white"
              >
                <FiTrash2 size={15} />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto bg-[#F4F8FD] p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          {/* LEFT MAIN */}
          <div className="space-y-5 xl:col-span-2">
            {/* MESSAGE */}
            <div className="relative overflow-hidden rounded-2xl border border-[#DCE6F2] bg-white p-5 shadow-sm sm:p-6">
              
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#2D6FE8]">
                    <FiMessageSquare size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#111827]">
                      Message
                    </h3>
                    <p className="mt-1 text-xs text-[#6B7280]">{enquiryLabel}</p>
                  </div>
                </div>

                <ReadStatusBadge isRead={contact.is_read} />
              </div>

              <div className="rounded-xl border border-[#DCE6F2] bg-[#F8FBFF] p-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-[#6B7280]">
                  {contact.message || "No message provided."}
                </p>
              </div>
            </div>

            {/* CONTACT INFORMATION */}
            <div className="relative overflow-hidden rounded-2xl border border-[#DCE6F2] bg-white p-5 shadow-sm sm:p-6">
          
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#2D6FE8]">
                  <FiUser size={17} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111827]">
                    Contact Information
                  </h3>
                  <p className="mt-1 text-xs text-[#6B7280]">
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
            <div className="relative overflow-hidden rounded-2xl border border-[#DCE6F2] bg-white p-5 shadow-sm">
           
              <h4 className="mb-4 border-b border-[#DCE6F2] pb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
                Message Status
              </h4>

              <div className="rounded-xl bg-[#F8FBFF] p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      contact.is_read
                        ? "bg-[#F4F8FD] text-[#6B7280]"
                        : "bg-[#EAF3FF] text-[#2D6FE8]"
                    }`}
                  >
                    {contact.is_read ? (
                      <FiCheckCircle size={19} />
                    ) : (
                      <FiClock size={19} />
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">
                      Current Status
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#111827]">
                      {contact.is_read ? "Read" : "Unread"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* TIMELINE */}
            <div className="relative overflow-hidden rounded-2xl border border-[#DCE6F2] bg-white p-5 shadow-sm">
            
              <h4 className="mb-4 border-b border-[#DCE6F2] pb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
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
            <div className="relative overflow-hidden rounded-2xl border border-[#DCE6F2] bg-white p-5 shadow-sm">
         
              <h4 className="mb-4 border-b border-[#DCE6F2] pb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
                Quick Actions
              </h4>

              <div className="space-y-2">
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-3 rounded-xl border border-[#DCE6F2] bg-[#F8FBFF] px-4 py-3 text-xs font-bold text-[#6B7280] transition hover:border-[#2D6FE8]/30 hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"
                >
                  <FiMail size={16} className="text-[#2D6FE8]" />
                  Send Email
                  <FiChevronRight size={15} className="ml-auto text-[#6B7280]" />
                </a>

                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-3 rounded-xl border border-[#DCE6F2] bg-[#F8FBFF] px-4 py-3 text-xs font-bold text-[#6B7280] transition hover:border-[#2D6FE8]/30 hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"
                  >
                    <FiPhone size={16} className="text-[#2D6FE8]" />
                    {callLabel}
                    <FiChevronRight
                      size={15}
                      className="ml-auto text-[#6B7280]"
                    />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="border-t border-[#DCE6F2] bg-[#F8FBFF] px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#6B7280]">
            Received {formatDate(contact.created_at)}
          </span>
        </div>
      </div>
    </section>
  );
};

// =====================================================
// MAIN PAGE
// =====================================================
const ContactPage: React.FC = () => {
  const {
    hasPermission,
    hasModuleAccess,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  // ===================================================
  // PERMISSIONS
  // ===================================================
  const hasAnyPermission = useCallback(
    (keys: string[]) => keys.some((key) => hasPermission(key)),
    [hasPermission],
  );

  const canViewContacts = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("Contact") ||
      hasModuleAccess("Contacts") ||
      hasModuleAccess("Contact Messages") ||
      hasAnyPermission(VIEW_PERMISSION_KEYS),
    [isSuperAdmin, hasModuleAccess, hasAnyPermission],
  );

  const canUpdateContacts = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("Contact") ||
      hasModuleAccess("Contacts") ||
      hasModuleAccess("Contact Messages") ||
      hasAnyPermission(UPDATE_PERMISSION_KEYS),
    [isSuperAdmin, hasModuleAccess, hasAnyPermission],
  );

  const canDeleteContacts = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("Contact") ||
      hasModuleAccess("Contacts") ||
      hasModuleAccess("Contact Messages") ||
      hasAnyPermission(DELETE_PERMISSION_KEYS),
    [isSuperAdmin, hasModuleAccess, hasAnyPermission],
  );

  // ===================================================
  // ✅ LOGO STATE (same pattern as Orders / ReturnRefund / CreditNotes / Payment)
  // ===================================================

  const [logoUrl, setLogoUrl] = useState<string | null>(DEFAULT_LOGO_URL);
  const [logoLoading, setLogoLoading] = useState(true);

  // ===================================================
  // STATE
  // ===================================================
  const [contacts, setContacts] = useState<Contact[]>([]);

  // ✅ first load only — subsequent fetches don't block page
  const [initialContactsLoading, setInitialContactsLoading] = useState(true);
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
  // DUPLICATE FETCH PROTECTION
  // ===================================================
  const fetchInFlightRef = useRef<Promise<void> | null>(null);
  const hasInitialFetchRef = useRef(false);

  // ===================================================
  // LOGO FETCH (same as Orders / ReturnRefund / CreditNotes / Payment)
  // ===================================================

  useEffect(() => {
    let cancelled = false;

    const fetchLogo = async () => {
      try {
        const response: any = await logoApi.getLogo();

        const possibleLogos: unknown[] = [
          response?.data?.data?.logo,
          response?.data?.logo,
          response?.data?.data?.data?.logo,
          response?.data?.data?.logo_url,
          response?.data?.logo_url,
          response?.logo,
        ];

        const resolvedLogo = possibleLogos.find(
          (value): value is string =>
            typeof value === "string" && /^https?:\/\//i.test(value.trim()),
        );

        if (!cancelled && resolvedLogo) {
          setLogoUrl(resolvedLogo.trim());
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
  // GET CONTACTS
  // isInitialLoad = true ONLY FOR THE FIRST LOAD
  // ===================================================
  const fetchContacts = useCallback(
    async (force = false, isInitialLoad = false) => {
      if (!canViewContacts) return;
      if (fetchInFlightRef.current) return fetchInFlightRef.current;
      if (!force && hasInitialFetchRef.current) return;

      const request = (async () => {
        try {
          setLoading(true);
          const response = await contactApi.getAll();

          if (response.data.success) {
            const data = response.data.data?.data || [];
            setContacts(data);

            setSelectedId((current) => {
              if (
                current &&
                data.some((contact: Contact) => contact.id === current)
              ) {
                return current;
              }
              return data[0]?.id ?? null;
            });

            hasInitialFetchRef.current = true;
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

          if (isInitialLoad) {
            setInitialContactsLoading(false);
          }
        }
      })();

      fetchInFlightRef.current = request;
      try {
        await request;
      } finally {
        if (fetchInFlightRef.current === request) {
          fetchInFlightRef.current = null;
        }
      }
    },
    [canViewContacts],
  );

  // ===================================================
  // INITIAL FETCH
  // WAIT FOR PERMISSIONS BEFORE REQUESTING CONTACTS
  // ===================================================
  useEffect(() => {
    if (permissionsLoading) return;

    if (!canViewContacts) {
      setLoading(false);
      setInitialContactsLoading(false);
      return;
    }

    if (!hasInitialFetchRef.current) {
      void fetchContacts(false, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionsLoading, canViewContacts, fetchContacts]);

  // ===================================================
  // COMBINED INITIAL LOADING
  // ===================================================

  const pageLoading =
    permissionsLoading ||
    logoLoading ||
    initialContactsLoading;

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
    if (!exists) setSelectedId(filteredContacts[0].id);
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
  const toggleSelect = useCallback(
    (id: number) => {
      if (!canDeleteContacts) return;
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
      );
    },
    [canDeleteContacts],
  );

  const toggleSelectAll = useCallback(() => {
    if (!canDeleteContacts) return;

    const visibleIds = filteredContacts.map((contact) => contact.id);
    const everySelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedIds.includes(id));

    if (everySelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  }, [canDeleteContacts, filteredContacts, selectedIds]);

  // ===================================================
  // DELETE SINGLE / BULK
  // ===================================================
  const openDeleteSingle = useCallback(
    (contact: Contact) => {
      if (!canDeleteContacts) {
        toast.error("You do not have permission to delete contacts.");
        return;
      }
      setDeleteTarget(contact);
      setIsBulkDelete(false);
      setDeleteOpen(true);
    },
    [canDeleteContacts],
  );

  const openDeleteBulk = useCallback(() => {
    if (!canDeleteContacts) {
      toast.error("You do not have permission to delete contacts.");
      return;
    }
    if (selectedIds.length === 0) {
      toast.error("Please select at least one contact.");
      return;
    }
    setDeleteTarget(null);
    setIsBulkDelete(true);
    setDeleteOpen(true);
  }, [canDeleteContacts, selectedIds.length]);

  const closeDelete = useCallback(() => {
    if (deleteLoading) return;
    setDeleteOpen(false);
    setDeleteTarget(null);
    setIsBulkDelete(false);
  }, [deleteLoading]);

  // ===================================================
  // DELETE API
  // ===================================================
  const handleDelete = useCallback(async () => {
    if (!canDeleteContacts) {
      toast.error("You do not have permission to delete contacts.");
      return;
    }
    if (deleteLoading) return;

    try {
      setDeleteLoading(true);

      if (isBulkDelete) {
        if (selectedIds.length === 0) {
          toast.error("Please select at least one contact.");
          return;
        }

        const idsToDelete = [...selectedIds];
        const response = await contactApi.bulkDelete(idsToDelete);

        if (response.data.success) {
          setContacts((prev) =>
            prev.filter((contact) => !idsToDelete.includes(contact.id)),
          );
          setSelectedIds([]);
          if (selectedId && idsToDelete.includes(selectedId)) {
            setSelectedId(null);
          }
          toast.success(
            response.data.message || "Contacts deleted successfully.",
          );
          setDeleteOpen(false);
          setDeleteTarget(null);
          setIsBulkDelete(false);
        } else {
          toast.error(
            response.data.message || "Unable to delete contacts.",
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
          setSelectedIds((prev) => prev.filter((id) => id !== deletedId));
          if (selectedId === deletedId) setSelectedId(null);
          toast.success(
            response.data.message || "Contact deleted successfully.",
          );
          setDeleteOpen(false);
          setDeleteTarget(null);
          setIsBulkDelete(false);
        } else {
          toast.error(response.data.message || "Unable to delete contact.");
        }
      }
    } catch (error: any) {
      console.error("Delete contact error:", error);
      toast.error(
        error?.response?.data?.message || "Unable to delete contact.",
      );
    } finally {
      setDeleteLoading(false);
    }
  }, [
    canDeleteContacts,
    deleteLoading,
    isBulkDelete,
    selectedIds,
    selectedId,
    deleteTarget,
  ]);

  // ===================================================
  // MARK READ API
  // ===================================================
  const handleMarkRead = useCallback(
    async (contact: Contact) => {
      if (!canUpdateContacts) {
        toast.error("You do not have permission to update contacts.");
        return;
      }
      if (contact.is_read || markReadLoading) return;

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
                    read_at: apiContact?.read_at || new Date().toISOString(),
                    updated_at: apiContact?.updated_at || item.updated_at,
                  }
                : item,
            ),
          );
          toast.success(
            response.data.message || "Contact marked as read.",
          );
        } else {
          toast.error(
            response.data.message || "Unable to mark contact as read.",
          );
        }
      } catch (error: any) {
        console.error("Mark contact as read error:", error);
        toast.error(
          error?.response?.data?.message ||
            "Unable to mark contact as read.",
        );
      } finally {
        setMarkReadLoading(false);
      }
    },
    [canUpdateContacts, markReadLoading],
  );

  // ===================================================
  // REFRESH
  // ===================================================
  const handleRefresh = useCallback(() => {
    if (!canViewContacts) {
      toast.error("You do not have permission to view contacts.");
      return;
    }
    void fetchContacts(true);
  }, [canViewContacts, fetchContacts]);

  // ===================================================
  // ✅ COMPONENT-LEVEL LOADING (PULSING LOGO)
  // SIDEBAR / NAVBAR UNTOUCHED
  // ===================================================

  if (pageLoading) {
    return <PermissionLoadingState logoUrl={logoUrl} />;
  }

  // ===================================================
  // ACCESS DENIED
  // ===================================================

  if (!canViewContacts) return <AccessDeniedState />;

  // ===================================================
  // UI
  // ===================================================
  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="min-h-screen bg-white p-4 font-poppins sm:p-5 lg:p-5"
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
                Support Inbox
              </span>
            </div>

            <h1 className="text-[20px] font-medium tracking-tight text-[#111827] sm:text-[22px]">
              Contact Messages
            </h1>

            <p className="mt-0.5 text-sm text-[#111827]">
              Review and manage customer & distributor enquiries.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#2D6FE8]/20 bg-white px-4 text-sm font-bold text-[#2D6FE8] transition hover:border-[#4F8FF7]/40 hover:bg-[#EAF3FF] disabled:opacity-50"
            >
              <FiRefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* BULK ACTION */}
        {canDeleteContacts && selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 flex flex-col gap-3 rounded-[22px] border border-[#2D6FE8]/15 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#2D6FE8]">
                <FiCheckSquare size={17} />
              </div>

              <div>
                <p className="text-sm font-bold text-[#111827]">
                  {selectedIds.length} contacts selected
                </p>
                <p className="mt-0.5 text-xs text-[#6B7280]">
                  Bulk actions are available for the selected messages.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openDeleteBulk}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#C23B32]/20 bg-[#FEF2F2] px-5 text-sm font-bold text-[#C23B32] transition hover:border-transparent hover:bg-[#C23B32] hover:text-white"
            >
              <FiTrash2 size={15} />
              Delete Selected
            </button>
          </motion.div>
        )}

        {/* MASTER DETAIL */}
        <motion.div
          variants={itemVariants}
          className="mt-6 flex flex-col gap-5 lg:flex-row"
        >
          <ContactSidebar
            contacts={filteredContacts}
            selectedId={selectedId}
            selectedIds={selectedIds}
            search={search}
            filter={filter}
            loading={loading}
            initialLoading={initialContactsLoading}
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
              onDelete={canDeleteContacts ? openDeleteSingle : undefined}
              onMarkRead={canUpdateContacts ? handleMarkRead : undefined}
              markReadLoading={markReadLoading}
              canDelete={canDeleteContacts}
              canUpdate={canUpdateContacts}
            />
          ) : (
            <section className="flex min-h-[680px] flex-1 items-center justify-center rounded-[22px] border border-[#DCE6F2] bg-white shadow-sm">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                  <FiMessageSquare size={27} />
                </div>

                <h3 className="mt-4 text-base font-bold text-[#111827]">
                  No contact selected
                </h3>

                <p className="mt-1 text-xs text-[#6B7280]">
                  Select a contact from the list to view the complete message.
                </p>
              </div>
            </section>
          )}
        </motion.div>
      </motion.div>

      {/* DELETE MODAL */}
      {canDeleteContacts && (
        <DeleteContactModal
          open={deleteOpen}
          loading={deleteLoading}
          count={isBulkDelete ? selectedIds.length : 1}
          name={deleteTarget?.name || ""}
          onClose={closeDelete}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
};

export default ContactPage;