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
  FiAlertCircle,
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

import GlobalModal from "@/components/common/GlobalModal";

import faqSectionsApi, {
  FAQSection,
} from "../../api/endpoints/faqSectionsApi";

import { usePermissions } from "../../pages/permissions/usePermissions";

// =====================================================
// BLUE / YELLOW THEME
// =====================================================

const PRIMARY = "#2D6FE8";
const BLUE = "#4F8FF7";
const YELLOW = "#FACC15";

const LIGHT_BLUE = "#EAF3FF";
const PAGE_BG = "#F4F8FD";

const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#6B7280";
const MUTED = "#6B7280";

const BORDER = "#DCE6F2";
const WHITE = "#FFFFFF";

const DANGER = "#C23B32";
const DANGER_BG = "#FEF2F2";

// =====================================================
// FAQ PERMISSIONS
//
// Section Management uses the existing FAQ permissions.
// Separate faq_section / faq_sections permissions
// are intentionally not checked.
//
// Supported permission formats:
// faq.view
// faq.create
// faq.update
// faq.edit
// faq.delete
//
// If the existing FAQ module uses "faqs" instead of
// "faq", plural aliases are supported as well.
// =====================================================

const VIEW_PERMISSION_KEYS = [
  "faq.view",
  "faqs.view",
  "FAQ.view",
  "FAQs.view",
];

const CREATE_PERMISSION_KEYS = [
  "faq.create",
  "faqs.create",
  "FAQ.create",
  "FAQs.create",
];

const UPDATE_PERMISSION_KEYS = [
  "faq.update",
  "faqs.update",
  "FAQ.update",
  "FAQs.update",
  "faq.edit",
  "faqs.edit",
  "FAQ.edit",
  "FAQs.edit",
];

const DELETE_PERMISSION_KEYS = [
  "faq.delete",
  "faqs.delete",
  "FAQ.delete",
  "FAQs.delete",
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
      damping: 16,
    },
  },
};

// =====================================================
// HELPERS
// =====================================================

const truncateText = (
  value: string | null | undefined,
  length = 100,
) => {
  if (!value) return "-";

  return value.length > length
    ? `${value.slice(0, length).trim()}...`
    : value;
};

const sectionGradient = `linear-gradient(135deg, ${BLUE}, ${PRIMARY})`;

