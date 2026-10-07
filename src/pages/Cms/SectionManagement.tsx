"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FiAlertTriangle,
  FiChevronLeft,
  FiChevronRight,
  FiEdit3,
  FiFileText,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX,
  FiLayers,
  FiShield,
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

import GlobalModal from "@/components/common/GlobalModal";

import faqSectionsApi, {
  FAQSection,
} from "../../api/endpoints/faqSectionsApi";

import { usePermissions } from "../../pages/permissions/usePermissions";

// =====================================================
// THEME
// =====================================================

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

// =====================================================
// PERMISSIONS
// =====================================================

const VIEW_PERMISSION_KEYS = [
  "faq_section.view",
  "faq_sections.view",
  "FAQ Section.view",
  "FAQ Sections.view",
];

const CREATE_PERMISSION_KEYS = [
  "faq_section.create",
  "faq_sections.create",
  "FAQ Section.create",
  "FAQ Sections.create",
];

const UPDATE_PERMISSION_KEYS = [
  "faq_section.update",
  "faq_sections.update",
  "FAQ Section.update",
  "FAQ Sections.update",
  "faq_section.edit",
  "faq_sections.edit",
  "FAQ Section.edit",
  "FAQ Sections.edit",
];

const DELETE_PERMISSION_KEYS = [
  "faq_section.delete",
  "faq_sections.delete",
  "FAQ Section.delete",
  "FAQ Sections.delete",
];

// =====================================================
// TYPES
// =====================================================

interface SectionForm {
  name: string;
  description: string;
}

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
      damping: 16,
    },
  },
};

// =====================================================
// HELPERS
// =====================================================

const truncateText = (
  value: string | null,
  length = 100
) => {
  if (!value) return "-";

  return value.length > length
    ? `${value.slice(0, length).trim()}...`
    : value;
};

// =====================================================
// ADD / EDIT SECTION MODAL
// =====================================================

interface SectionModalProps {
  open: boolean;
  editingSection: FAQSection | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: SectionForm) => void;
}

