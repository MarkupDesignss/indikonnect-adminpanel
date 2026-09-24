"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  motion,
  AnimatePresence,
} from "framer-motion";
import toast from "react-hot-toast";

import {
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

import type {
  NotificationTemplate,
} from "../../api/endpoints/notificationTemplates";

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

  if (channel.toLowerCase() === "mail") {
    return "Email";
  }

  return (
    channel.charAt(0).toUpperCase() +
    channel.slice(1).toLowerCase()
  );
};

const getChannelIcon = (channel: string) => {
  const value = channel?.toLowerCase();

  if (value === "mail" || value === "email") {
    return <FiMail size={14} />;
  }

  if (value === "database") {
    return <FiDatabase size={14} />;
  }

  if (value === "sms") {
    return <FiMessageSquare size={14} />;
  }

  return <FiBell size={14} />;
};

const formatDate = (dateString: string) => {
  if (!dateString) return "-";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* =========================================================
   EDIT MODAL
========================================================= */

interface EditTemplateModalProps {
  template: NotificationTemplate | null;
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onSave: (
    id: number,
    subject: string,
    body: string
  ) => Promise<void>;
}

const EditTemplateModal = ({
  template,
  open,
  loading,
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

  if (!open || !template) {
    return null;
  }

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!subject.trim()) {
      toast.error("Subject is required");
      return;
    }

    if (!body.trim()) {
      toast.error("Body is required");
      return;
    }

    await onSave(
      template.id,
      subject.trim(),
      body.trim()
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[3px]">
        <motion.div
          initial={{
            opacity: 0,
            y: 18,
            scale: 0.97,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            y: 18,
            scale: 0.97,
          }}
          transition={{ duration: 0.2 }}
          className="flex max-h-[92vh] w-full max-w-[820px] flex-col overflow-hidden rounded-2xl border border-[#D8E2D8] bg-white shadow-[0_25px_70px_rgba(22,63,32,0.14)]"
        >
          {/* HEADER */}
          <div className="flex items-start justify-between border-b border-[#E5EAE5] px-5 py-5 sm:px-6">
            <div className="min-w-0 pr-4">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#4C8A57]">
                Notification Template
              </p>

              <h2 className="text-xl font-semibold text-[#202721]">
                Edit Template
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-[#EAF3EA] px-2.5 py-1 text-xs font-semibold text-[#163F20]">
                  {formatEventType(
                    template.event_type
                  )}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-md border border-[#D8E2D8] bg-white px-2.5 py-1 text-xs font-medium text-[#59645C]">
                  {getChannelIcon(template.channel)}
                  {formatChannel(template.channel)}
                </span>

              
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#59645C] transition hover:bg-[#EAF3EA] hover:text-[#163F20] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiX size={19} />
            </button>
          </div>

          {/* BODY */}
          <form
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              <div className="space-y-5">
                {/* SUBJECT */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#202721]">
                    Subject
                  </label>

                  <input
                    type="text"
                    value={subject}
                    onChange={(e) =>
                      setSubject(e.target.value)
                    }
                    placeholder="Enter notification subject"
                    className="h-12 w-full rounded-xl border border-[#D8E2D8] bg-white px-4 text-sm text-[#202721] outline-none transition placeholder:text-[#89918B] focus:border-[#4C8A57] focus:ring-4 focus:ring-[#4C8A57]/10"
                  />
                </div>

                {/* BODY */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#202721]">
                    Body
                  </label>

                  <textarea
                    rows={9}
                    value={body}
                    onChange={(e) =>
                      setBody(e.target.value)
                    }
                    placeholder="Enter notification body"
                    className="w-full resize-y rounded-xl border border-[#D8E2D8] bg-white px-4 py-3 text-sm leading-6 text-[#202721] outline-none transition placeholder:text-[#89918B] focus:border-[#4C8A57] focus:ring-4 focus:ring-[#4C8A57]/10"
                  />
                </div>

                {/* PLACEHOLDERS */}
                {template.placeholders?.length > 0 && (
                  <div className="rounded-xl border border-[#D5E5D6] bg-[#EAF3EA] p-4 sm:p-5">
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-[#202721]">
                        Available Placeholders
                      </p>

                      <p className="mt-1 text-xs text-[#59645C]">
                        Use these dynamic values inside
                        subject or body.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {template.placeholders.map(
                        (placeholder) => (
                          <span
                            key={placeholder}
                            className="rounded-lg border border-[#D5E5D6] bg-white px-2.5 py-1.5 font-mono text-[11px] font-medium text-[#163F20]"
                          >
                            {`{{${placeholder}}}`}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* INFO */}
                <div className="rounded-xl border border-[#D5E5D6] bg-[#EAF3EA] px-4 py-3.5">
                  <p className="text-xs leading-5 text-[#163F20]">
                    Only <strong>Subject</strong> and{" "}
                    <strong>Body</strong> will be updated.
                    Event type, channel and placeholders
                    are managed by the system.
                  </p>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex flex-col-reverse gap-3 border-t border-[#E5EAE5] bg-[#F5F7F5] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="h-11 rounded-xl border border-[#D8E2D8] bg-white px-5 text-sm font-semibold text-[#3F4A41] transition hover:bg-[#FAFBFA] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4C8A57] via-[#163F20] to-[#0F3219] px-5 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(22,63,32,0.6)] transition hover:shadow-[0_12px_22px_-8px_rgba(22,63,32,0.7)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <FiRefreshCw
                      size={15}
                      className="animate-spin"
                    />
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
     CURRENT API PAGE DATA
  ======================================================= */

  const [templates, setTemplates] = useState<
    NotificationTemplate[]
  >([]);

  /* =======================================================
     COMPLETE DATA
     Loaded only when search/filter is activated.
  ======================================================= */

  const [allTemplates, setAllTemplates] =
    useState<NotificationTemplate[] | null>(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [filterLoading, setFilterLoading] =
    useState(false);

  const [updating, setUpdating] =
    useState(false);

  const [search, setSearch] = useState("");

  const [selectedEvent, setSelectedEvent] =
    useState("all");

  const [selectedChannel, setSelectedChannel] =
    useState("all");

  const [currentPage, setCurrentPage] = useState(1);

  const [meta, setMeta] = useState({
    current_page: 1,
    per_page: PER_PAGE,
    total: 0,
    last_page: 1,
  });

  const [availableEvents, setAvailableEvents] =
    useState<string[]>([]);

  const [availableChannels, setAvailableChannels] =
    useState<string[]>([]);

  const [editOpen, setEditOpen] =
    useState(false);

  const [selectedTemplate, setSelectedTemplate] =
    useState<NotificationTemplate | null>(null);

  const filterRequestRunning =
    useRef(false);

  /* =======================================================
     FILTER ACTIVE
  ======================================================= */

  const isFilterActive =
    search.trim().length > 0 ||
    selectedEvent !== "all" ||
    selectedChannel !== "all";

  /* =======================================================
     FETCH SINGLE API PAGE
  ======================================================= */

  const fetchPage = async (
    page: number,
    isRefresh = false
  ) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response =
        await notificationTemplateApi.getAll(page);

      if (response.data?.success) {
        const result = response.data;

        setTemplates(result.data || []);

        if (result.meta) {
          setMeta({
            current_page:
              result.meta.current_page,
            per_page:
              result.meta.per_page || PER_PAGE,
            total:
              result.meta.total,
            last_page:
              result.meta.last_page,
          });

          setCurrentPage(
            result.meta.current_page
          );
        }

        if (result.filters) {
          setAvailableEvents(
            result.filters.event_types || []
          );

          setAvailableChannels(
            result.filters.channels || []
          );
        }
      } else {
        toast.error(
          response.data?.message ||
            "Failed to load templates"
        );
      }
    } catch (error: any) {
      console.error(
        "Notification template GET error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to load notification templates"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* =======================================================
     FETCH ALL API PAGES
     Used for complete-data filtering
  ======================================================= */

  const fetchAllTemplates = async (
    isRefresh = false
  ) => {
    if (filterRequestRunning.current) {
      return;
    }

    try {
      filterRequestRunning.current = true;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setFilterLoading(true);
      }

      const firstResponse =
        await notificationTemplateApi.getAll(1);

      if (!firstResponse.data?.success) {
        toast.error(
          firstResponse.data?.message ||
            "Failed to load templates"
        );

        return;
      }

      const firstResult = firstResponse.data;

      let combined =
        firstResult.data || [];

      const lastPage =
        firstResult.meta?.last_page || 1;

      if (firstResult.meta) {
        setMeta({
          current_page:
            firstResult.meta.current_page,
          per_page:
            firstResult.meta.per_page ||
            PER_PAGE,
          total:
            firstResult.meta.total,
          last_page:
            firstResult.meta.last_page,
        });
      }

      if (firstResult.filters) {
        setAvailableEvents(
          firstResult.filters.event_types || []
        );

        setAvailableChannels(
          firstResult.filters.channels || []
        );
      }

      /* -----------------------------------------------
         FETCH REMAINING PAGES
      ------------------------------------------------ */

      if (lastPage > 1) {
        const pages = Array.from(
          { length: lastPage - 1 },
          (_, index) => index + 2
        );

        const responses =
          await Promise.all(
            pages.map((page) =>
              notificationTemplateApi.getAll(
                page
              )
            )
          );

        responses.forEach((response) => {
          if (response.data?.success) {
            combined = [
              ...combined,
              ...(response.data.data || []),
            ];
          }
        });
      }

      setAllTemplates(combined);
      setCurrentPage(1);
    } catch (error: any) {
      console.error(
        "Notification template ALL pages error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to load notification templates"
      );
    } finally {
      filterRequestRunning.current = false;
      setFilterLoading(false);
      setRefreshing(false);
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    fetchPage(1);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =======================================================
     LOAD COMPLETE DATA WHEN FILTER IS USED
  ======================================================= */

  useEffect(() => {
    if (!isFilterActive) {
      return;
    }

    setCurrentPage(1);

    if (!allTemplates) {
      fetchAllTemplates();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isFilterActive,
    allTemplates,
  ]);

  /* =======================================================
     AVAILABLE EVENTS
     
     API filters are used so values can come even when
     current page doesn't contain them.
  ======================================================= */

  const eventOptions = useMemo(() => {
    return [...availableEvents].sort((a, b) =>
      formatEventType(a).localeCompare(
        formatEventType(b)
      )
    );
  }, [availableEvents]);

  /* =======================================================
     AVAILABLE CHANNELS
  ======================================================= */

  const channelOptions = useMemo(() => {
    return [...availableChannels].sort((a, b) =>
      formatChannel(a).localeCompare(
        formatChannel(b)
      )
    );
  }, [availableChannels]);

  /* =======================================================
     FILTER COMPLETE DATA
  ======================================================= */

  const filteredTemplates = useMemo(() => {
    if (!isFilterActive) {
      return [];
    }

    if (!allTemplates) {
      return [];
    }

    const searchValue =
      search.trim().toLowerCase();

    return allTemplates.filter((template) => {
      /* EVENT */
      const eventMatch =
        selectedEvent === "all" ||
        template.event_type === selectedEvent;

      /* CHANNEL */
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
        normalizedTemplateChannel ===
          normalizedSelectedChannel;

      /* SEARCH */
      const searchMatch =
        !searchValue ||
        template.event_type
          ?.toLowerCase()
          .includes(searchValue) ||
        template.subject
          ?.toLowerCase()
          .includes(searchValue) ||
        template.body
          ?.toLowerCase()
          .includes(searchValue) ||
        template.channel
          ?.toLowerCase()
          .includes(searchValue) ||
        formatChannel(template.channel)
          .toLowerCase()
          .includes(searchValue) ||
        formatEventType(template.event_type)
          .toLowerCase()
          .includes(searchValue) ||
        template.id
          ?.toString()
          .includes(searchValue);

      return (
        eventMatch &&
        channelMatch &&
        searchMatch
      );
    });
  }, [
    allTemplates,
    isFilterActive,
    search,
    selectedEvent,
    selectedChannel,
  ]);

  /* =======================================================
     DATA TO DISPLAY
  ======================================================= */

  const displayTemplates = useMemo(() => {
    if (!isFilterActive) {
      return templates;
    }

    if (!allTemplates) {
      return [];
    }

    const startIndex =
      (currentPage - 1) * PER_PAGE;

    const endIndex =
      startIndex + PER_PAGE;

    return filteredTemplates.slice(
      startIndex,
      endIndex
    );
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
    ? Math.max(
        1,
        Math.ceil(
          filteredTemplates.length /
            PER_PAGE
        )
      )
    : Math.max(
        1,
        meta.last_page
      );

  /* =======================================================
     PAGINATION PAGE NUMBERS
  ======================================================= */

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];

    if (totalPages <= 5) {
      for (
        let i = 1;
        i <= totalPages;
        i++
      ) {
        pages.push(i);
      }

      return pages;
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5];
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

  /* =======================================================
     RESULT TOTAL
  ======================================================= */

  const resultTotal = isFilterActive
    ? filteredTemplates.length
    : meta.total;

  /* =======================================================
     SHOWING RANGE
  ======================================================= */

  const showingFrom =
    resultTotal === 0
      ? 0
      : (currentPage - 1) *
          PER_PAGE +
        1;

  const showingTo = Math.min(
    currentPage * PER_PAGE,
    resultTotal
  );

  /* =======================================================
     RESET FILTERS
  ======================================================= */

  const resetFilters = () => {
    setSearch("");
    setSelectedEvent("all");
    setSelectedChannel("all");
    setCurrentPage(1);

    // Go back to API pagination.
    fetchPage(1);
  };

  /* =======================================================
     EDIT
  ======================================================= */

  const handleEdit = (
    template: NotificationTemplate
  ) => {
    setSelectedTemplate(template);
    setEditOpen(true);
  };

  /* =======================================================
     UPDATE
  ======================================================= */

  const handleUpdate = async (
    id: number,
    subject: string,
    body: string
  ) => {
    try {
      setUpdating(true);

      const response =
        await notificationTemplateApi.update(
          id,
          {
            subject,
            body,
          }
        );

      if (response.data?.success) {
        toast.success(
          "Template updated successfully"
        );

        setEditOpen(false);
        setSelectedTemplate(null);

        /* ---------------------------------------------
           Refresh according to current state
        --------------------------------------------- */

        if (isFilterActive) {
          await fetchAllTemplates(true);
        } else {
          await fetchPage(
            currentPage,
            true
          );
        }
      } else {
        toast.error(
          response.data?.message ||
            "Failed to update template"
        );
      }
    } catch (error: any) {
      console.error(
        "Notification template UPDATE error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to update template"
      );
    } finally {
      setUpdating(false);
    }
  };

  /* =======================================================
     PAGE CHANGE
  ======================================================= */

  const goToPage = (page: number) => {
    if (
      page < 1 ||
      page > totalPages ||
      page === currentPage
    ) {
      return;
    }

    /* ---------------------------------------------
       FILTER MODE
       Local pagination
    --------------------------------------------- */

    if (isFilterActive) {
      setCurrentPage(page);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    /* ---------------------------------------------
       NORMAL MODE
       API pagination
    --------------------------------------------- */

    fetchPage(page);
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-full bg-[#F5F7F5] p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1550px]">
          <div className="flex min-h-[500px] items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_6px_24px_rgba(22,63,32,0.05)]">
                <FiRefreshCw
                  size={22}
                  className="animate-spin text-[#4C8A57]"
                />
              </div>

              <p className="mt-4 text-sm font-medium text-[#59645C]">
                Loading notification templates...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-full bg-[#F5F7F5] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1550px]">
        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#4C8A57]">
              System Configuration
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#202721] sm:text-3xl">
              Notification Templates
            </h1>

            <p className="mt-1.5 max-w-[700px] text-sm leading-6 text-[#59645C]">
              Manage the subject and body content used
              for system notifications across different
              channels.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (isFilterActive) {
                fetchAllTemplates(true);
              } else {
                fetchPage(
                  currentPage,
                  true
                );
              }
            }}
            disabled={
              refreshing ||
              filterLoading
            }
            className="inline-flex h-11 w-fit items-center gap-2 rounded-xl border border-[#D5E5D6] bg-white px-4 text-sm font-semibold text-[#163F20] shadow-[0_6px_24px_rgba(22,63,32,0.05)] transition hover:border-[#4C8A57] hover:bg-[#EAF3EA] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiRefreshCw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>
        </div>

        {/* =================================================
            MAIN CARD
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white shadow-[0_8px_30px_rgba(22,63,32,0.06)]">
          {/* TOP ACCENT */}
          <div className="h-[3px] w-full bg-gradient-to-r from-[#4C8A57] via-[#163F20] to-[#0F3219]" />

          {/* FILTER HEADER */}
          <div className="border-b border-[#E5EAE5] p-4 sm:p-5">
            <div className="flex flex-col gap-4">
              {/* SEARCH */}
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="relative w-full xl:max-w-[430px]">
                  <FiSearch
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#89918B]"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                    placeholder="Search event, subject, body or ID..."
                    className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-[#FAFBFA] pl-10 pr-4 text-sm text-[#202721] outline-none transition placeholder:text-[#89918B] focus:border-[#4C8A57] focus:bg-white focus:ring-4 focus:ring-[#4C8A57]/10"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-[#59645C]">
                  <span>
                    Page{" "}
                    <strong className="text-[#202721]">
                      {currentPage}
                    </strong>{" "}
                    of{" "}
                    <strong className="text-[#202721]">
                      {totalPages}
                    </strong>
                  </span>

                  <span className="hidden text-[#D8E2D8] sm:inline">
                    |
                  </span>

                  <span>
                    {resultTotal}{" "}
                    {resultTotal === 1
                      ? "template"
                      : "templates"}
                  </span>
                </div>
              </div>

              {/* FILTERS */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {/* EVENT */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#89918B]">
                    Event Type
                  </label>

                  <select
                    value={selectedEvent}
                    onChange={(e) =>
                      setSelectedEvent(
                        e.target.value
                      )
                    }
                    className="h-10 w-full rounded-lg border border-[#D8E2D8] bg-white px-3 text-sm text-[#3F4A41] outline-none transition focus:border-[#4C8A57] focus:ring-4 focus:ring-[#4C8A57]/10"
                  >
                    <option value="all">
                      All Events
                    </option>

                    {eventOptions.map(
                      (event) => (
                        <option
                          key={event}
                          value={event}
                        >
                          {formatEventType(
                            event
                          )}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* CHANNEL */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#89918B]">
                    Channel
                  </label>

                  <select
                    value={selectedChannel}
                    onChange={(e) =>
                      setSelectedChannel(
                        e.target.value
                      )
                    }
                    className="h-10 w-full rounded-lg border border-[#D8E2D8] bg-white px-3 text-sm text-[#3F4A41] outline-none transition focus:border-[#4C8A57] focus:ring-4 focus:ring-[#4C8A57]/10"
                  >
                    <option value="all">
                      All Channels
                    </option>

                    {channelOptions.map(
                      (channel) => (
                        <option
                          key={channel}
                          value={channel}
                        >
                          {formatChannel(
                            channel
                          )}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* RESET */}
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="h-10 w-full rounded-lg border border-[#D5E5D6] bg-[#EAF3EA] px-4 text-sm font-semibold text-[#163F20] transition hover:border-[#4C8A57] hover:bg-[#D5E5D6]"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              FILTER LOADING
          ================================================= */}

          {isFilterActive &&
            filterLoading && (
              <div className="border-b border-[#E5EAE5] bg-[#FAFBFA] px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-medium text-[#59645C]">
                  <FiRefreshCw
                    size={13}
                    className="animate-spin text-[#4C8A57]"
                  />
                  Loading all templates for
                  filtering...
                </div>
              </div>
            )}

          {/* =================================================
              DESKTOP TABLE
          ================================================= */}

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1080px]">
              <thead>
                <tr className="border-b border-[#E5EAE5] bg-[#FAFBFA]">
                  <th className="w-[230px] px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.13em] text-[#89918B]">
                    Event
                  </th>

                  <th className="w-[120px] px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.13em] text-[#89918B]">
                    Channel
                  </th>

                  <th className="w-[270px] px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.13em] text-[#89918B]">
                    Subject
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.13em] text-[#89918B]">
                    Body
                  </th>

                  <th className="w-[120px] px-5 py-4 text-right text-[10px] font-bold uppercase tracking-[0.13em] text-[#89918B]">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {displayTemplates.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-20 text-center"
                    >
                      <div className="mx-auto max-w-sm">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF3EA] text-[#4C8A57]">
                          <FiSearch size={20} />
                        </div>

                        <p className="mt-4 text-sm font-semibold text-[#202721]">
                          No templates found
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#59645C]">
                          Change your search or
                          filter to find another
                          template.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayTemplates.map(
                    (template) => (
                      <tr
                        key={template.id}
                        className="border-b border-[#EEF2EE] transition hover:bg-[#FAFBFA]"
                      >
                        {/* EVENT */}
                        <td className="px-5 py-5 align-top">
                          <p className="text-sm font-semibold leading-5 text-[#202721]">
                            {formatEventType(
                              template.event_type
                            )}
                          </p>

                          
                          <p className="mt-2 text-[10px] text-[#89918B]">
                            Updated{" "}
                            {formatDate(
                              template.updated_at
                            )}
                          </p>
                        </td>

                        {/* CHANNEL */}
                        <td className="px-5 py-5 align-top">
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#D5E5D6] bg-[#EAF3EA] px-2.5 py-1.5 text-xs font-semibold text-[#163F20]">
                            {getChannelIcon(
                              template.channel
                            )}
                            {formatChannel(
                              template.channel
                            )}
                          </span>
                        </td>

                        {/* SUBJECT */}
                        <td className="px-5 py-5 align-top">
                          <p className="line-clamp-3 text-sm font-medium leading-5 text-[#303830]">
                            {template.subject}
                          </p>
                        </td>

                        {/* BODY */}
                        <td className="px-5 py-5 align-top">
                          <p className="line-clamp-3 max-w-[470px] text-sm leading-5 text-[#59645C]">
                            {template.body}
                          </p>
                        </td>

                        {/* ACTION */}
                        <td className="px-5 py-5 text-right align-top">
                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(
                                template
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-[#D5E5D6] bg-white px-3.5 py-2 text-xs font-semibold text-[#163F20] transition hover:border-[#4C8A57] hover:bg-[#EAF3EA]"
                          >
                            <FiEdit3 size={14} />
                            Edit
                          </button>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* =================================================
              MOBILE CARDS
          ================================================= */}

          <div className="divide-y divide-[#EEF2EE] lg:hidden">
            {displayTemplates.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF3EA] text-[#4C8A57]">
                  <FiSearch size={20} />
                </div>

                <p className="mt-4 text-sm font-semibold text-[#202721]">
                  No templates found
                </p>

                <p className="mt-1 text-xs text-[#59645C]">
                  Try changing your search or
                  filters.
                </p>
              </div>
            ) : (
              displayTemplates.map(
                (template) => (
                  <div
                    key={template.id}
                    className="p-4 sm:p-5"
                  >
                    {/* TOP */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#4C8A57]">
                          {formatChannel(
                            template.channel
                          )}
                        </p>

                        <h3 className="mt-1 text-sm font-semibold leading-5 text-[#202721]">
                          {formatEventType(
                            template.event_type
                          )}
                        </h3>

                       
                      </div>

                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#D5E5D6] bg-[#EAF3EA] px-2.5 py-1 text-[10px] font-semibold text-[#163F20]">
                        {getChannelIcon(
                          template.channel
                        )}
                        {formatChannel(
                          template.channel
                        )}
                      </span>
                    </div>

                    {/* SUBJECT */}
                    <div className="mt-4 rounded-xl border border-[#E5EAE5] bg-[#EAF3EA] p-3.5">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#89918B]">
                        Subject
                      </p>

                      <p className="text-sm font-medium leading-5 text-[#303830]">
                        {template.subject}
                      </p>
                    </div>

                    {/* BODY */}
                    <div className="mt-3 rounded-xl border border-[#E5EAE5] bg-white p-3.5">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#89918B]">
                        Body
                      </p>

                      <p className="text-sm leading-5 text-[#59645C]">
                        {template.body}
                      </p>
                    </div>

                    {/* PLACEHOLDERS */}
                    {template.placeholders?.length >
                      0 && (
                      <div className="mt-3">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#89918B]">
                          Placeholders
                        </p>

                        <div className="flex flex-wrap gap-1.5">
                          {template.placeholders
                            .slice(0, 5)
                            .map(
                              (
                                placeholder
                              ) => (
                                <span
                                  key={
                                    placeholder
                                  }
                                  className="rounded-md border border-[#D5E5D6] bg-[#EAF3EA] px-2 py-1 font-mono text-[10px] text-[#163F20]"
                                >
                                  {`{{${placeholder}}}`}
                                </span>
                              )
                            )}

                          {template
                            .placeholders
                            .length > 5 && (
                            <span className="rounded-md bg-[#F5F7F5] px-2 py-1 text-[10px] text-[#59645C]">
                              +
                              {template
                                .placeholders
                                .length -
                                5}{" "}
                              more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* BOTTOM */}
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-[10px] text-[#89918B]">
                        Updated{" "}
                        {formatDate(
                          template.updated_at
                        )}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          handleEdit(
                            template
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#4C8A57] via-[#163F20] to-[#0F3219] px-3.5 py-2 text-xs font-semibold text-white shadow-[0_8px_18px_-8px_rgba(22,63,32,0.6)] transition hover:shadow-[0_12px_22px_-8px_rgba(22,63,32,0.7)]"
                      >
                        <FiEdit3 size={14} />
                        Edit
                      </button>
                    </div>
                  </div>
                )
              )
            )}
          </div>

          {/* =================================================
              PAGINATION
          ================================================= */}

          {resultTotal > 0 &&
            totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-[#E5EAE5] bg-[#FAFBFA] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="text-xs text-[#59645C]">
                  Showing{" "}
                  <span className="font-semibold text-[#202721]">
                    {showingFrom}
                  </span>{" "}
                  -{" "}
                  <span className="font-semibold text-[#202721]">
                    {showingTo}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-[#202721]">
                    {resultTotal}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-1.5">
                  {/* PREVIOUS */}
                  <button
                    type="button"
                    disabled={
                      currentPage === 1 ||
                      refreshing ||
                      filterLoading
                    }
                    onClick={() =>
                      goToPage(
                        currentPage - 1
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8E2D8] bg-white text-[#59645C] transition hover:border-[#4C8A57] hover:text-[#163F20] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <FiChevronLeft size={16} />
                  </button>

                  {/* PAGE NUMBERS */}
                  {pageNumbers.map(
                    (page) => (
                      <button
                        key={page}
                        type="button"
                        disabled={
                          refreshing ||
                          filterLoading
                        }
                        onClick={() =>
                          goToPage(page)
                        }
                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-xs font-semibold transition ${
                          currentPage ===
                          page
                            ? "bg-gradient-to-br from-[#4C8A57] via-[#163F20] to-[#0F3219] text-white shadow-[0_8px_18px_-8px_rgba(22,63,32,0.6)]"
                            : "border border-[#D8E2D8] bg-white text-[#59645C] hover:border-[#4C8A57] hover:bg-[#EAF3EA] hover:text-[#163F20]"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  {/* NEXT */}
                  <button
                    type="button"
                    disabled={
                      currentPage ===
                        totalPages ||
                      refreshing ||
                      filterLoading
                    }
                    onClick={() =>
                      goToPage(
                        currentPage + 1
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8E2D8] bg-white text-[#59645C] transition hover:border-[#4C8A57] hover:text-[#163F20] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <FiChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* =====================================================
          EDIT MODAL
      ===================================================== */}

      <EditTemplateModal
        template={selectedTemplate}
        open={editOpen}
        loading={updating}
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