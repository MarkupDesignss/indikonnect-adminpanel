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
  FiEye,
  FiFileText,
  FiLayers,
  FiMessageCircle,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

// React Quill
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

import GlobalModal from "@/components/common/GlobalModal";

import faqsApi, { FAQ } from "../../api/endpoints/faqs";
import faqSectionsApi, {
  FAQSection,
} from "../../api/endpoints/faqSectionsApi";
import { usePermissions } from "../../pages/permissions/usePermissions";

// =====================================================
// THEME — BLUE / YELLOW (matches Payment, Contents, Reels)
// =====================================================
const PRIMARY = "#2D6FE8";
const DARK_PRIMARY = "#2D6FE8";
const BLUE = "#2D6FE8";
const ACCENT = "#4F8FF7";

const LIGHT_BLUE = "#EAF3FF";
const SOFT_BLUE = "#EAF3FF";
const PAGE_BG = "#F4F8FD";

const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#6B7280";
const MUTED = "#6B7280";

const BORDER = "#DCE6F2";
const WHITE = "#FFFFFF";

const DANGER = "#C23B32";
const DANGER_BG = "#FEF2F2";

const WARNING = "#FACC15";

// =====================================================
// PERMISSIONS
// =====================================================
const VIEW_PERMISSION_KEYS = [
  "faq.view",
  "faqs.view",
  "FAQ.view",
  "FAQs.view",
  "faq.details",
  "FAQs.details",
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
// QUILL EDITOR CONFIG
// =====================================================
const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ align: [] }],
    ["blockquote", "code-block"],
    ["link"],
    ["clean"],
  ],
};

const QUILL_FORMATS = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "indent",
  "align",
  "blockquote",
  "code-block",
  "link",
];

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
    transition: { type: "spring", stiffness: 110, damping: 15 },
  },
};

// =====================================================
// HELPERS
// =====================================================
const getStatusClass = (status: boolean) =>
  status
    ? "border-[#2D6FE8]/25 bg-[#EAF3FF] text-[#2D6FE8]"
    : "border-[#DCE6F2] bg-[#F4F8FD] text-[#6B7280]";

const stripHtml = (value: string) => {
  if (!value) return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&hellip;/g, "…")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&rsquo;/g, "’")
    .replace(/&lsquo;/g, "‘")
    .replace(/&rdquo;/g, "”")
    .replace(/&ldquo;/g, "“")
    .replace(/\s+/g, " ")
    .trim();
};