const SectionModal: React.FC<SectionModalProps> = ({
  open,
  editingSection,
  loading,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;

    setName(editingSection?.name || "");
    setDescription(
      editingSection?.description || ""
    );
  }, [open, editingSection]);

  if (!open) return null;

  const handleSubmit = (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!name.trim()) {
      toast.error(
        "Section name is required."
      );
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim(),
    });
  };

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={!loading}
    >
      <div className="w-full max-w-[560px] overflow-hidden rounded-[22px] border bg-white shadow-2xl">
        {/* TOP LINE */}
        <div
          className="h-[3px] w-full"
          style={{
            background:
              `linear-gradient(to right, ${ACCENT}, ${PRIMARY}, ${DARK_PRIMARY})`,
          }}
        />

        {/* HEADER */}
        <div
          className="flex items-start justify-between border-b px-5 py-5"
          style={{
            borderColor:
              "rgba(30,58,138,0.10)",
          }}
        >
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{
                  backgroundColor:
                    LIGHT_BLUE,
                  color: PRIMARY,
                }}
              >
                {editingSection ? (
                  <FiEdit3 size={15} />
                ) : (
                  <FiPlus size={15} />
                )}
              </div>

              <span
                className="text-[9px] font-bold uppercase tracking-[0.16em]"
                style={{ color: ACCENT }}
              >
                FAQ Section Management
              </span>
            </div>

            <h2
              className="text-lg font-bold"
              style={{ color: TEXT_PRIMARY }}
            >
              {editingSection
                ? "Edit Section"
                : "Add Section"}
            </h2>

            <p
              className="mt-1 text-[11px]"
              style={{ color: MUTED }}
            >
              {editingSection
                ? "Update the FAQ section details."
                : "Create a new FAQ section."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition disabled:opacity-50"
            style={{
              backgroundColor:
                PAGE_BG,
              color: PRIMARY,
            }}
            onMouseEnter={(event) => {
              if (!loading) {
                event.currentTarget.style.backgroundColor =
                  LIGHT_BLUE;
              }
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor =
                PAGE_BG;
            }}
          >
            <FiX size={16} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-5">
            {/* NAME */}
            <div>
              <label
                className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide"
                style={{ color: TEXT_SECONDARY }}
              >
                Section Name *
              </label>

              <div className="relative">
                <FiLayers
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{
                    color: PRIMARY,
                  }}
                />

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="e.g. General Questions"
                  disabled={loading}
                  className="h-11 w-full rounded-xl pl-11 pr-4 text-sm font-medium outline-none placeholder:text-[#8C97B2] disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    border: `1px solid ${BORDER}`,
                    backgroundColor: loading
                      ? "#EEF3FA"
                      : PAGE_BG,
                    color: TEXT_PRIMARY,
                  }}
                  onFocus={(event) => {
                    if (!loading) {
                      event.currentTarget.style.borderColor =
                        ACCENT;
                      event.currentTarget.style.backgroundColor =
                        WHITE;
                      event.currentTarget.style.boxShadow =
                        "0 0 0 3px rgba(37,99,235,0.08)";
                    }
                  }}
                  onBlur={(event) => {
                    event.currentTarget.style.borderColor =
                      BORDER;
                    event.currentTarget.style.backgroundColor =
                      loading
                        ? "#EEF3FA"
                        : PAGE_BG;
                    event.currentTarget.style.boxShadow =
                      "none";
                  }}
                />
              </div>
            </div>

            {/* DESCRIPTION */}
            <div>
              <label
                className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide"
                style={{ color: TEXT_SECONDARY }}
              >
                Description
              </label>

              <div className="relative">
                <FiFileText
                  size={15}
                  className="absolute left-4 top-4"
                  style={{
                    color: PRIMARY,
                  }}
                />

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  placeholder="Write a short description for this FAQ section..."
                  rows={5}
                  disabled={loading}
                  className="w-full resize-none rounded-xl px-4 py-3 pl-11 text-sm font-medium leading-6 outline-none placeholder:text-[#8C97B2] disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    border: `1px solid ${BORDER}`,
                    backgroundColor: loading
                      ? "#EEF3FA"
                      : PAGE_BG,
                    color: TEXT_PRIMARY,
                  }}
                  onFocus={(event) => {
                    if (!loading) {
                      event.currentTarget.style.borderColor =
                        ACCENT;
                      event.currentTarget.style.backgroundColor =
                        WHITE;
                      event.currentTarget.style.boxShadow =
                        "0 0 0 3px rgba(37,99,235,0.08)";
                    }
                  }}
                  onBlur={(event) => {
                    event.currentTarget.style.borderColor =
                      BORDER;
                    event.currentTarget.style.backgroundColor =
                      loading
                        ? "#EEF3FA"
                        : PAGE_BG;
                    event.currentTarget.style.boxShadow =
                      "none";
                  }}
                />
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div
            className="flex flex-col-reverse gap-2 border-t px-5 py-4 sm:flex-row sm:justify-end"
            style={{
              borderColor:
                "rgba(30,58,138,0.10)",
              backgroundColor: "#FAFBFE",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border bg-white px-5 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50"
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
              className="flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(30,58,138,0.6)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background:
                  `linear-gradient(135deg, ${ACCENT}, ${PRIMARY}, ${DARK_PRIMARY})`,
              }}
            >
              {loading ? (
                <FiRefreshCw
                  size={15}
                  className="animate-spin"
                />
              ) : editingSection ? (
                <FiEdit3 size={15} />
              ) : (
                <FiPlus size={15} />
              )}

              {loading
                ? "Saving..."
                : editingSection
                  ? "Update Section"
                  : "Add Section"}
            </button>
          </div>
        </form>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// DELETE SECTION MODAL
// =====================================================

interface DeleteSectionModalProps {
  open: boolean;
  loading: boolean;
  section: FAQSection | null;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteSectionModal: React.FC<
  DeleteSectionModalProps
> = ({
  open,
  loading,
  section,
  onClose,
  onConfirm,
}) => {
  if (!open || !section) return null;

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={!loading}
    >
      <div className="w-full max-w-[420px] overflow-hidden rounded-[22px] border bg-white shadow-2xl">
        <div
          className="h-[3px] w-full"
          style={{
            background:
              `linear-gradient(to right, ${ACCENT}, ${DANGER})`,
          }}
        />

        <div className="p-5">
          <div className="flex items-start gap-4">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{
                backgroundColor:
                  DANGER_BG,
                color: DANGER,
              }}
            >
              <FiAlertTriangle
                size={20}
              />
            </div>

