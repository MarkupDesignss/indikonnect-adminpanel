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

import faqsApi, {
  FAQ,
} from "../../api/endpoints/faqs";

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
    [
      "bold",
      "italic",
      "underline",
      "strike",
    ],
    [
      { list: "ordered" },
      { list: "bullet" },
    ],
    [
      { indent: "-1" },
      { indent: "+1" },
    ],
    [{ align: [] }],
    [
      "blockquote",
      "code-block",
    ],
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

const getStatusClass = (
  status: boolean
) =>
  status
    ? "border-[#C9D9F4] bg-[#EAF1FF] text-[#1E3A8A]"
    : "border-[#D8E2F0] bg-[#F3F6FB] text-[#4A5778]";

/**
 * Strip HTML tags + decode common entities
 * for preview text.
 */
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

const truncateText = (
  value: string,
  length = 100
) => {
  const plain = stripHtml(value);

  if (!plain) return "-";

  return plain.length > length
    ? `${plain
        .slice(0, length)
        .trim()}...`
    : plain;
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

const FAQModal: React.FC<
  FAQModalProps
> = ({
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

  const [sectionId, setSectionId] =
    useState<number | "">("");

  const [question, setQuestion] =
    useState("");

  const [answer, setAnswer] =
    useState("");

  const [bulkItems, setBulkItems] =
    useState<FAQBulkFormItem[]>([
      {
        question: "",
        answer: "",
      },
    ]);

  useEffect(() => {
    if (!open) return;

    if (editingFAQ) {
      setSectionId(
        editingFAQ.section_id
      );

      setQuestion(
        editingFAQ.question || ""
      );

      setAnswer(
        editingFAQ.answer || ""
      );

      setBulkItems([
        {
          question: "",
          answer: "",
        },
      ]);
    } else {
      setSectionId("");
      setQuestion("");
      setAnswer("");

      setBulkItems([
        {
          question: "",
          answer: "",
        },
      ]);
    }
  }, [open, editingFAQ]);

  if (!open) return null;

  const addMoreItem = () => {
    if (!canSubmit) return;

    setBulkItems((items) => [
      ...items,
      {
        question: "",
        answer: "",
      },
    ]);
  };

  const removeItem = (
    index: number
  ) => {
    if (!canSubmit) return;

    setBulkItems((items) =>
      items.length === 1
        ? items
        : items.filter(
            (_, i) => i !== index
          )
    );
  };

  const updateItem = (
    index: number,
    key: keyof FAQBulkFormItem,
    value: string
  ) => {
    if (!canSubmit) return;

    setBulkItems((items) =>
      items.map((item, i) =>
        i === index
          ? {
              ...item,
              [key]: value,
            }
          : item
      )
    );
  };

  const handleSubmit = (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!canSubmit) {
      toast.error(
        isEdit
          ? "You do not have permission to update FAQs."
          : "You do not have permission to create FAQs."
      );
      return;
    }

    if (!sectionId) {
      toast.error(
        "Please select a section."
      );
      return;
    }

    // -------------------------------------------------
    // EDIT MODE
    // -------------------------------------------------

    if (isEdit) {
      if (!question.trim()) {
        toast.error(
          "Question is required."
        );
        return;
      }

      const plainAnswer =
        stripHtml(answer);

      if (!plainAnswer) {
        toast.error(
          "Answer is required."
        );
        return;
      }

      onSubmit({
        section_id:
          Number(sectionId),
        question:
          question.trim(),
        answer: answer.trim(),
        is_active:
          editingFAQ?.is_active ??
          true,
      });

      return;
    }

    // -------------------------------------------------
    // ADD BULK MODE
    // -------------------------------------------------

    const validItems = bulkItems
      .map((item) => ({
        question:
          item.question.trim(),
        answer:
          item.answer.trim(),
      }))
      .filter(
        (item) =>
          item.question ||
          item.answer
      );

    if (validItems.length === 0) {
      toast.error(
        "Please add at least one FAQ."
      );
      return;
    }

    const hasEmpty =
      validItems.some(
        (item) =>
          !item.question ||
          !stripHtml(item.answer)
      );

    if (hasEmpty) {
      toast.error(
        "Please fill both question and answer for every FAQ."
      );
      return;
    }

    onSubmitBulk({
      section_id:
        Number(sectionId),
      faqs: validItems,
    });
  };

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={!loading}
    >
      <div className="w-full max-w-[640px] overflow-hidden rounded-[22px] border bg-white shadow-2xl">
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
                {isEdit ? (
                  <FiEdit3 size={15} />
                ) : (
                  <FiPlus size={15} />
                )}
              </div>

              <span
                className="text-[9px] font-bold uppercase tracking-[0.16em]"
                style={{
                  color: ACCENT,
                }}
              >
                FAQ Management
              </span>
            </div>

            <h2
              className="text-lg font-bold"
              style={{
                color:
                  TEXT_PRIMARY,
              }}
            >
              {isEdit
                ? "Edit FAQ"
                : "Add FAQs"}
            </h2>

            <p
              className="mt-1 text-[11px]"
              style={{ color: MUTED }}
            >
              {isEdit
                ? "Update the frequently asked question and answer."
                : "Add one or more frequently asked questions."}
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
          >
            <FiX size={16} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className="max-h-[65vh] space-y-4 overflow-y-auto p-5">
            {/* SECTION */}
            <div>
              <label
                className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide"
                style={{
                  color:
                    TEXT_SECONDARY,
                }}
              >
                Section *
              </label>

              <div className="relative">
                <FiLayers
                  size={15}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
                  style={{
                    color: PRIMARY,
                  }}
                />

                <select
                  value={sectionId}
                  onChange={(event) =>
                    setSectionId(
                      event.target
                        .value
                        ? Number(
                            event.target
                              .value
                          )
                        : ""
                    )
                  }
                  disabled={
                    loading ||
                    sectionsLoading
                  }
                  className="h-11 w-full appearance-none rounded-xl pl-11 pr-10 text-sm font-medium outline-none disabled:opacity-60"
                  style={{
                    border: `1px solid ${BORDER}`,
                    backgroundColor:
                      loading
                        ? "#EEF3FA"
                        : PAGE_BG,
                    color:
                      TEXT_PRIMARY,
                  }}
                >
                  <option value="">
                    {sectionsLoading
                      ? "Loading sections..."
                      : "Select a section"}
                  </option>

                  {sections.map(
                    (section) => (
                      <option
                        key={
                          section.id
                        }
                        value={
                          section.id
                        }
                      >
                        {section.name}
                      </option>
                    )
                  )}
                </select>

                <span
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                  style={{
                    color: MUTED,
                  }}
                >
                  ▾
                </span>
              </div>
            </div>

            {/* EDIT MODE */}
            {isEdit && (
              <>
                {/* QUESTION */}
                <div>
                  <label
                    className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide"
                    style={{
                      color:
                        TEXT_SECONDARY,
                    }}
                  >
                    Question *
                  </label>

                  <div className="relative">
                    <FiMessageCircle
                      size={15}
                      className="absolute left-4 top-1/2 -translate-y-1/2"
                      style={{
                        color:
                          PRIMARY,
                      }}
                    />

                    <input
                      type="text"
                      value={question}
                      onChange={(
                        event
                      ) =>
                        setQuestion(
                          event.target
                            .value
                        )
                      }
                      placeholder="e.g. How the site works?"
                      disabled={loading}
                      className="h-11 w-full rounded-xl pl-11 pr-4 text-sm font-medium outline-none placeholder:text-[#8C97B2] disabled:opacity-60"
                      style={{
                        border:
                          `1px solid ${BORDER}`,
                        backgroundColor:
                          loading
                            ? "#EEF3FA"
                            : PAGE_BG,
                        color:
                          TEXT_PRIMARY,
                      }}
                    />
                  </div>
                </div>

                {/* ANSWER */}
                <div>
                  <label
                    className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide"
                    style={{
                      color:
                        TEXT_SECONDARY,
                    }}
                  >
                    Answer *
                  </label>

                  <div className="faq-editor-wrapper">
                    <ReactQuill
                      theme="snow"
                      value={answer}
                      onChange={setAnswer}
                      modules={
                        QUILL_MODULES
                      }
                      formats={
                        QUILL_FORMATS
                      }
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
                {bulkItems.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="rounded-xl border p-3"
                      style={{
                        borderColor:
                          "rgba(30,58,138,0.10)",
                        backgroundColor:
                          "#FAFBFE",
                      }}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wide"
                          style={{
                            color: ACCENT,
                          }}
                        >
                          FAQ #
                          {index + 1}
                        </span>

                        {bulkItems.length >
                          1 && (
                          <button
                            type="button"
                            onClick={() =>
                              removeItem(
                                index
                              )
                            }
                            disabled={
                              loading
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-lg border transition disabled:opacity-50"
                            style={{
                              borderColor:
                                "rgba(194,59,50,0.20)",
                              backgroundColor:
                                DANGER_BG,
                              color:
                                DANGER,
                            }}
                            title="Remove FAQ"
                          >
                            <FiTrash2
                              size={13}
                            />
                          </button>
                        )}
                      </div>

                      {/* QUESTION */}
                      <div className="mb-2">
                        <label
                          className="mb-1 block text-[9px] font-bold uppercase tracking-wide"
                          style={{
                            color:
                              MUTED,
                          }}
                        >
                          Question *
                        </label>

                        <div className="relative">
                          <FiMessageCircle
                            size={14}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2"
                            style={{
                              color:
                                PRIMARY,
                            }}
                          />

                          <input
                            type="text"
                            value={
                              item.question
                            }
                            onChange={(
                              event
                            ) =>
                              updateItem(
                                index,
                                "question",
                                event
                                  .target
                                  .value
                              )
                            }
                            placeholder="e.g. How the site works?"
                            disabled={
                              loading
                            }
                            className="h-10 w-full rounded-lg pl-10 pr-3 text-sm font-medium outline-none placeholder:text-[#8C97B2] disabled:opacity-60"
                            style={{
                              border:
                                `1px solid ${BORDER}`,
                              backgroundColor:
                                WHITE,
                              color:
                                TEXT_PRIMARY,
                            }}
                          />
                        </div>
                      </div>

                      {/* ANSWER */}
                      <div>
                        <label
                          className="mb-1 block text-[9px] font-bold uppercase tracking-wide"
                          style={{
                            color:
                              MUTED,
                          }}
                        >
                          Answer *
                        </label>

                        <div className="faq-editor-wrapper faq-editor-wrapper--small">
                          <ReactQuill
                            theme="snow"
                            value={
                              item.answer
                            }
                            onChange={(
                              value
                            ) =>
                              updateItem(
                                index,
                                "answer",
                                value
                              )
                            }
                            modules={
                              QUILL_MODULES
                            }
                            formats={
                              QUILL_FORMATS
                            }
                            placeholder="Write the answer here..."
                            readOnly={
                              loading
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )
                )}

                <button
                  type="button"
                  onClick={
                    addMoreItem
                  }
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-3 text-xs font-bold transition disabled:opacity-50"
                  style={{
                    borderColor:
                      "rgba(30,58,138,0.25)",
                    backgroundColor:
                      PAGE_BG,
                    color: PRIMARY,
                  }}
                >
                  <FiPlus size={15} />
                  Add More FAQ
                </button>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div
            className="flex flex-col-reverse gap-2 border-t px-5 py-4 sm:flex-row sm:justify-end"
            style={{
              borderColor:
                "rgba(30,58,138,0.10)",
              backgroundColor:
                "#FAFBFE",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border bg-white px-5 py-2.5 text-sm font-bold transition disabled:opacity-50"
              style={{
                borderColor: BORDER,
                color:
                  TEXT_SECONDARY,
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                !canSubmit
              }
              className="flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(30,58,138,0.6)] transition disabled:cursor-not-allowed disabled:opacity-50"
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
                      bulkItems.length >
                      1
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

const ViewFAQModal: React.FC<
  ViewFAQModalProps
> = ({
  open,
  faq,
  onClose,
}) => {
  if (!open || !faq) {
    return null;
  }

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
    >
      <div className="w-full max-w-[560px] overflow-hidden rounded-[22px] border bg-white shadow-2xl">
        <div
          className="h-[3px] w-full"
          style={{
            background:
              `linear-gradient(to right, ${ACCENT}, ${PRIMARY}, ${DARK_PRIMARY})`,
          }}
        />

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
                <FiEye size={15} />
              </div>

              <span
                className="text-[9px] font-bold uppercase tracking-[0.16em]"
                style={{
                  color: ACCENT,
                }}
              >
                FAQ Details
              </span>
            </div>

            <h2
              className="text-lg font-bold"
              style={{
                color: TEXT_PRIMARY,
              }}
            >
              FAQ
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{
              backgroundColor:
                PAGE_BG,
              color: PRIMARY,
            }}
          >
            <FiX size={16} />
          </button>
        </div>

        <div className="max-h-[65vh] space-y-4 overflow-y-auto p-5">
          {/* SECTION */}
          <div
            className="rounded-xl border p-4"
            style={{
              borderColor:
                "rgba(30,58,138,0.10)",
              backgroundColor:
                "#FAFBFE",
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <FiLayers
                size={14}
                style={{
                  color: PRIMARY,
                }}
              />

              <span
                className="text-[9px] font-bold uppercase tracking-wide"
                style={{
                  color: MUTED,
                }}
              >
                Section
              </span>
            </div>

            <p
              className="text-sm font-bold leading-6"
              style={{
                color: TEXT_PRIMARY,
              }}
            >
              {faq.section?.name ||
                "-"}
            </p>
          </div>

          {/* QUESTION */}
          <div
            className="rounded-xl border p-4"
            style={{
              borderColor:
                "rgba(30,58,138,0.10)",
              backgroundColor:
                "#FAFBFE",
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <FiMessageCircle
                size={14}
                style={{
                  color: PRIMARY,
                }}
              />

              <span
                className="text-[9px] font-bold uppercase tracking-wide"
                style={{
                  color: MUTED,
                }}
              >
                Question
              </span>
            </div>

            <p
              className="text-sm font-bold leading-6"
              style={{
                color: TEXT_PRIMARY,
              }}
            >
              {faq.question}
            </p>
          </div>

          {/* ANSWER */}
          <div
            className="rounded-xl border p-4"
            style={{
              borderColor:
                "rgba(30,58,138,0.10)",
              backgroundColor:
                "#FAFBFE",
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <FiFileText
                size={14}
                style={{
                  color: PRIMARY,
                }}
              />

              <span
                className="text-[9px] font-bold uppercase tracking-wide"
                style={{
                  color: MUTED,
                }}
              >
                Answer
              </span>
            </div>

            <div
              className="faq-answer-preview text-sm leading-6"
              style={{
                color:
                  TEXT_SECONDARY,
              }}
              dangerouslySetInnerHTML={{
                __html:
                  faq.answer || "",
              }}
            />
          </div>
        </div>

        <div
          className="flex justify-end border-t px-5 py-4"
          style={{
            borderColor:
              "rgba(30,58,138,0.10)",
            backgroundColor:
              "#FAFBFE",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border bg-white px-5 py-2.5 text-sm font-bold transition"
            style={{
              borderColor: BORDER,
              color:
                TEXT_SECONDARY,
            }}
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

const DeleteFAQModal: React.FC<
  DeleteFAQModalProps
> = ({
  open,
  loading,
  faq,
  onClose,
  onConfirm,
}) => {
  if (!open || !faq) {
    return null;
  }

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
                  color:
                    TEXT_PRIMARY,
                }}
              >
                Delete FAQ
              </h2>

              <p
                className="mt-1 text-sm leading-6"
                style={{
                  color:
                    TEXT_SECONDARY,
                }}
              >
                Are you sure you want to
                delete this FAQ?
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
                    color:
                      TEXT_SECONDARY,
                  }}
                >
                  {truncateText(
                    faq.question,
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
                color:
                  TEXT_SECONDARY,
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(194,59,50,0.6)] transition hover:-translate-y-0.5 disabled:opacity-50"
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

  const hasAnyPermission =
    useCallback(
      (permissions: string[]) =>
        permissions.some(
          (permission) =>
            hasPermission(permission)
        ),
      [hasPermission]
    );

  const canViewFAQs = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess(
        "FAQ"
      ) ||
      hasModuleAccess(
        "FAQs"
      ) ||
      hasModuleAccess(
        "faq"
      ) ||
      hasModuleAccess(
        "faqs"
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

  const canCreateFAQ = useMemo(
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

  const canUpdateFAQ = useMemo(
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

  const canDeleteFAQ = useMemo(
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

  // =================================================
  // STATES
  // =================================================

  const [faqs, setFaqs] =
    useState<FAQ[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [sections, setSections] =
    useState<FAQSection[]>([]);

  const [
    sectionsLoading,
    setSectionsLoading,
  ] = useState(false);

  const [search, setSearch] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [faqModalOpen, setFaqModalOpen] =
    useState(false);

  const [editingFAQ, setEditingFAQ] =
    useState<FAQ | null>(null);

  const [savingFAQ, setSavingFAQ] =
    useState(false);

  const [
    viewModalOpen,
    setViewModalOpen,
  ] = useState(false);

  const [
    selectedViewFAQ,
    setSelectedViewFAQ,
  ] = useState<FAQ | null>(null);

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [
    deleteLoading,
    setDeleteLoading,
  ] = useState(false);

  const [
    selectedFAQ,
    setSelectedFAQ,
  ] = useState<FAQ | null>(null);

  const ITEMS_PER_PAGE = 7;

  // =================================================
  // DUPLICATE FETCH PROTECTION
  // =================================================

  const faqFetchInFlightRef =
    useRef<Promise<void> | null>(
      null
    );

  const sectionFetchInFlightRef =
    useRef<Promise<void> | null>(
      null
    );

  const hasInitialFAQsFetchRef =
    useRef(false);

  const hasInitialSectionsFetchRef =
    useRef(false);

  // =================================================
  // FETCH FAQs
  // =================================================

  const fetchFAQs = useCallback(
    async (force = false) => {
      if (!canViewFAQs) {
        return;
      }

      if (faqFetchInFlightRef.current) {
        return faqFetchInFlightRef.current;
      }

      if (
        !force &&
        hasInitialFAQsFetchRef.current
      ) {
        return;
      }

      const requestPromise =
        (async () => {
          try {
            setLoading(true);

            const response =
              await faqsApi.getAll();

            if (
              response.data.success
            ) {
              setFaqs(
                response.data.data ||
                  []
              );

              hasInitialFAQsFetchRef.current =
                true;
            } else {
              toast.error(
                response.data
                  .message ||
                  "Unable to fetch FAQs."
              );
            }
          } catch (error: any) {
            console.error(
              "Fetch FAQs error:",
              error
            );

            toast.error(
              error?.response?.data
                ?.message ||
                "Unable to fetch FAQs."
            );
          } finally {
            setLoading(false);
          }
        })();

      faqFetchInFlightRef.current =
        requestPromise;

      try {
        await requestPromise;
      } finally {
        faqFetchInFlightRef.current =
          null;
      }
    },
    [canViewFAQs]
  );

  // =================================================
  // FETCH SECTIONS
  // =================================================

  const fetchSections = useCallback(
    async (force = false) => {
      if (!canViewFAQs) {
        return;
      }

      if (
        sectionFetchInFlightRef.current
      ) {
        return sectionFetchInFlightRef.current;
      }

      if (
        !force &&
        hasInitialSectionsFetchRef.current
      ) {
        return;
      }

      const requestPromise =
        (async () => {
          try {
            setSectionsLoading(
              true
            );

            const response =
              await faqSectionsApi.getAll();

            if (
              response.data.success
            ) {
              setSections(
                response.data.data ||
                  []
              );

              hasInitialSectionsFetchRef.current =
                true;
            } else {
              toast.error(
                response.data
                  .message ||
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
            setSectionsLoading(
              false
            );
          }
        })();

      sectionFetchInFlightRef.current =
        requestPromise;

      try {
        await requestPromise;
      } finally {
        sectionFetchInFlightRef.current =
          null;
      }
    },
    [canViewFAQs]
  );

  // =================================================
  // INITIAL LOAD
  // =================================================

  useEffect(() => {
    if (
      permissionsLoading ||
      !canViewFAQs
    ) {
      return;
    }

    if (
      !hasInitialFAQsFetchRef.current
    ) {
      fetchFAQs();
    }

    if (
      !hasInitialSectionsFetchRef.current
    ) {
      fetchSections();
    }
  }, [
    permissionsLoading,
    canViewFAQs,
    fetchFAQs,
    fetchSections,
  ]);

  // =================================================
  // FILTERED FAQs
  // =================================================

  const filteredFAQs = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return [...faqs]
      .filter((faq) => {
        const plainAnswer =
          stripHtml(
            faq.answer || ""
          );

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
        if (
          a.order !== b.order
        ) {
          return (
            a.order - b.order
          );
        }

        return a.id - b.id;
      });
  }, [faqs, search]);

  // =================================================
  // PAGINATION
  // =================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredFAQs.length /
        ITEMS_PER_PAGE
    )
  );

  const startIndex =
    (currentPage - 1) *
    ITEMS_PER_PAGE;

  const paginatedFAQs =
    filteredFAQs.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );

  const startEntry =
    filteredFAQs.length === 0
      ? 0
      : startIndex + 1;

  const endEntry = Math.min(
    startIndex +
      ITEMS_PER_PAGE,
    filteredFAQs.length
  );

  useEffect(() => {
    if (
      currentPage > totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const paginationPages =
    useMemo(() => {
      if (totalPages <= 5) {
        return Array.from(
          {
            length: totalPages,
          },
          (_, index) =>
            index + 1
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

  // =================================================
  // HANDLERS
  // =================================================

  const openAddFAQ = () => {
    if (!canCreateFAQ) {
      toast.error(
        "You do not have permission to create FAQs."
      );
      return;
    }

    setEditingFAQ(null);
    setFaqModalOpen(true);

    if (
      !hasInitialSectionsFetchRef.current
    ) {
      fetchSections();
    }
  };

  const openEditFAQ = (
    faq: FAQ
  ) => {
    if (!canUpdateFAQ) {
      toast.error(
        "You do not have permission to update FAQs."
      );
      return;
    }

    setEditingFAQ(faq);
    setFaqModalOpen(true);

    if (
      !hasInitialSectionsFetchRef.current
    ) {
      fetchSections();
    }
  };

  const openViewFAQ = (
    faq: FAQ
  ) => {
    if (!canViewFAQs) {
      toast.error(
        "You do not have permission to view FAQs."
      );
      return;
    }

    setSelectedViewFAQ(faq);
    setViewModalOpen(true);
  };

  // =================================================
  // SAVE SINGLE FAQ
  // =================================================

  const handleSaveFAQ =
    async (
      payload: FAQForm
    ) => {
      if (!editingFAQ) {
        toast.error(
          "Invalid FAQ update request."
        );
        return;
      }

      if (!canUpdateFAQ) {
        toast.error(
          "You do not have permission to update FAQs."
        );
        return;
      }

      try {
        setSavingFAQ(true);

        const response =
          await faqsApi.update(
            editingFAQ.id,
            {
              section_id:
                payload.section_id,
              question:
                payload.question,
              answer:
                payload.answer,
              is_active:
                payload.is_active
                  ? 1
                  : 0,
            }
          );

        if (
          response.data.success
        ) {
          toast.success(
            response.data
              .message ||
              "FAQ updated successfully."
          );

          setFaqModalOpen(false);
          setEditingFAQ(null);

          await fetchFAQs(true);
        } else {
          toast.error(
            response.data
              .message ||
              "Unable to update FAQ."
          );
        }
      } catch (error: any) {
        console.error(
          "Save FAQ error:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            error?.message ||
            "Unable to update FAQ."
        );
      } finally {
        setSavingFAQ(false);
      }
    };

  // =================================================
  // SAVE BULK FAQ
  // =================================================

  const handleSaveBulkFAQ =
    async (payload: {
      section_id: number;
      faqs: FAQBulkFormItem[];
    }) => {
      if (!canCreateFAQ) {
        toast.error(
          "You do not have permission to create FAQs."
        );
        return;
      }

      try {
        setSavingFAQ(true);

        const response =
          await faqsApi.createBulk({
            section_id:
              payload.section_id,
            is_active: true,
            faqs:
              payload.faqs.map(
                (
                  item,
                  index
                ) => ({
                  question:
                    item.question,
                  answer:
                    item.answer,
                  order:
                    index + 1,
                  is_active: true,
                })
              ),
          });

        if (
          response.data.success
        ) {
          toast.success(
            response.data
              .message ||
              (payload.faqs.length >
              1
                ? "FAQs added successfully."
                : "FAQ added successfully.")
          );

          setFaqModalOpen(false);
          setEditingFAQ(null);

          await fetchFAQs(true);
        } else {
          toast.error(
            response.data
              .message ||
              "Unable to save FAQs."
          );
        }
      } catch (error: any) {
        console.error(
          "Bulk save FAQs error:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            error?.message ||
            "Unable to save FAQs."
        );
      } finally {
        setSavingFAQ(false);
      }
    };

  // =================================================
  // DELETE
  // =================================================

  const openDelete = (
    faq: FAQ
  ) => {
    if (!canDeleteFAQ) {
      toast.error(
        "You do not have permission to delete FAQs."
      );
      return;
    }

    setSelectedFAQ(faq);
    setDeleteOpen(true);
  };

  const handleDelete =
    async () => {
      if (!selectedFAQ) {
        return;
      }

      if (!canDeleteFAQ) {
        toast.error(
          "You do not have permission to delete FAQs."
        );
        return;
      }

      try {
        setDeleteLoading(true);

        const response =
          await faqsApi.delete(
            selectedFAQ.id
          );

        if (
          response.data.success
        ) {
          toast.success(
            response.data
              .message ||
              "FAQ deleted successfully."
          );

          setDeleteOpen(false);
          setSelectedFAQ(null);

          await fetchFAQs(true);
        } else {
          toast.error(
            response.data
              .message ||
              "Unable to delete FAQ."
          );
        }
      } catch (error: any) {
        console.error(
          "Delete FAQ error:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            "Unable to delete FAQ."
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
      <div
        className="flex min-h-[500px] items-center justify-center p-6 font-poppins"
        style={{
          backgroundColor:
            PAGE_BG,
        }}
      >
        <div className="flex flex-col items-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm"
            style={{
              color: PRIMARY,
            }}
          >
            <FiRefreshCw
              size={23}
              className="animate-spin"
            />
          </div>

          <p
            className="mt-4 text-sm font-bold"
            style={{
              color:
                TEXT_PRIMARY,
            }}
          >
            Checking permissions...
          </p>

          <p
            className="mt-1 text-[10px]"
            style={{
              color: MUTED,
            }}
          >
            Verifying FAQ management access.
          </p>
        </div>
      </div>
    );
  }


  if (
    loading &&
    faqs.length === 0
  ) {
    return (
      <div
        className="flex min-h-[500px] items-center justify-center p-6 font-poppins"
        style={{
          backgroundColor:
            PAGE_BG,
        }}
      >
        <div className="flex flex-col items-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm"
            style={{
              color: PRIMARY,
            }}
          >
            <FiRefreshCw
              size={23}
              className="animate-spin"
            />
          </div>

          <p
            className="mt-4 text-sm font-bold"
            style={{
              color:
                TEXT_PRIMARY,
            }}
          >
            Loading FAQs...
          </p>

          <p
            className="mt-1 text-[10px]"
            style={{
              color: MUTED,
            }}
          >
            Fetching FAQ data.
          </p>
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
          box-shadow: 0 8px 20px rgba(30, 58, 138, 0.12);
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
          box-shadow: 0 8px 20px rgba(30, 58, 138, 0.12);
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

        .faq-answer-preview p {
          margin: 0 0 8px;
        }

        .faq-answer-preview p:last-child {
          margin-bottom: 0;
        }

        .faq-answer-preview ul,
        .faq-answer-preview ol {
          padding-left: 22px;
          margin: 6px 0;
        }

        .faq-answer-preview ul {
          list-style: disc;
        }

        .faq-answer-preview ol {
          list-style: decimal;
        }

        .faq-answer-preview li {
          margin: 3px 0;
        }

        .faq-answer-preview a {
          color: ${ACCENT};
          text-decoration: underline;
        }

        .faq-answer-preview strong {
          font-weight: 700;
          color: ${TEXT_PRIMARY};
        }

        .faq-answer-preview em {
          font-style: italic;
        }

        .faq-answer-preview blockquote {
          border-left: 3px solid ${ACCENT};
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

        .faq-answer-preview h1 {
          font-size: 18px;
        }

        .faq-answer-preview h2 {
          font-size: 16px;
        }

        .faq-answer-preview h3 {
          font-size: 15px;
        }

        .faq-answer-preview table {
          width: 100%;
          border-collapse: collapse;
          margin: 8px 0;
          font-size: 13px;
          background: ${WHITE};
          border-radius: 8px;
          overflow: hidden;
        }

        .faq-answer-preview thead th {
          background: ${PRIMARY};
          color: ${LIGHT_BLUE};
          text-align: left;
          padding: 8px 10px;
          font-weight: 700;
        }

        .faq-answer-preview tbody td {
          padding: 8px 10px;
          border-top: 1px solid #E4EAF3;
          color: ${TEXT_SECONDARY};
        }

        .faq-answer-preview tbody tr:nth-child(even) td {
          background: #FAFBFE;
        }

        .faq-answer-clamp {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          word-break: break-word;
          overflow-wrap: anywhere;
          line-height: 1.55;
        }

        .faq-editor-wrapper .ql-editor table {
          width: 100%;
          border-collapse: collapse;
          margin: 6px 0;
        }

        .faq-editor-wrapper .ql-editor thead th {
          background: ${PRIMARY};
          color: ${LIGHT_BLUE};
          padding: 6px 8px;
          text-align: left;
        }

        .faq-editor-wrapper .ql-editor tbody td {
          padding: 6px 8px;
          border-top: 1px solid #E4EAF3;
        }
      `}</style>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="min-h-screen p-4 font-poppins sm:p-5 lg:p-6"
        style={{
          backgroundColor:
            PAGE_BG,
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
                FAQ Management
              </h1>

              <span
                className="rounded-full border bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide"
                style={{
                  borderColor:
                    "rgba(30,58,138,0.15)",
                  color: PRIMARY,
                }}
              >
                Frequently Asked Questions
              </span>
            </div>

            <p
              className="mt-1 max-w-2xl text-xs leading-5"
              style={{
                color:
                  TEXT_SECONDARY,
              }}
            >
              Manage your website FAQs, answers
              and active status.
            </p>
          </div>

          <div className="flex gap-2">
            {/* REFRESH */}
            <button
              type="button"
              onClick={async () => {
                await Promise.all([
                  fetchFAQs(true),
                  fetchSections(true),
                ]);
              }}
              disabled={
                loading ||
                sectionsLoading
              }
              className="flex h-10 items-center justify-center gap-2 rounded-xl border bg-white px-4 text-xs font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                borderColor: BORDER,
                color: PRIMARY,
              }}
            >
              <FiRefreshCw
                size={15}
                className={
                  loading ||
                  sectionsLoading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            {/* ADD FAQ */}
            {canCreateFAQ ? (
              <button
                type="button"
                onClick={
                  openAddFAQ
                }
                className="flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold text-white shadow-[0_8px_18px_-8px_rgba(30,58,138,0.6)] transition hover:-translate-y-0.5"
                style={{
                  background:
                    `linear-gradient(135deg, ${ACCENT}, ${PRIMARY}, ${DARK_PRIMARY})`,
                }}
              >
                <FiPlus
                  size={15}
                />
                Add FAQ
              </button>
            ) : (
              <div
                className="flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-xs font-bold"
                style={{
                  borderColor:
                    BORDER,
                  color: MUTED,
                }}
              >
                <FiShield
                  size={14}
                />
                View Only
              </div>
            )}
          </div>
        </motion.div>

        {/* FAQ CARD */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-[20px] border bg-white shadow-[0_8px_30px_rgba(30,58,138,0.06)]"
          style={{
            borderColor:
              "#E0E7F2",
          }}
        >
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
                      event.target
                        .value
                    );
                    setCurrentPage(
                      1
                    );
                  }}
                  placeholder="Search question, answer or ID..."
                  className="h-11 w-full rounded-xl pl-11 pr-4 text-xs outline-none placeholder:text-[#8C97B2]"
                  style={{
                    border: `1px solid ${BORDER}`,
                    backgroundColor:
                      PAGE_BG,
                    color:
                      TEXT_PRIMARY,
                  }}
                />
              </div>

              {canCreateFAQ && (
                <button
                  type="button"
                  onClick={
                    openAddFAQ
                  }
                  className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-xs font-bold text-white shadow-[0_8px_18px_-8px_rgba(30,58,138,0.6)] transition hover:-translate-y-0.5"
                  style={{
                    background:
                      `linear-gradient(135deg, ${ACCENT}, ${PRIMARY}, ${DARK_PRIMARY})`,
                  }}
                >
                  <FiPlus
                    size={15}
                  />
                  Add FAQ
                </button>
              )}
            </div>
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col
                  style={{
                    width: "70px",
                  }}
                />

                <col
                  style={{
                    width: "220px",
                  }}
                />

                <col
                  style={{
                    width: "28%",
                  }}
                />

                <col
                  style={{
                    width: "auto",
                  }}
                />

                <col
                  style={{
                    width: "160px",
                  }}
                />
              </colgroup>

              <thead>
                <tr
                  style={{
                    backgroundColor:
                      PRIMARY,
                  }}
                >
                  <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                    S.No
                  </th>

                  <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                    Section
                  </th>

                  <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                    Question
                  </th>

                  <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                    Answer
                  </th>

                  <th className="px-4 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF1FF]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedFAQs.length ===
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
                            color:
                              PRIMARY,
                          }}
                        >
                          <FiFileText
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
                          No FAQs found
                        </p>

                        <p
                          className="mt-1 text-[10px]"
                          style={{
                            color:
                              MUTED,
                          }}
                        >
                          Add a new FAQ to
                          get started.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedFAQs.map(
                    (faq, index) => (
                      <motion.tr
                        key={faq.id}
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
                        <td className="px-4 py-4 align-top">
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
                        <td className="px-4 py-4 align-top">
                          <span
                            className="inline-flex max-w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold"
                            style={{
                              backgroundColor:
                                PAGE_BG,
                              color:
                                TEXT_SECONDARY,
                            }}
                          >
                            <FiLayers
                              size={11}
                              className="shrink-0"
                              style={{
                                color:
                                  PRIMARY,
                              }}
                            />

                            <span className="truncate">
                              {faq.section
                                ?.name ||
                                "-"}
                            </span>
                          </span>
                        </td>

                        {/* QUESTION */}
                        <td className="px-4 py-4 align-top">
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
                              <FiMessageCircle
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
                                  faq.question
                                }
                              </p>

                              <p
                                className="mt-1 text-[10px]"
                                style={{
                                  color:
                                    MUTED,
                                }}
                              >
                                FAQ #
                                {
                                  faq.id
                                }
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* ANSWER */}
                        <td className="px-4 py-4 align-top">
                          <p
                            className="faq-answer-clamp text-xs leading-5"
                            style={{
                              color:
                                TEXT_SECONDARY,
                            }}
                          >
                            {truncateText(
                              faq.answer,
                              140
                            )}
                          </p>
                        </td>

                        {/* ACTIONS */}
                        <td className="px-4 py-4 align-top">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* VIEW */}
                            <button
                              type="button"
                              title="View FAQ"
                              onClick={() =>
                                openViewFAQ(
                                  faq
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-xl border transition hover:text-white"
                              style={{
                                borderColor:
                                  BORDER,
                                backgroundColor:
                                  PAGE_BG,
                                color:
                                  PRIMARY,
                              }}
                            >
                              <FiEye
                                size={15}
                              />
                            </button>

                            {/* EDIT */}
                            {canUpdateFAQ && (
                              <button
                                type="button"
                                title="Edit FAQ"
                                onClick={() =>
                                  openEditFAQ(
                                    faq
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
                              >
                                <FiEdit3
                                  size={15}
                                />
                              </button>
                            )}

                            {/* DELETE */}
                            {canDeleteFAQ && (
                              <button
                                type="button"
                                title="Delete FAQ"
                                onClick={() =>
                                  openDelete(
                                    faq
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
            {paginatedFAQs.length >
            0 ? (
              paginatedFAQs.map(
                (faq) => (
                  <motion.div
                    key={faq.id}
                    variants={
                      itemVariants
                    }
                    className="border-b p-4"
                    style={{
                      borderColor:
                        "#EEF2F8",
                    }}
                  >
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
                          <FiMessageCircle
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
                            Question
                          </p>

                          <p
                            className="mt-1 text-sm font-bold leading-5"
                            style={{
                              color:
                                TEXT_PRIMARY,
                            }}
                          >
                            {
                              faq.question
                            }
                          </p>

                          <p
                            className="mt-1 font-mono text-[9px]"
                            style={{
                              color:
                                MUTED,
                            }}
                          >
                            FAQ #
                            {faq.id}
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
                        {faq.order}
                      </span>
                    </div>

                    {/* SECTION */}
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
                        Section
                      </p>

                      <p
                        className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold"
                        style={{
                          color:
                            TEXT_SECONDARY,
                        }}
                      >
                        <FiLayers
                          size={12}
                          style={{
                            color:
                              PRIMARY,
                          }}
                        />

                        {faq.section
                          ?.name ||
                          "-"}
                      </p>
                    </div>

                    {/* ANSWER */}
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
                        Answer
                      </p>

                      <p
                        className="mt-1 text-xs leading-5"
                        style={{
                          color:
                            TEXT_SECONDARY,
                        }}
                      >
                        {truncateText(
                          faq.answer,
                          180
                        )}
                      </p>
                    </div>

                    {/* BOTTOM */}
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${getStatusClass(
                          faq.is_active
                        )}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />

                        {faq.is_active
                          ? "Enabled"
                          : "Disabled"}
                      </span>

                      <div className="flex gap-2">
                        {/* VIEW */}
                        <button
                          type="button"
                          onClick={() =>
                            openViewFAQ(
                              faq
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl border"
                          style={{
                            borderColor:
                              BORDER,
                            backgroundColor:
                              PAGE_BG,
                            color:
                              PRIMARY,
                          }}
                        >
                          <FiEye
                            size={14}
                          />
                        </button>

                        {/* EDIT */}
                        {canUpdateFAQ && (
                          <button
                            type="button"
                            onClick={() =>
                              openEditFAQ(
                                faq
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

                        {/* DELETE */}
                        {canDeleteFAQ && (
                          <button
                            type="button"
                            onClick={() =>
                              openDelete(
                                faq
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
                      </div>
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
                    color:
                      PRIMARY,
                  }}
                >
                  <FiFileText
                    size={22}
                  />
                </div>

                <p
                  className="mt-3 text-sm font-bold"
                  style={{
                    color:
                      TEXT_PRIMARY,
                  }}
                >
                  No FAQs found
                </p>

                <p
                  className="mt-1 text-[10px]"
                  style={{
                    color: MUTED,
                  }}
                >
                  Add a FAQ from the button
                  above.
                </p>
              </div>
            )}
          </div>

          {/* PAGINATION */}
          {filteredFAQs.length >
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
                    {filteredFAQs.length}
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
                      currentPage ===
                      1
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

      {/* ADD / EDIT MODAL */}
      <FAQModal
        open={faqModalOpen}
        editingFAQ={editingFAQ}
        sections={sections}
        sectionsLoading={
          sectionsLoading
        }
        loading={savingFAQ}
        canSubmit={
          editingFAQ
            ? canUpdateFAQ
            : canCreateFAQ
        }
        onClose={() => {
          if (savingFAQ) return;

          setFaqModalOpen(false);
          setEditingFAQ(null);
        }}
        onSubmit={
          handleSaveFAQ
        }
        onSubmitBulk={
          handleSaveBulkFAQ
        }
      />

      {/* VIEW */}
      <ViewFAQModal
        open={viewModalOpen}
        faq={selectedViewFAQ}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedViewFAQ(
            null
          );
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
        onConfirm={
          handleDelete
        }
      />
    </>
  );
};

export default FAQManagement;