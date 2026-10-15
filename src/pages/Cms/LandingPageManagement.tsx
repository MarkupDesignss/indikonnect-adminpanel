import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  FiAlertCircle,
} from "react-icons/fi";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import GlobalModal from "@/components/common/GlobalModal";
import landingApi, { ContentBlockPayload, ContentPage, ContentPayload } from "../../api/endpoints/landing";
import { usePermissions } from "../../pages/permissions/usePermissions";


const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 110, damping: 16 } },
};

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
  sort_order: number;
  imageFiles: File[];
  existingImages: ExistingImage[];
}

// =====================================================
// QUILL CONFIG — compact toolbar
// =====================================================
const SK_EDITOR_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};
const SK_EDITOR_FORMATS = [
  "header",
  "bold",
  "italic",
  "underline",
  "list",
  "bullet",
  "link",
];

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};
const versionNumber = (version?: string) => Number(version || "0");
const initials = (title: string) => {
  const value = title?.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
  return value || "PG";
};
const statusClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case "published": return "border-[#2D6FE8]/25 bg-[#EAF3FF] text-[#2D6FE8]";
    case "draft": return "border-[#FACC15]/50 bg-[#FEF9C3] text-[#A16207]";
    case "archived": return "border-[#C23B32]/20 bg-[#FEF2F2] text-[#C23B32]";
    default: return "border-[#DCE6F2] bg-[#F8FBFF] text-[#6B7280]";
  }
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${statusClass(status)}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {status || "Unknown"}
  </span>
);

// =====================================================
// NEW IMAGE PREVIEW (compact)
// =====================================================
const NewImagePreview: React.FC<{ file: File; onRemove: () => void }> = ({ file, onRemove }) => {
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl]);
  return (
    <div className="group relative aspect-video overflow-hidden rounded-lg border border-[#DCE6F2] bg-white">
      <img src={previewUrl} alt={file.name} className="h-full w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-1.5 pt-5">
        <p className="truncate text-[8px] font-semibold text-white">{file.name}</p>
      </div>
      <button type="button" onClick={onRemove} className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white shadow-lg transition hover:bg-[#C23B32]" title="Remove image">
        <FiX size={11} />
      </button>
      <span className="absolute left-1.5 top-1.5 rounded-full bg-[#FACC15] px-1.5 py-0.5 text-[7px] font-bold uppercase text-[#111827]">New</span>
    </div>
  );
};