            <div className="min-w-0">
              <h2
                className="text-lg font-bold"
                style={{
                  color: TEXT_PRIMARY,
                }}
              >
                Delete Section
              </h2>

              <p
                className="mt-1 text-sm leading-6"
                style={{
                  color:
                    TEXT_SECONDARY,
                }}
              >
                Are you sure you want to delete
                this FAQ section?
              </p>

              <div
                className="mt-3 rounded-lg px-3 py-2"
                style={{
                  backgroundColor:
                    PAGE_BG,
                }}
              >
                <p
                  className="text-xs font-semibold leading-5"
                  style={{
                    color: TEXT_SECONDARY,
                  }}
                >
                  {truncateText(
                    section.name,
                    100
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border bg-white px-5 py-2.5 text-sm font-bold transition disabled:opacity-50"
              style={{
                borderColor: BORDER,
                color: TEXT_SECONDARY,
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(194,59,50,0.6)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background:
                  `linear-gradient(135deg, ${DANGER}, #A62F27)`,
              }}
            >
              {loading ? (
                <FiRefreshCw
                  size={14}
                  className="animate-spin"
                />
              ) : (
                <FiTrash2 size={14} />
              )}

              {loading
                ? "Deleting..."
                : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const SectionManagement: React.FC = () => {
  // ===================================================
  // PERMISSIONS
  // ===================================================

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

  const canViewSections = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess(
        "FAQ Sections"
      ) ||
      hasModuleAccess(
        "FAQ Section"
      ) ||
      hasModuleAccess(
        "faq_sections"
      ) ||
      hasModuleAccess(
        "faq_section"
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

  const canCreateSection = useMemo(
    () =>
      isSuperAdmin ||
      hasAnyPermission(
        CREATE_PERMISSION_KEYS
      ),
    [
      isSuperAdmin,
      hasAnyPermission,
    ]
  );

  const canUpdateSection = useMemo(
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

  const canDeleteSection = useMemo(
    () =>
      isSuperAdmin ||
      hasAnyPermission(
        DELETE_PERMISSION_KEYS
      ),
    [
      isSuperAdmin,
      hasAnyPermission,
    ]
  );

  // ===================================================
  // STATES
  // ===================================================

  const [sections, setSections] =
    useState<FAQSection[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [sectionModalOpen, setSectionModalOpen] =
    useState(false);

  const [editingSection, setEditingSection] =
    useState<FAQSection | null>(
      null
    );

  const [savingSection, setSavingSection] =
    useState(false);

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  const [selectedSection, setSelectedSection] =
    useState<FAQSection | null>(
      null
    );

  const ITEMS_PER_PAGE = 7;

  // ===================================================
  // FETCH PROTECTION
  // ===================================================

  const fetchInFlightRef =
    useRef<Promise<void> | null>(
      null
    );

  const hasInitialFetchRef =
    useRef(false);

  // ===================================================
  // FETCH
  // ===================================================

  const fetchSections = useCallback(
    async (force = false) => {
      if (!canViewSections) {
        return;
      }

      if (fetchInFlightRef.current) {
        return fetchInFlightRef.current;
      }

      if (
        !force &&
        hasInitialFetchRef.current
      ) {
        return;
      }

      const requestPromise = (async () => {
        try {
          setLoading(true);

          const response =
            await faqSectionsApi.getAll();

          if (response.data.success) {
            setSections(
              response.data.data || []
            );

            hasInitialFetchRef.current =
              true;
          } else {
            toast.error(
              response.data.message ||
                "Unable to fetch FAQ sections."
            );
          }
        } catch (error: any) {
          console.error(
            "Fetch FAQ sections error:",
            error
          );

          toast.error(
            error?.response?.data
              ?.message ||
              "Unable to fetch FAQ sections."
          );
        } finally {
          setLoading(false);
        }
      })();

      fetchInFlightRef.current =
        requestPromise;

      try {
        await requestPromise;
      } finally {
        fetchInFlightRef.current =
          null;
      }
    },
    [canViewSections]
  );

  // ===================================================
  // INITIAL FETCH
  // ===================================================

  useEffect(() => {
    if (
      !permissionsLoading &&
      canViewSections &&
      !hasInitialFetchRef.current
    ) {
      fetchSections();
    }
  }, [
    permissionsLoading,
    canViewSections,
    fetchSections,
  ]);

  // ===================================================
  // FILTER
  // ===================================================

  const filteredSections = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return [...sections]
      .filter((section) => {
        const matchesSearch =
          !query ||
          [
            section.name,
            section.slug,
            section.description,
            String(section.id),
            String(section.order),
          ]
            .join(" ")
            .toLowerCase()
            .includes(query);

        return matchesSearch;
      })
      .sort((a, b) => {
        if (a.order !== b.order) {
          return a.order - b.order;
        }

        return a.id - b.id;
      });
  }, [sections, search]);

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredSections.length /
        ITEMS_PER_PAGE
    )
  );

  const startIndex =
    (currentPage - 1) *
    ITEMS_PER_PAGE;

  const paginatedSections =
    filteredSections.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );

  const startEntry =
    filteredSections.length === 0
      ? 0
      : startIndex + 1;

  const endEntry = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredSections.length
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const paginationPages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from(
        {
          length: totalPages,
        },
        (_, index) => index + 1
      );
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

  // ===================================================
  // HANDLERS
  // ===================================================

  const openAddSection = () => {
    if (!canCreateSection) {
      toast.error(
        "You do not have permission to create FAQ sections."
      );
      return;
    }

    setEditingSection(null);
    setSectionModalOpen(true);
  };

  const openEditSection = (
    section: FAQSection
  ) => {
    if (!canUpdateSection) {
      toast.error(
        "You do not have permission to update FAQ sections."
      );
      return;
    }

    setEditingSection(section);
    setSectionModalOpen(true);
  };

  // ===================================================
  // SAVE
  // ===================================================

  const handleSaveSection = async (
    payload: SectionForm
  ) => {
    const hasPermissionForSave =
      editingSection
        ? canUpdateSection
        : canCreateSection;

    if (!hasPermissionForSave) {
      toast.error(
        editingSection
          ? "You do not have permission to update FAQ sections."
          : "You do not have permission to create FAQ sections."
      );
      return;
    }

    try {
      setSavingSection(true);

      let response;

      if (editingSection) {
        response =
          await faqSectionsApi.update(
            editingSection.id,
            {
              name: payload.name,
              description:
                payload.description,
              is_active:
                editingSection.is_active
                  ? 1
                  : 0,
            }
          );
      } else {
        response =
          await faqSectionsApi.create({
            name: payload.name,
            description:
              payload.description,
            is_active: 1,
          });
      }

      if (response.data.success) {
        toast.success(
          response.data.message ||
            (editingSection
              ? "Section updated successfully."
              : "Section added successfully.")
        );

        setSectionModalOpen(false);
        setEditingSection(null);

        await fetchSections(true);
      } else {
        toast.error(
          response.data.message ||
            "Unable to save section."
        );
      }
    } catch (error: any) {
      console.error(
        "Save FAQ section error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save section."
      );
    } finally {
      setSavingSection(false);
    }
  };

  // ===================================================
  // DELETE
  // ===================================================

  const openDelete = (
    section: FAQSection
  ) => {
    if (!canDeleteSection) {
      toast.error(
        "You do not have permission to delete FAQ sections."
      );
      return;
    }

    setSelectedSection(section);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedSection) {
      return;
    }

    if (!canDeleteSection) {
      toast.error(
        "You do not have permission to delete FAQ sections."
      );
      return;
    }

    try {
      setDeleteLoading(true);

      const response =
        await faqSectionsApi.delete(
          selectedSection.id
        );

      if (response.data.success) {
        toast.success(
          response.data.message ||
            "Section deleted successfully."
        );

        setDeleteOpen(false);
        setSelectedSection(null);

        await fetchSections(true);
      } else {
        toast.error(
          response.data.message ||
            "Unable to delete section."
        );
      }
    } catch (error: any) {
      console.error(
        "Delete FAQ section error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to delete section."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // ===================================================
  // PERMISSION LOADING
  // ===================================================

  if (permissionsLoading) {
    return (
      <div
        className="flex min-h-[500px] items-center justify-center p-6 font-poppins"
        style={{
          backgroundColor: PAGE_BG,
        }}
      >
        <div className="flex flex-col items-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm"
            style={{ color: PRIMARY }}
          >
            <FiRefreshCw
              size={23}
              className="animate-spin"
            />
          </div>

          <p
            className="mt-4 text-sm font-bold"
            style={{
              color: TEXT_PRIMARY,
            }}
          >
            Checking permissions...
          </p>

          <p
            className="mt-1 text-[10px]"
            style={{ color: MUTED }}
          >
            Verifying FAQ section access.
          </p>
        </div>
      </div>
    );
  }


  if (
    loading &&
    sections.length === 0
  ) {
    return (
      <div
        className="flex min-h-[500px] items-center justify-center p-6 font-poppins"
        style={{
          backgroundColor: PAGE_BG,
        }}
      >
        <div className="flex flex-col items-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm"
            style={{ color: PRIMARY }}
          >
            <FiRefreshCw
              size={23}
              className="animate-spin"
            />
          </div>

          <p
            className="mt-4 text-sm font-bold"
            style={{
              color: TEXT_PRIMARY,
            }}
          >
            Loading sections...
          </p>

          <p
            className="mt-1 text-[10px]"
            style={{ color: MUTED }}
          >
            Fetching FAQ section data.
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="min-h-screen p-4 font-poppins sm:p-5 lg:p-6"
        style={{
          backgroundColor: PAGE_BG,
        }}
      >
        {/* PAGE HEADER */}
        <motion.div
          variants={itemVariants}
          className="mb-5 flex flex-col justify-between gap-3 xl:flex-row xl:items-center"
        >
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor:
                    PRIMARY,
                }}
              />

              <span
                className="text-[9px] font-bold uppercase tracking-[0.22em]"
                style={{
                  color: ACCENT,
                }}
              >
                Website Configuration
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1
                className="text-[27px] font-bold tracking-tight sm:text-[30px]"
                style={{
                  color:
                    TEXT_PRIMARY,
                }}
              >
                Section Management
              </h1>

              <span
                className="rounded-full border bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide"
                style={{
                  borderColor:
                    "rgba(30,58,138,0.15)",
                  color: PRIMARY,
                }}
              >
                FAQ Sections
              </span>
            </div>

            <p
              className="mt-1 max-w-2xl text-xs leading-5"
              style={{
                color: TEXT_SECONDARY,
              }}
            >
              Manage your FAQ sections,
              descriptions, ordering and active
              status.
            </p>
          </div>

          <div className="flex gap-2">
            {/* REFRESH */}
            <button
              type="button"
              onClick={() =>
                fetchSections(true)
              }
              disabled={loading}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border bg-white px-4 text-xs font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                borderColor: BORDER,
                color: PRIMARY,
              }}
              onMouseEnter={(event) => {
                if (!loading) {
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
                size={15}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            {/* ADD */}
            {canCreateSection && (
              <button
                type="button"
                onClick={
                  openAddSection
                }
                className="flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold text-white shadow-[0_8px_18px_-8px_rgba(30,58,138,0.6)] transition hover:-translate-y-0.5"
                style={{
                  background:
                    `linear-gradient(135deg, ${ACCENT}, ${PRIMARY}, ${DARK_PRIMARY})`,
                }}
              >
                <FiPlus size={15} />
                Add Section
              </button>
            )}

            {!canCreateSection && (
              <div
                className="flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-xs font-bold"
                style={{
                  borderColor: BORDER,
                  color: MUTED,
                }}
              >
                <FiShield size={14} />
                View Only
              </div>
            )}
          </div>
        </motion.div>

        {/* MAIN CARD */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-[20px] border bg-white shadow-[0_8px_30px_rgba(30,58,138,0.06)]"
          style={{
            borderColor: "#E0E7F2",
          }}
        >
          {/* TOP LINE */}
          <div
            className="absolute left-0 right-0 top-0 h-[3px]"
            style={{
              background:
                `linear-gradient(to right, #6EA0FF, ${PRIMARY}, ${DARK_PRIMARY})`,
            }}
          />

          {/* TOOLBAR */}
          <div
            className="border-b p-4"
            style={{
              borderColor:
                "rgba(30,58,138,0.10)",
            }}
          >
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* SEARCH */}
              <div className="relative w-full sm:max-w-[420px]">
                <FiSearch
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{
                    color: PRIMARY,
                  }}
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => {
                    setSearch(
                      event.target.value
                    );
                    setCurrentPage(1);
                  }}
                  placeholder="Search section, description or ID..."
                  className="h-11 w-full rounded-xl pl-11 pr-4 text-xs outline-none placeholder:text-[#8C97B2]"
                  style={{
                    border: `1px solid ${BORDER}`,
                    backgroundColor:
                      PAGE_BG,
                    color:
                      TEXT_PRIMARY,
                  }}
                  onFocus={(event) => {
                    event.currentTarget.style.borderColor =
                      ACCENT;
                    event.currentTarget.style.backgroundColor =
                      WHITE;
                    event.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(37,99,235,0.08)";
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

              {/* ADD SECTION */}
              {canCreateSection && (
                <button
                  type="button"
                  onClick={
                    openAddSection
                  }
                  className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-xs font-bold text-white shadow-[0_8px_18px_-8px_rgba(30,58,138,0.6)] transition hover:-translate-y-0.5"
                  style={{
                    background:
                      `linear-gradient(135deg, ${ACCENT}, ${PRIMARY}, ${DARK_PRIMARY})`,
                  }}
                >
                  <FiPlus size={15} />
                  Add Section
                </button>
              )}
            </div>
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr
                  style={{
                    backgroundColor:
                      PRIMARY,
                  }}
                >
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                    S.No
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                    Section
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                    Slug
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                    Description
                  </th>

                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedSections.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-14 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor:
                              LIGHT_BLUE,
                            color: PRIMARY,
                          }}
                        >
                          <FiLayers
                            size={21}
                          />
                        </div>

                        <p
                          className="mt-3 text-sm font-bold"
                          style={{
                            color:
                              TEXT_PRIMARY,
                          }}
                        >
                          No sections found
                        </p>

                        <p
                          className="mt-1 text-[10px]"
                          style={{
                            color: MUTED,
                          }}
                        >
                          Add a new FAQ section
                          to get started.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedSections.map(
                    (
                      section,
                      index
                    ) => (
                      <motion.tr
                        key={
                          section.id
                        }
                        initial={{
                          opacity: 0,
                          y: 5,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          delay:
                            index *
                            0.03,
                        }}
                        className="border-b bg-white transition hover:bg-[#F9FBFF]"
                        style={{
                          borderColor:
                            "#EEF2F8",
                        }}
                      >
                        {/* S.NO */}
                        <td className="px-5 py-4">
                          <span
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
                            style={{
                              backgroundColor:
                                LIGHT_BLUE,
                              color:
                                PRIMARY,
                            }}
                          >
                            {startIndex +
                              index +
                              1}
                          </span>
                        </td>

                        {/* SECTION */}
                        <td className="max-w-[280px] px-5 py-4">
                          <div className="flex items-start gap-3">
                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                              style={{
                                backgroundColor:
                                  LIGHT_BLUE,
                                color:
                                  PRIMARY,
                              }}
                            >
                              <FiLayers
                                size={17}
                              />
                            </div>

                            <div className="min-w-0">
                              <p
                                className="text-sm font-bold leading-5"
                                style={{
                                  color:
                                    TEXT_PRIMARY,
                                }}
                              >
                                {
                                  section.name
                                }
                              </p>

                              <p
                                className="mt-1 text-[10px]"
                                style={{
                                  color:
                                    MUTED,
                                }}
                              >
                                Section #
                                {
                                  section.id
                                }
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* SLUG */}
                        <td className="max-w-[180px] px-5 py-4">
                          <span
                            className="inline-block rounded-lg px-2.5 py-1.5 font-mono text-[10px] font-semibold"
                            style={{
                              backgroundColor:
                                PAGE_BG,
                              color:
                                TEXT_SECONDARY,
                            }}
                          >
                            {section.slug ||
                              "-"}
                          </span>
                        </td>

                        {/* DESCRIPTION */}
                        <td className="max-w-[330px] px-5 py-4">
                          <p
                            className="text-xs leading-5"
                            style={{
                              color:
                                TEXT_SECONDARY,
                            }}
                          >
                            {truncateText(
                              section.description,
                              120
                            )}
                          </p>
                        </td>

                        {/* ACTIONS */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* EDIT */}
                            {canUpdateSection && (
                              <button
                                type="button"
                                title="Edit Section"
                                onClick={() =>
                                  openEditSection(
                                    section
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-xl border transition hover:text-white"
                                style={{
                                  borderColor:
                                    "#C9D9F4",
                                  backgroundColor:
                                    LIGHT_BLUE,
                                  color:
                                    PRIMARY,
                                }}
                                onMouseEnter={(
                                  event
                                ) => {
                                  event.currentTarget.style.backgroundColor =
                                    PRIMARY;
                                  event.currentTarget.style.borderColor =
                                    PRIMARY;
                                }}
                                onMouseLeave={(
                                  event
                                ) => {
                                  event.currentTarget.style.backgroundColor =
                                    LIGHT_BLUE;
                                  event.currentTarget.style.borderColor =
                                    "#C9D9F4";
                                  event.currentTarget.style.color =
                                    PRIMARY;
                                }}
                              >
                                <FiEdit3
                                  size={15}
                                />
                              </button>
                            )}

                            {/* DELETE */}
                            {canDeleteSection && (
                              <button
                                type="button"
                                title="Delete Section"
                                onClick={() =>
                                  openDelete(
                                    section
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-xl border transition hover:border-transparent hover:bg-[#C23B32] hover:text-white"
                                style={{
                                  borderColor:
                                    "rgba(194,59,50,0.20)",
                                  backgroundColor:
                                    DANGER_BG,
                                  color:
                                    DANGER,
                                }}
                              >
                                <FiTrash2
                                  size={15}
                                />
                              </button>
                            )}

                            {!canUpdateSection &&
                              !canDeleteSection && (
                                <span
                                  className="rounded-lg border px-3 py-2 text-[9px] font-semibold"
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
                          </div>
                        </td>
                      </motion.tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE */}
          <div className="block lg:hidden">
            {paginatedSections.length >
            0 ? (
              paginatedSections.map(
                (section) => (
                  <motion.div
                    key={section.id}
                    variants={itemVariants}
                    className="border-b p-4"
                    style={{
                      borderColor:
                        "#EEF2F8",
                    }}
                  >
                    {/* TOP */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor:
                              LIGHT_BLUE,
                            color:
                              PRIMARY,
                          }}
                        >
                          <FiLayers
                            size={17}
                          />
                        </div>

                        <div className="min-w-0">
                          <p
                            className="text-[10px] font-bold uppercase tracking-wide"
                            style={{
                              color:
                                MUTED,
                            }}
                          >
                            Section
                          </p>

                          <p
                            className="mt-1 text-sm font-bold leading-5"
                            style={{
                              color:
                                TEXT_PRIMARY,
                            }}
                          >
                            {section.name}
                          </p>

                          <p
                            className="mt-1 font-mono text-[9px]"
                            style={{
                              color:
                                MUTED,
                            }}
                          >
                            Section #
                            {section.id}
                          </p>
                        </div>
                      </div>

                      <span
                        className="shrink-0 rounded-lg px-2.5 py-1.5 text-[9px] font-bold"
                        style={{
                          backgroundColor:
                            PAGE_BG,
                          color:
                            PRIMARY,
                        }}
                      >
                        Order{" "}
                        {section.order}
                      </span>
                    </div>

                    {/* SLUG */}
                    <div
                      className="mt-3 rounded-xl border p-3"
                      style={{
                        borderColor:
                          "rgba(30,58,138,0.10)",
                        backgroundColor:
                          "#FAFBFE",
                      }}
                    >
                      <p
                        className="text-[9px] font-bold uppercase tracking-wide"
                        style={{
                          color:
                            MUTED,
                        }}
                      >
                        Slug
                      </p>

                      <p
                        className="mt-1 font-mono text-xs"
                        style={{
                          color:
                            TEXT_SECONDARY,
                        }}
                      >
                        {section.slug ||
                          "-"}
                      </p>
                    </div>

                    {/* DESCRIPTION */}
                    <div
                      className="mt-3 rounded-xl border p-3"
                      style={{
                        borderColor:
                          "rgba(30,58,138,0.10)",
                        backgroundColor:
                          "#FAFBFE",
                      }}
                    >
                      <p
                        className="text-[9px] font-bold uppercase tracking-wide"
                        style={{
                          color:
                            MUTED,
                        }}
                      >
                        Description
                      </p>

                      <p
                        className="mt-1 text-xs leading-5"
                        style={{
                          color:
                            TEXT_SECONDARY,
                        }}
                      >
                        {truncateText(
                          section.description,
                          180
                        )}
                      </p>
                    </div>

                    {/* BOTTOM */}
                    <div className="mt-3 flex items-center justify-end gap-2">
                      {canUpdateSection && (
                        <button
                          type="button"
                          onClick={() =>
                            openEditSection(
                              section
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl border"
                          style={{
                            borderColor:
                              "#C9D9F4",
                            backgroundColor:
                              LIGHT_BLUE,
                            color:
                              PRIMARY,
                          }}
                        >
                          <FiEdit3
                            size={14}
                          />
                        </button>
                      )}

                      {canDeleteSection && (
                        <button
                          type="button"
                          onClick={() =>
                            openDelete(
                              section
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl border"
                          style={{
                            borderColor:
                              "rgba(194,59,50,0.20)",
                            backgroundColor:
                              DANGER_BG,
                            color:
                              DANGER,
                          }}
                        >
                          <FiTrash2
                            size={14}
                          />
                        </button>
                      )}

                      {!canUpdateSection &&
                        !canDeleteSection && (
                          <span
                            className="rounded-lg border px-3 py-2 text-[9px] font-semibold"
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
                    </div>
                  </motion.div>
                )
              )
            ) : (
              <div className="flex flex-col items-center px-5 py-14 text-center">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor:
                      LIGHT_BLUE,
                    color: PRIMARY,
                  }}
                >
                  <FiLayers size={22} />
                </div>

                <p
                  className="mt-3 text-sm font-bold"
                  style={{
                    color:
                      TEXT_PRIMARY,
                  }}
                >
                  No sections found
                </p>

                <p
                  className="mt-1 text-[10px]"
                  style={{
                    color: MUTED,
                  }}
                >
                  Add a section from the button
                  above.
                </p>
              </div>
            )}
          </div>

          {/* PAGINATION */}
          {filteredSections.length >
            0 && (
            <div
              className="border-t px-4 py-4"
              style={{
                borderColor:
                  "rgba(30,58,138,0.10)",
                backgroundColor:
                  "#FAFBFE",
              }}
            >
              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p
                  className="text-[10px]"
                  style={{
                    color: MUTED,
                  }}
                >
                  Showing{" "}
                  <strong
                    style={{
                      color:
                        TEXT_SECONDARY,
                    }}
                  >
                    {startEntry}
                  </strong>{" "}
                  to{" "}
                  <strong
                    style={{
                      color:
                        TEXT_SECONDARY,
                    }}
                  >
                    {endEntry}
                  </strong>{" "}
                  of{" "}
                  <strong
                    style={{
                      color:
                        TEXT_SECONDARY,
                    }}
                  >
                    {filteredSections.length}
                  </strong>
                </p>

                <div className="flex items-center gap-1.5">
                  {/* PREVIOUS */}
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          page - 1
                      )
                    }
                    disabled={
                      currentPage === 1
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white transition hover:bg-[#EAF1FF] disabled:opacity-30"
                    style={{
                      borderColor:
                        BORDER,
                      color:
                        PRIMARY,
                    }}
                  >
                    <FiChevronLeft
                      size={15}
                    />
                  </button>

                  {paginationPages.map(
                    (page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() =>
                          setCurrentPage(
                            page
                          )
                        }
                        className="flex h-8 min-w-8 items-center justify-center rounded-lg px-2.5 text-[10px] font-bold transition"
                        style={{
                          background:
                            currentPage ===
                            page
                              ? `linear-gradient(135deg, ${ACCENT}, ${PRIMARY})`
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
                              ? "0 6px 14px -6px rgba(30,58,138,0.5)"
                              : "none",
                        }}
                      >
                        {page}
                      </button>
                    )
                  )}

                  {/* NEXT */}
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          page + 1
                      )
                    }
                    disabled={
                      currentPage ===
                      totalPages
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white transition hover:bg-[#EAF1FF] disabled:opacity-30"
                    style={{
                      borderColor:
                        BORDER,
                      color:
                        PRIMARY,
                    }}
                  >
                    <FiChevronRight
                      size={15}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        <div className="h-4" />
      </motion.div>

      {/* ADD / EDIT */}
      <SectionModal
        open={sectionModalOpen}
        editingSection={editingSection}
        loading={savingSection}
        onClose={() => {
          if (savingSection) return;

          setSectionModalOpen(false);
          setEditingSection(null);
        }}
        onSubmit={
          handleSaveSection
        }
      />

      {/* DELETE */}
      <DeleteSectionModal
        open={deleteOpen}
        loading={deleteLoading}
        section={selectedSection}
        onClose={() => {
          if (deleteLoading) return;

          setDeleteOpen(false);
          setSelectedSection(null);
        }}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default SectionManagement;