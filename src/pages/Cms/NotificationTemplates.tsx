"use client";

import React, {
  useCallback,
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

import { usePermissions } from "../../pages/permissions/usePermissions";

/* =========================================================
   THEME
========================================================= */

const PRIMARY = "#1E3A8A";
const DARK_PRIMARY = "#172554";
const BLUE = "#1E40AF";
const ACCENT = "#2563EB";

const LIGHT_BLUE = "#EAF1FF";
const SOFT_BLUE = "#DBEAFE";
const PAGE_BG = "#F5F8FF";

const TEXT_PRIMARY = "#0F1B3D";
const TEXT_SECONDARY = "#4A5778";
const MUTED = "#8C97B2";

const BORDER = "#D8E2F0";
const WHITE = "#FFFFFF";

const DANGER = "#C23B32";
const DANGER_BG = "#FBEAEA";

/* =========================================================
   PERMISSIONS
========================================================= */

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

  if (
    value === "mail" ||
    value === "email"
  ) {
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
  canUpdate: boolean;
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

  if (!open || !template || !canUpdate) {
    return null;
  }

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!canUpdate) {
      toast.error(
        "You do not have permission to update notification templates."
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

    await onSave(
      template.id,
      subject.trim(),
      body.trim()
    );
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-[3px]"
        style={{
          backgroundColor: "rgba(15, 27, 61, 0.52)",
        }}
      >
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
          className="flex max-h-[92vh] w-full max-w-[820px] flex-col overflow-hidden rounded-2xl border bg-white shadow-[0_25px_70px_rgba(30,58,138,0.16)]"
          style={{ borderColor: BORDER }}
        >
          {/* HEADER */}
          <div
            className="flex items-start justify-between border-b px-5 py-5 sm:px-6"
            style={{ borderColor: "#E4EAF3" }}
          >
            <div className="min-w-0 pr-4">
              <p
                className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ color: ACCENT }}
              >
                Notification Template
              </p>

              <h2
                className="text-xl font-semibold"
                style={{ color: TEXT_PRIMARY }}
              >
                Edit Template
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className="rounded-md px-2.5 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: LIGHT_BLUE,
                    color: PRIMARY,
                  }}
                >
                  {formatEventType(
                    template.event_type
                  )}
                </span>

                <span
                  className="inline-flex items-center gap-1.5 rounded-md border bg-white px-2.5 py-1 text-xs font-medium"
                  style={{
                    borderColor: BORDER,
                    color: TEXT_SECONDARY,
                  }}
                >
                  {getChannelIcon(
                    template.channel
                  )}

                  {formatChannel(
                    template.channel
                  )}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-50"
              style={{ color: TEXT_SECONDARY }}
              onMouseEnter={(event) => {
                if (!loading) {
                  event.currentTarget.style.backgroundColor =
                    LIGHT_BLUE;
                  event.currentTarget.style.color =
                    PRIMARY;
                }
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor =
                  "transparent";
                event.currentTarget.style.color =
                  TEXT_SECONDARY;
              }}
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
                  <label
                    className="mb-2 block text-sm font-semibold"
                    style={{ color: TEXT_PRIMARY }}
                  >
                    Subject
                  </label>

                  <input
                    type="text"
                    value={subject}
                    disabled={loading}
                    onChange={(e) =>
                      setSubject(
                        e.target.value
                      )
                    }
                    placeholder="Enter notification subject"
                    className="h-12 w-full rounded-xl px-4 text-sm outline-none transition disabled:cursor-not-allowed disabled:bg-[#EEF3FA] placeholder:text-[#8C97B2]"
                    style={{
                      border: `1px solid ${BORDER}`,
                      backgroundColor: loading
                        ? "#EEF3FA"
                        : WHITE,
                      color: TEXT_PRIMARY,
                    }}
                    onFocus={(event) => {
                      if (!loading) {
                        event.currentTarget.style.borderColor =
                          ACCENT;
                        event.currentTarget.style.boxShadow =
                          "0 0 0 4px rgba(37,99,235,0.10)";
                      }
                    }}
                    onBlur={(event) => {
                      event.currentTarget.style.borderColor =
                        BORDER;
                      event.currentTarget.style.boxShadow =
                        "none";
                    }}
                  />
                </div>

                {/* BODY */}
                <div>
                  <label
                    className="mb-2 block text-sm font-semibold"
                    style={{ color: TEXT_PRIMARY }}
                  >
                    Body
                  </label>

                  <textarea
                    rows={9}
                    value={body}
                    disabled={loading}
                    onChange={(e) =>
                      setBody(
                        e.target.value
                      )
                    }
                    placeholder="Enter notification body"
                    className="w-full resize-y rounded-xl px-4 py-3 text-sm leading-6 outline-none transition disabled:cursor-not-allowed disabled:bg-[#EEF3FA] placeholder:text-[#8C97B2]"
                    style={{
                      border: `1px solid ${BORDER}`,
                      backgroundColor: loading
                        ? "#EEF3FA"
                        : WHITE,
                      color: TEXT_PRIMARY,
                    }}
                    onFocus={(event) => {
                      if (!loading) {
                        event.currentTarget.style.borderColor =
                          ACCENT;
                        event.currentTarget.style.boxShadow =
                          "0 0 0 4px rgba(37,99,235,0.10)";
                      }
                    }}
                    onBlur={(event) => {
                      event.currentTarget.style.borderColor =
                        BORDER;
                      event.currentTarget.style.boxShadow =
                        "none";
                    }}
                  />
                </div>

                {/* PLACEHOLDERS */}
                {template.placeholders?.length >
                  0 && (
                  <div
                    className="rounded-xl border p-4 sm:p-5"
                    style={{
                      borderColor:
                        "rgba(37,99,235,0.14)",
                      backgroundColor: LIGHT_BLUE,
                    }}
                  >
                    <div className="mb-3">
                      <p
                        className="text-sm font-semibold"
                        style={{
                          color: TEXT_PRIMARY,
                        }}
                      >
                        Available Placeholders
                      </p>

                      <p
                        className="mt-1 text-xs"
                        style={{
                          color: TEXT_SECONDARY,
                        }}
                      >
                        Use these dynamic values inside
                        subject or body.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {template.placeholders.map(
                        (placeholder) => (
                          <span
                            key={placeholder}
                            className="rounded-lg border bg-white px-2.5 py-1.5 font-mono text-[11px] font-medium"
                            style={{
                              borderColor:
                                "#C9D9F4",
                              color: PRIMARY,
                            }}
                          >
                            {`{{${placeholder}}}`}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* INFO */}
                <div
                  className="rounded-xl border px-4 py-3.5"
                  style={{
                    borderColor:
                      "rgba(37,99,235,0.14)",
                    backgroundColor: LIGHT_BLUE,
                  }}
                >
                  <p
                    className="text-xs leading-5"
                    style={{ color: PRIMARY }}
                  >
                    Only <strong>Subject</strong> and{" "}
                    <strong>Body</strong> will be
                    updated. Event type, channel and
                    placeholders are managed by the
                    system.
                  </p>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div
              className="flex flex-col-reverse gap-3 border-t px-5 py-4 sm:flex-row sm:justify-end sm:px-6"
              style={{
                borderColor: "#E4EAF3",
                backgroundColor: PAGE_BG,
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="h-11 rounded-xl border bg-white px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: BORDER,
                  color: TEXT_SECONDARY,
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(30,58,138,0.6)] transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, ${PRIMARY}, ${DARK_PRIMARY})`,
                }}
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
      permissions.some((permission) =>
        hasPermission(permission)
      ),
    [hasPermission]
  );

  const canViewTemplates = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess(
        "Notification Templates"
      ) ||
      hasModuleAccess(
        "Notification Template"
      ) ||
      hasModuleAccess(
        "notification_templates"
      ) ||
      hasModuleAccess(
        "notification_template"
      ) ||
      hasAnyPermission(
        VIEW_PERMISSION_KEYS
      ),
    [
      isSuperAdmin,
      hasModuleAccess,
      hasAnyPermission,
    ]
  );

  const canUpdateTemplates = useMemo(
    () =>
      isSuperAdmin ||
      hasAnyPermission(
        UPDATE_PERMISSION_KEYS
      ),
    [
      isSuperAdmin,
      hasAnyPermission,
    ]
  );

  /* =======================================================
     CURRENT API PAGE DATA
  ======================================================= */

  const [templates, setTemplates] = useState<
    NotificationTemplate[]
  >([]);

  /* =======================================================
     COMPLETE DATA
  ======================================================= */

  const [allTemplates, setAllTemplates] =
    useState<
      NotificationTemplate[] | null
    >(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [filterLoading, setFilterLoading] =
    useState(false);

  const [updating, setUpdating] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [selectedEvent, setSelectedEvent] =
    useState("all");

  const [selectedChannel, setSelectedChannel] =
    useState("all");

  const [currentPage, setCurrentPage] =
    useState(1);

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
    useState<
      NotificationTemplate | null
    >(null);

  /* =======================================================
     REQUEST REFS
  ======================================================= */

  const pageFetchInFlightRef =
    useRef<Promise<void> | null>(null);

  const filterFetchInFlightRef =
    useRef<Promise<void> | null>(null);

  const hasInitialFetchRef =
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

  const fetchPage = useCallback(
    async (
      page: number,
      isRefresh = false,
      force = false
    ) => {
      if (!canViewTemplates) {
        return;
      }

      if (pageFetchInFlightRef.current) {
        return pageFetchInFlightRef.current;
      }

      if (
        !force &&
        !isRefresh &&
        hasInitialFetchRef.current &&
        page === 1
      ) {
        return;
      }

      const requestPromise = (async () => {
        try {
          if (isRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          const response =
            await notificationTemplateApi.getAll(
              page
            );

          if (response.data?.success) {
            const result = response.data;

            setTemplates(
              result.data || []
            );

            if (result.meta) {
              setMeta({
                current_page:
                  result.meta.current_page,
                per_page:
                  result.meta.per_page ||
                  PER_PAGE,
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
                result.filters
                  .event_types || []
              );

              setAvailableChannels(
                result.filters.channels || []
              );
            }

            if (page === 1) {
              hasInitialFetchRef.current =
                true;
            }
          } else {
            toast.error(
              result?.message ||
                "Failed to load templates"
            );
          }
        } catch (error: any) {
          console.error(
            "Notification template GET error:",
            error
          );

          toast.error(
            error?.response?.data
              ?.message ||
              "Failed to load notification templates"
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      })();

      pageFetchInFlightRef.current =
        requestPromise;

      try {
        await requestPromise;
      } finally {
        pageFetchInFlightRef.current =
          null;
      }
    },
    [canViewTemplates]
  );

  /* =======================================================
     FETCH ALL API PAGES
  ======================================================= */

  const fetchAllTemplates = useCallback(
    async (isRefresh = false) => {
      if (!canViewTemplates) {
        return;
      }

      if (
        filterFetchInFlightRef.current
      ) {
        return filterFetchInFlightRef.current;
      }

      const requestPromise = (async () => {
        try {
          if (isRefresh) {
            setRefreshing(true);
          } else {
            setFilterLoading(true);
          }

          const firstResponse =
            await notificationTemplateApi.getAll(
              1
            );

          if (
            !firstResponse.data?.success
          ) {
            toast.error(
              firstResponse.data?.message ||
                "Failed to load templates"
            );

            return;
          }

          const firstResult =
            firstResponse.data;

          let combined =
            firstResult.data || [];

          const lastPage =
            firstResult.meta?.last_page ||
            1;

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
              firstResult.filters
                .event_types || []
            );

            setAvailableChannels(
              firstResult.filters
                .channels || []
            );
          }

          /* -----------------------------------------------
             FETCH REMAINING PAGES
          ------------------------------------------------ */

          if (lastPage > 1) {
            const pages = Array.from(
              {
                length: lastPage - 1,
              },
              (_, index) =>
                index + 2
            );

            const responses =
              await Promise.all(
                pages.map((page) =>
                  notificationTemplateApi.getAll(
                    page
                  )
                )
              );

            responses.forEach(
              (response) => {
                if (
                  response.data?.success
                ) {
                  combined = [
                    ...combined,
                    ...(response.data
                      .data || []),
                  ];
                }
              }
            );
          }

          setAllTemplates(
            combined
          );

          setCurrentPage(1);
        } catch (error: any) {
          console.error(
            "Notification template ALL pages error:",
            error
          );

          toast.error(
            error?.response?.data
              ?.message ||
              "Failed to load notification templates"
          );
        } finally {
          setFilterLoading(false);
          setRefreshing(false);
        }
      })();

      filterFetchInFlightRef.current =
        requestPromise;

      try {
        await requestPromise;
      } finally {
        filterFetchInFlightRef.current =
          null;
      }
    },
    [canViewTemplates]
  );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    if (
      !permissionsLoading &&
      canViewTemplates &&
      !hasInitialFetchRef.current
    ) {
      fetchPage(1);
    }
  }, [
    permissionsLoading,
    canViewTemplates,
    fetchPage,
  ]);

  /* =======================================================
     LOAD COMPLETE DATA WHEN FILTER IS USED
  ======================================================= */

  useEffect(() => {
    if (
      permissionsLoading ||
      !canViewTemplates
    ) {
      return;
    }

    if (!isFilterActive) {
      return;
    }

    setCurrentPage(1);

    if (!allTemplates) {
      fetchAllTemplates();
    }
  }, [
    permissionsLoading,
    canViewTemplates,
    isFilterActive,
    allTemplates,
    fetchAllTemplates,
  ]);

  /* =======================================================
     AVAILABLE EVENTS
  ======================================================= */

  const eventOptions = useMemo(() => {
    return [...availableEvents].sort(
      (a, b) =>
        formatEventType(a).localeCompare(
          formatEventType(b)
        )
    );
  }, [availableEvents]);

  /* =======================================================
     AVAILABLE CHANNELS
  ======================================================= */

  const channelOptions = useMemo(() => {
    return [...availableChannels].sort(
      (a, b) =>
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

    return allTemplates.filter(
      (template) => {
        /* EVENT */
        const eventMatch =
          selectedEvent === "all" ||
          template.event_type ===
            selectedEvent;

        /* CHANNEL */
        const normalizedTemplateChannel =
          template.channel
            ?.toLowerCase() === "mail"
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
          formatChannel(
            template.channel
          )
            .toLowerCase()
            .includes(searchValue) ||
          formatEventType(
            template.event_type
          )
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
      }
    );
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

  const resetFilters = async () => {
    setSearch("");
    setSelectedEvent("all");
    setSelectedChannel("all");
    setCurrentPage(1);

    // Clear local filtered data so the next filter
    // activation always loads fresh complete data.
    setAllTemplates(null);

    await fetchPage(
      1,
      false,
      true
    );
  };

  /* =======================================================
     EDIT
  ======================================================= */

  const handleEdit = (
    template: NotificationTemplate
  ) => {
    if (!canUpdateTemplates) {
      toast.error(
        "You do not have permission to edit notification templates."
      );
      return;
    }

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
    if (!canUpdateTemplates) {
      toast.error(
        "You do not have permission to update notification templates."
      );
      return;
    }

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

        if (isFilterActive) {
          // Refresh complete filtered dataset.
          await fetchAllTemplates(true);
        } else {
          // Refresh current API page.
          await fetchPage(
            currentPage,
            true,
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
        error?.response?.data
          ?.message ||
          "Failed to update template"
      );
    } finally {
      setUpdating(false);
    }
  };

  /* =======================================================
     PAGE CHANGE
  ======================================================= */

  const goToPage = (
    page: number
  ) => {
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
     PERMISSION LOADING
  ======================================================= */

  if (permissionsLoading) {
    return (
      <div
        className="min-h-full p-4 font-poppins sm:p-6 lg:p-8"
        style={{
          backgroundColor: PAGE_BG,
        }}
      >
        <div className="mx-auto max-w-[1550px]">
          <div className="flex min-h-[500px] items-center justify-center">
            <div className="flex flex-col items-center">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_6px_24px_rgba(30,58,138,0.05)]"
                style={{ color: ACCENT }}
              >
                <FiRefreshCw
                  size={22}
                  className="animate-spin"
                />
              </div>

              <p
                className="mt-4 text-sm font-medium"
                style={{ color: TEXT_SECONDARY }}
              >
                Checking permissions...
              </p>

              <p
                className="mt-1 text-[10px]"
                style={{ color: MUTED }}
              >
                Verifying notification template access.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }


  if (loading) {
    return (
      <div
        className="min-h-full p-4 font-poppins sm:p-6 lg:p-8"
        style={{
          backgroundColor: PAGE_BG,
        }}
      >
        <div className="mx-auto max-w-[1550px]">
          <div className="flex min-h-[500px] items-center justify-center">
            <div className="flex flex-col items-center">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_6px_24px_rgba(30,58,138,0.05)]"
                style={{ color: ACCENT }}
              >
                <FiRefreshCw
                  size={22}
                  className="animate-spin"
                />
              </div>

              <p
                className="mt-4 text-sm font-medium"
                style={{
                  color: TEXT_SECONDARY,
                }}
              >
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
    <div
      className="min-h-full p-4 font-poppins sm:p-6 lg:p-8"
      style={{
        backgroundColor: PAGE_BG,
      }}
    >
      <div className="mx-auto max-w-[1550px]">
        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.22em]"
              style={{ color: ACCENT }}
            >
              System Configuration
            </p>

            <h1
              className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl"
              style={{
                color: TEXT_PRIMARY,
              }}
            >
              Notification Templates
            </h1>

            <p
              className="mt-1.5 max-w-[700px] text-sm leading-6"
              style={{
                color: TEXT_SECONDARY,
              }}
            >
              Manage the subject and body content
              used for system notifications across
              different channels.
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
                  true,
                  true
                );
              }
            }}
            disabled={
              refreshing ||
              filterLoading
            }
            className="inline-flex h-11 w-fit items-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold shadow-[0_6px_24px_rgba(30,58,138,0.05)] transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              borderColor: BORDER,
              color: PRIMARY,
            }}
            onMouseEnter={(event) => {
              if (
                !refreshing &&
                !filterLoading
              ) {
                event.currentTarget.style.backgroundColor =
                  LIGHT_BLUE;
                event.currentTarget.style.borderColor =
                  ACCENT;
              }
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor =
                WHITE;
              event.currentTarget.style.borderColor =
                BORDER;
            }}
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

        <div
          className="overflow-hidden rounded-2xl border bg-white shadow-[0_8px_30px_rgba(30,58,138,0.06)]"
          style={{
            borderColor: "#E0E7F2",
          }}
        >
          {/* TOP ACCENT */}
          <div
            className="h-[3px] w-full"
            style={{
              background: `linear-gradient(to right, ${ACCENT}, ${PRIMARY}, ${DARK_PRIMARY})`,
            }}
          />

          {/* FILTER HEADER */}
          <div
            className="border-b p-4 sm:p-5"
            style={{
              borderColor: "#E4EAF3",
            }}
          >
            <div className="flex flex-col gap-4">
              {/* SEARCH */}
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="relative w-full xl:max-w-[430px]">
                  <FiSearch
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{
                      color: MUTED,
                    }}
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
                    className="h-11 w-full rounded-xl pl-10 pr-4 text-sm outline-none transition placeholder:text-[#8C97B2]"
                    style={{
                      border: `1px solid ${BORDER}`,
                      backgroundColor:
                        PAGE_BG,
                      color: TEXT_PRIMARY,
                    }}
                    onFocus={(event) => {
                      event.currentTarget.style.borderColor =
                        ACCENT;
                      event.currentTarget.style.backgroundColor =
                        WHITE;
                      event.currentTarget.style.boxShadow =
                        "0 0 0 4px rgba(37,99,235,0.08)";
                    }}
                    onBlur={(event) => {
                      event.currentTarget.style.borderColor =
                        BORDER;
                      event.currentTarget.style.backgroundColor =
                        PAGE_BG;
                      event.currentTarget.style.boxShadow =
                        "none";
                    }}
                  />
                </div>

                <div
                  className="flex flex-wrap items-center gap-2 text-xs"
                  style={{
                    color: TEXT_SECONDARY,
                  }}
                >
                  <span>
                    Page{" "}
                    <strong
                      style={{
                        color: TEXT_PRIMARY,
                      }}
                    >
                      {currentPage}
                    </strong>{" "}
                    of{" "}
                    <strong
                      style={{
                        color: TEXT_PRIMARY,
                      }}
                    >
                      {totalPages}
                    </strong>
                  </span>

                  <span
                    className="hidden sm:inline"
                    style={{
                      color: BORDER,
                    }}
                  >
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
                  <label
                    className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: MUTED }}
                  >
                    Event Type
                  </label>

                  <select
                    value={selectedEvent}
                    onChange={(e) =>
                      setSelectedEvent(
                        e.target.value
                      )
                    }
                    className="h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition"
                    style={{
                      borderColor: BORDER,
                      color: TEXT_SECONDARY,
                    }}
                    onFocus={(event) => {
                      event.currentTarget.style.borderColor =
                        ACCENT;
                      event.currentTarget.style.boxShadow =
                        "0 0 0 4px rgba(37,99,235,0.08)";
                    }}
                    onBlur={(event) => {
                      event.currentTarget.style.borderColor =
                        BORDER;
                      event.currentTarget.style.boxShadow =
                        "none";
                    }}
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
                  <label
                    className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: MUTED }}
                  >
                    Channel
                  </label>

                  <select
                    value={selectedChannel}
                    onChange={(e) =>
                      setSelectedChannel(
                        e.target.value
                      )
                    }
                    className="h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition"
                    style={{
                      borderColor: BORDER,
                      color: TEXT_SECONDARY,
                    }}
                    onFocus={(event) => {
                      event.currentTarget.style.borderColor =
                        ACCENT;
                      event.currentTarget.style.boxShadow =
                        "0 0 0 4px rgba(37,99,235,0.08)";
                    }}
                    onBlur={(event) => {
                      event.currentTarget.style.borderColor =
                        BORDER;
                      event.currentTarget.style.boxShadow =
                        "none";
                    }}
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
                    className="h-10 w-full rounded-lg border px-4 text-sm font-semibold transition"
                    style={{
                      borderColor:
                        "#C9D9F4",
                      backgroundColor:
                        LIGHT_BLUE,
                      color: PRIMARY,
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.backgroundColor =
                        SOFT_BLUE;
                      event.currentTarget.style.borderColor =
                        ACCENT;
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.backgroundColor =
                        LIGHT_BLUE;
                      event.currentTarget.style.borderColor =
                        "#C9D9F4";
                    }}
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
              <div
                className="border-b px-4 py-3"
                style={{
                  borderColor:
                    "#E4EAF3",
                  backgroundColor:
                    "#FAFBFE",
                }}
              >
                <div
                  className="flex items-center gap-2 text-xs font-medium"
                  style={{
                    color: TEXT_SECONDARY,
                  }}
                >
                  <FiRefreshCw
                    size={13}
                    className="animate-spin"
                    style={{
                      color: ACCENT,
                    }}
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
                <tr
                  className="border-b"
                  style={{
                    borderColor:
                      "#E4EAF3",
                    backgroundColor:
                      "#FAFBFE",
                  }}
                >
                  <th
                    className="w-[230px] px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.13em]"
                    style={{ color: MUTED }}
                  >
                    Event
                  </th>

                  <th
                    className="w-[120px] px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.13em]"
                    style={{ color: MUTED }}
                  >
                    Channel
                  </th>

                  <th
                    className="w-[270px] px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.13em]"
                    style={{ color: MUTED }}
                  >
                    Subject
                  </th>

                  <th
                    className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.13em]"
                    style={{ color: MUTED }}
                  >
                    Body
                  </th>

                  <th
                    className="w-[150px] px-5 py-4 text-right text-[10px] font-bold uppercase tracking-[0.13em]"
                    style={{ color: MUTED }}
                  >
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {displayTemplates.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-20 text-center"
                    >
                      <div className="mx-auto max-w-sm">
                        <div
                          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
                          style={{
                            backgroundColor:
                              LIGHT_BLUE,
                            color: ACCENT,
                          }}
                        >
                          <FiSearch
                            size={20}
                          />
                        </div>

                        <p
                          className="mt-4 text-sm font-semibold"
                          style={{
                            color:
                              TEXT_PRIMARY,
                          }}
                        >
                          No templates found
                        </p>

                        <p
                          className="mt-1 text-xs leading-5"
                          style={{
                            color:
                              TEXT_SECONDARY,
                          }}
                        >
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
                        className="border-b transition hover:bg-[#F9FBFF]"
                        style={{
                          borderColor:
                            "#EEF2F8",
                        }}
                      >
                        {/* EVENT */}
                        <td className="px-5 py-5 align-top">
                          <p
                            className="text-sm font-semibold leading-5"
                            style={{
                              color:
                                TEXT_PRIMARY,
                            }}
                          >
                            {formatEventType(
                              template.event_type
                            )}
                          </p>

                          <p
                            className="mt-2 text-[10px]"
                            style={{
                              color: MUTED,
                            }}
                          >
                            Updated{" "}
                            {formatDate(
                              template.updated_at
                            )}
                          </p>
                        </td>

                        {/* CHANNEL */}
                        <td className="px-5 py-5 align-top">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold"
                            style={{
                              borderColor:
                                "#C9D9F4",
                              backgroundColor:
                                LIGHT_BLUE,
                              color: PRIMARY,
                            }}
                          >
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
                          <p
                            className="line-clamp-3 text-sm font-medium leading-5"
                            style={{
                              color:
                                "#25345E",
                            }}
                          >
                            {template.subject}
                          </p>
                        </td>

                        {/* BODY */}
                        <td className="px-5 py-5 align-top">
                          <p
                            className="line-clamp-3 max-w-[470px] text-sm leading-5"
                            style={{
                              color:
                                TEXT_SECONDARY,
                            }}
                          >
                            {template.body}
                          </p>
                        </td>

                        {/* ACTION */}
                        <td className="px-5 py-5 text-right align-top">
                          {canUpdateTemplates ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleEdit(
                                  template
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg border bg-white px-3.5 py-2 text-xs font-semibold transition"
                              style={{
                                borderColor:
                                  "#C9D9F4",
                                color:
                                  PRIMARY,
                              }}
                              onMouseEnter={(
                                event
                              ) => {
                                event.currentTarget.style.backgroundColor =
                                  LIGHT_BLUE;
                                event.currentTarget.style.borderColor =
                                  ACCENT;
                              }}
                              onMouseLeave={(
                                event
                              ) => {
                                event.currentTarget.style.backgroundColor =
                                  WHITE;
                                event.currentTarget.style.borderColor =
                                  "#C9D9F4";
                              }}
                            >
                              <FiEdit3
                                size={14}
                              />
                              Edit
                            </button>
                          ) : (
                            <span
                              className="inline-flex items-center rounded-lg border px-3 py-2 text-[10px] font-semibold"
                              style={{
                                borderColor:
                                  BORDER,
                                backgroundColor:
                                  "#F7F9FD",
                                color:
                                  MUTED,
                              }}
                            >
                              View Only
                            </span>
                          )}
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

          <div
            className="divide-y lg:hidden"
            style={{
              borderColor: "#EEF2F8",
            }}
          >
            {displayTemplates.length ===
            0 ? (
              <div className="px-5 py-16 text-center">
                <div
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
                  style={{
                    backgroundColor:
                      LIGHT_BLUE,
                    color: ACCENT,
                  }}
                >
                  <FiSearch
                    size={20}
                  />
                </div>

                <p
                  className="mt-4 text-sm font-semibold"
                  style={{
                    color: TEXT_PRIMARY,
                  }}
                >
                  No templates found
                </p>

                <p
                  className="mt-1 text-xs"
                  style={{
                    color:
                      TEXT_SECONDARY,
                  }}
                >
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
                        <p
                          className="text-[10px] font-bold uppercase tracking-[0.12em]"
                          style={{
                            color: ACCENT,
                          }}
                        >
                          {formatChannel(
                            template.channel
                          )}
                        </p>

                        <h3
                          className="mt-1 text-sm font-semibold leading-5"
                          style={{
                            color:
                              TEXT_PRIMARY,
                          }}
                        >
                          {formatEventType(
                            template.event_type
                          )}
                        </h3>
                      </div>

                      <span
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-semibold"
                        style={{
                          borderColor:
                            "#C9D9F4",
                          backgroundColor:
                            LIGHT_BLUE,
                          color: PRIMARY,
                        }}
                      >
                        {getChannelIcon(
                          template.channel
                        )}

                        {formatChannel(
                          template.channel
                        )}
                      </span>
                    </div>

                    {/* SUBJECT */}
                    <div
                      className="mt-4 rounded-xl border p-3.5"
                      style={{
                        borderColor:
                          "#DCE6F4",
                        backgroundColor:
                          LIGHT_BLUE,
                      }}
                    >
                      <p
                        className="mb-1 text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          color: MUTED,
                        }}
                      >
                        Subject
                      </p>

                      <p
                        className="text-sm font-medium leading-5"
                        style={{
                          color:
                            "#25345E",
                        }}
                      >
                        {template.subject}
                      </p>
                    </div>

                    {/* BODY */}
                    <div
                      className="mt-3 rounded-xl border bg-white p-3.5"
                      style={{
                        borderColor:
                          "#E0E7F2",
                      }}
                    >
                      <p
                        className="mb-1 text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          color: MUTED,
                        }}
                      >
                        Body
                      </p>

                      <p
                        className="text-sm leading-5"
                        style={{
                          color:
                            TEXT_SECONDARY,
                        }}
                      >
                        {template.body}
                      </p>
                    </div>

                    {/* PLACEHOLDERS */}
                    {template.placeholders?.length >
                      0 && (
                      <div className="mt-3">
                        <p
                          className="mb-2 text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            color: MUTED,
                          }}
                        >
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
                                  className="rounded-md border px-2 py-1 font-mono text-[10px]"
                                  style={{
                                    borderColor:
                                      "#C9D9F4",
                                    backgroundColor:
                                      LIGHT_BLUE,
                                    color:
                                      PRIMARY,
                                  }}
                                >
                                  {`{{${placeholder}}}`}
                                </span>
                              )
                            )}

                          {template
                            .placeholders
                            .length >
                            5 && (
                            <span
                              className="rounded-md px-2 py-1 text-[10px]"
                              style={{
                                backgroundColor:
                                  PAGE_BG,
                                color:
                                  TEXT_SECONDARY,
                              }}
                            >
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
                      <p
                        className="text-[10px]"
                        style={{
                          color: MUTED,
                        }}
                      >
                        Updated{" "}
                        {formatDate(
                          template.updated_at
                        )}
                      </p>

                      {canUpdateTemplates ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(
                              template
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold text-white shadow-[0_8px_18px_-8px_rgba(30,58,138,0.6)] transition"
                          style={{
                            background: `linear-gradient(135deg, ${ACCENT}, ${PRIMARY}, ${DARK_PRIMARY})`,
                          }}
                        >
                          <FiEdit3
                            size={14}
                          />
                          Edit
                        </button>
                      ) : (
                        <span
                          className="rounded-lg border px-3.5 py-2 text-[10px] font-semibold"
                          style={{
                            borderColor:
                              BORDER,
                            backgroundColor:
                              "#F7F9FD",
                            color: MUTED,
                          }}
                        >
                          View Only
                        </span>
                      )}
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
              <div
                className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                style={{
                  borderColor:
                    "#E4EAF3",
                  backgroundColor:
                    "#FAFBFE",
                }}
              >
                <div
                  className="text-xs"
                  style={{
                    color:
                      TEXT_SECONDARY,
                  }}
                >
                  Showing{" "}
                  <span
                    className="font-semibold"
                    style={{
                      color:
                        TEXT_PRIMARY,
                    }}
                  >
                    {showingFrom}
                  </span>{" "}
                  -{" "}
                  <span
                    className="font-semibold"
                    style={{
                      color:
                        TEXT_PRIMARY,
                    }}
                  >
                    {showingTo}
                  </span>{" "}
                  of{" "}
                  <span
                    className="font-semibold"
                    style={{
                      color:
                        TEXT_PRIMARY,
                    }}
                  >
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
                    className="flex h-9 w-9 items-center justify-center rounded-lg border bg-white transition disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                      borderColor: BORDER,
                      color:
                        TEXT_SECONDARY,
                    }}
                    onMouseEnter={(
                      event
                    ) => {
                      if (
                        currentPage !==
                          1 &&
                        !refreshing &&
                        !filterLoading
                      ) {
                        event.currentTarget.style.borderColor =
                          ACCENT;
                        event.currentTarget.style.color =
                          PRIMARY;
                        event.currentTarget.style.backgroundColor =
                          LIGHT_BLUE;
                      }
                    }}
                    onMouseLeave={(
                      event
                    ) => {
                      event.currentTarget.style.borderColor =
                        BORDER;
                      event.currentTarget.style.color =
                        TEXT_SECONDARY;
                      event.currentTarget.style.backgroundColor =
                        WHITE;
                    }}
                  >
                    <FiChevronLeft
                      size={16}
                    />
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
                          goToPage(
                            page
                          )
                        }
                        className="flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                        style={{
                          background:
                            currentPage ===
                            page
                              ? `linear-gradient(135deg, ${ACCENT}, ${PRIMARY}, ${DARK_PRIMARY})`
                              : WHITE,
                          color:
                            currentPage ===
                            page
                              ? WHITE
                              : TEXT_SECONDARY,
                          border:
                            currentPage ===
                            page
                              ? "none"
                              : `1px solid ${BORDER}`,
                          boxShadow:
                            currentPage ===
                            page
                              ? "0 8px 18px -8px rgba(30,58,138,0.6)"
                              : "none",
                        }}
                        onMouseEnter={(
                          event
                        ) => {
                          if (
                            currentPage !==
                              page &&
                            !refreshing &&
                            !filterLoading
                          ) {
                            event.currentTarget.style.borderColor =
                              ACCENT;
                            event.currentTarget.style.backgroundColor =
                              LIGHT_BLUE;
                            event.currentTarget.style.color =
                              PRIMARY;
                          }
                        }}
                        onMouseLeave={(
                          event
                        ) => {
                          if (
                            currentPage !==
                            page
                          ) {
                            event.currentTarget.style.borderColor =
                              BORDER;
                            event.currentTarget.style.backgroundColor =
                              WHITE;
                            event.currentTarget.style.color =
                              TEXT_SECONDARY;
                          }
                        }}
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
                    className="flex h-9 w-9 items-center justify-center rounded-lg border bg-white transition disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                      borderColor: BORDER,
                      color:
                        TEXT_SECONDARY,
                    }}
                    onMouseEnter={(
                      event
                    ) => {
                      if (
                        currentPage !==
                          totalPages &&
                        !refreshing &&
                        !filterLoading
                      ) {
                        event.currentTarget.style.borderColor =
                          ACCENT;
                        event.currentTarget.style.color =
                          PRIMARY;
                        event.currentTarget.style.backgroundColor =
                          LIGHT_BLUE;
                      }
                    }}
                    onMouseLeave={(
                      event
                    ) => {
                      event.currentTarget.style.borderColor =
                        BORDER;
                      event.currentTarget.style.color =
                        TEXT_SECONDARY;
                      event.currentTarget.style.backgroundColor =
                        WHITE;
                    }}
                  >
                    <FiChevronRight
                      size={16}
                    />
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
        canUpdate={canUpdateTemplates}
        onClose={() => {
          if (!updating) {
            setEditOpen(false);
            setSelectedTemplate(
              null
            );
          }
        }}
        onSave={handleUpdate}
      />
    </div>
  );
};

export default NotificationTemplates;