// =====================================================
// CONTENT BLOCK EDITOR (compact form-type)
// =====================================================
interface BlockEditorProps {
  block: FormBlock;
  index: number;
  onChange: (index: number, key: keyof FormBlock, value: any) => void;
  onRemove: (index: number) => void;
  onRemoveNewImage: (blockIndex: number, imageIndex: number) => void;
  onRemoveExistingImage: (blockIndex: number, imageIndex: number) => void;
  canRemove: boolean;
}
const BlockEditor: React.FC<BlockEditorProps> = ({ block, index, onChange, onRemove, onRemoveNewImage, onRemoveExistingImage, canRemove }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const totalImages = block.existingImages.length + block.imageFiles.length;

  return (
    <div className="rounded-xl border border-[#DCE6F2] bg-white p-3.5">
      {/* HEADER */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2D6FE8]">
            <FiList size={13} />
          </div>
          <h4 className="text-xs font-bold text-[#111827]">Block {index + 1}</h4>
        </div>
        {canRemove && (
          <button type="button" onClick={() => onRemove(index)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#C23B32]/20 bg-[#FEF2F2] text-[#C23B32] transition hover:bg-[#C23B32] hover:text-white" title="Remove block">
            <FiTrash2 size={12} />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* HEADING */}
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">Heading</label>
          <input type="text" value={block.heading} onChange={(event) => onChange(index, "heading", event.target.value)} placeholder="<h1>Your heading</h1>" className="h-9 w-full rounded-lg border border-[#DCE6F2] bg-white px-3 text-xs text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#2D6FE8] focus:ring-1 focus:ring-[#2D6FE8]/20" />
        </div>

        {/* SHORT DESCRIPTION */}
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">Short Description</label>
          <textarea value={block.short_description} onChange={(event) => onChange(index, "short_description", event.target.value)} rows={2} placeholder="<p>Short description...</p>" className="w-full resize-none rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs leading-5 text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#2D6FE8] focus:ring-1 focus:ring-[#2D6FE8]/20" />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">Description</label>
          <div className="sk-editor-wrapper">
            <ReactQuill theme="snow" value={block.description} onChange={(value) => onChange(index, "description", value)} modules={SK_EDITOR_MODULES} formats={SK_EDITOR_FORMATS} placeholder="Write content..." />
          </div>
        </div>

        {/* IMAGES */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">Images</label>
            <span className="text-[10px] text-[#6B7280]">{totalImages} image{totalImages === 1 ? "" : "s"}</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/avif"
            multiple
            className="hidden"
            onChange={(event) => {
              const files = Array.from(event.target.files || []);
              if (files.length) onChange(index, "imageFiles", [...block.imageFiles, ...files]);
              event.target.value = "";
            }}
          />

          <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#2D6FE8]/40 bg-[#F8FBFF] text-xs font-semibold text-[#2D6FE8] transition hover:border-[#2D6FE8] hover:bg-[#EAF3FF]">
            <FiUpload size={14} />
            Upload images
          </button>

          {/* EXISTING */}
          {block.existingImages.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-[10px] font-semibold uppercase text-[#6B7280]">Existing</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {block.existingImages.map((image, imageIndex) => (
                  <div key={image.id ?? `${index}-existing-${imageIndex}`} className="group relative aspect-video overflow-hidden rounded-lg border border-[#DCE6F2] bg-white">
                    <img src={image.url} alt={image.alt_text || `Block ${index + 1} image`} className="h-full w-full object-cover" />
                    {image.is_primary && <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[7px] font-bold text-white">Primary</span>}
                    <button type="button" onClick={() => onRemoveExistingImage(index, imageIndex)} className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-[#C23B32]" title="Remove image">
                      <FiX size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NEW */}
          {block.imageFiles.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-[10px] font-semibold uppercase text-[#6B7280]">New</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {block.imageFiles.map((file, fileIndex) => (
                  <NewImagePreview key={`${file.name}-${file.lastModified}-${fileIndex}`} file={file} onRemove={() => onRemoveNewImage(index, fileIndex)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =====================================================
// VIEW PAGE / VERSION HISTORY MODAL
// =====================================================
const ViewPageModal: React.FC<{ open: boolean; page: PageGroup | null; onClose: () => void }> = ({ open, page, onClose }) => {
  const [activeVersionId, setActiveVersionId] = useState<number | null>(page?.latest.id ?? null);
  useEffect(() => setActiveVersionId(page?.latest.id ?? null), [page]);
  if (!open || !page) return null;
  const activePage = page.versions.find((item) => item.id === activeVersionId) || page.latest;

  return (
    <GlobalModal isOpen={open} onClose={onClose} closeOnOverlayClick>
      <div className="w-full max-w-[1000px] overflow-hidden rounded-[22px] border border-[#DCE6F2] bg-white font-poppins shadow-2xl">
        <div className="h-[3px] w-full bg-gradient-to-r from-[#4F8FF7] via-[#2D6FE8] to-[#FACC15]" />

        <div className="flex items-start justify-between gap-4 border-b border-[#DCE6F2] px-5 py-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-sm font-bold text-white">
              {initials(page.title)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-bold text-[#111827]">{page.title}</h2>
                <StatusBadge status={activePage.status} />
              </div>
              <p className="mt-1 truncate text-xs text-[#6B7280]">/{page.slug} • Version {activePage.version}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F8FD] text-[#2D6FE8] transition hover:bg-[#EAF3FF]">
            <FiX size={18} />
          </button>
        </div>

        <div className="max-h-[78vh] overflow-y-auto">
          <div className="grid grid-cols-1 xl:grid-cols-[240px_1fr]">
            <aside className="border-b border-[#DCE6F2] bg-[#F8FBFF] p-4 xl:border-b-0 xl:border-r">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">Version History</p>
              <p className="mt-1 text-xs text-[#4A5568]">{page.versions.length} version{page.versions.length === 1 ? "" : "s"} available</p>
              <div className="mt-3 space-y-2">
                {[...page.versions].sort((a, b) => versionNumber(b.version) - versionNumber(a.version)).map((version) => {
                  const selected = version.id === activeVersionId;
                  return (
                    <button key={version.id} type="button" onClick={() => setActiveVersionId(version.id)} className={`w-full rounded-xl border p-3 text-left transition ${selected ? "border-[#2D6FE8]/40 bg-white shadow-sm" : "border-[#DCE6F2] bg-transparent hover:bg-white"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#111827]">v{version.version}</span>
                        <StatusBadge status={version.status} />
                      </div>
                      <p className="mt-2 flex items-center gap-1 text-[9px] text-[#6B7280]"><FiClock size={10} />{formatDate(version.created_at)}</p>
                    </button>
                  );
                })}
              </div>
            </aside>

            <div className="p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">Page Content</p>
                  <p className="mt-1 text-xs text-[#4A5568]">Updated {formatDate(activePage.updated_at)}</p>
                </div>
                <span className="rounded-lg bg-[#EAF3FF] px-3 py-2 text-[10px] font-bold text-[#2D6FE8]">
                  {activePage.blocks?.length || 0} block{activePage.blocks?.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="space-y-5">
                {!activePage.blocks?.length ? (
                  <div className="rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] p-8 text-center">
                    <FiFileText size={28} className="mx-auto text-[#2D6FE8]" />
                    <p className="mt-3 text-sm font-bold text-[#111827]">No content blocks</p>
                  </div>
                ) : (
                  activePage.blocks.map((block: any, index: number) => (
                    <div key={block.id ?? index} className="rounded-[18px] border border-[#DCE6F2] bg-[#F8FBFF] p-4 sm:p-5">
                      <div className="mb-4">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Block {index + 1}</p>
                        <p className="mt-1 text-[10px] text-[#2D6FE8]">Sort order: {block.sort_order}</p>
                      </div>
                      {block.heading && (
                        <div className="mb-4">
                          <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Heading</p>
                          <div className="prose prose-sm max-w-none text-[#111827]" dangerouslySetInnerHTML={{ __html: block.heading }} />
                        </div>
                      )}
                      {block.short_description && (
                        <div className="mb-4">
                          <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Short Description</p>
                          <div className="prose prose-sm max-w-none text-[#4A5568]" dangerouslySetInnerHTML={{ __html: block.short_description }} />
                        </div>
                      )}
                      {block.description && (
                        <div className="mb-4">
                          <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Description</p>
                          <div className="sk-answer-preview prose prose-sm max-w-none text-[#4A5568]" dangerouslySetInnerHTML={{ __html: block.description }} />
                        </div>
                      )}
                      {!!block.images?.length && (
                        <div>
                          <p className="mb-2 text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Images</p>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {block.images.map((image: ExistingImage, imageIndex: number) => (
                              <div key={image.id ?? imageIndex} className="group relative aspect-video overflow-hidden rounded-xl border border-[#DCE6F2] bg-white">
                                <img src={image.url} alt={image.alt_text || `Block ${index + 1} image`} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                                {image.is_primary && <span className="absolute left-2 top-2 rounded-full bg-[#FACC15] px-2 py-1 text-[8px] font-bold text-[#111827]">Primary</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-[#DCE6F2] bg-[#F8FBFF] px-5 py-3.5 sm:px-6">
          <button type="button" onClick={onClose} className="rounded-xl border border-[#DCE6F2] bg-white px-5 py-2.5 text-sm font-bold text-[#4A5568] transition hover:bg-[#EAF3FF] hover:text-[#2D6FE8]">Close</button>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// ADD / EDIT PAGE FORM MODAL (compact form-type)
// =====================================================
interface PageFormModalProps {
  open: boolean;
  loading: boolean;
  mode: "add" | "edit";
  page: ContentPage | null;
  onClose: () => void;
  onSubmit: (payload: ContentPayload) => void;
}

const PageFormModal: React.FC<PageFormModalProps> = ({ open, loading, mode, page, onClose, onSubmit }) => {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("published");
  const [blocks, setBlocks] = useState<FormBlock[]>([]);

  useEffect(() => {
    if (!open) return;
    if (page) {
      setTitle(page.title || "");
      setStatus(page.status || "published");
      const mapped = [...(page.blocks || [])]
        .sort((a: any, b: any) => Number(a.sort_order) - Number(b.sort_order))
        .map((block: any): FormBlock => ({
          heading: block.heading || "",
          short_description: block.short_description || "",
          description: block.description || "",
          sort_order: Number(block.sort_order) || 0,
          existingImages: (block.images || []).map((image: any) => ({
            id: image.id, url: image.url, alt_text: image.alt_text, is_primary: image.is_primary,
          })),
          imageFiles: [],
        }));
      setBlocks(mapped.length ? mapped : [{ heading: "", short_description: "", description: "", sort_order: 0, imageFiles: [], existingImages: [] }]);
    } else {
      setTitle("");
      setStatus("published");
      setBlocks([{ heading: "", short_description: "", description: "", sort_order: 0, imageFiles: [], existingImages: [] }]);
    }
  }, [open, page]);

  const updateBlock = (index: number, key: keyof FormBlock, value: any) =>
    setBlocks((previous) => previous.map((block, blockIndex) => (blockIndex === index ? { ...block, [key]: value } : block)));

  const addBlock = () =>
    setBlocks((previous) => [...previous, { heading: "", short_description: "", description: "", sort_order: previous.length, imageFiles: [], existingImages: [] }]);

  const removeBlock = (index: number) =>
    setBlocks((previous) => previous.filter((_, i) => i !== index).map((block, i) => ({ ...block, sort_order: i })));

  const removeNewImage = (blockIndex: number, imageIndex: number) =>
    setBlocks((previous) => previous.map((block, i) => (i === blockIndex ? { ...block, imageFiles: block.imageFiles.filter((_, j) => j !== imageIndex) } : block)));

  const removeExistingImage = async (blockIndex: number, imageIndex: number) => {
    const image = blocks[blockIndex]?.existingImages?.[imageIndex];
    if (!image) { toast.error("Image not found."); return; }
    if (!image.id) {
      setBlocks((previous) => previous.map((block, i) => (i === blockIndex ? { ...block, existingImages: block.existingImages.filter((_, j) => j !== imageIndex) } : block)));
      return;
    }
    try {
      const response = await landingApi.deleteMedia(image.id);
      if (response.data?.success) {
        setBlocks((previous) => previous.map((block, i) => (i === blockIndex ? { ...block, existingImages: block.existingImages.filter((_, j) => j !== imageIndex) } : block)));
        toast.success(response.data?.message || "Image deleted successfully.");
      } else toast.error(response.data?.message || "Unable to delete image.");
    } catch (error: any) {
      console.error("Delete image error:", error);
      toast.error(error?.response?.data?.message || "Unable to delete image.");
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) { toast.error("Page title is required."); return; }
    if (!blocks.length) { toast.error("At least one content block is required."); return; }
    const payload: ContentPayload = {
      title: title.trim(),
      status,
      blocks: blocks.map((block): ContentBlockPayload => ({
        heading: block.heading,
        short_description: block.short_description,
        description: block.description,
        sort_order: block.sort_order,
        imageFiles: block.imageFiles,
        existingImages: block.existingImages,
      })),
    };
    onSubmit(payload);
  };

  if (!open) return null;

  return (
    <GlobalModal isOpen={open} onClose={() => { if (!loading) onClose(); }} closeOnOverlayClick={!loading}>
      <div className="flex max-h-[88vh] w-full max-w-[720px] flex-col overflow-hidden rounded-2xl border border-[#DCE6F2] bg-white font-poppins shadow-2xl">
        {/* TOP BAR */}
        <div className="h-[3px] w-full shrink-0 bg-gradient-to-r from-[#4F8FF7] via-[#2D6FE8] to-[#FACC15]" />

        {/* HEADER */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#DCE6F2] bg-white px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2D6FE8]">
              {mode === "add" ? <FiPlus size={15} /> : <FiEdit2 size={14} />}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-[#111827]">
                {mode === "add" ? "Add Page" : "Edit Page"}
              </h2>
              {mode === "edit" && page && (
                <p className="truncate text-[10px] text-[#6B7280]">{page.title} • v{page.version}</p>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={loading} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F4F8FD] text-[#6B7280] transition hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:opacity-50" aria-label="Close modal">
            <FiX size={16} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          {/* SCROLLABLE BODY */}
          <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8FBFF] px-5 py-3.5">
            {/* BASIC INFO */}
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_160px]">
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
                  Page Title <span className="text-[#C23B32]">*</span>
                </label>
                <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Home" className="h-9 w-full rounded-lg border border-[#DCE6F2] bg-white px-3 text-xs text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#2D6FE8] focus:ring-1 focus:ring-[#2D6FE8]/20" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">Status</label>
                <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 w-full rounded-lg border border-[#DCE6F2] bg-white px-3 text-xs text-[#111827] outline-none transition focus:border-[#2D6FE8] focus:ring-1 focus:ring-[#2D6FE8]/20">
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* BLOCKS HEADER */}
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
                Content Blocks ({blocks.length})
              </p>
              <button type="button" onClick={addBlock} className="flex h-7 items-center gap-1 rounded-lg border border-[#2D6FE8]/20 bg-[#EAF3FF] px-2.5 text-[10px] font-bold text-[#2D6FE8] transition hover:bg-[#2D6FE8] hover:text-white">
                <FiPlus size={12} />
                Add Block
              </button>
            </div>

            {/* BLOCKS */}
            <div className="space-y-3">
              {blocks.map((block, index) => (
                <BlockEditor
                  key={`${index}-${block.sort_order}`}
                  block={block}
                  index={index}
                  onChange={updateBlock}
                  onRemove={removeBlock}
                  onRemoveNewImage={removeNewImage}
                  onRemoveExistingImage={removeExistingImage}
                  canRemove={blocks.length > 1}
                />
              ))}
            </div>
          </div>

          {/* STICKY FOOTER */}
          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[#DCE6F2] bg-white px-5 py-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={loading} className="h-9 rounded-lg border border-[#DCE6F2] bg-white px-4 text-xs font-bold text-[#6B7280] transition hover:bg-[#F4F8FD] disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex h-9 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] px-4 text-xs font-bold text-white shadow-[0_6px_14px_-6px_rgba(45,111,232,0.6)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? <FiRefreshCw size={13} className="animate-spin" /> : <FiSave size={13} />}
              {loading ? "Saving..." : mode === "add" ? "Create Page" : "Update Page"}
            </button>
          </div>
        </form>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// DELETE PAGE MODAL
// =====================================================
const DeletePageModal: React.FC<{ open: boolean; loading: boolean; page: ContentPage | null; onClose: () => void; onConfirm: () => void }> = ({ open, loading, page, onClose, onConfirm }) => {
  if (!open || !page) return null;
  return (
    <GlobalModal isOpen={open} onClose={onClose} closeOnOverlayClick={!loading}>
      <div className="w-full max-w-[450px] overflow-hidden rounded-[22px] border border-[#DCE6F2] bg-white font-poppins shadow-2xl">
        <div className="h-[3px] w-full bg-gradient-to-r from-[#FACC15] to-[#C23B32]" />
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#C23B32]">
              <FiTrash2 size={21} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#111827]">Delete Page</h2>
              <p className="mt-1 text-sm leading-6 text-[#4A5568]">Are you sure you want to delete this page version?</p>
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3FF] text-xs font-bold text-[#2D6FE8]">{initials(page.title)}</div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#111827]">{page.title}</p>
                <p className="mt-1 truncate text-[10px] text-[#6B7280]">/{page.slug} • Version {page.version}</p>
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={loading} className="rounded-xl border border-[#DCE6F2] bg-white px-5 py-2.5 text-sm font-bold text-[#4A5568] transition hover:bg-[#F4F8FD] disabled:opacity-50">Cancel</button>
            <button type="button" onClick={onConfirm} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C23B32] to-[#A92F28] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? <FiRefreshCw size={15} className="animate-spin" /> : <FiTrash2 size={15} />}
              {loading ? "Deleting..." : "Delete Page"}
            </button>
          </div>
        </div>
      </div>
    </GlobalModal>
  );
};

const PermissionLoading: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#F4F8FD] p-4 font-poppins">
    <div className="flex flex-col items-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#2D6FE8] shadow-sm">
        <FiRefreshCw size={23} className="animate-spin" />
      </div>
      <p className="mt-4 text-sm font-bold text-[#111827]">Checking permissions...</p>
      <p className="mt-1 text-[10px] text-[#6B7280]">Verifying landing page management access.</p>
    </div>
  </div>
);

const AccessDenied: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#F4F8FD] p-4 font-poppins">
    <div className="max-w-md rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-lg">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#C23B32]">
        <FiAlertCircle size={26} />
      </div>
      <h2 className="text-lg font-bold text-[#111827]">Access Denied</h2>
      <p className="mt-2 text-sm text-[#6B7280]">You don't have permission to access the Landing Page Management module.</p>
      <div className="mt-5 rounded-xl border border-[#C23B32]/15 bg-[#FEF2F2] px-4 py-3 text-[10px] font-semibold text-[#C23B32]">Contact your administrator to request access.</div>
    </div>
  </div>
);

// =====================================================
// MAIN LANDING PAGE MANAGEMENT
// =====================================================
const LandingPageManagement: React.FC = () => {
  const { hasPermission, hasModuleAccess, isSuperAdmin, loading: permissionsLoading } = usePermissions();
  const canViewContent = useMemo(() => isSuperAdmin || hasModuleAccess("content") || hasPermission("content.view"), [isSuperAdmin, hasModuleAccess, hasPermission]);
  const canCreateContent = useMemo(() => isSuperAdmin || hasPermission("content.create"), [isSuperAdmin, hasPermission]);
  const canUpdateContent = useMemo(() => isSuperAdmin || hasPermission("content.edit") || hasPermission("content.update"), [isSuperAdmin, hasPermission]);
  const canDeleteContent = useMemo(() => isSuperAdmin || hasPermission("content.delete"), [isSuperAdmin, hasPermission]);

  const [pages, setPages] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "archived">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewOpen, setViewOpen] = useState(false);
  const [addEditOpen, setAddEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedGroup, setSelectedGroup] = useState<PageGroup | null>(null);
  const [selectedPage, setSelectedPage] = useState<ContentPage | null>(null);
  const ITEMS_PER_PAGE = 10;

  const fetchContents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await landingApi.getAll();
      if (response.data.success) setPages(response.data.data || []);
      else toast.error(response.data.message || "Unable to fetch pages.");
    } catch (error: any) {
      console.error("Fetch contents error:", error);
      toast.error(error?.response?.data?.message || "Unable to fetch pages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!permissionsLoading && canViewContent) fetchContents();
  }, [permissionsLoading, canViewContent, fetchContents]);

  const groupedPages = useMemo(() => {
    const map = new Map<string, PageGroup>();
    pages.forEach((page) => {
      const key = page.slug || page.title.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, { slug: page.slug, title: page.title, latest: page, versions: [page] });
        return;
      }
      const group = map.get(key)!;
      group.versions.push(page);
      const oldVersion = versionNumber(group.latest.version);
      const newVersion = versionNumber(page.version);
      const oldUpdated = new Date(group.latest.updated_at).getTime();
      const newUpdated = new Date(page.updated_at).getTime();
      if (newVersion > oldVersion || (newVersion === oldVersion && newUpdated > oldUpdated)) {
        group.latest = page;
        group.title = page.title;
      }
    });
    return Array.from(map.values()).sort((a, b) => new Date(b.latest.updated_at).getTime() - new Date(a.latest.updated_at).getTime());
  }, [pages]);

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    return groupedPages.filter((group) => {
      const page = group.latest;
      const matchesSearch = !query || [page.title, page.slug, page.status, page.version].join(" ").toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || page.status?.toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [groupedPages, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const visibleGroups = filteredGroups.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const startEntry = filteredGroups.length ? startIndex + 1 : 0;
  const endEntry = Math.min(startIndex + ITEMS_PER_PAGE, filteredGroups.length);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginationPages = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, 5];
    if (currentPage >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
  }, [currentPage, totalPages]);

  const handleView = (group: PageGroup) => { setSelectedGroup(group); setViewOpen(true); };

  const openAdd = () => {
    if (!canCreateContent) { toast.error("You do not have permission to create pages."); return; }
    setSelectedPage(null);
    setModalMode("add");
    setAddEditOpen(true);
  };

  const openEdit = (page: ContentPage) => {
    if (!canUpdateContent) { toast.error("You do not have permission to edit pages."); return; }
    setSelectedPage(page);
    setModalMode("edit");
    setAddEditOpen(true);
  };

  const handleSave = async (payload: ContentPayload) => {
    if (modalMode === "edit" ? !canUpdateContent : !canCreateContent) {
      toast.error("You do not have permission to save this page.");
      return;
    }
    try {
      setSaveLoading(true);
      const response = modalMode === "edit" && selectedPage
        ? await landingApi.update(selectedPage.id, payload)
        : await landingApi.create(payload);
      if (response.data.success) {
        toast.success(response.data.message || (modalMode === "edit" ? "Page updated successfully." : "Page created successfully."));
        setAddEditOpen(false);
        setSelectedPage(null);
        await fetchContents();
      } else toast.error(response.data.message || (modalMode === "edit" ? "Unable to update page." : "Unable to create page."));
    } catch (error: any) {
      console.error("Save page error:", error);
      toast.error(error?.response?.data?.message || "Unable to save page.");
    } finally {
      setSaveLoading(false);
    }
  };

  const openDelete = (page: ContentPage) => {
    if (!canDeleteContent) { toast.error("You do not have permission to delete pages."); return; }
    setSelectedPage(page);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedPage) return;
    if (!canDeleteContent) { toast.error("You do not have permission to delete pages."); return; }
    try {
      setDeleteLoading(true);
      const response = await landingApi.delete(selectedPage.id);
      if (response.data.success) {
        toast.success(response.data.message || "Page version deleted successfully.");
        setDeleteOpen(false);
        setSelectedPage(null);
        await fetchContents();
      } else toast.error(response.data.message || "Unable to delete page.");
    } catch (error: any) {
      console.error("Delete page error:", error);
      toast.error(error?.response?.data?.message || "Unable to delete page.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (permissionsLoading) return <PermissionLoading />;
  if (!canViewContent) return <AccessDenied />;
  if (loading && pages.length === 0)
    return (
      <div className="min-h-screen bg-[#F4F8FD] p-4 font-poppins sm:p-5 lg:p-6">
        <div className="flex min-h-[450px] items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#2D6FE8] shadow-sm">
              <FiRefreshCw size={23} className="animate-spin" />
            </div>
            <p className="mt-4 text-sm font-bold text-[#111827]">Loading pages...</p>
            <p className="mt-1 text-[10px] text-[#6B7280]">Fetching landing page content.</p>
          </div>
        </div>
      </div>
    );

  return (
    <>
      <style>{`
        .sk-editor-wrapper .ql-toolbar.ql-snow {
          border: 1px solid #DCE6F2;
          border-bottom: none;
          border-top-left-radius: 10px;
          border-top-right-radius: 10px;
          background: #F4F8FD;
          padding: 4px 8px;
        }
        .sk-editor-wrapper .ql-container.ql-snow {
          border: 1px solid #DCE6F2;
          border-bottom-left-radius: 10px;
          border-bottom-right-radius: 10px;
          background: #FFFFFF;
          font-family: inherit;
          font-size: 13px;
        }
        .sk-editor-wrapper .ql-editor {
          min-height: 110px;
          max-height: 220px;
          overflow-y: auto;
          line-height: 1.5;
          font-size: 13px;
          color: #111827;
        }
        .sk-editor-wrapper .ql-editor.ql-blank::before {
          color: #9CA3AF;
          font-style: normal;
          font-size: 12px;
        }
        .sk-editor-wrapper .ql-snow .ql-stroke { stroke: #2D6FE8; }
        .sk-editor-wrapper .ql-snow .ql-fill { fill: #2D6FE8; }
        .sk-editor-wrapper .ql-snow .ql-picker { color: #2D6FE8; }
        .sk-editor-wrapper .ql-snow .ql-picker-options {
          background: #FFFFFF;
          border: 1px solid #DCE6F2;
          border-radius: 8px;
          box-shadow: 0 8px 20px rgba(45,111,232,.12);
        }
        .sk-editor-wrapper .ql-snow.ql-toolbar button:hover,
        .sk-editor-wrapper .ql-snow.ql-toolbar button.ql-active {
          background: #EAF3FF;
          border-radius: 6px;
        }
        .sk-editor-wrapper .ql-snow.ql-toolbar button:hover .ql-stroke,
        .sk-editor-wrapper .ql-snow.ql-toolbar button.ql-active .ql-stroke {
          stroke: #2D6FE8;
        }
        .sk-editor-wrapper .ql-snow .ql-tooltip {
          border-radius: 8px;
          border: 1px solid #DCE6F2;
          box-shadow: 0 8px 20px rgba(45,111,232,.12);
        }
        .sk-editor-wrapper .ql-editor h1,
        .sk-editor-wrapper .ql-editor h2,
        .sk-editor-wrapper .ql-editor h3,
        .sk-answer-preview h1,
        .sk-answer-preview h2,
        .sk-answer-preview h3 { color: #111827; }
        .sk-editor-wrapper .ql-editor ul,
        .sk-editor-wrapper .ql-editor ol,
        .sk-answer-preview ul,
        .sk-answer-preview ol { padding-left: 22px; }
        .sk-answer-preview ul { list-style: disc; }
        .sk-answer-preview ol { list-style: decimal; }
        .sk-answer-preview li { margin: 3px 0; }
        .sk-answer-preview a { color: #2D6FE8; text-decoration: underline; }
        .sk-editor-wrapper .ql-editor blockquote,
        .sk-answer-preview blockquote {
          border-left: 3px solid #FACC15;
          margin: 10px 0;
          padding-left: 12px;
          color: #4A5568;
        }
        .sk-answer-preview pre,
        .sk-answer-preview code {
          background: #F4F8FD;
          border-radius: 6px;
          padding: 2px 6px;
          font-size: 12px;
        }
        .sk-answer-preview h1,
        .sk-answer-preview h2,
        .sk-answer-preview h3 {
          font-weight: 700;
          margin: 10px 0 5px;
        }
        .sk-answer-preview p { margin: 5px 0; }
      `}</style>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="min-h-screen bg-white p-4 font-poppins sm:p-5 lg:p-6">
        <motion.div variants={itemVariants} className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2D6FE8]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#4F8FF7]" />
              <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#2D6FE8]">Website Content</span>
            </div>
            <h1 className="text-[20px] font-medium tracking-tight text-[#111827] sm:text-[22px]">Landing Pages</h1>
            <p className="mt-0.5 text-sm text-[#111827]">Manage website pages, content blocks, images and published versions from one place.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={fetchContents} disabled={loading} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#DCE6F2] bg-white px-4 text-xs font-bold text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-50">
              <FiRefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            {canCreateContent && (
              <button type="button" onClick={openAdd} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] px-5 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg">
                <FiPlus size={15} />
                Add Page
              </button>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="relative overflow-hidden rounded-[22px] border border-[#DCE6F2] bg-white shadow-[0_8px_30px_rgba(45,111,232,.06)]">
          <div className="border-b border-[#DCE6F2] p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-[440px]">
                <FiSearch size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2D6FE8]" />
                <input type="text" value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Search title, slug or version..." className="h-11 w-full rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] pl-10 pr-4 text-xs text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/10" />
              </div>
              <div className="flex flex-wrap gap-2">
                {([{ key: "all", label: "All" }, { key: "published", label: "Published" }, { key: "draft", label: "Draft" }, { key: "archived", label: "Archived" }] as const).map((filter) => (
                  <button key={filter.key} type="button" onClick={() => { setStatusFilter(filter.key); setCurrentPage(1); }} className={`rounded-xl px-4 py-2.5 text-[10px] font-bold transition ${statusFilter === filter.key ? "bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] text-white shadow-[0_6px_14px_-6px_rgba(45,111,232,.5)]" : "border border-[#DCE6F2] bg-[#F8FBFF] text-[#4A5568] hover:border-[#4F8FF7]/40 hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"}`}>
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden overflow-x-auto rounded-2xl lg:block">
            <table className="w-full min-w-[850px] border-collapse">
              <thead>
                <tr className="bg-[#4F8FF7]">
                  <th className="w-[75px] px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-white">S.No.</th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-white">Page</th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-white">Slug</th>
                  <th className="w-[140px] px-5 py-3.5 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-white">Latest Version</th>
                  {(canViewContent || canUpdateContent || canDeleteContent) && (
                    <th className="w-[150px] px-5 py-3.5 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-white">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {visibleGroups.length === 0 ? (
                  <tr>
                    <td colSpan={4 + (canViewContent || canUpdateContent || canDeleteContent ? 1 : 0)} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]"><FiFileText size={24} /></div>
                        <p className="mt-4 text-sm font-bold text-[#111827]">No pages found</p>
                        <p className="mt-1 text-xs text-[#6B7280]">Try another search or create a new page.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleGroups.map((group, index) => {
                    const page = group.latest;
                    return (
                      <motion.tr key={group.slug} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="border-b border-[#DCE6F2] bg-white transition hover:bg-[#F8FBFF]">
                        <td className="px-5 py-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF3FF] text-xs font-bold text-[#2D6FE8]">{startIndex + index + 1}</span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-[11px] font-bold text-white shadow-sm">{initials(page.title)}</div>
                            <div className="min-w-0">
                              <p className="max-w-[240px] truncate text-sm font-bold text-[#111827]">{page.title}</p>
                              <p className="mt-1 flex items-center gap-1 text-[10px] text-[#6B7280]"><FiClock size={10} />Updated {formatDate(page.updated_at)}</p>
                             
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="rounded-lg bg-[#F4F8FD] px-3 py-2 font-mono text-[10px] font-semibold text-[#4A5568]">/{page.slug}</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="inline-flex items-center rounded-lg border border-[#2D6FE8]/20 bg-[#EAF3FF] px-3 py-1.5 text-[10px] font-bold text-[#2D6FE8]">v{page.version}</span>
                          <p className="mt-1 text-[9px] text-[#6B7280]">{group.versions.length} version{group.versions.length === 1 ? "" : "s"}</p>
                        </td>
                        {(canViewContent || canUpdateContent || canDeleteContent) && (
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                              {canViewContent && (
                                <button type="button" title="View page" onClick={() => handleView(group)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#DCE6F2] bg-[#F8FBFF] text-[#2D6FE8] transition hover:bg-[#2D6FE8] hover:text-white"><FiEye size={15} /></button>
                              )}
                              {canUpdateContent && (
                                <button type="button" title="Edit page" onClick={() => openEdit(page)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2D6FE8]/20 bg-[#EAF3FF] text-[#2D6FE8] transition hover:bg-[#2D6FE8] hover:text-white"><FiEdit2 size={15} /></button>
                              )}
                              {canDeleteContent && (
                                <button type="button" title="Delete latest version" onClick={() => openDelete(page)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#C23B32]/20 bg-[#FEF2F2] text-[#C23B32] transition hover:border-transparent hover:bg-[#C23B32] hover:text-white"><FiTrash2 size={15} /></button>
                              )}
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS */}
          <div className="block lg:hidden">
            {visibleGroups.length > 0 ? (
              visibleGroups.map((group, index) => {
                const page = group.latest;
                return (
                  <motion.div key={group.slug} variants={itemVariants} className="border-b border-[#DCE6F2] p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-[11px] font-bold text-white">{initials(page.title)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[#111827]">{page.title}</p>
                            <p className="mt-1 truncate font-mono text-[10px] text-[#6B7280]">/{page.slug}</p>
                          </div>

                        </div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-[#DCE6F2] bg-[#F8FBFF] p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Latest Version</p>
                        <p className="mt-1 text-sm font-bold text-[#2D6FE8]">v{page.version}</p>
                      </div>
                      <div className="rounded-xl border border-[#FACC15]/50 bg-[#FEF9C3] p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-[#854D0E]">Versions</p>
                        <p className="mt-1 text-sm font-bold text-[#854D0E]">{group.versions.length}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <p className="text-[10px] text-[#6B7280]">Updated {formatDate(page.updated_at)}</p>
                      <span className="text-[9px] font-bold text-[#6B7280]">#{startIndex + index + 1}</span>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      {canViewContent && (
                        <button type="button" onClick={() => handleView(group)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#DCE6F2] bg-[#F8FBFF] text-[#2D6FE8]" title="View"><FiEye size={14} /></button>
                      )}
                      {canUpdateContent && (
                        <button type="button" onClick={() => openEdit(page)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2D6FE8]/20 bg-[#EAF3FF] text-[#2D6FE8]" title="Edit"><FiEdit2 size={14} /></button>
                      )}
                      {canDeleteContent && (
                        <button type="button" onClick={() => openDelete(page)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#C23B32]/20 bg-[#FEF2F2] text-[#C23B32]" title="Delete"><FiTrash2 size={14} /></button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="flex flex-col items-center px-5 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]"><FiFileText size={24} /></div>
                <p className="mt-4 text-sm font-bold text-[#111827]">No pages found</p>
                <p className="mt-1 text-xs text-[#6B7280]">Try another search or filter.</p>
              </div>
            )}
          </div>

          {/* PAGINATION */}
          {filteredGroups.length > 0 && (
            <div className="border-t border-[#DCE6F2] bg-[#F8FBFF] px-4 py-3.5 sm:px-5">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-xs text-[#6B7280]">
                  Showing <span className="font-bold text-[#111827]">{startEntry}</span> to <span className="font-bold text-[#111827]">{endEntry}</span> of <span className="font-bold text-[#111827]">{filteredGroups.length}</span> pages
                </p>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-30"><FiChevronLeft size={17} /></button>
                  {paginationPages.map((page) => (
                    <button key={page} type="button" onClick={() => setCurrentPage(page)} className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold transition ${currentPage === page ? "bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-white shadow-[0_6px_14px_-6px_rgba(45,111,232,.5)]" : "text-[#4A5568] hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"}`}>{page}</button>
                  ))}
                  <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-30"><FiChevronRight size={17} /></button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
        <div className="h-5" />
      </motion.div>

      {canViewContent && (
        <ViewPageModal open={viewOpen} page={selectedGroup} onClose={() => { setViewOpen(false); setSelectedGroup(null); }} />
      )}
      {(canCreateContent || canUpdateContent) && (
        <PageFormModal
          open={addEditOpen}
          loading={saveLoading}
          mode={modalMode}
          page={selectedPage}
          onClose={() => { if (!saveLoading) { setAddEditOpen(false); setSelectedPage(null); } }}
          onSubmit={handleSave}
        />
      )}
      {canDeleteContent && (
        <DeletePageModal
          open={deleteOpen}
          loading={deleteLoading}
          page={selectedPage}
          onClose={() => { if (!deleteLoading) { setDeleteOpen(false); setSelectedPage(null); } }}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
};

export default LandingPageManagement;