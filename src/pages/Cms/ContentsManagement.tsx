import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
  FiVideo,
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

// React 19 compatible editor
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

import GlobalModal from "@/components/common/GlobalModal";

import contentsApi, {
  ContentBlockPayload,
  ContentPage,
  ContentPayload,
} from "../../api/endpoints/contents";

import { usePermissions } from "../../pages/permissions/usePermissions";

const VIEW_PERMISSION_KEYS = [
  "contents.view",
  "content.view",
  "Contents.view",
  "Content.view",
  "contents.details",
  "Contents.details",
];

const CREATE_PERMISSION_KEYS = [
  "contents.create",
  "content.create",
  "Contents.create",
  "Content.create",
];

const UPDATE_PERMISSION_KEYS = [
  "contents.update",
  "content.update",
  "Contents.update",
  "Content.update",
  "contents.edit",
  "content.edit",
  "Contents.edit",
  "Content.edit",
];

const DELETE_PERMISSION_KEYS = [
  "contents.delete",
  "content.delete",
  "Contents.delete",
  "Content.delete",
];

// =====================================================
// ANIMATION
// =====================================================

const containerVariants = {
  hidden: { opacity: 0 },

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

interface ExistingImage {
  id?: number;
  url: string;
  alt_text?: string | null;
  is_primary?: boolean;
  media_type?: string | null;
  mime_type?: string | null;
  type?: string | null;
}

interface FormBlock {
  heading: string;
  short_description: string;
  description: string;
  imageFiles: File[];
  existingImages: ExistingImage[];
}

// =====================================================
// QUILL CONFIG
// =====================================================

const SK_EDITOR_MODULES = {
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

const SK_EDITOR_FORMATS = [
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
// HELPERS
// =====================================================

const formatDate = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

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

const isVideoFile = (file: File) =>
  file.type.toLowerCase().startsWith("video/");

const isVideoUrl = (url?: string | null) => {
  if (!url) return false;

  const cleanUrl = url
    .split("?")[0]
    .split("#")[0]
    .toLowerCase();

  return (
    cleanUrl.endsWith(".mp4") ||
    cleanUrl.endsWith(".webm") ||
    cleanUrl.endsWith(".ogg") ||
    cleanUrl.endsWith(".ogv") ||
    cleanUrl.endsWith(".mov") ||
    cleanUrl.endsWith(".m4v")
  );
};

const isExistingVideo = (image: ExistingImage) => {
  const mediaType = String(
    image.media_type ||
      image.mime_type ||
      image.type ||
      "",
  ).toLowerCase();

  return (
    mediaType.includes("video") ||
    isVideoUrl(image.url)
  );
};

const getMediaCountLabel = (count: number) =>
  `${count} ${count === 1 ? "media" : "media"}`;

// =====================================================
// PERMISSION STATES
// =====================================================

const PermissionLoadingState: React.FC = () => {
  return (
    <div className="font-poppins flex min-h-screen items-center justify-center bg-[#F5F8FF] p-6">
      <div className="w-full max-w-md rounded-2xl border border-[#D8E2F0] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
          <FiRefreshCw
            size={24}
            className="animate-spin"
          />
        </div>

        <h2 className="mt-5 text-base font-bold text-[#0F1B3D]">
          Checking permissions...
        </h2>

        <p className="mt-2 text-sm text-[#8C97B2]">
          Please wait while we verify your access.
        </p>
      </div>
    </div>
  );
};

const AccessDeniedState: React.FC = () => {
  return (
    <div className="font-poppins flex min-h-screen items-center justify-center bg-[#F5F8FF] p-6">
      <div className="w-full max-w-md rounded-2xl border border-[#D8E2F0] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBEAEA] text-[#C23B32]">
          <FiFileText size={24} />
        </div>

        <h2 className="mt-5 text-lg font-bold text-[#0F1B3D]">
          Access Denied
        </h2>

        <p className="mt-2 text-sm leading-6 text-[#4A5778]">
          You do not have permission to view website
          content.
        </p>
      </div>
    </div>
  );
};

// =====================================================
// MEDIA PREVIEW
// =====================================================

interface NewMediaPreviewProps {
  file: File;
  onRemove: () => void;
}

const NewMediaPreview: React.FC<
  NewMediaPreviewProps
> = ({ file, onRemove }) => {
  const previewUrl = useMemo(
    () => URL.createObjectURL(file),
    [file],
  );

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const video = isVideoFile(file);

  return (
    <div className="group relative aspect-video overflow-hidden rounded-xl border border-[#1E3A8A]/15 bg-white">
      {video ? (
        <video
          src={previewUrl}
          className="h-full w-full object-cover"
          muted
          playsInline
          controls
          preload="metadata"
        />
      ) : (
        <img
          src={previewUrl}
          alt={file.name}
          className="h-full w-full object-cover"
        />
      )}

      <div className="absolute left-2 top-2">
        <span className="flex items-center gap-1 rounded-full bg-[#1E3A8A] px-2 py-1 text-[7px] font-bold uppercase text-white">
          {video ? (
            <>
              <FiVideo size={9} />
              Video
            </>
          ) : (
            "New"
          )}
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-2 pt-7">
        <p className="truncate text-[8px] font-semibold text-white">
          {file.name}
        </p>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white shadow-lg transition hover:bg-[#C23B32]"
        title="Remove media"
      >
        <FiX size={13} />
      </button>
    </div>
  );
};

// =====================================================
// EXISTING MEDIA PREVIEW
// =====================================================

interface ExistingMediaPreviewProps {
  image: ExistingImage;
  index: number;
  blockIndex: number;
  canDelete: boolean;
  onRemove: () => void;
}

const ExistingMediaPreview: React.FC<
  ExistingMediaPreviewProps
> = ({
  image,
  index,
  blockIndex,
  canDelete,
  onRemove,
}) => {
  const video = isExistingVideo(image);

  return (
    <div className="group relative aspect-video overflow-hidden rounded-xl border border-[#1E3A8A]/10 bg-white">
      {video ? (
        <video
          src={image.url}
          className="h-full w-full object-cover"
          controls
          playsInline
          preload="metadata"
        />
      ) : (
        <img
          src={image.url}
          alt={
            image.alt_text ||
            `Block ${blockIndex + 1} media`
          }
          className="h-full w-full object-cover"
        />
      )}

      {image.is_primary && (
        <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-1 text-[8px] font-bold text-white">
          Primary
        </span>
      )}

      <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-[#172554]/90 px-2 py-1 text-[7px] font-bold uppercase text-white">
        {video ? <FiVideo size={8} /> : null}
        {video ? "Video" : "Existing"}
      </span>

      {canDelete && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white shadow-lg transition hover:bg-[#C23B32]"
          title="Remove media"
        >
          <FiX size={13} />
        </button>
      )}
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
  canDeleteMedia: boolean;
}

const BlockEditor: React.FC<BlockEditorProps> = ({
  block,
  index,
  onChange,
  onRemove,
  onRemoveNewImage,
  onRemoveExistingImage,
  canRemove,
  canDeleteMedia,
}) => {
  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const totalMedia =
    block.existingImages.length +
    block.imageFiles.length;

  return (
    <div className="rounded-[18px] border border-[#1E3A8A]/10 bg-[#FAFCFF] p-4 sm:p-5">
      {/* BLOCK HEADER */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
            <FiList size={16} />
          </div>

          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#8C97B2]">
              Content Block
            </p>

            <h4 className="mt-0.5 text-sm font-bold text-[#0F1B3D]">
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
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#4A5778]">
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
            className="h-11 w-full rounded-xl border border-[#D8E2F0] bg-white px-4 text-sm text-[#0F1B3D] outline-none transition placeholder:text-[#8C97B2] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
          />
        </div>

        {/* SHORT DESCRIPTION */}

        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#4A5778]">
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
            className="w-full resize-none rounded-xl border border-[#D8E2F0] bg-white px-4 py-3 text-sm leading-6 text-[#0F1B3D] outline-none transition placeholder:text-[#8C97B2] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
          />
        </div>

        {/* DESCRIPTION */}

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#4A5778]">
              Description
            </label>

            <span className="text-[9px] text-[#8C97B2]">
              HTML supported
            </span>
          </div>

          <div className="sk-editor-wrapper">
            <ReactQuill
              theme="snow"
              value={block.description}
              onChange={(value) =>
                onChange(
                  index,
                  "description",
                  value,
                )
              }
              modules={SK_EDITOR_MODULES}
              formats={SK_EDITOR_FORMATS}
              placeholder="Write page content here..."
            />
          </div>
        </div>

        {/* MEDIA */}

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#4A5778]">
              Block {index + 1} Media
            </label>

            <span className="text-[9px] text-[#8C97B2]">
              {getMediaCountLabel(totalMedia)}
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={[
              "image/png",
              "image/jpeg",
              "image/jpg",
              "image/webp",
              "image/avif",
              "video/mp4",
              "video/webm",
              "video/ogg",
              "video/quicktime",
              "video/x-m4v",
            ].join(",")}
            multiple
            className="hidden"
            onChange={(event) => {
              const files = Array.from(
                event.target.files || [],
              );

              if (files.length === 0) {
                return;
              }

              onChange(index, "imageFiles", [
                ...block.imageFiles,
                ...files,
              ]);

              event.target.value = "";
            }}
          />

          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            className="flex min-h-[100px] w-full items-center justify-center gap-3 rounded-xl border border-dashed border-[#2563EB]/30 bg-white px-4 text-xs font-semibold text-[#1E3A8A] transition hover:border-[#2563EB]/50 hover:bg-[#EAF1FF]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF1FF]">
              <FiUpload size={18} />
            </div>

            <div className="text-left">
              <p className="font-bold">
                Upload images or videos
              </p>

              <p className="mt-0.5 text-[9px] font-normal text-[#8C97B2]">
                PNG, JPG, WEBP, AVIF, MP4, WEBM,
                OGG, MOV
              </p>

              <p className="mt-0.5 text-[9px] font-normal text-[#8C97B2]">
                Files will belong to Block{" "}
                {index + 1}
              </p>
            </div>
          </button>

          {/* EXISTING MEDIA */}

          {block.existingImages.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-wide text-[#8C97B2]">
                Existing Media
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {block.existingImages.map(
                  (image, imageIndex) => (
                    <ExistingMediaPreview
                      key={
                        image.id ??
                        `${index}-existing-${imageIndex}`
                      }
                      image={image}
                      index={imageIndex}
                      blockIndex={index}
                      canDelete={canDeleteMedia}
                      onRemove={() =>
                        onRemoveExistingImage(
                          index,
                          imageIndex,
                        )
                      }
                    />
                  ),
                )}
              </div>

              {!canDeleteMedia && (
                <p className="mt-2 text-[9px] text-[#8C97B2]">
                  You do not have permission to remove
                  existing media.
                </p>
              )}
            </div>
          )}

          {/* NEW MEDIA */}

          {block.imageFiles.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-wide text-[#8C97B2]">
                New Media
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {block.imageFiles.map(
                  (file, fileIndex) => (
                    <NewMediaPreview
                      key={`${file.name}-${file.lastModified}-${fileIndex}`}
                      file={file}
                      onRemove={() =>
                        onRemoveNewImage(
                          index,
                          fileIndex,
                        )
                      }
                    />
                  ),
                )}
              </div>
            </div>
          )}

          {/* INFO */}

          {totalMedia > 0 && (
            <div className="mt-3 rounded-xl border border-[#1E3A8A]/10 bg-[#EAF1FF] px-3 py-2.5">
              <p className="text-[9px] leading-4 text-[#4A5778]">
                <span className="font-bold text-[#1E3A8A]">
                  Block {index + 1}
                </span>{" "}
                media will be submitted in the same block
                media field.
              </p>

              <p className="mt-1 font-mono text-[8px] leading-4 text-[#8C97B2]">
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
> = ({ open, page, onClose }) => {
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
      <div className="font-poppins w-full max-w-[1000px] overflow-hidden rounded-[22px] border border-[#D8E2F0] bg-white shadow-2xl">
        <div className="h-[3px] w-full bg-gradient-to-r from-[#60A5FA] via-[#1E3A8A] to-[#172554]" />

        {/* HEADER */}

        <div className="flex items-start justify-between gap-4 border-b border-[#1E3A8A]/10 px-5 py-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1E3A8A] text-sm font-bold text-white">
              {initials(page.title)}
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-[20px] font-bold text-[#0F1B3D]">
                {page.title}
              </h2>

              <p className="mt-1 truncate text-xs text-[#8C97B2]">
                /{page.slug} • Version{" "}
                {activePage.version}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5F8FF] text-[#1E3A8A] transition hover:bg-[#EAF1FF]"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="max-h-[78vh] overflow-y-auto">
          <div className="grid grid-cols-1 xl:grid-cols-[240px_1fr]">
            {/* VERSION SIDEBAR */}

            <aside className="border-b border-[#1E3A8A]/10 bg-[#FAFCFF] p-4 xl:border-b-0 xl:border-r">
              <div className="mb-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#8C97B2]">
                  Version History
                </p>

                <p className="mt-1 text-xs text-[#4A5778]">
                  {page.versions.length} version
                  {page.versions.length !== 1
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
                            ? "border-[#2563EB]/30 bg-white shadow-sm"
                            : "border-[#1E3A8A]/10 bg-transparent hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#0F1B3D]">
                            v{version.version}
                          </span>
                        </div>

                        <p className="mt-2 flex items-center gap-1 text-[9px] text-[#8C97B2]">
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
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#8C97B2]">
                    Page Content
                  </p>

                  <p className="mt-1 text-xs text-[#4A5778]">
                    Updated{" "}
                    {formatDate(
                      activePage.updated_at,
                    )}
                  </p>
                </div>

                <span className="rounded-lg bg-[#EAF1FF] px-3 py-2 text-[10px] font-bold text-[#1E3A8A]">
                  {activePage.blocks.length} block
                  {activePage.blocks.length !==
                  1
                    ? "s"
                    : ""}
                </span>
              </div>

              <div className="space-y-5">
                {activePage.blocks.length ===
                0 ? (
                  <div className="rounded-xl border border-[#1E3A8A]/10 bg-[#F5F8FF] p-8 text-center">
                    <FiFileText
                      size={28}
                      className="mx-auto text-[#1E3A8A]"
                    />

                    <p className="mt-3 text-sm font-bold text-[#0F1B3D]">
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
                        className="rounded-[18px] border border-[#1E3A8A]/10 bg-[#FAFCFF] p-4 sm:p-5"
                      >
                        <div className="mb-4">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-[#8C97B2]">
                            Block {index + 1}
                          </p>
                        </div>

                        {/* HEADING */}

                        {block.heading && (
                          <div className="mb-4">
                            <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-[#8C97B2]">
                              Heading
                            </p>

                            <div
                              className="prose prose-sm max-w-none text-[#0F1B3D]"
                              dangerouslySetInnerHTML={{
                                __html:
                                  block.heading,
                              }}
                            />
                          </div>
                        )}

                        {/* SHORT DESCRIPTION */}

                        {block.short_description && (
                          <div className="mb-4">
                            <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-[#8C97B2]">
                              Short Description
                            </p>

                            <div
                              className="prose prose-sm max-w-none text-[#4A5778]"
                              dangerouslySetInnerHTML={{
                                __html:
                                  block.short_description,
                              }}
                            />
                          </div>
                        )}

                        {/* DESCRIPTION */}

                        {block.description && (
                          <div className="mb-4">
                            <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-[#8C97B2]">
                              Description
                            </p>

                            <div
                              className="sk-answer-preview prose prose-sm max-w-none text-[#4A5778]"
                              dangerouslySetInnerHTML={{
                                __html:
                                  block.description,
                              }}
                            />
                          </div>
                        )}

                        {/* MEDIA */}

                        {block.images.length >
                          0 && (
                          <div>
                            <p className="mb-2 text-[9px] font-bold uppercase tracking-wide text-[#8C97B2]">
                              Media
                            </p>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                              {block.images.map(
                                (
                                  image,
                                  imageIndex,
                                ) => {
                                  const video =
                                    isExistingVideo(
                                      image,
                                    );

                                  return (
                                    <div
                                      key={
                                        image.id ??
                                        imageIndex
                                      }
                                      className="group relative aspect-video overflow-hidden rounded-xl border border-[#1E3A8A]/10 bg-white"
                                    >
                                      {video ? (
                                        <video
                                          src={
                                            image.url
                                          }
                                          className="h-full w-full object-cover"
                                          controls
                                          playsInline
                                          preload="metadata"
                                        />
                                      ) : (
                                        <img
                                          src={
                                            image.url
                                          }
                                          alt={
                                            image.alt_text ||
                                            `Block ${
                                              index +
                                              1
                                            } media`
                                          }
                                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                        />
                                      )}

                                      {image.is_primary && (
                                        <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-1 text-[8px] font-bold text-white">
                                          Primary
                                        </span>
                                      )}

                                      {video && (
                                        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-[#172554]/90 px-2 py-1 text-[8px] font-bold text-white">
                                          <FiVideo size={9} />
                                          Video
                                        </span>
                                      )}
                                    </div>
                                  );
                                },
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

        <div className="flex justify-end border-t border-[#1E3A8A]/10 bg-[#FAFCFF] px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#1E3A8A]/15 bg-white px-5 py-2.5 text-sm font-bold text-[#4A5778] transition hover:bg-[#F5F8FF] hover:text-[#1E3A8A]"
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
  canDeleteMedia: boolean;
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
  canDeleteMedia,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<
    FormBlock[]
  >([]);

  useEffect(() => {
    if (!open) return;

    if (page) {
      setTitle(page.title || "");

      const mappedBlocks =
        (page.blocks || []).map(
          (block): FormBlock => ({
            heading: block.heading || "",

            short_description:
              block.short_description || "",

            description:
              block.description || "",

            existingImages: (
              block.images || []
            ).map((image) => ({
              id: image.id,
              url: image.url,
              alt_text: image.alt_text,
              is_primary: image.is_primary,
              media_type:
                (image as any).media_type ||
                null,
              mime_type:
                (image as any).mime_type ||
                null,
              type:
                (image as any).type || null,
            })),

            imageFiles: [],
          }),
        );

      setBlocks(
        mappedBlocks.length > 0
          ? mappedBlocks
          : [
              {
                heading: "",
                short_description: "",
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
          if (currentIndex !== blockIndex) {
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
      if (!canDeleteMedia) {
        toast.error(
          "You do not have permission to remove media.",
        );
        return;
      }

      const block =
        blocks[blockIndex];

      const image =
        block?.existingImages?.[
          imageIndex
        ];

      if (!image) {
        toast.error(
          "Media not found.",
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
              "Media deleted successfully.",
          );
        } else {
          toast.error(
            response.data?.message ||
              "Unable to delete media.",
          );
        }
      } catch (error: any) {
        console.error(
          "Delete media error:",
          error,
        );

        toast.error(
          error?.response?.data
            ?.message ||
            "Unable to delete media.",
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

      status:
        mode === "edit" &&
        page?.status
          ? page.status
          : "published",

      blocks: blocks.map(
        (block) =>
          ({
            heading: block.heading,

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
      <div className="font-poppins w-full max-w-[980px] overflow-hidden rounded-[22px] border border-[#D8E2F0] bg-white shadow-2xl">
        <div className="h-[3px] w-full bg-gradient-to-r from-[#60A5FA] via-[#1E3A8A] to-[#172554]" />

        {/* HEADER */}

        <div className="flex items-start justify-between gap-4 border-b border-[#1E3A8A]/10 bg-white px-5 py-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
              {mode === "add" ? (
                <FiPlus size={17} />
              ) : (
                <FiEdit2 size={16} />
              )}
            </div>

            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#2563EB]">
                Content Management
              </p>

              <h2 className="mt-0.5 truncate text-[20px] font-bold text-[#0F1B3D]">
                Page Editor
              </h2>

              {page && (
                <p className="mt-1 truncate text-[10px] text-[#8C97B2]">
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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5F8FF] text-[#1E3A8A] transition hover:bg-[#EAF1FF] disabled:opacity-50"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* FORM */}

        <form onSubmit={handleSubmit}>
          <div className="max-h-[75vh] overflow-y-auto bg-[#FAFCFF] p-5 sm:p-6">
            {/* BASIC INFO */}

            <div className="rounded-[18px] border border-[#1E3A8A]/10 bg-[#FAFCFF] p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
                  <FiFileText size={16} />
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#8C97B2]">
                    Page Settings
                  </p>

                  <p className="mt-0.5 text-sm font-bold text-[#0F1B3D]">
                    Basic Information
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#4A5778]">
                    Page Title
                  </label>

                  <input
                    type="text"
                    value={title}
                    onChange={(event) =>
                      setTitle(
                        event.target.value,
                      )
                    }
                    placeholder="Home"
                    className="h-11 w-full rounded-xl border border-[#D8E2F0] bg-white px-4 text-sm text-[#0F1B3D] outline-none transition placeholder:text-[#8C97B2] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                  />
                </div>
              </div>
            </div>

            {/* CONTENT BLOCKS */}

            <div className="mt-5">
              <div className="mb-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#8C97B2]">
                  Page Builder
                </p>

                <h3 className="mt-0.5 text-base font-bold text-[#0F1B3D]">
                  Content Blocks
                </h3>

                <p className="mt-1 text-[10px] text-[#8C97B2]">
                  Each block manages its own text,
                  images and videos.
                </p>
              </div>

              <div className="space-y-4">
                {blocks.map(
                  (block, index) => (
                    <BlockEditor
                      key={`block-${index}`}
                      block={block}
                      index={index}
                      onChange={updateBlock}
                      onRemove={removeBlock}
                      onRemoveNewImage={
                        removeNewImage
                      }
                      onRemoveExistingImage={
                        removeExistingImage
                      }
                      canRemove={
                        blocks.length > 1
                      }
                      canDeleteMedia={
                        canDeleteMedia
                      }
                    />
                  ),
                )}
              </div>

              {/* ADD BLOCK */}

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={addBlock}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#1E3A8A]/20 bg-[#EAF1FF] px-4 text-[10px] font-bold text-[#1E3A8A] transition hover:bg-[#1E3A8A] hover:text-white"
                >
                  <FiPlus size={14} />
                  Add Block
                </button>
              </div>
            </div>
          </div>

          {/* FOOTER */}

          <div className="flex flex-col-reverse gap-2 border-t border-[#1E3A8A]/10 bg-[#FAFCFF] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-[#1E3A8A]/15 bg-white px-5 py-2.5 text-sm font-bold text-[#4A5778] transition hover:bg-[#F5F8FF] hover:text-[#1E3A8A] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#2563EB] via-[#1E3A8A] to-[#172554] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(37,99,235,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(37,99,235,0.7)] disabled:cursor-not-allowed disabled:opacity-50"
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
  if (!open || !page) {
    return null;
  }

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={!loading}
    >
      <div className="font-poppins w-full max-w-[450px] overflow-hidden rounded-[22px] border border-[#D8E2F0] bg-white shadow-2xl">
        <div className="h-[3px] w-full bg-gradient-to-r from-[#2563EB] to-[#C23B32]" />

        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FBEAEA] text-[#C23B32]">
              <FiTrash2 size={21} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#0F1B3D]">
                Delete Page
              </h2>

              <p className="mt-1 text-sm leading-6 text-[#4A5778]">
                Are you sure you want to delete this
                page version?
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-[#1E3A8A]/10 bg-[#F5F8FF] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xs font-bold text-[#1E3A8A]">
                {initials(page.title)}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#0F1B3D]">
                  {page.title}
                </p>

                <p className="mt-1 truncate text-[10px] text-[#8C97B2]">
                  /{page.slug} • Version{" "}
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
              className="rounded-xl border border-[#1E3A8A]/15 bg-white px-5 py-2.5 text-sm font-bold text-[#4A5778] transition hover:bg-[#F5F8FF] disabled:opacity-50"
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
    (keys: string[]) =>
      keys.some((key) =>
        hasPermission(key),
      ),
    [hasPermission],
  );

  const canViewContents = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("Contents") ||
      hasModuleAccess("Content") ||
      hasModuleAccess("Website Content") ||
      hasAnyPermission(
        VIEW_PERMISSION_KEYS,
      ),
    [
      isSuperAdmin,
      hasModuleAccess,
      hasAnyPermission,
    ],
  );

  const canCreateContents = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("Contents") ||
      hasModuleAccess("Content") ||
      hasModuleAccess("Website Content") ||
      hasAnyPermission(
        CREATE_PERMISSION_KEYS,
      ),
    [
      isSuperAdmin,
      hasModuleAccess,
      hasAnyPermission,
    ],
  );

  const canUpdateContents = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("Contents") ||
      hasModuleAccess("Content") ||
      hasModuleAccess("Website Content") ||
      hasAnyPermission(
        UPDATE_PERMISSION_KEYS,
      ),
    [
      isSuperAdmin,
      hasModuleAccess,
      hasAnyPermission,
    ],
  );

  const canDeleteContents = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("Contents") ||
      hasModuleAccess("Content") ||
      hasModuleAccess("Website Content") ||
      hasAnyPermission(
        DELETE_PERMISSION_KEYS,
      ),
    [
      isSuperAdmin,
      hasModuleAccess,
      hasAnyPermission,
    ],
  );

  // ===================================================
  // STATE
  // ===================================================

  const [pages, setPages] = useState<
    ContentPage[]
  >([]);

  const [loading, setLoading] =
    useState(false);

  const [saveLoading, setSaveLoading] =
    useState(false);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  const [search, setSearch] = useState("");

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
  ] = useState<PageGroup | null>(null);

  const [
    selectedPage,
    setSelectedPage,
  ] = useState<ContentPage | null>(null);

  const ITEMS_PER_PAGE = 10;

  // ===================================================
  // FETCH PROTECTION
  // ===================================================

  const fetchInFlightRef =
    useRef<Promise<void> | null>(null);

  const hasInitialFetchRef =
    useRef(false);

  // ===================================================
  // FETCH
  // ===================================================

  const fetchContents = useCallback(
    async (force = false) => {
      if (!canViewContents) return;

      if (fetchInFlightRef.current) {
        return fetchInFlightRef.current;
      }

      if (
        !force &&
        hasInitialFetchRef.current
      ) {
        return;
      }

      const request = (async () => {
        try {
          setLoading(true);

          const response =
            await contentsApi.getAll();

          if (response.data.success) {
            setPages(
              response.data.data || [],
            );

            hasInitialFetchRef.current =
              true;
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
            error?.response?.data
              ?.message ||
              "Unable to fetch pages.",
          );
        } finally {
          setLoading(false);
        }
      })();

      fetchInFlightRef.current =
        request;

      try {
        await request;
      } finally {
        if (
          fetchInFlightRef.current ===
          request
        ) {
          fetchInFlightRef.current = null;
        }
      }
    },
    [canViewContents],
  );

  useEffect(() => {
    if (
      permissionsLoading ||
      !canViewContents ||
      hasInitialFetchRef.current
    ) {
      return;
    }

    void fetchContents();
  }, [
    permissionsLoading,
    canViewContents,
    fetchContents,
  ]);

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
                group.latest.updated_at,
              ).getTime())
        ) {
          group.latest = page;
          group.title = page.title;
        }
      }
    });

    return Array.from(map.values()).sort(
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
        const page = group.latest;

        return (
          !query ||
          [
            page.title,
            page.slug,
            page.version,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query)
        );
      },
    );
  }, [groupedPages, search]);

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
    filteredGroups.length === 0
      ? 0
      : startIndex + 1;

  const endEntry = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredGroups.length,
  );

  useEffect(() => {
    if (
      currentPage > totalPages
    ) {
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
  }, [currentPage, totalPages]);

  // ===================================================
  // VIEW
  // ===================================================

  const handleView = useCallback(
    (group: PageGroup) => {
      if (!canViewContents) {
        toast.error(
          "You do not have permission to view pages.",
        );
        return;
      }

      setSelectedGroup(group);
      setViewOpen(true);
    },
    [canViewContents],
  );

  // ===================================================
  // ADD
  // ===================================================

  const openAdd = useCallback(() => {
    if (!canCreateContents) {
      toast.error(
        "You do not have permission to create pages.",
      );
      return;
    }

    setSelectedPage(null);
    setModalMode("add");
    setAddEditOpen(true);
  }, [canCreateContents]);

  // ===================================================
  // EDIT
  // ===================================================

  const openEdit = useCallback(
    (page: ContentPage) => {
      if (!canUpdateContents) {
        toast.error(
          "You do not have permission to update pages.",
        );
        return;
      }

      setSelectedPage(page);
      setModalMode("edit");
      setAddEditOpen(true);
    },
    [canUpdateContents],
  );

  // ===================================================
  // SAVE
  // ===================================================

  const handleSave = useCallback(
    async (payload: ContentPayload) => {
      const isEdit =
        modalMode === "edit";

      if (isEdit && !canUpdateContents) {
        toast.error(
          "You do not have permission to update pages.",
        );
        return;
      }

      if (!isEdit && !canCreateContents) {
        toast.error(
          "You do not have permission to create pages.",
        );
        return;
      }

      if (saveLoading) return;

      try {
        setSaveLoading(true);

        if (
          isEdit &&
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

            await fetchContents(true);
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

            await fetchContents(true);
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
    },
    [
      modalMode,
      canUpdateContents,
      canCreateContents,
      saveLoading,
      selectedPage,
      fetchContents,
    ],
  );

  // ===================================================
  // DELETE OPEN
  // ===================================================

  const openDelete = useCallback(
    (page: ContentPage) => {
      if (!canDeleteContents) {
        toast.error(
          "You do not have permission to delete pages.",
        );
        return;
      }

      setSelectedPage(page);
      setDeleteOpen(true);
    },
    [canDeleteContents],
  );

  // ===================================================
  // DELETE
  // ===================================================

  const handleDelete = useCallback(
    async () => {
      if (!canDeleteContents) {
        toast.error(
          "You do not have permission to delete pages.",
        );
        return;
      }

      if (!selectedPage) return;

      if (deleteLoading) return;

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

          await fetchContents(true);
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
    },
    [
      canDeleteContents,
      selectedPage,
      deleteLoading,
      fetchContents,
    ],
  );

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = useCallback(() => {
    if (!canViewContents) {
      toast.error(
        "You do not have permission to view pages.",
      );
      return;
    }

    void fetchContents(true);
  }, [canViewContents, fetchContents]);

  // ===================================================
  // PERMISSION LOADING
  // ===================================================

  if (permissionsLoading) {
    return <PermissionLoadingState />;
  }

  if (!canViewContents) {
    return <AccessDeniedState />;
  }

  // ===================================================
  // INITIAL LOADING
  // ===================================================

  if (
    loading &&
    pages.length === 0
  ) {
    return (
      <div className="font-poppins min-h-screen bg-[#F5F8FF] p-4 sm:p-5 lg:p-6">
        <div className="flex min-h-[450px] items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#1E3A8A] shadow-sm">
              <FiRefreshCw
                size={23}
                className="animate-spin"
              />
            </div>

            <p className="mt-4 text-sm font-bold text-[#0F1B3D]">
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
      {/* =================================================
          QUILL STYLES
      ================================================= */}

      <style>{`
        .sk-editor-wrapper .ql-toolbar.ql-snow {
          border: 1px solid #D8E2F0;
          border-bottom: none;
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
          background: #F5F8FF;
          padding: 8px 10px;
        }

        .sk-editor-wrapper .ql-container.ql-snow {
          border: 1px solid #D8E2F0;
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
          background: #FFFFFF;
          font-family: inherit;
          font-size: 14px;
        }

        .sk-editor-wrapper .ql-editor {
          min-height: 180px;
          max-height: 360px;
          overflow-y: auto;
          line-height: 1.6;
          color: #0F1B3D;
        }

        .sk-editor-wrapper .ql-editor.ql-blank::before {
          color: #8C97B2;
          font-style: normal;
          font-size: 13px;
        }

        .sk-editor-wrapper .ql-snow .ql-stroke {
          stroke: #1E3A8A;
        }

        .sk-editor-wrapper .ql-snow .ql-fill {
          fill: #1E3A8A;
        }

        .sk-editor-wrapper .ql-snow .ql-picker {
          color: #1E3A8A;
        }

        .sk-editor-wrapper .ql-snow .ql-picker-options {
          background: #FFFFFF;
          border: 1px solid #D8E2F0;
          border-radius: 8px;
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.12);
        }

        .sk-editor-wrapper .ql-snow.ql-toolbar button:hover,
        .sk-editor-wrapper .ql-snow.ql-toolbar button.ql-active {
          background: #EAF1FF;
          border-radius: 6px;
        }

        .sk-editor-wrapper .ql-snow.ql-toolbar button:hover .ql-stroke,
        .sk-editor-wrapper .ql-snow.ql-toolbar button.ql-active .ql-stroke {
          stroke: #1E3A8A;
        }

        .sk-editor-wrapper .ql-snow .ql-tooltip {
          border-radius: 8px;
          border: 1px solid #D8E2F0;
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.12);
        }

        .sk-editor-wrapper .ql-editor h1,
        .sk-editor-wrapper .ql-editor h2,
        .sk-editor-wrapper .ql-editor h3 {
          color: #0F1B3D;
        }

        .sk-editor-wrapper .ql-editor ul,
        .sk-editor-wrapper .ql-editor ol {
          padding-left: 22px;
        }

        .sk-editor-wrapper .ql-editor blockquote {
          border-left: 3px solid #2563EB;
          padding-left: 12px;
          color: #4A5778;
        }

        .sk-editor-wrapper .ql-editor a {
          color: #2563EB;
          text-decoration: underline;
        }

        .sk-answer-preview ul,
        .sk-answer-preview ol {
          padding-left: 22px;
          margin: 8px 0;
        }

        .sk-answer-preview ul {
          list-style: disc;
        }

        .sk-answer-preview ol {
          list-style: decimal;
        }

        .sk-answer-preview li {
          margin: 3px 0;
        }

        .sk-answer-preview a {
          color: #2563EB;
          text-decoration: underline;
        }

        .sk-answer-preview blockquote {
          border-left: 3px solid #2563EB;
          margin: 10px 0;
          padding-left: 12px;
          color: #4A5778;
        }

        .sk-answer-preview pre,
        .sk-answer-preview code {
          background: #F5F8FF;
          border-radius: 6px;
          padding: 2px 6px;
          font-size: 12px;
        }

        .sk-answer-preview h1,
        .sk-answer-preview h2,
        .sk-answer-preview h3 {
          color: #0F1B3D;
          font-weight: 700;
          margin: 10px 0 5px;
        }

        .sk-answer-preview p {
          margin: 5px 0;
        }
      `}</style>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="font-poppins min-h-screen bg-[#F5F8FF] p-4 sm:p-5 lg:p-6"
      >
        {/* HEADER */}

        <motion.div
          variants={itemVariants}
          className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
        >
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1E3A8A]" />

              <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#2563EB]">
                Website Content
              </span>
            </div>

            <h1 className="text-[28px] font-bold tracking-tight text-[#0F1B3D] sm:text-[32px]">
              Pages
            </h1>

            <p className="mt-1.5 max-w-2xl text-xs leading-5 text-[#4A5778]">
              Manage website pages, content blocks,
              images, videos and published versions
              from one place.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#1E3A8A]/20 bg-white px-4 text-xs font-bold text-[#1E3A8A] shadow-sm transition hover:bg-[#EAF1FF] disabled:cursor-not-allowed disabled:opacity-50"
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

            {canCreateContents && (
              <button
                type="button"
                onClick={openAdd}
                className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1E3A8A] px-5 text-xs font-bold text-white shadow-[0_8px_18px_-8px_rgba(37,99,235,0.5)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(37,99,235,0.7)]"
              >
                <FiPlus size={15} />
                Add Page
              </button>
            )}
          </div>
        </motion.div>

        {/* MAIN TABLE CARD */}

        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-[22px] border border-[#D8E2F0] bg-white shadow-[0_8px_30px_rgba(37,99,235,0.06)]"
        >
          <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#93C5FD] via-[#1E3A8A] to-[#172554]" />

          {/* TOOLBAR */}

          <div className="border-b border-[#1E3A8A]/10 p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-[440px]">
                <FiSearch
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1E3A8A]"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => {
                    setSearch(
                      event.target.value,
                    );

                    setCurrentPage(1);
                  }}
                  placeholder="Search title, slug or version..."
                  className="h-11 w-full rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] pl-10 pr-4 text-xs text-[#0F1B3D] outline-none transition placeholder:text-[#8C97B2] focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/10"
                />
              </div>
            </div>
          </div>

          {/* DESKTOP TABLE */}

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[950px] border-collapse">
              <thead>
                <tr className="bg-[#172554]">
                  <th className="w-[75px] px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#DBEAFE]">
                    S.No.
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#DBEAFE]">
                    Page
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#DBEAFE]">
                    Slug
                  </th>

                  <th className="w-[140px] px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#DBEAFE]">
                    Latest Version
                  </th>

                  <th className="w-[130px] px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#DBEAFE]">
                    Versions
                  </th>

                  <th className="w-[150px] px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#DBEAFE]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {visibleGroups.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
                          <FiFileText size={24} />
                        </div>

                        <p className="mt-4 text-sm font-bold text-[#0F1B3D]">
                          No pages found
                        </p>

                        <p className="mt-1 text-xs text-[#8C97B2]">
                          Try another search or
                          create a new page.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleGroups.map(
                    (group, index) => {
                      const page =
                        group.latest;

                      return (
                        <motion.tr
                          key={group.slug}
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
                              index * 0.03,
                          }}
                          className="border-b border-[#1E3A8A]/10 bg-white transition hover:bg-[#FAFCFF]"
                        >
                          <td className="px-5 py-4">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF1FF] text-xs font-bold text-[#1E3A8A]">
                              {startIndex +
                                index +
                                1}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1E3A8A] text-[11px] font-bold text-white shadow-sm">
                                {initials(
                                  page.title,
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="max-w-[240px] truncate text-sm font-bold text-[#0F1B3D]">
                                  {page.title}
                                </p>

                                <p className="mt-1 flex items-center gap-1 text-[10px] text-[#8C97B2]">
                                  <FiClock
                                    size={10}
                                  />
                                  Updated{" "}
                                  {formatDate(
                                    page.updated_at,
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-lg bg-[#F5F8FF] px-3 py-2 font-mono text-[10px] font-semibold text-[#4A5778]">
                              /{page.slug}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex items-center rounded-lg border border-[#1E3A8A]/15 bg-[#EAF1FF] px-3 py-1.5 text-[10px] font-bold text-[#1E3A8A]">
                              v{page.version}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F5F8FF] px-3 py-1.5 text-[10px] font-bold text-[#4A5778]">
                              <FiList size={12} />
                              {group.versions.length}
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
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E3A8A]/15 bg-[#F5F8FF] text-[#1E3A8A] transition hover:bg-[#1E3A8A] hover:text-white"
                              >
                                <FiEye
                                  size={15}
                                />
                              </button>

                              {canUpdateContents && (
                                <button
                                  type="button"
                                  title="Edit page"
                                  onClick={() =>
                                    openEdit(
                                      page,
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E3A8A]/15 bg-white text-[#1E3A8A] transition hover:bg-[#1E3A8A] hover:text-white"
                                >
                                  <FiEdit2
                                    size={15}
                                  />
                                </button>
                              )}

                              {canDeleteContents && (
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
                              )}
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
            {visibleGroups.length > 0 ? (
              visibleGroups.map(
                (group, index) => {
                  const page =
                    group.latest;

                  return (
                    <motion.div
                      key={group.slug}
                      variants={itemVariants}
                      className="border-b border-[#1E3A8A]/10 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1E3A8A] text-[11px] font-bold text-white">
                          {initials(
                            page.title,
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-[#0F1B3D]">
                            {page.title}
                          </p>

                          <p className="mt-1 truncate font-mono text-[10px] text-[#8C97B2]">
                            /{page.slug}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-[#1E3A8A]/10 bg-[#F5F8FF] p-3">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-[#8C97B2]">
                            Latest Version
                          </p>

                          <p className="mt-1 text-sm font-bold text-[#1E3A8A]">
                            v{page.version}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#1E3A8A]/10 bg-[#F5F8FF] p-3">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-[#8C97B2]">
                            Versions
                          </p>

                          <p className="mt-1 text-sm font-bold text-[#0F1B3D]">
                            {group.versions.length}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-[10px] text-[#8C97B2]">
                          Updated{" "}
                          {formatDate(
                            page.updated_at,
                          )}
                        </p>

                        <span className="text-[9px] font-bold text-[#8C97B2]">
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
                            handleView(group)
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E3A8A]/15 bg-[#F5F8FF] text-[#1E3A8A]"
                          title="View"
                        >
                          <FiEye
                            size={14}
                          />
                        </button>

                        {canUpdateContents && (
                          <button
                            type="button"
                            onClick={() =>
                              openEdit(page)
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E3A8A]/15 bg-white text-[#1E3A8A]"
                            title="Edit"
                          >
                            <FiEdit2
                              size={14}
                            />
                          </button>
                        )}

                        {canDeleteContents && (
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
                        )}
                      </div>
                    </motion.div>
                  );
                },
              )
            ) : (
              <div className="flex flex-col items-center px-5 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
                  <FiFileText size={24} />
                </div>

                <p className="mt-4 text-sm font-bold text-[#0F1B3D]">
                  No pages found
                </p>

                <p className="mt-1 text-xs text-[#8C97B2]">
                  Try another search.
                </p>
              </div>
            )}
          </div>

          {/* PAGINATION */}

          {filteredGroups.length > 0 && (
            <div className="border-t border-[#1E3A8A]/10 bg-[#FAFCFF] px-4 py-4 sm:px-5">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-xs text-[#8C97B2]">
                  Showing{" "}
                  <span className="font-bold text-[#4A5778]">
                    {startEntry}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-[#4A5778]">
                    {endEntry}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-[#4A5778]">
                    {filteredGroups.length}
                  </span>{" "}
                  pages
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          page - 1,
                      )
                    }
                    disabled={
                      currentPage === 1
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1E3A8A]/15 bg-white text-[#1E3A8A] transition hover:bg-[#EAF1FF] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronLeft size={17} />
                  </button>

                  {paginationPages.map(
                    (page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() =>
                          setCurrentPage(
                            page,
                          )
                        }
                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold transition ${
                          currentPage ===
                          page
                            ? "bg-gradient-to-br from-[#2563EB] to-[#1E3A8A] text-white shadow-[0_6px_14px_-6px_rgba(37,99,235,0.5)]"
                            : "text-[#4A5778] hover:bg-[#F5F8FF] hover:text-[#1E3A8A]"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          page + 1,
                      )
                    }
                    disabled={
                      currentPage ===
                      totalPages
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1E3A8A]/15 bg-white text-[#1E3A8A] transition hover:bg-[#EAF1FF] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronRight size={17} />
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
        open={viewOpen}
        page={selectedGroup}
        onClose={() => {
          setViewOpen(false);
          setSelectedGroup(null);
        }}
      />

      {/* ADD / EDIT */}

      {(canCreateContents ||
        canUpdateContents) && (
        <PageFormModal
          open={addEditOpen}
          loading={saveLoading}
          mode={modalMode}
          page={selectedPage}
          canDeleteMedia={
            canDeleteContents
          }
          onClose={() => {
            if (!saveLoading) {
              setAddEditOpen(false);
              setSelectedPage(null);
            }
          }}
          onSubmit={handleSave}
        />
      )}

      {/* DELETE */}

      {canDeleteContents && (
        <DeletePageModal
          open={deleteOpen}
          loading={deleteLoading}
          page={selectedPage}
          onClose={() => {
            if (!deleteLoading) {
              setDeleteOpen(false);
              setSelectedPage(null);
            }
          }}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
};

export default ContentsManagement;