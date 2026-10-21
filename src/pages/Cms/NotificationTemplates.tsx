"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { motion, AnimatePresence } from "framer-motion";

import toast from "react-hot-toast";

import {
  FiAlertCircle,
  FiBell,
  FiChevronLeft,
  FiChevronRight,
  FiDatabase,
  FiEdit3,
  FiMail,
  FiMessageSquare,
  FiRefreshCw,
  FiSearch,
  FiSave,
  FiX,
} from "react-icons/fi";

import { notificationTemplateApi } from "../../api/endpoints/notificationTemplates";
import type { NotificationTemplate } from "../../api/endpoints/notificationTemplates";
import { usePermissions } from "../../pages/permissions/usePermissions";
import logoApi from "../../api/endpoints/logoApi";
import PermissionLoadingState from "@/components/common/PermissionLoadingState";

const DEFAULT_LOGO_URL =
  "https://www.markupdesigns.net/indikonnect/storage/logos/MmVFOudCiVU3Y8C0sf2gEEXna5jSKroCDj8xYMo0.png";

const VIEW_PERMISSION_KEYS = [
  "notification_template.view",
  "notification_templates.view",
  "Notification Template.view",
  "Notification Templates.view",
  "notification.view",
  "Notification.view",
];

const UPDATE_PERMISSION_KEYS = [
  "notification_template.update",
  "notification_templates.update",
  "Notification Template.update",
  "Notification Templates.update",
  "notification_template.edit",
  "notification_templates.edit",
  "Notification Template.edit",
  "Notification Templates.edit",
  "notification.update",
  "Notification.update",
  "notification.edit",
  "Notification.edit",
];

/* =========================================================
   CONSTANTS
========================================================= */
const PER_PAGE = 15;

/* =========================================================
   HELPERS
========================================================= */
const formatEventType = (value: string) => {
  if (!value) return "-";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatChannel = (channel: string) => {
  if (!channel) return "-";
  if (channel.toLowerCase() === "mail") return "Email";
  return (
    channel.charAt(0).toUpperCase() + channel.slice(1).toLowerCase()
  );
};

const getChannelIcon = (channel: string) => {
  const value = channel?.toLowerCase();
  if (value === "mail" || value === "email") return <FiMail size={14} />;
  if (value === "database") return <FiDatabase size={14} />;
  if (value === "sms") return <FiMessageSquare size={14} />;
  return <FiBell size={14} />;
};

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};


interface EditTemplateModalProps {
  template: NotificationTemplate | null;
  open: boolean;
  loading: boolean;
  canUpdate: boolean;
  onClose: () => void;
  onSave: (id: number, subject: string, body: string) => Promise<void>;
}

