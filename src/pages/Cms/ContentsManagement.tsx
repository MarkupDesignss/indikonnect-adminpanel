
import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
  } from "react";
  
  import {
    FiChevronDown,
    FiChevronLeft,
    FiChevronRight,
    FiClock,
    FiEdit2,
    FiEye,
    FiFileText,
    FiImage,
    FiList,
    FiPlus,
    FiRefreshCw,
    FiSave,
    FiSearch,
    FiTrash2,
    FiUpload,
    FiX,
  } from "react-icons/fi";
  
  import { motion } from "framer-motion";
  import toast from "react-hot-toast";
  
  import GlobalModal from "@/components/common/GlobalModal";
  
  import contentsApi, {
    ContentBlockPayload,
    ContentPage,
    ContentPayload,
  } from "../../api/endpoints/contents";
  
  // =====================================================
  // THEME
  // =====================================================
  
  const GOLD = "#b8902e";
  const DARK_GOLD = "#8f6d1d";
  const PAGE_BG = "#f7f5ef";
  
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
        staggerChildren: 0.04,
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
  // TYPES
  // =====================================================
  
  interface PageGroup {
    slug: string;
    title: string;
    latest: ContentPage;
    versions: ContentPage[];
  }
  
  // =====================================================
  // HELPERS
  // =====================================================
  
  const formatDate = (
    value?: string | null
  ) => {
    if (!value) {
      return "—";
    }
  
    const date =
      new Date(value);
  
    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }
  
    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };
  
  const versionNumber = (
    version?: string
  ) => {
    return Number(
      version || "0"
    );
  };
  
  const statusClass = (
    status: string
  ) => {
    switch (
      status?.toLowerCase()
    ) {
      case "published":
        return "border-[#b8902e]/25 bg-[#f8f3e5] text-[#806319]";
  
      case "draft":
        return "border-[#d8d1c4] bg-[#f6f4ef] text-[#786f60]";
  
      case "archived":
        return "border-[#c98d83]/20 bg-[#fff8f6] text-[#a14f46]";
  
      default:
        return "border-[#d8d1c4] bg-[#f6f4ef] text-[#786f60]";
    }
  };
  
  const initials = (
    title: string
  ) => {
    const value = title
      ?.trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((item) =>
        item
          .charAt(0)
          .toUpperCase()
      )
      .join("");
  
    return value || "PG";
  };
  
  // =====================================================
  // STATUS BADGE
  // =====================================================
  
  const StatusBadge: React.FC<{
    status: string;
  }> = ({ status }) => {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide ${statusClass(
          status
        )}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {status}
      </span>
    );
  };
  
  // =====================================================
  // FORM BLOCK TYPE
  // =====================================================
  
  interface FormBlock {
    heading: string;
    short_description: string;
    description: string;
    sort_order: number;
    imageFiles: File[];
    existingImages: {
      id?: number;
      url: string;
      alt_text?: string | null;
      is_primary?: boolean;
    }[];
  }
  
  // =====================================================
  // BLOCK FORM
  // =====================================================
  
  interface BlockEditorProps {
    block: FormBlock;
    index: number;
    onChange: (
      index: number,
      key: keyof FormBlock,
      value: any
    ) => void;
    onRemove: (
      index: number
    ) => void;
    canRemove: boolean;
  }
  
  const BlockEditor: React.FC<
    BlockEditorProps
  > = ({
    block,
    index,
    onChange,
    onRemove,
    canRemove,
  }) => {
    const fileInputRef =
      useRef<HTMLInputElement | null>(
        null
      );
  
    return (
      <div className="rounded-[18px] border border-[#b8902e]/12 bg-[#fbfaf7] p-4 sm:p-5">
        {/* HEADER */}
  
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faf8f3] text-[#a8841c]">
              <FiList size={16} />
            </div>
  
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#a19583]">
                Content Block
              </p>
  
              <h4 className="mt-0.5 text-sm font-bold text-[#29251f]">
                Block {index + 1}
              </h4>
            </div>
          </div>
  
          {canRemove && (
            <button
              type="button"
              onClick={() =>
                onRemove(index)
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#c98d83]/20 bg-[#fff8f6] text-[#b46055] transition hover:bg-[#b46055] hover:text-white"
              title="Remove block"
            >
              <FiTrash2 size={14} />
            </button>
          )}
        </div>
  
        <div className="grid grid-cols-1 gap-4">
          {/* HEADING */}
  
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#786f60]">
              Heading
            </label>
  
            <input
              type="text"
              value={block.heading}
              onChange={(event) =>
                onChange(
                  index,
                  "heading",
                  event.target.value
                )
              }
              placeholder="<h1>Your heading</h1>"
              className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-white px-4 text-sm text-[#29251f] outline-none transition placeholder:text-[#aaa08e] focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/10"
            />
          </div>
  
          {/* SHORT DESCRIPTION */}
  
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#786f60]">
              Short Description
            </label>
  
            <textarea
              value={
                block.short_description
              }
              onChange={(event) =>
                onChange(
                  index,
                  "short_description",
                  event.target.value
                )
              }
              rows={3}
              placeholder="<p>Short description...</p>"
              className="w-full resize-none rounded-xl border border-[#d8d0c0] bg-white px-4 py-3 text-sm leading-6 text-[#29251f] outline-none transition placeholder:text-[#aaa08e] focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/10"
            />
          </div>
  
          {/* DESCRIPTION */}
  
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#786f60]">
                Description
              </label>
  
              <span className="text-[9px] text-[#a19583]">
                HTML supported
              </span>
            </div>
  
            <textarea
              value={
                block.description
              }
              onChange={(event) =>
                onChange(
                  index,
                  "description",
                  event.target.value
                )
              }
              rows={8}
              placeholder="<p>Write page content here...</p>"
              className="w-full resize-y rounded-xl border border-[#d8d0c0] bg-white px-4 py-3 font-mono text-xs leading-6 text-[#29251f] outline-none transition placeholder:text-[#aaa08e] focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/10"
            />
          </div>
  
          {/* ORDER */}
  
          <div className="max-w-[180px]">
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#786f60]">
              Sort Order
            </label>
  
            <input
              type="number"
              min={0}
              value={
                block.sort_order
              }
              onChange={(event) =>
                onChange(
                  index,
                  "sort_order",
                  Number(
                    event.target.value
                  )
                )
              }
              className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-white px-4 text-sm text-[#29251f] outline-none focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/10"
            />
          </div>
  
          {/* IMAGE */}
  
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#786f60]">
              Block Images
            </label>
  
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(
                event
              ) => {
                const files = Array.from(
                  event.target.files || []
                );
  
                onChange(
                  index,
                  "imageFiles",
                  [
                    ...block.imageFiles,
                    ...files,
                  ]
                );
  
                event.target.value =
                  "";
              }}
            />
  
            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="flex min-h-[78px] w-full items-center justify-center gap-3 rounded-xl border border-dashed border-[#b8902e]/30 bg-white px-4 text-xs font-semibold text-[#8f6d1d] transition hover:border-[#b8902e]/50 hover:bg-[#fffdf8]"
            >
              <FiUpload size={18} />
  
              <span>
                Click to upload
                images
              </span>
            </button>
  
            {/* EXISTING */}
  
            {block.existingImages
              .length > 0 && (
              <div className="mt-3">
                <p className="mb-2 text-[9px] font-bold uppercase tracking-wide text-[#a19583]">
                  Existing Images
                </p>
  
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {block.existingImages.map(
                    (image, imageIndex) => (
                      <div
                        key={
                          image.id ??
                          imageIndex
                        }
                        className="aspect-square overflow-hidden rounded-xl border border-[#b8902e]/10 bg-white"
                      >
                        <img
                          src={
                            image.url
                          }
                          alt={
                            image.alt_text ||
                            "Page image"
                          }
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
  
            {/* NEW */}
  
            {block.imageFiles
              .length > 0 && (
              <div className="mt-3">
                <p className="mb-2 text-[9px] font-bold uppercase tracking-wide text-[#a19583]">
                  New Images
                </p>
  
                <div className="space-y-2">
                  {block.imageFiles.map(
                    (
                      file,
                      fileIndex
                    ) => (
                      <div
                        key={`${file.name}-${fileIndex}`}
                        className="flex items-center justify-between rounded-xl border border-[#b8902e]/10 bg-white px-3 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <FiImage
                            size={14}
                            className="shrink-0 text-[#b8902e]"
                          />
  
                          <span className="truncate text-[10px] font-semibold text-[#4d463b]">
                            {
                              file.name
                            }
                          </span>
                        </div>
  
                        <button
                          type="button"
                          onClick={() => {
                            onChange(
                              index,
                              "imageFiles",
                              block.imageFiles.filter(
                                (
                                  _,
                                  idx
                                ) =>
                                  idx !==
                                  fileIndex
                              )
                            );
                          }}
                          className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#b46055] hover:bg-[#fff8f6]"
                        >
                          <FiX
                            size={13}
                          />
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // =====================================================
  // VIEW MODAL
  // =====================================================
  
  interface ViewPageModalProps {
    open: boolean;
    page: PageGroup | null;
    onClose: () => void;
  }
  
  const ViewPageModal: React.FC<
    ViewPageModalProps
  > = ({
    open,
    page,
    onClose,
  }) => {
    const [activeVersionId, setActiveVersionId] =
      useState<number | null>(
        page?.latest.id || null
      );
  
    useEffect(() => {
      setActiveVersionId(
        page?.latest.id || null
      );
    }, [page]);
  
    if (
      !open ||
      !page
    ) {
      return null;
    }
  
    const activePage =
      page.versions.find(
        (item) =>
          item.id ===
          activeVersionId
      ) ||
      page.latest;
  
    return (
      <GlobalModal
        isOpen={open}
        onClose={onClose}
        closeOnOverlayClick
      >
        <div className="w-full max-w-[900px] overflow-hidden rounded-[22px] border border-[#b8902e]/15 bg-white shadow-2xl">
          <div className="h-[3px] w-full bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]" />
  
          {/* HEADER */}
  
          <div className="flex items-start justify-between gap-4 border-b border-[#b8902e]/10 px-5 py-5 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-sm font-bold text-white">
                {initials(
                  page.title
                )}
              </div>
  
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-[20px] font-bold text-[#29251f]">
                    {page.title}
                  </h2>
  
                  <StatusBadge
                    status={
                      activePage.status
                    }
                  />
                </div>
  
                <p className="mt-1 truncate text-xs text-[#a19583]">
                  /{page.slug} • Version{" "}
                  {
                    activePage.version
                  }
                </p>
              </div>
            </div>
  
            <button
              type="button"
              onClick={
                onClose
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#faf8f3] text-[#8f6d1d] transition hover:bg-[#f2ead8]"
            >
              <FiX size={18} />
            </button>
          </div>
  
          <div className="max-h-[75vh] overflow-y-auto">
            <div className="grid grid-cols-1 xl:grid-cols-[240px_1fr]">
              {/* VERSION SIDEBAR */}
  
              <aside className="border-b border-[#b8902e]/10 bg-[#fbfaf7] p-4 xl:border-b-0 xl:border-r">
                <div className="mb-3">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#a19583]">
                    Version History
                  </p>
  
                  <p className="mt-1 text-xs text-[#786f60]">
                    {page.versions.length} version
                    {page.versions.length !==
                    1
                      ? "s"
                      : ""}{" "}
                    available
                  </p>
                </div>
  
                <div className="space-y-2">
                  {page.versions
                    .sort(
                      (
                        a,
                        b
                      ) =>
                        versionNumber(
                          b.version
                        ) -
                        versionNumber(
                          a.version
                        )
                    )
                    .map(
                      (
                        version
                      ) => {
                        const selected =
                          version.id ===
                          activeVersionId;
  
                        return (
                          <button
                            key={
                              version.id
                            }
                            type="button"
                            onClick={() =>
                              setActiveVersionId(
                                version.id
                              )
                            }
                            className={`w-full rounded-xl border p-3 text-left transition ${
                              selected
                                ? "border-[#b8902e]/30 bg-white shadow-sm"
                                : "border-[#b8902e]/10 bg-transparent hover:bg-white"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-[#29251f]">
                                v
                                {
                                  version.version
                                }
                              </span>
  
                              <StatusBadge
                                status={
                                  version.status
                                }
                              />
                            </div>
  
                            <p className="mt-2 flex items-center gap-1 text-[9px] text-[#a19583]">
                              <FiClock
                                size={10}
                              />
                              {formatDate(
                                version.created_at
                              )}
                            </p>
                          </button>
                        );
                      }
                    )}
                </div>
              </aside>
  
              {/* CONTENT */}
  
              <div className="p-5 sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#a19583]">
                      Page Content
                    </p>
  
                    <p className="mt-1 text-xs text-[#786f60]">
                      Updated{" "}
                      {formatDate(
                        activePage.updated_at
                      )}
                    </p>
                  </div>
  
                  <span className="rounded-lg bg-[#faf8f3] px-3 py-2 text-[10px] font-bold text-[#8f6d1d]">
                    {activePage.blocks.length}{" "}
                    block
                    {activePage.blocks.length !==
                    1
                      ? "s"
                      : ""}
                  </span>
                </div>
  
                <div className="space-y-5">
                  {activePage.blocks.length ===
                  0 ? (
                    <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-8 text-center">
                      <FiFileText
                        size={28}
                        className="mx-auto text-[#b8902e]"
                      />
  
                      <p className="mt-3 text-sm font-bold text-[#29251f]">
                        No content blocks
                      </p>
                    </div>
                  ) : (
                    activePage.blocks.map(
                      (
                        block,
                        index
                      ) => (
                        <div
                          key={
                            block.id ??
                            index
                          }
                          className="rounded-[18px] border border-[#b8902e]/10 bg-[#fbfaf7] p-4 sm:p-5"
                        >
                          <div className="mb-4 flex items-center justify-between">
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-wide text-[#a19583]">
                                Block{" "}
                                {index +
                                  1}
                              </p>
  
                              <p className="mt-1 text-[10px] text-[#8f6d1d]">
                                Sort order:{" "}
                                {
                                  block.sort_order
                                }
                              </p>
                            </div>
                          </div>
  
                          {block.heading && (
                            <div className="mb-4">
                              <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-[#a19583]">
                                Heading
                              </p>
  
                              <div
                                className="prose prose-sm max-w-none text-[#29251f]"
                                dangerouslySetInnerHTML={{
                                  __html:
                                    block.heading,
                                }}
                              />
                            </div>
                          )}
  
                          {block.short_description && (
                            <div className="mb-4">
                              <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-[#a19583]">
                                Short Description
                              </p>
  
                              <div
                                className="prose prose-sm max-w-none text-[#5f574c]"
                                dangerouslySetInnerHTML={{
                                  __html:
                                    block.short_description,
                                }}
                              />
                            </div>
                          )}
  
                          {block.description && (
                            <div className="mb-4">
                              <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-[#a19583]">
                                Description
                              </p>
  
                              <div
                                className="prose prose-sm max-w-none text-[#5f574c]"
                                dangerouslySetInnerHTML={{
                                  __html:
                                    block.description,
                                }}
                              />
                            </div>
                          )}
  
                          {block.images.length >
                            0 && (
                            <div>
                              <p className="mb-2 text-[9px] font-bold uppercase tracking-wide text-[#a19583]">
                                Images
                              </p>
  
                              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {block.images.map(
                                  (
                                    image,
                                    imageIndex
                                  ) => (
                                    <div
                                      key={
                                        image.id ??
                                        imageIndex
                                      }
                                      className="group relative aspect-video overflow-hidden rounded-xl border border-[#b8902e]/10 bg-white"
                                    >
                                      <img
                                        src={
                                          image.url
                                        }
                                        alt={
                                          image.alt_text ||
                                          "Page content"
                                        }
                                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                      />
  
                                      {image.is_primary && (
                                        <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-1 text-[8px] font-bold text-white">
                                          Primary
                                        </span>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
  
          <div className="flex justify-end border-t border-[#b8902e]/10 bg-[#fffdfa] px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={
                onClose
              }
              className="rounded-xl border border-[#b8902e]/15 bg-white px-5 py-2.5 text-sm font-bold text-[#786f60] transition hover:bg-[#faf8f3]"
            >
              Close
            </button>
          </div>
        </div>
      </GlobalModal>
    );
  };
  
  // =====================================================
  // PAGE FORM MODAL
  // =====================================================
  
  interface PageFormModalProps {
    open: boolean;
    loading: boolean;
    mode: "add" | "edit";
    page: ContentPage | null;
    onClose: () => void;
    onSubmit: (
      payload: ContentPayload
    ) => void;
  }
  
  const PageFormModal: React.FC<
    PageFormModalProps
  > = ({
    open,
    loading,
    mode,
    page,
    onClose,
    onSubmit,
  }) => {
    const [title, setTitle] =
      useState("");
  
    const [status, setStatus] =
      useState("published");
  
    const [blocks, setBlocks] =
      useState<FormBlock[]>([]);
  
    useEffect(() => {
      if (!open) {
        return;
      }
  
      setTitle(
        page?.title ||
          ""
      );
  
      setStatus(
        page?.status ||
          "published"
      );
  
      if (
        page?.blocks &&
        page.blocks.length >
          0
      ) {
        setBlocks(
          page.blocks.map(
            (block) => ({
              heading:
                block.heading ||
                "",
  
              short_description:
                block.short_description ||
                "",
  
              description:
                block.description ||
                "",
  
              sort_order:
                Number(
                  block.sort_order
                ) || 0,
  
              imageFiles: [],
  
              existingImages:
                block.images ||
                [],
            })
          )
        );
      } else {
        setBlocks([
          {
            heading: "",
            short_description:
              "",
            description: "",
            sort_order: 0,
            imageFiles: [],
            existingImages: [],
          },
        ]);
      }
    }, [
      open,
      page,
    ]);
  
    if (!open) {
      return null;
    }
  
    const updateBlock = (
      index: number,
      key: keyof FormBlock,
      value: any
    ) => {
      setBlocks(
        (previous) =>
          previous.map(
            (
              block,
              blockIndex
            ) =>
              blockIndex ===
              index
                ? {
                    ...block,
                    [key]:
                      value,
                  }
                : block
          )
      );
    };
  
    const addBlock = () => {
      setBlocks(
        (previous) => [
          ...previous,
          {
            heading: "",
            short_description:
              "",
            description: "",
            sort_order:
              previous.length,
            imageFiles: [],
            existingImages: [],
          },
        ]
      );
    };
  
    const removeBlock = (
      index: number
    ) => {
      setBlocks(
        (previous) =>
          previous
            .filter(
              (
                _,
                blockIndex
              ) =>
                blockIndex !==
                index
            )
            .map(
              (
                block,
                blockIndex
              ) => ({
                ...block,
                sort_order:
                  blockIndex,
              })
            )
      );
    };
  
    const handleSubmit = (
      event: React.FormEvent
    ) => {
      event.preventDefault();
  
      if (!title.trim()) {
        toast.error(
          "Page title is required."
        );
        return;
      }
  
      if (
        blocks.length ===
        0
      ) {
        toast.error(
          "At least one content block is required."
        );
        return;
      }
  
      const payload: ContentPayload =
        {
          title:
            title.trim(),
  
          status,
  
          blocks:
            blocks.map(
              (
                block
              ): ContentBlockPayload => ({
                heading:
                  block.heading,
                short_description:
                  block.short_description,
                description:
                  block.description,
                sort_order:
                  block.sort_order,
                imageFiles:
                  block.imageFiles,
                existingImages:
                  block.existingImages,
              })
            ),
        };
  
      onSubmit(
        payload
      );
    };
  
    return (
      <GlobalModal
        isOpen={open}
        onClose={() => {
          if (!loading) {
            onClose();
          }
        }}
        closeOnOverlayClick={
          !loading
        }
      >
        <div className="w-full max-w-[900px] overflow-hidden rounded-[22px] border border-[#b8902e]/15 bg-white shadow-2xl">
          <div className="h-[3px] w-full bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]" />
  
          {/* HEADER */}
  
          <div className="flex items-start justify-between gap-4 border-b border-[#b8902e]/10 px-5 py-5 sm:px-6">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
                  {mode ===
                  "add" ? (
                    <FiPlus
                      size={17}
                    />
                  ) : (
                    <FiEdit2
                      size={16}
                    />
                  )}
                </div>
  
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#9a741b]">
                  Content Management
                </span>
              </div>
  
              <h2 className="text-[20px] font-bold text-[#29251f]">
                {mode ===
                "add"
                  ? "Add Page"
                  : "Edit Page"}
              </h2>
  
              <p className="mt-1 text-xs text-[#a19583]">
                Manage page content, status, blocks and
                images.
              </p>
            </div>
  
            <button
              type="button"
              onClick={
                onClose
              }
              disabled={
                loading
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faf8f3] text-[#8f6d1d] transition hover:bg-[#f2ead8] disabled:opacity-50"
            >
              <FiX size={18} />
            </button>
          </div>
  
          <form
            onSubmit={
              handleSubmit
            }
          >
            <div className="max-h-[72vh] overflow-y-auto p-5 sm:p-6">
              {/* BASIC INFO */}
  
              <div className="rounded-[18px] border border-[#b8902e]/12 bg-[#fbfaf7] p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faf8f3] text-[#a8841c]">
                    <FiFileText
                      size={16}
                    />
                  </div>
  
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#a19583]">
                      Page Settings
                    </p>
  
                    <p className="mt-0.5 text-sm font-bold text-[#29251f]">
                      Basic Information
                    </p>
                  </div>
                </div>
  
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#786f60]">
                      Page Title
                    </label>
  
                    <input
                      type="text"
                      value={
                        title
                      }
                      onChange={(
                        event
                      ) =>
                        setTitle(
                          event
                            .target
                            .value
                        )
                      }
                      placeholder="Home"
                      className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-white px-4 text-sm text-[#29251f] outline-none transition placeholder:text-[#aaa08e] focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/10"
                    />
                  </div>
  
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#786f60]">
                      Status
                    </label>
  
                    <div className="relative">
                      <select
                        value={
                          status
                        }
                        onChange={(
                          event
                        ) =>
                          setStatus(
                            event
                              .target
                              .value
                          )
                        }
                        className="h-11 w-full appearance-none rounded-xl border border-[#d8d0c0] bg-white px-4 pr-10 text-sm text-[#29251f] outline-none focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/10"
                      >
                        <option value="published">
                          Published
                        </option>
  
                        <option value="draft">
                          Draft
                        </option>
  
                        <option value="archived">
                          Archived
                        </option>
                      </select>
  
                      <FiChevronDown
                        size={15}
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#8f6d1d]"
                      />
                    </div>
                  </div>
                </div>
              </div>
  
              {/* BLOCKS */}
  
              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#a19583]">
                      Page Builder
                    </p>
  
                    <h3 className="mt-0.5 text-base font-bold text-[#29251f]">
                      Content Blocks
                    </h3>
                  </div>
  
                  <button
                    type="button"
                    onClick={
                      addBlock
                    }
                    className="flex h-9 items-center gap-2 rounded-xl border border-[#b8902e]/20 bg-[#fffaf0] px-3.5 text-[10px] font-bold text-[#8f6d1d] transition hover:bg-[#b8902e] hover:text-white"
                  >
                    <FiPlus
                      size={14}
                    />
  
                    Add Block
                  </button>
                </div>
  
                <div className="space-y-4">
                  {blocks.map(
                    (
                      block,
                      index
                    ) => (
                      <BlockEditor
                        key={
                          index
                        }
                        block={
                          block
                        }
                        index={
                          index
                        }
                        onChange={
                          updateBlock
                        }
                        onRemove={
                          removeBlock
                        }
                        canRemove={
                          blocks.length >
                          1
                        }
                      />
                    )
                  )}
                </div>
              </div>
            </div>
  
            {/* FOOTER */}
  
            <div className="flex flex-col-reverse gap-2 border-t border-[#b8902e]/10 bg-[#fffdfa] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={
                  onClose
                }
                disabled={
                  loading
                }
                className="rounded-xl border border-[#b8902e]/15 bg-white px-5 py-2.5 text-sm font-bold text-[#786f60] transition hover:bg-[#faf8f3] disabled:opacity-50"
              >
                Cancel
              </button>
  
              <button
                type="submit"
                disabled={
                  loading
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#b8902e]/15 transition hover:from-[#a98227] hover:to-[#7e6017] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <FiRefreshCw
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <FiSave
                    size={15}
                  />
                )}
  
                {loading
                  ? "Saving..."
                  : mode ===
                    "add"
                  ? "Create Page"
                  : "Update Page"}
              </button>
            </div>
          </form>
        </div>
      </GlobalModal>
    );
  };
  
  // =====================================================
  // DELETE MODAL
  // =====================================================
  
  interface DeletePageModalProps {
    open: boolean;
    loading: boolean;
    page: ContentPage | null;
    onClose: () => void;
    onConfirm: () => void;
  }
  
  const DeletePageModal: React.FC<
    DeletePageModalProps
  > = ({
    open,
    loading,
    page,
    onClose,
    onConfirm,
  }) => {
    if (
      !open ||
      !page
    ) {
      return null;
    }
  
    return (
      <GlobalModal
        isOpen={open}
        onClose={onClose}
        closeOnOverlayClick={
          !loading
        }
      >
        <div className="w-full max-w-[450px] overflow-hidden rounded-[22px] border border-[#b8902e]/15 bg-white shadow-2xl">
          <div className="h-[3px] w-full bg-gradient-to-r from-[#d4af52] to-[#8a6c1f]" />
  
          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff8f6] text-[#b46055]">
                <FiTrash2
                  size={21}
                />
              </div>
  
              <div>
                <h2 className="text-lg font-bold text-[#29251f]">
                  Delete Page
                </h2>
  
                <p className="mt-1 text-sm leading-6 text-[#786f60]">
                  Are you sure you want to delete this page version?
                </p>
              </div>
            </div>
  
            <div className="mt-5 rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xs font-bold text-[#8f6d1d]">
                  {initials(
                    page.title
                  )}
                </div>
  
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#29251f]">
                    {
                      page.title
                    }
                  </p>
  
                  <p className="mt-1 truncate text-[10px] text-[#a19583]">
                    /{page.slug} • Version{" "}
                    {
                      page.version
                    }
                  </p>
                </div>
              </div>
            </div>
  
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={
                  onClose
                }
                disabled={
                  loading
                }
                className="rounded-xl border border-[#b8902e]/15 bg-white px-5 py-2.5 text-sm font-bold text-[#786f60] transition hover:bg-[#faf8f3] disabled:opacity-50"
              >
                Cancel
              </button>
  
              <button
                type="button"
                onClick={
                  onConfirm
                }
                disabled={
                  loading
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b46055] to-[#93483e] px-5 py-2.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <FiRefreshCw
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <FiTrash2
                    size={15}
                  />
                )}
  
                {loading
                  ? "Deleting..."
                  : "Delete Page"}
              </button>
            </div>
          </div>
        </div>
      </GlobalModal>
    );
  };
  
  // =====================================================
  // MAIN PAGE
  // =====================================================
  
  const ContentsManagement: React.FC =
    () => {
      const [
        pages,
        setPages,
      ] = useState<
        ContentPage[]
      >([]);
  
      const [
        loading,
        setLoading,
      ] = useState(false);
  
      const [
        saveLoading,
        setSaveLoading,
      ] = useState(false);
  
      const [
        deleteLoading,
        setDeleteLoading,
      ] = useState(false);
  
      const [
        search,
        setSearch,
      ] = useState("");
  
      const [
        statusFilter,
        setStatusFilter,
      ] = useState<
        "all" | "published" | "draft" | "archived"
      >("all");
  
      const [
        currentPage,
        setCurrentPage,
      ] = useState(1);
  
      const [
        viewOpen,
        setViewOpen,
      ] = useState(false);
  
      const [
        addEditOpen,
        setAddEditOpen,
      ] = useState(false);
  
      const [
        deleteOpen,
        setDeleteOpen,
      ] = useState(false);
  
      const [
        modalMode,
        setModalMode,
      ] = useState<
        "add" | "edit"
      >("add");
  
      const [
        selectedGroup,
        setSelectedGroup,
      ] = useState<
        PageGroup | null
      >(null);
  
      const [
        selectedPage,
        setSelectedPage,
      ] = useState<
        ContentPage | null
      >(null);
  
      const ITEMS_PER_PAGE = 10;
  
      // =================================================
      // FETCH
      // =================================================
  
      const fetchContents =
        async () => {
          try {
            setLoading(
              true
            );
  
            const response =
              await contentsApi.getAll();
  
            if (
              response.data
                .success
            ) {
              setPages(
                response.data
                  .data || []
              );
            } else {
              toast.error(
                response.data
                  .message ||
                  "Unable to fetch pages."
              );
            }
          } catch (error: any) {
            console.error(
              "Fetch contents error:",
              error
            );
  
            toast.error(
              error?.response
                ?.data?.message ||
                "Unable to fetch pages."
            );
          } finally {
            setLoading(
              false
            );
          }
        };
  
      useEffect(() => {
        fetchContents();
      }, []);
  
      // =================================================
      // GROUP UNIQUE PAGES
      // =================================================
  
      const groupedPages =
        useMemo(() => {
          const map =
            new Map<
              string,
              PageGroup
            >();
  
          pages.forEach(
            (page) => {
              const key =
                page.slug ||
                page.title
                  .trim()
                  .toLowerCase();
  
              if (
                !map.has(key)
              ) {
                map.set(
                  key,
                  {
                    slug:
                      page.slug,
                    title:
                      page.title,
                    latest:
                      page,
                    versions: [
                      page,
                    ],
                  }
                );
              } else {
                const group =
                  map.get(
                    key
                  )!;
  
                group.versions.push(
                  page
                );
  
                const currentVersion =
                  versionNumber(
                    group.latest
                      .version
                  );
  
                const incomingVersion =
                  versionNumber(
                    page.version
                  );
  
                if (
                  incomingVersion >
                    currentVersion ||
                  (incomingVersion ===
                    currentVersion &&
                    new Date(
                      page.updated_at
                    ).getTime() >
                      new Date(
                        group
                          .latest
                          .updated_at
                      ).getTime())
                ) {
                  group.latest =
                    page;
                  group.title =
                    page.title;
                }
              }
            }
          );
  
          return Array.from(
            map.values()
          ).sort(
            (a, b) =>
              new Date(
                b.latest.updated_at
              ).getTime() -
              new Date(
                a.latest.updated_at
              ).getTime()
          );
        }, [pages]);
  
      // =================================================
      // SEARCH
      // =================================================
  
      const filteredGroups =
        useMemo(() => {
          const query =
            search
              .trim()
              .toLowerCase();
  
          return groupedPages.filter(
            (group) => {
              const page =
                group.latest;
  
              const matchesSearch =
                !query ||
                [
                  page.title,
                  page.slug,
                  page.status,
                  page.version,
                ]
                  .join(" ")
                  .toLowerCase()
                  .includes(
                    query
                  );
  
              const matchesStatus =
                statusFilter ===
                  "all" ||
                page.status
                  ?.toLowerCase() ===
                  statusFilter;
  
              return (
                matchesSearch &&
                matchesStatus
              );
            }
          );
        }, [
          groupedPages,
          search,
          statusFilter,
        ]);
  
      // =================================================
      // PAGINATION
      // =================================================
  
      const totalPages =
        Math.max(
          1,
          Math.ceil(
            filteredGroups.length /
              ITEMS_PER_PAGE
          )
        );
  
      const startIndex =
        (currentPage - 1) *
        ITEMS_PER_PAGE;
  
      const visibleGroups =
        filteredGroups.slice(
          startIndex,
          startIndex +
            ITEMS_PER_PAGE
        );
  
      const startEntry =
        filteredGroups.length ===
        0
          ? 0
          : startIndex + 1;
  
      const endEntry =
        Math.min(
          startIndex +
            ITEMS_PER_PAGE,
          filteredGroups.length
        );
  
      useEffect(() => {
        if (
          currentPage >
          totalPages
        ) {
          setCurrentPage(
            totalPages
          );
        }
      }, [
        currentPage,
        totalPages,
      ]);
  
      // =================================================
      // PAGINATION BUTTONS
      // =================================================
  
      const paginationPages =
        useMemo(() => {
          if (
            totalPages <= 5
          ) {
            return Array.from(
              {
                length:
                  totalPages,
              },
              (_, index) =>
                index + 1
            );
          }
  
          if (
            currentPage <=
            3
          ) {
            return [
              1,
              2,
              3,
              4,
              5,
            ];
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
      // VIEW
      // =================================================
  
      const handleView = (
        group: PageGroup
      ) => {
        setSelectedGroup(
          group
        );
  
        setViewOpen(
          true
        );
      };
  
      // =================================================
      // ADD
      // =================================================
  
      const openAdd = () => {
        setSelectedPage(
          null
        );
  
        setModalMode(
          "add"
        );
  
        setAddEditOpen(
          true
        );
      };
  
      // =================================================
      // EDIT
      // =================================================
  
      const openEdit = (
        page: ContentPage
      ) => {
        setSelectedPage(
          page
        );
  
        setModalMode(
          "edit"
        );
  
        setAddEditOpen(
          true
        );
      };
  
      // =================================================
      // SAVE
      // =================================================
  
      const handleSave =
        async (
          payload: ContentPayload
        ) => {
          try {
            setSaveLoading(
              true
            );
  
            if (
              modalMode ===
                "edit" &&
              selectedPage
            ) {
              const response =
                await contentsApi.update(
                  selectedPage.id,
                  payload
                );
  
              if (
                response.data
                  .success
              ) {
                toast.success(
                  response.data
                    .message ||
                    "Page updated successfully."
                );
  
                setAddEditOpen(
                  false
                );
  
                setSelectedPage(
                  null
                );
  
                await fetchContents();
              } else {
                toast.error(
                  response.data
                    .message ||
                    "Unable to update page."
                );
              }
            } else {
              const response =
                await contentsApi.create(
                  payload
                );
  
              if (
                response.data
                  .success
              ) {
                toast.success(
                  response.data
                    .message ||
                    "Page created successfully."
                );
  
                setAddEditOpen(
                  false
                );
  
                await fetchContents();
              } else {
                toast.error(
                  response.data
                    .message ||
                    "Unable to create page."
                );
              }
            }
          } catch (error: any) {
            console.error(
              "Save page error:",
              error
            );
  
            toast.error(
              error?.response
                ?.data?.message ||
                "Unable to save page."
            );
          } finally {
            setSaveLoading(
              false
            );
          }
        };
  
      // =================================================
      // DELETE
      // =================================================
  
      const openDelete = (
        page: ContentPage
      ) => {
        setSelectedPage(
          page
        );
  
        setDeleteOpen(
          true
        );
      };
  
      const handleDelete =
        async () => {
          if (
            !selectedPage
          ) {
            return;
          }
  
          try {
            setDeleteLoading(
              true
            );
  
            const response =
              await contentsApi.delete(
                selectedPage.id
              );
  
            if (
              response.data
                .success
            ) {
              toast.success(
                response.data
                  .message ||
                  "Page version deleted successfully."
              );
  
              setDeleteOpen(
                false
              );
  
              setSelectedPage(
                null
              );
  
              await fetchContents();
            } else {
              toast.error(
                response.data
                  .message ||
                  "Unable to delete page."
              );
            }
          } catch (error: any) {
            console.error(
              "Delete page error:",
              error
            );
  
            toast.error(
              error?.response
                ?.data?.message ||
                "Unable to delete page."
            );
          } finally {
            setDeleteLoading(
              false
            );
          }
        };
  
      // =================================================
      // LOADING
      // =================================================
  
      if (
        loading &&
        pages.length ===
          0
      ) {
        return (
          <div className="min-h-screen bg-[#f7f5ef] p-4 sm:p-5 lg:p-6">
            <div className="flex min-h-[450px] items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#b8902e] shadow-sm">
                  <FiRefreshCw
                    size={23}
                    className="animate-spin"
                  />
                </div>
  
                <p className="mt-4 text-sm font-bold text-[#29251f]">
                  Loading pages...
                </p>
              </div>
            </div>
          </div>
        );
      }
  
      // =================================================
      // UI
      // =================================================
  
      return (
        <>
          <motion.div
            variants={
              containerVariants
            }
            initial="hidden"
            animate="visible"
            className="min-h-screen bg-[#f7f5ef] p-4 sm:p-5 lg:p-6"
          >
            {/* HEADER */}
  
            <motion.div
              variants={
                itemVariants
              }
              className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
            >
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#b8902e]" />
  
                  <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#9a741b]">
                    Website Content
                  </span>
                </div>
  
                <h1 className="font-serif text-[28px] font-bold tracking-tight text-[#29251f] sm:text-[32px]">
                  Pages
                </h1>
  
                <p className="mt-1.5 max-w-2xl text-xs leading-5 text-[#8d8372]">
                  Manage website pages, content blocks, images and published
                  versions from one place.
                </p>
              </div>
  
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={
                    fetchContents
                  }
                  disabled={
                    loading
                  }
                  className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#b8902e]/20 bg-white px-4 text-xs font-bold text-[#8f6d1d] shadow-sm transition hover:bg-[#faf8f3] disabled:cursor-not-allowed disabled:opacity-50"
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
  
                <button
                  type="button"
                  onClick={
                    openAdd
                  }
                  className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-5 text-xs font-bold text-white shadow-md shadow-[#b8902e]/15 transition hover:from-[#a98227] hover:to-[#7e6017]"
                >
                  <FiPlus
                    size={15}
                  />
  
                  Add Page
                </button>
              </div>
            </motion.div>
  
            {/* MAIN CARD */}
  
            <motion.div
              variants={
                itemVariants
              }
              className="relative overflow-hidden rounded-[22px] border border-[#b8902e]/12 bg-white shadow-[0_8px_30px_rgba(70,55,20,0.045)]"
            >
              <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />
  
              {/* TOOLBAR */}
  
              <div className="border-b border-[#b8902e]/10 p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* SEARCH */}
  
                  <div className="relative w-full lg:max-w-[440px]">
                    <FiSearch
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a8841c]"
                    />
  
                    <input
                      type="text"
                      value={
                        search
                      }
                      onChange={(
                        event
                      ) => {
                        setSearch(
                          event
                            .target
                            .value
                        );
  
                        setCurrentPage(
                          1
                        );
                      }}
                      placeholder="Search title, slug or version..."
                      className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] pl-10 pr-4 text-xs text-[#29251f] outline-none transition placeholder:text-[#aaa08e] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/10"
                    />
                  </div>
  
                  {/* FILTER */}
  
                  <div className="flex flex-wrap gap-2">
                    {[
                      {
                        key: "all" as const,
                        label: "All",
                      },
                      {
                        key: "published" as const,
                        label: "Published",
                      },
                      {
                        key: "draft" as const,
                        label: "Draft",
                      },
                      {
                        key: "archived" as const,
                        label: "Archived",
                      },
                    ].map(
                      (
                        item
                      ) => (
                        <button
                          type="button"
                          key={
                            item.key
                          }
                          onClick={() => {
                            setStatusFilter(
                              item.key
                            );
  
                            setCurrentPage(
                              1
                            );
                          }}
                          className={`rounded-xl px-4 py-2.5 text-[10px] font-bold transition ${
                            statusFilter ===
                            item.key
                              ? "bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] text-white shadow-md shadow-[#b8902e]/20"
                              : "border border-[#b8902e]/15 bg-[#faf8f3] text-[#786f60] hover:border-[#b8902e]/30 hover:bg-[#b8902e]/10 hover:text-[#8f6d1d]"
                          }`}
                        >
                          {
                            item.label
                          }
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

  
              {/* DESKTOP */}
  
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1050px] border-collapse">
                  <thead>
                    <tr className="bg-[#2f2a22]">
                      <th className="w-[75px] px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                        S.No.
                      </th>
  
                      <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                        Page
                      </th>
  
                      <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                        Slug
                      </th>
  
                      <th className="w-[120px] px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                        Latest Version
                      </th>
  
                      <th className="w-[130px] px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                        Status
                      </th>
  
                      <th className="w-[130px] px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                        Versions
                      </th>
  
                      <th className="w-[150px] px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3dfab]">
                        Actions
                      </th>
                    </tr>
                  </thead>
  
                  <tbody>
                    {visibleGroups.length ===
                    0 ? (
                      <tr>
                        <td
                          colSpan={
                            7
                          }
                          className="px-5 py-16 text-center"
                        >
                          <div className="flex flex-col items-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#b8902e]">
                              <FiFileText
                                size={
                                  24
                                }
                              />
                            </div>
  
                            <p className="mt-4 text-sm font-bold text-[#29251f]">
                              No pages found
                            </p>
  
                            <p className="mt-1 text-xs text-[#a19583]">
                              Try another search or create a new page.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      visibleGroups.map(
                        (
                          group,
                          index
                        ) => {
                          const page =
                            group.latest;
  
                          return (
                            <motion.tr
                              key={
                                group.slug
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
                              className="border-b border-[#b8902e]/10 bg-white transition hover:bg-[#fcfaf5]"
                            >
                              {/* S.NO */}
  
                              <td className="px-5 py-4">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-xs font-bold text-[#8f6d1d]">
                                  {startIndex +
                                    index +
                                    1}
                                </span>
                              </td>
  
                              {/* PAGE */}
  
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-[11px] font-bold text-white shadow-sm">
                                    {initials(
                                      page.title
                                    )}
                                  </div>
  
                                  <div className="min-w-0">
                                    <p className="max-w-[240px] truncate text-sm font-bold text-[#29251f]">
                                      {
                                        page.title
                                      }
                                    </p>
  
                                    <p className="mt-1 flex items-center gap-1 text-[10px] text-[#a19583]">
                                      <FiClock
                                        size={
                                          10
                                        }
                                      />
  
                                      Updated{" "}
                                      {formatDate(
                                        page.updated_at
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </td>
  
                              {/* SLUG */}
  
                              <td className="px-5 py-4">
                                <span className="rounded-lg bg-[#faf8f3] px-3 py-2 font-mono text-[10px] font-semibold text-[#6f675a]">
                                  /
                                  {
                                    page.slug
                                  }
                                </span>
                              </td>
  
                              {/* VERSION */}
  
                              <td className="px-5 py-4 text-center">
                                <span className="inline-flex items-center rounded-lg border border-[#b8902e]/15 bg-[#fffaf0] px-3 py-1.5 text-[10px] font-bold text-[#8f6d1d]">
                                  v
                                  {
                                    page.version
                                  }
                                </span>
                              </td>
  
                              {/* STATUS */}
  
                              <td className="px-5 py-4 text-center">
                                <StatusBadge
                                  status={
                                    page.status
                                  }
                                />
                              </td>
  
                              {/* VERSIONS */}
  
                              <td className="px-5 py-4 text-center">
                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#faf8f3] px-3 py-1.5 text-[10px] font-bold text-[#786f60]">
                                  <FiList
                                    size={
                                      12
                                    }
                                  />
  
                                  {
                                    group
                                      .versions
                                      .length
                                  }
                                </span>
                              </td>
  
                              {/* ACTIONS */}
  
                              <td className="px-5 py-4">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    title="View page"
                                    onClick={() =>
                                      handleView(
                                        group
                                      )
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] text-[#8f6d1d] transition hover:bg-[#b8902e] hover:text-white"
                                  >
                                    <FiEye
                                      size={
                                        15
                                      }
                                    />
                                  </button>
  
                                  <button
                                    type="button"
                                    title="Edit page"
                                    onClick={() =>
                                      openEdit(
                                        page
                                      )
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-white text-[#8f6d1d] transition hover:bg-[#b8902e] hover:text-white"
                                  >
                                    <FiEdit2
                                      size={
                                        15
                                      }
                                    />
                                  </button>
  
                                  <button
                                    type="button"
                                    title="Delete latest version"
                                    onClick={() =>
                                      openDelete(
                                        page
                                      )
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#c98d83]/20 bg-[#fff8f6] text-[#b46055] transition hover:border-[#b46055] hover:bg-[#b46055] hover:text-white"
                                  >
                                    <FiTrash2
                                      size={
                                        15
                                      }
                                    />
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          );
                        }
                      )
                    )}
                  </tbody>
                </table>
              </div>
  
              {/* MOBILE */}
  
              <div className="block lg:hidden">
                {visibleGroups.length >
                0 ? (
                  visibleGroups.map(
                    (
                      group,
                      index
                    ) => {
                      const page =
                        group.latest;
  
                      return (
                        <motion.div
                          key={
                            group.slug
                          }
                          variants={
                            itemVariants
                          }
                          className="border-b border-[#b8902e]/10 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-[11px] font-bold text-white">
                              {initials(
                                page.title
                              )}
                            </div>
  
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-[#29251f]">
                                    {
                                      page.title
                                    }
                                  </p>
  
                                  <p className="mt-1 truncate font-mono text-[10px] text-[#a19583]">
                                    /
                                    {
                                      page.slug
                                    }
                                  </p>
                                </div>
  
                                <StatusBadge
                                  status={
                                    page.status
                                  }
                                />
                              </div>
                            </div>
                          </div>
  
                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3">
                              <p className="text-[9px] font-bold uppercase tracking-wide text-[#a19583]">
                                Latest Version
                              </p>
  
                              <p className="mt-1 text-sm font-bold text-[#8f6d1d]">
                                v
                                {
                                  page.version
                                }
                              </p>
                            </div>
  
                            <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3">
                              <p className="text-[9px] font-bold uppercase tracking-wide text-[#a19583]">
                                Versions
                              </p>
  
                              <p className="mt-1 text-sm font-bold text-[#29251f]">
                                {
                                  group
                                    .versions
                                    .length
                                }
                              </p>
                            </div>
                          </div>
  
                          <div className="mt-3 flex items-center justify-between">
                            <p className="text-[10px] text-[#a19583]">
                              Updated{" "}
                              {formatDate(
                                page.updated_at
                              )}
                            </p>
  
                            <span className="text-[9px] font-bold text-[#a19583]">
                              #
                              {startIndex +
                                index +
                                1}
                            </span>
                          </div>
  
                          <div className="mt-3 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleView(
                                  group
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] text-[#8f6d1d]"
                              title="View"
                            >
                              <FiEye
                                size={
                                  14
                                }
                              />
                            </button>
  
                            <button
                              type="button"
                              onClick={() =>
                                openEdit(
                                  page
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-white text-[#8f6d1d]"
                              title="Edit"
                            >
                              <FiEdit2
                                size={
                                  14
                                }
                              />
                            </button>
  
                            <button
                              type="button"
                              onClick={() =>
                                openDelete(
                                  page
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#c98d83]/20 bg-[#fff8f6] text-[#b46055]"
                              title="Delete"
                            >
                              <FiTrash2
                                size={
                                  14
                                }
                              />
                            </button>
                          </div>
                        </motion.div>
                      );
                    }
                  )
                ) : (
                  <div className="flex flex-col items-center px-5 py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#b8902e]">
                      <FiFileText
                        size={
                          24
                        }
                      />
                    </div>
  
                    <p className="mt-4 text-sm font-bold text-[#29251f]">
                      No pages found
                    </p>
  
                    <p className="mt-1 text-xs text-[#a19583]">
                      Try another search or filter.
                    </p>
                  </div>
                )}
              </div>
  
              {/* PAGINATION */}
  
              {filteredGroups.length >
                0 && (
                <div className="border-t border-[#b8902e]/10 bg-[#fffdfa] px-4 py-4 sm:px-5">
                  <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                    <p className="text-xs text-[#8b8171]">
                      Showing{" "}
                      <span className="font-bold text-[#4a4436]">
                        {
                          startEntry
                        }
                      </span>{" "}
                      to{" "}
                      <span className="font-bold text-[#4a4436]">
                        {
                          endEntry
                        }
                      </span>{" "}
                      of{" "}
                      <span className="font-bold text-[#4a4436]">
                        {
                          filteredGroups.length
                        }
                      </span>{" "}
                      pages
                    </p>
  
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage(
                            (
                              page
                            ) =>
                              page -
                              1
                          )
                        }
                        disabled={
                          currentPage ===
                          1
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#b8902e]/15 bg-white text-[#8f6d1d] disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <FiChevronLeft
                          size={
                            17
                          }
                        />
                      </button>
  
                      {paginationPages.map(
                        (
                          page
                        ) => (
                          <button
                            key={
                              page
                            }
                            type="button"
                            onClick={() =>
                              setCurrentPage(
                                page
                              )
                            }
                            className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold transition ${
                              currentPage ===
                              page
                                ? "bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-white shadow-md shadow-[#b8902e]/20"
                                : "text-[#786f60] hover:bg-[#faf8f3] hover:text-[#8f6d1d]"
                            }`}
                          >
                            {
                              page
                            }
                          </button>
                        )
                      )}
  
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage(
                            (
                              page
                            ) =>
                              page +
                              1
                          )
                        }
                        disabled={
                          currentPage ===
                          totalPages
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#b8902e]/15 bg-white text-[#8f6d1d] disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <FiChevronRight
                          size={
                            17
                          }
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
  
            <div className="h-5" />
          </motion.div>
  
          {/* VIEW */}
  
          <ViewPageModal
            open={
              viewOpen
            }
            page={
              selectedGroup
            }
            onClose={() => {
              setViewOpen(
                false
              );
  
              setSelectedGroup(
                null
              );
            }}
          />
  
          {/* ADD / EDIT */}
  
          <PageFormModal
            open={
              addEditOpen
            }
            loading={
              saveLoading
            }
            mode={
              modalMode
            }
            page={
              selectedPage
            }
            onClose={() => {
              if (
                !saveLoading
              ) {
                setAddEditOpen(
                  false
                );
  
                setSelectedPage(
                  null
                );
              }
            }}
            onSubmit={
              handleSave
            }
          />
  
          {/* DELETE */}
  
          <DeletePageModal
            open={
              deleteOpen
            }
            loading={
              deleteLoading
            }
            page={
              selectedPage
            }
            onClose={() => {
              if (
                !deleteLoading
              ) {
                setDeleteOpen(
                  false
                );
  
                setSelectedPage(
                  null
                );
              }
            }}
            onConfirm={
              handleDelete
            }
          />
        </>
      );
    };
  
  export default ContentsManagement;