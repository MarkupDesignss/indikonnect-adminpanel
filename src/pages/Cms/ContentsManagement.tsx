import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiEdit2,
  FiEye,
  FiFileText,
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
// ANIMATION
// =====================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
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

interface ExistingImage {
  id?: number;
  url: string;
  alt_text?: string | null;
  is_primary?: boolean;
}

interface FormBlock {
  heading: string;
  short_description: string;
  description: string;
  imageFiles: File[];
  existingImages: ExistingImage[];
}

// =====================================================
// HELPERS
// =====================================================

const formatDate = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const versionNumber = (version?: string) =>
  Number(version || "0");

const initials = (title: string) => {
  const value = title
    ?.trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) =>
      item.charAt(0).toUpperCase(),
    )
    .join("");

  return value || "PG";
};

// =====================================================
// NEW IMAGE PREVIEW
// =====================================================

interface NewImagePreviewProps {
  file: File;
  previewUrl: string;
  onRemove: () => void;
}

const NewImagePreview: React.FC<
  NewImagePreviewProps
> = ({
  file,
  previewUrl,
  onRemove,
}) => {
  useEffect(() => {
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="group relative aspect-video overflow-hidden rounded-xl border border-[#163F20]/20 bg-white">
      <img
        src={previewUrl}
        alt={file.name}
        className="h-full w-full object-cover"
      />

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-2 pt-6">
        <p className="truncate text-[8px] font-semibold text-white">
          {file.name}
        </p>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white shadow-lg transition hover:bg-[#C23B32]"
        title="Remove image"
      >
        <FiX size={13} />
      </button>

      <span className="absolute left-2 top-2 rounded-full bg-[#163F20] px-2 py-1 text-[7px] font-bold uppercase text-white">
        New
      </span>
    </div>
  );
};

// =====================================================
// BLOCK EDITOR
// =====================================================

interface BlockEditorProps {
  block: FormBlock;
  index: number;
  onChange: (
    index: number,
    key: keyof FormBlock,
    value: any,
  ) => void;
  onRemove: (index: number) => void;
  onRemoveNewImage: (
    blockIndex: number,
    imageIndex: number,
  ) => void;
  onRemoveExistingImage: (
    blockIndex: number,
    imageIndex: number,
  ) => void;
  canRemove: boolean;
}

const BlockEditor: React.FC<BlockEditorProps> = ({
  block,
  index,
  onChange,
  onRemove,
  onRemoveNewImage,
  onRemoveExistingImage,
  canRemove,
}) => {
  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  return (
    <div className="rounded-[18px] border border-[#163F20]/10 bg-[#FAFBFA] p-4 sm:p-5">
      {/* BLOCK HEADER */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
            <FiList size={16} />
          </div>

          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
              Content Block
            </p>

            <h4 className="mt-0.5 text-sm font-bold text-[#202721]">
              Block {index + 1}
            </h4>
          </div>
        </div>

        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#C23B32]/20 bg-[#FBEAEA] text-[#C23B32] transition hover:bg-[#C23B32] hover:text-white"
            title="Remove block"
          >
            <FiTrash2 size={14} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* HEADING */}
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#59645C]">
            Heading
          </label>

          <input
            type="text"
            value={block.heading}
            onChange={(event) =>
              onChange(
                index,
                "heading",
                event.target.value,
              )
            }
            placeholder="<h1>Your heading</h1>"
            className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-white px-4 text-sm text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/10"
          />
        </div>

        {/* SHORT DESCRIPTION */}
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#59645C]">
            Short Description
          </label>

          <textarea
            value={block.short_description}
            onChange={(event) =>
              onChange(
                index,
                "short_description",
                event.target.value,
              )
            }
            rows={3}
            placeholder="<p>Short description...</p>"
            className="w-full resize-none rounded-xl border border-[#D8E2D8] bg-white px-4 py-3 text-sm leading-6 text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/10"
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#59645C]">
              Description
            </label>

            <span className="text-[9px] text-[#9AA29C]">
              HTML supported
            </span>
          </div>

          <textarea
            value={block.description}
            onChange={(event) =>
              onChange(
                index,
                "description",
                event.target.value,
              )
            }
            rows={8}
            placeholder="<p>Write page content here...</p>"
            className="w-full resize-y rounded-xl border border-[#D8E2D8] bg-white px-4 py-3 font-mono text-xs leading-6 text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/10"
          />
        </div>

        {/* IMAGES */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#59645C]">
              Block {index + 1} Images
            </label>

            <span className="text-[9px] text-[#9AA29C]">
              {block.existingImages.length +
                block.imageFiles.length}{" "}
              image
              {block.existingImages.length +
                block.imageFiles.length !==
              1
                ? "s"
                : ""}
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/avif"
            multiple
            className="hidden"
            onChange={(event) => {
              const files = Array.from(
                event.target.files || [],
              );

              if (files.length === 0) return;

              onChange(
                index,
                "imageFiles",
                [
                  ...block.imageFiles,
                  ...files,
                ],
              );

              event.target.value = "";
            }}
          />

          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            className="flex min-h-[80px] w-full items-center justify-center gap-3 rounded-xl border border-dashed border-[#163F20]/30 bg-white px-4 text-xs font-semibold text-[#163F20] transition hover:border-[#163F20]/50 hover:bg-[#EAF3EA]"
          >
            <FiUpload size={18} />

            <div className="text-left">
              <p className="font-bold">
                Upload images
              </p>

              <p className="mt-0.5 text-[9px] font-normal text-[#9AA29C]">
                Images will belong to Block{" "}
                {index + 1}
              </p>
            </div>
          </button>

          {/* EXISTING IMAGES */}
          {block.existingImages.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                Existing Images
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {block.existingImages.map(
                  (image, imageIndex) => (
                    <div
                      key={
                        image.id ??
                        `${index}-existing-${imageIndex}`
                      }
                      className="group relative aspect-video overflow-hidden rounded-xl border border-[#163F20]/10 bg-white"
                    >
                      <img
                        src={image.url}
                        alt={
                          image.alt_text ||
                          `Block ${
                            index + 1
                          } image`
                        }
                        className="h-full w-full object-cover"
                      />

                      {image.is_primary && (
                        <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-1 text-[8px] font-bold text-white">
                          Primary
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          onRemoveExistingImage(
                            index,
                            imageIndex,
                          )
                        }
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white opacity-100 shadow-lg transition hover:bg-[#C23B32]"
                        title="Remove image"
                      >
                        <FiX size={13} />
                      </button>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {/* NEW IMAGES */}
          {block.imageFiles.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                New Images
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {block.imageFiles.map(
                  (file, fileIndex) => {
                    const previewUrl =
                      URL.createObjectURL(file);

                    return (
                      <NewImagePreview
                        key={`${file.name}-${file.lastModified}-${fileIndex}`}
                        file={file}
                        previewUrl={previewUrl}
                        onRemove={() =>
                          onRemoveNewImage(
                            index,
                            fileIndex,
                          )
                        }
                      />
                    );
                  },
                )}
              </div>
            </div>
          )}

          {/* IMAGE INDEX INFO */}
          {(block.imageFiles.length > 0 ||
            block.existingImages.length > 0) && (
            <div className="mt-3 rounded-xl border border-[#163F20]/10 bg-[#EAF3EA] px-3 py-2.5">
              <p className="text-[9px] leading-4 text-[#59645C]">
                <span className="font-bold text-[#163F20]">
                  Block {index + 1}
                </span>{" "}
                images will be submitted separately as:
              </p>

              <p className="mt-1 font-mono text-[8px] leading-4 text-[#9AA29C]">
                blocks[{index}][images][0],
                blocks[{index}][images][1]...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =====================================================
// VIEW PAGE MODAL
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
      page?.latest.id || null,
    );

  useEffect(() => {
    setActiveVersionId(
      page?.latest.id || null,
    );
  }, [page]);

  if (!open || !page) return null;

  const activePage =
    page.versions.find(
      (item) =>
        item.id === activeVersionId,
    ) || page.latest;

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick
    >
      <div className="w-full max-w-[1000px] overflow-hidden rounded-[22px] border border-[#E5EAE5] bg-white shadow-2xl">
        <div className="h-[3px] w-full bg-gradient-to-r from-[#4C8A57] via-[#163F20] to-[#0F3219]" />

        {/* HEADER */}
        <div className="flex items-start justify-between gap-4 border-b border-[#163F20]/10 px-5 py-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] text-sm font-bold text-white">
              {initials(page.title)}
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-[20px] font-bold text-[#202721]">
                {page.title}
              </h2>

              <p className="mt-1 truncate text-xs text-[#9AA29C]">
                /{page.slug} • Version{" "}
                {activePage.version}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5F7F5] text-[#163F20] transition hover:bg-[#EAF3EA]"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="max-h-[78vh] overflow-y-auto">
          <div className="grid grid-cols-1 xl:grid-cols-[240px_1fr]">
            {/* VERSION SIDEBAR */}
            <aside className="border-b border-[#163F20]/10 bg-[#FAFBFA] p-4 xl:border-b-0 xl:border-r">
              <div className="mb-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
                  Version History
                </p>

                <p className="mt-1 text-xs text-[#59645C]">
                  {page.versions.length} version
                  {page.versions.length !==
                  1
                    ? "s"
                    : ""}{" "}
                  available
                </p>
              </div>

              <div className="space-y-2">
                {[...page.versions]
                  .sort(
                    (a, b) =>
                      versionNumber(
                        b.version,
                      ) -
                      versionNumber(
                        a.version,
                      ),
                  )
                  .map((version) => {
                    const selected =
                      version.id ===
                      activeVersionId;

                    return (
                      <button
                        key={version.id}
                        type="button"
                        onClick={() =>
                          setActiveVersionId(
                            version.id,
                          )
                        }
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          selected
                            ? "border-[#163F20]/30 bg-white shadow-sm"
                            : "border-[#163F20]/10 bg-transparent hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#202721]">
                            v{version.version}
                          </span>
                        </div>

                        <p className="mt-2 flex items-center gap-1 text-[9px] text-[#9AA29C]">
                          <FiClock size={10} />
                          {formatDate(
                            version.created_at,
                          )}
                        </p>
                      </button>
                    );
                  })}
              </div>
            </aside>

            {/* CONTENT */}
            <div className="p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
                    Page Content
                  </p>

                  <p className="mt-1 text-xs text-[#59645C]">
                    Updated{" "}
                    {formatDate(
                      activePage.updated_at,
                    )}
                  </p>
                </div>

                <span className="rounded-lg bg-[#EAF3EA] px-3 py-2 text-[10px] font-bold text-[#163F20]">
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
                  <div className="rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] p-8 text-center">
                    <FiFileText
                      size={28}
                      className="mx-auto text-[#163F20]"
                    />

                    <p className="mt-3 text-sm font-bold text-[#202721]">
                      No content blocks
                    </p>
                  </div>
                ) : (
                  activePage.blocks.map(
                    (block, index) => (
                      <div
                        key={
                          block.id ??
                          index
                        }
                        className="rounded-[18px] border border-[#163F20]/10 bg-[#FAFBFA] p-4 sm:p-5"
                      >
                        <div className="mb-4">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                            Block{" "}
                            {index + 1}
                          </p>
                        </div>

                        {block.heading && (
                          <div className="mb-4">
                            <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                              Heading
                            </p>

                            <div
                              className="prose prose-sm max-w-none text-[#202721]"
                              dangerouslySetInnerHTML={{
                                __html:
                                  block.heading,
                              }}
                            />
                          </div>
                        )}

                        {block.short_description && (
                          <div className="mb-4">
                            <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                              Short Description
                            </p>

                            <div
                              className="prose prose-sm max-w-none text-[#3F4A41]"
                              dangerouslySetInnerHTML={{
                                __html:
                                  block.short_description,
                              }}
                            />
                          </div>
                        )}

                        {block.description && (
                          <div className="mb-4">
                            <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                              Description
                            </p>

                            <div
                              className="prose prose-sm max-w-none text-[#3F4A41]"
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
                            <p className="mb-2 text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                              Images
                            </p>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                              {block.images.map(
                                (
                                  image,
                                  imageIndex,
                                ) => (
                                  <div
                                    key={
                                      image.id ??
                                      imageIndex
                                    }
                                    className="group relative aspect-video overflow-hidden rounded-xl border border-[#163F20]/10 bg-white"
                                  >
                                    <img
                                      src={
                                        image.url
                                      }
                                      alt={
                                        image.alt_text ||
                                        `Block ${
                                          index +
                                          1
                                        } image`
                                      }
                                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                    />

                                    {image.is_primary && (
                                      <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-1 text-[8px] font-bold text-white">
                                        Primary
                                      </span>
                                    )}
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ),
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-[#163F20]/10 bg-[#FAFBFA] px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#163F20]/15 bg-white px-5 py-2.5 text-sm font-bold text-[#59645C] transition hover:bg-[#F5F7F5] hover:text-[#163F20]"
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
  onSubmit: (payload: ContentPayload) => void;
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
  const [blocks, setBlocks] =
    useState<FormBlock[]>([]);

  useEffect(() => {
    if (!open) return;

    if (page) {
      setTitle(page.title || "");

      const mappedBlocks =
        (page.blocks || []).map(
          (block): FormBlock => ({
            heading:
              block.heading || "",
            short_description:
              block.short_description || "",
            description:
              block.description || "",
            existingImages:
              (block.images || []).map(
                (image) => ({
                  id: image.id,
                  url: image.url,
                  alt_text:
                    image.alt_text,
                  is_primary:
                    image.is_primary,
                }),
              ),
            imageFiles: [],
          }),
        );

      setBlocks(
        mappedBlocks.length > 0
          ? mappedBlocks
          : [
              {
                heading: "",
                short_description:
                  "",
                description: "",
                imageFiles: [],
                existingImages: [],
              },
            ],
      );
    } else {
      setTitle("");

      setBlocks([
        {
          heading: "",
          short_description: "",
          description: "",
          imageFiles: [],
          existingImages: [],
        },
      ]);
    }
  }, [open, page]);

  const updateBlock = (
    index: number,
    key: keyof FormBlock,
    value: any,
  ) => {
    setBlocks((previous) =>
      previous.map(
        (block, blockIndex) =>
          blockIndex === index
            ? {
                ...block,
                [key]: value,
              }
            : block,
      ),
    );
  };

  const addBlock = () => {
    setBlocks((previous) => [
      ...previous,
      {
        heading: "",
        short_description: "",
        description: "",
        imageFiles: [],
        existingImages: [],
      },
    ]);
  };

  const removeBlock = (
    index: number,
  ) => {
    setBlocks((previous) =>
      previous.filter(
        (_, blockIndex) =>
          blockIndex !== index,
      ),
    );
  };

  const removeNewImage = (
    blockIndex: number,
    imageIndex: number,
  ) => {
    setBlocks((previous) =>
      previous.map(
        (block, currentIndex) => {
          if (
            currentIndex !==
            blockIndex
          ) {
            return block;
          }

          return {
            ...block,
            imageFiles:
              block.imageFiles.filter(
                (
                  _,
                  currentImageIndex,
                ) =>
                  currentImageIndex !==
                  imageIndex,
              ),
          };
        },
      ),
    );
  };

  const removeExistingImage =
    async (
      blockIndex: number,
      imageIndex: number,
    ) => {
      const block =
        blocks[blockIndex];

      const image =
        block?.existingImages?.[
          imageIndex
        ];

      if (!image) {
        toast.error(
          "Image not found.",
        );
        return;
      }

      if (!image.id) {
        setBlocks((previous) =>
          previous.map(
            (
              currentBlock,
              currentIndex,
            ) => {
              if (
                currentIndex !==
                blockIndex
              ) {
                return currentBlock;
              }

              return {
                ...currentBlock,
                existingImages:
                  currentBlock.existingImages.filter(
                    (
                      _,
                      currentImageIndex,
                    ) =>
                      currentImageIndex !==
                      imageIndex,
                  ),
              };
            },
          ),
        );

        return;
      }

      try {
        const response =
          await contentsApi.deleteMedia(
            image.id,
          );

        if (response.data?.success) {
          setBlocks((previous) =>
            previous.map(
              (
                currentBlock,
                currentIndex,
              ) => {
                if (
                  currentIndex !==
                  blockIndex
                ) {
                  return currentBlock;
                }

                return {
                  ...currentBlock,
                  existingImages:
                    currentBlock.existingImages.filter(
                      (
                        _,
                        currentImageIndex,
                      ) =>
                        currentImageIndex !==
                        imageIndex,
                    ),
                };
              },
            ),
          );

          toast.success(
            response.data?.message ||
              "Image deleted successfully.",
          );
        } else {
          toast.error(
            response.data?.message ||
              "Unable to delete image.",
          );
        }
      } catch (error: any) {
        console.error(
          "Delete image error:",
          error,
        );

        toast.error(
          error?.response?.data
            ?.message ||
            "Unable to delete image.",
        );
      }
    };

  const handleSubmit = (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    if (!title.trim()) {
      toast.error(
        "Page title is required.",
      );
      return;
    }

    if (blocks.length === 0) {
      toast.error(
        "At least one content block is required.",
      );
      return;
    }

    const payload: ContentPayload = {
      title: title.trim(),

      // Kept only for backend compatibility.
      // Status is no longer shown in the UI.
      status:
        mode === "edit" &&
        page?.status
          ? page.status
          : "published",

      blocks: blocks.map(
        (block) =>
          ({
            heading:
              block.heading,
            short_description:
              block.short_description,
            description:
              block.description,
            imageFiles:
              block.imageFiles,
            existingImages:
              block.existingImages,
          }) as ContentBlockPayload,
      ),
    };

    onSubmit(payload);
  };

  if (!open) return null;

  return (
    <GlobalModal
      isOpen={open}
      onClose={() => {
        if (!loading) {
          onClose();
        }
      }}
      closeOnOverlayClick={!loading}
    >
      <div className="w-full max-w-[980px] overflow-hidden rounded-[22px] border border-[#E5EAE5] bg-white shadow-2xl">
        <div className="h-[3px] w-full bg-gradient-to-r from-[#4C8A57] via-[#163F20] to-[#0F3219]" />

        {/* HEADER */}
        <div className="flex items-start justify-between gap-4 border-b border-[#163F20]/10 bg-white px-5 py-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
              {mode === "add" ? (
                <FiPlus size={17} />
              ) : (
                <FiEdit2 size={16} />
              )}
            </div>

            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#4C8A57]">
                Content Management
              </p>

              <h2 className="mt-0.5 truncate text-[20px] font-bold text-[#202721]">
                Page Editor
              </h2>

              {page && (
                <p className="mt-1 truncate text-[10px] text-[#9AA29C]">
                  {page.title} • v
                  {page.version}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5F7F5] text-[#163F20] transition hover:bg-[#EAF3EA] disabled:opacity-50"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className="max-h-[75vh] overflow-y-auto bg-[#FAFBFA] p-5 sm:p-6">
            {/* BASIC INFO */}
            <div className="rounded-[18px] border border-[#163F20]/12 bg-[#FAFBFA] p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                  <FiFileText size={16} />
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
                    Page Settings
                  </p>

                  <p className="mt-0.5 text-sm font-bold text-[#202721]">
                    Basic Information
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#59645C]">
                    Page Title
                  </label>

                  <input
                    type="text"
                    value={title}
                    onChange={(event) =>
                      setTitle(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Home"
                    className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-white px-4 text-sm text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/10"
                  />
                </div>
              </div>
            </div>

            {/* CONTENT BLOCKS */}
            <div className="mt-5">
              <div className="mb-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
                    Page Builder
                  </p>

                  <h3 className="mt-0.5 text-base font-bold text-[#202721]">
                    Content Blocks
                  </h3>

                  <p className="mt-1 text-[10px] text-[#9AA29C]">
                    Each block manages
                    its own text and
                    images.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {blocks.map(
                  (block, index) => (
                    <BlockEditor
                      key={`block-${index}`}
                      block={block}
                      index={index}
                      onChange={
                        updateBlock
                      }
                      onRemove={
                        removeBlock
                      }
                      onRemoveNewImage={
                        removeNewImage
                      }
                      onRemoveExistingImage={
                        removeExistingImage
                      }
                      canRemove={
                        blocks.length >
                        1
                      }
                    />
                  ),
                )}
              </div>

              {/* ADD BLOCK - BOTTOM */}
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={addBlock}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#163F20]/20 bg-[#EAF3EA] px-4 text-[10px] font-bold text-[#163F20] transition hover:bg-[#163F20] hover:text-white"
                >
                  <FiPlus size={14} />
                  Add Block
                </button>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex flex-col-reverse gap-2 border-t border-[#163F20]/10 bg-[#FAFBFA] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-[#163F20]/15 bg-white px-5 py-2.5 text-sm font-bold text-[#59645C] transition hover:bg-[#F5F7F5] hover:text-[#163F20] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4C8A57] via-[#163F20] to-[#0F3219] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(22,63,32,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(22,63,32,0.7)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <FiRefreshCw
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <FiSave size={15} />
              )}

              {loading
                ? "Saving..."
                : "Save Page"}
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
  if (!open || !page) return null;

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={!loading}
    >
      <div className="w-full max-w-[450px] overflow-hidden rounded-[22px] border border-[#E5EAE5] bg-white shadow-2xl">
        <div className="h-[3px] w-full bg-gradient-to-r from-[#4C8A57] to-[#C23B32]" />

        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FBEAEA] text-[#C23B32]">
              <FiTrash2 size={21} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#202721]">
                Delete Page
              </h2>

              <p className="mt-1 text-sm leading-6 text-[#59645C]">
                Are you sure you want
                to delete this page
                version?
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xs font-bold text-[#163F20]">
                {initials(page.title)}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#202721]">
                  {page.title}
                </p>

                <p className="mt-1 truncate text-[10px] text-[#9AA29C]">
                  /{page.slug} •
                  Version{" "}
                  {page.version}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-[#163F20]/15 bg-white px-5 py-2.5 text-sm font-bold text-[#59645C] transition hover:bg-[#F5F7F5] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#C23B32] to-[#A62F27] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(194,59,50,0.6)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <FiRefreshCw
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <FiTrash2 size={15} />
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

const ContentsManagement: React.FC = () => {
  const [pages, setPages] =
    useState<ContentPage[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [saveLoading, setSaveLoading] =
    useState(false);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [viewOpen, setViewOpen] =
    useState(false);

  const [addEditOpen, setAddEditOpen] =
    useState(false);

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [modalMode, setModalMode] =
    useState<"add" | "edit">("add");

  const [
    selectedGroup,
    setSelectedGroup,
  ] = useState<PageGroup | null>(
    null,
  );

  const [
    selectedPage,
    setSelectedPage,
  ] = useState<ContentPage | null>(
    null,
  );

  const ITEMS_PER_PAGE = 10;

  // ===================================================
  // FETCH
  // ===================================================

  const fetchContents = async () => {
    try {
      setLoading(true);

      const response =
        await contentsApi.getAll();

      if (response.data.success) {
        setPages(
          response.data.data || [],
        );
      } else {
        toast.error(
          response.data.message ||
            "Unable to fetch pages.",
        );
      }
    } catch (error: any) {
      console.error(
        "Fetch contents error:",
        error,
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to fetch pages.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, []);

  // ===================================================
  // GROUP PAGES
  // ===================================================

  const groupedPages = useMemo(() => {
    const map = new Map<
      string,
      PageGroup
    >();

    pages.forEach((page) => {
      const key =
        page.slug ||
        page.title
          .trim()
          .toLowerCase();

      if (!map.has(key)) {
        map.set(key, {
          slug: page.slug,
          title: page.title,
          latest: page,
          versions: [page],
        });
      } else {
        const group =
          map.get(key)!;

        group.versions.push(page);

        const currentVersion =
          versionNumber(
            group.latest.version,
          );

        const incomingVersion =
          versionNumber(
            page.version,
          );

        if (
          incomingVersion >
            currentVersion ||
          (incomingVersion ===
            currentVersion &&
            new Date(
              page.updated_at,
            ).getTime() >
              new Date(
                group.latest
                  .updated_at,
              ).getTime())
        ) {
          group.latest = page;
          group.title =
            page.title;
        }
      }
    });

    return Array.from(
      map.values(),
    ).sort(
      (a, b) =>
        new Date(
          b.latest.updated_at,
        ).getTime() -
        new Date(
          a.latest.updated_at,
        ).getTime(),
    );
  }, [pages]);

  // ===================================================
  // SEARCH
  // ===================================================

  const filteredGroups = useMemo(() => {
    const query = search
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
            page.version,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query);

        return matchesSearch;
      },
    );
  }, [
    groupedPages,
    search,
  ]);

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredGroups.length /
        ITEMS_PER_PAGE,
    ),
  );

  const startIndex =
    (currentPage - 1) *
    ITEMS_PER_PAGE;

  const visibleGroups =
    filteredGroups.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE,
    );

  const startEntry =
    filteredGroups.length ===
    0
      ? 0
      : startIndex + 1;

  const endEntry = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredGroups.length,
  );

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages,
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
            index + 1,
        );
      }

      if (currentPage <= 3) {
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

  // ===================================================
  // VIEW
  // ===================================================

  const handleView = (
    group: PageGroup,
  ) => {
    setSelectedGroup(group);
    setViewOpen(true);
  };

  // ===================================================
  // ADD / EDIT
  // ===================================================

  const openAdd = () => {
    setSelectedPage(null);
    setModalMode("add");
    setAddEditOpen(true);
  };

  const openEdit = (
    page: ContentPage,
  ) => {
    setSelectedPage(page);
    setModalMode("edit");
    setAddEditOpen(true);
  };

  // ===================================================
  // SAVE
  // ===================================================

  const handleSave = async (
    payload: ContentPayload,
  ) => {
    try {
      setSaveLoading(true);

      if (
        modalMode === "edit" &&
        selectedPage
      ) {
        const response =
          await contentsApi.update(
            selectedPage.id,
            payload,
          );

        if (response.data.success) {
          toast.success(
            response.data.message ||
              "Page updated successfully.",
          );

          setAddEditOpen(false);
          setSelectedPage(null);

          await fetchContents();
        } else {
          toast.error(
            response.data.message ||
              "Unable to update page.",
          );
        }
      } else {
        const response =
          await contentsApi.create(
            payload,
          );

        if (response.data.success) {
          toast.success(
            response.data.message ||
              "Page created successfully.",
          );

          setAddEditOpen(false);

          await fetchContents();
        } else {
          toast.error(
            response.data.message ||
              "Unable to create page.",
          );
        }
      }
    } catch (error: any) {
      console.error(
        "Save page error:",
        error,
      );

      toast.error(
        error?.response?.data
          ?.message ||
          "Unable to save page.",
      );
    } finally {
      setSaveLoading(false);
    }
  };

  // ===================================================
  // DELETE
  // ===================================================

  const openDelete = (
    page: ContentPage,
  ) => {
    setSelectedPage(page);
    setDeleteOpen(true);
  };

  const handleDelete =
    async () => {
      if (!selectedPage) return;

      try {
        setDeleteLoading(true);

        const response =
          await contentsApi.delete(
            selectedPage.id,
          );

        if (response.data.success) {
          toast.success(
            response.data.message ||
              "Page version deleted successfully.",
          );

          setDeleteOpen(false);
          setSelectedPage(null);

          await fetchContents();
        } else {
          toast.error(
            response.data.message ||
              "Unable to delete page.",
          );
        }
      } catch (error: any) {
        console.error(
          "Delete page error:",
          error,
        );

        toast.error(
          error?.response?.data
            ?.message ||
            "Unable to delete page.",
        );
      } finally {
        setDeleteLoading(false);
      }
    };

  // ===================================================
  // LOADING
  // ===================================================

  if (
    loading &&
    pages.length === 0
  ) {
    return (
      <div className="min-h-screen bg-[#F5F7F5] p-4 sm:p-5 lg:p-6">
        <div className="flex min-h-[450px] items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#163F20] shadow-sm">
              <FiRefreshCw
                size={23}
                className="animate-spin"
              />
            </div>

            <p className="mt-4 text-sm font-bold text-[#202721]">
              Loading pages...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <>
      <motion.div
        variants={
          containerVariants
        }
        initial="hidden"
        animate="visible"
        className="min-h-screen bg-[#F5F7F5] p-4 sm:p-5 lg:p-6"
      >
        {/* HEADER */}
        <motion.div
          variants={itemVariants}
          className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
        >
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#163F20]" />

              <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#4C8A57]">
                Website Content
              </span>
            </div>

            <h1 className="text-[28px] font-bold tracking-tight text-[#202721] sm:text-[32px]">
              Pages
            </h1>

            <p className="mt-1.5 max-w-2xl text-xs leading-5 text-[#59645C]">
              Manage website pages,
              content blocks, images
              and published versions
              from one place.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={
                fetchContents
              }
              disabled={loading}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#163F20]/20 bg-white px-4 text-xs font-bold text-[#163F20] shadow-sm transition hover:bg-[#EAF3EA] disabled:cursor-not-allowed disabled:opacity-50"
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
              onClick={openAdd}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] px-5 text-xs font-bold text-white shadow-[0_8px_18px_-8px_rgba(22,63,32,0.5)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(22,63,32,0.7)]"
            >
              <FiPlus size={15} />
              Add Page
            </button>
          </div>
        </motion.div>

        {/* MAIN TABLE CARD */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-[22px] border border-[#E5EAE5] bg-white shadow-[0_8px_30px_rgba(22,63,32,0.06)]"
        >
          <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#8FC199] via-[#163F20] to-[#0F3219]" />

          {/* TOOLBAR */}
          <div className="border-b border-[#163F20]/10 p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-[440px]">
                <FiSearch
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#163F20]"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => {
                    setSearch(
                      event.target
                        .value,
                    );

                    setCurrentPage(
                      1,
                    );
                  }}
                  placeholder="Search title, slug or version..."
                  className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] pl-10 pr-4 text-xs text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#163F20] focus:bg-white focus:ring-2 focus:ring-[#163F20]/10"
                />
              </div>
            </div>
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[950px] border-collapse">
              <thead>
                <tr className="bg-[#163F20]">
                  <th className="w-[75px] px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                    S.No.
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                    Page
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                    Slug
                  </th>

                  <th className="w-[140px] px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                    Latest Version
                  </th>

                  <th className="w-[130px] px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                    Versions
                  </th>

                  <th className="w-[150px] px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAF3EA]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {visibleGroups.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#163F20]">
                          <FiFileText size={24} />
                        </div>

                        <p className="mt-4 text-sm font-bold text-[#202721]">
                          No pages found
                        </p>

                        <p className="mt-1 text-xs text-[#9AA29C]">
                          Try another
                          search or
                          create a new
                          page.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleGroups.map(
                    (
                      group,
                      index,
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
                          className="border-b border-[#163F20]/10 bg-white transition hover:bg-[#FAFBFA]"
                        >
                          <td className="px-5 py-4">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF3EA] text-xs font-bold text-[#163F20]">
                              {startIndex +
                                index +
                                1}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] text-[11px] font-bold text-white shadow-sm">
                                {initials(
                                  page.title,
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="max-w-[240px] truncate text-sm font-bold text-[#202721]">
                                  {
                                    page.title
                                  }
                                </p>

                                <p className="mt-1 flex items-center gap-1 text-[10px] text-[#9AA29C]">
                                  <FiClock size={10} />
                                  Updated{" "}
                                  {formatDate(
                                    page.updated_at,
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-lg bg-[#F5F7F5] px-3 py-2 font-mono text-[10px] font-semibold text-[#59645C]">
                              /
                              {
                                page.slug
                              }
                            </span>
                          </td>

                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex items-center rounded-lg border border-[#163F20]/15 bg-[#EAF3EA] px-3 py-1.5 text-[10px] font-bold text-[#163F20]">
                              v
                              {
                                page.version
                              }
                            </span>
                          </td>

                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F5F7F5] px-3 py-1.5 text-[10px] font-bold text-[#59645C]">
                              <FiList size={12} />
                              {
                                group
                                  .versions
                                  .length
                              }
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                title="View page"
                                onClick={() =>
                                  handleView(
                                    group,
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#163F20]/15 bg-[#F5F7F5] text-[#163F20] transition hover:bg-[#163F20] hover:text-white"
                              >
                                <FiEye
                                  size={15}
                                />
                              </button>

                              <button
                                type="button"
                                title="Edit page"
                                onClick={() =>
                                  openEdit(
                                    page,
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#163F20]/15 bg-white text-[#163F20] transition hover:bg-[#163F20] hover:text-white"
                              >
                                <FiEdit2
                                  size={15}
                                />
                              </button>

                              <button
                                type="button"
                                title="Delete latest version"
                                onClick={() =>
                                  openDelete(
                                    page,
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#C23B32]/20 bg-[#FBEAEA] text-[#C23B32] transition hover:border-transparent hover:bg-[#C23B32] hover:text-white"
                              >
                                <FiTrash2
                                  size={15}
                                />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    },
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
                  index,
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
                      className="border-b border-[#163F20]/10 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] text-[11px] font-bold text-white">
                          {initials(
                            page.title,
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[#202721]">
                              {
                                page.title
                              }
                            </p>

                            <p className="mt-1 truncate font-mono text-[10px] text-[#9AA29C]">
                              /
                              {
                                page.slug
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] p-3">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                            Latest Version
                          </p>

                          <p className="mt-1 text-sm font-bold text-[#163F20]">
                            v
                            {
                              page.version
                            }
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] p-3">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-[#9AA29C]">
                            Versions
                          </p>

                          <p className="mt-1 text-sm font-bold text-[#202721]">
                            {
                              group
                                .versions
                                .length
                            }
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-[10px] text-[#9AA29C]">
                          Updated{" "}
                          {formatDate(
                            page.updated_at,
                          )}
                        </p>

                        <span className="text-[9px] font-bold text-[#9AA29C]">
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
                              group,
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#163F20]/15 bg-[#F5F7F5] text-[#163F20]"
                          title="View"
                        >
                          <FiEye
                            size={14}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openEdit(
                              page,
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#163F20]/15 bg-white text-[#163F20]"
                          title="Edit"
                        >
                          <FiEdit2
                            size={14}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openDelete(
                              page,
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#C23B32]/20 bg-[#FBEAEA] text-[#C23B32]"
                          title="Delete"
                        >
                          <FiTrash2
                            size={14}
                          />
                        </button>
                      </div>
                    </motion.div>
                  );
                },
              )
            ) : (
              <div className="flex flex-col items-center px-5 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#163F20]">
                  <FiFileText size={24} />
                </div>

                <p className="mt-4 text-sm font-bold text-[#202721]">
                  No pages found
                </p>

                <p className="mt-1 text-xs text-[#9AA29C]">
                  Try another
                  search.
                </p>
              </div>
            )}
          </div>

          {/* PAGINATION */}
          {filteredGroups.length >
            0 && (
            <div className="border-t border-[#163F20]/10 bg-[#FAFBFA] px-4 py-4 sm:px-5">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-xs text-[#89918B]">
                  Showing{" "}
                  <span className="font-bold text-[#3F4A41]">
                    {
                      startEntry
                    }
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-[#3F4A41]">
                    {endEntry}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-[#3F4A41]">
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
                        (page) =>
                          page -
                          1,
                      )
                    }
                    disabled={
                      currentPage ===
                      1
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#163F20]/15 bg-white text-[#163F20] transition hover:bg-[#EAF3EA] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronLeft
                      size={17}
                    />
                  </button>

                  {paginationPages.map(
                    (
                      page,
                    ) => (
                      <button
                        key={
                          page
                        }
                        type="button"
                        onClick={() =>
                          setCurrentPage(
                            page,
                          )
                        }
                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold transition ${
                          currentPage ===
                          page
                            ? "bg-gradient-to-br from-[#4C8A57] to-[#163F20] text-white shadow-[0_6px_14px_-6px_rgba(22,63,32,0.5)]"
                            : "text-[#59645C] hover:bg-[#F5F7F5] hover:text-[#163F20]"
                        }`}
                      >
                        {
                          page
                        }
                      </button>
                    ),
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          page +
                          1,
                      )
                    }
                    disabled={
                      currentPage ===
                      totalPages
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#163F20]/15 bg-white text-[#163F20] transition hover:bg-[#EAF3EA] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronRight
                      size={17}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        <div className="h-5" />
      </motion.div>

      {/* MODALS */}

      <ViewPageModal
        open={viewOpen}
        page={selectedGroup}
        onClose={() => {
          setViewOpen(false);
          setSelectedGroup(
            null,
          );
        }}
      />

      <PageFormModal
        open={addEditOpen}
        loading={saveLoading}
        mode={modalMode}
        page={selectedPage}
        onClose={() => {
          if (!saveLoading) {
            setAddEditOpen(false);
            setSelectedPage(
              null,
            );
          }
        }}
        onSubmit={handleSave}
      />

      <DeletePageModal
        open={deleteOpen}
        loading={deleteLoading}
        page={selectedPage}
        onClose={() => {
          if (!deleteLoading) {
            setDeleteOpen(false);
            setSelectedPage(
              null,
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