import React, { useEffect, useMemo, useState } from "react";

import {
  FiAlertTriangle,
  FiChevronLeft,
  FiChevronRight,
  FiEdit3,
  FiEye,
  FiFileText,
  FiLayers,
  FiMessageCircle,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

import GlobalModal from "@/components/common/GlobalModal";
import faqsApi, { FAQ } from "../../api/endpoints/faqs";
import faqSectionsApi, {
  FAQSection,
} from "../../api/endpoints/faqSectionsApi";

// =====================================================
// TYPES
// =====================================================

interface FAQForm {
  section_id: number;
  question: string;
  answer: string;
  is_active: boolean;
}

interface FAQBulkFormItem {
  question: string;
  answer: string;
}

// =====================================================
// ANIMATION
// =====================================================

const containerVariants = {
  hidden: { opacity: 0 },
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

const getStatusClass = (status: boolean) =>
  status
    ? "border-[#163F20]/25 bg-[#EAF3EA] text-[#163F20]"
    : "border-[#D8E2D8] bg-[#F3F6F3] text-[#59645C]";

const truncateText = (value: string, length = 100) => {
  if (!value) return "-";

  return value.length > length
    ? `${value.slice(0, length).trim()}...`
    : value;
};

// =====================================================
// FAQ ADD / EDIT MODAL
// =====================================================

interface FAQModalProps {
  open: boolean;
  editingFAQ: FAQ | null;
  sections: FAQSection[];
  sectionsLoading: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: FAQForm) => void;
  onSubmitBulk: (payload: {
    section_id: number;
    faqs: FAQBulkFormItem[];
  }) => void;
}

const FAQModal: React.FC<FAQModalProps> = ({
  open,
  editingFAQ,
  sections,
  sectionsLoading,
  loading,
  onClose,
  onSubmit,
  onSubmitBulk,
}) => {
  const isEdit = !!editingFAQ;

  // ---- shared section ----
  const [sectionId, setSectionId] = useState<number | "">("");

  // ---- single (edit) ----
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  // ---- bulk (add) ----
  const [bulkItems, setBulkItems] = useState<FAQBulkFormItem[]>([
    { question: "", answer: "" },
  ]);

  useEffect(() => {
    if (!open) return;

    if (editingFAQ) {
      setSectionId(editingFAQ.section_id);
      setQuestion(editingFAQ.question || "");
      setAnswer(editingFAQ.answer || "");
      setBulkItems([{ question: "", answer: "" }]);
    } else {
      setSectionId("");
      setQuestion("");
      setAnswer("");
      setBulkItems([{ question: "", answer: "" }]);
    }
  }, [open, editingFAQ]);

  if (!open) return null;

  // ---- bulk helpers ----
  const addMoreItem = () => {
    setBulkItems((items) => [...items, { question: "", answer: "" }]);
  };

  const removeItem = (index: number) => {
    setBulkItems((items) =>
      items.length === 1
        ? items
        : items.filter((_, i) => i !== index),
    );
  };

  const updateItem = (
    index: number,
    key: keyof FAQBulkFormItem,
    value: string,
  ) => {
    setBulkItems((items) =>
      items.map((item, i) =>
        i === index ? { ...item, [key]: value } : item,
      ),
    );
  };

  // ---- submit ----
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!sectionId) {
      toast.error("Please select a section.");
      return;
    }

    if (isEdit) {
      if (!question.trim()) {
        toast.error("Question is required.");
        return;
      }

      if (!answer.trim()) {
        toast.error("Answer is required.");
        return;
      }

      onSubmit({
        section_id: Number(sectionId),
        question: question.trim(),
        answer: answer.trim(),
        is_active: editingFAQ?.is_active ?? true,
      });

      return;
    }

    // bulk validation
    const validItems = bulkItems
      .map((item) => ({
        question: item.question.trim(),
        answer: item.answer.trim(),
      }))
      .filter((item) => item.question || item.answer);

    if (validItems.length === 0) {
      toast.error("Please add at least one FAQ.");
      return;
    }

    const hasEmpty = validItems.some(
      (item) => !item.question || !item.answer,
    );

    if (hasEmpty) {
      toast.error(
        "Please fill both question and answer for every FAQ.",
      );
      return;
    }

    onSubmitBulk({
      section_id: Number(sectionId),
      faqs: validItems,
    });
  };

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={!loading}
    >
      <div className="w-full max-w-[640px] overflow-hidden rounded-[22px] border border-[#E5EAE5] bg-white shadow-2xl">
        <div className="h-[3px] w-full bg-gradient-to-r from-[#4C8A57] via-[#163F20] to-[#0F3219]" />

        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-[#163F20]/10 px-5 py-5">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF3EA] text-[#163F20]">
                {isEdit ? (
                  <FiEdit3 size={15} />
                ) : (
                  <FiPlus size={15} />
                )}
              </div>

              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#4C8A57]">
                FAQ Management
              </span>
            </div>

            <h2 className="text-lg font-bold text-[#202721]">
              {isEdit ? "Edit FAQ" : "Add FAQs"}
            </h2>

            <p className="mt-1 text-[11px] text-[#9AA29C]">
              {isEdit
                ? "Update the frequently asked question and answer."
                : "Add one or more frequently asked questions."}
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
          <div className="max-h-[65vh] space-y-4 overflow-y-auto p-5">
            {/* SECTION */}
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#59645C]">
                Section *
              </label>

              <div className="relative">
                <FiLayers
                  size={15}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#163F20]"
                />

                <select
                  value={sectionId}
                  onChange={(event) =>
                    setSectionId(
                      event.target.value
                        ? Number(event.target.value)
                        : "",
                    )
                  }
                  disabled={loading || sectionsLoading}
                  className="h-11 w-full appearance-none rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] pl-11 pr-10 text-sm font-medium text-[#202721] outline-none focus:border-[#163F20] focus:bg-white focus:ring-2 focus:ring-[#163F20]/10 disabled:opacity-60"
                >
                  <option value="">
                    {sectionsLoading
                      ? "Loading sections..."
                      : "Select a section"}
                  </option>

                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>

                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#9AA29C]">
                  ▾
                </span>
              </div>
            </div>

            {/* ============ EDIT MODE: single form ============ */}
            {isEdit && (
              <>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#59645C]">
                    Question *
                  </label>

                  <div className="relative">
                    <FiMessageCircle
                      size={15}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#163F20]"
                    />

                    <input
                      type="text"
                      value={question}
                      onChange={(event) =>
                        setQuestion(event.target.value)
                      }
                      placeholder="e.g. How the site works?"
                      disabled={loading}
                      className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] pl-11 pr-4 text-sm font-medium text-[#202721] outline-none placeholder:text-[#9AA29C] focus:border-[#163F20] focus:bg-white focus:ring-2 focus:ring-[#163F20]/10 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#59645C]">
                    Answer *
                  </label>

                  <div className="relative">
                    <FiFileText
                      size={15}
                      className="absolute left-4 top-4 text-[#163F20]"
                    />

                    <textarea
                      value={answer}
                      onChange={(event) =>
                        setAnswer(event.target.value)
                      }
                      placeholder="Write the answer here..."
                      rows={5}
                      disabled={loading}
                      className="w-full resize-none rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] px-4 py-3 pl-11 text-sm font-medium leading-6 text-[#202721] outline-none placeholder:text-[#9AA29C] focus:border-[#163F20] focus:bg-white focus:ring-2 focus:ring-[#163F20]/10 disabled:opacity-60"
                    />
                  </div>
                </div>
              </>
            )}

            {/* ============ ADD MODE: bulk list ============ */}
            {!isEdit && (
              <div className="space-y-3">
                {bulkItems.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-[#163F20]/10 bg-[#FAFBFA] p-3"
                  >
                    {/* ITEM HEADER */}
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-[#4C8A57]">
                        FAQ #{index + 1}
                      </span>

                      {bulkItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={loading}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#C23B32]/20 bg-[#FBEAEA] text-[#C23B32] transition hover:bg-[#C23B32] hover:text-white disabled:opacity-50"
                          title="Remove FAQ"
                        >
                          <FiTrash2 size={13} />
                        </button>
                      )}
                    </div>

                    {/* QUESTION */}
                    <div className="mb-2">
                      <label className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                        Question *
                      </label>

                      <div className="relative">
                        <FiMessageCircle
                          size={14}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#163F20]"
                        />

                        <input
                          type="text"
                          value={item.question}
                          onChange={(event) =>
                            updateItem(
                              index,
                              "question",
                              event.target.value,
                            )
                          }
                          placeholder="e.g. How the site works?"
                          disabled={loading}
                          className="h-10 w-full rounded-lg border border-[#D8E2D8] bg-white pl-10 pr-3 text-sm font-medium text-[#202721] outline-none placeholder:text-[#9AA29C] focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/10 disabled:opacity-60"
                        />
                      </div>
                    </div>

                    {/* ANSWER */}
                    <div>
                      <label className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                        Answer *
                      </label>

                      <div className="relative">
                        <FiFileText
                          size={14}
                          className="absolute left-3.5 top-3.5 text-[#163F20]"
                        />

                        <textarea
                          value={item.answer}
                          onChange={(event) =>
                            updateItem(
                              index,
                              "answer",
                              event.target.value,
                            )
                          }
                          placeholder="Write the answer here..."
                          rows={3}
                          disabled={loading}
                          className="w-full resize-none rounded-lg border border-[#D8E2D8] bg-white px-3 py-2.5 pl-10 text-sm font-medium leading-6 text-[#202721] outline-none placeholder:text-[#9AA29C] focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/10 disabled:opacity-60"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* ADD MORE */}
                <button
                  type="button"
                  onClick={addMoreItem}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#163F20]/25 bg-[#F5F7F5] px-4 py-3 text-xs font-bold text-[#163F20] transition hover:border-[#163F20] hover:bg-[#EAF3EA] disabled:opacity-50"
                >
                  <FiPlus size={15} />
                  Add More FAQ
                </button>
              </div>
            )}
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
              ) : isEdit ? (
                <FiEdit3 size={15} />
              ) : (
                <FiPlus size={15} />
              )}

              {loading
                ? "Saving..."
                : isEdit
                  ? "Update FAQ"
                  : `Add ${bulkItems.length > 1 ? `${bulkItems.length} FAQs` : "FAQ"}`}
            </button>
          </div>
        </form>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// VIEW FAQ MODAL