const accentGradient = `linear-gradient(to right, ${BLUE}, ${PRIMARY}, ${YELLOW})`;

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
    setDescription(editingSection?.description || "");
  }, [open, editingSection]);

  if (!open) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      toast.error("Section name is required.");
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim(),
    });
  };

  const fieldClass =
    "w-full rounded-xl border px-4 py-3 text-sm font-medium text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/10 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={!loading}
    >
      <div className="w-full max-w-[560px] overflow-hidden rounded-[22px] border border-[#DCE6F2] bg-white font-poppins shadow-2xl">
        <div
          className="h-[3px] w-full"
          style={{ background: accentGradient }}
        />

        <div className="flex items-start justify-between gap-4 border-b border-[#DCE6F2] px-5 py-5">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2D6FE8]">
                {editingSection ? (
                  <FiEdit3 size={15} />
                ) : (
                  <FiPlus size={15} />
                )}
              </div>

              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#4F8FF7]">
                FAQ Management
              </span>

              <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]" />
            </div>

            <h2 className="text-lg font-bold text-[#111827]">
              {editingSection ? "Edit Section" : "Add Section"}
            </h2>

            <p className="mt-1 text-[11px] text-[#6B7280]">
              {editingSection
                ? "Update the FAQ section details."
                : "Create a new FAQ section."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F4F8FD] text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:opacity-50"
            aria-label="Close section form"
          >
            <FiX size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-5">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">
                Section Name *
              </label>

              <div className="relative">
                <FiLayers
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2D6FE8]"
                />

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="e.g. General Questions"
                  disabled={loading}
                  className={`${fieldClass} h-11 bg-[#F4F8FD] pl-11 pr-4`}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">
                Description
              </label>

              <div className="relative">
                <FiFileText
                  size={15}
                  className="absolute left-4 top-4 text-[#2D6FE8]"
                />

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Write a short description for this FAQ section..."
                  rows={5}
                  disabled={loading}
                  className={`${fieldClass} resize-none bg-[#F4F8FD] pl-11 leading-6`}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-[#DCE6F2] bg-[#F8FBFF] px-5 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-[#DCE6F2] bg-white px-5 py-2.5 text-sm font-bold text-[#6B7280] transition hover:bg-[#F4F8FD] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(45,111,232,0.6)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: sectionGradient }}
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
      <div className="w-full max-w-[420px] overflow-hidden rounded-[22px] border border-[#DCE6F2] bg-white font-poppins shadow-2xl">
        <div
          className="h-[3px] w-full"
          style={{
            background: `linear-gradient(to right, ${BLUE}, ${DANGER})`,
          }}
        />

        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FEF2F2] text-[#C23B32]">
              <FiAlertTriangle size={20} />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#111827]">
                Delete Section
              </h2>

              <p className="mt-1 text-sm leading-6 text-[#6B7280]">
                Are you sure you want to delete this FAQ section?
              </p>

              <div className="mt-3 rounded-lg bg-[#F4F8FD] px-3 py-2">
                <p className="text-xs font-semibold leading-5 text-[#6B7280]">
                  {truncateText(section.name, 100)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[#EAF3FF] disabled:opacity-50"
              aria-label="Close delete confirmation"
            >
              <FiX size={16} />
            </button>
          </div>

          <div className="mt-4 flex justify-end gap-2">
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
              className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#C23B32] to-[#A62F27] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(194,59,50,0.6)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <FiRefreshCw
                  size={14}
                  className="animate-spin"
                />
              ) : (
                <FiTrash2 size={14} />
              )}

              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// PERMISSION / LOADING STATES
// =====================================================

const PermissionLoading: React.FC = () => (
  <div className="flex min-h-[500px] items-center justify-center bg-[#F4F8FD] p-6 font-poppins">
    <div className="flex flex-col items-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#2D6FE8] shadow-sm">
        <FiRefreshCw
          size={23}
          className="animate-spin"
        />
      </div>

      <p className="mt-4 text-sm font-bold text-[#111827]">
        Checking permissions...
      </p>

      <p className="mt-1 text-[10px] text-[#6B7280]">
        Verifying FAQ access.
      </p>
    </div>
  </div>
);

const AccessDenied: React.FC = () => (
  <div className="flex min-h-[500px] items-center justify-center bg-[#F4F8FD] p-4 font-poppins">
    <div className="max-w-md rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-lg">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#C23B32]">
        <FiAlertCircle size={26} />
      </div>

      <h2 className="text-lg font-bold text-[#111827]">
        Access Denied
      </h2>

      <p className="mt-2 text-sm text-[#6B7280]">
        You don't have permission to access FAQ Management.
      </p>

      <div className="mt-5 rounded-xl border border-[#C23B32]/15 bg-[#FEF2F2] px-4 py-3 text-[10px] font-semibold text-[#C23B32]">
        Contact your administrator to request access.
      </div>
    </div>
  </div>
);

// =====================================================
// MAIN COMPONENT
// =====================================================

const SectionManagement: React.FC = () => {
  const {
    hasPermission,
    hasModuleAccess,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  // ---------------------------------------------------
  // CHECK THE EXISTING FAQ PERMISSIONS
  // ---------------------------------------------------

  const hasAnyPermission = useCallback(
    (permissions: string[]) =>
      permissions.some((permission) =>
        hasPermission(permission),
      ),
    [hasPermission],
  );

  // ---------------------------------------------------
  // VIEW PERMISSION
  //
  // Uses the FAQ module only.
  // No faq_section / faq_sections module checks.
  // ---------------------------------------------------

  const canViewSections = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("faq") ||
      hasModuleAccess("faqs") ||
      hasAnyPermission(VIEW_PERMISSION_KEYS),
    [
      isSuperAdmin,
      hasModuleAccess,
      hasAnyPermission,
    ],
  );

  // ---------------------------------------------------
  // CREATE PERMISSION
  // ---------------------------------------------------

  const canCreateSection = useMemo(
    () =>
      isSuperAdmin ||
      hasAnyPermission(CREATE_PERMISSION_KEYS),
    [isSuperAdmin, hasAnyPermission],
  );

  // ---------------------------------------------------
  // UPDATE PERMISSION
  // ---------------------------------------------------

  const canUpdateSection = useMemo(
    () =>
      isSuperAdmin ||
      hasAnyPermission(UPDATE_PERMISSION_KEYS),
    [isSuperAdmin, hasAnyPermission],
  );

  // ---------------------------------------------------
  // DELETE PERMISSION
  // ---------------------------------------------------

  const canDeleteSection = useMemo(
    () =>
      isSuperAdmin ||
      hasAnyPermission(DELETE_PERMISSION_KEYS),
    [isSuperAdmin, hasAnyPermission],
  );

  // ---------------------------------------------------
  // STATE
  // ---------------------------------------------------

  const [sections, setSections] = useState<FAQSection[]>(
    [],
  );

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [sectionModalOpen, setSectionModalOpen] =
    useState(false);

  const [editingSection, setEditingSection] =
    useState<FAQSection | null>(null);

  const [savingSection, setSavingSection] =
    useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] =
    useState(false);

  const [selectedSection, setSelectedSection] =
    useState<FAQSection | null>(null);

  const ITEMS_PER_PAGE = 7;

  const fetchInFlightRef =
    useRef<Promise<void> | null>(null);

  const hasInitialFetchRef = useRef(false);

  // ===================================================
  // FETCH FAQ SECTIONS
  // ===================================================

  const fetchSections = useCallback(
    async (force = false) => {
      if (!canViewSections) return;

      if (fetchInFlightRef.current) {
        return fetchInFlightRef.current;
      }

      if (!force && hasInitialFetchRef.current) {
        return;
      }

      const requestPromise = (async () => {
        try {
          setLoading(true);

          const response = await faqSectionsApi.getAll();

          if (response.data.success) {
            setSections(response.data.data || []);
            hasInitialFetchRef.current = true;
          } else {
            toast.error(
              response.data.message ||
                "Unable to fetch FAQ sections.",
            );
          }
        } catch (error: any) {
          console.error(
            "Fetch FAQ sections error:",
            error,
          );

          toast.error(
            error?.response?.data?.message ||
              "Unable to fetch FAQ sections.",
          );
        } finally {
          setLoading(false);
        }
      })();

      fetchInFlightRef.current = requestPromise;

      try {
        await requestPromise;
      } finally {
        fetchInFlightRef.current = null;
      }
    },
    [canViewSections],
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
      void fetchSections();
    }
  }, [
    permissionsLoading,
    canViewSections,
    fetchSections,
  ]);

  // ===================================================
  // SEARCH AND SORT
  // ===================================================

  const filteredSections = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...sections]
      .filter((section) =>
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
          .includes(query),
      )
      .sort((a, b) =>
        a.order !== b.order
          ? a.order - b.order
          : a.id - b.id,
      );
  }, [sections, search]);

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredSections.length / ITEMS_PER_PAGE,
    ),
  );

  const startIndex =
    (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedSections = filteredSections.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const startEntry =
    filteredSections.length === 0
      ? 0
      : startIndex + 1;

  const endEntry = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredSections.length,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
  // ADD SECTION
  // ===================================================

  const openAddSection = () => {
    if (!canCreateSection) {
      toast.error(
        "You do not have permission to create FAQ sections.",
      );
      return;
    }

    setEditingSection(null);
    setSectionModalOpen(true);
  };

  // ===================================================
  // EDIT SECTION
  // ===================================================

  const openEditSection = (section: FAQSection) => {
    if (!canUpdateSection) {
      toast.error(
        "You do not have permission to update FAQ sections.",
      );
      return;
    }

    setEditingSection(section);
    setSectionModalOpen(true);
  };

  // ===================================================
  // SAVE SECTION
  // ===================================================

  const handleSaveSection = async (
    payload: SectionForm,
  ) => {
    const hasPermissionForSave = editingSection
      ? canUpdateSection
      : canCreateSection;

    if (!hasPermissionForSave) {
      toast.error(
        editingSection
          ? "You do not have permission to update FAQ sections."
          : "You do not have permission to create FAQ sections.",
      );
      return;
    }

    try {
      setSavingSection(true);

      const response = editingSection
        ? await faqSectionsApi.update(
            editingSection.id,
            {
              name: payload.name,
              description: payload.description,
              is_active: editingSection.is_active
                ? 1
                : 0,
            },
          )
        : await faqSectionsApi.create({
            name: payload.name,
            description: payload.description,
            is_active: 1,
          });

      if (response.data.success) {
        toast.success(
          response.data.message ||
            (editingSection
              ? "Section updated successfully."
              : "Section added successfully."),
        );

        setSectionModalOpen(false);
        setEditingSection(null);

        await fetchSections(true);
      } else {
        toast.error(
          response.data.message ||
            "Unable to save section.",
        );
      }
    } catch (error: any) {
      console.error(
        "Save FAQ section error:",
        error,
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save section.",
      );
    } finally {
      setSavingSection(false);
    }
  };

  // ===================================================
  // OPEN DELETE MODAL
  // ===================================================

  const openDelete = (section: FAQSection) => {
    if (!canDeleteSection) {
      toast.error(
        "You do not have permission to delete FAQ sections.",
      );
      return;
    }

    setSelectedSection(section);
    setDeleteOpen(true);
  };

  // ===================================================
  // DELETE SECTION
  // ===================================================

  const handleDelete = async () => {
    if (!selectedSection) return;

    if (!canDeleteSection) {
      toast.error(
        "You do not have permission to delete FAQ sections.",
      );
      return;
    }

    try {
      setDeleteLoading(true);

      const response = await faqSectionsApi.delete(
        selectedSection.id,
      );

      if (response.data.success) {
        toast.success(
          response.data.message ||
            "Section deleted successfully.",
        );

        setDeleteOpen(false);
        setSelectedSection(null);

        await fetchSections(true);
      } else {
        toast.error(
          response.data.message ||
            "Unable to delete section.",
        );
      }
    } catch (error: any) {
      console.error(
        "Delete FAQ section error:",
        error,
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to delete section.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // ===================================================
  // ACCESS STATES
  // ===================================================

  if (permissionsLoading) {
    return <PermissionLoading />;
  }

  if (!canViewSections) {
    return <AccessDenied />;
  }

  if (loading && sections.length === 0) {
    return (
      <div className="flex min-h-[500px] items-center justify-center bg-[#F4F8FD] p-6 font-poppins">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#2D6FE8] shadow-sm">
            <FiRefreshCw
              size={23}
              className="animate-spin"
            />
          </div>

          <p className="mt-4 text-sm font-bold text-[#111827]">
            Loading sections...
          </p>

          <p className="mt-1 text-[10px] text-[#6B7280]">
            Fetching FAQ section data.
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-white p-4 font-poppins sm:p-5 lg:p-6"
    >
      {/* PAGE HEADER */}

      <motion.div
        variants={itemVariants}
        className="mb-5 flex flex-col justify-between gap-3 xl:flex-row xl:items-center"
      >
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2D6FE8]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#4F8FF7]" />

            <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#4F8FF7]">
              Website Configuration
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
           <h1 className="text-[20px] font-medium tracking-tight text-[#111827] sm:text-[22px]">
              Section Management
            </h1>

            <span className="rounded-full border border-[#DCE6F2] bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#2D6FE8]">
              FAQ Sections
            </span>
          </div>

          <p className="mt-0.5 text-sm text-[#111827]">
            Manage your FAQ sections, descriptions,
            ordering and active status.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void fetchSections(true)}
            disabled={loading}
            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#DCE6F2] bg-white px-4 text-xs font-bold text-[#2D6FE8]  transition hover:border-[#4F8FF7] hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiRefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          {canCreateSection ? (
            <button
              type="button"
              onClick={openAddSection}
              className="flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold text-white transition hover:-translate-y-0.5"
              style={{ background: sectionGradient }}
            >
              <FiPlus size={15} />
              Add Section
            </button>
          ) : (
            <div className="flex h-10 items-center gap-2 rounded-xl border border-[#DCE6F2] bg-white px-4 text-xs font-bold text-[#6B7280]">
              <FiShield size={14} />
              View Only
            </div>
          )}
        </div>
      </motion.div>

      {/* MAIN CARD */}

      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-[20px] border border-[#DCE6F2] bg-white shadow-[0_8px_30px_rgba(45,111,232,0.06)]"
      >


        {/* TOOLBAR */}

        <div className="border-b border-[#DCE6F2] p-4">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-[420px]">
              <FiSearch
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2D6FE8]"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search section, description or ID..."
                className="h-11 w-full rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] pl-11 pr-4 text-xs text-[#111827] outline-none placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/10"
              />
            </div>

          </div>

          
        </div>

        {/* DESKTOP TABLE */}

        <div className="hidden overflow-x-auto lg:block rounded-2xl">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="bg-[#4F8FF7]">
                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                  S.No
                </th>

                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                  Section
                </th>

                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                  Slug
                </th>

                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                  Description
                </th>

                <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedSections.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-14 text-center"
                  >
                    <div className="flex flex-col items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#2D6FE8]">
                        <FiLayers size={21} />
                      </div>

                      <p className="mt-3 text-sm font-bold text-[#111827]">
                        No sections found
                      </p>

                      <p className="mt-1 text-[10px] text-[#6B7280]">
                        Add a new FAQ section to get started.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedSections.map((section, index) => (
                  <motion.tr
                    key={section.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-[#DCE6F2] bg-white transition hover:bg-[#F8FBFF]"
                  >
                    <td className="px-5 py-4 align-top">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF3FF] text-xs font-bold text-[#2D6FE8]">
                        {startIndex + index + 1}
                      </span>
                    </td>

                    <td className="max-w-[280px] px-5 py-4 align-top">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-white">
                          <FiLayers size={17} />
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-bold leading-5 text-[#111827]">
                            {section.name}
                          </p>

                          <p className="mt-1 text-[10px] text-[#6B7280]">
                            Section #{section.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="max-w-[180px] px-5 py-4 align-top">
                      <span className="inline-block max-w-full truncate rounded-lg bg-[#F4F8FD] px-2.5 py-1.5 font-mono text-[10px] font-semibold text-[#6B7280]">
                        {section.slug || "-"}
                      </span>
                    </td>

                    <td className="max-w-[330px] px-5 py-4 align-top">
                      <p className="text-xs leading-5 text-[#6B7280]">
                        {truncateText(section.description, 120)}
                      </p>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <div className="flex items-center justify-center gap-1.5">
                        {canUpdateSection && (
                          <button
                            type="button"
                            title="Edit Section"
                            onClick={() =>
                              openEditSection(section)
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#DCE6F2] bg-[#EAF3FF] text-[#2D6FE8] transition hover:border-[#2D6FE8] hover:bg-[#2D6FE8] hover:text-white"
                          >
                            <FiEdit3 size={15} />
                          </button>
                        )}

                        {canDeleteSection && (
                          <button
                            type="button"
                            title="Delete Section"
                            onClick={() => openDelete(section)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#C23B32]/20 bg-[#FEF2F2] text-[#C23B32] transition hover:border-transparent hover:bg-[#C23B32] hover:text-white"
                          >
                            <FiTrash2 size={15} />
                          </button>
                        )}

                        {!canUpdateSection &&
                          !canDeleteSection && (
                            <span className="rounded-lg border border-[#DCE6F2] bg-[#F8FBFF] px-3 py-2 text-[9px] font-semibold text-[#6B7280]">
                              View Only
                            </span>
                          )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS */}

        <div className="block lg:hidden">
          {paginatedSections.length > 0 ? (
            paginatedSections.map((section) => (
              <motion.div
                key={section.id}
                variants={itemVariants}
                className="border-b border-[#DCE6F2] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#2D6FE8]">
                      <FiLayers size={17} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">
                        Section
                      </p>

                      <p className="mt-1 break-words text-sm font-bold leading-5 text-[#111827]">
                        {section.name}
                      </p>

                      <p className="mt-1 font-mono text-[9px] text-[#6B7280]">
                        Section #{section.id}
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 rounded-lg border border-[#FACC15]/60 bg-[#FEF9C3] px-2.5 py-1.5 text-[9px] font-bold text-[#A16207]">
                    Order {section.order}
                  </span>
                </div>

                <div className="mt-3 rounded-xl border border-[#DCE6F2] bg-[#F8FBFF] p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                    Slug
                  </p>

                  <p className="mt-1 break-all font-mono text-xs text-[#6B7280]">
                    {section.slug || "-"}
                  </p>
                </div>

                <div className="mt-3 rounded-xl border border-[#DCE6F2] bg-[#F8FBFF] p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                    Description
                  </p>

                  <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-[#6B7280]">
                    {truncateText(section.description, 180)}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-end gap-2">
                  {canUpdateSection && (
                    <button
                      type="button"
                      onClick={() => openEditSection(section)}
                      title="Edit section"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#DCE6F2] bg-[#EAF3FF] text-[#2D6FE8]"
                    >
                      <FiEdit3 size={14} />
                    </button>
                  )}

                  {canDeleteSection && (
                    <button
                      type="button"
                      onClick={() => openDelete(section)}
                      title="Delete section"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#C23B32]/20 bg-[#FEF2F2] text-[#C23B32]"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  )}

                  {!canUpdateSection &&
                    !canDeleteSection && (
                      <span className="rounded-lg border border-[#DCE6F2] bg-[#F8FBFF] px-3 py-2 text-[9px] font-semibold text-[#6B7280]">
                        View Only
                      </span>
                    )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center px-5 py-14 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#2D6FE8]">
                <FiLayers size={22} />
              </div>

              <p className="mt-3 text-sm font-bold text-[#111827]">
                No sections found
              </p>

              <p className="mt-1 text-[10px] text-[#6B7280]">
                Add a section from the button above.
              </p>
            </div>
          )}
        </div>

        {/* PAGINATION */}

        {filteredSections.length > 0 && (
          <div className="border-t border-[#DCE6F2] bg-[#F8FBFF] px-4 py-4">
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-[10px] text-[#6B7280]">
                Showing{" "}
                <strong className="text-[#111827]">
                  {startEntry}
                </strong>{" "}
                to{" "}
                <strong className="text-[#111827]">
                  {endEntry}
                </strong>{" "}
                of{" "}
                <strong className="text-[#111827]">
                  {filteredSections.length}
                </strong>
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.max(1, page - 1),
                    )
                  }
                  disabled={currentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:opacity-30"
                  aria-label="Previous page"
                >
                  <FiChevronLeft size={15} />
                </button>

                {paginationPages.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2.5 text-[10px] font-bold transition ${
                      currentPage === page
                        ? "bg-[#2D6FE8] text-white shadow-[0_6px_14px_-6px_rgba(45,111,232,0.5)]"
                        : "border border-[#DCE6F2] bg-white text-[#6B7280] hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(totalPages, page + 1),
                    )
                  }
                  disabled={currentPage === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:opacity-30"
                  aria-label="Next page"
                >
                  <FiChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <div className="h-4" />

      {/* ADD / EDIT MODAL */}

      <SectionModal
        open={sectionModalOpen}
        editingSection={editingSection}
        loading={savingSection}
        onClose={() => {
          if (savingSection) return;

          setSectionModalOpen(false);
          setEditingSection(null);
        }}
        onSubmit={handleSaveSection}
      />

      {/* DELETE MODAL */}

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
    </motion.div>
  );
};

export default SectionManagement;