const truncateText = (value: string, length = 100) => {
  const plain = stripHtml(value);
  if (!plain) return "-";
  return plain.length > length ? `${plain.slice(0, length).trim()}...` : plain;
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
  canSubmit: boolean;
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
  canSubmit,
  onClose,
  onSubmit,
  onSubmitBulk,
}) => {
  const isEdit = !!editingFAQ;

  const [sectionId, setSectionId] = useState<number | "">("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
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

  const addMoreItem = () => {
    if (!canSubmit) return;
    setBulkItems((items) => [...items, { question: "", answer: "" }]);
  };

  const removeItem = (index: number) => {
    if (!canSubmit) return;
    setBulkItems((items) =>
      items.length === 1 ? items : items.filter((_, i) => i !== index),
    );
  };

  const updateItem = (
    index: number,
    key: keyof FAQBulkFormItem,
    value: string,
  ) => {
    if (!canSubmit) return;
    setBulkItems((items) =>
      items.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!canSubmit) {
      toast.error(
        isEdit
          ? "You do not have permission to update FAQs."
          : "You do not have permission to create FAQs.",
      );
      return;
    }

    if (!sectionId) {
      toast.error("Please select a section.");
      return;
    }

    if (isEdit) {
      if (!question.trim()) {
        toast.error("Question is required.");
        return;
      }

      const plainAnswer = stripHtml(answer);
      if (!plainAnswer) {
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
      (item) => !item.question || !stripHtml(item.answer),
    );

    if (hasEmpty) {
      toast.error("Please fill both question and answer for every FAQ.");
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
      <div className="w-full max-w-[640px] overflow-hidden rounded-[22px] border border-[#DCE6F2] bg-white font-poppins shadow-2xl">
        {/* TOP LINE */}
        <div className="h-[3px] w-full bg-gradient-to-r from-[#4F8FF7] via-[#2D6FE8] to-[#2D6FE8]" />

        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-[#DCE6F2] px-5 py-5">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2D6FE8]">
                {isEdit ? <FiEdit3 size={15} /> : <FiPlus size={15} />}
              </div>

              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#2D6FE8]">
                FAQ Management
              </span>
            </div>

            <h2 className="text-lg font-bold text-[#111827]">
              {isEdit ? "Edit FAQ" : "Add FAQs"}
            </h2>

            <p className="mt-1 text-[11px] text-[#6B7280]">
              {isEdit
                ? "Update the frequently asked question and answer."
                : "Add one or more frequently asked questions."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F4F8FD] text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:opacity-50"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className="max-h-[65vh] space-y-4 overflow-y-auto bg-[#F8FBFF] p-5">
            {/* SECTION */}
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
                Section *
              </label>

              <div className="relative">
                <FiLayers
                  size={15}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#2D6FE8]"
                />

                <select
                  value={sectionId}
                  onChange={(event) =>
                    setSectionId(
                      event.target.value ? Number(event.target.value) : "",
                    )
                  }
                  disabled={loading || sectionsLoading}
                  className="h-11 w-full appearance-none rounded-xl border border-[#DCE6F2] bg-white pl-11 pr-10 text-sm font-medium text-[#111827] outline-none transition focus:border-[#2D6FE8] focus:ring-2 focus:ring-[#2D6FE8]/10 disabled:cursor-not-allowed disabled:bg-[#F4F8FD]"
                >
                  <option value="">
                    {sectionsLoading ? "Loading sections..." : "Select a section"}
                  </option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>

                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280]">
                  ▾
                </span>
              </div>
            </div>

            {/* EDIT MODE */}
            {isEdit && (
              <>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
                    Question *
                  </label>

                  <div className="relative">
                    <FiMessageCircle
                      size={15}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2D6FE8]"
                    />

                    <input
                      type="text"
                      value={question}
                      onChange={(event) => setQuestion(event.target.value)}
                      placeholder="e.g. How the site works?"
                      disabled={loading}
                      className="h-11 w-full rounded-xl border border-[#DCE6F2] bg-white pl-11 pr-4 text-sm font-medium text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:ring-2 focus:ring-[#2D6FE8]/10 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
                    Answer *
                  </label>

                  <div className="faq-editor-wrapper">
                    <ReactQuill
                      theme="snow"
                      value={answer}
                      onChange={setAnswer}
                      modules={QUILL_MODULES}
                      formats={QUILL_FORMATS}
                      placeholder="Write the answer here..."
                      readOnly={loading}
                    />
                  </div>
                </div>
              </>
            )}

            {/* ADD MODE */}
            {!isEdit && (
              <div className="space-y-3">
                {bulkItems.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-[#DCE6F2] bg-white p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-[#2D6FE8]">
                        FAQ #{index + 1}
                      </span>

                      {bulkItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={loading}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#C23B32]/20 bg-[#FEF2F2] text-[#C23B32] transition hover:bg-[#C23B32] hover:text-white disabled:opacity-50"
                          title="Remove FAQ"
                        >
                          <FiTrash2 size={13} />
                        </button>
                      )}
                    </div>

                    {/* QUESTION */}
                    <div className="mb-2">
                      <label className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                        Question *
                      </label>

                      <div className="relative">
                        <FiMessageCircle
                          size={14}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D6FE8]"
                        />

                        <input
                          type="text"
                          value={item.question}
                          onChange={(event) =>
                            updateItem(index, "question", event.target.value)
                          }
                          placeholder="e.g. How the site works?"
                          disabled={loading}
                          className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white pl-10 pr-3 text-sm font-medium text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:ring-2 focus:ring-[#2D6FE8]/10 disabled:opacity-60"
                        />
                      </div>
                    </div>

                    {/* ANSWER */}
                    <div>
                      <label className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                        Answer *
                      </label>

                      <div className="faq-editor-wrapper faq-editor-wrapper--small">
                        <ReactQuill
                          theme="snow"
                          value={item.answer}
                          onChange={(value) =>
                            updateItem(index, "answer", value)
                          }
                          modules={QUILL_MODULES}
                          formats={QUILL_FORMATS}
                          placeholder="Write the answer here..."
                          readOnly={loading}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addMoreItem}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#2D6FE8]/25 bg-[#F4F8FD] px-4 py-4 text-xs font-bold text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:opacity-50"
                >
                  <FiPlus size={15} />
                  Add More FAQ
                </button>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex flex-col-reverse gap-2 border-t border-[#DCE6F2] bg-[#F8FBFF] px-5 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-[#DCE6F2] bg-white px-5 py-2.5 text-sm font-bold text-[#6B7280] transition hover:bg-[#F4F8FD] hover:text-[#2D6FE8] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(45,111,232,0.6)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
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
                  : `Add ${
                      bulkItems.length > 1
                        ? `${bulkItems.length} FAQs`
                        : "FAQ"
                    }`}
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

const ViewFAQModal: React.FC<ViewFAQModalProps> = ({ open, faq, onClose }) => {
  if (!open || !faq) return null;

  return (
    <GlobalModal isOpen={open} onClose={onClose}>
      <div className="w-full max-w-[560px] overflow-hidden rounded-[22px] border border-[#DCE6F2] bg-white font-poppins shadow-2xl">
        <div className="h-[3px] w-full bg-gradient-to-r from-[#4F8FF7] via-[#2D6FE8] to-[#2D6FE8]" />

        <div className="flex items-start justify-between border-b border-[#DCE6F2] px-5 py-5">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2D6FE8]">
                <FiEye size={15} />
              </div>

              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#2D6FE8]">
                FAQ Details
              </span>
            </div>

            <h2 className="text-lg font-bold text-[#111827]">FAQ</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F4F8FD] text-[#2D6FE8] transition hover:bg-[#EAF3FF]"
          >
            <FiX size={16} />
          </button>
        </div>

        <div className="max-h-[65vh] space-y-4 overflow-y-auto bg-[#F8FBFF] p-5">
          {/* SECTION */}
          <div className="rounded-xl border border-[#DCE6F2] bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <FiLayers size={14} className="text-[#2D6FE8]" />
              <span className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                Section
              </span>
            </div>

            <p className="text-sm font-bold leading-6 text-[#111827]">
              {faq.section?.name || "-"}
            </p>
          </div>

          {/* QUESTION */}
          <div className="rounded-xl border border-[#DCE6F2] bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <FiMessageCircle size={14} className="text-[#2D6FE8]" />
              <span className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                Question
              </span>
            </div>

            <p className="text-sm font-bold leading-6 text-[#111827]">
              {faq.question}
            </p>
          </div>

          {/* ANSWER */}
          <div className="rounded-xl border border-[#DCE6F2] bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <FiFileText size={14} className="text-[#2D6FE8]" />
              <span className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                Answer
              </span>
            </div>

            <div
              className="faq-answer-preview text-sm leading-6 text-[#6B7280]"
              dangerouslySetInnerHTML={{ __html: faq.answer || "" }}
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-[#DCE6F2] bg-[#F8FBFF] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#DCE6F2] bg-white px-5 py-2.5 text-sm font-bold text-[#6B7280] transition hover:bg-[#F4F8FD] hover:text-[#2D6FE8]"
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
      <div className="w-full max-w-[450px] overflow-hidden rounded-[22px] border border-[#DCE6F2] bg-white font-poppins shadow-2xl">
        <div className="h-[3px] w-full bg-gradient-to-r from-[#2D6FE8] to-[#C23B32]" />

        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FEF2F2] text-[#C23B32]">
              <FiAlertTriangle size={20} />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#111827]">Delete FAQ</h2>

              <p className="mt-1 text-sm leading-6 text-[#6B7280]">
                Are you sure you want to delete this FAQ?
              </p>

              <div className="mt-3 rounded-lg bg-[#F4F8FD] px-3 py-2">
                <p className="text-xs font-semibold leading-5 text-[#6B7280]">
                  {truncateText(faq.question, 100)}
                </p>
              </div>
            </div>
          </div>

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
  // =================================================
  // PERMISSIONS
  // =================================================
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

  const canViewFAQs = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("FAQ") ||
      hasModuleAccess("FAQs") ||
      hasModuleAccess("faq") ||
      hasModuleAccess("faqs") ||
      hasAnyPermission(VIEW_PERMISSION_KEYS),
    [isSuperAdmin, hasModuleAccess, hasAnyPermission],
  );

  const canCreateFAQ = useMemo(
    () => isSuperAdmin || hasAnyPermission(CREATE_PERMISSION_KEYS),
    [isSuperAdmin, hasAnyPermission],
  );

  const canUpdateFAQ = useMemo(
    () => isSuperAdmin || hasAnyPermission(UPDATE_PERMISSION_KEYS),
    [isSuperAdmin, hasAnyPermission],
  );

  const canDeleteFAQ = useMemo(
    () => isSuperAdmin || hasAnyPermission(DELETE_PERMISSION_KEYS),
    [isSuperAdmin, hasAnyPermission],
  );

  // =================================================
  // STATES
  // =================================================
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
  const [selectedViewFAQ, setSelectedViewFAQ] = useState<FAQ | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
  const ITEMS_PER_PAGE = 7;

  // =================================================
  // DUPLICATE FETCH PROTECTION
  // =================================================
  const faqFetchInFlightRef = useRef<Promise<void> | null>(null);
  const sectionFetchInFlightRef = useRef<Promise<void> | null>(null);
  const hasInitialFAQsFetchRef = useRef(false);
  const hasInitialSectionsFetchRef = useRef(false);

  // =================================================
  // FETCH FAQs
  // =================================================
  const fetchFAQs = useCallback(
    async (force = false) => {
      if (!canViewFAQs) return;
      if (faqFetchInFlightRef.current) return faqFetchInFlightRef.current;
      if (!force && hasInitialFAQsFetchRef.current) return;

      const requestPromise = (async () => {
        try {
          setLoading(true);
          const response = await faqsApi.getAll();

          if (response.data.success) {
            setFaqs(response.data.data || []);
            hasInitialFAQsFetchRef.current = true;
          } else {
            toast.error(response.data.message || "Unable to fetch FAQs.");
          }
        } catch (error: any) {
          console.error("Fetch FAQs error:", error);
          toast.error(
            error?.response?.data?.message || "Unable to fetch FAQs.",
          );
        } finally {
          setLoading(false);
        }
      })();

      faqFetchInFlightRef.current = requestPromise;

      try {
        await requestPromise;
      } finally {
        faqFetchInFlightRef.current = null;
      }
    },
    [canViewFAQs],
  );

  // =================================================
  // FETCH SECTIONS
  // =================================================
  const fetchSections = useCallback(
    async (force = false) => {
      if (!canViewFAQs) return;
      if (sectionFetchInFlightRef.current)
        return sectionFetchInFlightRef.current;
      if (!force && hasInitialSectionsFetchRef.current) return;

      const requestPromise = (async () => {
        try {
          setSectionsLoading(true);
          const response = await faqSectionsApi.getAll();

          if (response.data.success) {
            setSections(response.data.data || []);
            hasInitialSectionsFetchRef.current = true;
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
          setSectionsLoading(false);
        }
      })();

      sectionFetchInFlightRef.current = requestPromise;

      try {
        await requestPromise;
      } finally {
        sectionFetchInFlightRef.current = null;
      }
    },
    [canViewFAQs],
  );

  // =================================================
  // INITIAL LOAD
  // =================================================
  useEffect(() => {
    if (permissionsLoading || !canViewFAQs) return;
    if (!hasInitialFAQsFetchRef.current) fetchFAQs();
    if (!hasInitialSectionsFetchRef.current) fetchSections();
  }, [permissionsLoading, canViewFAQs, fetchFAQs, fetchSections]);

  // =================================================
  // FILTERED FAQs
  // =================================================
  const filteredFAQs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...faqs]
      .filter((faq) => {
        const plainAnswer = stripHtml(faq.answer || "");
        const matchesSearch =
          !query ||
          [
            faq.question,
            plainAnswer,
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
        if (a.order !== b.order) return a.order - b.order;
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
  const startEntry = filteredFAQs.length === 0 ? 0 : startIndex + 1;
  const endEntry = Math.min(startIndex + ITEMS_PER_PAGE, filteredFAQs.length);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginationPages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
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

  // =================================================
  // HANDLERS
  // =================================================
  const openAddFAQ = () => {
    if (!canCreateFAQ) {
      toast.error("You do not have permission to create FAQs.");
      return;
    }
    setEditingFAQ(null);
    setFaqModalOpen(true);
    if (!hasInitialSectionsFetchRef.current) fetchSections();
  };

  const openEditFAQ = (faq: FAQ) => {
    if (!canUpdateFAQ) {
      toast.error("You do not have permission to update FAQs.");
      return;
    }
    setEditingFAQ(faq);
    setFaqModalOpen(true);
    if (!hasInitialSectionsFetchRef.current) fetchSections();
  };

  const openViewFAQ = (faq: FAQ) => {
    if (!canViewFAQs) {
      toast.error("You do not have permission to view FAQs.");
      return;
    }
    setSelectedViewFAQ(faq);
    setViewModalOpen(true);
  };

  // =================================================
  // SAVE SINGLE FAQ
  // =================================================
  const handleSaveFAQ = async (payload: FAQForm) => {
    if (!editingFAQ) {
      toast.error("Invalid FAQ update request.");
      return;
    }
    if (!canUpdateFAQ) {
      toast.error("You do not have permission to update FAQs.");
      return;
    }

    try {
      setSavingFAQ(true);
      const response = await faqsApi.update(editingFAQ.id, {
        section_id: payload.section_id,
        question: payload.question,
        answer: payload.answer,
        is_active: payload.is_active ? 1 : 0,
      });

      if (response.data.success) {
        toast.success(
          response.data.message || "FAQ updated successfully.",
        );
        setFaqModalOpen(false);
        setEditingFAQ(null);
        await fetchFAQs(true);
      } else {
        toast.error(response.data.message || "Unable to update FAQ.");
      }
    } catch (error: any) {
      console.error("Save FAQ error:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to update FAQ.",
      );
    } finally {
      setSavingFAQ(false);
    }
  };

  // =================================================
  // SAVE BULK FAQ
  // =================================================
  const handleSaveBulkFAQ = async (payload: {
    section_id: number;
    faqs: FAQBulkFormItem[];
  }) => {
    if (!canCreateFAQ) {
      toast.error("You do not have permission to create FAQs.");
      return;
    }

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
        await fetchFAQs(true);
      } else {
        toast.error(response.data.message || "Unable to save FAQs.");
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

  // =================================================
  // DELETE
  // =================================================
  const openDelete = (faq: FAQ) => {
    if (!canDeleteFAQ) {
      toast.error("You do not have permission to delete FAQs.");
      return;
    }
    setSelectedFAQ(faq);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedFAQ) return;
    if (!canDeleteFAQ) {
      toast.error("You do not have permission to delete FAQs.");
      return;
    }

    try {
      setDeleteLoading(true);
      const response = await faqsApi.delete(selectedFAQ.id);

      if (response.data.success) {
        toast.success(response.data.message || "FAQ deleted successfully.");
        setDeleteOpen(false);
        setSelectedFAQ(null);
        await fetchFAQs(true);
      } else {
        toast.error(response.data.message || "Unable to delete FAQ.");
      }
    } catch (error: any) {
      console.error("Delete FAQ error:", error);
      toast.error(
        error?.response?.data?.message || "Unable to delete FAQ.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // =================================================
  // PERMISSION LOADING
  // =================================================
  if (permissionsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F8FD] p-6 font-poppins">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
            <FiRefreshCw size={27} className="animate-spin" />
          </div>
          <p className="mt-4 text-sm font-bold text-[#111827]">
            Checking permissions...
          </p>
          <p className="mt-1 text-xs text-[#6B7280]">
            Verifying FAQ management access.
          </p>
        </div>
      </div>
    );
  }

  if (loading && faqs.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F8FD] font-poppins">
        <div className="flex flex-col items-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#DCE6F2] border-t-[#2D6FE8]" />
          <p className="mt-3 text-sm text-[#6B7280]">Loading FAQs...</p>
        </div>
      </div>
    );
  }

  // =================================================
  // RENDER
  // =================================================
  return (
    <>
      {/* =================================================
          GLOBAL STYLES
      ================================================= */}
      <style>{`
        .faq-editor-wrapper .ql-toolbar.ql-snow {
          border: 1px solid ${BORDER};
          border-bottom: none;
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
          background: ${PAGE_BG};
          padding: 8px 10px;
        }

        .faq-editor-wrapper .ql-container.ql-snow {
          border: 1px solid ${BORDER};
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
          background: ${WHITE};
          font-family: inherit;
          font-size: 14px;
        }

        .faq-editor-wrapper .ql-editor {
          min-height: 140px;
          max-height: 260px;
          overflow-y: auto;
          line-height: 1.6;
          color: ${TEXT_PRIMARY};
        }

        .faq-editor-wrapper .ql-editor.ql-blank::before {
          color: ${MUTED};
          font-style: normal;
          font-size: 13px;
        }

        .faq-editor-wrapper .ql-snow .ql-stroke {
          stroke: ${PRIMARY};
        }

        .faq-editor-wrapper .ql-snow .ql-fill {
          fill: ${PRIMARY};
        }

        .faq-editor-wrapper .ql-snow .ql-picker {
          color: ${PRIMARY};
        }

        .faq-editor-wrapper .ql-snow .ql-picker-options {
          background: ${WHITE};
          border: 1px solid ${BORDER};
          border-radius: 8px;
          box-shadow: 0 8px 20px rgba(45, 111, 232, 0.12);
        }

        .faq-editor-wrapper .ql-snow.ql-toolbar button:hover,
        .faq-editor-wrapper .ql-snow.ql-toolbar button.ql-active {
          background: ${LIGHT_BLUE};
          border-radius: 6px;
        }

        .faq-editor-wrapper .ql-snow.ql-toolbar button:hover .ql-stroke,
        .faq-editor-wrapper .ql-snow.ql-toolbar button.ql-active .ql-stroke {
          stroke: ${PRIMARY};
        }

        .faq-editor-wrapper .ql-snow .ql-tooltip {
          border-radius: 8px;
          border: 1px solid ${BORDER};
          box-shadow: 0 8px 20px rgba(45, 111, 232, 0.12);
        }

        .faq-editor-wrapper--small .ql-editor {
          min-height: 100px;
          max-height: 200px;
          font-size: 13px;
        }

        .faq-editor-wrapper--small .ql-toolbar.ql-snow {
          padding: 6px 8px;
        }

        .faq-answer-preview {
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .faq-answer-preview p { margin: 0 0 8px; }
        .faq-answer-preview p:last-child { margin-bottom: 0; }

        .faq-answer-preview ul,
        .faq-answer-preview ol {
          padding-left: 22px;
          margin: 6px 0;
        }

        .faq-answer-preview ul { list-style: disc; }
        .faq-answer-preview ol { list-style: decimal; }
        .faq-answer-preview li { margin: 3px 0; }

        .faq-answer-preview a {
          color: ${PRIMARY};
          text-decoration: underline;
        }

        .faq-answer-preview strong {
          font-weight: 700;
          color: ${TEXT_PRIMARY};
        }

        .faq-answer-preview em { font-style: italic; }

        .faq-answer-preview blockquote {
          border-left: 3px solid ${PRIMARY};
          margin: 8px 0;
          padding-left: 12px;
          color: ${TEXT_SECONDARY};
          background: ${PAGE_BG};
          border-radius: 0 6px 6px 0;
        }

        .faq-answer-preview pre,
        .faq-answer-preview code {
          background: ${PAGE_BG};
          border-radius: 6px;
          padding: 2px 6px;
          font-size: 12px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }

        .faq-answer-preview h1,
        .faq-answer-preview h2,
        .faq-answer-preview h3 {
          color: ${TEXT_PRIMARY};
          font-weight: 700;
          margin: 10px 0 6px;
          line-height: 1.3;
        }

        .faq-answer-preview h1 { font-size: 18px; }
        .faq-answer-preview h2 { font-size: 16px; }
        .faq-answer-preview h3 { font-size: 15px; }

        .faq-answer-clamp {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          word-break: break-word;
          overflow-wrap: anywhere;
          line-height: 1.55;
        }
      `}</style>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="min-h-screen bg-white p-4 font-poppins sm:p-5 lg:p-7"
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
                Website Configuration
              </span>
            </div>

            <h1 className="text-[20px] font-medium tracking-tight text-[#111827] sm:text-[22px]">
              FAQ Management
            </h1>

            <p className="mt-0.5 text-sm text-[#111827]">
              Manage your website FAQs, answers and active status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start">
            {/* REFRESH */}
            <button
              type="button"
              onClick={async () => {
                await Promise.all([fetchFAQs(true), fetchSections(true)]);
              }}
              disabled={loading || sectionsLoading}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#2D6FE8]/20 bg-white px-4 text-sm font-bold text-[#2D6FE8] transition hover:border-[#4F8FF7]/40 hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiRefreshCw
                size={16}
                className={loading || sectionsLoading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            {/* ADD FAQ */}
            {canCreateFAQ ? (
              <button
                type="button"
                onClick={openAddFAQ}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#2D6FE8]/20 bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-5 text-sm font-bold text-white  transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(45,111,232,0.7)]"
              >
                <FiPlus size={16} />
                Add FAQ
              </button>
            ) : (
              <div className="flex h-11 items-center gap-2 rounded-xl border border-[#DCE6F2] bg-white px-4 text-sm font-bold text-[#6B7280]">
                <FiShield size={15} />
                View Only
              </div>
            )}
          </div>
        </motion.div>

        {/* FAQ CARD */}
        <motion.div
          variants={itemVariants}
          className="relative mt-6 overflow-hidden rounded-[22px] border border-[#DCE6F2] bg-white shadow-[0_8px_30px_rgba(45,111,232,0.06)]"
        >
          <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#93C5FD] via-[#2D6FE8] to-[#2D6FE8]" />

          {/* TOOLBAR */}
          <div className="border-b border-[#DCE6F2] p-4 sm:p-5">
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
                  placeholder="Search question, answer or ID..."
                  className="h-11 w-full rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] pl-11 pr-4 text-sm text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#4F8FF7]/10"
                />
              </div>

            
            </div>
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden lg:block">
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-[6%]" />
                <col className="w-[18%]" />
                <col className="w-[26%]" />
                <col className="w-[30%]" />
                <col className="w-[20%]" />
              </colgroup>

              <thead>
                <tr className="bg-[#4F8FF7]">
                  <th className="rounded-tl-2xl px-3 py-4 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-white">
                    S.No
                  </th>
                  <th className="px-3 py-4 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-white">
                    Section
                  </th>
                  <th className="px-3 py-4 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-white">
                    Question
                  </th>
                  <th className="px-3 py-4 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-white">
                    Answer
                  </th>
                  <th className="rounded-tr-2xl px-3 py-4 text-center text-[9px] font-bold uppercase tracking-[0.1em] text-white">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                          <FiRefreshCw size={22} className="animate-spin" />
                        </div>
                        <p className="mt-4 text-sm font-bold text-[#111827]">
                          Loading FAQs...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedFAQs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                          <FiFileText size={24} />
                        </div>
                        <p className="mt-4 text-sm font-bold text-[#111827]">
                          No FAQs found
                        </p>
                        <p className="mt-1 text-xs text-[#6B7280]">
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
                      className="border-b border-[#DCE6F2] bg-white transition hover:bg-[#F8FBFF]"
                    >
                      {/* S.NO */}
                      <td className="px-3 py-4">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EAF3FF] text-[11px] font-bold text-[#2D6FE8]">
                          {startIndex + index + 1}
                        </span>
                      </td>

                      {/* SECTION */}
                      <td className="px-3 py-4">
                        <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-[#F4F8FD] px-2 py-1.5 text-[10px] font-bold text-[#6B7280]">
                          <FiLayers
                            size={11}
                            className="shrink-0 text-[#2D6FE8]"
                          />
                          <span className="truncate">
                            {faq.section?.name || "-"}
                          </span>
                        </span>
                      </td>

                      {/* QUESTION */}
                      <td className="px-3 py-4">
                        <div className="flex items-start gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2D6FE8]">
                            <FiMessageCircle size={14} />
                          </div>
                          <div className="min-w-0">
                            <p
                              className="truncate text-xs font-bold text-[#111827]"
                              title={faq.question}
                            >
                              {faq.question}
                            </p>
                            <p className="mt-0.5 font-mono text-[9px] text-[#6B7280]">
                              FAQ #{faq.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* ANSWER */}
                      <td className="px-3 py-4">
                        <p className="faq-answer-clamp text-[11px] leading-5 text-[#6B7280]">
                          {truncateText(faq.answer, 120)}
                        </p>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-3 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            title="View FAQ"
                            onClick={() => openViewFAQ(faq)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2D6FE8]/15 bg-[#EAF3FF] text-[#2D6FE8] transition hover:bg-[#2D6FE8] hover:text-white"
                          >
                            <FiEye size={14} />
                          </button>

                          {canUpdateFAQ && (
                            <button
                              type="button"
                              title="Edit FAQ"
                              onClick={() => openEditFAQ(faq)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2D6FE8]/15 bg-white text-[#2D6FE8] transition hover:bg-[#2D6FE8] hover:text-white"
                            >
                              <FiEdit3 size={14} />
                            </button>
                          )}

                          {canDeleteFAQ && (
                            <button
                              type="button"
                              title="Delete FAQ"
                              onClick={() => openDelete(faq)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#C23B32]/20 bg-[#FEF2F2] text-[#C23B32] transition hover:border-transparent hover:bg-[#C23B32] hover:text-white"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          )}
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
            {paginatedFAQs.length > 0 ? (
              paginatedFAQs.map((faq) => (
                <motion.div
                  key={faq.id}
                  variants={itemVariants}
                  className="border-b border-[#DCE6F2] bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#2D6FE8]">
                        <FiMessageCircle size={17} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">
                          Question
                        </p>
                        <p className="mt-1 text-sm font-bold leading-5 text-[#111827]">
                          {faq.question}
                        </p>
                        <p className="mt-1 font-mono text-[9px] text-[#6B7280]">
                          FAQ #{faq.id}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-lg bg-[#EAF3FF] px-2.5 py-1.5 text-[9px] font-bold text-[#2D6FE8]">
                      Order {faq.order}
                    </span>
                  </div>

                  <div className="mt-3 rounded-xl border border-[#DCE6F2] bg-[#F8FBFF] p-3">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                      Section
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-[#6B7280]">
                      <FiLayers size={12} className="text-[#2D6FE8]" />
                      {faq.section?.name || "-"}
                    </p>
                  </div>

                  <div className="mt-3 rounded-xl border border-[#DCE6F2] bg-[#F8FBFF] p-3">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                      Answer
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#6B7280]">
                      {truncateText(faq.answer, 180)}
                    </p>
                  </div>

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
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2D6FE8]/15 bg-[#EAF3FF] text-[#2D6FE8]"
                      >
                        <FiEye size={14} />
                      </button>

                      {canUpdateFAQ && (
                        <button
                          type="button"
                          onClick={() => openEditFAQ(faq)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2D6FE8]/15 bg-white text-[#2D6FE8]"
                        >
                          <FiEdit3 size={14} />
                        </button>
                      )}

                      {canDeleteFAQ && (
                        <button
                          type="button"
                          onClick={() => openDelete(faq)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#C23B32]/20 bg-[#FEF2F2] text-[#C23B32]"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center bg-white px-5 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                  <FiFileText size={24} />
                </div>
                <p className="mt-4 text-sm font-bold text-[#111827]">
                  No FAQs found
                </p>
                <p className="mt-1 text-xs text-[#6B7280]">
                  Add a FAQ from the button above.
                </p>
              </div>
            )}
          </div>

          {/* PAGINATION */}
          {filteredFAQs.length > 0 && (
            <div className="border-t border-[#DCE6F2] bg-[#F8FBFF] px-4 py-4 sm:px-5">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-xs text-[#6B7280]">
                  Showing{" "}
                  <span className="font-bold text-[#111827]">{startEntry}</span>{" "}
                  to{" "}
                  <span className="font-bold text-[#111827]">{endEntry}</span>{" "}
                  of{" "}
                  <span className="font-bold text-[#111827]">
                    {filteredFAQs.length}
                  </span>{" "}
                  FAQs
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => page - 1)}
                    disabled={currentPage === 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronLeft size={17} />
                  </button>

                  {paginationPages.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold ${
                        currentPage === page
                          ? "bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-white shadow-[0_6px_14px_-6px_rgba(45,111,232,0.5)]"
                          : "text-[#6B7280] hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => page + 1)}
                    disabled={currentPage === totalPages}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronRight size={17} />
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
        canSubmit={editingFAQ ? canUpdateFAQ : canCreateFAQ}
        onClose={() => {
          if (savingFAQ) return;
          setFaqModalOpen(false);
          setEditingFAQ(null);
        }}
        onSubmit={handleSaveFAQ}
        onSubmitBulk={handleSaveBulkFAQ}
      />

      {/* VIEW */}
      <ViewFAQModal
        open={viewModalOpen}
        faq={selectedViewFAQ}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedViewFAQ(null);
        }}
      />

      {/* DELETE */}
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