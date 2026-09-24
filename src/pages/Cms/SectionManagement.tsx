"use client";

import React, { useEffect, useMemo, useState } from "react";

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
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

import GlobalModal from "@/components/common/GlobalModal";
import faqSectionsApi, {
  FAQSection,
} from "../../api/endpoints/faqSectionsApi";

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

const truncateText = (value: string | null, length = 100) => {
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

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={!loading}
    >
      <div className="w-full max-w-[560px] overflow-hidden rounded-[22px] border border-[#E5EAE5] bg-white shadow-2xl">
        {/* TOP LINE */}
        <div className="h-[3px] w-full bg-gradient-to-r from-[#4C8A57] via-[#163F20] to-[#0F3219]" />

        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-[#163F20]/10 px-5 py-5">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF3EA] text-[#163F20]">
                {editingSection ? (
                  <FiEdit3 size={15} />
                ) : (
                  <FiPlus size={15} />
                )}
              </div>

              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#4C8A57]">
                FAQ Section Management
              </span>
            </div>

            <h2 className="text-lg font-bold text-[#202721]">
              {editingSection ? "Edit Section" : "Add Section"}
            </h2>

            <p className="mt-1 text-[11px] text-[#9AA29C]">
              {editingSection
                ? "Update the FAQ section details."
                : "Create a new FAQ section."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F7F5] text-[#163F20] hover:bg-[#EAF3EA]"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-5">
            {/* NAME */}
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#59645C]">
                Section Name *
              </label>

              <div className="relative">
                <FiLayers
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#163F20]"
                />

                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. General Questions"
                  disabled={loading}
                  className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] pl-11 pr-4 text-sm font-medium text-[#202721] outline-none placeholder:text-[#9AA29C] focus:border-[#163F20] focus:bg-white focus:ring-2 focus:ring-[#163F20]/10 disabled:opacity-60"
                />
              </div>
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#59645C]">
                Description
              </label>

              <div className="relative">
                <FiFileText
                  size={15}
                  className="absolute left-4 top-4 text-[#163F20]"
                />

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Write a short description for this FAQ section..."
                  rows={5}
                  disabled={loading}
                  className="w-full resize-none rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] px-4 py-3 pl-11 text-sm font-medium leading-6 text-[#202721] outline-none placeholder:text-[#9AA29C] focus:border-[#163F20] focus:bg-white focus:ring-2 focus:ring-[#163F20]/10 disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex flex-col-reverse gap-2 border-t border-[#163F20]/10 bg-[#FAFBFA] px-5 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-[#163F20]/15 bg-white px-5 py-2.5 text-sm font-bold text-[#59645C] hover:bg-[#F5F7F5] hover:text-[#163F20] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4C8A57] via-[#163F20] to-[#0F3219] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(22,63,32,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(22,63,32,0.7)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <FiRefreshCw size={15} className="animate-spin" />
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

const DeleteSectionModal: React.FC<DeleteSectionModalProps> = ({
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
      <div className="w-full max-w-[420px] overflow-hidden rounded-[22px] border border-[#E5EAE5] bg-white shadow-2xl">
        <div className="h-[3px] w-full bg-gradient-to-r from-[#4C8A57] to-[#C23B32]" />

        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FBEAEA] text-[#C23B32]">
              <FiAlertTriangle size={20} />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#202721]">
                Delete Section
              </h2>

              <p className="mt-1 text-sm leading-6 text-[#59645C]">
                Are you sure you want to delete this FAQ section?
              </p>

              <div className="mt-3 rounded-lg bg-[#F5F7F5] px-3 py-2">
                <p className="text-xs font-semibold leading-5 text-[#3F4A41]">
                  {truncateText(section.name, 100)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-[#163F20]/15 bg-white px-5 py-2.5 text-sm font-bold text-[#59645C] hover:bg-[#F5F7F5] hover:text-[#163F20] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#C23B32] to-[#A62F27] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(194,59,50,0.6)] transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? (
                <FiRefreshCw size={14} className="animate-spin" />
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
// MAIN COMPONENT
// =====================================================

const SectionManagement: React.FC = () => {
  const [sections, setSections] = useState<FAQSection[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [sectionModalOpen, setSectionModalOpen] = useState(false);

  const [editingSection, setEditingSection] =
    useState<FAQSection | null>(null);

  const [savingSection, setSavingSection] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [selectedSection, setSelectedSection] =
    useState<FAQSection | null>(null);

  const ITEMS_PER_PAGE = 7;

  // ===================================================
  // FETCH
  // ===================================================

  const fetchSections = async () => {
    try {
      setLoading(true);

      const response = await faqSectionsApi.getAll();

      if (response.data.success) {
        setSections(response.data.data || []);
      } else {
        toast.error(
          response.data.message || "Unable to fetch FAQ sections.",
        );
      }
    } catch (error: any) {
      console.error("Fetch FAQ sections error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Unable to fetch FAQ sections.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  // ===================================================
  // FILTER
  // ===================================================

  const filteredSections = useMemo(() => {
    const query = search.trim().toLowerCase();

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
    Math.ceil(filteredSections.length / ITEMS_PER_PAGE),
  );

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedSections = filteredSections.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const startEntry =
    filteredSections.length === 0 ? 0 : startIndex + 1;

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
  // HANDLERS
  // ===================================================

  const openAddSection = () => {
    setEditingSection(null);
    setSectionModalOpen(true);
  };

  const openEditSection = (section: FAQSection) => {
    setEditingSection(section);
    setSectionModalOpen(true);
  };

  // ===================================================
  // SAVE
  // ===================================================

  const handleSaveSection = async (payload: SectionForm) => {
    try {
      setSavingSection(true);

      let response;

      if (editingSection) {
        response = await faqSectionsApi.update(editingSection.id, {
          name: payload.name,
          description: payload.description,
          // Preserve the current is_active value on update
          is_active: editingSection.is_active ? 1 : 0,
        });
      } else {
        response = await faqSectionsApi.create({
          name: payload.name,
          description: payload.description,
          // New sections default to active
          is_active: 1,
        });
      }

      if (response.data.success) {
        toast.success(
          response.data.message ||
            (editingSection
              ? "Section updated successfully."
              : "Section added successfully."),
        );

        setSectionModalOpen(false);
        setEditingSection(null);

        await fetchSections();
      } else {
        toast.error(
          response.data.message || "Unable to save section.",
        );
      }
    } catch (error: any) {
      console.error("Save FAQ section error:", error);

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
  // DELETE
  // ===================================================

  const openDelete = (section: FAQSection) => {
    setSelectedSection(section);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedSection) return;

    try {
      setDeleteLoading(true);

      const response = await faqSectionsApi.delete(
        selectedSection.id,
      );

      if (response.data.success) {
        toast.success(
          response.data.message || "Section deleted successfully.",
        );

        setSections((current) =>
          current.filter(
            (section) => section.id !== selectedSection.id,
          ),
        );

        setDeleteOpen(false);
        setSelectedSection(null);
      } else {
        toast.error(
          response.data.message || "Unable to delete section.",
        );
      }
    } catch (error: any) {
      console.error("Delete FAQ section error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Unable to delete section.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="min-h-screen bg-[#F5F7F5] p-4 sm:p-5 lg:p-6"
      >
        {/* PAGE HEADER */}
        <motion.div
          variants={itemVariants}
          className="mb-5 flex flex-col justify-between gap-3 xl:flex-row xl:items-center"
        >
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#163F20]" />

              <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#4C8A57]">
                Website Configuration
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[27px] font-bold tracking-tight text-[#202721] sm:text-[30px]">
                Section Management
              </h1>

              <span className="rounded-full border border-[#163F20]/15 bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#163F20]">
                FAQ Sections
              </span>
            </div>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-[#89918B]">
              Manage your FAQ sections, descriptions, ordering and
              active status.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={fetchSections}
              disabled={loading}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#163F20]/20 bg-white px-4 text-xs font-bold text-[#163F20] shadow-sm hover:bg-[#EAF3EA] disabled:opacity-50"
            >
              <FiRefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />

              Refresh
            </button>
          </div>
        </motion.div>

        {/* MAIN CARD */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-[20px] border border-[#E5EAE5] bg-white shadow-[0_8px_30px_rgba(22,63,32,0.06)]"
        >
          {/* TOP LINE */}
          <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#8FC199] via-[#163F20] to-[#0F3219]" />

          {/* TOOLBAR */}
          <div className="border-b border-[#163F20]/10 p-4">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* SEARCH */}
              <div className="relative w-full sm:max-w-[420px]">
                <FiSearch
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#163F20]"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search section, description or ID..."
                  className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] pl-11 pr-4 text-xs text-[#202721] outline-none placeholder:text-[#9AA29C] focus:border-[#163F20] focus:bg-white focus:ring-2 focus:ring-[#163F20]/10"
                />
              </div>

              {/* ADD SECTION */}
              <button
                type="button"
                onClick={openAddSection}
                className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4C8A57] via-[#163F20] to-[#0F3219] px-5 text-xs font-bold text-white shadow-[0_8px_18px_-8px_rgba(22,63,32,0.6)] hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(22,63,32,0.7)]"
              >
                <FiPlus size={15} />

                Add Section
              </button>
            </div>
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="bg-[#163F20]">
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                    S.No
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                    Section
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                    Slug
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                    Description
                  </th>

                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-14 text-center">
                      <FiRefreshCw
                        size={22}
                        className="mx-auto animate-spin text-[#163F20]"
                      />

                      <p className="mt-3 text-sm font-bold text-[#202721]">
                        Loading sections...
                      </p>
                    </td>
                  </tr>
                ) : paginatedSections.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-14 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                          <FiLayers size={21} />
                        </div>

                        <p className="mt-3 text-sm font-bold text-[#202721]">
                          No sections found
                        </p>

                        <p className="mt-1 text-[10px] text-[#9AA29C]">
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
                      className="border-b border-[#163F20]/10 bg-white transition hover:bg-[#FAFBFA]"
                    >
                      {/* S.NO */}
                      <td className="px-5 py-4">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF3EA] text-xs font-bold text-[#163F20]">
                          {startIndex + index + 1}
                        </span>
                      </td>

                      {/* SECTION */}
                      <td className="max-w-[280px] px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                            <FiLayers size={17} />
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-bold leading-5 text-[#202721]">
                              {section.name}
                            </p>

                            <p className="mt-1 text-[10px] text-[#9AA29C]">
                              Section #{section.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* SLUG */}
                      <td className="max-w-[180px] px-5 py-4">
                        <span className="inline-block rounded-lg bg-[#F5F7F5] px-2.5 py-1.5 font-mono text-[10px] font-semibold text-[#3F4A41]">
                          {section.slug || "-"}
                        </span>
                      </td>

                      {/* DESCRIPTION */}
                      <td className="max-w-[330px] px-5 py-4">
                        <p className="text-xs leading-5 text-[#59645C]">
                          {truncateText(section.description, 120)}
                        </p>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* EDIT */}
                          <button
                            type="button"
                            title="Edit Section"
                            onClick={() => openEditSection(section)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#163F20]/15 bg-[#EAF3EA] text-[#163F20] transition hover:bg-[#163F20] hover:text-white"
                          >
                            <FiEdit3 size={15} />
                          </button>

                          {/* DELETE */}
                          <button
                            type="button"
                            title="Delete Section"
                            onClick={() => openDelete(section)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#C23B32]/20 bg-[#FBEAEA] text-[#C23B32] transition hover:border-transparent hover:bg-[#C23B32] hover:text-white"
                          >
                            <FiTrash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE */}
          <div className="block lg:hidden">
            {loading ? (
              <div className="px-5 py-14 text-center">
                <FiRefreshCw
                  size={22}
                  className="mx-auto animate-spin text-[#163F20]"
                />

                <p className="mt-3 text-sm font-bold text-[#202721]">
                  Loading sections...
                </p>
              </div>
            ) : paginatedSections.length > 0 ? (
              paginatedSections.map((section) => (
                <motion.div
                  key={section.id}
                  variants={itemVariants}
                  className="border-b border-[#163F20]/10 p-4"
                >
                  {/* TOP */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                        <FiLayers size={17} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                          Section
                        </p>

                        <p className="mt-1 text-sm font-bold leading-5 text-[#202721]">
                          {section.name}
                        </p>

                        <p className="mt-1 font-mono text-[9px] text-[#9AA29C]">
                          Section #{section.id}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-lg bg-[#F5F7F5] px-2.5 py-1.5 text-[9px] font-bold text-[#163F20]">
                      Order {section.order}
                    </span>
                  </div>

                  {/* SLUG */}
                  <div className="mt-3 rounded-xl border border-[#163F20]/10 bg-[#FAFBFA] p-3">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                      Slug
                    </p>

                    <p className="mt-1 font-mono text-xs text-[#3F4A41]">
                      {section.slug || "-"}
                    </p>
                  </div>

                  {/* DESCRIPTION */}
                  <div className="mt-3 rounded-xl border border-[#163F20]/10 bg-[#FAFBFA] p-3">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                      Description
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#59645C]">
                      {truncateText(section.description, 180)}
                    </p>
                  </div>

                  {/* BOTTOM */}
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEditSection(section)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#163F20]/15 bg-[#EAF3EA] text-[#163F20]"
                    >
                      <FiEdit3 size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => openDelete(section)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#C23B32]/20 bg-[#FBEAEA] text-[#C23B32]"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center px-5 py-14 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                  <FiLayers size={22} />
                </div>

                <p className="mt-3 text-sm font-bold text-[#202721]">
                  No sections found
                </p>

                <p className="mt-1 text-[10px] text-[#9AA29C]">
                  Add a section from the button above.
                </p>
              </div>
            )}
          </div>

          {/* PAGINATION */}
          {filteredSections.length > 0 && (
            <div className="border-t border-[#163F20]/10 bg-[#FAFBFA] px-4 py-4">
              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-[10px] text-[#89918B]">
                  Showing{" "}
                  <strong className="text-[#3F4A41]">{startEntry}</strong>{" "}
                  to{" "}
                  <strong className="text-[#3F4A41]">{endEntry}</strong> of{" "}
                  <strong className="text-[#3F4A41]">
                    {filteredSections.length}
                  </strong>
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => page - 1)}
                    disabled={currentPage === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#163F20]/15 bg-white text-[#163F20] transition hover:bg-[#EAF3EA] disabled:opacity-30"
                  >
                    <FiChevronLeft size={15} />
                  </button>

                  {paginationPages.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2.5 text-[10px] font-bold ${
                        currentPage === page
                          ? "bg-gradient-to-br from-[#4C8A57] to-[#163F20] text-white shadow-[0_6px_14px_-6px_rgba(22,63,32,0.5)]"
                          : "text-[#59645C] hover:bg-[#F5F7F5] hover:text-[#163F20]"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => page + 1)}
                    disabled={currentPage === totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#163F20]/15 bg-white text-[#163F20] transition hover:bg-[#EAF3EA] disabled:opacity-30"
                  >
                    <FiChevronRight size={15} />
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
        onSubmit={handleSaveSection}
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