const EditTemplateModal = ({
  template,
  open,
  loading,
  canUpdate,
  onClose,
  onSave,
}: EditTemplateModalProps) => {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (template) {
      setSubject(template.subject || "");
      setBody(template.body || "");
    }
  }, [template]);

  if (!open || !template || !canUpdate) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!canUpdate) {
      toast.error(
        "You do not have permission to update notification templates.",
      );
      return;
    }

    if (!subject.trim()) {
      toast.error("Subject is required");
      return;
    }

    if (!body.trim()) {
      toast.error("Body is required");
      return;
    }

    await onSave(template.id, subject.trim(), body.trim());
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-[3px]" style={{ backgroundColor: "rgba(17, 24, 39, 0.52)" }}>
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.97 }}
          transition={{ duration: 0.2 }}
          className="flex max-h-[92vh] w-full max-w-[820px] flex-col overflow-hidden rounded-[22px] border border-[#DCE6F2] bg-white font-poppins shadow-[0_25px_70px_rgba(45,111,232,0.16)]"
        >
          {/* TOP LINE */}
          <div className="h-[3px] w-full bg-gradient-to-r from-[#4F8FF7] via-[#2D6FE8] to-[#2D6FE8]" />

          {/* HEADER */}
          <div className="flex items-start justify-between border-b border-[#DCE6F2] px-5 py-5 sm:px-6">
            <div className="min-w-0 pr-4">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#2D6FE8]">
                Notification Template
              </p>

              <h2 className="text-xl font-bold text-[#111827]">
                Edit Template
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-[#EAF3FF] px-2.5 py-1 text-xs font-bold text-[#2D6FE8]">
                  {formatEventType(template.event_type)}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-md border border-[#DCE6F2] bg-white px-2.5 py-1 text-xs font-bold text-[#6B7280]">
                  {getChannelIcon(template.channel)}
                  {formatChannel(template.channel)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiX size={19} />
            </button>
          </div>

          {/* BODY */}
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8FBFF] px-5 py-5 sm:px-6">
              <div className="space-y-5">
                {/* SUBJECT */}
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
                    Subject
                  </label>

                  <input
                    type="text"
                    value={subject}
                    disabled={loading}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter notification subject"
                    className="h-12 w-full rounded-xl border border-[#DCE6F2] bg-white px-4 text-sm text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:ring-2 focus:ring-[#2D6FE8]/10 disabled:cursor-not-allowed disabled:bg-[#EEF3FA]"
                  />
                </div>

                {/* BODY */}
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
                    Body
                  </label>

                  <textarea
                    rows={9}
                    value={body}
                    disabled={loading}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Enter notification body"
                    className="w-full resize-y rounded-xl border border-[#DCE6F2] bg-white px-4 py-3 text-sm leading-6 text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:ring-2 focus:ring-[#2D6FE8]/10 disabled:cursor-not-allowed disabled:bg-[#EEF3FA]"
                  />
                </div>

                {/* PLACEHOLDERS */}
                {template.placeholders?.length > 0 && (
                  <div className="rounded-xl border border-[#2D6FE8]/15 bg-[#EAF3FF] p-4 sm:p-5">
                    <div className="mb-3">
                      <p className="text-sm font-bold text-[#111827]">
                        Available Placeholders
                      </p>

                      <p className="mt-1 text-xs text-[#6B7280]">
                        Use these dynamic values inside subject or body.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {template.placeholders.map((placeholder) => (
                        <span
                          key={placeholder}
                          className="rounded-lg border border-[#2D6FE8]/25 bg-white px-2.5 py-1.5 font-mono text-[11px] font-bold text-[#2D6FE8]"
                        >
                          {`{{${placeholder}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* INFO */}
                <div className="rounded-xl border border-[#2D6FE8]/15 bg-[#EAF3FF] px-4 py-3.5">
                  <p className="text-xs leading-5 text-[#2D6FE8]">
                    Only <strong>Subject</strong> and <strong>Body</strong>{" "}
                    will be updated. Event type, channel and placeholders are
                    managed by the system.
                  </p>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex flex-col-reverse gap-3 border-t border-[#DCE6F2] bg-[#F8FBFF] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="h-11 rounded-xl border border-[#DCE6F2] bg-white px-5 text-sm font-bold text-[#6B7280] transition hover:bg-[#F4F8FD] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(45,111,232,0.6)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <FiRefreshCw size={15} className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <FiSave size={15} />
                    Update Template
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/* =========================================================
   MAIN COMPONENT
========================================================= */
const NotificationTemplates = () => {
  /* =======================================================
     PERMISSIONS
  ======================================================= */
  const {
    hasPermission,
    hasModuleAccess,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  const hasAnyPermission = useCallback(
    (permissions: string[]) =>
      permissions.some((permission) => hasPermission(permission)),
    [hasPermission],
  );

  const canViewTemplates = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("Notification Templates") ||
      hasModuleAccess("Notification Template") ||
      hasModuleAccess("notification_templates") ||
      hasModuleAccess("notification_template") ||
      hasAnyPermission(VIEW_PERMISSION_KEYS),
    [isSuperAdmin, hasModuleAccess, hasAnyPermission],
  );

  const canUpdateTemplates = useMemo(
    () => isSuperAdmin || hasAnyPermission(UPDATE_PERMISSION_KEYS),
    [isSuperAdmin, hasAnyPermission],
  );

  /* =======================================================
     LOGO STATE (same pattern as Orders / ReturnRefund / CreditNotes / Payment)
  ======================================================= */

  const [logoUrl, setLogoUrl] = useState<string | null>(DEFAULT_LOGO_URL);
  const [logoLoading, setLogoLoading] = useState(true);

  /* =======================================================
     STATE
  ======================================================= */
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [allTemplates, setAllTemplates] = useState<
    NotificationTemplate[] | null
  >(null);

  // ✅ first load only — subsequent fetches don't block page
  const [initialTemplatesLoading, setInitialTemplatesLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({
    current_page: 1,
    per_page: PER_PAGE,
    total: 0,
    last_page: 1,
  });
  const [availableEvents, setAvailableEvents] = useState<string[]>([]);
  const [availableChannels, setAvailableChannels] = useState<string[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<NotificationTemplate | null>(null);

  /* =======================================================
     REQUEST REFS
  ======================================================= */
  const pageFetchInFlightRef = useRef<Promise<void> | null>(null);
  const filterFetchInFlightRef = useRef<Promise<void> | null>(null);
  const hasInitialFetchRef = useRef(false);

  /* =======================================================
     LOGO FETCH (same as Orders / ReturnRefund / CreditNotes / Payment)
  ======================================================= */

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

  /* =======================================================
     FILTER ACTIVE
  ======================================================= */
  const isFilterActive =
    search.trim().length > 0 ||
    selectedEvent !== "all" ||
    selectedChannel !== "all";

  /* =======================================================
     FETCH SINGLE API PAGE
     isInitialLoad = true ONLY FOR THE FIRST LOAD
  ======================================================= */
  const fetchPage = useCallback(
    async (
      page: number,
      isRefresh = false,
      force = false,
      isInitialLoad = false,
    ) => {
      if (!canViewTemplates) return;
      if (pageFetchInFlightRef.current) return pageFetchInFlightRef.current;
      if (!force && !isRefresh && hasInitialFetchRef.current && page === 1)
        return;

      const requestPromise = (async () => {
        try {
          if (isRefresh) setRefreshing(true);
          else setLoading(true);

          const response = await notificationTemplateApi.getAll(page);

          if (response.data?.success) {
            const result = response.data;
            setTemplates(result.data || []);

            if (result.meta) {
              setMeta({
                current_page: result.meta.current_page,
                per_page: result.meta.per_page || PER_PAGE,
                total: result.meta.total,
                last_page: result.meta.last_page,
              });
              setCurrentPage(result.meta.current_page);
            }

            if (result.filters) {
              setAvailableEvents(result.filters.event_types || []);
              setAvailableChannels(result.filters.channels || []);
            }

            if (page === 1) hasInitialFetchRef.current = true;
          } else {
            toast.error(result?.message || "Failed to load templates");
          }
        } catch (error: any) {
          console.error("Notification template GET error:", error);
          toast.error(
            error?.response?.data?.message ||
              "Failed to load notification templates",
          );
        } finally {
          setLoading(false);
          setRefreshing(false);

          if (isInitialLoad) {
            setInitialTemplatesLoading(false);
          }
        }
      })();

      pageFetchInFlightRef.current = requestPromise;
      try {
        await requestPromise;
      } finally {
        pageFetchInFlightRef.current = null;
      }
    },
    [canViewTemplates],
  );

  /* =======================================================
     FETCH ALL API PAGES
  ======================================================= */
  const fetchAllTemplates = useCallback(
    async (isRefresh = false) => {
      if (!canViewTemplates) return;
      if (filterFetchInFlightRef.current)
        return filterFetchInFlightRef.current;

      const requestPromise = (async () => {
        try {
          if (isRefresh) setRefreshing(true);
          else setFilterLoading(true);

          const firstResponse = await notificationTemplateApi.getAll(1);

          if (!firstResponse.data?.success) {
            toast.error(
              firstResponse.data?.message || "Failed to load templates",
            );
            return;
          }

          const firstResult = firstResponse.data;
          let combined = firstResult.data || [];
          const lastPage = firstResult.meta?.last_page || 1;

          if (firstResult.meta) {
            setMeta({
              current_page: firstResult.meta.current_page,
              per_page: firstResult.meta.per_page || PER_PAGE,
              total: firstResult.meta.total,
              last_page: firstResult.meta.last_page,
            });
          }

          if (firstResult.filters) {
            setAvailableEvents(firstResult.filters.event_types || []);
            setAvailableChannels(firstResult.filters.channels || []);
          }

          if (lastPage > 1) {
            const pages = Array.from(
              { length: lastPage - 1 },
              (_, index) => index + 2,
            );

            const responses = await Promise.all(
              pages.map((page) => notificationTemplateApi.getAll(page)),
            );

            responses.forEach((response) => {
              if (response.data?.success) {
                combined = [...combined, ...(response.data.data || [])];
              }
            });
          }

          setAllTemplates(combined);
          setCurrentPage(1);
        } catch (error: any) {
          console.error("Notification template ALL pages error:", error);
          toast.error(
            error?.response?.data?.message ||
              "Failed to load notification templates",
          );
        } finally {
          setFilterLoading(false);
          setRefreshing(false);
        }
      })();

      filterFetchInFlightRef.current = requestPromise;
      try {
        await requestPromise;
      } finally {
        filterFetchInFlightRef.current = null;
      }
    },
    [canViewTemplates],
  );

  /* =======================================================
     INITIAL LOAD
     WAIT FOR PERMISSIONS BEFORE REQUESTING TEMPLATES
  ======================================================= */
  useEffect(() => {
    if (permissionsLoading) return;

    if (canViewTemplates && !hasInitialFetchRef.current) {
      void fetchPage(1, false, false, true);
    } else if (!canViewTemplates) {
      setLoading(false);
      setInitialTemplatesLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionsLoading, canViewTemplates, fetchPage]);

  /* =======================================================
     COMBINED INITIAL LOADING
  ======================================================= */

  const pageLoading =
    permissionsLoading ||
    logoLoading ||
    initialTemplatesLoading;

  /* =======================================================
     LOAD COMPLETE DATA WHEN FILTER IS USED
  ======================================================= */
  useEffect(() => {
    if (permissionsLoading || !canViewTemplates) return;
    if (!isFilterActive) return;

    setCurrentPage(1);
    if (!allTemplates) fetchAllTemplates();
  }, [
    permissionsLoading,
    canViewTemplates,
    isFilterActive,
    allTemplates,
    fetchAllTemplates,
  ]);

  /* =======================================================
     EVENT OPTIONS
  ======================================================= */
  const eventOptions = useMemo(() => {
    return [...availableEvents].sort((a, b) =>
      formatEventType(a).localeCompare(formatEventType(b)),
    );
  }, [availableEvents]);

  /* =======================================================
     CHANNEL OPTIONS
  ======================================================= */
  const channelOptions = useMemo(() => {
    return [...availableChannels].sort((a, b) =>
      formatChannel(a).localeCompare(formatChannel(b)),
    );
  }, [availableChannels]);

  /* =======================================================
     FILTERED DATA
  ======================================================= */
  const filteredTemplates = useMemo(() => {
    if (!isFilterActive) return [];
    if (!allTemplates) return [];

    const searchValue = search.trim().toLowerCase();

    return allTemplates.filter((template) => {
      const eventMatch =
        selectedEvent === "all" || template.event_type === selectedEvent;

      const normalizedTemplateChannel =
        template.channel?.toLowerCase() === "mail"
          ? "email"
          : template.channel?.toLowerCase();

      const normalizedSelectedChannel =
        selectedChannel === "mail"
          ? "email"
          : selectedChannel.toLowerCase();

      const channelMatch =
        selectedChannel === "all" ||
        normalizedTemplateChannel === normalizedSelectedChannel;

      const searchMatch =
        !searchValue ||
        template.event_type?.toLowerCase().includes(searchValue) ||
        template.subject?.toLowerCase().includes(searchValue) ||
        template.body?.toLowerCase().includes(searchValue) ||
        template.channel?.toLowerCase().includes(searchValue) ||
        formatChannel(template.channel).toLowerCase().includes(searchValue) ||
        formatEventType(template.event_type)
          .toLowerCase()
          .includes(searchValue) ||
        template.id?.toString().includes(searchValue);

      return eventMatch && channelMatch && searchMatch;
    });
  }, [allTemplates, isFilterActive, search, selectedEvent, selectedChannel]);

  /* =======================================================
     DISPLAY DATA
  ======================================================= */
  const displayTemplates = useMemo(() => {
    if (!isFilterActive) return templates;
    if (!allTemplates) return [];

    const startIndex = (currentPage - 1) * PER_PAGE;
    const endIndex = startIndex + PER_PAGE;
    return filteredTemplates.slice(startIndex, endIndex);
  }, [
    templates,
    allTemplates,
    filteredTemplates,
    currentPage,
    isFilterActive,
  ]);

  /* =======================================================
     PAGINATION TOTAL
  ======================================================= */
  const totalPages = isFilterActive
    ? Math.max(1, Math.ceil(filteredTemplates.length / PER_PAGE))
    : Math.max(1, meta.last_page);

  /* =======================================================
     PAGE NUMBERS
  ======================================================= */
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    if (currentPage <= 3) return [1, 2, 3, 4, 5];

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

  /* =======================================================
     RESULT TOTAL
  ======================================================= */
  const resultTotal = isFilterActive ? filteredTemplates.length : meta.total;

  /* =======================================================
     SHOWING RANGE
  ======================================================= */
  const showingFrom = resultTotal === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1;
  const showingTo = Math.min(currentPage * PER_PAGE, resultTotal);

  /* =======================================================
     RESET FILTERS
  ======================================================= */
  const resetFilters = async () => {
    setSearch("");
    setSelectedEvent("all");
    setSelectedChannel("all");
    setCurrentPage(1);
    setAllTemplates(null);
    await fetchPage(1, false, true);
  };

  /* =======================================================
     EDIT
  ======================================================= */
  const handleEdit = (template: NotificationTemplate) => {
    if (!canUpdateTemplates) {
      toast.error(
        "You do not have permission to edit notification templates.",
      );
      return;
    }
    setSelectedTemplate(template);
    setEditOpen(true);
  };

  /* =======================================================
     UPDATE
  ======================================================= */
  const handleUpdate = async (id: number, subject: string, body: string) => {
    if (!canUpdateTemplates) {
      toast.error(
        "You do not have permission to update notification templates.",
      );
      return;
    }

    try {
      setUpdating(true);
      const response = await notificationTemplateApi.update(id, {
        subject,
        body,
      });

      if (response.data?.success) {
        toast.success("Template updated successfully");
        setEditOpen(false);
        setSelectedTemplate(null);

        if (isFilterActive) {
          await fetchAllTemplates(true);
        } else {
          await fetchPage(currentPage, true, true);
        }
      } else {
        toast.error(response.data?.message || "Failed to update template");
      }
    } catch (error: any) {
      console.error("Notification template UPDATE error:", error);
      toast.error(
        error?.response?.data?.message || "Failed to update template",
      );
    } finally {
      setUpdating(false);
    }
  };

  /* =======================================================
     PAGE CHANGE
  ======================================================= */
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;

    if (isFilterActive) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    fetchPage(page);
  };

  if (pageLoading) {
    return <PermissionLoadingState logoUrl={logoUrl} />;
  }

  if (!canViewTemplates) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#F4F8FD] p-6 font-poppins">
        <div className="max-w-md rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#C23B32]">
            <FiAlertCircle size={26} />
          </div>
          <h2 className="mt-5 text-lg font-bold text-[#111827]">
            Access Denied
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#6B7280]">
            You do not have permission to view notification templates.
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */
  return (
    <div className="min-h-screen bg-white p-4 font-poppins sm:p-5 lg:p-7">
      <div className="mx-auto max-w-[1550px]">
        {/* PAGE HEADER */}
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2D6FE8]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#4F8FF7]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#2D6FE8]">
                System Configuration
              </span>
            </div>

            <h1 className="text-[20px] font-medium tracking-tight text-[#111827] sm:text-[22px]">
              Notification Templates
            </h1>

            <p className="mt-0.5 max-w-[700px] text-sm text-[#111827]">
              Manage the subject and body content used for system
              notifications across different channels.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (isFilterActive) {
                fetchAllTemplates(true);
              } else {
                fetchPage(currentPage, true, true);
              }
            }}
            disabled={refreshing || filterLoading}
            className="flex h-11 w-fit items-center gap-2 rounded-xl border border-[#2D6FE8]/20 bg-white px-4 text-sm font-bold text-[#2D6FE8] transition hover:border-[#4F8FF7]/40 hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiRefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* MAIN CARD */}
        <div className="relative mt-6 overflow-hidden rounded-[22px] border border-[#DCE6F2] bg-white shadow-[0_8px_30px_rgba(45,111,232,0.06)]">
     
          {/* FILTER HEADER */}
          <div className="border-b border-[#DCE6F2] p-4 sm:p-5">
            <div className="flex flex-col gap-4">
              {/* SEARCH ROW */}
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="relative w-full xl:max-w-[430px]">
                  <FiSearch
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D6FE8]"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search event, subject, body or ID..."
                    className="h-11 w-full rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] pl-10 pr-4 text-sm text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#4F8FF7]/10"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B7280]">
                  <span>
                    Page{" "}
                    <strong className="text-[#111827]">{currentPage}</strong>{" "}
                    of{" "}
                    <strong className="text-[#111827]">{totalPages}</strong>
                  </span>

                  <span className="hidden text-[#DCE6F2] sm:inline">|</span>

                  <span>
                    {resultTotal}{" "}
                    {resultTotal === 1 ? "template" : "templates"}
                  </span>
                </div>
              </div>

              {/* FILTER ROW */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {/* EVENT */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
                    Event Type
                  </label>

                  <select
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="h-11 w-full rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] px-3 text-sm font-medium text-[#111827] outline-none transition focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/10"
                  >
                    <option value="all">All Events</option>
                    {eventOptions.map((event) => (
                      <option key={event} value={event}>
                        {formatEventType(event)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CHANNEL */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
                    Channel
                  </label>

                  <select
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="h-11 w-full rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] px-3 text-sm font-medium text-[#111827] outline-none transition focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/10"
                  >
                    <option value="all">All Channels</option>
                    {channelOptions.map((channel) => (
                      <option key={channel} value={channel}>
                        {formatChannel(channel)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* RESET */}
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="h-11 w-full rounded-xl border border-[#2D6FE8]/20 bg-[#EAF3FF] px-4 text-sm font-bold text-[#2D6FE8] transition hover:bg-[#2D6FE8] hover:text-white"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* FILTER LOADING */}
          {isFilterActive && filterLoading && (
            <div className="border-b border-[#DCE6F2] bg-[#F8FBFF] px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#6B7280]">
                <FiRefreshCw
                  size={13}
                  className="animate-spin text-[#2D6FE8]"
                />
                Loading all templates for filtering...
              </div>
            </div>
          )}

          {/* DESKTOP TABLE */}
          <div className="hidden lg:block">
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-[55px]" />
                <col className="w-[19%]" />
                <col className="w-[10%]" />
                <col className="w-[24%]" />
                <col className="w-[31%]" />
                <col className="w-[11%]" />
              </colgroup>
              <thead>
                <tr className="bg-[#4F8FF7]">
                  {/* ✅ S.No. */}
                  <th className="rounded-tl-2xl px-3 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-white">
                    S.No.
                  </th>

                  <th className="px-3 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-white">
                    Event
                  </th>

                  <th className="px-3 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-white">
                    Channel
                  </th>

                  <th className="px-3 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-white">
                    Subject
                  </th>

                  <th className="px-3 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-white">
                    Body
                  </th>

                  <th className="rounded-tr-2xl px-3 py-3.5 text-right text-[9px] font-bold uppercase tracking-[0.1em] text-white">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {/* ✅ initialTemplatesLoading par full spinner — refresh/pagination par nahi */}
                {initialTemplatesLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="mx-auto max-w-sm">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF3FF] text-[#2D6FE8]">
                          <FiRefreshCw size={22} className="animate-spin" />
                        </div>
                        <p className="mt-4 text-sm font-bold text-[#111827]">
                          Loading notification templates...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : loading && templates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="mx-auto max-w-sm">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF3FF] text-[#2D6FE8]">
                          <FiRefreshCw size={22} className="animate-spin" />
                        </div>
                        <p className="mt-4 text-sm font-bold text-[#111827]">
                          Loading notification templates...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : displayTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="mx-auto max-w-sm">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF3FF] text-[#2D6FE8]">
                          <FiSearch size={20} />
                        </div>
                        <p className="mt-4 text-sm font-bold text-[#111827]">
                          No templates found
                        </p>
                        <p className="mt-1 text-xs leading-5 text-[#6B7280]">
                          Change your search or filter to find another
                          template.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayTemplates.map((template, index) => {
                    // ✅ Continuous S.No. across pages
                    const serialNumber =
                      (currentPage - 1) * PER_PAGE + index + 1;

                    return (
                      <motion.tr
                        key={template.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border-b border-[#DCE6F2] bg-white transition hover:bg-[#F8FBFF]"
                      >
                        {/* ✅ S.NO */}
                        <td className="px-3 py-3 align-top">
                          <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#EAF3FF] text-[10px] font-bold text-[#2D6FE8]">
                            {serialNumber}
                          </span>
                        </td>

                        {/* EVENT */}
                        <td className="px-3 py-3 align-top">
                          <p className="text-xs font-bold leading-5 text-[#111827]">
                            {formatEventType(template.event_type)}
                          </p>
                          <p className="mt-1 text-[10px] text-[#6B7280]">
                            Updated {formatDate(template.updated_at)}
                          </p>
                        </td>

                        {/* CHANNEL */}
                        <td className="px-3 py-3 align-top">
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#2D6FE8]/25 bg-[#EAF3FF] px-2.5 py-1.5 text-[10px] font-bold text-[#2D6FE8]">
                            {getChannelIcon(template.channel)}
                            {formatChannel(template.channel)}
                          </span>
                        </td>

                        {/* SUBJECT */}
                        <td className="px-3 py-3 align-top">
                          <p className="line-clamp-3 text-xs font-bold leading-5 text-[#111827]">
                            {template.subject}
                          </p>
                        </td>

                        {/* BODY */}
                        <td className="px-3 py-3 align-top">
                          <p className="line-clamp-3 text-[11px] leading-5 text-[#6B7280]">
                            {template.body}
                          </p>
                        </td>

                        {/* ACTION */}
                        <td className="px-3 py-3 text-right align-top">
                          {canUpdateTemplates ? (
                            <button
                              type="button"
                              onClick={() => handleEdit(template)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#2D6FE8]/15 bg-[#EAF3FF] px-2.5 py-1.5 text-[10px] font-bold text-[#2D6FE8] transition hover:bg-[#2D6FE8] hover:text-white"
                            >
                              <FiEdit3 size={12} />
                              Edit
                            </button>
                          ) : (
                            <span className="inline-flex items-center rounded-lg border border-[#DCE6F2] bg-[#F4F8FD] px-2.5 py-1.5 text-[9px] font-bold text-[#6B7280]">
                              View Only
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS */}
          <div className="block divide-y divide-[#DCE6F2] lg:hidden">
            {/* ✅ initialTemplatesLoading par full spinner — refresh/pagination par nahi */}
            {initialTemplatesLoading ? (
              <div className="px-5 py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF3FF] text-[#2D6FE8]">
                  <FiRefreshCw size={22} className="animate-spin" />
                </div>
                <p className="mt-4 text-sm font-bold text-[#111827]">
                  Loading notification templates...
                </p>
              </div>
            ) : loading && templates.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF3FF] text-[#2D6FE8]">
                  <FiRefreshCw size={22} className="animate-spin" />
                </div>
                <p className="mt-4 text-sm font-bold text-[#111827]">
                  Loading notification templates...
                </p>
              </div>
            ) : displayTemplates.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF3FF] text-[#2D6FE8]">
                  <FiSearch size={20} />
                </div>
                <p className="mt-4 text-sm font-bold text-[#111827]">
                  No templates found
                </p>
                <p className="mt-1 text-xs text-[#6B7280]">
                  Try changing your search or filters.
                </p>
              </div>
            ) : (
              displayTemplates.map((template, index) => {
                // ✅ Continuous S.No.
                const serialNumber =
                  (currentPage - 1) * PER_PAGE + index + 1;

                return (
                  <div key={template.id} className="bg-white p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        {/* ✅ S.NO badge */}
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EAF3FF] text-[10px] font-bold text-[#2D6FE8]">
                          {serialNumber}
                        </span>

                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#2D6FE8]">
                            {formatChannel(template.channel)}
                          </p>
                          <h3 className="mt-1 text-sm font-bold leading-5 text-[#111827]">
                            {formatEventType(template.event_type)}
                          </h3>
                        </div>
                      </div>

                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#2D6FE8]/25 bg-[#EAF3FF] px-2.5 py-1 text-[10px] font-bold text-[#2D6FE8]">
                        {getChannelIcon(template.channel)}
                        {formatChannel(template.channel)}
                      </span>
                    </div>

                    <div className="mt-4 rounded-xl border border-[#DCE6F2] bg-[#F8FBFF] p-3.5">
                      <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                        Subject
                      </p>
                      <p className="text-sm font-bold leading-5 text-[#111827]">
                        {template.subject}
                      </p>
                    </div>

                    <div className="mt-3 rounded-xl border border-[#DCE6F2] bg-white p-3.5">
                      <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                        Body
                      </p>
                      <p className="text-xs leading-5 text-[#6B7280]">
                        {template.body}
                      </p>
                    </div>

                    {template.placeholders?.length > 0 && (
                      <div className="mt-3">
                        <p className="mb-2 text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                          Placeholders
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {template.placeholders.slice(0, 5).map((placeholder) => (
                            <span
                              key={placeholder}
                              className="rounded-md border border-[#2D6FE8]/25 bg-[#EAF3FF] px-2 py-1 font-mono text-[10px] font-bold text-[#2D6FE8]"
                            >
                              {`{{${placeholder}}}`}
                            </span>
                          ))}
                          {template.placeholders.length > 5 && (
                            <span className="rounded-md bg-[#F4F8FD] px-2 py-1 text-[10px] font-bold text-[#6B7280]">
                              +{template.placeholders.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-[10px] text-[#6B7280]">
                        Updated {formatDate(template.updated_at)}
                      </p>

                      {canUpdateTemplates ? (
                        <button
                          type="button"
                          onClick={() => handleEdit(template)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-3.5 py-2 text-xs font-bold text-white shadow-[0_8px_18px_-8px_rgba(45,111,232,0.6)] transition hover:-translate-y-0.5"
                        >
                          <FiEdit3 size={14} />
                          Edit
                        </button>
                      ) : (
                        <span className="rounded-lg border border-[#DCE6F2] bg-[#F4F8FD] px-3.5 py-2 text-[10px] font-bold text-[#6B7280]">
                          View Only
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* PAGINATION */}
          {!pageLoading && resultTotal > 0 && totalPages > 1 && (
            <div className="flex flex-col gap-3 border-t border-[#DCE6F2] bg-[#F8FBFF] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="text-xs text-[#6B7280]">
                Showing{" "}
                <span className="font-bold text-[#111827]">{showingFrom}</span>{" "}
                -{" "}
                <span className="font-bold text-[#111827]">{showingTo}</span>{" "}
                of{" "}
                <span className="font-bold text-[#111827]">{resultTotal}</span>
              </div>

              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  disabled={
                    currentPage === 1 || refreshing || filterLoading
                  }
                  onClick={() => goToPage(currentPage - 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiChevronLeft size={16} />
                </button>

                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    type="button"
                    disabled={refreshing || filterLoading}
                    onClick={() => goToPage(page)}
                    className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
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
                  disabled={
                    currentPage === totalPages || refreshing || filterLoading
                  }
                  onClick={() => goToPage(currentPage + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EDIT MODAL */}
      <EditTemplateModal
        template={selectedTemplate}
        open={editOpen}
        loading={updating}
        canUpdate={canUpdateTemplates}
        onClose={() => {
          if (!updating) {
            setEditOpen(false);
            setSelectedTemplate(null);
          }
        }}
        onSave={handleUpdate}
      />
    </div>
  );
};

export default NotificationTemplates;