// =====================================================

interface ViewFAQModalProps {
  open: boolean;
  faq: FAQ | null;
  onClose: () => void;
}

const ViewFAQModal: React.FC<ViewFAQModalProps> = ({
  open,
  faq,
  onClose,
}) => {
  if (!open || !faq) return null;

  return (
    <GlobalModal isOpen={open} onClose={onClose}>
      <div className="w-full max-w-[560px] overflow-hidden rounded-[22px] border border-[#E5EAE5] bg-white shadow-2xl">
        <div className="h-[3px] w-full bg-gradient-to-r from-[#4C8A57] via-[#163F20] to-[#0F3219]" />

        <div className="flex items-start justify-between border-b border-[#163F20]/10 px-5 py-5">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF3EA] text-[#163F20]">
                <FiEye size={15} />
              </div>

              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#4C8A57]">
                FAQ Details
              </span>
            </div>

            <h2 className="text-lg font-bold text-[#202721]">FAQ</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F7F5] text-[#163F20] hover:bg-[#EAF3EA]"
          >
            <FiX size={16} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* SECTION */}
          <div className="rounded-xl border border-[#163F20]/10 bg-[#FAFBFA] p-4">
            <div className="mb-2 flex items-center gap-2">
              <FiLayers size={14} className="text-[#163F20]" />

              <span className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                Section
              </span>
            </div>

            <p className="text-sm font-bold leading-6 text-[#202721]">
              {faq.section?.name || "-"}
            </p>
          </div>

          {/* QUESTION */}
          <div className="rounded-xl border border-[#163F20]/10 bg-[#FAFBFA] p-4">
            <div className="mb-2 flex items-center gap-2">
              <FiMessageCircle size={14} className="text-[#163F20]" />

              <span className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                Question
              </span>
            </div>

            <p className="text-sm font-bold leading-6 text-[#202721]">
              {faq.question}
            </p>
          </div>

          {/* ANSWER */}
          <div className="rounded-xl border border-[#163F20]/10 bg-[#FAFBFA] p-4">
            <div className="mb-2 flex items-center gap-2">
              <FiFileText size={14} className="text-[#163F20]" />

              <span className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                Answer
              </span>
            </div>

            <p className="whitespace-pre-wrap text-sm leading-6 text-[#59645C]">
              {faq.answer}
            </p>
          </div>
        </div>

        <div className="flex justify-end border-t border-[#163F20]/10 bg-[#FAFBFA] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#163F20]/15 bg-white px-5 py-2.5 text-sm font-bold text-[#59645C] hover:bg-[#F5F7F5] hover:text-[#163F20]"
          >
            Close
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// DELETE FAQ MODAL
// =====================================================

interface DeleteFAQModalProps {
  open: boolean;
  loading: boolean;
  faq: FAQ | null;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteFAQModal: React.FC<DeleteFAQModalProps> = ({
  open,
  loading,
  faq,
  onClose,
  onConfirm,
}) => {
  if (!open || !faq) return null;

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
                Delete FAQ
              </h2>

              <p className="mt-1 text-sm leading-6 text-[#59645C]">
                Are you sure you want to delete this FAQ?
              </p>

              <div className="mt-3 rounded-lg bg-[#F5F7F5] px-3 py-2">
                <p className="text-xs font-semibold leading-5 text-[#3F4A41]">
                  {truncateText(faq.question, 100)}
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

const FAQManagement: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(false);

  const [sections, setSections] = useState<FAQSection[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [savingFAQ, setSavingFAQ] = useState(false);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedViewFAQ, setSelectedViewFAQ] = useState<FAQ | null>(
    null,
  );

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);

  const ITEMS_PER_PAGE = 7;

  // =================================================
  // FETCH FAQs
  // =================================================

  const fetchFAQs = async () => {
    try {
      setLoading(true);

      const response = await faqsApi.getAll();

      if (response.data.success) {
        setFaqs(response.data.data || []);
      } else {
        toast.error(
          response.data.message || "Unable to fetch FAQs.",
        );
      }
    } catch (error: any) {
      console.error("Fetch FAQs error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Unable to fetch FAQs.",
      );
    } finally {
      setLoading(false);
    }
  };

  // =================================================
  // FETCH SECTIONS
  // =================================================

  const fetchSections = async () => {
    try {
      setSectionsLoading(true);

      const response = await faqSectionsApi.getAll();

      if (response.data.success) {
        setSections(response.data.data || []);
      } else {
        toast.error(
          response.data.message ||
            "Unable to fetch FAQ sections.",
        );
      }
    } catch (error: any) {
      console.error("Fetch FAQ sections error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Unable to fetch FAQ sections.",
      );
    } finally {
      setSectionsLoading(false);
    }
  };

  useEffect(() => {
    fetchFAQs();
    fetchSections();
  }, []);

  // =================================================
  // FILTERED FAQs
  // =================================================

  const filteredFAQs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...faqs]
      .filter((faq) => {
        const matchesSearch =
          !query ||
          [
            faq.question,
            faq.answer,
            faq.section?.name,
            String(faq.id),
            String(faq.section_id),
            String(faq.order),
          ]
            .filter(Boolean)
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
  }, [faqs, search]);

  // =================================================
  // PAGINATION
  // =================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredFAQs.length / ITEMS_PER_PAGE),
  );

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedFAQs = filteredFAQs.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const startEntry =
    filteredFAQs.length === 0 ? 0 : startIndex + 1;

  const endEntry = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredFAQs.length,
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

  // =================================================
  // HANDLERS
  // =================================================

  const openAddFAQ = () => {
    setEditingFAQ(null);
    setFaqModalOpen(true);
  };

  const openEditFAQ = (faq: FAQ) => {
    setEditingFAQ(faq);
    setFaqModalOpen(true);
  };

  const openViewFAQ = (faq: FAQ) => {
    setSelectedViewFAQ(faq);
    setViewModalOpen(true);
  };

  // ---- single save (edit) ----
  const handleSaveFAQ = async (payload: FAQForm) => {
    try {
      setSavingFAQ(true);

      let response;

      if (editingFAQ) {
        response = await faqsApi.update(editingFAQ.id, {
          section_id: payload.section_id,
          question: payload.question,
          answer: payload.answer,
          is_active: payload.is_active ? 1 : 0,
        });
      }

      if (response && response.data.success) {
        toast.success(
          response.data.message ||
            (editingFAQ
              ? "FAQ updated successfully."
              : "FAQ added successfully."),
        );

        setFaqModalOpen(false);
        setEditingFAQ(null);

        await fetchFAQs();
      } else if (response) {
        toast.error(
          response.data.message || "Unable to save FAQ.",
        );
      }
    } catch (error: any) {
      console.error("Save FAQ error:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save FAQ.",
      );
    } finally {
      setSavingFAQ(false);
    }
  };

  // ---- bulk save (add) ----
  const handleSaveBulkFAQ = async (payload: {
    section_id: number;
    faqs: FAQBulkFormItem[];
  }) => {
    try {
      setSavingFAQ(true);

      const response = await faqsApi.createBulk({
        section_id: payload.section_id,
        is_active: true,
        faqs: payload.faqs.map((item, index) => ({
          question: item.question,
          answer: item.answer,
          order: index + 1,
          is_active: true,
        })),
      });

      if (response.data.success) {
        toast.success(
          response.data.message ||
            (payload.faqs.length > 1
              ? "FAQs added successfully."
              : "FAQ added successfully."),
        );

        setFaqModalOpen(false);
        setEditingFAQ(null);

        await fetchFAQs();
      } else {
        toast.error(
          response.data.message || "Unable to save FAQs.",
        );
      }
    } catch (error: any) {
      console.error("Bulk save FAQs error:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save FAQs.",
      );
    } finally {
      setSavingFAQ(false);
    }
  };

  const openDelete = (faq: FAQ) => {
    setSelectedFAQ(faq);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedFAQ) return;

    try {
      setDeleteLoading(true);

      const response = await faqsApi.delete(selectedFAQ.id);

      if (response.data.success) {
        toast.success(
          response.data.message || "FAQ deleted successfully.",
        );

        setFaqs((current) =>
          current.filter((faq) => faq.id !== selectedFAQ.id),
        );

        setDeleteOpen(false);
        setSelectedFAQ(null);
      } else {
        toast.error(
          response.data.message || "Unable to delete FAQ.",
        );
      }
    } catch (error: any) {
      console.error("Delete FAQ error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Unable to delete FAQ.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // =================================================
  // RENDER
  // =================================================

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
                FAQ Management
              </h1>

              <span className="rounded-full border border-[#163F20]/15 bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#163F20]">
                Frequently Asked Questions
              </span>
            </div>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-[#89918B]">
              Manage your website FAQs, answers and active
              status.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={fetchFAQs}
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

        {/* FAQ CARD */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-[20px] border border-[#E5EAE5] bg-white shadow-[0_8px_30px_rgba(22,63,32,0.06)]"
        >
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
                  placeholder="Search question, answer or ID..."
                  className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] pl-11 pr-4 text-xs text-[#202721] outline-none placeholder:text-[#9AA29C] focus:border-[#163F20] focus:bg-white focus:ring-2 focus:ring-[#163F20]/10"
                />
              </div>

              {/* ADD FAQ */}
              <button
                type="button"
                onClick={openAddFAQ}
                className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4C8A57] via-[#163F20] to-[#0F3219] px-5 text-xs font-bold text-white shadow-[0_8px_18px_-8px_rgba(22,63,32,0.6)] hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(22,63,32,0.7)]"
              >
                <FiPlus size={15} />
                Add FAQ
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
                    Question
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                    Answer
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
                        Loading FAQs...
                      </p>
                    </td>
                  </tr>
                ) : paginatedFAQs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-14 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                          <FiFileText size={21} />
                        </div>

                        <p className="mt-3 text-sm font-bold text-[#202721]">
                          No FAQs found
                        </p>

                        <p className="mt-1 text-[10px] text-[#9AA29C]">
                          Add a new FAQ to get started.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedFAQs.map((faq, index) => (
                    <motion.tr
                      key={faq.id}
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
                      <td className="max-w-[200px] px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F5F7F5] px-2.5 py-1.5 text-[10px] font-bold text-[#3F4A41]">
                          <FiLayers
                            size={11}
                            className="text-[#163F20]"
                          />

                          {faq.section?.name || "-"}
                        </span>
                      </td>

                      {/* QUESTION */}
                      <td className="max-w-[280px] px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                            <FiMessageCircle size={17} />
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-bold leading-5 text-[#202721]">
                              {faq.question}
                            </p>

                            <p className="mt-1 text-[10px] text-[#9AA29C]">
                              FAQ #{faq.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* ANSWER */}
                      <td className="max-w-[330px] px-5 py-4">
                        <p className="text-xs leading-5 text-[#59645C]">
                          {truncateText(faq.answer, 120)}
                        </p>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            title="View FAQ"
                            onClick={() => openViewFAQ(faq)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#163F20]/15 bg-[#F5F7F5] text-[#163F20] transition hover:bg-[#163F20] hover:text-white"
                          >
                            <FiEye size={15} />
                          </button>

                          <button
                            type="button"
                            title="Edit FAQ"
                            onClick={() => openEditFAQ(faq)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#163F20]/15 bg-[#EAF3EA] text-[#163F20] transition hover:bg-[#163F20] hover:text-white"
                          >
                            <FiEdit3 size={15} />
                          </button>

                          <button
                            type="button"
                            title="Delete FAQ"
                            onClick={() => openDelete(faq)}
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
                  Loading FAQs...
                </p>
              </div>
            ) : paginatedFAQs.length > 0 ? (
              paginatedFAQs.map((faq) => (
                <motion.div
                  key={faq.id}
                  variants={itemVariants}
                  className="border-b border-[#163F20]/10 p-4"
                >
                  {/* TOP */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                        <FiMessageCircle size={17} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA29C]">
                          Question
                        </p>

                        <p className="mt-1 text-sm font-bold leading-5 text-[#202721]">
                          {faq.question}
                        </p>

                        <p className="mt-1 font-mono text-[9px] text-[#9AA29C]">
                          FAQ #{faq.id}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-lg bg-[#F5F7F5] px-2.5 py-1.5 text-[9px] font-bold text-[#163F20]">
                      Order {faq.order}
                    </span>
                  </div>

                  {/* SECTION */}
                  <div className="mt-3 rounded-xl border border-[#163F20]/10 bg-[#FAFBFA] p-3">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                      Section
                    </p>

                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-[#3F4A41]">
                      <FiLayers
                        size={12}
                        className="text-[#163F20]"
                      />

                      {faq.section?.name || "-"}
                    </p>
                  </div>

                  {/* ANSWER */}
                  <div className="mt-3 rounded-xl border border-[#163F20]/10 bg-[#FAFBFA] p-3">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                      Answer
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#59645C]">
                      {truncateText(faq.answer, 180)}
                    </p>
                  </div>

                  {/* BOTTOM */}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${getStatusClass(
                        faq.is_active,
                      )}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />

                      {faq.is_active ? "Enabled" : "Disabled"}
                    </span>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openViewFAQ(faq)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#163F20]/15 bg-[#F5F7F5] text-[#163F20]"
                      >
                        <FiEye size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditFAQ(faq)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#163F20]/15 bg-[#EAF3EA] text-[#163F20]"
                      >
                        <FiEdit3 size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => openDelete(faq)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#C23B32]/20 bg-[#FBEAEA] text-[#C23B32]"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center px-5 py-14 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                  <FiFileText size={22} />
                </div>

                <p className="mt-3 text-sm font-bold text-[#202721]">
                  No FAQs found
                </p>

                <p className="mt-1 text-[10px] text-[#9AA29C]">
                  Add a FAQ from the button above.
                </p>
              </div>
            )}
          </div>

          {/* PAGINATION */}
          {filteredFAQs.length > 0 && (
            <div className="border-t border-[#163F20]/10 bg-[#FAFBFA] px-4 py-4">
              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-[10px] text-[#89918B]">
                  Showing{" "}
                  <strong className="text-[#3F4A41]">
                    {startEntry}
                  </strong>{" "}
                  to{" "}
                  <strong className="text-[#3F4A41]">
                    {endEntry}
                  </strong>{" "}
                  of{" "}
                  <strong className="text-[#3F4A41]">
                    {filteredFAQs.length}
                  </strong>
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => page - 1)
                    }
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
                    onClick={() =>
                      setCurrentPage((page) => page + 1)
                    }
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

      {/* ADD / EDIT MODAL */}
      <FAQModal
        open={faqModalOpen}
        editingFAQ={editingFAQ}
        sections={sections}
        sectionsLoading={sectionsLoading}
        loading={savingFAQ}
        onClose={() => {
          if (savingFAQ) return;

          setFaqModalOpen(false);
          setEditingFAQ(null);
        }}
        onSubmit={handleSaveFAQ}
        onSubmitBulk={handleSaveBulkFAQ}
      />

      {/* VIEW MODAL */}
      <ViewFAQModal
        open={viewModalOpen}
        faq={selectedViewFAQ}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedViewFAQ(null);
        }}
      />

      {/* DELETE MODAL */}
      <DeleteFAQModal
        open={deleteOpen}
        loading={deleteLoading}
        faq={selectedFAQ}
        onClose={() => {
          if (deleteLoading) return;

          setDeleteOpen(false);
          setSelectedFAQ(null);
        }}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default FAQManagement;